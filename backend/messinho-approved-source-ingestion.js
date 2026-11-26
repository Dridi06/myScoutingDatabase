import {
  getMessinhoVerifiedSourceRightsById,
  verifyMessinhoSourceRights
} from './messinho-rights-registry.js';

const MAX_SOURCE_BYTES=2_000_000;
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
function extractHtmlParagraphs(html){
 return [...String(html).matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
  .map(match=>({text:stripMarkup(match[1]),section:'html_paragraph'}))
  .filter(item=>item.text.length>=80);
}
function isAllowedPublisherRedirect(url,expectedHost,rights){
 try{
  const candidate=new URL(url);
  if(candidate.protocol!=='https:'||candidate.username||candidate.password||candidate.port&&candidate.port!=='443')return false;
  if(candidate.hostname===expectedHost)return true;
  if(!Array.isArray(rights.redirect_hosts)||!rights.redirect_hosts.includes(candidate.hostname))return false;
  const pathPrefix=rights.redirect_path_prefixes?.[candidate.hostname];
  if(typeof pathPrefix!=='string'||!candidate.pathname.startsWith(pathPrefix))return false;
  return ['X-Amz-Algorithm','X-Amz-Credential','X-Amz-Date','X-Amz-Expires','X-Amz-Signature','X-Amz-SignedHeaders']
   .every(key=>Boolean(candidate.searchParams.get(key)));
 }catch{return false;}
}

function extractBioCParagraphs(payload){
 // NCBI BioC JSON is a list of collections, each containing documents/passages.
 // Some mirrors/fixtures return a single collection object; accept both shapes.
 const collections=Array.isArray(payload)?payload:
  Array.isArray(payload?.collection)?payload.collection:
  payload?.collection&&typeof payload.collection==='object'?[payload.collection]:
  payload&&typeof payload==='object'?[payload]:[];
 const docs=collections.flatMap(collection=>Array.isArray(collection?.documents)?collection.documents:[]);
 return docs.flatMap(doc=>(Array.isArray(doc?.passages)?doc.passages:[])
  .map(p=>({text:clean(p?.text),section:clean(p?.infons?.section_type||p?.infons?.section||'article_text')}))
  .filter(p=>p.text.length>=80));
}

export async function fetchMessinhoApprovedSource(sourceId,{topic='',fetchImpl=globalThis.fetch,maxChars=7000,now=new Date()}={}){
 const rights=getMessinhoVerifiedSourceRightsById(sourceId);
 if(!rights||!verifyMessinhoSourceRights({...rights,status:'verified_permitted',ai_tdm:true,commercial_use:true,derivative_use:true},now))
  return {status:'source_not_approved',source_id:sourceId||null,excerpts:[]};
 if(typeof fetchImpl!=='function')return {status:'fetch_unavailable',source_id:sourceId,excerpts:[]};
 const allowedMethods=new Set(['plos_jats_xml','pmc_bioc_json','libretexts_html','austin_html']);
 if(!allowedMethods.has(rights.retrieval_method)||typeof rights.retrieval_url!=='string'||!rights.retrieval_url.startsWith('https://'))
  return {status:'retrieval_method_not_approved',source_id:sourceId,excerpts:[]};
 try{
  const url=new URL(rights.retrieval_url);
  const expectedHost=({plos_jats_xml:'journals.plos.org',pmc_bioc_json:'www.ncbi.nlm.nih.gov',libretexts_html:'math.libretexts.org',austin_html:'understandinglinearalgebra.org'})[rights.retrieval_method];
  if(url.hostname!==expectedHost)return {status:'retrieval_host_not_approved',source_id:sourceId,excerpts:[]};
  const fetchOptions={headers:{accept:rights.retrieval_method==='pmc_bioc_json'?'application/json':rights.retrieval_method.endsWith('_html')?'text/html,application/xhtml+xml;q=0.9':'application/xml,text/xml;q=0.9'},redirect:'manual'};
  if(typeof AbortSignal?.timeout==='function')fetchOptions.signal=AbortSignal.timeout(12000);
  // Follow only bounded HTTPS redirects that remain on the source's exact approved host.
  let currentUrl=rights.retrieval_url,response;
  for(let redirectCount=0;redirectCount<=3;redirectCount++){
   response=await fetchImpl(currentUrl,fetchOptions);
   if(response?.url){
    try{if(!isAllowedPublisherRedirect(response.url,expectedHost,rights))return {status:'retrieval_redirect_not_approved',source_id:sourceId,excerpts:[]};}
    catch{return {status:'retrieval_redirect_not_approved',source_id:sourceId,excerpts:[]};}
   }
   const status=Number(response?.status)||0;
   if(status<300||status>=400)break;
   const location=response?.headers?.get?.('location');
   if(!location||redirectCount===3)return {status:'retrieval_redirect_not_approved',source_id:sourceId,excerpts:[]};
   let nextUrl;
   try{nextUrl=new URL(location,currentUrl);}catch{return {status:'retrieval_redirect_not_approved',source_id:sourceId,excerpts:[]};}
   if(!isAllowedPublisherRedirect(nextUrl.toString(),expectedHost,rights))
    return {status:'retrieval_redirect_not_approved',source_id:sourceId,excerpts:[]};
   currentUrl=nextUrl.toString();
  }
  if(Number(response?.status)>=300&&Number(response?.status)<400)return {status:'retrieval_redirect_not_approved',source_id:sourceId,excerpts:[]};
  const declaredLength=Number(response?.headers?.get?.('content-length')||0);
  if(declaredLength>MAX_SOURCE_BYTES)return {status:'source_payload_rejected',source_id:sourceId,excerpts:[]};
  if(!response?.ok)return {status:'source_fetch_failed',source_id:sourceId,http_status:response?.status||null,excerpts:[]};
  let paragraphs=[];
  if(rights.retrieval_method==='plos_jats_xml'){
   const xml=await response.text();
   if(typeof xml!=='string'||Buffer.byteLength(xml,'utf8')>MAX_SOURCE_BYTES)return {status:'source_payload_rejected',source_id:sourceId,excerpts:[]};
   paragraphs=extractPlosParagraphs(xml);
  }else if(rights.retrieval_method==='pmc_bioc_json'){
   let payload;
   if(typeof response.text==='function'){
    const body=await response.text();
    if(typeof body!=='string'||Buffer.byteLength(body,'utf8')>MAX_SOURCE_BYTES)return {status:'source_payload_rejected',source_id:sourceId,excerpts:[]};
    try{payload=JSON.parse(body);}catch{return {status:'source_payload_rejected',source_id:sourceId,excerpts:[]};}
   }else{
    payload=await response.json();
    if(Buffer.byteLength(JSON.stringify(payload??null),'utf8')>MAX_SOURCE_BYTES)return {status:'source_payload_rejected',source_id:sourceId,excerpts:[]};
   }
   paragraphs=extractBioCParagraphs(payload);
  }else{
   const html=await response.text();
   if(typeof html!=='string'||Buffer.byteLength(html,'utf8')>MAX_SOURCE_BYTES)return {status:'source_payload_rejected',source_id:sourceId,excerpts:[]};
   paragraphs=extractHtmlParagraphs(html);
  }
  const excerpts=selectRelevantExcerpts(paragraphs,topic,Math.max(500,Math.min(10000,Number(maxChars)||7000)));
  if(!excerpts.length)return {status:'no_relevant_text',source_id:sourceId,excerpts:[]};
  return {
   status:'completed',
   source:{
    source_id:rights.source_id,title:rights.title,edition:rights.edition,
    url:rights.source_url_prefixes[0],license:rights.license,license_url:rights.license_url,
    rights_holder:rights.rights_holder,evidence_url:rights.evidence_url,tdm_evidence_url:rights.tdm_evidence_url,
    reviewed_at:rights.reviewed_at,review_due_at:rights.review_due_at,attribution:rights.attribution,retrieval_method:rights.retrieval_method,retrieval_url:rights.retrieval_url,status:rights.status,ai_tdm:true,commercial_use:true,derivative_use:true
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
