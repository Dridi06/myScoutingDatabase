import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MESSINHO_SANDBOX_BRANCH } from '../backend/messinho-sandbox-dispatch.js';
import {buildMessinhoSelfRepairGoal,getMessinhoEngineeringReviewSchedule,isMessinhoEngineeringAutoReviewEnabled,isMessinhoEngineeringStagingService,runMessinhoScheduledEngineeringReview} from '../backend/messinho-engineering-scheduler.js';

const staging={MESSINHO_ENGINEERING_AUTOREVIEW_ENABLED:'true',RENDER:'true',RENDER_SERVICE_ID:'stage',MESSINHO_STAGING_RENDER_SERVICE_ID:'stage',OPENAI_API_KEY:'configured',SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'configured'};
test('engineering review, sandbox dispatch and workflow use the active staging branch',async()=>{
 const workflow=await readFile(new URL('../.github/workflows/messinho-isolated-engineering.yml',import.meta.url),'utf8');
 assert.equal(MESSINHO_SANDBOX_BRANCH,'feature/messinho-conversation-engine');
 assert.match(workflow,/branches: \[feature\/messinho-conversation-engine\]/);
 assert.match(workflow,/refs\/heads\/feature\/messinho-conversation-engine/);
});
test('daily review is strictly gated to the explicitly enabled staging service',()=>{
 assert.equal(isMessinhoEngineeringAutoReviewEnabled(staging),true);
 assert.equal(isMessinhoEngineeringAutoReviewEnabled({...staging,RENDER_SERVICE_ID:'production'}),false);
 assert.equal(isMessinhoEngineeringAutoReviewEnabled({...staging,MESSINHO_ENGINEERING_AUTOREVIEW_ENABLED:'false'}),false);
 assert.equal(isMessinhoEngineeringAutoReviewEnabled({...staging,OPENAI_API_KEY:''}),false);
});
test('review schedule enforces both Berlin work windows and rest periods',()=>{
 const morning=getMessinhoEngineeringReviewSchedule(new Date('2026-11-27T02:00:00Z'));
 assert.equal(morning.due,true);assert.equal(morning.review_slot,'morning');
 assert.equal(getMessinhoEngineeringReviewSchedule(new Date('2026-11-27T06:59:00Z')).due,true);
 const pause=getMessinhoEngineeringReviewSchedule(new Date('2026-11-27T07:00:00Z'));
 assert.equal(pause.due,false);assert.equal(pause.phase,'break');
 const day=getMessinhoEngineeringReviewSchedule(new Date('2026-11-27T09:00:00Z'));
 assert.equal(day.due,true);assert.equal(day.review_slot,'daytime');
 assert.equal(getMessinhoEngineeringReviewSchedule(new Date('2026-11-27T21:59:00Z')).due,true);
 const night=getMessinhoEngineeringReviewSchedule(new Date('2026-11-27T22:00:00Z'));
 assert.equal(night.due,false);assert.equal(night.phase,'night_rest');
 assert.equal(morning.review_date,'2026-11-27');
});
function mockDb({claimError=null,mode='developing',stopRequested=false}={}){
 const state={claim:null,update:null,control:{mode,stop_requested:stopRequested,updated_by:'admin-uuid'}};
 return {
  state,
  from(table){
   if(table==='messinho_agent_control'){
    return {select(){return {eq(){return {maybeSingle:async()=>({data:state.control,error:null})};}};}};
   }
   if(table==='messinho_myki_tickets')return {select(){return {eq(){return {maybeSingle:async()=>({data:state.ticket||null,error:null})};}};}};
  if(table==='messinho_engineering_jobs')return {insert(row){state.job=row;return Promise.resolve({error:null});},update(row){state.jobUpdate=row;return {eq:async()=>({error:null})};}};
  if(table==='messinho_myki_ticket_events')return {insert(row){state.event=row;return Promise.resolve({error:null});}};
  assert.equal(table,'messinho_engineering_review_runs');
   return {
    insert(row){
     state.claim=row;
     return {select(){return {maybeSingle:async()=>claimError?{data:null,error:claimError}:{data:{id:'run-1'},error:null}};}};
    },
    update(row){state.update=row;return {eq:async()=>({error:null})};}
   };
  }
 };
}
test('claims one review per Berlin work window and records no-improvement result without creating a ticket',async()=>{
 const db=mockDb();
 const result=await runMessinhoScheduledEngineeringReview({db,now:new Date('2026-11-27T02:00:00Z'),getCurrentTime:()=>new Date('2026-11-27T02:00:00Z'),generate:async()=>({ok:true,proposal:null,source_sha:'a'.repeat(40)})});
 assert.equal(result.status,'no_improvement');assert.equal(db.state.claim.review_date,'2026-11-27');assert.equal(db.state.claim.review_slot,'morning');assert.equal(db.state.update.status,'no_improvement');
});
test('does not duplicate an already claimed review window',async()=>{
 const db=mockDb({claimError:{code:'23505'}});
 const result=await runMessinhoScheduledEngineeringReview({db,now:new Date('2026-11-27T02:00:00Z')});
 assert.equal(result.skipped,'already_claimed');
});
test('creates a myKI ticket only for a real generated proposal',async()=>{
 const db=mockDb();let persisted=false;
 const result=await runMessinhoScheduledEngineeringReview({db,now:new Date('2026-11-27T02:00:00Z'),getCurrentTime:()=>new Date('2026-11-27T02:00:00Z'),
  generate:async()=>({ok:true,proposal:{title:'test'},source_sha:'b'.repeat(40)}),
  persist:async({proposal})=>{persisted=proposal.title==='test';return {ok:true,duplicate:false,ticket_id:'MYKI-TEST'};}
 });
 assert.equal(persisted,true);assert.equal(result.status,'ticket_created');assert.equal(db.state.update.ticket_id,'MYKI-TEST');
});


