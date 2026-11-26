import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMessinhoPerformanceIntelligence } from '../backend/messinho-performance-intelligence.js';
import { executeMessinhoAgentPlan } from '../backend/messinho-agent-core.js';

test('autonomous intelligence derives sprint average speed from explicit time',()=>{
 const result=buildMessinhoPerformanceIntelligence({player_metrics:{sprint_10m_time:{value:1.72,unit:'s'}}},'Bewerte den Flügelspieler');
 const speed=result.findings.find(item=>item.metric==='10m_average_speed');
 assert.equal(result.status,'completed');
 assert.ok(Math.abs(speed.value-(10/1.72))<0.001);
 assert.equal(speed.also_kmh,20.93);
 assert.equal(result.overall_rating,null);
});

test('autonomous intelligence never infers stamina, injury risk or missing values',()=>{
 const result=buildMessinhoPerformanceIntelligence({player_metrics:{top_speed:{value:34,unit:'km/h'}}});
 assert.equal(result.findings.length,1);
 assert.equal(result.measurements.top_speed_kmh,34);
 assert.ok(result.limitations.some(item=>item.includes('Ausdauer')));
 assert.equal(result.overall_rating,null);
});

test('autonomous intelligence combines measured performance with transparent physics',()=>{
 const result=buildMessinhoPerformanceIntelligence({player_metrics:{
  sprint_10m_time:{value:1.7,unit:'s'},pass_accuracy:84,duel_win_pct:61
 }});
 assert.equal(result.evidence_classification.measured,2);
 assert.equal(result.evidence_classification.derived,1);
 assert.equal(result.execution.automatic,true);
});

test('agent core runs performance intelligence automatically without a selectable capability',async()=>{
 const result=await executeMessinhoAgentPlan({
  plan:{goal:'Analysiere den Spieler',steps:['overall_score'],blocked_capabilities:[],deferred_capabilities:[]},
  goal:'Analysiere den Spieler',
  input:{player:{positions:['Flügel links']},player_metrics:{sprint_10m_time:{value:1.72,unit:'s'}}}
 });
 assert.equal(result.run.performance_intelligence.execution.automatic,true);
 assert.equal(result.run.performance_intelligence.findings[0].metric,'10m_average_speed');
 assert.equal(result.run.performance_intelligence.execution.user_selectable,false);
});
