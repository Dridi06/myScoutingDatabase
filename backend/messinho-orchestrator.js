import { executeMessinhoCapability } from './messinho-capability-runtime.js';

const PLANS = [
  { match: /\b(analysiere|analyse|profil|stärken|schwächen|spielstil|taktik)\b/i, ids: ['holistic_player_analysis','strength_weakness_analysis','position_analysis','overall_score','explainable_rating'], label: 'Spieleranalyse' },
  { match: /\b(potenzial|talent|entwicklung|prognose)\b/i, ids: ['potential_analysis','performance_development','potential_score','development_projection'], label: 'Potenzial- und Entwicklungsanalyse' },
  { match: /\b(vergleiche|vergleich|gegenüberstellen)\b/i, ids: ['peer_comparison_analysis','competition_comparison','overall_score'], label: 'Spielervergleich' },
  { match: /\b(datenqualität|datenlücken|vollständigkeit|quellen prüfen|quellenqualität)\b/i, ids: ['data_quality_score','source_trust_score','source_cross_check'], label: 'Daten- und Quellenprüfung' },
  { match: /\b(risiko|risiken|transferbewertung|transfer priorität)\b/i, ids: ['risk_score','transfer_priority','value_for_money'], label: 'Risiko- und Transferbewertung' },
  { match: /\b(lerne|lernen|lernstand|modell prüfen|prognosefehler|kalibrierung)\b/i, ids: ['dataset_quality_improvement','prediction_audit','regression_guard','model_benchmarking'], label: 'Kontrollierte Lernanalyse', adminOnly: true }
];

const ADMIN_ONLY = new Set(['dataset_quality_improvement','prediction_audit','regression_guard','model_benchmarking','supervised_learning','weight_optimization','controlled_self_optimization','model_versioning']);

export function planMessinhoCapabilities(message, role = 'scout') {
  const text = String(message || '').normalize('NFKC').toLocaleLowerCase('de-DE');
  const selected = PLANS.find(plan => plan.match.test(text));
  if (!selected) return null;
  if (selected.adminOnly && role !== 'admin') return { denied: true, label: selected.label, steps: [] };
  const steps = selected.ids.filter(id => !ADMIN_ONLY.has(id) || role === 'admin').slice(0, 6);
  return { label: selected.label, steps, mode: 'deterministic_allowlisted', role };
}

export function runMessinhoCapabilityPlan(plan, input = {}, role = 'scout') {
  if (!plan || plan.denied) return { status: 'denied', results: [] };
  const results = [];
  for (const id of plan.steps.slice(0, 6)) {
    if (ADMIN_ONLY.has(id) && role !== 'admin') {
      results.push({ capability_id: id, status: 'denied' });
      continue;
    }
    try {
      results.push(executeMessinhoCapability(id, input));
    } catch (error) {
      results.push({ capability_id: id, status: 'error', error: 'Die Teilfunktion konnte nicht ausgeführt werden.' });
    }
  }
  const completed = results.filter(item => item.status === 'completed' || item.status === 'verified' || item.status === 'proposal_ready').length;
  return { status: completed ? 'completed' : 'insufficient_data', label: plan.label, results, completed_steps: completed, total_steps: results.length, provider_independent: true, model_weights_changed: false };
}

export function formatMessinhoCapabilityResults(run, playerName = null) {
  if (!run || run.status === 'denied') return 'Diese Lern- und Modellprüfungen sind aus Sicherheitsgründen Administratoren vorbehalten.';
  const lines = [];
  if (playerName) lines.push('**' + playerName + '**');
  lines.push(run.label + ': ' + run.completed_steps + ' von ' + run.total_steps + ' Teilprüfungen mit verwertbarem Ergebnis.');
  for (const item of run.results) {
    const title = item.name || item.capability_id;
    if (item.status === 'completed' || item.status === 'verified' || item.status === 'proposal_ready') {
      const data = item.result || item.data || {};
      const score = data.score ?? data.overall?.score ?? data.potential_indicator;
      lines.push('• ' + title + ': ' + (score !== undefined && score !== null ? score + '/100' : item.status === 'proposal_ready' ? 'Lernvorschlag erstellt – Freigabe erforderlich' : 'abgeschlossen'));
    } else if (item.status === 'insufficient_data') {
      lines.push('• ' + title + ': Daten fehlen (' + (item.missing?.join(', ') || 'keine ausreichenden Eingaben') + ').');
    } else {
      lines.push('• ' + title + ': ' + (item.status || 'nicht verfügbar') + '.');
    }
  }
  lines.push('Es wurden keine Modellgewichte automatisch verändert. Fehlende Daten werden nicht geschätzt.');
  return lines.join('\n');
}
