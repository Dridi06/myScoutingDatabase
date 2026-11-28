import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMessinhoClarificationContinuity} from '../backend/messinho-clarification-continuity.js';
import {buildMessinhoDialogueState} from '../backend/messinho-dialogue-engine.js';
import {buildMessinhoCognitiveRouterMessages} from '../backend/messinho-conversational-intelligence.js';
import {parseMessinhoScoutingRequest} from '../backend/messinho-validation.js';

const state=(status='likely_answer',extra={})=>({continuity:{
  clarification_reply:{status,question_kind:'location',matched_option:'Deutschland',evidence:[]},
  pending_question:{text:'Soll ich in Deutschland oder international suchen?',kind:'location',options:['Deutschland','international']},
  ...extra
}});
const history=[
  {role:'user',text:'Suche einen schnellen linken Flügelspieler unter 21 Jahren.'},
  {role:'assistant',text:'Soll ich in Deutschland oder international suchen?'}
];

test('carries the exact prior scouting goal and a unique option answer into parser context',()=>{
 const result=buildMessinhoClarificationContinuity({message:'Deutschland',history,dialogueState:state()});
 assert.equal(result.status,'likely_answer');
 assert.equal(result.task_goal,history[0].text);
 assert.match(result.effective_message,/linken Flügelspieler unter 21/);
 assert.match(result.effective_message,/Deutschland/);
 assert.equal(result.parser_history.length,1);
});

test('accumulates multiple clarification answers without losing earlier filters',()=>{
 const result=buildMessinhoClarificationContinuity({message:'Regionalliga',history:[
  ...history,{role:'user',text:'Deutschland'},
  {role:'assistant',text:'Welche Liga: Bundesliga oder Regionalliga?'}
 ],dialogueState:state('likely_answer',{pending_question:{text:'Welche Liga: Bundesliga oder Regionalliga?',kind:'target_level',options:['Bundesliga','Regionalliga']},clarification_reply:{status:'likely_answer',question_kind:'target_level',matched_option:'Regionalliga',evidence:[]}})});
 assert.match(result.effective_message,/linken Flügelspieler unter 21/);
 assert.match(result.effective_message,/Deutschland/);
 assert.match(result.effective_message,/Regionalliga/);
 assert.equal(result.applied_answers[0],'Deutschland');
});

test('does not carry a previous scouting goal into a new topic',()=>{
 const result=buildMessinhoClarificationContinuity({message:'Wie funktioniert das Steuersystem?',history,dialogueState:state('new_topic')});
 assert.equal(result.status,'new_topic');
 assert.equal(result.active,false);
 assert.equal(result.parser_history.length,0);
 assert.equal(result.effective_message,'Wie funktioniert das Steuersystem?');
});

test('blocks unlisted answers instead of inventing a filter',()=>{
 const result=buildMessinhoClarificationContinuity({message:'Europa',history,dialogueState:state('ambiguous')});
 assert.equal(result.action_blocked,true);
 assert.equal(result.status,'ambiguous');
 assert.equal(result.task_goal,null);
});

test('does not silently interpret yes/no against a negated question',()=>{
 const negated=[{role:'assistant',text:'Soll ich nicht in Deutschland suchen?'}];
 const result=buildMessinhoClarificationContinuity({message:'Ja',history:negated,dialogueState:state('likely_answer',{pending_question:{text:'Soll ich nicht in Deutschland suchen?',kind:'yes_no',options:[]},clarification_reply:{status:'likely_answer',question_kind:'yes_no',answer_shape:'confirmation',evidence:[]}})});
 assert.equal(result.status,'ambiguous');
 assert.equal(result.reason,'negated_confirmation_requires_clarification');
});

test('resolves a reply to the uniquely matching question when the assistant asked two questions',()=>{
 const multi=[{role:'user',text:'Suche einen Stürmer.'},{role:'assistant',text:'Welche Position bevorzugst du? In welchem Land soll ich suchen?'}];
 const result=buildMessinhoClarificationContinuity({message:'Deutschland',history:multi,dialogueState:state('likely_answer',{pending_question:{text:'In welchem Land soll ich suchen?',kind:'location',options:['Deutschland','international']}})});
 assert.equal(result.status,'likely_answer');
 assert.equal(result.question_kind,'location');
});

test('keeps Arabic and Tunisian Derja option answers grounded in offered choices',()=>{
 const arabic=[{role:'user',text:'نلوّج على مهاجم سريع.'},{role:'assistant',text:'تحب نلوّج في ألمانيا ولا تونس؟'}];
 const result=buildMessinhoClarificationContinuity({message:'تونس',history:arabic,dialogueState:state('likely_answer',{pending_question:{text:'تحب نلوّج في ألمانيا ولا تونس؟',kind:'location',options:['ألمانيا','تونس']},clarification_reply:{status:'likely_answer',question_kind:'location',matched_option:'تونس',evidence:[]}})});
 assert.equal(result.status,'likely_answer');
 assert.match(result.effective_message,/نلوّج على مهاجم سريع/);
 assert.match(result.effective_message,/تونس/);
});

