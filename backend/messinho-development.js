/**
 * MESSINHO development cycle: reproducible match analysis, explainable scoring,
 * verified prediction audits and testable improvement hypotheses.
 * This module is deterministic and provider-independent.
 */
import { scoreMessinhoPlayer, MESSINHO_DEFAULT_WEIGHTS } from './messinho-engine.js';

const finite = value => value === null || value === undefined || value === '' ? null : (Number.isFinite(Number(value)) ? Number(value) : null);
const clamp = (value,min=0,max=100) => Math.max(min,Math.min(max,value));
const round = (value,digits=2) => Number(value.toFixed(digits));
const mean = values => values.length ? values.reduce((sum,value)=>sum+value,0)/values.length : null;
const DIMENSIONS = ['technical','tactical','athletic','mental','goalkeeping'];

export function buildMessinhoExplainableAssessment(player, modelProfiles = null) {
  const scored = scoreMessinhoPlayer(player, modelProfiles);
  const profile = modelProfiles?.[scored.position_group] || MESSINHO_DEFAULT_WEIGHTS[scored.position_group] || MESSINHO_DEFAULT_WEIGHTS.default;
  const totalWeight = Object.values(profile).reduce((sum,value)=>sum+(finite(value)??0),0) || 1;
  const trace = Object.entries(profile).map(([dimension,rawWeight]) => {
    const weight = (finite(rawWeight)??0)/totalWeight;
    const value = finite(scored.dimensions[dimension]);
    return {dimension,value,weight:round(weight,4),contribution:value===null?null:round(value*weight,2),status:value===null?'missing':'observed'};
  });
  const available = trace.filter(item=>item.value!==null);
  const weightedContribution = available.reduce((sum,item)=>sum+(item.contribution??0),0);
  const strengths = available.filter(item=>item.value>=75).sort((a,b)=>b.value-a.value);
  const developmentAreas = available.filter(item=>item.value<60).sort((a,b)=>a.value-b.value);
  return {
    score:scored.score,position_group:scored.position_group,evidence_coverage:scored.evidence_coverage,
    confidence:scored.confidence,engine_version:scored.engine_version,
    explanation:scored.explanation,weighted_dimensions:trace,
    strengths,development_areas:developmentAreas,
    missing_dimensions:trace.filter(item=>item.status==='missing').map(item=>item.dimension),
    score_trace:{available_weight:round(available.reduce((sum,item)=>sum+item.weight,0),4),weighted_contribution:weightedContribution,normalization:'available weights are renormalized; missing dimensions are not imputed'},
    limitations:['Bewertung basiert ausschließlich auf gespeicherten numerischen Scout-Werten.','Keine Video- oder Spielbeobachtung wird ohne strukturierte Ereignisdaten behauptet.','Konfidenz beschreibt Datenabdeckung, nicht statistisch kalibrierte Trefferwahrscheinlichkeit.']
  };
}

