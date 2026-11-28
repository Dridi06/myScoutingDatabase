import test from 'node:test';
import assert from 'node:assert/strict';
import {getMessinhoSocialReply,classifyMessinhoSocialIntent} from '../backend/messinho-conversation.js';
import {readFile} from 'node:fs/promises';

test('plain German greetings are recognized as social conversation',()=>{
 assert.equal(classifyMessinhoSocialIntent('Hallo'),'greeting');
 assert.equal(classifyMessinhoSocialIntent('Guten Morgen'),'greeting');
 assert.equal(classifyMessinhoSocialIntent('Hi!'),'greeting');
});

test('MESSINHO returns a natural greeting without an AI provider call',()=>{
 const reply=getMessinhoSocialReply('Hallo',[]);
 assert.equal(typeof reply,'string');
 assert.ok(reply.length>0);
 assert.match(reply,/Moin|Servus|Hey|Grüß dich/);
});

test('scouting requests are not intercepted by the greeting handler',()=>{
 assert.equal(getMessinhoSocialReply('Hallo, suche einen Innenverteidiger'),null);
});

test('natural conversation engine is the safe fallback when semantic routing fails',async()=>{
 const server=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
 const failure=server.indexOf("if(cognitiveResult.status!=='completed'||!cognitiveResult.decision){");
 const fallback=server.indexOf('const conversationalFallback=await generateMessinhoNaturalConversationReply({',failure);
 const blocked=server.indexOf("intent:'conversation_provider_unavailable'",fallback);
 assert.ok(failure>=0);
 assert.ok(fallback>failure);
 assert.ok(blocked>fallback);
 assert.match(server.slice(failure,blocked),/actions_dispatched:false/);
 assert.doesNotMatch(server,/getMessinhoSocialReply\(interpretedMessage/);
});
