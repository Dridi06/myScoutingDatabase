import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMessinhoMatch, auditMessinhoPredictions, buildMessinhoExplainableAssessment, generateMessinhoHypotheses } from '../backend/messinho-development.js';

test('explainable assessment exposes score trace and missing dimensions',()=>{
 const result=buildMessinhoExplainableAssessment({positions:['Stürmer'],ratings:{Technik:4,Taktik:4,Athletik:3,Mental:4}});
 assert.equal(result.score,75);
 assert.equal(result.position_group,'striker');
 assert.ok(result.weighted_dimensions.length>=4);
 assert.ok(result.score_trace.normalization.includes('missing dimensions'));
});
test('match analysis groups real events by phase and action',()=>{
 const events=Array.from({length:6},(_,i)=>({minute:i*10,phase:i<3?'offensive':'defensive',action:i%2?'pass':'duel',successful:i%2===0,xg:i===0?.2:0}));
 const result=analyzeMessinhoMatch(events);
 assert.equal(result.status,'completed');
 assert.equal(result.event_count,6);
 assert.equal(result.phase_breakdown.offensive.events,3);
 assert.equal(result.total_xg,.2);
 assert.equal(analyzeMessinhoMatch([]).status,'insufficient_data');
});
test('prediction audit uses only verified outcomes',()=>{
 const result=auditMessinhoPredictions([
  {verification_status:'verified',predicted_value:70,observed_value:65},
  {verification_status:'pending',predicted_value:80,observed_value:20}
 ]);
 assert.equal(result.verified_pairs,1);
 assert.equal(result.metrics.mae,5);
});
test('hypotheses require minimum verified sample and remain non-causal proposals',()=>{
 const tooSmall=generateMessinhoHypotheses([]);
 assert.equal(tooSmall.status,'insufficient_data');
 const rows=Array.from({length:12},(_,i)=>({verification_status:'verified',predicted_value:50+i*3,observed_value:45+i*2,dimension_scores:{technical:i*8, tactical:50,athletic:50,mental:50}}));
 const result=generateMessinhoHypotheses(rows);
 assert.equal(result.status,'completed');
 assert.ok(result.hypotheses.some(x=>x.dimension==='technical'));
 assert.equal(result.hypotheses[0].causality_claimed,false);
});