test('does not combine context across unrelated user goals',()=>{
 const mixed=[
  {role:'user',text:'Suche einen Stürmer in Spanien.'},
  {role:'assistant',text:'Wie alt soll er sein?'},
  {role:'user',text:'Eigentlich habe ich eine Frage zur Steuer.'},
  {role:'assistant',text:'Möchtest du dazu eine allgemeine Erklärung?'}
 ];
 const result=buildMessinhoClarificationContinuity({message:'Ja',history:mixed,dialogueState:state('likely_answer',{pending_question:{text:'Möchtest du dazu eine allgemeine Erklärung?',kind:'yes_no',options:[]}})});
 assert.notEqual(result.task_goal,'Suche einen Stürmer in Spanien.');
});

test('router receives continuity as bounded dialogue evidence and route uses it for parsing',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
 assert.match(source,/buildMessinhoClarificationContinuity/);
 assert.ok(source.includes('dialogueState.continuity.clarification_continuity=clarificationContinuity;'));
 assert.match(source,/clarificationContinuity\.effective_message/);
 assert.match(source,/clarificationContinuity\.parser_history/);
});

test('segments comma and slash option lists and accepts only a grounded offered option',()=>{
 const history=[{role:'user',text:'Suche einen Mittelfeldspieler.'},{role:'assistant',text:'Welche Position: links, zentral / rechts?'}];
 const result=buildMessinhoClarificationContinuity({message:'zentral',history,dialogueState:state('likely_answer',{pending_question:{text:'Welche Position: links, zentral / rechts?',kind:'position',options:['links','zentral','rechts']},clarification_reply:{status:'likely_answer',question_kind:'position',matched_option:'zentral',evidence:[]}})});
 assert.equal(result.status,'likely_answer');
 assert.equal(result.matched_option,'zentral');
});test('scoped chat history is isolated by both owner and conversation identifiers',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
 const historyStart=source.indexOf('const {data:storedHistory,error:historyError}=await db.from(\'messinho_conversation_messages\')');
 const historyQuery=source.slice(historyStart,historyStart+500);
 assert.match(historyQuery,/\.eq\('owner_id',ownerId\)/);
 assert.match(historyQuery,/\.eq\('conversation_id',conversationId\)/);
});

test('end-to-end: dialogue reply reaches cognitive router and preserves scouting filters in parser',()=>{
 const history=[
  {role:'user',text:'Suche 3 U21 Flügelspieler in Deutschland.'},
  {role:'assistant',text:'Welche Liga bevorzugst du: Bundesliga oder Regionalliga?'}
 ];
 const dialogueState=buildMessinhoDialogueState({message:'Regionalliga',history,userRole:'scout',linguisticContext:{response_language:'de'}});
 assert.equal(dialogueState.continuity.clarification_reply.status,'likely_answer');
 const continuity=buildMessinhoClarificationContinuity({message:'Regionalliga',history,dialogueState});
 assert.equal(continuity.status,'likely_answer');
 dialogueState.continuity.clarification_continuity=continuity;
 const routerMessages=buildMessinhoCognitiveRouterMessages({
  message:'Regionalliga',history,memory:{},userRole:'scout',linguisticContext:{dialogue_state:dialogueState}
 });
 const routerPayload=JSON.parse(routerMessages[1].content);
 assert.equal(routerPayload.linguistic_context.dialogue_state.continuity.clarification_continuity.task_goal,history[0].text);
 const parsed=parseMessinhoScoutingRequest(continuity.effective_message,continuity.parser_history);
 assert.equal(parsed.shouldHandle,true);
 assert.deepEqual(parsed.missing,[]);
 assert.equal(parsed.request.quantity,3);
 assert.equal(parsed.request.ageGroup,'U21');
 assert.equal(parsed.request.region,'deutschland');
 assert.equal(parsed.request.targetLevel,'Regionalliga');
 assert.match(parsed.request.position,/Flügelspieler/i);
});

test('end-to-end: a new topic reaches the router without the previous scouting filters',()=>{
 const history=[
  {role:'user',text:'Suche 3 U21 Flügelspieler in Deutschland.'},
  {role:'assistant',text:'Welche Liga bevorzugst du: Bundesliga oder Regionalliga?'}
 ];
 const message='Wie funktioniert das Steuersystem?';
 const dialogueState=buildMessinhoDialogueState({message,history,userRole:'scout'});
 const continuity=buildMessinhoClarificationContinuity({message,history,dialogueState});
 assert.equal(continuity.status,'new_topic');
 assert.equal(continuity.effective_message,message);
 assert.deepEqual(continuity.parser_history,[]);
 const parsed=parseMessinhoScoutingRequest(continuity.effective_message,continuity.parser_history);
 assert.equal(parsed.shouldHandle,false);
 assert.equal(parsed.request.region,'');
 assert.equal(parsed.request.targetLevel,'');
});
