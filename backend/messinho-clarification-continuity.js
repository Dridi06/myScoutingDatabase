/**
 * MESSINHO clarification continuity — transient bridge from dialogue state
 * into the existing scouting parser. It never persists data or authorizes actions.
 */
const MAX_HISTORY = 60;
const MAX_CONTEXT_MESSAGES = 10;
const GOAL_PATTERN = /(?:^|[^\p{L}\p{N}])(?:suche|such|finde|identifiziere|scoute|recherchiere|analysiere|vergleiche|stelle|ermittle|need|find|search|scout|research|analyse|analyze|compare|cherche|trouve|busca|encuentra|investiga|قلب|نلوّج|نبحث)(?=$|[^\p{L}\p{N}])/iu;
const NEW_TOPIC_PATTERN = /\b(?:frage zur|frage über|frage ueber|erklär|erklaer|wie funktioniert|warum|wieso|steuer|allgemeine frage|unabhängig davon|unabhaengig davon|anderes thema|by the way|unrelated question|new topic|autre sujet|por cierto|موضوع آخر|سؤال آخر)\b/iu;
const NEGATION_PATTERN = /\b(?:nicht|kein(?:e|en|er|es)?|nie|not|never|no|pas|jamais|nunca|ningún|ninguna)\b|(?:ما\s+|لم\s+)/iu;
const YES_PATTERN = /^(?:ja|yes|oui|sí|si|إي|اي|باهي)$/iu;
const NO_PATTERN = /^(?:nein|no|non|لا)$/iu;

