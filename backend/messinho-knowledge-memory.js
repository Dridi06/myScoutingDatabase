/**
 * MESSINHO owner-scoped knowledge memory.
 * Stores only corroborated public/general research with source provenance.
 * This is retrieval memory, not model-weight training or self-modifying code.
 */
import { createHash } from 'node:crypto';

const clean=(value,max=6000)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const normalize=value=>clean(value,700).normalize('NFKC').toLocaleLowerCase('de-DE').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const safeUrl=value=>{try{const url=new URL(value);return url.protocol==='https:'?url.toString():null;}catch{return null;}};

export function fingerprintMessinhoKnowledgeQuestion(question){
 const normalized=normalize(question);
 return normalized.length>=12?createHash('sha256').update(normalized).digest('hex'):null;
}

export function isMessinhoKnowledgePersistable(question,research){
 const text=clean(question,700);
 if(!fingerprintMessinhoKnowledgeQuestion(text))return false;
 if(/\b(mein|meine|meiner|meinem|meinen|bei mir|über mich|ich habe|ich bin|ich nehme|mein konto|meine familie)\b/i.test(text))return false;
 if(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(text)||/\b\+?\d[\d\s()./-]{7,}\b/.test(text))return false;
 if(research?.status!=='completed'||research?.evidence?.can_answer!==true)return false;
 if(!Array.isArray(research.sources)||research.sources.length<2)return false;
 const usable=research.sources.filter(source=>safeUrl(source.url)&&clean(source.snippet,1400).length>=120);
 const domains=new Set(usable.map(source=>{try{return new URL(source.url).hostname.replace(/^www\./i,'').toLowerCase();}catch{return ''}}).filter(Boolean));
 return usable.length>=2&&domains.size>=2&&clean(research.answer,6000).length>0;
}

export function buildMessinhoKnowledgeRecord(ownerId,question,research,now=new Date()){
 const fingerprint=fingerprintMessinhoKnowledgeQuestion(question);
 if(!ownerId||!fingerprint||!isMessinhoKnowledgePersistable(question,research))return null;
 const sources=research.sources.filter(source=>safeUrl(source.url)&&clean(source.snippet,1400).length>=120).slice(0,8).map(source=>({
  title:clean(source.title,220),url:safeUrl(source.url),publisher:clean(source.publisher,160),
  published_date:clean(source.published_date,40)||null,snippet:clean(source.snippet,1200)
 }));
 const allowed=new Set(sources.map(source=>source.url));
 const claims=(Array.isArray(research.claims)?research.claims:[]).filter(claim=>clean(claim.text,700)&&Array.isArray(claim.source_urls)&&claim.source_urls.length&&claim.source_urls.every(url=>allowed.has(url))).slice(0,30).map(claim=>({text:clean(claim.text,700),source_urls:claim.source_urls}));
 const domains=[...new Set(sources.map(source=>{try{return new URL(source.url).hostname.replace(/^www\./i,'').toLowerCase();}catch{return '';}}).filter(Boolean))];
 const verifiedAt=new Date(now),expiresAt=new Date(verifiedAt.getTime()+14*24*60*60*1000);
 return {
  owner_id:ownerId,question:clean(question,700),question_fingerprint:fingerprint,
  answer:clean(research.answer,6000),answer_mode:research.answer_mode==='evidence_synthesized'&&claims.length?'evidence_synthesized':'source_digest',
  claims,sources,evidence_summary:{status:'cross_checked',source_count:sources.length,distinct_domains:domains.length,
   limitations:Array.isArray(research.evidence?.limitations)?research.evidence.limitations.slice(0,6).map(item=>clean(item,240)):[]},
  verification_status:'corroborated',source_count:sources.length,distinct_domains:domains.length,
  last_verified_at:verifiedAt.toISOString(),expires_at:expiresAt.toISOString(),updated_at:verifiedAt.toISOString()
 };
}

