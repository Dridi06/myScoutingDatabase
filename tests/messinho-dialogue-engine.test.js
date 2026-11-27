import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMessinhoDialogueState,validateMessinhoDialogueState,MESSINHO_DIALOGUE_ENGINE_VERSION,classifyMessinhoFollowUp,classifyMessinhoClarificationReply} from '../backend/messinho-dialogue-engine.js';

test('dialogue engine detects a likely short follow-up and preserves prior goal as a candidate',()=>{
  const state=buildMessinhoDialogueState({message:'Und wie schnell ist er?',history:[
    {role:'user',text:'Finde einen linken Flügelspieler unter 21 Jahren.'},
    {role:'assistant',text:'Ich kann dir passende Kandidaten suchen.'}
  ],userRole:'admin',linguisticContext:{response_language:'de'}});
  assert.equal(state.continuity.follow_up_likely,true);
  assert.equal(state.continuity.follow_up_signal,'discourse_connector');
  assert.equal(state.continuity.prior_user_goal_candidate,'Finde einen linken Flügelspieler unter 21 Jahren.');
  assert.equal(state.response_language_hint,'de');
  assert.equal(state.user_role,'admin');
});

test('dialogue engine marks an unanswered assistant question without claiming to resolve it',()=>{
  const state=buildMessinhoDialogueState({message:'International, bevorzugt Europa.',history:[
    {role:'user',text:'Suche einen schnellen Flügelspieler.'},
    {role:'assistant',text:'Soll ich in Deutschland oder international suchen?'}
  ]});
  assert.equal(state.continuity.assistant_awaiting_answer,true);
  assert.equal(state.continuity.reply_to_pending_question_likely,true);
  assert.equal(state.continuity.follow_up_likely,true);
  assert.equal(state.continuity.follow_up_signal,'pending_question_reply');
  assert.match(state.continuity.pending_assistant_question,/Deutschland oder international/);
  assert.equal(state.continuity.referent_resolution,'not_performed');
});

test('dialogue engine does not mark a full new request as a follow-up by default',()=>{
  const state=buildMessinhoDialogueState({message:'Analysiere bitte die Leistungsdaten von Karim Benzema in der letzten Saison.',history:[
    {role:'assistant',text:'Gerne, ich kann dir dabei helfen.'}
  ]});
  assert.equal(state.continuity.follow_up_likely,false);
  assert.equal(state.continuity.follow_up_signal,'none');
});

test('generic new questions are not misclassified merely because they begin with an interrogative',()=>{
  assert.equal(classifyMessinhoFollowUp('Wie funktioniert das Steuersystem?'),'none');
  assert.equal(classifyMessinhoFollowUp('Warum wurde die Berliner Verwaltung reformiert?'),'none');
  assert.equal(classifyMessinhoFollowUp('How does photosynthesis work?'),'none');
  assert.equal(classifyMessinhoFollowUp('Comment fonctionne le moteur?'),'none');
});

test('referential questions are recognized without requiring a discourse connector',()=>{
  assert.equal(classifyMessinhoFollowUp('Wie schnell ist er?'),'referential_question');
  assert.equal(classifyMessinhoFollowUp('How old is he?'),'referential_question');
  assert.equal(classifyMessinhoFollowUp('Et lui, quel âge a-t-il?'),'discourse_connector');
  assert.equal(classifyMessinhoFollowUp('¿Y cómo juega él?'),'discourse_connector');
});

test('short acknowledgements and multilingual continuation markers are bounded signals',()=>{
  assert.equal(classifyMessinhoFollowUp('Genau.'),'short_reply');
  assert.equal(classifyMessinhoFollowUp('Continue'),'short_reply');
  assert.equal(classifyMessinhoFollowUp('باهي'),'short_reply');
  assert.equal(classifyMessinhoFollowUp('W kifech?'),'discourse_connector');
});

test('dialogue engine bounds history, focus, text and role values',()=>{
  const history=Array.from({length:30},(_,i)=>({role:i%2?'assistant':'user',text:'Nachricht '+i}));
  const state=buildMessinhoDialogueState({message:'weiter',history,userRole:'superadmin'});
  assert.equal(state.turn_number,31);
  assert.equal(state.recent_user_focus.length,4);
  assert.equal(state.user_role,'scout');
  assert.equal(state.continuity.follow_up_likely,true);
  assert.equal(validateMessinhoDialogueState(state),true);
});

