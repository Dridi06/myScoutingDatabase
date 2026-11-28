# MESSINHO — Projektweite intelligente Diagnose- und Codeverifikation

**Status:** Verbindliche Produktanforderung; Block 1 und Teile von Block 2 umgesetzt, weitere Laufzeit- und Integrationsprüfungen offen  
**Geltungsbereich:** Gesamtes Repository `Dridi06/myScoutingDatabase`, STAGING zuerst  
**Arbeitsbranch:** `feature/messinho-conversation-engine`  
**Letzte Aktualisierung:** 2026-11-28

## 1. Ziel

MESSINHO erhält eine projektweite Diagnose-Engine, die eigenständig den tatsächlichen Zustand der Anwendung ermittelt. Sie prüft nicht nur, ob einzelne vordefinierte Bedingungen erfüllt sind, sondern verbindet Quellcode-Inventar, Abhängigkeitsanalyse, Parser-/Compilerprüfungen, Tests, Build, Schnittstellenverträge, Datenbankschema, Laufzeitbeobachtung und reproduzierbare Fehleranalyse.

Die Engine muss Fehler so eng wie technisch möglich eingrenzen und einen nachvollziehbaren Befund liefern: konkrete Datei, Zeile/Spalte oder Symbol, betroffene Komponente, reproduzierbarer Auslöser, tatsächliche Fehlermeldung, wahrscheinliche Ursache, Auswirkung, Belege und nächster sicherer Schritt.

Die Diagnose gilt für das gesamte Projekt einschließlich Frontend, Backend, MESSINHO, myKI, Projektmanagement-/Ticket-/Diagnosefunktionen, APIs, Authentifizierung, Rollen-/Mandantentrennung, Datenbank, Migrationen, Hintergrundprozesse, Build-/Deploy-Konfiguration und Tests.

## 2. Diagnoseprinzipien

1. **Beleg vor Behauptung:** Jeder Fehlerbefund muss mindestens einen konkreten Beleg oder ausdrücklich den Status `unbestätigte Hypothese` enthalten.
2. **Keine Scheingenauigkeit:** Ein statischer Hinweis ist kein reproduzierter Laufzeitfehler. Ein fehlender gleichnamiger Test ist kein Beweis fehlender Testabdeckung.
3. **Vollständiger Umfang:** Jede Prüfung gibt an, welche Dateien, Module, Routen, Tabellen und Laufzeitbereiche tatsächlich erfasst wurden und was ausgeschlossen blieb.
4. **Fehlerlokalisierung:** Keine pauschalen Meldungen wie „Build fehlgeschlagen“, wenn sich die konkrete Fehlermeldung und Quellstelle aus dem Prüflauf extrahieren lassen.
5. **Unabhängige Prüfebenen:** Statische Analyse, Syntax-/Compilerprüfung, Unit-Tests, Integrations-/End-to-End-Tests, Datenbank-/RLS-Prüfung und Live-Health-Checks werden getrennt ausgewiesen.
6. **Reproduzierbarkeit:** Jeder Lauf speichert Branch, Commit-SHA, Umgebung, Start-/Endzeit, Werkzeugversionen, Befehle, Exitcodes und Ergebnisreferenzen.
7. **Sichere Selbstprüfung:** MESSINHO darf seinen eigenen Code und seine Diagnosekomponenten mit denselben Regeln prüfen, muss aber Selbstreferenz und nicht verfügbare Prüfinstrumente offen kennzeichnen.
8. **STAGING-Grenze:** Prüfungen und Reparaturversuche laufen ausschließlich in isolierter CI-/Sandbox-Umgebung und auf STAGING. Produktion, Produktionsdaten und Produktionszugänge sind gesperrt.
9. **Keine automatische Selbstfreigabe:** Ein KI-generierter Patch ist ein Vorschlag. Er benötigt Tests, Diff-Prüfung und Admin-Freigabe. Geschützte Bereiche wie Auth, RLS, Migrationen, Secrets und Deployment-Gates dürfen nicht autonom verändert werden.
10. **Zeitstempel:** Jeder Prüflauf, jede Teilprüfung, jeder Befund und jede Statusänderung erhält einen UTC-Zeitpunkt; Anzeige in Europe/Berlin.

