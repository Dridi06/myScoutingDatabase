export function classifyMessinhoProviderFailure(status, payload = {}) {
  const error = payload?.error || payload || {};
  const code = String(error.code || error.type || '').toLowerCase();
  const message = String(error.message || '').toLowerCase();
  if (code.includes('insufficient_quota') || code.includes('billing') || /no credits remaining|quota.*exceeded|billing hard limit/.test(message)) {
    return { code: 'provider_quota_exhausted', status: 503, userMessage: 'Die KI-Analyse ist momentan nicht verfügbar, weil das API-Guthaben des KI-Dienstes aufgebraucht ist. Bitte lade das Guthaben auf und versuche es anschließend erneut.' };
  }
  if (status === 401 || code.includes('invalid_api_key') || /incorrect api key|invalid api key/.test(message)) {
    return { code: 'provider_authentication_failed', status: 503, userMessage: 'Die Verbindung zum KI-Dienst ist momentan falsch konfiguriert. Bitte informiere den Administrator.' };
  }
  if (status === 429 || code.includes('rate_limit')) {
    return { code: 'provider_rate_limited', status: 503, userMessage: 'Der KI-Dienst erhält momentan zu viele Anfragen. Bitte versuche es in wenigen Minuten erneut.' };
  }
  if (status >= 500) {
    return { code: 'provider_unavailable', status: 503, userMessage: 'Der KI-Dienst ist momentan vorübergehend nicht erreichbar. Bitte versuche es später erneut.' };
  }
  return { code: 'provider_request_failed', status: 502, userMessage: 'Die KI konnte die Anfrage momentan nicht verarbeiten. Bitte versuche es erneut.' };
}

