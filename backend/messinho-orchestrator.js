import { executeMessinhoCapability } from './messinho-capability-runtime.js';
import { getMessinhoCapabilityCatalog } from './messinho-capabilities.js';

export const MAX_CAPABILITY_STEPS = 20;
const MAX_GOAL_LENGTH = 1200;

const ADMIN_ONLY = new Set([
  'supervised_learning','position_specific_learning','scout_feedback_learning','prediction_audit',
  'error_pattern_detection','weight_optimization','age_group_learning','league_learning',
  'country_learning','talent_pathway_learning','false_positive_learning','breakthrough_learning',
  'scout_accuracy_analysis','scout_calibration','model_benchmarking','regression_guard',
  'dataset_quality_improvement','data_error_learning','position_change_learning',
  'availability_outcome_learning','probability_calibration','seasonal_learning',
  'verified_long_term_memory','model_versioning','controlled_self_optimization'
]);

// Explicit German/English vocabulary makes discovery independent of a manually selected skill.
// The catalogue remains the source of truth for names, descriptions and required inputs.
const KEYWORDS = {
  holistic_player_analysis:['ganzheitlich','gesamtprofil','spielerprofil','komplett analysieren','overall player analysis'],
  position_analysis:['position','hauptposition','positionsgruppe','position analysis'],
  multi_position_analysis:['mehrposition','alternative position','positionswechsel','mehrere positionen'],
  play_style_detection:['spielstil','spielertyp','spielweise','play style'],
  strength_weakness_analysis:['stärken','schwächen','stärken schwächen','entwicklungsfelder'],
  potential_analysis:['potenzial','potential','talentpotenzial','entwicklungspotenzial'],
  performance_development:['leistungsentwicklung','leistungsverlauf','performance development'],
  form_curve_analysis:['formkurve','aktuelle form','formverlauf'],
  game_intelligence_analysis:['spielintelligenz','raumverhalten','game intelligence'],
  tactical_behaviour_analysis:['taktisches verhalten','taktikverhalten','tactical behaviour'],
  game_phase_analysis:['spielphase','umschaltphase','offensive defensive','phasenanalyse'],
  duel_analysis:['zweikampf','duelle','duellquote'],
  running_performance_analysis:['laufleistung','laufdaten','tracking','laufdistanz'],
  speed_analysis:['geschwindigkeit','sprint','antritt','tempo'],
  technical_detail_analysis:['technik','ballkontrolle','passspiel','dribbling','abschluss'],
  creativity_analysis:['kreativität','chancenkreation','key passes','chance kreieren'],
  decision_quality_analysis:['entscheidungsqualität','entscheidungen','entscheidungsverhalten'],
  consistency_analysis:['konstanz','stabilität','schwankungen'],
  peer_comparison_analysis:['spieler vergleichen','peer vergleich','vergleichsgruppe','positionsvergleich'],
  age_relative_analysis:['altersvergleich','altersbezogen','jahrgangsvergleich'],
  availability_history_analysis:['ausfallhistorie','verfügbarkeit','verletzungshistorie','einsatzverfügbarkeit'],
  minutes_analysis:['spielminuten','einsatzminuten','startelfanteil','einsatzquote'],
  video_event_analysis:['videoanalyse','videoereignisse','spielvideo','video events'],
  anomaly_detection:['auffälligkeiten','anomalien','ausreißer','ungewöhnliche entwicklung'],
  player_profile_synthesis:['profil erstellen','spielerprofil erstellen','profil zusammenführen'],
  overall_score:['gesamtscore','gesamtbewertung','messinho score','overall score'],
  position_score:['positionsscore','positionsbewertung'],
  potential_score:['potenzial score','talentpotenzial score'],
  talent_score:['talent score','talentbewertung'],
  technical_score:['technik score','technikbewertung'],
  tactical_score:['taktik score','taktikbewertung'],
  athletic_score:['athletik score','athletikbewertung'],
  mental_score:['mental score','mentale bewertung'],
  goalkeeper_score:['torwart score','torwartbewertung','keeper score'],
  data_quality_score:['datenqualität','datenvollständigkeit','datenqualität score'],
  source_trust_score:['quellenqualität','quellenvertrauen','quellenvertrauens score'],
  development_score:['entwicklungs score','entwicklungsscore'],
  consistency_score:['konstanz score','konstanzscore'],
  league_fit_score:['liga fit','liga anpassung','liganiveau'],
  system_fit_score:['system fit','spielsystem','taktisches system'],
  coach_fit_score:['trainer fit','traineranforderung','trainerprofil'],
  club_fit_score:['vereins fit','kaderbedarf','club fit'],
  market_value_assessment:['marktwert','transferwert','marktwertspanne'],
  value_for_money:['preis leistung','preis leistungs verhältnis','transferkosten nutzen'],
  risk_score:['risiko score','transfer risiko','risikobewertung'],
  development_projection:['entwicklungsprognose','zukunftsprognose','prognose erstellen'],
  competition_comparison:['konkurrenzvergleich','direkte konkurrenz','wettbewerbsvergleich'],
  transfer_priority:['transferpriorität','transfer priorisieren','transfer shortlist priorisieren'],
  scout_rating_agreement:['scout bewertungen','scout abweichung','bewertungsunterschiede'],
  explainable_rating:['bewertung erklären','score erklären','bewertungsbegründung','erklärbarer score'],
  supervised_learning:['supervised learning','überwachtes lernen'],
  position_specific_learning:['positionsspezifisches lernen','positionslernen'],
  scout_feedback_learning:['scout feedback','scout rückmeldung','scoutfeedback'],
  prediction_audit:['prognose kontrollieren','prognosefehler','prognose audit'],
  error_pattern_detection:['fehler muster','fehlererkennung','wiederkehrende fehler'],
  weight_optimization:['gewichtung optimieren','gewichte optimieren','weight optimization'],
  age_group_learning:['altersgruppen lernen','altersgruppen kalibrierung'],
  league_learning:['liga lernen','liga kalibrierung'],
  country_learning:['länder lernen','ländervergleich kalibrierung'],
  talent_pathway_learning:['talentpfad','talentwicklungsverlauf','talent pathway'],
  false_positive_learning:['fehlprognosen','false positives','flop analyse'],
  breakthrough_learning:['durchbruch','breakthrough','top talent rückanalyse'],
  scout_accuracy_analysis:['scout genauigkeit','scout trefferquote','scout accuracy'],
  scout_calibration:['scout kalibrierung','scout kalibrieren'],
  model_benchmarking:['modellvergleich','model benchmark','modelle benchmarken'],
  regression_guard:['rückfallkontrolle','regression guard','modell rückschritt'],
  dataset_quality_improvement:['datensatz verbessern','trainingsdatenqualität','dataset qualität'],
  data_error_learning:['datenfehler lernen','datenfehler klassifizieren'],
  position_change_learning:['positionswechsel lernen','positionswechsel auswertung'],
  availability_outcome_learning:['ausfallfolgen','verfügbarkeit outcome'],
  probability_calibration:['wahrscheinlichkeiten kalibrieren','konfidenz kalibrieren','probability calibration'],
  seasonal_learning:['saisonvergleich','saisonale entwicklung','saison lernen'],
  verified_long_term_memory:['langzeitgedächtnis','verifizierte erkenntnisse','dauerhafte erkenntnisse'],
  model_versioning:['modellversion','modell versionieren','versionierung'],
  controlled_self_optimization:['selbstoptimierung','kontrollierte optimierung','selbst verbessern'],
  automated_talent_search:['talentsuche','spieler suchen','scouting suche','automatische suche'],
  international_research:['internationale recherche','international suchen','länderübergreifend recherchieren'],
  cross_league_research:['ligaübergreifend','ligen vergleichen','cross league'],
  youth_talent_discovery:['nachwuchstalente','jugendspieler finden','jugendtalente'],
  underdog_detection:['underdog','unbekannte talente','unterschätzte spieler'],
  hidden_gem_detection:['hidden gem','geheimtipp','verborgene talente'],
  club_research:['vereinsrecherche','verein recherchieren','club recherche'],
  squad_research:['kaderrecherche','kader analysieren','mannschaftskader'],
  contract_research:['vertrag recherchieren','vertragsinformationen','vertragssituation'],
  contract_expiry_monitor:['vertragsende','vertrag läuft aus','vertragsablauf'],
  rumour_verification:['transfergerücht','gerücht prüfen','gerüchte verifizieren'],
  market_monitoring:['transfermarkt beobachten','markt beobachten','marktmonitoring'],
  source_cross_check:['quellen vergleichen','quellen gegenprüfen','quellen abgleichen'],
  identity_verification:['identität prüfen','spieleridentität','namensverwechslung'],
  birth_year_verification:['geburtsjahr prüfen','geburtsdatum verifizieren','jahrgang verifizieren'],
  position_verification:['position verifizieren','position belegen','positionsangabe prüfen'],
  statistics_research:['statistik recherchieren','leistungsstatistik','spielerstatistiken'],
  video_source_research:['videoquellen','lizenzierte videos','videoquelle suchen'],
  match_report_research:['spielbericht recherchieren','match report','spielberichte'],
  competition_monitoring:['wettbewerb beobachten','turnier beobachten','liga monitoren'],
  club_need_research:['vereinsbedarf','positionsbedarf','kaderlücken'],
  comparable_player_research:['vergleichbare spieler finden','ähnliche spieler','spielertypen finden'],
  player_data_refresh:['spielerdaten aktualisieren','daten aktualisieren','datenaktualisierung'],
  new_talent_monitoring:['neue talente überwachen','talent monitoring','talente monitoren'],
  research_report_generation:['recherchebericht','scouting bericht','bericht erstellen','quellenbericht']
};

