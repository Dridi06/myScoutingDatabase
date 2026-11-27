/**
 * MESSINHO Linguistic Intelligence.
 * Deterministic language/profile detection and conversational signal extraction.
 * This is a compact original ruleset, not a copied dictionary or a claim of human-level fluency.
 * Dialect, script and code-switching are represented separately so Tunisian Derja is not
 * incorrectly collapsed into Modern Standard Arabic.
 */
export const MESSINHO_LINGUISTIC_INTELLIGENCE_VERSION = '1.3.0';

export const MESSINHO_LANGUAGE_PROFILES = Object.freeze([
  { id:'de', name:'Deutsch', family:'Germanic', scripts:['Latin'], variants:['de-DE','de-AT','de-CH'], capabilities:['grammar','cases','articles','word_order','compound_words','spelling','semantics','pragmatics'] },
  { id:'en', name:'English', family:'Germanic', scripts:['Latin'], variants:['en-GB','en-US'], capabilities:['grammar','tense','articles','word_order','spelling','semantics','pragmatics'] },
  { id:'fr', name:'Français', family:'Romance', scripts:['Latin'], variants:['fr-FR','fr-CA'], capabilities:['grammar','gender','agreement','conjugation','word_order','spelling','semantics','pragmatics'] },
  { id:'ar', name:'العربية الفصحى', family:'Semitic', scripts:['Arabic'], variants:['Modern Standard Arabic'], capabilities:['grammar','root_patterns','agreement','case_endings','word_order','semantics','pragmatics'] },
  { id:'ar-tn', name:'تونسي / Derja', family:'Arabic dialect', scripts:['Arabic','Latin/Arabizi'], variants:['Tunisian Arabic'], capabilities:['dialect_lexicon','arabizi','code_switching','context','pragmatics'] },
  { id:'es', name:'Español', family:'Romance', scripts:['Latin'], variants:['es-ES','es-MX','es-419'], capabilities:['grammar','gender','agreement','conjugation','word_order','spelling','semantics','pragmatics'] }
]);

const WORDS = {
 de: new Set('der die das ein eine und oder aber nicht bitte danke hallo guten gutenmorgen gutenabend ich du er sie wir ihr ist sind war haben sein kann möchte warum wie was wer wo wann eigentlich vielleicht noch schon heute spieler team erkläre erklären erklär mir den im progressiven pass scouting fußball begriff begriffe dieser dieses diese einen einem einer für mit aus auf zu von dass weil wenn sehr gut stark schwach leistung analyse bewertung spielerprofil'.split(' ')),
 en: new Set('the a an and or but not please thanks hello hi good morning good evening i you he she we they is are was have be can would why how what who where when actually maybe still already today player team explain explains explained english morphology word formation verb inflection football scouting tactics analysis assessment performance this that these those for with of to in from because if then very strong weak good'.split(' ')),
 fr: new Set('le la les un une et ou mais pas ne merci bonjour salut bonsoir bonjournee je tu il elle nous vous est sont était avoir être peut pourquoi comment quoi qui où quand peut-être déjà aujourd hui joueur équipe comment allez vous ca va explique expliquer français francaise française conjugaison accords accord pronoms phrase dans avec pour des très tres fort faible performance analyse évaluation joueurs football tactique'.split(' ')),
 ar: new Set('الذي التي هذا هذه من في على إلى عن هو هي نحن انت أنا و أو لكن ليس لا نعم كيف ماذا لماذا متى أين كان يكون السلام عليكم مرحبا أهلا شكرا صباح مساء أريد أحتاج ممكن جيد جيد جدا اليوم لاعب فريق كيف حالك اللغة العربية الفصحى اشرح الجذور الأوزان تصريف الأفعال فعل اسم صفة لاعبين مدرب مدافع مهاجم وسط جناح تمرير ضغط تكتيك أداء تحليل تقييم مركز الفريق'.split(' ')),
 'ar-tn': new Set('chnowa chnowa kifech kifesh aleh علاش برشا barcha yesser mrigel behi labes aslema عسلامة لاباس شنوة شنوا وين قداش توة توا فما ma fama win wa9tech taw 3lech 5ater 7atta fassar fassarli nefhem nheb n7eb nal3ab nal3abch ma3neha ma3naha el hedha hedhi hedhouma tounsi derja tunisien joueur équipe equipe match coach fel fi mta3 mte3'.split(' ')),
 es: new Set('el la los las un una y o pero no por favor gracias yo tú él ella nosotros es son era tener ser puede por qué cómo qué quién dónde cuándo todavía ya hola buenos días buenas tardes buenas noches quiero este jugador entender sus puntos fuertes equipo hoy explica explicar español conjugación conjugacion verbal concordancia gramatical frase pronombres fútbol futbol jugadores entrenador rendimiento análisis analisis evaluación evaluacion táctica tactica fuerte débil debil con para en de por'.split(' '))
};
const TUNISIAN_ARABIC = /(?:علاش|شنوة|شنوّة|برشا|ياسر|لاباس|فما|توا|وين|قداش|كيفاش)/u;
const ARABIC_SCRIPT = /[\u0600-\u06FF]/u;
const LATIN_SCRIPT = /[A-Za-zÀ-ÖØ-öø-ÿ]/u;
const LATIN_DERJA = /\b(chneya|chnowa|kifech|kifesh|alech|aleh|barcha|barsha|yesser|labes|labess|mrigel|beh[iy]|fama|ma fama|ma\s+[a-z0-9]+\s*ch|tawa|taw|win|wa9tech|3lech|5ater|7atta|9addech)\b/iu;

