import test from 'node:test';
import assert from 'node:assert/strict';
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
const response=(payload)=>({ok:true,json:async()=>payload,text:async()=>payload});
const candidate={title:'Verbesserte Eingabe-Normalisierung',rationale:'Ein konkreter Grenzfall in der Normalisierung wird nicht konsistent behandelt und kann sicher vereinheitlicht werden.',patch,test_plan:['Grenzfall und Normalfall prüfen','Regression für bestehende Korrekturen prüfen'],rollback_plan:'Vorherigen Commit wiederherstellen und beide Regressionstests erneut ausführen.'};

test('recognizes explicit Admin self-review requests',()=>{
 assert.equal(isMessinhoEngineeringRequest('MESSINHO, entwickle eine Verbesserung für dich selbst'),true);
 assert.equal(isMessinhoEngineeringRequest('Bitte prüfe das System und optimiere es'),true);
 assert.equal(isMessinhoEngineeringRequest('Suche einen U19 Stürmer'),false);
});

test('generates a validated proposal from pinned source revision without applying it',async()=>{
 const calls=[];
 const fetchImpl=async(url)=>{
  calls.push(url);
  if(url.includes('/commits/'))return response({sha});
  if(url.includes('raw.githubusercontent.com'))return {ok:true,text:async()=> 'export const safe = true;\n'};
  if(url.includes('api.openai.com'))return response({choices:[{message:{content:JSON.stringify({proposal:candidate})}}]});
  throw new Error('unexpected_url');
 };
 const r=await generateMessinhoEngineeringProposal({goal:'Prüfe MESSINHO auf konkrete sichere Verbesserungen',env:{OPENAI_API_KEY:'test-key'},fetchImpl});
 assert.equal(r.ok,true);assert.equal(r.proposal.benchmark_id,'feature/messinho-unified-ai-integration@'+sha);
 assert.equal(r.tests_executed,false);assert.equal(r.execution_mode,'proposal_only');
 assert.equal(calls.length,7);
});

test('returns no proposal when the reviewer cannot prove an improvement',async()=>{
 const fetchImpl=async(url)=>{
  if(url.includes('/commits/'))return response({sha});
  if(url.includes('raw.githubusercontent.com'))return {ok:true,text:async()=> 'const x = 1;\n'};
  return response({choices:[{message:{content:'{"proposal":null}'}}]});
 };
 const r=await generateMessinhoEngineeringProposal({goal:'Bitte prüfe das System auf Verbesserungen',env:{OPENAI_API_KEY:'test-key'},fetchImpl});
 assert.equal(r.ok,true);assert.equal(r.proposal,null);assert.equal(r.reason,'no_reliable_improvement');
});

test('fails closed when provider, source or patch validation is unavailable',async()=>{
 const noKey=await generateMessinhoEngineeringProposal({goal:'System verbessern',env:{}});
 assert.equal(noKey.ok,false);
 const badSource=await generateMessinhoEngineeringProposal({goal:'System verbessern',env:{OPENAI_API_KEY:'x'},fetchImpl:async()=>({ok:false})});
 assert.equal(badSource.ok,false);
 const unsafe=await generateMessinhoEngineeringProposal({goal:'System verbessern',env:{OPENAI_API_KEY:'x'},fetchImpl:async(url)=>{
  if(url.includes('/commits/'))return response({sha});
  if(url.includes('raw.githubusercontent.com'))return {ok:true,text:async()=> 'source'};
  return response({choices:[{message:{content:JSON.stringify({proposal:{...candidate,patch:patch.replace('const value = 2;','process.env.SECRET')}})}}]});
 }});
 assert.equal(unsafe.ok,false);
});

test('rejects a model patch whose old lines do not exist in the pinned source',()=>{
 const result=validateMessinhoEngineeringPatchAgainstSources(patch,[{path:'backend/messinho-input-correction.js',content:'const actual = 1;\\n'}]);
 assert.equal(result.ok,false);
 assert.equal(result.reason,'patch_context_does_not_match_pinned_source');
});

test('accepts only an anchored hunk matching the exact source context',()=>{
 const result=validateMessinhoEngineeringPatchAgainstSources(patch,[{path:'backend/messinho-input-correction.js',content:'const value = 1;\\n'}]);
 assert.equal(result.ok,true);
 assert.equal(result.sections,1);
});
