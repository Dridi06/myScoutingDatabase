import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getMessinhoCanonicalConceptKey,
  formatMessinhoKnowledgeValue,
  buildMessinhoKnowledgeConcept,
  findMessinhoKnowledgeConcepts,
  linkMessinhoKnowledgeConcepts,
  reviewMessinhoKnowledgeConcept,
  storeMessinhoKnowledgeConcept,
  MESSINHO_KNOWLEDGE_LEVELS,
  MESSINHO_KNOWLEDGE_RELATIONS
} from '../backend/messinho-knowledge-graph.js';
import { getMessinhoVerifiedSourceRightsById, verifyMessinhoSourceRights } from '../backend/messinho-rights-registry.js';

const draft={
  domain:'mathematics',topic:'Probability',title:'Bayes theorem',
  definition:'Bayes theorem updates the probability of a hypothesis after observing evidence, using prior probability and likelihood.',
  knowledge_level:'advanced',knowledge_type:'formula',parent_concept_key:'mathematics.probability',
  prerequisites:['mathematics.probability.basics'],formula:'P(A|B)=P(B|A)P(A)/P(B)',
  formula_variables:{A:'hypothesis',B:'observed evidence'},
  claims:[{text:'Bayes theorem combines prior probability and likelihood.',source_urls:['https://one.example/a','https://two.example/b']}],
  sources:[
    {source_id:'unreviewed-a',title:'Source A',url:'https://one.example/a'},
    {source_id:'unreviewed-b',title:'Source B',url:'https://two.example/b'}
  ],
  source_rights:[]
};

test('knowledge graph defines the agreed four learning levels and typed links',()=>{
  assert.deepEqual(MESSINHO_KNOWLEDGE_LEVELS,['foundational','intermediate','advanced','specialist']);
  assert.ok(MESSINHO_KNOWLEDGE_RELATIONS.includes('prerequisite'));
  assert.ok(MESSINHO_KNOWLEDGE_RELATIONS.includes('contradicts'));
});

test('knowledge hierarchy rejects unknown levels and missing prerequisites',()=>{
  assert.equal(buildMessinhoKnowledgeConcept({...draft,knowledge_level:'expert'}).reason,'invalid_knowledge_level');
  assert.equal(buildMessinhoKnowledgeConcept({...draft,parent_concept_key:null,prerequisites:[]}).reason,'learning_dependency_required');
});

test('knowledge concept refuses unreviewed sources even if provider claims rights',()=>{
  const result=buildMessinhoKnowledgeConcept({...draft,sources:draft.sources.map(source=>({...source,rights:{
    source_id:source.source_id,status:'verified_permitted',license:'CC BY 4.0',
    rights_holder:'Claimed holder',evidence_url:'https://example.org/license',
    ai_tdm:true,commercial_use:true,derivative_use:true
  }}))});
  assert.equal(result.eligible,false);
  assert.equal(result.reason,'one_rights_verified_source_required');
});

test('OpenStax content cannot create a candidate without written AI permission',()=>{
  const url='https://assets.openstax.org/oscms-prodcms/media/documents/College-Algebra-2e-WEB.pdf';
  const result=buildMessinhoKnowledgeConcept({
    domain:'mathematics',topic:'Algebra',title:'Linear equations',
    definition:'A linear equation describes a relation in which the unknown variable has degree one.',
    knowledge_level:'foundational',knowledge_type:'concept',
    claims:[{text:'A linear equation has a variable of degree one.',source_urls:[url]}],
    sources:[{source_id:'openstax_college_algebra_2e_2021',title:'College Algebra 2e',url}],
    confidence:0.8
  });
  assert.equal(result.eligible,false);
  assert.equal(result.reason,'one_rights_verified_source_required');
});

