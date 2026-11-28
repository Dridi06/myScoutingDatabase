import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMessinhoAnswerVerification, MESSINHO_ANSWER_VERIFICATION_VERSION } from '../backend/messinho-answer-verification.js';

test('correct percentage arithmetic passes without manufacturing a finding',()=>{
 const result=buildMessinhoAnswerVerification({message:'Was sind 15 Prozent von 240?',reply:'15 Prozent von 240 sind 36.'});
 assert.equal(result.version,MESSINHO_ANSWER_VERIFICATION_VERSION);
 assert.equal(result.status,'accepted');
 assert.deepEqual(result.findings,[]);
});

test('incorrect percentage arithmetic requests one bounded correction',()=>{
 const result=buildMessinhoAnswerVerification({message:'Was sind 15 Prozent von 240?',reply:'15 Prozent von 240 sind 42.'});
 assert.equal(result.status,'revision_required');
 assert.equal(result.correction.required,true);
 assert.equal(result.correction.instructions[0].expected,36);
});

test('time-sensitive unsupported factual wording is advisory, not declared false',()=>{
 const result=buildMessinhoAnswerVerification({message:'Welche aktuelle Statistik hat der Spieler?',reply:'Aktuell ist er definitiv der schnellste Spieler.'});
 assert.equal(result.status,'advisory');
 assert.ok(result.findings.some(item=>item.code==='time_sensitive_claim_without_research_context'));
 assert.ok(result.findings.some(item=>item.code==='absolute_factual_language_without_research_context'));
});

test('structured research context suppresses absence-of-evidence advisories',()=>{
 const result=buildMessinhoAnswerVerification({
  message:'Welche aktuelle Statistik hat der Spieler?',
  reply:'Aktuell liegt eine Statistik vor.',
  reasoningContext:{evidence:[{research_entities:[{type:'player',name:'Test'}]}]}
 });
 assert.equal(result.status,'accepted');
});

test('unsupported player speed measurements request correction',()=>{
 const result=buildMessinhoAnswerVerification({
  message:'Wie schnell ist der Spieler?',
  reply:'Der Spieler erreicht 36 km/h.',
  reasoningContext:{evidence:[]}
 });
 assert.equal(result.status,'revision_required');
 assert.ok(result.findings.some(item=>item.code==='unsupported_player_metric'));
});

test('ordinary conversational claims and approximate examples are not blocked',()=>{
 const result=buildMessinhoAnswerVerification({message:'Was hältst du davon?',reply:'Ich würde zunächst beide Möglichkeiten vergleichen.'});
 assert.equal(result.status,'accepted');
 assert.equal(result.passed,true);
});

test('verification output is bounded and does not create actions or permissions',()=>{
 const result=buildMessinhoAnswerVerification({message:'Was sind 15 Prozent von 240?',reply:'15 Prozent von 240 sind 42. '.repeat(400)});
 assert.ok(result.findings.length<=5);
 assert.equal(Object.hasOwn(result,'actions'),false);
 assert.equal(Object.hasOwn(result,'permissions'),false);
});
