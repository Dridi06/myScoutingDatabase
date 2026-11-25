import test from 'node:test';
import assert from 'node:assert/strict';
import { assessMessinhoSource, assessMessinhoEvidence, evaluateMessinhoTacticalFit } from '../backend/messinho-intelligence.js';

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
