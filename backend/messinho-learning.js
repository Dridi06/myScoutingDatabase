/**
 * MESSINHO supervised calibration.
 * Trains only from admin-verified outcomes stored in the existing ASI calibration ledger.
 */
export const MESSINHO_LEARNING_VERSION = '1.1.0';
const DIMENSIONS=['technical','tactical','athletic','mental','goalkeeping'];
const MIN_EXAMPLES=30;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const finiteNumber=value=>value===null||value===undefined||(typeof value==='string'&&!value.trim())?null:(Number.isFinite(Number(value))?Number(value):null);
const normalizedKey=value=>String(value??'').normalize('NFKC').toLocaleLowerCase('de-DE').replace(/[ä]/g,'a').replace(/[ö]/g,'o').replace(/[ü]/g,'u').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,' ').trim();
function scaleRating(value){
 const raw=value&&typeof value==='object'?(value.score??value.value):value;
 const n=finiteNumber(raw);
 if(n===null||n<0)return null;
 return n<=5?n*20:clamp(n,0,100);
}
const GROUP_PATTERNS={
 technical:/technik|dribbling|erster kontakt|passspiel|finten|torschuss|beidfuss|ball an|mitnahme|kreativ/,
 tactical:/taktik|raumverhalten|umschaltspiel|spiel ohne ball|antizip|an spiel|spieleinfluss|handlungsschnelligkeit|1 1|zweikampf|positionierung/,
 athletic:/athletik|laufbild|laufaktivitat|antritt|schnelligkeit|korperlichkeit|bewegungsgeschick|laufstark/,
 mental:/mental|teamplayer|einstellung|fuhrungsspieler|disziplin|konzentration|positive korpersprache|kommunikation/,
 goalkeeping:/reflex|fangsicherheit|reboundkontrolle|abwurf|abstoss|flankenbeherrschung|antizipation torwart|spielereroffnung|strafraumbeherrschung|eins gegen eins torwart|stellungsspiel torwart|kommunikation torwart/
};
export function extractMessinhoDimensionScores(ratings={},positions=[]){
 const entries=Object.entries(ratings||{}).map(([key,value])=>[normalizedKey(key),scaleRating(value)]).filter(([,value])=>value!==null);
 const result={};
 const aliases={technical:['technik','technical'],tactical:['taktik','tactical'],athletic:['athletik','athletic'],mental:['mentalitaet','mental','mentality']};
 for(const dimension of ['technical','tactical','athletic','mental']){
  const direct=entries.find(([key])=>aliases[dimension].includes(key));
  const matches=direct?[direct[1]]:entries.filter(([key])=>GROUP_PATTERNS[dimension].test(key)).map(([,value])=>value);
  if(matches.length)result[dimension]=Math.round(matches.reduce((a,b)=>a+b,0)/matches.length);
 }
 const positionText=(Array.isArray(positions)?positions:[positions]).map(normalizedKey).join(' ');
 if(/torwart|goalkeeper|keeper|\bgk\b/.test(positionText)){
  const direct=entries.find(([key])=>['goalkeeping','torwart'].includes(key));
  const matches=direct?[direct[1]]:entries.filter(([key])=>GROUP_PATTERNS.goalkeeping.test(key)).map(([,value])=>value);
  if(matches.length)result.goalkeeping=Math.round(matches.reduce((a,b)=>a+b,0)/matches.length);
 }
 return result;
}
function vectorFor(example,keys){return keys.map(key=>{const n=finiteNumber(example.dimension_scores?.[key]);return n!==null&&n>=0&&n<=100?n:null;});}
function validWeights(weights,keys){
 if(!weights||typeof weights!=='object')return null;
 const values=keys.map(key=>Number(weights[key]));
 if(values.some(v=>!Number.isFinite(v)||v<0))return null;
 const total=values.reduce((a,b)=>a+b,0);if(total<=0)return null;
 return Object.fromEntries(keys.map((key,i)=>[key,values[i]/total]));
}
function predict(vector,weights){
 let sum=0,weight=0;vector.forEach((value,i)=>{if(value!==null){sum+=value*weights[i];weight+=weights[i];}});
 return weight>=.5?sum/weight:null;
}
function mae(rows,weights){
 const errors=rows.map(row=>{const p=predict(row.vector,weights);return p===null?null:Math.abs(p-row.target);}).filter(v=>v!==null);
 return errors.length?errors.reduce((a,b)=>a+b,0)/errors.length:null;
}
function projectWeights(values,baseline,maxShift=.20){
 const lower=baseline.map(value=>Math.max(.02,value-maxShift));
 const upper=baseline.map(value=>Math.min(.70,value+maxShift));
 const projected=values.map((value,index)=>clamp(value,lower[index],upper[index]));
 for(let iteration=0;iteration<24;iteration++){
  const difference=1-projected.reduce((sum,value)=>sum+value,0);
  if(Math.abs(difference)<1e-10)break;
  const active=projected.map((value,index)=>({value,index})).filter(({value,index})=>difference>0?value<upper[index]-1e-12:value>lower[index]+1e-12);
  if(!active.length)break;
  const share=difference/active.length;
  for(const {index} of active)projected[index]=clamp(projected[index]+share,lower[index],upper[index]);
 }
 return projected;
}
function trainWeights(rows,keys,baseline){
 let weights=baseline.slice();
 const rate=.000015;
 for(let step=0;step<12000;step++){
  const grad=weights.map(()=>0);let count=0;
  for(const row of rows){
   const pred=predict(row.vector,weights);if(pred===null)continue;
   const denominator=row.vector.reduce((sum,value,i)=>sum+(value===null?0:weights[i]),0);if(denominator<.5)continue;
   const error=pred-row.target;count++;
   row.vector.forEach((value,i)=>{if(value!==null)grad[i]+=2*error*(value-pred)/denominator;});
  }
  if(!count)break;
  weights=projectWeights(weights.map((w,i)=>w-rate*grad[i]/count),baseline);
 }
 return Object.fromEntries(keys.map((key,i)=>[key,Number(weights[i].toFixed(4))]));
}
export function buildMessinhoLearningProposal(calibrationRows,baselineProfiles,options={}){
 const minExamples=Number.isInteger(options.minExamples)?Math.max(10,options.minExamples):MIN_EXAMPLES;
 const byGroup=new Map();
 for(const row of calibrationRows||[]){
  const target=finiteNumber(row?.target_score);
  if(!row||!row.player_id||!row.position_group||target===null)continue;
  const group=row.position_group;
  if(!byGroup.has(group))byGroup.set(group,[]);
  byGroup.get(group).push({player_id:String(row.player_id),target:clamp(target,0,100),dimension_scores:row.dimension_scores||{}});
 }
 const profiles={},report={};let trainedGroups=0;
 for(const [group,examples] of byGroup){
  examples.sort((a,b)=>a.player_id.localeCompare(b.player_id)||JSON.stringify(a.dimension_scores).localeCompare(JSON.stringify(b.dimension_scores))||a.target-b.target);
  const keys=Object.keys(baselineProfiles?.[group]||{technical:1,tactical:1,athletic:1,mental:1}).filter(key=>DIMENSIONS.includes(key));
  const uniquePlayers=new Set(examples.map(row=>row.player_id));
  if(examples.length<minExamples||uniquePlayers.size<10){report[group]={status:'insufficient_data',examples:examples.length,unique_players:uniquePlayers.size,required_examples:minExamples,required_unique_players:10};continue;}
  const base=validWeights(baselineProfiles?.[group],keys)||validWeights(Object.fromEntries(keys.map(k=>[k,1])),keys);
  const rows=examples.map(row=>({...row,vector:vectorFor(row,keys)})).filter(row=>row.vector.filter(v=>v!==null).length>=2);
  const heldoutIds=new Set([...uniquePlayers].sort().filter((_,i)=>i%5===0));
  const train=rows.filter(row=>!heldoutIds.has(row.player_id));
  const validation=rows.filter(row=>heldoutIds.has(row.player_id));
  if(train.length<Math.ceil(minExamples*.8)||validation.length<5){report[group]={status:'insufficient_validation_data',examples:rows.length,validation_examples:validation.length};continue;}
  const baseArray=keys.map(k=>base[k]);
  const proposed=trainWeights(train,keys,baseArray),nextArray=keys.map(k=>proposed[k]);
  const before=mae(validation,baseArray),after=mae(validation,nextArray);
  const maxShift=Math.max(...keys.map(k=>Math.abs(proposed[k]-base[k])));
  const accepted=before!==null&&after!==null&&after<=before-1.0&&maxShift<=.20;
  report[group]={status:accepted?'proposal_ready':'no_reliable_improvement',examples:rows.length,unique_players:uniquePlayers.size,validation_examples:validation.length,baseline_mae:Number(before?.toFixed(2)),proposed_mae:Number(after?.toFixed(2)),max_weight_shift:Number(maxShift.toFixed(4))};
  if(accepted){profiles[group]=proposed;trainedGroups++;}
 }
 return {learning_version:MESSINHO_LEARNING_VERSION,status:trainedGroups?'proposal_ready':'no_proposal',profiles,report,trained_groups:trainedGroups,created_at:new Date().toISOString(),guardrails:{minimum_verified_examples_per_position:minExamples,minimum_unique_players:10,holdout_fraction:.2,minimum_mae_improvement:1,max_weight_shift:.2,requires_admin_approval:true}};
}
