import test from 'node:test';
import assert from 'node:assert/strict';
import {getMessinhoEngineeringReviewSchedule,isMessinhoEngineeringAutoReviewEnabled,runMessinhoScheduledEngineeringReview} from '../backend/messinho-engineering-scheduler.js';

const staging={MESSINHO_ENGINEERING_AUTOREVIEW_ENABLED:'true',RENDER:'true',RENDER_SERVICE_ID:'stage',MESSINHO_STAGING_RENDER_SERVICE_ID:'stage',OPENAI_API_KEY:'configured',SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'configured'};
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
 const state={claim:null,update:null,control:{mode,stop_requested:stopRequested}};
 return {
  state,
  from(table){
   if(table==='messinho_agent_control'){
    return {select(){return {eq(){return {maybeSingle:async()=>({data:state.control,error:null})};}};}};
   }
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
 const result=await runMessinhoScheduledEngineeringReview({db,now:new Date('2026-11-27T02:00:00Z'),generate:async()=>({ok:true,proposal:null,source_sha:'a'.repeat(40)})});
 assert.equal(result.status,'no_improvement');assert.equal(db.state.claim.review_date,'2026-11-27');assert.equal(db.state.claim.review_slot,'morning');assert.equal(db.state.update.status,'no_improvement');
});
test('does not duplicate an already claimed review window',async()=>{
 const db=mockDb({claimError:{code:'23505'}});
 const result=await runMessinhoScheduledEngineeringReview({db,now:new Date('2026-11-27T02:00:00Z')});
 assert.equal(result.skipped,'already_claimed');
});
test('creates a myKI ticket only for a real generated proposal',async()=>{
 const db=mockDb();let persisted=false;
 const result=await runMessinhoScheduledEngineeringReview({db,now:new Date('2026-11-27T02:00:00Z'),
  generate:async()=>({ok:true,proposal:{title:'test'},source_sha:'b'.repeat(40)}),
  persist:async({proposal})=>{persisted=proposal.title==='test';return {ok:true,duplicate:false,ticket_id:'MYKI-TEST'};}
 });
 assert.equal(persisted,true);assert.equal(result.status,'ticket_created');assert.equal(db.state.update.ticket_id,'MYKI-TEST');
});


test('autonomous development is paused unless the admin explicitly selected develop mode',async()=>{
 const db=mockDb({mode:'paused'});
 const result=await runMessinhoScheduledEngineeringReview({db,now:new Date('2026-11-27T02:00:00Z')});
 assert.equal(result.skipped,'admin_mode_not_developing');
 assert.equal(db.state.claim,null);
});

test('admin stop requested during generation prevents myKI ticket persistence',async()=>{
 const db=mockDb({mode:'developing'});
 let persisted=false;
 const result=await runMessinhoScheduledEngineeringReview({db,now:new Date('2026-11-27T02:00:00Z'),
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
 const result=await runMessinhoScheduledEngineeringReview({db,now:new Date('2026-11-27T18:00:00Z'),
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
