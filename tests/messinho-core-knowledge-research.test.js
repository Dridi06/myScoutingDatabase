import test from 'node:test';
import assert from 'node:assert/strict';
import {researchMessinhoGeneralQuestion} from '../backend/messinho-general-research.js';

test('general research receives runtime foundation context for evidence-based synthesis',async()=>{
 const calls=[];
 const sources=[
  {title:'Kreuzbandverletzung und Kniegelenk',url:'https://sports-medicine.example.org/acl',content:'Eine Kreuzbandverletzung wird abhängig von Begleitverletzungen und Befund behandelt. Sie betrifft das Kniegelenk und kann die Stabilität beeinträchtigen. Behandlung und Rehabilitation hängen von Begleitverletzungen, klinischer Untersuchung, funktionellem Fortschritt und den sportlichen Anforderungen ab. Die Genesung lässt sich nicht aus einem einzelnen Merkmal ableiten.'},
  {title:'Rehabilitation nach Kreuzbandverletzung',url:'https://orthopaedics.example.net/acl-rehabilitation',content:'Eine Kreuzbandverletzung wird abhängig von Befund und Funktionsstatus behandelt und betrifft das Kniegelenk. Die Behandlung und Rehabilitation verlaufen schrittweise und hängen von Symptomen, Kraft, Bewegungsqualität, neuromuskulärer Kontrolle und Kriterien für die Rückkehr zum Sport ab. Eine individuelle Beurteilung ist wichtig.'}
 ];
 const core=[{key:'medicine.acl',title:'Vorderes Kreuzband und Rehabilitation',level:'foundational',definition:'Das vordere Kreuzband stabilisiert das Knie; Rehabilitation ist individuell.',limitations:['Keine pauschale Genesungsdauer.']}];
 const fetchImpl=async(url,options)=>{
  const body=JSON.parse(options.body);calls.push({url,body});
  if(url.includes('tavily'))return {ok:true,json:async()=>({results:sources})};
  const isCritic=body.messages?.[0]?.content?.includes('unabhängige Qualitätsprüfer');
  const answer='Eine Kreuzbandverletzung betrifft das Kniegelenk. Belege: [Quelle 1](https://sports-medicine.example.org/acl) · [Quelle 2](https://orthopaedics.example.net/acl-rehabilitation).';
  return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(isCritic?{passed:true,score:9,feedback:'Keine Korrektur erforderlich.'}:{answer,claims:[{text:'Eine Kreuzbandverletzung betrifft das Kniegelenk.',source_urls:sources.map(source=>source.url)}]})}}]})};
 };
 const result=await researchMessinhoGeneralQuestion(
  'Was ist eine Kreuzbandverletzung und wie wird sie behandelt?',
  {TAVILY_API_KEY:'test',OPENAI_API_KEY:'test'},
  fetchImpl,
  core
 );
 assert.equal(result.status,'completed');
 assert.equal(result.quality_control.passed,true);
 const synthesis=calls.find(call=>call.url.includes('chat/completions')&&!call.body.messages?.[0]?.content?.includes('unabhängige Qualitätsprüfer'));
 assert.ok(synthesis);
 const userPayload=JSON.parse(synthesis.body.messages[1].content);
 assert.deepEqual(userPayload.core_foundation_context,core);
});
