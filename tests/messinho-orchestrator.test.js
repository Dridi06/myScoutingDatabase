import test from 'node:test';
import assert from 'node:assert/strict';
import { planMessinhoCapabilities, runMessinhoCapabilityPlan, formatMessinhoCapabilityResults, getMessinhoCapabilityDiscovery } from '../backend/messinho-orchestrator.js';

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


import { executeMessinhoCapability, getMessinhoRuntimeSummary, listExecutableMessinhoCapabilities } from '../backend/messinho-capability-runtime.js';

test('seasonal_learning is dispatched to specialist learning logic and compares seasons without training', () => {
  const result = executeMessinhoCapability('seasonal_learning', {
    seasonal_metrics: [
      { season: '2024/25', score: 61 },
      { season: '2024/25', score: 65 },
      { season: '2025/26', score: 70 },
      { season: '2025/26', score: 74 }
    ]
  });
  assert.equal(result.status, 'completed');
  assert.equal(result.implementation_level, 'specialist_logic');
  assert.equal(result.result.season_count, 2);
  assert.equal(result.result.change, 9);
  assert.equal(result.result.training_performed, false);
  assert.equal(result.result.model_weights_changed, false);
});

test('runtime summary separates dispatch, specialist logic, generic fallback and verified completion', () => {
  const summary = getMessinhoRuntimeSummary();
  assert.equal(summary.total_catalogue_entries, 100);
  assert.equal(summary.all_dispatched, true);
  assert.ok(summary.specialist_logic_count > 0);
  assert.ok(summary.generic_fallback_count > 0);
  assert.equal(summary.completion_verified_count, 0);
  assert.equal(summary.specialist_logic_count + summary.generic_fallback_count, summary.dispatched_capabilities);
});

test('admin capability catalogue exposes honest implementation levels', () => {
  const groups = listExecutableMessinhoCapabilities();
  const all = groups.flatMap(group => group.functions);
  const seasonal = all.find(item => item.id === 'seasonal_learning');
  assert.equal(seasonal.dispatch_registered, true);
  assert.equal(seasonal.specialist_logic_available, true);
  assert.equal(seasonal.implementation_level, 'specialist_logic');
  assert.equal(seasonal.completion_verified, false);
  assert.ok(all.some(item => item.implementation_level === 'generic_fallback'));
});


test('all 100 catalogue capabilities are discoverable by their natural-language names', () => {
  const catalogue = getMessinhoCapabilityDiscovery();
  assert.equal(catalogue.length, 100);
  for (const capability of catalogue) {
    const plan = planMessinhoCapabilities('Bitte führe die Fähigkeit ' + capability.name + ' aus', 'admin');
    assert.ok(plan, 'No plan for ' + capability.id);
    assert.ok(plan.discovered_capabilities.includes(capability.id), 'Capability not discovered: ' + capability.id);
  }
});

test('catalogue discovery does not grant execution permission for protected learning skills', () => {
  const plan = planMessinhoCapabilities('Bitte führe die Prognosekontrolle und Gewichtungsoptimierung aus', 'scout');
  assert.ok(plan.discovered_capabilities.includes('prediction_audit'));
  assert.ok(plan.discovered_capabilities.includes('weight_optimization'));
  assert.ok(plan.blocked_capabilities.includes('prediction_audit'));
  assert.ok(plan.blocked_capabilities.includes('weight_optimization'));
  assert.ok(!plan.steps.includes('prediction_audit'));
  assert.ok(!plan.steps.includes('weight_optimization'));
});

test('capability execution preserves source facts and never promotes prior output to verified evidence', () => {
  const sources = [{ url: 'https://example.org', title: 'Example' }];
  const plan = planMessinhoCapabilities('Bitte prüfe die Quellenqualität und erstelle einen Recherchebericht', 'scout');
  const run = runMessinhoCapabilityPlan(plan, { sources, claims: [] }, 'scout');
  assert.equal(run.execution_policy.source_data_mutated, false);
  assert.equal(run.execution_policy.model_weights_mutated, false);
  assert.equal(run.execution_policy.previous_results_used_as_untrusted_context, true);
  assert.deepEqual(sources, [{ url: 'https://example.org', title: 'Example' }]);
});

test('planner exposes missing-input recovery and does not claim unsupported completion', () => {
  const plan = planMessinhoCapabilities('Bitte analysiere die Spielminuten', 'scout');
  const run = runMessinhoCapabilityPlan(plan, {}, 'scout');
  assert.ok(run.results.some(item => item.status === 'insufficient_data'));
  assert.equal(run.model_weights_changed, false);
  assert.equal(run.provider_independent, true);
});
