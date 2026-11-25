/**
 * MESSINHO Learning Engine – supervised, auditable model proposals.
 * It learns only from explicit scout ratings; no autonomous code or model deployment.
 */
export const MESSINHO_LEARNING_VERSION = '1.0.0';
const DIMENSIONS = ['technical','tactical','athletic','mental','goalkeeping'];
const MIN_EXAMPLES = 30;
const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
const toScore = value => {
  const n=Number(value);
  return Number.isFinite(n) ? clamp(n <= 1 ? n*100 : n,0,100) : null;
};
function vectorFor(example, keys) {
  return keys.map(key => toScore(example.dimension_scores?.[key]));
}
function validWeights(weights, keys) {
  if (!weights || typeof weights!=='object') return null;
  const values=keys.map(key=>Number(weights[key]));
  if(values.some(v=>!Number.isFinite(v)||v<0))return null;
  const total=values.reduce((a,b)=>a+b,0);
  if(total<=0)return null;
  return Object.fromEntries(keys.map((key,i)=>[key,values[i]/total]));
}
function predict(vector,weights) {
  let sum=0,weight=0;
  vector.forEach((value,i)=>{if(value!==null){sum+=value*weights[i];weight+=weights[i];}});
  return weight>=.5?sum/weight:null;
}
function mae(rows,weights) {
  const errors=rows.map(row=>{const p=predict(row.vector,weights);return p===null?null:Math.abs(p-row.target);}).filter(v=>v!==null);
  return errors.length?errors.reduce((a,b)=>a+b,0)/errors.length:null;
}
function trainWeights(rows,keys,baseline) {
  let weights=keys.map(key=>baseline[key]||0);
  const total=weights.reduce((a,b)=>a+b,0)||1;
  weights=weights.map(v=>v/total);
  const rate=.000015;
  for(let step=0;step<12000;step++){
    const grad=weights.map(()=>0);let count=0;
    for(const row of rows){
      const pred=predict(row.vector,weights);if(pred===null)continue;
      const active=row.vector.map((v,i)=>v===null?0:weights[i]);
      const denominator=active.reduce((a,b)=>a+b,0);if(denominator<.5)continue;
      const error=pred-row.target;count++;
      row.vector.forEach((v,i)=>{if(v!==null)grad[i]+=2*error*(v-pred)/denominator;});
    }
    if(!count)break;
    weights=weights.map((w,i)=>clamp(w-rate*grad[i]/count,.02,.70));
    const sum=weights.reduce((a,b)=>a+b,0);weights=weights.map(v=>v/sum);
  }
  return Object.fromEntries(keys.map((key,i)=>[key,Number(weights[i].toFixed(4))]));
}
export function buildMessinhoLearningProposal(feedbackRows, baselineProfiles, options={}) {
  const minExamples=Number.isInteger(options.minExamples)?Math.max(10,options.minExamples):MIN_EXAMPLES;
  const byGroup=new Map();
  for(const row of feedbackRows||[]){
    if(!row||!row.player_id||!row.position_group||!Number.isFinite(Number(row.target_score)))continue;
    const keys=DIMENSIONS.filter(key=>row.dimension_scores?.[key]!==null&&row.dimension_scores?.[key]!==undefined&&Number.isFinite(Number(row.dimension_scores[key])));
    if(keys.length<2)continue;
    const group=row.position_group;
    if(!byGroup.has(group))byGroup.set(group,[]);
    byGroup.get(group).push({player_id:String(row.player_id),target:clamp(Number(row.target_score),0,100),dimension_scores:row.dimension_scores,created_at:row.created_at||''});
  }
  const profiles={};const report={};let trainedGroups=0;
  for(const [group,examples] of byGroup){
    const keys=Object.keys(baselineProfiles?.[group]||{technical:1,tactical:1,athletic:1,mental:1}).filter(key=>DIMENSIONS.includes(key));
    const uniquePlayers=new Set(examples.map(row=>row.player_id));
    if(examples.length<minExamples||uniquePlayers.size<10){report[group]={status:'insufficient_data',examples:examples.length,unique_players:uniquePlayers.size,required_examples:minExamples,required_unique_players:10};continue;}
    const base=validWeights(baselineProfiles?.[group],keys)||validWeights(Object.fromEntries(keys.map(k=>[k,1])),keys);
    const rows=examples.map(row=>({...row,vector:vectorFor(row,keys)})).filter(row=>row.vector.filter(v=>v!==null).length>=2);
    const heldoutIds=new Set([...uniquePlayers].filter((_,i)=>i%5===0));
    const train=rows.filter(row=>!heldoutIds.has(row.player_id));
    const validation=rows.filter(row=>heldoutIds.has(row.player_id));
    if(train.length<minExamples-5||validation.length<5){report[group]={status:'insufficient_validation_data',examples:rows.length,validation_examples:validation.length};continue;}
    const proposed=trainWeights(train,keys,base);
    const baseArray=keys.map(k=>base[k]);
    const nextArray=keys.map(k=>proposed[k]);
    const before=mae(validation,baseArray),after=mae(validation,nextArray);
    const maxShift=Math.max(...keys.map(k=>Math.abs(proposed[k]-base[k])));
    const accepted=before!==null&&after!==null&&after<=before-1.0&&maxShift<=.20;
    report[group]={status:accepted?'proposal_ready':'no_reliable_improvement',examples:rows.length,unique_players:uniquePlayers.size,validation_examples:validation.length,baseline_mae:Number(before?.toFixed(2)),proposed_mae:Number(after?.toFixed(2)),max_weight_shift:Number(maxShift.toFixed(4))};
    if(accepted){profiles[group]=proposed;trainedGroups++;}
  }
  return {learning_version:MESSINHO_LEARNING_VERSION,status:trainedGroups?'proposal_ready':'no_proposal',profiles,report,trained_groups:trainedGroups,created_at:new Date().toISOString(),guardrails:{minimum_examples_per_position:minExamples,minimum_unique_players:10,holdout_fraction:0.2,minimum_mae_improvement:1,max_weight_shift:0.2,requires_admin_approval:true}};
}
export function validateMessinhoFeedback(input) {
  if(!input||typeof input!=='object')return {error:'Feedback fehlt.'};
  const target=toScore(input.target_score);
  if(target===null)return {error:'Bitte eine Bewertung zwischen 0 und 100 angeben.'};
  const scores={};
  for(const key of DIMENSIONS){const value=input.dimension_scores?.[key];if(value!==undefined&&value!==null&&value!==''){const n=toScore(value);if(n===null)return {error:'Ungültiger Wert für '+key+'.'};scores[key]=n;}}
  if(Object.keys(scores).length<2)return {error:'Mindestens zwei nachvollziehbare Dimensionsbewertungen sind erforderlich.'};
  const playerId=typeof input.player_id==='string'?input.player_id.trim():'';
  if(!playerId||playerId.length>128)return {error:'Eine gültige Spieler-ID ist erforderlich.'};
  return {value:{player_id:playerId,target_score:target,dimension_scores:scores,comment:typeof input.comment==='string'?input.comment.trim().slice(0,1000):''}};
}
