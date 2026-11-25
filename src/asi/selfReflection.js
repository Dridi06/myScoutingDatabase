/**
 * ASI Self-Reflection Engine
 *
 * Deterministic quality-control layer for scouting assessments.
 * It does not invent football facts or silently rewrite ratings. It checks
 * evidence quality, internal consistency and longitudinal comparability,
 * then emits reviewable findings for a Scout/Admin or later model evaluator.
 */

export const SELF_REFLECTION_VERSION = 'asi_self_reflection@0.1.0';

const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Inspect a structured assessment without changing it.
 * Expected optional fields:
 * { ratings: { [criterion]: 1..5 }, roleFits: [{ roleName, fit, coverage,
 *   weighted, available, total, strengths: [{label,value}], gaps: [...] }],
 *   metadata: { ratingScale: '1-5', position, observedAt } }
 */
export function reflectOnAssessment(assessment = {}) {
  const findings = [];
  const ratings = assessment.ratings && typeof assessment.ratings === 'object'
    ? assessment.ratings
    : {};
  const entries = Object.entries(ratings);
  const valid = entries.filter(([, value]) => isFiniteNumber(value) && value >= 1 && value <= 5);
  const invalid = entries.filter(([, value]) => !isFiniteNumber(value) || value < 1 || value > 5);
  const coverage = entries.length ? valid.length / entries.length : 0;

  if (!entries.length) findings.push({
    code: 'NO_RATINGS', severity: 'blocking', message: 'Keine Ratingdaten vorhanden; eine fachliche Bewertung ist nicht möglich.'
  });
  if (invalid.length) findings.push({
    code: 'INVALID_RATING_VALUES', severity: 'blocking',
    message: 'Mindestens ein Rating liegt außerhalb der dokumentierten Skala 1–5 oder ist nicht numerisch.',
    criteria: invalid.map(([criterion]) => criterion)
  });
  if (entries.length && coverage < 0.6) findings.push({
    code: 'LOW_RATING_COVERAGE', severity: 'warning',
    message: 'Die Datenabdeckung ist zu gering für eine belastbare Gesamteinschätzung.',
    coverage: Number(coverage.toFixed(3))
  });

  const scale = assessment.metadata?.ratingScale;
  if (scale && scale !== '1-5') findings.push({
    code: 'RATING_SCALE_MISMATCH', severity: 'blocking',
    message: 'Die Rating-Skalenversion passt nicht zur aktuell unterstützten 1–5-Auswertungslogik.',
    reportedScale: scale,
    expectedScale: '1-5'
  });

  const roleFits = Array.isArray(assessment.roleFits) ? assessment.roleFits : [];
  for (const role of roleFits) {
    if (isFiniteNumber(role.fit) && (role.fit < 0 || role.fit > 100)) {
      findings.push({ code: 'ROLE_FIT_OUT_OF_RANGE', severity: 'blocking', roleName: role.roleName || null });
    }
    if (isFiniteNumber(role.coverage) && (role.coverage < 0 || role.coverage > 100)) {
      findings.push({ code: 'ROLE_COVERAGE_OUT_OF_RANGE', severity: 'blocking', roleName: role.roleName || null });
    }
    const strengthContradictions = (role.strengths || []).filter(item =>
      isFiniteNumber(item.value) && item.value < 4
    );
    const gapContradictions = (role.gaps || []).filter(item =>
      isFiniteNumber(item.value) && item.value > 2
    );
    if (strengthContradictions.length || gapContradictions.length) {
      findings.push({
        code: 'ROLE_LABEL_CONTRADICTION', severity: 'warning',
        roleName: role.roleName || null,
        criteria: [...strengthContradictions, ...gapContradictions].map(item => item.label)
      });
    }
    if (isFiniteNumber(role.available) && isFiniteNumber(role.total) && role.available > role.total) {
      findings.push({ code: 'ROLE_COVERAGE_COUNT_INVALID', severity: 'blocking', roleName: role.roleName || null });
    }
  }

  const blocking = findings.filter(item => item.severity === 'blocking').length;
  const warnings = findings.filter(item => item.severity === 'warning').length;
  const status = blocking ? 'review_required' : warnings ? 'caution' : 'consistent';
  return {
    engineVersion: SELF_REFLECTION_VERSION,
    status,
    confidenceCeiling: status === 'review_required' ? 0.25 : status === 'caution' ? 0.6 : clamp(coverage, 0, 1),
    coverage: Number(coverage.toFixed(3)),
    ratingCount: entries.length,
    validRatingCount: valid.length,
    findings
  };
}

/**
 * Compare an incumbent and candidate on the same evaluation cohort.
 * Lower error is better. Candidate promotion is never automatic: this only
 * returns a recommendation and requires minimum sample and a meaningful gain.
 */
export function compareModelCandidates({
  incumbentMae,
  candidateMae,
  matchedOutcomes = 0,
  minimumOutcomes = 30,
  minimumRelativeImprovement = 0.03,
  incumbentVersion = null,
  candidateVersion = null
} = {}) {
  const validMetrics = isFiniteNumber(incumbentMae) && incumbentMae >= 0 &&
    isFiniteNumber(candidateMae) && candidateMae >= 0;
  const relativeImprovement = validMetrics && incumbentMae > 0
    ? (incumbentMae - candidateMae) / incumbentMae
    : null;
  const enoughData = Number.isInteger(matchedOutcomes) && matchedOutcomes >= minimumOutcomes;
  const improved = validMetrics && relativeImprovement !== null &&
    relativeImprovement >= minimumRelativeImprovement;
  return {
    incumbentVersion,
    candidateVersion,
    matchedOutcomes,
    minimumOutcomes,
    incumbentMae: validMetrics ? incumbentMae : null,
    candidateMae: validMetrics ? candidateMae : null,
    relativeImprovement: relativeImprovement === null ? null : Number(relativeImprovement.toFixed(4)),
    recommendation: enoughData && improved ? 'eligible_for_human_approval' : 'do_not_promote',
    reasons: [
      ...(!validMetrics ? ['Ungültige oder fehlende Fehlerkennzahlen.'] : []),
      ...(!enoughData ? ['Zu wenige verifizierte Prognose-Outcomes.'] : []),
      ...(validMetrics && !improved ? ['Kandidat erreicht die geforderte Mindestverbesserung nicht.'] : [])
    ],
    automaticPromotion: false
  };
}

/**
 * Detect a simple directional contradiction between two dated observations.
 * This is a signal for review, not proof that either scout was wrong.
 */
export function reflectOnObservedChange(previous = {}, latest = {}) {
  const before = previous.ratings || {};
  const after = latest.ratings || {};
  const common = Object.keys(before).filter(key =>
    isFiniteNumber(before[key]) && isFiniteNumber(after[key]) &&
    before[key] >= 1 && before[key] <= 5 && after[key] >= 1 && after[key] <= 5
  );
  const changes = common.map(criterion => ({
    criterion, previous: before[criterion], latest: after[criterion],
    delta: after[criterion] - before[criterion]
  }));
  const changed = changes.filter(item => item.delta !== 0);
  return {
    comparableCriteria: common.length,
    changedCriteria: changed.length,
    averageDelta: changes.length
      ? Number((changes.reduce((sum, item) => sum + item.delta, 0) / changes.length).toFixed(2))
      : null,
    requiresReview: common.length < 5,
    findings: common.length < 5
      ? ['Zu wenige übereinstimmende Kriterien für eine belastbare Entwicklungsbewertung.']
      : []
  };
}
