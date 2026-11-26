import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MESSINHO_STALE_TASK_ERROR,
  buildMessinhoStaleTaskQuarantinePatch,
  isMessinhoTaskLeaseExpired,
  isMessinhoTaskWriteConfirmed,
  getMessinhoTaskRetryDelayMs,
  evaluateMessinhoTaskResume
} from '../backend/messinho-task-policy.js';

test('expired running task leases are detected', () => {
  const now = Date.parse('2026-11-26T05:00:00.000Z');
  assert.equal(isMessinhoTaskLeaseExpired({ status: 'running', lease_until: '2026-11-26T04:59:59.000Z' }, now), true);
});

test('active, non-running and missing leases are not treated as expired', () => {
  const now = Date.parse('2026-11-26T05:00:00.000Z');
  assert.equal(isMessinhoTaskLeaseExpired({ status: 'running', lease_until: '2026-11-26T05:00:01.000Z' }, now), false);
  assert.equal(isMessinhoTaskLeaseExpired({ status: 'partial', lease_until: '2026-11-26T04:00:00.000Z' }, now), false);
  assert.equal(isMessinhoTaskLeaseExpired({ status: 'running', lease_until: null }, now), false);
});

test('expired task quarantine is terminal and never resumable by default', () => {
  const patch = buildMessinhoStaleTaskQuarantinePatch(new Date('2026-11-26T05:00:00.000Z'));
  assert.deepEqual(patch, {
    status: 'failed',
    lease_until: null,
    last_error: MESSINHO_STALE_TASK_ERROR,
    updated_at: '2026-11-26T05:00:00.000Z'
  });
});

test('task persistence is confirmed only for the expected task id', () => {
  assert.equal(isMessinhoTaskWriteConfirmed({ id: 'task-1' }, 'task-1'), true);
  assert.equal(isMessinhoTaskWriteConfirmed(null, 'task-1'), false);
  assert.equal(isMessinhoTaskWriteConfirmed({ id: 'task-2' }, 'task-1'), false);
});

test('retry delay grows exponentially and is capped', () => {
  assert.equal(getMessinhoTaskRetryDelayMs(1), 30_000);
  assert.equal(getMessinhoTaskRetryDelayMs(2), 60_000);
  assert.equal(getMessinhoTaskRetryDelayMs(4), 240_000);
  assert.equal(getMessinhoTaskRetryDelayMs(99), 240_000);
});

const validTask = overrides => ({
  status: 'partial',
  autonomous_resume_enabled: true,
  expires_at: '2026-11-27T00:00:00.000Z',
  attempt_count: 1,
  pending_capabilities: ['overall_score'],
  ...overrides
});

test('resume requires explicit opt-in, live expiry and read-only capability classification', () => {
  const now = Date.parse('2026-11-26T15:00:00.000Z');
  assert.equal(evaluateMessinhoTaskResume(validTask({ autonomous_resume_enabled: false }), { now }).reason, 'explicit_opt_in_required');
  assert.equal(evaluateMessinhoTaskResume(validTask(), { now, capabilitySafety: { overall_score: 'read_only' } }).allowed, true);
  assert.equal(evaluateMessinhoTaskResume(validTask(), { now }).reason, 'capability_not_approved_read_only');
});

test('resume rejects running, expired, exhausted and backoff tasks', () => {
  const now = Date.parse('2026-11-26T15:00:00.000Z');
  const safe = { overall_score: 'read_only' };
  assert.equal(evaluateMessinhoTaskResume(validTask({ status: 'running' }), { now, capabilitySafety: safe }).reason, 'status_not_resumable');
  assert.equal(evaluateMessinhoTaskResume(validTask({ expires_at: '2026-11-26T14:00:00.000Z' }), { now, capabilitySafety: safe }).reason, 'task_expired');
  assert.equal(evaluateMessinhoTaskResume(validTask({ attempt_count: 4 }), { now, capabilitySafety: safe }).reason, 'attempt_limit_reached');
  assert.equal(evaluateMessinhoTaskResume(validTask({ next_retry_at: '2026-11-26T15:01:00.000Z' }), { now, capabilitySafety: safe }).reason, 'retry_backoff_active');
});
