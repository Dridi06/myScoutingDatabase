export const MESSINHO_STALE_TASK_ERROR = 'Laufunterbrechung erkannt. Vor einer Wiederholung müssen die letzten Arbeitsschritte geprüft werden.';
export const MESSINHO_TASK_MAX_ATTEMPTS = 4;
export const MESSINHO_TASK_RETRY_BASE_MS = 30_000;
export const MESSINHO_TASK_RETRY_MAX_MS = 15 * 60_000;

export function isMessinhoTaskLeaseExpired(task, now = Date.now()) {
  if (task?.status !== 'running') return false;
  const leaseUntil = Date.parse(task?.lease_until || '');
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  return Number.isFinite(leaseUntil) && Number.isFinite(nowMs) && leaseUntil <= nowMs;
}

export function buildMessinhoStaleTaskQuarantinePatch(now = new Date()) {
  const timestamp = (now instanceof Date ? now : new Date(now)).toISOString();
  return {
    status: 'failed',
    lease_until: null,
    last_error: MESSINHO_STALE_TASK_ERROR,
    updated_at: timestamp
  };
}

export function isMessinhoTaskWriteConfirmed(data, expectedTaskId) {
  return Boolean(expectedTaskId && data && data.id === expectedTaskId);
}

/** Exponential backoff is deterministic and capped; callers persist next_retry_at. */
export function getMessinhoTaskRetryDelayMs(attemptCount, {
  baseMs = MESSINHO_TASK_RETRY_BASE_MS,
  maxMs = MESSINHO_TASK_RETRY_MAX_MS
} = {}) {
  const attempt = Math.max(1, Math.min(MESSINHO_TASK_MAX_ATTEMPTS, Math.floor(Number(attemptCount) || 1)));
  const base = Math.max(1, Number(baseMs) || MESSINHO_TASK_RETRY_BASE_MS);
  const ceiling = Math.max(base, Number(maxMs) || MESSINHO_TASK_RETRY_MAX_MS);
  return Math.min(ceiling, base * (2 ** (attempt - 1)));
}

/**
 * Conservative resume gate. Background execution is opt-in per task, and
 * capabilities must be explicitly classified read-only by the caller.
 * Expired running leases are deliberately not reclaimed here: they require
 * separate atomic database recovery/claim logic.
 */
export function evaluateMessinhoTaskResume(task, {
  now = Date.now(),
  capabilitySafety = {},
  maxAttempts = MESSINHO_TASK_MAX_ATTEMPTS
} = {}) {
  if (!task || typeof task !== 'object') return { allowed: false, reason: 'task_missing' };
  if (task.autonomous_resume_enabled !== true) return { allowed: false, reason: 'explicit_opt_in_required' };
  if (!['queued', 'partial'].includes(task.status)) return { allowed: false, reason: 'status_not_resumable' };
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const expiry = Date.parse(task.expires_at || '');
  if (!Number.isFinite(expiry) || expiry <= nowMs) return { allowed: false, reason: 'task_expired' };
  const attempts = Math.max(0, Number(task.attempt_count) || 0);
  if (attempts >= maxAttempts) return { allowed: false, reason: 'attempt_limit_reached' };
  const retryAt = task.next_retry_at ? Date.parse(task.next_retry_at) : NaN;
  if (Number.isFinite(retryAt) && retryAt > nowMs) return { allowed: false, reason: 'retry_backoff_active' };
  const pending = Array.isArray(task.pending_capabilities) ? task.pending_capabilities : [];
  if (!pending.length) return { allowed: false, reason: 'no_pending_capabilities' };
  const unsafe = pending.filter(id => capabilitySafety[id] !== 'read_only');
  if (unsafe.length) return { allowed: false, reason: 'capability_not_approved_read_only', unsafe_capabilities: unsafe };
  return { allowed: true, reason: 'explicitly_opted_in_read_only_task', capabilities: pending };
}
