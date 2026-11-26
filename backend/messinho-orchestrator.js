import { executeMessinhoCapability } from './messinho-capability-runtime.js';

const MAX_CAPABILITY_STEPS = 16;

const PLANS = [
  { id:'potential_development', match:/\b(potenzial|talent|entwicklung|prognose)\b/i, ids:['potential_analysis','performance_development','potential_score','development_projection'], label:'Potenzial- und Entwicklungsanalyse' },
  { id:'player_analysis', match:/\b(analysiere|analyse|profil|stärken|schwächen|spielstil|taktik)\b/i, ids:['holistic_player_analysis','strength_weakness_analysis','position_analysis','overall_score','explainable_rating'], label:'Spieleranalyse' },
  { id:'comparison', match:/\b(vergleiche|vergleich|gegenüberstellen)\b/i, ids:['peer_comparison_analysis','competition_comparison','overall_score'], label:'Spielervergleich' },
  { id:'data_quality', match:/\b(datenqualität|datenlücken|vollständigkeit|quellen prüfen|quellenqualität)\b/i, ids:['data_quality_score','source_trust_score','source_cross_check'], label:'Daten- und Quellenprüfung' },
  { id:'transfer_risk', match:/\b(risiko|risiken|transferbewertung|transfer priorität)\b/i, ids:['risk_score','transfer_priority','value_for_money'], label:'Risiko- und Transferbewertung' },
  { id:'controlled_learning', match:/\b(lerne|lernen|lernstand|modell prüfen|prognosefehler|kalibrierung)\b/i, ids:['dataset_quality_improvement','prediction_audit','regression_guard','model_benchmarking'], label:'Kontrollierte Lernanalyse', adminOnly:true }
];

const ADMIN_ONLY = new Set([
  'supervised_learning','position_specific_learning','scout_feedback_learning','prediction_audit',
  'error_pattern_detection','weight_optimization','age_group_learning','league_learning',
  'country_learning','talent_pathway_learning','false_positive_learning','breakthrough_learning',
  'scout_accuracy_analysis','scout_calibration','model_benchmarking','regression_guard',
  'dataset_quality_improvement','data_error_learning','position_change_learning',
  'availability_outcome_learning','probability_calibration','seasonal_learning',
  'verified_long_term_memory','model_versioning','controlled_self_optimization'
]);

const INPUT_LABELS = {
  player:'einen eindeutig zugeordneten Spieler',
  player_metrics:'belastbare Spielerleistungsdaten',
  positions:'Positionsangaben',
  history:'eine Entwicklungshistorie',
  dated_metrics:'datierte Leistungswerte',
  cohort_metrics:'ausreichende Vergleichsdaten',
  sources:'nachprüfbare Quellen',
  verified_predictions:'verifizierte Prognoseergebnisse',
  admin_verified_outcomes:'administrativ bestätigte Ergebnisse',
  risk_records:'dokumentierte Risikoinformationen',
  team_profile_requirements:'ein taktisches Anforderungsprofil',
  'team_profile.requirements':'ein taktisches Anforderungsprofil',
  market_comparables:'mindestens drei belegte Vergleichstransfers',
  transfer_cost:'belastbare Transferkosten',
  technical_metrics:'technische Leistungsdaten',
  tactical_metrics:'taktische Leistungsdaten',
  athletic_metrics:'athletische Leistungsdaten',
  birth_year:'ein belegtes Geburtsjahr',
  research_sources_from_asi_pipeline:'Rechercheergebnisse aus der Quellenprüfung'
};

function describeMissingInputs(inputs=[]) {
  return inputs.map(value=>INPUT_LABELS[value]||String(value).replace(/[._]+/g,' ')).join(', ');
}

export function planMessinhoCapabilities(message, role = 'scout') {
  const goal = String(message || '').normalize('NFKC').toLocaleLowerCase('de-DE').trim();
  const matched = PLANS.filter(plan => plan.match.test(goal));
  if (!matched.length) return null;

  const blockedPlans = matched.filter(plan => plan.adminOnly && role !== 'admin');
  const allowedPlans = matched.filter(plan => !plan.adminOnly || role === 'admin');
  const blockedCapabilities = [...new Set(blockedPlans.flatMap(plan => plan.ids))];
  const requestedSteps = [...new Set(allowedPlans.flatMap(plan => plan.ids))];
  const steps = requestedSteps.slice(0, MAX_CAPABILITY_STEPS);
  const deferredCapabilities = requestedSteps.slice(MAX_CAPABILITY_STEPS);

  if (!steps.length && blockedCapabilities.length) {
    return {
      denied:true,
      label:blockedPlans.map(plan=>plan.label).join(' + '),
      steps:[],
      blocked_capabilities:blockedCapabilities,
      matched_intents:matched.map(plan=>plan.id),
      mode:'goal_composed_deterministic',
      role
    };
  }

  return {
    denied:false,
    goal:String(message||'').trim().slice(0,500),
    label:matched.map(plan=>plan.label).join(' + '),
    labels:matched.map(plan=>plan.label),
    matched_intents:matched.map(plan=>plan.id),
    steps,
    blocked_capabilities:blockedCapabilities,
    deferred_capabilities:deferredCapabilities,
    max_steps:MAX_CAPABILITY_STEPS,
    mode:'goal_composed_deterministic',
    role
  };
}

