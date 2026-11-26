import test from 'node:test';
import assert from 'node:assert/strict';
import { loadMessinhoCapabilityContext } from '../backend/messinho-data-loader.js';

function fakeDb(fixtures={}){
 const calls=[];
 return {
  calls,
  from(table){
   const state={table,filters:[],orders:[],limit:null,columns:null};
   const builder={
    select(columns){state.columns=columns;return this;},
    eq(column,value){state.filters.push({op:'eq',column,value});return this;},
    in(column,values){state.filters.push({op:'in',column,values});return this;},
    order(column,options){state.orders.push({column,options});return this;},
    limit(value){state.limit=value;return this;},
    then(resolve,reject){
      calls.push(state);
      return Promise.resolve({data:fixtures[table]||[],error:null}).then(resolve,reject);
    }
   };
   return builder;
  }
 };
}

const plan={goal:'Analysiere die Entwicklung, prüfe Quellen und Prognosen',steps:[
 'performance_development','video_event_analysis','identity_verification','contract_research',
 'prediction_audit','scout_feedback_learning'
]};

test('scout data loader applies owner_id to every private read and leaves only the global source registry unscoped',async()=>{
 const db=fakeDb({
  asi_external_evidence:[{id:'e1',source_id:'src1',source_url:'https://club.example',verification_status:'unconfirmed'}],
  asi_prediction_records:[{id:'p1',player_id:42,predicted_value:70}],
  asi_prediction_outcomes:[{id:'o1',prediction_id:'p1',player_id:42,observed_value:72,verification_status:'verified',verified_by:'admin'}],
  asi_external_sources:[{id:'src1',license_status:'approved',permitted_purposes:['video_analysis']}]
 });
 const context=await loadMessinhoCapabilityContext({
  db,player:{player_id:42,name:'Test Player',ratings:{technical:80}},players:[{player_id:42,name:'Test Player'}],
  plan,actor:{user:{id:'scout-1'},profile:{role:'scout'}},now:Date.parse('2026-01-01T00:00:00Z')
 });
 assert.ok(context.data_context);
 assert.ok(db.calls.length>=8);
 for(const call of db.calls.filter(item=>item.table!=='asi_external_sources')){
  assert.ok(call.filters.some(filter=>filter.op==='eq'&&filter.column==='owner_id'&&filter.value==='scout-1'),
    'Missing owner scope on '+call.table);
 }
 const registry=db.calls.find(item=>item.table==='asi_external_sources');
 assert.ok(registry);
 assert.ok(!registry.filters.some(filter=>filter.column==='owner_id'));
 const observation=db.calls.find(item=>item.table==='asi_player_observations');
 assert.ok(observation.filters.some(filter=>filter.column==='player_id'&&filter.value===42));
 assert.equal(context.predictions[0].verification_status,'verified');
});

test('admin data loader retains the existing admin-wide access policy without adding scout owner filters',async()=>{
 const db=fakeDb({asi_scout_calibration_records:[],asi_prediction_records:[],players:[]});
 await loadMessinhoCapabilityContext({
  db,player:{name:'Admin learning'},players:[],plan:{goal:'Prüfe Prognosefehler',steps:['prediction_audit']},
  actor:{user:{id:'admin-1'},profile:{role:'admin'}},now:Date.parse('2026-01-01T00:00:00Z')
 });
 assert.ok(db.calls.length>0);
 assert.ok(db.calls.every(call=>!call.filters.some(filter=>filter.column==='owner_id')));
});

test('candidate evidence is owner-scoped and remains untrusted until review criteria are met',async()=>{
 const db=fakeDb({asi_candidate_evidence:[{
  source_url:'https://candidate.example',verification_status:'unconfirmed',
  identity_status:'pending',review_status:'pending',legal_review_status:'not_approved',
  data_classification:'ordinary'
 }]});
 const context=await loadMessinhoCapabilityContext({
  db,player:{id:'candidate-1',player_name:'Candidate One',sources:[]},players:[],
  plan:{goal:'Prüfe Identität',steps:['identity_verification']},
  actor:{user:{id:'scout-2'},profile:{role:'scout'}},now:Date.parse('2026-01-01T00:00:00Z')
 });
 const call=db.calls.find(item=>item.table==='asi_candidate_evidence');
 assert.ok(call.filters.some(filter=>filter.column==='owner_id'&&filter.value==='scout-2'));
 assert.ok(call.filters.some(filter=>filter.column==='candidate_id'&&filter.value==='candidate-1'));
 assert.equal(context._trusted_source_bundle,false);
 assert.equal(context.claims.length,0);
});
