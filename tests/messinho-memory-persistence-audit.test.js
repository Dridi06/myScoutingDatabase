import test from 'node:test';
import assert from 'node:assert/strict';
import { runMessinhoMemoryPersistenceAudit } from '../backend/messinho-memory-persistence-audit.js';

function createMemoryDb({failDelete=false}={}){
 const deleted=[];
 return {deleted,from(table){
  if(table==='messinho_agent_memory')return {select(){return this;},eq(){return this;},maybeSingle:async()=>({data:null,error:null})};
  assert.equal(table,'messinho_knowledge_memory');
  return {delete(){return this;},eq(){return this;},select:async()=>failDelete
   ?{data:null,error:{message:'cleanup denied'}}
   :{data:[{id:'audit-row-1'}],error:null}};
 }};
}
const store=async()=>({persisted:true,id:'audit-row-1'});
const find=async(_db,ownerId)=>({status:'hit',match:'exact',record:{id:'audit-row-1',owner_id:ownerId}});

test('real memory audit confirms owner-scoped write/read and exact cleanup contract',async()=>{
 const db=createMemoryDb(),ownerId='11111111-1111-4111-8111-111111111111';
 const result=await runMessinhoMemoryPersistenceAudit({db,ownerId,store,find});
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.evidence.write_confirmed,true);
 assert.equal(result.evidence.readback_confirmed,true);
 assert.equal(result.evidence.owner_scope_confirmed,true);
 assert.equal(result.evidence.agent_memory_read.table_accessible,true);
 assert.equal(result.evidence.cleanup.confirmed,true);
});

test('memory audit never reports PASS when temporary record cleanup is not confirmed',async()=>{
 const db=createMemoryDb({failDelete:true}),ownerId='11111111-1111-4111-8111-111111111111';
 const result=await runMessinhoMemoryPersistenceAudit({db,ownerId,store,find});
 assert.equal(result.ok,false);
 assert.equal(result.evidence.cleanup.confirmed,false);
});

test('memory audit reports NOT_VERIFIED when database or authenticated owner is missing',async()=>{
 const result=await runMessinhoMemoryPersistenceAudit({db:null,ownerId:null});
 assert.equal(result.ok,false);
 assert.equal(result.status,'NOT_VERIFIED');
 assert.equal(result.evidence.database_write,false);
});
