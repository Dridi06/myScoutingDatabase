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
  assert.equal(summary.generic_fallback_count, 0);
  assert.equal(summary.specialist_logic_count, 100);
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
  assert.ok(all.every(item => item.implementation_level === 'specialist_logic'));
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


test('the 29 formerly generic fallback capabilities now have explicit specialist dispatch', () => {
  const ids = [
    'technical_score','tactical_score','athletic_score','mental_score','goalkeeper_score',
    'supervised_learning','position_specific_learning','scout_feedback_learning','weight_optimization','age_group_learning',
    'league_learning','country_learning','talent_pathway_learning','breakthrough_learning',
    'position_change_learning','availability_outcome_learning','controlled_self_optimization',
    'automated_talent_search','international_research','cross_league_research','youth_talent_discovery',
    'underdog_detection','hidden_gem_detection','club_research','squad_research','statistics_research',
    'match_report_research','club_need_research','comparable_player_research'
  ];
  for (const id of ids) {
    const result = executeMessinhoCapability(id, {});
    assert.equal(result.implementation_level, 'specialist_logic', id);
    assert.notEqual(result.status, 'unknown_capability', id);
    assert.notEqual(result.status, 'error', id);
  }
});

test('technical and goalkeeper scoring use their dedicated metric dimensions', () => {
  const player = { name: 'Test', positions: ['Torwart'], ratings: {
    technical: 70, tactical: 65, athletic: 75, mental: 80, goalkeeping: 90
  }};
  assert.equal(executeMessinhoCapability('technical_score', { player }).result.score, 70);
  assert.equal(executeMessinhoCapability('goalkeeper_score', { player }).result.score, 90);
});

test('automated talent search filters a supplied candidate pool without pretending to search externally', () => {
  const result = executeMessinhoCapability('automated_talent_search', {
    candidates: [
      { id: 'a', name: 'Young Forward', birth_year: 2007, positions: ['Stürmer'], ratings: { technical: 80, tactical: 70, athletic: 75, mental: 70 } },
      { id: 'b', name: 'Older Midfielder', birth_year: 1995, positions: ['Mittelfeld'], ratings: { technical: 80, tactical: 70, athletic: 75, mental: 70 } }
    ],
    filters: { position: 'Stürmer', max_age: 21 }
  });
  assert.equal(result.status, 'completed');
  assert.equal(result.result.candidate_count, 1);
  assert.equal(result.result.results[0].id, 'a');
  assert.equal(result.result.external_search_performed, false);
});

test('club need research reports position gaps only from supplied squad and explicit requirements', () => {
  const result = executeMessinhoCapability('club_need_research', {
    squad: [{ positions: ['Stürmer'] }, { positions: ['Innenverteidiger'] }],
    required_positions: [{ position: 'Stürmer', minimum: 3 }, { position: 'Torwart', minimum: 1 }]
  });
  assert.equal(result.status, 'completed');
  assert.equal(result.result.priority_positions.length, 2);
  assert.equal(result.result.priority_positions[0].position, 'Stürmer');
});

test('learning proposals remain approval-gated and never train or change active weights', () => {
  const result = executeMessinhoCapability('supervised_learning', { outcomes: [] });
  assert.equal(result.status, 'insufficient_data');
  assert.equal(result.result.training_performed, false);
  assert.equal(result.result.model_weights_changed, false);
});


test('scout feedback learning accepts only verified feedback and remains non-mutating', () => {
  const result = executeMessinhoCapability('scout_feedback_learning', {
    verified_scout_feedback: [
      { verified: true, verified_by: 'admin-1', scout_id: 'scout-1', rating: 82, category: 'technical' },
      { verified: false, verified_by: 'admin-1', scout_id: 'scout-2', rating: 20, category: 'technical' }
    ]
  });
  assert.equal(result.status, 'completed');
  assert.equal(result.result.verified_feedback_count, 1);
  assert.equal(result.result.mean_rating, 82);
  assert.equal(result.result.training_performed, false);
  assert.equal(result.result.model_weights_changed, false);
});
