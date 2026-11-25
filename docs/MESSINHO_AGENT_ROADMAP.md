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


## Arbeitsstand 25.11.2026 – Kontrollierte MESSINHO-Lernfunktion
- MESSINHO nutzt die bereits vorhandene ASI-Infrastruktur, statt parallele Feedback- oder Modellverwaltungstabellen anzulegen.
- Die bestehende Tabelle `asi_scout_calibration_records` wurde um zwei historische Snapshot-Felder erweitert: `messinho_position_group` und `messinho_dimension_scores`.
- Die Migration `supabase/migrations/20261125122958_messinho_calibration_extension.sql` wurde erfolgreich ausschließlich im Supabase-Staging-Projekt `vxtybjaabtfhxfwctnyj` angewendet und die neuen Spalten wurden verifiziert.
- Scouts können einen vorhandenen Spieler auswählen. MESSINHO berechnet aus den gespeicherten sportfachlichen Ratings eine positionsbezogene Prognose und legt einen Kalibrierungseintrag an. Als einheitliche Messgröße wird ausschließlich das Leistungsniveau nach 12 Monaten auf einer Skala von 0–100 verwendet, damit keine unterschiedlichen Ergebnisarten vermischt werden.
- Ein Administrator muss später den tatsächlichen Wert, das Beobachtungsdatum und eine HTTPS-Quelle prüfen. Abgelehnte oder noch nicht verifizierte Kalibrierungen werden nicht zum Training verwendet.
- Die Lern-Engine trainiert positionsspezifische Gewichtungen aus verifizierten Kalibrierungsergebnissen. Mindestbasis: 30 verifizierte Einträge und 10 unterschiedliche Spieler je Positionsgruppe; 20 % Holdout auf Spielerebene; mindestens 1 Punkt MAE-Verbesserung; maximal 0,20 Gewichtsverschiebung. Die Optimierung projiziert jeden Lernschritt direkt in den zulässigen Gewichtsbereich, statt gute Modelle allein wegen einer zu großen Rohänderung zu verwerfen.
- Ein zusätzlicher eindeutiger Index verhindert mehr als eine offene MESSINHO-Kalibrierung desselben Spielers je Scout. Historische geprüfte Einträge bleiben erhalten. Verschachtelte Rating-Objekte werden ebenfalls korrekt normalisiert.
- Modellkandidaten, Evaluationen und Trainingsläufe werden in den vorhandenen Tabellen `asi_model_versions`, `asi_model_evaluations` und `asi_training_runs` protokolliert.
- Die Freigabe erfolgt ausschließlich über die bestehende Admin-RPC `asi_review_model_candidate`; Kalibrierungen werden über `asi_review_scout_calibration` verifiziert. Damit bleiben Audit, Berechtigungen und Modellhistorie zentral in ASI.
- Freigegebene MESSINHO-Profile werden in der eigenen positionsbezogenen Scoring-Engine genutzt. Nicht trainierte Positionen behalten die vorhandenen Basisgewichte.
- Keine automatische Modellaktivierung, kein autonomes Umschreiben von Code und kein selbstständiges Deployment.
- Beide Supabase-Staging-Migrationen sind angewendet und verifiziert: `messinho_calibration_extension` und `messinho_pending_calibration_guard`.
- GitHub Actions auf dem aktuellen Runtime-Commit `63b0ad08bbd70dae413d55e9c30d959ab58023ed`: MESSINHO validation Run #136 und ASI quality checks Run #86 erfolgreich; beide führten vollständige Tests und Frontend-Build aus.
- Render-Staging-Deployment `dep-dc3de64ipgvc738ceod0` ist live. Vite-Build erfolgreich; Backend startet und meldet `myScoutingDatabase API listening on 10000`.
- Runtime-Ende-zu-Ende-Tests bleiben blockiert: Render-Staging-Logs melden `SUPABASE_SERVICE_ROLE_KEY` fehlt; außerdem `Tavily=false` und `OpenAI=false`. Die Variablen müssen direkt im Render-Dashboard des Staging-Dienstes unter den vom Backend unterstützten Namen gesetzt werden.
- In der Staging-Kalibrierungstabelle liegen aktuell 0 Einträge und 0 verifizierte Ergebnisse. Noch offen sind authentifizierte Admin-/Scout-Tests, erste Kalibrierungserfassung, Admin-Verifizierung, Training mit mindestens 30 verifizierten Einträgen und 10 Spielern je Position sowie Modellfreigabe.
- Da derzeit noch keine verifizierten Kalibrierungsdaten vorhanden sind, kann noch kein neues Modell trainiert oder aktiviert werden. Die Lernfunktion sammelt zunächst echte Daten; sie erfindet keine Trainingswerte.