test('autonomous development is paused unless the admin explicitly selected develop mode',async()=>{
 const db=mockDb({mode:'paused'});
 const result=await runMessinhoScheduledEngineeringReview({db,now:new Date('2026-11-27T02:00:00Z')});
 assert.equal(result.skipped,'admin_mode_not_active');
 assert.equal(db.state.claim,null);
});

test('admin stop requested during generation prevents myKI ticket persistence',async()=>{
 const db=mockDb({mode:'developing'});
 let persisted=false;
 const result=await runMessinhoScheduledEngineeringReview({db,now:new Date('2026-11-27T02:00:00Z'),getCurrentTime:()=>new Date('2026-11-27T02:00:00Z'),
  generate:async()=>{db.state.control.stop_requested=true;return {ok:true,proposal:{title:'must not persist'},source_sha:'c'.repeat(40)};},
  persist:async()=>{persisted=true;return {ok:true,ticket_id:'must-not-exist'};}
 });
 assert.equal(result.status,'stopped');
 assert.equal(persisted,false);
 assert.equal(db.state.update.status,'failed');
 assert.equal(db.state.update.error_code,'ADMIN_STOP_REQUESTED');
});



test('admin-selected development can run in the daytime window',async()=>{
 const db=mockDb();
 const result=await runMessinhoScheduledEngineeringReview({db,now:new Date('2026-11-27T18:00:00Z'),getCurrentTime:()=>new Date('2026-11-27T18:00:00Z'),
  generate:async()=>({ok:true,proposal:null,source_sha:'e'.repeat(40)})});
 assert.equal(result.status,'no_improvement');assert.equal(db.state.claim.review_slot,'daytime');
});

test('does not persist a proposal when the work window ends during generation',async()=>{
 const db=mockDb();let persisted=false;
 const result=await runMessinhoScheduledEngineeringReview({db,now:new Date('2026-11-27T06:59:00Z'),
  getCurrentTime:()=>new Date('2026-11-27T07:00:00Z'),
  generate:async()=>({ok:true,proposal:{title:'must not persist'},source_sha:'d'.repeat(40)}),
  persist:async()=>{persisted=true;return {ok:true,ticket_id:'must-not-exist'};}
 });
 assert.equal(result.status,'stopped');assert.equal(persisted,false);
 assert.equal(db.state.update.error_code,'WORK_WINDOW_ENDED');
});


test('a real autonomous proposal is dispatched only to the isolated STAGING sandbox',async()=>{
 const db=mockDb();
 db.state.ticket={id:'123e4567-e89b-12d3-a456-426614174001',diff:'bounded patch content',baseline_id:'feature/messinho-conversation-engine@'+'b'.repeat(40)};
 let dispatched=null;
 const now=new Date('2026-11-27T02:00:00Z');
 const result=await runMessinhoScheduledEngineeringReview({db,now,getCurrentTime:()=>now,
  generate:async()=>({ok:true,proposal:{title:'test'},source_sha:'b'.repeat(40)}),
  persist:async()=>({ok:true,duplicate:false,ticket_id:'MYKI-TEST'}),
  env:{MESSINHO_SANDBOX_GITHUB_TOKEN:'configured'},sandboxAllowed:()=>true,
  hashPatch:()=> 'f'.repeat(64),makeJobId:()=> '123e4567-e89b-12d3-a456-426614174000',
  dispatch:async({job})=>{dispatched=job;return {ok:true};}
 });
 assert.equal(result.status,'ticket_created');assert.equal(result.sandbox_status,'queued');
 assert.equal(db.state.job.status,'queued');assert.equal(db.state.job.requested_by,'admin-uuid');
 assert.equal(dispatched.ticket_id,db.state.ticket.id);assert.equal(db.state.event.action,'sandbox_dispatched');
});

