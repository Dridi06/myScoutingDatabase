/**
 * MESSINHO Multilingual Grammar Engine — bounded deterministic analysis.
 *
 * This first engine provides explainable structural signals, not a complete
 * grammar checker or a claim of native-level fluency. It preserves source text,
 * reports evidence and confidence, and never silently rewrites a sentence.
 */
export const MESSINHO_GRAMMAR_ENGINE_VERSION = '0.1.0';

export const MESSINHO_GRAMMAR_LANGUAGES = Object.freeze([
  'de', 'en', 'fr', 'es', 'ar', 'ar-tn'
]);

const RULES = Object.freeze({
  de: {
    articles: new Set('der die das ein eine einem einen einer eines den dem'.split(' ')),
    pronouns: new Set('ich du er sie es wir ihr sie mich dich ihm ihr uns euch'.split(' ')),
    verbs: new Set('bin bist ist sind seid war waren habe hast hat haben hatte hatten werde wirst wird werden kann kannst können muss müssen spielt spielen geht gehen macht machen'.split(' ')),
    conjunctions: new Set('und oder aber weil dass wenn obwohl während'.split(' '))
  },
  en: {
    articles: new Set(['a','an','the']),
    pronouns: new Set('i you he she it we they me him her us them'.split(' ')),
    verbs: new Set('am is are was were be been being have has had do does did can could will would should plays play goes go makes make'.split(' ')),
    conjunctions: new Set('and or but because that if although while'.split(' '))
  },
  fr: {
    articles: new Set('le la les un une des du de au aux'.split(' ')),
    pronouns: new Set('je tu il elle on nous vous ils elles me te se'.split(' ')),
    verbs: new Set('suis es est sommes êtes sont étais était être avoir ai as a avons avez ont joue jouent joue vais va vont fait font peux peut'.split(' ')),
    conjunctions: new Set('et ou mais parce que si bien que lorsque'.split(' '))
  },
  es: {
    articles: new Set('el la los las un una unos unas lo'.split(' ')),
    pronouns: new Set('yo tú él ella usted nosotros nosotras vosotros vosotras ellos ellas me te se'.split(' ')),
    verbs: new Set('soy eres es somos sois son fui fue ser estar estoy estás está estamos están tener tengo tiene tienen jugar juega juegan voy va vamos hacen hace'.split(' ')),
    conjunctions: new Set('y o pero porque que si aunque mientras'.split(' '))
  },
  ar: {
    articles: new Set(['ال']),
    pronouns: new Set('انا انت أنت انتم أنتم هو هي نحن هم هن'.split(' ')),
    verbs: new Set('يكون كان كانت كانوا اكون تكون يكونون يذهب يذهبون يلعب يلعبون كتب يكتب يكتبون'.split(' ')),
    conjunctions: new Set('و ف ثم لكن لأن اذا إذا'.split(' '))
  },
  'ar-tn': {
    articles: new Set(['el','il','l','ال']),
    pronouns: new Set('ena enti enti houwa heya ahna entouma houma'.split(' ')),
    verbs: new Set('nheb t7eb y7eb n7eb na3ref ta3ref ya3ref nal3ab tel3ab yal3ab nemchi temchi yemchi'.split(' ')),
    conjunctions: new Set('w wala ama 5ater khater'.split(' '))
  }
});

const clean = value => String(value ?? '').normalize('NFKC')
  .replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 4000);

function normalizeArabic(value) {
  return value.normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/gu, '')
    .replace(/[أإآٱ]/gu, 'ا').replace(/ى/gu, 'ي');
}

function tokenize(value, languageId) {
  const source = languageId === 'ar' || languageId === 'ar-tn' ? normalizeArabic(value) : value.toLocaleLowerCase();
  return source.match(/[\p{L}\p{N}]+/gu) || [];
}

function count(tokens, lexicon) {
  let total = 0;
  for (const token of tokens) if (lexicon.has(token)) total++;
  return total;
}

