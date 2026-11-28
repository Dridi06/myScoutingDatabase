import test from 'node:test';
import { requestMessinhoModelCompletion, resolveMessinhoModelConfig } from '../backend/messinho-model-runtime.js';
import assert from 'node:assert/strict';
import {
  buildMessinhoCognitiveRouterMessages,
  validateMessinhoCognitiveDecision,
  appendMessinhoLongTermMemories,
  isSensitiveMessinhoMemoryText,
  classifyMessinhoTurn
} from '../backend/messinho-conversational-intelligence.js';

test('provider runtime supports configurable OpenAI-compatible endpoints and local models',()=>{
  const config=resolveMessinhoModelConfig({
    MESSINHO_MODEL_BASE_URL:'http://127.0.0.1:11434/v1/',
    MESSINHO_MODEL_NAME:'local-instruct'
  });
  assert.equal(config.baseUrl,'http://127.0.0.1:11434/v1');
  assert.equal(config.model,'local-instruct');
  assert.equal(config.requiresApiKey,false);
});

test('provider runtime retries JSON schema with JSON object mode only when unsupported',async()=>{
  const formats=[];
  const result=await requestMessinhoModelCompletion({
    messages:[{role:'user',content:'Hallo'}],model:'test-model',apiKey:'test',
    baseUrl:'https://example.test/v1/',responseFormat:{type:'json_schema'},
    fetchImpl:async(url,options)=>{
      assert.equal(url,'https://example.test/v1/chat/completions');
      const body=JSON.parse(options.body);formats.push(body.response_format?.type);
      if(formats.length===1)return {ok:false,status:400,json:async()=>({error:{code:'unsupported_parameter',message:'response_format json_schema is not supported'}})};
      return {ok:true,status:200,json:async()=>({choices:[{message:{content:'{"ok":true}'}}]})};
    }
  });
  assert.equal(result.status,'completed');
  assert.equal(result.compatibility_mode,'json_object_fallback');
  assert.deepEqual(formats,['json_schema','json_object']);
});

test('provider runtime exposes bounded status and error codes without leaking credentials',async()=>{
  const result=await requestMessinhoModelCompletion({
    messages:[],model:'test-model',apiKey:'never-log-this-secret',
    fetchImpl:async(_url,options)=>{
      assert.equal(options.headers.Authorization,'Bearer never-log-this-secret');
      return {ok:false,status:401,json:async()=>({error:{code:'invalid_api_key',message:'Invalid API key'}})};
    }
  });
  assert.equal(result.status,'provider_error');
  assert.equal(result.http_status,401);
  assert.equal(result.error_code,'invalid_api_key');
  assert.equal(JSON.stringify(result).includes('never-log-this-secret'),false);
});

test('router prompt prioritizes meaning, context and natural language over fixed commands',()=>{
  const messages=buildMessinhoCognitiveRouterMessages({
    message:'Merk die Staging Alpha',
    history:[{role:'assistant',text:'Wir testen gerade dein persönliches Gedächtnis.'}],
    memory:{long_term_memory:[{text:'Arbeitet am myScoutingDatabase Projekt',category:'project'}]}
  });
  assert.match(messages[0].content,/spelling mistakes, speech-to-text errors, autocorrect/i);
  assert.match(messages[0].content,/meaning, not exact keywords/i);
  assert.match(messages[0].content,/thoughtful, natural conversation partner/i);
  assert.match(messages[0].content,/does not need to contain a question or command/i);
  assert.match(messages[1].content,/Wir testen gerade/);
  assert.match(messages[1].content,/myScoutingDatabase/);
});

