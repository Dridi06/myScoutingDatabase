import test from 'node:test';
import assert from 'node:assert/strict';
import { runMessinhoFullStackIntelligenceAudit } from '../backend/messinho-full-stack-audit.js';

test('full-stack audit covers all implemented diagnostic layers and records safe execution boundaries',async()=>{
 const audit=await runMessinhoFullStackIntelligenceAudit({env:{MESSINHO_MODEL_BASE_URL:'http://127.0.0.1:1234/v1'},history:[]});
 assert.equal(audit.audit_type,'full_stack_intelligence_sandbox_audit');
 assert.equal(audit.modules.length,9);
 const categories=new Set(audit.modules.map(item=>item.category));
 for(const category of ['Code & Tools','LLM & Modellbindung','Intelligence & Linguistik','Sandbox & Ressourcen','Kognition & Sicherheit','Tool-Fuzzing','Memory-Integrität','Sicherheit','Evolution'])assert.ok(categories.has(category),category);
 assert.equal(audit.scope.external_provider_calls,0);
 assert.equal(audit.scope.tool_executions,0);
 assert.equal(audit.scope.sandbox_jobs_dispatched,0);
 assert.equal(audit.scope.database_mutations,0);
 assert.equal(audit.scope.production_access,false);
});

test('sandbox audit verifies isolation and rejects a production service identity',async()=>{
 const audit=await runMessinhoFullStackIntelligenceAudit({env:{MESSINHO_MODEL_BASE_URL:'http://127.0.0.1:1234/v1'}});
 const sandbox=audit.modules.find(item=>item.category==='Sandbox & Ressourcen');
 assert.ok(sandbox,JSON.stringify(audit.modules));
 assert.equal(sandbox.ok,true,JSON.stringify(sandbox.evidence));
 assert.equal(sandbox.evidence.controls.production_gate_rejects_mismatched_service,true);
 assert.equal(sandbox.evidence.execution.network_access,false);
});

test('model configuration audit does not claim a live provider check',async()=>{
 const audit=await runMessinhoFullStackIntelligenceAudit({env:{MESSINHO_MODEL_BASE_URL:'http://127.0.0.1:1234/v1'}});
 const model=audit.modules.find(item=>item.category==='LLM & Modellbindung');
 assert.equal(model.ok,true);
 assert.equal(model.evidence.live_provider_probe,'not_requested');
});

test('audit history is compared to the prior run rather than the current report',async()=>{
 const history=[{status:'healthy',summary:{total:10,passed:8,failed:2},created_at:'2026-11-27T10:00:00Z'}];
 const audit=await runMessinhoFullStackIntelligenceAudit({env:{MESSINHO_MODEL_BASE_URL:'http://127.0.0.1:1234/v1'},history});
 const evolution=audit.modules.find(item=>item.category==='Evolution');
 assert.equal(evolution.evidence.previous_runs,1);
 assert.equal(evolution.evidence.previous_pass_rates[0],0.8);
 assert.equal(evolution.evidence.trend,'improving');
});

test('tool fuzzing, memory integrity and prompt injection boundaries pass safely',async()=>{
 const audit=await runMessinhoFullStackIntelligenceAudit({env:{MESSINHO_MODEL_BASE_URL:'http://127.0.0.1:1234/v1'}});
 for(const category of ['Tool-Fuzzing','Memory-Integrität','Sicherheit']){
  const item=audit.modules.find(module=>module.category===category);
  assert.ok(item,category);
  assert.equal(item.ok,true,item.detail+' '+JSON.stringify(item.evidence));
 }
});
