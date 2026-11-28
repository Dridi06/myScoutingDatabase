import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generateMessinhoEngineeringProposal,isMessinhoEngineeringRequest,validateMessinhoEngineeringPatchAgainstSources} from '../backend/messinho-myki-engineer.js';

const sha='a'.repeat(40);
const patch=`diff --git a/backend/messinho-input-correction.js b/backend/messinho-input-correction.js
index 1111111..2222222 100644
--- a/backend/messinho-input-correction.js
+++ b/backend/messinho-input-correction.js
@@ -1 +1 @@
-const value = 1;
+const value = 2;
`;
const response=payload=>({ok:true,json:async()=>payload});
const candidate={title:'Verbesserte Eingabe-Normalisierung',rationale:'Ein konkreter Grenzfall in der Normalisierung wird nicht konsistent behandelt und kann sicher vereinheitlicht werden.',patch,test_plan:['Grenzfall und Normalfall prüfen','Regression für bestehende Korrekturen prüfen'],rollback_plan:'Vorherigen Commit wiederherstellen und beide Regressionstests erneut ausführen.'};
const sourceFor=url=>url.endsWith('/backend/messinho-input-correction.js')?'const value = 1;\n':'export const safe = true;\n';

test('renders chat timestamps without a stray JSX brace after the time element',async()=>{
 const source=await readFile(new URL('../src/asi/MyKiChat.jsx',import.meta.url),'utf8');
 assert.equal(source.includes('</time>}</div>'),false);
 assert.match(source,/<time className="myki-chat-timestamp" dateTime=\{item\.timestamp\|\|undefined\}>\{formatTimestamp\(item\.timestamp\)\}<\/time><\/div>/);
});

test('recognizes explicit Admin self-review requests',()=>{
 assert.equal(isMessinhoEngineeringRequest('MESSINHO, entwickle eine Verbesserung für dich selbst'),true);
 assert.equal(isMessinhoEngineeringRequest('Bitte prüfe das System und optimiere es'),true);
 assert.equal(isMessinhoEngineeringRequest('MESSINHO soll Programmieren lernen'),true);
 assert.equal(isMessinhoEngineeringRequest('Suche einen U19 Stürmer'),false);
});

test('generates a validated proposal from pinned source revision without applying it',async()=>{
 const calls=[];
 const fetchImpl=async url=>{
  calls.push(url);
  if(url.includes('/commits/'))return response({sha});
  if(url.includes('raw.githubusercontent.com'))return {ok:true,text:async()=>sourceFor(url)};
  if(url.includes('api.openai.com'))return response({choices:[{message:{content:JSON.stringify({proposal:candidate})}}]});
  throw new Error('unexpected_url');
 };
 const r=await generateMessinhoEngineeringProposal({goal:'Prüfe MESSINHO auf konkrete sichere Verbesserungen',env:{OPENAI_API_KEY:'test-key'},fetchImpl});
 assert.equal(r.ok,true);
 assert.equal(r.proposal.benchmark_id,'feature/messinho-conversation-engine@'+sha);
 assert.equal(r.tests_executed,false);
 assert.equal(r.execution_mode,'proposal_only');
 assert.equal(calls.length,19,'the expanded safe source allowlist is fetched at the pinned revision');
 assert.ok(calls.some(url=>url.endsWith('/src/asi/MyKiChat.jsx')));
 assert.ok(calls[0].includes('feature%2Fmessinho-conversation-engine'));
});

test('returns no proposal when the reviewer cannot prove an improvement',async()=>{
 const fetchImpl=async url=>{
  if(url.includes('/commits/'))return response({sha});
  if(url.includes('raw.githubusercontent.com'))return {ok:true,text:async()=>sourceFor(url)};
  return response({choices:[{message:{content:'{"proposal":null}'}}]});
 };
 const r=await generateMessinhoEngineeringProposal({goal:'Bitte prüfe das System auf Verbesserungen',env:{OPENAI_API_KEY:'test-key'},fetchImpl});
 assert.equal(r.ok,true);
 assert.equal(r.proposal,null);
 assert.equal(r.reason,'no_reliable_improvement');
});

