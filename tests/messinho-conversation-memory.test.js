import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMessinhoConversationMemory, formatMessinhoConversationMemory } from '../backend/messinho-conversation-memory.js';
test('conversation memory is bounded and scoped to one owner conversation',()=>{const history=Array.from({length:60},(_,i)=>({role:i%2?'assistant':'user',text:`Message number ${i}`}));const m=buildMessinhoConversationMemory({history,conversationId:'conversation-alpha'});assert.equal(m.scope,'owner_conversation');assert.equal(m.conversation_id,'conversation-alpha');assert.equal(m.message_count,40);assert.ok(m.items.length<=8);assert.ok(m.items.reduce((n,x)=>n+x.text.length,0)<=1600);assert.equal(m.persisted_summary,false);});
test('conversation memory filters sensitive text and duplicates',()=>{const m=buildMessinhoConversationMemory({history:[{role:'user',text:'Wir arbeiten am Projekt Alpha.'},{role:'assistant',text:'Wir arbeiten am Projekt Alpha.'},{role:'user',text:'Mein Passwort lautet Geheim123.'},{role:'user',text:'Der nächste Schritt ist die Testphase.'}]});assert.equal(m.items.length,2);assert.equal(m.items.some(x=>x.text.includes('Geheim123')),false);});
test('formatter returns only compact context fields',()=>{const m=buildMessinhoConversationMemory({history:[{role:'user',text:'Bitte vergleiche die zwei Spieler.'}]});assert.deepEqual(Object.keys(formatMessinhoConversationMemory(m)).sort(),['items','message_count','scope','source']);assert.equal(formatMessinhoConversationMemory({items:[]}),null);});

test('conversation memory keeps the newest distinct turns and preserves their chronological order',()=>{
 const m=buildMessinhoConversationMemory({history:[
  {role:'user',text:'Ältere Aufgabe eins.'},
  {role:'assistant',text:'Ältere Antwort eins.'},
  {role:'user',text:'Ältere Aufgabe zwei.'},
  ...Array.from({length:12},(_,i)=>({role:i%2?'assistant':'user',text:'Aktueller Gesprächsschritt '+i}))
 ]});
 assert.equal(m.items.length,8);
 assert.equal(m.items[0].text,'Aktueller Gesprächsschritt 4');
 assert.equal(m.items.at(-1).text,'Aktueller Gesprächsschritt 11');
});


test('active frame retains the latest user goal across more than 20 turns without promoting assistant suggestions', () => {
  const history = [
    { role: 'user', text: 'Wir wollen die Spielerbewertung für U19-Talente verbessern.' },
    { role: 'assistant', text: 'Vielleicht könnten wir auch Marktwerte stärker gewichten.' },
    ...Array.from({ length: 24 }, (_, index) => ({
      role: index % 2 ? 'assistant' : 'user',
      text: index % 2 ? 'Vielleicht könnten wir auch Marktwerte stärker gewichten.' : 'Ja, genau.'
    }))
  ];
  const memory = buildMessinhoConversationMemory({ history, currentMessage: 'Und wie setzen wir das um?' });
  assert.match(memory.active_frame.active_topic_candidate, /Und wie setzen wir das um/);
  assert.equal(memory.active_frame.active_goal_authority, 'user_message_candidate_not_verified_fact');
  assert.deepEqual(memory.active_frame.confirmed_user_constraints, []);
  assert.equal(memory.active_frame.persistence, 'derived_per_request_not_persisted');
  assert.ok(memory.active_frame.turn_window <= 60);
  assert.doesNotMatch(JSON.stringify(memory.active_frame), /Marktwerte stärker gewichten/);
});

test('explicit topic switch resets prior task context and starts a new frame', () => {
  const memory = buildMessinhoConversationMemory({
    history: [
      { role: 'user', text: 'Suche einen schnellen Stürmer unter 21 Jahren.' },
      { role: 'assistant', text: 'Welche Liga soll ich prüfen?' }
    ],
    currentMessage: 'Unabhängig davon: Erkläre mir bitte die Mehrwertsteuer.'
  });
  assert.equal(memory.active_frame.relation, 'new_topic');
  assert.match(memory.active_frame.active_topic_candidate, /Mehrwertsteuer/);
  assert.doesNotMatch(memory.active_frame.active_topic_candidate, /Stürmer|21 Jahre/);
  assert.equal(memory.active_frame.pending_question, null);
});

test('correction becomes the active user candidate and supersedes the earlier interpretation', () => {
  const memory = buildMessinhoConversationMemory({
    history: [
      { role: 'user', text: 'Wir müssen die Spielersuche verbessern.' },
      { role: 'assistant', text: 'Dann ändern wir die Suchfilter.' }
    ],
    currentMessage: 'Nein, ich meinte nicht die Suchfilter, sondern die Bewertung.'
  });
  assert.equal(memory.active_frame.relation, 'correction');
  assert.match(memory.active_frame.active_topic_candidate, /Bewertung/);
  assert.doesNotMatch(memory.active_frame.active_topic_candidate, /Suchfilter/);
});

test('pending clarification is represented as awaiting, candidate answer, or ambiguous without silently resolving it', () => {
  const base = {
    history: [
      { role: 'user', text: 'Suche einen Spieler.' },
      { role: 'assistant', text: 'Welche Liga möchtest du?' }
    ],
    currentMessage: 'Regionalliga',
    dialogueState: {
      continuity: {
        pending_question: { status: 'awaiting_answer', text: 'Welche Liga möchtest du?', kind: 'target_level', options: ['Bundesliga', 'Regionalliga'] },
        clarification_reply: { status: 'likely_answer' }
      }
    }
  };
  const answered = buildMessinhoConversationMemory(base).active_frame.pending_question;
  assert.equal(answered.status, 'answer_candidate_received');
  assert.equal(answered.answer_requires_semantic_confirmation, true);
  const ambiguous = buildMessinhoConversationMemory({
    ...base,
    dialogueState: { continuity: { ...base.dialogueState.continuity, clarification_reply: { status: 'ambiguous' } } }
  }).active_frame.pending_question;
  assert.equal(ambiguous.status, 'needs_clarification');
});

test('sensitive historical content is excluded from active frame and formatted memory', () => {
  const memory = buildMessinhoConversationMemory({
    history: [
      { role: 'user', text: 'Mein Passwort lautet Geheim123.' },
      { role: 'user', text: 'Wir planen die nächste Spielersuche.' }
    ],
    currentMessage: 'Und weiter?'
  });
  assert.doesNotMatch(JSON.stringify(memory), /Geheim123/);
  assert.equal(formatMessinhoConversationMemory(memory).active_frame.active_topic_candidate, 'Wir planen die nächste Spielersuche.');
});
