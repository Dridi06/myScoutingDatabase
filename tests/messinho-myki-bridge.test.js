import test from 'node:test';
import assert from 'node:assert/strict';
import {dispatchMessinhoMyKiProposals,persistMessinhoMyKiProposal} from '../backend/messinho-myki-bridge.js';

const diff=`diff --git a/backend/example.js b/backend/example.js
index 1111111..2222222 100644
--- a/backend/example.js
+++ b/backend/example.js
@@ -1 +1 @@
-const value = 1;
+const value = 2;
`;
const proposal={id:'proposal-bridge-01',title:'Robustere Fehlerbehandlung',rationale:'Ein reproduzierbarer Randfall wird bisher nicht ausreichend abgefangen und soll kontrolliert behandelt werden.',patch:diff,test_plan:['Normalfall und Grenzfall prüfen','Regression und Fehlerpfad prüfen'],benchmark_id:'baseline-bridge-1',rollback_plan:'Vorherigen Commit wiederherstellen und den Regressionstest erneut ausführen.'};

test('dispatches only explicit proposal_ready payloads from Admin agent results',async()=>{
 const calls=[];
 const run={status:'completed',completed_steps:3,total_steps:3,results:[
  {capability_id:'controlled_self_optimization',status:'proposal_ready',result:{myki_engineering_proposal:proposal}},
  {capability_id:'dataset_quality_improvement',status:'proposal_ready',result:{proposal:{not:'software patch'}}},
  {capability_id:'other',status:'completed',result:{myki_engineering_proposal:proposal}}
 ]};
 const r=await dispatchMessinhoMyKiProposals({role:'admin',run,onProposal:async p=>{calls.push(p);return {ok:true};}});
 assert.equal(calls.length,1);assert.equal(r.eligible,1);assert.equal(r.submitted,1);
});

test('never dispatches for Scout or without a callback',async()=>{
 let called=false;
 const run={results:[{capability_id:'x',status:'proposal_ready',result:{myki_engineering_proposal:proposal}}]};
 assert.equal((await dispatchMessinhoMyKiProposals({role:'scout',run,onProposal:async()=>{called=true;}})).eligible,0);
 assert.equal((await dispatchMessinhoMyKiProposals({role:'admin',run})).eligible,0);
 assert.equal(called,false);
});

test('persists a validated proposal as a review-only myKI ticket',async()=>{
 let rpcCall;
 const db={rpc:async(name,args)=>{rpcCall={name,args};return {data:{ticket_id:'MYKI-2026-TEST'},error:null};}};
 const r=await persistMessinhoMyKiProposal({db,proposal,id:'abcdef123456'});
 assert.equal(r.ok,true);assert.equal(rpcCall.name,'asi_create_messinho_myki_ticket');
 assert.equal(rpcCall.args.p_ticket.status,'submitted');
 assert.equal(rpcCall.args.p_ticket.tests[0].status,'not_run');
 assert.equal(rpcCall.args.p_ticket.diff,proposal.patch);
 assert.equal(rpcCall.args.p_ticket.explanation.includes('kein Code angewendet'),true);
});

test('rejects unsafe patches before database persistence',async()=>{
 let called=false;const db={rpc:async()=>{called=true;return {data:null,error:null};}};
 const r=await persistMessinhoMyKiProposal({db,proposal:{...proposal,patch:diff.replace('const value = 2;','process.env.SECRET')}});
 assert.equal(r.ok,false);assert.equal(r.code,'MYKI_PROPOSAL_REJECTED');assert.equal(called,false);
});

test('returns a stable duplicate outcome without fabricating a new ticket',async()=>{
 const db={rpc:async()=>({data:null,error:{code:'23505'}})};
 const r=await persistMessinhoMyKiProposal({db,proposal,id:'abcdef123456'});
 assert.equal(r.ok,true);assert.equal(r.duplicate,true);assert.equal(r.code,'MYKI_DUPLICATE');
});

test('does not dispatch proposals from partial or incomplete agent runs',async()=>{
 let called=false;
 const run={status:'partial',completed_steps:1,total_steps:2,results:[{capability_id:'x',status:'proposal_ready',result:{myki_engineering_proposal:proposal}}]};
 const r=await dispatchMessinhoMyKiProposals({role:'admin',run,onProposal:async()=>{called=true;return {ok:true};}});
 assert.equal(r.skipped,'agent_run_incomplete');assert.equal(called,false);
});
