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
