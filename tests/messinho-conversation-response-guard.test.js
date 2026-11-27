import test from 'node:test';
import assert from 'node:assert/strict';
import {guardMessinhoConversationReply} from '../backend/messinho-conversation-response-guard.js';

test('accepts a normal explanatory conversational reply',()=>{
  const result=guardMessinhoConversationReply({intent:'conversation',reply:'Ich kann dir erklären, wie die Engine arbeitet.'});
  assert.equal(result.ok,true);
  assert.equal(result.reply,'Ich kann dir erklären, wie die Engine arbeitet.');
});

test('blocks unverified first-person system mutation claims in German and English',()=>{
  for(const reply of [
    'Ich habe die Änderung bereits deployed und gespeichert.',
    'I have created the ticket and updated the system.'
  ]){
    const result=guardMessinhoConversationReply({intent:'conversation',reply});
    assert.equal(result.ok,false);
    assert.equal(result.code,'unverified_action_claim');
  }
});

test('does not block an explicit statement that an action was not completed',()=>{
  const result=guardMessinhoConversationReply({intent:'conversation',reply:'Ich habe die Änderung noch nicht deployed.'});
  assert.equal(result.ok,true);
  const spanishNegative=guardMessinhoConversationReply({intent:'conversation',reply:'No he creado el ticket.'});
  assert.equal(spanishNegative.ok,true);
});

test('blocks unverified mutation claims in French and Spanish',()=>{
  const french=guardMessinhoConversationReply({intent:'conversation',reply:"J'ai créé le ticket et déployé la modification."});
  const spanish=guardMessinhoConversationReply({intent:'conversation',reply:'He creado el ticket y actualizado el sistema.'});
  assert.equal(french.code,'unverified_action_claim');
  assert.equal(spanish.code,'unverified_action_claim');
});

test('returns a safe fallback for missing replies and rejects other intents',()=>{
  assert.equal(guardMessinhoConversationReply({intent:'conversation',reply:'   '}).code,'empty_reply');
  assert.equal(guardMessinhoConversationReply({intent:'scouting',reply:'ok'}).code,'wrong_intent');
});

test('server applies the response guard only to ordinary conversation replies',async()=>{
  const {readFile}=await import('node:fs/promises');
  const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
  assert.match(source,/const guardedReply=guardMessinhoConversationReply\(cognitive\)/);
  assert.match(source,/intent:'conversation',items:\[\],pending:guardedReply\.code==='empty_reply'/);
});
