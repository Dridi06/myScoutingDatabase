# Messinho Agent – Implementierungsstand

## Projektzuordnung
Messinho ist ein integriertes Modul innerhalb von myScoutingDatabase. Es ist kein separates Projekt und erhält keine eigene Plattform oder Datenbank.

## Aktueller Implementierungsstand auf feature/messinho-agent-workspace
- Navigationspunkt und integrierte Agentenoberfläche hinzugefügt.
- Text-Chat mit authentifiziertem Backend-Endpunkt `POST /api/agent/chat`.
- Browserbasierte Spracheingabe über Web Speech API, sofern der Browser sie unterstützt.
- Optionale Sprachausgabe über Speech Synthesis.
- Deterministische Dialogsteuerung für Bestandsabfragen, interne Suche und strukturierte Scouting-Aufträge.
- Scouting-Aufträge werden nach Jahrgang, Position, Standort und Zielspielklasse geklärt und anschließend an die vorhandene ASI-Recherche delegiert.
- Die bestehende ASI-Pipeline führt die externe Recherche und Kandidatenanlage aus; MESSINHO erzeugt keine parallele Recherchepipeline.
- Die Chat-Schnittstelle prüft Supabase-Access-Token und Profilrolle; die ASI-Recherche prüft Berechtigungen zusätzlich selbst.
- MESSINHO kann strukturierte Scouting-Anfragen mit Rückfragen zu Jahrgang, Position, Standort und Zielspielklasse entgegennehmen.
- Bei vollständigen Kriterien delegiert MESSINHO die Recherche an den bestehenden Endpunkt `/api/asi/player-search` im Modus `discover`; es wird keine zweite Recherche-Engine angelegt.
- Die vorhandene ASI-Pipeline nutzt weiterhin Tavily für Quellensuche und OpenAI für die quellengebundene Kandidatenanalyse; neue Treffer werden über die vorhandene Kandidatenlogik gespeichert.
- Der Dialog übergibt einen begrenzten Gesprächskontext, damit Rückfragen die ursprüngliche Suche ergänzen.
- Die ASI-Pipeline bleibt für die Recherche und Kandidatenpersistenz verantwortlich; MESSINHO übernimmt Dialog, Orchestrierung und Ergebnisdarstellung.
- Die erste Anbindung ist ein Entwicklungsstand und noch nicht als produktiv getestet oder live freigegeben.

## Verbindliche Zielarchitektur
1. Quellen- und Lizenzregister: Nur Quellen mit dokumentierter Rechtsgrundlage und erlaubter Nutzungsart freischalten.
2. Rechercheplanung: ein täglicher Hintergrundlauf um 20:00 Uhr in Zeitzone Europe/Berlin; keine permanenten Suchanfragen.
3. Datenpflege: bestehende Spieler- und Kandidateninformationen anhand zulässiger Quellen aktualisieren, Änderungen historisieren und Quellenbelege erhalten.
4. Scouting-Analyse: neue bestätigte Daten in nachvollziehbare, versionierte Bewertungen einbeziehen.
5. Selbstverbesserung: Bewertungsmodelle anhand späterer Ergebnisse evaluieren; neue Versionen nur nach Tests und Freigabe übernehmen.
6. Sprachdialog: Spracheingabe und Sprachausgabe mit browserübergreifendem Fallback; spätere serverseitige Transkription nur mit gesonderter Datenschutz- und Anbieterprüfung.

## Sicherheits- und Betriebsregeln
- Alle Änderungen ausschließlich in Staging entwickeln und testen.
- PFMS und dessen Repository/Deployments bleiben unberührt.
- Keine Änderungen am bestehenden myScoutingDatabase Render-Dienst auf `main`, solange keine dedizierte Staging-Instanz bestätigt ist.
- Keine ungeklärten Datenquellen automatisiert abrufen.
- Keine Daten erfinden; Unsicherheit und Quellenkonflikte sichtbar kennzeichnen.
- Keine stillen Überschreibungen: alte Datenstände und Bewertungen bleiben nachvollziehbar.

