import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MESSINHO_LINGUISTIC_INTELLIGENCE_VERSION,
  MESSINHO_LANGUAGE_PROFILES,
  analyzeMessinhoLanguage,
  buildMessinhoLinguisticContext,
  buildMessinhoLinguisticResponseMetadata,
  getMessinhoLanguageProfile,
  normalizeMessinhoArabizi,
  normalizeMessinhoArabicForAnalysis
} from '../backend/messinho-linguistic-intelligence.js';

test('registers six separate language profiles including Tunisian Derja',()=>{
  assert.equal(MESSINHO_LINGUISTIC_INTELLIGENCE_VERSION,'1.3.9');
  assert.deepEqual(MESSINHO_LANGUAGE_PROFILES.map(item=>item.id),['de','en','fr','ar','ar-tn','es']);
  assert.equal(getMessinhoLanguageProfile('ar-tn').name,'تونسي / Derja');
  assert.equal(getMessinhoLanguageProfile('ar').name,'العربية الفصحى');
});

test('detects German and preserves nuance signals',()=>{
  const result=analyzeMessinhoLanguage('Der Spieler ist eigentlich nicht schlecht, aber für diese Liga reicht es noch nicht.');
  assert.equal(result.primary_language,'de');
  assert.equal(result.signals.negation,true);
  assert.equal(result.signals.uncertainty,true);
  assert.equal(result.signals.contrast,true);
  assert.equal(result.policy.source_text_preserved,true);
});

test('detects English',()=>assert.equal(analyzeMessinhoLanguage('The player is not ready for this league yet.').primary_language,'en'));
test('detects French',()=>assert.equal(analyzeMessinhoLanguage('Bonjour, je voudrais analyser ce joueur et comprendre ses points forts.').primary_language,'fr'));
test('detects Spanish',()=>assert.equal(analyzeMessinhoLanguage('Hola, quiero analizar este jugador y entender sus puntos fuertes.').primary_language,'es'));

test('distinguishes Modern Standard Arabic from Tunisian Arabic script',()=>{
  const msa=analyzeMessinhoLanguage('كيف يمكن تقييم أداء هذا اللاعب في الفريق؟');
  const derja=analyzeMessinhoLanguage('شنوة رايك في اللاعب هذا؟');
  assert.equal(msa.primary_language,'ar');
  assert.equal(derja.primary_language,'ar-tn');
});

test('detects Tunisian Derja written in Latin Arabizi',()=>{
  const result=analyzeMessinhoLanguage('Chnowa rayek fel joueur hedha? Labes barcha.');
  assert.equal(result.primary_language,'ar-tn');
  assert.ok(result.notes.some(note=>note.includes('Tunisian Derja')));
});

test('recognizes Arabic and Latin scripts in code-switched Tunisian messages',()=>{
  const result=analyzeMessinhoLanguage('اللاعب هذا barcha behi');
  assert.ok(result.scripts.includes('Arabic'));
  assert.ok(result.scripts.includes('Latin'));
  assert.ok(result.languages.some(item=>item.id==='ar-tn'));
});

test('returns ambiguous rather than inventing a language for short text',()=>{
  const result=analyzeMessinhoLanguage('OK');
  assert.equal(result.primary_language,null);
  assert.equal(result.status,'ambiguous');
});

test('empty input is handled safely',()=>assert.equal(analyzeMessinhoLanguage(' ').status,'empty'));

test('language profile getter returns a defensive copy',()=>{
  const profile=getMessinhoLanguageProfile('de');
  profile.capabilities.push('tampered');
  assert.equal(getMessinhoLanguageProfile('de').capabilities.includes('tampered'),false);
});

test('conversation context retains a recent language hint without overriding current language',()=>{
  const result=buildMessinhoLinguisticContext('Hola, quiero analizar este jugador.',[
    {role:'user',text:'Guten Tag, kannst du mir helfen?'},
    {role:'user',text:'Bitte erkläre mir das genauer.'}
  ]);
  assert.equal(result.primary_language,'es');
  assert.equal(result.conversation_language_hint,'es');
  assert.ok(result.conversation_policy.some(item=>item.includes('latest user message')));
});


