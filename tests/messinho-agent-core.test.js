import test from 'node:test';
import assert from 'node:assert/strict';
import { executeMessinhoAgentPlan, validateMessinhoAgentRun } from '../backend/messinho-agent-core.js';
import { planMessinhoCapabilities } from '../backend/messinho-orchestrator.js';
test('agent core records plan, execution and validation lifecycle',()=>{
 const plan=planMessinhoCapabilities('Analysiere Spieler X','scout');
 const cycle=executeMessinhoAgentPlan({plan,input:{player:{name:'Spieler X'}},role:'scout'});
 assert.equal(cycle.validation.valid,true);
 assert.ok(cycle.state.trace.some(item=>item.event==='execution_started'));
 assert.ok(cycle.state.trace.some(item=>item.event==='validation_finished'));
 assert.equal(cycle.run.model_weights_changed,false);
});
test('agent core does not invent a plan for ordinary conversation',()=>{
 const cycle=executeMessinhoAgentPlan({plan:null,role:'scout'});
 assert.equal(cycle.state.phase,'needs_clarification');
 assert.equal(cycle.run.status,'needs_clarification');
});
test('agent validation detects duplicate and missing results',()=>{
 const validation=validateMessinhoAgentRun({steps:['overall_score','position_score']},{results:[{capability_id:'overall_score',status:'completed'},{capability_id:'overall_score',status:'completed'}]});
 assert.equal(validation.valid,false);
 assert.deepEqual(validation.duplicate_capabilities,['overall_score']);
 assert.deepEqual(validation.missing_results,['position_score']);
});
test('execution budget is capped and exposed',()=>{
 const plan=planMessinhoCapabilities('Analysiere Spieler X','scout');
 const cycle=executeMessinhoAgentPlan({plan,input:{player:{name:'Spieler X'}},role:'scout',budgetMs:250});
 assert.ok(cycle.run.execution_policy.budget_ms<=8000);
 assert.equal(cycle.run.model_weights_changed,false);
});