test('unapproved one-source candidates cannot be promoted to active knowledge',async()=>{
  const url='https://assets.openstax.org/oscms-prodcms/media/documents/College-Algebra-2e-WEB.pdf';
  const row={
    id:'candidate-1',domain:'mathematics',knowledge_status:'candidate',
    parent_concept_key:null,prerequisites:[],
    sources:[{source_id:'openstax_college_algebra_2e_2021',url}],
    claims:[{text:'Linear equation concept',source_urls:[url]}],
    rights:{status:'verified_permitted',ai_tdm:true,commercial_use:true,derivative_use:true,source_rights:[]}
  };
  const query={select(){return this;},eq(){return this;},async maybeSingle(){return {data:row,error:null};}};
  const db={from(){return query;}};
  const result=await reviewMessinhoKnowledgeConcept(db,{concept_id:'candidate-1',decision:'approve',reason:'Review the evidence before activation',reviewer_id:'admin-1'});
  assert.equal(result.reviewed,false);
  assert.equal(result.reason,'candidate_rights_or_corroboration_incomplete');
});

test('new knowledge candidates preserve rights review deadlines required for Admin approval',()=>{
 const ids=['plos_one_vo2max_prediction_2023','pmc_cardiorespiratory_fitness_2022'];
 const rights=ids.map(id=>getMessinhoVerifiedSourceRightsById(id));
 const urls=[
  'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0280897',
  'https://pmc.ncbi.nlm.nih.gov/articles/PMC11269081/'
 ];
 const result=buildMessinhoKnowledgeConcept({
  domain:'sports_science',topic:'Kardiorespiratorische Fitness',title:'VO2max',
  definition:'VO2max beschreibt die maximale Sauerstoffaufnahme des Körpers unter intensiver körperlicher Belastung und ist ein Maß der kardiorespiratorischen Fitness.',
  knowledge_level:'foundational',knowledge_type:'metric',
  claims:[{text:'VO2max is maximal oxygen uptake.',source_urls:urls}],
  sources:ids.map((source_id,index)=>({source_id,title:'Approved source',url:urls[index]})),
  source_rights:rights,confidence:0.94,evidence_grade:'B'
 });
 assert.equal(result.eligible,true);
 assert.equal(result.record.rights.source_rights.length,2);
 for(const item of result.record.rights.source_rights){
  assert.ok(item.review_due_at,'registry review deadline must be persisted');
  assert.equal(verifyMessinhoSourceRights(item),true,'stored rights snapshot must remain verifiable at approval time');
 }
});

test('retrieves canonical VO2max knowledge in longer player-specific scouting questions',async()=>{
 const row={id:'vo2',concept_key:'sports_science.physiology.vo2max',domain:'sports_science',topic:'Kardiorespiratorische Fitness',
  title:'VO2max maximale Sauerstoffaufnahme',definition:'VO2max beschreibt die maximale Sauerstoffaufnahme des Körpers unter intensiver Belastung und ist ein Maß der kardiorespiratorischen Fitness.',
  applicability:'Im Fußball-Scouting als Baustein zur Einordnung der aeroben Leistungsfähigkeit und Ausdauerbasis.',
  limitations:['Geschätzte Werte sind nicht mit direkter CPET-Messung gleichzusetzen.'],
  knowledge_level:'foundational',knowledge_type:'metric',knowledge_status:'active',version:3,confidence:0.88,sources:[],claims:[]};
 const query={select(fields){assert.match(fields,/knowledge_status/,'the broad projection must include knowledge_status before rank() filters active records');return this;},eq(){return this;},in(column,values){assert.deepEqual(values,['sports_science','general']);return this;},or(){return this;},order(){return this;},async limit(){return {data:[row],error:null};}};
 const links={select(){return this;},async or(){return {data:[],error:null};}};
 const db={from(table){return table==='messinho_knowledge_concepts'?query:links;}};
 const result=await findMessinhoKnowledgeConcepts(db,'Analysiere VO2max meines Spielers für die aerobe Leistungsfähigkeit');
 assert.equal(result.status,'hit');
 assert.equal(result.items[0].concept_key,'sports_science.physiology.vo2max');
});