test('detects short everyday greetings in all six language profiles',()=>{
  assert.equal(analyzeMessinhoLanguage('Hallo, wie geht es dir?').primary_language,'de');
  assert.equal(analyzeMessinhoLanguage('Hello, how are you?').primary_language,'en');
  assert.equal(analyzeMessinhoLanguage('Bonjour, comment ça va?').primary_language,'fr');
  assert.equal(analyzeMessinhoLanguage('السلام عليكم، كيف حالك؟').primary_language,'ar');
  assert.equal(analyzeMessinhoLanguage('Aslema, labes?').primary_language,'ar-tn');
  assert.equal(analyzeMessinhoLanguage('Hola, ¿cómo estás?').primary_language,'es');
});

test('does not claim translation or dictionary coverage',()=>{
  const result=analyzeMessinhoLanguage('Bonjour, comment vas-tu?');
  assert.equal(result.policy.translated,false);
  assert.equal(result.policy.dictionary_corpus_included,false);
  assert.equal(result.policy.claims_fluency,false);
});


test('segments multilingual messages and preserves each original segment',()=>{
  const result=buildMessinhoLinguisticContext('Hello! Bonjour. السلام عليكم؟',[]);
  assert.equal(result.segments.length,3);
  assert.equal(result.segments[0].text,'Hello!');
  assert.ok(result.segments.some(segment=>segment.scripts.includes('Arabic')));
});
test('detects translation and explicit target languages',()=>{
  const german=buildMessinhoLinguisticContext('Bitte übersetze das auf Englisch.',[]);
  const french=buildMessinhoLinguisticContext('Translate this into French.',[]);
  assert.equal(german.action.mode,'translate');
  assert.equal(german.action.target_language,'en');
  assert.equal(french.action.target_language,'fr');
});
test('detects correction, explanation and rephrasing actions',()=>{
  assert.equal(buildMessinhoLinguisticContext('Please correct this sentence.',[]).action.mode,'correct');
  assert.equal(buildMessinhoLinguisticContext('Explique cette expression.',[]).action.mode,'explain');
  assert.equal(buildMessinhoLinguisticContext('Rephrase this for me.',[]).action.mode,'rephrase');
});
test('recognizes Tunisian Arabizi translation target and normalizes common digit letters separately',()=>{
  const result=buildMessinhoLinguisticContext('Tarjemli hedha bil anglais, 3lech?',[]);
  assert.equal(result.action.mode,'translate');
  assert.equal(result.action.target_language,'en');
  assert.equal(result.action.requires_clarification,false);
  assert.equal(normalizeMessinhoArabizi('3lech 5ater 7atta 9addech'),'عlech خater حatta قaddech');
});
test('normal conversation defaults to answer mode',()=>{
  const result=buildMessinhoLinguisticContext('Hola, quiero analizar este jugador.',[]);
  assert.equal(result.action.mode,'answer');
  assert.equal(result.action.explicit,false);
  assert.equal(result.action.preserve_original,true);
});


test('analyzes each segment independently in a multilingual message',()=>{
  const result=buildMessinhoLinguisticContext('Hello, how are you? Bonjour, comment ça va? السلام عليكم، كيف حالك؟',[]);
  assert.equal(result.segments.length,3);
  assert.equal(result.segments[0].language_analysis.primary_language,'en');
  assert.equal(result.segments[1].language_analysis.primary_language,'fr');
  assert.equal(result.segments[2].language_analysis.primary_language,'ar');
  assert.deepEqual(result.segments.map(item=>item.text),[
    'Hello, how are you?','Bonjour, comment ça va?','السلام عليكم، كيف حالك؟'
  ]);
});

test('preserves standalone numbers while normalizing Arabizi letters inside words',()=>{
  assert.equal(normalizeMessinhoArabizi('3lech 5ater 7atta 9addech — 2026, 7 Tore, 2:1'),'عlech خater حatta قaddech — 2026, 7 Tore, 2:1');
});

test('asks for target clarification instead of guessing on incomplete translation requests',()=>{
  const result=buildMessinhoLinguisticContext('Tarjemli hedha, please.',[]);
  assert.equal(result.action.mode,'translate');
  assert.equal(result.action.target_language,null);
  assert.equal(result.action.requires_clarification,true);
  assert.equal(result.action.source_text,'Tarjemli hedha, please.');
});

