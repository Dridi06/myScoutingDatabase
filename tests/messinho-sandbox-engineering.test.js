import test from 'node:test';
import assert from 'node:assert/strict';
import {dispatchMessinhoSandboxJob,isMessinhoSandboxStagingAllowed} from '../backend/messinho-sandbox-dispatch.js';
import {normalizeMessinhoSandboxResult,hashMessinhoEngineeringPatch} from '../backend/messinho-engineering-memory.js';

const stagingEnv={MESSINHO_SANDBOX_ENABLED:'true',RENDER:'true',RENDER_SERVICE_ID:'srv-dc3chlqjnfac73acd6ig',MESSINHO_STAGING_RENDER_SERVICE_ID:'srv-dc3chlqjnfac73acd6ig'};
const job={job_id:'11111111-1111-4111-8111-111111111111',ticket_id:'22222222-2222-4222-8222-222222222222',source_sha:'a'.repeat(40),patch_sha256:'b'.repeat(64),patch:'diff --git a/backend/example.js b/backend/example.js\n'};

test('sandbox dispatch requires explicit enablement and scoped GitHub credential',async()=>{
 const disabled=await dispatchMessinhoSandboxJob({job,env:{}});
 assert.equal(disabled.code,'SANDBOX_STAGING_GATE_CLOSED');
 const missing=await dispatchMessinhoSandboxJob({job,env:{MESSINHO_SANDBOX_ENABLED:'true'}});
 assert.equal(missing.code,'SANDBOX_STAGING_GATE_CLOSED');
 const allowed=await dispatchMessinhoSandboxJob({job,env:{...stagingEnv}});
 assert.equal(allowed.code,'SANDBOX_GITHUB_CREDENTIAL_MISSING');
 assert.equal(isMessinhoSandboxStagingAllowed({...stagingEnv,RENDER_SERVICE_ID:'production'}),false);
});

test('sandbox dispatch pins the exact feature branch commit and sends a bounded payload',async()=>{
 const calls=[];
 const fetchImpl=async(url,options={})=>{
  calls.push({url,options});
  if(url.includes('/commits/'))return {ok:true,json:async()=>({sha:job.source_sha})};
  return {status:204,ok:true};
 };
 const result=await dispatchMessinhoSandboxJob({job,env:{...stagingEnv,MESSINHO_SANDBOX_GITHUB_TOKEN:'test-token'},fetchImpl});
 assert.equal(result.ok,true);
 assert.equal(calls.length,2);
 assert.match(calls[1].url,/messinho-isolated-engineering\.yml\/dispatches$/);
 const body=JSON.parse(calls[1].options.body);
 assert.equal(body.ref,'feature/messinho-unified-ai-integration');
 assert.ok(body.inputs.job_payload_b64.length<60000);
});

test('sandbox dispatch refuses stale source revisions and invalid patch payloads',async()=>{
 const stale=await dispatchMessinhoSandboxJob({job,env:{...stagingEnv,MESSINHO_SANDBOX_GITHUB_TOKEN:'x'},fetchImpl:async()=>({ok:true,json:async()=>({sha:'c'.repeat(40)})})});
 assert.equal(stale.code,'SANDBOX_SOURCE_REVISION_STALE');
 const invalid=await dispatchMessinhoSandboxJob({job:{...job,patch:'x'},env:{...stagingEnv,MESSINHO_SANDBOX_GITHUB_TOKEN:'x'}});
 assert.equal(invalid.code,'SANDBOX_JOB_INVALID');
});

test('sandbox evidence is bound to exact job, ticket, source and patch identities',()=>{
 const value={...job,outcome:'passed',summary:'Tests bestanden',evidence:{exit_code:0,logs:'ok'},toolchain:{node:'24'},github_run_id:123,github_run_attempt:1};
 const normalized=normalizeMessinhoSandboxResult(value);
 assert.equal(normalized.ok,true);
 assert.equal(normalized.value.evidence_verified,undefined);
 assert.equal(normalizeMessinhoSandboxResult({...value,source_sha:'bad'}).ok,false);
 assert.equal(normalizeMessinhoSandboxResult({...value,outcome:'maybe'}).ok,false);
});

test('sandbox evidence redacts credentials and caps log length',()=>{
 const result=normalizeMessinhoSandboxResult({...job,outcome:'failed',evidence:{logs:'ghp_123456789012345678901234567890123456 Bearer supersecret'}});
 assert.equal(result.ok,true);
 assert.match(result.value.evidence.logs,/\[REDACTED\]/);
 assert.ok(!result.value.evidence.logs.includes('supersecret'));
 assert.equal(hashMessinhoEngineeringPatch('patch').length,64);
});

test('isolated runner repairs Vite executable mode in its disposable project copy',async()=>{
 const {readFile}=await import('node:fs/promises');
 const runner=await readFile(new URL('../.github/sandbox/runner.sh',import.meta.url),'utf8');
 assert.match(runner,/VITE_PACKAGE="\$PROJECT\/node_modules\/vite\/bin\/vite\.js"/);
 assert.match(runner,/rm -f "\$PROJECT\/node_modules\/\.bin\/vite"/);
 assert.match(runner,/exec node "\$\(dirname "\$0"\)\/\.\.\/vite\/bin\/vite\.js" "\$\@"/);
 assert.match(runner,/chmod 0755 "\$PROJECT\/node_modules\/\.bin\/vite"/);
});
