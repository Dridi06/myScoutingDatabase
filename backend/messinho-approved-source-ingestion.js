import {
  getMessinhoVerifiedSourceRightsById,
  verifyMessinhoSourceRights
} from './messinho-rights-registry.js';

const clean=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/[₀₁₂₃₄₅₆₇₈₉]/g,d=>String('₀₁₂₃₄₅₆₇₈₉'.indexOf(d))).replace(/\s+/g,' ').trim();
const decodeXml=value=>String(value??'')
  .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
  .replace(/&quot;/g,'"').replace(/&apos;/g,"'")
  .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));

function stripMarkup(value){
 return decodeXml(String(value??'').replace(/<\/?(?:sub|sup)\b[^>]*>/gi,'').replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim();
}
function queryTerms(topic){
 return [...new Set(clean(topic).toLocaleLowerCase('de-DE').split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>2))];
}
function selectRelevantExcerpts(paragraphs,topic,maxChars=7000){
 const terms=queryTerms(topic);
 const ranked=paragraphs.map((item,index)=>{
  const row=typeof item==='string'?{text:item,section:'article_text'}:item;
  const text=clean(row?.text);
  const normalized=text.toLocaleLowerCase('de-DE');
  const hits=terms.filter(term=>normalized.includes(term)).length;
  return {text,section:clean(row?.section)||'article_text',index,hits};
 }).filter(x=>x.text.length>=80)
   .sort((a,b)=>b.hits-a.hits||a.index-b.index);
 const chosen=ranked.filter(x=>!terms.length||x.hits>0).slice(0,8);
 const fallback=chosen.length?chosen:ranked.slice(0,4);
 const excerpts=[];let used=0;
 for(const item of fallback){
  const remaining=maxChars-used;if(remaining<180)break;
  const text=item.text.slice(0,Math.min(1800,remaining));
  excerpts.push({text,relevance_hits:item.hits,source_section:item.section});
  used+=text.length;
 }
 return excerpts;
}
function extractPlosParagraphs(xml){
 const paragraphs=[];
 const abstract=[...String(xml).matchAll(/<abstract\b[^>]*>([\s\S]*?)<\/abstract>/gi)];
 for(const match of abstract){const text=stripMarkup(match[1]);if(text)paragraphs.push({text,section:'abstract'});}
 for(const match of String(xml).matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)){
  const text=stripMarkup(match[1]);if(text)paragraphs.push({text,section:'article_body'});
 }
 return paragraphs;
}
function extractBioCParagraphs(payload){
 const docs=Array.isArray(payload?.documents)?payload.documents:
  Array.isArray(payload?.collection?.documents)?payload.collection.documents:[];
 return docs.flatMap(doc=>(Array.isArray(doc?.passages)?doc.passages:[])
  .map(p=>({text:clean(p?.text),section:clean(p?.infons?.section_type||p?.infons?.section||'article_text')}))
  .filter(p=>p.text.length>=80));
}

export async function fetchMessinhoApprovedSource(sourceId,{topic='',fetchImpl=globalThis.fetch,maxChars=7000}={}){
 const rights=getMessinhoVerifiedSourceRightsById(sourceId);
 if(!rights||!verifyMessinhoSourceRights({...rights,status:'verified_permitted',ai_tdm:true,commercial_use:true,derivative_use:true}))
  return {status:'source_not_approved',source_id:sourceId||null,excerpts:[]};
 if(typeof fetchImpl!=='function')return {status:'fetch_unavailable',source_id:sourceId,excerpts:[]};
 const allowedMethods=new Set(['plos_jats_xml','pmc_bioc_json']);
 if(!allowedMethods.has(rights.retrieval_method)||typeof rights.retrieval_url!=='string'||!rights.retrieval_url.startsWith('https://'))
  return {status:'retrieval_method_not_approved',source_id:sourceId,excerpts:[]};
 try{
  const url=new URL(rights.retrieval_url);
  const expectedHost=rights.retrieval_method==='plos_jats_xml'?'journals.plos.org':'www.ncbi.nlm.nih.gov';
  if(url.hostname!==expectedHost)return {status:'retrieval_host_not_approved',source_id:sourceId,excerpts:[]};
  const response=await fetchImpl(rights.retrieval_url,{headers:{accept:rights.retrieval_method==='pmc_bioc_json'?'application/json':'application/xml,text/xml;q=0.9'}});
  if(!response?.ok)return {status:'source_fetch_failed',source_id:sourceId,http_status:response?.status||null,excerpts:[]};
  let paragraphs=[];
  if(rights.retrieval_method==='plos_jats_xml'){
   const xml=await response.text();
   if(typeof xml!=='string'||xml.length>2_000_000)return {status:'source_payload_rejected',source_id:sourceId,excerpts:[]};
   paragraphs=extractPlosParagraphs(xml);
  }else{
   const payload=await response.json();
   paragraphs=extractBioCParagraphs(payload);
  }
  const excerpts=selectRelevantExcerpts(paragraphs,topic,Math.max(500,Math.min(10000,Number(maxChars)||7000)));
  if(!excerpts.length)return {status:'no_relevant_text',source_id:sourceId,excerpts:[]};
  return {
   status:'completed',
   source:{
    source_id:rights.source_id,title:rights.title,edition:rights.edition,
    url:rights.source_url_prefixes[0],license:rights.license,license_url:rights.license_url,
    rights_holder:rights.rights_holder,evidence_url:rights.evidence_url,tdm_evidence_url:rights.tdm_evidence_url,
    reviewed_at:rights.reviewed_at,attribution:rights.attribution,retrieval_method:rights.retrieval_method,retrieval_url:rights.retrieval_url,status:rights.status,ai_tdm:true,commercial_use:true,derivative_use:true
   },
   retrieval_method:rights.retrieval_method,
   excerpts,
   storage_policy:'transient_excerpts_only',
   retrieved_at:new Date().toISOString()
  };
 }catch{
  return {status:'source_fetch_failed',source_id:sourceId,excerpts:[]};
 }
}
