/**
 * MESSINHO Agent Core — bounded plan / execute / validate state machine.
 * Provider-independent and read-only: no database writes, model activation or external calls.
 */
import { runMessinhoCapabilityPlanAsync } from './messinho-orchestrator.js';
export const MESSINHO_AGENT_CORE_VERSION='1.0.0';
export const MAX_AGENT_EXECUTION_BUDGET_MS=8000;
const VALID_STATUSES=new Set(['completed','verified','proposal_ready','insufficient_data','error','denied','invalid_input','unknown_capability','unverified','needs_review','no_reliable_improvement']);
function addEvent(trace,name,details={}) { return [...trace,{step:trace.length+1,event:name,at:new Date().toISOString(),...details}]; }
export function validateMessinhoAgentRun(plan,run) {
 const expected=Array.isArray(plan?.steps)?plan.steps:[];
 const results=Array.isArray(run?.results)?run.results:[];
 const ids=results.map(item=>item?.capability_id).filter(Boolean);
 const duplicates=ids.filter((id,index)=>ids.indexOf(id)!==index);
 const unknownStatuses=results.filter(item=>!VALID_STATUSES.has(item?.status)).map(item=>item?.capability_id||'unknown');
 const missingResults=expected.filter(id=>!ids.includes(id));
 const malformed=results.filter(item=>!item||typeof item!=='object'||typeof item.capability_id!=='string');
 const missingProvenance=results.filter(item=>!['denied','invalid_input','unknown_capability'].includes(item?.status)&&(!item?.provenance||item.provenance.capability_id!==item.capability_id)).map(item=>item?.capability_id||'unknown');
 return {valid:duplicates.length===0&&unknownStatuses.length===0&&malformed.length===0&&missingProvenance.length===0,
   expected_steps:expected.length,returned_steps:results.length,duplicate_capabilities:[...new Set(duplicates)],
   unknown_status_capabilities:unknownStatuses,missing_provenance_capabilities:missingProvenance,missing_results:missingResults,
   missing_inputs:[...new Set(results.flatMap(item=>Array.isArray(item?.missing_inputs)?item.missing_inputs:[]))],
   evidence_policy:'Only supplied database facts and server-validated research bundles are accepted; generated prose is not evidence.'};
}
export async function executeMessinhoAgentPlan({plan,input={},role='scout',budgetMs=MAX_AGENT_EXECUTION_BUDGET_MS,onStep}={}) {
 const started=Date.now(),budget=Math.max(250,Math.min(MAX_AGENT_EXECUTION_BUDGET_MS,Number(budgetMs)||MAX_AGENT_EXECUTION_BUDGET_MS));
 let state={phase:'planning',goal:plan?.goal||'',trace:[]};
 state.trace=addEvent(state.trace,'plan_accepted',{steps:plan?.steps?.length||0,role});
 if(!plan||plan.denied||!Array.isArray(plan.steps)||!plan.steps.length){
   const phase=plan?.denied?'blocked':'needs_clarification';
   state={...state,phase,trace:addEvent(state.trace,'planning_stopped',{reason:plan?.denied?'permission_boundary':'no_matching_plan'})};
   return {plan,run:{status:plan?.denied?'denied':'needs_clarification',results:[],completed_steps:0,total_steps:0,
     blocked_capabilities:plan?.blocked_capabilities||[],missing_inputs:[],replan_recommended:false,provider_independent:true,model_weights_changed:false},
     state,validation:{valid:true,expected_steps:0,returned_steps:0}};
 }
 state={...state,phase:'executing',trace:addEvent(state.trace,'execution_started',{budget_ms:budget,max_steps:plan.steps.length})};
 let run=await runMessinhoCapabilityPlanAsync(plan,input,role,{budgetMs,onStep});
 state.trace=addEvent(state.trace,'execution_finished',{status:run.status,completed_steps:run.completed_steps,total_steps:run.total_steps,elapsed_ms:run.execution_trace?.elapsed_ms||Date.now()-started});
 const failed=(run.results||[]).filter(item=>item.status==='error').map(item=>item.capability_id);
 const remaining=budget-(Date.now()-started);
 if(failed.length&&remaining>=500){
   const retry=await runMessinhoCapabilityPlanAsync({...plan,steps:failed,blocked_capabilities:[],deferred_capabilities:[]},input,role,{budgetMs:Math.min(2000,remaining)});
   const replacements=new Map((retry.results||[]).map(item=>[item.capability_id,item]));
   const retried=run.results.map(item=>replacements.get(item.capability_id)||item);
   const unresolved=retry.results.filter(item=>item.status==='error').map(item=>item.capability_id);
   const deferred=[...new Set([...(run.deferred_capabilities||[]),...unresolved])];
   const useful= retried.filter(item=>['completed','verified','proposal_ready'].includes(item.status)).length;
   const incompleteResults=retried.filter(item=>['insufficient_data','error','denied','invalid_input','unknown_capability','unverified','needs_review','no_reliable_improvement'].includes(item.status));
   const nextStatus=deferred.length||run.blocked_capabilities?.length?'partial':useful===0&&incompleteResults.length?'insufficient_data':incompleteResults.length?'partial':'completed';
   run={...run,results:retried,deferred_capabilities:deferred,status:nextStatus,
     replan_recommended:unresolved.length>0||incompleteResults.some(item=>['insufficient_data','error'].includes(item.status)),
     execution_trace:{...run.execution_trace,retry_attempted:true,retried_capabilities:failed,retry_results:(retry.results||[]).map(item=>({capability_id:item.capability_id,status:item.status}))}};
   state.trace=addEvent(state.trace,'bounded_retry',{capabilities:failed,results:(retry.results||[]).map(item=>item.status)});
 }else if(failed.length){
   run={...run,status:'partial',deferred_capabilities:[...new Set([...(run.deferred_capabilities||[]),...failed])],replan_recommended:true};
 }
 state={...state,phase:'validating'};
 const validation=validateMessinhoAgentRun(plan,run);
 state.trace=addEvent(state.trace,'validation_finished',{valid:validation.valid,missing_results:validation.missing_results.length,missing_inputs:validation.missing_inputs.length});
 const hasErrors=(run.results||[]).some(item=>item.status==='error'),hasInputs=validation.missing_inputs.length>0;
 const incomplete=run.status!=='completed'||!validation.valid||hasErrors||run.blocked_capabilities?.length||run.deferred_capabilities?.length;
 const phase=!validation.valid?'failed':hasInputs?'waiting_for_input':incomplete?'partial':'completed';
 state={...state,phase,completed_at:new Date().toISOString(),elapsed_ms:Date.now()-started};
 state.trace=addEvent(state.trace,'agent_cycle_closed',{phase,elapsed_ms:state.elapsed_ms});
 return {plan,run:{...run,agent_core_version:MESSINHO_AGENT_CORE_VERSION,validation,
   next_action:hasInputs?'ask_user_for_missing_inputs':hasErrors?'diagnose_and_replan':run.deferred_capabilities?.length?'resume_deferred_steps':'report_result'},state,validation};
}
