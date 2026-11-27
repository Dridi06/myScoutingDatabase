import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMessinhoDialogueState,validateMessinhoDialogueState,MESSINHO_DIALOGUE_ENGINE_VERSION} from '../backend/messinho-dialogue-engine.js';

test('dialogue engine detects a likely short follow-up and preserves prior goal as a candidate',()=>{
  const state=buildMessinhoDialogueState({message:'Und wie schnell ist er?',history:[
    {role:'user',text:'Finde einen linken Flügelspieler unter 21 Jahren.'},
    {role:'assistant',text:'Ich kann dir passende Kandidaten suchen.'}
  ],userRole:'admin',linguisticContext:{response_language:'de'}});
  assert.equal(state.continuity.follow_up_likely,true);
  assert.equal(state.continuity.prior_user_goal_candidate,'Finde einen linken Flügelspieler unter 21 Jahren.');
  assert.equal(state.response_language_hint,'de');
  assert.equal(state.user_role,'admin');
});

test('dialogue engine marks an unanswered assistant question without claiming to resolve it',()=>{
  const state=buildMessinhoDialogueState({message:'International, bevorzugt Europa.',history:[
    {role:'user',text:'Suche einen schnellen Flügelspieler.'},
    {role:'assistant',text:'Soll ich in Deutschland oder international suchen?'}
  ]});
  assert.equal(state.continuity.assistant_awaiting_answer,true);
  assert.match(state.continuity.pending_assistant_question,/Deutschland oder international/);
  assert.equal(state.continuity.referent_resolution,'not_performed');
});

test('dialogue engine does not mark a full new request as a follow-up by default',()=>{
  const state=buildMessinhoDialogueState({message:'Analysiere bitte die Leistungsdaten von Karim Benzema in der letzten Saison.',history:[
    {role:'assistant',text:'Gerne. Was möchtest du wissen?'}
  ]});
  assert.equal(state.continuity.follow_up_likely,false);
});

test('dialogue engine bounds history, focus, text and role values',()=>{
  const history=Array.from({length:30},(_,i)=>({role:i%2?'assistant':'user',text:'Nachricht '+i}));
  const state=buildMessinhoDialogueState({message:'weiter',history,userRole:'superadmin'});
  assert.equal(state.turn_number,13);
  assert.equal(state.recent_user_focus.length,4);
  assert.equal(state.user_role,'scout');
  assert.equal(state.continuity.follow_up_likely,true);
  assert.equal(validateMessinhoDialogueState(state),true);
});

test('dialogue state validator rejects forged or malformed snapshots',()=>{
  assert.equal(validateMessinhoDialogueState(null),false);
  assert.equal(validateMessinhoDialogueState({version:MESSINHO_DIALOGUE_ENGINE_VERSION,turn_number:0}),false);
  const state=buildMessinhoDialogueState({message:'Hallo'});
  assert.equal(validateMessinhoDialogueState(state),true);
  assert.equal(validateMessinhoDialogueState({...state,evidence_policy:'permissions granted'}),false);
});

test('server attaches dialogue state to cognitive routing without changing owner-scoped history loading',async()=>{
  const {readFile}=await import('node:fs/promises');
  const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
  assert.match(source,/buildMessinhoDialogueState\(\{message,history,userRole:profile\.role,linguisticContext\}\)/);
  assert.match(source,/linguisticContext:\{\.\.\.linguisticContext,dialogue_state:dialogueState\}/);
  assert.match(source,/\.eq\('owner_id',ownerId\)/);
});
