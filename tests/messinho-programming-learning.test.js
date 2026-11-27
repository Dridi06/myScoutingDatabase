import test from 'node:test';
import assert from 'node:assert/strict';
import {MESSINHO_PROGRAMMING_CURRICULUM,buildMessinhoProgrammingLearningContext,assessMessinhoProgrammingLearning} from '../backend/messinho-programming-learning.js';

test('provides four progressive programming learning levels with security and AI engineering',()=>{
 const context=buildMessinhoProgrammingLearningContext();
 assert.equal(context.levels.length,4);
 assert.ok(context.levels[0].topics.some(x=>x.includes('Funktionen')));
 assert.ok(context.levels[2].topics.some(x=>x.includes('Mandantentrennung')));
 assert.ok(context.levels[3].topics.some(x=>x.includes('Prompt-Injection')));
 assert.ok(MESSINHO_PROGRAMMING_CURRICULUM.every(x=>x.mastery.length>20));
});

test('does not treat unreviewed or unsupported observations as durable learning',()=>{
 assert.equal(assessMessinhoProgrammingLearning({concept:'SQL',explanation:'Eine längere Erklärung mit klarer Ursache und Wirkung.',testEvidence:'Testlauf 1 hat den Fehler reproduziert.'}).eligible,false);
 assert.equal(assessMessinhoProgrammingLearning({concept:'SQL',explanation:'Eine längere Erklärung mit klarer Ursache und Wirkung.',testEvidence:'Testlauf 1 hat den Fehler reproduziert.',reviewStatus:'approved'}).eligible,true);
 assert.equal(assessMessinhoProgrammingLearning({concept:'SQL',explanation:'Zu kurz',testEvidence:'x',reviewStatus:'approved'}).eligible,false);
});

test('keeps the curriculum deterministic and versioned for durable reuse',()=>{
 const a=buildMessinhoProgrammingLearningContext(),b=buildMessinhoProgrammingLearningContext();
 assert.equal(a.curriculum_version,b.curriculum_version);
 assert.deepEqual(a.levels,b.levels);
});
