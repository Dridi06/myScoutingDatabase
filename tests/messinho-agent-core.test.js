import test from 'node:test';
import assert from 'node:assert/strict';
import { executeMessinhoAgentPlan, validateMessinhoAgentRun } from '../backend/messinho-agent-core.js';
import { planMessinhoCapabilities } from '../backend/messinho-orchestrator.js';
test('agent core records plan, execution and validation lifecycle',async()=>{
 const plan=planMessinhoCapabilities('Analysiere Spieler X','scout');
 const cycle=await executeMessinhoAgentPlan({plan,input:{player:{name:'Spieler X'}},role:'scout'});
 assert.equal(cycle.validation.valid,true);
 assert.ok(cycle.state.trace.some(item=>item.event==='execution_started'));
 assert.ok(cycle.state.trace.some(item=>item.event==='validation_finished'));
 assert.equal(cycle.run.model_weights_changed,false);
});
test('agent core does not invent a plan for ordinary conversation',async()=>{
 const cycle=await executeMessinhoAgentPlan({plan:null,goal:'Warum ist der Himmel blau?',role:'scout'});
 assert.equal(cycle.state.phase,'needs_clarification');
 assert.equal(cycle.run.status,'needs_clarification');
});
test('agent validation detects duplicate and missing results',()=>{
 const validation=validateMessinhoAgentRun({steps:['overall_score','position_score']},{results:[{capability_id:'overall_score',status:'completed'},{capability_id:'overall_score',status:'completed'}]});
 assert.equal(validation.valid,false);
 assert.deepEqual(validation.duplicate_capabilities,['overall_score']);
 assert.deepEqual(validation.missing_results,['position_score']);
 assert.equal(validation.valid,false,'missing capability results must invalidate the agent run');
});
test('execution budget is capped and exposed',async()=>{
 const plan=planMessinhoCapabilities('Analysiere Spieler X','scout');
 const cycle=await executeMessinhoAgentPlan({plan,input:{player:{name:'Spieler X'}},role:'scout',budgetMs:250});
 assert.ok(cycle.run.execution_policy.budget_ms<=8000);
 assert.equal(cycle.run.model_weights_changed,false);
});

test('agent validation rejects useful results without matching provenance',()=>{
 const plan={steps:['overall_score']};
 const validation=validateMessinhoAgentRun(plan,{results:[{capability_id:'overall_score',status:'completed'}]});
 assert.equal(validation.valid,false);
 assert.deepEqual(validation.missing_provenance_capabilities,['overall_score']);
});

test('agent core awaits the checkpoint callback for every executed capability',async()=>{
 const plan=planMessinhoCapabilities('Analysiere Spieler X','scout');
 const seen=[];
 const cycle=await executeMessinhoAgentPlan({plan,input:{player:{name:'Spieler X'}},role:'scout',
   onStep:async event=>{await Promise.resolve();seen.push(event.capability_id);}});
 assert.deepEqual(seen,cycle.run.results.map(item=>item.capability_id));
 assert.equal(cycle.validation.valid,true);
});

test('agent core exposes a knowledge gap instead of pretending an unknown question was solved',async()=>{
 const cycle=await executeMessinhoAgentPlan({plan:null,goal:'Erkläre mir eine neue taktische Pressingvariante',role:'scout'});
 assert.equal(cycle.knowledge_gap.gap,true);
 assert.equal(cycle.knowledge_gap.reason,'no_matching_capability_or_verified_evidence');
 assert.equal(cycle.state.phase,'needs_clarification');
});
