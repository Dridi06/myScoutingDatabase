import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const packageUrl=new URL('../knowledge-candidates/messinho-technical-intelligence-foundations.v2.json',import.meta.url);
const curriculum=JSON.parse(await readFile(packageUrl,'utf8'));

test('technical intelligence package contains a structured 7-level concept foundation',()=>{
 assert.equal(curriculum.package_id,'messinho.technical_intelligence.foundation');
 assert.equal(curriculum.version,'2.1.0');
 assert.equal(curriculum.status,'candidate_only_not_imported');
 assert.equal(curriculum.concepts.length,25);
 assert.equal(new Set(curriculum.concepts.map(x=>x.concept_key)).size,25);
 for(const concept of curriculum.concepts){
  assert.equal(concept.domain,'computer_science',concept.concept_key);
  assert.ok(concept.definition.length>=40,concept.concept_key);
  assert.ok(['foundational','intermediate','advanced','specialist'].includes(concept.knowledge_level));
  assert.ok(Array.isArray(concept.prerequisites));
  assert.ok(concept.sources.length>=1);
  assert.equal(concept.knowledge_status,'candidate');
  assert.equal(concept.rights.status,'pending_legal_review');
  assert.ok(concept.sources.every(source=>source.rights_status==='pending_review'));
 }
});

test('all prerequisite references resolve and the dependency graph is acyclic',()=>{
 const byKey=new Map(curriculum.concepts.map(x=>[x.concept_key,x]));
 for(const concept of curriculum.concepts){
  for(const prerequisite of concept.prerequisites){
   assert.ok(byKey.has(prerequisite),`Missing prerequisite ${prerequisite} for ${concept.concept_key}`);
   assert.notEqual(prerequisite,concept.concept_key);
  }
 }
 const visiting=new Set(),visited=new Set();
 function visit(key){
  if(visiting.has(key))throw new Error(`Prerequisite cycle at ${key}`);
  if(visited.has(key))return;
  visiting.add(key);
  for(const dependency of byKey.get(key).prerequisites)visit(dependency);
  visiting.delete(key);visited.add(key);
 }
 for(const key of byKey.keys())visit(key);
 assert.equal(visited.size,25);
});

test('each concept has explanation and transfer assessments',()=>{
 assert.equal(curriculum.learning_tasks.length,100);
 const byConcept=new Map();
 for(const task of curriculum.learning_tasks){
  assert.ok(curriculum.concepts.some(x=>x.concept_key===task.concept_key));
  assert.ok(['explain','transfer','diagnose','verify'].includes(task.kind));
  byConcept.set(task.concept_key,(byConcept.get(task.concept_key)||0)+1);
  assert.ok(task.success_criteria.length>=3);
 }
 assert.equal(byConcept.size,25);
 for(const count of byConcept.values())assert.equal(count,4);
 assert.ok(curriculum.learning_tasks.filter(task=>task.kind==='diagnose').length===25);
 assert.ok(curriculum.learning_tasks.filter(task=>task.kind==='verify').length===25);
});

test('rights-pending knowledge cannot be activated or executed by this package',()=>{
 assert.equal(curriculum.governance.knowledge_activation,'blocked_until_exact_source_rights_and_admin_review');
 assert.equal(curriculum.governance.execution_policy.includes('No code execution'),true);
 assert.ok(curriculum.concepts.every(x=>x.knowledge_status==='candidate'));
 assert.ok(curriculum.concepts.every(x=>x.rights.status!=='verified_permitted'));
 assert.equal(curriculum.sources_rights_review.pending_count,17);
});