const KNOWLEDGE_STOPWORDS=new Set(['aber','auch','auf','aus','bei','das','dass','dem','den','der','des','die','ein','eine','einem','einen','einer','eines','für','im','in','ist','mit','oder','und','von','vom','warum','weshalb','wieso','wie','was','welche','welcher','welches','zu','zur','zum']);
function knowledgeTokens(value){
 const tokens=normalize(value).split(' ').filter(token=>token.length>=3&&!KNOWLEDGE_STOPWORDS.has(token));
 return [...new Set(tokens)];
}
export function scoreMessinhoKnowledgeSimilarity(question,candidate){
 const left=knowledgeTokens(question),right=knowledgeTokens(candidate);
 if(left.length<3||right.length<3)return {score:0,overlap:0,jaccard:0,containment:0,eligible:false};
 const a=new Set(left),b=new Set(right),intersection=[...a].filter(token=>b.has(token));
 const union=new Set([...a,...b]).size,jaccard=intersection.length/union,containment=intersection.length/Math.min(a.size,b.size);
 const score=0.65*jaccard+0.35*containment;
 return {score,overlap:intersection.length,jaccard,containment,eligible:intersection.length>=3&&jaccard>=0.48&&containment>=0.75};
}
export async function findMessinhoKnowledge(db,ownerId,question,now=new Date()){
 const fingerprint=fingerprintMessinhoKnowledgeQuestion(question);
 if(!db||!ownerId||!fingerprint)return {status:'unavailable',record:null};
 try{
  const base=()=>db.from('messinho_knowledge_memory').select('id,question,answer,answer_mode,claims,sources,evidence_summary,source_count,distinct_domains,last_verified_at,expires_at,hit_count')
   .eq('owner_id',ownerId).eq('verification_status','corroborated').gt('expires_at',new Date(now).toISOString());
  const exact=await base().eq('question_fingerprint',fingerprint).maybeSingle();
  if(exact.error)throw exact.error;
  let record=exact.data,match='exact',similarity=null;
  if(!record){
   const candidates=await base().order('last_verified_at',{ascending:false}).limit(40);
   if(candidates.error)throw candidates.error;
   const ranked=(candidates.data||[]).map(row=>({row,similarity:scoreMessinhoKnowledgeSimilarity(question,row.question)}))
    .filter(item=>item.similarity.eligible).sort((a,b)=>b.similarity.score-a.similarity.score);
   if(ranked.length){
    const best=ranked[0];
    const ambiguous=ranked[1]&&best.similarity.score-ranked[1].similarity.score<0.08;
    if(!ambiguous){record=best.row;match='high_confidence_lexical';similarity=best.similarity;}
   }
  }
  if(!record)return {status:'miss',record:null};
  const accessedAt=new Date(now).toISOString();
  const {error:updateError}=await db.from('messinho_knowledge_memory')
   .update({hit_count:(Number(record.hit_count)||0)+1,last_accessed_at:accessedAt})
   .eq('id',record.id).eq('owner_id',ownerId);
  if(updateError)console.warn('MESSINHO knowledge memory access counter unavailable:',updateError.code||'unknown');
  return {status:match==='exact'?'hit':'similar_hit',record,match,similarity};
 }catch(error){console.warn('MESSINHO knowledge memory read unavailable:',error.code||'unknown');return {status:'unavailable',record:null};}
}

export async function storeMessinhoKnowledge(db,ownerId,question,research,now=new Date()){
 const record=buildMessinhoKnowledgeRecord(ownerId,question,research,now);
 if(!record)return {persisted:false,reason:'not_eligible'};
 if(!db)return {persisted:false,reason:'storage_unavailable'};
 try{
  const {data,error}=await db.from('messinho_knowledge_memory')
   .upsert(record,{onConflict:'owner_id,question_fingerprint'})
   .select('id,verification_status,expires_at').maybeSingle();
  if(error){console.warn('MESSINHO knowledge memory write unavailable:',error.code||'unknown');return {persisted:false,reason:'storage_unavailable'};}
  if(!data?.id)return {persisted:false,reason:'write_not_confirmed'};
  return {persisted:true,id:data.id,verification_status:data.verification_status,expires_at:data.expires_at,source_count:record.source_count,distinct_domains:record.distinct_domains};
 }catch(error){console.warn('MESSINHO knowledge memory write failed:',error.message);return {persisted:false,reason:'storage_unavailable'};}
}
