import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMessinhoIntentEvidence,MESSINHO_INTENT_INTELLIGENCE_VERSION} from '../backend/messinho-intent-intelligence.js';

test('recognizes explicit memory save and recall requests in German and English',()=>{
  const save=buildMessinhoIntentEvidence({message:'Merk dir bitte diese Entscheidung.'});
  assert.equal(save.suggested_intent,'memory_save');
  const recall=buildMessinhoIntentEvidence({message:'What do you remember about me?'});
  assert.equal(recall.suggested_intent,'memory_recall');
});

test('distinguishes scouting actions from ordinary football conversation',()=>{
  const search=buildMessinhoIntentEvidence({message:'Suche einen schnellen linken Flügelspieler.'});
  assert.equal(search.suggested_intent,'scouting');
  assert.ok(search.domains.includes('football'));
  const talk=buildMessinhoIntentEvidence({message:'Der Spieler war heute wirklich stark.'});
  assert.equal(talk.suggested_intent,'conversation');
  assert.equal(talk.candidates.length,0);
});

test('recognizes explicit engineering requests but role metadata never grants permission',()=>{
  const scout=buildMessinhoIntentEvidence({message:'Implementiere den Fehlerfix in MESSINHO.',userRole:'scout'});
  assert.equal(scout.suggested_intent,'engineering');
  assert.match(scout.role_note,/does not grant/i);
  assert.equal(Object.hasOwn(scout,'permission'),false);
  const admin=buildMessinhoIntentEvidence({message:'Deploy the staging fix.',userRole:'admin'});
  assert.equal(admin.user_role,'admin');
  assert.match(admin.role_note,/authorization remains authoritative/i);
});

test('keeps mixed intent candidates unresolved rather than selecting one',()=>{
  const result=buildMessinhoIntentEvidence({message:'Speichere das und recherchiere die aktuellen Quellen.'});
  assert.equal(result.status,'conflicting_candidates');
  assert.equal(result.suggested_intent,null);
  assert.equal(result.conflict,true);
});

test('does not turn a pending ambiguous clarification into an action route',()=>{
  const result=buildMessinhoIntentEvidence({
    message:'Der andere.',
    clarificationContinuity:{status:'ambiguous'}
  });
  assert.equal(result.status,'clarification_pending');
  assert.equal(result.suggested_intent,null);
  assert.equal(result.clarification_pending,true);
});

test('supports multilingual explicit research cues and stays bounded',()=>{
  const result=buildMessinhoIntentEvidence({message:'Recherchiere bitte aktuelle wissenschaftliche Daten zur Physik.'});
  assert.equal(result.suggested_intent,'general_research');
  assert.ok(result.domains.includes('science'));
  assert.equal(result.version,MESSINHO_INTENT_INTELLIGENCE_VERSION);
  const huge=buildMessinhoIntentEvidence({message:'search '.repeat(10000)});
  assert.ok(huge.candidates.length<=12);
  assert.ok(huge.cues.length<=12);
});

test('ordinary maths questions remain conversation rather than forced external research',()=>{
  const result=buildMessinhoIntentEvidence({message:'Wie berechne ich 15 Prozent von 240?'});
  assert.equal(result.suggested_intent,'conversation');
  assert.equal(result.action_like,false);
  assert.equal(result.question_like,true);
});

test('intent evidence includes continuity hints without promoting them to facts',()=>{
  const result=buildMessinhoIntentEvidence({
    message:'Und was ist mit dem anderen?',
    dialogueState:{continuity:{follow_up_likely:true}}
  });
  assert.ok(result.cues.includes('possible_follow_up'));
  assert.equal(result.suggested_intent,'conversation');
  assert.match(result.policy,/never authorizes or executes/i);
});
