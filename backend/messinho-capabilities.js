/**
 * MESSINHO capability registry.
 * This registry is the auditable contract for the 100-function expansion.
 * Status is intentionally conservative: catalogued does not mean executable.
 */
const GROUPS = [
  {
    id: 'analysis', name: 'Analyse', description: 'Spielerleistungen, Profile und Entwicklung verstehen',
    functions: [
      ['holistic_player_analysis','Ganzheitliche Spieleranalyse','Führt belegte technische, taktische, physische und mentale Leistungsdaten zusammen.','player_metrics'],
      ['position_analysis','Positionsanalyse','Ordnet Daten einer standardisierten Hauptposition zu.','positions'],
      ['multi_position_analysis','Mehrpositionsanalyse','Prüft belegte Leistungsmerkmale für alternative Positionen.','positions,player_metrics'],
      ['play_style_detection','Spielstil-Erkennung','Erkennt datenbasierte Spielstil-Muster ohne Persönlichkeitsannahmen.','player_metrics'],
      ['strength_weakness_analysis','Stärken-Schwächen-Analyse','Identifiziert relative Stärken und Entwicklungsfelder.','player_metrics'],
      ['potential_analysis','Potenzialanalyse','Leitet vorsichtige Potenzialindikatoren aus Verlauf und Datenabdeckung ab.','history,player_metrics'],
      ['performance_development','Leistungsentwicklung','Vergleicht dokumentierte Leistungswerte über mehrere Zeitpunkte.','dated_metrics'],
      ['form_curve_analysis','Formkurvenanalyse','Berechnet kurzfristige Formverläufe getrennt von Langzeitentwicklung.','dated_metrics'],
      ['game_intelligence_analysis','Spielintelligenzanalyse','Untersucht belegte Indikatoren für Raum- und Entscheidungsverhalten.','tactical_metrics'],
      ['tactical_behaviour_analysis','Taktische Verhaltensanalyse','Ordnet beobachtete Aktionen taktischen Anforderungen zu.','tactical_events'],
      ['game_phase_analysis','Spielphasenanalyse','Vergleicht Daten aus Offensive, Defensive und Umschaltphasen.','phase_metrics'],
      ['duel_analysis','Zweikampfanalyse','Analysiert dokumentierte offensive und defensive Duellwerte.','duel_metrics'],
      ['running_performance_analysis','Laufleistungsanalyse','Analysiert Laufdaten und Intensitätswerte, sofern vorhanden.','tracking_metrics'],
      ['speed_analysis','Geschwindigkeitsanalyse','Bewertet belegte Antritts-, Sprint- und Tempowerte.','speed_metrics'],
      ['technical_detail_analysis','Technische Detailanalyse','Analysiert Passspiel, Ballkontrolle, Dribbling und Abschluss.','technical_metrics'],
      ['creativity_analysis','Kreativitätsanalyse','Untersucht Chancen-Kreation und kreative Aktionen anhand von Ereignisdaten.','creative_events'],
      ['decision_quality_analysis','Entscheidungsanalyse','Bewertet dokumentierte Entscheidungen in Spielsituationen.','decision_events'],
      ['consistency_analysis','Konstanzanalyse','Misst Schwankungen und Stabilität über mehrere Beobachtungen.','dated_metrics'],
      ['peer_comparison_analysis','Vergleichsanalyse','Vergleicht Spieler mit positions- und altersgerechten Vergleichsgruppen.','cohort_metrics'],
      ['age_relative_analysis','Altersbezogene Leistungsanalyse','Ordnet Leistungsdaten nach Geburtsjahr und Wettbewerbskontext ein.','birth_year,cohort_metrics'],
      ['availability_history_analysis','Ausfallhistorie','Beschreibt ausschließlich rechtmäßig vorliegende Ausfall- und Einsatzdaten.','availability_records'],
      ['minutes_analysis','Spielminutenanalyse','Berechnet Einsatzquote, Startelfanteil und Minutenentwicklung.','appearance_records'],
      ['video_event_analysis','Videoanalyse','Analysiert bereitgestellte, rechtmäßig nutzbare und vorverarbeitete Videoereignisse.','licensed_video_events'],
      ['anomaly_detection','Auffälligkeitserkennung','Erkennt statistisch auffällige Änderungen und markiert sie zur Prüfung.','dated_metrics'],
      ['player_profile_synthesis','Spielerprofil-Prognose','Erstellt ein quellengebundenes, strukturiertes Gesamtprofil.','player_metrics,evidence']
    ]
  },
  {
    id: 'evaluation', name: 'Bewertung', description: 'Spieler objektiv einordnen und Entscheidungen begründen',
    functions: [
      ['overall_score','MESSINHO-Gesamtscore','Berechnet einen gewichteten Score mit Datenabdeckung.','player_metrics,position'],
      ['position_score','Positionsspezifischer Score','Nutzt positionsspezifische, versionierte Gewichte.','player_metrics,position'],
      ['potential_score','Potenzial-Score','Bewertet Entwicklungsspielraum getrennt von aktueller Leistung.','history,player_metrics'],
      ['talent_score','Talent-Score','Erstellt eine alters- und positionsbezogene Talent-Einordnung.','birth_year,cohort_metrics'],
      ['technical_score','Technik-Score','Bewertet vorhandene technische Kennzahlen.','technical_metrics'],
      ['tactical_score','Taktik-Score','Bewertet vorhandene taktische Kennzahlen.','tactical_metrics'],
      ['athletic_score','Athletik-Score','Bewertet vorhandene athletische Kennzahlen.','athletic_metrics'],
      ['mental_score','Mental-Score','Berücksichtigt nur explizit dokumentierte und zulässige Beobachtungen.','verified_observations'],
      ['goalkeeper_score','Torwart-Score','Nutzt ein spezialisiertes Torwart-Bewertungsprofil.','goalkeeping_metrics'],
      ['data_quality_score','Datenqualität-Score','Misst Vollständigkeit, Aktualität und Konsistenz der Daten.','data_records'],
      ['source_trust_score','Quellenvertrauens-Score','Bewertet HTTPS, Aktualität, Domainvielfalt und Belegqualität.','sources'],
      ['development_score','Entwicklungs-Score','Misst belegte Entwicklung über Zeit.','dated_metrics'],
      ['consistency_score','Konstanz-Score','Bewertet Streuung und Stabilität der Leistungswerte.','dated_metrics'],
      ['league_fit_score','Liga-Anpassungs-Score','Vergleicht belegte Leistung mit einem definierten Zielniveau.','league_benchmarks'],
      ['system_fit_score','System-Fit-Score','Vergleicht Spielermerkmale mit einem taktischen Teamprofil.','team_profile,player_metrics'],
      ['coach_fit_score','Trainer-Fit-Score','Vergleicht dokumentierte Traineranforderungen mit Spielerprofilen.','coach_requirements'],
      ['club_fit_score','Vereins-Fit-Score','Vergleicht Kaderbedarf, Position und sportliche Strategie.','club_needs'],
      ['market_value_assessment','Marktwert-Einschätzung','Gibt nur bei ausreichenden Marktdaten eine belegte Spanne aus.','market_comparables'],
      ['value_for_money','Preis-Leistungs-Bewertung','Setzt belegte Kosten in Relation zum sportlichen Nutzen.','transfer_cost,player_metrics'],
      ['risk_score','Risiko-Score','Kennzeichnet Daten-, Leistungs- und Vertragsrisiken getrennt.','risk_records'],
      ['development_projection','Entwicklungspotenzial-Prognose','Erstellt Szenarien mit Unsicherheit statt Scheingenauigkeit.','longitudinal_data'],
      ['competition_comparison','Konkurrenzvergleich','Vergleicht direkte Positionskonkurrenten.','cohort_metrics'],
      ['transfer_priority','Transferpriorisierung','Sortiert Kandidaten anhand konfigurierter Vereinsprioritäten.','club_needs,candidate_scores'],
      ['scout_rating_agreement','Scout-Bewertungsvergleich','Erkennt Bewertungsabweichungen zwischen Scouts.','scout_assessments'],
      ['explainable_rating','Bewertungsbegründung','Legt Datenbasis, Gewichte, Version und Einschränkungen offen.','score_trace']
    ]
  },
  {
    id: 'learning', name: 'Lernen', description: 'Aus bestätigten Ergebnissen kontrolliert besser werden',
    functions: [
      ['supervised_learning','Supervised Learning','Trainiert ausschließlich auf administrativ verifizierten Ergebnissen.','verified_outcomes'],
      ['position_specific_learning','Positionsspezifisches Lernen','Kalibriert Gewichtungen getrennt nach Positionsgruppe.','verified_outcomes,position'],
      ['scout_feedback_learning','Scout-Feedback-Lernen','Nutzt geprüftes Feedback und trennt Meinung von Ergebnisdaten.','verified_scout_feedback'],
      ['prediction_audit','Prognosekontrolle','Vergleicht gespeicherte Prognosen mit späteren Ergebnissen.','prediction_snapshots,outcomes'],
      ['error_pattern_detection','Fehlererkennung','Gruppiert wiederkehrende Prognosefehler.','prediction_audit'],
      ['weight_optimization','Gewichtungsoptimierung','Optimiert Gewichte mit Holdout-Test und begrenzter Veränderung.','verified_outcomes'],
      ['age_group_learning','Altersgruppen-Lernen','Prüft Kalibrierung nach Altersgruppen.','verified_outcomes,birth_year'],
      ['league_learning','Liga-Lernen','Kalibriert Modelle anhand vergleichbarer Ligadaten.','league_outcomes'],
      ['country_learning','Länder-Lernen','Prüft Kontextunterschiede mit ausreichender Datenbasis.','country_outcomes'],
      ['talent_pathway_learning','Talententwicklungs-Lernen','Analysiert bestätigte Entwicklungsverläufe.','longitudinal_outcomes'],
      ['false_positive_learning','Flop-Erkennung','Analysiert frühere positive Fehlprognosen ohne Etikettierung von Personen.','prediction_audit'],
      ['breakthrough_learning','Top-Talent-Rückanalyse','Untersucht rückblickend belegte Entwicklungsmuster.','longitudinal_outcomes'],
      ['scout_accuracy_analysis','Scout-Genauigkeitsanalyse','Misst Prognosegüte anhand vergleichbarer verifizierter Outcomes.','verified_scout_outcomes'],
      ['scout_calibration','Scout-Kalibrierung','Erkennt systematische Bewertungsunterschiede.','verified_scout_outcomes'],
      ['model_benchmarking','Modellvergleich','Vergleicht Kandidatenmodelle mit einer aktiven Baseline.','holdout_dataset'],
      ['regression_guard','Rückfallkontrolle','Blockiert Modellversionen mit schlechterer Validierungsleistung.','model_evaluations'],
      ['dataset_quality_improvement','Datensatzverbesserung','Erkennt Dubletten, Lücken und widersprüchliche Trainingsdaten.','training_dataset'],
      ['data_error_learning','Datenfehler-Lernen','Klassifiziert wiederkehrende Datenqualitätsfehler.','data_quality_events'],
      ['position_change_learning','Positionswechsel-Lernen','Untersucht bestätigte Leistungsänderungen nach Positionswechseln.','position_history,outcomes'],
      ['availability_outcome_learning','Ausfallfolgen-Lernen','Berücksichtigt nur zulässige, bestätigte Verfügbarkeitsdaten.','availability_records,outcomes'],
      ['probability_calibration','Prognosekalibrierung','Kalibriert Konfidenzen anhand späterer Trefferquoten.','prediction_probabilities,outcomes'],
      ['seasonal_learning','Saisonvergleich-Lernen','Vergleicht saisonale Leistungsentwicklung.','seasonal_metrics'],
      ['verified_long_term_memory','Verifiziertes Langzeitgedächtnis','Speichert versionierte Erkenntnisse mit Herkunft und Ablaufregeln.','verified_insights'],
      ['model_versioning','Modellversionierung','Versioniert Modelle, Datensatz-Fingerprints und Evaluierungen.','model_artifacts'],
      ['controlled_self_optimization','Kontrollierte Selbstoptimierung','Erzeugt Vorschläge; Aktivierung nur nach Prüfung und Freigabe.','model_evaluations,admin_approval']
    ]
  },
  {
    id: 'research', name: 'Recherche', description: 'Spieler entdecken und externe Informationen belegen',
    functions: [
      ['automated_talent_search','Automatische Talentsuche','Sucht Spieler anhand strukturierter Scouting-Kriterien.','search_provider,filters'],
      ['international_research','Internationale Recherche','Erweitert die Recherche über Länder und Regionen.','search_provider,source_registry'],
      ['cross_league_research','Ligaübergreifende Recherche','Vergleicht Spieler aus unterschiedlichen Spielklassen.','league_sources'],
      ['youth_talent_discovery','Nachwuchstalentsuche','Sucht Nachwuchsspieler mit belegtem Geburtsjahr.','youth_sources'],
      ['underdog_detection','Underdog-Erkennung','Findet wenig beachtete Spieler mit belegten Leistungsindikatoren.','discovery_sources,performance_data'],
      ['hidden_gem_detection','Hidden-Gems-Erkennung','Erkennt mögliche Unterbewertung anhand vergleichbarer Marktdaten.','market_data,performance_data'],
      ['club_research','Vereinsrecherche','Prüft Vereinszugehörigkeit anhand aktueller Quellen.','club_sources'],
      ['squad_research','Kaderrecherche','Ermittelt belegte Kader- und Positionsbesetzungen.','squad_sources'],
      ['contract_research','Vertragsrecherche','Sammelt nur öffentlich belegte Vertragsinformationen.','contract_sources'],
      ['contract_expiry_monitor','Vertragsablauf-Erkennung','Erkennt belegte Vertragsabläufe und kennzeichnet Unsicherheit.','contract_sources'],
      ['rumour_verification','Transfergerüchte-Prüfung','Trennt Gerüchte, Berichte und bestätigte Vereinsmeldungen.','transfer_sources'],
      ['market_monitoring','Marktbeobachtung','Beobachtet definierte Markt- und Kaderveränderungen.','scheduled_searches'],
      ['source_cross_check','Quellenvergleich','Gleicht Angaben über unabhängige Quellen ab.','sources'],
      ['identity_verification','Identitätsprüfung','Verhindert Namensverwechslungen mit Identitätsbelegen.','identity_evidence'],
      ['birth_year_verification','Geburtsjahrprüfung','Verlangt belegte Geburtsjahre und markiert Konflikte.','identity_evidence'],
      ['position_verification','Positionsprüfung','Prüft Positionen anhand belastbarer Quellen.','position_evidence'],
      ['statistics_research','Statistik-Recherche','Sammelt konkrete, quellengebundene Leistungsstatistiken.','statistics_sources'],
      ['video_source_research','Videoquellen-Recherche','Findet rechtmäßig nutzbare Videoquellen und speichert Lizenzstatus.','licensed_video_sources'],
      ['match_report_research','Spielbericht-Recherche','Sucht und extrahiert belegte Spielberichte.','match_report_sources'],
      ['competition_monitoring','Wettbewerbsbeobachtung','Beobachtet definierte Wettbewerbe und Turniere.','competition_sources'],
      ['club_need_research','Vereinsbedarf-Recherche','Leitet Positionsbedarf aus belegten Kaderinformationen ab.','squad_sources,club_profile'],
      ['comparable_player_research','Konkurrenzspieler-Recherche','Findet vergleichbare Spieler anhand transparenter Merkmale.','player_profiles'],
      ['player_data_refresh','Automatische Aktualisierung','Prüft gespeicherte Daten auf Aktualität und Änderungen.','source_registry,refresh_schedule'],
      ['new_talent_monitoring','Neue-Talente-Monitoring','Führt freigegebene, zeitlich begrenzte Suchläufe aus.','source_registry,scheduler'],
      ['research_report_generation','Recherchebericht-Generator','Erstellt einen Bericht mit Fakten, Quellen und offenen Punkten.','verified_research_bundle']
    ]
  }
];