test('self-repair goal contains only failed, bounded diagnostic findings',()=>{
 const result=buildMessinhoSelfRepairGoal([
  {name:'DB read',category:'Datenbank',ok:true,detail:'ok'},
  {name:'Scoring',category:'Modell',ok:false,severity:'critical',detail:'reproduzierbarer Fehler',recommendation:'Ursache prüfen'},
  {name:'Runtime',ok:false,detail:'x'.repeat(900)}
 ]);
 assert.equal(result.ok,true);
 assert.equal(result.findings.length,2);
 assert.equal(result.findings[0].name,'Scoring');
 assert.equal(result.findings[1].detail.length,500);
 assert.match(result.goal,/reproduzierbarer Fehler/);
 assert.equal(buildMessinhoSelfRepairGoal([{ok:true}]).reason,'no_failed_diagnostics');
});
test('Arbeiten mode can run a self-repair review only when working mode is active',async()=>{
 const db=mockDb({mode:'working'});
 let generatedGoal='';
 const result=await runMessinhoScheduledEngineeringReview({
  db,mode:'working',goal:'Behebe die belegten Fehler aus der Diagnose.',
  now:new Date('2026-11-27T02:00:00Z'),getCurrentTime:()=>new Date('2026-11-27T02:00:00Z'),
  generate:async({goal})=>{generatedGoal=goal;return {ok:true,proposal:null,source_sha:'f'.repeat(40)};}
 });
 assert.equal(result.status,'no_improvement');
 assert.equal(generatedGoal,'Behebe die belegten Fehler aus der Diagnose.');
 assert.equal(db.state.claim.review_slot,'morning');
});
test('self-repair review does not run when admin mode changes or stop is requested',async()=>{
 const db=mockDb({mode:'working'});
 let persisted=false;
 const result=await runMessinhoScheduledEngineeringReview({
  db,mode:'working',now:new Date('2026-11-27T02:00:00Z'),getCurrentTime:()=>new Date('2026-11-27T02:00:00Z'),
  generate:async()=>{db.state.control.stop_requested=true;return {ok:true,proposal:{title:'must not persist'},source_sha:'f'.repeat(40)};},
  persist:async()=>{persisted=true;return {ok:true,ticket_id:'must-not-exist'};}
 });
 assert.equal(result.status,'stopped');
 assert.equal(persisted,false);
});

test('explicit admin development runs bypass only the automatic-review toggle and use a unique manual slot on staging',async()=>{
 const db=mockDb();
 const now=new Date('2026-11-27T18:00:00Z');
 const result=await runMessinhoScheduledEngineeringReview({
  db,mode:'developing',force:true,now,getCurrentTime:()=>now,env:{RENDER:'true',RENDER_SERVICE_ID:'stage',MESSINHO_STAGING_RENDER_SERVICE_ID:'stage'},
  makeJobId:()=> '123e4567-e89b-12d3-a456-426614174000',
  generate:async()=>({ok:true,proposal:null,source_sha:'a'.repeat(40)})
 });
 assert.equal(result.status,'no_improvement');
 assert.equal(db.state.claim.review_slot,'manual_123e4567e89b12d3a4564266');
 assert.equal(isMessinhoEngineeringStagingService({RENDER:'true',RENDER_SERVICE_ID:'stage',MESSINHO_STAGING_RENDER_SERVICE_ID:'stage'}),true);
});

test('explicit admin development refuses to run outside the staging service',async()=>{
 const db=mockDb();
 const result=await runMessinhoScheduledEngineeringReview({
  db,mode:'developing',force:true,now:new Date('2026-11-27T18:00:00Z'),
  env:{RENDER:'true',RENDER_SERVICE_ID:'production',MESSINHO_STAGING_RENDER_SERVICE_ID:'stage'}
 });
 assert.equal(result.code,'STAGING_GATE_CLOSED');
 assert.equal(db.state.claim,null);
});
