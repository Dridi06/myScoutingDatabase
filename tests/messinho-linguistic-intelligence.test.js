import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MESSINHO_LINGUISTIC_INTELLIGENCE_VERSION,
  MESSINHO_LANGUAGE_PROFILES,
  analyzeMessinhoLanguage,
  buildMessinhoLinguisticContext,
  getMessinhoLanguageProfile
} from '../backend/messinho-linguistic-intelligence.js';

test('registers six separate language profiles including Tunisian Derja',()=>{
  assert.equal(MESSINHO_LINGUISTIC_INTELLIGENCE_VERSION,'1.0.0');
  assert.deepEqual(MESSINHO_LANGUAGE_PROFILES.map(item=>item.id),['de','en','fr','ar','ar-tn','es']);
  assert.equal(getMessinhoLanguageProfile('ar-tn').name,'تونسي / Derja');
  assert.equal(getMessinhoLanguageProfile('ar').name,'العربية الفصحى');
});

test('detects German and preserves nuance signals',()=>{
  const result=analyzeMessinhoLanguage('Der Spieler ist eigentlich nicht schlecht, aber für diese Liga reicht es noch nicht.');
  assert.equal(result.primary_language,'de');
  assert.equal(result.signals.negation,true);
  assert.equal(result.signals.uncertainty,true);
  assert.equal(result.signals.contrast,true);
  assert.equal(result.policy.source_text_preserved,true);
});

test('detects English',()=>assert.equal(analyzeMessinhoLanguage('The player is not ready for this league yet.').primary_language,'en'));
test('detects French',()=>assert.equal(analyzeMessinhoLanguage('Bonjour, je voudrais analyser ce joueur et comprendre ses points forts.').primary_language,'fr'));
test('detects Spanish',()=>assert.equal(analyzeMessinhoLanguage('Hola, quiero analizar este jugador y entender sus puntos fuertes.').primary_language,'es'));

test('distinguishes Modern Standard Arabic from Tunisian Arabic script',()=>{
  const msa=analyzeMessinhoLanguage('كيف يمكن تقييم أداء هذا اللاعب في الفريق؟');
  const derja=analyzeMessinhoLanguage('شنوة رايك في اللاعب هذا؟');
  assert.equal(msa.primary_language,'ar');
  assert.equal(derja.primary_language,'ar-tn');
});

test('detects Tunisian Derja written in Latin Arabizi',()=>{
  const result=analyzeMessinhoLanguage('Chnowa rayek fel joueur hedha? Labes barcha.');
  assert.equal(result.primary_language,'ar-tn');
  assert.ok(result.notes.some(note=>note.includes('Tunisian Derja')));
});

test('recognizes Arabic and Latin scripts in code-switched Tunisian messages',()=>{
  const result=analyzeMessinhoLanguage('اللاعب هذا barcha behi');
  assert.ok(result.scripts.includes('Arabic'));
  assert.ok(result.scripts.includes('Latin'));
  assert.ok(result.languages.some(item=>item.id==='ar-tn'));
});

test('returns ambiguous rather than inventing a language for short text',()=>{
  const result=analyzeMessinhoLanguage('OK');
  assert.equal(result.primary_language,null);
  assert.equal(result.status,'ambiguous');
});

test('empty input is handled safely',()=>assert.equal(analyzeMessinhoLanguage(' ').status,'empty'));

test('language profile getter returns a defensive copy',()=>{
  const profile=getMessinhoLanguageProfile('de');
  profile.capabilities.push('tampered');
  assert.equal(getMessinhoLanguageProfile('de').capabilities.includes('tampered'),false);
});

test('conversation context retains a recent language hint without overriding current language',()=>{
  const result=buildMessinhoLinguisticContext('Hola, quiero analizar este jugador.',[
    {role:'user',text:'Guten Tag, kannst du mir helfen?'},
    {role:'user',text:'Bitte erkläre mir das genauer.'}
  ]);
  assert.equal(result.primary_language,'es');
  assert.equal(result.conversation_language_hint,'es');
  assert.ok(result.conversation_policy.some(item=>item.includes('latest user message')));
});


test('detects short everyday greetings in all six language profiles',()=>{
  assert.equal(analyzeMessinhoLanguage('Hallo, wie geht es dir?').primary_language,'de');
  assert.equal(analyzeMessinhoLanguage('Hello, how are you?').primary_language,'en');
  assert.equal(analyzeMessinhoLanguage('Bonjour, comment ça va?').primary_language,'fr');
  assert.equal(analyzeMessinhoLanguage('السلام عليكم، كيف حالك؟').primary_language,'ar');
  assert.equal(analyzeMessinhoLanguage('Aslema, labes?').primary_language,'ar-tn');
  assert.equal(analyzeMessinhoLanguage('Hola, ¿cómo estás?').primary_language,'es');
});

test('does not claim translation or dictionary coverage',()=>{
  const result=analyzeMessinhoLanguage('Bonjour, comment vas-tu?');
  assert.equal(result.policy.translated,false);
  assert.equal(result.policy.dictionary_corpus_included,false);
  assert.equal(result.policy.claims_fluency,false);
});