test('recognizes French, Spanish and Tunisian target-language instructions',()=>{
  assert.equal(buildMessinhoLinguisticContext('Translate this en français.',[]).action.target_language,'fr');
  assert.equal(buildMessinhoLinguisticContext('Traduce esto al alemán.',[]).action.target_language,'de');
  assert.equal(buildMessinhoLinguisticContext('Tarjemli hedha bil tounsi.',[]).action.target_language,'ar-tn');
});


test('recognizes Arabic and Derja negation, contrast, uncertainty and politeness without ASCII word boundaries',()=>{
  const result=analyzeMessinhoLanguage('هذا اللاعب موش جاهز لكن ربما يتحسن، من فضلك اشرح السبب؟');
  assert.equal(result.signals.questions,true);
  assert.equal(result.signals.negation,true);
  assert.equal(result.signals.contrast,true);
  assert.equal(result.signals.uncertainty,true);
  assert.equal(result.signals.politeness,true);
});


test('Arabizi normalization preserves football age groups and mixed identifiers',()=>{
  assert.equal(normalizeMessinhoArabizi('U19 U17 4-3-3 2026 Messi9 wa9tech 3lech'),
    'U19 U17 4-3-3 2026 Messi9 waقtech عlech');
});

test('does not treat ordinary standalone statistics as Arabizi digits',()=>{
  assert.equal(normalizeMessinhoArabizi('7 2026 2:1 3 goals'),'7 2026 2:1 3 goals');
});


test('splits Latin-script code-switching inside one sentence without losing the original wording',()=>{
  const result=buildMessinhoLinguisticContext('Le joueur is strong but needs more time.',[]);
  assert.equal(result.segments.length,2);
  assert.equal(result.segments[0].language_analysis.primary_language,'fr');
  assert.equal(result.segments[1].language_analysis.primary_language,'en');
  assert.equal(result.segments.map(segment=>segment.text).join(' '),'Le joueur is strong but needs more time.');
});

test('splits Arabic and English code-switching inside one sentence',()=>{
  const result=buildMessinhoLinguisticContext('اللاعب قوي but needs more time.',[]);
  assert.equal(result.segments.length,2);
  assert.equal(result.segments[0].language_analysis.primary_language,'ar');
  assert.equal(result.segments[1].language_analysis.primary_language,'en');
  assert.equal(result.segments.map(segment=>segment.text).join(' '),'اللاعب قوي but needs more time.');
});


test('recognizes additional Tunisian Derja spellings in Arabic and Latin scripts',()=>{
 const arabic=analyzeMessinhoLanguage('شنيا رايك في اللاعب هذا؟ برشا باهي');
 const arabizi=analyzeMessinhoLanguage('A3lech el joueur ma l3abch tawa?');
 assert.equal(arabic.primary_language,'ar-tn');
 assert.equal(arabizi.primary_language,'ar-tn');
 assert.ok(arabic.scripts.includes('Arabic'));
 assert.ok(arabizi.scripts.includes('Latin'));
});

test('recognizes Tunisian Arabic and Arabizi action requests with attached pronouns',()=>{
 assert.equal(buildMessinhoLinguisticContext('Fasserli el mawdhou3.',[]).action.mode,'explain');
 assert.equal(buildMessinhoLinguisticContext('Salla7li el phrase hedhi.',[]).action.mode,'correct');
 assert.equal(buildMessinhoLinguisticContext('اشرحلي المعنى من فضلك',[]).action.mode,'explain');
 assert.equal(buildMessinhoLinguisticContext('صححلي الجملة',[]).action.mode,'correct');
 assert.equal(buildMessinhoLinguisticContext('ترجملي هذا',[]).action.mode,'translate');
});

test('recognizes colloquial Tunisian rephrasing requests without changing the source text',()=>{
 const result=buildMessinhoLinguisticContext('3awed siyagha el message.',[]);
 assert.equal(result.action.mode,'rephrase');
 assert.equal(result.action.source_text,'3awed siyagha el message.');
 assert.equal(result.action.preserve_original,true);
});

test('Arabic MSA explain verb is not mistaken for the standalone Derja particle',()=>{
 const result=analyzeMessinhoLanguage('اشرح الجذور والأوزان وتصريف الأفعال في اللغة العربية الفصحى.');
 assert.equal(result.primary_language,'ar');
});