## 3. Architektur der Diagnose-Engine

### Ebene A — Repository-Inventar und Vollständigkeit
- Vollständige Erfassung aller relevanten Projektdateien und Verzeichnisse.
- Erkennung unbekannter, nicht klassifizierter oder versehentlich ausgelassener Projektbereiche.
- Kennzeichnung von generierten, vendor-, build- und secret-geschützten Dateien.
- Ermittlung von Projektgröße, Dateiarten, Modulgrenzen und Eigentümer-/Komponenten-Zuordnung.
- Abgleich zwischen Repository-Inhalt, CI-Prüfumfang und tatsächlich ausgeliefertem STAGING-Commit.

### Ebene B — Quellcode- und Abhängigkeitsanalyse
- Parsergestützte Analyse der unterstützten Sprachen statt alleiniger Regex-/Textsuche.
- Vollständiger Import-/Export-Graph inklusive relativer und Paketimporte, Alias-Auflösung, dynamischer Imports und zyklischer Abhängigkeiten.
- Unaufgelöste Importe mit Quellpfad, Zeile, Spalte, Import-Spezifizierer und erwarteten Kandidaten.
- Erkennung nicht verwendeter, unerreichbarer oder doppelt definierter Module, soweit die Analyse dies belastbar nachweisen kann.
- Abgleich von Exporten, Imports, Funktionssignaturen und Typverträgen.
- Jede nicht unterstützte Sprachsyntax oder Parsergrenze wird als Abdeckungslücke ausgewiesen, nicht stillschweigend übersprungen.

### Ebene C — Syntax, Typen und Build
- Tatsächliche Syntax-/Parser-/Compilerprüfung für alle im Projekt verwendeten Sprachen und Konfigurationen.
- Frontend-Build mit sourcemapgestützter Rückführung auf Quellstellen, sofern verfügbar.
- Backend-Syntax- und Modul-Ladeprüfung.
- Prüfung von package.json-Skripten, Lockfile-Konsistenz, Konfigurationsdateien und Build-Varianten.
- Fehlerausgabe mit exakter Werkzeugmeldung, Datei, Zeile/Spalte, Exitcode und betroffener Build-Stufe.

### Ebene D — Test- und Verhaltensverifikation
- Ausführung der vollständigen vorhandenen Test-Suite in isolierter CI-Umgebung.
- Testinventar: Unit-, Integrations-, API-, UI-, End-to-End-, Security-, Regression- und Migrationstests.
- Zuordnung von Tests zu realen Modulen, Funktionen, API-Routen und kritischen Benutzerabläufen.
- Coverage-Messung, sofern Werkzeug und Projektkonfiguration dies unterstützen: Statement-, Branch- und Function-Coverage.
- Erkennung ungetesteter kritischer Pfade; keine Gleichsetzung von Dateinamen oder bloßen Importen mit echter Verhaltensabdeckung.
- Fehlercluster nach gemeinsamer Ursache, Stacktrace, Modul und Regressionseinführung.

### Ebene E — Schnittstellen- und Datenintegrität
- API-Routen, Request-/Response-Schemas, Validierung, Fehlercodes und Authentifizierungs-/Autorisierungsketten prüfen.
- Datenbanktabellen, Spalten, Defaults, Constraints, Indizes, Trigger und Migrationen mit dem erwarteten STAGING-Schema abgleichen.
- RLS- und Mandantentrennung mit positiven und negativen Integrationstests prüfen.
- Frontend-Backend-Verträge und Datenformate auf Abweichungen prüfen.
- Hintergrundjobs, Scheduler, Tickets, Auditlogs und Persistenzpfade auf Statusübergänge und Fehlerbehandlung testen.
- Ausschließlich lesende Schema-/Diagnoseprüfungen; keine produktiven Schreiboperationen.

### Ebene F — Laufzeit- und Betriebsdiagnose
- STAGING-Health-Checks, Backend-Logs, Request-Fehler, Datenbankverbindung und zentrale Benutzerabläufe korrelieren.
- Fehler nach Zeitfenster, Request-ID, Diagnose-Lauf-ID und Commit zusammenführen.
- Timeout, Verbindungsfehler, Konfigurationsfehler und echte Anwendungsausnahmen unterscheiden.
- Nicht erreichbare externe Provider als Abhängigkeit/Umgebungsproblem ausweisen, nicht als Quellcodefehler.
- Browser-/Mobilgeräte- und visuelle UX-Prüfungen getrennt markieren, wenn sie nicht automatisiert ausgeführt wurden.

