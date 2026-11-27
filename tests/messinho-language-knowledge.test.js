import test from 'node:test';
import assert from 'node:assert/strict';
import {findMessinhoLanguageKnowledge,formatMessinhoLanguageKnowledge,getMessinhoLanguageKnowledgeSummary} from '../backend/messinho-language-knowledge.js';

function fakeDb(rows) {
 const query={select(){return this;},eq(){return this;},order(){return this;},limit(){return Promise.resolve({data:rows,error:null});}};
 return {from(name){assert.equal(name,'messinho_language_knowledge');return query;}};
}

test('language knowledge is registered for six language profiles and append-only',()=>{
 const summary=getMessinhoLanguageKnowledgeSummary();
 assert.equal(summary.profiles.length,6);
 assert.equal(summary.retention,'append_only_versions');
 assert.equal(summary.write_access,'none_from_chat_or_scout_roles');
});

test('retrieves only the detected language and shared language entries',async()=>{
 const rows=[
  {entry_key:'de.grammar.word_order',version:1,language_code:'de',entry_type:'grammar',topic:'Satzbau',title:'Verbzweitstellung',content:{explanation:'Im deutschen Hauptsatz steht das finite Verb meist an zweiter Satzposition.'},tags:['Verb','Hauptsatz'],knowledge_status:'active'},
  {entry_key:'en.grammar.word_order',version:1,language_code:'en',entry_type:'grammar',topic:'Sentence structure',title:'English word order',content:{explanation:'English declarative clauses commonly use subject-verb-object order.'},tags:['word order'],knowledge_status:'active'},
  {entry_key:'shared.grammar.word_order',version:1,language_code:'shared',entry_type:'grammar',topic:'Clause structure',title:'Shared clause structure',content:{explanation:'The position of the finite verb is an important part of clause structure.'},tags:['Verbzweitstellung','Hauptsatz'],knowledge_status:'active'}
 ];
 const result=await findMessinhoLanguageKnowledge(fakeDb(rows),'Wie funktioniert die Verbzweitstellung im deutschen Hauptsatz?');
 assert.equal(result.language_id,'de');
 assert.equal(result.items.length,2);
 assert.deepEqual(result.items.map(item=>item.entry_key).sort(),['de.grammar.word_order','shared.grammar.word_order']);
});

test('supports Tunisian Derja knowledge as its own language profile',async()=>{
 const rows=[{entry_key:'ar-tn.grammar.negation',version:1,language_code:'ar-tn',entry_type:'grammar',topic:'Negation',title:'Negation in Derja',content:{explanation:'Eine häufige tunesische Verneinung verwendet ma- vor dem Verb und -sh danach.'},tags:['ma','ch','negation'],knowledge_status:'active'}];
 const result=await findMessinhoLanguageKnowledge(fakeDb(rows),'Ma fhemtch chnowa 9olt.');
 assert.equal(result.language_id,'ar-tn');
 assert.equal(result.items[0].entry_key,'ar-tn.grammar.negation');
});

test('latest version per entry wins without deleting prior versions',async()=>{
 const rows=[
  {entry_key:'es.grammar.gender',version:2,language_code:'es',entry_type:'grammar',topic:'Género',title:'Updated rule',content:{explanation:'Version two'},tags:['gender'],knowledge_status:'active'},
  {entry_key:'es.grammar.gender',version:1,language_code:'es',entry_type:'grammar',topic:'Género',title:'Old rule',content:{explanation:'Version one'},tags:['gender'],knowledge_status:'active'}
 ];
 const result=await findMessinhoLanguageKnowledge(fakeDb(rows),'Hola, ¿cómo se usa el género gramatical en español?');
 assert.equal(result.items[0].version,2);
 assert.equal(result.items[0].title,'Updated rule');
});

test('formatter emits compact grounded context only',()=>{
 const result=formatMessinhoLanguageKnowledge({items:[{language_code:'fr',entry_type:'grammar',topic:'Accord',title:'Genre',content:{explanation:'Les adjectifs s’accordent avec le nom.',examples:[{text:'une joueuse rapide',meaning:'a fast female player'}]},level:'foundational',version:1,provenance_type:'original_authored'}]});
 assert.equal(result[0].explanation,'Les adjectifs s’accordent avec le nom.');
 assert.equal(result[0].examples[0].text,'une joueuse rapide');
});

test('database errors fail closed without fabricated entries',async()=>{
 const db={from(){return {select(){return this;},eq(){return this;},order(){return this;},limit(){return Promise.resolve({data:null,error:{code:'42P01'}});}};}};
 const result=await findMessinhoLanguageKnowledge(db,'What does this mean?');
 assert.equal(result.status,'unavailable');
 assert.deepEqual(result.items,[]);
});

test('ambiguous text never loads an unrelated language pack',async()=>{
 const rows=[
  {entry_key:'de.lexicon.core',version:2,language_code:'de',entry_type:'lexicon',topic:'Wortschatz',title:'Deutsch',content:{explanation:'German only'},tags:['Deutsch'],knowledge_status:'active'},
  {entry_key:'en.lexicon.core',version:2,language_code:'en',entry_type:'lexicon',topic:'Vocabulary',title:'English',content:{explanation:'English only'},tags:['English'],knowledge_status:'active'}
 ];
 const result=await findMessinhoLanguageKnowledge(fakeDb(rows),'OK');
 assert.equal(result.language_id,null);
 assert.equal(result.items.length,0);
});