const LEGACY_PLANS = [
  { id:'potential_development', match:/\b(potenzial|potential|talent|entwicklung|prognose)\b/i, ids:['potential_analysis','performance_development','potential_score','development_projection'], label:'Potenzial- und Entwicklungsanalyse' },
  { id:'player_analysis', match:/\b(analysiere|analyse|profil|stärken|schwächen|spielstil|taktik)\b/i, ids:['holistic_player_analysis','strength_weakness_analysis','position_analysis','overall_score','explainable_rating'], label:'Spieleranalyse' },
  { id:'comparison', match:/\b(vergleiche|vergleich|gegenüberstellen)\b/i, ids:['peer_comparison_analysis','competition_comparison','overall_score'], label:'Spielervergleich' },
  { id:'data_quality', match:/\b(datenqualität|datenlücken|vollständigkeit|quellen prüfen|quellenqualität)\b/i, ids:['data_quality_score','source_trust_score','source_cross_check'], label:'Daten- und Quellenprüfung' },
  { id:'transfer_risk', match:/\b(risiko|risiken|transferbewertung|transfer priorität)\b/i, ids:['risk_score','transfer_priority','value_for_money'], label:'Risiko- und Transferbewertung' },
  { id:'controlled_learning', match:/\b(lerne|lernen|lernstand|modell prüfen|prognosefehler|kalibrierung)\b/i, ids:['dataset_quality_improvement','prediction_audit','regression_guard','model_benchmarking'], label:'Kontrollierte Lernanalyse', adminOnly:true }
];

