/**
 * MESSINHO Reasoning Intelligence — bounded, explainable problem planning.
 * This is a public rationale/evidence contract, not hidden chain-of-thought.
 * It never verifies general-world claims, creates facts, grants permissions or executes tools.
 */
export const MESSINHO_REASONING_INTELLIGENCE_VERSION='1.0.0';

const MAX_TEXT=420;
const MAX_ITEMS=6;
const clean=(value,max=MAX_TEXT)=>String(value??'')
  .replace(/[\u0000-\u001f\u007f]/gu,' ').replace(/\s+/gu,' ').trim().slice(0,max);
const has=(text,pattern)=>pattern.test(text);
const CORRECTION=/\b(?:nein|doch nicht|das stimmt nicht|nicht richtig|ich meinte|du hast mich falsch verstanden|korrektur|rather|not correct|that's wrong|i meant|correction|non,? je voulais|ce n'est pas correct|لا،? أقصد|موش هكا)\b/iu;
const ASSUMPTION=/\b(?:angenommen|vorausgesetzt|unter der voraussetzung|falls|sofern|wenn|nehmen wir an|assuming|provided that|if|suppose|en supposant|si|بافتراض|إذا)\b/iu;
const HYPOTHESIS=/\b(?:vermutlich|wahrscheinlich|möglicherweise|eventuell|könnte|könnten|dürfte|hypothese|hypothetisch|probably|possibly|might|could|hypothesis|peut-être|pourrait|ربما|قد)\b/iu;
const MULTI_ACTION=/\b(?:analysiere|vergleiche|berechne|prüfe|erkläre|plane|bewerte|begründe|finde|zeige|analysieren|vergleichen|calculate|compare|explain|plan|evaluate|assess|compare|explain|calculate|قارن|اشرح)\b/giu;
const DECISION=/\b(?:vergleiche|gegenüber|unterschied|besser|alternative|optionen|entscheidung|compare|versus|vs\.?|difference|better|alternative|options|which should|مقارنة|أفضل)\b/iu;
const FACTUAL_DOMAIN=/\b(?:aktuell|heute|statistik|daten|quelle|beleg|studie|medizin|gesundheit|finanz|aktien|markt|spieler|leistung|geschwindigkeit|wissenschaft|recht|gesetz|price|latest|today|statistics|source|study|medical|health|finance|stocks|market|player|performance|speed|science|law)\b/iu;