test('recognizes MSA words with attached Arabic conjunctions without rewriting the source',()=>{
  const message='اشرح الجذور والأوزان وتصريف الأفعال في اللغة العربية الفصحى.';
  const result=analyzeMessinhoLanguage(message);
  assert.equal(result.primary_language,'ar');
  assert.ok(result.languages.find(item=>item.id==='ar').evidence_score>=3);
  assert.equal(buildMessinhoLinguisticContext(message,[]).action.source_text,message);
});

test('scores one attached Arabic conjunction only when the remainder is a known MSA token',()=>{
  const known=analyzeMessinhoLanguage('والأوزان وتصريف الأفعال في اللغة العربية الفصحى');
  const dialect=analyzeMessinhoLanguage('واللاعب هذا موش جاهز');
  assert.equal(known.primary_language,'ar');
  assert.equal(dialect.primary_language,'ar-tn');
});

test('balanced language regression corpus preserves negation, uncertainty and football identifiers',()=>{
  const samples=[
    ['de','Der Spieler ist nicht sicher für U19, vielleicht braucht er mehr Zeit.'],
    ['en','The winger is not ready for U19; perhaps he needs more time.'],
    ['fr','Ce joueur n’est pas prêt pour les U19, peut-être faut-il plus de temps.'],
    ['ar','هذا اللاعب ليس جاهزا لفريق U19، ربما يحتاج إلى وقت أكثر.'],
    ['ar-tn','اللاعب هذا موش جاهز لفريق U19، يمكن يحتاج وقت أكثر.'],
    ['es','El jugador no está listo para U19; quizá necesita más tiempo.']
  ];
  for(const [language,message] of samples){
    const result=analyzeMessinhoLanguage(message);
    assert.equal(result.primary_language,language, message);
    assert.equal(result.signals.negation,true, message);
    assert.equal(result.signals.uncertainty,true, message);
    assert.match(message,/U19/u);
  }
});


test('recognizes uncertainty expressed as a French phrase or Spanish variant',()=>{
  assert.equal(analyzeMessinhoLanguage('Ce joueur n’est pas prêt, peut-être demain.').signals.uncertainty,true);
  assert.equal(analyzeMessinhoLanguage('Quizá el jugador necesita más tiempo.').signals.uncertainty,true);
});


test('recognizes colloquial translation targets across all six language profiles',()=>{
  const cases=[
    ['Bitte übersetze das ins Französische.','fr'],
    ['Translate this into Spanish.','es'],
    ['Traduis ceci en anglais.','en'],
    ['Traduce esto al árabe estándar.','ar'],
    ['ترجم هذا إلى الألمانية.','de'],
    ['Tarjemli hedha bil anglais.','en']
  ];
  for(const [message,target] of cases){
    const action=buildMessinhoLinguisticContext(message,[]).action;
    assert.equal(action.mode,'translate',message);
    assert.equal(action.target_language,target,message);
    assert.equal(action.requires_clarification,false,message);
  }
});


test('normalizes Arabic diacritics and orthographic variants for analysis only',()=>{
  assert.equal(normalizeMessinhoArabicForAnalysis('إِنَّ اللّٰهَ سَمِيعٌ عَلِيمٌ'),'ان الله سميع عليم');
  assert.equal(normalizeMessinhoArabicForAnalysis('آدَاءُ اللَّاعِبِ'),'اداء اللاعب');
  assert.equal(normalizeMessinhoArabicForAnalysis('على الهدى'),'علي الهدي');
});

test('detects fully vocalized MSA without changing the original message',()=>{
  const message='السَّلَامُ عَلَيْكُمْ، كَيْفَ حَالُكُمْ؟';
  const result=buildMessinhoLinguisticContext(message,[]);
  assert.equal(result.primary_language,'ar');
  assert.equal(result.action.source_text,message);
  assert.equal(result.segments[0].text,message);
});

test('detects vocalized Tunisian Derja as dialect rather than MSA',()=>{
  const message='شْنُوَّة رَأْيَكْ فِي اللَّاعِبْ هَاذَا؟ بَرْشَا بَاهِي';
  const result=analyzeMessinhoLanguage(message);
  assert.equal(result.primary_language,'ar-tn');
  assert.ok(result.scripts.includes('Arabic'));
});

