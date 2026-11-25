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
