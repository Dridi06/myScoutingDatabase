/**
 * MESSINHO hierarchical knowledge graph.
 * Stores compact, independently worded knowledge only after work-level rights
 * checks. Candidate records are never silently activated or used as trusted facts.
 */
import { createHash } from 'node:crypto';
import { MESSINHO_KNOWLEDGE_DOMAINS, classifyMessinhoKnowledgeDomain } from './messinho-domain-knowledge.js';
import { verifyMessinhoSourceRights, isMessinhoRegisteredSourceUrl } from './messinho-rights-registry.js';

const clean=(value,max=1800)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const normalize=value=>clean(value,3000).normalize('NFKC').toLocaleLowerCase('de-DE').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const tokens=value=>[...new Set(normalize(value).split(' ').filter(token=>token.length>2))];
const LEVELS=new Set(['foundational','intermediate','advanced','specialist']);
const TYPES=new Set(['concept','principle','formula','method','rule','metric','model','procedure']);
const GRADES=new Set(['A','B','C','D','E','not_applicable']);
const STOP=new Set(['aber','auch','auf','aus','bei','das','dass','dem','den','der','des','die','ein','eine','einem','einen','einer','eines','für','im','in','ist','mit','oder','und','von','warum','weshalb','wieso','wie','was','welche','welcher','welches','the','and','for','with','from','that','this']);
const slug=value=>normalize(value).replace(/\s+/g,'-').replace(/[^a-z0-9äöüß-]/g,'').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').slice(0,100);
const fingerprint=value=>createHash('sha256').update(normalize(value)).digest('hex');

