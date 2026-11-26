import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchMessinhoApprovedSource } from '../backend/messinho-approved-source-ingestion.js';

test('PLOS source retrieval uses the approved JATS endpoint and returns only compact excerpts',async()=>{
 let requested='';
 const result=await fetchMessinhoApprovedSource('plos_one_vo2max_prediction_2023',{
  topic:'VO2max cardiorespiratory fitness',
  fetchImpl:async(url,options)=>{
   requested=url;
   assert.equal(options.headers.accept,'application/xml,text/xml;q=0.9');
   assert.equal(options.redirect,'manual');
   return {ok:true,text:async()=>'<article><abstract><p>VO2max is the highest attained oxygen uptake during an incremental exercise test with large muscle groups.</p></abstract><body><p>VO2max is an important parameter to objectively assess cardiorespiratory fitness in healthy people.</p><p>Prediction models require external validation.</p></body></article>'};
  }
 });
 assert.equal(result.status,'completed');
 assert.equal(result.retrieval_method,'plos_jats_xml');
 assert.equal(result.storage_policy,'transient_excerpts_only');
 assert.ok(result.source.tdm_evidence_url);
 assert.equal(result.source.retrieval_url,requested);
 assert.equal(result.source.retrieval_method,'plos_jats_xml');
 assert.ok(result.source.reviewed_at);
 assert.ok(result.source.review_due_at);
 assert.equal(result.source.review_due_at,'2027-11-26');
 assert.match(requested,/type=manuscript/);
 assert.ok(result.excerpts.length>=1);
 assert.match(result.excerpts.map(x=>x.text).join(' '),/VO2max/);
 assert.equal('full_text' in result,false);
});

test('PMC source retrieval uses the approved BioC API and keeps section provenance',async()=>{
 let requested='';
 const result=await fetchMessinhoApprovedSource('pmc_cardiorespiratory_fitness_2022',{
  topic:'cardiorespiratory fitness oxygen uptake',
  fetchImpl:async(url,options)=>{
   requested=url;
   assert.equal(options.headers.accept,'application/json');
   return {ok:true,json:async()=>({collection:{documents:[{passages:[
    {infons:{section_type:'ABSTRACT'},text:'Cardiorespiratory fitness reflects the integration of ventilation, circulation and metabolism for oxygen delivery and utilization during aerobic activity.'},
    {infons:{section_type:'INTRO'},text:'The gold standard measure of cardiorespiratory fitness is maximal oxygen uptake.'}
   ]}]}})};
  }
 });
 assert.equal(result.status,'completed');
 assert.equal(result.retrieval_method,'pmc_bioc_json');
 assert.ok(requested.includes('/BioC_json/PMC11269081/'));
 assert.ok(result.excerpts.some(x=>x.source_section==='ABSTRACT'));
 assert.equal('full_text' in result,false);
});

test('approved LibreTexts and Austin chapter HTML routes return only relevant compact paragraphs',async()=>{
 const fixtures={
  'math.libretexts.org':'<html><body><p>For matrices A and B, the product AB is defined when the number of columns of A equals the number of rows of B. If A is m by n and B is n by p, then AB is m by p.</p></body></html>',
  'understandinglinearalgebra.org':'<html><body><p>Matrix multiplication connects matrix-vector products with linear combinations of the columns of a matrix. The dimensions must agree for the product to be defined.</p></body></html>'
 };
 for(const [sourceId,host,method] of [
  ['libretexts_kuttler_matrix_multiplication_2023','math.libretexts.org','libretexts_html'],
  ['austin_matrix_multiplication_2023','understandinglinearalgebra.org','austin_html']
 ]){
  const result=await fetchMessinhoApprovedSource(sourceId,{topic:'matrix multiplication matrices columns rows product',fetchImpl:async(url,options)=>{
   assert.equal(new URL(url).hostname,host);
   assert.equal(options.headers.accept,'text/html,application/xhtml+xml;q=0.9');
   return {ok:true,text:async()=>fixtures[host]};
  }});
  assert.equal(result.status,'completed');
  assert.equal(result.retrieval_method,method);
  assert.equal(result.storage_policy,'transient_excerpts_only');
  assert.ok(result.excerpts.length>0);
  assert.match(result.excerpts.map(x=>x.text).join(' '),/matri/i);
  assert.equal('full_text' in result,false);
 }
});

test('unapproved source IDs never trigger network retrieval',async()=>{
 let called=false;
 const result=await fetchMessinhoApprovedSource('unapproved_source',{fetchImpl:async()=>{called=true;}});
 assert.equal(result.status,'source_not_approved');
 assert.equal(called,false);
});

test('approved retrieval rejects cross-host redirects',async()=>{
 const result=await fetchMessinhoApprovedSource('plos_one_vo2max_prediction_2023',{
  fetchImpl:async()=>({ok:true,url:'https://unapproved.example/article.xml',text:async()=>'<article><p>Should never be parsed.</p></article>'})
 });
 assert.equal(result.status,'retrieval_redirect_not_approved');
});
test('source retrieval rejects HTTP failures and oversized PLOS payloads',async()=>{
 const failed=await fetchMessinhoApprovedSource('plos_one_vo2max_prediction_2023',{fetchImpl:async()=>({ok:false,status:503})});
 assert.equal(failed.status,'source_fetch_failed');
 const oversized=await fetchMessinhoApprovedSource('plos_one_vo2max_prediction_2023',{fetchImpl:async()=>({ok:true,text:async()=>'x'.repeat(2_000_001)})});
 assert.equal(oversized.status,'source_payload_rejected');
});


test('expired source-rights review blocks retrieval before any network request',async()=>{
 let called=false;
 const result=await fetchMessinhoApprovedSource('plos_one_vo2max_prediction_2023',{
  now:new Date('2027-11-27T00:00:00.000Z'),
  fetchImpl:async()=>{called=true;return {ok:true,text:async()=>'<article/>'};}
 });
 assert.equal(result.status,'source_not_approved');
 assert.equal(called,false);
});


test('approved source retrieval never follows redirects, including same-host redirects',async()=>{
 let calls=0;
 const result=await fetchMessinhoApprovedSource('plos_one_vo2max_prediction_2023',{
  fetchImpl:async()=>{calls++;return {ok:false,status:302,headers:{get:()=>'/redirected-article'},text:async()=>''};}
 });
 assert.equal(calls,1);
 assert.equal(result.status,'retrieval_redirect_not_approved');
});

test('approved source retrieval rejects oversized BioC payloads before parsing',async()=>{
 const result=await fetchMessinhoApprovedSource('pmc_cardiorespiratory_fitness_2022',{
  fetchImpl:async()=>({ok:true,status:200,headers:{get:(name)=>name==='content-length'?'2000001':null},json:async()=>({collection:{documents:[]}})})
 });
 assert.equal(result.status,'source_payload_rejected');
});