function clean(value, limit=1200) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/gu,' ').replace(/\s+/gu,' ').trim().slice(0,limit);
}
function normalize(value) {
  return clean(value,300).normalize('NFKC').toLocaleLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/gu,'')
    .replace(/[’']/gu,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/gu,' ');
}
function questionSentences(value) {
  const text=clean(value,1600);
  const matches=text.match(/[^?؟.!\n]*[?؟]/gu)||[];
  return matches.map(item=>item.trim()).filter(Boolean).slice(-4);
}
function optionCandidates(question) {
  const segments=clean(question,320).split(/\s+(?:oder|or|ou|o|ولا|أو)\s+|[,;/،؛]/iu);
  if(segments.length<2)return [];
  return segments.map(value=>clean(value,100)
    .replace(/^(?:soll ich|möchtest du|willst du|do you want|should i|tu veux|quieres|تحب)\s+/iu,'')
    .replace(/^(?:in|im|in der|aus|auf|für|between|from|to|en|a|por|para|dans|au|aux|à)\s+/iu,'')
    .replace(/[?؟.!,:;]+$/u,'').trim())
    .filter(value=>value&&value.split(/\s+/u).length<=6)
    .filter((value,index,list)=>list.findIndex(other=>normalize(other)===normalize(value))===index)
    .slice(0,4);
}
function classifyQuestion(question, fallback) {
  const text=normalize(question);
  if(/\b(?:age|alt|alter|years old|how old|عمر|قداش عمر)\b/u.test(text))return 'age';
  if(/\b(?:where|wo|land|location|region|country|international|وين|تونس|ألمانيا)\b/u.test(text))return 'location';
  if(/\b(?:position|position|rolle|poste|مركز)\b/u.test(text))return 'position';
  if(/\b(?:liga|league|level|bundesliga|regionalliga|spielklasse|niveau)\b/u.test(text))return 'target_level';
  if(/\b(?:soll ich|should i|do you want|möchtest du|willst du|تحب)\b/u.test(text))return 'yes_no';
  return fallback || 'generic';
}
function answerForQuestion(message, question, fallback, suppliedOptions=null) {
  const text=normalize(message);
  const options=Array.isArray(suppliedOptions)&&suppliedOptions.length?suppliedOptions:optionCandidates(question);
  const matches=options.filter(option=>{
    const candidate=normalize(option);
    return candidate&&(text===candidate||text.startsWith(candidate+' ')||text.endsWith(' '+candidate));
  });
  const kind=classifyQuestion(question,fallback);
  if(matches.length===1)return {status:'likely_answer',kind,matched_option:matches[0],options,reason:'unique_option_match'};
  if(matches.length>1)return {status:'ambiguous',kind,matched_option:null,options,reason:'multiple_option_matches'};
  if((YES_PATTERN.test(text)||NO_PATTERN.test(text))&&NEGATION_PATTERN.test(question))
    return {status:'ambiguous',kind,matched_option:null,options,reason:'negated_confirmation_requires_clarification'};
  return {status:'none',kind,matched_option:null,options,reason:'no_unique_question_match'};
}
function findGoalIndex(history) {
  for(let i=history.length-1;i>=0;i--){
    const item=history[i];
    if(item?.role!=='user')continue;
    const text=clean(item.text);
    if(NEW_TOPIC_PATTERN.test(text))return -1;
    if(GOAL_PATTERN.test(text))return i;
  }
  return -1;
}
export function buildMessinhoClarificationContinuity({message,history=[],dialogueState=null}={}) {
  const current=clean(message,1200);
  const safeHistory=(Array.isArray(history)?history:[]).slice(-MAX_HISTORY).filter(item=>
    item&&['user','assistant'].includes(item.role)&&typeof item.text==='string'
  );
  const signal=dialogueState?.continuity?.clarification_reply||{status:'none',question_kind:null,matched_option:null};
  const lastAssistant=[...safeHistory].reverse().find(item=>item.role==='assistant');
  const questions=questionSentences(lastAssistant?.text||'');
  const pending=dialogueState?.continuity?.pending_question||null;
  if(signal.status==='new_topic')return {
    status:'new_topic',active:false,action_blocked:false,task_goal:null,applied_answers:[],
    effective_message:current,parser_history:[],reason:'new_topic_not_carried_forward'
  };
  if(signal.status==='ambiguous')return {
    status:'ambiguous',active:false,action_blocked:true,task_goal:null,applied_answers:[],
    effective_message:current,parser_history:[],question:pending?.text||questions.at(-1)||null,
    options:pending?.options||[],reason:signal.evidence?.[0]||'ambiguous_clarification'
  };
  if(signal.status==='candidate_answer')return {
    status:'candidate_answer',active:false,action_blocked:true,task_goal:null,applied_answers:[],
    effective_message:current,parser_history:[],question:pending?.text||questions.at(-1)||null,
    options:pending?.options||[],reason:'free_text_requires_semantic_review'
  };
  if(signal.status!=='likely_answer')return {
    status:'none',active:false,action_blocked:false,task_goal:null,applied_answers:[],
    effective_message:current,parser_history:null,reason:'no_pending_answer'
  };
  const relevantQuestions=questions.length?questions:[pending?.text].filter(Boolean);
  if(relevantQuestions.length>1){
    const outcomes=relevantQuestions.map((question,index)=>answerForQuestion(current,question,pending?.kind,index===relevantQuestions.length-1?pending?.options:null));
    const matches=outcomes.filter(item=>item.status==='likely_answer');
    if(matches.length!==1)return {
      status:'ambiguous',active:false,action_blocked:true,task_goal:null,applied_answers:[],
      effective_message:current,parser_history:[],question:relevantQuestions.join(' / '),
      options:[...new Set(outcomes.flatMap(item=>item.options))].slice(0,4),
      reason:matches.length?'answer_matches_multiple_questions':'multiple_pending_questions'
    };
  }
  const lastQuestion=relevantQuestions.at(-1)||pending?.text||'';
  if(NEGATION_PATTERN.test(lastQuestion)&&(YES_PATTERN.test(normalize(current))||NO_PATTERN.test(normalize(current))))
    return {
      status:'ambiguous',active:false,action_blocked:true,task_goal:null,applied_answers:[],
      effective_message:current,parser_history:[],question:lastQuestion,options:pending?.options||[],
      reason:'negated_confirmation_requires_clarification'
    };
  const goalIndex=findGoalIndex(safeHistory);
  if(goalIndex<0)return {
    status:'missing_goal',active:false,action_blocked:true,task_goal:null,applied_answers:[],
    effective_message:current,parser_history:[],question:lastQuestion,options:pending?.options||[],
    reason:'no_explicit_prior_goal'
  };
  const taskMessages=safeHistory.slice(goalIndex).filter(item=>item.role==='user').slice(-MAX_CONTEXT_MESSAGES);
  const taskGoal=clean(taskMessages[0]?.text,700);
  const answers=taskMessages.slice(1).map(item=>clean(item.text,500)).filter(Boolean);
  const parserHistory=taskMessages.map(item=>({role:'user',text:clean(item.text,700)}));
  return {
    status:'likely_answer',active:true,action_blocked:false,task_goal:taskGoal,
    applied_answers:answers.slice(-6),question:lastQuestion,question_kind:signal.question_kind||pending?.kind||null,
    matched_option:signal.matched_option||null,
    effective_message:[taskGoal,...answers,current].filter(Boolean).join(' ' ).slice(0,2400),
    parser_history:parserHistory,reason:'prior_goal_and_answers_carried_forward'
  };
}
