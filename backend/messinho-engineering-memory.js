import { createHash } from 'node:crypto';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA=/^[a-f0-9]{40}$/i;
const HASH=/^[a-f0-9]{64}$/i;
const clean=(value,max=1200)=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,' ').trim().slice(0,max);

export function normalizeMessinhoSandboxResult(input={}) {
  if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,error:'invalid_result'};
  const jobId=String(input.job_id||''),ticketId=String(input.ticket_id||'');
  const sourceSha=String(input.source_sha||''),patchSha=String(input.patch_sha256||'');
  const outcome=String(input.outcome||'');
  if(!UUID.test(jobId)||!UUID.test(ticketId)||!SHA.test(sourceSha)||!HASH.test(patchSha))return {ok:false,error:'invalid_identity'};
  if(!['passed','failed','inconclusive'].includes(outcome))return {ok:false,error:'invalid_outcome'};
  const evidence=input.evidence&&typeof input.evidence==='object'&&!Array.isArray(input.evidence)?input.evidence:{};
  const toolchain=input.toolchain&&typeof input.toolchain==='object'&&!Array.isArray(input.toolchain)?input.toolchain:{};
  const logs=clean(evidence.logs,12000).replace(/gh[pousr]_[A-Za-z0-9_]{20,}/g,'[REDACTED]').replace(/Bearer\s+\S+/gi,'Bearer [REDACTED]');
  const runId=Number(input.github_run_id),attempt=Number(input.github_run_attempt);
  return {ok:true,value:{
    job_id:jobId,ticket_id:ticketId,source_sha:sourceSha,patch_sha256:patchSha,outcome,
    summary:clean(input.summary,1000)||'Sandbox-Prüfung abgeschlossen.',
    evidence:{exit_code:Number.isInteger(Number(evidence.exit_code))?Number(evidence.exit_code):null,logs},
    toolchain:Object.fromEntries(Object.entries(toolchain).slice(0,30).map(([k,v])=>[clean(k,80),clean(typeof v==='object'?JSON.stringify(v):v,160)])),
    github_run_id:Number.isSafeInteger(runId)&&runId>0?runId:null,
    github_run_attempt:Number.isSafeInteger(attempt)&&attempt>0?attempt:1
  }};
}

export async function persistMessinhoSandboxResult({db,result}={}) {
  const normalized=normalizeMessinhoSandboxResult(result);
  if(!normalized.ok)return {ok:false,code:'SANDBOX_RESULT_REJECTED',reason:normalized.error};
  if(!db||typeof db.rpc!=='function')return {ok:false,code:'SANDBOX_DATABASE_UNAVAILABLE'};
  const {data,error}=await db.rpc('asi_record_messinho_engineering_result',{p_result:normalized.value});
  if(error)return {ok:false,code:'SANDBOX_RESULT_PERSIST_FAILED',error_code:error.code||'unknown'};
  return {ok:true,result:data||{accepted:true}};
}

export function hashMessinhoEngineeringPatch(patch='') {
  return createHash('sha256').update(String(patch)).digest('hex');
}