test('fails closed when provider, source or patch validation is unavailable',async()=>{
 const noKey=await generateMessinhoEngineeringProposal({goal:'System verbessern',env:{}});
 assert.equal(noKey.ok,false);
 const badSource=await generateMessinhoEngineeringProposal({goal:'System verbessern',env:{OPENAI_API_KEY:'x'},fetchImpl:async()=>({ok:false})});
 assert.equal(badSource.ok,false);
 const unsafe=await generateMessinhoEngineeringProposal({goal:'System verbessern',env:{OPENAI_API_KEY:'x'},fetchImpl:async url=>{
  if(url.includes('/commits/'))return response({sha});
  if(url.includes('raw.githubusercontent.com'))return {ok:true,text:async()=>sourceFor(url)};
  return response({choices:[{message:{content:JSON.stringify({proposal:{...candidate,patch:patch.replace('const value = 2;','process.env.SECRET')}})}}]});
 }});
 assert.equal(unsafe.ok,false);
});


test('accepts a real allowlisted source file larger than the former 16k limit',async()=>{
 const fetchImpl=async url=>{
  if(url.includes('/commits/'))return response({sha});
  if(url.endsWith('/backend/messinho-development.js'))return {ok:true,text:async()=>'x'.repeat(24000)};
  if(url.includes('raw.githubusercontent.com'))return {ok:true,text:async()=>sourceFor(url)};
  if(url.includes('api.openai.com'))return response({choices:[{message:{content:JSON.stringify({proposal:candidate})}}]});
  throw new Error('unexpected_url');
 };
 const result=await generateMessinhoEngineeringProposal({goal:'Prüfe MESSINHO auf konkrete sichere Verbesserungen',env:{OPENAI_API_KEY:'test-key'},fetchImpl});
 assert.equal(result.ok,true);
 assert.equal(result.proposal.title,candidate.title);
 assert.equal(result.execution_mode,'proposal_only');
});

test('reports an oversized source file with a safe file-specific reason',async()=>{
 const fetchImpl=async url=>{
  if(url.includes('/commits/'))return response({sha});
  if(url.endsWith('/backend/messinho-development.js'))return {ok:true,text:async()=>'x'.repeat(32001)};
  if(url.includes('raw.githubusercontent.com'))return {ok:true,text:async()=>sourceFor(url)};
  throw new Error('unexpected_url');
 };
 const result=await generateMessinhoEngineeringProposal({goal:'Prüfe MESSINHO auf konkrete sichere Verbesserungen',env:{OPENAI_API_KEY:'test-key'},fetchImpl});
 assert.equal(result.ok,false);
 assert.equal(result.code,'MYKI_ENGINEERING_SOURCE_SIZE_LIMIT');
 assert.equal(result.failure_reason,'source_size_limit_exceeded:backend/messinho-development.js');
});

test('reports the failing upstream stage without exposing response bodies or credentials',async()=>{
 const githubFailure=await generateMessinhoEngineeringProposal({goal:'Prüfe MESSINHO auf konkrete sichere Verbesserungen',env:{OPENAI_API_KEY:'secret-test-value'},fetchImpl:async()=>({ok:false,status:503})});
 assert.equal(githubFailure.ok,false);
 assert.equal(githubFailure.code,'MYKI_ENGINEERING_REVIEW_FAILED');
 assert.equal(githubFailure.failure_stage,'github_commit');
 assert.equal(githubFailure.failure_reason,'github_http_503');
 assert.equal(JSON.stringify(githubFailure).includes('secret-test-value'),false);

 const providerFailure=await generateMessinhoEngineeringProposal({goal:'Prüfe MESSINHO auf konkrete sichere Verbesserungen',env:{OPENAI_API_KEY:'secret-test-value'},fetchImpl:async url=>{
  if(url.includes('/commits/'))return response({sha});
  if(url.includes('raw.githubusercontent.com'))return {ok:true,text:async()=>sourceFor(url)};
  return {ok:false,status:429};
 }});
 assert.equal(providerFailure.ok,false);
 assert.equal(providerFailure.failure_stage,'provider');
 assert.equal(providerFailure.failure_reason,'provider_http_429');
});

test('rejects a model patch whose old lines do not exist in the pinned source',()=>{
 const result=validateMessinhoEngineeringPatchAgainstSources(patch,[{path:'backend/messinho-input-correction.js',content:'const actual = 1;\n'}]);
 assert.equal(result.ok,false);
 assert.equal(result.reason,'patch_context_does_not_match_pinned_source');
});

