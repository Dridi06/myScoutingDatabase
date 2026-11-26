import test from 'node:test';
import assert from 'node:assert/strict';
import { getMessinhoCapabilityCatalog } from '../backend/messinho-capabilities.js';
import { executeMessinhoCapability, getMessinhoRuntimeSummary, listExecutableMessinhoCapabilities } from '../backend/messinho-capability-runtime.js';

test('all 100 catalogue functions have unique executable runtime handlers',()=>{
 const summary=getMessinhoRuntimeSummary();
 assert.equal(summary.total_catalogue_entries,100);
 assert.equal(summary.registered_handlers,100);
 assert.equal(summary.unique_handlers,100);
 assert.equal(summary.all_registered,true);
 assert.equal(listExecutableMessinhoCapabilities().flatMap(g=>g.functions).filter(x=>x.execution_handler_available).length,100);
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


test('verified structured contract snapshots power contract expiry analysis',()=>{
 const out=executeMessinhoCapability('contract_expiry_monitor',{
   now:'2026-01-01T00:00:00.000Z',
   contract_records:[{
     club_name:'Test FC',contract_status:'active',contract_end:'2026-08-01',
     verification_status:'verified',source_url:'https://club.example/contract',
     confidence:0.95,is_current:true
   }]
 });
 assert.equal(out.status,'completed');
 assert.equal(out.result.verified_contract_records,1);
 assert.equal(out.result.contracts[0].days_until_expiry,212);
 assert.equal(out.result.expiring_within_12_months.length,1);
});

test('unverified structured contract snapshots are surfaced for review, never treated as verified',()=>{
 const out=executeMessinhoCapability('contract_research',{
   contract_records:[{contract_end:'2026-08-01',verification_status:'unconfirmed',source_url:'https://club.example/contract'}]
 });
 assert.equal(out.status,'needs_review');
 assert.equal(out.result.unverified_contract_records,1);
 assert.equal(out.result.verified_contract_records,undefined);
});


test('club research never claims completion from a club name alone',()=>{
 const out=executeMessinhoCapability('club_research',{club_profile:{name:'Test FC'},sources:[]});
 assert.equal(out.status,'insufficient_data');
 assert.ok(out.missing_inputs.includes('club_sources'));
});
