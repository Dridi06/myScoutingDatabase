import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MESSINHO_BACKGROUND_READ_ONLY, isMessinhoBackgroundWorkerEnabled,
  validateMessinhoBackgroundTask, processMessinhoBackgroundTask
} from '../backend/messinho-background-worker.js';

const task = overrides => ({
  id:'task-1',owner_id:'owner-1',goal:'Analysiere den Spieler',
  status:'running',autonomous_resume_enabled:true,expires_at:'2036-11-27T00:00:00.000Z',
  attempt_count:1,pending_capabilities:['overall_score'],lease_token:'lease-1',
  claimed_by:'worker-1',plan:{role:'scout',label:'Analyse'},
  context:{player:{name:'Testspieler',performance_metrics:{technical:80}}},
  completed_results:[],...overrides
});
function mockDb({mode='developing',stopRequested=false,profile={id:'owner-1',role:'scout',approved:true,approval_status:'approved'}}={}) {
  const writes=[],state={mode,stop_requested:stopRequested};
  return {writes,state,from(table){
    if(table==='profiles')return {select(){return {eq(){return {maybeSingle:async()=>({data:profile,error:null})};}};}};
    if(table==='messinho_agent_control')return {select(){return {eq(){return {maybeSingle:async()=>({data:state,error:null})};}};}};
    return {update(patch){writes.push(patch);return {
      eq(){return this;},select(){return this;},async maybeSingle(){return {data:{id:'task-1'},error:null};}
    };}};
  }};
}

test('worker is disabled unless explicit Render staging gate and credentials match',()=>{
  assert.equal(isMessinhoBackgroundWorkerEnabled({}),false);
  const env={MESSINHO_AUTONOMY_WORKER_ENABLED:'true',RENDER:'true',
    RENDER_SERVICE_ID:'staging-id',MESSINHO_STAGING_RENDER_SERVICE_ID:'staging-id',
    SUPABASE_URL:'https://example.supabase.co',SUPABASE_SECRET_KEY:'secret'};
  assert.equal(isMessinhoBackgroundWorkerEnabled(env),true);
  assert.equal(isMessinhoBackgroundWorkerEnabled({...env,RENDER_SERVICE_ID:'production-id'}),false);
  assert.equal(isMessinhoBackgroundWorkerEnabled({...env,MESSINHO_AUTONOMY_WORKER_ENABLED:'false'}),false);
});

test('background resume requires explicit opt-in and an allowlisted read-only capability',()=>{
  const now=Date.parse('2026-11-26T16:00:00Z');
  assert.equal(validateMessinhoBackgroundTask(task({autonomous_resume_enabled:false}),now).reason,'explicit_opt_in_required');
  assert.equal(validateMessinhoBackgroundTask(task({pending_capabilities:['controlled_self_optimization']}),now).reason,'capability_not_approved_read_only');
  assert.equal(validateMessinhoBackgroundTask(task(),now).allowed,true);
  assert.ok(MESSINHO_BACKGROUND_READ_ONLY.includes('overall_score'));
});

test('worker persists completion only when the lease token still matches',async()=>{
  const db=mockDb();
  const result=await processMessinhoBackgroundTask({db,task:task(),workerId:'worker-1',
    execute:async(plan)=>({status:'completed',results:[{capability_id:'overall_score',status:'completed'}],deferred_capabilities:[],missing_inputs:[]})});
  assert.equal(result.ok,true);
  assert.equal(result.status,'completed');
  assert.equal(db.writes[0].status,'completed');
  assert.equal(db.writes[0].lease_token,null);
});

test('worker quarantines unsafe pending work without executing it',async()=>{
  const db=mockDb();let executed=false;
  const result=await processMessinhoBackgroundTask({db,task:task({pending_capabilities:['controlled_self_optimization']}),workerId:'worker-1',
    execute:async()=>{executed=true;throw new Error('must not execute');}});
  assert.equal(executed,false);
  assert.equal(result.reason,'capability_not_approved_read_only');
  assert.equal(db.writes[0].status,'failed');
});

test('worker rejects malformed claimed records without database writes',async()=>{
  const db=mockDb();
  const result=await processMessinhoBackgroundTask({db,task:task({lease_token:null}),workerId:'worker-1'});
  assert.equal(result.reason,'invalid_claim');
  assert.equal(db.writes.length,0);
});


test('background worker does not start tasks unless admin selected developing mode',async()=>{
 const db=mockDb({mode:'paused'});
 let executed=false;
 const result=await processMessinhoBackgroundTask({db,task:task(),workerId:'worker-1',
  execute:async()=>{executed=true;return {status:'completed',results:[],deferred_capabilities:[]};}});
 assert.equal(executed,false);
 assert.equal(result.stopped,true);
 assert.equal(result.reason,'admin_mode_paused');
 assert.equal(db.writes[0].status,'partial');
});

test('background worker observes a stop request between capability steps',async()=>{
 const db=mockDb();let stopObserved=false;
 const result=await processMessinhoBackgroundTask({db,task:task(),workerId:'worker-1',
  execute:async(plan,input,role,options)=>{
   db.state.stop_requested=true;
   stopObserved=await options.shouldStop();
   return {status:'stopped',stop_requested:true,results:[],deferred_capabilities:['overall_score'],missing_inputs:[]};
  }});
 assert.equal(stopObserved,true);
 assert.equal(result.stopped,true);
 assert.equal(db.writes[0].status,'partial');
 assert.equal(db.writes[0].next_retry_at,null);
});


test('worker blocks tasks when the owner role or approval changed after task creation',async()=>{
 const db=mockDb({profile:{id:'owner-1',role:'admin',approved:true,approval_status:'approved'}});
 let executed=false;
 const result=await processMessinhoBackgroundTask({db,task:task(),workerId:'worker-1',
  execute:async()=>{executed=true;return {status:'completed',results:[],deferred_capabilities:[]};}});
 assert.equal(executed,false);
 assert.equal(result.reason,'owner_role_changed');
 assert.equal(db.writes[0].status,'failed');
});

test('worker never re-executes a capability already checkpointed as successful',async()=>{
 const db=mockDb();let executedPlan=null;
 const result=await processMessinhoBackgroundTask({db,task:task({
  pending_capabilities:['overall_score'],
  completed_results:[{capability_id:'overall_score',status:'completed'}]
 }),workerId:'worker-1',execute:async plan=>{executedPlan=plan;return {status:'completed',results:[],deferred_capabilities:[]};}});
 assert.equal(executedPlan,null);
 assert.equal(result.status,'completed');
 assert.equal(result.reason,'checkpoint_already_complete');
 assert.equal(db.writes[0].status,'completed');
});