## Nächste Schritte
1. Dialogtests für Jahrgang, Position, Standort, Rückfragen und Zielspielklasse ergänzen.
2. Rechercheparameter und Standort-/Positionsfilter in der bestehenden ASI-Pipeline deterministisch validieren.
3. Ranking-Ausgabe, Fit-Score und Datenqualität mit echten Beispieldaten evaluieren; keine erfundenen Scores.
4. Dedizierte myScoutingDatabase-Staging-Instanz bereitstellen bzw. bestätigen und Build-/Integrationstests ausführen.
5. Berechtigungs-, Eigentümer- und Rate-Limit-Tests für die Orchestrierung ergänzen.
6. Quellenregister und tägliche Scheduler-Komponente implementieren; Hintergrundrecherche erst nach Quellenfreigabe aktivieren.

## Arbeitsstand 25.11.2026 – Dialog- und Filterhärtung
- Scouting-Dialog aus dem Express-Handler in das testbare Modul `backend/messinho-validation.js` ausgelagert.
- Mengenangaben vor Positionsbezeichnungen werden erkannt; die angeforderte Anzahl wird auf das ASI-Maximum von 15 begrenzt.
- Jahrgangsbereiche, Länder-Aliase und mehrstufige Rückfragen werden deterministisch verarbeitet.
- Positionsabgleich nutzt kontrollierte Positions-Aliase statt unpräziser Teilstring-Suche.
- Standortfilter akzeptiert einen Kandidaten nur, wenn ein zugeordneter Quellenbeleg sowohl das angeforderte Land als auch den angegebenen aktuellen Verein enthält. Das ist bewusst konservativ und kann die Trefferzahl reduzieren.
- Zehn automatisierte Tests für Dialog, Rückfragen, Jahrgang, Standort, Position, Zurücksetzen abgeschlossener Dialoge und Quellenprüfung ergänzt; die Testfälle wurden lokal mit Node.js ausgeführt (10/10 bestanden).
- Syntaxprüfung der aktualisierten `backend/server.js` erfolgreich.
- GitHub-Actions-Workflow `.github/workflows/messinho-validation.yml` ergänzt, der auf dem Entwicklungszweig Unit-Tests und Frontend-Build ausführt. Ein CI-Lauf ist bislang nicht nachgewiesen.

## Noch offene Verifikation vor Live-Freigabe
- Vollständiger `npm run build` und automatisierter CI-Lauf müssen noch bestätigt werden.
- End-to-End-Test gegen die Staging-Supabase mit gültigem Staging-Auth-Token sowie konfigurierten Tavily-/OpenAI-Schlüsseln steht aus.
- Der vorhandene Render-Webdienst `myscoutingdatabase` zeigt auf `main` und darf nicht verwendet oder verändert werden. Eine eigene Render-Staging-Instanz wurde angelegt: `myscoutingdatabase-messinho-staging` (Frankfurt, Free, Branch `feature/messinho-agent-workspace`, Auto-Deploy deaktiviert).
- Keine Änderungen an `main`, Produktion, PFMS oder Supabase-Schema vorgenommen.

## Render-Staging – Bereitstellung 25.11.2026
- Staging-URL: https://myscoutingdatabase-messinho-staging.onrender.com
- Render-Service-ID: `srv-dc3chlqjnfac73acd6ig`
- Render-Deploy-ID (letzter bestätigter Deploy): `dep-dc3ciigm7kps73dsit0g`
- Build `npm install --no-audit --no-fund && npm run build`: erfolgreich; Vite hat 1.631 Module verarbeitet.
- Start `npm start`: erfolgreich; Render meldet den Dienst als live.
- `JWT_SECRET`, `APP_ORIGIN` und die öffentlichen Supabase-Verbindungswerte sind für Staging gesetzt.
- Noch nicht gesetzt: `SUPABASE_SECRET_KEY` oder `SUPABASE_SERVICE_ROLE_KEY`, `TAVILY_API_KEY`, `OPENAI_API_KEY`. Deshalb ist die Datenbankverbindung im Backend derzeit nicht initialisiert und die ASI-Recherche meldet `ready=false`.
- Vite meldet einen Haupt-JavaScript-Chunk von ca. 640,5 kB (gzip ca. 185 kB), oberhalb des 500-kB-Warnwerts. Build ist erfolgreich; Code-Splitting bleibt eine Performance-Optimierung.
- Es wurde weder der Render-Dienst auf `main` noch PFMS verändert. Der Staging-Dienst deployt neue Branch-Commits nicht automatisch.