export function buildMessinhoKnowledgeConcept(input={},now=new Date()){
 const domain=MESSINHO_KNOWLEDGE_DOMAINS.includes(input.domain)?input.domain:classifyMessinhoKnowledgeDomain([input.topic,input.title,input.definition].join(' '));
 const topic=clean(input.topic,180),title=clean(input.title,220),definition=clean(input.definition,1800);
 if(input.knowledge_level&&!LEVELS.has(input.knowledge_level))return {eligible:false,reason:'invalid_knowledge_level'};
 if(input.knowledge_type&&!TYPES.has(input.knowledge_type))return {eligible:false,reason:'invalid_knowledge_type'};
 const level=input.knowledge_level||'foundational',type=input.knowledge_type||'concept';
 if(topic.length<2||title.length<3||definition.length<40)return {eligible:false,reason:'incomplete_concept'};
 if(level!=='foundational'&&!clean(input.parent_concept_key,160)&&!(Array.isArray(input.prerequisites)&&input.prerequisites.some(value=>clean(value,160))))return {eligible:false,reason:'learning_dependency_required'};
 const rawSources=Array.isArray(input.sources)?input.sources:[];
 const sources=[];
 for(const source of rawSources){
  const rights=source?.rights||input.source_rights?.find(item=>item?.source_id===source?.source_id);
  if(!rights||!verifyMessinhoSourceRights(rights)||source.source_id!==rights.source_id||!isMessinhoRegisteredSourceUrl(rights.source_id,source.url))continue;
  const url=clean(source.url,600),host=(()=>{try{return new URL(url).hostname.replace(/^www\./i,'').toLowerCase();}catch{return '';}})();
  if(!host||sources.some(item=>item.url===url))continue;
  sources.push({source_id:rights.source_id,title:clean(source.title,220),url,host,section:clean(source.section,180)||null,edition:clean(source.edition||rights.edition,120)||null,license:clean(rights.license,120),license_url:clean(rights.license_url,600),attribution:clean(rights.attribution,500),retrieval_method:clean(source.retrieval_method||rights.retrieval_method,80)||null,retrieval_url:clean(rights.retrieval_url,600)||null,changes_made:true,accessed_at:new Date(now).toISOString()});
 }
 const independentHosts=[...new Set(sources.map(source=>source.host))];
 if(sources.length<1||independentHosts.length<1)return {eligible:false,reason:'one_rights_verified_source_required'};
 const claims=(Array.isArray(input.claims)?input.claims:[]).map(claim=>typeof claim==='string'?{text:clean(claim,700),source_urls:sources.map(source=>source.url)}:{text:clean(claim?.text,700),source_urls:Array.isArray(claim?.source_urls)?claim.source_urls.filter(url=>sources.some(source=>source.url===url)).slice(0,5):[]}).filter(claim=>claim.text&&claim.source_urls.length>=1);
 if(!claims.length)return {eligible:false,reason:'corroborated_claims_required'};
 const rightsList=[...new Map(sources.map(source=>{const r=input.source_rights?.find(item=>item.source_id===source.source_id)||rawSources.find(item=>item.source_id===source.source_id)?.rights;return [source.source_id,r];})).values()];
 if(rightsList.length<1)return {eligible:false,reason:'rights_provenance_required'};
 const conceptKey=clean(input.concept_key,160)||[domain,slug(topic),slug(title)].filter(Boolean).join('.');
 if(!/^[a-z0-9][a-z0-9._:-]{2,159}$/.test(conceptKey))return {eligible:false,reason:'invalid_concept_key'};
 const nowIso=new Date(now).toISOString();
 const sourceRights=rightsList.map(rights=>({source_id:rights.source_id,status:'verified_permitted',license:clean(rights.license,120),license_url:clean(rights.license_url,600),rights_holder:clean(rights.rights_holder,180),evidence_url:clean(rights.evidence_url,600),attribution:clean(rights.attribution,500),retrieval_method:clean(rights.retrieval_method,80)||null,retrieval_url:clean(rights.retrieval_url,600)||null,ai_tdm:true,commercial_use:true,derivative_use:true,reviewed_at:clean(rights.reviewed_at,40)||nowIso}));
 const contentFingerprint=fingerprint([domain,topic,title,definition,input.formula||''].join('|'));
 const record={
  concept_key:conceptKey,domain,topic,title,definition,knowledge_level:level,knowledge_type:type,
  parent_concept_key:clean(input.parent_concept_key,160)||null,
  prerequisites:[...new Set((Array.isArray(input.prerequisites)?input.prerequisites:[]).map(x=>clean(x,160)).filter(Boolean))].slice(0,20),
  formula:clean(input.formula,500)||null,formula_variables:input.formula_variables&&typeof input.formula_variables==='object'&&!Array.isArray(input.formula_variables)?input.formula_variables:{},
  applicability:clean(input.applicability,800)||null,limitations:(Array.isArray(input.limitations)?input.limitations:[]).map(x=>clean(x,300)).filter(Boolean).slice(0,12),
  claims,sources:sources.map(({host,...source})=>source),
  rights:{status:'verified_permitted',ai_tdm:true,commercial_use:true,derivative_use:true,verified_source_count:sources.length,independent_source_domains:independentHosts.length,source_rights:sourceRights},
  evidence_grade:GRADES.has(input.evidence_grade)?input.evidence_grade:'not_applicable',
  confidence:Math.max(0,Math.min(1,Number(input.confidence)||0)),knowledge_status:'candidate',
  conflict_group:clean(input.conflict_group,160)||null,version:1,previous_version_id:null,
  valid_from:nowIso,valid_until:null,review_due_at:input.review_due_at||null,created_at:nowIso,updated_at:nowIso,
  content_fingerprint:contentFingerprint
 };
 return {eligible:true,record};
}

function rank(question,rows,limit){
 const query=new Set(tokens(question).filter(token=>!STOP.has(token)));
 if(query.size<2)return [];
 return rows.map(record=>{
  const words=new Set(tokens([record.domain,record.topic,record.title,record.definition,record.formula||''].join(' ')).filter(token=>!STOP.has(token)));
  const overlap=[...query].filter(token=>words.has(token)).length;
  const score=overlap/Math.max(1,Math.min(query.size,words.size));
  return {record,score,overlap};
 }).filter(item=>item.record.knowledge_status==='active'&&item.overlap>=2&&item.score>=0.28)
   .sort((a,b)=>b.score-a.score).slice(0,Math.max(1,Math.min(12,limit)));
}

