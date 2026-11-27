/**
 * MESSINHO Conversation Evaluation Engine.
 * Deterministic contract checks only; subjective dialogue quality remains human/model-reviewed.
 */
export const MESSINHO_EVALUATION_VERSION = '1.0.0';

const asText = value => typeof value === 'string' ? value.trim() : '';

export function evaluateMessinhoConversationCase(testCase, actual = {}) {
  const failures = [];
  const checks = [];
  const add = (name, passed, detail = '') => {
    checks.push({ name, passed: Boolean(passed), detail });
    if (!passed) failures.push(name);
  };

  add('case_id_present', Boolean(asText(testCase?.id)));
  add('assistant_response_present', Boolean(asText(actual.response)));

  if (testCase?.expected?.response_language) {
    add(
      'response_language_matches',
      asText(actual.responseLanguage).toLowerCase() === asText(testCase.expected.response_language).toLowerCase(),
      `expected=${testCase.expected.response_language}; actual=${actual.responseLanguage ?? 'missing'}`
    );
  }

  if (Array.isArray(testCase?.expected?.must_include_context)) {
    const context = Array.isArray(actual.contextUsed) ? actual.contextUsed.map(asText) : [];
    for (const token of testCase.expected.must_include_context) {
      add(`context_retained:${token}`, context.includes(token));
    }
  }

  if (testCase?.expected?.must_ask_clarification === true) {
    add('clarification_required', actual.askedClarification === true);
  }
  if (testCase?.expected?.must_not_execute_tools === true) {
    add('tool_execution_blocked', actual.toolExecutions === 0);
  }
  if (testCase?.expected?.must_reset_topic === true) {
    add('topic_context_reset', actual.previousTopicUsed !== true);
  }
  if (testCase?.expected?.language_isolation === true) {
    const segments = Array.isArray(actual.languageSegments) ? actual.languageSegments : [];
    add('language_segments_isolated', segments.length >= 2 && segments.every(s =>
      typeof s.language === 'string' && Array.isArray(s.tokens)
    ));
  }

  const subjective = ['naturalness', 'relevance', 'coherence', 'tone', 'linguistic_fluency'];
  return {
    evaluation_version: MESSINHO_EVALUATION_VERSION,
    case_id: asText(testCase?.id),
    passed: failures.length === 0,
    checks,
    failures,
    subjective_review: Object.fromEntries(subjective.map(key => [key, 'not_automatically_scored'])),
    requires_human_review: true
  };
}

export function summarizeMessinhoEvaluation(results = []) {
  const total = results.length;
  const passed = results.filter(result => result?.passed === true).length;
  const failed = total - passed;
  const failures = {};
  for (const result of results) {
    for (const name of result?.failures ?? []) failures[name] = (failures[name] ?? 0) + 1;
  }
  return {
    evaluation_version: MESSINHO_EVALUATION_VERSION,
    total,
    passed,
    failed,
    pass_rate: total === 0 ? 0 : Number((passed / total).toFixed(4)),
    recurring_failures: Object.entries(failures).sort((a, b) => b[1] - a[1]).map(([check, count]) => ({ check, count })),
    subjective_quality_status: 'human_review_required'
  };
}
