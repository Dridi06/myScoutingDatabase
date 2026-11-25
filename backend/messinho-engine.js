/**
 * MESSINHO core engine – provider-independent scouting logic.
 * Versioned deterministic scoring; no model/provider is allowed to invent missing metrics.
 */
export const MESSINHO_ENGINE_VERSION = '1.1.0';

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
export const MESSINHO_DEFAULT_WEIGHTS = WEIGHTS;
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
  // Existing scout ratings use both 0..1 fractions, 1..5 stars and 0..100 scores.
  // Keep this scale identical to MESSINHO learning and intelligence normalization.
  const scaled = n === 0 ? 0 : n < 1 ? n * 100 : n <= 5 ? n * 20 : n;
  return Math.max(0, Math.min(100, scaled));
}
function dimensionValue(analysis, dimension) {
  const ratings = analysis?.ratings || analysis?.scores || {};
  const aliases = DIMENSION_ALIASES[dimension] || [dimension];
  for (const key of aliases) {
    const value = numeric(ratings[key]?.score ?? ratings[key] ?? analysis?.[key]);
    if (value !== null) return value;
  }
  // Rating keys in existing scout records are not fully normalized (e.g. "Technik").
  // Match aliases case-/accent-insensitively before concluding that a dimension is missing.
  const normalizedRating = Object.entries(ratings).find(([key]) => aliases.some(alias => norm(key) === norm(alias)));
  if (normalizedRating) {
    const value = numeric(normalizedRating[1]?.score ?? normalizedRating[1]);
    if (value !== null) return value;
  }
  const directAnalysis = Object.entries(analysis || {}).find(([key]) => aliases.some(alias => norm(key) === norm(alias)));
  if (directAnalysis) {
    const value = numeric(directAnalysis[1]?.score ?? directAnalysis[1]);
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
export function getMessinhoPositionGroup(positions = []) { return positionGroup(positions); }
export function scoreMessinhoPlayer(candidate = {}, modelProfiles = null) {
  const analysis = candidate.analysis || candidate;
  const player = analysis.player || candidate;
  const group = positionGroup(player.positions || candidate.positions || []);
  const baseWeights = WEIGHTS[group] || WEIGHTS.default;
  const proposed = modelProfiles?.[group];
  const valid = proposed && typeof proposed === 'object' && Object.keys(baseWeights).every(key => Number.isFinite(Number(proposed[key])) && Number(proposed[key]) >= 0);
  const proposedTotal = valid ? Object.keys(baseWeights).reduce((sum,key)=>sum+Number(proposed[key]),0) : 0;
  const weights = proposedTotal > 0 ? Object.fromEntries(Object.keys(baseWeights).map(key=>[key,Number(proposed[key])/proposedTotal])) : baseWeights;
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
export function rankMessinhoPlayers(candidates = [], modelProfiles = null) {
  return candidates.map(candidate => ({ ...candidate, messinho_rating: scoreMessinhoPlayer(candidate, modelProfiles) }))
    .sort((a,b) => (b.messinho_rating.score ?? -1) - (a.messinho_rating.score ?? -1)
      || b.messinho_rating.evidence_coverage - a.messinho_rating.evidence_coverage);
}
export function sanitizeMessinhoHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-10).filter(item =>
    item && ['user','assistant'].includes(item.role) && typeof item.text === 'string'
  ).map(item => {
    const safe = { role: item.role, text: item.text.slice(0, 1200) };
    if (item.role === 'assistant' && item.researchContext && typeof item.researchContext === 'object') {
      const ctx = item.researchContext;
      safe.researchContext = {
        player: ctx.player && typeof ctx.player === 'object' ? { name: String(ctx.player.name || '').slice(0,120) } : null,
        profile: ctx.profile && typeof ctx.profile === 'object' ? { summary: String(ctx.profile.summary || '').slice(0,2400), corrected_name: String(ctx.profile.corrected_name || '').slice(0,120), facts: Array.isArray(ctx.profile.facts) ? ctx.profile.facts.slice(0,8).map(f => typeof f === 'string' ? f.slice(0,300) : { label: String(f?.label || f?.name || '').slice(0,100), value: String(f?.value || '').slice(0,300) }) : [], career: Array.isArray(ctx.profile.career) ? ctx.profile.career.slice(0,6).map(x => String(typeof x === 'string' ? x : JSON.stringify(x)).slice(0,400)) : [], recent_performance: ctx.profile.recent_performance && typeof ctx.profile.recent_performance === 'object' ? Object.fromEntries(Object.entries(ctx.profile.recent_performance).slice(0,8).map(([k,v]) => [String(k).slice(0,80), String(v).slice(0,240)])) : {}, missing_data: Array.isArray(ctx.profile.missing_data) ? ctx.profile.missing_data.slice(0,8).map(x => String(x).slice(0,120)) : [] } : null,
        sources: Array.isArray(ctx.sources) ? ctx.sources.slice(0,10).map(source => ({
          title: String(source.title || '').slice(0,240),
          url: /^https:\/\//i.test(String(source.url || '')) ? String(source.url).slice(0,1000) : '',
          publisher: String(source.publisher || '').slice(0,120),
          published_date: String(source.published_date || '').slice(0,40),
          snippet: String(source.snippet || '').slice(0,1400)
        })).filter(source => source.url) : [],
        researched_at: String(ctx.researched_at || '').slice(0,40)
      };
    }
    return safe;
  });
}


export function resolveMessinhoPlayerFollowUp(message, history = []) {
  const text = String(message || '').toLocaleLowerCase('de-DE').normalize('NFKC');
  const followUp = /\b(ihn|ihm|er|seine|seiner|seinen|seinem|seine karriere|diesen spieler|dieser spieler|darueber|darüber)\b/.test(text)
    && /\b(was|wer|wie|welche|welcher|mehr|sag|erzaehl|erzähl|infos|informationen|profil|karriere|leistungen|statistiken)\b/.test(text);
  if (!followUp || !Array.isArray(history)) return null;
  const priorUserMessages = history.filter(item => item?.role === 'user' && typeof item.text === 'string').slice(-6).reverse();
  for (const item of priorUserMessages) {
    const candidate = item.text.trim().replace(/[?.!]+$/,'');
    const match = candidate.match(/^(?:suche|finde|such|zeige|zeig)(?:\s+mir)?(?:\s+(?:den\s+)?spieler)?\s+(.{2,100})$/i)
      || candidate.match(/^([\p{Lu}][\p{L}'-]+(?:\s+[\p{Lu}][\p{L}'-]+){1,3})$/u);
    if (match) {
      const name = (match[1] || match[0]).trim();
      if (!/^(hilfe|messinho|hallo|guten tag)$/i.test(name)) return name.slice(0,100);
    }
  }
  return null;
}
