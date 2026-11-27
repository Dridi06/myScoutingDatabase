import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  detectExplicitMessinhoRememberRequest,
  isMessinhoMemoryRecallRequest,
  appendMessinhoUserNote,
  getMessinhoUserNotes
} from '../backend/messinho-user-memory.js';

test('recognizes explicit German and English remember commands without treating ordinary text as a command',()=>{
  assert.equal(detectExplicitMessinhoRememberRequest('Merke dir Staging Alpha'),'Staging Alpha');
  assert.equal(detectExplicitMessinhoRememberRequest('Bitte merke dir: Testwort 42'),'Testwort 42');
  assert.equal(detectExplicitMessinhoRememberRequest('Remember staging alpha'),'staging alpha');
  assert.equal(detectExplicitMessinhoRememberRequest('Staging Alpha'),'Staging Alpha');
  assert.equal(detectExplicitMessinhoRememberRequest('Was bedeutet merken?'),null);
});

test('recognizes memory recall questions',()=>{
  assert.equal(isMessinhoMemoryRecallRequest('Welches Testwort habe ich dir genannt?'),true);
  assert.equal(isMessinhoMemoryRecallRequest('Was hast du dir gemerkt?'),true);
  assert.equal(isMessinhoMemoryRecallRequest('What did I ask you to remember?'),true);
  assert.equal(isMessinhoMemoryRecallRequest('Suche Spieler Staging Alpha'),false);
});

test('stores bounded private notes in existing owner-scoped user preferences and de-duplicates',()=>{
  let preferences={favorite_position:'ST'};
  preferences=appendMessinhoUserNote(preferences,'Staging Alpha','2026-11-27T18:00:00.000Z');
  preferences=appendMessinhoUserNote(preferences,'staging alpha','2026-11-27T18:01:00.000Z');
  assert.equal(preferences.favorite_position,'ST');
  assert.equal(getMessinhoUserNotes(preferences).length,1);
  assert.equal(getMessinhoUserNotes(preferences)[0].text,'staging alpha');
  for(let i=0;i<25;i++)preferences=appendMessinhoUserNote(preferences,'Notiz '+i,'2026-11-27T18:02:00.000Z');
  assert.equal(getMessinhoUserNotes(preferences).length,20);
});

test('authenticated chat handles remember and recall before scouting parser and player research',async()=>{
  const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
  const saveRoute=source.indexOf('const rememberNote=detectExplicitMessinhoRememberRequest(interpretedMessage)');
  const scoutingRoute=source.indexOf('const dialog=parseMessinhoScoutingRequest(interpretedMessage,history)');
  const researchRoute=source.indexOf('researchMessinhoPlayerProfile(term)');
  assert.ok(saveRoute>0&&saveRoute<scoutingRoute,'memory commands must be resolved before scouting intent');
  assert.ok(saveRoute<researchRoute,'memory commands must be resolved before external player research');
  assert.match(source,/saveMessinhoAgentMemory\(ownerId,\{\.\.\.agentMemory,user_preferences:nextPreferences\}\)/);
  assert.match(source,/intent:'user_memory_recalled'/);
  assert.match(source,/intent:'user_memory_saved'/);
});
