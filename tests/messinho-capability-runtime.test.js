import test from 'node:test';
import assert from 'node:assert/strict';
import { getMessinhoCapabilityCatalog } from '../backend/messinho-capabilities.js';
import { executeMessinhoCapability, getMessinhoRuntimeSummary, listExecutableMessinhoCapabilities } from '../backend/messinho-capability-runtime.js';

test('runtime diagnostics distinguish catalogue dispatch from specialist implementations',()=>{
 const summary=getMessinhoRuntimeSummary();
 const functions=listExecutableMessinhoCapabilities().flatMap(g=>g.functions);
 assert.equal(summary.total_catalogue_entries,100);
 assert.equal(summary.dispatched_entries,100);
 assert.equal(summary.specialist_handler_count,100);
 assert.equal(summary.generic_fallback_count,0);
 assert.equal(summary.registered_handlers,100);
 assert.equal(summary.all_registered,true);
 assert.equal(functions.filter(x=>x.dispatch_available).length,100);
 assert.equal(functions.filter(x=>x.execution_handler_available).length,100);
 assert.equal(functions.filter(x=>x.implementation_status==='not_implemented').length,0);
 assert.equal(summary.seasonal_learning_handler,'reachable');
});
test('every capability executes safely and reports missing data rather than inventing it',()=>{
 for(const fn of getMessinhoCapabilityCatalog().flatMap(g=>g.functions)){
  const result=executeMessinhoCapability(fn.id,{});
  assert.equal(result.capability_id,fn.id);
  assert.ok(['insufficient_data','completed','unknown_capability','invalid_input','unverified','verified','proposal_ready','no_reliable_improvement'].includes(result.status),fn.id+' status '+result.status);
 }
});
test('scoring uses real values and refuses insufficient evidence',()=>{
 const score=executeMessinhoCapability('overall_score',{player:{name:'Test',positions:['Stürmer'],ratings:{Technik:4,Taktik:4, Athletik:3, Mental:4}}});
 assert.equal(score.status,'completed');
 assert.ok(score.result.score>=0&&score.result.score<=100);
 const empty=executeMessinhoCapability('overall_score',{player:{name:'No Data',positions:['Stürmer']}});
 assert.equal(empty.status,'insufficient_data');
 assert.equal(empty.result.score,null);
});
test('market value requires three comparables and source identity is evidence-bound',()=>{
 const market=executeMessinhoCapability('market_value_assessment',{player:{name:'Test'},market_comparables:[{value:1000000},{value:1200000}]});
 assert.equal(market.status,'insufficient_data');
 const identity=executeMessinhoCapability('identity_verification',{player:{name:'Alex Example'},sources:[{url:'https://example.org/player',title:'Profile',content:'A profile of another football player with no matching identity.'}]});
 assert.equal(identity.status,'unverified');
});
test('learning excludes unverified outcomes and blocks insufficient datasets',()=>{
 const out=executeMessinhoCapability('supervised_learning',{outcomes:[{player_id:'1',target_score:80,verification_status:'pending',verified_by:'scout'}]});
 assert.equal(out.status,'insufficient_data');
});
test('research distinguishes source auditing from live provider discovery',()=>{
 const out=executeMessinhoCapability('international_research',{sources:[{url:'http://insecure.example/player',title:'Player',content:'x'.repeat(100)}]});
 assert.equal(out.status,'completed');
 assert.equal(out.result.eligible_sources,0);
});

