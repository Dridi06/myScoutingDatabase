import { fetchMessinhoApprovedSource } from './messinho-approved-source-ingestion.js';
import { getMessinhoVerifiedSourceRightsById, isMessinhoRegisteredSourceUrl } from './messinho-rights-registry.js';
import { isMessinhoGeneralClaimSupported } from './messinho-general-research.js';
import { classifyMessinhoKnowledgeDomain } from './messinho-domain-knowledge.js';
import { storeMessinhoKnowledgeConcept } from './messinho-knowledge-graph.js';

const clean=(value,max=1800)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const isFoundationalQuestion=question=>/^(?:was ist|was bedeutet|erkl[aä]re(?: mir)?|erkl[aä]ren sie|grundlagen|definition|einf[uü]hrung|what is|define|explain the basics)\b/i.test(clean(question,700));
const isPersonalQuestion=question=>/\b(ich habe|bei mir|mein(?:e|en|em)?\s+(?:symptom|schmerz|krankheit|medikament|diagnose|verletzung|gesundheit)|meine gesundheit)\b/i.test(clean(question,700));

function topicFromQuestion(question){
 return clean(question,180).replace(/^(?:was ist|was bedeutet|erkl[aä]re(?: mir)?|erkl[aä]ren sie|grundlagen|definition|einf[uü]hrung|what is|define|explain the basics)\s*/i,'').replace(/[?!.]+$/g,'').trim()||'Grundlagen';
}

export async function learnMessinhoKnowledgeFromResearch(db,{question,research,fetchImpl=globalThis.fetch,now=new Date()}={}){
 const query=clean(question,700);
 if(!db)return {persisted:false,status:'not_persisted',reason:'storage_unavailable'};
 if(!isFoundationalQuestion(query))return {persisted:false,status:'not_persisted',reason:'not_foundational_intent'};
 if(isPersonalQuestion(query))return {persisted:false,status:'not_persisted',reason:'personal_context_not_persisted'};
 if(!research||research.status!=='completed'||research.quality_control?.passed!==true||research.evidence?.can_answer!==true)
  return {persisted:false,status:'not_persisted',reason:'research_quality_gate_not_passed'};
 if(research.evidence?.freshness?.required===true)
  return {persisted:false,status:'not_persisted',reason:'time_sensitive_knowledge_not_persisted'};
 const candidates=(Array.isArray(research.sources)?research.sources:[])
  .filter(source=>source?.source_id&&source.rights_status==='verified_permitted'&&getMessinhoVerifiedSourceRightsById(source.source_id)&&isMessinhoRegisteredSourceUrl(source.source_id,source.url))
  .slice(0,4);
 if(!candidates.length)return {persisted:false,status:'not_persisted',reason:'no_work_level_rights_cleared_sources'};
 const verified=[];
 for(const source of candidates){
  const fetched=await fetchMessinhoApprovedSource(source.source_id,{topic:query,fetchImpl,maxChars:5000});
  if(fetched.status!=='completed'||!Array.isArray(fetched.excerpts)||!fetched.excerpts.length)continue;
  const rights=getMessinhoVerifiedSourceRightsById(source.source_id);
  if(!rights||!isMessinhoRegisteredSourceUrl(source.source_id,source.url))continue;
  const snippet=fetched.excerpts.map(item=>item.text).join(' ').slice(0,9000);
  verified.push({
   source_id:source.source_id,title:rights.title||source.title,url:source.url,edition:rights.edition||null,
   section:[...new Set(fetched.excerpts.map(item=>item.source_section).filter(Boolean))].join(', ').slice(0,180)||null,
   publisher:source.publisher||new URL(source.url).hostname,rights,snippet,
   retrieval_method:fetched.retrieval_method
  });
 }
 if(!verified.length)return {persisted:false,status:'not_persisted',reason:'approved_source_retrieval_unavailable'};
 const claims=(Array.isArray(research.claims)?research.claims:[]).map(claim=>{
  const matched=verified.filter(source=>
   Array.isArray(claim?.source_urls)&&claim.source_urls.some(url=>isMessinhoRegisteredSourceUrl(source.source_id,url))&&
   isMessinhoGeneralClaimSupported(claim.text,[{title:source.title,snippet:source.snippet}])
  );
  return matched.length?{text:clean(claim.text,700),source_urls:matched.map(source=>source.url)}:null;
 }).filter(Boolean);
 if(!claims.length)return {persisted:false,status:'not_persisted',reason:'no_claim_supported_by_licensed_source_text'};
 const uniqueDomains=[...new Set(verified.map(source=>source.publisher))];
 const topic=topicFromQuestion(query);
 const definition=claims.map(claim=>claim.text).join(' ').slice(0,1800);
 if(definition.length<40)return {persisted:false,status:'not_persisted',reason:'compact_definition_too_short'};
 const sources=verified.map(source=>({
  source_id:source.source_id,title:source.title,url:source.url,edition:source.edition,section:source.section,
  rights:source.rights,retrieval_method:source.retrieval_method
 }));
 const result=await storeMessinhoKnowledgeConcept(db,{
  domain:classifyMessinhoKnowledgeDomain(query),topic,title:topic+' — Grundlagen',definition,
  knowledge_level:'foundational',knowledge_type:/formel|gleichung|formula|equation/i.test(query)?'formula':'concept',
  claims,sources,evidence_grade:uniqueDomains.length>=2?'B':'C',
  confidence:uniqueDomains.length>=2?0.78:0.62,
  applicability:'Allgemeine Grundlagen; konkrete Anwendung ist im jeweiligen Fach- und Nutzungskontext zu prüfen.',
  limitations:[...(Array.isArray(research.evidence?.limitations)?research.evidence.limitations:[]),'Kandidat: noch nicht als aktives Fachwissen freigegeben.'],
  review_due_at:new Date(new Date(now).getTime()+90*86400000).toISOString()
 },now);
 return {
  ...result,status:result.persisted?'candidate_created':'candidate_not_created',
  candidate_only:true,active:false,approval_required:true,
  source_count:verified.length,independent_source_domains:uniqueDomains.length,
  claims_stored:claims.length,source_excerpts_persisted:false
 };
}

export { isFoundationalQuestion as isMessinhoFoundationalKnowledgeQuestion };