test('canonical VO2max exact lookup runs even when broad lexical results already contain a row',async()=>{
 const canonical={id:'vo2-exact',concept_key:'sports_science.physiology.vo2max',domain:'sports_science',topic:'Kardiorespiratorische Fitness',
  title:'VO2max',definition:'Maximale Sauerstoffaufnahme',knowledge_level:'foundational',knowledge_type:'metric',
  knowledge_status:'active',version:2,confidence:0.9,sources:[],claims:[],valid_until:null};
 const broad={...canonical,id:'broad-row',concept_key:'sports_science.physiology.other'};
 let exactRequested=false;
 const query={select(){return this;},eq(column,value){if(column==='concept_key'&&value===canonical.concept_key)exactRequested=true;return this;},
  in(){return this;},or(){return this;},order(){return this;},async limit(){return {data:exactRequested?[canonical]:[broad],error:null};}};
 const links={select(){return this;},async or(){return {data:[],error:null};}};
 const db={from(table){return table==='messinho_knowledge_links'?links:query;}};
 const result=await findMessinhoKnowledgeConcepts(db,'Wie kann ich die VO₂max eines Fußballspielers für seine Leistungsbewertung nutzen?');
 assert.equal(exactRequested,true);
 assert.equal(result.items[0].concept_key,canonical.concept_key);
});

test('canonical VO2max exact lookup bypasses a restrictive broad-query validity filter',async()=>{
 const row={id:'vo2',concept_key:'sports_science.physiology.vo2max',domain:'sports_science',topic:'Kardiorespiratorische Fitness',
  title:'VO2max maximale Sauerstoffaufnahme',definition:'VO2max beschreibt die maximale Sauerstoffaufnahme des Körpers unter intensiver Belastung und ist ein Maß der kardiorespiratorischen Fitness.',
  knowledge_level:'foundational',knowledge_type:'metric',knowledge_status:'active',version:1,confidence:0.88,sources:[],claims:[],valid_until:null};
 let exactLookup=false;
 const query={select(fields){assert.match(fields,/knowledge_status/,'both broad and exact projections must include the field used by the active-state guard');return this;},eq(column,value){if(column==='concept_key')exactLookup=value===row.concept_key;return this;},
  in(){return this;},or(){return this;},order(){return this;},
  async limit(){return {data:exactLookup?[row]:[],error:null};}};
 const links={select(){return this;},async or(){return {data:[],error:null};}};
 const db={from(table){return table==='messinho_knowledge_links'?links:query;}};
 const result=await findMessinhoKnowledgeConcepts(db,'Wie kann ich die VO₂max eines Fußballspielers für seine Leistungsbewertung nutzen?');
 assert.equal(result.status,'hit');
 assert.equal(result.items[0].concept_key,row.concept_key);
});

test('canonical VO2max lookup recovers active knowledge when broad lexical ranking misses',async()=>{
 const row={id:'vo2',concept_key:'sports_science.physiology.vo2max',domain:'sports_science',topic:'Kardiorespiratorische Fitness',
  title:'VO2max maximale Sauerstoffaufnahme',definition:'VO2max beschreibt die maximale Sauerstoffaufnahme des Körpers unter intensiver Belastung und ist ein Maß der kardiorespiratorischen Fitness.',
  knowledge_level:'foundational',knowledge_type:'metric',knowledge_status:'active',version:3,confidence:0.88,sources:[],claims:[]};
 let exactLookup=false;
 const query={select(fields){if(exactLookup)assert.match(fields,/concept_key/);return this;},
  eq(column,value){if(column==='concept_key'&&value===row.concept_key)exactLookup=true;return this;},
  in(){return this;},or(){return this;},order(){return this;},
  async limit(){return {data:exactLookup?[row]:[],error:null};}};
 const links={select(){return this;},async or(){return {data:[],error:null};}};
 const db={from(table){return table==='messinho_knowledge_links'?links:query;}};
 const result=await findMessinhoKnowledgeConcepts(db,'Was ist VO₂max? Erkläre mir den Wert, seine physiologische Bedeutung und seine Grenzen.');
 assert.equal(exactLookup,true);
 assert.equal(result.status,'hit');
 assert.equal(result.items[0].concept_key,row.concept_key);
});

