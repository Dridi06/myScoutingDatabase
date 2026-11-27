import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMessinhoMatch, auditMessinhoPredictions, buildMessinhoExplainableAssessment, generateMessinhoHypotheses, forecastMessinhoPlayerDevelopment, forecastMessinhoTransferProbability, forecastMessinhoPlayerOutcome, forecastMessinhoMarketValue } from '../backend/messinho-development.js';

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


test('player development forecast requires three verified dated observations across six months',()=>{
 const insufficient=forecastMessinhoPlayerDevelopment([
  {verification_status:'verified',date:'2026-01-01',score:50},
  {verification_status:'pending',date:'2026-07-01',score:70},
  {verification_status:'verified',date:'2026-12-01',score:75}
 ]);
 assert.equal(insufficient.status,'insufficient_data');
 const history=[
  {verification_status:'verified',player_id:'p1',date:'2025-01-01',score:50},
  {verification_status:'verified',player_id:'p1',date:'2025-07-01',score:60},
  {verification_status:'verified',player_id:'p1',date:'2026-01-01',score:70}
 ];
 const result=forecastMessinhoPlayerDevelopment(history,{horizonMonths:12});
 assert.equal(result.status,'completed');
 assert.equal(result.method,'verified_linear_trend_extrapolation');
 assert.ok(result.forecast.projected_score>70);
 assert.equal(result.confidence_is_calibrated,false);
 assert.ok(result.limitations.length>=2);
});

test('player development forecast rejects mixed player histories and invalid scores',()=>{
 const result=forecastMessinhoPlayerDevelopment([
  {verification_status:'verified',player_id:'p1',date:'2025-01-01',score:40},
  {verification_status:'verified',player_id:'p2',date:'2025-07-01',score:50},
  {verification_status:'verified',player_id:'p1',date:'2026-01-01',score:60},
  {verification_status:'verified',player_id:'p1',date:'2026-06-01',score:140}
 ]);
 assert.equal(result.status,'invalid_data');
 assert.equal(result.reason,'mixed_player_history');
});

test('transfer forecast reports only verified comparable cohort base rates',()=>{
 const cases=Array.from({length:40},(_,i)=>({
  verification_status:i<38?'verified':'pending',position_group:'winger',target_level:'regionalliga',transferred:i%2===0
 }));
 const insufficient=forecastMessinhoTransferProbability(cases,{position_group:'winger',target_level:'bundesliga'});
 assert.equal(insufficient.status,'insufficient_data');
 const result=forecastMessinhoTransferProbability(cases,{position_group:'winger',target_level:'regionalliga'});
 assert.equal(result.status,'completed');
 assert.equal(result.verified_comparable_cases,38);
 assert.ok(result.estimate.historical_transfer_rate_pct>0);
 assert.ok(result.estimate.interval_95.low<result.estimate.interval_95.high);
 assert.match(result.interpretation,/keine individuelle Wechselwahrscheinlichkeit/);
});

test('player outcome forecast requires verified peers with comparable age and score',()=>{
 const cases=Array.from({length:35},(_,i)=>({
  verification_status:i<32?'verified':'pending',position_group:'striker',age:20+(i%3),current_score:70+(i%5),success:i%3!==0
 }));
 const result=forecastMessinhoPlayerOutcome(cases,{position_group:'striker',age:21,current_score:72});
 assert.equal(result.status,'completed');
 assert.equal(result.verified_comparable_cases,32);
 assert.equal(result.failed_outcomes+result.successful_outcomes,32);
 const tooSmall=forecastMessinhoPlayerOutcome(cases.slice(0,20),{position_group:'striker',age:21,current_score:72});
 assert.equal(tooSmall.status,'insufficient_data');
});

test('market value projection uses only verified EUR history and remains distinct from official value',()=>{
 const history=[
  {verification_status:'verified',date:'2025-01-01',value_eur:1000000,currency:'EUR'},
  {verification_status:'verified',date:'2025-07-01',value_eur:1500000,currency:'EUR'},
  {verification_status:'verified',date:'2026-01-01',value_eur:2000000,currency:'EUR'},
  {verification_status:'pending',date:'2026-07-01',value_eur:5000000,currency:'EUR'}
 ];
 const result=forecastMessinhoMarketValue(history,{horizonMonths:12});
 assert.equal(result.status,'completed');
 assert.ok(result.forecast.projected_value_eur>2000000);
 assert.equal(result.confidence_is_calibrated,false);
 assert.equal(forecastMessinhoMarketValue(history.slice(0,2)).status,'insufficient_data');
});
