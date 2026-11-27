import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMessinhoSemanticLanguageContext,
  buildMessinhoSemanticLanguageBridge,
  MESSINHO_SEMANTIC_LANGUAGE_BRIDGE_VERSION
} from '../backend/messinho-semantic-language-bridge.js';

const linguisticContext={
  version:'1.3.9',status:'analyzed',primary_language:'ar-tn',
  response_language:'de',confidence:0.91,scripts:['Arabic','Latin'],
  signals:{negation:true,contrast:true},
  action:{mode:'answer',explicit:false},
  segments:[
    {text:'chnowa joueur hedha?',language_hint:'ar-tn',scripts:['Latin'],
      language_analysis:{primary_language:'ar-tn',confidence:0.9}},
    {text:'kannst du ihn vergleichen?',language_hint:'de',scripts:['Latin'],
      language_analysis:{primary_language:'de',confidence:0.8}}
  ]
};
const knowledgeResult={
  status:'completed',version:'1.2.5',language_ids:['ar-tn','de'],
  items:[{
    language_code:'ar-tn',entry_type:'lexicon',topic:'football',
    title:'Derja scouting vocabulary',version:3,level:'basic',provenance_type:'first_party',
    content:{explanation:'Approved Tunisian football terms.',terms:['joueur','mrigel'],
      aliases:['la3eb'],examples:['chnowa joueur hedha?'],grammar_notes:['Use in context'],
      common_errors:['Do not flatten dialect into MSA'],usage_notes:['Informal speech']}
  }]
};

test('semantic language bridge carries existing language profiles and approved vocabulary together',()=>{
  const result=buildMessinhoSemanticLanguageContext({
    message:'chnowa joueur hedha? kannst du ihn vergleichen?',
    linguisticContext,knowledgeResult
  });
  assert.equal(result.version,MESSINHO_SEMANTIC_LANGUAGE_BRIDGE_VERSION);
  assert.deepEqual(result.active_language_profiles.map(item=>item.id),['de','ar-tn']);
  const derja=result.active_language_profiles.find(item=>item.id==='ar-tn');
  assert.ok(derja.language_detection_terms.includes('chnowa'));
  assert.ok(derja.language_detection_terms.includes('3lech'));
  assert.equal(result.mixed_language_segments.length,2);
  assert.equal(result.approved_vocabulary_and_rules[0].language,'ar-tn');
  assert.deepEqual(result.approved_vocabulary_and_rules[0].terms,['joueur','mrigel']);
  assert.match(result.interpretation_policy.join(' '),/Tunisian Derja/);
});

test('bridge loads approved knowledge once and safely degrades when knowledge is unavailable',async()=>{
  let calls=0;
  const result=await buildMessinhoSemanticLanguageBridge({
    db:{},message:'salut joueur',history:[],linguisticContext,
    knowledgeLookup:async()=>{calls++;return knowledgeResult;}
  });
  assert.equal(calls,1);
  assert.equal(result.knowledge_status,'completed');
  assert.equal(result.formatted_knowledge.length,1);
  const unavailable=await buildMessinhoSemanticLanguageBridge({
    db:null,message:'hello',knowledgeLookup:async()=>{throw new Error('offline');}
  });
  assert.equal(unavailable.knowledge_status,'unavailable');
  assert.equal(unavailable.model_context.approved_vocabulary_and_rules.length,0);
});
