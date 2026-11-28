import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyMessinhoSocialIntent} from '../backend/messinho-conversation.js';
import {readFile} from 'node:fs/promises';

test('plain German greetings are recognized as social conversation',()=>{
 assert.equal(classifyMessinhoSocialIntent('Hallo'),'greeting');
 assert.equal(classifyMessinhoSocialIntent('Guten Morgen'),'greeting');
 assert.equal(classifyMessinhoSocialIntent('Hi!'),'greeting');
});

test('simple social greetings bypass provider routing while admin authorization remains first',async()=>{
 const server=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
 const authorization=server.indexOf("if(profile.role==='scout'&&isMessinhoAdminOnlyCommand(interpretedMessage))");
 const social=server.indexOf('const socialReply=getMessinhoSocialReply(interpretedMessage,history,new Date())');
 const semantic=server.indexOf('const cognitiveResult=await classifyMessinhoTurn');
 assert.ok(authorization>=0);
 assert.ok(social>authorization);
 assert.ok(semantic>social);
 assert.match(server.slice(social,semantic),/actions_dispatched:false/);
});
