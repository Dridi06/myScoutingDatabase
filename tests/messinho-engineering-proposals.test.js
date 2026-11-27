import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMessinhoEngineeringProposal,evaluateMessinhoEngineeringProposal,MESSINHO_ENGINEERING_PROPOSAL_POLICY} from '../backend/messinho-engineering-proposals.js';
const diff=(path='backend/messinho-quality-control.js')=>`diff --git a/${path} b/${path}
index 1111111..2222222 100644
--- a/${path}
+++ b/${path}
@@ -1 +1 @@
-const value = 1;
+const value = 2;
`;
const valid={id:'proposal-0001',title:'Verbesserte Fehlerbehandlung',rationale:'Der aktuelle Ablauf behandelt einen nachgewiesenen Randfall nicht konsistent und benötigt eine begrenzte Korrektur.',patch:diff(),test_plan:['Normalfall und Grenzfall testen','Fehlerfall und Regression prüfen'],benchmark_id:'baseline-v1',rollback_plan:'Vorherige Version anhand des Commits wiederherstellen und erneut prüfen.'};
test('accepts a bounded proposal but never applies it',()=>{
 const result=normalizeMessinhoEngineeringProposal(valid);
 assert.equal(result.ok,true);
 assert.equal(result.value.execution_mode,'proposal_only');
 assert.equal(result.value.safeguards.patch_applied,false);
 assert.equal(result.value.safeguards.commands_executed,false);
});
test('rejects protected operational and security-critical paths',()=>{
 for(const path of ['backend/server.js','backend/messinho-capability-runtime.js','backend/messinho-agent-core.js','supabase/migrations/patch.sql','backend/../server.js','.env','backend/secrets/key.pem']){
  assert.equal(normalizeMessinhoEngineeringProposal({...valid,patch:diff(path)}).ok,false,path);
 }
});
test('rejects command, network and environment execution content',()=>{
 for(const content of ['exec("rm -rf")','process.env.SECRET','fetch("https://evil.example")','child_process.spawn("sh")']){
  assert.equal(normalizeMessinhoEngineeringProposal({...valid,patch:diff().replace('const value = 2;',content)}).ok,false,content);
 }
});
test('requires bounded diff, tests, benchmark and rollback plan',()=>{
 assert.equal(normalizeMessinhoEngineeringProposal({...valid,patch:'not a diff'}).ok,false);
 assert.equal(normalizeMessinhoEngineeringProposal({...valid,test_plan:[]}).ok,false);
 assert.equal(normalizeMessinhoEngineeringProposal({...valid,rollback_plan:'x'}).ok,false);
 assert.equal(normalizeMessinhoEngineeringProposal({...valid,patch:Array.from({length:9},(_,i)=>diff('backend/example'+i+'.js')).join('\n')}).ok,false);
});
test('requires all six independent quality gates and exact frozen benchmark identity',()=>{
 const proposal=normalizeMessinhoEngineeringProposal(valid).value;
 const checks={unit_tests:true,regression_tests:true,security_review:true,tenant_isolation:true,build:true,resource_budget:true};
 const evaluation={checks,baseline_id:'baseline-v1',candidate_id:'proposal-0001',improvements:[{metric:'correctness',delta:0.1}],regressions:0,security_findings:0};
 assert.equal(evaluateMessinhoEngineeringProposal(proposal,evaluation).eligible,true);
 assert.deepEqual(evaluateMessinhoEngineeringProposal(proposal,{...evaluation,checks:{...checks,tenant_isolation:false}}).missing_checks,['tenant_isolation']);
 assert.equal(evaluateMessinhoEngineeringProposal(proposal,{...evaluation,baseline_id:'other'}).reason,'benchmark_identity_mismatch');
});
test('rejects false improvements, regressions and security findings',()=>{
 const proposal=normalizeMessinhoEngineeringProposal(valid).value;
 const evaluation={checks:{unit_tests:true,regression_tests:true,security_review:true,tenant_isolation:true,build:true,resource_budget:true},baseline_id:'baseline-v1',candidate_id:'proposal-0001',improvements:[{metric:'accuracy',delta:0.1}],regressions:0,security_findings:0};
 assert.equal(evaluateMessinhoEngineeringProposal(proposal,{...evaluation,improvements:[{metric:'accuracy',delta:-0.1}]}).eligible,false);
 assert.equal(evaluateMessinhoEngineeringProposal(proposal,{...evaluation,regressions:1}).reason,'regression_or_security_finding');
 assert.equal(evaluateMessinhoEngineeringProposal(proposal,{...evaluation,security_findings:1}).eligible,false);
});
test('even a passing evaluation cannot authorize deployment or patch application',()=>{
 const proposal=normalizeMessinhoEngineeringProposal(valid).value;
 const result=evaluateMessinhoEngineeringProposal(proposal,{checks:{unit_tests:true,regression_tests:true,security_review:true,tenant_isolation:true,build:true,resource_budget:true},baseline_id:'baseline-v1',candidate_id:'proposal-0001',improvements:[{metric:'correctness',delta:0.1}],regressions:0,security_findings:0});
 assert.equal(result.eligible,true);
 assert.equal(result.patch_applied,false);
 assert.equal(result.deployment_authorized,false);
 assert.equal(result.next_step,'admin_review_and_separate_staging_change');
 assert.equal(MESSINHO_ENGINEERING_PROPOSAL_POLICY.no_execution,true);
});