test('video source research never treats HTTPS alone as a licence',()=>{
 const out=executeMessinhoCapability('video_source_research',{sources:[{url:'https://video.example/match',title:'Match video',content:'Licensed footage for this match.'.repeat(10)}]});
 assert.equal(out.status,'insufficient_data');
 assert.equal(out.result.licensed_source_count,0);
});
test('contract date extraction produces review leads, never verified contract facts',()=>{
 const out=executeMessinhoCapability('contract_expiry_monitor',{sources:[{url:'https://club.example/news',title:'Contract update',content:'The contract expires on 2027-06-30.'}]});
 assert.equal(out.status,'needs_review');
 assert.equal(out.result.contract_date_mentions[0].verified,false);
});
test('potential and development scores require measured player history where appropriate',()=>{
 const potential=executeMessinhoCapability('potential_score',{player:{name:'Test',positions:['Stürmer'],ratings:{Technik:4,Taktik:4,Athletik:4,Mental:4}},age:19});
 assert.equal(potential.status,'completed');
 const development=executeMessinhoCapability('development_score',{player:{name:'Test'},time_series:[{date:'2025-01-01',score:60},{date:'2026-01-01',score:72}]});
 assert.equal(development.status,'completed');
});

test('match analysis capabilities use structured phase events and enforce video licensing',()=>{
 const events=Array.from({length:6},(_,i)=>({minute:i*8,phase:i<3?'offensive':'defensive',action:'pass',successful:i%2===0,xg:i===0?0.1:0,license_status:'licensed'}));
 const match=executeMessinhoCapability('game_phase_analysis',{player:{name:'Test',positions:['ZM']},events});
 assert.equal(match.status,'completed');
 assert.equal(match.result.phase_breakdown.offensive.events,3);
 const video=executeMessinhoCapability('video_event_analysis',{player:{name:'Test'},events});
 assert.equal(video.status,'insufficient_data');
 const trustedVideo=executeMessinhoCapability('video_event_analysis',{player:{name:'Test'},events,_trusted_video_bundle:true});
 assert.equal(trustedVideo.status,'completed');
});

test('dimension scoring capabilities use observed values only',()=>{
 const input={player:{name:'Test',ratings:{Technik:4,Taktik:3,Athletik:5,Mental:4,Torwart:4}}};
 for(const [id,expected] of [['technical_score',80],['tactical_score',60],['athletic_score',100],['mental_score',80],['goalkeeper_score',80]]){
   const result=executeMessinhoCapability(id,input);
   assert.equal(result.status,'completed',id);
   assert.equal(result.result.score,expected,id);
 }
 const missing=executeMessinhoCapability('technical_score',{player:{name:'No metrics'}});
 assert.equal(missing.status,'insufficient_data');
});
test('seasonal learning is reachable and compares seasons without training',()=>{
 const result=executeMessinhoCapability('seasonal_learning',{seasonal_metrics:[
   {season:'2024/25',score:61},{season:'2025/26',score:74}
 ]});
 assert.equal(result.status,'completed');
 assert.equal(result.result.change,13);
 assert.equal(result.result.training_performed,false);
 assert.equal(result.result.model_weights_changed,false);
});

