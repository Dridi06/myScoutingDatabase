/**
 * MESSINHO Autonomous Supervisor.
 *
 * Provider-independent orchestration primitives. This module does not execute
 * generated code, mutate source data, contact third parties, or bypass roles.
 * Durable persistence is supplied by the caller through checkpoint callbacks.
 */
import { planMessinhoCapabilities } from './messinho-orchestrator.js';

export const MESSINHO_AUTONOMY_VERSION = '2.0.0';
export const MAX_AUTONOMOUS_GOAL_LENGTH = 1200;
export const MAX_CHECKPOINT_BYTES = 24000;
const PROTECTED_ACTION = /\b(?:loesche|lösche|delete|entferne|sende?\s+(?:eine?\s+)?(?:e-?mail|nachricht|anfrage|kontakt)|kontaktier(?:e|en)?\s+(?:den|die|das|einen|eine)|ueberweise|überweise|kaufe|buche\s+(?:einen|eine|das|den)|aktiviere\s+(?:das|den|die)|veroeffentliche|veröffentliche|aendere?\s+(?:modellgewicht|scoringmodell)|ändere\s+(?:modellgewicht|scoringmodell))\b/i;
const SUCCESS = new Set(['completed','verified','proposal_ready']);
const FAILURE = new Set(['error','denied','invalid_input','unknown_capability','unverified','needs_review','no_reliable_improvement']);

const clean = (value, max = MAX_AUTONOMOUS_GOAL_LENGTH) =>
  typeof value === 'string' ? value.normalize('NFKC').replace(/[\\u0000-\\u001f\\u007f]/g,' ').trim().slice(0,max) : '';

export function buildMessinhoGoalContract(goal, { role = 'scout', context = {} } = {}) {
  const objective = clean(goal);
  if (!objective) return { valid:false, errors:['goal_required'] };
  const sensitive = PROTECTED_ACTION.test(objective);
  return {
    valid:true,
    goal:objective,
    role:clean(role,40) || 'scout',
    success_criteria:[
      'Alle geplanten Schritte besitzen ein Ergebnis oder einen dokumentierten Blockierungsgrund.',
      'Fakten und Schlussfolgerungen bleiben nachvollziehbar getrennt.',
      'Berechtigungen und Datenherkunft werden für jeden Schritt geprüft.',
      'Unvollständige oder widersprüchliche Ergebnisse werden nicht als abgeschlossen ausgegeben.'
    ],
    constraints:{
      provider_independent:true,
      source_data_mutation:false,
      external_contact:false,
      model_weight_mutation:false,
      protected_action_detected:sensitive,
      requires_human_approval:sensitive
    },
    context_keys:Object.keys(context && typeof context === 'object' && !Array.isArray(context) ? context : {}).slice(0,20)
  };
}

/** Plans from the goal itself; catalogue/dependency/role checks remain authoritative. */
export function planMessinhoAutonomously(goal, { role = 'scout', context = {} } = {}) {
  const contract = buildMessinhoGoalContract(goal,{role,context});
  if (!contract.valid) return { contract, plan:null, status:'invalid_goal' };
  if (contract.constraints.protected_action_detected) {
    return { contract, plan:{denied:true,goal:contract.goal,steps:[],blocked_capabilities:[],reason:'human_approval_required'}, status:'approval_required' };
  }
  const plan = planMessinhoCapabilities(contract.goal,contract.role,context);
  return {
    contract,
    plan:plan ? {...plan, autonomy_version:MESSINHO_AUTONOMY_VERSION, success_criteria:contract.success_criteria} : null,
    status:plan ? (plan.denied ? 'denied' : 'planned') : 'needs_clarification'
  };
}

