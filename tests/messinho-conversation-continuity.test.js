import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMessinhoConversationContinuityContext,MESSINHO_CONVERSATION_CONTINUITY_VERSION} from '../backend/messinho-conversation-continuity.js';

test('continuity context links a short follow-up to the immediately preceding exchange',()=>{
 const context=buildMessinhoConversationContinuityContext({message:'Und wie würdest du das lösen?',history:[
  {role:'user',text:'Ich glaube, wir müssen unsere Spielersuche verbessern.'},
  {role:'assistant',text:'Meinst du die Suchfilter oder die Bewertung?'}
 ]});
 assert.equal(context.version,MESSINHO_CONVERSATION_CONTINUITY_VERSION);
 assert.equal(context.relation,'follow_up');
 assert.equal(context.referential_expression_detected,true);
 assert.match(context.active_topic_candidate,/Spielersuche verbessern/);
 assert.equal(context.referent_candidates[1].authority,'assistant_hypothesis_or_question');
});

test('a correction carries context but does not promote the previous assistant interpretation to fact',()=>{
 const context=buildMessinhoConversationContinuityContext({message:'Nein, ich meinte nicht die Suchfilter, sondern die Bewertung.',history:[
  {role:'user',text:'Wir müssen die Spielersuche verbessern.'},
  {role:'assistant',text:'Dann ändern wir die Suchfilter.'}
 ]});
 assert.equal(context.relation,'correction');
 assert.equal(context.follow_up_likely,true);
 assert.match(context.resolution_policy,/correction invalidates/);
});

test('an explicit topic change drops old task context',()=>{
 const context=buildMessinhoConversationContinuityContext({message:'Unabhängig davon: Wie funktioniert die Einkommensteuer?',history:[
  {role:'user',text:'Suche einen schnellen Stürmer unter 21 Jahren.'},
  {role:'assistant',text:'Soll ich in Deutschland oder international suchen?'}
 ]});
 assert.equal(context.relation,'new_topic');
 assert.equal(context.active_topic_candidate,null);
 assert.deepEqual(context.referent_candidates,[]);
});

test('continuity context is bounded, role-safe and filters sensitive historical text',()=>{
 const history=Array.from({length:40},(_,i)=>({role:i%2?'assistant':'user',text:i===38?'Mein Passwort lautet Geheim123.':'Kontext Nachricht '+i}));
 const context=buildMessinhoConversationContinuityContext({message:'Und damit?',history});
 assert.equal(context.bounded,true);
 assert.ok(context.recent_user_topic_candidates.length<=3);
 assert.ok(context.referent_candidates.length<=2);
 assert.equal(JSON.stringify(context).includes('Geheim123'),false);
 assert.equal(JSON.stringify(context).includes('system'),false);
});

test('standalone messages do not inherit an earlier task merely because history exists',()=>{
 const context=buildMessinhoConversationContinuityContext({message:'Wie funktioniert Photosynthese?',history:[
  {role:'user',text:'Suche einen Flügelspieler.'},
  {role:'assistant',text:'Welche Liga?'}
 ]});
 assert.equal(context.relation,'standalone');
 assert.equal(context.referent_candidates.length,0);
});

test('continuity context reaches the cognitive model request as bounded context',async()=>{
 const {buildMessinhoCognitiveRouterMessages}=await import('../backend/messinho-conversational-intelligence.js');
 const context=buildMessinhoConversationContinuityContext({message:'Und wie würdest du das lösen?',history:[
  {role:'user',text:'Wir müssen die Spielerbewertung verbessern.'},
  {role:'assistant',text:'Meinst du die Datenbasis oder die Bewertungslogik?'}
 ]});
 const messages=buildMessinhoCognitiveRouterMessages({message:'Und wie würdest du das lösen?',conversationContinuityContext:context});
 const payload=JSON.parse(messages[1].content);
 assert.equal(payload.conversation_continuity_context.relation,'follow_up');
 assert.match(messages[0].content,/conversation_continuity_context/);
});

test('authenticated chat builds and forwards continuity context to both conversation turns',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
 assert.ok(source.includes("import { buildMessinhoConversationContinuityContext } from './messinho-conversation-continuity.js';"));
 assert.match(source,/buildMessinhoConversationContinuityContext\(\{message:interpretedMessage,history,dialogueState\}\)/);
 assert.match(source,/responseCompositionContext,\s*responseIntelligenceContext,\s*reasoningIntelligenceContext,\s*conversationContinuityContext,\s*userRole:profile\.role/);
});

test('ordinary German articles do not create false follow-up references',()=>{
 const context=buildMessinhoConversationContinuityContext({message:'Der Spieler hat eine starke Saison gespielt.',history:[
  {role:'user',text:'Wie funktioniert die Einkommensteuer?'},
  {role:'assistant',text:'Ich erkläre dir das gern.'}
 ]});
 assert.equal(context.relation,'standalone');
 assert.equal(context.referential_expression_detected,false);
});