const EXISTING_IMPLEMENTATIONS = new Set([
  'holistic_player_analysis','position_analysis','strength_weakness_analysis','performance_development',
  'overall_score','position_score','data_quality_score','source_trust_score','system_fit_score',
  'scout_rating_agreement','explainable_rating','supervised_learning','position_specific_learning',
  'prediction_audit','weight_optimization','model_benchmarking','regression_guard','model_versioning',
  'controlled_self_optimization','automated_talent_search','international_research','source_cross_check',
  'identity_verification','birth_year_verification','position_verification','statistics_research',
  'research_report_generation'
]);
const PARTIAL_IMPLEMENTATIONS = new Set([
  'multi_position_analysis','play_style_detection','potential_analysis','form_curve_analysis',
  'tactical_behaviour_analysis','game_phase_analysis','duel_analysis','speed_analysis',
  'technical_detail_analysis','consistency_analysis','peer_comparison_analysis','age_relative_analysis',
  'minutes_analysis','anomaly_detection','player_profile_synthesis','potential_score','talent_score',
  'technical_score','tactical_score','athletic_score','goalkeeper_score','development_score',
  'consistency_score','league_fit_score','club_fit_score','risk_score','competition_comparison',
  'scout_feedback_learning','error_pattern_detection','age_group_learning','league_learning',
  'talent_pathway_learning','false_positive_learning','breakthrough_learning','scout_accuracy_analysis',
  'scout_calibration','dataset_quality_improvement','data_error_learning','position_change_learning',
  'probability_calibration','seasonal_learning','verified_long_term_memory','cross_league_research',
  'youth_talent_discovery','underdog_detection','hidden_gem_detection','club_research','squad_research',
  'contract_research','contract_expiry_monitor','rumour_verification','market_monitoring',
  'identity_verification','statistics_research','match_report_research','competition_monitoring',
  'club_need_research','comparable_player_research','player_data_refresh'
]);

