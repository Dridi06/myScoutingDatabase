import test from 'node:test';
import assert from 'node:assert/strict';
import { runMessinhoMemoryPersistenceAudit } from '../backend/messinho-memory-persistence-audit.js';

function createMemoryDb({failDelete=false}={}){
 const rows=[];
 return {rows,from(table){
  assert.ok(['messinho_knowledge_memory','messinho_agent_memory'].includes(table));
  const state={op:null,record:null,filters:{}};
  const query={
   upsert(record){state.op='upsert';state.record={...record,id:'audit-row-1'};return this;},
   select(){return this;},
   maybeSingle(){return Promise.resolve({data:state.op==='upsert'?state.record:(rows.find(row=>Object.entries(state.filters).every(([key,value])=>value&&typeof value==='object'&&'gt' in value?row[key]>value.gt:row[key]===value))||null),error:null});},
   eq(key,value){if(value!==undefined)state.filters[key]=value;return this;},
   gt(key,value){state.filters[key]={gt:value};return this;},
   update(values){state.op='update';state.record=values;return this;},
   delete(){state.op='delete';return this;},
   then(resolve,reject){
    if(state.op==='upsert'){const index=rows.findIndex(row=>row.owner_id===state.record.owner_id&&row.question_fingerprint===state.record.question_fingerprint);if(index>=0)rows[index]={...rows[index],...state.record};else rows.push(state.record);return Promise.resolve({data:state.record,error:null}).then(resolve,reject);}
    if(state.op==='update'){const row=rows.find(item=>Object.entries(state.filters).every(([key,value])=>item[key]===value));if(row)Object.assign(row,state.record);return Promise.resolve({data:null,error:null}).then(resolve,reject);}
    return Promise.resolve({data:null,error:null}).then(resolve,reject);
   }
  };
  const originalSelect=query.select.bind(query);
  query.select=(...args)=>{if(state.op==='delete'){query.then=(resolve,reject)=>{if(failDelete)return Promise.resolve({data:null,error:{message:'cleanup denied'}}).then(resolve,reject);const index=rows.findIndex(row=>Object.entries(state.filters).every(([key,value])=>row[key]===value));const deleted=index>=0?[rows.splice(index,1)[0]]:[];return Promise.resolve({data:deleted,error:null}).then(resolve,reject);};}return originalSelect(...args);};
  const originalEq=query.eq.bind(query);
  query.eq=(key,value)=>{if(value!==undefined)state.filters[key]=value;return query;};
  return query;
 }};
}

test('real memory audit writes, reads exact owner-scoped record and cleans it up',async()=>{
 const db=createMemoryDb(),ownerId='11111111-1111-4111-8111-111111111111';
 const result=await runMessinhoMemoryPersistenceAudit({db,ownerId});
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.evidence.write_confirmed,true);
 assert.equal(result.evidence.readback_confirmed,true);
 assert.equal(result.evidence.owner_scope_confirmed,true);
 assert.equal(result.evidence.cleanup.confirmed,true);
 assert.equal(db.rows.length,0);
});

test('memory audit never reports PASS when temporary record cleanup is not confirmed',async()=>{
 const db=createMemoryDb({failDelete:true}),ownerId='11111111-1111-4111-8111-111111111111';
 const result=await runMessinhoMemoryPersistenceAudit({db,ownerId});
 assert.equal(result.ok,false);
 assert.equal(result.evidence.cleanup.confirmed,false);
 assert.equal(db.rows.length,1);
});

test('memory audit reports NOT_VERIFIED when database or authenticated owner is missing',async()=>{
 const result=await runMessinhoMemoryPersistenceAudit({db:null,ownerId:null});
 assert.equal(result.ok,false);
 assert.equal(result.status,'NOT_VERIFIED');
 assert.equal(result.evidence.database_write,false);
});