export function analyzeMessinhoMatch(events = []) {
  if (!Array.isArray(events) || events.length < 5) return {
    status:'insufficient_data',event_count:Array.isArray(events)?events.length:0,
    missing_inputs:['mindestens 5 strukturierte Spielereignisse'],
    explanation:'MESSINHO wertet nur übermittelte strukturierte Ereignisse aus; es dekodiert hier keine Rohvideos.'
  };
  const normalized = events.map((event,index)=>({
    index,minute:finite(event?.minute),phase:String(event?.phase||'unspecified').toLowerCase(),
    action:String(event?.action||event?.type||'unknown').toLowerCase(),
    successful:typeof event?.successful==='boolean'?event.successful:(typeof event?.success==='boolean'?event.success:null),
    xg:finite(event?.xg),player_id:event?.player_id??null
  }));
  const phases = {};
  const actions = {};
  for (const event of normalized) {
    if (!phases[event.phase]) phases[event.phase]={events:0,successes:0,known_outcomes:0,xg:0,xg_events:0};
    const phase=phases[event.phase];phase.events++;
    if(event.successful!==null){phase.known_outcomes++;if(event.successful)phase.successes++;}
    if(event.xg!==null){phase.xg+=event.xg;phase.xg_events++;}
    if(!actions[event.action])actions[event.action]={events:0,successes:0,known_outcomes:0};
    const action=actions[event.action];action.events++;
    if(event.successful!==null){action.known_outcomes++;if(event.successful)action.successes++;}
  }
  for(const group of Object.values(phases)){group.success_rate=group.known_outcomes?round(group.successes/group.known_outcomes*100,1):null;group.xg=round(group.xg,3);}
  for(const group of Object.values(actions))group.success_rate=group.known_outcomes?round(group.successes/group.known_outcomes*100,1):null;
  const minutes=normalized.map(x=>x.minute).filter(x=>x!==null);
  return {status:'completed',event_count:normalized.length,phase_breakdown:phases,action_breakdown:actions,
    total_xg:round(normalized.reduce((sum,x)=>sum+(x.xg??0),0),3),
    time_window:minutes.length?{from:Math.min(...minutes),to:Math.max(...minutes)}:null,
    data_quality:{events_with_outcome:normalized.filter(x=>x.successful!==null).length,events_with_minute:minutes.length,events_with_xg:normalized.filter(x=>x.xg!==null).length},
    limitations:['Ergebnisse gelten nur für die übermittelten Ereignisse.','Keine Hochrechnung auf nicht erfasste Spielaktionen.','xG-Werte werden übernommen, nicht durch ein eigenes Schussmodell erzeugt.']};
}

export function auditMessinhoPredictions(pairs = []) {
  const valid=pairs.filter(pair=>pair?.verification_status==='verified'&&finite(pair.predicted_value)!==null&&finite(pair.observed_value)!==null);
  if(!valid.length)return {status:'insufficient_data',verified_pairs:0,metrics:null};
  const errors=valid.map(pair=>({prediction_id:pair.prediction_id,player_id:pair.player_id,predicted:finite(pair.predicted_value),actual:finite(pair.observed_value),error:finite(pair.predicted_value)-finite(pair.observed_value)}));
  const bins=[{label:'0–39',min:0,max:40},{label:'40–59',min:40,max:60},{label:'60–79',min:60,max:80},{label:'80–100',min:80,max:101}];
  const calibration=bins.map(bin=>{const rows=valid.filter(pair=>finite(pair.predicted_value)>=bin.min&&finite(pair.predicted_value)<bin.max);return {range:bin.label,count:rows.length,mean_prediction:rows.length?round(mean(rows.map(x=>finite(x.predicted_value)))):null,mean_outcome:rows.length?round(mean(rows.map(x=>finite(x.observed_value)))):null};});
  const residuals=errors.map(row=>row.error);
  return {status:'completed',verified_pairs:valid.length,metrics:{mae:round(mean(residuals.map(Math.abs))),bias:round(mean(residuals)),rmse:round(Math.sqrt(mean(residuals.map(x=>x*x)))),within_5_points:round(residuals.filter(x=>Math.abs(x)<=5).length/valid.length*100,1),within_10_points:round(residuals.filter(x=>Math.abs(x)<=10).length/valid.length*100,1)},calibration,largest_errors:errors.slice().sort((a,b)=>Math.abs(b.error)-Math.abs(a.error)).slice(0,10),method:'Nur administrativ verifizierte Ergebnisse; Prognosen und Outcomes müssen dieselbe Messgröße verwenden.'};
}


const dateMs = value => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const wilsonInterval = (successes, total, z = 1.96) => {
  if (!total) return null;
  const p = successes / total, z2 = z * z, denominator = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denominator;
  const margin = z * Math.sqrt((p * (1 - p) / total) + z2 / (4 * total * total)) / denominator;
  return { low: round(clamp((center - margin) * 100, 0, 100), 1), high: round(clamp((center + margin) * 100, 0, 100), 1) };
};

/**
 * Evidence-gated longitudinal projection. It is a trend extrapolation, not a
 * calibrated probability and never imputes missing observations.
 */
