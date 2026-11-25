import test from 'node:test';
import assert from 'node:assert/strict';
import { getMessinhoCapabilityCatalog, getMessinhoCapabilitySummary } from '../backend/messinho-capabilities.js';

test('MESSINHO registry contains exactly 100 unique capabilities across four domains', () => {
  const groups = getMessinhoCapabilityCatalog();
  const items = groups.flatMap(group => group.functions);
  assert.equal(groups.length, 4);
  assert.deepEqual(groups.map(group => group.functions.length), [25,25,25,25]);
  assert.equal(items.length, 100);
  assert.equal(new Set(items.map(item => item.id)).size, 100);
});

test('every capability declares inputs and an honest implementation status', () => {
  const items = getMessinhoCapabilityCatalog().flatMap(group => group.functions);
  for (const item of items) {
    assert.ok(item.id && item.name && item.description);
    assert.ok(Array.isArray(item.required_inputs) && item.required_inputs.length > 0);
    assert.ok(['implemented_existing_core','partial_or_requires_validation','requires_new_integration'].includes(item.status));
  }
});

test('summary reconciles to the 100-function catalog', () => {
  const summary = getMessinhoCapabilitySummary();
  assert.equal(summary.total, 100);
  assert.equal(summary.by_status.implemented_existing_core + summary.by_status.partial_or_requires_validation + summary.by_status.requires_new_integration, 100);
  assert.equal(summary.by_group.reduce((sum,group)=>sum+group.total,0),100);
});
