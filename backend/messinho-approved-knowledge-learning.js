import { fetchMessinhoApprovedSource } from './messinho-approved-source-ingestion.js';
import { storeMessinhoKnowledgeConcept } from './messinho-knowledge-graph.js';
import { isMessinhoGeneralClaimCorroborated } from './messinho-general-research.js';

const VO2MAX_TOPIC=/\b(vo\s*[₂2]\s*max|vo2max|vo₂max|maximale sauerstoffaufnahme|kardiorespiratorische fitness|cardiorespiratory fitness)\b/i;
const MATRIX_TOPIC=/\b(matrixmultiplikation|matrix multiplication|matrix product|matrizenmultiplikation)\b/i;
const EXCLUDED_CONTEXT=/\b(?:spieler|player|vergleich|vergleiche|analysiere|berechne|prognose|mein(?:e|en)?|bei mir|ich habe)\b/i;
const GENERAL_QUESTION=/^(?:was ist|was bedeutet|erkl[aä]re(?: mir)?|wie funktioniert|definition|grundlagen|einf[uü]hrung|what is|how does|define)\b/i;

const FOUNDATION_CONFIGS=Object.freeze([
 {
  concept_key:'sports_science.physiology.vo2max',
  source_ids:['plos_one_vo2max_prediction_2023','pmc_cardiorespiratory_fitness_2022'],
  topic:'Kardiorespiratorische Fitness',
  title:'VO₂max (maximale Sauerstoffaufnahme)',
  search_topic:'VO2max maximal oxygen uptake cardiorespiratory fitness',
  match:VO2MAX_TOPIC,
  aliases:['vo2max','vo₂max','maximale sauerstoffaufnahme','kardiorespiratorische fitness','cardiorespiratory fitness'],
  claim:'VO2max is maximal oxygen uptake and an objective measure of cardiorespiratory fitness.',
  answer:'VO₂max bezeichnet die maximale Sauerstoffaufnahme des Körpers unter intensiver Belastung. Sie ist ein objektiver Messwert und gilt als Goldstandard zur Beurteilung der kardiorespiratorischen Fitness. Im Fußball-Scouting ist sie ein Baustein zur Einordnung der aeroben Leistungsfähigkeit, aber kein alleiniger Maßstab für die Gesamtqualität eines Spielers. Geschätzte Werte sind nicht mit einer direkten Spiroergometrie/CPET-Messung gleichzusetzen.',
  definition:'VO₂max bezeichnet die maximale Sauerstoffaufnahme des Körpers unter intensiver Belastung. Sie ist ein objektiver Messwert der kardiorespiratorischen Fitness und wird in der Fachliteratur als deren Goldstandard-Messgröße verwendet.',
  knowledge_type:'metric',
  applicability:'Im Fußball-Scouting als ein Baustein zur Einordnung der aeroben Leistungsfähigkeit und Ausdauerbasis. Der Wert muss zusammen mit Alter, Geschlecht, Körpermasse, Trainingsstatus, Testverfahren und sportartspezifischen Anforderungen interpretiert werden.',
  limitations:[
   'Ein geschätzter VO₂max-Wert ist nicht mit einer direkt gemessenen Spiroergometrie/CPET gleichzusetzen.',
   'Vorhersagegleichungen können je nach Alter, Trainingsniveau und Testmodalität deutlich abweichen.',
   'VO₂max allein beschreibt weder die gesamte Fußballleistung noch taktische, technische oder positionsspezifische Qualität.',
   'Gesundheitliche Schlussfolgerungen dürfen nicht allein aus einem einzelnen Fitnesswert gezogen werden.'
  ],
  evidence_grade:'B',
  confidence:0.88
 },
 {
  concept_key:'mathematics.linear_algebra.matrix_multiplication',
  source_ids:['libretexts_kuttler_matrix_multiplication_2023','austin_matrix_multiplication_2023'],
  topic:'Lineare Algebra',
  title:'Matrixmultiplikation',
  search_topic:'matrix multiplication matrix product matrices columns rows linear algebra',
  match:MATRIX_TOPIC,
  aliases:['matrixmultiplikation','matrix multiplication','matrix product','matrizenmultiplikation'],
  claim:'Matrix multiplication is defined when the number of columns in the first matrix equals the number of rows in the second; the product has the first matrix row count and the second matrix column count.',
  answer:'Matrixmultiplikation ist die Verknüpfung zweier Matrizen. Sie ist genau dann definiert, wenn die Spaltenzahl der ersten Matrix der Zeilenzahl der zweiten entspricht. Hat A die Größe m×n und B die Größe n×p, dann besitzt das Produkt A·B die Größe m×p. Jeder Eintrag entsteht aus dem Skalarprodukt einer Zeile von A mit einer Spalte von B. Wichtig: Im Allgemeinen gilt A·B ≠ B·A.',
  definition:'Für das Produkt A·B muss die Spaltenzahl von A mit der Zeilenzahl von B übereinstimmen. Hat A die Dimension m×n und B die Dimension n×p, dann hat A·B die Dimension m×p. Jeder Eintrag entsteht als Summe der Produkte aus der passenden Zeile von A und Spalte von B.',
  knowledge_type:'formula',
  formula:'(AB)_{ij} = Σ_{k=1}^{n} A_{ik} · B_{kj}',
  formula_variables:{
   A:'erste Matrix mit m Zeilen und n Spalten',
   B:'zweite Matrix mit n Zeilen und p Spalten',
   AB:'Produktmatrix mit m Zeilen und p Spalten',
   i:'Zeilenindex der Produktmatrix',
   j:'Spaltenindex der Produktmatrix',
   k:'Summationsindex über die gemeinsame Dimension'
  },
  applicability:'Grundlage für lineare Modelle, Gewichtungsmatrizen, Feature-Vektoren, Daten- und Koordinatentransformationen sowie Machine-Learning-Verfahren. Im Scouting kann sie helfen, strukturierte Spielerkennzahlen und Bewertungsmodelle mathematisch korrekt zu verknüpfen.',
  limitations:[
   'Die inneren Dimensionen müssen übereinstimmen; andernfalls ist das Produkt nicht definiert.',
   'Matrixmultiplikation ist im Allgemeinen nicht kommutativ: A·B ist nicht automatisch gleich B·A.',
   'Matrixmultiplikation ist nicht dasselbe wie elementweise Multiplikation.',
   'Bei großen numerischen Berechnungen müssen Rundungsfehler und numerische Stabilität berücksichtigt werden.'
  ],
  evidence_grade:'B',
  confidence:0.94
 }
]);