function clean(value) {
  return String(value ?? '').normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 4000);
}
function words(value) {
  return clean(value).toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
}
function countHits(tokens, lexicon) { return tokens.reduce((n, token) => n + (lexicon.has(token) ? 1 : 0), 0); }
function scoreProfile(id, tokens, text) {
  const lexicon = WORDS[id];
  let score = countHits(tokens, lexicon);
  if (id === 'ar-tn') {
    if (LATIN_DERJA.test(text)) score += 5;
    if (TUNISIAN_ARABIC.test(text)) score += 7;
    if (ARABIC_SCRIPT.test(text) && /[ڨڤپچگ]/u.test(text)) score += 2;
  }
  if (id === 'ar' && ARABIC_SCRIPT.test(text) && !TUNISIAN_ARABIC.test(text)) score += 1;
  if (['de','en','fr','es'].includes(id) && LATIN_SCRIPT.test(text)) score += 0.1;
  return score;
}
function scriptOf(text) {
  const scripts = [];
  if (ARABIC_SCRIPT.test(text)) scripts.push('Arabic');
  if (LATIN_SCRIPT.test(text)) scripts.push('Latin');
  return scripts.length ? scripts : ['unknown'];
}
function inferConversationSignals(text, tokens, languageId) {
  const lower = text.toLocaleLowerCase();
  const tokenSet = new Set(tokens);
  const has = (...terms) => terms.some(term => tokenSet.has(term));
  const hasPhrase = (...phrases) => phrases.some(phrase => lower.includes(phrase));
  const questions = /[؟?]/u.test(text) || has(
    'warum','weshalb','wieso','wie','was','wer','wo','wann','why','how','what','who','where','when',
    'pourquoi','comment','quoi','qui','où','cuándo','cómo','qué','quién','dónde',
    'علاش','شنوة','شنو','كيفاش','كيف','وين','متى','أين','لماذا','هل'
  );
  const politeness = has('bitte','please','merci','شكرا','عافاك','عيشك') || hasPhrase('por favor') ||
    hasPhrase("s'il vous plaît",'من فضلك','لو سمحت');
  const negation = has(
    'nicht','kein','keine','keinen','no','not','pas','ne','nunca','jamás',
    'لا','موش','ماني','ما','مش','ليس','ليست','لم','لن','مازالش'
  );
  const uncertainty = has(
    'vielleicht','eigentlich','wohl','eventuell','maybe','perhaps','possibly',
    'peut-être','quizás','quizas','talvez','ربما','يمكن','ممكن'
  );
  const contrast = has(
    'aber','jedoch','doch','but','however','although','mais','pourtant','pero',
    'aunque','لكن','أما','بل'
  ) || hasPhrase('مع ذلك','sin embargo','en revanche');
  const intent = questions ? 'question' :
    has('übersetze','translate','traduire','traduce','ترجم','tarjem','tarjemli') ? 'translation_request' :
    has('korrigiere','verbessere','correct','corrige','corrigez','صحح','salla7','sa77a7') ? 'correction_request' :
    'conversation';
  return { intent, questions, politeness, negation, uncertainty, contrast, token_count:tokens.length, language_id:languageId };
}


