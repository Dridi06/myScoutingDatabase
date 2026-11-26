/**
 * MESSINHO quality intelligence.
 * Deterministic, privacy-preserving aggregation of administrator-reviewed feedback.
 * This module creates hypotheses only; it never changes prompts, capabilities or model weights.
 */
const MAX_RECORDS=1000;
const MIN_GROUP_SAMPLE=5;
const clean=(value,max=120)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const round=(value,digits=2)=>Number(Number(value).toFixed(digits));
const validDate=value=>{const date=new Date(value);return Number.isFinite(date.getTime())?date:null;};
const RATING_STATUSES=new Set(['reviewed','applied']);
const VERIFIED_CORRECTION_STATUSES=new Set(['verified','applied']);
const REVIEWED_REQUEST_STATUSES=new Set(['reviewed','applied']);

const THEMES=[
 ['factual_accuracy',/fakt|quelle|beleg|stimmt nicht|falsch|halluzin|erfunden|incorrect|inaccurate|source|evidence/],
 ['completeness',/vollst[aä]ndig|fehlt|unvollst[aä]ndig|erg[aä]nz|mehr detail|complete|missing|omitted/],
 ['relevance',/relevant|passend|thema|ziel|frage verfehlt|irrelevant|off topic/],
 ['tactical_analysis',/taktik|formation|spielsystem|position|pressing|raum|tactical|role/],
 ['player_data',/spieler|statistik|daten|alter|verein|marktwert|player|stats|profile/],
 ['reasoning',/begrund|logik|schluss|herleitung|widerspruch|reason|logic|contradict/],
 ['sources',/quelle|link|beleg|zitat|source|citation|url/],
 ['presentation',/format|struktur|lesbar|lang|kurz|sprache|darstellung|formatting|readability/],
 ['technical_error',/fehler|bug|absturz|laden|timeout|error|crash|failed/]
];

