import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMessinhoDiagnosticTicket,persistMessinhoDiagnosticTicket} from '../backend/messinho-diagnostic-ticket.js';

const failed=[{name:'Runtime-Prüfung',category:'Runtime',severity:'critical',ok:false,detail:'Server antwortet nicht.'}];
test('creates a diagnostic-only ticket for failed checks without fabricating a code patch',()=>{
 const result=buildMessinhoDiagnosticTicket({checks:[{ok:true,name:'Healthy' },...failed],now:new Date('2026-11-27T12:00:00Z'),id:'123e4567-e89b-12d3-a456-426614174000'});
 assert.equal(result.ok,true);
 assert.match(result.ticket.ticket_id,/^MYKI-2026-/);
 assert.equal(result.ticket.error_code,'diagnostic_finding');
 assert.equal(result.ticket.diff,'');
 assert.deepEqual(result.ticket.files,[]);
 assert.equal(result.ticket.tests[0].status,'failed');
 assert.match(result.ticket.explanation,/Server antwortet nicht/);
 assert.match(result.ticket.rollback,/kein Quellcode geändert/);
});
test('does not create a ticket when every diagnostic check passed',()=>{
 assert.equal(buildMessinhoDiagnosticTicket({checks:[{ok:true}]}).code,'NO_FAILED_DIAGNOSTICS');
});
test('persists a diagnostic-only ticket and confirms the returned identity',async()=>{
 let inserted=null;
 const db={from(table){assert.equal(table,'messinho_myki_tickets');return {insert(row){inserted=row;return {select(){return {single:async()=>({data:{id:row.id,ticket_id:row.ticket_id},error:null})};}};}};}};
 const result=await persistMessinhoDiagnosticTicket({db,checks:failed,id:()=> '123e4567-e89b-12d3-a456-426614174000',now:new Date('2026-11-27T12:00:00Z')});
 assert.equal(result.ok,true);
 assert.equal(result.duplicate,false);
 assert.equal(inserted.error_code,'diagnostic_finding');
 assert.equal(inserted.diff,'');
});
test('reuses the existing diagnostic ticket on fingerprint conflict',async()=>{
 const db={from(){return {insert(){return {select(){return {single:async()=>({data:null,error:{code:'23505'}})};}};},select(){return {eq(){return {maybeSingle:async()=>({data:{id:'existing-id',ticket_id:'MYKI-EXISTING'},error:null})};}};}};}};
 const result=await persistMessinhoDiagnosticTicket({db,checks:failed,id:()=> '123e4567-e89b-12d3-a456-426614174000',now:new Date('2026-11-27T12:00:00Z')});
 assert.equal(result.ok,true);
 assert.equal(result.duplicate,true);
 assert.equal(result.ticket_id,'MYKI-EXISTING');
});