test('dialogue state validator rejects forged or malformed snapshots',()=>{
  assert.equal(validateMessinhoDialogueState(null),false);
  assert.equal(validateMessinhoDialogueState({version:MESSINHO_DIALOGUE_ENGINE_VERSION,turn_number:0}),false);
  const state=buildMessinhoDialogueState({message:'Hallo'});
  assert.equal(validateMessinhoDialogueState(state),true);
  assert.equal(validateMessinhoDialogueState({...state,evidence_policy:'permissions granted'}),false);
  assert.equal(validateMessinhoDialogueState({...state,continuity:{...state.continuity,follow_up_signal:'permission_granted'}}),false);
});

test('server attaches dialogue state to cognitive routing without changing owner-scoped history loading',async()=>{
  const {readFile}=await import('node:fs/promises');
  const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
  assert.match(source,/buildMessinhoDialogueState\(\{message,history,userRole:profile\.role,linguisticContext\}\)/);
  assert.match(source,/linguisticContext:\{\.\.\.linguisticContext,dialogue_state:dialogueState\}/);
  assert.match(source,/\.eq\('owner_id',ownerId\)/);
});

test('long conversations retain a small extractive context window beyond the recent turns',()=>{
  const history=Array.from({length:20},(_,i)=>({
    role:i%2===0?'user':'assistant',
    text:i===0?'Suche einen schnellen Stürmer in Spanien.':i===2?'Ich bin Muslim und möchte dazu eine private Frage stellen.':'Nachricht mit ausreichendem Kontext '+i
  }));
  const state=buildMessinhoDialogueState({message:'Und jetzt weiter?',history});
  assert.equal(state.older_context.user_goal_candidates.includes('Suche einen schnellen Stürmer in Spanien.'),true);
  assert.equal(state.older_context.user_goal_candidates.some(item=>/Muslim/i.test(item)),false);
  assert.ok(state.older_context.user_goal_candidates.length<=3);
  assert.ok(state.older_context.historical_assistant_questions.length<=2);
  assert.equal(validateMessinhoDialogueState(state),true);
});

test('server loads an extended but bounded owner-scoped conversation window',async()=>{
  const {readFile}=await import('node:fs/promises');
  const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
  assert.match(source,/\.order\('created_at',\{ascending:false\}\)\.limit\(60\)/);
  assert.match(source,/sanitizeMessinhoHistory[\s\S]{0,300}\{limit:60\}/);
});

test('clarification lifecycle extracts offered options and recognizes an exact location answer',()=>{
  const state=buildMessinhoDialogueState({message:'international',history:[
    {role:'user',text:'Suche einen schnellen Flügelspieler.'},
    {role:'assistant',text:'Soll ich in Deutschland oder international suchen?'}
  ]});
  assert.equal(state.continuity.assistant_awaiting_answer,true);
  assert.equal(state.continuity.pending_question.kind,'location');
  assert.deepEqual(state.continuity.pending_question.options,['Deutschland','international']);
  assert.equal(state.continuity.clarification_reply.status,'likely_answer');
  assert.equal(state.continuity.clarification_reply.matched_option,'international');
  assert.equal(state.continuity.follow_up_signal,'pending_question_reply');
  assert.equal(validateMessinhoDialogueState(state),true);
});

test('clarification lifecycle recognizes numeric age answers without executing a search',()=>{
  const state=buildMessinhoDialogueState({message:'21 Jahre',history:[
    {role:'user',text:'Suche einen Stürmer.'},
    {role:'assistant',text:'Wie alt soll der Spieler maximal sein?'}
  ]});
  assert.equal(state.continuity.pending_question.kind,'age');
  assert.equal(state.continuity.clarification_reply.status,'likely_answer');
  assert.equal(state.continuity.clarification_reply.answer_shape,'numeric');
  assert.equal(state.continuity.clarification_reply.confidence,0.9);
  assert.equal(state.continuity.follow_up_signal,'pending_question_reply');
});

test('clarification lifecycle marks an answer outside offered options as ambiguous',()=>{
  const state=buildMessinhoDialogueState({message:'Europa',history:[
    {role:'user',text:'Suche einen Spieler.'},
    {role:'assistant',text:'Soll ich in Deutschland oder international suchen?'}
  ]});
  assert.equal(state.continuity.clarification_reply.status,'ambiguous');
  assert.equal(state.continuity.clarification_reply.answer_shape,'unlisted_option');
  assert.equal(state.continuity.clarification_reply.matched_option,null);
});

test('a new question after a pending clarification is not forced into the previous task',()=>{
  const state=buildMessinhoDialogueState({message:'Wie funktioniert das Steuersystem?',history:[
    {role:'user',text:'Suche einen Flügelspieler.'},
    {role:'assistant',text:'Soll ich in Deutschland oder international suchen?'}
  ]});
  assert.equal(state.continuity.assistant_awaiting_answer,true);
  assert.equal(state.continuity.clarification_reply.status,'new_topic');
  assert.equal(state.continuity.follow_up_signal,'none');
  assert.equal(state.continuity.follow_up_likely,false);
});

