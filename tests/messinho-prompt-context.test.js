import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('MESSINHO system prompt injects the approved hierarchical knowledge context only once', async () => {
  const source = await readFile(new URL('../backend/server.js', import.meta.url), 'utf8');
  const matches = source.match(/HIERARCHISCHES, FREIGEGEBENES MESSINHO-FACHWISSEN/g) || [];
  assert.equal(matches.length, 1, 'approved knowledge context must not be duplicated in the system prompt');
});


test('MESSINHO system prompt does not force German when the user writes in another supported language',async()=>{
  const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
  assert.match(source,/Führe echte Gespräche in der Sprache der letzten Nutzernachricht/);
  assert.doesNotMatch(source,/Führe echte Gespräche auf Deutsch/);
});


test('actual authenticated chat route loads and injects linguistic intelligence and approved language knowledge',async()=>{
  const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
  const contextCall=source.indexOf('const linguisticContext=buildMessinhoLinguisticContext(message,history)');
  const knowledgeCall=source.indexOf('await findMessinhoLanguageKnowledge(db,message,history)');
  const promptInjection=source.indexOf("Sprachdiagnose: '+JSON.stringify(linguisticContext)");
  const knowledgeInjection=source.indexOf("JSON.stringify(linguisticKnowledgeContext)");
  assert.ok(contextCall>0,'chat route must build linguistic context from the authenticated user message');
  assert.ok(knowledgeCall>contextCall,'chat route must retrieve language knowledge after context detection');
  assert.ok(promptInjection>knowledgeCall,'system prompt must receive the current linguistic context');
  assert.ok(knowledgeInjection>promptInjection,'system prompt must receive approved versioned language knowledge');
  assert.match(source,/linguistic_intelligence:buildMessinhoLinguisticResponseMetadata\(linguisticContext\)/);
  const intelligence=await readFile(new URL('../backend/messinho-linguistic-intelligence.js',import.meta.url),'utf8');
  assert.match(intelligence,/response_language:context\.response_language/);
  assert.match(intelligence,/latest_segment_language:context\.latest_segment_language/);
  assert.match(source,/linguistic_knowledge:\{status:linguisticKnowledgeStatus\}/);
});

test('package build invokes Vite through Node instead of an executable shim',async()=>{
  const packageJson=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  assert.match(packageJson.scripts.build,/node \.\/node_modules\/vite\/bin\/vite\.js build$/);
});


test('MESSINHO prompt prioritizes the latest detected segment for reply language',async()=>{
  const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
  assert.match(source,/Für die Antwortsprache hat response_language Vorrang/);
  assert.match(source,/latest_segment_language/);
  assert.match(source,/letzte eindeutig erkannte Sprachsegment-Sprache/);
  assert.match(source,/buildMessinhoLinguisticResponseMetadata\(linguisticContext\)/);
});
