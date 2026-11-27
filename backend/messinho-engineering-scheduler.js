import { generateMessinhoEngineeringProposal } from './messinho-myki-engineer.js';
import { persistMessinhoMyKiProposal } from './messinho-myki-bridge.js';

export const MESSINHO_ENGINEERING_REVIEW_TIME_ZONE='Europe/Berlin';
export const MESSINHO_ENGINEERING_WORK_WINDOWS=Object.freeze([{key:'morning',start:3,end:8},{key:'daytime',start:10,end:23}]);
export const MESSINHO_ENGINEERING_REVIEW_INTERVAL_MS=15*60*1000;

export function isMessinhoEngineeringAutoReviewEnabled(env=process.env){
 return env.MESSINHO_ENGINEERING_AUTOREVIEW_ENABLED==='true'&&env.RENDER==='true'&&
  Boolean(env.RENDER_SERVICE_ID)&&env.RENDER_SERVICE_ID===env.MESSINHO_STAGING_RENDER_SERVICE_ID&&
  Boolean(env.OPENAI_API_KEY)&&Boolean(env.SUPABASE_URL)&&Boolean(env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY);
}
export function getMessinhoEngineeringReviewSchedule(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:MESSINHO_ENGINEERING_REVIEW_TIME_ZONE,
  year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const values=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 const hour=Number(values.hour),minute=Number(values.minute);
 const window=MESSINHO_ENGINEERING_WORK_WINDOWS.find(item=>hour>=item.start&&hour<item.end)||null;
 const phase=window?.key||((hour>=8&&hour<10)?'break':'night_rest');
 return {review_date:values.year+'-'+values.month+'-'+values.day,hour,minute,
  review_slot:window?.key||null,window_start:window?.start??null,window_end:window?.end??null,
  phase,due:Boolean(window)};
}

/** One idempotent review per Berlin date and allowed work window. */
export async function runMessinhoScheduledEngineeringReview({db,now=new Date(),getCurrentTime=()=>new Date(),generate=generateMessinhoEngineeringProposal,persist=persistMessinhoMyKiProposal}={}){
 if(!db)return {ok:false,code:'DATABASE_UNAVAILABLE'};
 const schedule=getMessinhoEngineeringReviewSchedule(now);
 if(!schedule.due)return {ok:true,skipped:schedule.phase,review_date:schedule.review_date,phase:schedule.phase};
 const {data:control,error:controlError}=await db.from('messinho_agent_control')
  .select('mode,stop_requested').eq('id','global').maybeSingle();
 if(controlError)return {ok:false,code:'CONTROL_STATE_UNAVAILABLE'};
 if(control?.mode!=='developing'||control?.stop_requested)return {ok:true,skipped:'admin_mode_not_developing',review_date:schedule.review_date,review_slot:schedule.review_slot};
 const {data:claim,error:claimError}=await db.from('messinho_engineering_review_runs')
  .insert({review_date:schedule.review_date,review_slot:schedule.review_slot,status:'running',started_at:now.toISOString()})
  .select('id').maybeSingle();
 if(claimError?.code==='23505')return {ok:true,skipped:'already_claimed',review_date:schedule.review_date,review_slot:schedule.review_slot};
 if(claimError||!claim?.id)return {ok:false,code:'REVIEW_CLAIM_FAILED'};
 const finish=async(status,fields={})=>{
  const {error}=await db.from('messinho_engineering_review_runs').update({...fields,status,finished_at:new Date().toISOString()}).eq('id',claim.id);
  if(error)throw new Error('review_state_persist_failed');
 };
 try{
  const generated=await generate({goal:'Führe die technische Selbstprüfung von MESSINHO durch. Finde höchstens eine konkrete, belegbare und sichere Verbesserung. Erzeuge keinen Vorschlag, wenn der Nutzen nicht nachweisbar ist.'});
  const {data:afterGenerate,error:afterGenerateError}=await db.from('messinho_agent_control')
    .select('mode,stop_requested').eq('id','global').maybeSingle();
  const afterSchedule=getMessinhoEngineeringReviewSchedule(getCurrentTime());
  if(!afterSchedule.due||afterSchedule.review_slot!==schedule.review_slot){
    await finish('stopped',{source_sha:generated.source_sha||null,error_code:'WORK_WINDOW_ENDED'});
    return {ok:true,status:'stopped',review_date:schedule.review_date,review_slot:schedule.review_slot};
  }
  if(afterGenerateError||afterGenerate?.mode!=='developing'||afterGenerate?.stop_requested){
    await finish('failed',{source_sha:generated.source_sha||null,error_code:'ADMIN_STOP_REQUESTED'});
    return {ok:true,status:'stopped',review_date:schedule.review_date,review_slot:schedule.review_slot};
  }
  if(!generated.ok){await finish('failed',{error_code:generated.code||'REVIEW_FAILED'});return {ok:false,code:generated.code||'REVIEW_FAILED'};}
  if(!generated.proposal){await finish('no_improvement',{source_sha:generated.source_sha||null});return {ok:true,status:'no_improvement',review_date:schedule.review_date,review_slot:schedule.review_slot};}
  const saved=await persist({db,proposal:generated.proposal});
  if(!saved.ok){await finish('failed',{source_sha:generated.source_sha||null,error_code:saved.code||'TICKET_PERSIST_FAILED'});return {ok:false,code:saved.code||'TICKET_PERSIST_FAILED'};}
  const status=saved.duplicate?'duplicate':'ticket_created';
  await finish(status,{source_sha:generated.source_sha||null,ticket_id:saved.ticket_id||null});
  return {ok:true,status,ticket_id:saved.ticket_id||null,review_date:schedule.review_date,review_slot:schedule.review_slot};
 }catch{
  try{await finish('failed',{error_code:'REVIEW_EXECUTION_FAILED'});}catch{}
  return {ok:false,code:'REVIEW_EXECUTION_FAILED'};
 }
}

export function startMessinhoEngineeringReviewScheduler({db,env=process.env,logger=console,intervalMs=MESSINHO_ENGINEERING_REVIEW_INTERVAL_MS}={}){
 if(!db||!isMessinhoEngineeringAutoReviewEnabled(env)){
  logger.info?.('MESSINHO autonomous engineering review disabled (explicit STAGING gate not satisfied).');
  return {enabled:false,stop(){}};
 }
 let stopped=false,busy=false;
 const tick=async()=>{
  if(stopped||busy)return;
  const schedule=getMessinhoEngineeringReviewSchedule();
  if(!schedule.due)return;
  busy=true;
  try{
   const result=await runMessinhoScheduledEngineeringReview({db});
   if(result.status==='ticket_created')logger.info?.('MESSINHO engineering proposal submitted to myKI',{ticket_id:result.ticket_id});
   else if(result.status==='no_improvement')logger.info?.('MESSINHO engineering review completed; no reliable improvement found.');
   else if(!result.ok)logger.warn?.('MESSINHO engineering review did not complete',{code:result.code});
  }catch(error){logger.warn?.('MESSINHO engineering review scheduler failed:',error.message);}
  finally{busy=false;}
 };
 const timer=setInterval(()=>void tick(),Math.max(60000,intervalMs));
 timer.unref?.();
 void tick();
 return {enabled:true,stop(){stopped=true;clearInterval(timer);}};
}
