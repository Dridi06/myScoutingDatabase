import test from 'node:test';
import assert from 'node:assert/strict';
import { assessMessinhoSource, assessMessinhoEvidence, evaluateMessinhoTacticalFit, validateMessinhoCandidateEvidence, messinhoValueSupported } from '../backend/messinho-intelligence.js';

test('source assessment separates HTTPS validity and freshness from credibility', () => {
  const now = Date.parse('2026-11-25T12:00:00Z');
  const result = assessMessinhoSource({url:'https://club.example/player',title:'Player profile',published_date:'2026-10-01',content:'x'.repeat(100)}, {now});
  assert.equal(result.secure_transport,true);
  assert.equal(result.freshness,'fresh');
  assert.equal(result.host,'club.example');
  assert.equal(result.credibility,undefined);
});

test('evidence assessment deduplicates URLs and exposes limitations', () => {
  const now = Date.parse('2026-11-25T12:00:00Z');
  const sources = [
    {url:'https://a.example/p',title:'A',published_date:'2026-10-01',content:'x'.repeat(100)},
    {url:'https://a.example/p',title:'A duplicate',published_date:'2026-10-01',content:'x'.repeat(100)},
    {url:'https://b.example/p',title:'B',published_date:'2026-09-01',content:'y'.repeat(100)},
    {url:'http://unsafe.example/p',title:'Unsafe',content:'z'.repeat(100)}
  ];
  const result = assessMessinhoEvidence(sources,{now});
  assert.equal(result.source_count,3);
  assert.equal(result.secure_source_count,2);
  assert.equal(result.unique_domain_count,2);
  assert.equal(result.status,'mixed');
});

test('tactical fit requires enough real metrics and explicit club requirements', () => {
  const insufficient = evaluateMessinhoTacticalFit({performance_metrics:{pace:80}}, {formation:'4-3-3',role:'winger',requirements:{acceleration:80,dribbling:80,crossing:70}});
  assert.equal(insufficient.status,'insufficient_data');
  assert.equal(insufficient.score,null);
  const fit = evaluateMessinhoTacticalFit({performance_metrics:{acceleration:90,dribbling:80,crossing:60}}, {formation:'4-3-3',role:'winger',requirements:{acceleration:80,dribbling:80,crossing:80}});
  assert.equal(fit.status,'heuristic_estimate');
  assert.equal(fit.score,90);
  assert.equal(fit.coverage,100);
});

test('tactical fit never assigns a score to absent or invalid player metrics', () => {
  const result = evaluateMessinhoTacticalFit({performance_metrics:{acceleration:null,dribbling:'',crossing:'unknown'}}, {requirements:{acceleration:80,dribbling:80,crossing:80}});
  assert.equal(result.score,null);
  assert.equal(result.status,'insufficient_data');
});

test('tactical attributes accept the same 1-to-5 scout rating scale as learning calibration', () => {
  const result = evaluateMessinhoTacticalFit(
    {performance_metrics:{acceleration:4,dribbling:5,crossing:3}},
    {requirements:{acceleration:80,dribbling:100,crossing:60}}
  );
  assert.equal(result.status,'heuristic_estimate');
  assert.equal(result.score,100);
});

test('integer scout rating 1 maps to 20 rather than 100', () => {
  const result = evaluateMessinhoTacticalFit(
    {performance_metrics:{acceleration:1,dribbling:5,crossing:3}},
    {requirements:{acceleration:20,dribbling:100,crossing:60}}
  );
  assert.equal(result.status,'heuristic_estimate');
  assert.equal(result.score,100);
});

test('future publication dates are never marked as fresh evidence', () => {
  const now = Date.parse('2026-11-25T12:00:00Z');
  const result = assessMessinhoSource(
    {url:'https://club.example/player',title:'Player profile',published_date:'2027-12-01',content:'x'.repeat(100)},
    {now}
  );
  assert.equal(result.freshness,'invalid_date');
  assert.equal(result.age_days,null);
  assert.ok(result.limitations.some(item=>item.includes('Zukunft')));
});

test('candidate identity and birth year must be present in the cited HTTPS source',()=>{
 const sources=[{url:'https://club.example/player',title:'Rising prospect Karim Adeyemi born 2002',content:'Karim Adeyemi is a forward born in 2002.'}];
 const evidence=[{source_url:'https://club.example/player',claim:'Karim Adeyemi, born 2002'}];
 assert.equal(validateMessinhoCandidateEvidence({name:'Karim Adeyemi',birth_year:2002},evidence,sources).valid,true);
 assert.equal(validateMessinhoCandidateEvidence({name:'Karim Adeyemi',birth_year:2003},evidence,sources).valid,false);
 assert.equal(validateMessinhoCandidateEvidence({name:'Invented Player',birth_year:2002},evidence,sources).valid,false);
});

test('candidate validation rejects evidence URLs not supplied by the research result',()=>{
 const sources=[{url:'https://club.example/player',title:'Rising prospect Karim Adeyemi born 2002',content:'Karim Adeyemi is a forward born in 2002.'}];
 const evidence=[{source_url:'https://other.example/player',claim:'Karim Adeyemi born 2002'}];
 assert.equal(validateMessinhoCandidateEvidence({name:'Karim Adeyemi',birth_year:2002},evidence,sources).valid,false);
});

test('optional candidate fields are retained only when supported by cited source text',()=>{
 const sources=[{url:'https://club.example/player',title:'Karim Adeyemi 2002 Borussia Dortmund',content:'Karim Adeyemi plays for Borussia Dortmund.'}];
 assert.equal(messinhoValueSupported('Borussia Dortmund',['https://club.example/player'],sources),true);
 assert.equal(messinhoValueSupported('Bayern Munich',['https://club.example/player'],sources),false);
});
