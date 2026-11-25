const MODEL_VERSION = 'asi_market_value_baseline@0.1.0';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const roundMoney = value => Math.round(value / 100_000) * 100_000;
const numeric = value => value === null || value === undefined || value === '' ? NaN : Number(value);\nconst weightedMedian = values => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const validUrl = value => {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
};

export function estimateMarketValue(input = {}) {
  const player = input.player || {};
  const comparables = Array.isArray(input.comparables) ? input.comparables : [];
  const age = numeric(player.age);
  const minutes = numeric(player.minutesLast12Months);
  const performance = numeric(player.performanceScore);
  const contractYears = player.contractYears === null || player.contractYears === undefined || player.contractYears === '' ? NaN : Number(player.contractYears);
  const position = String(player.position || '').trim();
  const validComparables = comparables.filter(item =>
    item && item.verified === true &&
    Number.isFinite(Number(item.feeEur)) && Number(item.feeEur) > 0 &&
    validUrl(item.sourceUrl) &&
    Number.isFinite(Number(item.similarity)) &&
    Number(item.similarity) >= 0.5 && Number(item.similarity) <= 1
  );

  const missing = [];
  if (!Number.isFinite(age) || age < 15 || age > 50) missing.push('Alter');
  if (!position) missing.push('Position/Spielrolle');
  if (!Number.isFinite(minutes) || minutes < 0) missing.push('Einsatzminuten der letzten 12 Monate');
  if (!Number.isFinite(performance) || performance < 0 || performance > 100) missing.push('Leistungsindex (0–100)');
  if (validComparables.length < 3) missing.push('Mindestens drei verifizierte Vergleichstransaktionen');

  if (missing.length) return {
    status: 'insufficient_data', modelVersion: MODEL_VERSION, currency: 'EUR',
    pointEstimate: null, intervalLow: null, intervalHigh: null, confidence: 'low',
    confidenceScore: 0, comparablesUsed: validComparables.length, missing,
    factors: [], comparables: validComparables.map(({ playerName, feeEur, sourceUrl, eventDate, similarity }) => ({ playerName, feeEur: Number(feeEur), sourceUrl, eventDate, similarity: Number(similarity) })),
    limitations: ['Ohne ausreichende, rechtmäßig nutzbare und verifizierte Vergleichstransaktionen wird kein Geldwert erfunden.']
  };

  const weighted = validComparables.map(item => ({
    value: Number(item.feeEur),
    weight: Number(item.similarity) * clamp(Number(item.sourceConfidence ?? 0.8), 0.4, 1)
  }));
  const base = weightedMedian(weighted);
  const factors = [];
  const add = (name, multiplier, explanation) => factors.push({
    name, multiplier: Number(multiplier.toFixed(3)),
    impactPercent: Number(((multiplier - 1) * 100).toFixed(1)), explanation
  });

  // Conservative, transparent MVP adjustments. These are policy coefficients, not trained parameters.
  let ageMultiplier = age <= 21 ? 1.08 : age <= 24 ? 1.12 : age <= 27 ? 1.08 : age <= 29 ? 1.0 : age <= 31 ? 0.88 : age <= 33 ? 0.72 : age <= 35 ? 0.52 : age <= 37 ? 0.34 : age <= 39 ? 0.22 : 0.12;
  add('Karrierephase / Alter', ageMultiplier, 'Nichtlineare, konservative Alterskurve; reduziert erwartbare Restlaufzeit.');
  const performanceMultiplier = clamp(0.65 + performance / 100 * 0.7, 0.65, 1.35);
  add('Leistungsindex', performanceMultiplier, 'Skaliert den Vergleichswert anhand eines extern belegten Leistungsindex.');
  const minutesMultiplier = clamp(0.75 + minutes / 3000 * 0.25, 0.75, 1.05);
  add('Einsatzvolumen', minutesMultiplier, 'Berücksichtigt tatsächliche Einsatzminuten; keine Verletzungs- oder Gesundheitsdaten.');
  const contractMultiplier = Number.isFinite(contractYears) && contractYears >= 0
    ? clamp(0.85 + contractYears * 0.08, 0.85, 1.17) : 1;
  add('Vertragsrestlaufzeit', contractMultiplier, Number.isFinite(contractYears) ? 'Vertragslaufzeit aus verifizierter Quelle.' : 'Vertragslaufzeit unbekannt; neutral angesetzt.');

  const leagueMultiplier = Number.isFinite(Number(player.leagueLevelMultiplier))
    ? clamp(Number(player.leagueLevelMultiplier), 0.7, 1.3) : 1;
  add('Wettbewerbsniveau', leagueMultiplier, 'Nur verwenden, wenn das Niveau nachvollziehbar und konsistent kalibriert ist.');
  const adjusted = base * factors.reduce((product, factor) => product * factor.multiplier, 1);
  const pointEstimate = roundMoney(adjusted);
  const sourceQuality = validComparables.reduce((sum, item) => sum + clamp(Number(item.sourceConfidence ?? 0.8), 0, 1), 0) / validComparables.length;
  const countScore = clamp(validComparables.length / 8, 0, 1);
  const inputScore = [age, position, minutes, performance].filter(value => value !== undefined && value !== null && value !== '').length / 4;
  const confidenceScore = Math.round((0.45 * countScore + 0.35 * sourceQuality + 0.2 * inputScore) * 100);
  const uncertainty = clamp(0.35 - confidenceScore / 100 * 0.2, 0.15, 0.35);
  return {
    status: 'estimated', modelVersion: MODEL_VERSION, currency: 'EUR',
    pointEstimate, intervalLow: roundMoney(pointEstimate * (1 - uncertainty)),
    intervalHigh: roundMoney(pointEstimate * (1 + uncertainty)),
    confidenceScore, confidence: confidenceScore >= 75 ? 'high' : confidenceScore >= 55 ? 'medium' : 'low',
    comparablesUsed: validComparables.length, baseComparableMedian: roundMoney(base),
    factors, comparables: validComparables.map(({ playerName, feeEur, sourceUrl, eventDate, similarity }) => ({ playerName, feeEur: Number(feeEur), sourceUrl, eventDate, similarity: Number(similarity) })),
    limitations: ['ASI-Baseline v0.1.0 ist regelbasiert und nicht auf historischen Transfers trainiert oder zeitlich validiert.', 'Transferablösen sind Transaktionspreise und nicht identisch mit einem latenten Marktwert.', 'Die Koeffizienten sind transparente MVP-Annahmen und müssen anhand rechtmäßig nutzbarer Daten kalibriert werden.', 'Keine Verletzungs-, Diagnose- oder sonstigen Gesundheitsdaten werden verwendet.']
  };
}
