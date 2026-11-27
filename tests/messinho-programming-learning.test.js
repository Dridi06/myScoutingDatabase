import test from 'node:test';
import assert from 'node:assert/strict';
import {MESSINHO_PROGRAMMING_CURRICULUM,buildMessinhoProgrammingLearningContext,assessMessinhoProgrammingLearning} from '../backend/messinho-programming-learning.js';
import {MESSINHO_PROGRAMMING_LANGUAGES,buildMessinhoLanguageLearningContext} from '../backend/messinho-programming-languages.js';

test('provides progressive programming levels with security and AI engineering',()=>{
 const context=buildMessinhoProgrammingLearningContext();
 assert.equal(context.levels.length,5);
 assert.ok(context.levels[0].topics.some(x=>x.includes('Funktionen')));
 assert.ok(context.levels[2].topics.some(x=>x.includes('Mandantentrennung')));
 assert.ok(context.levels[3].topics.some(x=>x.includes('Prompt-Injection')));
 assert.ok(context.levels[4].topics.some(x=>x.includes('Threat Modeling')));
 assert.ok(context.engineering_method.length>=8);
 assert.ok(context.knowledge_intake.workflow.includes('admin_approval'));
 assert.ok(context.proposal_quality_gate.required.includes('root_cause'));
 assert.ok(MESSINHO_PROGRAMMING_CURRICULUM.every(x=>x.mastery.length>20));
});

test('teaches the priority programming languages with language-specific concepts and tools',()=>{
 const context=buildMessinhoProgrammingLearningContext();
 const languageContext=buildMessinhoLanguageLearningContext();
 const names=MESSINHO_PROGRAMMING_LANGUAGES.map(x=>x.name);
 for(const required of ['JavaScript und TypeScript','Python','SQL und relationale Datenbanken','HTML und CSS','Java','C# und .NET','Go','Rust','C und C++','PHP','Bash und Shell-Scripting'])
  assert.ok(names.includes(required),`missing language profile: ${required}`);
 assert.equal(languageContext.languages.length,11);
 assert.equal(context.language_knowledge.version,'1.0.0');
 assert.ok(context.language_knowledge.cross_language_rules.some(x=>x.includes('Runtime')));
 for(const language of MESSINHO_PROGRAMMING_LANGUAGES){
  assert.ok(language.concepts.length>=6,`${language.name} lacks core concepts`);
  assert.ok(language.tools.length>=1,`${language.name} lacks tooling`);
  assert.ok(language.mastery.length>30,`${language.name} lacks mastery criteria`);
 }
});

test('does not treat unreviewed or unsupported observations as durable learning',()=>{
 assert.equal(assessMessinhoProgrammingLearning({concept:'SQL',explanation:'Eine längere Erklärung mit klarer Ursache und Wirkung.',testEvidence:'Testlauf 1 hat den Fehler reproduziert.'}).eligible,false);
 assert.equal(assessMessinhoProgrammingLearning({concept:'SQL',explanation:'Eine längere Erklärung mit klarer Ursache und Wirkung.',testEvidence:'Testlauf 1 hat den Fehler reproduziert.',reviewStatus:'approved'}).eligible,true);
 assert.equal(assessMessinhoProgrammingLearning({concept:'SQL',explanation:'Zu kurz',testEvidence:'x',reviewStatus:'approved'}).eligible,false);
});

test('keeps the curriculum deterministic and versioned for durable reuse',()=>{
 const a=buildMessinhoProgrammingLearningContext(),b=buildMessinhoProgrammingLearningContext();
 assert.equal(a.curriculum_version,b.curriculum_version);
 assert.equal(a.language_curriculum_version,b.language_curriculum_version);
 assert.deepEqual(a.levels,b.levels);
 assert.deepEqual(a.language_knowledge.languages,b.language_knowledge.languages);
});