## Arbeitsstand 25.11.2026 – Ausbau in sechs Entwicklungsphasen

### Phase 1 – Fundament und Datenqualität
- Neues provider-unabhängiges Modul `backend/messinho-intelligence.js`.
- Quellen werden technisch geprüft: HTTPS, URL-Gültigkeit, Domain-Diversität, Veröffentlichungsdatum und Aktualitätsfenster.
- Quellenqualität wird ausdrücklich nicht mit journalistischer Glaubwürdigkeit gleichgesetzt; unbekannte Datumsangaben und begrenzte Auszüge bleiben als Einschränkungen sichtbar.
- Keine fehlenden Fakten oder Leistungswerte werden ergänzt.

### Phase 2 – Taktische Passung
- Neuer taktischer Abgleich mit einem ausdrücklich vom Verein übergebenen Anforderungsprofil.
- Formation, Rolle und gewünschte Attribute können berücksichtigt werden.
- Ein Fit-Wert wird nur berechnet, wenn mindestens drei reale Spielerattribute vorliegen und mindestens 50 % der Profilgewichtung abgedeckt sind.
- Die Berechnung ist als transparente Heuristik gekennzeichnet, nicht als automatische Erfolgsvorhersage. Ohne Vereinsprofil oder ausreichende Daten bleibt der Wert null.

### Phase 3 – Kontrolliertes Lernen
- Bestehende supervised-learning-Architektur bleibt auf administrativ verifizierte 12-Monats-Ergebnisse begrenzt.
- Mindestmengen, Spieler-Holdout, MAE-Vergleich, maximale Gewichtsverschiebung und Admin-Freigabe bleiben verpflichtende Schutzmechanismen.
- Noch keine realen Trainingsdaten vorhanden; ein tatsächlicher Lernzyklus ist deshalb noch nicht nachgewiesen.

### Phase 4 – Internationale Recherche und Quellenprüfung
- Die bestehende Tavily-/ASI-Recherche erhält eine nachvollziehbare Quellen- und Aktualitätsbewertung.
- Unsichere HTTP-Quellen werden nicht als Belege zurückgegeben; Quellen ohne Datum werden nicht als aktuell ausgegeben.
- Die externe Recherche bleibt bis zur Konfiguration der Staging-Zugangsdaten deaktiviert.

### Phase 5 – Berechtigungen und Datenschutz
- Bestehende Supabase-Authentifizierung, Rollenprüfung, Eigentümerfilter und Admin-only-Lernfreigabe bleiben verbindlich.
- Keine sensiblen Gesundheits- oder psychologischen Bewertungen.
- Staging-only; keine Änderungen an Produktion oder PFMS.

### Phase 6 – Automatisierte Qualitätssicherung
- Neue Tests für HTTPS-/Freshness-Prüfung, Quellen-Deduplizierung, Quellenabdeckung und taktische Fit-Berechnung.
- GitHub Actions führt die gesamte Node-Test-Suite und den Frontend-Build aus.
- Release erst nach erfolgreichen CI-, Staging-, Rollen- und End-to-End-Tests sowie ausdrücklicher Freigabe.

### Verifikation und Einschränkungen
- Neue Dateien: `backend/messinho-intelligence.js`, `tests/messinho-intelligence.test.js`.
- `backend/server.js` bindet Quellenbewertung und taktische Passung in die vorhandene Rechercheantwort ein.
- Es wurden keine neuen Datenbanktabellen oder Migrationen für diese Erweiterung benötigt.
- Die Staging-Umgebung benötigt weiterhin die fehlenden Backend-Schlüssel. Ohne sie können Recherche und Authentifizierungs-E2E nicht realistisch getestet werden.
- Der aktuelle Branch-Head muss nach Abschluss der CI-Prüfung erneut auf Render-Staging bereitgestellt und dort getestet werden.


