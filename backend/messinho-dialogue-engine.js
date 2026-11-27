/**
 * MESSINHO Dialogue Engine — bounded, extractive conversation-state builder.
 * It does not infer facts, resolve pronouns conclusively, or persist memory.
 * It packages recent conversational signals for the semantic cognitive router.
 */
export const MESSINHO_DIALOGUE_ENGINE_VERSION = '1.0.0';
const MAX_TEXT = 900;
const MAX_TURNS = 12;
const MAX_FOCUS = 4;
const FOLLOW_UP_PATTERN = /(?:^|\\b)(?:und|aber|also|dann|danach|davon|dazu|damit|darauf|deshalb|warum|wieso|weshalb|wie|welcher|welche|welches|der|die|das|er|sie|es|ihn|ihm|dort|diese|dieser|dieses|nochmal|weiter|genau|ja|nein|stimmt|okay|ok|and|but|then|that|this|it|they|he|she|why|how|which|what about|continue|more|again|ça|cela|il|elle|pourquoi|comment|ensuite|et|mais|ذلك|هذا|هذه|هو|هي|لماذا|كيف|وبعد|شنوة|شنو|علاش|توا|باهي|إي|لا)(?:$|\\b)/iu;
const QUESTION_PATTERN = /[?؟]|\\b(?:welche|welcher|welches|was|wer|wie|warum|wieso|wo|wann|which|what|who|how|why|where|when|pourquoi|comment|quoi|qui|وين|علاش|شنوة|شنو)\\b/iu;
function cleanText(value, max = MAX_TEXT) {
  return String(value ?? '').replace(/[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]/gu, '').trim().slice(0, max);
}
function safeHistory(history) {
  return (Array.isArray(history) ? history : []).slice(-MAX_TURNS).map(item => ({
    role: item?.role === 'assistant' ? 'assistant' : item?.role === 'user' ? 'user' : null,
    text: cleanText(item?.text, MAX_TEXT)
  })).filter(item => item.role && item.text);
}
function wordCount(value) {
  return cleanText(value).split(/\\s+/u).filter(Boolean).length;
}
function isLikelyFollowUp(message) {
  const text = cleanText(message, 500);
  if (!text) return false;
  return FOLLOW_UP_PATTERN.test(text) || (wordCount(text) <= 5 && /^(?:ja|nein|ok|okay|genau|weiter|warum|wieso|and|but|yes|no|more|again|oui|non|باهي|إي|لا)$/iu.test(text));
}
export function buildMessinhoDialogueState({message,history=[],userRole='scout',linguisticContext=null}={}) {
  const currentMessage = cleanText(message, 1200);
  const turns = safeHistory(history);
  const last = turns.at(-1) || null;
  const previousUser = [...turns].reverse().find(item => item.role === 'user') || null;
  const previousAssistant = [...turns].reverse().find(item => item.role === 'assistant') || null;
  const assistantAskedQuestion = Boolean(last?.role === 'assistant' && QUESTION_PATTERN.test(last.text));
  const priorUserGoal = [...turns].reverse().find(item => item.role === 'user' && wordCount(item.text) >= 4) || null;
  const followUpLikely = isLikelyFollowUp(currentMessage);
  const recentFocus = turns.filter(item => item.role === 'user').slice(-MAX_FOCUS).map(item => item.text);
  const language = linguisticContext?.response_language || linguisticContext?.primary_language || null;
  return {
    version: MESSINHO_DIALOGUE_ENGINE_VERSION,
    turn_number: turns.length + 1,
    user_role: userRole === 'admin' ? 'admin' : 'scout',
    continuity: {
      follow_up_likely: followUpLikely,
      assistant_awaiting_answer: assistantAskedQuestion,
      pending_assistant_question: assistantAskedQuestion ? last.text : null,
      previous_user_message: previousUser?.text || null,
      previous_assistant_message: previousAssistant?.text || null,
      prior_user_goal_candidate: priorUserGoal?.text || null,
      referent_resolution: 'not_performed'
    },
    recent_user_focus: recentFocus,
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
  if (typeof value.continuity.assistant_awaiting_answer !== 'boolean') return false;
  if (!Array.isArray(value.recent_user_focus) || value.recent_user_focus.length > MAX_FOCUS) return false;
  return value.evidence_policy === 'Extractive conversation clues only; not verified facts, permissions, or durable memory.';
}
