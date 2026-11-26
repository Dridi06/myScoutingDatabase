import test from 'node:test';
import assert from 'node:assert/strict';
import { learnMessinhoApprovedFoundationConcept } from '../backend/messinho-approved-knowledge-learning.js';

const plosXml = '<article><abstract><p>VO2max is the highest attained oxygen uptake during an incremental exercise test with large muscle groups. VO2max is an important parameter to objectively assess cardiorespiratory fitness.</p></abstract></article>';
const pmcJson = { collection: { documents: [{ passages: [{ infons: { section_type: 'ABSTRACT' }, text: 'Cardiorespiratory fitness reflects the integration of ventilation, circulation and metabolism for oxygen delivery and utilization. The gold standard measure of cardiorespiratory fitness is maximal oxygen uptake.' }] }] } };

function fetchBothSources(url) {
  if (url.includes('journals.plos.org')) return Promise.resolve({ ok: true, text: async () => plosXml });
  if (url.includes('ncbi.nlm.nih.gov')) return Promise.resolve({ ok: true, json: async () => pmcJson });
  return Promise.resolve({ ok: false, status: 404 });
}

function trackingDb({ failWrite = false } = {}) {
  const calls = [];
  const query = { select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: null, error: null }; } };
  return {
    calls,
    from(table) { calls.push({ type: 'from', table }); return query; },
    async rpc(name, args) {
      calls.push({ type: 'rpc', name, args });
      return failWrite ? { data: null, error: { message: 'staging_write_rejected' } } : {
        data: [{ id: 'candidate-id', concept_key: args.p_record.concept_key, version: 1, knowledge_status: 'candidate' }],
        error: null
      };
    }
  };
}

test('VO2max learning does not access sources or storage when the database is unavailable', async () => {
  let fetchCalls = 0;
  const result = await learnMessinhoApprovedFoundationConcept(null, 'Was bedeutet VO2max?', {
    fetchImpl: async () => { fetchCalls += 1; }
  });
  assert.equal(result.status, 'storage_unavailable');
  assert.equal(fetchCalls, 0);
});

test('VO2max learning refuses a source response with no relevant excerpts and does not persist', async () => {
  const db = trackingDb();
  const result = await learnMessinhoApprovedFoundationConcept(db, 'Was bedeutet VO2max?', {
    fetchImpl: async url => url.includes('journals.plos.org')
      ? { ok: true, text: async () => plosXml }
      : { ok: true, json: async () => ({ collection: { documents: [{ passages: [{ infons: { section_type: 'ABSTRACT' }, text: 'An unrelated short note.' }] }] } }) }
  });
  assert.equal(result.status, 'insufficient_approved_sources');
  assert.equal(result.source_status.some(item => item.status === 'no_relevant_text'), true);
  assert.equal(db.calls.some(call => call.type === 'rpc'), false);
});

test('VO2max learning reports a failed atomic candidate write and never claims persistence', async () => {
  const db = trackingDb({ failWrite: true });
  const result = await learnMessinhoApprovedFoundationConcept(db, 'Erkläre VO2max und kardiorespiratorische Fitness', {
    fetchImpl: fetchBothSources
  });
  assert.equal(result.status, 'candidate_not_stored');
  assert.equal(result.stored.persisted, false);
  assert.equal(result.stored.reason, 'storage_unavailable');
  assert.equal(db.calls.some(call => call.type === 'rpc' && call.name === 'messinho_create_knowledge_candidate'), true);
  assert.equal(result.active, false);
  assert.equal(result.approval_required, true);
});