function normalizeSocialText(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase('de-DE')
    .replace(/[’']/g, '').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

const SOCIAL_POOLS = {
  greeting: [
    hour => `Moin! Schön, dass du da bist. Wie startet ${hour} bei dir?`,
    () => 'Servus! Im Scouting-Büro ist alles startklar. Was liegt heute an?',
    () => 'Hey! Da bist du ja. Womit legen wir los?',
    () => 'Grüß dich! Erst kurz durchatmen oder direkt an die nächste Analyse?'
  ],
  how_are_you: [
    () => 'Bestens, danke der Nachfrage! Ich bin bereit. Wie läuft es bei dir?',
    () => 'Alles im grünen Bereich bei mir – ich bin startklar. Und bei dir?',
    () => 'Kann nicht klagen! Was steht bei dir heute an?'
  ],
  thanks: [
    () => 'Immer gern! Dafür bin ich als dein Scouting-Partner da.',
    () => 'Kein Ding, gehört zum Job. Sag Bescheid, wenn wir tiefer einsteigen sollen.',
    () => 'Freut mich, wenn es hilft! Was nehmen wir uns als Nächstes vor?',
    () => 'Sehr gerne! Gemeinsam behalten wir den Überblick.'
  ],
  goodbye: [
    () => 'Alles klar, mach’s gut! Bis später und einen erfolgreichen Tag.',
    () => 'Schönen Feierabend dir! Wir machen hier weiter, wenn du wieder da bist.',
    () => 'Bis dann! Erhol dich gut. Unser Gesprächsstand bleibt erhalten.'
  ],
  apology: [
    () => 'Alles gut, überhaupt kein Problem. Wo waren wir stehengeblieben?',
    () => 'Kein Stress! Sag mir einfach, was wir korrigieren oder anders machen sollen.',
    () => 'Halb so wild. Wir schauen es uns gemeinsam an.'
  ],
  coffee_break: [
    () => 'Guter Punkt – gönn dir in Ruhe eine Pause. Wir machen danach genau hier weiter.',
    () => 'Klingt nach einer verdienten Pause. Ich bin bereit, wenn du zurück bist.',
    () => 'Mach ganz entspannt. Der nächste Schritt läuft uns nicht weg.'
  ],
  weekend_smalltalk: [
    (hour, weekday) => weekday >= 4 ? 'Spieltag-Stimmung! Hast du ein Spiel besonders im Blick?' : 'Ein guter Zeitpunkt, um die Spiele vom Wochenende auszuwerten. Hast du etwas Interessantes gesehen?',
    () => 'Fußball bietet immer Gesprächsstoff. Welches Spiel hast du verfolgt?'
  ],
  open_question: [
    () => 'Wir können gemeinsam Spieler recherchieren und bewerten, Scouting-Berichte prüfen, Talente vergleichen oder die Plattform weiterentwickeln. Was möchtest du als Erstes angehen?',
    () => 'Es gibt einiges: Wir können eine Spieleranalyse starten, Daten auswerten, eine Recherche durchführen oder an myScoutingDatabase weiterarbeiten. Womit sollen wir beginnen?',
    () => 'Wir können direkt ins Scouting einsteigen, eine konkrete Frage klären oder gemeinsam einen Entwicklungsschritt planen. Was ist dir gerade am wichtigsten?'
  ],
  bot_identity: [
    () => 'Ich bin MESSINHO – dein digitaler Scouting- und Analysepartner. Ich bin eine KI, die dich bei Recherche, Bewertung und Transferentscheidungen unterstützt.',
    () => 'Ich bin MESSINHO, eine KI für professionelles Fußballscouting. Ich verbinde deine Gesprächsziele mit den Daten und Analysefunktionen der Plattform.'
  ]
};

const INTENT_PATTERNS = [
  ['open_question', /\b(was koennen wir machen|was koennen wir tun|womit koennen wir anfangen|was machen wir jetzt)\b/],
  ['bot_identity', /\b(wer bist du|wie heisst du|bist du ein mensch|bist du eine ki)\b/],
  ['goodbye', /\b(tschuess|tschuss|ciao|bis dann|bis spaeter|schoenen abend|schoenes wochenende|feierabend|mach es gut|machs gut|haut rein)\b/],
  ['apology', /\b(sorry|entschuldigung|tut mir leid|mein fehler|ups)\b/],
  ['coffee_break', /\b(kaffee|pause|mittagessen|mittagspause|hunger|muede)\b/],
  ['thanks', /\b(danke|dankeschoen|vielen dank|merci|top arbeit|super gemacht|stark)\b/],
  ['how_are_you', /\b(wie geht es dir|wie gehts dir|alles klar|alles fit|was geht|wie laeuft es bei dir|alles gut bei dir)\b/],
  ['weekend_smalltalk', /\b(wochenende|montag|freitag|spieltag|bundesliga|champions league)\b/],
  ['greeting', /\b(hallo|hi|hey|moin|servus|guten morgen|guten tag|guten abend|nabend|grue\u00df dich|na)\b/]
];

function detectSocialIntent(text) {
  const normalized = normalizeSocialText(text);
  if (!normalized || normalized.length > 180) return null;
  // Do not intercept requests that contain a clear work/scouting action.
  if (/\b(suche|such|scoute|recherchiere|analysiere|vergleiche|bewerte|erstelle|berechne|finde|spieler|talent|kandidat|transfer|marktwert|shortlist|datenbank|position|jahrgang|u\s?\d{1,2})\b/.test(normalized)) return null;
  for (const [intent, pattern] of INTENT_PATTERNS) if (pattern.test(normalized)) return intent;
  return null;
}


/**
 * Resolve a clear acceptance of an option offered in the immediately preceding
 * assistant turn. This is a bounded clarification only: it never runs research
 * or dispatches a capability without the missing subject and explicit task.
 */
export function resolveMessinhoDeterministicFollowUp(message, history = []) {
  const current = normalizeSocialText(message);
  if (!current || current.length > 180) return null;
  const previous = [...(Array.isArray(history) ? history : [])]
    .reverse().find(item => item?.role === 'assistant' && typeof item.text === 'string')?.text || '';
  const offered = normalizeSocialText(previous);
  if (!offered || !/\\b(recherche|recherchieren|spieleranalyse|daten auswerten|weiterentwickeln)\\b/.test(offered)) return null;

  const acceptedResearch = /\\b(recherche hoert sich gut an|recherche klingt gut|gerne recherche|lass uns recherchieren|ich moechte recherchieren|recherchieren wir|recherche waehlen)\\b/.test(current);
  const acceptedAnalysis = /\\b(spieleranalyse hoert sich gut an|analyse klingt gut|gerne analyse|spieler analysieren)\\b/.test(current);
  const acceptedData = /\\b(daten auswerten hoert sich gut an|datenauswertung klingt gut|daten auswerten)\\b/.test(current);
  const acceptedDevelopment = /\\b(weiterentwicklung hoert sich gut an|plattform weiterentwickeln|system weiterentwickeln)\\b/.test(current);

  if (acceptedResearch && /\\brecherche\\b/.test(offered)) {
    return { intent: 'clarify_research_subject', reply: 'Gerne. Was möchtest du recherchieren – einen Spieler, einen Verein, eine Liga oder ein anderes Thema?' };
  }
  if (acceptedAnalysis && /\\bspieleranalyse\\b/.test(offered)) {
    return { intent: 'clarify_player_analysis', reply: 'Gerne. Welchen Spieler sollen wir analysieren? Nenne mir bitte seinen Namen und – wenn möglich – seinen aktuellen Verein.' };
  }
  if (acceptedData && /\\bdaten auswerten\\b/.test(offered)) {
    return { intent: 'clarify_data_analysis', reply: 'Gerne. Welche Daten möchtest du auswerten – Spielerdaten, Leistungswerte, Scouting-Berichte oder etwas anderes?' };
  }
  if (acceptedDevelopment && /\\bweiterentwickeln\\b/.test(offered)) {
    return { intent: 'clarify_development_goal', reply: 'Gerne. Welchen Bereich von myScoutingDatabase sollen wir als Nächstes verbessern?' };
  }
  return null;
}

export function classifyMessinhoSocialIntent(message) {
  return detectSocialIntent(message) || 'scouting_work';
}

export function getMessinhoSocialReply(message, history = [], now = new Date()) {
  const intent = detectSocialIntent(message);
  if (!intent) return null;
  const pool = SOCIAL_POOLS[intent];
  const hour = now.getHours() < 11 ? 'der Morgen' : now.getHours() < 17 ? 'der Tag' : 'der Abend';
  const weekday = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const used = new Set((Array.isArray(history) ? history : [])
    .filter(item => item?.role === 'assistant' && typeof item.text === 'string')
    .slice(-20).map(item => item.text));
  const fresh = pool.filter(reply => !used.has(reply(hour, weekday)));
  const candidates = fresh.length ? fresh : pool;
  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  return selected(hour, weekday);
}

export function getMessinhoSmallTalkReply(message) {
  return getMessinhoSocialReply(message);
}

/**
 * Provider-independent live-information tools.
 * These resolvers use authoritative runtime context rather than model memory.
 */
export function resolveMessinhoLiveQuestion(message, { now = new Date(), timeZone = 'Europe/Berlin' } = {}) {
  const text = normalizeSocialText(message);
  if (!text || text.length > 220) return null;

  const asksTime = /\b(wie spaet ist es|wieviel uhr ist es|wie viel uhr ist es|wie spaet|aktuelle uhrzeit|uhrzeit|wie viel uhr)\b/.test(text);
  const asksDate = /\b(welches datum haben wir|welcher tag ist heute|was fuer ein datum|wie ist das datum|heutiges datum|welcher wochentag ist heute)\b/.test(text);
  if (!asksTime && !asksDate) return null;

  const time = new Intl.DateTimeFormat('de-DE', {
    timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).format(now);
  const date = new Intl.DateTimeFormat('de-DE', {
    timeZone, weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  }).format(now);

  if (asksTime && asksDate) return {
    tool: 'system_clock', intent: 'live_time_and_date',
    reply: 'In ' + timeZone + ' ist es ' + time + ' Uhr am ' + date + '.',
    verified_at: now.toISOString(), time_zone: timeZone
  };
  if (asksDate) return {
    tool: 'system_clock', intent: 'live_date',
    reply: 'Heute ist ' + date + '.',
    verified_at: now.toISOString(), time_zone: timeZone
  };
  return {
    tool: 'system_clock', intent: 'live_time',
    reply: 'In ' + timeZone + ' ist es ' + time + ' Uhr.',
    verified_at: now.toISOString(), time_zone: timeZone
  };
}


/**
 * Build a deterministic, evidence-safe follow-up when approved VO2max
 * knowledge is requested for player-specific application.
 * This helper never estimates a value or creates a player rating.
 */
export function buildMessinhoKnowledgeApplicationFollowUp(question, { conceptKey = null, player = null, knowledgeLevel = 'foundational' } = {}) {
  if (conceptKey !== 'sports_science.physiology.vo2max') return null;
  const text = normalizeSocialText(question);
  if (!text || text.length > 1600) return null;
  const asksApplication = /\b(nutzen|anwenden|anwend|ordne|einordnen|interpretieren|leistungsbewertung|bewerte|bewerten|beurteilen|einschaetzen|ausdauerleistungsfaehigkeit|welche informationen|welche daten|was benoetigst|was brauche ich|zusaetzlich)\b/.test(text);
  if (!asksApplication) return null;

  const raw = String(question || '');
  const hasValue = /\b\d{1,3}(?:[.,]\d+)?\s*(?:ml\s*[·.]?\s*kg\s*(?:\/|\*|·)\s*min(?:\s*[-−]?\s*1)?|ml\/kg\/min)\b/i.test(raw)
    || /\bvo\s*[₂2]?\s*max\s*[:=]?\s*\d{1,3}(?:[.,]\d+)?\b/i.test(raw);
  const directMethod = /spiroergometrie|\bcpet\b|direkt gemessen|direktmessung/i.test(raw);
  const estimatedMethod = /geschaetzt|schaetzung|feldtest|lauftest|yo.?yo|beep.?test|indirekt bestimmt|vorhersage|prediction/i.test(text);
  const hasMethod = directMethod || estimatedMethod;
  const hasDate = /\b(?:20\d{2}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}\.\d{2,4})\b/.test(raw);

  const playerAge = Number.isFinite(Number(player?.age)) && player?.age !== null && player?.age !== undefined ? Number(player.age) : null;
  // A birth year alone is not an exact age: the birthday may not have occurred yet.
  const hasAge = playerAge !== null || /\b\d{2}\s*(?:jahre|j\.?)\b/i.test(raw);
  const playerPositions = Array.isArray(player?.positions) ? player.positions.filter(Boolean) : player?.position ? [player.position] : [];
  const hasPosition = playerPositions.length > 0 || /\b(torwart|innenverteidiger|aussenverteidiger|verteidiger|mittelfeld|stuermer|fluegel|position)\b/.test(text);
  const hasTrainingContext = Boolean(player?.training_status || player?.training_level || /\b(trainingsstatus|trainingsumfang|trainingsniveau|leistungssportler|amateur|profi|semiprofi)\b/.test(text));

  const missing = [];
  if (!hasValue) missing.push({ key: 'vo2max_value', label: 'VO₂max-Messwert mit Einheit (üblicherweise ml/kg/min)' });
  if (!hasMethod) missing.push({ key: 'test_method', label: 'Testverfahren: direkte Spiroergometrie/CPET oder Schätzung/Feldtest' });
  if (!hasDate) missing.push({ key: 'test_date', label: 'Datum der Messung' });
  if (!hasAge) missing.push({ key: 'player_age', label: 'Alter des Spielers' });
  if (!hasPosition) missing.push({ key: 'playing_position', label: 'Spielposition' });
  if (!hasTrainingContext) missing.push({ key: 'training_context', label: 'Trainingsstatus bzw. Trainingsniveau' });

  const methodNote = directMethod
    ? 'Das Verfahren ist als direkte CPET-/Spiroergometrie-Messung angegeben.'
    : estimatedMethod
      ? 'Der Wert wird als Schätzung bzw. Feldtestwert behandelt und nicht als direkte CPET-Messung.'
      : 'Ohne Testverfahren kann ich direkte Messwerte und Schätzwerte nicht gleichsetzen.';
  const missingText = missing.length
    ? 'Bitte ergänze noch: ' + missing.map(item => item.label).join('; ') + '.'
    : 'Die erforderlichen Angaben liegen vor. Ich kann die Messung methodisch und im Spielerkontext beschreiben. Der aktive Wissenseintrag ist derzeit Grundlagenwissen; ohne freigegebene, passende Referenzdaten vergebe ich keine Normrangfolge, keinen Perzentilwert und keinen Spieler-Score.';
  return {
    reply: 'Für eine konkrete Einordnung eines Spielers brauche ich die folgenden Angaben. ' + methodNote + ' ' + missingText
      + ' Ein absoluter Wert in L/min müsste zusätzlich mit der Körpermasse in Beziehung gesetzt werden. Aus der VO₂max allein erstelle ich keinen Gesamt-, Positions- oder Talent-Score.',
    follow_up: {
      kind: 'vo2max_player_application',
      status: missing.length ? 'needs_input' : 'ready_for_descriptive_context_only',
      required_inputs: missing.map(item => item.key),
      missing_inputs: missing.map(item => item.label),
      method_classification: directMethod ? 'direct_cpet' : estimatedMethod ? 'estimated_or_field_test' : 'not_provided',
      knowledge_level: knowledgeLevel,
      player_context: { age_available: hasAge, position_available: hasPosition, training_context_available: hasTrainingContext },
      comparative_norms_available: false,
      score_created: false,
      estimated_value_created: false
    }
  };
}

/** Detect whether the next chat turn plausibly supplies a requested VO2max input. */
export function isMessinhoVo2maxApplicationDataReply(message) {
  const raw = String(message || '');
  const text = normalizeSocialText(raw);
  if (!text || text.length > 1200) return false;
  return /\b\d{1,3}(?:[.,]\d+)?\s*ml\s*[\/·.]?\s*kg/i.test(raw)
    || /\b(?:cpet|spiroergometrie|feldtest|lauftest|geschätzt|geschaetzt|direkt gemessen)\b/i.test(text)
    || /\b\d{2}\s*(?:jahre|j\.?)\b/i.test(raw)
    || /\b(?:torwart|innenverteidiger|aussenverteidiger|verteidiger|mittelfeld|stuermer|fluegel)\b/i.test(text)
    || /\b(?:trainingsstatus|trainingsumfang|trainingsniveau|leistungssportler|amateur|profi|semiprofi)\b/i.test(text)
    || /\b(?:20\d{2}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}\.\d{2,4})\b/.test(raw);
}


/** Preserve the original VO2max question while applying the user's supplied follow-up data. */
export function buildMessinhoVo2maxApplicationQuery(previousQuestion, reply, latestAssistantText) {
  const previous = String(previousQuestion || '').trim();
  const current = String(reply || '').trim();
  const prompt = String(latestAssistantText || '');
  if (!previous || !current || current.length > 1200) return null;
  if (!prompt.includes('Für eine konkrete Einordnung eines Spielers brauche ich')) return null;
  if (!isMessinhoVo2maxApplicationDataReply(current)) return null;
  return previous + ' ' + current;
}