function themeForText(value){
 const text=clean(value,1200).toLocaleLowerCase('de-DE');
 return THEMES.filter(([,pattern])=>pattern.test(text)).map(([theme])=>theme);
}
function summarizeRatings(records){
 const ratings=records.filter(row=>row.feedback_type==='quality_rating'&&RATING_STATUSES.has(row.status)&&Number.isInteger(Number(row.rating))&&Number(row.rating)>=1&&Number(row.rating)<=5);
 const distribution={1:0,2:0,3:0,4:0,5:0};
 for(const row of ratings)distribution[row.rating]++;
 const count=ratings.length,average=count?ratings.reduce((sum,row)=>sum+Number(row.rating),0)/count:null;
 const low=count?ratings.filter(row=>Number(row.rating)<=2).length:0;
 return {count,average:average===null?null:round(average),low_rating_count:low,low_rating_rate:count?round(low/count*100):null,distribution,
  confidence:count<5?'insufficient_sample':count<20?'directional':'stable'};
}
function groupBy(records,keyFn){
 const groups=new Map();
 for(const record of records){const key=clean(keyFn(record),80);if(!key)continue;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(record);}
 return groups;
}
function buildGroupSummaries(records,keyFn){
 return [...groupBy(records,keyFn)].map(([key,rows])=>{
  const summary=summarizeRatings(rows);
  return {key,...summary};
 }).sort((a,b)=>(a.average??6)-(b.average??6)||b.count-a.count||a.key.localeCompare(b.key));
}
function groupByCapabilityOrIntent(records){
 const groups=new Map();
 for(const row of records){
  const capabilities=[...new Set((Array.isArray(row.capability_ids)?row.capability_ids:[]).map(value=>clean(value,80)).filter(Boolean))];
  const keys=capabilities.length?capabilities:[clean(row.intent,80)];
  for(const key of keys){if(!key)continue;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
 }
 return groups;
}
function summarizeCapabilityGroups(records){
 return [...groupByCapabilityOrIntent(records)].map(([key,rows])=>({key,...summarizeRatings(rows)}))
  .sort((a,b)=>(a.average??6)-(b.average??6)||b.count-a.count||a.key.localeCompare(b.key));
}
function trendSummary(ratings,now){
 const currentStart=now.getTime()-30*86400000,previousStart=now.getTime()-60*86400000;
 const current=ratings.filter(row=>{const date=validDate(row.created_at);return date&&date.getTime()>=currentStart;});
 const previous=ratings.filter(row=>{const date=validDate(row.created_at);return date&&date.getTime()>=previousStart&&date.getTime()<currentStart;});
 const a=summarizeRatings(current),b=summarizeRatings(previous);
 return {window_days:30,current_count:a.count,previous_count:b.count,current_average:a.average,previous_average:b.average,
  change:a.average!==null&&b.average!==null?round(a.average-b.average):null,
  status:a.count<5||b.count<5?'insufficient_sample':'comparable'};
}
function createHypotheses(records){
 const ratings=records.filter(row=>row.feedback_type==='quality_rating'&&RATING_STATUSES.has(row.status)&&Number.isInteger(Number(row.rating))&&Number(row.rating)>=1&&Number(row.rating)<=5);
 const corrections=records.filter(row=>row.feedback_type==='factual_correction'&&VERIFIED_CORRECTION_STATUSES.has(row.status));
 const hypotheses=[];
 for(const [key,rows] of groupByCapabilityOrIntent(ratings)){
  const group={key,...summarizeRatings(rows)};
  if(group.count<MIN_GROUP_SAMPLE||group.average===null||group.average>3)continue;
  hypotheses.push({id:'low_rating:'+group.key,type:'repeated_low_quality',group_by:'capability_or_intent',group:group.key,sample_size:group.count,average_rating:group.average,
   priority:group.average<=2?'high':'medium',proposal:'Critic-Prüfkriterien und Evidenzabdeckung dieser Aufgabenklasse untersuchen; vor Änderungen gezielte Regressionstests ergänzen.'});
 }
 const correctionGroups=groupByCapabilityOrIntent(corrections);
 for(const [key,rows] of correctionGroups){
  if(rows.length<3)continue;
  hypotheses.push({id:'verified_corrections:'+key,type:'repeated_verified_corrections',group_by:'capability_or_intent',group:key,sample_size:rows.length,
   priority:rows.length>=5?'high':'medium',proposal:'Wiederkehrende fachliche Korrekturen mit Quellen vergleichen und eine gezielte Fakten-/Datenvalidierung als Regressionstest formulieren.'});
 }
 const themeCounts=new Map();
 for(const row of records){
  if(row.feedback_type==='factual_correction'&&!VERIFIED_CORRECTION_STATUSES.has(row.status))continue;
  if(row.feedback_type==='quality_rating'&&!RATING_STATUSES.has(row.status))continue;
  if(row.feedback_type==='bug_report'&&!REVIEWED_REQUEST_STATUSES.has(row.status))continue;
  if(row.feedback_type==='feature_request'&&!REVIEWED_REQUEST_STATUSES.has(row.status))continue;
  for(const theme of themeForText(row.comment))themeCounts.set(theme,(themeCounts.get(theme)||0)+1);
 }
 const repeatedThemes=[...themeCounts].filter(([,count])=>count>=3).map(([theme,count])=>({theme,count}));
 for(const theme of repeatedThemes)hypotheses.push({id:'theme:'+theme.theme,type:'repeated_feedback_theme',group_by:'theme',group:theme.theme,sample_size:theme.count,priority:theme.count>=5?'medium':'low',
  proposal:'Thema in den zugehörigen geprüften Rückmeldungen untersuchen und eine messbare Testhypothese ableiten.'});
 const priority={high:0,medium:1,low:2};
 return hypotheses.sort((a,b)=>priority[a.priority]-priority[b.priority]||b.sample_size-a.sample_size||a.id.localeCompare(b.id)).slice(0,20);
}
export function buildMessinhoQualityIntelligence(input=[],options={}){
 const now=validDate(options.now)||new Date();
 const records=(Array.isArray(input)?input:[]).slice(0,MAX_RECORDS).filter(row=>row&&typeof row==='object');
 const ratings=records.filter(row=>row.feedback_type==='quality_rating'&&RATING_STATUSES.has(row.status));
 const reviewedCorrections=records.filter(row=>row.feedback_type==='factual_correction'&&VERIFIED_CORRECTION_STATUSES.has(row.status));
 const reviewedBugs=records.filter(row=>row.feedback_type==='bug_report'&&REVIEWED_REQUEST_STATUSES.has(row.status));
 const reviewedFeatures=records.filter(row=>row.feedback_type==='feature_request'&&REVIEWED_REQUEST_STATUSES.has(row.status));
 const byCapability=summarizeCapabilityGroups(ratings);
 const byIntent=buildGroupSummaries(ratings,row=>row.intent||'');
 const themes=new Map();
 for(const row of records){
  const eligible=(row.feedback_type==='quality_rating'&&RATING_STATUSES.has(row.status))
   ||(row.feedback_type==='factual_correction'&&VERIFIED_CORRECTION_STATUSES.has(row.status))
   ||(['bug_report','feature_request'].includes(row.feedback_type)&&REVIEWED_REQUEST_STATUSES.has(row.status));
  if(!eligible)continue;
  for(const theme of themeForText(row.comment))themes.set(theme,(themes.get(theme)||0)+1);
 }
 return {generated_at:now.toISOString(),sample_window:'up to 1000 most recent feedback records',
  coverage:{records_loaded:records.length,reviewed_quality_ratings:ratings.length,verified_corrections:reviewedCorrections.length,reviewed_bug_reports:reviewedBugs.length,reviewed_feature_requests:reviewedFeatures.length,
   excluded_pending_or_rejected:records.filter(row=>['pending','rejected'].includes(row.status)).length},
  ratings:summarizeRatings(ratings),trend:trendSummary(ratings,now),
  by_capability:byCapability.slice(0,12),by_intent:byIntent.slice(0,12),
  themes:[...themes].map(([theme,count])=>({theme,count})).sort((a,b)=>b.count-a.count||a.theme.localeCompare(b.theme)).slice(0,12),
  hypotheses:createHypotheses(records),
  governance:{feedback_is_training_data:false,automatic_changes:false,minimum_group_sample:MIN_GROUP_SAMPLE,corrections_require_admin_verification:true,
   note:'Nur administrativ geprüfte Feedbacksignale werden aggregiert. Hypothesen sind Prüfvorschläge und ändern weder Prompts noch Fähigkeiten oder Modellgewichte.'}};
}
