import test from 'node:test';
import assert from 'node:assert/strict';
import { getMessinhoCapabilityCatalog, getMessinhoCapabilitySummary } from '../backend/messinho-capabilities.js';
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
 const concept={domain:'medicine',title:'Verletzungsprävention',definition:'Eine evidenzbasierte Prävention verbindet Belastungssteuerung, individuelle Vorgeschichte und geeignete Präventionsmaßnahmen.',knowledge_level:'specialist',knowledge_type:'principle',formula:null,limitations:['Keine Diagnose oder medizinische Freigabe.'],claims:['Prävention benötigt eine individuelle Belastungssteuerung.'],sources:[{title:'Permitted source A',url:'https://example.org/a'},{title:'Permitted source B',url:'https://example.net/b'}],rights:{status:'verified_permitted',ai_tdm:true,commercial_use:true,derivative_use:true},valid_from:'2026-11-26T00:00:00.000Z',confidence:0.96};
 const report=executeMessinhoCapability('holistic_player_analysis',{player:{name:'Test',positions:['Stürmer'],ratings:{Technik:4,Taktik:4,Athletik:4,Mental:4}},goal:'sportmedizinische Einordnung',_messinho_domain_knowledge:[knowledge],_messinho_knowledge_concepts:[concept]});
 assert.equal(report.knowledge_context.mode,'verified_reference_context');
 assert.equal(report.knowledge_context.applied_to_explanation_only,true);
 assert.equal(report.knowledge_context.score_or_model_weights_changed,false);
 assert.ok(report.knowledge_context.entries.some(item=>item.knowledge_level==='specialist'&&item.formula===null));
});
test('approved VO2max foundation knowledge is passed into relevant scouting explanation without changing scores',()=>{
 const concept={domain:'sports_science',title:'VO2max maximale Sauerstoffaufnahme',
  definition:'VO2max bezeichnet die maximale Sauerstoffaufnahme des Körpers unter intensiver Belastung.',
  applicability:'Im Fußball-Scouting als Baustein zur Einordnung der aeroben Leistungsfähigkeit und Ausdauerbasis.',
  knowledge_level:'foundational',knowledge_type:'metric',formula:null,
  limitations:['Geschätzte Werte sind nicht mit einer direkten Spiroergometrie/CPET gleichzusetzen.'],
  claims:['VO2max is maximal oxygen uptake.'],
  sources:[{title:'PLOS ONE',url:'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0280897'},{title:'PMC',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11269081/'}],
  rights:{status:'verified_permitted',ai_tdm:true,commercial_use:true,derivative_use:true},valid_from:'2026-11-26T20:31:43.000Z',confidence:0.88};
 const report=executeMessinhoCapability('holistic_player_analysis',{
  player:{name:'Testspieler',positions:['Stürmer'],ratings:{Technik:4,Taktik:4,Athletik:4,Mental:4}},
  goal:'Analysiere VO2max und aerobe Leistungsfähigkeit dieses Spielers',
  _messinho_knowledge_concepts:[concept]
 });
 assert.equal(report.knowledge_context.mode,'verified_reference_context');
 assert.equal(report.knowledge_context.applied_to_explanation_only,true);
 assert.equal(report.knowledge_context.score_or_model_weights_changed,false);
 assert.ok(report.knowledge_context.entries.some(item=>item.domain==='sports_science'&&/maximale Sauerstoffaufnahme/.test(item.knowledge)));
 assert.ok(report.knowledge_context.entries[0].limitations.some(item=>/CPET/.test(item)));
});

test('unverified or incomplete knowledge records are never passed into capability results',()=>{
 const bad={domain:'medicine',question:'Medical',content:'Unverified text',sources:[{title:'Source',url:'https://example.org'}],rights:{status:'unknown',ai_tdm:false}};
 const result=executeMessinhoCapability('holistic_player_analysis',{player:{name:'Test',ratings:{Technik:4}},goal:'medizin',_messinho_domain_knowledge:[bad]});
 assert.equal(result.knowledge_context,undefined);
});

test('all six learning capabilities with existing domain handlers are classified as specialist logic',()=>{
 const summary=getMessinhoRuntimeSummary();
 assert.equal(summary.total_catalogue_entries,100);
 assert.equal(summary.specialist_logic_count,100);
 assert.equal(summary.generic_fallback_count,0);
 assert.equal(summary.completion_verified_count,0);
 const rows=listExecutableMessinhoCapabilities().flatMap(group=>group.functions);
 const learningIds=['supervised_learning','weight_optimization','country_learning','talent_pathway_learning','breakthrough_learning','controlled_self_optimization'];
 for(const id of learningIds){
  const row=rows.find(item=>item.id===id);
  assert.equal(row.specialist_logic_available,true,id);
  assert.equal(row.implementation_level,'specialist_logic',id);
  assert.equal(row.completion_verified,false,id);
 }
});

test('the six learning handlers execute their existing verified-data logic without mutating model weights',()=>{
 const outcomes=Array.from({length:30},(_,i)=>({
  player_id:'player-'+i,position_group:'ST',target_score:50+(i%10)*3,
  verification_status:'verified',verified_by:'admin-1',
  dimension_scores:{technical:40+(i%10)*4,tactical:45+(i%10)*3,athletic:50+(i%10)*2,mental:55+(i%10)}
 }));
 for(const id of ['supervised_learning','weight_optimization','controlled_self_optimization']){
  const out=executeMessinhoCapability(id,{outcomes,minimum_examples:30});
  assert.ok(['proposal_ready','no_reliable_improvement'].includes(out.status),id+' '+out.status);
  assert.equal(out.result.verified_examples,30,id);
  assert.equal(out.result.training_performed,false,id);
  assert.equal(out.result.model_weights_changed,false,id);
  assert.equal(out.result.activation,'admin_approval_required',id);
 }
 const country=executeMessinhoCapability('country_learning',{outcomes:[
  {player_id:'a',country:'DE',target_score:70,verification_status:'verified',verified_by:'admin-1'},
  {player_id:'b',country:'FR',target_score:75,verification_status:'verified',verified_by:'admin-1'}
 ]});
 assert.equal(country.status,'completed');
 assert.equal(country.result.grouping,'country');
 assert.equal(country.result.groups.length,2);
 assert.equal(country.result.model_weights_changed,false);
 const paths=[
  {player_id:'a',verification_status:'verified',observations:[{date:'2024-01-01',score:55},{date:'2025-01-01',score:78}]},
  {player_id:'b',verification_status:'verified',observations:[{date:'2024-01-01',score:60},{date:'2025-01-01',score:63}]}
 ];
 const pathway=executeMessinhoCapability('talent_pathway_learning',{development_paths:paths});
 assert.equal(pathway.status,'completed');
 assert.equal(pathway.result.verified_players,2);
 const breakthrough=executeMessinhoCapability('breakthrough_learning',{development_paths:paths});
 assert.equal(breakthrough.status,'completed');
 assert.equal(breakthrough.result.breakthrough_count,1);
 assert.equal(breakthrough.result.training_performed,false);
 assert.equal(breakthrough.result.model_weights_changed,false);
});

test('capability catalogue does not report existing specialist handlers as requiring new integration',()=>{
 const summary=getMessinhoCapabilitySummary();
 assert.equal(summary.total,100);
 assert.equal(summary.by_status.implemented_existing_core,27);
 assert.equal(summary.by_status.partial_or_requires_validation,73);
 assert.equal(summary.by_status.requires_new_integration,0);
});


test('development projection exposes evidence-gated 12-month and outcome cohort forecasts',()=>{
 const time_series=[
  {verification_status:'verified',date:'2025-01-01',score:50},
  {verification_status:'verified',date:'2025-07-01',score:60},
  {verification_status:'verified',date:'2026-01-01',score:70}
 ];
 const success_history=Array.from({length:32},(_,i)=>({
  verification_status:'verified',position_group:'striker',success_definition:'first_team_500_minutes',age:20+(i%3),current_score:70+(i%5),success:i%3!==0
 }));
 const forecast=executeMessinhoCapability('development_projection',{
  player:{name:'Test',positions:['Stürmer'],ratings:{Technik:4,Taktik:4,Athletik:4,Mental:4},age:21},
  time_series,success_history,success_definition:'first_team_500_minutes'
 });
 assert.equal(forecast.status,'completed');
 assert.equal(forecast.result.development_forecast.status,'completed');
 assert.equal(forecast.result.outcome_forecast.status,'completed');
 assert.equal(forecast.result.outcome_forecast.verified_comparable_cases,32);
});

test('market value capability can return a historical forecast without inventing a current comparable range',()=>{
 const history=[
  {verification_status:'verified',date:'2025-01-01',value_eur:1000000,currency:'EUR'},
  {verification_status:'verified',date:'2025-07-01',value_eur:1500000,currency:'EUR'},
  {verification_status:'verified',date:'2026-01-01',value_eur:2000000,currency:'EUR'}
 ];
 const forecast=executeMessinhoCapability('market_value_assessment',{
  player:{name:'Test',positions:['Stürmer'],ratings:{Technik:4,Taktik:4,Athletik:4,Mental:4}},
  market_value_history:history
 });
 assert.equal(forecast.status,'completed');
 assert.equal(forecast.result.median,null);
 assert.equal(forecast.result.historical_value_forecast.status,'completed');
 assert.equal(forecast.result.estimate_only,true);
});
