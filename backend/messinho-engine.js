/**
 * MESSINHO core engine – provider-independent scouting logic.
 * Versioned deterministic scoring; no model/provider is allowed to invent missing metrics.
 */
export const MESSINHO_ENGINE_VERSION = '1.0.0';

const POSITION_GROUPS = {
  goalkeeper: ['torwart','goalkeeper','keeper','gk','tw'],
  centreBack: ['innenverteidiger','iv','iv links','iv rechts','cb','center back','centre back'],
  fullBack: ['linksverteidiger','linker verteidiger','rechtsverteidiger','rechter verteidiger','av links','av rechts','av re li','lv','rv','lb','rb','left back','right back'],
  defensiveMidfield: ['6er','zdm','dm','cdm','defensives mittelfeld','defensive midfielder'],
  centralMidfield: ['8er','zm','cm','zentraler mittelfeldspieler','central midfielder'],
  attackingMidfield: ['10er','om','cam','offensives mittelfeld','attacking midfielder'],
  winger: ['flügel links','flügel rechts','flügelspieler','lf','rf','lw','rw','winger'],
  striker: ['9er','stürmer','mittelstürmer','st','cf','striker','centre forward']
};
const WEIGHTS = {
  goalkeeper: { technical: .25, tactical: .20, athletic: .20, goalkeeping: .35 },
  centreBack: { technical: .20, tactical: .35, athletic: .25, mental: .20 },
  fullBack: { technical: .25, tactical: .25, athletic: .30, mental: .20 },
  defensiveMidfield: { technical: .25, tactical: .35, athletic: .20, mental: .20 },
  centralMidfield: { technical: .30, tactical: .30, athletic: .20, mental: .20 },
  attackingMidfield: { technical: .35, tactical: .30, athletic: .15, mental: .20 },
  winger: { technical: .35, tactical: .20, athletic: .30, mental: .15 },
  striker: { technical: .30, tactical: .25, athletic: .25, mental: .20 },
  default: { technical: .30, tactical: .30, athletic: .25, mental: .15 }
};
const DIMENSION_ALIASES = {
  technical: ['technik','technical','technical_score'],
  tactical: ['taktik','tactical','tactical_score'],
  athletic: ['athletik','athletic','physical','athletic_score'],
  mental: ['mental','mentalitaet','mentality','mental_score'],
  goalkeeping: ['torwart','goalkeeping','goalkeeper','goalkeeping_score']
};
const norm = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase('de-DE').replace(/[ä]/g,'a').replace(/[ö]/g,'o').replace(/[ü]/g,'u').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,' ').trim();
function numeric(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n <= 1 ? n * 100 : n));
}
function dimensionValue(analysis, dimension) {
  const ratings = analysis?.ratings || analysis?.scores || {};
  const aliases = DIMENSION_ALIASES[dimension] || [dimension];
  for (const key of aliases) {
    const value = numeric(ratings[key]?.score ?? ratings[key] ?? analysis?.[key]);
    if (value !== null) return value;
  }
  const metrics = analysis?.performance_metrics || {};
  const keys = Object.keys(metrics);
  const matching = keys.filter(key => aliases.some(alias => norm(key).includes(norm(alias))));
  const values = matching.map(key => numeric(metrics[key])).filter(value => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}
function positionGroup(positions = []) {
  const values = (Array.isArray(positions) ? positions : [positions]).map(norm);
  return Object.entries(POSITION_GROUPS).find(([, aliases]) =>
    aliases.some(alias => values.some(value => value === norm(alias) || value.includes(norm(alias))))
  )?.[0] || 'default';
}
export function scoreMessinhoPlayer(candidate = {}) {
  const analysis = candidate.analysis || candidate;
  const player = analysis.player || candidate;
  const group = positionGroup(player.positions || candidate.positions || []);
  const weights = WEIGHTS[group] || WEIGHTS.default;
  const dimensions = {};
  let weighted = 0, availableWeight = 0;
  for (const [dimension, weight] of Object.entries(weights)) {
    const value = dimensionValue(analysis, dimension);
    dimensions[dimension] = value;
    if (value !== null) { weighted += value * weight; availableWeight += weight; }
  }
  const score = availableWeight >= .5 ? Math.round(weighted / availableWeight) : null;
  const coverage = Math.round(availableWeight * 100);
  return {
    engine_version: MESSINHO_ENGINE_VERSION,
    position_group: group,
    score,
    evidence_coverage: coverage,
    dimensions,
    confidence: score === null ? 'insufficient' : coverage >= 80 ? 'high' : coverage >= 60 ? 'medium' : 'low',
    explanation: score === null
      ? 'Keine ausreichenden numerischen Leistungsdaten für eine belastbare Bewertung.'
      : 'Positionsgewichtete Auswertung ausschließlich vorhandener numerischer Leistungsdaten; fehlende Werte wurden nicht geschätzt.'
  };
}
export function rankMessinhoPlayers(candidates = []) {
  return candidates.map(candidate => ({ ...candidate, messinho_rating: scoreMessinhoPlayer(candidate) }))
    .sort((a,b) => (b.messinho_rating.score ?? -1) - (a.messinho_rating.score ?? -1)
      || b.messinho_rating.evidence_coverage - a.messinho_rating.evidence_coverage);
}
export function sanitizeMessinhoHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-10).filter(item =>
    item && ['user','assistant'].includes(item.role) && typeof item.text === 'string'
  ).map(item => ({ role: item.role, text: item.text.slice(0, 1200) }));
}
