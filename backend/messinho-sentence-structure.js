/**
 * MESSINHO Sentence Structure Engine.
 * Produces bounded, explainable clause and word-order candidates.
 * It is deliberately not a full dependency parser and never rewrites source text.
 */
export const MESSINHO_SENTENCE_STRUCTURE_VERSION = '0.1.0';

const RULES = Object.freeze({
  de: {
    verbs: 'bin bist ist sind seid war waren habe hast hat haben hatte hatten werde wirst wird werden kann kannst können muss müssen spielt spielen geht gehen macht machen trainiert trainieren arbeitet arbeiten läuft laufen',
    subjects: 'ich du er sie es wir ihr man der die das ein eine spieler spielerin team trainer verein',
    subordinate: ['weil','dass','wenn','obwohl','während','damit','bevor','nachdem'],
    coordinate: ['und','oder','aber','sondern']
  },
  en: {
    verbs: 'am is are was were be been being have has had do does did can could will would should plays play goes go makes make trains train works work runs run',
    subjects: 'i you he she it we they the a an player team coach club',
    subordinate: ['because','that','if','although','while','when','before','after'],
    coordinate: ['and','or','but','yet']
  },
  fr: {
    verbs: 'suis es est sommes êtes sont étais était être avoir ai as a avons avez ont joue jouent joues vais va vont fait font peux peut entraîne entrainent travaille travaillent court',
    subjects: 'je tu il elle on nous vous ils elles le la les un une joueur joueuse équipe equipe entraîneur entraineur club',
    subordinate: ['parce','que','si','lorsque','quand','bien','avant'],
    coordinate: ['et','ou','mais','pourtant']
  },
  es: {
    verbs: 'soy eres es somos sois son fui fue ser estar estoy estás está estamos están tener tengo tiene tienen jugar juega juegan voy va vamos hacen hace puede pueden entrena entren trabaja trabajan corre',
    subjects: 'yo tú él ella usted nosotros nosotras vosotros vosotras ellos ellas el la los las un una jugador jugadora equipo entrenador club',
    subordinate: ['porque','que','si','aunque','cuando','mientras','antes'],
    coordinate: ['y','o','pero']
  },
  ar: {
    verbs: 'يكون كان كانت كانوا اكون تكون يكونون يذهب يذهبون يلعب يلعبون كتب يكتب يكتبون يستطيع يستطيعون ليس ليست',
    subjects: 'انا انت أنت انتم أنتم هو هي نحن هم هن اللاعب الفريق المدرب',
    subordinate: ['لان','أن','اذا','إذا','عندما','الذي','التي'],
    coordinate: ['و','ف','ثم','لكن']
  },
  'ar-tn': {
    verbs: 'nheb t7eb y7eb n7eb na3ref ta3ref ya3ref nal3ab tel3ab yal3ab nemchi temchi yemchi',
    subjects: 'ena enti entouma houwa heya ahna houma joueur equipe coach',
    subordinate: ['5ater','khater','ama','illi'],
    coordinate: ['w','wala','ama']
  }
});

const clean = value => String(value ?? '').normalize('NFKC')
  .replace(/[\u0000-\u001f\u007f]/gu, ' ').replace(/\s+/gu, ' ').trim().slice(0, 4000);

function normalizeToken(token, languageId) {
  const lower = token.toLocaleLowerCase();
  if (!languageId.startsWith('ar')) return lower;
  return lower.normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/gu, '')
    .replace(/[أإآٱ]/gu, 'ا').replace(/ى/gu, 'ي');
}

function tokenizeWithOffsets(text, languageId) {
  const normalized = languageId.startsWith('ar')
    ? text.normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/gu, '')
    : text;
  return [...normalized.matchAll(/[\p{L}\p{N}]+/gu)].map(match => ({
    text: match[0], normalized: normalizeToken(match[0], languageId),
    start: match.index, end: match.index + match[0].length
  }));
}

function splitSentences(text) {
  const parts = [];
  const pattern = /[^.!?؟۔]+[.!?؟۔]?/gu;
  for (const match of text.matchAll(pattern)) {
    const value = match[0].trim();
    if (value) {
      const leading = match[0].indexOf(value);
      parts.push({ text: value, start: match.index + leading, end: match.index + leading + value.length });
    }
    if (parts.length >= 8) break;
  }
  return parts;
}

function classifyMarker(token, rules) {
  if (rules.subordinate.includes(token)) return 'subordinate';
  if (rules.coordinate.includes(token)) return 'coordinate';
  return null;
}

