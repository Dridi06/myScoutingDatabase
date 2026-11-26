import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMyKiTicketProposal,createMyKiTicketRecord,validateMyKiTransition,buildMyKiCopyPacket} from '../backend/messinho-myki-tickets.js';

const valid={title:'Schnellere Analyse',explanation:'Die Analyse wird robuster und schneller.',rationale:'Weniger doppelte Berechnungen.',diff:'export const result = 1;',files:['backend/analysis.js'],tests:[{name:'unit',status:'passed'}],risks:'Keine bekannten Risiken.',rollback:'Vorherigen Commit wiederherstellen.',baseline_id:'base-1',candidate_id:'candidate-1'};

test('normalizes complete proposal and fingerprints it',()=>{const r=normalizeMyKiTicketProposal(valid);assert.equal(r.ok,true);assert.equal(r.value.fingerprint.length,64);});
test('rejects incomplete, oversized, secret-bearing and protected proposals',()=>{
 assert.equal(normalizeMyKiTicketProposal({}).ok,false);
 assert.equal(normalizeMyKiTicketProposal({...valid,diff:'x'.repeat(24001)}).ok,false);
 assert.equal(normalizeMyKiTicketProposal({...valid,diff:'const x=process.env.SUPABASE_SERVICE_ROLE_KEY'}).ok,false);
 assert.equal(normalizeMyKiTicketProposal({...valid,files:['supabase/migrations/unsafe.sql']}).ok,false);\n assert.equal(normalizeMyKiTicketProposal({...valid,files:['backend/server.js']}).ok,false);\n assert.equal(normalizeMyKiTicketProposal({...valid,diff:'fetch(\"https://example.com\")'}).ok,false);
});
test('creates immutable server-side ticket identifier',()=>{const r=createMyKiTicketRecord(valid,{now:new Date('2026-11-27T12:00:00Z'),id:'abcdef123456'});assert.equal(r.ok,true);assert.equal(r.ticket.ticket_id,'MYKI-2026-ABCDEF123456');assert.equal(r.ticket.status,'submitted');});
test('requires approved Admin and rejects premature integration',()=>{
 assert.equal(validateMyKiTransition('submitted','reviewing',{actorRole:'scout',approved:true}).ok,false);
 assert.equal(validateMyKiTransition('ready_for_staging','integrating',{actorRole:'admin',approved:true}).ok,false);
 assert.equal(validateMyKiTransition('integrating','integrated',{actorRole:'admin',approved:true}).ok,false);
 const verified={commit_sha:'abc',tests_passed:true,security_passed:true,tenant_isolation_passed:true,staging_health_passed:true,deployed:true};
 assert.equal(validateMyKiTransition('integrating','integrated',{actorRole:'admin',approved:true,verification:verified}).ok,true);
});
test('copy packet is sanitized and excludes auth secrets',()=>{const r=createMyKiTicketRecord(valid,{id:'abcdef123456'});const p=buildMyKiCopyPacket(r.ticket);assert.equal(p.ok,true);assert.equal(p.text.includes('SUPABASE_SERVICE_ROLE_KEY'),false);});
