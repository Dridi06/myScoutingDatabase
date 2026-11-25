import test from 'node:test';
import assert from 'node:assert/strict';
import {
  reflectOnAssessment,
  compareModelCandidates,
  reflectOnObservedChange
} from '../src/asi/selfReflection.js';

test('self-reflection accepts a consistent assessment without modifying ratings', () => {
  const ratings = { Dribbling: 4, 'Passspiel kurz': 3, Reflexe: 5 };
  const result = reflectOnAssessment({ ratings, metadata: { ratingScale: '1-5' } });
  assert.equal(result.status, 'consistent');
  assert.equal(result.validRatingCount, 3);
  assert.deepEqual(ratings, { Dribbling: 4, 'Passspiel kurz': 3, Reflexe: 5 });
});

test('self-reflection blocks invalid ratings and legacy scale mismatch', () => {
  const result = reflectOnAssessment({
    ratings: { Dribbling: 6, 'Passspiel kurz': 'gut' },
    metadata: { ratingScale: '1-4' }
  });
  assert.equal(result.status, 'review_required');
  assert.ok(result.findings.some(item => item.code === 'INVALID_RATING_VALUES'));
  assert.ok(result.findings.some(item => item.code === 'RATING_SCALE_MISMATCH'));
});

test('role-fit contradiction is reported for review', () => {
  const result = reflectOnAssessment({
    ratings: { Dribbling: 4, Passspiel: 4 },
    roleFits: [{ roleName: 'Testrolle', fit: 75, coverage: 100, available: 2, total: 2,
      strengths: [{ label: 'Dribbling', value: 3 }], gaps: [{ label: 'Passspiel', value: 4 }] }]
  });
  assert.equal(result.status, 'caution');
  assert.ok(result.findings.some(item => item.code === 'ROLE_LABEL_CONTRADICTION'));
});

test('candidate model is not promoted with too few outcomes', () => {
  const result = compareModelCandidates({
    incumbentMae: 0.8, candidateMae: 0.6, matchedOutcomes: 12,
    minimumOutcomes: 30
  });
  assert.equal(result.recommendation, 'do_not_promote');
  assert.equal(result.automaticPromotion, false);
});

test('candidate becomes eligible only after sample and improvement thresholds', () => {
  const result = compareModelCandidates({
    incumbentMae: 1, candidateMae: 0.9, matchedOutcomes: 50,
    minimumOutcomes: 30, minimumRelativeImprovement: 0.05
  });
  assert.equal(result.recommendation, 'eligible_for_human_approval');
  assert.equal(result.automaticPromotion, false);
});

test('longitudinal reflection flags insufficient comparable criteria', () => {
  const result = reflectOnObservedChange(
    { ratings: { Dribbling: 3, Passspiel: 3 } },
    { ratings: { Dribbling: 4, Passspiel: 3 } }
  );
  assert.equal(result.requiresReview, true);
  assert.equal(result.changedCriteria, 1);
});