test('automated talent search applies filters and only ranks measured players',()=>{
 const out=executeMessinhoCapability('automated_talent_search',{filters:{maxAge:22,position:'ST'},current_year:2026,players:[
  {player_id:1,name:'Young striker',year:2005,positions:['ST'],ratings:{Technik:4,Taktik:4,Athletik:4,Mental:4}},
  {player_id:2,name:'Older striker',year:2000,positions:['ST'],ratings:{Technik:4,Taktik:4,Athletik:4,Mental:4}},
  {player_id:3,name:'Young midfielder',year:2005,positions:['ZM'],ratings:{Technik:4,Taktik:4,Athletik:4,Mental:4}}
 ]});
 assert.equal(out.status,'completed');
 assert.equal(out.result.candidate_count,1);
 assert.equal(out.result.ranked_candidates[0].id,1);
});
test('international research reports supplied countries and does not claim a live search',()=>{
 const out=executeMessinhoCapability('international_research',{players:[{nationality:'Senegal'},{nationality:'France'}],
  sources:[{url:'http://insecure.example/player',title:'Profile'}]});
 assert.equal(out.status,'completed');
 assert.equal(out.result.countries.length,2);
 assert.equal(out.result.eligible_sources,0);
 assert.match(out.result.provider_execution,/no new external search/i);
});
test('cross-league research handles missing scores without throwing',()=>{
 const out=executeMessinhoCapability('cross_league_research',{players:[
  {name:'A',league:'Bundesliga'},{name:'B',league:'Ligue 1'}
 ]});
 assert.equal(out.status,'completed');
 assert.equal(out.result.leagues.length,2);
 assert.equal(out.result.leagues[0].average_score,null);
});
test('underdog and hidden-gem discovery require both market values and player metrics',()=>{
 const out=executeMessinhoCapability('hidden_gem_detection',{players:[
  {id:1,name:'Measured prospect',market_value_eur:1000000,ratings:{Technik:4,Taktik:4,Athletik:4,Mental:4}},
  {id:2,name:'Missing value',ratings:{Technik:4,Taktik:4,Athletik:4,Mental:4}}
 ]});
 assert.equal(out.status,'completed');
 assert.equal(out.result.candidates.length,1);
 assert.equal(out.result.candidates[0].id,1);
});
test('scout feedback learning uses only verified ratings and does not train',()=>{
 const out=executeMessinhoCapability('scout_feedback_learning',{outcomes:[
  {player_id:'1',scout_id:'s1',scout_rating:80,target_score:70,verification_status:'verified',verified_by:'admin'},
  {player_id:'2',scout_id:'s1',scout_rating:50,target_score:60,verification_status:'verified',verified_by:'admin'},
  {player_id:'3',scout_id:'s2',scout_rating:90,target_score:50,verification_status:'pending',verified_by:'admin'}
 ]});
 assert.equal(out.status,'completed');
 assert.equal(out.result.scouts.length,1);
 assert.equal(out.result.scouts[0].mean_absolute_error,10);
 assert.equal(out.result.model_weights_changed,false);
});
test('cohort learning remains descriptive and refuses unverified samples',()=>{
 const insufficient=executeMessinhoCapability('league_learning',{outcomes:[
  {player_id:'1',league:'A',target_score:80,verification_status:'pending',verified_by:'admin'}
 ]});
 assert.equal(insufficient.status,'insufficient_data');
 const result=executeMessinhoCapability('league_learning',{outcomes:[
  {player_id:'1',league:'A',target_score:80,verification_status:'verified',verified_by:'admin'},
  {player_id:'2',league:'B',target_score:70,verification_status:'verified',verified_by:'admin'}
 ]});
 assert.equal(result.status,'completed');
 assert.equal(result.result.training_performed,false);
});
test('controlled self-optimization can only propose, never activate or change weights',()=>{
 const outcomes=Array.from({length:30},(_,i)=>({player_id:String(i+1),position_group:'ST',target_score:65+i%20,
  dimension_scores:{technical:70,tactical:65,athletic:75,mental:70},verification_status:'verified',verified_by:'admin'}));
 const out=executeMessinhoCapability('controlled_self_optimization',{outcomes,minimum_examples:30});
 assert.ok(['proposal_ready','no_reliable_improvement'].includes(out.status));
 assert.equal(out.result.training_performed,false);
 assert.equal(out.result.model_weights_changed,false);
 assert.equal(out.result.activation,'blocked_until_admin_review');
});

test('capability outputs carry field-level provenance for player metrics',()=>{
 const out=executeMessinhoCapability('overall_score',{player:{player_id:42,name:'Test',ratings:{Technik:4,Taktik:3}}});
 assert.equal(out.provenance.capability_id,'overall_score');
 assert.equal(out.provenance.record_refs[0].id,42);
 assert.deepEqual(out.provenance.metric_evidence.map(x=>x.field).sort(),['Taktik','Technik']);
 assert.ok(out.provenance.claims.some(x=>x.kind==='derived_score'));
});
test('untrusted sources remain labelled as supplied and are not marked verified',()=>{
 const out=executeMessinhoCapability('source_cross_check',{sources:[{url:'https://example.org/report',title:'Report'}]});
 assert.equal(out.provenance.origin,'supplied_source_bundle');
 assert.equal(out.provenance.source_evidence.length,1);
 assert.ok(out.provenance.limitations.some(x=>x.includes('not treated as verified')));
});