test('approved grammar and vocabulary knowledge reaches the same cognitive turn without mixing language segments',()=>{
  const messages=buildMessinhoCognitiveRouterMessages({
    message:'Wie sagt man das auf Deutsch und tunesischer Derja?',
    linguisticContext:{segments:[{language_analysis:{primary_language:'de'}},{language_analysis:{primary_language:'ar-tn'}}]},
    linguisticKnowledgeContext:[
      {language:'de',type:'grammar',topic:'word_order',title:'Deutsche Satzstellung',explanation:'Verbzweitstellung im Hauptsatz.'},
      {language:'ar-tn',type:'lexicon',topic:'greetings',title:'Derja-Begrüßungen',terms:[{term:'Aslema',meaning_de:'Hallo'}]}
    ]
  });
  const payload=JSON.parse(messages[1].content);
  assert.equal(payload.approved_language_knowledge.length,2);
  assert.equal(payload.approved_language_knowledge[0].language,'de');
  assert.equal(payload.approved_language_knowledge[1].language,'ar-tn');
  assert.match(messages[0].content,/Use approved_language_knowledge as supporting grammar/i);
  assert.match(messages[0].content,/never transfer words or grammar rules from one language into another/i);
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
  assert.equal(malformed.status,'invalid_output');
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
  const scouting=source.indexOf('const dialog=parseMessinhoScoutingRequest(',route);
  assert.ok(source.includes('clarificationContinuity.effective_message'));
  const research=source.indexOf("if(cognitive.intent==='general_research'||isMessinhoGeneralResearchQuestion(interpretedMessage))",route);
  assert.ok(route>0&&scouting>route,'semantic routing must precede scouting parsing');
  assert.ok(research>route,'semantic routing must precede external research');
  assert.match(source,/if\(cognitive\.intent==='clarify'\)/);
  assert.match(source,/if\(cognitive\.intent==='conversation'\)/);
  assert.match(source,/appendMessinhoLongTermMemories/);
  assert.match(source,/cognitive\.confidence<0\.72/);
  assert.match(source,/action_blocked:true/);
  assert.doesNotMatch(source,/isMessinhoGreeting|conversation_greeting/,'greetings must use the same conversational model path');
  assert.match(source,/MESSINHO_MODEL_BASE_URL/,'model provider endpoint must be configurable');
  const languageLookup=source.indexOf('const linguisticKnowledgeResult=await findMessinhoLanguageKnowledge(db,message,history)');
  assert.ok(languageLookup>0&&languageLookup<route,'approved language knowledge must be loaded before semantic routing');
  assert.match(source,/linguisticKnowledgeContext,/,'approved language knowledge must be passed into the cognitive turn');
});

test('bounded conversation memory is supplied separately from long-term user memory',()=>{
  const messages=buildMessinhoCognitiveRouterMessages({
    message:'Und wie geht es weiter?',
    history:[{role:'user',text:'Wir planen den nächsten Entwicklungsschritt.'}],
    conversationMemoryContext:{scope:'owner_conversation',source:'persisted_conversation_messages',message_count:2,items:[{role:'user',text:'Wir planen Block 4.'}]}
  });
  const payload=JSON.parse(messages[1].content);
  assert.equal(payload.conversation_memory_context.length,1);
  assert.equal(payload.conversation_memory_context[0].text,'Wir planen Block 4.');
  assert.equal(payload.existing_user_memory.length,0);
});

test('cognitive router forwards linguistic knowledge, conversation memory and reasoning evidence to the same model turn',async()=>{
 const fetchImpl=async(_url,options)=>{
  const body=JSON.parse(options.body);const payload=JSON.parse(body.messages[1].content);
  assert.equal(payload.approved_language_knowledge[0].language,'de');
  assert.equal(payload.conversation_memory_context[0].text,'Wir arbeiten an Block 5.');
  assert.equal(payload.reasoning_context.evidence_policy,'attributed_not_verified');
  return {ok:true,status:200,json:async()=>({choices:[{message:{content:JSON.stringify({intent:'conversation',confidence:0.94,reply:'Wir können daran anknüpfen.',clarification_question:'',memory_items:[]})}}]})};
 };
 const result=await classifyMessinhoTurn({message:'Wie geht es weiter?',apiKey:'test',fetchImpl,
  linguisticKnowledgeContext:[{language:'de',type:'grammar',title:'Satzbau'}],
  conversationMemoryContext:{items:[{role:'user',text:'Wir arbeiten an Block 5.'}]},
  reasoningContext:{evidence_policy:'attributed_not_verified',evidence:[]}
 });
 assert.equal(result.status,'completed');
});