function statusFor(id) {
  if (EXISTING_IMPLEMENTATIONS.has(id)) return 'implemented_existing_core';
  if (PARTIAL_IMPLEMENTATIONS.has(id)) return 'partial_or_requires_validation';
  return 'requires_new_integration';
}

export function getMessinhoCapabilityCatalog() {
  return GROUPS.map(group => ({
    id: group.id,
    name: group.name,
    description: group.description,
    total: group.functions.length,
    functions: group.functions.map(([id,name,description,inputs]) => ({
      id, name, description,
      required_inputs: Array.isArray(inputs)
        ? inputs.map(value => String(value).trim()).filter(Boolean)
        : typeof inputs === 'string'
          ? inputs.split(',').map(value => value.trim()).filter(Boolean)
          : [],
      status: statusFor(id)
    }))
  }));
}

export function getMessinhoCapabilitySummary() {
  const groups = getMessinhoCapabilityCatalog();
  const all = groups.flatMap(group => group.functions);
  return {
    total: all.length,
    by_status: {
      implemented_existing_core: all.filter(item => item.status === 'implemented_existing_core').length,
      partial_or_requires_validation: all.filter(item => item.status === 'partial_or_requires_validation').length,
      requires_new_integration: all.filter(item => item.status === 'requires_new_integration').length
    },
    by_group: groups.map(({id,name,total}) => ({id,name,total})),
    registry_version: '1.0.0'
  };
}
