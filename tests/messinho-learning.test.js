import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMessinhoLearningProposal, extractMessinhoDimensionScores } from '../backend/messinho-learning.js';

test('extracts normalized scouting dimensions from existing player ratings',()=>{
 const scores=extractMessinhoDimensionScores({Technik:4,Taktik:3,Athletik:5,Mentalitaet:2},['IV rechts']);
 assert.deepEqual(scores,{technical:80,tactical:60,athletic:100,mental:40});
});
test('aggregates detailed goalkeeper criteria into a goalkeeper dimension',()=>{
 const scores=extractMessinhoDimensionScores({Reflexe:4,Fangsicherheit:5,Technik:3,Taktik:4,Athletik:3},['Torwart']);
 assert.equal(scores.goalkeeping,90);
});
test('learning does not propose weights from small verified samples',()=>{
 const rows=Array.from({length:12},(_,i)=>({player_id:'p'+i,position_group:'centreBack',target_score:70,dimension_scores:{technical:70,tactical:70,athletic:70,mental:70}}));
 const result=buildMessinhoLearningProposal(rows,{centreBack:{technical:.2,tactical:.35,athletic:.25,mental:.2}});
 assert.equal(result.status,'no_proposal');
 assert.equal(result.report.centreBack.status,'insufficient_data');
});
test('learning creates no proposal when validation does not beat baseline',()=>{
 const rows=Array.from({length:40},(_,i)=>({player_id:'p'+i,position_group:'centreBack',target_score:70,dimension_scores:{technical:70,tactical:70,athletic:70,mental:70}}));
 const result=buildMessinhoLearningProposal(rows,{centreBack:{technical:.2,tactical:.35,athletic:.25,mental:.2}});
 assert.equal(result.status,'no_proposal');
});

test('supports the full 30-record minimum with a 20 percent player-level holdout',()=>{
 const rows=Array.from({length:30},(_,i)=>({player_id:'p'+(i%10),position_group:'centreBack',target_score:70,dimension_scores:{technical:70,tactical:70,athletic:70,mental:70}}));
 const result=buildMessinhoLearningProposal(rows,{centreBack:{technical:.2,tactical:.35,athletic:.25,mental:.2}});
 assert.equal(result.report.centreBack.status,'no_reliable_improvement');
 assert.equal(result.report.centreBack.validation_examples,6);
});
test('learns a useful profile while respecting the maximum weight shift',()=>{
 const rows=Array.from({length:60},(_,i)=>{
  const technical=(i*37)%101,tactical=(i*53+17)%101,athletic=(i*29+43)%101,mental=(i*71+11)%101;
  return {player_id:'player-'+i,position_group:'centreBack',target_score:technical,dimension_scores:{technical,tactical,athletic,mental}};
 });
 const baseline={centreBack:{technical:.2,tactical:.35,athletic:.25,mental:.2}};
 const result=buildMessinhoLearningProposal(rows,baseline);
 assert.equal(result.status,'proposal_ready');
 const profile=result.profiles.centreBack;
 assert.ok(profile.technical>baseline.centreBack.technical);
 for(const key of Object.keys(baseline.centreBack))assert.ok(Math.abs(profile[key]-baseline.centreBack[key])<=.2001);
 assert.ok(result.report.centreBack.proposed_mae<result.report.centreBack.baseline_mae-1);
});
test('reads nested numeric rating values without treating objects as missing',()=>{
 const scores=extractMessinhoDimensionScores({Technik:{score:4},Taktik:{value:3},Athletik:5,Mentalitaet:2},['IV rechts']);
 assert.deepEqual(scores,{technical:80,tactical:60,athletic:100,mental:40});
});