### Ebene G — Selbstprüfung der Diagnose
- Die Diagnose-Engine prüft ihre eigenen Scanner, Parseradapter, Regeln, Ergebnis-Schemas, Persistenz, UI-Darstellung und Fehlerbehandlung.
- Test-Fixtures enthalten absichtlich eingebaute Fehler: kaputter Import, Syntaxfehler, Typfehler, defekter API-Vertrag, fehlender Test, fehlerhafte Migration und Laufzeitfehler.
- Für jede Fixture muss die Engine den Fehler korrekt klassifizieren und lokalisieren.
- False-Positive- und False-Negative-Tests werden als Qualitätsmetriken geführt.
- Ein Diagnose-Lauf darf nicht als vollständig gelten, wenn seine eigenen Teilprüfer ausgefallen sind.

## 4. Autonome Ermittlungslogik

Für jeden Befund führt MESSINHO – innerhalb der freigegebenen Werkzeuge und Budgets – diese Schritte aus:

1. Fehlerhinweis erfassen und dem konkreten Commit zuordnen.
2. Befund mit einer zweiten unabhängigen Prüfung bestätigen, wenn möglich.
3. betroffene Datei, Funktion, Importkette, Aufrufer und abhängige Komponenten ermitteln.
4. Fehlersituation isoliert reproduzieren.
5. Ursache von Folgefehlern unterscheiden und gemeinsame Root Causes gruppieren.
6. Auswirkungen und Reichweite bestimmen.
7. Gegenbelege und alternative Ursachen prüfen.
8. Konfidenz anhand der Belegqualität klassifizieren, nicht frei erfinden.
9. Einen minimalen Reparaturvorschlag mit Regressionstest und Rollback-Hinweis erstellen.
10. Nach genehmigter Reparatur exakt dieselben Prüfungen erneut ausführen und Vorher/Nachher vergleichen.

MESSINHO darf bei fehlenden Werkzeugen, fehlenden Testdaten oder nicht reproduzierbaren Fehlern keine definitive Ursache behaupten. Es muss dann den engsten belegbaren Bereich und die noch fehlende Information ausgeben.

## 5. Einheitliches Fehlerformat

Jeder Befund muss nach Möglichkeit folgende Felder enthalten:

- `finding_id`, Diagnose-Lauf-ID und Zeitstempel
- Schweregrad: `critical`, `high`, `medium`, `low`, `info`
- Status: `confirmed`, `probable`, `unverified`, `false_positive`, `resolved`
- Kategorie und betroffene Projektkomponente
- Repository, Branch und Commit-SHA
- Datei, Zeile, Spalte, Symbol/Funktion und Import-/Aufrufkette
- Exakte Fehlermeldung, Stacktrace oder reproduzierbarer Test
- Ursache, Folgefehler und betroffene Funktionen
- Reproduktionsschritte und verwendeter Prüfbefehl
- Belegreferenzen, Werkzeug, Version, Exitcode und Dauer
- Konfidenzklasse mit nachvollziehbarer Begründung
- Reparaturvorschlag, Regressionstest und Rollback-Plan
- Admin-Freigabestatus und Ergebnis der Nachprüfung

Die UI zeigt zuerst die wichtigsten Probleme. Jeder Befund lässt sich bis zu den konkreten Belegen und betroffenen Dateien aufklappen. Der vollständige Bericht kann exportiert und historisch verglichen werden.

## 6. Diagnosequalität und Effizienz

