import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MESSINHO_GRAMMAR_ENGINE_VERSION,
  MESSINHO_GRAMMAR_LANGUAGES,
  analyzeMessinhoGrammar,
  getMessinhoGrammarEngineSummary
} from '../backend/messinho-grammar-engine.js';

test('registers independent grammar profiles for all six supported language profiles',()=>{
  assert.equal(MESSINHO_GRAMMAR_ENGINE_VERSION,'0.1.0');
  assert.deepEqual(MESSINHO_GRAMMAR_LANGUAGES,['de','en','fr','es','ar','ar-tn']);
  assert.equal(getMessinhoGrammarEngineSummary().automatic_rewriting,false);
});

test('analyzes German subordinate clause and preserves original text',()=>{
  const text='Ich denke, dass der Spieler heute besser spielt.';
  const result=analyzeMessinhoGrammar(text,'de');
  assert.equal(result.status,'analyzed');
  assert.equal(result.language_id,'de');
  assert.equal(result.source_preserved,true);
  assert.ok(result.structural_signals.conjunction_count>=1);
});

test('flags possible English be-verb agreement without rewriting',()=>{
  const text='He are a good player.';
  const result=analyzeMessinhoGrammar(text,'en');
  assert.ok(result.findings.some(item=>item.code==='en_possible_be_agreement'));
  assert.equal(text,'He are a good player.');
});

test('recognizes French agreement structures as evidence, not verdicts',()=>{
  const result=analyzeMessinhoGrammar('Le joueur est très fort.','fr');
  assert.equal(result.status,'analyzed');
  assert.ok(result.structural_signals.article_count>=1);
  assert.ok(result.findings.some(item=>item.code==='fr_article_noun_gender'));
});

test('recognizes Spanish article and noun agreement context',()=>{
  const result=analyzeMessinhoGrammar('La jugadora juega muy bien.','es');
  assert.ok(result.findings.some(item=>item.code==='es_article_noun_agreement_candidate'));
});

test('recognizes MSA negation and definite article separately from Derja',()=>{
  const result=analyzeMessinhoGrammar('اللاعب ليس جاهزا للفريق.','ar');
  assert.ok(result.findings.some(item=>item.code==='ar_definite_article'));
});

test('recognizes Tunisian Derja ma-verb-ch negation as dialect grammar',()=>{
  const result=analyzeMessinhoGrammar('اللاعب ما يلعبش اليوم.','ar-tn');
  assert.ok(result.findings.some(item=>item.code==='tn_negation_circumfix'));
});

test('recognizes Arabizi person-marked verb morphology',()=>{
  const result=analyzeMessinhoGrammar('Ena nheb nal3ab fel equipe.','ar-tn');
  assert.ok(result.findings.some(item=>item.code==='tn_person_marked_verb'));
});

test('returns safe states for empty, short and unsupported inputs',()=>{
  assert.equal(analyzeMessinhoGrammar('','de').status,'empty');
  assert.equal(analyzeMessinhoGrammar('OK','en').status,'insufficient_text');
  assert.equal(analyzeMessinhoGrammar('hello there','it').status,'unsupported_language');
});
