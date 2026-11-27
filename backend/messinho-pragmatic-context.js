/**
 * MESSINHO Pragmatic Conversation Context.
 * Extracts explicit surface-level conversational cues for the existing cognitive router.
 * Cues are hints only: they do not determine intent, infer hidden emotions, or authorize actions.
 */
export const MESSINHO_PRAGMATIC_CONTEXT_VERSION='1.0.0';

const MAX_TEXT=1200;
const PATTERNS=[
  {act:'correction',confidence:0.94,pattern:/(?:\\b(?:ich meinte|ich wollte sagen|das meinte ich nicht|nicht .{1,70} sondern|du hast mich falsch verstanden|das ist nicht was ich|nein,? ich meinte|actually,? i meant|i meant|that is not what i|you misunderstood|not .{1,70} but|je voulais dire|ce n'est pas ce que|quería decir|no quise decir|لا،? قصدي|موش هذا قصدي)\\b)/iu,guidance:['accept_correction','reassess_previous_interpretation']},
  {act:'disagreement',confidence:0.9,pattern:/(?:\\b(?:da bin ich anderer meinung|das stimmt nicht|das ist falsch|du liegst falsch|ich widerspreche|nein,? das sehe ich anders|i disagree|that is wrong|that's incorrect|you are wrong|i don't think so|je ne suis pas d'accord|c'est faux|no estoy de acuerdo|eso es incorrecto|لا أتفق|هذا غلط|موش صحيح)\\b)/iu,guidance:['acknowledge_disagreement','recheck_reasoning','explain_correction_if_needed']},
  {act:'explicit_emotion',confidence:0.86,pattern:/(?:\\b(?:ich bin (?:frustriert|verärgert|wütend|traurig|enttäuscht|begeistert|glücklich|besorgt|unsicher)|ich ärgere mich|ich freue mich|i feel (?:upset|angry|sad|disappointed|excited|worried)|i am (?:frustrated|upset|angry|sad|disappointed|excited|worried)|je suis (?:frustré|frustrée|triste|déçu|déçue|content|contente|inquiet|inquiète)|estoy (?:frustrado|frustrada|triste|decepcionado|decepcionada|feliz|preocupado|preocupada)|أنا (?:غاضب|حزين|فرحان|قلقان)|أنا متقلق|مقلقني)\\b)/iu,guidance:['acknowledge_explicit_feeling','respond_with_empathy_without_overstating']},
  {act:'greeting',confidence:0.98,pattern:/^\\s*(?:hallo|guten morgen|guten tag|guten abend|moin|servus|hello|hi|hey|good morning|good afternoon|good evening|salut|bonjour|bonsoir|hola|buenas|مرحبا|السلام عليكم|عسلامة|aslema)(?:[\\s,!?.؟]|$)/iu,guidance:['respond_naturally_to_greeting']},
  {act:'gratitude',confidence:0.97,pattern:/^\\s*(?:danke|vielen dank|besten dank|thanks|thank you|thx|merci|muchas gracias|gracias|شكرا|يعطيك الصحة)(?:[\\s,!?.؟]|$)/iu,guidance:['acknowledge_briefly','avoid_unnecessary_follow_up']},
  {act:'acknowledgement',confidence:0.9,pattern:/^\\s*(?:ok|okay|genau|stimmt|richtig|verstanden|einverstanden|alles klar|ja|nein|yes|no|right|exactly|got it|understood|d'accord|exactement|vale|claro|صحيح|إي|لا|باهي|تمام)(?:[\\s,!?.؟]|$)/iu,guidance:['use_pending_dialogue_context_if_present','do_not_invent_a_new_task']},
  {act:'opinion',confidence:0.87,pattern:/(?:^|[.!?؟]\\s*)(?:ich finde|meiner meinung nach|ich denke|ich glaube|für mich ist|aus meiner sicht|i think|i believe|in my opinion|to me|i feel that|je pense|à mon avis|je crois|creo que|en mi opinión|para mí|في رأيي|نظن|نرى)/iu,guidance:['engage_with_the_viewpoint','distinguish_opinion_from_verified_fact']},
  {act:'question',confidence:0.82,pattern:/(?:[?؟]|^\\s*[¿¡]?\\s*(?:wer|was|wie|warum|wieso|weshalb|wo|wann|welche|welcher|welches|kannst du|könntest du|ist es|hat er|how|why|what|who|where|when|can you|could you|is it|does he|pourquoi|comment|qui|où|quand|est-ce que|por qué|cómo|quién|dónde|cuándo|هل|كيف|علاش|شنوة|وين|قداش)\\b)/iu,guidance:['answer_the_question_directly','ask_only_if_materially_ambiguous']},
  {act:'request',confidence:0.78,pattern:/(?:\\b(?:bitte|kannst du|könntest du|mach bitte|erklär mir|zeige mir|please|can you|could you|please do|explain to me|show me|s'il te plaît|peux-tu|explique-moi|por favor|puedes|explícame|من فضلك|تنجم|فسرلي)\\b)/iu,guidance:['identify_the_requested_outcome','avoid_exposing_internal_command_routing']}
];

export function buildMessinhoPragmaticContext({message,linguisticContext=null}={}){
  const text=String(message??'').replace(/[\\u0000-\\u001f\\u007f]/gu,' ').replace(/\\s+/gu,' ').trim().slice(0,MAX_TEXT);
  const matches=[];
  for(const entry of PATTERNS){
    if(entry.pattern.test(text)){
      matches.push({act:entry.act,confidence:entry.confidence,evidence:'explicit_surface_cue',response_guidance:entry.guidance});
      if(matches.length>=2)break;
    }
  }
  if(matches.length===0&&text){
    matches.push({act:'statement_or_open_contribution',confidence:0.55,evidence:'no_specific_surface_cue',response_guidance:['respond_to_the_actual_contribution','do_not_require_a_question_or_command']});
  }
  const language=linguisticContext?.response_language||linguisticContext?.primary_language||null;
  return {
    version:MESSINHO_PRAGMATIC_CONTEXT_VERSION,
    language_hint:typeof language==='string'?language.slice(0,20):null,
    cues:matches,
    policy:'Surface cues are weak conversational hints only. Prefer the actual message and dialogue context. Do not infer unstated emotions, facts, intent, or permissions.',
    bounded:true
  };
}
