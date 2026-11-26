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

test('verified domain knowledge is passed as explanatory context but never changes player scoring',()=>{
 const knowledge={domain:'medicine',question:'Sportmedizinische Grundlagen',content:'Eine Verletzungsbeurteilung benötigt fachliche Untersuchung und darf nicht aus Scoutingdaten abgeleitet werden.',claims:['Medizinische Freigaben benötigen fachliche Beurteilung.'],sources:[{title:'Permitted source',url:'https://example.org/medical'}],rights:{status:'verified_permitted',ai_tdm:true,commercial_use:true,derivative_use:true},verified_at:'2026-11-26T00:00:00.000Z',confidence:0.95};
 const score=executeMessinhoCapability('overall_score',{player:{name:'Test',positions:['Stürmer'],ratings:{Technik:4,Taktik:4,Athletik:4,Mental:4}},goal:'medizinische Bewertung',_messinho_domain_knowledge:[knowledge]});
 assert.equal(score.status,'completed');
 assert.equal(score.knowledge_context,undefined,'medical reference knowledge must not affect talent scoring');
 const report=executeMessinhoCapability('holistic_player_analysis',{player:{name:'Test',positions:['Stürmer'],ratings:{Technik:4,Taktik:4,Athletik:4,Mental:4}},goal:'sportmedizinische Einordnung',_messinho_domain_knowledge:[knowledge]});
 assert.equal(report.knowledge_context.mode,'verified_reference_context');
 assert.equal(report.knowledge_context.applied_to_explanation_only,true);
 assert.equal(report.knowledge_context.score_or_model_weights_changed,false);
});
test('unverified or incomplete knowledge records are never passed into capability results',()=>{
 const bad={domain:'medicine',question:'Medical',content:'Unverified text',sources:[{title:'Source',url:'https://example.org'}],rights:{status:'unknown',ai_tdm:false}};
 const result=executeMessinhoCapability('holistic_player_analysis',{player:{name:'Test',ratings:{Technik:4}},goal:'medizin',_messinho_domain_knowledge:[bad]});
 assert.equal(result.knowledge_context,undefined);
});
