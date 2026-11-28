/**
 * MESSINHO Intent Intelligence — bounded evidence extraction for cognitive routing.
 *
 * Produces candidate intent signals only. It never makes the final route decision,
 * grants permissions, executes tools, or treats lexical matches as user intent.
 */
export const MESSINHO_INTENT_INTELLIGENCE_VERSION = '1.0.0';

const MAX_TEXT = 1600;
const MAX_CUES = 12;
const PATTERNS = [
  { intent:'memory_save', strength:'explicit', pattern:/\b(?:merk(?:e)?\s+dir|merk(?:e)?\s+das|speicher(?:e)?\s+(?:dir|das|diese|diesen|diese information)|behalt(?:e)?\s+das\s+im\s+gedächtnis|erinnere\s+dich|remember\s+(?:this|that|to)|save\s+(?:this|that)\s+to\s+memory|keep\s+this\s+in\s+mind|souviens.toi|mémorise|recuerda|guarda\s+esto|تذكر|احفظ|خليها\s+في\s+بالك)\b/iu },
  { intent:'memory_recall', strength:'explicit', pattern:/\b(?:was\s+weißt\s+du\s+über\s+mich|was\s+hast\s+du\s+dir\s+gemerkt|was\s+ist\s+gespeichert|erinnerst\s+du\s+dich\s+an|what\s+do\s+you\s+remember|what\s+do\s+you\s+know\s+about\s+me|show\s+my\s+memory|qu'est.ce\s+que\s+tu\s+te\s+rappelles|qué\s+recuerdas|ماذا\s+تتذكر|شنوة\s+تتذكر)\b/iu },
  { intent:'engineering', strength:'explicit', pattern:/\b(?:programmiere|programmiere\s+weiter|entwickle|implementiere|integriere|debugge|behebe\s+(?:den|die|das)\s+(?:fehler|bug)|fix(?:e)?\s+(?:the\s+)?bug|write\s+code|implement|deploy|deployment|staging|production|github|supabase|render|api|messinho\s+(?:engine|system|selbstentwicklung)|systemdiagnose|system\s+diagnostics|code\s+review|déploie|corrige\s+le\s+bug|implementa|despliega)\b/iu },
  { intent:'scouting', strength:'explicit', pattern:/\b(?:scoute|scouting|spieler\s+(?:suchen|finden|analysieren|vergleichen|bewerten)|suche\s+(?:einen\s+)?spieler|finde\s+(?:einen\s+)?spieler|talent\s+(?:suchen|finden)|shortlist|transferkandidat|player\s+(?:search|scouting|analysis|comparison)|scout\s+(?:a\s+)?player|cherche\s+un\s+joueur|busca\s+un\s+jugador|لاعب\s+(?:ابحث|نلوّج))\b/iu },
  { intent:'general_research', strength:'strong', pattern:/\b(?:recherchiere|recherchier|recherche\s+(?:bitte|zu|über|ueber)|finde\s+(?:heraus|informationen|quellen)|informiere\s+mich\s+über|erkläre\s+mir\s+(?:wissenschaftlich|die\s+fakten)|aktuelle\s+(?:informationen|daten|nachrichten)|quellen\s+zu|research\s+(?:this|the\s+topic|about)|look\s+up|find\s+sources|latest\s+(?:data|news|information)|investigate|cherche\s+des\s+informations|investiga|busca\s+información|ابحث\s+عن|اعطيني\s+معلومات)\b/iu }
];
const DOMAIN_PATTERNS = [
  {domain:'football',pattern:/\b(?:fußball|fussball|spieler|verein|mannschaft|liga|scouting|transfer|player|club|team|league|joueur|équipe|jugador|equipo|لاعب|فريق)\b/iu},
  {domain:'science',pattern:/\b(?:biologie|physik|chemie|mathematik|statistik|medizin|sportmedizin|wissenschaft|biology|physics|chemistry|mathematics|statistics|medicine|science|biología|física|química|ciencia|طب|فيزياء|رياضيات)\b/iu},
  {domain:'finance',pattern:/\b(?:börse|aktie|aktien|etf|finanzen|finanzmarkt|portfolio|trading|stock|stocks|equity|bond|crypto|investment|finance|bourse|acciones|bolsa|أسهم|بورصة)\b/iu},
  {domain:'software',pattern:/\b(?:code|programmierung|software|datenbank|api|github|supabase|render|bug|deployment|server|programming|database|développement|código)\b/iu}
];
function clean(value,max=MAX_TEXT){return String(value??'').replace(/[\u0000-\u001f\u007f]/gu,' ').replace(/\s+/gu,' ').trim().slice(0,max);}
function matchPattern(pattern,text){pattern.lastIndex=0;return pattern.test(text);}
export function buildMessinhoIntentEvidence({message,userRole='scout',dialogueState=null,clarificationContinuity=null}={}){
  const text=clean(message);
  const normalized=text.normalize('NFKC');
  const candidates=[];
  for(const entry of PATTERNS){
    if(matchPattern(entry.pattern,normalized)){
      candidates.push({intent:entry.intent,strength:entry.strength,evidence:'explicit_lexical_action_cue'});
    }
  }
  const domains=[];
  for(const entry of DOMAIN_PATTERNS){
    if(matchPattern(entry.pattern,normalized))domains.push(entry.domain);
  }
  const actionLike=/\b(?:bitte|kannst\s+du|könntest\s+du|mach|erstelle|berechne|suche|finde|analysiere|vergleiche|erkläre|please|can\s+you|make|create|calculate|search|find|analyze|compare|explain|por\s+favor|puedes|تنجم|اعمل|فسر)\b/iu.test(normalized);
  const questionLike=/[?؟]|^\s*(?:wie|warum|was|wer|wo|wann|how|why|what|who|where|when|pourquoi|comment|qué|cómo|quién|وين|علاش|شنوة|كيف)/iu.test(normalized);
  const uniqueIntents=[...new Set(candidates.map(item=>item.intent))];
  const conflict=uniqueIntents.length>1;
  const pending=clarificationContinuity?.status==='ambiguous'||clarificationContinuity?.status==='candidate_answer';
  const conversationDefault=uniqueIntents.length===0;
  const suggestedIntent=conflict||pending?null:(uniqueIntents[0]||'conversation');
  const cueSummary=[];
  if(actionLike)cueSummary.push('action_form_present');
  if(questionLike)cueSummary.push('question_form_present');
  if(domains.length)cueSummary.push('domain_terms_present');
  if(dialogueState?.continuity?.follow_up_likely)cueSummary.push('possible_follow_up');
  if(pending)cueSummary.push('pending_clarification');
  return {
    version:MESSINHO_INTENT_INTELLIGENCE_VERSION,
    status:conflict?'conflicting_candidates':pending?'clarification_pending':uniqueIntents.length?'candidate_detected':'conversation_default',
    suggested_intent:suggestedIntent,
    candidates:candidates.slice(0,MAX_CUES),
    domains:domains.slice(0,4),
    cues:cueSummary.slice(0,MAX_CUES),
    user_role:userRole==='admin'?'admin':'scout',
    role_note:userRole==='admin'?'Admin role is context only; application authorization remains authoritative.':'Scout role does not grant system or engineering permissions.',
    conversation_default:conversationDefault,
    action_like:actionLike,
    question_like:questionLike,
    conflict,
    clarification_pending:pending,
    policy:'Candidate evidence only. The cognitive model decides intent from full meaning and context. This object never authorizes or executes an action.',
    bounded:true
  };
}
