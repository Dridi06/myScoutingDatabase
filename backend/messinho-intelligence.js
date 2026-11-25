/**
 * MESSINHO intelligence utilities.
 * These functions are deterministic and provider-independent. They never infer
 * missing facts and keep source freshness separate from source credibility.
 */
const normalize = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase('de-DE')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const METRIC_ALIASES = {
  acceleration: ['acceleration','antritt','beschleunigung'],
  sprint_speed: ['sprint speed','sprintgeschwindigkeit','top speed','hochstgeschwindigkeit'],
  stamina: ['stamina','ausdauer','laufleistung'],
  strength: ['strength','kraft','korperlichkeit','körperlichkeit'],
  agility: ['agility','beweglichkeit','wendigkeit'],
  dribbling: ['dribbling','dribbling erfolge','eins gegen eins','1 gegen 1'],
  passing: ['passing','passspiel','passgenauigkeit','progressive passes'],
  crossing: ['crossing','flanken','flankengenauigkeit'],
  finishing: ['finishing','abschluss','torschuss'],
  first_touch: ['first touch','erster kontakt','ballannahme'],
  positioning: ['positioning','positionierung','raumverhalten'],
  anticipation: ['anticipation','antizipation'],
  decision_making: ['decision making','entscheidungsfindung','handlungsschnelligkeit'],
  vision: ['vision','übersicht','uebersicht','spielübersicht'],
  pressing: ['pressing','gegenpressing'],
  work_rate: ['work rate','arbeitsrate','laufbereitschaft'],
  composure: ['composure','ruhe','nervenstarke','nervenstärke'],
  reflexes: ['reflexes','reflexe'],
  handling: ['handling','fangsicherheit'],
  distribution: ['distribution','spieleröffnung','spieleroeffnung','abwurf']
};

function numericScore(value) {
  const raw = value && typeof value === 'object' ? (value.score ?? value.value) : value;
  if (raw === null || raw === undefined || raw === '') return null;
  const number = Number(raw);
  if (!Number.isFinite(number) || number < 0) return null;
  // Match the existing scouting scale: 0..1, 1..5, or 0..100.
  if (number === 0) return 0;
  // Decimal fractions represent normalized 0..1 values; integers 1..5 are scout ratings.
  return Math.max(0, Math.min(100, number < 1 ? number * 100 : number <= 5 ? number * 20 : number));
}

export function assessMessinhoSource(source = {}, options = {}) {
  const now = Number.isFinite(options.now) ? options.now : Date.now();
  const rawUrl = typeof source.url === 'string' ? source.url.trim() : '';
  let url = null;
  try { url = new URL(rawUrl); } catch {}
  const secure = url?.protocol === 'https:';
  const published = source.published_date ? Date.parse(source.published_date) : NaN;
  const hasDate = Number.isFinite(published);
  const futureDate = hasDate && published > now + 86400000;
  const ageDays = hasDate && !futureDate ? Math.max(0, Math.floor((now - published) / 86400000)) : null;
  const maxAgeDays = Number.isFinite(options.maxAgeDays) ? Math.max(1, options.maxAgeDays) : 365;
  const freshness = !hasDate ? 'unknown' : futureDate ? 'invalid_date' : ageDays <= maxAgeDays ? 'fresh' : 'stale';
  const limitations = [];
  if (!secure) limitations.push('Quelle besitzt keine gültige HTTPS-Adresse.');
  if (!source.title) limitations.push('Quellentitel fehlt.');
  if (!hasDate) limitations.push('Veröffentlichungsdatum ist nicht bekannt.');
  if (freshness === 'stale') limitations.push('Quelle liegt außerhalb des Aktualitätsfensters.');
  if (freshness === 'invalid_date') limitations.push('Veröffentlichungsdatum liegt unplausibel in der Zukunft.');
  if (String(source.content || '').trim().length < 80) limitations.push('Nur begrenzter Quellenauszug verfügbar.');
  return {
    url_valid: !!url,
    secure_transport: secure,
    host: url?.hostname?.replace(/^www\./i, '') || null,
    freshness,
    age_days: ageDays,
    content_length: String(source.content || '').trim().length,
    limitations
  };
}

