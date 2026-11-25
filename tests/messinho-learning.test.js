import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMessinhoLearningProposal, validateMessinhoFeedback } from '../backend/messinho-learning.js';

test('feedback validation requires player id, target and at least two dimensions',()=>{
 assert.match(validateMessinhoFeedback({}).error,/Feedback/);
 assert.match(validateMessinhoFeedback({player_id:'p1',target_score:70,dimension_scores:{technical:80}}).error,/zwei/);
 const valid=validateMessinhoFeedback({player_id:'p1',target_score:70,dimension_scores:{technical:80,tactical:70}});
 assert.equal(valid.value.target_score,70);
});
test('learning does not propose weights from small samples',()=>{
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
test('feedback rejects out-of-range and nonnumeric dimensions',()=>{
 assert.ok(validateMessinhoFeedback({player_id:'p',target_score:101,dimension_scores:{technical:10,tactical:20}}).error);
 assert.ok(validateMessinhoFeedback({player_id:'p',target_score:70,dimension_scores:{technical:'bad',tactical:20}}).error);
});
