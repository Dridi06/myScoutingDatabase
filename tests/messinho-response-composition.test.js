import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMessinhoResponseCompositionContext,MESSINHO_RESPONSE_COMPOSITION_VERSION} from '../backend/messinho-response-composition.js';
import {buildMessinhoCognitiveRouterMessages,classifyMessinhoTurn} from '../backend/messinho-conversational-intelligence.js';
import {buildMessinhoPragmaticContext} from '../backend/messinho-pragmatic-context.js';

test('corrections and disagreements produce a reconsideration response plan',()=>{
  const correction=buildMessinhoResponseCompositionContext({message:'Nein, ich meinte den anderen Spieler.',pragmaticContext:buildMessinhoPragmaticContext({message:'Nein, ich meinte den anderen Spieler.'})});
  assert.equal(correction.primary_move,'acknowledge_then_reassess');
  assert.match(correction.response_shape,/correction/);
  const disagreement=buildMessinhoResponseCompositionContext({message:'Da bin ich anderer Meinung.',pragmaticContext:buildMessinhoPragmaticContext({message:'Da bin ich anderer Meinung.'})});
  assert.ok(disagreement.guidance.some(x=>x.includes('Recheck the reasoning')));
});

test('direct questions and opinions get distinct response structures',()=>{
  const question=buildMessinhoResponseCompositionContext({message:'Wie funktioniert das?',pragmaticContext:buildMessinhoPragmaticContext({message:'Wie funktioniert das?'})});
  assert.equal(question.primary_move,'answer_directly_then_explain');
  const opinion=buildMessinhoResponseCompositionContext({message:'Meiner Meinung nach ist das falsch.',pragmaticContext:buildMessinhoPragmaticContext({message:'Meiner Meinung nach ist das falsch.'})});
  assert.equal(opinion.primary_move,'engage_with_viewpoint');
});

test('explicit emotion, ambiguity, and new topics are handled without invented assumptions',()=>{
  const emotion=buildMessinhoResponseCompositionContext({message:'Ich bin frustriert.',pragmaticContext:buildMessinhoPragmaticContext({message:'Ich bin frustriert.'})});
  assert.equal(emotion.primary_move,'acknowledge_explicit_feeling');
  const ambiguous=buildMessinhoResponseCompositionContext({message:'Der andere.',clarificationContinuity:{status:'ambiguous'}});
  assert.equal(ambiguous.primary_move,'clarify_one_material_gap');
  const newTopic=buildMessinhoResponseCompositionContext({message:'Erzähl mir etwas über Physik.',clarificationContinuity:{status:'new_topic'}});
  assert.equal(newTopic.continuity_mode,'start_new_topic_without_carrying_old_task_filters');
});

test('follow-up context preserves recent goals without adding constraints',()=>{
  const plan=buildMessinhoResponseCompositionContext({
    message:'Und was ist mit seiner Ausdauer?',
    dialogueState:{continuity:{follow_up_likely:true,follow_up_signal:'referential_question'}}
  });
  assert.equal(plan.primary_move,'continue_pending_exchange');
  assert.match(plan.continuity_mode,/continue_relevant_recent_goal/);
  assert.ok(plan.guidance.some(x=>x.includes('Preserve previously supplied constraints')));
});

test('response composition context is included in the same model request and never grants permissions',()=>{
  const plan=buildMessinhoResponseCompositionContext({message:'Wie funktioniert das?'});
  const messages=buildMessinhoCognitiveRouterMessages({message:'Wie funktioniert das?',responseCompositionContext:plan});
  const payload=JSON.parse(messages[1].content);
  assert.equal(payload.response_composition_context.version,MESSINHO_RESPONSE_COMPOSITION_VERSION);
  assert.equal(payload.response_composition_context.primary_move,'respond_naturally');
  assert.equal(Object.hasOwn(payload.response_composition_context,'permission'),false);
});

test('classifier forwards response composition context to the live model call',async()=>{
  const plan=buildMessinhoResponseCompositionContext({message:'Wie funktioniert das?'});
  const result=await classifyMessinhoTurn({
    message:'Wie funktioniert das?',responseCompositionContext:plan,apiKey:'test',
    fetchImpl:async(_url,options)=>{
      const payload=JSON.parse(JSON.parse(options.body).messages[1].content);
      assert.equal(payload.response_composition_context.primary_move,'respond_naturally');
      return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({intent:'conversation',confidence:0.94,reply:'Ich erkläre es dir Schritt für Schritt.',clarification_question:'',memory_items:[]})}}]})};
    }
  });
  assert.equal(result.status,'completed');
});