const DEPENDENCIES = {
  player_profile_synthesis:['holistic_player_analysis','source_cross_check'],
  potential_score:['overall_score','performance_development'],
  talent_score:['overall_score','age_relative_analysis'],
  development_projection:['overall_score','performance_development'],
  explainable_rating:['overall_score'],
  value_for_money:['overall_score'],
  transfer_priority:['overall_score','club_need_research'],
  hidden_gem_detection:['overall_score','market_value_assessment'],
  underdog_detection:['overall_score','source_trust_score'],
  youth_talent_discovery:['birth_year_verification','automated_talent_search'],
  cross_league_research:['international_research','comparable_player_research'],
  rumour_verification:['source_cross_check'],
  contract_expiry_monitor:['contract_research'],
  research_report_generation:['source_cross_check']
};

const INPUT_LABELS = {
  player:'einen eindeutig zugeordneten Spieler', player_metrics:'belastbare Spielerleistungsdaten',
  positions:'Positionsangaben', history:'eine Entwicklungshistorie', dated_metrics:'datierte Leistungswerte',
  cohort_metrics:'ausreichende Vergleichsdaten', sources:'nachprüfbare Quellen',
  verified_predictions:'verifizierte Prognoseergebnisse', admin_verified_outcomes:'administrativ bestätigte Ergebnisse',
  risk_records:'dokumentierte Risikoinformationen', team_profile_requirements:'ein taktisches Anforderungsprofil',
  'team_profile.requirements':'ein taktisches Anforderungsprofil', market_comparables:'mindestens drei belegte Vergleichstransfers',
  transfer_cost:'belastbare Transferkosten', technical_metrics:'technische Leistungsdaten',
  tactical_metrics:'taktische Leistungsdaten', athletic_metrics:'athletische Leistungsdaten',
  birth_year:'ein belegtes Geburtsjahr', research_sources_from_asi_pipeline:'Rechercheergebnisse aus der Quellenprüfung'
};

