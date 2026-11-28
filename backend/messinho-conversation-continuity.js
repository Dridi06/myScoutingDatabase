/**
 * MESSINHO Conversation Continuity — deterministic, bounded turn-to-turn context.
 * It extracts possible conversational links; it does not assert facts, resolve
 * entities, authorize actions, or persist memory.
 */
export const MESSINHO_CONVERSATION_CONTINUITY_VERSION = '1.0.0';
const MAX_HISTORY = 16;
const MAX_TEXT = 420;
const SENSITIVE = /(?:password|api[ _-]?key|access[ _-]?token|secret|private[ _-]?key|krank(?:heit|en)?|diagnos(?:e|ed)|medikament|therapie|depress(?:ion|iv)|diabetes|blutdruck|religion|muslim|islam|christ(?:entum|lich)|j[uü]disch|polit(?:ik|ische partei)|wahlentscheidung|ethn(?:ie|isch)|sexuell(?:e|er)? orientierung|homosexuell|straf(?:tat|verfahren)|vorstrafe)/iu;
const TOPIC_CHANGE = /\b(?:anderes thema|unabhängig davon|unabhaengig davon|jetzt etwas anderes|neues thema|by the way|unrelated|new topic|autre sujet|por cierto|موضوع آخر|سؤال آخر)\b/iu;
const CORRECTION = /\b(?:nein[, ]+(?:ich meinte|nicht)|ich meinte|gemeint habe ich|das stimmt nicht|nicht den|nicht die|nicht das|sondern|i meant|not that|that's not what|je voulais dire|no quise decir|موش هذا|موش هكا)\b/iu;
const REFERENTIAL = /\b(?:das|dazu|damit|davon|darauf|daran|darüber|der|die|den|dem|ihn|ihm|sie|es|sein(?:e|en|er|es)?|ihr(?:e|en|er|es)?|dort|dabei|it|this|that|these|those|he|she|him|her|his|hers|they|them|that one|the same|ça|cela|il|elle|lui|lo|la|él|ella|eso|este|esta|هذا|هذه|هو|هي|متاعو|متاعها)\b/iu;
const CONTINUATION = /^\s*(?:und|aber|also|dann|danach|davon|dazu|damit|darauf|deshalb|außerdem|zudem|weiter|nochmal|and|but|then|also|what about|how about|et|mais|alors|ensuite|en plus|y|pero|entonces|adem[aá]s|وبعد|وزيد|أما|شنوة|شنو|علاش|توا)\b/iu;
function clean(value,max=MAX_TEXT){return String(value??'').replace(/[\u0000-\u001f\u007f]/gu,' ').replace(/\s+/gu,' ').trim().slice(0,max);}
function wordCount(value){return clean(value).split(/\s+/u).filter(Boolean).length;}
function safeTurns(history){return (Array.isArray(history)?history:[]).slice(-MAX_HISTORY).flatMap(item=>{
  if(!['user','assistant'].includes(item?.role))return [];
  const text=clean(item.text);return text&&!SENSITIVE.test(text)?[{role:item.role,text}]:[];
});}
export function buildMessinhoConversationContinuityContext({message,history=[],dialogueState=null}={}){
  const current=clean(message,1200);
  const turns=safeTurns(history);
  const previousUser=[...turns].reverse().find(item=>item.role==='user'&&wordCount(item.text)>=3)||null;
  const previousAssistant=[...turns].reverse().find(item=>item.role==='assistant')||null;
  const recentUserTopics=turns.filter(item=>item.role==='user'&&wordCount(item.text)>=3).slice(-3).reverse()
    .map(item=>({text:item.text,source:'prior_user_message'}));
  const isTopicChange=TOPIC_CHANGE.test(current);
  const isCorrection=CORRECTION.test(current);
  const hasReference=REFERENTIAL.test(current);
  const hasConnector=CONTINUATION.test(current);
  const signal=dialogueState?.continuity?.follow_up_signal||'none';
  const followUpLikely=!isTopicChange&&(isCorrection||hasReference||hasConnector||signal!=='none');
  const relation=isTopicChange?'new_topic':isCorrection?'correction':followUpLikely?'follow_up':'standalone';
  const candidates=[];
  if(previousUser)candidates.push({text:previousUser.text,source:'prior_user_message',authority:'user_stated_context'});
  if(previousAssistant)candidates.push({text:previousAssistant.text,source:'prior_assistant_message',authority:'assistant_hypothesis_or_question'});
  const pending=dialogueState?.continuity?.pending_assistant_question;
  return {
    version:MESSINHO_CONVERSATION_CONTINUITY_VERSION,
    relation,
    follow_up_likely:followUpLikely,
    referential_expression_detected:hasReference,
    discourse_connector_detected:hasConnector,
    dialogue_signal:['none','discourse_connector','referential_question','short_reply','pending_question_reply'].includes(signal)?signal:'none',
    current_message:current,
    active_topic_candidate:!isTopicChange&&previousUser?previousUser.text:null,
    previous_assistant_contribution:!isTopicChange&&previousAssistant?previousAssistant.text:null,
    pending_assistant_question:!isTopicChange&&typeof pending==='string'?clean(pending,240):null,
    referent_candidates:!isTopicChange&&followUpLikely?candidates.slice(0,2):[],
    recent_user_topic_candidates:!isTopicChange&&followUpLikely?recentUserTopics:[],
    resolution_policy:'Prefer the immediately preceding exchange. Treat assistant statements as hypotheses or questions, not facts. If multiple referents remain plausible, ask one focused clarification. A correction invalidates the contradicted interpretation. A new topic must not inherit old task constraints.',
    evidence_policy:'Bounded extractive dialogue context only; not verified facts, identity resolution, durable memory, permissions, or action authorization.',
    bounded:true
  };
}
