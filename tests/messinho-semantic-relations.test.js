import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MESSINHO_SEMANTIC_RELATION_VERSION,
  buildMessinhoSemanticRelationAnalysis
} from '../backend/messinho-semantic-relations.js';

test('builds a bounded qualification candidate without claiming exact negation scope', () => {
  const result = buildMessinhoSemanticRelationAnalysis([{
    concepts: ['performance_quality', 'player_readiness'],
    cues: { negation_scope_cues: ['not_bad'], uncertainty_cues: ['uncertainty'] }
  }]);
  assert.equal(result.version, MESSINHO_SEMANTIC_RELATION_VERSION);
  assert.equal(result.status, 'candidate_relations_found');
  assert.equal(result.relations[0].type, 'qualification_candidate');
  assert.deepEqual(result.relations[0].concepts, ['performance_quality', 'player_readiness']);
  assert.equal(result.relations[0].scope, 'segment_level_unresolved');
  assert.equal(result.source_text_preserved, true);
});

test('connects adjacent multilingual frames only when an explicit contrast cue exists', () => {
  const result = buildMessinhoSemanticRelationAnalysis([
    { concepts: ['player_readiness'], cues: {} },
    { concepts: ['development'], cues: { contrast_cues: ['contrast'] }, language_id: 'fr' }
  ]);
  assert.ok(result.relations.some(relation =>
    relation.type === 'contrast_candidate' &&
    relation.from_frame_index === 0 &&
    relation.to_frame_index === 1
  ));
});

test('detects repeated concepts across segments as topic continuity candidates', () => {
  const result = buildMessinhoSemanticRelationAnalysis([
    { concepts: ['player_readiness'], cues: {} },
    { concepts: ['player_readiness', 'development'], cues: {} }
  ]);
  assert.ok(result.relations.some(relation =>
    relation.type === 'concept_recurrence_candidate' &&
    relation.concepts.includes('player_readiness')
  ));
});

test('rejects unknown concepts, malformed frames and excessive input safely', () => {
  const result = buildMessinhoSemanticRelationAnalysis([
    null,
    { concepts: ['invented_fact', 'capability'], cues: { negation_scope_cues: ['not_yet'] } },
    ...Array.from({ length: 20 }, () => ({ concepts: ['availability'], cues: {} }))
  ]);
  assert.ok(result.relations.every(relation =>
    !JSON.stringify(relation).includes('invented_fact')
  ));
  assert.ok(result.relations.length <= 30);
  assert.equal(result.source_text_preserved, true);
});

test('returns a clear empty state when no semantic frames are supplied', () => {
  const result = buildMessinhoSemanticRelationAnalysis(null);
  assert.equal(result.status, 'no_supported_relations');
  assert.equal(result.relation_count, 0);
  assert.deepEqual(result.relations, []);
});
