/**
 * MESSINHO Linguistic Knowledge Base access layer.
 * Reads only current, active, first-party authored language entries.
 * Database versions are append-only; no chat role can write or activate knowledge.
 */
import { analyzeMessinhoLanguage, buildMessinhoLinguisticContext, MESSINHO_LANGUAGE_PROFILES, normalizeMessinhoArabicForAnalysis } from './messinho-linguistic-intelligence.js';

const VERSION = '1.2.1';
const STOP = new Set('der die das ein eine und oder aber nicht bitte danke ich du er sie wir ihr ist sind the a an and or but not please thanks i you he she we they is are was have be le la les un une et ou mais pas ne merci je tu il elle nous vous el los las una y pero por favor gracias yo tú él ella من في على إلى عن هو هي نحن انت أنا و أو لكن لا نعم كيف ماذا لماذا متى أين'.split(' '));
const norm = value => normalizeMessinhoArabicForAnalysis(
  String(value ?? '').normalize('NFKC').toLocaleLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss')
).replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const expandToken = token => {
  const variants=[token];
  if(token.length>=6) {
    for(const suffix of ['en','er','es','e','n','s']) {
      if(token.endsWith(suffix)&&token.length-suffix.length>=4)variants.push(token.slice(0,-suffix.length));
    }
  }
  return variants;
};
const tokens = value => [...new Set(norm(value).split(' ').filter(token=>token.length>1 && !STOP.has(token)).flatMap(expandToken))];

function scoreEntry(queryTokens, row, languageIds) {
  const content = row.content && typeof row.content==='object' ? row.content : {};
  const corpus = [row.entry_key,row.topic,row.title,...(row.tags||[]),content.explanation||'',
    ...(Array.isArray(content.aliases)?content.aliases:[]),
    ...(Array.isArray(content.terms)?content.terms.flatMap(item=>[item.term,item.meaning_de,item.transliteration]):[]),
    ...(Array.isArray(content.examples)?content.examples.flatMap(item=>[item.text,item.meaning,item.note,item.intent]):[]),
    ...(Array.isArray(content.common_errors)?content.common_errors:[]),
    ...(Array.isArray(content.learning_objectives)?content.learning_objectives:[]),
    ...(Array.isArray(content.review_questions)?content.review_questions:[]),
    ...(Array.isArray(content.grammar_notes)?content.grammar_notes:[]),
    ...(Array.isArray(content.usage_notes)?content.usage_notes:[])
  ].join(' ');
  const entryTokens = new Set(tokens(corpus));
  const overlap = queryTokens.filter(token=>entryTokens.has(token)).length;
  const anchor = queryTokens.some(token=>norm(row.entry_key).split(' ').includes(token));
  const score = overlap / Math.max(1,Math.min(queryTokens.length,entryTokens.size));
  const languageMatch = languageIds.has(row.language_code) ? 1 : 0;
  return {row,score:score+(anchor?0.3:0)+(languageMatch?0.08:0),overlap};
}

export async function findMessinhoLanguageKnowledge(db, message, history=[]) {
  const detection = analyzeMessinhoLanguage(message);
  const linguisticContext = buildMessinhoLinguisticContext(message,history);
  const languageId = detection.primary_language;
  const languageIds = new Set([
    ...(languageId?[languageId]:[]),
    ...linguisticContext.segments.map(segment=>segment.language_analysis?.primary_language).filter(Boolean)
  ]);
  const queryTokens = tokens([message,...(Array.isArray(history)?history.slice(-3).map(item=>item?.text||''):[])].join(' '));
  if (!db) return {status:'unavailable',version:VERSION,language_id:languageId,language_ids:[...languageIds],items:[]};
  try {
    const {data,error}=await db.from('messinho_language_knowledge')
      .select('entry_key,version,language_code,entry_type,topic,title,content,tags,level,knowledge_status,provenance_type,created_at')
      .eq('knowledge_status','active').order('version',{ascending:false}).limit(500);
    if(error)throw error;
    const latest=new Map();
    for(const row of data||[]) {
      if(!latest.has(row.entry_key))latest.set(row.entry_key,row);
    }
    const ranked=[...latest.values()].filter(row=>row.language_code==='shared'||languageIds.has(row.language_code))
      .map(row=>scoreEntry(queryTokens,row,languageIds))
      .filter(item=>item.overlap>0)
      .sort((a,b)=>b.score-a.score||b.overlap-a.overlap);
    let selected;
    if(languageIds.size<=1) {
      selected=ranked.slice(0,8);
    } else {
      // Round-robin up to three entries per language, then include shared
      // foundations. This prevents one dominant segment from crowding out others.
      selected=[];
      const groups=new Map([...languageIds].map(language=>[
        language,ranked.filter(item=>item.row.language_code===language)
      ]));
      for(let round=0;round<3&&selected.length<6;round++) {
        for(const language of languageIds) {
          if(selected.length>=6)break;
          const item=groups.get(language)?.[round];
          if(item)selected.push(item);
        }
      }
      selected.push(...ranked.filter(item=>item.row.language_code==='shared').slice(0,Math.max(0,8-selected.length)));
      for(const item of ranked) {
        if(selected.length>=8)break;
        const languageCount=selected.filter(existing=>existing.row.language_code===item.row.language_code).length;
        if(languageCount>=3)continue;
        if(!selected.some(existing=>existing.row.entry_key===item.row.entry_key))selected.push(item);
      }
    }
    const items=selected.slice(0,8).map(({row,score})=>({...row,relevance:Number(score.toFixed(3))}));
    return {status:items.length?'hit':'miss',version:VERSION,language_id:languageId,language_ids:[...languageIds],items,
      policy:'active_first_party_authored_entries_only'};
  } catch(error) {
    console.warn('MESSINHO language knowledge lookup unavailable:',error.code||error.message||'unknown');
    return {status:'unavailable',version:VERSION,language_id:languageId,language_ids:[...languageIds],items:[]};
  }
}

export function formatMessinhoLanguageKnowledge(context) {
  if(!context||!Array.isArray(context.items))return [];
  return context.items.slice(0,8).map(item=>({
    language:item.language_code,
    type:item.entry_type,
    topic:item.topic,
    title:item.title,
    explanation:item.content?.explanation||'',
    examples:item.content?.examples||[],
    terms:item.content?.terms||[],
    grammar_notes:item.content?.grammar_notes||[],
    common_errors:item.content?.common_errors||[],
    learning_objectives:item.content?.learning_objectives||[],
    review_questions:item.content?.review_questions||[],
    usage_notes:item.content?.usage_notes||[],
    aliases:item.content?.aliases||[],
    level:item.level,
    version:item.version,
    provenance:item.provenance_type
  }));
}

export function getMessinhoLanguageKnowledgeSummary() {
  return {version:VERSION,profiles:MESSINHO_LANGUAGE_PROFILES.map(item=>({id:item.id,name:item.name})),
    supported_entry_types:['grammar','lexicon','pragmatics','conversation'],
    retention:'append_only_versions',
    activation:'migration_seeded_first_party_content_only',
    write_access:'none_from_chat_or_scout_roles'};
}