test('accepts only an anchored hunk matching the exact source context',()=>{
 const result=validateMessinhoEngineeringPatchAgainstSources(patch,[{path:'backend/messinho-input-correction.js',content:'const value = 1;\n'}]);
 assert.equal(result.ok,true);
 assert.equal(result.sections,1);
});


test('retries transient GitHub and provider failures before giving up',async()=>{
 const waits=[];let githubCalls=0,providerCalls=0;
 const fetchImpl=async url=>{
  if(url.includes('/commits/')){githubCalls++;return githubCalls===1?{ok:false,status:503}:response({sha});}
  if(url.includes('raw.githubusercontent.com'))return {ok:true,text:async()=>sourceFor(url)};
  if(url.includes('api.openai.com')){providerCalls++;return providerCalls===1?{ok:false,status:429}:response({choices:[{message:{content:JSON.stringify({proposal:null})}}]});}
  throw new Error('unexpected_url');
 };
 const result=await generateMessinhoEngineeringProposal({goal:'Prüfe MESSINHO auf konkrete sichere Verbesserungen',env:{OPENAI_API_KEY:'test-key'},fetchImpl});
 assert.equal(result.ok,true);
 assert.equal(result.proposal,null);
 assert.equal(githubCalls,2);
 assert.equal(providerCalls,2);
});

test('does not retry provider quota exhaustion as a transient rate limit',async()=>{
 let providerCalls=0;
 const fetchImpl=async url=>{
  if(url.includes('/commits/'))return response({sha});
  if(url.includes('raw.githubusercontent.com'))return {ok:true,text:async()=>sourceFor(url)};
  if(url.includes('api.openai.com')){providerCalls++;return {ok:false,status:429,json:async()=>({error:{code:'insufficient_quota'}})};}
  throw new Error('unexpected_url');
 };
 const result=await generateMessinhoEngineeringProposal({goal:'Prüfe MESSINHO auf konkrete sichere Verbesserungen',env:{OPENAI_API_KEY:'test-key'},fetchImpl});
 assert.equal(result.ok,false);
 assert.equal(result.failure_reason,'provider_quota_exceeded');
 assert.equal(providerCalls,1);
});


test('uses MESSINHO model settings for engineering review without requiring OpenAI configuration',async()=>{
 const calls=[];
 const fetchImpl=async(url,options)=>{
  calls.push({url,options});
  if(url.includes('/commits/'))return response({sha});
  if(url.includes('raw.githubusercontent.com'))return {ok:true,text:async()=>sourceFor(url)};
  if(url==='https://local-model.invalid/v1/chat/completions'){
   assert.equal(options.headers.Authorization,undefined);
   const body=JSON.parse(options.body);
   assert.equal(body.model,'messinho-local');
   assert.equal(body.max_tokens,4500);
   return response({choices:[{message:{content:'{"proposal":null}'}}]});
  }
  throw new Error('unexpected_url');
 };
 const result=await generateMessinhoEngineeringProposal({goal:'Prüfe MESSINHO auf konkrete sichere Verbesserungen',env:{MESSINHO_MODEL_BASE_URL:'https://local-model.invalid/v1',MESSINHO_MODEL_NAME:'messinho-local'},fetchImpl});
 assert.equal(result.ok,true);
 assert.equal(result.proposal,null);
 assert.ok(calls.some(call=>call.url==='https://local-model.invalid/v1/chat/completions'));
});

test('classifies exhausted provider credits without retrying the request',async()=>{
 let providerCalls=0;
 const fetchImpl=async url=>{
  if(url.includes('/commits/'))return response({sha});
  if(url.includes('raw.githubusercontent.com'))return {ok:true,text:async()=>sourceFor(url)};
  if(url.includes('/chat/completions')){providerCalls++;return {ok:false,status:429,json:async()=>({error:{code:'credit_balance_exhausted'}})};}
  throw new Error('unexpected_url');
 };
 const result=await generateMessinhoEngineeringProposal({goal:'Prüfe MESSINHO auf konkrete sichere Verbesserungen',env:{MESSINHO_MODEL_API_KEY:'test-key'},fetchImpl});
 assert.equal(result.ok,false);
 assert.equal(result.failure_reason,'provider_quota_exceeded');
 assert.equal(providerCalls,1);
});