const ARABIZI_DIGITS = Object.freeze({ '2':'ء', '3':'ع', '5':'خ', '6':'ط', '7':'ح', '8':'غ', '9':'ق' });
export function normalizeMessinhoArabizi(input) {
  // Arabizi digits are letters only inside Latin-script words. Preserve standalone
  // numbers (ages, shirt numbers, dates, scores and statistics) exactly.
  return clean(input).replace(/[\p{L}0-9]+/gu, token => {
    if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/u.test(token)) return token;
    return [...token].map(char => ARABIZI_DIGITS[char] || char).join('');
  });
}

function splitLanguageSegments(text) {
  return clean(text).split(/(?<=[.!?؟۔؛;])\s+/u).filter(Boolean).slice(0,12).map((value,index)=>({
    index, text:value.slice(0,500), scripts:scriptOf(value)
  }));
}
const ACTION_PATTERNS = {
  translate: /(?<![\p{L}\p{N}])(?:übersetz(?:e|en)?|translate|tradu(?:is|ire|ce|zca)|ترجم|tarjem|tarjemli)(?![\p{L}\p{N}])/u,
  correct: /(?<![\p{L}\p{N}])(?:korrigier(?:e|en)?|verbesser(?:e|n)?|correct|corrig(?:e|ez)|corrige|صحح|salla7|sa77a7)(?![\p{L}\p{N}])/u,
  explain: /(?<![\p{L}\p{N}])(?:erklär(?:e|en)?|erläuter(?:e|n)?|explain|explique(?:r)?|explica(?:r)?|اشرح|فسر|fassar|fasser)(?![\p{L}\p{N}])/u,
  rephrase: /(?<![\p{L}\p{N}])(?:formulier(?:e|en)? um|umformulier(?:e|en)?|rephrase|reformul(?:e|er)|reformula(?:r)?|أعد الصياغة)(?![\p{L}\p{N}])/u
};
const TARGET_LANGUAGE_PATTERNS = [
  {id:'de',pattern:/(?:auf|ins|in) deutsch(?:e|er|en)?|\bto german\b|\bin german\b|\ben allemand\b|\bal alemán\b|إلى الألمانية/u},
  {id:'en',pattern:/(?:auf|ins|in) englisch|\bto english\b|\bin english\b|\ben anglais\b|\bal inglés\b|إلى الإنجليزية/u},
  {id:'fr',pattern:/(?:auf|ins|in) französisch|\bto french\b|\bin french\b|\binto french\b|\ben français\b|\ben francais\b|\bal francés\b|إلى الفرنسية/u},
  {id:'ar',pattern:/(?:auf|ins|in) hocharabisch|\bmodern standard arabic\b|\bfusha\b|بالعربية الفصحى|إلى العربية الفصحى/u},
  {id:'ar-tn',pattern:/(?:auf|ins|in) tunesisch|\btunisian derja\b|\bderja\b|بالتونسي|بالدارجة التونسية|\bbil tounsi\b|\bbil derja\b/u},
  {id:'es',pattern:/(?:auf|ins|in) spanisch|\bto spanish\b|\bin spanish\b|\ben español\b|\bal español\b|إلى الإسبانية/u}
];

function detectLanguageAction(text, languageId) {
  const normalized = clean(text).toLocaleLowerCase();
  let mode = 'answer';
  for (const [candidate,pattern] of Object.entries(ACTION_PATTERNS)) {
    if (pattern.test(normalized)) { mode=candidate; break; }
  }
  const target = TARGET_LANGUAGE_PATTERNS.find(item=>item.pattern.test(normalized))?.id || null;
  const instructions = {
    translate:'Translate faithfully; preserve names, numbers, football terminology, negation, uncertainty and register. If the target is unclear, ask.',
    correct:'Correct language errors while preserving intended meaning and tone. Do not invent content.',
    explain:'Explain meaning, grammar or wording in the user language, with a short example when useful.',
    rephrase:'Rephrase without changing facts, certainty, intent or tone.',
    answer:'Answer naturally in the latest user language, using conversation context and approved knowledge.'
  };
  const targetLanguage=mode==='translate'?target:null;
  return {
    mode,
    explicit:mode!=='answer',
    target_language:targetLanguage,
    source_language:languageId||null,
    preserve_original:true,
    source_text:clean(text),
    requires_clarification:mode==='translate'&&!targetLanguage,
    instruction:instructions[mode],
    confidence:mode==='answer'?0.5:(mode==='translate'&&!targetLanguage?0.65:0.9)
  };
}

/**
 * Analyze text without silently translating or rewriting it.
 * Mixed-language messages return per-language evidence and a conservative primary guess.
 */
