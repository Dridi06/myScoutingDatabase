import test from 'node:test';
import assert from 'node:assert/strict';
import {isMessinhoGeneralResearchQuestion,normalizeMessinhoGeneralSources,assessMessinhoGeneralEvidence,isMessinhoGeneralClaimSupported,isMessinhoGeneralClaimCorroborated,isMessinhoTimeSensitiveQuestion,researchMessinhoGeneralQuestion} from '../backend/messinho-general-research.js';

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


test('requires two recent independent sources for time-sensitive questions',()=>{
 const now=new Date('2026-11-26T12:00:00Z');
 const fresh=[
  {publisher:'a.example',snippet:'x'.repeat(150),published_date:'2026-11-01'},
  {publisher:'b.example',snippet:'y'.repeat(150),published_date:'2026-10-15'}
 ];
 const evidence=assessMessinhoGeneralEvidence(fresh,'Wer ist aktuell Trainer?',now);
 assert.equal(evidence.can_answer,true);
 assert.equal(evidence.freshness.status,'current_sources');
 assert.equal(evidence.freshness.fresh_source_count,2);
});

test('does not present old or undated results as current facts',()=>{
 const now=new Date('2026-11-26T12:00:00Z');
 const old=[
  {publisher:'a.example',snippet:'x'.repeat(150),published_date:'2025-01-01'},
  {publisher:'b.example',snippet:'y'.repeat(150),published_date:'2025-03-01'}
 ];
 const evidence=assessMessinhoGeneralEvidence(old,'Was ist aktuell der Stand?',now);
 assert.equal(evidence.can_answer,false);
 assert.equal(evidence.status,'stale');
 assert.equal(evidence.freshness.stale_source_count,2);
 assert.match(evidence.limitations.join(' '),/höchstens 90 Tage/);
});

test('keeps recency requirements disabled for stable knowledge questions',()=>{
 const now=new Date('2026-11-26T12:00:00Z');
 const sources=[
  {publisher:'a.example',snippet:'x'.repeat(150),published_date:'2024-01-01'},
  {publisher:'b.example',snippet:'y'.repeat(150),published_date:'2023-01-01'}
 ];
 const evidence=assessMessinhoGeneralEvidence(sources,'Warum ist der Himmel blau?',now);
 assert.equal(evidence.can_answer,true);
 assert.equal(evidence.freshness.required,false);
});


test('stale results are returned as insufficient evidence before any synthesis attempt',async()=>{
 let calls=0;
 const sources=[
  {url:'https://a.example/current',title:'Old A',content:'A sufficiently detailed but old source excerpt. '.repeat(5),published_date:'2025-01-01'},
  {url:'https://b.example/current',title:'Old B',content:'Another sufficiently detailed but old source excerpt. '.repeat(5),published_date:'2025-02-01'}
 ];
 const result=await researchMessinhoGeneralQuestion('Was ist aktuell der Stand?',{TAVILY_API_KEY:'test',OPENAI_API_KEY:'test'},async()=>{
  calls++;
  return {ok:true,json:async()=>({results:sources})};
 });
 assert.equal(result.status,'insufficient_evidence');
 assert.equal(result.evidence.freshness.status,'insufficient_current_sources');
 assert.equal(calls,1);
});


test('requires every synthesized factual claim to be supported by two independent sources',()=>{
 const claim={text:'Blue light is scattered more strongly by atmospheric molecules.',source_urls:['https://a.example/fact','https://b.example/fact']};
 const sources=[
  {url:'https://a.example/fact',publisher:'a.example',title:'Atmospheric scattering',snippet:'Blue light is scattered more strongly by atmospheric molecules because it has a shorter wavelength.'},
  {url:'https://b.example/fact',publisher:'b.example',title:'Rayleigh scattering',snippet:'Atmospheric molecules scatter blue light more strongly than red light because blue light has a shorter wavelength.'}
 ];
 assert.equal(isMessinhoGeneralClaimCorroborated(claim,sources),true);
 assert.equal(isMessinhoGeneralClaimCorroborated({...claim,source_urls:['https://a.example/fact']},sources),false);
});

test('does not count two URLs from the same publisher as independent corroboration',()=>{
 const claim={text:'Blue light is scattered more strongly by atmospheric molecules.',source_urls:['https://a.example/one','https://a.example/two']};
 const sources=[
  {url:'https://a.example/one',publisher:'a.example',title:'Source one',snippet:'Blue light is scattered more strongly by atmospheric molecules because it has a shorter wavelength.'},
  {url:'https://a.example/two',publisher:'a.example',title:'Source two',snippet:'Atmospheric molecules scatter blue light more strongly than red light because blue light has a shorter wavelength.'}
 ];
 assert.equal(isMessinhoGeneralClaimCorroborated(claim,sources),false);
});

test('rejects a claim if any cited source does not independently support it',()=>{
 const claim={text:'Blue light is scattered more strongly by atmospheric molecules.',source_urls:['https://a.example/fact','https://b.example/fact']};
 const sources=[
  {url:'https://a.example/fact',publisher:'a.example',title:'Atmospheric scattering',snippet:'Blue light is scattered more strongly by atmospheric molecules because it has a shorter wavelength.'},
  {url:'https://b.example/fact',publisher:'b.example',title:'Unrelated article',snippet:'The moon orbits the Earth and affects ocean tides.'}
 ];
 assert.equal(isMessinhoGeneralClaimCorroborated(claim,sources),false);
});


test('recognizes inherently dynamic football questions even without the word current',()=>{
 assert.equal(isMessinhoTimeSensitiveQuestion('Wer trainiert Borussia Dortmund?'),true);
 assert.equal(isMessinhoTimeSensitiveQuestion('Wie ist der aktuelle Tabellenstand?'),true);
 assert.equal(isMessinhoTimeSensitiveQuestion('Wie wird ein Fußballtrainer ausgebildet?'),false);
});

test('does not impose current-source rules on explicitly historical questions',()=>{
 assert.equal(isMessinhoTimeSensitiveQuestion('Wer war 2014 Trainer von Borussia Dortmund?'),false);
 assert.equal(isMessinhoTimeSensitiveQuestion('Historischer Rückblick auf die Bundesliga-Tabelle 1998'),false);
});


test('uses short freshness windows for live standings and fixtures',()=>{
 assert.equal(messinhoFreshnessWindowDays('Wie ist der aktuelle Tabellenstand?'),7);
 assert.equal(messinhoFreshnessWindowDays('Welche Spiele finden morgen statt?'),7);
 assert.equal(messinhoFreshnessWindowDays('Wer trainiert Borussia Dortmund?'),30);
 assert.equal(messinhoFreshnessWindowDays('Warum ist der Himmel blau?'),90);
});

test('rejects a two-week-old source for live league standings',()=>{
 const now=new Date('2026-11-26T12:00:00Z');
 const sources=[
  {publisher:'a.example',snippet:'x'.repeat(150),published_date:'2026-11-10'},
  {publisher:'b.example',snippet:'y'.repeat(150),published_date:'2026-11-12'}
 ];
 const evidence=assessMessinhoGeneralEvidence(sources,'Wie ist aktuell der Tabellenstand?',now);
 assert.equal(evidence.can_answer,false);
 assert.equal(evidence.freshness.max_age_days,7);
});