const CATALOG = getMessinhoCapabilityCatalog();
const CATALOGUE = CATALOG.flatMap(group => group.functions.map(fn => ({...fn, group_id:group.id, group_name:group.name})));
const CATALOGUE_BY_ID = new Map(CATALOGUE.map(item => [item.id,item]));

function normalize(value) {
  return String(value||'').normalize('NFKC').toLocaleLowerCase('de-DE')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss')
    .replace(/[^a-z0-9]+/g,' ').trim();
}
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function describeMissingInputs(inputs=[]) {
  return inputs.map(value=>INPUT_LABELS[value]||String(value).replace(/[._]+/g,' ')).join(', ');
}
function capabilityMatches(goal, capability) {
  const text = normalize(goal);
  const phrases = KEYWORDS[capability.id] || [];
  if (text.includes(normalize(capability.name)) || text.includes(normalize(capability.id))) return 5;
  if (phrases.some(phrase => text.includes(normalize(phrase)))) return 5;
  const idWords = normalize(capability.id).split(' ').filter(word=>word.length>3);
  const nameWords = normalize(capability.name).split(' ').filter(word=>word.length>3);
  const words = unique([...idWords,...nameWords]);
  const hits = words.filter(word => text.includes(word));
  return hits.length >= 2 ? Math.min(3,hits.length) : 0;
}
function resolveDependencies(ids) {
  const resolved = [], visiting = new Set(), visited = new Set();
  function visit(id) {
    if (visited.has(id) || !CATALOGUE_BY_ID.has(id)) return;
    if (visiting.has(id)) return;
    visiting.add(id);
    for (const dependency of DEPENDENCIES[id]||[]) visit(dependency);
    visiting.delete(id); visited.add(id); resolved.push(id);
  }
  ids.forEach(visit);
  return resolved;
}

export function getMessinhoCapabilityDiscovery() {
  return CATALOGUE.map(item => ({
    id:item.id, name:item.name, group:item.group_id, description:item.description,
    required_inputs:item.required_inputs, admin_only:ADMIN_ONLY.has(item.id)
  }));
}

export function planMessinhoCapabilities(message, role='scout', context={}) {
  const rawGoal = String(message||'').normalize('NFKC').trim();
  if (!rawGoal) return null;
  const goal = rawGoal.slice(0,MAX_GOAL_LENGTH);
  const matchedLegacy = LEGACY_PLANS.filter(plan => plan.match.test(goal));
  const scored = CATALOGUE.map(capability => ({capability,score:capabilityMatches(goal,capability)}))
    .filter(item=>item.score>0).sort((a,b)=>b.score-a.score);
  const discovered = scored.map(item=>item.capability.id);
  const legacyIds = matchedLegacy.flatMap(plan=>plan.ids);
  const requested = unique([...legacyIds,...discovered]);
  if (!requested.length) return null;

  const ordered = resolveDependencies(requested);
  const blocked = ordered.filter(id=>ADMIN_ONLY.has(id)&&role!=='admin');
  const allowed = ordered.filter(id=>!ADMIN_ONLY.has(id)||role==='admin');
  const steps = allowed.slice(0,MAX_CAPABILITY_STEPS);
  const deferred = allowed.slice(MAX_CAPABILITY_STEPS);
  const labels = unique([
    ...matchedLegacy.map(plan=>plan.label),
    ...scored.slice(0,6).map(item=>item.capability.group_name)
  ]);
  if (!steps.length && blocked.length) {
    return {denied:true,goal,label:labels.join(' + ')||'Geschützte MESSINHO-Funktion',steps:[],
      blocked_capabilities:blocked,matched_intents:matchedLegacy.map(plan=>plan.id),
      discovered_capabilities:requested,mode:matchedLegacy.length?'goal_composed_deterministic':'goal_composed_capability_discovery',role};
  }
  return {
    denied:false,goal,label:labels.join(' + ')||'Automatische MESSINHO-Aufgabenplanung',labels,
    matched_intents:matchedLegacy.map(plan=>plan.id),discovered_capabilities:requested,
    steps,blocked_capabilities:blocked,deferred_capabilities:deferred,
    max_steps:MAX_CAPABILITY_STEPS,mode:matchedLegacy.length?'goal_composed_deterministic':'goal_composed_capability_discovery',role,
    context_hints:context&&typeof context==='object'?Object.keys(context).slice(0,20):[]
  };
}

