import test from 'node:test';
import assert from 'node:assert/strict';
import {runMessinhoQualityLoop,inspectMessinhoAnswerLinks,reviewMessinhoDraft} from '../backend/messinho-quality-control.js';
const sources=[{title:'Spielerprofil',url:'https://example.org/player',publisher:'example.org',snippet:'Tom Bischof spielt im zentralen Mittelfeld und überzeugt durch sein Passspiel.'}];
const claims=[{text:'Tom Bischof spielt im zentralen Mittelfeld.',source_urls:['https://example.org/player']}];
const draft='Tom Bischof spielt im zentralen Mittelfeld. [Spielerprofil](https://example.org/player)';
const fakeCritic=(passed,score=9)=>async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({passed,score,feedback:passed?'':'Bitte genauer belegen.'})}}]})});

test('quality loop never exceeds three iterations and stops on critic approval',async()=>{
 let generated=0,reviewed=0;
 const result=await runMessinhoQualityLoop({question:'Wie spielt Tom Bischof?',sources,draftFactory:async()=>{generated++;return {answer:draft,claims};},
  env:{OPENAI_API_KEY:'test'},fetchImpl:async()=>{reviewed++;return fakeCritic(reviewed===2)();}});
 assert.equal(generated,2);assert.equal(reviewed,2);assert.equal(result.passed,true,JSON.stringify(result));assert.equal(result.iterations,2);
});
test('quality loop has a hard three-iteration ceiling',async()=>{
 let generated=0;
 const result=await runMessinhoQualityLoop({question:'Wie spielt Tom Bischof?',sources,draftFactory:async()=>{generated++;return {answer:draft,claims};},
  env:{OPENAI_API_KEY:'test'},fetchImpl:fakeCritic(false,6)});
 assert.equal(generated,3);assert.equal(result.iterations,3);assert.equal(result.passed,false);
});
test('link validator rejects too many, raw and unapproved links',()=>{
 assert.equal(inspectMessinhoAnswerLinks(draft,sources).valid,true);
 assert.equal(inspectMessinhoAnswerLinks(draft+' [Zwei](https://example.org/2) [Drei](https://example.org/3) [Vier](https://example.org/4)',sources).valid,false);
 assert.equal(inspectMessinhoAnswerLinks('Siehe https://example.org/player',sources).valid,false);
 assert.equal(inspectMessinhoAnswerLinks('[Quelle](https://unknown.example/path)',sources).valid,false);
});
test('critic cannot pass when deterministic claim or source checks fail',async()=>{
 const result=await reviewMessinhoDraft({question:'Frage',draft:'Tom Bischof spielt im zentralen Mittelfeld. [Profil](https://example.org/player)',
  sources,claims:[{text:'Er erzielte 40 Tore in der Saison.',source_urls:['https://example.org/player']}],
  env:{OPENAI_API_KEY:'test'},fetchImpl:fakeCritic(true,10)});
 assert.equal(result.passed,false);assert.equal(result.deterministic.passed,false);
});
test('quality review fails closed when critic provider is unavailable',async()=>{
 const result=await reviewMessinhoDraft({question:'Frage',draft,claims,sources,env:{OPENAI_API_KEY:'test'},fetchImpl:async()=>({ok:false})});
 assert.equal(result.passed,false);assert.equal(result.review_available,false);
});


test('quality critic prefers provider-neutral MESSINHO model settings',async()=>{
 let request=null;
 const result=await reviewMessinhoDraft({
  question:'Wie spielt Tom Bischof?',draft,claims,sources,
  env:{MESSINHO_MODEL_BASE_URL:'https://neutral.example/v1',MESSINHO_MODEL_API_KEY:'neutral-secret',MESSINHO_MODEL_NAME:'neutral-reviewer',OPENAI_API_KEY:'legacy-secret'},
  fetchImpl:async(url,options)=>{
   request={url,body:JSON.parse(options.body),authorization:options.headers.Authorization};
   return {ok:true,status:200,json:async()=>({choices:[{message:{content:JSON.stringify({passed:true,score:9,feedback:'Belege stimmen.'})}}]})};
  }
 });
 assert.equal(result.passed,true);
 assert.equal(request.url,'https://neutral.example/v1/chat/completions');
 assert.equal(request.body.model,'neutral-reviewer');
 assert.equal(request.authorization,'Bearer neutral-secret');
 assert.equal(JSON.stringify(result).includes('neutral-secret'),false);
});

test('quality critic supports a local model endpoint without hosted credentials',async()=>{
 let request=null;
 const result=await reviewMessinhoDraft({
  question:'Wie spielt Tom Bischof?',draft,claims,sources,
  env:{MESSINHO_MODEL_BASE_URL:'http://127.0.0.1:8080/v1',MESSINHO_MODEL_NAME:'local-reviewer'},
  fetchImpl:async(url,options)=>{
   request={url,headers:options.headers};
   return {ok:true,status:200,json:async()=>({choices:[{message:{content:JSON.stringify({passed:true,score:9,feedback:'Lokale Prüfung.'})}}]})};
  }
 });
 assert.equal(result.passed,true);
 assert.equal(request.url,'http://127.0.0.1:8080/v1/chat/completions');
 assert.equal(request.headers.Authorization,undefined);
});
