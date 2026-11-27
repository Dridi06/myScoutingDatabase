import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMessinhoCognitiveRouterMessages,
  validateMessinhoCognitiveDecision,
  appendMessinhoLongTermMemories,
  classifyMessinhoTurn
} from '../backend/messinho-conversational-intelligence.js';

test('router prompt prioritizes meaning, context and natural language over fixed commands',()=>{
  const messages=buildMessinhoCognitiveRouterMessages({
    message:'Merk die Staging Alpha',
    history:[{role:'assistant',text:'Wir testen gerade dein persönliches Gedächtnis.'}],
    memory:{long_term_memory:[{text:'Arbeitet am myScoutingDatabase Projekt',category:'project'}]}
  });
  assert.match(messages[0].content,/spelling mistakes, speech-to-text errors, autocorrect/i);
  assert.match(messages[0].content,/meaning, not exact keywords/i);
  assert.match(messages[1].content,/Wir testen gerade/);
  assert.match(messages[1].content,/myScoutingDatabase/);
});

test('decision validation rejects unknown intents, low confidence and sensitive/unsupported categories',()=>{
  assert.equal(validateMessinhoCognitiveDecision({intent:'player_guess',confidence:1}),null);
  assert.equal(validateMessinhoCognitiveDecision({intent:'clarify',confidence:2}),null);
  const decision=validateMessinhoCognitiveDecision({
    intent:'memory_save',confidence:0.94,reply:'Gespeichert',clarification_question:'',
    memory_items:[
      {text:'Bevorzugt klare Antworten',category:'preference',confidence:0.95},
      {text:'Religiöse Zugehörigkeit',category:'religion',confidence:1}
    ]
  });
  assert.equal(decision.memory_items.length,1);
  assert.equal(decision.memory_items[0].category,'preference');
});

test('sensitive personal information and secrets are rejected from long-term memory',()=>{
  assert.equal(isSensitiveMessinhoMemoryText('Ich bin Muslim'),true);
  assert.equal(isSensitiveMessinhoMemoryText('Mein API key ist geheim'),true);
  assert.equal(isSensitiveMessinhoMemoryText('Ich bevorzuge kurze Antworten'),false);
  const prefs=appendMessinhoLongTermMemories({},[
    {text:'Ich bin Muslim',category:'stable_fact',confidence:0.99},
    {text:'Ich bevorzuge kurze Antworten',category:'preference',confidence:0.95}
  ]);
  assert.equal(prefs.long_term_memory.length,1);
  assert.equal(prefs.long_term_memory[0].text,'Ich bevorzuge kurze Antworten');
});

test('long-term memory merges, deduplicates, bounds length and preserves existing preferences',()=>{
  let prefs={favorite_position:'ST'};
  prefs=appendMessinhoLongTermMemories(prefs,[
    {text:'Projekt myScoutingDatabase',category:'project',confidence:0.95},
    {text:'Projekt myScoutingDatabase!',category:'project',confidence:0.91}
  ],'2026-11-27T18:00:00.000Z');
  assert.equal(prefs.favorite_position,'ST');
  assert.equal(prefs.long_term_memory.length,1);
  for(let i=0;i<60;i++)prefs=appendMessinhoLongTermMemories(prefs,[{text:'Projekt '+i,category:'project',confidence:0.9}]);
  assert.equal(prefs.long_term_memory.length,50);
});

test('semantic router parses structured model decisions and fails closed on malformed output',async()=>{
  const fetchImpl=async(_url,options)=>{
    const body=JSON.parse(options.body);
    assert.equal(body.response_format.json_schema.strict,true);
    return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({
      intent:'clarify',confidence:0.93,reply:'Meinst du, dass ich mir das merken soll?',
      clarification_question:'Meinst du, dass ich mir das merken soll?',memory_items:[]
    })}}]})};
  };
  const result=await classifyMessinhoTurn({message:'Merk die Staging Alpha',apiKey:'test',fetchImpl});
  assert.equal(result.status,'completed');
  assert.equal(result.decision.intent,'clarify');
  const malformed=await classifyMessinhoTurn({message:'x',apiKey:'test',fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:'not json'}}]})})});
  assert.equal(malformed.status,'error');
  assert.equal(malformed.decision,null);
});

test('semantic router recognizes a memory-save decision without depending on a fixed phrase',async()=>{
  const fetchImpl=async(_url,options)=>{
    const body=JSON.parse(options.body);
    const input=JSON.parse(body.messages[1].content);
    assert.equal(input.current_message,'Merk die Staging Alpha');
    assert.equal(input.user_role,'admin');
    assert.ok(input.linguistic_context);
    return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({
      intent:'memory_save',confidence:0.91,reply:'Ich halte das für dich fest.',
      clarification_question:'',memory_items:[{text:'Staging Alpha',category:'project',confidence:0.92}]
    })}}]})};
  };
  const result=await classifyMessinhoTurn({
    message:'Merk die Staging Alpha',history:[],memory:{},linguisticContext:{response_language:'de'},
    userRole:'admin',apiKey:'test',fetchImpl
  });
  assert.equal(result.decision.intent,'memory_save');
  assert.equal(result.decision.memory_items[0].text,'Staging Alpha');
});

test('server applies semantic cognitive routing before fixed scouting and external research branches',async()=>{
  const {readFile}=await import('node:fs/promises');
  const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
  const route=source.indexOf('const cognitiveResult=await classifyMessinhoTurn');
  const scouting=source.indexOf('const dialog=parseMessinhoScoutingRequest(interpretedMessage,history)',route);
  const research=source.indexOf('if(isMessinhoGeneralResearchQuestion(interpretedMessage))',route);
  assert.ok(route>0&&scouting>route,'semantic routing must precede scouting parsing');
  assert.ok(research>route,'semantic routing must precede external research');
  assert.match(source,/if\(cognitive\.intent==='clarify'\)/);
  assert.match(source,/if\(cognitive\.intent==='conversation'\)/);
  assert.match(source,/appendMessinhoLongTermMemories/);
});
