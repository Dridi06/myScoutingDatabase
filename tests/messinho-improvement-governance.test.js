import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMessinhoHypothesisCreate,normalizeMessinhoHypothesisTransition,canTransitionMessinhoHypothesis,getMessinhoHypothesisNextStatus} from '../backend/messinho-improvement-governance.js';

const hypothesis={id:'low_rating:player_search',type:'repeated_low_quality',group_by:'capability_or_intent',group:'player_search',sample_size:5,priority:'high',proposal:'Prüfkriterien und Regressionstests für diese Aufgabenklasse untersuchen.'};

test('normalizes bounded hypothesis payloads and rejects malformed values',()=>{
 const result=normalizeMessinhoHypothesisCreate({hypothesis});
 assert.equal(result.ok,true);
 assert.equal(result.value.hypothesis.sample_size,5);
 assert.equal(normalizeMessinhoHypothesisCreate({hypothesis:{...hypothesis,sample_size:0}}).ok,false);
 assert.equal(normalizeMessinhoHypothesisCreate({hypothesis:{...hypothesis,proposal:'x'}}).ok,false);
});

test('requires a reason when creating a governed hypothesis',()=>{
 assert.equal(normalizeMessinhoHypothesisCreate({hypothesis,reason:'Zu kurz'}).ok,false);
 assert.equal(normalizeMessinhoHypothesisCreate({hypothesis}).ok,true);
});

test('enforces the finite human-reviewed lifecycle',()=>{
 assert.equal(canTransitionMessinhoHypothesis('proposed','accept'),true);
 assert.equal(canTransitionMessinhoHypothesis('proposed','create_test'),false);
 assert.equal(canTransitionMessinhoHypothesis('accepted','create_test'),true);
 assert.equal(canTransitionMessinhoHypothesis('test_created','validate'),true);
 assert.equal(canTransitionMessinhoHypothesis('validated','accept'),false);
 assert.equal(canTransitionMessinhoHypothesis('rejected','accept'),false);
 assert.equal(canTransitionMessinhoHypothesis('validated','rollback'),true);
 assert.equal(getMessinhoHypothesisNextStatus('create_test'),'test_created');
});

test('requires an explicit test plan before creating a test',()=>{
 assert.equal(normalizeMessinhoHypothesisTransition({action:'create_test',reason:'Test wird kontrolliert angelegt.'}).ok,false);
 assert.equal(normalizeMessinhoHypothesisTransition({action:'create_test',reason:'Test wird kontrolliert angelegt.',test_plan:'Vergleich mit festem Regressionstestset und dokumentiertem Baseline-Ergebnis.'}).ok,true);
});

test('validation requires HTTPS evidence, passed=true and a meaningful summary',()=>{
 const valid={action:'validate',reason:'Regressionstest wurde ausgewertet.',evidence_url:'https://example.org/report',evaluation:{passed:true,summary:'Alle definierten Regressionstests wurden bestanden.'}};
 assert.equal(normalizeMessinhoHypothesisTransition(valid).ok,true);
 assert.equal(normalizeMessinhoHypothesisTransition({...valid,evidence_url:'http://example.org'}).ok,false);
 assert.equal(normalizeMessinhoHypothesisTransition({...valid,evaluation:{passed:false,summary:'Test fehlgeschlagen'}}).ok,false);
});

test('does not accept unknown actions or unsafe evidence links',()=>{
 assert.equal(normalizeMessinhoHypothesisTransition({action:'activate',reason:'Unbekannte Aktion'}).ok,false);
 assert.equal(normalizeMessinhoHypothesisTransition({action:'accept',reason:'Hypothese wird angenommen.',evidence_url:'javascript:alert(1)'}).ok,false);
});