export function runMessinhoCapabilityPlan(plan, input = {}, role = 'scout') {
  if (!plan || plan.denied) return {
    status:'denied',
    results:[],
    blocked_capabilities:plan?.blocked_capabilities||[],
    model_weights_changed:false,
    provider_independent:true
  };

  const results = [];
  let chainedInput = { ...input };
  for (const id of (plan.steps||[]).slice(0, MAX_CAPABILITY_STEPS)) {
    if (ADMIN_ONLY.has(id) && role !== 'admin') {
      results.push({ capability_id:id, status:'denied' });
      continue;
    }
    try {
      const output = executeMessinhoCapability(id, chainedInput);
      results.push(output);
      chainedInput = {
        ...chainedInput,
        _previous_capability_results:results.slice(-MAX_CAPABILITY_STEPS),
        _previous_capability_result:output
      };
    } catch {
      results.push({ capability_id:id, status:'error', error:'Der Arbeitsschritt konnte nicht abgeschlossen werden.' });
    }
  }

  const completed = results.filter(item =>
    item.status === 'completed' || item.status === 'verified' || item.status === 'proposal_ready'
  ).length;
  const hasIncomplete = results.some(item =>
    item.status === 'insufficient_data' || item.status === 'error' || item.status === 'denied'
  );
  return {
    status:completed===0?'insufficient_data':hasIncomplete?'partial':'completed',
    label:plan.label,
    matched_intents:plan.matched_intents||[],
    results,
    completed_steps:completed,
    total_steps:results.length,
    blocked_capabilities:plan.blocked_capabilities||[],
    deferred_capabilities:plan.deferred_capabilities||[],
    provider_independent:true,
    model_weights_changed:false
  };
}

export function formatMessinhoCapabilityResults(run, playerName = null) {
  if (!run || run.status === 'denied') {
    return 'Diese Anfrage betrifft interne Lern- und Modellprüfungen. Dafür sind Administratorrechte erforderlich.';
  }

  const lines = [];
  if (playerName) lines.push('**' + playerName + '**');
  lines.push('Ich habe deine Anfrage in folgende Arbeitsbereiche aufgeteilt: ' + run.label + '.');
  lines.push(run.completed_steps + ' von ' + run.total_steps + ' Arbeitsschritten lieferten ein verwertbares Ergebnis.');

  for (const item of run.results) {
    const title = item.name || 'Ein Arbeitsschritt';
    if (item.status === 'completed' || item.status === 'verified' || item.status === 'proposal_ready') {
      const data = item.result || item.data || {};
      const score = data.score ?? data.overall?.score ?? data.potential_indicator;
      const detail = score !== undefined && score !== null
        ? score + '/100'
        : item.status === 'proposal_ready'
          ? 'Lernvorschlag erstellt – Freigabe erforderlich'
          : 'Ergebnis liegt vor';
      lines.push('• ' + title + ': ' + detail + '.');
    } else if (item.status === 'insufficient_data') {
      lines.push('• ' + title + ': Dafür fehlen noch ' + (describeMissingInputs(item.missing_inputs)||'ausreichende Daten') + '.');
    } else if (item.status === 'denied') {
      lines.push('• ' + title + ': Dieser Schritt ist nur mit entsprechender Berechtigung möglich.');
    } else {
      lines.push('• ' + title + ': Dieser Schritt konnte nicht abgeschlossen werden.');
    }
  }

  if (run.blocked_capabilities?.length) {
    lines.push('Einige zusätzliche Lern- und Modellprüfungen bleiben aus Berechtigungsgründen geschützt.');
  }
  if (run.deferred_capabilities?.length) {
    lines.push('Weitere Prüfschritte wurden wegen der Ausführungsbegrenzung zurückgestellt und nicht als erledigt gewertet.');
  }
  lines.push('Es wurden keine Modellgewichte automatisch verändert. Fehlende Daten wurden nicht geschätzt.');
  return lines.join('\n');
}