export function forecastMessinhoPlayerDevelopment(history = [], { horizonMonths = 12, minimumPoints = 3 } = {}) {
  const horizon = Number.isFinite(Number(horizonMonths)) ? Math.max(1, Math.min(36, Number(horizonMonths))) : 12;
  const points = (Array.isArray(history) ? history : []).flatMap(row => {
    if (row?.verification_status !== 'verified') return [];
    const time = dateMs(row.observed_at || row.recorded_at || row.date || row.season_date);
    const value = finite(row.overall_score ?? row.score ?? row.observed_value);
    if (time === null || value === null || value < 0 || value > 100) return [];
    return [{ time, value, player_id: row.player_id ?? null }];
  }).sort((a,b)=>a.time-b.time);
  const unique = points.filter((point,index)=>index===0||point.time!==points[index-1].time);
  if (unique.length < Math.max(3, minimumPoints)) return {
    status:'insufficient_data', forecast:null, verified_points:unique.length,
    required_points:Math.max(3, minimumPoints), missing_inputs:['mindestens drei administrativ verifizierte, datierte Messpunkte']
  };
  const spanDays = (unique.at(-1).time - unique[0].time) / 86400000;
  if (spanDays < 180) return {
    status:'insufficient_data', forecast:null, verified_points:unique.length,
    span_days:round(spanDays,1), missing_inputs:['mindestens sechs Monate vergleichbare Verlaufshistorie']
  };
  const ids = [...new Set(unique.map(x=>x.player_id).filter(Boolean))];
  if (ids.length > 1) return { status:'invalid_data', forecast:null, reason:'mixed_player_history' };
  const origin = unique[0].time, xs = unique.map(x=>(x.time-origin)/(86400000*30.4375)), ys = unique.map(x=>x.value);
  const meanX=mean(xs),meanY=mean(ys);
  const denominator=xs.reduce((sum,x)=>sum+(x-meanX)**2,0);
  if (!denominator) return { status:'insufficient_data', forecast:null, reason:'no_time_variation' };
  const slope=xs.reduce((sum,x,i)=>sum+(x-meanX)*(ys[i]-meanY),0)/denominator;
  const intercept=meanY-slope*meanX;
  const residuals=ys.map((y,i)=>y-(intercept+slope*xs[i]));
  const residualStd=Math.sqrt(mean(residuals.map(x=>x*x)));
  const projected=clamp(intercept+slope*(xs.at(-1)+horizon),0,100);
  const range=clamp(1.96*residualStd*Math.sqrt(1+1/unique.length),2,25);
  const coverage=unique.length>=8&&spanDays>=365? 'high' : unique.length>=5&&spanDays>=270? 'moderate':'low';
  return {
    status:'completed', method:'verified_linear_trend_extrapolation', horizon_months:horizon,
    verified_points:unique.length, span_days:round(spanDays,1),
    observed_start:round(ys[0],1), observed_latest:round(ys.at(-1),1),
    observed_change:round(ys.at(-1)-ys[0],1), trend_points_per_month:round(slope,3),
    forecast:{projected_score:round(projected,1),range_low:round(clamp(projected-range,0,100),1),range_high:round(clamp(projected+range,0,100),1)},
    confidence:coverage, confidence_is_calibrated:false,
    limitations:['Trendfortschreibung ist keine kausal begründete Spielerentwicklung.','Keine Verletzungs-, Einsatzzeit- oder Vereinswechselwirkung ohne passende geprüfte Daten.','Der Wertebereich ist eine indikative Streuung, kein statistisch kalibriertes Prognoseintervall.']
  };
}

