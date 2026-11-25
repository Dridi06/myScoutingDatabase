import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateMarketValue } from '../backend/asi/marketValueEngine.js';

const comparableSet = [
  { playerName: 'Comparable A', feeEur: 10000000, sourceUrl: 'https://example.org/a', eventDate: '2025-06-01', similarity: 0.9, verified: true, sourceConfidence: 0.9 },
  { playerName: 'Comparable B', feeEur: 12000000, sourceUrl: 'https://example.org/b', eventDate: '2025-07-01', similarity: 0.85, verified: true, sourceConfidence: 0.9 },
  { playerName: 'Comparable C', feeEur: 14000000, sourceUrl: 'https://example.org/c', eventDate: '2025-08-01', similarity: 0.8, verified: true, sourceConfidence: 0.8 }
];

test('suppresses valuation when verified comparables are insufficient', () => {
  const result = estimateMarketValue({ player: { age: 25, position: 'FW', minutesLast12Months: 2000, performanceScore: 75 }, comparables: comparableSet.slice(0, 2) });
  assert.equal(result.status, 'insufficient_data');
  assert.equal(result.pointEstimate, null);
});

test('returns reproducible interval and factor explanations with sufficient inputs', () => {
  const result = estimateMarketValue({ player: { age: 25, position: 'FW', minutesLast12Months: 2500, performanceScore: 80, contractYears: 2, leagueLevelMultiplier: 1 }, comparables: comparableSet });
  assert.equal(result.status, 'estimated');
  assert.ok(result.intervalLow < result.pointEstimate);
  assert.ok(result.intervalHigh > result.pointEstimate);
  assert.equal(result.comparablesUsed, 3);
  assert.ok(result.factors.some(item => item.name === 'Karrierephase / Alter'));
});

test('rejects unverified or invalid source comparables', () => {
  const result = estimateMarketValue({ player: { age: 25, position: 'FW', minutesLast12Months: 2500, performanceScore: 80 }, comparables: comparableSet.map(item => ({ ...item, verified: false })) });
  assert.equal(result.status, 'insufficient_data');
  assert.equal(result.comparablesUsed, 0);
});