test('cognitive router receives intent evidence as advisory context, not a permission',()=>{
  const intentEvidenceContext={
    version:'1.0.0',status:'candidate_detected',suggested_intent:'scouting',
    candidates:[{intent:'scouting',strength:'explicit',evidence:'explicit_lexical_action_cue'}],
    domains:['football'],policy:'Candidate evidence only. Never authorizes or executes an action.'
  };
  const messages=buildMessinhoCognitiveRouterMessages({
    message:'Suche einen schnellen linken Flügelspieler.',
    intentEvidenceContext,userRole:'scout'
  });
  const payload=JSON.parse(messages[1].content);
  assert.equal(payload.intent_evidence_context.suggested_intent,'scouting');
  assert.equal(payload.intent_evidence_context.domains[0],'football');
  assert.match(messages[0].content,/suggested intent is not a decision/i);
  assert.equal(Object.hasOwn(payload.intent_evidence_context,'permission'),false);
});

test('classifier forwards intent evidence to the live cognitive model request',async()=>{
  const result=await classifyMessinhoTurn({
    message:'Suche einen schnellen linken Flügelspieler.',
    intentEvidenceContext:{status:'candidate_detected',suggested_intent:'scouting',domains:['football']},
    apiKey:'test',
    fetchImpl:async(_url,options)=>{
      const payload=JSON.parse(JSON.parse(options.body).messages[1].content);
      assert.equal(payload.intent_evidence_context.suggested_intent,'scouting');
      return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({
        intent:'scouting',confidence:0.94,reply:'Ich suche passende Spieler.',
        clarification_question:'',memory_items:[]
      })}}]})};
    }
  });
  assert.equal(result.status,'completed');
  assert.equal(result.decision.intent,'scouting');
});

test('authenticated chat builds intent evidence before semantic routing',async()=>{
  const {readFile}=await import('node:fs/promises');
  const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
  assert.ok(source.includes("import { buildMessinhoIntentEvidence } from './messinho-intent-intelligence.js';"));
  assert.ok(source.includes('buildMessinhoIntentEvidence({message:interpretedMessage,userRole:profile.role,dialogueState,clarificationContinuity})'));
  assert.ok(source.includes('intentEvidenceContext,\n      contextIntelligenceContext,\n      responseIntelligenceContext,\n      reasoningIntelligenceContext,\n      conversationContinuityContext,'));
});

test('cognitive router receives semantic response plan as advisory context',()=>{
 const plan={response_goal:'reassess_and_correct',response_sequence:['recheck_the_disputed_reasoning_or_evidence'],follow_up_policy:{max_questions:1}};
 const messages=buildMessinhoCognitiveRouterMessages({message:'Nein, das stimmt nicht.',responseIntelligenceContext:plan});
 const payload=JSON.parse(messages[1].content);
 assert.equal(payload.response_intelligence_context.response_goal,'reassess_and_correct');
 assert.match(messages[0].content,/semantic answer plan/i);
});


test('cognitive router receives the bounded reasoning plan and keeps it advisory',()=>{
 const plan={task:{kind:'comparison',complexity:'complex'},decomposition:{required:true,steps:[{id:'define_options'}]},evidence_ledger:{verified_facts:[],assumptions:['if X']},confidence_policy:'not_numerically_scored_without_calibrated_evidence'};
 const messages=buildMessinhoCognitiveRouterMessages({message:'Vergleiche A und B.',reasoningIntelligenceContext:plan});
 const payload=JSON.parse(messages[1].content);
 assert.equal(payload.reasoning_intelligence_context.task.kind,'comparison');
 assert.equal(payload.reasoning_intelligence_context.decomposition.required,true);
 assert.match(messages[0].content,/bounded problem-solving plan/i);
 assert.match(messages[0].content,/never private hidden chain-of-thought/i);
});
