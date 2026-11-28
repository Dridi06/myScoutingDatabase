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
 assert.equal(getMessinhoSocialReply('Hallo, suche einen Innenverteidiger'),'Hallo, suche einen Innenverteidiger'.match(/$^/)?.[0]??null);
});

test('chat route handles social greetings before the cognitive router',async()=>{
 const server=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
 const greeting=server.indexOf('const socialReply=getMessinhoSocialReply(interpretedMessage,history);');
 const cognitive=server.indexOf('const cognitiveResult=await classifyMessinhoTurn({');
 assert.ok(greeting>=0);
 assert.ok(cognitive>greeting);
 assert.match(server.slice(greeting,cognitive),/return respond\(\{reply:socialReply,intent:'social_conversation'/);
});
