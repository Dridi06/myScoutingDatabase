import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMessinhoQualityIntelligence} from '../backend/messinho-quality-intelligence.js';

const now='2026-11-26T12:00:00.000Z';
const rating=(id,value,extra={})=>({id,feedback_type:'quality_rating',rating:value,status:'reviewed',capability_ids:['player_search'],intent:'player_search',comment:'Antwort ist unvollständig',created_at:'2026-11-20T12:00:00Z',...extra});

test('aggregates only admin-reviewed answer ratings and excludes pending/rejected signals',()=>{
 const report=buildMessinhoQualityIntelligence([rating('1',5),rating('2',3),rating('3',1,{status:'pending'}),rating('4',1,{status:'rejected'})],{now});
 assert.equal(report.ratings.count,2);
 assert.equal(report.ratings.average,4);
 assert.equal(report.coverage.excluded_pending_or_rejected,2);
 assert.equal(report.governance.feedback_is_training_data,false);
});

test('separates verified corrections from quality ratings and builds a repeated correction hypothesis',()=>{
 const corrections=Array.from({length:3},(_,i)=>({id:'c'+i,feedback_type:'factual_correction',rating:null,status:'verified',capability_ids:['player_search'],intent:'player_search',comment:'Die Spielerposition ist falsch',created_at:now}));
 const report=buildMessinhoQualityIntelligence(corrections,{now});
 assert.equal(report.coverage.verified_corrections,3);
 assert.equal(report.ratings.count,0);
 assert.ok(report.hypotheses.some(item=>item.type==='repeated_verified_corrections'&&item.group==='player_search'));
});

test('creates low-quality hypothesis only after five reviewed low ratings in the same capability',()=>{
 const four=Array.from({length:4},(_,i)=>rating(String(i),2));
 assert.equal(buildMessinhoQualityIntelligence(four,{now}).hypotheses.some(item=>item.type==='repeated_low_quality'),false);
 const five=Array.from({length:5},(_,i)=>rating(String(i),2));
 const report=buildMessinhoQualityIntelligence(five,{now});
 assert.ok(report.hypotheses.some(item=>item.type==='repeated_low_quality'&&item.sample_size===5));
});

test('does not expose raw comments, questions or answers in aggregate output',()=>{
 const report=buildMessinhoQualityIntelligence([rating('1',2,{comment:'PRIVATE_SENTENCE',question:'private question',answer:'private answer'})],{now});
 const serialized=JSON.stringify(report);
 assert.equal(serialized.includes('PRIVATE_SENTENCE'),false);
 assert.equal(serialized.includes('private question'),false);
 assert.equal(serialized.includes('private answer'),false);
});

test('returns explicit insufficient-sample confidence and stable rating distribution',()=>{
 const report=buildMessinhoQualityIntelligence([rating('1',5),rating('2',4)],{now});
 assert.equal(report.ratings.confidence,'insufficient_sample');
 assert.deepEqual(report.ratings.distribution,{1:0,2:0,3:0,4:1,5:1});
});

test('caps the analyzed dataset and ignores malformed input',()=>{
 const records=Array.from({length:1100},(_,i)=>rating(String(i),5));
 const report=buildMessinhoQualityIntelligence(records,{now});
 assert.equal(report.coverage.records_loaded,1000);
 assert.equal(buildMessinhoQualityIntelligence(null,{now}).coverage.records_loaded,0);
});

test('attributes one reviewed rating to every relevant capability',()=>{
 const report=buildMessinhoQualityIntelligence([rating('multi',2,{capability_ids:['player_search','tactical_fit']})],{now});
 assert.deepEqual(report.by_capability.map(item=>item.key).sort(),['player_search','tactical_fit']);
});
