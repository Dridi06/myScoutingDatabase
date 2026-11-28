import test from 'node:test';
import assert from 'node:assert/strict';
import {researchMessinhoGeneralQuestion} from '../backend/messinho-general-research.js';

test('general research receives runtime foundation context without treating it as external evidence',async()=>{
 const calls=[];
 const sources=[
  {title:'Clinical overview of anterior cruciate ligament injury',url:'https://sports-medicine.example.org/acl',content:'An anterior cruciate ligament injury affects knee stability. Treatment and rehabilitation depend on associated injuries, clinical examination, functional progress and individual sporting demands. Recovery cannot be inferred from one variable alone.'},
  {title:'Rehabilitation after anterior cruciate ligament injury',url:'https://orthopaedics.example.net/acl-rehabilitation',content:'Rehabilitation after anterior cruciate ligament injury is progressive and depends on symptoms, strength, movement quality, neuromuscular control and return-to-sport criteria. Individual assessment is important for safe decisions.'}
 ];
 const fetchImpl=async(url,options)=>{
  calls.push({url,body:JSON.parse(options.body)});
  return {ok:true,json:async()=>({results:sources})};
 };
 const core=[{key:'medicine.acl',title:'Vorderes Kreuzband und Rehabilitation',level:'foundational',definition:'Kreuzband stabilisiert das Knie; Rehabilitation ist individuell.',limitations:['Keine pauschale Genesungsdauer.']}];
 const result=await researchMessinhoGeneralQuestion('Was ist eine Kreuzbandverletzung und wie wird sie behandelt?',{TAVILY_API_KEY:'test'},fetchImpl,core);
 assert.equal(result.status,'completed');
 assert.equal(calls.length,1);
 assert.equal(calls[0].body.query,'Was ist eine Kreuzbandverletzung und wie wird sie behandelt?');
 assert.equal(calls[0].body.core_foundation_context,undefined);
});