export function messinhoValueSupported(value, sourceUrls = [], sources = [], evidence = []) {
  const normalized = normalize(value).replace(/\s+/g, ' ').trim();
  if (!normalized) return false;
  const tokens = normalized.split(' ').filter(token => token.length > 1);
  const allowed = new Set(Array.isArray(sourceUrls) ? sourceUrls : []);
  const claims = new Map();
  for (const item of Array.isArray(evidence) ? evidence : []) {
    if (!allowed.has(item?.source_url)) continue;
    claims.set(item.source_url, [...(claims.get(item.source_url)||[]), String(item.claim||'')]);
  }
  return (Array.isArray(sources) ? sources : []).some(source => {
    if (!allowed.has(source.url)) return false;
    const text = normalize([source.title, source.content, ...(claims.get(source.url)||[])].filter(Boolean).join(' ')).replace(/\s+/g, ' ').trim();
    return tokens.length > 1 ? tokens.every(token => text.includes(token)) : text.includes(normalized);
  });
}

export function messinhoMetricSupported(metric, value, sourceUrls = [], sources = [], evidence = []) {
  const raw = value && typeof value === 'object' ? (value.score ?? value.value) : value;
  if (raw === null || raw === undefined || raw === '' || !Number.isFinite(Number(raw))) return false;
  const number = Number(raw);
  const metricKey = normalize(metric);
  const aliases = METRIC_ALIASES[metric] || METRIC_ALIASES[metricKey] || [String(metric || '')];
  const metricNames = aliases.map(alias => normalize(alias)).filter(alias => alias.length >= 3);
  const numericVariants = [normalize(raw)];
  if (number > 0 && number < 1) numericVariants.push(normalize(Number((number * 100).toFixed(2))));
  const allowed = new Set(Array.isArray(sourceUrls) ? sourceUrls : []);
  const claims = new Map();
  for (const item of Array.isArray(evidence) ? evidence : []) {
    if (!allowed.has(item?.source_url)) continue;
    claims.set(item.source_url, [...(claims.get(item.source_url)||[]), String(item.claim||'')]);
  }
  return (Array.isArray(sources) ? sources : []).some(source => {
    if (!allowed.has(source.url)) return false;
    const text = normalize([source.title, source.content, ...(claims.get(source.url)||[])].filter(Boolean).join(' ')).replace(/\s+/g, ' ').trim();
    const metricMentioned = metricNames.some(alias => text.includes(alias));
    const numberMentioned = numericVariants.some(variant => {
      let index = text.indexOf(variant);
      while (index >= 0) {
        const before = index === 0 ? ' ' : text[index - 1];
        const after = index + variant.length >= text.length ? ' ' : text[index + variant.length];
        if (!/[0-9]/.test(before) && !/[0-9]/.test(after)) return true;
        index = text.indexOf(variant, index + 1);
      }
      return false;
    });
    return metricMentioned && numberMentioned;
  });
}

export function validateMessinhoCandidateEvidence(candidate = {}, evidence = [], sources = []) {
  const name = normalize(candidate.name).replace(/\s+/g, ' ').trim();
  const birthYear = Number(candidate.birth_year);
  if (!name || !Number.isInteger(birthYear) || birthYear < 1900 || birthYear > 2100) {
    return { valid: false, supporting_source_urls: [], limitations: ['Spielername oder Geburtsjahr ist ungültig.'] };
  }
  const tokens = name.split(' ').filter(token => token.length > 1);
  const sourceMap = new Map((Array.isArray(sources) ? sources : []).map(source => [source.url, source]));
  const supported = [];
  for (const item of Array.isArray(evidence) ? evidence : []) {
    const source = sourceMap.get(item?.source_url);
    if (!source) continue;
    const fragments = [source.title, source.content, item.claim].filter(Boolean)
      .flatMap(value => String(value).split(/[\\n.!?;]+/))
      .map(value => normalize(value).replace(/\s+/g, ' ').trim()).filter(Boolean);
    const sameFragmentSupportsIdentity = fragments.some(text => {
      const nameMentioned = tokens.length > 1
        ? tokens.every(token => text.includes(token))
        : text.includes(name);
      const yearMentioned = new RegExp('(?:^|\\D)' + birthYear + '(?:\\D|$)').test(text);
      return nameMentioned && yearMentioned;
    });
    if (sameFragmentSupportsIdentity && source.url?.startsWith('https://')) supported.push(source.url);
  }
  const unique = [...new Set(supported)];
  return {
    valid: unique.length > 0,
    supporting_source_urls: unique,
    limitations: unique.length ? [] : ['Kein einzelner HTTPS-Beleg nennt sowohl den Spieler als auch das angegebene Geburtsjahr.']
  };
}

