import test from 'node:test';
import assert from 'node:assert/strict';
import {
  planMessinhoCapabilities,
  runMessinhoCapabilityPlan,
  formatMessinhoCapabilityResults
} from '../backend/messinho-orchestrator.js';

test('MESSINHO autonomously composes a multi-intent player analysis plan',()=>{
  const plan=planMessinhoCapabilities('Bitte analysiere das Potenzial und die Entwicklung von Spieler X','scout');
  assert.ok(plan);
  assert.ok(plan.steps.includes('potential_analysis'));
  assert.ok(plan.steps.includes('development_projection'));
  assert.ok(plan.steps.includes('holistic_player_analysis'));
  assert.ok(plan.steps.length<=20);
});

test('planner resolves capability dependencies and removes duplicates',()=>{
  const plan=planMessinhoCapabilities('Erkläre die Bewertung und erstelle ein Spielerprofil','scout');
  assert.ok(plan);
  assert.equal(new Set(plan.steps).size,plan.steps.length);
  assert.ok(plan.steps.includes('overall_score'));
  assert.ok(plan.steps.includes('holistic_player_analysis'));
});

test('protected learning capabilities are discovered but not executable by scouts',()=>{
  const plan=planMessinhoCapabilities('Bitte prüfe den Lernstand und die Prognosefehler','scout');
  assert.ok(plan);
  assert.ok(plan.denied||plan.blocked_capabilities.length>0);
  assert.ok(!plan.steps.some(id=>['prediction_audit','weight_optimization','controlled_self_optimization'].includes(id)));
});

test('execution remains deterministic, bounded, provider-independent and non-mutating',async()=>{
  const plan=planMessinhoCapabilities('Analysiere Spieler X','scout');
  const run=await runMessinhoCapabilityPlan(plan,{player:{name:'Spieler X'}},'scout');
  assert.equal(run.provider_independent,true);
  assert.equal(run.model_weights_changed,false);
  assert.ok(run.total_steps<=20);
  assert.ok(run.results.every(item=>item.status));
  assert.ok(['completed','partial','insufficient_data'].includes(run.status));
});

test('missing data is reported instead of being invented',async()=>{
  const plan=planMessinhoCapabilities('Analysiere Spieler X','scout');
  const run=await runMessinhoCapabilityPlan(plan,{},'scout');
  assert.ok(run.results.some(item=>item.status==='insufficient_data'));
  assert.equal(run.model_weights_changed,false);
});

test('formatted answer stays conversational and hides internal implementation keys',async()=>{
  const plan=planMessinhoCapabilities('Analysiere Spieler X','scout');
  const run=await runMessinhoCapabilityPlan(plan,{player:{name:'Spieler X'}},'scout');
  const reply=formatMessinhoCapabilityResults(run,'Spieler X');
  assert.match(reply,/Arbeitsbereiche/);
  assert.doesNotMatch(reply,/capability_id|player_metrics|holistic_player_analysis/);
});

test('ordinary small talk does not trigger a fake analysis plan',()=>{
  assert.equal(planMessinhoCapabilities('Guten Abend Messinho','scout'),null);
});

test('capability execution awaits durable per-step checkpoint callbacks',async()=>{
 const plan=planMessinhoCapabilities('Analysiere Spieler X','scout');
 const checkpoints=[];
 const run=await runMessinhoCapabilityPlan(plan,{player:{name:'Spieler X'}},'scout',{
   onStep:async checkpoint=>{await Promise.resolve();checkpoints.push(checkpoint);}
 });
 assert.equal(checkpoints.length,run.results.length);
 assert.ok(checkpoints.every(item=>Array.isArray(item.completed_results)&&Array.isArray(item.pending_capabilities)));
 assert.equal(checkpoints.at(-1).completed_results.length,run.results.length);
});
