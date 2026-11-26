/**
 * MESSINHO autonomous performance intelligence.
 * Runs inside every agent cycle; it is not a user-selectable capability.
 * Uses only explicitly supplied measurements and labels derived values separately.
 */
const finite = value => Number.isFinite(Number(value)) ? Number(value) : null;
const first = (...values) => values.find(value => value !== undefined && value !== null && value !== '');
const normalizeKey = value => String(value || '').toLowerCase().replace(/[ä]/g,'ae').replace(/[ö]/g,'oe').replace(/[ü]/g,'ue').replace(/[^a-z0-9]/g,'');

function readMetric(input, aliases) {
  const containers = [
    input?.player_metrics, input?.metrics, input?.athletic_metrics,
    input?.physical_metrics, input?.tracking_metrics, input?.player?.metrics,
    input?.player?.player_metrics, input?.player?.athletic_metrics,
    input?.player?.physical_metrics
  ].filter(value => value && typeof value === 'object' && !Array.isArray(value));
  const wanted = new Set(aliases.map(normalizeKey));
  for (const container of containers) {
    for (const [key, raw] of Object.entries(container)) {
      if (!wanted.has(normalizeKey(key))) continue;
      const value = typeof raw === 'object' && raw !== null ? finite(first(raw.value, raw.result, raw.amount)) : finite(raw);
      if (value !== null) return {value, unit: typeof raw === 'object' ? raw.unit || null : null, source_key:key};
    }
  }
  return null;
}
function metricFromRecords(input, aliases) {
  const records = [input?.performance_metrics, input?.measurements, input?.player?.performance_metrics, input?.player?.measurements];
  const wanted = new Set(aliases.map(normalizeKey));
  for (const list of records) {
    if (!Array.isArray(list)) continue;
    for (const row of list) {
      if (!row || !wanted.has(normalizeKey(row.metric || row.name || row.key || row.type))) continue;
      const value = finite(first(row.value, row.result, row.amount));
      if (value !== null) return {value, unit:row.unit || null, source_key:row.metric || row.name || row.key || row.type};
    }
  }
  return null;
}
function getMetric(input, aliases) { return readMetric(input, aliases) || metricFromRecords(input, aliases); }
function unitFactor(unit, dimension) {
  const u = normalizeKey(unit);
  if (dimension === 'distance') return ({m:1,meter:1,metre:1,meters:1,meter:1,km:1000,cm:.01,mm:.001})[u] ?? null;
  if (dimension === 'time') return ({s:1,sec:1,sekunde:1,sekunden:1,ms:.001,min:60,minute:60,minuten:60,h:3600,hr:3600,stunde:3600,stunden:3600})[u] ?? null;
  if (dimension === 'speed') return ({'ms':1,'mps':1,'kmh':1,'kmproh':1})[u] ?? null;
  return null;
}
function toSI(metric, dimension, defaultUnit) {
  if (!metric) return null;
  const unit = metric.unit || defaultUnit;
  const factor = unitFactor(unit, dimension);
  if (factor === null) return null;
  return metric.value * factor;
}
function round(value, digits=3) { return Number(value.toFixed(digits)); }
function speedToKmh(metric) {
  if (!metric) return null;
  const unit = normalizeKey(metric.unit || '');
  if (unit === 'kmh' || (!unit && /_(?:kmh|kmproh)$/.test(normalizeKey(metric.source_key)))) return metric.value;
  if (unit === 'ms' || unit === 'mps' || (!unit && /_(?:ms|mps)$/.test(normalizeKey(metric.source_key)))) return metric.value * 3.6;
  return null;
}
function jumpToCm(metric) {
  if (!metric) return null;
  const unit = normalizeKey(metric.unit || '');
  if (unit === 'cm' || (!unit && /_(?:cm)$/.test(normalizeKey(metric.source_key)))) return metric.value;
  if (unit === 'm' || (!unit && /_(?:m)$/.test(normalizeKey(metric.source_key)))) return metric.value * 100;
  return null;
}