export function analyzeMessinhoLanguage(input, options = {}) {
  const text = clean(input);
  if (!text) return { version:MESSINHO_LINGUISTIC_INTELLIGENCE_VERSION, status:'empty', primary_language:null, confidence:0, scripts:['unknown'], languages:[], signals:null, notes:['No text supplied.'] };
  const tokens = words(text);
  const scores = MESSINHO_LANGUAGE_PROFILES.map(profile => ({ profile, score:scoreProfile(profile.id,tokens,text) }))
    .sort((a,b)=>b.score-a.score);
  const best = scores[0], second = scores[1];
  const total = scores.reduce((n,item)=>n+item.score,0);
  const confidence = best.score <= 0 ? 0 : Math.max(0,Math.min(0.99,(best.score-second.score/2)/Math.max(3,best.score+second.score)));
  const detected = scores.filter(item=>item.score>=2 && item.score>=best.score*0.28).slice(0,3);
  const primary = best.score >= 2 && confidence >= 0.32 ? best.profile.id : null;
  const mixed = detected.length > 1 && detected.some(item=>item.profile.id!==primary);
  const profile = MESSINHO_LANGUAGE_PROFILES.find(item=>item.id===primary);
  const signals = inferConversationSignals(text,tokens,primary);
  const notes = [];
  if (!primary) notes.push('Language confidence is insufficient; preserve the original wording and ask a short clarification only if needed.');
  if (mixed) notes.push('Possible code-switching: interpret clauses in context and do not force a single-language translation.');
  if (primary==='ar-tn') notes.push('Treat as Tunisian Derja; distinguish Arabic-script Derja and Latin Arabizi from Modern Standard Arabic.');
  if (primary==='ar') notes.push('Treat as Modern Standard Arabic unless dialect evidence appears.');
  if (signals.uncertainty || signals.contrast) notes.push('Preserve qualification and contrast; do not flatten nuanced statements into absolute claims.');
  return {
    version:MESSINHO_LINGUISTIC_INTELLIGENCE_VERSION,
    status:primary?'detected':'ambiguous',
    primary_language:primary,
    primary_language_name:profile?.name||null,
    confidence:Number(confidence.toFixed(3)),
    scripts:scriptOf(text),
    languages:detected.map(item=>({id:item.profile.id,name:item.profile.name,evidence_score:Number(item.score.toFixed(2))})),
    signals,
    grammar_focus:profile?.capabilities||[],
    notes,
    policy:{translated:false,rewritten:false,source_text_preserved:true,dictionary_corpus_included:false,claims_fluency:false}
  };
}

export function getMessinhoLanguageProfile(languageId) {
  const profile = MESSINHO_LANGUAGE_PROFILES.find(item=>item.id===languageId);
  return profile ? {...profile, scripts:[...profile.scripts], variants:[...profile.variants], capabilities:[...profile.capabilities]} : null;
}

export function buildMessinhoLinguisticContext(message, history = []) {
  const current = analyzeMessinhoLanguage(message);
  const prior = (Array.isArray(history)?history:[]).slice(-6).map(item=>({
    role:item?.role==='assistant'?'assistant':'user',
    analysis:analyzeMessinhoLanguage(item?.text||item?.content||'')
  })).filter(item=>item.analysis.status!=='empty');
  const recentPrimary = prior.filter(item=>item.role==='user'&&item.analysis.primary_language).slice(-3).map(item=>item.analysis.primary_language);
  const continuityLanguage = recentPrimary.length>=2 && recentPrimary.every(id=>id===recentPrimary[0]) ? recentPrimary[0] : null;
  return {
    ...current,
    conversation_language_hint:current.primary_language||continuityLanguage||null,
    // Detect language independently for each segment. Mixed messages are not
    // flattened to one language merely because one profile wins the global score.
    segments:splitLanguageSegments(clean(message)).map(segment=>({
      ...segment,
      language_analysis:analyzeMessinhoLanguage(segment.text)
    })),
    action:detectLanguageAction(message,current.primary_language||continuityLanguage||null),
    conversation_policy:[
      'Reply in the language of the latest user message unless the user requests another language.',
      'Preserve names, numbers, football terms and quoted source wording.',
      'Do not treat a dialect as incorrect standard-language grammar.',
      'If meaning is ambiguous and materially affects the answer, ask one concise clarification.',
      'Do not invent dictionary definitions or claim a translation was verified when it was not.',
      'Analyze each sentence or segment independently when languages are mixed; preserve original segment order and wording.',
      'Never convert standalone digits, scores, dates, ages or shirt numbers as Arabizi letters.',
      'For a translation request without a clear target language, ask one concise question before translating.'
    ]
  };
}
