import test from 'node:test';
import assert from 'node:assert/strict';
import {dispatchMessinhoMyKiProposals,persistMessinhoMyKiProposal} from '../backend/messinho-myki-bridge.js';

const diff=`diff --git a/backend/messinho-quality-control.js b/backend/messinho-quality-control.js
index 1111111..2222222 100644
--- a/backend/messinho-quality-control.js
+++ b/backend/messinho-quality-control.js
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


import { persistAndDispatchMessinhoMyKiProposal } from '../backend/messinho-myki-bridge.js';
const engineeringProposal={
 id:'candidate-123456',title:'Sichere Verbesserung der Eingabeprüfung',
 rationale:'Eine konkrete Eingabegrenze wird nicht einheitlich geprüft und kann mit einem kleinen Patch abgesichert werden.',
 patch:'diff --git a/backend/messinho-input-correction.js b/backend/messinho-input-correction.js\nindex 1111111..2222222 100644\n--- a/backend/messinho-input-correction.js\n+++ b/backend/messinho-input-correction.js\n@@ -1 +1 @@\n-const value = 1;\n+const value = 2;\n',
 test_plan:['Grenzfall prüfen','Regression prüfen'],
 benchmark_id:'feature/messinho-autonomous-agent-semantic-planner@'+'a'.repeat(40),
 rollback_plan:'Vorherigen Commit wiederherstellen und Regressionstests erneut ausführen.'
};
function engineeringDb(){
 const calls=[];
 return {calls,async rpc(name,args){calls.push({type:'rpc',name,args});return {data:{ticket_id:'22222222-2222-4222-8222-222222222222'},error:null};},
  from(table){return {insert:async row=>{calls.push({type:'insert',table,row});return {error:null};},
   update:patch=>({eq:async()=>{calls.push({type:'update',table,patch});return {error:null};}})};}};
}
test('autonomous engineering proposal persists an Admin ticket but does not auto-run without explicit opt-in',async()=>{
 const db=engineeringDb();
 const result=await persistAndDispatchMessinhoMyKiProposal({db,proposal:engineeringProposal,role:'admin',requestedBy:'11111111-1111-4111-8111-111111111111',env:{}});
 assert.equal(result.ok,true);
 assert.equal(result.sandbox.status,'not_dispatched');
 assert.equal(result.sandbox.reason,'explicit_auto_review_opt_in_required');
 assert.equal(db.calls.filter(x=>x.type==='insert').length,0);
});
test('autonomous engineering sandbox dispatch requires Admin and the staging gate',async()=>{
 const db=engineeringDb();
 const denied=await persistAndDispatchMessinhoMyKiProposal({db,proposal:engineeringProposal,role:'scout',env:{}});
 assert.equal(denied.code,'MYKI_ADMIN_REQUIRED');
 const closed=await persistAndDispatchMessinhoMyKiProposal({db,proposal:engineeringProposal,role:'admin',env:{MESSINHO_AUTO_SANDBOX_REVIEW_ENABLED:'true'}});
 assert.equal(closed.sandbox.reason,'staging_gate_closed');
});
test('opted-in Admin engineering proposal is dispatched only against the pinned feature branch SHA',async()=>{
 const db=engineeringDb(),calls=[];
 const env={MESSINHO_AUTO_SANDBOX_REVIEW_ENABLED:'true',MESSINHO_SANDBOX_ENABLED:'true',RENDER:'true',
  RENDER_SERVICE_ID:'staging-id',MESSINHO_STAGING_RENDER_SERVICE_ID:'staging-id',MESSINHO_SANDBOX_GITHUB_TOKEN:'token'};
 const fetchImpl=async(url,options={})=>{calls.push({url,options});return url.includes('/commits/')?{ok:true,json:async()=>({sha:'a'.repeat(40)})}:{status:204};};
 const result=await persistAndDispatchMessinhoMyKiProposal({db,proposal:engineeringProposal,role:'admin',
  requestedBy:'11111111-1111-4111-8111-111111111111',env,fetchImpl});
 assert.equal(result.ok,true);
 assert.equal(result.sandbox.status,'queued');
 assert.equal(result.sandbox.branch,'feature/messinho-autonomous-agent-semantic-planner');
 assert.equal(db.calls.find(x=>x.type==='insert').row.requested_by,'11111111-1111-4111-8111-111111111111');
 assert.equal(JSON.parse(calls[1].options.body).ref,'feature/messinho-autonomous-agent-semantic-planner');
});
