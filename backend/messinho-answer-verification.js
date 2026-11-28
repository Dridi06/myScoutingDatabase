/**
 * MESSINHO Answer Verification — bounded post-generation quality gate.
 * It checks only deterministic properties it can actually establish.
 * It is not a general fact checker and never treats model self-review as proof.
 */
import { validateMessinhoReasoning } from './messinho-reasoning-validation.js';

export const MESSINHO_ANSWER_VERIFICATION_VERSION='1.0.0';
const MAX_REPLY=5000;
const NUMBER='([0-9]+(?:[.,][0-9]+)?)';
const PERCENT_RESULT=new RegExp('\\b'+NUMBER+'\\s*(?:%|prozent|percent)\\s*(?:von|of)\\s*'+NUMBER+'\\s*(?:=|ist|sind|ergibt|ergeben|is|equals)\\s*'+NUMBER+'\\b','iu');
const ABSOLUTE=/\b(?:definitiv|zweifellos|garantiert|immer|niemals|ausnahmslos|eindeutig bewiesen|definitely|undoubtedly|guaranteed|always|never|proven beyond doubt)\b/iu;
const TIME_SENSITIVE=/\b(?:aktuell|derzeit|heute|momentan|neueste|latest|currently|right now|today|as of now)\b/iu;
const FACTUAL_DOMAIN=/\b(?:statistik|daten|quelle|beleg|studie|medizin|gesundheit|finanz|aktien|markt|spieler|leistung|geschwindigkeit|wissenschaft|recht|gesetz|statistics|data|source|study|medical|health|finance|stocks|market|player|performance|speed|science|law)\b/iu;
const safe=(value,max=320)=>String(value??'').replace(/[\u0000-\u001f\u007f]/gu,' ').replace(/\s+/gu,' ').trim().slice(0,max);
function number(value){return Number(String(value).replace(',','.'));}
function arithmeticCheck(reply){
 const match=String(reply).match(PERCENT_RESULT);
 if(!match)return null;
 const percentage=number(match[1]),base=number(match[2]),claimed=number(match[3]);
 if(![percentage,base,claimed].every(Number.isFinite))return null;
 const expected=percentage*base/100;
 const tolerance=Math.max(0.01,Math.abs(expected)*0.0001);
 if(Math.abs(expected-claimed)<=tolerance)return null;
 return {code:'percentage_arithmetic_mismatch',expected:Number(expected.toFixed(6)),claimed,explanation:'The stated percentage result does not match the arithmetic.'};
}
export function buildMessinhoAnswerVerification({
 message,reply,reasoningContext=null,reasoningIntelligenceContext=null,
 contextIntelligenceContext=null,intent='conversation'
}={}){
 const draft=safe(reply,MAX_REPLY);
 const findings=[];
 if(!draft)findings.push({code:'empty_answer',severity:'critical'});
 const calculation=arithmeticCheck(draft);
 if(calculation)findings.push({...calculation,severity:'critical'});
 const playerContext=/\b(?:spieler|player|footballer|fußballer)\b/iu.test(String(message||'')+' '+draft);
 if(playerContext){
  const metricCheck=validateMessinhoReasoning({intent,reply:draft,userMessage:message,reasoningContext});
  if(!metricCheck.ok)findings.push({code:metricCheck.code,severity:'critical',safe_reply:metricCheck.reply});
 }
 const structuredEvidence=Array.isArray(reasoningContext?.evidence)
  ?reasoningContext.evidence.some(item=>Array.isArray(item?.research_entities)&&item.research_entities.length>0):false;
 const timeSensitive=TIME_SENSITIVE.test(draft)&&FACTUAL_DOMAIN.test(String(message||''));
 const absolute=ABSOLUTE.test(draft)&&FACTUAL_DOMAIN.test(String(message||''));
 if(!structuredEvidence&&timeSensitive)findings.push({code:'time_sensitive_claim_without_research_context',severity:'advisory'});
 if(!structuredEvidence&&absolute)findings.push({code:'absolute_factual_language_without_research_context',severity:'advisory'});
 const critical=findings.some(item=>item.severity==='critical');
 const advisory=findings.some(item=>item.severity==='advisory');
 const correction=critical?{
  required:true,
  instructions:findings.filter(item=>item.severity==='critical').map(item=>({
   code:item.code,
   expected:item.expected??null,
   safe_reply:item.safe_reply??null,
   instruction:item.code==='percentage_arithmetic_mismatch'
    ?'Recalculate the percentage from the original inputs. Correct the result and briefly show the calculation. Do not preserve the incorrect number.'
    :item.code==='unsupported_player_metric'
     ?'Remove the unsupported player measurement. State that the measurement is not available in the supplied verified evidence.'
     :item.code==='ambiguous_player_reference'
      ?'Do not guess the player identity. Ask one focused clarification question.'
      :'Provide a concise, safe answer without unsupported claims.'
  }))
 }: {required:false,instructions:[]};
 return {
  version:MESSINHO_ANSWER_VERIFICATION_VERSION,
  status:critical?'revision_required':advisory?'advisory':'accepted',
  passed:!critical,
  findings:findings.slice(0,5).map(({code,severity,expected,claimed})=>({code,severity,...(expected!==undefined?{expected}:{}),...(claimed!==undefined?{claimed}:{})})),
  correction,
  evidence_policy:'Only deterministic arithmetic and existing allowlisted player-metric checks can block. Advisory flags do not establish that a claim is false.',
  policy:'Bounded output audit, not a general truth detector. A revised answer must be audited again; unresolved critical issues require a safe fallback.'
 };
}
