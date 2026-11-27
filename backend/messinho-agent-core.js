/**
 * MESSINHO Agent Core — bounded plan / execute / validate state machine.
 * Provider-independent and read-only: no database writes, model activation or external calls.
 */
import { runMessinhoCapabilityPlanAsync, getMessinhoCapabilityDiscovery } from './messinho-orchestrator.js';
import { detectMessinhoKnowledgeGap } from './messinho-evolution.js';
import { buildMessinhoPerformanceIntelligence } from './messinho-performance-intelligence.js';
import { planMessinhoAutonomously, observeMessinhoExecution } from './messinho-autonomy.js';
import { dispatchMessinhoMyKiProposals } from './messinho-myki-bridge.js';
export const MESSINHO_AGENT_CORE_VERSION='2.0.0';
export const MAX_AGENT_EXECUTION_BUDGET_MS=8000;
export const MAX_AGENT_REPLAN_ATTEMPTS=1;
export const MAX_AGENT_REPLAN_STEPS=8;
const VALID_STATUSES=new Set(['completed','verified','proposal_ready','insufficient_data','error','denied','invalid_input','unknown_capability','unverified','needs_review','no_reliable_improvement']);
function addEvent(trace,name,details={}) { return [...trace,{step:trace.length+1,event:name,at:new Date().toISOString(),...details}]; }
/**
 * Accept only registered, role-permitted capabilities and exclude every capability
 * already attempted in this task. A semantic replan may add work, never repeat it.
 */
export function prepareMessinhoReplanPlan(candidatePlan, previousResults=[], role='scout') {
 if(!candidatePlan||candidatePlan.denied||!Array.isArray(candidatePlan.steps))return null;
 const catalogue=new Map(getMessinhoCapabilityDiscovery().map(item=>[item.id,item]));
 const attempted=new Set((Array.isArray(previousResults)?previousResults:[])
   .map(item=>item?.capability_id).filter(id=>typeof id==='string'));
 const blocked=new Set(Array.isArray(candidatePlan.blocked_capabilities)?candidatePlan.blocked_capabilities:[]);
 const eligible=[];
 for(const id of candidatePlan.steps){
  const capability=catalogue.get(id);
  if(!capability||attempted.has(id))continue;
  if(capability.admin_only&&role!=='admin'){blocked.add(id);continue;}
  if(!eligible.includes(id))eligible.push(id);
 }
 if(!eligible.length)return null;
 const steps=eligible.slice(0,MAX_AGENT_REPLAN_STEPS);
 const deferred=[...new Set([
  ...(candidatePlan.deferred_capabilities||[]).filter(id=>catalogue.has(id)&&!attempted.has(id)),
  ...eligible.slice(MAX_AGENT_REPLAN_STEPS)
 ])];
 return {...candidatePlan,denied:false,steps,blocked_capabilities:[...blocked],
  deferred_capabilities:deferred,replan:true,replan_excludes_attempted:true};
}

