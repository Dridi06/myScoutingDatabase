import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMessinhoForecastContext } from '../backend/messinho-forecast-context.js';

test('forecast context accepts only approved ordinary evidence and verified outcomes',()=>{
 const result=buildMessinhoForecastContext({
  evidence:[
   {id:'e1',claim_type:'performance_stat',event_date:'2025-01-01',metadata:{metric_key:'overall_score',value:55},identity_status:'matched',verification_status:'confirmed',review_status:'approved',legal_review_status:'approved',data_classification:'ordinary'},
   {id:'e2',claim_type:'performance_stat',event_date:'2025-07-01',metadata:{metric_key:'overall_score',value:70},identity_status:'matched',verification_status:'confirmed',review_status:'pending',legal_review_status:'approved',data_classification:'ordinary'},
   {id:'e3',claim_type:'transfer_rumour',event_date:'2026-11-01',publisher:'Club News',source_url:'https://example.org',identity_status:'matched',verification_status:'corroborated',review_status:'approved',legal_review_status:'approved',data_classification:'ordinary'}
  ],
  contractSnapshots:[{id:'c1',evidence_id:'e1',contract_status:'expiring',contract_end:'2027-03-01',verification_status:'confirmed',is_current:true}],
  predictions:[],
  outcomes:[
   {id:'o1',player_id:10,observed_metric:'market_value_eur',observed_value:1000000,observed_on:'2025-01-01',verification_status:'verified'},
   {id:'o2',player_id:10,observed_metric:'overall_score',observed_value:55,observed_on:'2025-01-01',verification_status:'verified'},
   {id:'o3',player_id:10,observed_metric:'overall_score',observed_value:90,observed_on:'2025-07-01',verification_status:'pending'}
  ],
  now:Date.parse('2026-11-27T12:00:00Z')
 });
 // The verified outcome and the approved evidence record refer to the same date; count one observation.
 assert.equal(result.time_series.length,1);
 assert.equal(result.market_value_history.length,1);
 assert.equal(result.transfer_evidence.length,1);
 assert.equal(result.contract_history.length,1);
 assert.equal(result._messinho_forecast_data_status.approved_evidence,2);
 assert.equal(result._messinho_forecast_data_status.verified_outcomes,2);
});

test('forecast cohort labels are taken only from linked prediction explanations',()=>{
 const result=buildMessinhoForecastContext({
  predictions:[{id:'p1',target_metric:'player_success',predicted_value:1,explanation:{position_group:'striker',success_definition:'first_team_500_minutes',age:21,current_score:70}},
               {id:'p2',target_metric:'transfer',predicted_value:1,explanation:{position_group:'striker',target_level:'regionalliga'}}],
  outcomes:[
   {id:'o1',prediction_id:'p1',player_id:10,observed_metric:'player_success',observed_value:1,observed_on:'2026-01-01',verification_status:'verified'},
   {id:'o2',prediction_id:'p2',player_id:10,observed_metric:'transfer_completed',observed_value:1,observed_on:'2026-02-01',verification_status:'verified'}
  ]
 });
 assert.equal(result.success_history.length,1);
 assert.equal(result.success_history[0].success_definition,'first_team_500_minutes');
 assert.equal(result.transfer_history.length,1);
 assert.equal(result.transfer_history[0].target_level,'regionalliga');
 assert.equal(result.prediction_pairs.length,2);
});
