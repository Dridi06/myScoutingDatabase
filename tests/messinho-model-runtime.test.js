import test from 'node:test';
import assert from 'node:assert/strict';
import { requestMessinhoModelCompletion, resolveMessinhoModelConfig } from '../backend/messinho-model-runtime.js';

test('model runtime sends a bounded completion token budget and preserves JSON response format',async()=>{
 let captured=null;
 const result=await requestMessinhoModelCompletion({
  model:'audit-model',apiKey:'test-secret',baseUrl:'https://provider.invalid/v1',timeoutMs:1000,
  maxTokens:64,responseFormat:{type:'json_object'},
  messages:[{role:'user',content:'Return JSON only.'}],
  fetchImpl:async(_url,options)=>{
   captured=JSON.parse(options.body);
   return {ok:true,status:200,json:async()=>({model:'audit-model',choices:[{message:{content:'{"status":"VERSTANDEN","minutes":42}'}}],usage:{prompt_tokens:12,completion_tokens:8,total_tokens:20}})};
  }
 });
 assert.equal(captured.max_tokens,64);
 assert.deepEqual(captured.response_format,{type:'json_object'});
 assert.equal(result.status,'completed');
 assert.equal(JSON.parse(result.content).minutes,42);
 assert.equal(result.usage.total_tokens,20);
});

test('model runtime clamps completion token budget and never exposes provider credentials',async()=>{
 let captured=null;
 const result=await requestMessinhoModelCompletion({
  model:'audit-model',apiKey:'never-return-this',baseUrl:'https://provider.invalid/v1',
  maxTokens:9999,messages:[{role:'user',content:'test'}],
  fetchImpl:async(_url,options)=>{
   captured=JSON.parse(options.body);
   return {ok:false,status:401,json:async()=>({error:{code:'unauthorized',message:'invalid credentials'}})};
  }
 });
 assert.equal(captured.max_tokens,128);
 assert.equal(JSON.stringify(result).includes('never-return-this'),false);
});

test('local model endpoints do not require a hosted API key',()=>{
 const config=resolveMessinhoModelConfig({MESSINHO_MODEL_BASE_URL:'http://127.0.0.1:8080/v1',MESSINHO_MODEL_NAME:'local'});
 assert.equal(config.requiresApiKey,false);
 assert.equal(config.model,'local');
});


test('ordinary model requests are not globally capped by the diagnostic token budget',async()=>{
 let captured=null;
 await requestMessinhoModelCompletion({
  model:'normal-chat-model',apiKey:'test-secret',baseUrl:'https://provider.invalid/v1',
  messages:[{role:'user',content:'ordinary conversation'}],
  fetchImpl:async(_url,options)=>{
   captured=JSON.parse(options.body);
   return {ok:true,status:200,json:async()=>({choices:[{message:{content:'ok'}}]})};
  }
 });
 assert.equal(Object.prototype.hasOwnProperty.call(captured,'max_tokens'),false);
});
