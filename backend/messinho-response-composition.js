/**
 * MESSINHO Response Composition Context.
 * Creates a small response-shaping contract for the existing cognitive turn.
 * It guides answer structure only; it never creates facts, intent, or permissions.
 */
export const MESSINHO_RESPONSE_COMPOSITION_VERSION='1.0.0';

const ALLOWED_MOVES=new Set(['acknowledge_then_reassess','answer_directly_then_explain','engage_with_viewpoint','acknowledge_explicit_feeling','continue_pending_exchange','respond_naturally','clarify_one_material_gap']);
const unique=(items)=>[...new Set(items)].filter(Boolean).slice(0,4);

export function buildMessinhoResponseCompositionContext({
  message,
  dialogueState=null,
  clarificationContinuity=null,
  pragmaticContext=null
}={}){
  const cues=Array.isArray(pragmaticContext?.cues)?pragmaticContext.cues:[];
  const acts=cues.map(item=>item?.act).filter(Boolean);
  const continuity=dialogueState?.continuity||{};
  const clarificationStatus=clarificationContinuity?.status||continuity.clarification_reply?.status||'none';
  const followUp=continuity.follow_up_signal||'none';
  let primary='respond_naturally';
  let shape='natural_conversation';
  let guidance=['Address the actual contribution, not merely its grammatical form.'];
  let followUpPolicy='Ask no follow-up unless one genuinely helps the user.';
  let continuityMode='use_relevant_recent_context_without_forcing_old_topics';

  if(clarificationStatus==='ambiguous'||clarificationStatus==='candidate_answer'){
    primary='clarify_one_material_gap';
    shape='one_focused_clarification';
    guidance=['Identify the unresolved reference or answer.','Ask one concise question; do not start the dependent task yet.'];
    followUpPolicy='The clarification itself is the only follow-up question.';
    continuityMode='preserve_pending_question_and_prior_goal';
  }else if(clarificationStatus==='new_topic'){
    continuityMode='start_new_topic_without_carrying_old_task_filters';
    guidance=['Respond to the new topic on its own terms.'];
  }else if(acts.includes('correction')){
    primary='acknowledge_then_reassess';
    shape='acknowledge_correction_then_correct_or_clarify';
    guidance=['Accept the correction without defensiveness.','Re-evaluate the previous interpretation using the corrected meaning.','If the correction still leaves multiple referents, ask one focused question.'];
    followUpPolicy='Ask only if the corrected meaning remains materially ambiguous.';
  }else if(acts.includes('disagreement')){
    primary='acknowledge_then_reassess';
    shape='reconsider_disputed_point';
    guidance=['Identify which point is disputed.','Recheck the reasoning and evidence.','Agree, correct yourself, or explain the remaining difference with reasons.'];
    followUpPolicy='Do not ask the user to repeat an objection already stated.';
  }else if(acts.includes('question')){
    primary='answer_directly_then_explain';
    shape='direct_answer_then_short_reason';
    guidance=['Give the answer first when the available information permits.','Explain the key reason or uncertainty afterwards.'];
    followUpPolicy='Ask one question only if a missing detail changes the answer.';
  }else if(acts.includes('explicit_emotion')){
    primary='acknowledge_explicit_feeling';
    shape='brief_empathy_then_substantive_response';
    guidance=['Acknowledge only the feeling the user explicitly described.','Avoid diagnosis, exaggeration, or assumptions about causes.','Continue with the actual subject of the message.'];
  }else if(acts.includes('opinion')){
    primary='engage_with_viewpoint';
    shape='engage_then_add_reasoned_perspective';
    guidance=['Engage with the stated viewpoint fairly.','Distinguish agreement, disagreement, evidence and interpretation.'];
  }else if(acts.includes('acknowledgement')&&continuity.assistant_awaiting_answer){
    primary='continue_pending_exchange';
    shape='short_contextual_continuation';
    guidance=['Interpret the acknowledgement against the pending question.','Do not invent a new task or repeat the whole explanation.'];
    continuityMode='continue_pending_question_only_if_answer_is_clear';
  }else if(followUp!=='none'||continuity.follow_up_likely){
    primary='continue_pending_exchange';
    shape='contextual_follow_up';
    guidance=['Resolve pronouns and references against the recent exchange.','Continue the existing goal only when the connection is clear.','Preserve previously supplied constraints; do not silently add new ones.'];
    continuityMode='continue_relevant_recent_goal';
  }

  if(!ALLOWED_MOVES.has(primary))primary='respond_naturally';
  const safeMessage=String(message??'').replace(/[\\u0000-\\u001f\\u007f]/gu,' ').replace(/\\s+/gu,' ').trim().slice(0,1200);
  return {
    version:MESSINHO_RESPONSE_COMPOSITION_VERSION,
    primary_move:primary,
    response_shape:shape,
    guidance:unique(guidance),
    follow_up_policy:followUpPolicy,
    continuity_mode:continuityMode,
    source_cues:unique(acts),
    message_present:Boolean(safeMessage),
    policy:'Response-shaping guidance only. The current user message, verified evidence, semantic interpretation, and application safety controls remain authoritative.'
  };
}
