/**
 * MESSINHO Response Intelligence — semantic answer planning contract.
 * Plans response order and uncertainty handling; never creates facts or actions.
 */
export const MESSINHO_RESPONSE_INTELLIGENCE_VERSION='1.0.0';

const clean=(value,max=220)=>String(value??'').replace(/[\u0000-\u001f\u007f]/gu,' ').replace(/\s+/gu,' ').trim().slice(0,max);
const MOVES=new Set(['acknowledge_then_reassess','answer_directly_then_explain','engage_with_viewpoint','acknowledge_explicit_feeling','continue_pending_exchange','respond_naturally','clarify_one_material_gap']);

export function buildMessinhoResponseIntelligence({
 message,responseCompositionContext=null,contextIntelligenceContext=null,
 reasoningContext=null,clarificationContinuity=null,conversationContinuityContext=null,
 linguisticContext=null
}={}){
 const text=clean(message,1200);
 const requestedMove=MOVES.has(responseCompositionContext?.primary_move)?responseCompositionContext.primary_move:'respond_naturally';
 const relation=['new_topic','correction','follow_up','standalone'].includes(contextIntelligenceContext?.conversation?.relation)
  ?contextIntelligenceContext.conversation.relation
  :(['new_topic','correction','follow_up','standalone'].includes(conversationContinuityContext?.relation)?conversationContinuityContext.relation:'standalone');
 const clarification=['ambiguous','candidate_answer'].includes(clarificationContinuity?.status)
  ?clarificationContinuity.status
  :['ambiguous','candidate_answer'].includes(contextIntelligenceContext?.open_questions?.[0]?.status)?'ambiguous':'none';
 const entityStatus=['resolved','ambiguous','unresolved','not_applicable'].includes(contextIntelligenceContext?.entity_reference?.status)
  ?contextIntelligenceContext.entity_reference.status
  :['resolved','ambiguous','unresolved','not_applicable'].includes(reasoningContext?.entity_resolution?.status)?reasoningContext.entity_resolution.status:'not_applicable';
 const evidence=Array.isArray(reasoningContext?.evidence)?reasoningContext.evidence:[];
 const structuredEvidenceCount=evidence.filter(item=>Array.isArray(item?.research_entities)&&item.research_entities.length>0).length;
 const evidenceLevel=structuredEvidenceCount>0?'structured_research_context_present':evidence.length>0?'conversation_context_only':'no_supporting_context_supplied';
 let goal='respond_to_contribution';
 if(clarification!=='none'||requestedMove==='clarify_one_material_gap')goal='clarify_one_material_gap';
 else if(relation==='correction'||requestedMove==='acknowledge_then_reassess')goal='reassess_and_correct';
 else if(requestedMove==='answer_directly_then_explain')goal='answer_then_reason';
 else if(requestedMove==='engage_with_viewpoint')goal='engage_with_viewpoint';
 else if(requestedMove==='acknowledge_explicit_feeling')goal='acknowledge_explicit_feeling';
 else if(relation==='follow_up'||requestedMove==='continue_pending_exchange')goal='continue_relevant_exchange';
 const mustClarify=goal==='clarify_one_material_gap'||entityStatus==='ambiguous'&&/(?:\b(?:er|ihn|ihm|sein|der andere|dieser|diesen)\b)/iu.test(text);
 const steps=mustClarify
  ?['state_briefly_what_is_unclear','ask_one_specific_clarifying_question','do_not_guess_or_start_dependent_action']
  :goal==='reassess_and_correct'
   ?['acknowledge_the_specific_correction_or_objection','recheck_the_disputed_reasoning_or_evidence','give_the_corrected_answer_or_state_what_remains_uncertain']
   :goal==='answer_then_reason'
    ?['answer_the_actual_question_first_when_supportable','explain_the_key_reason_or_calculation','state_material_assumptions_and_uncertainty']
    :goal==='engage_with_viewpoint'
     ?['engage_with_the_stated_viewpoint','separate_agreement_from_evidence_and_interpretation','offer_a_reasoned_counterpoint_only_when_useful']
     :goal==='continue_relevant_exchange'
      ?['resolve_references_from_the_relevant_recent_exchange','continue_the_user_goal_without_repeating_unneeded_context','preserve_only_supported_constraints']
      :['respond_to_the_actual_contribution','give_reasoning_or_context_only_when_it_adds_value','mark_uncertainty_when_a_claim_is_not_supported'];
 const language=linguisticContext?.response_language||linguisticContext?.primary_language||null;
 return {
  version:MESSINHO_RESPONSE_INTELLIGENCE_VERSION,
  response_goal:goal,
  source_move:requestedMove,
  conversation_relation:relation,
  evidence_basis:{level:evidenceLevel,conversation_evidence_count:evidence.length,structured_research_message_count:structuredEvidenceCount,entity_resolution_status:entityStatus},
  response_sequence:steps,
  uncertainty_policy:{
   mode:entityStatus==='ambiguous'||entityStatus==='unresolved'?'explicit_reference_uncertainty':structuredEvidenceCount>0?'attribute_claims_to_available_evidence':'do_not_present_unverified_details_as_facts',
   distinguish:['verified_or_structured_evidence','user_statement','assistant_prior_claim','inference_or_hypothesis'],
   never_invent_measurements_sources_events_or_actions:true
  },
  follow_up_policy:{max_questions:1,ask_only_if:'A missing detail materially changes the answer or safe next step.',if_clear:'Do not add a question just to prolong the exchange.'},
  language_hint:typeof language==='string'?clean(language,24):null,
  message_present:Boolean(text),
  policy:'Advisory response plan only. The model generates the natural answer; deterministic application guards and server-side authorization remain authoritative.'
 };
}
