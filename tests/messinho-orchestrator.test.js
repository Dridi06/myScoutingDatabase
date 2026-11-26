import test from 'node:test';
import assert from 'node:assert/strict';
import { planMessinhoCapabilities, runMessinhoCapabilityPlan, formatMessinhoCapabilityResults } from '../backend/messinho-orchestrator.js';

test('MESSINHO composes all matching analysis intents from a natural-language goal', () => {
  const plan = planMessinhoCapabilities('Bitte analysiere das Potenzial und die Entwicklung von Spieler X', 'scout');
  assert.ok(plan);
  assert.equal(plan.mode, 'goal_composed_deterministic');
  assert.ok(plan.matched_intents.includes('potential_development'));
  assert.ok(plan.matched_intents.includes('player_analysis'));
  assert.ok(plan.steps.includes('potential_analysis'));
  assert.ok(plan.steps.includes('development_projection'));
  assert.ok(plan.steps.includes('holistic_player_analysis'));
});

test('multiple user goals are composed and duplicate capabilities are removed', () => {
  const plan = planMessinhoCapabilities('Analysiere das Potenzial, vergleiche die Spieler und prüfe die Datenqualität', 'scout');
  assert.ok(plan.matched_intents.includes('potential_development'));
  assert.ok(plan.matched_intents.includes('player_analysis'));
  assert.ok(plan.matched_intents.includes('comparison'));
  assert.ok(plan.matched_intents.includes('data_quality'));
  assert.equal(new Set(plan.steps).size, plan.steps.length);
  assert.ok(plan.steps.length <= plan.max_steps);
});

test('learning and model audit chains remain admin-only', () => {
  const scoutPlan = planMessinhoCapabilities('Bitte prüfe den Lernstand und die Prognosefehler', 'scout');
  assert.equal(scoutPlan.denied, true);
  const adminPlan = planMessinhoCapabilities('Bitte prüfe den Lernstand und die Prognosefehler', 'admin');
  assert.ok(adminPlan.steps.includes('prediction_audit'));
});

test('a scout can receive allowed analysis while protected learning steps remain blocked', () => {
  const plan = planMessinhoCapabilities('Analysiere Spieler X und prüfe den Lernstand', 'scout');
  assert.equal(plan.denied, false);
  assert.ok(plan.steps.includes('holistic_player_analysis'));
  assert.ok(plan.blocked_capabilities.includes('prediction_audit'));
  assert.ok(!plan.steps.some(id => plan.blocked_capabilities.includes(id)));
});

test('execution never activates model weights and reports missing evidence honestly', () => {
  const plan = planMessinhoCapabilities('Analysiere Spieler X', 'scout');
  const run = runMessinhoCapabilityPlan(plan, { player: { name: 'Spieler X' } }, 'scout');
  assert.equal(run.provider_independent, true);
  assert.equal(run.model_weights_changed, false);
  assert.equal(run.total_steps, plan.steps.length);
  assert.ok(run.results.every(item => item.status));
  assert.ok(['completed','partial','insufficient_data'].includes(run.status));
});

test('user-facing result language does not expose internal capability input keys', () => {
  const plan = planMessinhoCapabilities('Analysiere Spieler X', 'scout');
  const run = runMessinhoCapabilityPlan(plan, { player: { name: 'Spieler X' } }, 'scout');
  const reply = formatMessinhoCapabilityResults(run, 'Spieler X');
  assert.match(reply, /Arbeitsbereiche/);
  assert.doesNotMatch(reply, /player_metrics|capability_id|holistic_player_analysis/);
});

test('unknown conversational intent does not force a capability', () => {
  assert.equal(planMessinhoCapabilities('Guten Abend Messinho', 'scout'), null);
});
