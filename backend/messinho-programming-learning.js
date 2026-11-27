/**
 * MESSINHO programming curriculum — first-party, versioned learning foundation.
 * The curriculum is durable source-controlled knowledge, not a claim of model-weight training.
 */
export const MESSINHO_PROGRAMMING_CURRICULUM_VERSION='1.1.0';
export const MESSINHO_PROGRAMMING_CURRICULUM=Object.freeze([
 {level:1,id:'foundations',title:'Programmiergrundlagen',topics:[
  'Variablen, Konstanten, Datentypen, Operatoren und Ausdrücke',
  'Bedingungen, Schleifen, Funktionen, Parameter und Rückgabewerte',
  'Arrays, Objekte, Maps, Sets, Strings und JSON',
  'Fehlerarten, Exceptions, Debugging und reproduzierbare Minimalbeispiele',
  'Lesbarer Code, kleine Funktionen, sprechende Namen und Kommentare'
 ],mastery:'Kann einen Ablauf erklären, einen kleinen Fehler lokalisieren und eine einfache Funktion mit Grenzfalltests schreiben.'},
 {level:2,id:'engineering',title:'Anwendungsentwicklung',topics:[
  'JavaScript/Node.js, Module, async/await, Promises und Event Loop',
  'HTTP, REST-APIs, Request-Validierung, Statuscodes und Timeouts',
  'SQL, relationale Datenmodelle, Joins, Constraints und Transaktionen',
  'React-Komponenten, Zustand, Props, Formulare und barrierearme Oberflächen',
  'Git, Branches, Commits, Pull Requests, Reviews und nachvollziehbare Änderungen'
 ],mastery:'Kann Datenflüsse zwischen UI, API und Datenbank nachvollziehen und eine kleine, isolierte Änderung planen.'},
 {level:3,id:'quality-security',title:'Qualität und Sicherheit',topics:[
  'Unit-, Integrations-, End-to-End-, Regression- und negative Tests',
  'Test-Fixtures, Mocks, deterministische Tests und reproduzierbare Fehler',
  'Authentifizierung, Autorisierung, Least Privilege und Rollenprüfung',
  'Mandantentrennung, RLS, sichere Datenbankfunktionen und SQL-Injection-Schutz',
  'Input-Sanitizing, Output-Encoding, Secrets, SSRF, XSS und Dependency-Risiken',
  'CI/CD, Build-Prüfung, Logs, Monitoring, Rollback und Incident-Analyse'
 ],mastery:'Erkennt Sicherheitsgrenzen, formuliert negative Tests und kann erklären, warum ein Patch keine Berechtigungs- oder Datenisolation verändert.'},
 {level:4,id:'architecture-ai',title:'Architektur und KI-Systeme',topics:[
  'Schichtenarchitektur, Verantwortlichkeiten, Schnittstellen und Abhängigkeitsrichtung',
  'Datenfluss, Zustandsmaschinen, Queues, Idempotenz, Retries und Race Conditions',
  'Algorithmen, Datenstrukturen, Laufzeit- und Speicherkomplexität',
  'LLM-Prompting, strukturierte Ausgaben, Tool-Grenzen und Prompt-Injection-Abwehr',
  'RAG, Embeddings, Quellenherkunft, Wissensversionen und Aktualitätsprüfung',
  'Evaluation, Baselines, Kalibrierung, Drift, Regression und kontrollierte Selbstoptimierung'
 ],mastery:'Kann eine Änderung anhand messbarer Kriterien bewerten, Risiken begrenzen und einen überprüfbaren Rollback-Plan liefern.'}
 ,
 {level:5,id:'professional-engineering',title:'Professionelle Softwareentwicklung und Problemlösung',topics:[
  'Systematische Fehleranalyse: Symptom, Reproduktion, Eingrenzung, Ursache und Korrektur getrennt dokumentieren',
  'Code-Review: Korrektheit, Lesbarkeit, Wartbarkeit, Komplexität, Seiteneffekte und API-Kompatibilität bewerten',
  'Threat Modeling: Schutzgüter, Angreifer, Eintrittspunkte, Vertrauensgrenzen und Missbrauchsszenarien identifizieren',
  'Performance Engineering: Profiling, Datenbankabfragen, Caching, Speicherverbrauch und messbare Engpässe',
  'Nebenläufigkeit: Race Conditions, Locks, atomare Operationen, Transaktionen und konsistente Zustandsübergänge',
  'API- und Datenbankmigrationen: Rückwärtskompatibilität, Expand-and-Contract und sichere Rollback-Strategien',
  'Frontend-Qualität: Accessibility, Tastaturbedienung, responsive Layouts, Ladezustände und Fehlerbehandlung',
  'Teststrategie: Risiko-basierte Testauswahl, Property-based Tests, Fuzzing und Grenzwert-/Negativtests',
  'Betrieb: strukturierte Logs, Metriken, Traces, Alarmierung, Fehlerbudgets und Incident-Postmortems',
  'Technische Entscheidungen: Alternativen, Kosten, Risiken, Annahmen und nachvollziehbare Architekturentscheidungen'
 ],mastery:'Kann eine technische Änderung mit nachvollziehbaren Belegen, Risikoanalyse, Alternativen, Testmatrix und Rollback-Plan professionell begründen.'}
]);
export function buildMessinhoProgrammingLearningContext({maxTopics=24,includeExamples=true}={}) {
 const lessons=MESSINHO_PROGRAMMING_CURRICULUM.map(level=>({
  level:level.level,title:level.title,topics:level.topics.slice(0,Math.max(1,Math.min(12,maxTopics))),
  mastery:level.mastery
 }));
 return {
  curriculum_version:MESSINHO_PROGRAMMING_CURRICULUM_VERSION,
  learning_model:'progressive_prerequisites_and_verified_feedback',
  levels:lessons,
  engineering_rules:[
   'Vor jeder Änderung zuerst den tatsächlichen Ist-Code, Aufrufer, Tests und Datenfluss lesen.',
   'Ein Fehler muss durch konkreten Codepfad, reproduzierbares Beispiel oder Test belegt sein.',
   'Vor dem Patch Nebenwirkungen, Rollen, Mandantentrennung, RLS, Datenschutz und Rechte prüfen.',
   'Änderung klein halten; keine geschützten Dateien, Secrets, Migrationen oder Deploy-Konfigurationen eigenmächtig verändern.',
   'Test zuerst als überprüfbare Erwartung formulieren; bestandene Tests nur nach tatsächlicher Ausführung melden.',
   'Regressionen und negative Sicherheitsfälle testen; Baseline und Rollback dokumentieren.',
   'Aus Admin-Feedback und späteren Testergebnissen Prinzipien ableiten, aber falsche oder unbestätigte Vorschläge nicht als Wissen speichern.',
   'Kein selbstständiges Anwenden, Mergen oder Deployen eines Patches; nur Vorschlag und Ticket bis zur ausdrücklichen Freigabe.'
  ],
  engineering_method:[
   '1. Auftrag und Akzeptanzkriterien präzisieren; fehlende Angaben als Fragen kennzeichnen.',
   '2. Relevante Dateien, Aufrufer, Abhängigkeiten, Datenflüsse und vorhandene Tests lesen.',
   '3. Fehlerhypothese mit konkretem Codebeleg und reproduzierbarem Szenario formulieren.',
   '4. Mindestens eine Alternative vergleichen; die kleinste sichere Änderung bevorzugen.',
   '5. Rollen, Mandantengrenzen, RLS, Datenschutz, Eingaben, Secrets und externe Effekte prüfen.',
   '6. Positive, negative, Grenzwert-, Berechtigungs- und Regressionstests definieren.',
   '7. Tatsächliche Testergebnisse, Build, offene Risiken und nicht geprüfte Annahmen getrennt berichten.',
   '8. Patch-Diff, betroffene Dateien, Rückrollschritte und Admin-Freigabepunkt dokumentieren.'
  ],
  proposal_quality_gate:{
   required:['problem_evidence','root_cause','minimal_patch','test_matrix','security_review','alternative_considered','rollback_plan','source_revision'],
   reject_if:['source_context_mismatch','unreproducible_claim','unapproved_protected_file','missing_test_plan','secret_or_personal_data_exposure','automatic_production_change'],
   scoring_dimensions:['correctness','security','maintainability','performance','testability','backward_compatibility']
  },
  knowledge_intake:{
   rule:'Vom Administrator bereitgestellte Programmierunterlagen sind zunächst Quellenmaterial, nicht automatisch freigegebenes Wissen.',
   required_metadata:['title','source_or_author','version_or_date','license_or_usage_rights','topic','content'],
   workflow:['source_check','relevance_and_quality_review','extract_concepts','cross_check_against_existing_knowledge','create_versioned_learning_proposal','admin_approval','persistent_integration','regression_evaluation'],
   instruction:'Unklare Herkunft, widersprüchliche Inhalte, veraltete APIs oder unsichere Beispiele markieren und nicht ungeprüft übernehmen.'
  },
  examples:includeExamples?[
   {principle:'Input validieren',example:'Grenzwerte und Typen am API-Eingang prüfen; niemals blind dem Client vertrauen.'},
   {principle:'Least privilege',example:'Scout darf nur freigegebene eigene Organisationsdaten sehen; Admin-Funktionen serverseitig prüfen.'},
   {principle:'Idempotenz',example:'Wiederholte Ticketübermittlung erzeugt über einen stabilen Fingerprint kein zweites Ticket.'},
   {principle:'Regression',example:'Neben dem neuen Grenzfall müssen bisherige gültige Eingaben unverändert funktionieren.'}
  ]:[]
 };
}
export function assessMessinhoProgrammingLearning({concept,explanation,testEvidence,reviewStatus='unreviewed'}={}) {
 const valid=['approved','rejected','needs_revision'].includes(reviewStatus);
 const clean=value=>String(value??'').replace(/[\x00-\x1f\x7f]/g,' ').trim();
 const name=clean(concept),why=clean(explanation),evidence=clean(testEvidence);
 if(name.length<2||why.length<20||evidence.length<12||!valid)
  return {eligible:false,reason:'verified_learning_evidence_required'};
 return {eligible:true,record:{concept:name.slice(0,160),principle:why.slice(0,1200),
  evidence:evidence.slice(0,1000),review_status:reviewStatus,
  reusable:reviewStatus==='approved',curriculum_version:MESSINHO_PROGRAMMING_CURRICULUM_VERSION}};
}