## Arbeitsstand 25.11.2026 – MESSINHO Core Engine und ASI-Integration
- MESSINHO-Chat wurde in die bestehende KI-Spielersuche eingebettet; der separate Navigationspunkt wurde entfernt. Ein alter gespeicherter Seitenzustand `messinho` wird weiterhin auf dieselbe integrierte Such-/Chat-Oberfläche geleitet.
- Der bisherige Chat-Handlerfehler durch die nicht deklarierte Variable `history` wurde behoben. Gesprächsverlauf wird serverseitig auf maximal zehn Nachrichten, erlaubte Rollen und 1.200 Zeichen pro Nachricht begrenzt.
- Neue provider-unabhängige Datei `backend/messinho-engine.js`: versionierte, deterministische Bewertungslogik (Engine 1.0.0), Positionsgruppen, positionsabhängige Gewichte, Datenabdeckung und Vertrauensstufe.
- MESSINHO vergibt nur dann einen numerischen Score, wenn mindestens 50 % der Positionsgewichtung durch vorhandene numerische Daten abgedeckt sind. Fehlende Werte werden nicht ergänzt oder geschätzt.
- Positionsgruppen unterstützen Torwart, Innenverteidigung, Außenverteidigung, defensives/zentrales/offensives Mittelfeld, Flügel und Sturm. Plattformbezeichnungen wie AV links/rechts und IV links/rechts sind berücksichtigt.
- Vergleichsmodus über den Chat: „Vergleiche meine Kandidaten“ lädt die eigenen Kandidaten und sortiert sie anhand der MESSINHO-Bewertung; Score, Datenabdeckung und Vertrauensstufe werden angezeigt.
- Vollständige Scouting-Aufträge werden weiterhin an die vorhandene ASI-Quellenpipeline delegiert. MESSINHO übernimmt Dialogsteuerung, Auftragsklärung, positionsspezifische Bewertung und Ranking eigenständig.
- Neue Engine-Tests decken Positionsgewichtung, fehlende Daten, Normalisierung, Ranking und Verlaufssanitierung ab. Zusätzlich bestehen die bisherigen Dialog-/Positions-/Quellen-Tests. Die automatisierte Ausführung von `npm test` ist noch nicht bestätigt.
- Staging-Deploy `dep-dc3cr10u01pc73ea2q10` für Commit `037d2d90896360a900bfc0b4ccfdf81fc665fed6` wurde als `live` bestätigt; Vite-Frontend-Build war erfolgreich. Neuere nachfolgende Commits (Positionsalias-/Testanpassung) benötigen noch einen erneuten Staging-Build.
- Die Draft-PR #35 ist ausschließlich zur Prüfung vorgesehen und nicht gemergt. Produktion und PFMS blieben unangetastet.

