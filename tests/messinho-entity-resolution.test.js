import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveMessinhoEntityReferences} from '../backend/messinho-entity-resolution.js';
import {sanitizeMessinhoHistory} from '../backend/messinho-engine.js';

const onePlayer=[{role:'assistant',text:'Spielerprofil',researchContext:{
  player:{player_id:42,name:'Karim Benzema',current_club:'Al-Ittihad'},
  profile:{corrected_name:'Karim Benzema'}
}}];

test('resolves a player pronoun only when one grounded player is available',()=>{
  const result=resolveMessinhoEntityReferences({message:'Wie alt ist er?',history:onePlayer});
  assert.equal(result.status,'resolved');
  assert.equal(result.entity.entity_type,'player');
  assert.equal(result.entity.id,'42');
  assert.equal(result.entity.name,'Karim Benzema');
  assert.equal(result.confidence,0.94);
});

test('does not guess when two players are plausible referents',()=>{
  const history=[...onePlayer,{role:'assistant',text:'Zweites Profil',researchContext:{
    player:{player_id:7,name:'Kylian Mbappé'}
  }}];
  const result=resolveMessinhoEntityReferences({message:'Wie schnell ist er?',history});
  assert.equal(result.status,'ambiguous');
  assert.equal(result.candidates.length,2);
  assert.equal(result.entity,null);
});

test('resolves a player club relation only from structured research metadata',()=>{
  const result=resolveMessinhoEntityReferences({message:'Wie stark ist sein Verein?',history:onePlayer});
  assert.equal(result.status,'resolved');
  assert.equal(result.entity.entity_type,'club');
  assert.equal(result.entity.name,'Al-Ittihad');
  assert.ok(result.evidence.includes('player_current_club_relation'));
});

test('resolves an explicit name only against entities already present in context',()=>{
  const result=resolveMessinhoEntityReferences({message:'Vergleiche Karim Benzema bitte.',history:onePlayer});
  assert.equal(result.status,'resolved');
  assert.equal(result.entity.name,'Karim Benzema');
  const unknown=resolveMessinhoEntityReferences({message:'Vergleiche Lionel Messi bitte.',history:onePlayer});
  assert.equal(unknown.status,'not_applicable');
});

test('explicitly named comparison targets do not create a false pronoun ambiguity',()=>{
  const history=[...onePlayer,{role:'assistant',researchContext:{player:{player_id:7,name:'Kylian Mbappé'}}}];
  const result=resolveMessinhoEntityReferences({message:'Vergleiche Karim Benzema mit Kylian Mbappé.',history});
  assert.equal(result.status,'not_applicable');
  const named=resolveMessinhoEntityReferences({message:'Der Spieler Karim Benzema interessiert mich.',history:onePlayer});
  assert.equal(named.status,'resolved');
  assert.equal(named.entity.name,'Karim Benzema');
});

test('the other player is resolved only when there is one active player and exactly one alternative',()=>{
  const result=resolveMessinhoEntityReferences({
    message:'Und was ist mit dem anderen Spieler?',
    history:[{role:'assistant',researchContext:{player:{player_id:7,name:'Kylian Mbappé'}}}],
    activeEntities:{player_id:42,player_name:'Karim Benzema'}
  });
  assert.equal(result.status,'resolved');
  assert.equal(result.entity.name,'Kylian Mbappé');
  assert.equal(result.reason,'other_player_relative_to_active_entity');
});

test('ambiguous contrast and generic references remain unresolved or ambiguous',()=>{
  const history=[...onePlayer,{role:'assistant',researchContext:{player:{player_id:7,name:'Kylian Mbappé'}}}];
  assert.equal(resolveMessinhoEntityReferences({message:'Und der andere?',history}).status,'ambiguous');
  assert.equal(resolveMessinhoEntityReferences({message:'Und das von vorhin?',history}).status,'ambiguous');
  assert.equal(resolveMessinhoEntityReferences({message:'Wie ist er?',history:[]}).status,'unresolved');
});

test('supports common English, French, Spanish, MSA and Derja person references',()=>{
  for(const message of ['How old is he?','Quel âge a-t-il?','¿Qué edad tiene él?','كم عمره؟','قداش عمرو؟']){
    const result=resolveMessinhoEntityReferences({message,history:onePlayer});
    assert.equal(result.status,'resolved',message);
    assert.equal(result.entity.name,'Karim Benzema',message);
  }
});

test('keeps entity resolution bounded and never treats it as permission',()=>{
  const history=Array.from({length:40},(_,i)=>({role:'assistant',researchContext:{player:{player_id:i+1,name:'Player '+i}}}));
  const result=resolveMessinhoEntityReferences({message:'Wie alt ist er?',history});
  assert.ok(result.candidates.length<=5);
  assert.equal(Object.hasOwn(result,'permission'),false);
  assert.equal(Object.hasOwn(result,'action'),false);
});

test('history sanitizer preserves only bounded structured player and club references',()=>{
  const safe=sanitizeMessinhoHistory([{role:'assistant',text:'Profil',researchContext:{
    player:{player_id:42,name:'Karim Benzema',current_club:'Al-Ittihad',private_note:'must not persist'},
    entities:[{entity_type:'team',id:'team-1',name:'Real Madrid',secret:'must not persist'}]
  }}]);
  assert.equal(safe[0].researchContext.player.player_id,42);
  assert.equal(safe[0].researchContext.player.current_club,'Al-Ittihad');
  assert.equal(safe[0].researchContext.player.private_note,undefined);
  assert.equal(safe[0].researchContext.entities[0].name,'Real Madrid');
  assert.equal(safe[0].researchContext.entities[0].secret,undefined);
});

test('server attaches grounded resolution to the existing owner-scoped dialogue context',async()=>{
  const {readFile}=await import('node:fs/promises');
  const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
  assert.match(source,/resolveMessinhoEntityReferences/);
  assert.match(source,/dialogueState\.entity_resolution=entityResolution/);
  assert.match(source,/\.eq\('owner_id',ownerId\)/);
  assert.match(source,/\.eq\('conversation_id',conversationId\)/);
});
