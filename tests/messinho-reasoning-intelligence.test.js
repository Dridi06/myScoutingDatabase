import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMessinhoReasoningIntelligence, MESSINHO_REASONING_INTELLIGENCE_VERSION } from '../backend/messinho-reasoning-intelligence.js';

test('multi-part planning request is decomposed into bounded, goal-relevant steps',()=>{
 const plan=buildMessinhoReasoningIntelligence({message:'Plane die Einführung, prüfe die Kosten und vergleiche zwei Alternativen.'});
 assert.equal(plan.version,MESSINHO_REASONING_INTELLIGENCE_VERSION);
 assert.equal(plan.task.kind,'comparison');
 assert.equal(plan.decomposition.required,true);
 assert.ok(plan.decomposition.steps.length>=3&&plan.decomposition.steps.length<=4);
 assert.equal(plan.comparison.required,true);
});

test('simple conversational request is not inflated into an unnecessary reasoning chain',()=>{
 const plan=buildMessinhoReasoningIntelligence({message:'Was bedeutet Abseits?'});
 assert.equal(plan.task.complexity,'simple');
 assert.equal(plan.decomposition.required,false);
 assert.equal(plan.decomposition.steps.length,1);
});

test('calculation plans explicitly validate inputs, arithmetic and units',()=>{
 const plan=buildMessinhoReasoningIntelligence({message:'Berechne 15 Prozent von 240 Euro.'});
 assert.equal(plan.task.kind,'calculation');
 assert.ok(plan.validation_checks.includes('verify_arithmetic_and_units'));
});

test('assumptions and hypotheses remain separate from verified facts',()=>{
 const plan=buildMessinhoReasoningIntelligence({message:'Angenommen der Spieler könnte bei höherem Pressing mehr Räume öffnen.'});
 assert.equal(plan.evidence_ledger.assumptions.length,1);
 assert.equal(plan.evidence_ledger.hypotheses.length,1);
 assert.deepEqual(plan.evidence_ledger.verified_facts,[]);
});

test('user statements and assistant claims retain separate attribution',()=>{
 const plan=buildMessinhoReasoningIntelligence({
  message:'Wie schnell ist er?',
  history:[{role:'user',text:'Der Spieler ist schnell.'},{role:'assistant',text:'Er ist vermutlich sehr schnell.'}]
 });
 assert.equal(plan.evidence_ledger.user_assertions[0].authority,'user_assertion_not_verified');
 assert.equal(plan.evidence_ledger.prior_assistant_claims[0].authority,'assistant_claim_not_independent_evidence');
 assert.deepEqual(plan.evidence_ledger.verified_facts,[]);
});

test('ambiguous references and absent research evidence are reported as unknowns',()=>{
 const plan=buildMessinhoReasoningIntelligence({
  message:'Wie schnell ist der Spieler aktuell?',
  contextIntelligenceContext:{entity_reference:{status:'ambiguous'}},
  reasoningContext:{evidence:[]}
 });
 assert.ok(plan.evidence_ledger.unknowns.some(item=>item.includes('not uniquely resolved')));
 assert.ok(plan.evidence_ledger.unknowns.some(item=>item.includes('No structured')));
});

test('explicit correction creates a review candidate rather than deciding which statement is true',()=>{
 const plan=buildMessinhoReasoningIntelligence({message:'Nein, ich meinte den anderen Spieler.'});
 assert.equal(plan.evidence_ledger.contradiction_candidates[0].status,'correction_or_conflict_candidate');
});

test('no numeric confidence is invented and output is bounded',()=>{
 const plan=buildMessinhoReasoningIntelligence({message:'x'.repeat(10000),history:Array.from({length:100},(_,i)=>({role:i%2?'assistant':'user',text:'x'.repeat(1000)}))});
 assert.equal(plan.confidence_policy,'not_numerically_scored_without_calibrated_evidence');
 assert.ok(plan.evidence_ledger.user_assertions.length<=4);
 assert.ok(plan.evidence_ledger.prior_assistant_claims.length<=3);
 assert.ok(plan.decomposition.steps.length<=4);
 assert.equal(Object.hasOwn(plan,'permissions'),false);
 assert.equal(Object.hasOwn(plan,'actions'),false);
});

test('multi-language correction and assumption cues are recognized conservatively',()=>{
 const correction=buildMessinhoReasoningIntelligence({message:'Non, je voulais dire le deuxième joueur.'});
 const assumption=buildMessinhoReasoningIntelligence({message:'If the player could improve acceleration, the role may change.'});
 assert.equal(correction.evidence_ledger.contradiction_candidates.length,1);
 assert.equal(assumption.evidence_ledger.assumptions.length,1);
 assert.equal(assumption.evidence_ledger.hypotheses.length,1);
});


test('authenticated chat creates one reasoning plan and forwards it to both language-model turns',async()=>{
 const {readFile}=await import('node:fs/promises');
 const server=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
 const router=await readFile(new URL('../backend/messinho-conversational-intelligence.js',import.meta.url),'utf8');
 const natural=await readFile(new URL('../backend/messinho-natural-conversation.js',import.meta.url),'utf8');
 assert.ok(server.includes("import { buildMessinhoReasoningIntelligence } from './messinho-reasoning-intelligence.js';"));
 assert.ok(server.includes('const reasoningIntelligenceContext=buildMessinhoReasoningIntelligence('));
 assert.ok(server.includes('reasoningIntelligenceContext,'));
 assert.ok(router.includes('reasoning_intelligence_context:reasoningIntelligenceContext||null'));
 assert.ok(natural.includes('reasoning_intelligence_context: reasoningIntelligenceContext || null'));
});
