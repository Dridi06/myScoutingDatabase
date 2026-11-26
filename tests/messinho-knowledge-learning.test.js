import test from 'node:test';
import assert from 'node:assert/strict';
import { learnMessinhoKnowledgeFromResearch } from '../backend/messinho-knowledge-learning.js';

const plosUrl='https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0280897';
const pmcUrl='https://pmc.ncbi.nlm.nih.gov/articles/PMC11269081/';
const question='Was ist VO2max und was sagt sie über cardiorespiratorische Fitness aus?';
const research={
  status:'completed',
  question,
  answer:'VO2max is a widely used measure of cardiorespiratory fitness and aerobic capacity.',
  answer_mode:'evidence_synthesized',
  claims:[{
    text:'VO2max is a widely used measure of cardiorespiratory fitness and aerobic capacity.',
    source_urls:[plosUrl,pmcUrl]
  }],
  sources:[
    {source_id:'plos_one_vo2max_prediction_2023',url:plosUrl,title:'VO2max prediction models',publisher:'journals.plos.org',rights_status:'verified_permitted'},
    {source_id:'pmc_cardiorespiratory_fitness_2022',url:pmcUrl,title:'Cardiorespiratory fitness',publisher:'pmc.ncbi.nlm.nih.gov',rights_status:'verified_permitted'}
  ],
  evidence:{can_answer:true,limitations:[],freshness:{required:false}},
  quality_control:{passed:true,score:0.9}
};

function fakeFetch(url){
 if(url.includes('journals.plos.org')){
  return Promise.resolve({ok:true,text:async()=>'<article><abstract><p>VO2max is a widely used measure of cardiorespiratory fitness and aerobic capacity.</p></abstract><body><p>VO2max is an important parameter for assessing cardiorespiratory fitness.</p></body></article>'});
 }
 return Promise.resolve({ok:true,json:async()=>({collection:{documents:[{passages:[
  {infons:{section_type:'ABSTRACT'},text:'VO2max is a widely used measure of cardiorespiratory fitness and aerobic capacity.'},
  {infons:{section_type:'INTRO'},text:'Cardiorespiratory fitness is an integrated physiological capacity.'}
 ]}]}})});
}

function fakeDb(){
 let candidate=null,rpcCalls=0;
 return {
  get candidate(){return candidate;},
  get rpcCalls(){return rpcCalls;},
  from(){return {select(){return this;},eq(){return this;},async maybeSingle(){return {data:null,error:null};}}},
  async rpc(name,args){
   assert.equal(name,'messinho_create_knowledge_candidate');
   rpcCalls++;candidate=args.p_record;
   return {data:[{id:'candidate-1',concept_key:args.p_record.concept_key,version:1,knowledge_status:'candidate'}],error:null};
  }
 };
}

test('approved PLOS and PMC works produce a compact inactive knowledge candidate',async()=>{
 const db=fakeDb(),requested=[];
 const result=await learnMessinhoKnowledgeFromResearch(db,{question,research,fetchImpl:async(url,options)=>{requested.push(url);return fakeFetch(url);}});
 assert.equal(result.persisted,true);
 assert.equal(result.status,'candidate_created');
 assert.equal(result.candidate_only,true);
 assert.equal(result.active,false);
 assert.equal(result.approval_required,true);
 assert.equal(result.source_count,2);
 assert.equal(result.independent_source_domains,2);
 assert.equal(result.source_excerpts_persisted,false);
 assert.equal(db.rpcCalls,1);
 assert.equal(db.candidate.knowledge_status,'candidate');
 assert.equal(db.candidate.sources.length,2);
 assert.ok(db.candidate.sources.every(source=>source.license==='CC BY 4.0'&&source.attribution));
 assert.ok(db.candidate.sources.every(source=>!('snippet' in source)&&!('text' in source)&&!('full_text' in source)));
 assert.ok(db.candidate.claims.length>=1);
 assert.equal(requested.length,2);
});

test('no permanent learning occurs for non-foundational or personal questions',async()=>{
 const db=fakeDb();let fetches=0;
 const nonFoundational=await learnMessinhoKnowledgeFromResearch(db,{question:'Warum verbessert HIIT die VO2max?',research,fetchImpl:async()=>{fetches++;}});
 const personal=await learnMessinhoKnowledgeFromResearch(db,{question:'Was ist VO2max und warum ist sie bei mir niedrig?',research,fetchImpl:async()=>{fetches++;}});
 assert.equal(nonFoundational.reason,'not_foundational_intent');
 assert.equal(personal.reason,'personal_context_not_persisted');
 assert.equal(fetches,0);
 assert.equal(db.rpcCalls,0);
});

test('no permanent learning occurs when synthesis or evidence quality gates fail',async()=>{
 const db=fakeDb();let fetches=0;
 const result=await learnMessinhoKnowledgeFromResearch(db,{question,research:{...research,quality_control:{passed:false}},fetchImpl:async()=>{fetches++;}});
 assert.equal(result.reason,'research_quality_gate_not_passed');
 assert.equal(fetches,0);
 assert.equal(db.rpcCalls,0);
});

test('approved retrieval failure or unsupported claims cannot create a candidate',async()=>{
 const db=fakeDb();
 const failed=await learnMessinhoKnowledgeFromResearch(db,{question,research,fetchImpl:async()=>({ok:false,status:503})});
 assert.equal(failed.reason,'approved_source_retrieval_unavailable');
 assert.equal(db.rpcCalls,0);
 const unsupportedResearch={...research,claims:[{text:'The moon is made of cheese and contains minerals.',source_urls:[plosUrl,pmcUrl]}]};
 const unsupported=await learnMessinhoKnowledgeFromResearch(db,{question,research:unsupportedResearch,fetchImpl:async(url)=>fakeFetch(url)});
 assert.equal(unsupported.reason,'no_claim_supported_by_licensed_source_text');
 assert.equal(db.rpcCalls,0);
});