function analyzeClause(sentence, sentenceOffset, tokens, languageId, rules, index) {
  const markerToken = tokens[0];
  const markerType = markerToken ? classifyMarker(markerToken.normalized, rules) : null;
  const verbCandidates = tokens.filter(token => rules.verbs.has(token.normalized));
  const firstVerb = verbCandidates[0] || null;
  const subjectCandidates = tokens.filter(token =>
    rules.subjects.has(token.normalized) && (!firstVerb || token.start < firstVerb.start)
  );
  const subject = subjectCandidates[0] || null;
  const orderPattern = !firstVerb ? 'verb_not_detected'
    : !subject ? 'verb_detected_subject_uncertain'
    : subject.start < firstVerb.start ? 'subject_before_verb_candidate'
    : 'verb_before_subject_candidate';

  let wordOrderEvidence = 'insufficient_lexical_evidence';
  if (languageId === 'de' && markerType === 'subordinate' && firstVerb) {
    const lastToken = tokens[tokens.length - 1];
    wordOrderEvidence = lastToken?.normalized === firstVerb.normalized
      ? 'finite_verb_final_candidate' : 'subordinate_verb_position_uncertain';
  } else if (['en','fr','es'].includes(languageId) && subject && firstVerb) {
    wordOrderEvidence = subject.start < firstVerb.start
      ? 'subject_verb_order_candidate' : 'noncanonical_subject_verb_order_candidate';
  } else if (languageId.startsWith('ar') && firstVerb && subject) {
    wordOrderEvidence = firstVerb.start < subject.start
      ? 'verb_subject_order_candidate' : 'subject_verb_order_candidate';
  }

  return {
    clause_index: index,
    clause_type: markerType || (index === 0 ? 'main_or_initial' : 'unclassified'),
    marker: markerToken && markerType ? markerToken.text : null,
    token_count: tokens.length,
    subject_candidate: subject?.text || null,
    finite_verb_candidate: firstVerb?.text || null,
    additional_verb_candidates: Math.max(0, verbCandidates.length - 1),
    order_pattern: orderPattern,
    word_order_evidence: wordOrderEvidence,
    source_span: { start: sentenceOffset + (tokens[0]?.start || 0), end: sentenceOffset + (tokens.at(-1)?.end || 0) }
  };
}

export function analyzeMessinhoSentenceStructure(input, languageId) {
  const text = clean(input);
  const rules = RULES[languageId];
  if (!text || !rules) return {
    version: MESSINHO_SENTENCE_STRUCTURE_VERSION,
    status: text ? 'unsupported_language' : 'empty',
    language_id: languageId || null, source_preserved: true, sentences: []
  };

  const sentences = splitSentences(text).map((sentence, sentenceIndex) => {
    const tokens = tokenizeWithOffsets(sentence.text, languageId);
    const clauses = [];
    let current = [];
    let clauseIndex = 0;
    for (const token of tokens) {
      const marker = classifyMarker(token.normalized, rules);
      if (marker && current.length) {
        clauses.push(analyzeClause(sentence.text, sentence.start, current, languageId, rules, clauseIndex++));
        current = [token];
      } else {
        current.push(token);
      }
    }
    if (current.length) clauses.push(analyzeClause(sentence.text, sentence.start, current, languageId, rules, clauseIndex));
    return { sentence_index: sentenceIndex, token_count: tokens.length, clauses };
  }).filter(sentence => sentence.token_count > 0);

  const clauseCount = sentences.reduce((sum, sentence) => sum + sentence.clauses.length, 0);
  return {
    version: MESSINHO_SENTENCE_STRUCTURE_VERSION,
    status: sentences.length ? 'analyzed' : 'insufficient_text',
    language_id: languageId,
    method: 'bounded_lexical_clause_candidates',
    sentence_count: sentences.length,
    clause_count: clauseCount,
    sentences,
    confidence: Math.min(0.72, Number((0.2 + Math.min(0.5, clauseCount * 0.06)).toFixed(3))),
    source_preserved: true,
    limitations: [
      'Subject and verb labels are lexical candidates, not verified grammatical dependencies.',
      'Word-order labels are language-specific clues, not correctness judgments.',
      'The analysis is incomplete for inflected, irregular, elliptical and code-switched constructions.'
    ]
  };
}

export function getMessinhoSentenceStructureSummary() {
  return {
    version: MESSINHO_SENTENCE_STRUCTURE_VERSION,
    languages: Object.keys(RULES),
    dimensions: ['sentence_boundaries','clause_candidates','subject_candidates','finite_verb_candidates','word_order_evidence'],
    method: 'bounded_explainable_heuristics',
    automatic_rewriting: false
  };
}
