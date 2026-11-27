import test from 'node:test';
import assert from 'node:assert/strict';
import {MESSINHO_PROGRAMMING_CURRICULUM,buildMessinhoProgrammingLearningContext,assessMessinhoProgrammingLearning} from '../backend/messinho-programming-learning.js';
import {MESSINHO_PROGRAMMING_LANGUAGES,buildMessinhoLanguageLearningContext} from '../backend/messinho-programming-languages.js';
import {detectMessinhoSourceLanguage,buildMessinhoCodebaseIntelligence,buildMessinhoAutonomousEngineeringProtocol} from '../backend/messinho-code-intelligence.js';

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

test('detects supported source languages and excludes secrets and generated files',()=>{
 assert.equal(detectMessinhoSourceLanguage('src/App.tsx').language_id,'javascript-typescript');
 assert.equal(detectMessinhoSourceLanguage('worker.py').language_id,'python');
 assert.equal(detectMessinhoSourceLanguage('migrations/schema.sql').language_id,'sql');
 assert.equal(detectMessinhoSourceLanguage('src/Service.cs').language_id,'csharp-dotnet');
 assert.equal(detectMessinhoSourceLanguage('src/main.rs').language_id,'rust');
 assert.equal(detectMessinhoSourceLanguage('.env').supported,false);
 assert.equal(detectMessinhoSourceLanguage('node_modules/pkg/index.js').supported,false);
 assert.equal(detectMessinhoSourceLanguage('../outside.js').supported,false);
});

test('builds language-specific validation plans without claiming commands ran',()=>{
 const plan=buildMessinhoCodebaseIntelligence({files:[
  {path:'src/App.tsx'},{path:'backend/api.py'},{path:'db/schema.sql'},
  {path:'src/Worker.go'},{path:'src/Program.cs'},{path:'.env'},
  {path:'node_modules/pkg/index.js'},{path:'README.md'}
 ],availableTools:['node','npm']});
 assert.equal(plan.language_count,5);
 assert.equal(plan.supported_file_count,5);
 assert.equal(plan.execution_safety.execute_untrusted_code,false);
 assert.equal(plan.execution_safety.require_isolated_sandbox,true);
 assert.ok(plan.languages.find(x=>x.language_id==='javascript-typescript').available_tools.includes('node'));
 assert.ok(plan.languages.find(x=>x.language_id==='python').validation_plan.some(x=>x.includes('pytest')));
 assert.match(plan.policy,/not proof that tools exist or ran/);
});

test('defines a measured autonomous improvement loop with strict execution boundaries',()=>{
 const protocol=buildMessinhoAutonomousEngineeringProtocol();
 assert.equal(protocol.modes.includes('validate'),true);
 assert.equal(protocol.loop.length,7);
 assert.ok(protocol.loop.find(x=>x.name==='Compare').requires.includes('before_after_results'));
 assert.ok(protocol.hard_limits.some(x=>x.includes('exact candidate revision')));
 assert.ok(protocol.hard_limits.some(x=>x.includes('application process')));
});
