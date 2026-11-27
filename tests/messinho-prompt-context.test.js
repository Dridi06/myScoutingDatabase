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
  assert.match(source,/Führe echte Gespräche in der durch response_language bestimmten Sprache/);
  assert.doesNotMatch(source,/Führe echte Gespräche auf Deutsch/);
});


test('actual authenticated chat route loads and injects linguistic intelligence and approved language knowledge',async()=>{
  const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
  const contextCall=source.indexOf('const linguisticContext=buildMessinhoLinguisticContext(message,history)');
  const bridgeCall=source.indexOf('const semanticLanguageBridge=await buildMessinhoSemanticLanguageBridge');
  const knowledgeContext=source.indexOf('const linguisticKnowledgeContext=semanticLanguageBridge.formatted_knowledge');
  const promptInjection=source.indexOf("Sprachdiagnose: '+JSON.stringify(linguisticContext)");
  const knowledgeInjection=source.indexOf("JSON.stringify(linguisticKnowledgeContext)");
  assert.ok(contextCall>0,'chat route must build linguistic context from the authenticated user message');
  assert.ok(bridgeCall>contextCall,'chat route must connect language detection to the shared semantic language bridge');
  assert.ok(knowledgeContext>bridgeCall,'chat route must reuse the approved language knowledge loaded by the bridge');
  assert.ok(promptInjection>knowledgeContext,'system prompt must receive the current linguistic context');
  assert.ok(knowledgeInjection>promptInjection,'system prompt must receive approved versioned language knowledge');
  assert.doesNotMatch(source,/await findMessinhoLanguageKnowledge\(db,message,history\)/,'server route must not load the same language knowledge twice');
  assert.match(source,/const linguisticIntelligence=buildMessinhoLinguisticResponseMetadata\(linguisticContext\)/);
  assert.match(source,/linguistic_intelligence:clientLinguisticIntelligence/);
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


test('system prompt preserves negation scope, qualified evaluation, uncertainty and contrast cues',async()=>{
  const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
  assert.match(source,/signals\.negation_scope_cues/);
  assert.match(source,/signals\.qualified_evaluation_cues/);
  assert.match(source,/signals\.uncertainty_cues/);
  assert.match(source,/signals\.contrast_cues/);
  assert.match(source,/nicht schlecht/);
  assert.match(source,/nicht unbedingt/);
});


test('MESSINHO chat UI consumes response-language metadata and limits semantic cues to Admin',async()=>{
  const ui=await readFile(new URL('../src/asi/MessinhoWorkspace.jsx',import.meta.url),'utf8');
  const server=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
  assert.match(ui,/linguisticIntelligence:payload\.linguistic_intelligence\|\|null/);
  assert.match(ui,/linguisticIntelligence:item\.linguisticIntelligence\|\|null/);
  assert.match(ui,/dir=\{message\.linguisticIntelligence\?\.response_language\?\.startsWith\('ar'\)\?'rtl':'auto'\}/);
  assert.match(ui,/profile\?\.role==='admin'&&getMessinhoSemanticCueLabels/);
  assert.match(ui,/negation_scope_cues/);
  assert.match(ui,/qualified_evaluation_cues/);
  assert.match(server,/linguisticIntelligence:persistedLinguisticIntelligence/);
  assert.match(server,/profile\.role==='admin'\?linguisticIntelligence/);
  assert.match(server,/profile\.role==='admin'\?\(row\.metadata\?\.linguisticIntelligence\|\|null\)/);
});
