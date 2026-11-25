# Adaptive Scouting Intelligence (ASI)

## Status
Initiale Staging-Grundlage implementiert am 25.11.2026. Die Anwendung enthält jetzt einen eigenen ASI-Arbeitsbereich. Der aktuelle Analysemodus ist bewusst ein deterministischer, erklärbarer Spieler-Snapshot und kein trainiertes Prognosemodell.

## Verbindliche Produktentscheidungen
- Lernstrategie: Continuous Learning mit kontrollierter Modellfreigabe.
- Externe Daten: Hybrid aus eigenen Scouting-Daten, lizenzierten APIs und rechtmäßig nutzbaren öffentlichen Daten.
- Qualitätsziel: wissenschaftliche Validierung und Vergleich mit professionellen Scouting-/Analyseprodukten.
- Produktion bleibt unverändert.

## Architektur
1. React/Vite: ASIWorkspace mit Spieler-Auswahl, Snapshot, Feedback, Beobachtungserfassung und Admin-Modell-/Quellenübersicht.
2. Supabase/PostgreSQL: zeitlich dokumentierte Beobachtungen, Analysen, Scout-Feedback, Prognose-/Outcome-Datensätze, Modellversionen, Evaluierungen, Trainingsläufe und Quellenregister.
3. PostgreSQL RLS: Scoutzugriff bleibt auf eigene Spieler beschränkt; Adminzugriff wird über private.is_admin() geregelt.
4. pgvector: Extension im Staging-Projekt aktiviert; Vektor-/Embedding-Funktionalität bleibt bis zur Auswahl eines Embedding-Modells und einer konkreten semantischen Suchfunktion ungenutzt.
5. Prognose- und Trainingsdienste: noch nicht live. Sie benötigen ausreichende historische Daten, einen getrennten Python-Worker, festgelegte Metriken und einen kontrollierten Modellfreigabeprozess.

## Implementierte Funktionen
- Neuer Sidebar-Bereich „Adaptive Scouting Intelligence“ für freigeschaltete Benutzer.
- Spieler-Auswahl aus dem vorhandenen, rollenbeschränkten Spielerbestand.
- Regelbasierte Bestandsanalyse der vorhandenen Technik-, Taktik-, Athletik- und Mentalitätswerte.
- Transparente Anzeige der Datenabdeckung, vorhandenen Stärken und Entwicklungsfelder.
- Speicherung versionierter Analyse-Snapshots ohne private Kontaktfelder.
- Scout-Feedback zu Analysequalität.
- Erfassung zeitgestempelter Beobachtungen mit Snapshot der aktuellen Bewertungen.
- Admin-Übersicht für Modellversionen und externe Datenquellen.
- Datenbankgrundlage für spätere Prognosen und deren tatsächliche Outcomes.
- RLS für alle ASI-Tabellen und explizite API-Grants.

## Sicherheitsregeln
- Eltern-/Telefonnummern und sonstige private Kontaktdaten werden nicht in ASI-Abfragen geladen.
- Externe Quellen bleiben bis zur Lizenz- und Datenschutzfreigabe deaktiviert.
- Prognose-Datensätze verlangen einen Input-Cutoff-Zeitpunkt, um Datenleckage bei Backtests zu verhindern.
- Kandidatenmodelle werden nicht automatisch aktiv. Freigabe ist ein separater Admin-Prozess.
- KI-Ausgaben sind Entscheidungshilfen; Scout/Club bleibt für die sportliche Entscheidung verantwortlich.

## Bekannte Grenzen
- Der Datenbestand enthält zum Prüfzeitpunkt 2 Spielerprofile und 3 Benutzerprofile. Das reicht nicht für belastbare ML-Prognosen.
- Das vorhandene UI nutzt Ratingwerte 1–5, während ein Datenbankkommentar den historischen Bewertungsbogen mit 1–4 beschreibt. Vor Modelltraining muss die Skala normalisiert bzw. pro Datensatz eindeutig versioniert werden.
- Der erste ASI-Snapshot ist deskriptiv. Er sagt keine zukünftige Leistung, keinen Marktwert und kein Karrierepotenzial voraus.
- Es ist noch kein externer Anbieter/API-Schlüssel konfiguriert.
- Es gibt noch keinen Python-Trainingsdienst, keinen automatisierten Scheduler und keine produktive LLM-Integration.

## Nächste technische Schritte
1. ASI-RLS mit echten Scout- und Admin-Sitzungen testen (Lesen, Einfügen, fremde Spieler).
2. Staging-Build und Render-Deployment prüfen.
3. Rating-Skalen-Versionierung und Beobachtungs-Workflow vervollständigen.
4. Externe Quelle auswählen, Lizenz prüfen und Datenimport-Schema ergänzen.
5. Python-Worker mit zeitlichem Train/Test-Split, Walk-forward-Backtesting und Baselines aufbauen.
6. Prognose-Outcomes erfassen und Kalibrierung/Fehlerkennzahlen überwachen.
7. Modellpromotion nur nach bestandenem Benchmark und mit Rollback ermöglichen.

## Staging
- Supabase project ref: vxtybjaabtfhxfwctnyj
- Render staging service: srv-dc25n13rjlhs73e2ae1g
- Staging URL: https://myscoutingdatabase.onrender.com
- Repository: Dridi06/myScoutingDatabase
- Branch: main (Render staging service)
- Production: NICHT geändert.

## Selbstreflexion und kontrollierte Weiterentwicklung (Staging-Ausbaustufe)
- Neue deterministische Komponente: `src/asi/selfReflection.js`, Version `asi_self_reflection@0.1.0`, direkt in `ASIWorkspace` integriert.
- Prüft Ratingwerte gegen die aktuell implementierte Skala 1–5, misst Abdeckung gegen alle positionsabhängig erwarteten Kriterien, erkennt fehlende/geringe Datenabdeckung, Skalenabweichungen, ungültige Rollen-Fit-Werte und Widersprüche zwischen Stärken-/Schwächenlabels.
- Jeder neue Analyse-Snapshot speichert den Reflexionsbericht unter `analysis_json.self_reflection`; das Analyseergebnis zeigt Status, Datenabdeckung, Befunde und Einschränkung der Prüfung.
- Vergleicht Modellkandidaten anhand gleicher Outcome-Metriken. Eine Kandidatenversion wird nur bei ausreichender Zahl verifizierter Outcomes und definierter Mindestverbesserung als für eine menschliche Freigabe geeignet markiert.
- Modellpromotion bleibt ausdrücklich manuell; die Engine kann keine produktiven Modelle oder Bewertungen selbstständig überschreiben.
- Vergleicht zeitlich getrennte Beobachtungen nur auf gemeinsamen Kriterien und kennzeichnet unzureichende Vergleichsgrundlagen.
- Tests: `tests/selfReflection.test.js` mit sieben Prüfungen; GitHub Actions `ASI quality checks` hat Unit-Tests und Frontend-Build erfolgreich ausgeführt. Aufruf lokal über `npm test`.
- CI: `.github/workflows/asi-quality.yml` führt Tests und Frontend-Build bei Push/Pull Request auf `main` aus.
- Diese Stufe ist eine deterministische Qualitäts- und Reflexionsgrundlage, noch keine autonome LLM-Forschungsinstanz, kein trainierendes ML-Modell und kein Live-Lernworker.
- Noch offen: Admin-Review-Queue, Benchmark-Datensätze, Python-Worker für zeitlich getrenntes Training/Backtesting, kontrollierte Recherche-Adapter für externe KI-/Fachquellen sowie produktive Modellfreigabe-/Rollback-Automation.