export function assessMessinhoEvidence(sources = [], options = {}) {
  const unique = new Map();
  for (const source of Array.isArray(sources) ? sources : []) {
    const assessment = assessMessinhoSource(source, options);
    const key = assessment.url_valid ? new URL(source.url).toString().replace(/#.*$/, '') : String(source.url || '');
    if (!unique.has(key)) unique.set(key, { ...source, assessment });
  }
  const rows = [...unique.values()];
  const secureRows = rows.filter(row => row.assessment.secure_transport);
  const domains = new Set(secureRows.map(row => row.assessment.host).filter(Boolean));
  const freshCount = secureRows.filter(row => row.assessment.freshness === 'fresh').length;
  const unknownDateCount = secureRows.filter(row => row.assessment.freshness === 'unknown').length;
  const staleCount = secureRows.filter(row => row.assessment.freshness === 'stale').length;
  const status = secureRows.length >= 3 && domains.size >= 2 && freshCount >= 1
    ? 'broad'
    : secureRows.length >= 2 && domains.size >= 2
      ? 'mixed'
      : secureRows.length >= 1 ? 'limited' : 'unusable';
  const limitations = [];
  if (secureRows.length < 2) limitations.push('Weniger als zwei gültige HTTPS-Quellen.');
  if (domains.size < 2) limitations.push('Quellen stammen nicht nachweislich von mehreren Domains.');
  if (!freshCount) limitations.push('Keine Quelle mit nachgewiesen aktuellem Veröffentlichungsdatum.');
  if (unknownDateCount) limitations.push(`${unknownDateCount} Quelle(n) ohne bekanntes Veröffentlichungsdatum.`);
  if (staleCount) limitations.push(`${staleCount} Quelle(n) außerhalb des Aktualitätsfensters.`);
  return {
    status,
    source_count: rows.length,
    secure_source_count: secureRows.length,
    unique_domain_count: domains.size,
    fresh_source_count: freshCount,
    unknown_date_count: unknownDateCount,
    stale_source_count: staleCount,
    limitations
  };
}

/**
 * Compares player metrics with an explicit club-defined target profile.
 * It intentionally returns no score unless at least three target attributes
 * have real player values. This is a transparent heuristic, not a prediction.
 */
export function evaluateMessinhoTacticalFit(candidate = {}, teamProfile = null) {
  if (!teamProfile || typeof teamProfile !== 'object' || !teamProfile.requirements || typeof teamProfile.requirements !== 'object') {
    return { status: 'not_configured', score: null, explanation: 'Kein vereinsseitiges Anforderungsprofil übergeben.' };
  }
  const metrics = candidate.performance_metrics || candidate.metrics || {};
  const normalizedMetrics = Object.entries(metrics).map(([key, value]) => [normalize(key), numericScore(value)]);
  const requirements = Object.entries(teamProfile.requirements)
    .map(([key, value]) => ({ key: normalize(key), target: numericScore(value.target ?? value), weight: Number(value.weight ?? 1) }))
    .filter(item => item.key && item.target !== null && Number.isFinite(item.weight) && item.weight > 0);
  const matched = [];
  for (const requirement of requirements) {
    const aliases = METRIC_ALIASES[requirement.key] || [requirement.key];
    const found = normalizedMetrics.find(([metric]) => aliases.some(alias => metric === normalize(alias) || metric.includes(normalize(alias))));
    if (found && found[1] !== null) matched.push({ attribute: requirement.key, actual: found[1], target: requirement.target, weight: requirement.weight });
  }
  const totalWeight = requirements.reduce((sum, item) => sum + item.weight, 0);
  const matchedWeight = matched.reduce((sum, item) => sum + item.weight, 0);
  const coverage = totalWeight ? Math.round(matchedWeight / totalWeight * 100) : 0;
  if (matched.length < 3 || matchedWeight < totalWeight * .5) {
    return {
      status: 'insufficient_data', score: null, coverage, matched_attributes: matched.length,
      required_attributes: requirements.length, formation: teamProfile.formation || null,
      role: teamProfile.role || null,
      explanation: 'Für einen belastbaren taktischen Abgleich fehlen mindestens drei passende Leistungsmerkmale und 50 % der Profilgewichtung.'
    };
  }
  const error = matched.reduce((sum, item) => sum + Math.abs(item.actual - item.target) * item.weight, 0) / matchedWeight;
  const score = Math.round(Math.max(0, 100 - error));
  return {
    status: 'heuristic_estimate', score, coverage, matched_attributes: matched.length,
    required_attributes: requirements.length, formation: teamProfile.formation || null,
    role: teamProfile.role || null, method: 'club_defined_attribute_distance_v1',
    attributes: matched,
    explanation: 'Heuristischer Abgleich realer Spielerwerte mit dem ausdrücklich vom Verein definierten Anforderungsprofil; keine automatische Erfolgsvorhersage.'
  };
}
