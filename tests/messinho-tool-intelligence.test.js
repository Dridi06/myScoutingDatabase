import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMessinhoToolIntelligence } from '../backend/messinho-tool-intelligence.js';

test('tool intelligence distinguishes specialist handlers from generic fallbacks',()=>{
 const report=buildMessinhoToolIntelligence({steps:['overall_score','potential_analysis']},'scout',{
  player:{performance_metrics:{technical:80},positions:['CM']}
 });
 assert.equal(report.selected_count,2);
 assert.ok(report.specialist_count>=1);
 assert.ok(report.tools.every(item=>['specialist','generic_fallback','not_dispatched'].includes(item.runtime_status)));
 assert.equal(report.execution_guard.includes('authoritative'),true);
});

test('tool intelligence marks admin-only work blocked for scouts',()=>{
 const report=buildMessinhoToolIntelligence({steps:['weight_optimization']},'scout',{});
 assert.equal(report.tools[0].permission_status,'blocked_admin_only');
 assert.deepEqual(report.unavailable_capabilities,['weight_optimization']);
});

test('tool intelligence reports missing and unassessed input contracts honestly',()=>{
 const report=buildMessinhoToolIntelligence({steps:['overall_score','club_fit_score']},'admin',{});
 assert.ok(report.tools[0].missing_inputs.includes('player_metrics'));
 assert.equal(report.tools[1].missing_inputs.includes('club_needs'),true);
 assert.equal(report.tools[1].input_readiness,'may_need_input');
});
