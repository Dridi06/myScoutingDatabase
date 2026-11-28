import { isSensitiveMessinhoMemoryText } from './messinho-conversational-intelligence.js';

export const MESSINHO_CONVERSATION_MEMORY_VERSION = '1.1.0';
const MAX_ITEMS = 8;
const MAX_ITEM_LENGTH = 260;
const MAX_TOTAL_LENGTH = 1600;
const MAX_FRAME_TEXT = 360;
const TOPIC_CHANGE = /\b(?:anderes thema|unabhängig davon|unabhaengig davon|jetzt etwas anderes|neues thema|by the way|unrelated|new topic|autre sujet|por cierto|موضوع آخر|سؤال آخر)\b/iu;
const CORRECTION = /\b(?:nein[, ]+(?:ich meinte|nicht)|ich meinte|gemeint habe ich|das stimmt nicht|nicht den|nicht die|nicht das|sondern|i meant|not that|that's not what|je voulais dire|no quise decir|موش هذا|موش هكا)\b/iu;
const SHORT_REPLY = /^(?:(?:ja|nein|ok|okay|genau|weiter|stimmt|richtig|yes|no|more|again|continue|right|exactly|oui|non|encore|sí|vale|إي|لا|باهي)|und weiter|und wie|wie geht(?:'|’)s weiter)[.!؟?]*$/iu;
const CONTINUATION = /^\s*(?:und|aber|also|dann|danach|davon|dazu|damit|darauf|deshalb|außerdem|zudem|weiter|nochmal|and|but|then|also|what about|how about|et|mais|alors|ensuite|en plus|y|pero|entonces|adem[aá]s|وبعد|وزيد|أما|شنوة|شنو|علاش|توا)\b/iu;

function clean(value, max = MAX_FRAME_TEXT) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/gu, ' ').replace(/\s+/gu, ' ').trim().slice(0, max);
}
function safeText(value, max) {
  const text = clean(value, max);
  return text && !isSensitiveMessinhoMemoryText(text) ? text : null;
}
function buildActiveFrame({ history, currentMessage, dialogueState, continuityContext }) {
  const turns = (Array.isArray(history) ? history : []).slice(-60)
    .filter(item => ['user', 'assistant'].includes(item?.role))
    .map(item => ({ role: item.role, text: safeText(item.text, MAX_FRAME_TEXT) }))
    .filter(item => item.text);
  const current = safeText(currentMessage, MAX_FRAME_TEXT);
  const currentIsTopicChange = Boolean(current && TOPIC_CHANGE.test(current));
  const currentIsCorrection = Boolean(current && CORRECTION.test(current));
  let boundary = -1;
  for (let index = 0; index < turns.length; index += 1) {
    if (turns[index].role === 'user' && TOPIC_CHANGE.test(turns[index].text)) boundary = index;
  }
  const inScope = turns.slice(boundary + 1);
  const priorGoal = [...inScope].reverse().find(item => item.role === 'user' && item.text.length > 12 && !SHORT_REPLY.test(item.text))?.text || null;
  const activeTopic = currentIsTopicChange
    ? current
    : currentIsCorrection
      ? current
      : current && !SHORT_REPLY.test(current) && !CONTINUATION.test(current)
        ? current
        : priorGoal;
  const isFollowUp = Boolean(current && (SHORT_REPLY.test(current) || FOLLOW_UP.test(current)));\n  const relation = currentIsTopicChange ? 'new_topic' : currentIsCorrection ? 'correction' : isFollowUp ? 'follow_up' : current ? 'current_turn' : 'history_only';
  const clarification = dialogueState?.continuity?.clarification_reply;
  const pending = dialogueState?.continuity?.pending_question;
  let pendingQuestion = null;
  if (!currentIsTopicChange && pending?.status === 'awaiting_answer' && typeof pending.text === 'string') {
    const status = clarification?.status === 'likely_answer' || clarification?.status === 'candidate_answer'
      ? 'answer_candidate_received'
      : clarification?.status === 'ambiguous'
        ? 'needs_clarification'
        : 'awaiting_user_reply';
    pendingQuestion = {
      status,
      question: clean(pending.text, 220),
      current_reply: status === 'awaiting_user_reply' ? null : current,
      answer_requires_semantic_confirmation: status !== 'awaiting_user_reply'
    };
  }
  const referents = Array.isArray(continuityContext?.referent_candidates)
    ? continuityContext.referent_candidates.slice(0, 2).map(item => ({
      source: item.source === 'prior_user_message' ? 'prior_user_message' : 'prior_assistant_message',
      authority: item.authority === 'user_stated_context' ? 'user_stated_context' : 'assistant_hypothesis_or_question',
      text: safeText(item.text, 220)
    })).filter(item => item.text)
    : [];
  const needsReferentClarification = Boolean(continuityContext?.referential_expression_detected && referents.length > 1);
  return {
    version: '1.1.0',
    scope: 'owner_conversation',
    source: 'bounded_extractive_active_frame',
    relation,
    active_topic_candidate: activeTopic,
    active_goal_authority: activeTopic ? 'user_message_candidate_not_verified_fact' : 'none',
    pending_question: pendingQuestion,
    referent_candidates: needsReferentClarification ? referents : [],
    referent_resolution: needsReferentClarification ? 'clarification_required_if_candidates_conflict' : 'not_resolved_by_memory',
    confirmed_user_constraints: [],
    constraint_policy: 'No constraints are promoted from assistant suggestions. Extract and confirm constraints in the semantic turn; corrections supersede contradicted assumptions.',
    turn_window: Math.min(60, turns.length),
    persistence: 'derived_per_request_not_persisted',
    bounded: true
  };
}

export function buildMessinhoConversationMemory({
  history = [],
  conversationId = null,
  currentMessage = null,
  dialogueState = null,
  continuityContext = null
} = {}) {
  const safe = (Array.isArray(history) ? history : [])
    .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.text === 'string' && item.text.trim())
    .slice(-40);
  const items = [];
  let total = 0;
  for (const entry of safe.slice().reverse()) {
    const text = entry.text.replace(/\s+/gu, ' ').trim().slice(0, MAX_ITEM_LENGTH);
    if (!text || isSensitiveMessinhoMemoryText(text)) continue;
    const normalized = text.toLocaleLowerCase('de-DE');
    if (items.some(item => item.normalized === normalized) || items.length >= MAX_ITEMS || total + text.length > MAX_TOTAL_LENGTH) continue;
    items.push({ role: entry.role, text, normalized });
    total += text.length;
  }
  items.reverse();
  const activeFrame = buildActiveFrame({ history: safe, currentMessage, dialogueState, continuityContext });
  return {
    version: MESSINHO_CONVERSATION_MEMORY_VERSION,
    scope: 'owner_conversation',
    conversation_id: typeof conversationId === 'string' ? conversationId : null,
    source: 'persisted_conversation_messages',
    message_count: safe.length,
    items: items.map(({ role, text }) => ({ role, text })),
    active_frame: activeFrame,
    bounded: true,
    persisted_summary: false
  };
}

export function formatMessinhoConversationMemory(memory) {
  if (!memory || !Array.isArray(memory.items)) return null;
  if (!memory.items.length && !memory.active_frame?.active_topic_candidate && !memory.active_frame?.pending_question) return null;
  return {
    scope: memory.scope,
    source: memory.source,
    message_count: memory.message_count,
    items: memory.items.slice(-MAX_ITEMS),
    active_frame: memory.active_frame || null
  };
}