export async function storeMessinhoKnowledgeConcept(db,input,now=new Date()){
 if(!db)return {persisted:false,reason:'storage_unavailable'};
 const built=buildMessinhoKnowledgeConcept(input,now);
 if(!built.eligible)return {persisted:false,reason:built.reason};
 const record=built.record;
 try{
  const existing=await db.from('messinho_knowledge_concepts').select('id,concept_key,domain,topic,title,definition,formula,version,knowledge_status').eq('concept_key',record.concept_key).maybeSingle();
  if(existing.error)throw existing.error;
  if(existing.data){
   const same=fingerprint([existing.data.domain,existing.data.topic,existing.data.title,existing.data.definition,existing.data.formula||''].join('|'))===fingerprint([record.domain,record.topic,record.title,record.definition,record.formula||''].join('|'));
   if(same)return {persisted:false,reason:'already_exists',id:existing.data.id,status:existing.data.knowledge_status};
   const conflict=await db.rpc('messinho_record_knowledge_conflict',{p_concept_id:existing.data.id,p_proposed_concept:record,p_evidence:{claims:record.claims,sources:record.sources,rights:record.rights},p_conflict_reason:'A newer source-backed proposal differs from the existing concept; manual review required.'});
   if(conflict.error||!conflict.data)throw conflict.error||new Error('conflict_record_unconfirmed');
   return {persisted:false,reason:'conflict_requires_review',id:existing.data.id,conflict_id:conflict.data,existing_version:existing.data.version};
  }
  const {data,error}=await db.rpc('messinho_create_knowledge_candidate',{p_record:record,p_change_reason:'Initial verified compact knowledge candidate'});
  if(error||!Array.isArray(data)||!data[0]?.id)throw error||new Error('atomic_candidate_write_unconfirmed');
  return {persisted:true,...data[0],approval_required:true};
 }catch(error){console.warn('MESSINHO knowledge concept persistence unavailable:',error.code||error.message||'unknown');return {persisted:false,reason:'storage_unavailable'};}
}

export async function findMessinhoKnowledgeConcepts(db,question,{limit=6}={}){
 if(!db)return {status:'unavailable',items:[]};
 const domain=classifyMessinhoKnowledgeDomain(question);
 try{
  const {data,error}=await db.from('messinho_knowledge_concepts')
   .select('id,concept_key,domain,topic,title,definition,knowledge_level,knowledge_type,parent_concept_key,prerequisites,formula,formula_variables,applicability,limitations,claims,sources,rights,evidence_grade,confidence,version,valid_from,valid_until,review_due_at')
   .eq('knowledge_status','active').in('domain',[domain,'general']).or('valid_until.is.null,valid_until.gt.'+new Date().toISOString())
   .order('confidence',{ascending:false}).limit(150);
  if(error)throw error;
  const items=rank(question,data||[],limit).map(item=>({...item.record,relevance:Number(item.score.toFixed(3))}));
  if(!items.length)return {status:'miss',items:[]};
  const ids=items.map(item=>item.id);
  const links=await db.from('messinho_knowledge_links').select('from_concept_id,to_concept_id,relation_type,rationale').or('from_concept_id.in.('+ids.join(',')+'),to_concept_id.in.('+ids.join(',')+')');
  return {status:'hit',items,links:links.error?[]:links.data||[]};
 }catch(error){console.warn('MESSINHO knowledge concept retrieval unavailable:',error.code||'unknown');return {status:'unavailable',items:[]};}
}