test('rejects file-system APIs and mismatched unified-diff file headers',()=>{
 for(const content of ['import fs from \'node:fs\';','writeFileSync(\'x\',\'y\')','process.binding(\'fs\')']){
  assert.equal(normalizeMessinhoEngineeringProposal({...valid,patch:diff().replace('const value = 2;',content)}).ok,false,content);
 }
 const mismatched=diff().replace('+++ b/backend/messinho-quality-control.js','+++ b/backend/other.js');
 assert.equal(normalizeMessinhoEngineeringProposal({...valid,patch:mismatched}).ok,false);
});


test('allows bounded ASI workspace UI proposals while keeping other frontend roots closed',()=>{
 const uiDiff=`diff --git a/src/asi/MyKiChat.jsx b/src/asi/MyKiChat.jsx
index 1111111..2222222 100644
--- a/src/asi/MyKiChat.jsx
+++ b/src/asi/MyKiChat.jsx
@@ -1 +1 @@
-const label = 'old';
+const label = 'new';
`;
 assert.equal(normalizeMessinhoEngineeringProposal({...valid,patch:uiDiff}).ok,true);
 assert.equal(normalizeMessinhoEngineeringProposal({...valid,patch:uiDiff.replaceAll('src/asi/MyKiChat.jsx','src/admin/Root.jsx')}).ok,false);
});

test('proposal gate matches the exact isolated-workflow patch allowlist',()=>{
 const allowed=[
  'backend/messinho-quality-control.js','backend/messinho-input-correction.js',
  'backend/messinho-task-policy.js','backend/messinho-development.js',
  'backend/messinho-performance-intelligence.js','backend/messinho-research.js',
  'backend/messinho-math.js','backend/messinho-conversation.js',
  'backend/messinho-learning.js','backend/messinho-knowledge-learning.js',
  'src/asi/MyKiChat.jsx','src/asi/myki-chat.css',
  'tests/messinho-quality-control.test.js','tests/messinho-task-policy.test.js',
  'tests/messinho-development.test.js','tests/messinho-capability-runtime.test.js',
  'tests/responsive-layout.test.js'
 ];
 for(const path of allowed){
  assert.equal(normalizeMessinhoEngineeringProposal({...valid,patch:diff(path)}).ok,true,path);
 }
 for(const path of ['backend/example.js','backend/server.js','tests/example.test.js','docs/notes.md','.github/workflows/other.yml','supabase/migrations/change.sql']){
  assert.equal(normalizeMessinhoEngineeringProposal({...valid,patch:diff(path)}).ok,false,path);
 }
});
