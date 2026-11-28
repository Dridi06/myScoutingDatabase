import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMessinhoSentenceStructure, getMessinhoSentenceStructureSummary } from '../backend/messinho-sentence-structure.js';

test('exposes bounded sentence structure support for all six language profiles', () => {
  assert.deepEqual(getMessinhoSentenceStructureSummary().languages, ['de','en','fr','es','ar','ar-tn']);
});

test('identifies German subordinate clause and finite-verb-final candidate without rewriting', () => {
  const source = 'Ich denke, weil der Spieler heute trainiert.';
  const result = analyzeMessinhoSentenceStructure(source, 'de');
  assert.equal(result.status, 'analyzed');
  assert.ok(result.sentences[0].clauses.some(clause => clause.clause_type === 'subordinate'));
  assert.ok(result.sentences[0].clauses.some(clause => clause.word_order_evidence === 'finite_verb_final_candidate'));
  assert.equal(source, 'Ich denke, weil der Spieler heute trainiert.');
  assert.equal(result.source_preserved, true);
});

test('extracts English subject and verb candidates conservatively', () => {
  const result = analyzeMessinhoSentenceStructure('The player is ready because he trains.', 'en');
  const clauses = result.sentences[0].clauses;
  assert.ok(clauses.some(clause => clause.subject_candidate === 'player'));
  assert.ok(clauses.some(clause => clause.marker === 'because'));
  assert.ok(clauses.some(clause => clause.finite_verb_candidate === 'trains'));
});

test('keeps Tunisian Derja subordinate markers separate from MSA', () => {
  const result = analyzeMessinhoSentenceStructure('Ena nheb nal3ab 5ater n7eb el equipe.', 'ar-tn');
  assert.ok(result.sentences[0].clauses.some(clause => clause.marker === '5ater'));
  assert.equal(analyzeMessinhoSentenceStructure('اللاعب يلعب اليوم', 'ar').language_id, 'ar');
});

test('returns safe states for empty and unsupported input', () => {
  assert.equal(analyzeMessinhoSentenceStructure('', 'de').status, 'empty');
  assert.equal(analyzeMessinhoSentenceStructure('hello there', 'it').status, 'unsupported_language');
});