/** Empirical cohort rate only; never label an uncalibrated rate as an individual probability. */
export function forecastMessinhoTransferProbability(cases = [], context = {}, { minimumCases = 30 } = {}) {
  const position=String(context.position_group||'').toLowerCase();
  const level=String(context.target_level||'').toLowerCase();
  if(!position||!level)return {status:'insufficient_data',estimate:null,missing_inputs:['position_group','target_level']};
  const cohort=(Array.isArray(cases)?cases:[]).filter(row=>
    row?.verification_status==='verified'&&typeof row.transferred==='boolean'&&
    String(row.position_group||'').toLowerCase()===position&&
    String(row.target_level||'').toLowerCase()===level
  );
  if(cohort.length<minimumCases)return {status:'insufficient_data',estimate:null,verified_comparable_cases:cohort.length,required_cases:minimumCases};
  const successes=cohort.filter(row=>row.transferred).length;
  return {
    status:'completed',estimate:{historical_transfer_rate_pct:round((successes+1)/(cohort.length+2)*100,1),interval_95:wilsonInterval(successes,cohort.length)},
    verified_comparable_cases:cohort.length,successful_transfers:successes,
    interpretation:'Historische Basisrate vergleichbarer Fälle, keine individuelle Wechselwahrscheinlichkeit.',
    limitations:['Keine Aussage über die konkrete Wechselabsicht des Spielers.','Vertragslage, konkrete Vereinsnachfrage und aktuelle Berichte müssen separat belegt werden.']
  };
}

/** Empirical success/failure cohort forecast, requiring a sufficiently large verified peer group. */
export function forecastMessinhoPlayerOutcome(cases = [], context = {}, { minimumCases = 30 } = {}) {
  const position=String(context.position_group||'').toLowerCase();
  const age=finite(context.age), score=finite(context.current_score);
  if(!position||age===null||score===null)return {status:'insufficient_data',estimate:null,missing_inputs:['position_group','age','current_score']};
  const cohort=(Array.isArray(cases)?cases:[]).filter(row=>{
    if(row?.verification_status!=='verified'||typeof row.success!=='boolean')return false;
    const rowAge=finite(row.age),rowScore=finite(row.current_score);
    return String(row.position_group||'').toLowerCase()===position&&rowAge!==null&&Math.abs(rowAge-age)<=3&&rowScore!==null&&Math.abs(rowScore-score)<=10;
  });
  if(cohort.length<minimumCases)return {status:'insufficient_data',estimate:null,verified_comparable_cases:cohort.length,required_cases:minimumCases};
  const successes=cohort.filter(row=>row.success).length;
  return {
    status:'completed',estimate:{historical_success_rate_pct:round((successes+1)/(cohort.length+2)*100,1),interval_95:wilsonInterval(successes,cohort.length)},
    verified_comparable_cases:cohort.length,successful_outcomes:successes,failed_outcomes:cohort.length-successes,
    interpretation:'Historische Erfolgs-/Misserfolgsrate einer vergleichbaren, administrativ verifizierten Spielergruppe; keine individuelle Erfolgsgarantie.',
    limitations:['Erfolg muss im Datensatz einheitlich und vorab definiert sein.','Kohortenrate ist nicht kausal und nicht automatisch auf einzelne Spieler übertragbar.']
  };
}

