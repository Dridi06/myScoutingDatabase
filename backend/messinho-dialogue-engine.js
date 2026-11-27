/**
 * MESSINHO Dialogue Engine — bounded, extractive conversation-state builder.
 * It does not infer facts, resolve identities conclusively, or persist memory.
 * It packages recent conversational signals and clarification lifecycle hints.
 */
export const MESSINHO_DIALOGUE_ENGINE_VERSION = '1.2.0';
const MAX_TEXT = 900;
const MAX_TURNS = 12;
const MAX_HISTORY_WINDOW = 60;
const MAX_QUESTION_TEXT = 320;
const SENSITIVE_CONTEXT_PATTERN = /(?:password|api[ _-]?key|access[ _-]?token|secret|private[ _-]?key|krank(?:heit|en)?|diagnos(?:e|ed)|medikament|therapie|depress(?:ion|iv)|diabetes|blutdruck|religion|muslim|islam|christ(?:entum|lich)|j[uü]disch|polit(?:ik|ische partei)|wahlentscheidung|ethn(?:ie|isch)|sexuell(?:e|er)? orientierung|homosexuell|straf(?:tat|verfahren)|vorstrafe)/iu;
const MAX_FOCUS = 4;
const CONNECTOR_PATTERN = /^\s*[¿¡]?\s*(?:w(?:\s+(?:kifech|chnowa|chnou|3lech|win|9addech))?|und|aber|also|dann|danach|davon|dazu|damit|darauf|deshalb|außerdem|zudem|weiter|nochmal|and|but|then|also|moreover|furthermore|what about|how about|et|mais|alors|ensuite|en plus|y|pero|entonces|adem[aá]s|وبعد|وزيد|أما|شنوة|شنو|علاش|توا|باهي|إي|لا)(?:$|[\s,:;!?؟])/iu;
const REFERENTIAL_QUESTION_PATTERN = /^\s*(?:wie|warum|wieso|weshalb|welcher|welche|welches|was ist mit|wie sieht es mit|how|why|which|what about|how about|pourquoi|comment|lequel|laquelle|y cómo|por qué|cuál|شنوة|شنو|علاش|كيف|وين|قداش|كفاش)\b[\s\S]{0,260}\b(?:er|sie|es|ihn|ihm|sein(?:e|en|er|es)?|ihr(?:e|en|er|es)?|the same|that one|this one|he|she|it|him|her|his|hers|elle|lui|ça|cela|il|elle|lo|la|él|ella|eso|هذا|هذه|هو|هي|متاعو|متاعها)\b/iu;
const SHORT_FOLLOW_UP_PATTERN = /^\s*(?:ja|nein|ok|okay|genau|weiter|warum|wieso|weshalb|stimmt|richtig|mehr|nochmal|yes|no|more|again|continue|right|exactly|oui|non|encore|continuer|sí|no|más|vale|صحيح|إي|لا|باهي|اي|علاش|كيفاش)\s*[.!؟?]*\s*$/iu;
const QUESTION_PATTERN = /[?؟]|\b(?:welche|welcher|welches|was|wer|wie|warum|wieso|wo|wann|which|what|who|how|why|where|when|pourquoi|comment|quoi|qui|وين|علاش|شنوة|شنو)\b/iu;
const QUESTION_START_PATTERN = /^\s*[¿¡]?\s*(?:wie|warum|wieso|weshalb|welcher|welche|welches|was|wer|wo|wann|how|why|which|what|who|where|when|pourquoi|comment|quoi|qui|por qué|cuál|qué|شنوة|شنو|علاش|كيف|وين|قداش)\b/iu;
const OPTION_SEPARATOR = /\s+(?:oder|or|ou|o|ولا|أو)\s+/iu;

