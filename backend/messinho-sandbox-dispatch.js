const REPOSITORY='Dridi06/myScoutingDatabase';
const BRANCH='feature/messinho-unified-ai-integration';
const WORKFLOW='messinho-isolated-engineering.yml';
const shaPattern=/^[a-f0-9]{40}$/i;
const hashPattern=/^[a-f0-9]{64}$/i;
const uuidPattern=/^[0-9a-f-]{36}$/i;

export async function dispatchMessinhoSandboxJob({job,env=process.env,fetchImpl=fetch}={}) {
  if(env.MESSINHO_SANDBOX_ENABLED!=='true')return {ok:false,code:'SANDBOX_DISABLED'};
  const token=String(env.MESSINHO_SANDBOX_GITHUB_TOKEN||'');
  if(!token)return {ok:false,code:'SANDBOX_GITHUB_CREDENTIAL_MISSING'};
  if(!job||!uuidPattern.test(String(job.job_id||''))||!uuidPattern.test(String(job.ticket_id||''))||
     !shaPattern.test(String(job.source_sha||''))||!hashPattern.test(String(job.patch_sha256||''))||
     typeof job.patch!=='string'||job.patch.length<20||job.patch.length>24000)
    return {ok:false,code:'SANDBOX_JOB_INVALID'};
  const headers={Accept:'application/vnd.github+json',Authorization:'Bearer '+token,
    'X-GitHub-Api-Version':'2022-11-28','User-Agent':'myScoutingDatabase-MESSINHO-Sandbox'};
  try{
    const headResponse=await fetchImpl('https://api.github.com/repos/'+REPOSITORY+'/commits/'+BRANCH,
      {headers,signal:AbortSignal.timeout(10000)});
    if(!headResponse.ok)return {ok:false,code:'SANDBOX_BRANCH_LOOKUP_FAILED'};
    const head=await headResponse.json();
    if(head.sha!==job.source_sha)return {ok:false,code:'SANDBOX_SOURCE_REVISION_STALE',current_sha:head.sha||null};
    const payload=Buffer.from(JSON.stringify(job)).toString('base64');
    if(payload.length>60000)return {ok:false,code:'SANDBOX_PAYLOAD_TOO_LARGE'};
    const response=await fetchImpl('https://api.github.com/repos/'+REPOSITORY+'/actions/workflows/'+WORKFLOW+'/dispatches',{
      method:'POST',headers:{...headers,'Content-Type':'application/json'},
      body:JSON.stringify({ref:BRANCH,inputs:{job_payload_b64:payload}}),
      signal:AbortSignal.timeout(10000)
    });
    if(response.status!==204)return {ok:false,code:'SANDBOX_DISPATCH_FAILED',http_status:response.status};
    return {ok:true,status:'queued',branch:BRANCH,source_sha:job.source_sha};
  }catch{return {ok:false,code:'SANDBOX_DISPATCH_UNAVAILABLE'};}
}

export const MESSINHO_SANDBOX_REPOSITORY=REPOSITORY;
export const MESSINHO_SANDBOX_BRANCH=BRANCH;
