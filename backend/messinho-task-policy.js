export const MESSINHO_STALE_TASK_ERROR = 'Laufunterbrechung erkannt. Vor einer Wiederholung müssen die letzten Arbeitsschritte geprüft werden.';

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