function isUsefulStatus(status) {
  return ['completed','verified','proposal_ready'].includes(status);
}
function isIncompleteStatus(status) {
  return ['insufficient_data','error','denied','invalid_input','unknown_capability','unverified','needs_review','no_reliable_improvement'].includes(status);
}

export function runMessinhoCapabilityPlan(plan,input={},role='scout') {
  if (!plan || plan.denied) return {
    status:'denied',results:[],blocked_capabilities:plan?.blocked_capabilities||[],
    model_weights_changed:false,provider_independent:true,replan_recommended:false
  };
  const results=[];
  const baseInput={...(input&&typeof input==='object'&&!Array.isArray(input)?input:{})};
  let chainedInput={...baseInput};
  const steps=(plan.steps||[]).slice(0,MAX_CAPABILITY_STEPS);
  for (const id of steps) {
    if (ADMIN_ONLY.has(id)&&role!=='admin') {
      results.push({capability_id:id,status:'denied',missing_permissions:['admin']});
      continue;
    }
    try {
      const output=executeMessinhoCapability(id,chainedInput);
      results.push(output);
      chainedInput={...baseInput,_previous_capability_results:results.slice(-MAX_CAPABILITY_STEPS),
        _previous_capability_result:output,_capability_execution_index:results.length};
    } catch (error) {
      results.push({capability_id:id,status:'error',error:'Der Arbeitsschritt konnte nicht abgeschlossen werden.',
        error_code:error?.code||'CAPABILITY_EXECUTION_ERROR'});
    }
  }
  const completed=results.filter(item=>isUsefulStatus(item.status)).length;
  const incomplete=results.filter(item=>isIncompleteStatus(item.status));
  const replanRecommended=incomplete.some(item=>item.status==='insufficient_data'||item.status==='error');
  const status=completed===0?(incomplete.length?'insufficient_data':'completed'):
    incomplete.length||plan.blocked_capabilities?.length||plan.deferred_capabilities?.length?'partial':'completed';
  return {status,label:plan.label,goal:plan.goal,matched_intents:plan.matched_intents||[],
    discovered_capabilities:plan.discovered_capabilities||plan.steps||[],results,
    completed_steps:completed,total_steps:results.length,blocked_capabilities:plan.blocked_capabilities||[],
    deferred_capabilities:plan.deferred_capabilities||[],
    missing_inputs:unique(results.flatMap(item=>item.missing_inputs||[])),
    replan_recommended:replanRecommended,provider_independent:true,model_weights_changed:false,
    execution_policy:{max_steps:MAX_CAPABILITY_STEPS,admin_guard_enforced:true,source_data_mutated:false,
      model_weights_mutated:false,previous_results_used_as_untrusted_context:true}};
}

