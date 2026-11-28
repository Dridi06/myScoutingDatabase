/**
 * MESSINHO Context Intelligence — prioritized, source-attributed turn context.
 * Candidate context only: no facts are verified, no memory is persisted, and no
 * permission or action is granted by this module.
 */
export const MESSINHO_CONTEXT_INTELLIGENCE_VERSION = '1.0.0';

const MAX_TEXT = 260;
const MAX_TURNS = 12;
const MAX_CANDIDATES = 5;
const clean = (value, max = MAX_TEXT) => String(value ?? '')
  .replace(/[\\u0000-\\u001f\\u007f]/gu, ' ').replace(/\\s+/gu, ' ').trim().slice(0, max);
const safeRole = role => role === 'assistant' ? 'assistant' : role === 'user' ? 'user' : null;
const safeTurn = item => {
  const role = safeRole(item?.role);
  const text = clean(item?.text, MAX_TEXT);
  return role && text ? { role, text } : null;
};

export function buildMessinhoContextIntelligence({
  message, history = [], dialogueState = null, clarificationContinuity = null,
  conversationContinuityContext = null, conversationMemoryContext = null,
  entityResolution = null, reasoningContext = null, intentEvidenceContext = null
} = {}) {
  const current = clean(message, 1200);
  const turns = (Array.isArray(history) ? history : []).slice(-MAX_TURNS).map(safeTurn).filter(Boolean);
  const latestUser = [...turns].reverse().find(item => item.role === 'user') || null;
  const latestAssistant = [...turns].reverse().find(item => item.role === 'assistant') || null;
  const relation = ['new_topic', 'correction', 'follow_up', 'standalone'].includes(conversationContinuityContext?.relation)
    ? conversationContinuityContext.relation : 'standalone';
  const clarificationStatus = ['none','likely_answer','ambiguous','candidate_answer','new_topic','missing_goal'].includes(clarificationContinuity?.status)
    ? clarificationContinuity.status : 'none';
  const dialogueContinuity = dialogueState?.continuity || {};
  const memoryFrame = conversationMemoryContext?.active_frame || {};
  const activeTopic = relation === 'new_topic' ? current
    : relation === 'correction' ? current
      : clean(memoryFrame.active_topic_candidate || conversationContinuityContext?.active_topic_candidate ||
          dialogueContinuity.prior_user_goal_candidate || latestUser?.text || current, 360) || null;
  const pendingQuestion = clarificationContinuity?.question || dialogueContinuity.pending_question?.text ||
    dialogueContinuity.pending_assistant_question || memoryFrame.pending_question?.question || null;
  const unresolvedQuestion = ['ambiguous','candidate_answer'].includes(clarificationStatus)
    ? clean(pendingQuestion, 220) : null;
  const openQuestions = [];
  if (pendingQuestion && clarificationStatus !== 'new_topic') {
    openQuestions.push({
      text: clean(pendingQuestion, 220),
      status: clarificationStatus === 'ambiguous' ? 'ambiguous'
        : clarificationStatus === 'candidate_answer' ? 'candidate_answer_received'
          : clarificationStatus === 'likely_answer' ? 'answer_candidate_received' : 'awaiting_answer',
      source: 'prior_assistant_question',
      requires_confirmation: ['ambiguous','candidate_answer','likely_answer'].includes(clarificationStatus)
    });
  }
  if (unresolvedQuestion && !openQuestions.some(item => item.text === unresolvedQuestion)) {
    openQuestions.push({ text: unresolvedQuestion, status: 'unresolved', source: 'clarification_continuity', requires_confirmation: true });
  }
  const userCandidates = turns.filter(item => item.role === 'user')
    .slice(-MAX_CANDIDATES).map(item => ({ text: item.text, source: 'user_message', authority: 'user_assertion_not_verified' }));
  const assistantCandidates = turns.filter(item => item.role === 'assistant')
    .slice(-MAX_CANDIDATES).map(item => ({ text: item.text, source: 'assistant_message', authority: 'assistant_claim_not_user_fact' }));
  const explicitAnswers = Array.isArray(clarificationContinuity?.applied_answers)
    ? clarificationContinuity.applied_answers.slice(-4).map(text => clean(text, 120)).filter(Boolean) : [];
  const entity = entityResolution && typeof entityResolution === 'object' ? {
    status: ['resolved','ambiguous','unresolved','not_applicable'].includes(entityResolution.status) ? entityResolution.status : 'not_applicable',
    reference_type: clean(entityResolution.reference_type, 40) || null,
    entity: entityResolution.entity ? {
      entity_type: clean(entityResolution.entity.entity_type, 20),
      name: clean(entityResolution.entity.name, 100),
      id: entityResolution.entity.id ?? null
    } : null,
    candidates: Array.isArray(entityResolution.candidates) ? entityResolution.candidates.slice(0, 4).map(item => ({
      entity_type: clean(item?.entity_type, 20), name: clean(item?.name, 100), id: item?.id ?? null
    })) : [],
    confidence: Number.isFinite(entityResolution.confidence) ? Math.max(0, Math.min(1, entityResolution.confidence)) : 0,
    reason: clean(entityResolution.reason, 100)
  } : null;
  const intent = intentEvidenceContext && typeof intentEvidenceContext === 'object' ? {
    status: clean(intentEvidenceContext.status, 40),
    candidate: clean(intentEvidenceContext.suggested_intent, 40) || null,
    domains: Array.isArray(intentEvidenceContext.domains) ? intentEvidenceContext.domains.slice(0, 4) : [],
    conflict: intentEvidenceContext.conflict === true
  } : null;
  const correction = relation === 'correction' ? {
    detected: true, current_user_correction: current,
    supersedes: 'contradicted_prior_interpretation_only',
    source: 'current_user_message'
  } : { detected: false, current_user_correction: null, supersedes: null, source: null };
  const topicChange = relation === 'new_topic';
  const constraintCandidates = explicitAnswers.map(text => ({
    text, source: 'user_reply_to_pending_question', status: 'candidate_not_verified'
  }));
  return {
    version: MESSINHO_CONTEXT_INTELLIGENCE_VERSION,
    priority_order: [
      'current_user_message',
      'explicit_user_correction_or_topic_change',
      'unresolved_clarification',
      'confirmed_application_authorization',
      'grounded_entity_resolution',
      'recent_user_stated_context',
      'assistant_context_as_hypothesis_only'
    ],
    current_turn: { message: current, intent_candidate: intent },
    conversation: {
      relation, active_topic_candidate: activeTopic,
      topic_changed: topicChange, correction,
      follow_up_likely: dialogueContinuity.follow_up_likely === true && !topicChange,
      pending_question: pendingQuestion ? clean(pendingQuestion, 220) : null
    },
    open_questions: openQuestions.slice(0, 3),
    confirmed_user_constraints: [],
    user_constraint_candidates: constraintCandidates.slice(0, 4),
    entity_reference: entity,
    source_attribution: {
      user_context_candidates: userCandidates,
      assistant_context_candidates: assistantCandidates,
      latest_user_message: latestUser?.text || null,
      latest_assistant_message: latestAssistant?.text || null
    },
    policy: 'Candidate context only. User statements are attributed but not independently verified. Assistant statements are never user facts. Confirmed user constraints remain empty unless a dedicated confirmation source supplies them. A correction supersedes only the contradicted interpretation. A new topic carries no prior task filters. Authorization is enforced separately by server-side controls.',
    bounded: true
  };
}