### Unabhängigkeit und kontrollierte Weiterentwicklung
- MESSINHOs Kernlogik (Dialogparser, Entscheidungsregeln, Positionsprofile, Bewertung, Ranking und Versionskennung) ist ein eigenes Backend-Modul und nicht an OpenAI-spezifische Bewertungsanweisungen gebunden.
- OpenAI wird in der vorhandenen ASI-Pipeline derzeit weiterhin als austauschbarer LLM-Anbieter für Sprach-/Quellenanalyse verwendet. Die Architektur ist damit noch nicht vollständig LLM-frei; für einen späteren Wechsel muss ein eigener Provider-Adapter bzw. ein lokales Modell ergänzt und getestet werden.
- „Selbstverbesserung“ bedeutet zunächst versionierte, anhand von Ergebnissen evaluierte Änderungen mit automatisierten Tests und menschlicher Freigabe. Kein autonomes Umschreiben oder selbstständiges Ausrollen von Code/Bewertungsregeln.
- Externe Quellen- und Lizenzfreigabe, tägliche Hintergrundaktualisierung, historische Datenpflege und kontrollierte Modell-Evaluation bleiben gesonderte Ausbaustufen und sind nicht aktiviert.
- Noch offen: automatisierte Unit-Test-Ausführung, erneuter Staging-Build auf aktuellem Branch-Head, Chat-End-to-End-Test mit eingerichteten Staging-Secrets und verifizierte Live-Interaktion im Browser.

- Nach Korrektur des History-Testfalls wurden die fünf neuen Engine-Tests in einer isolierten Node-Umgebung erneut ausgeführt: 5/5 bestanden. Der vollständige Repository-Befehl `npm test` sowie die bestehenden Dialogtests wurden in dieser Sitzung noch nicht vollständig ausgeführt; daher ist die gesamte Testsuite weiterhin nicht als bestanden markiert.


## Arbeitsstand 25.11.2026 – Kontrollierte Lernfunktion (Entwicklung)
- Neues Backend-Modul `backend/messinho-learning.js`: nutzt ausschließlich explizite Scout-Gesamtbewertungen und Dimensionswerte, um positionsspezifische Gewichtungen vorzuschlagen.
- Mindestdatenbasis je Positionsgruppe: 30 Feedback-Einträge und mindestens 10 unterschiedliche Spieler. 20 % der Spieler werden für eine Holdout-Validierung zurückgehalten.
- Ein Vorschlag wird nur erzeugt, wenn der mittlere absolute Fehler auf den zurückgehaltenen Daten mindestens 1 Punkt sinkt und keine einzelne Gewichtung um mehr als 0,20 verschoben wird.
- Kein ausreichender Datensatz oder keine messbare Verbesserung bedeutet: kein Modellvorschlag.
- Neue Supabase-Migration `supabase/migrations/20261125_messinho_controlled_learning.sql`: Scout-Feedback, versionierte Modellstände, RLS und atomare Admin-Aktivierung.
- Neue API-Endpunkte: `POST /api/messinho/feedback`, `GET /api/messinho/learning/status`, `POST /api/messinho/learning/evaluate`, `POST /api/messinho/learning/:id/approve`.
- Kandidatenkarten erhalten eine Feedback-Eingabe für Gesamturteil und Leistungsdimensionen. Feedback wird dem angemeldeten Scout und gespeicherten Kandidaten zugeordnet.
- Aktive, ausdrücklich freigegebene Modellprofile werden bei MESSINHO-Rankings berücksichtigt; die Engine-Version wurde auf 1.1.0 angehoben.
- Modellvorschläge werden niemals automatisch aktiviert. Freigabe ist auf Administratoren beschränkt; Aktivierung ersetzt den aktiven Stand atomar und archiviert ihn als retired.
- Es werden keine privaten oder sensiblen Merkmale trainiert; nur sportfachliche Dimensionen (Technik, Taktik, Athletik, Mental/Goalkeeping) und explizite Scout-Gesamturteile.
- Keine automatische Codeänderung, kein autonomes Deployment und keine selbstständige Änderung an produktiven Regeln.

### Noch erforderliche Schritte vor Nutzung
1. Migration ausschließlich im Supabase-Staging-Projekt ausführen.
2. Vollständige Testsuite und Frontend-Build ausführen; insbesondere neue Lern- und API-Tests ergänzen.
3. Feedback-Eingabe mit echten Staging-Scoutkonten testen.
4. Lernvorschlag und Admin-Freigabe Ende-zu-Ende testen.
5. Staging deploy manuell ausführen; Produktion und PFMS bleiben unberührt.
