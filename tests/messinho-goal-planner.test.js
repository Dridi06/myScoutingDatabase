import test from 'node:test';
import assert from 'node:assert/strict';
import { planMessinhoGoalWithModel } from '../backend/messinho-goal-planner.js';
import { prepareMessinhoReplanPlan } from '../backend/messinho-agent-core.js';

function fakeResponse(value,status=200){
 return {ok:status>=200&&status<300,status,json:async()=>({choices:[{message:{content:JSON.stringify(value)}}]})};
}

test('semantic planner selects only registered capabilities and resolves dependencies',async()=>{
 const result=await planMessinhoGoalWithModel({goal:'Analysiere die Stärken eines Spielers',role:'scout',apiKey:'test',
  fetchImpl:async(_url,options)=>{
   const body=JSON.parse(options.body);
   assert.equal(body.model,'gpt-4.1-mini');
   assert.ok(body.messages[1].content.includes('holistic_player_analysis'));
   return fakeResponse({capability_ids:['player_profile_synthesis'],confidence:0.94,needs_clarification:false,clarification_question:'',rationale:'Stärken und Schwächen auswerten.'});
  }});
 assert.equal(result.status,'planned');
 assert.equal(result.planning_source,'semantic_model');
 assert.ok(result.plan.steps.includes('player_profile_synthesis'));
 assert.ok(result.plan.steps.includes('holistic_player_analysis'));
 assert.ok(result.plan.steps.includes('source_cross_check'));
});

test('semantic planner rejects invented capability IDs and safely falls back',async()=>{
 const result=await planMessinhoGoalWithModel({goal:'Analysiere Spieler X',role:'scout',apiKey:'test',
  fetchImpl:async()=>fakeResponse({capability_ids:['made_up_tool'],confidence:0.9,needs_clarification:false,clarification_question:'',rationale:'x'})});
 assert.equal(result.planning_source,'deterministic_fallback');
 assert.equal(result.planner_status,'low_confidence_or_no_capabilities');
 assert.ok(result.plan);
});

test('semantic planner cannot plan admin-only capabilities for a scout',async()=>{
 const result=await planMessinhoGoalWithModel({goal:'Prüfe Lernqualität',role:'scout',apiKey:'test',
  fetchImpl:async()=>fakeResponse({capability_ids:['prediction_audit'],confidence:0.99,needs_clarification:false,clarification_question:'',rationale:'audit'})});
 assert.equal(result.status,'denied');
 assert.equal(result.plan.denied,true);
 assert.ok(result.plan.blocked_capabilities.includes('prediction_audit'));
 assert.equal(result.plan.steps.length,0);
});

test('semantic planner asks for clarification on low-confidence ambiguity',async()=>{
 const result=await planMessinhoGoalWithModel({goal:'Mach das bitte',role:'admin',apiKey:'test',
  fetchImpl:async()=>fakeResponse({capability_ids:[],confidence:0.4,needs_clarification:true,clarification_question:'Was genau soll ich machen?',rationale:''})});
 assert.equal(result.status,'needs_clarification');
 assert.equal(result.plan,null);
 assert.equal(result.clarification_question,'Was genau soll ich machen?');
});

test('provider failures use deterministic fallback without claiming semantic planning',async()=>{
 const result=await planMessinhoGoalWithModel({goal:'Analysiere Spieler X',role:'scout',apiKey:'test',
  fetchImpl:async()=>fakeResponse({},503)});
 assert.equal(result.planning_source,'deterministic_fallback');
 assert.equal(result.planner_status,'provider_error');
 assert.ok(result.plan);
});

test('replan filters capabilities already attempted in this task',()=>{
 const candidate={denied:false,steps:['holistic_player_analysis','source_cross_check','overall_score'],
  blocked_capabilities:[],deferred_capabilities:[],discovered_capabilities:['holistic_player_analysis','source_cross_check','overall_score']};
 const prepared=prepareMessinhoReplanPlan(candidate,[{capability_id:'holistic_player_analysis',status:'error'}],'scout');
 assert.deepEqual(prepared.steps,['source_cross_check','overall_score']);
 assert.equal(prepared.replan,true);
 assert.equal(prepared.replan_excludes_attempted,true);
});

test('replan refuses Admin-only capabilities for Scout even if a candidate plan contains them',()=>{
 const prepared=prepareMessinhoReplanPlan({denied:false,steps:['prediction_audit'],
  blocked_capabilities:[],deferred_capabilities:[]},[],'scout');
 assert.equal(prepared,null);
});

test('replan rejects unknown capability IDs and completed/denied plans',()=>{
 assert.equal(prepareMessinhoReplanPlan({denied:false,steps:['invented_tool']},[],'admin'),null);
 assert.equal(prepareMessinhoReplanPlan({denied:true,steps:['overall_score']},[],'admin'),null);
});
