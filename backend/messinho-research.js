/**
 * MESSINHO external research: evidence-first market-value assessment.
 * Tavily supplies attributable public search results; OpenAI only structures and
 * interprets that evidence. No FUSSBALL.DE scraping or unsupported value claims.
 */
const clean=(v,max=500)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.toString():null;}catch{return null;}};
const num=value=>value===null||value===undefined||value===''?null:(Number.isFinite(Number(value))?Number(value):null);
export function validateResearchInput(input={}){
 const name=clean(input.name,120),club=clean(input.club,120),league=clean(input.league,100),position=clean(input.position,80);
 const birthYear=num(input.birthYear);
 if(name.length<2)throw new Error('Bitte einen Spielernamen angeben.');
 if(birthYear!==null&&(birthYear<1980||birthYear>new Date().getFullYear()))throw new Error('Ungültiger Geburtsjahrgang.');
 return {name,club,league,position,birthYear:Number.isInteger(birthYear)?birthYear:null};
}
export function normalizeResearchSources(results=[]){
 const seen=new Set();return (Array.isArray(results)?results:[]).flatMap(row=>{
  const url=safeUrl(row?.url);if(!url||seen.has(url))return[];seen.add(url);
  let publisher='Unbekannt';try{publisher=new URL(url).hostname.replace(/^www\./,'');}catch{}
  // Do not query or ingest the FUSSBALL.DE portal until written permission exists.
  if(/(^|\.)fussball\.de$/i.test(publisher))return[];
  return [{title:clean(row.title,240),url,publisher,published_date:clean(row.published_date||row.publishedDate,40)||null,snippet:clean(row.content||row.snippet,1400)}];
 }).slice(0,15);
}
export function assessMarketValueOutput(output={},sources=[]){
 const raw=Array.isArray(output.comparables)?output.comparables:[];
 const sourceUrls=new Set(sources.map(s=>s.url));
 const comparables=raw.flatMap(item=>{
  const url=safeUrl(item?.source_url),value=num(item?.reported_value_eur);
  if(!url||!sourceUrls.has(url)||value===null||value<=0||value>500000000)return[];
  return [{player:clean(item.player,120),reported_value_eur:Math.round(value),source_url:url,context:clean(item.context,240)}];
 }).slice(0,20);
 const distinct=new Set(comparables.map(x=>x.player.toLocaleLowerCase()).filter(Boolean));
 const enough=comparables.length>=3&&distinct.size>=3;
 const low=num(output.estimated_value_low_eur),high=num(output.estimated_value_high_eur);
 const supported=enough&&low!==null&&high!==null&&low>0&&high>=low&&high<=500000000;
 return {
  official_market_value:output.official_market_value&&typeof output.official_market_value==='object'&&num(output.official_market_value.value_eur)>0&&sourceUrls.has(safeUrl(output.official_market_value.source_url))?{
   value_eur:Math.round(num(output.official_market_value.value_eur)),source_url:safeUrl(output.official_market_value.source_url),label:clean(output.official_market_value.label,160)
  }:null,
  estimated_value:supported?{low_eur:Math.round(low),high_eur:Math.round(high),currency:'EUR',method:'evidence_based_comparable_range'}:null,
  comparables,
  confidence:supported?clean(output.confidence,40):'insufficient_data',
  rationale:clean(output.rationale,1600),
  missing_data:Array.isArray(output.missing_data)?output.missing_data.map(x=>clean(x,120)).slice(0,10):[],
  limitations:['Eine KI-Schätzung ist kein offizieller Marktwert.','Vergleichswerte müssen aus den verlinkten Quellen überprüft werden.','Ohne mindestens drei unterschiedliche, belegte Vergleichsspieler wird keine Wertspanne ausgegeben.']
 };
}
export async function researchMessinhoMarketValue(input,env=process.env,fetchImpl=fetch){
 const player=validateResearchInput(input);
 if(!env.TAVILY_API_KEY||!env.OPENAI_API_KEY)return {status:'provider_not_configured',player,sources:[],market_value:null,message:'TAVILY_API_KEY und OPENAI_API_KEY müssen serverseitig konfiguriert sein.'};
 const query=[player.name,player.club,player.league,player.position,player.birthYear].filter(Boolean).join(' ')+' football player transfer fee market value comparable players statistics';
 const searchResponse=await fetchImpl('https://api.tavily.com/search',{method:'POST',signal:AbortSignal.timeout(25000),headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:env.TAVILY_API_KEY,query,search_depth:'advanced',max_results:12,include_answer:false,include_raw_content:false,topic:'general'})});
 if(!searchResponse.ok)throw new Error('Externe Quellensuche ist derzeit nicht verfügbar.');
 const search=await searchResponse.json();
 const sources=normalizeResearchSources(search.results||[]);
 if(!sources.length)return {status:'insufficient_sources',player,sources:[],market_value:null,message:'Keine geeigneten, zulässigen Quellen gefunden.'};
 const prompt={player,sources:sources.map(({title,url,publisher,published_date,snippet})=>({title,url,publisher,published_date,snippet})),instructions:[
  'Use ONLY the supplied source material. Never invent facts, statistics, transfer fees or market values.',
  'Official market value must be explicitly published in a supplied source and linked to that exact source.',
  'Comparable values must be explicitly reported in supplied sources, be for different players, and each cite source_url from supplied sources.',
  'Give an estimated range only when at least three distinct comparable players with reported numeric EUR values are present.',
  'Do not treat transfer fees, salary, release clauses or asking prices as market values; label context clearly.',
  'Do not use or cite fussball.de. Distinguish verified facts from interpretation.',
  'Return JSON only with keys official_market_value, estimated_value_low_eur, estimated_value_high_eur, comparables, confidence, rationale, missing_data.'
 ]};
 const aiResponse=await fetchImpl('https://api.openai.com/v1/chat/completions',{method:'POST',signal:AbortSignal.timeout(35000),headers:{Authorization:'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:env.OPENAI_MODEL||'gpt-4.1-mini',temperature:0,response_format:{type:'json_object'},messages:[{role:'system',content:'You are MESSINHO research analyst. Evidence only. Never fabricate. Output valid JSON.'},{role:'user',content:JSON.stringify(prompt)}]})});
 if(!aiResponse.ok)throw new Error('OpenAI-Analyse ist derzeit nicht verfügbar.');
 const ai=await aiResponse.json();
 const content=ai.choices?.[0]?.message?.content;
 let parsed;try{parsed=JSON.parse(content||'{}');}catch{throw new Error('Die Recherche lieferte kein gültiges Analyseformat.');}
 const marketValue=assessMarketValueOutput(parsed,sources);
 return {status:'completed',player,market_value:marketValue,sources,provider:{search:'Tavily',analysis:env.OPENAI_MODEL||'gpt-4.1-mini'},researched_at:new Date().toISOString()};
}

export async function researchMessinhoPlayerProfile(name,env=process.env,fetchImpl=fetch){
 const query=clean(name,120);
 if(query.length<2)throw new Error('Bitte einen Spielernamen angeben.');
 if(!env.TAVILY_API_KEY)return {status:'provider_not_configured',player:{name:query},sources:[],profile:null,message:'TAVILY_API_KEY ist serverseitig nicht konfiguriert.'};
 const response=await fetchImpl('https://api.tavily.com/search',{method:'POST',signal:AbortSignal.timeout(25000),headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:env.TAVILY_API_KEY,query:query+' footballer player profile current club position career statistics appearances goals 2025 2026',search_depth:'advanced',max_results:10,include_answer:false,include_raw_content:false,topic:'general'})});
 if(!response.ok)throw new Error('Spielerrecherche ist derzeit nicht verfügbar.');
 const payload=await response.json(),sources=normalizeResearchSources(payload.results||[]);
 if(!sources.length)return {status:'insufficient_sources',player:{name:query},sources:[],profile:null,message:'Ich habe keine ausreichend geeigneten öffentlichen Quellen gefunden.'};
 let profile=null;
 if(env.OPENAI_API_KEY){
  const prompt={requested_player:query,sources:sources.map(({title,url,publisher,published_date,snippet})=>({title,url,publisher,published_date,snippet})),instructions:[
   'Identify whether sources refer to the requested football player. Do not assume identity from name alone.',
   'If the requested name appears misspelled, suggest a correction only when sources clearly support it; explain the correction.',
   'Summarize only supported facts: full name, birth date/year, nationality, position, current club, career highlights, recent performance/statistics when explicitly reported.',
   'Do not invent missing data. Use null for unknown facts. Every factual item must cite one or more exact source URLs from the supplied list.',
   'Mention source dates and distinguish current from historical information.',
   'Return JSON with keys identity_status, corrected_name, summary, facts, career, recent_performance, missing_data.'
  ]};
  const aiResponse=await fetchImpl('https://api.openai.com/v1/chat/completions',{method:'POST',signal:AbortSignal.timeout(35000),headers:{Authorization:'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:env.OPENAI_MODEL||'gpt-4.1-mini',temperature:0,response_format:{type:'json_object'},messages:[{role:'system',content:'You are MESSINHO, a careful football scouting conversational assistant. Evidence only. Never fabricate. Output JSON.'},{role:'user',content:JSON.stringify(prompt)}]})});
  if(aiResponse.ok){const ai=await aiResponse.json();try{profile=JSON.parse(ai.choices?.[0]?.message?.content||'{}');}catch{profile=null;}}
 }
 return {status:'completed',player:{name:query},profile,sources,provider:{search:'Tavily',analysis:profile?(env.OPENAI_MODEL||'gpt-4.1-mini'):'source_only'},researched_at:new Date().toISOString()};
}
