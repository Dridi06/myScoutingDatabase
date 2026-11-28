import test from 'node:test';
import assert from 'node:assert/strict';
import {validateResearchInput,normalizeResearchSources,assessMarketValueOutput,researchMessinhoMarketValue} from '../backend/messinho-research.js';
test('requires a meaningful player name',()=>assert.throws(()=>validateResearchInput({name:' '})));
test('filters unsafe and FUSSBALL.DE source URLs and deduplicates',()=>{
 const rows=normalizeResearchSources([{url:'http://example.com/a'},{url:'https://www.fussball.de/a'},{url:'https://example.org/a',title:'A'},{url:'https://example.org/a',title:'duplicate'}]);
 assert.equal(rows.length,1);assert.equal(rows[0].publisher,'example.org');
});
test('does not estimate value without three distinct evidenced comparables',()=>{
 const sources=[{url:'https://a.example/x'},{url:'https://b.example/x'}];
 const result=assessMarketValueOutput({estimated_value_low_eur:10000,estimated_value_high_eur:20000,comparables:[{player:'A',reported_value_eur:10000,source_url:sources[0].url}]},sources);
 assert.equal(result.estimated_value,null);assert.equal(result.confidence,'insufficient_data');
});
test('accepts a range only with three distinct sourced comparables',()=>{
 const sources=['a','b','c'].map(x=>({url:'https://'+x+'.example/x'}));
 const result=assessMarketValueOutput({estimated_value_low_eur:10000,estimated_value_high_eur:20000,comparables:sources.map((s,i)=>({player:'Player '+i,reported_value_eur:10000+i*1000,source_url:s.url}))},sources);
 assert.equal(result.estimated_value.low_eur,10000);
});
test('fails closed without provider keys',async()=>{
 const result=await researchMessinhoMarketValue({name:'Test Player'},{},{});
 assert.equal(result.status,'provider_not_configured');
});


test('market-value research uses provider-neutral MESSINHO model settings',async()=>{
 const searchSources=[
  {url:'https://a.example/player',title:'Player source',content:'A long and detailed player profile with a current club and reported market value comparables. '.repeat(2)},
  {url:'https://b.example/player',title:'Comparable source',content:'A separate report with transfer market value information for several different football players. '.repeat(2)}
 ];
 let modelCalls=0,searchCalls=0;
 const fakeFetch=async(url,options)=>{
  if(url==='https://api.tavily.com/search'){
   searchCalls++;return {ok:true,status:200,json:async()=>({results:searchSources})};
  }
  modelCalls++;
  assert.equal(url,'https://neutral.example/v1/chat/completions');
  const body=JSON.parse(options.body);assert.equal(body.model,'neutral-scout-model');
  const sources=searchSources.map(x=>x.url);
  const content=JSON.stringify({
   estimated_value_low_eur:1000000,estimated_value_high_eur:2000000,
   comparables:[
    {player:'Comparable A',reported_value_eur:1000000,source_url:sources[0]},
    {player:'Comparable B',reported_value_eur:1500000,source_url:sources[1]},
    {player:'Comparable C',reported_value_eur:1800000,source_url:sources[0]}
   ],
   confidence:'medium',rationale:'Three distinct comparable players are cited.',missing_data:[]
  });
  return {ok:true,status:200,json:async()=>({choices:[{message:{content}}]})};
 };
 const result=await researchMessinhoMarketValue({name:'Test Player'},{
  TAVILY_API_KEY:'search-key',
  MESSINHO_MODEL_BASE_URL:'https://neutral.example/v1',
  MESSINHO_MODEL_API_KEY:'neutral-key',
  MESSINHO_MODEL_NAME:'neutral-scout-model'
 },fakeFetch);
 assert.equal(searchCalls,1);assert.equal(modelCalls,1);
 assert.equal(result.status,'completed');
 assert.equal(result.market_value.estimated_value.low_eur,1000000);
 assert.equal(result.provider.analysis,'neutral-scout-model');
});

test('player profile synthesis and critic review use provider-neutral runtime',async()=>{
 const searchSources=[
  {url:'https://a.example/profile',title:'Profile A',content:'Test Player is a central midfielder at Example FC and has played in the first team. '.repeat(2)},
  {url:'https://b.example/profile',title:'Profile B',content:'Test Player plays as a central midfielder for Example FC in the current season. '.repeat(2)}
 ];
 let providerCalls=0;
 const claim='Test Player is a central midfielder for Example FC.';
 const fakeFetch=async(url,options)=>{
  if(url==='https://api.tavily.com/search')return {ok:true,status:200,json:async()=>({results:searchSources})};
  providerCalls++;
  const content=providerCalls===1
   ?JSON.stringify({identity_status:'confirmed',summary:claim,facts:[{text:claim,source_urls:searchSources.map(x=>x.url)}],career:[],recent_performance:{},missing_data:[]})
   :JSON.stringify({passed:true,score:9,feedback:'Die belegte Aussage ist nachvollziehbar.'});
  return {ok:true,status:200,json:async()=>({choices:[{message:{content}}]})};
 };
 const result=await (await import('../backend/messinho-research.js')).researchMessinhoPlayerProfile('Test Player',{
  TAVILY_API_KEY:'search-key',
  MESSINHO_MODEL_BASE_URL:'https://neutral.example/v1',
  MESSINHO_MODEL_API_KEY:'neutral-key',
  MESSINHO_MODEL_NAME:'neutral-profile-model'
 },fakeFetch);
 assert.equal(result.status,'completed');
 assert.equal(result.quality_control.passed,true);
 assert.equal(result.provider.analysis,'neutral-profile-model');
 assert.equal(providerCalls,2);
});
