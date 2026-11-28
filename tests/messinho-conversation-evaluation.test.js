import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateMessinhoConversationCase, summarizeMessinhoEvaluation } from '../backend/messinho-conversation-evaluation.js';

const cases = JSON.parse(await readFile(new URL('./fixtures/messinho-conversation-evaluation.json', import.meta.url), 'utf8'));

test('conversation evaluation fixtures cover core dialogue dimensions', () => {
  assert.ok(cases.length >= 6);
  assert.deepEqual(new Set(cases.map(item => item.category)), new Set(['small_talk','continuity','topic_change','clarification','permissions','code_switch']));
});

test('deterministic evaluation checks language, context, clarification, tools and topic reset', () => {
  const item = cases.find(entry => entry.id === 'followup-context');
  const result = evaluateMessinhoConversationCase(item, { response:'Der zweite Punkt...', responseLanguage:'de', contextUsed:['second-point'] });
  assert.equal(result.passed, true);
  assert.equal(result.requires_human_review, true);
  assert.equal(result.subjective_review.naturalness, 'not_automatically_scored');
});

test('evaluation fails closed when required clarification or permission gate is missing', () => {
  const ambiguous = cases.find(entry => entry.id === 'ambiguous-player-search');
  const restricted = cases.find(entry => entry.id === 'role-restriction');
  assert.equal(evaluateMessinhoConversationCase(ambiguous, {response:'Okay', responseLanguage:'de'}).passed, false);
  assert.equal(evaluateMessinhoConversationCase(restricted, {response:'Erledigt', responseLanguage:'de', toolExecutions:1}).passed, false);
});

test('multilingual evaluation requires distinct structured language segments', () => {
  const item = cases.find(entry => entry.id === 'multilingual-isolation');
  assert.equal(evaluateMessinhoConversationCase(item, {response:'Gerne', languageSegments:[{language:'de',tokens:['Hallo']},{language:'ar-tn',tokens:['Aslema']}]}).passed, true);
  assert.equal(evaluateMessinhoConversationCase(item, {response:'Gerne', languageSegments:[{language:'de',tokens:['Hallo']}]}).passed, false);
});

test('evaluation summary reports recurring deterministic failures without subjective claims', () => {
  const results = [
    {passed:false, failures:['clarification_required','response_language_matches']},
    {passed:false, failures:['clarification_required']},
    {passed:true, failures:[]}
  ];
  const summary = summarizeMessinhoEvaluation(results);
  assert.equal(summary.total, 3);
  assert.equal(summary.passed, 1);
  assert.equal(summary.pass_rate, 0.3333);
  assert.deepEqual(summary.recurring_failures[0], {check:'clarification_required',count:2});
  assert.equal(summary.subjective_quality_status, 'human_review_required');
});