export function observeMessinhoExecution(plan, run) {
  const results = Array.isArray(run?.results) ? run.results : [];
  const expected = Array.isArray(plan?.steps) ? plan.steps : [];
  const completed = results.filter(item => SUCCESS.has(item?.status));
  const failed = results.filter(item => FAILURE.has(item?.status));
  const missing = expected.filter(id => !results.some(item => item?.capability_id === id));
  const missingInputs = [...new Set(results.flatMap(item => Array.isArray(item?.missing_inputs) ? item.missing_inputs : []))];
  const blocked = [...new Set([...(run?.blocked_capabilities || []), ...results.filter(item => item?.status === 'denied').map(item => item.capability_id)])];
  const replan = failed.filter(item => item?.status === 'error').map(item => item.capability_id);
  const phase = missingInputs.length ? 'waiting_for_input' : missing.length || replan.length || blocked.length ? 'partial' : failed.length ? 'needs_review' : 'completed';
  return {
    phase, completed_count:completed.length, failed_count:failed.length,
    missing_steps:missing, missing_inputs:missingInputs, blocked_capabilities:blocked,
    retry_candidates:[...new Set(replan)],
    replan_recommended:replan.length > 0 || missing.length > 0,
    completion_ratio:expected.length ? Number((completed.length / expected.length).toFixed(3)) : 0,
    success_criteria_met:phase === 'completed' && completed.length === expected.length,
    observed_at:new Date().toISOString()
  };
}

/** A bounded, JSON-safe checkpoint; caller must persist it with owner/org scope. */
export function createMessinhoTaskCheckpoint({ taskId, ownerId, organizationId = null, goal, plan, run, observation, trace = [] } = {}) {
  const id = clean(taskId,120), owner = clean(ownerId,120), objective = clean(goal);
  if (!id || !owner || !objective) return { valid:false, errors:['task_owner_and_goal_required'] };
  const safePlan = plan && typeof plan === 'object' ? {
    goal:clean(plan.goal), steps:Array.isArray(plan.steps) ? plan.steps.slice(0,20).map(x=>clean(x,100)) : [],
    blocked_capabilities:Array.isArray(plan.blocked_capabilities) ? plan.blocked_capabilities.slice(0,20).map(x=>clean(x,100)) : [],
    deferred_capabilities:Array.isArray(plan.deferred_capabilities) ? plan.deferred_capabilities.slice(0,20).map(x=>clean(x,100)) : []
  } : null;
  const checkpoint = {
    schema_version:1, task_id:id, owner_id:owner,
    organization_id:clean(organizationId,120) || null, goal:objective,
    plan:safePlan,
    run_status:clean(run?.status,40) || 'pending',
    observation:observation && typeof observation === 'object' ? observation : null,
    trace:Array.isArray(trace) ? trace.slice(-40).map(item=>({
      event:clean(item?.event,80), at:clean(item?.at,40), step:Number.isInteger(item?.step)?item.step:null
    })) : [],
    updated_at:new Date().toISOString()
  };
  const bytes = Buffer.byteLength(JSON.stringify(checkpoint),'utf8');
  if (bytes > MAX_CHECKPOINT_BYTES) return { valid:false, errors:['checkpoint_size_limit_exceeded'] };
  return { valid:true, checkpoint };
}

export function canResumeMessinhoTask(checkpoint, { ownerId, organizationId = null } = {}) {
  if (!checkpoint || checkpoint.schema_version !== 1) return { allowed:false, reason:'invalid_checkpoint' };
  if (!ownerId || checkpoint.owner_id !== ownerId) return { allowed:false, reason:'owner_scope_mismatch' };
  if ((checkpoint.organization_id || null) !== (organizationId || null)) return { allowed:false, reason:'organization_scope_mismatch' };
  if (checkpoint.observation?.phase === 'completed') return { allowed:false, reason:'already_completed' };
  if (!Array.isArray(checkpoint.plan?.steps) || !checkpoint.plan.steps.length) return { allowed:false, reason:'no_resumable_plan' };
  return { allowed:true, reason:'checkpoint_scope_verified' };
}