function sourceItems(history){
  return (Array.isArray(history)?history:[]).slice(-8).flatMap(item=>{
    const role=item?.role==='assistant'?'assistant':item?.role==='user'?'user':null;
    const text=clean(item?.text,MAX_TEXT);
    return role&&text?[{role,text,authority:role==='user'?'user_assertion_not_verified':'assistant_claim_not_independent_evidence'}]:[];
  }).slice(-MAX_ITEMS);
}
function complexityOf(text){
  const actions=[...text.matchAll(MULTI_ACTION)].length;
  const questions=(text.match(/\?/gu)||[]).length;
  const listLines=(text.match(/(?:^|\n)\s*(?:\d+[.)]|[-•])\s+/gu)||[]).length;
  const connectors=(text.match(/\b(?:und|sowie|außerdem|anschließend|danach|while|and then|as well as|et|puis|و|ثم)\b/giu)||[]).length;
  const score=Math.min(8,actions+questions+listLines+Math.max(0,connectors-1)+(text.length>260?1:0));
  return {score,level:score>=4?'complex':score>=2?'multi_part':'simple'};
}
function taskKind(text){
  if(has(text,/\b(?:vergleiche|gegenüber|unterschied|besser|alternative|optionen|compare|versus|vs\.?|difference)\b/iu))return 'comparison';
  if(has(text,/\b(?:berechne|rechne|prozent|dreisatz|formel|calculate|percentage|equation|solve)\b/iu))return 'calculation';
  if(has(text,/\b(?:plane|planung|schritte|strategie|roadmap|plan|steps|strategy)\b/iu))return 'planning';
  if(has(text,/\b(?:prüfe|kontrolliere|fehler|widerspruch|debug|check|verify|audit|contradiction)\b/iu))return 'verification';
  if(has(text,/\b(?:erkläre|erklären|warum|wie funktioniert|explain|why|how does)\b/iu))return 'explanation';
  return 'general';
}
function makeSteps(kind,complexity){
  if(complexity.level==='simple')return [{id:'answer',purpose:'answer_the_actual_request',output:'direct_answer'}];
  const byKind={
    comparison:[
      ['define_options','Identify the options and keep their scope comparable'],
      ['set_criteria','Compare them using criteria relevant to the user goal'],
      ['weigh_evidence','Separate evidence, assumptions and trade-offs'],
      ['recommend_conditionally','Give a recommendation only if the evidence supports one']
    ],
    calculation:[
      ['identify_inputs','Identify known values, units and the requested result'],
      ['check_formula','Choose a suitable formula and verify its assumptions'],
      ['calculate','Calculate transparently and check units and arithmetic'],
      ['interpret_result','Explain the result and any relevant limitations']
    ],
    planning:[
      ['define_goal','Define the intended outcome and success criteria'],
      ['identify_constraints','Identify constraints, dependencies and missing inputs'],
      ['sequence_steps','Order feasible steps and distinguish prerequisites'],
      ['check_risks','Check risks, permissions and measurable completion criteria']
    ],
    verification:[
      ['state_claim','Identify the claim, result or behavior to verify'],
      ['check_evidence','Check source evidence, assumptions and provenance'],
      ['test_consistency','Look for contradictions, missing premises and edge cases'],
      ['report_findings','Report supported findings and unresolved issues']
    ],
    explanation:[
      ['identify_question','Identify the exact concept or question'],
      ['establish_prerequisites','Check which prerequisites are needed'],
      ['explain_causally','Explain the key mechanism or relationship'],
      ['mark_limits','Distinguish established points from examples or hypotheses']
    ],
    general:[
      ['define_problem','Clarify the requested outcome'],
      ['check_inputs','Check relevant evidence, assumptions and missing information'],
      ['derive_result','Work through the necessary steps and verify consistency'],
      ['communicate_result','Give the result with material limitations']
    ]
  };
  return byKind[kind].map(([id,purpose])=>({id,purpose}));
}
export function buildMessinhoReasoningIntelligence({
  message,history=[],reasoningContext=null,contextIntelligenceContext=null,
  responseIntelligenceContext=null,verifiedEvidence=[]
}={}){
  const current=clean(message,1600);
  const complexity=complexityOf(current);
  const kind=taskKind(current);
  const attributed=sourceItems(history);
  const userAssertions=attributed.filter(item=>item.role==='user').slice(-4);
  const assistantClaims=attributed.filter(item=>item.role==='assistant').slice(-3);
  const explicitAssumptions=ASSUMPTION.test(current)?[clean(current,240)]:[];
  const explicitHypotheses=HYPOTHESIS.test(current)?[clean(current,240)]:[];
  const correction=Boolean(contextIntelligenceContext?.conversation?.correction?.detected)||CORRECTION.test(current);
  const entityStatus=contextIntelligenceContext?.entity_reference?.status||reasoningContext?.entity_resolution?.status||'not_applicable';
  const structuredEvidence=Array.isArray(reasoningContext?.evidence)
    ?reasoningContext.evidence.filter(item=>Array.isArray(item?.research_entities)&&item.research_entities.length>0).length:0;
  const trustedFacts=Array.isArray(verifiedEvidence)?verifiedEvidence.slice(0,MAX_ITEMS).flatMap(item=>{
    if(item?.verified!==true||typeof item?.claim!=='string')return [];
    return [{claim:clean(item.claim,220),source:clean(item.source,120)||'verified_application_evidence'}];
  }):[];
  const unknowns=[];
  if(['ambiguous','unresolved'].includes(entityStatus))unknowns.push('The referenced entity is not uniquely resolved.');
  if(FACTUAL_DOMAIN.test(current)&&structuredEvidence===0&&trustedFacts.length===0)unknowns.push('No structured, independently verified evidence was supplied for the factual details requested.');
  if(explicitAssumptions.length)unknowns.push('The result depends on the stated condition being true.');
  const contradictions=correction?[{
    status:'correction_or_conflict_candidate',
    statement:clean(current,220),
    instruction:'Reassess only the contradicted interpretation; do not defend the earlier claim without checking it.'
  }]:[];
  const comparisonRequested=kind==='comparison'||DECISION.test(current);
  const comparisonCriteria=[];
  if(/\b(?:preis|kosten|budget|price|cost)\b/iu.test(current))comparisonCriteria.push('cost');
  if(/\b(?:risiko|sicherheit|risk|safety)\b/iu.test(current))comparisonCriteria.push('risk');
  if(/\b(?:zeit|dauer|schnell|time|duration|speed)\b/iu.test(current))comparisonCriteria.push('time');
  if(/\b(?:qualität|genauigkeit|qualität|quality|accuracy)\b/iu.test(current))comparisonCriteria.push('quality');
  if(comparisonRequested&&!comparisonCriteria.length)comparisonCriteria.push('goal_fit','evidence_quality','trade_offs');
  const steps=makeSteps(kind,complexity);
  return {
    version:MESSINHO_REASONING_INTELLIGENCE_VERSION,
    task:{kind,complexity:complexity.level,complexity_score:complexity.score,goal:current.slice(0,360)},
    decomposition:{required:complexity.level!=='simple',steps:steps.slice(0,4)},
    comparison:{required:comparisonRequested,criteria:comparisonCriteria.slice(0,4),avoid_false_equivalence:true},
    evidence_ledger:{
      verified_facts:trustedFacts,
      structured_evidence_message_count:structuredEvidence,
      user_assertions:userAssertions.map(item=>({text:item.text,authority:item.authority})),
      prior_assistant_claims:assistantClaims.map(item=>({text:item.text,authority:item.authority})),
      assumptions:explicitAssumptions,
      hypotheses:explicitHypotheses,
      unknowns:unknowns.slice(0,4),
      contradiction_candidates:contradictions
    },
    validation_checks:[
      'check_required_premises_and_input_completeness',
      'check_internal_consistency_and_contradictions',
      ...(kind==='calculation'?['verify_arithmetic_and_units']:[]),
      ...(comparisonRequested?['compare_like_with_like_and_state_trade_offs']:[]),
      'distinguish_evidence_from_assumptions_and_hypotheses'
    ],
    confidence_policy:'not_numerically_scored_without_calibrated_evidence',
    explanation_policy:'Provide a concise, user-facing rationale and key checks; never reveal private hidden chain-of-thought.',
    response_goal:responseIntelligenceContext?.response_goal||'respond_to_contribution',
    policy:'Advisory reasoning plan only. No facts are created, no tool is executed, no permissions are granted and no data is persisted.'
  };
}
