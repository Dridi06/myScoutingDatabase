/**
 * MESSINHO background task worker.
 * Opt-in only; read-only capability allowlist; all writes are lease-token guarded.
 */
import { randomUUID } from 'node:crypto';
import { runMessinhoCapabilityPlanAsync } from './messinho-orchestrator.js';
import { evaluateMessinhoTaskResume, getMessinhoTaskRetryDelayMs, MESSINHO_TASK_MAX_ATTEMPTS } from './messinho-task-policy.js';

export const MESSINHO_BACKGROUND_READ_ONLY = Object.freeze([
  'holistic_player_analysis','position_analysis','strength_weakness_analysis',
  'performance_development','form_curve_analysis','overall_score','position_score',
  'data_quality_score','source_trust_score','technical_score','tactical_score',
  'athletic_score','goalkeeper_score','explainable_rating','speed_analysis',
  'technical_detail_analysis','minutes_analysis','consistency_analysis'
]);
const SAFE = new Set(MESSINHO_BACKGROUND_READ_ONLY);
const MAX_CONTEXT_BYTES = 64000;

function safeJsonSize(value) {
  try { return new TextEncoder().encode(JSON.stringify(value ?? {})).length; }
  catch { return Infinity; }
}
function sanitizeContext(context) {
  if (!context || typeof context !== 'object' || Array.isArray(context)) return {};
  const copy = { ...context };
  delete copy._previous_capability_results;
  if (safeJsonSize(copy) > MAX_CONTEXT_BYTES) {
    delete copy.sources;
    if (Array.isArray(copy.players)) copy.players = copy.players.slice(0, 20);
  }
  return safeJsonSize(copy) <= MAX_CONTEXT_BYTES ? copy : {};
}
function makeWorkerId() {
  return `messinho-worker-${process.env.RENDER_INSTANCE_ID || 'instance'}-${randomUUID().slice(0,8)}`;
}
export function isMessinhoBackgroundWorkerEnabled(env = process.env) {
  return env.MESSINHO_AUTONOMY_WORKER_ENABLED === 'true'
    && env.RENDER === 'true'
    && Boolean(env.RENDER_SERVICE_ID)
    && env.RENDER_SERVICE_ID === env.MESSINHO_STAGING_RENDER_SERVICE_ID
    && Boolean(env.SUPABASE_URL && (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY));
}
export function validateMessinhoBackgroundTask(task, now = Date.now()) {
  const safety = Object.fromEntries((task?.pending_capabilities || []).map(id => [id, SAFE.has(id) ? 'read_only' : 'protected']));
  const gate = evaluateMessinhoTaskResume(task, { now, capabilitySafety: safety });
  if (!gate.allowed) return gate;
  const role = task?.plan?.role || 'scout';
  if (!['scout','trainer','coach','admin','manager','president'].includes(role))
    return { allowed:false, reason:'invalid_task_role' };
  return { ...gate, role };
}
export async function processMessinhoBackgroundTask({ db, task, workerId = makeWorkerId(), execute = runMessinhoCapabilityPlanAsync, now = Date.now() } = {}) {
  if (!db || !task?.id || !task?.owner_id || !task?.lease_token)
    return { ok:false, reason:'invalid_claim' };
  const gate = validateMessinhoBackgroundTask(task, now);
  const token = task.lease_token;
  const base = db.from('messinho_agent_tasks');
  const ownedUpdate = async patch => {
    const { data, error } = await base.update(patch).eq('id',task.id).eq('owner_id',task.owner_id)
      .eq('status','running').eq('claimed_by',task.claimed_by || workerId).eq('lease_token',token).select('id').maybeSingle();
    if (error) throw error;
    return data?.id === task.id;
  };
  if (!gate.allowed) {
    const ok = await ownedUpdate({ status:'failed', lease_until:null, claimed_by:null, lease_token:null,
      last_error:`Hintergrundfortsetzung gesperrt: ${gate.reason}`, updated_at:new Date().toISOString() });
    return { ok, reason:gate.reason, rejected:true };
  }
  const pending = gate.capabilities;
  const plan = { goal:task.goal, label:task.plan?.label || 'MESSINHO-Aufgabe',
    steps:pending, blocked_capabilities:[], deferred_capabilities:[] };
  try {
    const prior = Array.isArray(task.completed_results) ? task.completed_results : [];
    const input = { ...sanitizeContext(task.context), _previous_capability_results:prior.slice(-8) };
    const run = await execute(plan,input,gate.role,{ budgetMs:6500 });
    const results = [...prior,...(run.results || [])].slice(-20);
    const missing = (run.deferred_capabilities || []).filter(id => SAFE.has(id));
    const hasError = (run.results || []).some(item => item.status === 'error');
    const hasMissingInputs = (run.missing_inputs || []).length > 0;
    const complete = !missing.length && !hasError && !hasMissingInputs && run.status === 'completed';
    const attempts = Number(task.attempt_count) || 1;
    if (complete || hasMissingInputs) {
      const ok = await ownedUpdate({ status:complete?'completed':'waiting_for_input',
        completed_results:results,pending_capabilities:[],lease_until:null,claimed_by:null,lease_token:null,
        next_retry_at:null,last_error:null,updated_at:new Date().toISOString() });
      return { ok, status:complete?'completed':'waiting_for_input', result_count:results.length };
    }
    if (attempts >= MESSINHO_TASK_MAX_ATTEMPTS) {
      const ok = await ownedUpdate({ status:'failed',completed_results:results,pending_capabilities:missing,
        lease_until:null,claimed_by:null,lease_token:null,last_error:'Maximale Zahl sicherer Fortsetzungsversuche erreicht.',
        updated_at:new Date().toISOString() });
      return { ok, status:'failed', reason:'attempt_limit_reached' };
    }
    const delay = getMessinhoTaskRetryDelayMs(attempts);
    const retryAt = new Date(Date.now()+delay).toISOString();
    const ok = await ownedUpdate({ status:'partial',completed_results:results,pending_capabilities:missing.length?missing:pending,
      lease_until:null,claimed_by:null,lease_token:null,next_retry_at:retryAt,
      last_error:hasError?'Ein lesender Arbeitsschritt ist fehlgeschlagen; erneuter Versuch nach Wartezeit.':'Aufgabe blieb unvollständig.',
      updated_at:new Date().toISOString() });
    return { ok,status:'partial',retry_at:retryAt };
  } catch (error) {
    const attempts = Number(task.attempt_count) || 1;
    const terminal = attempts >= MESSINHO_TASK_MAX_ATTEMPTS;
    const ok = await ownedUpdate({ status:terminal?'failed':'partial',lease_until:null,claimed_by:null,lease_token:null,
      next_retry_at:terminal?null:new Date(Date.now()+getMessinhoTaskRetryDelayMs(attempts)).toISOString(),
      last_error:'Worker-Ausführung fehlgeschlagen; Details wurden aus Sicherheitsgründen nicht im Task gespeichert.',
      updated_at:new Date().toISOString() });
    return { ok,status:terminal?'failed':'partial',error_code:error?.code||'WORKER_EXECUTION_FAILED' };
  }
}
export function startMessinhoBackgroundWorker({ db, env = process.env, intervalMs = 15000, logger = console } = {}) {
  if (!isMessinhoBackgroundWorkerEnabled(env) || !db) {
    logger.info?.('MESSINHO background worker disabled (explicit staging gate not satisfied).');
    return { enabled:false, stop(){} };
  }
  let stopped = false, busy = false;
  const workerId = makeWorkerId();
  const tick = async () => {
    if (stopped || busy) return;
    busy = true;
    try {
      const { data, error } = await db.rpc('claim_next_messinho_agent_task',{ p_worker_id:workerId });
      if (error) throw error;
      const task = Array.isArray(data) ? data[0] : data;
      if (task) {
        const result = await processMessinhoBackgroundTask({ db,task,workerId });
        logger.info?.('MESSINHO background task processed', { task_id:task.id, ...result });
      }
    } catch (error) { logger.error?.('MESSINHO worker tick failed:',error.message); }
    finally { busy = false; }
  };
  const timer = setInterval(tick,Math.max(5000,intervalMs));
  timer.unref?.();
  void tick();
  return { enabled:true,workerId,stop(){stopped=true;clearInterval(timer);} };
}