export function buildMessinhoPerformanceIntelligence(input={}, goal='') {
  const measurements = {};
  const findings = [];
  const sprint10 = getMetric(input,['sprint_10m_time','10m_sprint_time','10m_zeit','10m']);
  const sprint30 = getMetric(input,['sprint_30m_time','30m_sprint_time','30m_zeit','30m']);
  const topSpeed = getMetric(input,['top_speed','max_speed','hoechstgeschwindigkeit','maximalgeschwindigkeit']);
  const jump = getMetric(input,['vertical_jump','sprunghoehe','sprunghöhe','countermovement_jump','cmj']);
  const shotSpeed = getMetric(input,['shot_speed','ball_speed','schussgeschwindigkeit','ballgeschwindigkeit']);
  const ballMass = getMetric(input,['ball_mass_kg','football_mass_kg','ballmasse_kg']);

  if (sprint10) {
    const seconds = toSI(sprint10,'time','s');
    if (seconds > 0) {
      measurements.sprint_10m_time_s = round(seconds,4);
      const derived = 10 / seconds;
      findings.push({type:'derived_physics',metric:'10m_average_speed',value:round(derived,3),unit:'m/s',also_kmh:round(derived*3.6),formula:'v = s / t',basis:'10 m Strecke und gemessene 10-m-Zeit',interpretation:'Durchschnittsgeschwindigkeit über 10 m; keine Aussage über Höchstgeschwindigkeit.'});
    }
  }
  if (sprint30) {
    const seconds = toSI(sprint30,'time','s');
    if (seconds > 0) {
      measurements.sprint_30m_time_s = round(seconds,4);
      const derived = 30 / seconds;
      findings.push({type:'derived_physics',metric:'30m_average_speed',value:round(derived,3),unit:'m/s',also_kmh:round(derived*3.6),formula:'v = s / t',basis:'30 m Strecke und gemessene 30-m-Zeit',interpretation:'Durchschnittsgeschwindigkeit über 30 m; keine Aussage über Höchstgeschwindigkeit.'});
    }
  }
  if (topSpeed) {
    const kmh = speedToKmh(topSpeed);
    if (kmh !== null && kmh >= 0 && kmh <= 60) {
      measurements.top_speed_kmh = round(kmh,2);
      findings.push({type:'measured_physics',metric:'top_speed',value:round(kmh,2),unit:'km/h',basis:'explizit angegebener Messwert'});
    }
  }
  if (jump) {
    const cm = jumpToCm(jump);
    if (cm !== null && cm >= 0 && cm <= 150) {
      measurements.vertical_jump_cm = round(cm,1);
      findings.push({type:'measured_physics',metric:'vertical_jump',value:round(cm,1),unit:'cm',basis:'explizit angegebener Messwert'});
    }
  }
  if (shotSpeed) {
    const kmh = speedToKmh(shotSpeed);
    if (kmh !== null && kmh >= 0 && kmh <= 250) {
      measurements.shot_speed_kmh = round(kmh,1);
      findings.push({type:'measured_physics',metric:'shot_speed',value:round(kmh,1),unit:'km/h',basis:'explizit angegebener Messwert'});
    }
  }
  if (ballMass && shotSpeed) {
    const massUnit = normalizeKey(ballMass.unit || '');
    const massKeyHasKg = /kg$/.test(normalizeKey(ballMass.source_key));
    const kg = massUnit === 'kg' || (!massUnit && massKeyHasKg) ? ballMass.value : null;
    const speedUnit = normalizeKey(shotSpeed.unit || '');
    const speedMs = speedUnit === 'kmh' ? shotSpeed.value/3.6 : ['ms','mps'].includes(speedUnit) ? shotSpeed.value : null;
    if (kg !== null && kg > 0 && kg <= 1 && speedMs !== null && speedMs >= 0 && speedMs <= 70) {
      const energy = .5 * kg * speedMs ** 2;
      findings.push({type:'derived_physics',metric:'ball_kinetic_energy',value:round(energy,2),unit:'J',formula:'E = ½ · m · v²',basis:'explizite Ballmasse und gemessene Ballgeschwindigkeit',interpretation:'Physikalische Bewegungsenergie des Balls; kein Maß für Schusspräzision oder Torwahrscheinlichkeit.'});
    }
  }

  const technical = getMetric(input,['pass_completion_pct','pass_accuracy','passquote','passgenauigkeit']);
  const duel = getMetric(input,['duel_win_pct','duel_success','zweikampfquote','duellquote']);
  const dribble = getMetric(input,['dribble_success_pct','dribbling_success','dribblingquote']);
  for (const [name, metric] of [['pass_completion',technical],['duel_win_rate',duel],['dribble_success',dribble]]) {
    if (metric && metric.value >= 0 && metric.value <= 100) {
      measurements[name+'_pct'] = round(metric.value,1);
      findings.push({type:'measured_performance',metric:name,value:round(metric.value,1),unit:'%',basis:'explizit angegebener Leistungswert'});
    }
  }

  const suppliedCount = Object.keys(measurements).length;
  const status = findings.length ? 'completed' : 'insufficient_data';
  return {
    status, engine:'messinho_autonomous_performance_intelligence',version:'1.0.0',
    goal:String(goal || '').slice(0,300), measurements, findings,
    evidence_classification:{measured:findings.filter(x=>x.type.startsWith('measured')).length,derived:findings.filter(x=>x.type==='derived_physics').length,assumed:0},
    overall_rating:null,
    rating_policy:'Kein pauschaler Spieler-Gesamtscore ohne positions-, alters-, liga- und stichprobenbezogene Vergleichsbasis sowie freigegebene Gewichtung.',
    limitations:[
      'Messwerte werden nur bei ausdrücklich angegebenen Werten und passenden Einheiten verwendet.',
      'Fehlende Werte werden nicht geschätzt oder aus anderen Kennzahlen abgeleitet.',
      'Durchschnittsgeschwindigkeit ist nicht Höchstgeschwindigkeit; Schussgeschwindigkeit ist nicht Schusspräzision.',
      'Aus diesen Daten allein wird weder Ausdauer noch Verletzungsrisiko abgeleitet.'
    ],
    execution:{automatic:true,user_selectable:false,source_data_mutated:false,model_weights_mutated:false,metrics_detected:suppliedCount}
  };
}
