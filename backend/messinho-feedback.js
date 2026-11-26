/**
 * MESSINHO feedback intake and review contracts.
 * Feedback is an auditable quality signal; it is never treated as verified football outcome data.
 */
const TYPES=new Set(['quality_rating','factual_correction','bug_report','feature_request']);
const DECISIONS=new Set(['reviewed','verified','rejected','applied']);
const clean=(value,max)=>String(value??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const optionalText=(value,max)=>{const text=clean(value,max);return text||null;};
const safeHttps=value=>{try{const url=new URL(String(value||''));return url.protocol==='https:'&&!url.username&&!url.password?url.toString():null;}catch{return null;}};

export function normalizeMessinhoFeedback(input={}){
 const messageId=clean(input.message_id,100);
 const question=clean(input.question,1200);
 const answer=clean(input.answer,6000);
 const feedbackType=String(input.feedback_type||'');
 const rating=input.rating===null||input.rating===undefined||input.rating===''?null:Number(input.rating);
 const comment=optionalText(input.comment,1200);
 if(messageId.length<3)return {ok:false,error:'Die Antwort konnte nicht eindeutig zugeordnet werden.'};
 if(!question||!answer)return {ok:false,error:'Frage und Antwort fehlen im Feedback-Kontext.'};
 if(!TYPES.has(feedbackType))return {ok:false,error:'Unbekannte Feedback-Kategorie.'};
 if(rating!==null&&(!Number.isInteger(rating)||rating<1||rating>5))return {ok:false,error:'Die Bewertung muss zwischen 1 und 5 liegen.'};
 if(feedbackType==='quality_rating'&&rating===null)return {ok:false,error:'Für eine Qualitätsbewertung fehlt die Sternebewertung.'};
 if(feedbackType!=='quality_rating'&&(!comment||comment.length<8))return {ok:false,error:'Bitte beschreibe die Korrektur oder den Fehler mit mindestens 8 Zeichen.'};
 const capabilityIds=[...new Set((Array.isArray(input.capability_ids)?input.capability_ids:[])
  .filter(value=>typeof value==='string').map(value=>value.toLowerCase().trim())
  .filter(value=>/^[a-z0-9_]{2,80}$/.test(value)))].slice(0,12);
 return {ok:true,value:{message_id:messageId,question,answer,feedback_type:feedbackType,rating,comment,
  intent:optionalText(input.intent,80),engine_version:optionalText(input.engine_version,40),
  model_version:optionalText(input.model_version,80),capability_ids:capabilityIds}};
}

export function normalizeMessinhoFeedbackReview(input={}){
 const decision=String(input.decision||'');
 const reason=clean(input.reason,1200);
 const evidenceUrl=input.evidence_url? safeHttps(input.evidence_url):null;
 if(!DECISIONS.has(decision))return {ok:false,error:'Ungültige Prüfentscheidung.'};
 if(reason.length<8)return {ok:false,error:'Bitte einen nachvollziehbaren Prüfgrund mit mindestens 8 Zeichen angeben.'};
 if(input.evidence_url&&!evidenceUrl)return {ok:false,error:'Der Beleg muss eine gültige HTTPS-Adresse ohne Zugangsdaten sein.'};
 if(decision==='verified'&&!evidenceUrl)return {ok:false,error:'Eine verifizierte Korrektur benötigt einen HTTPS-Beleg.'};
 return {ok:true,value:{decision,reason,evidence_url:evidenceUrl}};
}

export function isMessinhoFeedbackEligibleForQualityMetrics(record){
 return Boolean(record&&['quality_rating','factual_correction','bug_report','feature_request'].includes(record.feedback_type)
  &&Number.isInteger(Number(record.rating))&&Number(record.rating)>=1&&Number(record.rating)<=5);
}
