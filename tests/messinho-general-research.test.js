import test from 'node:test';
import assert from 'node:assert/strict';
import {isMessinhoGeneralResearchQuestion,normalizeMessinhoGeneralSources,assessMessinhoGeneralEvidence,isMessinhoGeneralClaimSupported,researchMessinhoGeneralQuestion} from '../backend/messinho-general-research.js';

test('detects open knowledge questions but leaves greetings and scouting commands alone',()=>{
 assert.equal(isMessinhoGeneralResearchQuestion('Warum ist der Himmel blau?'),true);
 assert.equal(isMessinhoGeneralResearchQuestion('Erkläre mir das Prinzip der Photosynthese'),true);
 assert.equal(isMessinhoGeneralResearchQuestion('Hallo MESSINHO'),false);
 assert.equal(isMessinhoGeneralResearchQuestion('Analysiere Spieler X'),false);
});
test('normalizes HTTPS sources, removes duplicates and disallowed football portal',()=>{
 const rows=normalizeMessinhoGeneralSources([
  {url:'http://insecure.example/a',title:'Unsafe',content:'x'.repeat(100)},
  {url:'https://www.fussball.de/a',title:'Blocked',content:'x'.repeat(100)},
  {url:'https://a.example/a',title:'A',content:'A reliable source excerpt. '.repeat(8)},
  {url:'https://a.example/a',title:'Duplicate',content:'A reliable source excerpt. '.repeat(8)},
  {url:'https://b.example/b',title:'B',content:'Another reliable source excerpt. '.repeat(8)}
 ]);
 assert.equal(rows.length,2);
 assert.equal(rows[0].publisher,'a.example');
});
test('requires independent domains and substantial evidence before answering',()=>{
 const limited=assessMessinhoGeneralEvidence([{publisher:'a.example',snippet:'x'.repeat(150)},{publisher:'a.example',snippet:'y'.repeat(150)}]);
 assert.equal(limited.can_answer,false);
 const sufficient=assessMessinhoGeneralEvidence([{publisher:'a.example',snippet:'x'.repeat(150)},{publisher:'b.example',snippet:'y'.repeat(150)}]);
 assert.equal(sufficient.can_answer,true);
});
test('fails closed when research provider is not configured',async()=>{
 const result=await researchMessinhoGeneralQuestion('Warum ist der Himmel blau?',{},{});
 assert.equal(result.status,'provider_not_configured');
});
test('returns evidence digest without requiring a language-model provider',async()=>{
 const sources=[
  {url:'https://a.example/fact',title:'Quelle A',content:'Der Himmel erscheint blau, weil Moleküle in der Atmosphäre kurzwelliges blaues Licht stärker streuen. '.repeat(2),published_date:'2026-01-01'},
  {url:'https://b.example/fact',title:'Quelle B',content:'Rayleigh-Streuung beschreibt, dass kurzwelliges Licht in der Atmosphäre stärker gestreut wird als langwelliges Licht. '.repeat(2),published_date:'2026-02-01'}
 ];
 const fakeFetch=async()=>({ok:true,json:async()=>({results:sources})});
 const result=await researchMessinhoGeneralQuestion('Warum ist der Himmel blau?',{TAVILY_API_KEY:'test'},fakeFetch);
 assert.equal(result.status,'completed');
 assert.equal(result.answer_mode,'source_digest');
 assert.equal(result.sources.length,2);
 assert.equal(result.learning.persisted,false);
 assert.match(result.answer,/Quellenauszüge/);
});
test('does not call search for non-research messages',async()=>{
 let called=false;
 const result=await researchMessinhoGeneralQuestion('Hallo MESSINHO',{TAVILY_API_KEY:'test'},async()=>{called=true;});
 assert.equal(result.status,'not_applicable');
 assert.equal(called,false);
});

test('rejects generated claims that do not overlap the cited source excerpt',()=>{
 const sources=[{title:'Atmospheric scattering',snippet:'Blue light is scattered more strongly by atmospheric molecules because it has a shorter wavelength.'}];
 assert.equal(isMessinhoGeneralClaimSupported('Blue light is scattered more strongly by atmospheric molecules.',sources),true);
 assert.equal(isMessinhoGeneralClaimSupported('The moon is made of cheese and contains many minerals.',sources),false);
});


test('does not start external research for conversational complaints about restarting or premature sending',()=>{
 assert.equal(isMessinhoGeneralResearchQuestion('Wieso startest du neu und erledigst'),false);
 assert.equal(isMessinhoGeneralResearchQuestion('Warum hast du meine Nachricht abgeschickt, obwohl ich noch nicht fertig war?'),false);
});