- Schneller inkrementeller Scan nur für geänderte Dateien und deren Abhängigkeiten; regelmäßiger vollständiger Projekt-Scan als Gegenprüfung.
- Caching ausschließlich mit Commit-SHA, Werkzeugversion und Konfigurationshash als Schlüssel.
- Fehler deduplizieren und zusammengehörige Folgefehler zu einer Root Cause gruppieren.
- Kritische Bereiche priorisieren: Authentifizierung, Berechtigungen/RLS, Datenintegrität, API, Chat, Scouting-Import, Persistenz und Deployment.
- Zeit-/Speicherbudgets, Parallelitätslimits, Abbruch und Wiederaufnahme.
- Ergebnisqualität messen: Lokalisierungsgenauigkeit, Reproduzierbarkeit, False-Positive-Rate, False-Negative-Rate, Abdeckungsgrad und Diagnosezeit.
- Keine vollständige Suite bei jedem Tastendruck; Auswahl schneller gezielter Prüfungen während der Entwicklung und kompletter Prüfungen vor STAGING-Release.

## 7. Sicherheit und Grenzen

- Quellcode wird in isolierten, kurzlebigen CI-/Sandbox-Läufen geprüft, niemals durch unkontrollierte Ausführung im laufenden Webserver.
- Keine Secrets in Diagnoseberichten oder Logs; Redaction vor Persistenz.
- Keine ungeprüfte Ausführung von Shell-Befehlen, Patches oder externen Inhalten.
- Keine automatischen Änderungen an Auth, Rollen, RLS, Datenbankmigrationen, Secrets, Infrastruktur oder Produktionskonfiguration.
- KI-generierte Analyse ist kein Beweis. Maßgeblich sind reproduzierbare Tests, Compiler-/Parserausgaben, Laufzeitbelege und Review.
- „Alle Quellcodes funktionieren“ darf nur als Ergebnis der tatsächlich ausgeführten und vollständig abgedeckten Prüfungen formuliert werden. Nicht getestete Pfade bleiben ausdrücklich offen.

## 8. Umsetzung in kontrollierten Entwicklungsblöcken

1. **Diagnose-Baseline:** aktuellen Audit, Endpunkte, Datenmodell, CI-Workflow und Diagnose-UI vollständig inventarisieren; aktuelle Fehlalarme reproduzieren.
2. **Präziser Befundkern:** strukturierte Findings mit Datei/Zeile/Spalte, Commit, Belegen, Status und Root-Cause-Gruppierung einführen.
3. **Parser und Importgraph:** belastbare Sprach-/Modulauflösung integrieren und die bisherigen 7 Importfehler konkret auflösen oder als Fehlalarm belegen.
4. **Echte Ausführungsprüfungen:** Syntax, Typen, Build und Tests ausschließlich in isolierter CI ausführen; Ergebnisse strukturiert übernehmen.
5. **Abdeckungsanalyse:** Module, Funktionen, API-Routen und kritische Abläufe mit tatsächlichen Tests und Coverage verknüpfen.
6. **Projekt-/Datenbankverträge:** API, Supabase-Schema, RLS, Migrationen und Hintergrundprozesse prüfen.
7. **Laufzeitkorrelation:** STAGING-Logs, Health-Checks, Request-IDs und Commit-Bezug integrieren.
8. **Selbsttest:** Fehler-Fixtures, False-Positive-/False-Negative-Suite und Prüfung der Diagnose-Engine selbst implementieren.
9. **Dashboard:** präzise Befunde, Filter, Quellstellen, Belege, Verlauf und Export in die bestehende Diagnoseoberfläche integrieren.
10. **STAGING-Abnahme:** vollständige Tests, Sicherheitsprüfung, manueller Admin-Test und visuelle Desktop-/Mobilabnahme. Erst danach als verifiziert kennzeichnen.

## 9. Abnahmekriterien

- Ein absichtlich defekter Import wird mit exakter Quelldatei, Zeile und nicht auflösbarem Ziel erkannt.
- Ein Syntax-/Buildfehler wird mit Originalmeldung und Quellstelle ausgegeben.
- Ein fehlschlagender Test wird mit Testname, Stacktrace, Commit und betroffener Komponente verknüpft.
- Ein nicht direkt getestetes Modul wird nicht pauschal als ungetestet markiert; indirekte Tests und Coverage werden berücksichtigt.
- Ein RLS-/Autorisierungsfehler wird durch einen reproduzierbaren negativen Integrationstest belegt.
- Ein Fehler wird von seinen Folgefehlern getrennt und Root-Cause-Duplikate werden gruppiert.
- Die Diagnose erkennt Fehler in ihrer eigenen Engine anhand von Fehler-Fixtures.
- Nicht ausgeführte Prüfungen und blinde Flecken werden sichtbar angezeigt.
- Jeder Bericht ist zeitgestempelt, revisionsbezogen und dauerhaft nachvollziehbar.
- Keine Änderung an Production; keine unautorisierte Datenmutation.
- Ein erfolgreicher Diagnosebericht bedeutet ausschließlich: alle im Bericht als ausgeführt markierten Prüfungen bestanden; nicht, dass mathematisch jeder mögliche Programmzustand fehlerfrei ist.

