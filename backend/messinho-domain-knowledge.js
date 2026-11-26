/**
 * MESSINHO canonical cross-domain knowledge store.
 * Only compact, independently worded knowledge with explicit verified reuse
 * rights is eligible for permanent persistence. No source full text is stored.
 */
import { createHash } from 'node:crypto';
import { verifyMessinhoSourceRights } from './messinho-rights-registry.js';

const clean=(v,max=1200)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const normalize=v=>clean(v,1800).normalize('NFKC').toLocaleLowerCase('de-DE').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const tokens=v=>[...new Set(normalize(v).split(' ').filter(x=>x.length>2))];
const STOP=new Set(['aber','auch','auf','aus','bei','das','dass','dem','den','der','des','die','ein','eine','einem','einen','einer','eines','für','im','in','ist','mit','oder','und','von','warum','weshalb','wieso','wie','was','welche','welcher','welches','the','and','for','with','from','that','this']);
export const MESSINHO_KNOWLEDGE_DOMAINS=Object.freeze(['mathematics','physics','biology','medicine','risk_management','banking','financial_markets','statistics','sports_science','football','computer_science','general']);
export function classifyMessinhoKnowledgeDomain(text=''){
 const q=normalize(text);
 const rules=[
  ['mathematics',/\b(mathematik|mathematisch|gleichung|algebra|geometrie|integral|ableitung|prozentrechnung|wahrscheinlichkeit)\b/],
  ['physics',/\b(physik|physikal|kraft|energie|bewegung|geschwindigkeit|beschleunigung|druck|welle|newton)\b/],
  ['biology',/\b(biologie|biologisch|zelle|genetik|stoffwechsel|photosynthese|organismus|evolution)\b/],
  ['medicine',/\b(medizin|medizinisch|orthopädie|verletzung|anatomie|sportmedizin|rehabilitation|diagnose)\b/],
  ['risk_management',/\b(risikomanagement|risikoanalyse|stresstest|value at risk|expected shortfall|risikoappetit)\b/],
  ['banking',/\b(bank|banken|kredit|einlage|liquidität|eigenkapital|zentralbank|bonität)\b/],
  ['financial_markets',/\b(börse|börse|aktie|aktien|anleihe|etf|orderbuch|volatilität|derivat|börse|finanzmarkt|börse)\b/],
  ['statistics',/\b(statistik|regression|korrelation|kovarianz|zeitreihe|monte carlo|prognose|prognostiz)\b/],
  ['sports_science',/\b(sportwissenschaft|biomechanik|trainingslehre|belastung|regeneration|leistungsdiagnostik)\b/],
  ['football',/\b(fußball|fussball|spieler|scouting|transfer|mannschaft|verein)\b/],
  ['computer_science',/\b(informatik|programmierung|algorithmus|datenbank|software|ki|künstliche intelligenz)\b/]
 ];
 return rules.find(([,re])=>re.test(q))?.[0]||'general';
}
export function fingerprintMessinhoDomainKnowledge(content,domain='general'){
 const value=normalize(content);
 return value.length>=24?createHash('sha256').update(domain+':'+value).digest('hex'):null;
}
export function buildMessinhoDomainKnowledgeRecord(input={},now=new Date()){
 const domain=MESSINHO_KNOWLEDGE_DOMAINS.includes(input.domain)?input.domain:classifyMessinhoKnowledgeDomain(input.question||input.content||'');
 const content=clean(input.content,1600),question=clean(input.question,500);
 const rights=input.rights||{};
 if(!content||content.length<40||!question)return {eligible:false,reason:'insufficient_content'};
 if(!verifyMessinhoSourceRights(rights))
  return {eligible:false,reason:'rights_not_in_verified_registry'};
 const sources=(Array.isArray(input.sources)?input.sources:[]).filter(s=>s&&s.source_id===rights.source_id&&/^https:\/\//i.test(String(s.url||''))&&clean(s.title,180)).slice(0,5);
 if(!sources.length)return {eligible:false,reason:'source_provenance_required'};
 const claims=(Array.isArray(input.claims)?input.claims:[]).map(x=>clean(x,400)).filter(Boolean).slice(0,8);
 const fingerprint=fingerprintMessinhoDomainKnowledge(content,domain);
 if(!fingerprint)return {eligible:false,reason:'invalid_fingerprint'};
 const verifiedAt=new Date(now).toISOString();
 return {eligible:true,record:{fingerprint,domain,question,content,claims,sources:sources.map(s=>({source_id:s.source_id,title:clean(s.title,180),url:s.url,section:clean(s.section,120)||null})),
  rights:{status:'verified_permitted',license:clean(rights.license,120),rights_holder:clean(rights.rights_holder,180),evidence_url:clean(rights.evidence_url,500),ai_tdm:true,commercial_use:true,derivative_use:true,reviewed_at:clean(rights.reviewed_at,40)||verifiedAt},
  confidence:Math.max(0,Math.min(1,Number(input.confidence)||0)),knowledge_status:'active',version:1,verified_at:verifiedAt,created_at:verifiedAt,updated_at:verifiedAt}};
}
export function rankMessinhoDomainKnowledge(question,records=[],limit=5){
 const q=new Set(tokens(question).filter(t=>!STOP.has(t)));
 if(q.size<2)return [];
 return (Array.isArray(records)?records:[]).map(record=>{
  const r=new Set(tokens([record.domain,record.question,record.content].join(' ')).filter(t=>!STOP.has(t)));
  const overlap=[...q].filter(t=>r.has(t)).length;
  const score=overlap/Math.max(1,Math.min(q.size,r.size));
  return {record,score,overlap};
 }).filter(x=>x.overlap>=2&&x.score>=0.35&&x.record.knowledge_status==='active')
  .sort((a,b)=>b.score-a.score).slice(0,Math.max(1,Math.min(10,limit)));
}
export async function storeMessinhoDomainKnowledge(db,input,now=new Date()){
 const built=buildMessinhoDomainKnowledgeRecord(input,now);
 if(!built.eligible)return {persisted:false,reason:built.reason};
 if(!db)return {persisted:false,reason:'storage_unavailable'};
 const {data,error}=await db.from('messinho_domain_knowledge').upsert(built.record,{onConflict:'fingerprint'})
  .select('id,fingerprint,domain,version,verified_at').maybeSingle();
 if(error||!data?.id)return {persisted:false,reason:'storage_unavailable'};
 return {persisted:true,...data};
}
export async function findMessinhoDomainKnowledge(db,question,{limit=5}={}){
 if(!db)return {status:'unavailable',items:[]};
 const domain=classifyMessinhoKnowledgeDomain(question);
 const {data,error}=await db.from('messinho_domain_knowledge').select('id,fingerprint,domain,question,content,claims,sources,rights,confidence,version,verified_at,knowledge_status')
  .eq('knowledge_status','active').in('domain',[domain,'general']).order('verified_at',{ascending:false}).limit(100);
 if(error)return {status:'unavailable',items:[]};
 const items=rankMessinhoDomainKnowledge(question,data||[],limit);
 return {status:items.length?'hit':'miss',items:items.map(x=>({...x.record,relevance:Number(x.score.toFixed(3))}))};
}
