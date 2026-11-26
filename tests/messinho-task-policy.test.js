import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MESSINHO_STALE_TASK_ERROR,
  buildMessinhoStaleTaskQuarantinePatch,
  isMessinhoTaskLeaseExpired,
  isMessinhoTaskWriteConfirmed
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