## 10. Aktueller Ausgangspunkt

Der vorhandene `backend/messinho-project-audit.js` ist derzeit überwiegend ein read-only statischer Inventar-/Konsistenzscanner. Er führt selbst keine Compiler, Tests oder Build-Kommandos aus. Seine aktuelle Importauflösung und direkte Testzuordnung sind heuristisch. Daher kann er Fehlerhinweise erzeugen, aber keine vollständige Funktionsfähigkeit aller Quellcodes nachweisen.

Der sichtbare Diagnosebericht vom 2026-11-28 nennt 230 Quelldateien, 7 nicht auflösbare relative Importe, 74 Backend-Module, 76 Testdateien und 6 Module ohne direkten Testimport sowie einen fehlgeschlagenen Build-/Testskript-Check. Diese Zahlen sind zunächst als zu reproduzierende Diagnosebefunde zu behandeln, nicht als bereits bestätigte Root Causes.

**Nächster konkreter Entwicklungsschritt:** Phase 1 — aktuellen Diagnosefehler reproduzieren und die statische Audit-Ausgabe durch präzise, beleggestützte Finding-Datensätze ergänzen. Danach CI-Ausführung und Abdeckungsanalyse anschließen.


## 11. Full-Stack Intelligence & Sandbox Audit — Block 2

Der zusätzliche Full-Stack-Audit ergänzt die projektweite Diagnose um fünf Schichten. Er wird ausschließlich über den geschützten Admin-Endpunkt `POST /api/admin/messinho-diagnostics/run` gestartet und sein Ergebnis wird in der vorhandenen Diagnosehistorie gespeichert.

### 11.1 Code- und Funktionsintrospektion
- Abgleich des 100-Funktionen-Capability-Katalogs mit ausführbaren Handlern und Laufzeitregistrierung.
- Separate Kennzeichnung von Speziallogik und generischem Fallback; Registrierung oder Dispatch gelten nicht als End-to-End-Abnahme.
- AST-basierte Erfassung von JavaScript-/TypeScript-Modulen, exportierten Symbolen, Funktionen, Klassen, Methoden, Imports, Abhängigkeiten, nicht auflösbaren Importen, fehlenden benannten Exporten und Modulzyklen.
- Der Audit weist die Grenzen des unterstützten Parsers und der nicht ausgeführten Anwendungslaufzeit aus.

### 11.2 LLM- und Linguistic-Engine-Prüfung
- Standardlauf: Modellname, Endpoint und Vorhandensein der erforderlichen Konfiguration prüfen, ohne Provideraufruf.
- Optionale Live-Probe nur nach ausdrücklicher Admin-Aktivierung in der Diagnoseoberfläche: maximal 8 Sekunden Timeout, Temperatur 0, JSON-Format, maximal 64 angeforderte Ausgabetoken. Gemessen werden Latenz, JSON-Gültigkeit, erwartete Antwort und vom Provider gemeldete Tokenverwendung.
- Das vollständige Kontextfenster des Providers wird nicht aus einer einzelnen Antwort abgeleitet.
- Synthetische Sprachfälle decken Deutsch, Englisch, Französisch und tunesisches Arabisch ab. Mehrfachaufgaben, Quellenattribution und begrenzte Reasoning-Pläne werden separat ausgewiesen.

