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
