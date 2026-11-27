import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMessinhoPragmaticContext,MESSINHO_PRAGMATIC_CONTEXT_VERSION} from '../backend/messinho-pragmatic-context.js';

test('pragmatic context recognizes explicit conversational acts without replacing semantic intent',()=>{
  const correction=buildMessinhoPragmaticContext({message:'Nein, ich meinte den anderen Spieler.'});
  assert.equal(correction.cues[0].act,'correction');
  assert.ok(correction.cues[0].response_guidance.includes('reassess_previous_interpretation'));
  const disagreement=buildMessinhoPragmaticContext({message:'Da bin ich anderer Meinung.'});
  assert.equal(disagreement.cues[0].act,'disagreement');
  const opinion=buildMessinhoPragmaticContext({message:'Meiner Meinung nach ist er technisch stärker.'});
  assert.equal(opinion.cues[0].act,'opinion');
});

test('recognizes explicit emotion only from direct self-report wording',()=>{
  assert.equal(buildMessinhoPragmaticContext({message:'Ich bin gerade frustriert.'}).cues[0].act,'explicit_emotion');
  assert.equal(buildMessinhoPragmaticContext({message:'Das war ein schwieriger Spielzug.'}).cues[0].act,'statement_or_open_contribution');
});

test('supports explicit greetings, thanks, acknowledgements and multilingual cues',()=>{
  for(const [message,act] of [
    ['Guten Morgen!','greeting'],['Thanks!','gratitude'],['Genau.','acknowledgement'],
    ['I disagree with that.','disagreement'],['Je ne suis pas d’accord.','disagreement'],
    ['¿Cómo juega él?','question'],['يعطيك الصحة','gratitude'],['عسلامة','greeting']
  ]) assert.equal(buildMessinhoPragmaticContext({message}).cues[0].act,act,message);
});

test('provides bounded weak cues and never returns user text as an instruction or permission',()=>{
  const result=buildMessinhoPragmaticContext({message:'Hallo'.repeat(1000),linguisticContext:{response_language:'de'}});
  assert.equal(result.version,MESSINHO_PRAGMATIC_CONTEXT_VERSION);
  assert.equal(result.language_hint,'de');
  assert.equal(result.bounded,true);
  assert.ok(result.cues.length<=2);
  assert.equal(Object.hasOwn(result,'permission'),false);
  assert.equal(Object.hasOwn(result,'action'),false);
  assert.match(result.policy,/weak conversational hints only/);
});