test('Arabic normalization is not applied to the displayed or stored source text',()=>{
  const message='إِنَّ اللَّاعِبَ مُوشْ جَاهِزٌ';
  const result=buildMessinhoLinguisticContext(message,[]);
  assert.equal(result.action.source_text,message);
  assert.equal(result.policy.source_text_preserved,true);
});


test('uses the latest confidently detected language segment for mixed-language replies',()=>{
  const message='The player is not ready for this league, mais le joueur est pas prêt pour cette ligue.';
  const result=buildMessinhoLinguisticContext(message,[]);
  assert.ok(result.segments.length>=2);
  assert.equal(result.segments.at(-1).language_analysis.primary_language,'fr');
  assert.equal(result.latest_segment_language,'fr');
  assert.equal(result.response_language,'fr');
  assert.equal(result.conversation_language_hint,'fr');
  assert.equal(result.action.source_language,'fr');
  assert.equal(result.segments.map(segment=>segment.text).join(' '),message);
});

test('does not let a mixed-language aggregate score override the last clear user language',()=>{
  const message='Bonjour, comment ça va? Hello, how are you?';
  const result=buildMessinhoLinguisticContext(message,[]);
  assert.equal(result.response_language,'en');
  assert.equal(result.latest_segment_language,'en');
});


test('publishes the selected response language in stable chat metadata',()=>{
  const context=buildMessinhoLinguisticContext('The player is not ready, mais le joueur est prêt.',[]);
  const metadata=buildMessinhoLinguisticResponseMetadata(context);
  assert.equal(metadata.version,'1.3.9');
  assert.equal(metadata.primary_language,context.primary_language);
  assert.equal(metadata.response_language,'fr');
  assert.equal(metadata.latest_segment_language,'fr');
  assert.equal(metadata.conversation_language_hint,'fr');
  assert.equal(metadata.segments.length,context.segments.length);
  assert.equal(metadata.segments.map(segment=>segment.text).join(' '),'The player is not ready, mais le joueur est prêt.');
});

test('response metadata safely handles an unavailable linguistic context',()=>{
  assert.equal(buildMessinhoLinguisticResponseMetadata(null),null);
});


test('explicit output languages apply to explain, correct and rephrase actions',()=>{
  const cases=[
    ['Erkläre mir das auf Tunesisch.','explain','ar-tn'],
    ['Korrigiere diesen Satz auf Französisch.','correct','fr'],
    ['Formuliere das auf Englisch um.','rephrase','en'],
    ['Explain this in German.','explain','de']
  ];
  for(const [message,mode,target] of cases){
    const action=buildMessinhoLinguisticContext(message,[]).action;
    assert.equal(action.mode,mode,message);
    assert.equal(action.target_language,target,message);
    assert.equal(action.requires_clarification,false,message);
    assert.equal(action.preserve_original,true,message);
  }
});

test('non-translation target language applies only to the requested task',()=>{
  const action=buildMessinhoLinguisticContext('Erkläre mir das auf Französisch.',[]).action;
  assert.equal(action.mode,'explain');
  assert.equal(action.target_language,'fr');
  assert.equal(action.explicit,true);
  assert.match(action.instruction,/requested target language/);
});


test('captures qualified negation and evaluation cues across all six language profiles',()=>{
  const cases=[
    ['de','Der Spieler ist noch nicht bereit, aber vielleicht morgen.',['not_yet'],['uncertainty'],['contrast']],
    ['en','The player is not necessarily ready; he is not bad, but not enough for this league.',['not_necessarily','not_bad','not_enough'],[],['contrast']],
    ['fr','Le joueur n’est pas encore prêt, peut-être demain, mais il peut progresser.',['not_yet'],['uncertainty'],['contrast']],
    ['es','El jugador todavía no está listo, no necesariamente es malo, pero quizá necesita más tiempo.',['not_yet','not_necessarily','not_bad'],['uncertainty'],['contrast']],
    ['ar','هذا اللاعب ليس بالضرورة سيئا، ولم يصبح جاهزا بعد، لكن ربما يتحسن.',['not_necessarily','not_yet'],['uncertainty'],['contrast']],
    ['ar-tn','اللاعب هذا موش بالضرورة خايب، موش كافي توة، أما يمكن يتحسن.',['not_necessarily','not_bad','not_enough'],['uncertainty'],['contrast']]
  ];
  for(const [language,message,negation,uncertainty,contrast] of cases){
    const result=analyzeMessinhoLanguage(message);
    assert.equal(result.primary_language,language,message);
    for(const cue of negation)assert.ok(result.signals.negation_scope_cues.includes(cue),language+' missing '+cue);
    for(const cue of uncertainty)assert.ok(result.signals.uncertainty_cues.includes(cue),language+' missing uncertainty');
    for(const cue of contrast)assert.ok(result.signals.contrast_cues.includes(cue),language+' missing contrast');
  }
});

