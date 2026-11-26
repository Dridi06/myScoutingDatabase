import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMessinhoCapabilityContext } from '../backend/messinho-data-context.js';

const now=Date.parse('2026-01-01T00:00:00.000Z');

test('only reviewed, confirmed, identity-matched ordinary HTTPS evidence becomes trusted',()=>{
 const context=buildMessinhoCapabilityContext({
   player:{name:'Player One',ratings:{technical:4}},
   evidence:[{
     source_id:'source-1',source_url:'https://club.example/player',publisher:'Official Club',
     claim_title:'Player profile',claim_text:'Player One plays as a winger.',
     verification_status:'confirmed',identity_status:'matched',review_status:'approved',
     legal_review_status:'approved',data_classification:'ordinary',reviewed_by:'admin-1',
     valid_until:'2027-01-01T00:00:00.000Z'
   }],
   sourceRegistry:[{id:'source-1',license_status:'approved',permitted_purposes:['video_analysis']}],
   now
 });
 assert.equal(context._trusted_source_bundle,true);
 assert.equal(context.claims.length,1);
 assert.equal(context.sources[0].verification_status,'verified');
 assert.equal(context.sources[0].license_status,'licensed');
 assert.equal(context.sources[0].usage_rights,'confirmed');
});

test('pending, mismatched, expired and sensitive evidence never become trusted claims',()=>{
 const context=buildMessinhoCapabilityContext({
   player:{name:'Player Two'},
   evidence:[
     {source_url:'https://a.example',verification_status:'confirmed',identity_status:'matched',review_status:'pending',legal_review_status:'approved',data_classification:'ordinary',reviewed_by:'admin'},
     {source_url:'https://b.example',verification_status:'confirmed',identity_status:'ambiguous',review_status:'approved',legal_review_status:'approved',data_classification:'ordinary',reviewed_by:'admin'},
     {source_url:'https://c.example',verification_status:'confirmed',identity_status:'matched',review_status:'approved',legal_review_status:'approved',data_classification:'health_sensitive',reviewed_by:'admin'},
     {source_url:'https://d.example',verification_status:'confirmed',identity_status:'matched',review_status:'approved',legal_review_status:'approved',data_classification:'ordinary',reviewed_by:'admin',valid_until:'2025-01-01T00:00:00.000Z'}
   ],
   now
 });
 assert.equal(context._trusted_source_bundle,false);
 assert.equal(context.claims.length,0);
 assert.equal(context.sources.length,4);
 assert.ok(context.sources.every(source=>source.verification_status!=='verified'));
});

test('only verified video events enter the capability context',()=>{
 const context=buildMessinhoCapabilityContext({
   player:{name:'Player Three'},
   events:[
     {event_type:'key_pass',verification_status:'verified',match_date:'2025-12-01'},
     {event_type:'goal',verification_status:'pending',match_date:'2025-12-02'}
   ],now
 });
 assert.equal(context.events.length,1);
 assert.equal(context.events[0].action,'key_pass');
});

test('verified learning outcomes preserve the correct player IDs and enrich available age and country',()=>{
 const context=buildMessinhoCapabilityContext({
   player:{name:'Learning scope'},
   calibration:[
     {player_id:11,scout_id:'s1',scout_rating:75,outcome_metric:'performance',verified_outcome:80,
      verification_status:'verified',verified_by:'admin-1',messinho_position_group:'winger'},
     {player_id:12,scout_id:'s2',scout_rating:60,outcome_metric:'performance',verified_outcome:65,
      verification_status:'verified',verified_by:'admin-1',messinho_position_group:'striker'}
   ],
   playerDirectory:[
     {player_id:11,year:'2000',national_team_country:'Germany'},
     {player_id:12,year:'2004',national_team_country:'France'}
   ],now
 });
 assert.deepEqual(context.outcomes.map(row=>row.player_id),[11,12]);
 assert.equal(context.outcomes[0].age,26);
 assert.equal(context.outcomes[0].age_group,'25-29');
 assert.equal(context.outcomes[0].country,'Germany');
 assert.equal(context.verified_scout_feedback.length,2);
});

test('prediction outcomes are paired without upgrading pending outcomes to verified',()=>{
 const context=buildMessinhoCapabilityContext({
   player:{name:'Prediction scope'},
   predictions:[
     {id:'p1',player_id:11,predicted_value:70,model_version:'v1'},
     {id:'p2',player_id:12,predicted_value:60,model_version:'v1'}
   ],
   predictionOutcomes:[
     {prediction_id:'p1',player_id:11,observed_value:75,verification_status:'verified',verified_by:'admin-1'},
     {prediction_id:'p2',player_id:12,observed_value:55,verification_status:'pending',verified_by:null}
   ],now
 });
 assert.equal(context.predictions[0].actual_score,75);
 assert.equal(context.predictions[0].verification_status,'verified');
 assert.equal(context.predictions[1].actual_score,55);
 assert.equal(context.predictions[1].verification_status,'pending');
 assert.equal(context.outcomes.length,1);
});
