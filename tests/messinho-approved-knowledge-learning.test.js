import test from 'node:test';
import assert from 'node:assert/strict';
import { learnMessinhoApprovedFoundationConcept, isMessinhoApprovedFoundationTopic } from '../backend/messinho-approved-knowledge-learning.js';

const plosXml='<article><abstract><p>VO2max is the highest attained oxygen uptake during an incremental exercise test with large muscle groups. VO2max is an important parameter to objectively assess cardiorespiratory fitness.</p></abstract><body><p>Direct measurement is performed during cardiopulmonary exercise testing.</p></body></article>';
const pmcJson={collection:{documents:[{passages:[
 {infons:{section_type:'ABSTRACT'},text:'Cardiorespiratory fitness reflects the integration of ventilation, circulation and metabolism for oxygen delivery and utilization. The gold standard measure of cardiorespiratory fitness is maximal oxygen uptake.'}
]}]}};

function mockFetch(url){
 if(url.includes('journals.plos.org'))return Promise.resolve({ok:true,text:async()=>plosXml});
 if(url.includes('ncbi.nlm.nih.gov'))return Promise.resolve({ok:true,json:async()=>pmcJson});
 return Promise.resolve({ok:false,status:404});
}
function mockDb(){
 const saved={};
 const query={
  select(){return this;},eq(){return this;},
  async maybeSingle(){return {data:null,error:null};}
 };
 return {
  from(){return query;},
  async rpc(name,args){saved.name=name;saved.args=args;return {data:[{id:'candidate-id',concept_key:args.p_record.concept_key,version:1,knowledge_status:'candidate'}],error:null};},
  saved
 };
}

test('VO2max foundation learning requires both exact approved sources and creates an inactive candidate',async()=>{
 const db=mockDb();
 const result=await learnMessinhoApprovedFoundationConcept(db,'Erkläre mir VO2max',{fetchImpl:mockFetch});
 assert.equal(result.status,'candidate_created');
 assert.equal(result.stored.persisted,true);
 assert.equal(result.active,false);
 assert.equal(result.approval_required,true);
 assert.equal(result.source_count,2);
 assert.equal(db.saved.name,'messinho_create_knowledge_candidate');
 const record=db.saved.args.p_record;
 assert.equal(record.knowledge_level,'foundational');
 assert.equal(record.knowledge_status,'candidate');
 assert.equal(record.sources.length,2);
 assert.ok(record.claims[0].source_urls.length===2);
 assert.equal(record.sources.some(source=>'snippet' in source),false);
 assert.equal(record.sources.some(source=>'full_text' in source),false);
});

test('VO2max curriculum adapter accepts general definitions but rejects player-specific requests',()=>{
 assert.equal(isMessinhoApprovedFoundationTopic('Was ist VO2max?'),true);
 assert.equal(isMessinhoApprovedFoundationTopic('VO2max'),true);
 assert.equal(isMessinhoApprovedFoundationTopic('Vergleiche die VO2max zweier Spieler'),false);
 assert.equal(isMessinhoApprovedFoundationTopic('Welche VO2max hat mein Spieler?'),false);
 assert.equal(isMessinhoApprovedFoundationTopic('Was bedeutet VO2max bei mir?'),false);
});

test('VO2max source seeding is limited to general foundation questions',()=>{
 assert.equal(isMessinhoApprovedFoundationTopic('Was ist VO2max?'),true);
 assert.equal(isMessinhoApprovedFoundationTopic('VO2max'),true);
 assert.equal(isMessinhoApprovedFoundationTopic('Vergleiche den VO2max von zwei Spielern'),false);
 assert.equal(isMessinhoApprovedFoundationTopic('Analysiere die VO2max-Daten dieses Spielers'),false);
 assert.equal(isMessinhoApprovedFoundationTopic('Ich habe gesundheitliche Beschwerden und mein VO2max ist niedrig'),false);
});

test('foundation learning does not run for unrelated questions',async()=>{
 let calls=0;
 const result=await learnMessinhoApprovedFoundationConcept(mockDb(),'Wie spät ist es?',{fetchImpl:async()=>{calls++;}});
 assert.equal(result.status,'not_applicable');
 assert.equal(calls,0);
});

test('foundation learning fails closed if one approved source cannot be retrieved',async()=>{
 let calls=0;
 const result=await learnMessinhoApprovedFoundationConcept(mockDb(),'Was bedeutet VO2max?',{
  fetchImpl:async(url)=>{calls++;return url.includes('journals.plos.org')?{ok:true,text:async()=>plosXml}:{ok:false,status:503};}
 });
 assert.equal(result.status,'insufficient_approved_sources');
 assert.equal(calls,2);
});

test('foundation learning does not write if two sources fail to corroborate the claim',async()=>{
 let calls=0;
 const db=mockDb();
 const result=await learnMessinhoApprovedFoundationConcept(db,'Was ist VO2max?',{
  fetchImpl:async(url)=>{calls++;return url.includes('journals.plos.org')
   ?{ok:true,text:async()=>'<article><abstract><p>VO2max is listed as a variable in a separate study. The paper also describes participant selection, recruitment procedures, and statistical summaries for an unrelated population.</p></abstract></article>'}
   :{ok:true,json:async()=>({collection:{documents:[{passages:[{infons:{section_type:'ABSTRACT'},text:'Fitness was recorded as one background characteristic in a survey about marine ecology and coastal fieldwork, without any physiological measurements or oxygen uptake analysis.'}]}]}})};
  }
 });
 assert.equal(result.status,'insufficient_corroboration');
 assert.equal(db.saved.name,undefined);
});