export async function runMessinhoCapabilityPlanAsync(plan,input={},role='scout',options={}) {
  const started=Date.now();
  const budgetMs=Math.max(250,Math.min(8000,Number(options.budgetMs)||8000));
  if (!plan || plan.denied) return {
    status:'denied',results:[],blocked_capabilities:plan?.blocked_capabilities||[],
    model_weights_changed:false,provider_independent:true,replan_recommended:false,
    execution_policy:{budget_ms:budgetMs,max_steps:MAX_CAPABILITY_STEPS}
  };
  const results=[];
  const baseInput={...(input&&typeof input==='object'&&!Array.isArray(input)?input:{})};
  let chainedInput={...baseInput};
  const requested=(plan.steps||[]).slice(0,MAX_CAPABILITY_STEPS);
  const deferred=[...(plan.deferred_capabilities||[])];
  for (let index=0;index<requested.length;index++) {
    const id=requested[index];
    if(Date.now()-started>=budgetMs){
      deferred.push(...requested.slice(index));
      break;
    }
    let output;
    if (ADMIN_ONLY.has(id)&&role!=='admin') {
      output={capability_id:id,status:'denied',missing_permissions:['admin']};
    } else {
      try {
        output=executeMessinhoCapability(id,chainedInput);
      } catch (error) {
        output={capability_id:id,status:'error',error:'Der Arbeitsschritt konnte nicht abgeschlossen werden.',
          error_code:error?.code||'CAPABILITY_EXECUTION_ERROR'};
      }
    }
    // This is execution provenance, not a claim that generated output is factual evidence.
    if(output&&typeof output==='object'&&!['denied','invalid_input','unknown_capability'].includes(output.status)){
      output={...output,provenance:{...(output.provenance||{}),capability_id:id,
        execution_source:'messinho_capability_runtime',runtime_version:output.engine_version||null}};
    }
    results.push(output);
    // Preserve original facts. Previous outputs remain untrusted context and are never
    // promoted to source records, verified evidence, player metrics or training outcomes.
    chainedInput={...baseInput,_previous_capability_results:results.slice(-MAX_CAPABILITY_STEPS),
      _previous_capability_result:output,_capability_execution_index:results.length};
    if(typeof options.onStep==='function'){
      await options.onStep({capability_id:id,result:output,completed_results:results.slice(),
        pending_capabilities:[...requested.slice(index+1),...deferred]});
    }
  }
  const completed=results.filter(item=>isUsefulStatus(item.status)).length;
  const incomplete=results.filter(item=>isIncompleteStatus(item.status));
  const replanRecommended=incomplete.some(item=>item.status==='insufficient_data'||item.status==='error');
  const pending=[...new Set(deferred)];
  const status=pending.length?'partial':completed===0?(incomplete.length?'insufficient_data':'completed'):
    incomplete.length||plan.blocked_capabilities?.length?'partial':'completed';
  const missingInputs=unique(results.flatMap(item=>item.missing_inputs||[]));
  return {
    status,label:plan.label,goal:plan.goal,matched_intents:plan.matched_intents||[],
    discovered_capabilities:plan.discovered_capabilities||plan.steps||[],results,
    completed_steps:completed,total_steps:results.length,blocked_capabilities:plan.blocked_capabilities||[],
    deferred_capabilities:pending,missing_inputs:missingInputs,
    replan_recommended:replanRecommended||pending.length>0,provider_independent:true,model_weights_changed:false,
    execution_policy:{budget_ms:budgetMs,elapsed_ms:Date.now()-started,max_steps:MAX_CAPABILITY_STEPS,
      admin_guard_enforced:true,source_data_mutated:false,model_weights_mutated:false,
      previous_results_used_as_untrusted_context:true}
  };
}

export function formatMessinhoCapabilityResults(run,playerName=null) {
  if (!run||run.status==='denied')
    return 'Diese Anfrage betrifft interne Lern- und Modellprüfungen. Dafür sind Administratorrechte erforderlich.';
  const lines=[];
  if (playerName) lines.push('**'+playerName+'**');
  lines.push('Ich habe deine Anfrage in folgende Arbeitsbereiche aufgeteilt: '+(run.label||'automatische Analyse')+'.');
  lines.push(run.completed_steps+' von '+run.total_steps+' Arbeitsschritten lieferten ein verwertbares Ergebnis.');
  for (const item of run.results||[]) {
    const meta=CATALOGUE_BY_ID.get(item.capability_id);
    const title=item.name||meta?.name||'Ein Arbeitsschritt';
    if (isUsefulStatus(item.status)) {
      const data=item.result||item.data||{};
      const score=data.score??data.overall?.score??data.potential_indicator;
      const detail=score!==undefined&&score!==null?score+'/100':
        item.status==='proposal_ready'?'Lernvorschlag erstellt – Freigabe erforderlich':'Ergebnis liegt vor';
      lines.push('• '+title+': '+detail+'.');
    } else if (item.status==='insufficient_data') {
      lines.push('• '+title+': Dafür fehlen noch '+(describeMissingInputs(item.missing_inputs)||'ausreichende Daten')+'.');
    } else if (item.status==='denied') {
      lines.push('• '+title+': Dieser Schritt ist nur mit entsprechender Berechtigung möglich.');
    } else if (item.status==='unverified'||item.status==='needs_review') {
      lines.push('• '+title+': Ergebnis gefunden, aber noch nicht ausreichend verifiziert.');
    } else {
      lines.push('• '+title+': Dieser Schritt konnte nicht abgeschlossen werden.');
    }
  }
  if (run.blocked_capabilities?.length) lines.push('Zusätzliche Lern- und Modellprüfungen bleiben aus Berechtigungsgründen geschützt.');
  if (run.deferred_capabilities?.length) lines.push('Weitere Prüfschritte wurden wegen der Ausführungsbegrenzung zurückgestellt und nicht als erledigt gewertet.');
  if (run.replan_recommended) lines.push('Ich benötige ergänzende Daten oder muss den Arbeitsplan nach der Datenprüfung anpassen.');
  lines.push('Es wurden keine Modellgewichte automatisch verändert. Fehlende Daten wurden nicht geschätzt.');
  return lines.join('\n');
}