test('qualified evaluation cues never replace or rewrite the original source text',()=>{
  const message='Der Spieler ist nicht schlecht, aber noch nicht bereit.';
  const result=buildMessinhoLinguisticContext(message,[]);
  assert.ok(result.signals.qualified_evaluation_cues.includes('not_bad'));
  assert.ok(result.signals.negation_scope_cues.includes('not_yet'));
  assert.equal(result.action.source_text,message);
  assert.equal(result.segments[0].text,message);
  assert.equal(result.policy.source_text_preserved,true);
});


test('preserves qualified evaluation, uncertainty and contrast across all six language profiles',()=>{
  const cases=[
    ['de','Der Spieler ist nicht schlecht, aber vielleicht noch nicht bereit.'],
    ['en','The player is not bad, but perhaps not ready yet.'],
    ['fr','Ce joueur n’est pas mal, mais peut-être pas encore prêt.'],
    ['es','El jugador no está mal, pero quizá no esté listo todavía.'],
    ['ar','هذا اللاعب ليس سيئا، لكن ربما يحتاج وقتا.'],
    ['ar-tn','اللاعب هذا موش خايب، أما يمكن موش جاهز توة.']
  ];
  for(const [language,message] of cases){
    const signals=analyzeMessinhoLanguage(message).signals;
    assert.equal(signals.negation,true,language);
    assert.ok(signals.negation_scope_cues.includes('not_bad'),language);
    assert.ok(signals.qualified_evaluation_cues.includes('not_bad'),language);
    assert.equal(signals.uncertainty,true,language);
    assert.ok(signals.uncertainty_cues.includes('uncertainty'),language);
    assert.equal(signals.contrast,true,language);
    assert.ok(signals.contrast_cues.includes('contrast'),language);
  }
});

test('detects not-necessarily qualifications across all six language profiles',()=>{
  const cases=[
    ['de','Der Spieler ist nicht unbedingt bereit.'],
    ['en','The player is not necessarily ready.'],
    ['fr','Le joueur n’est pas forcément prêt.'],
    ['es','No necesariamente está listo.'],
    ['ar','هذا اللاعب ليس بالضرورة جاهزا.'],
    ['ar-tn','اللاعب هذا موش بالضرورة جاهز.']
  ];
  for(const [language,message] of cases){
    const signals=analyzeMessinhoLanguage(message).signals;
    assert.ok(signals.negation_scope_cues.includes('not_necessarily'),language);
    assert.ok(signals.qualified_evaluation_cues.includes('not_necessarily'),language);
  }
});

test('recognizes Tunisian Arabizi qualification, uncertainty and contrast',()=>{
  const signals=analyzeMessinhoLanguage('Mouch khayeb, ama yemken mazel ma jé.').signals;
  assert.equal(signals.negation,true);
  assert.ok(signals.negation_scope_cues.includes('not_bad'));
  assert.equal(signals.uncertainty,true);
  assert.ok(signals.uncertainty_cues.includes('uncertainty'));
  assert.equal(signals.contrast,true);
  assert.ok(signals.contrast_cues.includes('contrast'));
});

test('does not invent a qualified evaluation for plain direct negation',()=>{
  const signals=analyzeMessinhoLanguage('The player is not ready.').signals;
  assert.equal(signals.negation,true);
  assert.deepEqual(signals.negation_scope_cues,[]);
  assert.deepEqual(signals.qualified_evaluation_cues,[]);
});