### Umsetzungserweiterung – Quellen, taktischer Abgleich und Performance
- Die Rechercheantworten liefern pro Quelle eine technische Qualitätskennzeichnung für HTTPS, Domain, Datumsstatus und Aktualitätsfenster. Dies ist ausdrücklich keine automatische Glaubwürdigkeits- oder Lizenzfreigabe.
- Kandidatenanalysen erhalten eine aggregierte Quellenabdeckung mit Anzahl gültiger Quellen, unterschiedlichen Domains, aktuellen/undatierten/veralteten Quellen und konkreten Einschränkungen.
- Neuer authentifizierter Endpunkt `POST /api/messinho/tactical-fit`: lädt nur einen für den angemeldeten Scout sichtbaren Spieler (Admin darf projektweit lesen) und vergleicht dessen gespeicherte Werte mit einem vom Verein übergebenen Anforderungsprofil. Rate-Limit: 30 Anfragen pro Stunde.
- Die MESSINHO-Oberfläche enthält einen kompakten Vereinsprofil-Abgleich mit Formation, Rolle und drei editierbaren Attributanforderungen. Ergebnis, Abdeckung und Grenzen werden sichtbar ausgegeben.
- Der taktische Score ist ein transparenter Abstand zu vereinsseitig definierten Zielwerten. Er ist kein statistisch validiertes Erfolgsmodell und wird bei weniger als drei echten Attributwerten oder weniger als 50 % Abdeckung nicht numerisch ausgegeben.
- Quellenmetadaten und taktische Passung werden direkt in der Ergebnisoberfläche sichtbar gemacht.
- Vite-Build-Konfiguration teilt React, Supabase und Lucide-Icons in separate Vendor-Chunks auf; die tatsächliche Chunk-Größe wird im nächsten Staging-Build geprüft.
- Die zusätzlichen Tests prüfen HTTPS- und Datumsstatus, Deduplizierung, Domain-Diversität, fehlende Daten, Mindestabdeckung und die bestehende 1–5- bzw. 0–100-Bewertungsskala.
- Die neue CI-Ausführung für den letzten Zwischenstand `fc66b227` war erfolgreich (MESSINHO validation und ASI quality checks). Die nachfolgenden UI-Erweiterungen werden gerade erneut durch CI geprüft.


## Produktionshärtung – 25.11.2026

### Behobene Befunde
- Alle MESSINHO-Spielerabfragen mit privilegiertem Service-Client laufen über `scopeMessinhoOwner`: Scouts werden serverseitig auf ihre `owner_id` begrenzt; Admins behalten die globale Sicht. Die Hilfsfunktion ist separat getestet.
- Interne MESSINHO-Suche und Bestandsübersicht geben Scouts keine fremden Spieler oder globalen Spielerzahlen mehr zurück.
- Vergleichs-Ranking verwendet jetzt die tatsächlich gespeicherte Modellkonfiguration unter `configuration.profiles`.
- `/api/health` prüft die tatsächliche Datenbankverbindung statt nur, ob ein Supabase-Client erzeugt wurde. Die öffentliche Antwort verrät keine geheimen Werte oder konkrete Modellkonfiguration.
- Taktische Bewertung interpretiert ganzzahlige Scout-Bewertungen 1–5 korrekt (1 = 20/100, 5 = 100/100); unplausible Veröffentlichungsdaten in der Zukunft gelten nicht als aktuell.
- Trainingsversuche ohne ausreichende Daten werden als `insufficient_data` protokolliert, nicht fälschlich als erfolgreicher Trainingslauf. Unvollständige Modellkandidaten werden bei fehlgeschlagener Trainingsprotokollierung bereinigt.
- Staging besitzt jetzt eine explizite aktive deterministische MESSINHO-Baseline Version 1.1.0. Sie ist als nicht trainiert gekennzeichnet und verwendet die dokumentierten Positionsgewichte; sie ist kein behauptetes Machine-Learning-Ergebnis.
- Staging-Umgebungsvariablen für Supabase-Projekt-URL, Publishable Key und APP_ORIGIN wurden ergänzt; ein zufälliges JWT_SECRET wurde ausschließlich für Staging gesetzt. Keine Produktionsvariablen geändert.
- `.env.example` wurde auf neue Supabase Secret-/Publishable-Key-Namen aktualisiert.

