import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMessinhoDialogueAdaptationContext, MESSINHO_DIALOGUE_ADAPTATION_VERSION } from '../backend/messinho-dialogue-adaptation.js';

test('dialogue adaptation connects follow-ups without treating assistant text as fact',()=>{
 const context=buildMessinhoDialogueAdaptationContext({
  message:'Und wie würdest du das verbessern?',
  history:[{role:'user',text:'Wir müssen die Spielerbewertung verbessern.'},{role:'assistant',text:'Meinst du Datenqualität oder Bewertungslogik?'}],
  continuityContext:{relation:'follow_up',referent_candidates:[{text:'Meinst du Datenqualität oder Bewertungslogik?',source:'prior_assistant_message'}]}
 });
 assert.equal(context.version,MESSINHO_DIALOGUE_ADAPTATION_VERSION);
 assert.equal(context.adaptation.response_strategy,'continue_the_existing_conversation_naturally');
 assert.equal(context.continuity.referent_candidates[0].source,'prior_assistant_message');
 assert.equal(context.persistence,'not_persisted');
});
test('explicit answer length and corrections are handled',()=>{
 assert.equal(buildMessinhoDialogueAdaptationContext({message:'Kurz und in Stichpunkten bitte.'}).adaptation.detail_level,'concise');
 assert.equal(buildMessinhoDialogueAdaptationContext({message:'Erkläre es ausführlich und Schritt für Schritt.'}).adaptation.detail_level,'detailed');
 const correction=buildMessinhoDialogueAdaptationContext({message:'Nein, ich meinte die Datenqualität.',continuityContext:{relation:'correction'}});
 assert.equal(correction.adaptation.response_strategy,'acknowledge_and_reassess_correction');
 assert.equal(correction.adaptation.acknowledge_before_explaining,true);
});
test('new topics discard pending questions and old topic candidates',()=>{
 const context=buildMessinhoDialogueAdaptationContext({
  message:'Anderes Thema: Wie funktioniert Photosynthese?',
  continuityContext:{relation:'new_topic',referent_candidates:[{text:'alter Spielerfilter',source:'prior_user_message'}]},
  clarificationContinuity:{status:'new_topic',question:'Welche Liga?'}
 });
 assert.equal(context.conversation_maturity.topic_changed,true);
 assert.equal(context.continuity.pending_question,null);
 assert.deepEqual(context.continuity.referent_candidates,[]);
 assert.deepEqual(context.continuity.recent_user_topic_candidates,[]);
});
test('ambiguous referents and pending clarifications produce at most one focused question',()=>{
 const context=buildMessinhoDialogueAdaptationContext({
  message:'Das meine ich.',
  continuityContext:{relation:'follow_up',referent_candidates:[{text:'Spieler A',source:'prior_user_message'},{text:'Spieler B',source:'prior_assistant_message'}]},
  clarificationContinuity:{status:'ambiguous',question:'Welchen Spieler meinst du?'}
 });
 assert.equal(context.adaptation.response_strategy,'ask_one_focused_clarification');
 assert.equal(context.adaptation.maximum_follow_up_questions,1);
});
test('adaptation filters sensitive historical text and does not infer emotion',()=>{
 const context=buildMessinhoDialogueAdaptationContext({
  message:'Weiter bitte.',history:[{role:'user',text:'Mein Passwort lautet Geheim123.'},{role:'assistant',text:'Ergebnis eins. '.repeat(1000)}],
  pragmaticContext:{act:'none'}
 });
 assert.equal(JSON.stringify(context).includes('Geheim123'),false);
 assert.ok(context.adaptation.recently_covered_assistant_points.every(item=>item.length<=360));
 assert.equal(context.adaptation.tone,'respectful_direct_natural');
 assert.equal(Object.hasOwn(context,'emotion'),false);
 assert.equal(context.bounded,true);
});
test('authenticated chat forwards adaptation to cognitive router and natural composer',async()=>{
 const {readFile}=await import('node:fs/promises');
 const server=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
 const router=await readFile(new URL('../backend/messinho-conversational-intelligence.js',import.meta.url),'utf8');
 const composer=await readFile(new URL('../backend/messinho-natural-conversation.js',import.meta.url),'utf8');
 assert.ok(server.includes("import { buildMessinhoDialogueAdaptationContext } from './messinho-dialogue-adaptation.js';"));
 assert.match(server,/buildMessinhoDialogueAdaptationContext\(\{/);
 assert.ok(server.includes('dialogueAdaptationContext,'));
 assert.ok(router.includes('dialogue_adaptation_context:dialogueAdaptationContext||null'));
 assert.ok(composer.includes('dialogue_adaptation_context: dialogueAdaptationContext || null'));
});
