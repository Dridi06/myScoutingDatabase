/**
 * MESSINHO Linguistic Knowledge Base access layer.
 * Reads only current, active, first-party authored language entries.
 * Database versions are append-only; no chat role can write or activate knowledge.
 */
import { analyzeMessinhoLanguage, MESSINHO_LANGUAGE_PROFILES } from './messinho-linguistic-intelligence.js';

const VERSION = '1.0.0';
const STOP = new Set('der die das ein eine und oder aber nicht bitte danke ich du er sie wir ihr ist sind the a an and or but not please thanks i you he she we they is are was have be le la les un une et ou mais pas ne merci je tu il elle nous vous el los las una y pero por favor gracias yo tú él ella من في على إلى عن هو هي نحن انت أنا و أو لكن لا نعم كيف ماذا لماذا متى أين'.split(' '));
const norm = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const tokens = value => [...new Set(norm(value).split(' ').filter(token=>token.length>1 && !STOP.has(token)))];

function scoreEntry(queryTokens, row, languageId) {
  const content = row.content && typeof row.content==='object' ? row.content : {};
  const corpus = [row.entry_key,row.topic,row.title,...(row.tags||[]),content.explanation||'',
    ...(Array.isArray(content.aliases)?content.aliases:[]),
    ...(Array.isArray(content.terms)?content.terms.flatMap(item=>[item.term,item.meaning_de,item.transliteration]):[]),
    ...(Array.isArray(content.examples)?content.examples.flatMap(item=>[item.text,item.meaning,item.note]):[])
  ].join(' ');
  const entryTokens = new Set(tokens(corpus));
  const overlap = queryTokens.filter(token=>entryTokens.has(token)).length;
  const anchor = queryTokens.some(token=>norm(row.entry_key).split(' ').includes(token));
  const score = overlap / Math.max(1,Math.min(queryTokens.length,entryTokens.size));
  const languageMatch = row.language_code===languageId ? 1 : 0;
  return {row,score:score+(anchor?0.3:0)+(languageMatch?0.08:0),overlap};
}

export async function findMessinhoLanguageKnowledge(db, message, history=[]) {
  const detection = analyzeMessinhoLanguage(message);
  const languageId = detection.primary_language;
  const queryTokens = tokens([message,...(Array.isArray(history)?history.slice(-3).map(item=>item?.text||''):[])].join(' '));
  if (!db) return {status:'unavailable',version:VERSION,language_id:languageId,items:[]};
  try {
    const {data,error}=await db.from('messinho_language_knowledge')
      .select('entry_key,version,language_code,entry_type,topic,title,content,tags,level,knowledge_status,provenance_type,created_at')
      .eq('knowledge_status','active').order('version',{ascending:false}).limit(500);
    if(error)throw error;
    const latest=new Map();
    for(const row of data||[]) {
      if(!latest.has(row.entry_key))latest.set(row.entry_key,row);
    }
    const candidates=[...latest.values()].filter(row=>row.language_code==='shared'||(Boolean(languageId)&&row.language_code===languageId))
      .map(row=>scoreEntry(queryTokens,row,languageId))
      .filter(item=>item.overlap>0)
      .sort((a,b)=>b.score-a.score||b.overlap-a.overlap)
      .slice(0,8);
    const items=candidates.map(({row,score})=>({...row,relevance:Number(score.toFixed(3))}));
    return {status:items.length?'hit':'miss',version:VERSION,language_id:languageId,items,
      policy:'active_first_party_authored_entries_only'};
  } catch(error) {
    console.warn('MESSINHO language knowledge lookup unavailable:',error.code||error.message||'unknown');
    return {status:'unavailable',version:VERSION,language_id:languageId,items:[]};
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