function resolveConfig(question){
 const text=String(question??'').trim();
 if(!text||EXCLUDED_CONTEXT.test(text))return null;
 const config=FOUNDATION_CONFIGS.find(item=>item.match.test(text));
 if(!config)return null;
 const normalized=text.toLocaleLowerCase('de-DE').replace(/[?.! ]+$/,'').trim();
 const directTopic=config.aliases.includes(normalized);
 if(!GENERAL_QUESTION.test(text)&&!directTopic)return null;
 return config;
}
export function isMessinhoApprovedFoundationTopic(question){
 return Boolean(resolveConfig(question));
}

export async function learnMessinhoApprovedFoundationConcept(db,question,{fetchImpl=globalThis.fetch}={}){
 const config=resolveConfig(question);
 if(!config)return {status:'not_applicable'};
 if(!db)return {status:'storage_unavailable'};
 const retrieved=await Promise.all(config.source_ids.map(source_id=>
  fetchMessinhoApprovedSource(source_id,{topic:config.search_topic,fetchImpl})
 ));
 if(retrieved.some(item=>item.status!=='completed'))return {
  status:'insufficient_approved_sources',
  source_status:retrieved.map(item=>({source_id:item.source_id,status:item.status}))
 };
 const sources=retrieved.map(item=>({
  ...item.source,
  rights:item.source,
  publisher:new URL(item.source.url).hostname,
  snippet:item.excerpts.map(excerpt=>excerpt.text).join(' ').slice(0,7000),
  section:item.excerpts.map(excerpt=>excerpt.source_section).filter(Boolean).join(', ')
 }));
 const claim={
  text:config.claim,
  source_urls:sources.map(source=>source.url)
 };
 if(!isMessinhoGeneralClaimCorroborated(claim,sources))return {status:'insufficient_corroboration',source_count:sources.length};
 const concept={
  concept_key:config.concept_key,
  domain:config.concept_key.split('.')[0],
  topic:config.topic,
  title:config.title,
  definition:config.definition,
  knowledge_level:'foundational',
  knowledge_type:config.knowledge_type,
  formula:config.formula||null,
  formula_variables:config.formula_variables||{},
  applicability:config.applicability,
  limitations:config.limitations,
  claims:[claim],
  sources,
  source_rights:sources,
  evidence_grade:config.evidence_grade,
  confidence:config.confidence
 };
 const stored=await storeMessinhoKnowledgeConcept(db,concept);
 return {
  status:stored.persisted?'candidate_created':stored.reason==='already_exists'?'already_present':'candidate_not_stored',
  stored,
  concept_key:config.concept_key,
  concept_title:config.title,
  answer:config.answer,
  source_count:sources.length,
  source_ids:sources.map(source=>source.source_id),
  source_references:sources.map(source=>({title:source.title,url:source.url,license:source.license,attribution:source.attribution})),
  active:false,
  approval_required:true,
  storage_policy:'compact_original_knowledge_only'
 };
}


/**
 * A recognized foundation topic must not silently fall through to generic
 * external research when the approved-source learning path fails.
 */
export function shouldBlockMessinhoFoundationResearchFallback(result){
 return Boolean(result&&result.status!=='not_applicable'&&result.status!=='candidate_created');
}
