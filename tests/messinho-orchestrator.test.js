import test from 'node:test';
import assert from 'node:assert/strict';
import { planMessinhoCapabilities, runMessinhoCapabilityPlan } from '../backend/messinho-orchestrator.js';

test('MESSINHO selects deterministic analysis chains without a provider', () => {
  const plan = planMessinhoCapabilities('Bitte analysiere das Potenzial und die Entwicklung von Spieler X', 'scout');
  assert.ok(plan);
  assert.equal(plan.mode, 'deterministic_allowlisted');
  assert.ok(plan.steps.includes('potential_analysis'));
  assert.ok(plan.steps.includes('development_projection'));
});

test('learning and model audit chains are admin-only', () => {
  const scoutPlan = planMessinhoCapabilities('Bitte prüfe den Lernstand und die Prognosefehler', 'scout');
  assert.equal(scoutPlan.denied, true);
  const adminPlan = planMessinhoCapabilities('Bitte prüfe den Lernstand und die Prognosefehler', 'admin');
  assert.ok(adminPlan.steps.includes('prediction_audit'));
});

test('execution never activates model weights and reports missing evidence honestly', () => {
  const plan = planMessinhoCapabilities('Analysiere Spieler X', 'scout');
  const run = runMessinhoCapabilityPlan(plan, { player: { name: 'Spieler X' } }, 'scout');
  assert.equal(run.provider_independent, true);
  assert.equal(run.model_weights_changed, false);
  assert.equal(run.total_steps, plan.steps.length);
  assert.ok(run.results.every(item => item.status));
});

test('unknown conversational intent does not force a capability', () => {
  assert.equal(planMessinhoCapabilities('Guten Abend Messinho', 'scout'), null);
});
