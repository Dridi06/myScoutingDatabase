import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMessinhoGoalContract, planMessinhoAutonomously, observeMessinhoExecution,
  createMessinhoTaskCheckpoint, canResumeMessinhoTask
} from '../backend/messinho-autonomy.js';
import { executeMessinhoAgentPlan } from '../backend/messinho-agent-core.js';

test('autonomous planner composes a goal without a caller-supplied plan', async () => {
  const result = await executeMessinhoAgentPlan({ goal:'Analysiere Spieler X', input:{player:{name:'Spieler X'}}, role:'scout' });
  assert.ok(result.plan.steps.length > 0);
  assert.equal(result.contract.valid,true);
  assert.ok(result.state.trace.some(item=>item.event==='autonomous_goal_interpreted'));
  assert.ok(result.observation);
});

test('goal contract records success criteria and provider-independent constraints', () => {
  const contract=buildMessinhoGoalContract('Vergleiche zwei Mittelfeldspieler',{role:'scout',context:{player_ids:['a','b']}});
  assert.equal(contract.valid,true);
  assert.equal(contract.constraints.provider_independent,true);
  assert.equal(contract.constraints.source_data_mutation,false);
  assert.ok(contract.success_criteria.length>=4);
});

test('protected side-effect goals require human approval and are not executed', () => {
  const result=planMessinhoAutonomously('Lösche den Spieler aus der Datenbank',{role:'admin'});
  assert.equal(result.status,'approval_required');
  assert.equal(result.plan.denied,true);
  assert.deepEqual(result.plan.steps,[]);
});

test('observation distinguishes completed, missing-input and failed work', () => {
  const plan={steps:['overall_score','position_score']};
  const waiting=observeMessinhoExecution(plan,{results:[{capability_id:'overall_score',status:'insufficient_data',missing_inputs:['player_metrics']}]});
  assert.equal(waiting.phase,'waiting_for_input');
  assert.deepEqual(waiting.missing_steps,['position_score']);
  const failed=observeMessinhoExecution({steps:['overall_score']},{results:[{capability_id:'overall_score',status:'error'}]});
  assert.equal(failed.replan_recommended,true);
  assert.deepEqual(failed.retry_candidates,['overall_score']);
});

test('task checkpoint is owner and organization scoped before resume', () => {
  const created=createMessinhoTaskCheckpoint({
    taskId:'task-1',ownerId:'owner-1',organizationId:'org-1',goal:'Spieler analysieren',
    plan:{steps:['overall_score']},run:{status:'partial'},
    observation:{phase:'partial'},trace:[{step:1,event:'planned',at:'2026-11-26T00:00:00.000Z'}]
  });
  assert.equal(created.valid,true);
  assert.equal(canResumeMessinhoTask(created.checkpoint,{ownerId:'owner-2',organizationId:'org-1'}).allowed,false);
  assert.equal(canResumeMessinhoTask(created.checkpoint,{ownerId:'owner-1',organizationId:'org-2'}).allowed,false);
  assert.equal(canResumeMessinhoTask(created.checkpoint,{ownerId:'owner-1',organizationId:'org-1'}).allowed,true);
});

test('completed task checkpoints cannot be resumed', () => {
  const created=createMessinhoTaskCheckpoint({
    taskId:'task-2',ownerId:'owner-1',goal:'Analyse',plan:{steps:['overall_score']},
    observation:{phase:'completed'}
  });
  assert.equal(canResumeMessinhoTask(created.checkpoint,{ownerId:'owner-1'}).reason,'already_completed');
});

test('empty goal is rejected instead of creating a phantom task', () => {
  assert.equal(buildMessinhoGoalContract('').valid,false);
  assert.equal(createMessinhoTaskCheckpoint({taskId:'x',ownerId:'o',goal:''}).valid,false);
});
