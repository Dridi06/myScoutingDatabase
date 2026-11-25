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