/** Historical value trend only; distinct from the externally researched current market estimate. */
export function forecastMessinhoMarketValue(history = [], { horizonMonths = 12, minimumPoints = 3 } = {}) {
  const points=(Array.isArray(history)?history:[]).flatMap(row=>{
    if(row?.verification_status!=='verified'||String(row.currency||'EUR').toUpperCase()!=='EUR')return[];
    const time=dateMs(row.observed_at||row.date),value=finite(row.value_eur);
    return time!==null&&value!==null&&value>0&&value<=500000000?[{time,value}]:[];
  }).sort((a,b)=>a.time-b.time);
  const unique=points.filter((point,index)=>index===0||point.time!==points[index-1].time);
  const span=unique.length?(unique.at(-1).time-unique[0].time)/86400000:0;
  if(unique.length<Math.max(3,minimumPoints)||span<180)return {status:'insufficient_data',forecast:null,verified_points:unique.length,required_points:Math.max(3,minimumPoints),missing_inputs:['mindestens drei verifizierte EUR-Marktwertmessungen über sechs Monate']};
  const origin=unique[0].time,xs=unique.map(x=>(x.time-origin)/(86400000*30.4375)),ys=unique.map(x=>x.value);
  const mx=mean(xs),my=mean(ys),den=xs.reduce((s,x)=>s+(x-mx)**2,0);
  if(!den)return {status:'insufficient_data',forecast:null,reason:'no_time_variation'};
  const slope=xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0)/den,intercept=my-slope*mx;
  const projected=Math.max(0,intercept+slope*(xs.at(-1)+Math.max(1,Math.min(36,Number(horizonMonths)||12))));
  const residual=ys.map((y,i)=>y-(intercept+slope*xs[i]));
  const spread=Math.sqrt(mean(residual.map(x=>x*x)));
  return {status:'completed',method:'verified_historical_value_trend',horizon_months:Math.max(1,Math.min(36,Number(horizonMonths)||12)),verified_points:unique.length,forecast:{projected_value_eur:Math.round(projected),indicative_low_eur:Math.round(Math.max(0,projected-1.96*spread)),indicative_high_eur:Math.round(projected+1.96*spread)},confidence:unique.length>=8&&span>=365?'moderate':'low',confidence_is_calibrated:false,limitations:['Historische Marktwertfortschreibung, keine offizielle Marktwertangabe.','Transfergerüchte, Vertragslaufzeit, Ligawechsel und Marktbedingungen sind nicht automatisch berücksichtigt.','Bandbreite ist indikativ und nicht statistisch kalibriert.']};
}

function correlation(xs,ys) {
  const mx=mean(xs),my=mean(ys);
  const numerator=xs.reduce((sum,x,i)=>sum+(x-mx)*(ys[i]-my),0);
  const dx=Math.sqrt(xs.reduce((sum,x)=>sum+(x-mx)**2,0));
  const dy=Math.sqrt(ys.reduce((sum,y)=>sum+(y-my)**2,0));
  return dx&&dy?numerator/(dx*dy):null;
}

export function generateMessinhoHypotheses(pairs = [], options = {}) {
  const minimum=Number.isInteger(options.minimumPairs)?Math.max(8,options.minimumPairs):12;
  const verified=pairs.filter(pair=>pair?.verification_status==='verified'&&finite(pair.predicted_value)!==null&&finite(pair.observed_value)!==null&&pair.dimension_scores&&typeof pair.dimension_scores==='object');
  if(verified.length<minimum)return {status:'insufficient_data',verified_pairs:verified.length,required_pairs:minimum,hypotheses:[],message:'Noch nicht genügend verifizierte Prognose-Ergebnis-Paare für belastbare Hypothesen.'};
  const hypotheses=[];
  for(const dimension of DIMENSIONS){
    const rows=verified.map(pair=>({dimension:finite(pair.dimension_scores[dimension]),error:finite(pair.predicted_value)-finite(pair.observed_value)})).filter(row=>row.dimension!==null);
    if(rows.length<minimum)continue;
    const r=correlation(rows.map(x=>x.dimension),rows.map(x=>x.error));
    if(r===null||Math.abs(r)<.3)continue;
    hypotheses.push({id:'dimension_error_'+dimension,dimension,sample_size:rows.length,error_correlation:round(r,3),
      hypothesis:r>0?'Bei höheren Werten dieser Dimension überschätzt das aktuelle Modell das spätere Ergebnis häufiger.':'Bei höheren Werten dieser Dimension unterschätzt das aktuelle Modell das spätere Ergebnis häufiger.',
      proposed_experiment:r>0?'Gewicht dieser Dimension in einem Kandidatenmodell begrenzt reduzieren.':'Gewicht dieser Dimension in einem Kandidatenmodell begrenzt erhöhen.',
      validation:'Spielergetrennter Holdout-Test gegen aktive Baseline; keine automatische Aktivierung.',
      confidence:'exploratory',causality_claimed:false});
  }
  return {status:'completed',verified_pairs:verified.length,hypotheses,minimum_pairs:minimum,
    guardrails:['Korrelation ist keine Kausalität.','Hypothesen sind Vorschläge, keine Änderungen am aktiven Modell.','Jeder Vorschlag benötigt einen neuen Holdout-Test und Admin-Freigabe.']};
}
