import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMessinhoResponseIntelligence,MESSINHO_RESPONSE_INTELLIGENCE_VERSION} from '../backend/messinho-response-intelligence.js';

test('direct factual questions use answer-first sequencing and calibrated uncertainty',()=>{
 const plan=buildMessinhoResponseIntelligence({
  message:'Warum ist die Beschleunigung wichtig?',
  responseCompositionContext:{primary_move:'answer_directly_then_explain'},
  reasoningContext:{evidence_policy:'attributed_not_verified',evidence:[]}
 });
 assert.equal(plan.version,MESSINHO_RESPONSE_INTELLIGENCE_VERSION);
 assert.equal(plan.response_goal,'answer_then_reason');
 assert.equal(plan.response_sequence[0],'answer_the_actual_question_first_when_supportable');
 assert.equal(plan.uncertainty_policy.mode,'do_not_present_unverified_details_as_facts');
 assert.equal(plan.follow_up_policy.max_questions,1);
});

test('corrections require reassessment rather than defensive repetition',()=>{
 const plan=buildMessinhoResponseIntelligence({
  message:'Nein, ich meinte den anderen Spieler.',
  responseCompositionContext:{primary_move:'acknowledge_then_reassess'},
  contextIntelligenceContext:{conversation:{relation:'correction'}}
 });
 assert.equal(plan.response_goal,'reassess_and_correct');
 assert.ok(plan.response_sequence.includes('recheck_the_disputed_reasoning_or_evidence'));
});

test('ambiguous references trigger one focused clarification and block guessing',()=>{
 const plan=buildMessinhoResponseIntelligence({
  message:'Vergleiche ihn mit dem anderen.',
  contextIntelligenceContext:{entity_reference:{status:'ambiguous'}},
  clarificationContinuity:{status:'ambiguous'}
 });
 assert.equal(plan.response_goal,'clarify_one_material_gap');
 assert.ok(plan.response_sequence.includes('do_not_guess_or_start_dependent_action'));
 assert.equal(plan.follow_up_policy.max_questions,1);
});

test('structured research context is distinguished from conversation-only evidence',()=>{
 const structured=buildMessinhoResponseIntelligence({
  message:'Wie schnell ist der Spieler?',
  reasoningContext:{evidence:[{role:'assistant',research_entities:[{type:'player',name:'Spieler A',metrics:[]}]}]}
 });
 const conversation=buildMessinhoResponseIntelligence({
  message:'Wie schnell ist der Spieler?',
  reasoningContext:{evidence:[{role:'user',text:'Er ist schnell.'}]}
 });
 assert.equal(structured.evidence_basis.level,'structured_research_context_present');
 assert.equal(conversation.evidence_basis.level,'conversation_context_only');
 assert.equal(structured.evidence_basis.structured_research_message_count,1);
});

test('new topics do not inherit follow-up response mode',()=>{
 const plan=buildMessinhoResponseIntelligence({
  message:'Erkläre mir Photosynthese.',
  responseCompositionContext:{primary_move:'respond_naturally'},
  contextIntelligenceContext:{conversation:{relation:'new_topic'}}
 });
 assert.equal(plan.conversation_relation,'new_topic');
 assert.equal(plan.response_goal,'respond_to_contribution');
});

test('response plan remains bounded and does not expose permissions or actions',()=>{
 const plan=buildMessinhoResponseIntelligence({
  message:'x'.repeat(10000),
  contextIntelligenceContext:{entity_reference:{status:'ambiguous'}},
  reasoningContext:{evidence:Array.from({length:100},()=>({role:'user',text:'x'}))}
 });
 assert.equal(plan.message_present,true);
 assert.equal(plan.evidence_basis.conversation_evidence_count,100);
 assert.equal(Object.hasOwn(plan,'permission'),false);
 assert.equal(Object.hasOwn(plan,'execute'),false);
 assert.equal(plan.follow_up_policy.max_questions,1);
});

test('authenticated chat constructs one response plan and forwards it to both model turns',async()=>{
 const {readFile}=await import('node:fs/promises');
 const server=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
 const router=await readFile(new URL('../backend/messinho-conversational-intelligence.js',import.meta.url),'utf8');
 const natural=await readFile(new URL('../backend/messinho-natural-conversation.js',import.meta.url),'utf8');
 assert.ok(server.includes("import { buildMessinhoResponseIntelligence } from './messinho-response-intelligence.js';"));
 assert.ok(server.includes('const responseIntelligenceContext=buildMessinhoResponseIntelligence('));
 assert.ok(server.includes('responseIntelligenceContext,'));
 assert.ok(router.includes('response_intelligence_context:responseIntelligenceContext||null'));
 assert.ok(natural.includes('response_intelligence_context: responseIntelligenceContext || null'));
});
