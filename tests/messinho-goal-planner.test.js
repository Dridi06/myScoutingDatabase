import test from 'node:test';
import assert from 'node:assert/strict';
import { planMessinhoGoalWithModel } from '../backend/messinho-goal-planner.js';

function fakeResponse(value,status=200){
 return {ok:status>=200&&status<300,status,json:async()=>({choices:[{message:{content:JSON.stringify(value)}}]})};
}

test('semantic planner selects only registered capabilities and resolves dependencies',async()=>{
 const result=await planMessinhoGoalWithModel({goal:'Analysiere die Stärken eines Spielers',role:'scout',apiKey:'test',
  fetchImpl:async(_url,options)=>{
   const body=JSON.parse(options.body);
   assert.equal(body.model,'gpt-4.1-mini');
   assert.ok(body.messages[1].content.includes('holistic_player_analysis'));
   return fakeResponse({capability_ids:['strength_weakness_analysis'],confidence:0.94,needs_clarification:false,clarification_question:'',rationale:'Stärken und Schwächen auswerten.'});
  }});
 assert.equal(result.status,'planned');
 assert.equal(result.planning_source,'semantic_model');
 assert.ok(result.plan.steps.includes('strength_weakness_analysis'));
 assert.ok(result.plan.steps.includes('holistic_player_analysis'));
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