### 11.3 Sandbox- und Ressourcen-Audit
- Statische Prüfung des tatsächlich verwendeten GitHub-Actions-/Docker-Setups: Netzwerkabschaltung, Read-only-Container, Speicher-/CPU-/PID-Limits, Capability-Drop, `no-new-privileges`, unprivilegierter Benutzer, schreibgeschützte Quellcode-Mounts, Zeitlimits und Baseline-vor-Kandidat-Reihenfolge.
- Die Staging-Service-Gate-Logik wird mit einer passenden Staging-Identität und einer abweichenden Production-Identität geprüft. Es wird kein Sandbox-Job aus dem Admin-Audit ausgelöst. Der isolierte CI-Baseline-Runner protokolliert tatsächliche cgroup-Werte für Speicher, CPU und Prozesse.
- Host-CPU/RAM-Werte werden nicht als Sandbox-Ressourcenwerte ausgegeben. cgroup-Werte werden im Container erfasst und in Joblogs ausgegeben; die Aggregation in Admin-Berichte bleibt offen.

### 11.4 Kognitive, Sicherheits- und Tool-Stresstests
- Kontrollierte Capability-Eingaben: null, Array, unbekannte Funktion und übergroße Textfelder; nur reine, nebenwirkungsarme Capability-Validierung.
- Prompt-Injection-Grenzfall: der Angriffsstring bleibt im User-Datenkanal, Systemregeln kennzeichnen Nutzereingaben als nicht vertrauenswürdig; der Modellanbieter wird dabei nicht aufgerufen.
- Gesprächsvertrag prüft unter anderem Sprach-/Kontexttreue und die explizite Nichtausführung von Tools.
- Der öffentliche, erklärbare Reasoning-Vertrag wird geprüft; private Chain-of-Thought wird weder ausgelesen noch gespeichert.

### 11.5 Memory-Integrität und Evolution
- Synthetischer Memory-Test prüft Dublettenbehandlung, Sensitivitätsfilter, Vertrauensschwelle und Zeitstempel ohne Datenbankmutation.
- Die vorhandene lexikalische Ähnlichkeitssuche wird separat geprüft. Echte Vektor-Embeddings und ein Vektorindex werden nicht behauptet und bleiben als eigene Integrationslücke ausgewiesen.
- Vergleich der aktuellen Audit-Erfolgsquote mit bis zu fünf zuvor gespeicherten Läufen; der Trend ist nur bei vergleichbarer Prüfgrundlage aussagekräftig.

### 11.6 Sicherheits- und Wahrheitsregeln
- Standardlauf: keine externen Provideraufrufe, keine Toolausführung, keine Sandbox-Dispatches, keine Memory-/Datenbankmutation und kein Modellgewichtswechsel.
- Optionale LLM-Live-Probe: genau ein begrenzter externer Modellaufruf; Antwortinhalt und Secrets werden nicht in den Diagnosebericht übernommen.
- Der Audit erstellt keine automatischen Code- oder Prompt-Korrekturen. Er liefert Belege und Empfehlungen; Änderungen bleiben Admin-reviewpflichtig.
- Subjektive Natürlichkeit, Ironie, semantische Tiefe und langfristige Lernkurven benötigen zusätzliche unabhängige Bewertungen und reale Verlaufsdaten.

### 11.7 Umsetzungsstatus
- Implementiert: `backend/messinho-full-stack-audit.js`, Integration in die Admin-MESSINHO-Diagnose, sichtbare Admin-Option für die optionale Live-LLM-Probe und Regressionstests.
- Implementiert: AST-basierte Export-/Modulintrospektion, synthetische Sprach-/Reasoning-Tests, Sandbox-Konfigurationsprüfung, Parameter-Fuzzing, Memory-Filter-/Ähnlichkeitstest und Prompt-Injection-Grenztest.
- Noch offen: echter Provider-Stresstest mit variablen Kontextlängen, XML-/weitere strukturierte Ausgabeformate, echte Container-Ressourcenmetriken, End-to-End-Tool-Fuzzing in kurzlebiger Sandbox, reale Embedding-/Vektorsuche und unabhängige Qualitätsbewertung durch ein Judge-Modell.
- Technische CI-Abnahme am 2026-11-28: 779/779 Tests, Backend-Syntax und Vite-Build erfolgreich; isolierter Sandbox-Baseline-Lauf erfolgreich mit Exitcode 0. Render-STAGING-Deployment `dep-dc5br4l6e07s73a6toug` ist LIVE. Der manuelle Admin-Diagnoselauf und die optionale Provider-Live-Probe bleiben als getrennte Abnahmeschritte offen.
