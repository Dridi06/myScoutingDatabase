import test from 'node:test';
import assert from 'node:assert/strict';
import {findMessinhoLanguageKnowledge,formatMessinhoLanguageKnowledge,getMessinhoLanguageKnowledgeSummary} from '../backend/messinho-language-knowledge.js';

function fakeDb(rows, selected=[]) {
 const query={select(columns){selected.push(columns);return this;},eq(){return this;},order(){return this;},limit(){return Promise.resolve({data:rows,error:null});}};
 return {from(name){assert.equal(name,'messinho_language_knowledge');return query;}};
}

test('language knowledge is registered for six language profiles and append-only',()=>{
 const summary=getMessinhoLanguageKnowledgeSummary();
 assert.equal(summary.version,'1.2.0');
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

test('database selection uses only columns present in the versioned migration',async()=>{
 const selected=[];
 const db=fakeDb([{entry_key:'de.grammar.main_clause',version:1,language_code:'de',entry_type:'grammar',topic:'Satzbau',title:'Verbzweit',content:{explanation:'Das finite Verb steht an zweiter Position.'},tags:['Verbzweit'],knowledge_status:'active'}],selected);
 await findMessinhoLanguageKnowledge(db,'Wie funktioniert die Verbzweitstellung im deutschen Hauptsatz?');
 assert.equal(selected.length,1);
 assert.match(selected[0],/created_at/);
 assert.doesNotMatch(selected[0],/updated_at/);
});


test('loads approved knowledge for every detected language segment in mixed-language messages',async()=>{
 const rows=[
  {entry_key:'en.grammar.word_order',version:1,language_code:'en',entry_type:'grammar',topic:'Sentence structure',title:'English word order',content:{explanation:'English uses subject-verb-object order.'},tags:['subject','verb','object','player','league','ready'],knowledge_status:'active'},
  {entry_key:'fr.grammar.word_order',version:1,language_code:'fr',entry_type:'grammar',topic:'Syntaxe',title:'Ordre des mots',content:{explanation:'Le français suit généralement sujet-verbe-complément.'},tags:['sujet','verbe','complément','joueur','analyser','points forts'],knowledge_status:'active'},
  {entry_key:'de.grammar.word_order',version:1,language_code:'de',entry_type:'grammar',topic:'Satzbau',title:'Deutsche Satzstellung',content:{explanation:'Im Hauptsatz steht das finite Verb normalerweise an zweiter Position.'},tags:['Verbzweit'],knowledge_status:'active'}
 ];
 const result=await findMessinhoLanguageKnowledge(fakeDb(rows),'The player is not ready for this league yet. Bonjour, je voudrais analyser ce joueur et comprendre ses points forts.');
 assert.deepEqual(result.language_ids.sort(),['en','fr']);
 assert.deepEqual(result.items.map(item=>item.language_code).sort(),['en','fr']);
});

test('returns all segment languages when the overall message is mixed',async()=>{
 const rows=[
  {entry_key:'ar.lexicon.core',version:1,language_code:'ar',entry_type:'lexicon',topic:'Arabic',title:'Arabic words',content:{explanation:'Arabic vocabulary context.'},tags:['لاعب'],knowledge_status:'active'},
  {entry_key:'ar-tn.lexicon.core',version:1,language_code:'ar-tn',entry_type:'lexicon',topic:'Derja',title:'Tunisian words',content:{explanation:'Tunisian Derja vocabulary context.'},tags:['barcha'],knowledge_status:'active'}
 ];
 const result=await findMessinhoLanguageKnowledge(fakeDb(rows),'السلام عليكم، كيف حالك؟ Aslema, labes barcha? Chnowa rayek?');
 assert.ok(result.language_ids.includes('ar'));
 assert.ok(result.language_ids.includes('ar-tn'));
});


test('retrieves structured football scouting knowledge and its learning safeguards',async()=>{
 const rows=[{
  entry_key:'de.lexicon.football_scouting',version:1,language_code:'de',entry_type:'lexicon',
  topic:'Fußball- und Scoutingterminologie',title:'Fußballbegriffe im Kontext',
  content:{
   explanation:'Scoutingbegriffe müssen im Fußballkontext interpretiert werden.',
   terms:[{term:'Progressiver Pass',meaning_de:'Pass nach vorne Richtung gegnerisches Tor'}],
   common_errors:['Metriken ohne Definition vergleichen.'],
   learning_objectives:['Scoutingbegriffe fachlich einordnen']
  },
  tags:['football','scouting','tactics','analytics'],knowledge_status:'active'
 }];
 const result=await findMessinhoLanguageKnowledge(fakeDb(rows),'Erkläre mir den progressiven Pass im Scouting.');
 assert.equal(result.items[0].entry_key,'de.lexicon.football_scouting');
 const formatted=formatMessinhoLanguageKnowledge(result);
 assert.equal(formatted[0].terms[0].term,'Progressiver Pass');
 assert.ok(formatted[0].common_errors.length>0);
 assert.ok(formatted[0].learning_objectives.length>0);
});

test('balances retrieved knowledge across languages in a code-switched message',async()=>{
 const rows=[
  ...['en','fr'].flatMap(language=>[
   {entry_key:language+'.grammar.core',version:1,language_code:language,entry_type:'grammar',topic:'Grammar',title:'Grammar core',content:{explanation:'player league analyse joueur analyser performance'},tags:['player','league','analyse','joueur'],knowledge_status:'active'},
   {entry_key:language+'.lexicon.core',version:1,language_code:language,entry_type:'lexicon',topic:'Vocabulary',title:'Vocabulary core',content:{explanation:'player league analyse joueur analyser performance'},tags:['player','league','analyse','joueur'],knowledge_status:'active'},
   {entry_key:language+'.pragmatics.core',version:1,language_code:language,entry_type:'pragmatics',topic:'Pragmatics',title:'Pragmatics core',content:{explanation:'player league analyse joueur analyser performance'},tags:['player','league','analyse','joueur'],knowledge_status:'active'},
   {entry_key:language+'.conversation.core',version:1,language_code:language,entry_type:'conversation',topic:'Conversation',title:'Conversation core',content:{explanation:'player league analyse joueur analyser performance'},tags:['player','league','analyse','joueur'],knowledge_status:'active'}
  ])
 ];
 const result=await findMessinhoLanguageKnowledge(fakeDb(rows),'The player is ready for the league. Bonjour, analysons le joueur et sa performance.');
 const counts=Object.fromEntries(['en','fr'].map(language=>[language,result.items.filter(item=>item.language_code===language).length]));
 assert.ok(counts.en>0);
 assert.ok(counts.fr>0);
 assert.ok(counts.en<=3);
 assert.ok(counts.fr<=3);
 assert.ok(result.items.length<=8);
});


test('retrieves a dedicated approved foundation for each of the six language profiles',async()=>{
 const fixtures=[
  {id:'de',message:'Die Morphologie der deutschen Adjektivdeklination und Satzstellung ist wichtig.',key:'de.morphology.inflection',tags:['Morphologie','Adjektivdeklination']},
  {id:'en',message:'Explain English morphology, verb inflection and word formation.',key:'en.morphology.inflection',tags:['morphology','word formation']},
  {id:'fr',message:'Explique la conjugaison française, les accords et les pronoms dans cette phrase.',key:'fr.morphology.conjugation',tags:['conjugaison','accord']},
  {id:'ar',message:'اشرح الجذور والأوزان وتصريف الأفعال في اللغة العربية الفصحى.',key:'ar.morphology.roots_patterns',tags:['الجذور','الأوزان','تصريف الفعل']},
  {id:'ar-tn',message:'Aslema, nheb nefhem kifech ma nal3abch? Fassarli el Derja.',key:'ar-tn.morphology.negation_clitics',tags:['Derja','ma...ch','Arabizi']},
  {id:'es',message:'Explica la conjugación verbal y la concordancia gramatical en español, por favor.',key:'es.morphology.conjugation',tags:['conjugación','concordancia']}
 ];
 for(const fixture of fixtures){
  const row={entry_key:fixture.key,version:1,language_code:fixture.id,entry_type:'grammar',topic:'Morphology',title:fixture.key,content:{explanation:'Original-authored foundational rule.'},tags:fixture.tags,knowledge_status:'active'};
  const result=await findMessinhoLanguageKnowledge(fakeDb([row]),fixture.message);
  assert.ok(result.language_ids.includes(fixture.id),fixture.id+' should be detected');
  assert.equal(result.items[0]?.entry_key,fixture.key,fixture.id+' should retrieve its own language foundation');
 }
});


test('caps multi-language retrieval at eight items even with three detected languages',async()=>{
 const rows=['en','fr','de'].flatMap(language=>Array.from({length:4},(_,index)=>({
  entry_key:language+'.grammar.topic_'+index,version:1,language_code:language,
  entry_type:'grammar',topic:'Grammar',title:'Grammar '+index,
  content:{explanation:'player league analyse joueur analyser performance sentence structure'},
  tags:['player','league','analyse','joueur'],knowledge_status:'active'
 })));
 const result=await findMessinhoLanguageKnowledge(fakeDb(rows),'The player is ready for the league. Bonjour, analysons le joueur. Der Spieler ist bereit für die Liga.');
 assert.ok(result.items.length<=8);
 for(const language of ['en','fr','de']){
  assert.ok(result.items.some(item=>item.language_code===language),language+' must remain represented');
  assert.ok(result.items.filter(item=>item.language_code===language).length<=3);
 }
});
