export const MESSINHO_REASONING_VALIDATION_VERSION='1.0.0';

const UNSUPPORTED_METRIC_REPLY='Dafür liegen mir in diesem Gespräch keine verifizierten Messdaten vor. „Langsam“ ist zunächst eine qualitative Einschätzung und kein gemessener Geschwindigkeitswert.';
const AMBIGUOUS_PLAYER_REPLY='Ich möchte keinen Spieler falsch zuordnen. Welchen Spieler meinst du genau?';
const UNQUALIFIED_TACTICAL_REPLY='Das kann taktische Auswirkungen haben, hängt aber von Rolle, Positionierung, Antizipation und Mannschaftsstruktur ab. Ohne diese Angaben würde ich es nur als mögliche Hypothese einordnen.';

const SPEED_KEYS=new Set(['top_speed_kmh','sprint_speed_kmh','max_speed_kmh','maximum_speed_kmh','speed_kmh','top_speed','sprint_speed','max_speed']);
const TIME_KEYS=new Set(['sprint_10m_seconds','sprint_20m_seconds','sprint_30m_seconds','sprint_40m_seconds','sprint_100m_seconds','acceleration_10m_seconds','acceleration_20m_seconds','acceleration_30m_seconds','acceleration_40m_seconds']);
const TACTICAL_TERMS=/\b(?:tiefensicherung|restverteidigung|gegenpressing|pressinglinie|abseitsfalle|raumverteidigung|rückwärtsbewegung|umschaltspiel|konterabsicherung|defensive line|recovery runs?|counter.?press(?:ing)?|high line|pressing trigger|transition defense)\b/iu;
const CONDITIONAL_TERMS=/\b(?:könnte|kann|möglicherweise|eventuell|je nach|abhängig|falls|wenn|würde|unter der voraussetzung|denkbar|hypothese|hypothetisch|may|might|could|depending on|if|potentially|possibly|hypothesis|pourrait|selon|si|peut-être|قد|يمكن|ربما)\b/iu;

function normalizedKey(value){
 return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
}
function numberValue(value){
 if(typeof value==='number'&&Number.isFinite(value))return value;
 if(typeof value==='string'&&/^\s*\d+(?:[.,]\d+)?\s*$/.test(value))return Number(value.trim().replace(',','.'));
 return null;
}
function normalizeUnit(value){
 const unit=String(value??'').toLowerCase().replace(/\s/g,'').replace(/²/g,'2');
 if(['km/h','kmh','kph'].includes(unit))return 'km/h';
 if(['m/s','mps'].includes(unit))return 'm/s';
 if(['s','sec','seconds','sekunden'].includes(unit))return 's';
 return unit;
}
function collectMetrics(reasoningContext){
 const found=[];
 const evidence=Array.isArray(reasoningContext?.evidence)?reasoningContext.evidence:[];
 for(const item of evidence){
  for(const entity of Array.isArray(item?.research_entities)?item.research_entities:[]){
   for(const metric of Array.isArray(entity?.metrics)?entity.metrics:[]){
    const key=normalizedKey(metric?.key||metric?.name||metric?.metric);
    const value=numberValue(metric?.value);
    let unit=normalizeUnit(metric?.unit);
    if(!unit&&SPEED_KEYS.has(key))unit='km/h';
    if(!unit&&TIME_KEYS.has(key))unit='s';
    if(value!==null&&unit)found.push({key,value,unit});
   }
  }
 }
 return found;
}
function metricClaims(reply){
 const claims=[];
 const speed=/(\d+(?:[.,]\d+)?)\s*(km\/h|kmh|kph|m\/s)\b/giu;
 for(const match of reply.matchAll(speed))claims.push({value:Number(match[1].replace(',','.')),unit:normalizeUnit(match[2])});
 const sprintTime=/(\d+(?:[.,]\d+)?)\s*(?:sekunden|seconds|s)\s*(?:für|auf|over|in)?\s*(10|20|30|40|100)\s*m\b/giu;
 for(const match of reply.matchAll(sprintTime))claims.push({value:Number(match[1].replace(',','.')),unit:'s',distance:Number(match[2])});
 return claims;
}
function supportedMetric(claim,metrics){
 const keys=claim.unit==='km/h'?SPEED_KEYS:claim.unit==='s'?TIME_KEYS:new Set();
 return metrics.some(metric=>{
  if(metric.unit!==claim.unit||Math.abs(metric.value-claim.value)>0.05)return false;
  if(claim.distance)return metric.key.includes(String(claim.distance)+'m_')||metric.key.includes(String(claim.distance)+'m_');
  return keys.has(metric.key);
 });
}
function isPlayerReference(text){
 return /\b(?:der|dieser|jener)\s+spieler\b|\b(?:er|ihn|ihm|sein(?:e|en|er)?)\b|\b(?:the player|he|him|his)\b/iu.test(String(text||''));
}

/**
 * Deterministic output gate. It only accepts measurable claims when the same
 * value and unit exist in structured, allowlisted research evidence.
 * Conversation statements remain attributed; this function does not verify
 * general world facts or turn user assertions into scouting observations.
 */
export function validateMessinhoReasoning({intent='conversation',reply='',userMessage='',reasoningContext=null}={}){
 const text=String(reply??'').trim();
 if(!text)return {ok:true,code:'empty_deferred'};
 const entityStatus=reasoningContext?.entity_resolution?.status;
 const clarificationAlreadyAsked=/\b(?:welchen|welche|welcher|wen meinst du|auf wen|welchen spieler|which player|who do you mean)\b/iu.test(text);
 if(['ambiguous','unresolved'].includes(entityStatus)&&!clarificationAlreadyAsked&&(intent==='scouting'||isPlayerReference(text))){
  return {ok:false,code:'ambiguous_player_reference',reply:AMBIGUOUS_PLAYER_REPLY};
 }
 const metrics=collectMetrics(reasoningContext);
 const unsupported=metricClaims(text).some(claim=>!supportedMetric(claim,metrics));
 if(unsupported)return {ok:false,code:'unsupported_player_metric',reply:UNSUPPORTED_METRIC_REPLY};
 const userDescribesPace=/\b(?:langsam|träge|wenig tempo|slow|not very fast|lento|بطئ|بطيء)\b/iu.test(String(userMessage||''));
 if(userDescribesPace&&TACTICAL_TERMS.test(text)&&!CONDITIONAL_TERMS.test(text)){
  return {ok:false,code:'unqualified_tactical_claim',reply:UNQUALIFIED_TACTICAL_REPLY};
 }
 return {ok:true,code:'accepted'};
}
