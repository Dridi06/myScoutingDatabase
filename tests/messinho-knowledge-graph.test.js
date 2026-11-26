import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMessinhoKnowledgeConcept,
  findMessinhoKnowledgeConcepts,
  linkMessinhoKnowledgeConcepts,
  reviewMessinhoKnowledgeConcept,
  storeMessinhoKnowledgeConcept,
  MESSINHO_KNOWLEDGE_LEVELS,
  MESSINHO_KNOWLEDGE_RELATIONS
} from '../backend/messinho-knowledge-graph.js';
import { getMessinhoVerifiedSourceRightsForUrl } from '../backend/messinho-rights-registry.js';

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

test('one rights-cleared source can persist only an inactive foundation candidate',()=>{
  const url='https://assets.openstax.org/oscms-prodcms/media/documents/College-Algebra-2e-WEB.pdf';
  const rights=getMessinhoVerifiedSourceRightsForUrl(url);
  const result=buildMessinhoKnowledgeConcept({
    domain:'mathematics',topic:'Algebra',title:'Linear equations',
    definition:'A linear equation describes a relation in which the unknown variable has degree one.',
    knowledge_level:'foundational',knowledge_type:'concept',
    claims:[{text:'A linear equation has a variable of degree one.',source_urls:[url]}],
    sources:[{source_id:rights.source_id,title:'College Algebra 2e',url,rights}],
    confidence:0.8
  });
  assert.equal(result.eligible,true);
  assert.equal(result.record.knowledge_status,'candidate');
  assert.equal(result.record.rights.verified_source_count,1);
  assert.equal(result.record.sources[0].license,'CC BY 4.0');
  assert.equal(result.record.sources[0].license_url,'https://creativecommons.org/licenses/by/4.0/');
  assert.ok(result.record.sources[0].attribution);
});

test('one-source candidates cannot be promoted to active knowledge',async()=>{
  const url='https://assets.openstax.org/oscms-prodcms/media/documents/College-Algebra-2e-WEB.pdf';
  const rights=getMessinhoVerifiedSourceRightsForUrl(url);
  const row={
    id:'candidate-1',domain:'mathematics',knowledge_status:'candidate',
    parent_concept_key:null,prerequisites:[],
    sources:[{source_id:rights.source_id,url}],
    claims:[{text:'Linear equation concept',source_urls:[url]}],
    rights:{status:'verified_permitted',ai_tdm:true,commercial_use:true,derivative_use:true,source_rights:[rights]}
  };
  const query={select(){return this;},eq(){return this;},async maybeSingle(){return {data:row,error:null};}};
  const db={from(){return query;}};
  const result=await reviewMessinhoKnowledgeConcept(db,{concept_id:'candidate-1',decision:'approve',reason:'Review the evidence before activation',reviewer_id:'admin-1'});
  assert.equal(result.reviewed,false);
  assert.equal(result.reason,'candidate_rights_or_corroboration_incomplete');
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