export function validateMessinhoAgentRun(plan,run) {
 const expected=Array.isArray(plan?.steps)?plan.steps:[];
 const results=Array.isArray(run?.results)?run.results:[];
 const ids=results.map(item=>item?.capability_id).filter(Boolean);
 const duplicates=ids.filter((id,index)=>ids.indexOf(id)!==index);
 const unknownStatuses=results.filter(item=>!VALID_STATUSES.has(item?.status)).map(item=>item?.capability_id||'unknown');
 const deferred=new Set(Array.isArray(run?.deferred_capabilities)?run.deferred_capabilities:[]);
 const missingResults=expected.filter(id=>!ids.includes(id)&&!deferred.has(id));
 const malformed=results.filter(item=>!item||typeof item!=='object'||typeof item.capability_id!=='string');
 const missingProvenance=results.filter(item=>!['denied','invalid_input','unknown_capability'].includes(item?.status)&&(!item?.provenance||item.provenance.capability_id!==item.capability_id)).map(item=>item?.capability_id||'unknown');
 return {valid:duplicates.length===0&&unknownStatuses.length===0&&malformed.length===0&&missingProvenance.length===0&&missingResults.length===0,
   expected_steps:expected.length,returned_steps:results.length,duplicate_capabilities:[...new Set(duplicates)],
   unknown_status_capabilities:unknownStatuses,missing_provenance_capabilities:missingProvenance,missing_results:missingResults,
   missing_inputs:[...new Set(results.flatMap(item=>Array.isArray(item?.missing_inputs)?item.missing_inputs:[]))],
   evidence_policy:'Only supplied database facts and server-validated research bundles are accepted; generated prose is not evidence.'};
}
export async function executeMessinhoAgentPlan({plan,input={},goal='',role='scout',budgetMs=MAX_AGENT_EXECUTION_BUDGET_MS,onStep,onEngineeringProposal,shouldStop,replan,runPlan=runMessinhoCapabilityPlanAsync}={}) {
 const started=Date.now(),budget=Math.max(250,Math.min(MAX_AGENT_EXECUTION_BUDGET_MS,Number(budgetMs)||MAX_AGENT_EXECUTION_BUDGET_MS));
 const autonomousPlanning=planMessinhoAutonomously(goal||plan?.goal||'',{role,context:input});
 plan=plan||autonomousPlanning.plan;
 let state={phase:'planning',goal:goal||plan?.goal||'',trace:[]};
 state.trace=addEvent(state.trace,'autonomous_goal_interpreted',{status:autonomousPlanning.status,contract_valid:autonomousPlanning.contract?.valid===true});
 state.trace=addEvent(state.trace,'plan_accepted',{steps:plan?.steps?.length||0,role});
 if(!plan||plan.denied||!Array.isArray(plan.steps)||!plan.steps.length){
   const phase=plan?.denied?'blocked':'needs_clarification';
   const knowledgeGap=detectMessinhoKnowledgeGap(plan?.goal||state.goal);
   state={...state,phase,knowledge_gap:knowledgeGap,trace:addEvent(state.trace,'planning_stopped',{reason:plan?.denied?'permission_boundary':'no_matching_plan',knowledge_gap:knowledgeGap.gap,knowledge_gap_reason:knowledgeGap.reason})};
   return {plan,run:{status:plan?.denied?'denied':'needs_clarification',approval_required:autonomousPlanning.status==='approval_required',results:[],completed_steps:0,total_steps:0,
     blocked_capabilities:plan?.blocked_capabilities||[],missing_inputs:[],replan_recommended:false,provider_independent:true,model_weights_changed:false},
     state,knowledge_gap:state.knowledge_gap||detectMessinhoKnowledgeGap(state.goal),validation:{valid:true,expected_steps:0,returned_steps:0}};
 }
 const performanceIntelligence=buildMessinhoPerformanceIntelligence(input,goal||plan.goal);
 const agentInput={...input,_messinho_autonomous_performance_intelligence:performanceIntelligence};
 state={...state,phase:'executing',trace:addEvent(state.trace,'execution_started',{budget_ms:budget,max_steps:plan.steps.length,performance_intelligence:'automatic'})};
 let run=await runPlan(plan,agentInput,role,{budgetMs,onStep,shouldStop});
 state.trace=addEvent(state.trace,run.stop_requested?'execution_stopped':'execution_finished',{status:run.status,completed_steps:run.completed_steps,total_steps:run.total_steps,elapsed_ms:run.execution_trace?.elapsed_ms||Date.now()-started});
 const failed=(run.results||[]).filter(item=>item.status==='error').map(item=>item.capability_id);
 const remaining=budget-(Date.now()-started);
 if(!run.stop_requested&&failed.length&&remaining>=500){
   const retry=await runPlan({...plan,steps:failed,blocked_capabilities:[],deferred_capabilities:[]},agentInput,role,{budgetMs:Math.min(2000,remaining)});
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
 // One model-assisted replan is allowed after the bounded retry still leaves errors.
 // The callback cannot execute tools; its proposed IDs are revalidated below.
 const unresolvedAfterRetry=(run.results||[]).filter(item=>item.status==='error');
 const remainingAfterRetry=budget-(Date.now()-started);
 if(MAX_AGENT_REPLAN_ATTEMPTS>0&&!run.stop_requested&&unresolvedAfterRetry.length&&typeof replan==='function'&&remainingAfterRetry>=750){
   try{
     state.trace=addEvent(state.trace,'replan_requested',{attempt:1,failed_capabilities:unresolvedAfterRetry.map(item=>item.capability_id)});
     const candidate=await replan({goal:state.goal,role,previous_results:run.results,
       failed_capabilities:unresolvedAfterRetry.map(item=>item.capability_id),attempt:1});
     const alternativePlan=prepareMessinhoReplanPlan(candidate,run.results,role);
     if(alternativePlan){
       const replanRun=await runPlan(alternativePlan,agentInput,role,
         {budgetMs:Math.max(250,Math.min(remainingAfterRetry,2500)),
          onStep:typeof onStep==='function'?checkpoint=>onStep({...checkpoint,
            completed_results:[...(run.results||[]),...(checkpoint.completed_results||[])],
            pending_capabilities:[...(checkpoint.pending_capabilities||[])]}):undefined,shouldStop});
       const mergedResults=[...(run.results||[]),...(replanRun.results||[])];
       const useful=mergedResults.filter(item=>['completed','verified','proposal_ready'].includes(item.status)).length;
       const incompleteResults=mergedResults.filter(item=>['insufficient_data','error','denied','invalid_input','unknown_capability','unverified','needs_review','no_reliable_improvement'].includes(item.status));
       const pending=[...new Set([...(run.deferred_capabilities||[]),...(replanRun.deferred_capabilities||[])])];
       const replanSteps=[...new Set([...(plan.steps||[]),...(alternativePlan.steps||[])])];
       plan={...plan,steps:replanSteps,discovered_capabilities:[...new Set([...(plan.discovered_capabilities||[]),...(alternativePlan.discovered_capabilities||[])])]};
       run={...run,results:mergedResults,completed_steps:useful,total_steps:mergedResults.length,
         status:run.stop_requested||replanRun.stop_requested?'stopped':pending.length||incompleteResults.length?'partial':useful?'completed':'insufficient_data',
         deferred_capabilities:pending,blocked_capabilities:[...new Set([...(run.blocked_capabilities||[]),...(alternativePlan.blocked_capabilities||[])])],
         missing_inputs:[...new Set(mergedResults.flatMap(item=>item.missing_inputs||[]))],
         replan_recommended:incompleteResults.some(item=>['error','insufficient_data'].includes(item.status))||pending.length>0,
         stop_requested:Boolean(run.stop_requested||replanRun.stop_requested),
         execution_trace:{...run.execution_trace,replan_attempted:true,replan_capabilities:alternativePlan.steps,
           replan_results:replanRun.results.map(item=>({capability_id:item.capability_id,status:item.status}))}};
       state.trace=addEvent(state.trace,'replan_executed',{capabilities:alternativePlan.steps,
         results:replanRun.results.map(item=>({capability_id:item.capability_id,status:item.status}))});
     }else{
       state.trace=addEvent(state.trace,'replan_not_available',{reason:'no_new_registered_capabilities'});
     }
   }catch(error){
     state.trace=addEvent(state.trace,'replan_failed',{reason:error?.name==='TimeoutError'?'planner_timeout':'planner_or_execution_error'});
   }
 }
 state={...state,phase:'validating'};
 const observation=observeMessinhoExecution(plan,run);
 state.trace=addEvent(state.trace,'autonomous_observation',{phase:observation.phase,completion_ratio:observation.completion_ratio,replan_recommended:observation.replan_recommended});
 const validation=validateMessinhoAgentRun(plan,run);
 const mykiDispatch=run.stop_requested?{eligible:0,submitted:0,duplicates:0,rejected:0,skipped:'admin_stop_requested'}:
   validation.valid?await dispatchMessinhoMyKiProposals({role,run,onProposal:onEngineeringProposal}):{eligible:0,submitted:0,duplicates:0,rejected:0,skipped:'agent_validation_failed'};
 state.trace=addEvent(state.trace,'myki_proposal_dispatch',{eligible:mykiDispatch.eligible,submitted:mykiDispatch.submitted,duplicates:mykiDispatch.duplicates||0,rejected:mykiDispatch.rejected||0});
 state.trace=addEvent(state.trace,'validation_finished',{valid:validation.valid,missing_results:validation.missing_results.length,missing_inputs:validation.missing_inputs.length});
 const hasErrors=(run.results||[]).some(item=>item.status==='error'),hasInputs=validation.missing_inputs.length>0;
 const incomplete=run.status!=='completed'||!validation.valid||hasErrors||run.blocked_capabilities?.length||run.deferred_capabilities?.length;
 const phase=run.stop_requested?'stopped':!validation.valid?'failed':hasInputs?'waiting_for_input':incomplete?'partial':'completed';
 state={...state,phase,completed_at:new Date().toISOString(),elapsed_ms:Date.now()-started};
 state.trace=addEvent(state.trace,'agent_cycle_closed',{phase,elapsed_ms:state.elapsed_ms});
 return {plan,contract:autonomousPlanning.contract,observation,run:{...run,performance_intelligence:performanceIntelligence,autonomous_observation:observation,agent_core_version:MESSINHO_AGENT_CORE_VERSION,validation,
   next_action:run.stop_requested?'stopped_by_admin':hasInputs?'ask_user_for_missing_inputs':hasErrors||observation.replan_recommended?'diagnose_and_replan':run.deferred_capabilities?.length?'resume_deferred_steps':'report_result',myki_dispatch:mykiDispatch},state,validation};
}
