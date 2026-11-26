import { fetchMessinhoApprovedSource } from './messinho-approved-source-ingestion.js';
import { storeMessinhoKnowledgeConcept } from './messinho-knowledge-graph.js';
import { getMessinhoVerifiedSourceRightsById } from './messinho-rights-registry.js';
import { isMessinhoGeneralClaimCorroborated } from './messinho-general-research.js';

const VO2MAX_SOURCE_IDS=Object.freeze([
 'plos_one_vo2max_prediction_2023',
 'pmc_cardiorespiratory_fitness_2022'
]);
const VO2MAX_TOPIC=/\b(vo\s*[₂2]\s*max|vo2max|vo₂max|maximale sauerstoffaufnahme|kardiorespiratorische fitness|cardiorespiratory fitness)\b/i;

export function isMessinhoApprovedFoundationTopic(question){
 return VO2MAX_TOPIC.test(String(question??''));
}

export async function learnMessinhoApprovedFoundationConcept(db,question,{fetchImpl=globalThis.fetch}={}){
 if(!isMessinhoApprovedFoundationTopic(question))return {status:'not_applicable'};
 if(!db)return {status:'storage_unavailable'};
 const retrieved=await Promise.all(VO2MAX_SOURCE_IDS.map(source_id=>
  fetchMessinhoApprovedSource(source_id,{topic:'VO2max maximal oxygen uptake cardiorespiratory fitness',fetchImpl})
 ));
 if(retrieved.some(item=>item.status!=='completed'))return {
  status:'insufficient_approved_sources',
  source_status:retrieved.map(item=>({source_id:item.source_id,status:item.status}))
 };
 const sources=retrieved.map(item=>({
  ...item.source,
  rights:getMessinhoVerifiedSourceRightsById(item.source.source_id),
  retrieval_method:item.retrieval_method,
  retrieval_url:getMessinhoVerifiedSourceRightsById(item.source.source_id)?.retrieval_url||null,
  publisher:new URL(item.source.url).hostname,
  snippet:item.excerpts.map(excerpt=>excerpt.text).join(' ').slice(0,7000),
  section:item.excerpts.map(excerpt=>excerpt.source_section).filter(Boolean).join(', ')
 }));
 const claim={
  text:'VO2max is maximal oxygen uptake and an objective measure of cardiorespiratory fitness.',
  source_urls:sources.map(source=>source.url)
 };
 if(!isMessinhoGeneralClaimCorroborated(claim,sources))return {status:'insufficient_corroboration',source_count:sources.length};
 const concept={
  concept_key:'sports_science.physiology.vo2max',
  domain:'sports_science',
  topic:'Kardiorespiratorische Fitness',
  title:'VO₂max (maximale Sauerstoffaufnahme)',
  definition:'VO₂max bezeichnet die maximale Sauerstoffaufnahme des Körpers unter intensiver Belastung. Sie ist ein objektiver Messwert der kardiorespiratorischen Fitness und wird in der Fachliteratur als deren Goldstandard-Messgröße verwendet.',
  knowledge_level:'foundational',
  knowledge_type:'metric',
  applicability:'Im Fußball-Scouting als ein Baustein zur Einordnung der aeroben Leistungsfähigkeit und Ausdauerbasis. Der Wert muss zusammen mit Alter, Geschlecht, Körpermasse, Trainingsstatus, Testverfahren und sportartspezifischen Anforderungen interpretiert werden.',
  limitations:[
   'Ein geschätzter VO₂max-Wert ist nicht mit einer direkt gemessenen Spiroergometrie/CPET gleichzusetzen.',
   'Vorhersagegleichungen können je nach Alter, Trainingsniveau und Testmodalität deutlich abweichen.',
   'VO₂max allein beschreibt weder die gesamte Fußballleistung noch taktische, technische oder positionsspezifische Qualität.',
   'Gesundheitliche Schlussfolgerungen dürfen nicht allein aus einem einzelnen Fitnesswert gezogen werden.'
  ],
  claims:[claim],
  sources,
  source_rights:sources,
  evidence_grade:'B',
  confidence:0.88
 };
 const stored=await storeMessinhoKnowledgeConcept(db,concept);
 return {
  status:stored.persisted?'candidate_created':stored.reason==='already_exists'?'already_present':'candidate_not_stored',
  stored,
  source_count:sources.length,
  source_ids:sources.map(source=>source.source_id),
  source_references:sources.map(source=>({title:source.title,url:source.url,license:source.license,attribution:source.attribution})),
  active:false,
  approval_required:true,
  storage_policy:'compact_original_knowledge_only'
 };
}