function sentenceType(text, languageId) {
  if (/[?؟]/u.test(text)) return 'question';
  if (/[!！]/u.test(text)) return 'exclamation';
  if (/^(?:please\b|bitte\b|s'il vous plaît\b|por favor\b|من فضلك\b)/iu.test(text)) return 'imperative_or_request';
  return 'declarative_or_fragment';
}

function analyzeLanguageRules(text, languageId, tokens) {
  const rules = RULES[languageId];
  const lower = text.toLocaleLowerCase();
  const findings = [];
  const articleCount = count(tokens, rules.articles);
  const pronounCount = count(tokens, rules.pronouns);
  const verbCount = count(tokens, rules.verbs);
  const conjunctionCount = count(tokens, rules.conjunctions);

  if (languageId === 'de') {
    if (/\bweil\b[^.!?]*\b(ist|sind|hat|haben|kann|wird)\b[^.!?]*$/iu.test(lower)) {
      findings.push({code:'de_subordinate_verb_final_candidate',kind:'syntax',severity:'info',evidence:'weil-clause with a finite-verb candidate',message:'German subordinate clauses commonly place the finite verb at the end; verify the clause boundary.'});
    }
    if (/\b(ich|du|er|sie|es|wir|ihr)\s+(bin|bist|ist|sind|seid)\b/iu.test(lower)) {
      findings.push({code:'de_subject_verb_pattern',kind:'agreement',severity:'info',evidence:'subject pronoun followed by a common finite form',message:'A recognizable subject–finite-verb agreement pattern is present.'});
    }
  } else if (languageId === 'en') {
    if (/\b(he|she|it)\s+(are|am)\b/iu.test(lower)) findings.push({code:'en_possible_be_agreement',kind:'agreement',severity:'warning',evidence:RegExp.$0,message:'Check subject–verb agreement: he/she/it normally takes “is”.'});
    if (/\b(i)\s+(is|are)\b/iu.test(lower)) findings.push({code:'en_possible_first_person_agreement',kind:'agreement',severity:'warning',evidence:RegExp.$0,message:'Check first-person singular agreement: “I” normally takes “am”.'});
    if (/\b(a)\s+[aeiou]/iu.test(lower)) findings.push({code:'en_possible_indefinite_article',kind:'article',severity:'info',evidence:RegExp.$0,message:'Check whether “a” should be “an” before a vowel sound; spelling alone cannot decide every case.'});
  } else if (languageId === 'fr') {
    if (/\b(le|la)\s+(?:joueur|joueuse|équipe|equipe)\b/iu.test(lower)) findings.push({code:'fr_article_noun_gender',kind:'agreement',severity:'info',evidence:RegExp.$0,message:'French articles agree in gender and number with the noun; validate the lexical gender.'});
    if (/\b(je|tu|il|elle|nous|vous|ils|elles)\s+(suis|es|est|sommes|êtes|sont)\b/iu.test(lower)) findings.push({code:'fr_subject_verb_pattern',kind:'agreement',severity:'info',evidence:RegExp.$0,message:'A common subject–être agreement pattern is present.'});
  } else if (languageId === 'es') {
    if (/\b(el|la|los|las|un|una)\s+(?:equipo|jugador|jugadora|jugadores|jugadoras)\b/iu.test(lower)) findings.push({code:'es_article_noun_agreement_candidate',kind:'agreement',severity:'info',evidence:RegExp.$0,message:'Spanish articles agree with noun gender and number; verify the complete noun phrase.'});
    if (/\b(yo|tú|él|ella|nosotros|ellos)\s+(soy|eres|es|somos|son)\b/iu.test(lower)) findings.push({code:'es_subject_verb_pattern',kind:'agreement',severity:'info',evidence:RegExp.$0,message:'A common subject–ser agreement pattern is present.'});
  } else if (languageId === 'ar') {
    if (/(?:^|\\s)(?:لم|لن|لا)\\s+[\\p{L}]+/u.test(normalizeArabic(text))) findings.push({code:'ar_negation_particle',kind:'syntax',severity:'info',evidence:'Arabic negation particle detected',message:'Arabic negation particles affect verb form and/or mood; analyze the particle together with its verb.'});
    if (/(?:^|\\s)(?:اللاعب|الفريق|المدرب)(?=\\s|$|[،,.!?؟])/u.test(normalizeArabic(text))) findings.push({code:'ar_definite_article',kind:'article',severity:'info',evidence:'Arabic definite article ال detected',message:'Arabic definiteness is commonly marked by the attached prefix ال; agreement depends on the full noun phrase.'});
  } else if (languageId === 'ar-tn') {
    if (/(?:^|\\s)ما\\s*[\\p{L}]+\\s*ش(?=\\s|$|[،,.!?؟])/u.test(normalizeArabic(text)) || /\bma\s+\w+\s*ch\b/iu.test(lower)) findings.push({code:'tn_negation_circumfix',kind:'morphology',severity:'info',evidence:'Tunisian ma…ch negation pattern detected',message:'Tunisian Derja commonly uses a discontinuous ma…ch negation pattern; preserve dialect form rather than correcting it to MSA.'});
    if (/\b(?:nheb|t7eb|y7eb|n7eb|nal3ab|tel3ab|yal3ab)\b/iu.test(lower)) findings.push({code:'tn_person_marked_verb',kind:'morphology',severity:'info',evidence:RegExp.$0,message:'A person-marked Tunisian verb form is present; interpretation depends on the dialect context.'});
  }

  return {article_count:articleCount,pronoun_count:pronounCount,finite_verb_candidates:verbCount,conjunction_count:conjunctionCount,findings};
}

/**
 * Analyze a sentence in a known language profile. Returns transparent evidence,
 * not a binary correctness verdict. Unknown/short text is explicitly ambiguous.
 */
export function analyzeMessinhoGrammar(input, languageId) {
  const text = clean(input);
  if (!text) return {version:MESSINHO_GRAMMAR_ENGINE_VERSION,status:'empty',language_id:languageId||null,source_preserved:true,findings:[]};
  if (!RULES[languageId]) return {version:MESSINHO_GRAMMAR_ENGINE_VERSION,status:'unsupported_language',language_id:languageId||null,source_preserved:true,findings:[]};
  const tokens = tokenize(text, languageId);
  if (tokens.length < 2) return {version:MESSINHO_GRAMMAR_ENGINE_VERSION,status:'insufficient_text',language_id:languageId,source_preserved:true,token_count:tokens.length,findings:[]};
  const structural = analyzeLanguageRules(text, languageId, tokens);
  const sentenceCount = (text.match(/[.!?؟۔]+/gu)||[]).length;
  const clauseMarkers = languageId === 'de' ? ['weil','dass','wenn','obwohl'] :
    languageId === 'en' ? ['because','that','if','although','while'] :
    languageId === 'fr' ? ['parce','que','si','lorsque'] :
    languageId === 'es' ? ['porque','que','si','aunque','mientras'] :
    languageId === 'ar' ? ['لان','أن','اذا','إذا','لكن'] : ['5ater','khater','ama','w'];
  const normalizedTokens = tokens.map(token=>languageId.startsWith('ar')?normalizeArabic(token):token.toLocaleLowerCase());
  const clauseMarkerCount = normalizedTokens.filter(token=>clauseMarkers.includes(token)).length;
  const coverage = Math.min(1,(structural.article_count+structural.pronoun_count+structural.finite_verb_candidates+structural.conjunction_count)/Math.max(3,tokens.length*0.45));
  return {
    version:MESSINHO_GRAMMAR_ENGINE_VERSION,
    status:'analyzed',
    language_id:languageId,
    method:'bounded_rule_evidence',
    sentence_type:sentenceType(text,languageId),
    token_count:tokens.length,
    sentence_count:Math.max(1,sentenceCount),
    clause_marker_count:clauseMarkerCount,
    structural_signals:{
      article_count:structural.article_count,
      pronoun_count:structural.pronoun_count,
      finite_verb_candidates:structural.finite_verb_candidates,
      conjunction_count:structural.conjunction_count
    },
    findings:structural.findings,
    confidence:Math.min(0.85,Number((0.25+coverage*0.6+(structural.findings.length?0.08:0)).toFixed(3))),
    source_preserved:true,
    limitations:['Heuristic analysis only; not a complete parser or proof of grammatical correctness.','Dialect grammar is evaluated within its own profile and is not judged against Modern Standard Arabic.','No automatic correction or rewriting is performed.']
  };
}

export function getMessinhoGrammarEngineSummary() {
  return {
    version:MESSINHO_GRAMMAR_ENGINE_VERSION,
    languages:MESSINHO_GRAMMAR_LANGUAGES,
    dimensions:['sentence_type','articles','pronouns','finite_verb_candidates','conjunctions','selected_language_specific_rules'],
    mode:'read_only_explainable_analysis',
    automatic_rewriting:false,
    fluency_claim:false
  };
}
