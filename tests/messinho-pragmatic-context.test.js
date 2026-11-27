import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMessinhoPragmaticContext,MESSINHO_PRAGMATIC_CONTEXT_VERSION} from '../backend/messinho-pragmatic-context.js';
import {buildMessinhoCognitiveRouterMessages,classifyMessinhoTurn} from '../backend/messinho-conversational-intelligence.js';

test('pragmatic context recognizes explicit conversational acts without replacing semantic intent',()=>{
  const correction=buildMessinhoPragmaticContext({message:'Nein, ich meinte den anderen Spieler.'});
  assert.equal(correction.cues[0].act,'correction');
  assert.ok(correction.cues[0].response_guidance.includes('reassess_previous_interpretation'));
  const disagreement=buildMessinhoPragmaticContext({message:'Da bin ich anderer Meinung.'});
  assert.equal(disagreement.cues[0].act,'disagreement');
  const opinion=buildMessinhoPragmaticContext({message:'Meiner Meinung nach ist er technisch stärker.'});
  assert.equal(opinion.cues[0].act,'opinion');
});

test('recognizes explicit emotion only from direct self-report wording',()=>{
  assert.equal(buildMessinhoPragmaticContext({message:'Ich bin gerade frustriert.'}).cues[0].act,'explicit_emotion');
  assert.equal(buildMessinhoPragmaticContext({message:'Das war ein schwieriger Spielzug.'}).cues[0].act,'statement_or_open_contribution');
});

test('supports explicit greetings, thanks, acknowledgements and multilingual cues',()=>{
  for(const [message,act] of [
    ['Guten Morgen!','greeting'],['Thanks!','gratitude'],['Genau.','acknowledgement'],
    ['I disagree with that.','disagreement'],['Je ne suis pas d’accord.','disagreement'],
    ['¿Cómo juega él?','question'],['يعطيك الصحة','gratitude'],['عسلامة','greeting']
  ]) assert.equal(buildMessinhoPragmaticContext({message}).cues[0].act,act,message);
});

test('provides bounded weak cues and never returns user text as an instruction or permission',()=>{
  const result=buildMessinhoPragmaticContext({message:'Hallo'.repeat(1000),linguisticContext:{response_language:'de'}});
  assert.equal(result.version,MESSINHO_PRAGMATIC_CONTEXT_VERSION);
  assert.equal(result.language_hint,'de');
  assert.equal(result.bounded,true);
  assert.ok(result.cues.length<=2);
  assert.equal(Object.hasOwn(result,'permission'),false);
  assert.equal(Object.hasOwn(result,'action'),false);
  assert.match(result.policy,/weak conversational hints only/);
});

test('pragmatic cues reach the same semantic cognitive turn as dialogue and language context',()=>{
  const pragmaticContext=buildMessinhoPragmaticContext({message:'Nein, ich meinte den anderen Spieler.',linguisticContext:{response_language:'de'}});
  const messages=buildMessinhoCognitiveRouterMessages({
    message:'Nein, ich meinte den anderen Spieler.',
    history:[{role:'assistant',text:'Meinst du Karim Benzema?'}],
    linguisticContext:{response_language:'de'},
    pragmaticContext
  });
  const payload=JSON.parse(messages[1].content);
  assert.equal(payload.pragmatic_context.version,MESSINHO_PRAGMATIC_CONTEXT_VERSION);
  assert.equal(payload.pragmatic_context.cues[0].act,'correction');
  assert.match(messages[0].content,/When the user corrects or disagrees, reconsider the previous answer/);
});

test('classifier forwards pragmatic context into the real provider request',async()=>{
  const pragmaticContext=buildMessinhoPragmaticContext({message:'Da bin ich anderer Meinung.'});
  const result=await classifyMessinhoTurn({
    message:'Da bin ich anderer Meinung.',
    pragmaticContext,apiKey:'test',
    fetchImpl:async(_url,options)=>{
      const body=JSON.parse(options.body);
      const payload=JSON.parse(body.messages[1].content);
      assert.equal(payload.pragmatic_context.cues[0].act,'disagreement');
      return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({
        intent:'conversation',confidence:0.94,reply:'Lass uns die Begründung noch einmal prüfen.',
        clarification_question:'',memory_items:[]
      })}}]})};
    }
  });
  assert.equal(result.status,'completed');
  assert.equal(result.decision.reply,'Lass uns die Begründung noch einmal prüfen.');
});

test('authenticated chat constructs and forwards pragmatic context before cognitive routing',async()=>{
  const {readFile}=await import('node:fs/promises');
  const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
  assert.match(source,/import \\{ buildMessinhoPragmaticContext \} from '\.\/messinho-pragmatic-context\.js'/);
  assert.match(source,/buildMessinhoPragmaticContext\\(\\{message:interpretedMessage,linguisticContext\\}\\)/);
  assert.match(source,/pragmaticContext,\\s*userRole:profile\.role/);
});
