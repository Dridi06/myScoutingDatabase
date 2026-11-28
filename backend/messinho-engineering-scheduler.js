import { randomUUID } from 'node:crypto';
import { generateMessinhoEngineeringProposal } from './messinho-myki-engineer.js';
import { persistMessinhoMyKiProposal } from './messinho-myki-bridge.js';
import { dispatchMessinhoSandboxJob, isMessinhoSandboxStagingAllowed } from './messinho-sandbox-dispatch.js';
import { hashMessinhoEngineeringPatch } from './messinho-engineering-memory.js';
import { resolveMessinhoModelConfig } from './messinho-model-runtime.js';

export const MESSINHO_ENGINEERING_REVIEW_TIME_ZONE='Europe/Berlin';
export const MESSINHO_ENGINEERING_WORK_WINDOWS=Object.freeze([{key:'morning',start:3,end:8},{key:'daytime',start:10,end:23}]);
export const MESSINHO_ENGINEERING_REVIEW_INTERVAL_MS=15*60*1000;

export function isMessinhoEngineeringStagingService(env=process.env){
 return env.RENDER==='true'&&Boolean(env.RENDER_SERVICE_ID)&&env.RENDER_SERVICE_ID===env.MESSINHO_STAGING_RENDER_SERVICE_ID;
}
export function isMessinhoEngineeringAutoReviewEnabled(env=process.env){
 const model=resolveMessinhoModelConfig(env);
 const modelReady=Boolean(model.model)&&(!model.requiresApiKey||Boolean(model.apiKey));
 return env.MESSINHO_ENGINEERING_AUTOREVIEW_ENABLED==='true'&&env.RENDER==='true'&&
  Boolean(env.RENDER_SERVICE_ID)&&env.RENDER_SERVICE_ID===env.MESSINHO_STAGING_RENDER_SERVICE_ID&&
  modelReady&&Boolean(env.SUPABASE_URL)&&Boolean(env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY);
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


export function buildMessinhoSelfRepairGoal(checks=[]) {
 const findings=(Array.isArray(checks)?checks:[]).filter(item=>item&&item.ok===false).slice(0,20).map(item=>({
  name:String(item.name||'Unbekannte Prüfung').slice(0,120),
  category:String(item.category||'System').slice(0,80),
  severity:String(item.severity||'warning').slice(0,30),
  detail:String(item.detail||'Keine Detailbeschreibung verfügbar.').replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,500),
  recommendation:String(item.recommendation||item.next_action||'Ursache untersuchen.').replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,350)
 }));
 if(!findings.length)return {ok:false,reason:'no_failed_diagnostics',findings:[]};
 return {ok:true,findings,goal:'Führe eine gezielte MESSINHO-Fehleranalyse und Fehlerbehebung ausschließlich für die folgenden tatsächlich fehlgeschlagenen Systemprüfungen durch. Lies die betroffenen Quellmodule und Aufrufer, belege die Ursache, erstelle höchstens einen kleinen sicheren Patch innerhalb der bestehenden Allowlist und definiere Regressionstests. Erfinde keine Fehler. Wenn die Ursache in geschützten Dateien, Datenbank, Zugangsdaten oder Infrastruktur liegt, erstelle keinen unsicheren Patch. Diagnosebefunde: '+JSON.stringify(findings)};
}