function cleanText(value, max = MAX_TEXT) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/gu, '').trim().slice(0, max);
}
function safeHistory(history, limit = MAX_TURNS) {
  const safeLimit = Math.max(1, Math.min(MAX_HISTORY_WINDOW, Number.isInteger(limit) ? limit : MAX_TURNS));
  return (Array.isArray(history) ? history : []).slice(-safeLimit).map(item => ({
    role: item?.role === 'assistant' ? 'assistant' : item?.role === 'user' ? 'user' : null,
    text: cleanText(item?.text, MAX_TEXT)
  })).filter(item => item.role && item.text);
}
function wordCount(value) {
  return cleanText(value).split(/\s+/u).filter(Boolean).length;
}
function normalizeAnswer(value) {
  return cleanText(value, 180).normalize('NFKC').toLocaleLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/gu, ' ');
}
function extractQuestionText(value) {
  const text = cleanText(value, 1200);
  const marked = text.match(/[^?؟\n.!]*[?؟]/gu) || [];
  if (marked.length) return marked.at(-1).trim().slice(0, MAX_QUESTION_TEXT);
  return QUESTION_PATTERN.test(text) ? text.slice(0, MAX_QUESTION_TEXT) : null;
}
function cleanOptionSegment(value) {
  let option = cleanText(value, 120).replace(/^[¿¡\s]+/u, '').trim();
  option = option.replace(/^(?:soll ich|sollen wir|möchtest du|moechtest du|willst du|wollen wir|do you want|should i|would you prefer|tu veux|veux-tu|tu préfères|tu preferes|quieres que|quieres|prefieres|¿quieres que|هل تريد|تحب)\s+/iu, '');
  option = option.replace(/^(?:search|look for|find|suchen|recherchieren|in|im|in der|in den|aus|auf|für|fuer|between|from|to|en|a|por|para|dans|au|aux|à)\s+/iu, '');
  option = option.replace(/\s+(?:suchen|recherchieren|analysieren|finden|nehmen|starten|search|look|research|choose|chercher|rechercher|buscar|investigar)\s*[?؟.!]*$/iu, '');
  option = option.replace(/[?؟.!,:;]+$/u, '').trim();
  if (wordCount(option) > 5) option = option.split(/\s+/u).slice(-5).join(' ');
  return option.slice(0, 60);
}
function extractOptions(question) {
  const parts = cleanText(question, MAX_QUESTION_TEXT).split(OPTION_SEPARATOR);
  if (parts.length < 2) return [];
  return parts.slice(0, 4).map(cleanOptionSegment).filter(Boolean)
    .filter((value, index, list) => list.findIndex(other => normalizeAnswer(other) === normalizeAnswer(value)) === index);
}
function classifyQuestionKind(question, options) {
  const text = normalizeAnswer(question);
  const hasToken = (...tokens) => tokens.some(token => (' ' + text + ' ').includes(' ' + token + ' '));
  if (/\b(?:welcher spieler|wen meinst|welchen spieler|which player|who do you mean|quel joueur|qué jugador|أي لاعب|شنوّة لاعب)\b/u.test(text)) return 'player_reference';
  if (hasToken('bundesliga','regionalliga','liga','league','level','spielklasse','niveau','division','championship')) return 'target_level';
  // Classify the semantic subject before the generic "A or B" choice fallback.
  if (hasToken('wo','wohin','standort','region','land','country','location','where','deutschland','international','donde','فين','وين','tunisia','tunesien','ألمانيا','تونس','فرنسا','إيطاليا','إسبانيا')) return 'location';
  if (hasToken('alt','alter','jahrgang','geburtsjahr','age','born','old','años','عمر') || /\b(?:how old|quel âge|quel age|qué edad)\b/u.test(text)) return 'age';
  if (hasToken('position','positions','rolle','role','poste','posición','مركز')) return 'position';
  if (hasToken('fuß','fuss','schussbein','preferred','foot','left','right','pied','pie','القدم')) return 'preferred_foot';
  if (/\b(?:wie viele|anzahl|quantity|how many|combien|cuántos|قداش)\b/u.test(text)) return 'quantity';
  if (hasToken('verein','mannschaft','team','club','équipe','equipo','النادي','الفريق')) return 'club_or_team';
  if (options.length > 1) return 'choice';
  if (/\b(?:soll ich|möchtest du|willst du|do you want|should i|tu veux|quieres|تحب)\b/u.test(text)) return 'yes_no';
  return 'generic';
}
function buildPendingQuestion(questionText) {
  if (!questionText) return null;
  const options = extractOptions(questionText);
  return {
    status: 'awaiting_answer',
    text: questionText,
    kind: classifyQuestionKind(questionText, options),
    options: options.slice(0, 4)
  };
}
export function classifyMessinhoClarificationReply(message, pendingQuestion = null) {
  const text = cleanText(message, 500);
  if (!pendingQuestion || pendingQuestion.status !== 'awaiting_answer') {
    return { status: 'none', answer_shape: 'none', question_kind: null, matched_option: null, confidence: 0, evidence: [] };
  }
  if (!text) return { status: 'ambiguous', answer_shape: 'empty', question_kind: pendingQuestion.kind, matched_option: null, confidence: 0, evidence: ['empty_reply'] };
  if (/[?؟]/u.test(text) || QUESTION_START_PATTERN.test(text)) {
    return { status: 'new_topic', answer_shape: 'new_question', question_kind: pendingQuestion.kind, matched_option: null, confidence: 0.95, evidence: ['question_form_not_answer'] };
  }
  const normalized = normalizeAnswer(text);
  const options = Array.isArray(pendingQuestion.options) ? pendingQuestion.options : [];
  const matches = options.filter(option => {
    const candidate = normalizeAnswer(option);
    return candidate && (normalized === candidate || normalized.startsWith(candidate + ' ') || normalized.endsWith(' ' + candidate));
  });
  if (matches.length === 1) {
    return { status: 'likely_answer', answer_shape: 'option', question_kind: pendingQuestion.kind, matched_option: matches[0], confidence: 0.98, evidence: ['exact_pending_option_match'] };
  }
  if (matches.length > 1) {
    return { status: 'ambiguous', answer_shape: 'multiple_options', question_kind: pendingQuestion.kind, matched_option: null, confidence: 0.35, evidence: ['multiple_option_matches'] };
  }
  if (options.length > 1) {
    return { status: 'ambiguous', answer_shape: 'unlisted_option', question_kind: pendingQuestion.kind, matched_option: null, confidence: 0.45, evidence: ['reply_not_in_offered_options'] };
  }
  if (/^\s*\d{1,4}(?:[.,]\d+)?(?:\s*(?:jahre?|j\.?|years?|ans?|años?|u\d{1,2}))?\s*$/iu.test(text)
      && ['age','quantity','target_level','generic'].includes(pendingQuestion.kind)) {
    return { status: 'likely_answer', answer_shape: 'numeric', question_kind: pendingQuestion.kind, matched_option: null, confidence: 0.9, evidence: ['numeric_answer_matches_question_shape'] };
  }
  if (/^(?:ja|nein|yes|no|oui|non|sí|si|إي|لا|باهي)$/iu.test(normalized)
      && ['yes_no','generic'].includes(pendingQuestion.kind)) {
    return { status: 'likely_answer', answer_shape: 'confirmation', question_kind: pendingQuestion.kind, matched_option: null, confidence: 0.94, evidence: ['bounded_confirmation_answer'] };
  }
  if (wordCount(text) <= 8) {
    return { status: 'likely_answer', answer_shape: 'short_value', question_kind: pendingQuestion.kind, matched_option: null, confidence: 0.72, evidence: ['short_non_question_reply_after_pending_question'] };
  }
  return { status: 'candidate_answer', answer_shape: 'free_text', question_kind: pendingQuestion.kind, matched_option: null, confidence: 0.58, evidence: ['free_text_after_pending_question_requires_semantic_review'] };
}
export function classifyMessinhoFollowUp(message, {assistantAwaitingAnswer = false} = {}) {
  const text = cleanText(message, 500);
  if (!text) return 'none';
  if (CONNECTOR_PATTERN.test(text)) return 'discourse_connector';
  if (/[?؟]/u.test(text) || QUESTION_START_PATTERN.test(text)) {
    return REFERENTIAL_QUESTION_PATTERN.test(text) ? 'referential_question' : 'none';
  }
  if (assistantAwaitingAnswer && wordCount(text) <= 16) return 'pending_question_reply';
  if (SHORT_FOLLOW_UP_PATTERN.test(text)) return 'short_reply';
  if (REFERENTIAL_QUESTION_PATTERN.test(text)) return 'referential_question';
  return 'none';
}
export function buildMessinhoDialogueState({message,history=[],userRole='scout',linguisticContext=null}={}) {
  const currentMessage = cleanText(message, 1200);
  const allTurns = safeHistory(history, MAX_HISTORY_WINDOW);
  const turns = allTurns.slice(-MAX_TURNS);
  const olderTurns = allTurns.slice(0, -MAX_TURNS);
  const last = turns.at(-1) || null;
  const previousUser = [...turns].reverse().find(item => item.role === 'user') || null;
  const previousAssistant = [...turns].reverse().find(item => item.role === 'assistant') || null;
  const questionText = last?.role === 'assistant' ? extractQuestionText(last.text) : null;
  const assistantAskedQuestion = Boolean(questionText);
  const pendingQuestion = assistantAskedQuestion ? buildPendingQuestion(questionText) : null;
  const clarificationReply = classifyMessinhoClarificationReply(currentMessage, pendingQuestion);
  const priorUserGoal = [...turns].reverse().find(item => item.role === 'user' && wordCount(item.text) >= 4) || null;
  const followUpSignal = classifyMessinhoFollowUp(currentMessage, {assistantAwaitingAnswer: assistantAskedQuestion});
  const olderUserGoals = olderTurns.filter(item => item.role === 'user' && wordCount(item.text) >= 4 && !SENSITIVE_CONTEXT_PATTERN.test(item.text)).slice(-3).map(item => item.text.slice(0, 360));
  const olderAssistantQuestions = olderTurns.filter(item => item.role === 'assistant' && extractQuestionText(item.text) && !SENSITIVE_CONTEXT_PATTERN.test(item.text)).slice(-2).map(item => extractQuestionText(item.text).slice(0, 240));
  const recentFocus = turns.filter(item => item.role === 'user').slice(-MAX_FOCUS).map(item => item.text);
  const language = linguisticContext?.response_language || linguisticContext?.primary_language || null;
  return {
    version: MESSINHO_DIALOGUE_ENGINE_VERSION,
    turn_number: allTurns.length + 1,
    user_role: userRole === 'admin' ? 'admin' : 'scout',
    continuity: {
      follow_up_likely: followUpSignal !== 'none',
      follow_up_signal: followUpSignal,
      reply_to_pending_question_likely: followUpSignal === 'pending_question_reply',
      assistant_awaiting_answer: assistantAskedQuestion,
      pending_assistant_question: questionText,
      pending_question: pendingQuestion,
      clarification_reply: clarificationReply,
      previous_user_message: previousUser?.text || null,
      previous_assistant_message: previousAssistant?.text || null,
      prior_user_goal_candidate: priorUserGoal?.text || null,
      referent_resolution: 'not_performed'
    },
    recent_user_focus: recentFocus,
    older_context: {
      user_goal_candidates: olderUserGoals,
      historical_assistant_questions: olderAssistantQuestions,
      summary_policy: 'Extractive excerpts only; historical questions are not assumed to be pending.'
    },
    response_language_hint: typeof language === 'string' ? language.slice(0, 20) : null,
    evidence_policy: 'Extractive conversation clues only; not verified facts, permissions, or durable memory.'
  };
}
export function validateMessinhoDialogueState(value) {
  if (!value || typeof value !== 'object' || value.version !== MESSINHO_DIALOGUE_ENGINE_VERSION) return false;
  if (!Number.isInteger(value.turn_number) || value.turn_number < 1) return false;
  if (!['admin', 'scout'].includes(value.user_role)) return false;
  if (!value.continuity || typeof value.continuity !== 'object') return false;
  if (typeof value.continuity.follow_up_likely !== 'boolean') return false;
  if (!['none','discourse_connector','referential_question','short_reply','pending_question_reply'].includes(value.continuity.follow_up_signal)) return false;
  if (typeof value.continuity.assistant_awaiting_answer !== 'boolean') return false;
  const pending=value.continuity.pending_question;
  if(pending!==null){
    if(!pending||pending.status!=='awaiting_answer'||typeof pending.text!=='string'||pending.text.length>MAX_QUESTION_TEXT)return false;
    if(!['player_reference','target_level','location','age','position','preferred_foot','quantity','club_or_team','choice','yes_no','generic'].includes(pending.kind))return false;
    if(!Array.isArray(pending.options)||pending.options.length>4)return false;
  }
  const clarification=value.continuity.clarification_reply;
  if(!clarification||!['none','likely_answer','ambiguous','candidate_answer','new_topic'].includes(clarification.status))return false;
  if(!['none','option','multiple_options','unlisted_option','numeric','confirmation','short_value','free_text','empty','new_question'].includes(clarification.answer_shape))return false;
  if(typeof clarification.confidence!=='number'||clarification.confidence<0||clarification.confidence>1)return false;
  if(!Array.isArray(value.recent_user_focus)||value.recent_user_focus.length>MAX_FOCUS)return false;
  if(!value.older_context||!Array.isArray(value.older_context.user_goal_candidates)||value.older_context.user_goal_candidates.length>3)return false;
  if(!Array.isArray(value.older_context.historical_assistant_questions)||value.older_context.historical_assistant_questions.length>2)return false;
  return value.evidence_policy==='Extractive conversation clues only; not verified facts, permissions, or durable memory.';
}
