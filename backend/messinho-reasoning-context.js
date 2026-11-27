export const MESSINHO_REASONING_CONTEXT_VERSION='1.0.0';
const MAX_EVIDENCE=10, MAX_TEXT=420;
function clean(value){return String(value??'').replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim().slice(0,MAX_TEXT);}
const ALLOWED_METRIC_KEYS=new Set(['top_speed_kmh','sprint_speed_kmh','max_speed_kmh','maximum_speed_kmh','speed_kmh','top_speed','sprint_speed','max_speed','sprint_10m_seconds','sprint_20m_seconds','sprint_30m_seconds','sprint_40m_seconds','sprint_100m_seconds','acceleration_10m_seconds','acceleration_20m_seconds','acceleration_30m_seconds','acceleration_40m_seconds']);
function canonicalMetricKey(raw){
 const key=String(raw||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
 const aliases={hoechstgeschwindigkeit:'top_speed_kmh',hochste_geschwindigkeit:'top_speed_kmh',sprintgeschwindigkeit:'sprint_speed_kmh',maximale_geschwindigkeit:'max_speed_kmh',max_speed:'max_speed_kmh',top_speed:'top_speed_kmh',sprint_speed:'sprint_speed_kmh'};
 return aliases[key]||key;
}
function metricNumber(rawValue,rawUnit=''){
 if(typeof rawValue==='number'&&Number.isFinite(rawValue))return {value:rawValue,unit:String(rawUnit||'').slice(0,12)};
 const text=String(rawValue??'').trim();
 const match=text.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(km\/h|kmh|kph|m\/s|sekunden|seconds|s)?$/iu);
 if(!match)return null;
 return {value:Number(match[1].replace(',','.')),unit:String(rawUnit||match[2]||'').slice(0,12)};
}
function safeMetricEntries(value){
 const result=[];
 const sources=[value?.metrics,value?.performance_metrics,value?.player?.metrics,value?.player?.performance_metrics,value?.profile?.metrics,value?.profile?.performance_metrics,value?.profile?.facts,value?.profile?.recent_performance];
 for(const source of sources){
  if(Array.isArray(source)){
   for(const item of source){
    const key=canonicalMetricKey(item?.key||item?.name||item?.metric||item?.label);
    const parsed=metricNumber(item?.value,item?.unit);
    if(ALLOWED_METRIC_KEYS.has(key)&&parsed)result.push({key,...parsed});
   }
  }else if(source&&typeof source==='object'){
   for(const [rawKey,rawValue] of Object.entries(source)){
    const key=canonicalMetricKey(rawKey),parsed=metricNumber(rawValue);
    if(ALLOWED_METRIC_KEYS.has(key)&&parsed)result.push({key,...parsed});
   }
  }
 }
 const unique=new Map(result.map(item=>[item.key+':'+item.value,item]));
 return [...unique.values()].slice(0,8);
}
function safeResearchContext(value){
 if(!value||typeof value!=='object')return null;
 const refs=[];
 for(const key of ['player','club','team']){
  const entity=value[key];if(!entity||typeof entity!=='object')continue;
  const name=clean(entity.name||entity.player_name||entity.club_name||entity.team_name);
  if(name){const reference={type:key,name,id:entity.id??entity.player_id??entity.club_id??entity.team_id??null};const metrics=key==='player'?safeMetricEntries({player:entity,profile:value.profile,metrics:value.metrics,performance_metrics:value.performance_metrics}):[];if(metrics.length)reference.metrics=metrics;refs.push(reference);}
 }
 return refs.length?refs.slice(0,4):null;
}
/** Evidence index only: it attributes statements and structured research metadata; it never validates claims. */
export function buildMessinhoReasoningContext({history=[],dialogueState=null,entityResolution=null}={}){
 const safe=(Array.isArray(history)?history:[]).slice(-20);
 const evidence=[];
 for(let i=0;i<safe.length;i++){
  const item=safe[i];const text=clean(item?.text);if(!text)continue;
  const research=safeResearchContext(item?.researchContext);
  const role=item?.role==='assistant'?'assistant':'user';
  evidence.push({role,text,kind:research?'message_with_structured_research_reference':'conversation_statement',research_entities:research,turn_offset:safe.length-i});
 }
 const continuity=dialogueState?.continuity||{};
 return {
  version:MESSINHO_REASONING_CONTEXT_VERSION,
  evidence_policy:'attributed_not_verified',
  follow_up_likely:continuity.follow_up_likely===true,
  follow_up_signal:['none','discourse_connector','referential_question','short_reply','pending_question_reply'].includes(continuity.follow_up_signal)?continuity.follow_up_signal:'none',
  pending_question:typeof continuity.pending_assistant_question==='string'?clean(continuity.pending_assistant_question).slice(0,220):null,
  prior_user_goal:typeof continuity.prior_user_goal_candidate==='string'?clean(continuity.prior_user_goal_candidate).slice(0,260):null,
  entity_resolution:entityResolution&&typeof entityResolution==='object'?{
   status:['resolved','ambiguous','unresolved','not_applicable'].includes(entityResolution.status)?entityResolution.status:'not_applicable',
   entity:entityResolution.entity?{entity_type:entityResolution.entity.entity_type,name:clean(entityResolution.entity.name).slice(0,120),id:entityResolution.entity.id??null}:null,
   candidates:Array.isArray(entityResolution.candidates)?entityResolution.candidates.slice(0,4).map(x=>({entity_type:x.entity_type,name:clean(x.name).slice(0,120),id:x.id??null})):[],
   reason:clean(entityResolution.reason).slice(0,100)
  }:null,
  evidence:evidence.slice(-MAX_EVIDENCE),
  evidence_count:evidence.length
 };
}