### Noch offene Produktionsfreigaben
- Supabase Server Secret Key (`SUPABASE_SECRET_KEY` oder `SUPABASE_SERVICE_ROLE_KEY`) muss als Geheimnis in Render Staging gesetzt werden.
- Für externe Recherche fehlen weiterhin `TAVILY_API_KEY` und `OPENAI_API_KEY`. OpenAI bleibt nur Analyseanbieter; MESSINHOs Bewertung, Baseline und Lernlogik sind provider-unabhängig.
- Supabase Auth: Schutz gegen kompromittierte Passwörter ist laut Advisor derzeit deaktiviert und muss in den Auth-Sicherheitseinstellungen aktiviert werden.
- SECURITY DEFINER RPCs wurden auf ihre Funktionskörper geprüft: Identitätsänderungen verlangen Admin-Rechte; Heartbeat/Login aktualisieren nur die Zeile des angemeldeten Benutzers. Der Advisor-Hinweis ist deshalb nicht automatisch eine nachgewiesene Rechteausweitung; die Ausführungsrechte bleiben dennoch vor Release zu überprüfen.
- `support_tickets` und `support_ticket_messages` haben RLS ohne Policies. Das blockiert direkte Client-Zugriffe; bestehende Backend-Endpunkte müssen separat gegen ihre expliziten Rollen-/Eigentümerprüfungen getestet werden. Keine pauschalen Policies ergänzt.
- Admin-/Scout-End-to-End-Tests, reale Datenbank-Health-Prüfung, externe Recherche, Kandidatenspeicherung, Scout-Isolation und Admin-Modellfreigabe stehen nach Bereitstellung der fehlenden Geheimnisse aus.
- Es liegen noch keine echten verifizierten 12-Monats-Ergebnisse vor. Ein echtes Training ist daher ausdrücklich nicht freigegeben.

### Rollout-Grenze
Dieser Stand bleibt Draft auf `feature/messinho-agent-workspace` und Render-Staging. Nicht mergen, nicht auf `main` deployen und keine produktive Datenbankmigration ausführen, bevor alle oben genannten Tests erfolgreich sind und eine ausdrückliche Freigabe erteilt wurde.

- Admin-Bootstrap ist jetzt standardmäßig inaktiv und erfordert `ADMIN_BOOTSTRAP_ENABLED=true`, ein mindestens 12 Zeichen langes Initialpasswort und eine kontrollierte Mailbox. Ein bestehendes Nicht-Admin-Konto wird nicht automatisch zum Admin hochgestuft; nach einmaliger Nutzung müssen Flag und Initialpasswort entfernt werden.
- Der öffentliche Health-Endpunkt prüft Datenbankerreichbarkeit und Anmeldekonfiguration tatsächlich und meldet externe Recherche getrennt als optionale Abhängigkeit.

- Modellfreigabe ist zusätzlich durch einen partiellen Unique-Index abgesichert: pro `model_key` kann nur eine Version den Status `active` besitzen. Die Freigabe konkurrierender Admin-Aktionen kann dadurch keine zwei aktiven Modellversionen hinterlassen.
- Trainingsdatensatz-Fingerprints enthalten jetzt die tatsächlichen verifizierten Outcomes, Positionsgruppen, Dimensionswerte und Beobachtungsdaten statt nur Datensatz-IDs.
- Holdout-Aufteilung und Trainingsreihenfolge sind anhand stabil sortierter Spieler-/Datensatzmerkmale reproduzierbar.
- Aufwendige Lern-Evaluationen sind auf fünf Versuche pro Stunde begrenzt; Tavily-, OpenAI- und verschachtelte Rechercheaufrufe haben feste Timeouts.