test('short confirmations are interpreted as answers only when a question is pending',()=>{
  const pending=buildMessinhoDialogueState({message:'Ja',history:[
    {role:'assistant',text:'Soll ich die Suche starten?'}
  ]});
  const ordinary=buildMessinhoDialogueState({message:'Ja',history:[
    {role:'assistant',text:'Ich kann dir später helfen.'}
  ]});
  assert.equal(pending.continuity.clarification_reply.status,'likely_answer');
  assert.equal(pending.continuity.clarification_reply.answer_shape,'confirmation');
  assert.equal(ordinary.continuity.clarification_reply.status,'none');
});

test('clarification option matching supports English, French, Spanish and Arabic connectors',()=>{
  const cases=[
    ['Regionalliga','Should I search Bundesliga or Regionalliga?','Regionalliga'],
    ['Ligue 2','Tu préfères Ligue 1 ou Ligue 2?','Ligue 2'],
    ['Segunda','¿Prefieres LaLiga o Segunda?','Segunda'],
    ['الثانية','هل تريد الدرجة الأولى أو الثانية؟','الثانية']
  ];
  for(const [answer,question,expected] of cases){
    const state=buildMessinhoDialogueState({message:answer,history:[{role:'assistant',text:question}]});
    assert.equal(state.continuity.clarification_reply.status,'likely_answer',question);
    assert.equal(state.continuity.clarification_reply.matched_option,expected,question);
  }
});

test('free-text clarification answers remain candidates for semantic review',()=>{
  const state=buildMessinhoDialogueState({message:'Am liebsten im Großraum Berlin, aber Brandenburg wäre auch möglich.',history:[
    {role:'assistant',text:'In welcher Region soll ich suchen?'}
  ]});
  assert.equal(state.continuity.clarification_reply.status,'candidate_answer');
  assert.equal(state.continuity.clarification_reply.answer_shape,'free_text');
  assert.equal(state.continuity.clarification_reply.confidence,0.58);
});

test('clarification classifier does not invent an answer without a pending question',()=>{
  const result=classifyMessinhoClarificationReply('Regionalliga',null);
  assert.equal(result.status,'none');
  assert.equal(result.matched_option,null);
});

test('cognitive router receives explicit clarification lifecycle handling rules',async()=>{
  const {readFile}=await import('node:fs/promises');
  const source=await readFile(new URL('../backend/messinho-conversational-intelligence.js',import.meta.url),'utf8');
  assert.match(source,/clarification_reply\.status is likely_answer/);
  assert.match(source,/When status is ambiguous, ask one focused clarification/);
  assert.match(source,/never execute an action solely because of this status/);
});


test('clarification classification prioritizes short acknowledgement over connector matching',()=>{
  assert.equal(classifyMessinhoFollowUp('Genau.'),'short_reply');
});

test('location and age questions are classified before generic option choices',()=>{
  const location=buildMessinhoDialogueState({message:'international',history:[
    {role:'assistant',text:'Soll ich in Deutschland oder international suchen?'}
  ]});
  assert.equal(location.continuity.pending_question.kind,'location');
  assert.equal(location.continuity.clarification_reply.status,'likely_answer');
  const age=buildMessinhoDialogueState({message:'21 Jahre',history:[
    {role:'assistant',text:'Wie alt soll der Spieler maximal sein?'}
  ]});
  assert.equal(age.continuity.pending_question.kind,'age');
  assert.equal(age.continuity.clarification_reply.answer_shape,'numeric');
});

test('long natural-language clarification is held for semantic review',()=>{
  const state=buildMessinhoDialogueState({message:'Am liebsten im Großraum Berlin, aber Brandenburg wäre auch möglich.',history:[
    {role:'assistant',text:'In welcher Region soll ich suchen?'}
  ]});
  assert.equal(state.continuity.clarification_reply.status,'candidate_answer');
  assert.equal(state.continuity.clarification_reply.answer_shape,'free_text');
});

test('clarification lifecycle recognizes Tunisian Derja answers and questions',()=>{
  const derja=buildMessinhoDialogueState({message:'تونس',history:[
    {role:'assistant',text:'تحب نلوّج في ألمانيا ولا تونس؟'}
  ]});
  assert.equal(derja.continuity.assistant_awaiting_answer,true);
  assert.equal(derja.continuity.clarification_reply.status,'likely_answer');
  const age=buildMessinhoDialogueState({message:'20',history:[
    {role:'assistant',text:'قداش عمر اللاعب؟'}
  ]});
  assert.equal(age.continuity.pending_question.kind,'age');
  assert.equal(age.continuity.clarification_reply.answer_shape,'numeric');
});