/** One idempotent review per Berlin date and allowed work window. */
export async function runMessinhoScheduledEngineeringReview({db,now=new Date(),getCurrentTime=()=>new Date(),generate=generateMessinhoEngineeringProposal,persist=persistMessinhoMyKiProposal,env=process.env,sandboxAllowed=isMessinhoSandboxStagingAllowed,dispatch=dispatchMessinhoSandboxJob,hashPatch=hashMessinhoEngineeringPatch,makeJobId=randomUUID,mode='developing',goal=null,force=false}={}){
 if(!db)return {ok:false,code:'DATABASE_UNAVAILABLE'};
 if(!['developing','working'].includes(mode))return {ok:false,code:'INVALID_REVIEW_MODE'};
 if(force&&!isMessinhoEngineeringStagingService(env))return {ok:false,code:'STAGING_GATE_CLOSED'};
 const schedule=getMessinhoEngineeringReviewSchedule(now);
 if(!schedule.due)return {ok:true,skipped:schedule.phase,review_date:schedule.review_date,phase:schedule.phase};
 const {data:control,error:controlError}=await db.from('messinho_agent_control')
  .select('mode,stop_requested,updated_by').eq('id','global').maybeSingle();
 if(controlError)return {ok:false,code:'CONTROL_STATE_UNAVAILABLE'};
 if(control?.mode!==mode||control?.stop_requested)return {ok:true,skipped:'admin_mode_not_active',review_date:schedule.review_date,review_slot:schedule.review_slot};
 const reviewSlot=force?'manual_'+String(makeJobId()).replace(/[^a-f0-9]/gi,'').slice(0,24):schedule.review_slot;
 const {data:claim,error:claimError}=await db.from('messinho_engineering_review_runs')
  .insert({review_date:schedule.review_date,review_slot:reviewSlot,status:'running',started_at:now.toISOString()})
  .select('id').maybeSingle();
 if(claimError?.code==='23505')return {ok:true,skipped:'already_claimed',review_date:schedule.review_date,review_slot:reviewSlot};
 if(claimError||!claim?.id)return {ok:false,code:'REVIEW_CLAIM_FAILED'};
 const finish=async(status,fields={})=>{
  const {error}=await db.from('messinho_engineering_review_runs').update({...fields,status,finished_at:new Date().toISOString()}).eq('id',claim.id);
  if(error)throw new Error('review_state_persist_failed');
 };
 try{
  const generated=await generate({goal:goal|| (mode==='working'?'Führe eine gezielte technische Fehlerprüfung von MESSINHO durch. Erstelle nur bei belegter Ursache einen kleinen sicheren Reparaturvorschlag.':'Führe die technische Selbstprüfung von MESSINHO durch. Finde höchstens eine konkrete, belegbare und sichere Verbesserung. Erzeuge keinen Vorschlag, wenn der Nutzen nicht nachweisbar ist.')});
  const {data:afterGenerate,error:afterGenerateError}=await db.from('messinho_agent_control')
    .select('mode,stop_requested').eq('id','global').maybeSingle();
  const afterSchedule=getMessinhoEngineeringReviewSchedule(getCurrentTime());
  if(!afterSchedule.due||afterSchedule.review_slot!==schedule.review_slot){
    await finish('failed',{source_sha:generated.source_sha||null,error_code:'WORK_WINDOW_ENDED'});
    return {ok:true,status:'stopped',review_date:schedule.review_date,review_slot:schedule.review_slot};
  }
  if(afterGenerateError||afterGenerate?.mode!==mode||afterGenerate?.stop_requested){
    await finish('failed',{source_sha:generated.source_sha||null,error_code:'ADMIN_STOP_REQUESTED'});
    return {ok:true,status:'stopped',review_date:schedule.review_date,review_slot:schedule.review_slot};
  }
  if(!generated.ok){
    const code=generated.code||'REVIEW_FAILED',failureReason=String(generated.failure_reason||'').slice(0,100);
    await finish('failed',{error_code:failureReason?code+':'+failureReason:code});
    return {ok:false,code,failure_reason:failureReason||null,failure_stage:generated.failure_stage||null};
   }
  if(!generated.proposal){await finish('no_improvement',{source_sha:generated.source_sha||null});return {ok:true,status:'no_improvement',review_date:schedule.review_date,review_slot:schedule.review_slot};}
  const saved=await persist({db,proposal:generated.proposal});
  if(!saved.ok){await finish('failed',{source_sha:generated.source_sha||null,error_code:saved.code||'TICKET_PERSIST_FAILED'});return {ok:false,code:saved.code||'TICKET_PERSIST_FAILED'};}
  const status=saved.duplicate?'duplicate':'ticket_created';
  let sandboxStatus='not_configured',sandboxCode=null,sandboxJobId=null;
  const {data:postPersistControl,error:postPersistControlError}=await db.from('messinho_agent_control')
    .select('mode,stop_requested,updated_by').eq('id','global').maybeSingle();
  const postPersistSchedule=getMessinhoEngineeringReviewSchedule(getCurrentTime());
  if(!saved.duplicate&&!postPersistControlError&&postPersistControl?.mode===mode&&!postPersistControl?.stop_requested&&
     postPersistSchedule.due&&postPersistSchedule.review_slot===schedule.review_slot&&
     sandboxAllowed(env)&&env.MESSINHO_SANDBOX_GITHUB_TOKEN&&postPersistControl.updated_by){
    const {data:ticket,error:ticketError}=await db.from('messinho_myki_tickets').select('id,diff,baseline_id')
      .eq('ticket_id',saved.ticket_id).maybeSingle();
    const match=String(ticket?.baseline_id||'').match(/^feature\/messinho-conversation-engine@([a-f0-9]{40})$/i);
    if(!ticketError&&ticket?.id&&typeof ticket.diff==='string'&&match){
      sandboxJobId=makeJobId();
      const patchSha=hashPatch(ticket.diff);
      const {error:jobError}=await db.from('messinho_engineering_jobs').insert({
        id:sandboxJobId,ticket_id:ticket.id,requested_by:postPersistControl.updated_by,source_sha:match[1],
        patch_sha256:patchSha,status:'queued'
      });
      if(!jobError){
        const dispatched=await dispatch({job:{job_id:sandboxJobId,ticket_id:ticket.id,source_sha:match[1],patch_sha256:patchSha,patch:ticket.diff},env});
        if(dispatched.ok){
          sandboxStatus='queued';
          const {error:eventError}=await db.from('messinho_myki_ticket_events').insert({
            ticket_id:ticket.id,actor_id:postPersistControl.updated_by,actor_type:'system',action:'sandbox_dispatched',
            from_status:'submitted',to_status:'submitted',
            safe_message:'MESSINHO hat den Änderungsvorschlag automatisch zur isolierten STAGING-Prüfung übergeben.',
            metadata:{job_id:sandboxJobId,source_sha:match[1],patch_sha256:patchSha,origin:'scheduled_autonomous_review'}
          });
          if(eventError)console.warn('MESSINHO sandbox event could not be recorded:',eventError.code||'unknown');
        }else{
          sandboxStatus='dispatch_failed';sandboxCode=dispatched.code||'SANDBOX_DISPATCH_FAILED';
          await db.from('messinho_engineering_jobs').update({status:'failed',error_code:sandboxCode,finished_at:new Date().toISOString()}).eq('id',sandboxJobId);
        }
      }else{sandboxStatus='job_persist_failed';sandboxCode=jobError.code||'SANDBOX_JOB_PERSIST_FAILED';}
    }else{sandboxStatus='ticket_or_source_invalid';sandboxCode='SANDBOX_TICKET_LOOKUP_FAILED';}
  }else if(postPersistControlError||postPersistControl?.mode!==mode||postPersistControl?.stop_requested){
    sandboxStatus='stopped_by_admin';
  }else if(!postPersistSchedule.due||postPersistSchedule.review_slot!==schedule.review_slot){
    sandboxStatus='work_window_ended';
  }
  await finish(status,{source_sha:generated.source_sha||null,ticket_id:saved.ticket_id||null,error_code:sandboxCode});
  return {ok:true,status,ticket_id:saved.ticket_id||null,review_date:schedule.review_date,review_slot:reviewSlot,
    sandbox_status:sandboxStatus,sandbox_job_id:sandboxJobId};
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
   if(result.status==='ticket_created')logger.info?.('MESSINHO engineering proposal submitted to myKI',{ticket_id:result.ticket_id,sandbox_status:result.sandbox_status});
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
