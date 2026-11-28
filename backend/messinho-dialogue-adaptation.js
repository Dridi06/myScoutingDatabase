/**
 * MESSINHO Dialogue Adaptation — bounded, request-local conversation maturity hints.
 * Coordinates existing dialogue signals; does not duplicate memory, resolve facts,
 * infer hidden emotions, authorize actions, or persist a user profile.
 */
export const MESSINHO_DIALOGUE_ADAPTATION_VERSION = '1.0.0';
const MAX_TEXT = 360;
const SENSITIVE = /(?:password|api[ _-]?key|access[ _-]?token|secret|private[ _-]?key|krank(?:heit|en)?|diagnos(?:e|ed)|medikament|therapie|depress(?:ion|iv)|diabetes|blutdruck|religion|muslim|islam|christ(?:entum|lich)|j[uü]disch|polit(?:ik|ische partei)|wahlentscheidung|ethn(?:ie|isch)|sexuell(?:e|er)? orientierung|homosexuell|straf(?:tat|verfahren)|vorstrafe)/iu;
const DETAIL = /\b(?:ausführlich|detailliert|im detail|schritt für schritt|genauer erklären|deep dive|in depth|detailed|step by step|en détail|detalladamente)\b/iu;
const BRIEF = /\b(?:kurz|knapp|in einem satz|stichpunkte|nur das ergebnis|kurzfassung|briefly|short answer|concise|résumé bref|brevemente)\b/iu;
const CORRECTION = /\b(?:nein[, ]+(?:ich meinte|nicht)|ich meinte|gemeint habe ich|das stimmt nicht|nicht den|nicht die|nicht das|sondern|i meant|not that|that's not what|je voulais dire|no quise decir|موش هذا|موش هكا)\b/iu;
function clean(value, max = MAX_TEXT) {
  const text = String(value ?? '').replace(/[\u0000-\u001f\u007f]/gu, ' ').replace(/\s+/gu, ' ').trim().slice(0, max);
  return text && !SENSITIVE.test(text) ? text : '';
}
function words(value) {
  return new Set(clean(value, 1200).toLocaleLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]{3,}/gu) || []);
}
function overlap(left, right) {
  const a = words(left), b = words(right);
  if (!a.size || !b.size) return 0;
  let common = 0;
  for (const token of a) if (b.has(token)) common += 1;
  return common / Math.max(1, Math.min(a.size, b.size));
}
export function buildMessinhoDialogueAdaptationContext({
  message, history = [], dialogueState = null, continuityContext = null,
  clarificationContinuity = null, conversationMemoryContext = null,
  pragmaticContext = null, responseIntelligenceContext = null, linguisticContext = null
} = {}) {
  const current = clean(message, 1200);
  const turns = (Array.isArray(history) ? history : []).slice(-12)
    .filter(item => ['user', 'assistant'].includes(item?.role))
    .map(item => ({ role: item.role, text: clean(item.text, MAX_TEXT) })).filter(item => item.text);
  const priorAssistant = turns.filter(item => item.role === 'assistant').slice(-3);
  const priorUser = turns.filter(item => item.role === 'user').slice(-3);
  const relation = ['new_topic', 'correction', 'follow_up', 'standalone'].includes(continuityContext?.relation) ? continuityContext.relation : 'standalone';
  const clarificationStatus = ['none', 'likely_answer', 'ambiguous', 'candidate_answer', 'new_topic', 'missing_goal'].includes(clarificationContinuity?.status) ? clarificationContinuity.status : 'none';
  const explicitAct = clean(pragmaticContext?.primary_act || pragmaticContext?.act, 40);
  const explicitCorrection = relation === 'correction' || CORRECTION.test(current);
  const explicitDetail = DETAIL.test(current), explicitBrief = BRIEF.test(current);
  const topicChanged = relation === 'new_topic' || clarificationStatus === 'new_topic';
  const pendingQuestion = clarificationContinuity?.question || dialogueState?.continuity?.pending_assistant_question || null;
  const referents = Array.isArray(continuityContext?.referent_candidates) ? continuityContext.referent_candidates.slice(0, 2).filter(item => clean(item?.text, 180)) : [];
  const repeatedPriorTopic = priorAssistant.some(item => overlap(current, item.text) >= 0.72);
  const strategy = topicChanged ? 'follow_new_topic_without_old_filters'
    : explicitCorrection ? 'acknowledge_and_reassess_correction'
      : clarificationStatus === 'ambiguous' ? 'ask_one_focused_clarification'
        : clarificationStatus === 'likely_answer' || clarificationStatus === 'candidate_answer' ? 'connect_candidate_answer_to_open_question'
          : referents.length > 1 ? 'resolve_competing_referents_before_assuming'
            : relation === 'follow_up' ? 'continue_the_existing_conversation_naturally'
              : 'respond_to_the_current_point_directly';
  const responseLanguage = clean(linguisticContext?.response_language || linguisticContext?.primary_language, 24) || null;
  const recentCovered = priorAssistant.map(item => item.text).slice(-2);
  return {
    version: MESSINHO_DIALOGUE_ADAPTATION_VERSION,
    mode: 'request_local_adaptation_hints',
    conversation_maturity: {
      relation, topic_changed: topicChanged, correction_detected: explicitCorrection,
      follow_up_likely: relation === 'follow_up' || dialogueState?.continuity?.follow_up_likely === true,
      pending_question_status: clarificationStatus, explicit_pragmatic_act: explicitAct || null
    },
    adaptation: {
      response_strategy: strategy,
      detail_level: explicitDetail ? 'detailed' : explicitBrief ? 'concise' : 'balanced',
      tone: 'respectful_direct_natural',
      language_to_preserve: responseLanguage,
      acknowledge_before_explaining: explicitCorrection || ['disagreement', 'explicit_emotion'].includes(explicitAct),
      avoid_empty_acknowledgements: !explicitCorrection && !['greeting', 'gratitude'].includes(explicitAct),
      avoid_repeating_recent_points: true,
      recently_covered_assistant_points: topicChanged ? [] : recentCovered,
      user_repeated_topic_signal: repeatedPriorTopic,
      maximum_follow_up_questions: 1, ask_only_if_material: true
    },
    continuity: {
      pending_question: !topicChanged && typeof pendingQuestion === 'string' ? clean(pendingQuestion, 220) || null : null,
      referent_candidates: !topicChanged ? referents.map(item => ({
        text: clean(item.text, 180), source: item.source === 'prior_user_message' ? 'prior_user_message' : 'prior_assistant_message'
      })) : [],
      recent_user_topic_candidates: topicChanged ? [] : priorUser.map(item => item.text).slice(-2)
    },
    policy: 'Hints only. Do not infer hidden emotions, user identity, verified facts, preferences or authorization. Explicit current instructions override inferred style. A new topic inherits no old task filters. Never repeat prior assistant content unless needed to answer the current request.',
    persistence: 'not_persisted', bounded: true
  };
}
