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

test('agent validation treats explicitly deferred steps as pending rather than missing',()=>{
 const plan={steps:['overall_score','position_score']};
 const run={results:[{capability_id:'overall_score',status:'completed',provenance:{capability_id:'overall_score'}}],
  deferred_capabilities:['position_score']};
 const validation=validateMessinhoAgentRun(plan,run);
 assert.equal(validation.valid,true);
 assert.deepEqual(validation.missing_results,[]);
});

test('agent core performs one bounded semantic replan after the retry still fails',async()=>{
 const plan={goal:'Testziel',label:'Test',steps:['overall_score'],discovered_capabilities:['overall_score'],
  blocked_capabilities:[],deferred_capabilities:[],matched_intents:[]};
 let calls=0,replanCalls=0;
 const runPlan=async(currentPlan)=>{
  calls++;
  if(calls<=2)return {status:'partial',results:[{capability_id:'overall_score',status:'error',
    error_code:'CONTROLLED_TEST_FAILURE',provenance:{capability_id:'overall_score'}}],
    completed_steps:0,total_steps:1,blocked_capabilities:[],deferred_capabilities:[],
    missing_inputs:[],replan_recommended:true,stop_requested:false,model_weights_changed:false,execution_policy:{budget_ms:2000}};
  return {status:'completed',results:[{capability_id:'position_analysis',status:'completed',
    provenance:{capability_id:'position_analysis'}}],completed_steps:1,total_steps:1,
    blocked_capabilities:[],deferred_capabilities:[],missing_inputs:[],
    replan_recommended:false,stop_requested:false,model_weights_changed:false,execution_policy:{budget_ms:2000}};
 };
 const cycle=await executeMessinhoAgentPlan({plan,goal:'Testziel',role:'scout',input:{},
  runPlan,
  replan:async request=>{
   replanCalls++;
   assert.deepEqual(request.failed_capabilities,['overall_score']);
   return {denied:false,goal:'Testziel',label:'Alternative Prüfung',
    steps:['overall_score','position_analysis'],discovered_capabilities:['overall_score','position_analysis'],
    blocked_capabilities:[],deferred_capabilities:[]};
  }});
 assert.equal(calls,3,'initial execution, one retry, and one alternative execution');
 assert.equal(replanCalls,1,'only one model-assisted replan is permitted');
 assert.ok(cycle.plan.steps.includes('position_analysis'));
 assert.ok(cycle.run.results.some(item=>item.capability_id==='position_analysis'&&item.status==='completed'));
 assert.ok(cycle.state.trace.some(item=>item.event==='replan_executed'));
 assert.equal(cycle.validation.valid,true);
 assert.equal(cycle.run.model_weights_changed,false);
});