test('formats stored knowledge fields whether strings, arrays, or structured objects',()=>{
 assert.equal(formatMessinhoKnowledgeValue('Leistungsdiagnostik und Ausdauer'),'Leistungsdiagnostik und Ausdauer');
 assert.equal(formatMessinhoKnowledgeValue(['Laborwert','Feldtest']),'Laborwert\\n• Feldtest');
 assert.equal(formatMessinhoKnowledgeValue({protocol:'CPET',unit:'ml/kg/min'}),'protocol: CPET\\nunit: ml/kg/min');
 assert.equal(formatMessinhoKnowledgeValue(null),'');
});
test('recognizes canonical VO2max knowledge questions including Unicode subscript aliases',()=>{
 assert.equal(getMessinhoCanonicalConceptKey('Was ist VO₂max? Erkläre mir den Wert, seine physiologische Bedeutung und seine Grenzen.'),'sports_science.physiology.vo2max');
 assert.equal(getMessinhoCanonicalConceptKey('Erkläre die maximale Sauerstoffaufnahme.'),'sports_science.physiology.vo2max');
 assert.equal(getMessinhoCanonicalConceptKey('Analysiere die kardiorespiratorische Fitness.'),'sports_science.physiology.vo2max');
 assert.equal(getMessinhoCanonicalConceptKey('Wie ist die Technik eines Innenverteidigers?'),null);
});
test('knowledge graph does not persist or retrieve without a database',async()=>{
  assert.deepEqual(await storeMessinhoKnowledgeConcept(null,draft),{persisted:false,reason:'storage_unavailable'});
  assert.deepEqual(await findMessinhoKnowledgeConcepts(null,'Bayes theorem'),{status:'unavailable',items:[]});
});

test('knowledge review requires a real database and explicit approved-admin identity',async()=>{
 assert.deepEqual(await reviewMessinhoKnowledgeConcept(null,{concept_id:'concept-1',decision:'approve',reason:'Evidence checked and approved',reviewer_id:'admin-1'}),{reviewed:false,reason:'invalid_review_request'});
});

test('knowledge review wrapper fails closed without database or admin identity',async()=>{
  assert.deepEqual(await reviewMessinhoKnowledgeConcept(null,{concept_id:'x',decision:'approve',reason:'Evidence reviewed',reviewer_id:'admin'}),{reviewed:false,reason:'invalid_review_request'});
  assert.deepEqual(await reviewMessinhoKnowledgeConcept({},{}),{reviewed:false,reason:'invalid_review_request'});
});

test('knowledge graph rejects invalid relationship writes',async()=>{
  assert.deepEqual(await linkMessinhoKnowledgeConcepts(null,{from_concept_id:'a',to_concept_id:'b',relation_type:'invented'}),{linked:false,reason:'invalid_link'});
});

test('retrieves an active VO2max concept from a one-term general question',async()=>{
 const row={id:'vo2',domain:'sports_science',topic:'Kardiorespiratorische Fitness',title:'VO2max maximale Sauerstoffaufnahme',definition:'VO2max beschreibt die maximale Sauerstoffaufnahme des Körpers unter intensiver Belastung und ist ein Maß der kardiorespiratorischen Fitness.',knowledge_level:'foundational',knowledge_type:'metric',knowledge_status:'active',version:1,confidence:0.9,sources:[],claims:[]};
 const query={select(){return this;},eq(){return this;},in(column,values){assert.deepEqual(values,['sports_science','general']);return this;},or(){return this;},order(){return this;},async limit(){return {data:[row],error:null};}};
 const links={select(){return this;},async or(){return {data:[],error:null};}};
 const db={from(table){return table==='messinho_knowledge_concepts'?query:links;}};
 const result=await findMessinhoKnowledgeConcepts(db,'Was ist VO2max?');
 assert.equal(result.status,'hit');
 assert.equal(result.items[0].id,'vo2');
});