export async function reviewMessinhoKnowledgeConcept(db,{concept_id,decision,reason,reviewer_id}={}){
 if(!db||!concept_id||!reviewer_id||!['approve','reject','mark_conflicting'].includes(decision)||clean(reason,500).length<10)return {reviewed:false,reason:'invalid_review_request'};
 try{
  const current=await db.from('messinho_knowledge_concepts').select('id,domain,knowledge_status,parent_concept_key,prerequisites,sources,claims,rights').eq('id',concept_id).maybeSingle();
  if(current.error)throw current.error;
  if(!current.data)return {reviewed:false,reason:'concept_not_found'};
  if(decision==='approve'){
   const row=current.data,sourceRights=Array.isArray(row.rights?.source_rights)?row.rights.source_rights:[];
   const verifiedSources=(row.sources||[]).filter(source=>{
    const rights=sourceRights.find(item=>item.source_id===source.source_id);
    return rights&&verifyMessinhoSourceRights(rights)&&isMessinhoRegisteredSourceUrl(rights.source_id,source.url);
   });
   const domains=[...new Set(verifiedSources.map(source=>{try{return new URL(source.url).hostname.replace(/^www\./i,'').toLowerCase();}catch{return '';}}).filter(Boolean))];
   if(row.knowledge_status!=='candidate'||row.rights?.status!=='verified_permitted'||row.rights?.ai_tdm!==true||row.rights?.commercial_use!==true||row.rights?.derivative_use!==true||verifiedSources.length<2||domains.length<2||!(row.claims||[]).some(claim=>(claim.source_urls||[]).filter(url=>verifiedSources.some(source=>source.url===url)).length>=2)){
    return {reviewed:false,reason:'candidate_rights_or_corroboration_incomplete'};
   }
   const prerequisites=[...(row.parent_concept_key?[row.parent_concept_key]:[]),...(row.prerequisites||[])];
   if(prerequisites.length){
    const ready=await db.from('messinho_knowledge_concepts').select('concept_key').eq('knowledge_status','active').in('concept_key',prerequisites);
    if(ready.error)throw ready.error;
    if(new Set((ready.data||[]).map(item=>item.concept_key)).size!==new Set(prerequisites).size)return {reviewed:false,reason:'active_prerequisites_missing'};
   }
   const openConflicts=await db.from('messinho_knowledge_conflicts').select('id').eq('concept_id',concept_id).eq('status','open').limit(1);
   if(openConflicts.error)throw openConflicts.error;
   if((openConflicts.data||[]).length)return {reviewed:false,reason:'open_conflict_requires_resolution'};
  }
  const result=await db.rpc('messinho_review_knowledge_concept',{p_concept_id:concept_id,p_decision:decision,p_reason:clean(reason,500),p_reviewer_id:reviewer_id});
  const saved=Array.isArray(result.data)?result.data[0]:result.data;
  if(result.error||!saved?.id)throw result.error||new Error('review_not_confirmed');
  return {reviewed:true,...saved};
 }catch(error){console.warn('MESSINHO knowledge review failed:',error.code||error.message||'unknown');return {reviewed:false,reason:'review_storage_unavailable'};}
}

export async function linkMessinhoKnowledgeConcepts(db,{from_concept_id,to_concept_id,relation_type,rationale,evidence=[]}={}){
 const allowed=new Set(['prerequisite','related','extends','contradicts','applies_to','derived_from']);
 if(!db||!from_concept_id||!to_concept_id||from_concept_id===to_concept_id||!allowed.has(relation_type))return {linked:false,reason:'invalid_link'};
 const {data,error}=await db.from('messinho_knowledge_links').upsert({from_concept_id,to_concept_id,relation_type,rationale:clean(rationale,500)||null,evidence:Array.isArray(evidence)?evidence.slice(0,10):[]},{onConflict:'from_concept_id,to_concept_id,relation_type'}).select('id').maybeSingle();
 return error||!data?.id?{linked:false,reason:'storage_unavailable'}:{linked:true,id:data.id};
}

export const MESSINHO_KNOWLEDGE_LEVELS=Object.freeze(['foundational','intermediate','advanced','specialist']);
export const MESSINHO_KNOWLEDGE_RELATIONS=Object.freeze(['prerequisite','related','extends','contradicts','applies_to','derived_from']);
