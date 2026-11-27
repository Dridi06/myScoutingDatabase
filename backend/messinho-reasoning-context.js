export const MESSINHO_REASONING_CONTEXT_VERSION='1.0.0';
const MAX_EVIDENCE=10, MAX_TEXT=420;
function clean(value){return String(value??'').replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim().slice(0,MAX_TEXT);}
function safeResearchContext(value){
 if(!value||typeof value!=='object')return null;
 const refs=[];
 for(const key of ['player','club','team']){
  const entity=value[key];if(!entity||typeof entity!=='object')continue;
  const name=clean(entity.name||entity.player_name||entity.club_name||entity.team_name);
  if(name)refs.push({type:key,name,id:entity.id??entity.player_id??entity.club_id??entity.team_id??null});
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
