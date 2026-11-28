# MESSINHO — Integrationsinventar und Phase-0-Bestandsaufnahme

Stand: 28.11.2026  
Branch: `feature/messinho-conversation-engine`  
Untersuchter HEAD: `9adb572f3f1486bebe3883597200a2d304ecea60`  
Umgebung: ausschließlich STAGING

## 1. Umfang des Repository-Bestands

Die Git-Baumaufnahme des untersuchten Commits enthält:
- 78 JavaScript-Dateien unter `backend/`
- 88 Testdateien unter `tests/*.test.js`
- 64 SQL-Migrationen unter `supabase/migrations/`
- 16 MESSINHO-spezifische Dokumente unter `docs/MESSINHO_*`

Diese Zahlen sind ein Dateiinventar, kein Beleg dafür, dass jede Funktion vollständig implementiert, integriert oder im laufenden STAGING-System fachlich abgenommen ist.

## 2. Zentrale Architekturkomponenten — erster Funktions- und Integrationsbefund

| Schicht | Erkannte Implementierungen | Erster Befund |
|---|---|---|
| Sprache | `messinho-linguistic-intelligence.js`, `messinho-grammar-engine.js`, `messinho-semantic-relations.js`, `messinho-sentence-structure.js`, `messinho-input-correction.js`, `messinho-language-knowledge.js` | Mehrere getrennte Bausteine vorhanden; gemeinsame Qualitätsabnahme und vollständige Ende-zu-Ende-Verkettung noch nachzuweisen |
| Dialog/Kontext | `messinho-dialogue-engine.js`, `messinho-dialogue-adaptation.js`, `messinho-conversation-continuity.js`, `messinho-clarification-continuity.js`, `messinho-entity-resolution.js`, `messinho-conversation-memory.js`, `messinho-response-composition.js` | Viele Kontextmodule vorhanden und im Server-Chatpfad eingebunden; Qualität über längere freie Dialoge noch zu benchmarken |
| Kognitive Entscheidung | `messinho-conversational-intelligence.js` | Wird in `server.js` aufgerufen; hängt aktuell an `messinho-model-runtime.js` und damit an einer konfigurierbaren externen Modelllaufzeit |
| Antwortgenerierung | `messinho-natural-conversation.js` sowie zusätzlicher freier Chatpfad in `server.js` | Mehrere Antwortpfade bestehen; zentraler freier Chatpfad enthält direkten OpenAI-Aufruf |
| Wissen | `messinho-core-knowledge.js`, `messinho-domain-knowledge.js`, `messinho-knowledge-graph.js`, `messinho-knowledge-memory.js`, `messinho-knowledge-learning.js`, `messinho-approved-knowledge-learning.js` | Wissensspeicher, Graph, kuratierte Basis und Lernpfade vorhanden; fachliche Abdeckung, Quellenqualität und Retrieval-Güte müssen je Domäne gemessen werden |
| Reasoning/Prüfung | `messinho-reasoning-context.js`, `messinho-reasoning-intelligence.js`, `messinho-reasoning-validation.js`, `messinho-answer-verification.js`, `messinho-conversation-response-guard.js` | Kontext- und Prüfmodule vorhanden; kein Beleg, dass bereits ein vollständiger unabhängiger Reasoning-Prozess alle Antworten erzeugt |
| Mathematik | `messinho-math.js` | Deterministischer Rechner vorhanden; aktueller Test-/Funktionsumfang muss gegen den breiten Mathematik-/Naturwissenschaftsplan geprüft werden |
| Agenten/Tools | `messinho-agent-core.js`, `messinho-autonomy.js`, `messinho-orchestrator.js`, `messinho-capabilities.js`, `messinho-capability-runtime.js`, `messinho-background-worker.js` | Planungs- und Ausführungsbausteine vorhanden; echte End-to-End-Fähigkeit, Abbruch, Wiederaufnahme und Rechteprüfung sind separat nachzuweisen |
| Lernen/Governance | `messinho-learning.js`, `messinho-feedback.js`, `messinho-evolution.js`, `messinho-improvement-governance.js`, `messinho-approved-knowledge-learning.js` | Kontroll- und Freigabebausteine vorhanden; nicht mit eigenständigem Training von Modellgewichten gleichzusetzen |
| Sicherheit/Zugriff | `messinho-access.js`, `messinho-command-access.js`, `messinho-rights-registry.js`, `messinho-task-policy.js` | Spezifische Sicherheitsmodule vorhanden; rollen-/mandantenbezogene Negativtests bleiben Teil der Gates |

## 3. Nachgewiesene zentrale Modell-/Providerabhängigkeiten

### 3.1 Gemeinsame Modelllaufzeit
Datei: `backend/messinho-model-runtime.js`
- `resolveMessinhoModelConfig()` fällt aktuell auf `OPENAI_BASE_URL` bzw. `https://api.openai.com/v1` zurück.
- API-Key und Modellname fallen auf `OPENAI_API_KEY` bzw. `OPENAI_MODEL` zurück.
- Standardmodell ist aktuell `gpt-4.1-mini`.
- `requestMessinhoModelCompletion()` nutzt ein OpenAI-kompatibles Chat-Completions-Protokoll.

Aufrufer:
- `backend/messinho-conversational-intelligence.js`: semantische/kognitive Turn-Klassifikation.
- `backend/messinho-natural-conversation.js`: natürliche Antwortgenerierung.

### 3.2 Direkte OpenAI-Aufrufe im Server
Datei: `backend/server.js`
- Zeilenbereich ca. 1175: Spielersuche/Discovery — externe Tavily-Suchergebnisse werden durch OpenAI strukturiert und bewertet.
- Zeilenbereich ca. 1282: Spielersuche/Spieleranalyse — Suchtreffer werden durch OpenAI analysiert.
- Zeilenbereich ca. 2717: Spieler-Folgeanalyse anhand zuvor gespeicherter Quellen.
- Zeilenbereich ca. 2935: freier allgemeiner Gesprächspfad — ohne `OPENAI_API_KEY` wird freie Unterhaltung ausdrücklich abgewiesen.
- Kognitive Klassifikation und natürliche Antwortpfade reichen zusätzlich `OPENAI_*` als Fallback an die gemeinsame Modelllaufzeit weiter (Serverbereiche ca. 2437–2550).

### 3.3 Separater Engineering-Agent
Datei: `backend/messinho-myki-engineer.js`
- Liest direkt `OPENAI_API_KEY`.
- Ruft direkt `https://api.openai.com/v1/chat/completions` auf.
- Nutzt `OPENAI_MODEL` bzw. `gpt-4.1-mini`.
- Dies ist ein eigenständiger Providerpfad außerhalb des gemeinsamen Modell-Runtimes.

### 3.4 Diagnose-/Statuskopplung
Datei: `backend/server.js`
- Diagnoseabschnitt bezeichnet OpenAI als optionale Anbindung.
- `/api/health` meldet OpenAI als optionales KI-Analyse-Dependency.
- Start-Log zeigt OpenAI-Key-Status und OpenAI-Modell.
- Spielersuche verlangt derzeit Tavily- und OpenAI-Key gemeinsam.

Folgerung: Die bisherige Beschreibung „OpenAI optional“ trifft nicht auf alle tatsächlichen Fähigkeiten zu. Insbesondere freie Unterhaltung und mehrere Analyse-/Agentenpfade sind aktuell direkt oder indirekt davon abhängig.

## 4. Provider-/Fähigkeitsmatrix — erste Version

| Fähigkeit | Daten-/Toolabhängigkeit | Modellabhängigkeit | Status |
|---|---|---|---|
| Deterministische Begrüßung/Smalltalk-Regeln | lokal im Backend | keine | begrenzter Regelpfad vorhanden; kein Ersatz für offene Gesprächsfähigkeit |
| Freie Unterhaltung | Gesprächshistorie und Wissenskontext | aktuell OpenAI direkt im Server bzw. Modellruntime | externe Abhängigkeit nachgewiesen |
| Kognitive Intent-/Dialogentscheidung | Kontextmodule und Historie | aktuell Modellruntime mit OpenAI-Default/Fallback | externe Abhängigkeit nachgewiesen |
| Spielerrecherche | Tavily | OpenAI für Extraktion/Analyse | zwei getrennte externe Abhängigkeiten |
| Spieler-Folgeanalyse | gespeicherte Recherchebelege | direkter OpenAI-Aufruf | externe Abhängigkeit nachgewiesen |
| Mathematikresolver | strukturierte Eingabe | keine für unterstützte deterministische Fälle | Teilfähigkeit vorhanden |
| Core-/Domain-Knowledge Retrieval | interne Wissensdaten und Datenbank | Retrieval selbst ohne LLM | Abdeckung und Antwortkomposition separat zu prüfen |
| Agenten-/Capability-Ausführung | interne Capabilities, Datenbank und Rechte | Planungsteile deterministisch; Gesamtrouting abhängig vom kognitiven Modellpfad | Integrationsprüfung offen |
| Engineering-Vorschlag | GitHub-/Sandbox-Kontext | direkter OpenAI-Aufruf | externe Abhängigkeit nachgewiesen |

## 5. Vorläufige Integrationsrisiken

1. **Mehrere Gesprächs-/Antwortpfade:** Der Server hat deterministische Social-Replies, kognitive Klassifikation, Natural-Conversation-Generierung und einen zusätzlichen allgemeinen Chatpfad. Diese Pfade können unterschiedliche Fähigkeiten/Verhaltensweisen liefern. Ein einheitlicher, getesteter Dialogvertrag fehlt als nachgewiesener Abschluss.
2. **OpenAI ist keine bloß optionale Komponente:** Der freie Chatpfad verweigert freie Unterhaltung ohne OpenAI-Key. Die gemeinsame Modellruntime hat OpenAI als Standard. Weitere direkte Aufrufe bestehen in Scouting und Engineering.
3. **Fachwissen ist nicht gleich allgemeine Intelligenz:** Dateien und Wissensdomänen belegen Architekturarbeit, nicht automatisch umfassende, korrekte Beantwortung über diese Fachgebiete.
4. **Agentenmodule sind nicht gleich autonomer Gesamtagent:** Vorhandene Planer und Capability-Ausführer müssen durch End-to-End-Tests mit Rollen, Budgets, Fehlern, Abbruch und Wiederaufnahme verbunden nachgewiesen werden.
5. **Diagnosebezeichnungen können Abhängigkeiten verharmlosen:** Die Diagnose führt OpenAI als optional, obwohl freie Unterhaltung und konkrete Funktionen davon abhängen.

## 6. Noch offene Phase-0-Arbeiten

- Vollständige Import-/Abhängigkeitskarte für alle 78 Backend-Dateien und Verknüpfung zu den 88 Testdateien erstellen.
- Alle direkten Providerzugriffe im gesamten Repository (nicht nur den geprüften Server- und Kernmodulen) vollständig scannen.
- Jeden Server-Endpunkt und Hintergrundjob einer Capability, Datenquelle, Berechtigung und Providerabhängigkeit zuordnen.
- Supabase-Migrationen den Tabellen/Funktionen zuordnen und den tatsächlichen STAGING-Schema-Stand nur lesend verifizieren.
- Testabdeckung pro Modul und echte End-to-End-Aufrufpfade ermitteln.
- Laufendes STAGING-Deployment, Commitgleichheit und Health-/Diagnosestatus prüfen.
- Offene Integrationslücken priorisieren und Gate 0 erst nach Belegen schließen.

## 7. Phase-0-Status

**Status: IN ARBEIT — Gate 0 NICHT bestanden.**

Belegt ist ein erster Repository-/Dateibestand und die oben genannten Provideraufrufe. Noch nicht belegt sind die vollständige Abhängigkeitskarte, alle Repository-weiten Providerzugriffe, die Testzuordnung aller Module, der tatsächliche STAGING-Schemaabgleich und die vollständige Laufzeitabnahme.

**Nächster konkreter Schritt:** Vollständige automatisierte Import-/Providerinventur über alle Backend- und Frontend-Dateien erstellen und jeden Provideraufruf einem Feature und Test zuordnen. Danach Datenbank-/Endpoint-/Deployment-Abgleich abschließen.

Production wurde in dieser Bestandsaufnahme nicht verändert.


## 8. Repositoryweite Providerinventur — AST-basiert (28.11.2026)

### Implementierung
- backend/messinho-project-audit.js enthält jetzt scanMessinhoProviderReferences() und buildMessinhoProviderInventory().
- Die Prüfung verwendet den vorhandenen Babel-AST-Parser. Sie erfasst Provider-URL-Literale, direkte HTTP-Aufrufe, SDK-Imports und Provider-Environment-Referenzen mit Datei-/Zeilenangabe.
- Runtime-Quellcode (backend/, src/) und Testreferenzen (tests/) werden getrennt klassifiziert.
- Secret-Werte werden weder gelesen noch ausgegeben. Die Prüfung führt keine Provideraufrufe und keinen Anwendungscode aus.
- Der Projekt-Audit weist verbleibende direkte OpenAI-Abhängigkeiten jetzt als eigenen Warnbefund aus.

### Tatsächlicher Scan des Repository-HEAD 7c074e29c5e9b227fb05d54f2a2788828c04fa30
- Untersuchte Runtime-Dateien mit Providerreferenzen: **7**
- Runtime-Providerreferenzen insgesamt: **105**
- OpenAI-Referenzen: **69** in 7 Dateien:
  - backend/messinho-engineering-scheduler.js
  - backend/messinho-general-research.js
  - backend/messinho-model-runtime.js
  - backend/messinho-myki-engineer.js
  - backend/messinho-quality-control.js
  - backend/messinho-research.js
  - backend/server.js
- Erkannte direkte OpenAI-HTTP-Aufrufstellen: **4**
- OpenAI-Environment-Referenzen: **46**
- OpenAI-URL-Literale: **15**
- Providerneutrale Modellkonfiguration: **15 Referenzen** in backend/messinho-model-runtime.js und backend/server.js.
- Tavily: **20 Referenzen** in backend/messinho-general-research.js, backend/messinho-research.js und backend/server.js.
- Ein local_or_self_hosted-URL-Literal wurde erkannt. Das ist **kein** Nachweis für einen bereitgestellten, erreichbaren oder getesteten lokalen Inferenzdienst.

### Test- und CI-Nachweis
- GitHub Actions Node-Tests: Run 46155954807, **804 bestanden / 0 fehlgeschlagen**.
- GitHub Actions Backend-Syntax: Run 46155958958, **success**.
- GitHub Actions Node-Tests auf dem gleichen HEAD: Run 46155959018, **success**.
- GitHub Actions Staging-Branch-CI: Run 46155958962, **success**.
- Die Repository-weite Providerinventur wird durch einen Integrationstest ausgeführt und gibt nur Referenzmetadaten, keine Geheimnisse, aus.

### Live-Staging-Befund — nur Logs gelesen
- Render-Staging-Service: srv-dc3chlqjnfac73acd6ig.
- Letztes geprüftes Live-Deployment: dep-dc5e1agu01pc738e0dr0, Status live, aber auf Commit 46ddebed678b495d7575e8548ecf0c0369c3967a; damit **nicht** identisch mit dem neueren Inventar-/Audit-HEAD.
- Staging autoDeploy ist deaktiviert. Ein aktualisiertes Deployment erfordert nach bestandener CI einen expliziten Staging-Deploy.
- Startlogs bestätigen API-Start, Supabase Data API HTTP 200 und konfigurierte Tavily-/OpenAI-Variablen. Das bestätigt keine erfolgreiche Modellantwort.
- Ein Runtime-Log vom 28.11.2026 meldete beim kognitiven Router HTTP 429, Fehlercode credit_balance_exhausted. Der aktuell konfigurierte OpenAI-Pfad kann daher trotz vorhandenem Schlüssel durch fehlendes Provider-Guthaben blockiert sein. Ein Code-Retry kann fehlendes Guthaben nicht beheben.
- Production-Service und Production-Daten wurden nicht verändert.

### Phase-0-Restarbeiten
1. Alle direkten OpenAI-Aufrufstellen anhand AST-Referenzen und Funktionskontext einzeln den Features und Tests zuordnen.
2. Alle Providerzugriffe in backend/, src/, Scheduler-/Worker-Modulen und Build-/Runtime-Konfigurationen gegen die Inventur abgleichen; dynamische URL-Konstruktion bleibt eine statische Auditgrenze.
3. Server-Routen, Hintergrundjobs, Capabilities und Datenbanktabellen/-funktionen zu einer durchgängigen Funktions-/Berechtigungsmatrix verbinden.
4. Tatsächlichen STAGING-Schema- und Deployment-Commit lesend abgleichen; erst danach Gate 0 bewerten.
5. Providerentkopplung erst nach abgeschlossenem Inventar schrittweise umsetzen. Keine vorschnelle Umleitung auf einen nicht vorhandenen lokalen Modellserver.

**Status:** Providerinventur implementiert und CI-geprüft. Gate 0 bleibt **OFFEN**, bis die vollständige Feature-/Route-/Job-/Schema-Matrix und der STAGING-Abgleich abgeschlossen sind.


## 9. Providerneutrale Sprachlaufzeit im bestehenden Chat — 28.11.2026

### Änderung
- Der bestehende freie Chatpfad in backend/server.js verwendet jetzt resolveMessinhoModelConfig() und requestMessinhoModelCompletion() aus backend/messinho-model-runtime.js.
- Der Chat liest bevorzugt MESSINHO_MODEL_BASE_URL, MESSINHO_MODEL_API_KEY und MESSINHO_MODEL_NAME.
- Die bisherigen OPENAI_BASE_URL, OPENAI_API_KEY und OPENAI_MODEL bleiben vorläufige Kompatibilitäts-Fallbacks. OpenAI ist damit weiterhin als temporärer Sprachdienst nutzbar, aber der eigentliche Chatpfad ist nicht mehr direkt an dessen URL-/HTTP-Protokollcode gebunden.
- Lokale/self-hosted OpenAI-kompatible Endpunkte können ohne gehosteten API-Key konfiguriert werden, sofern die URL als localhost/127.0.0.1/::1 erkannt wird.
- Modellfehler werden als begrenzte Status-/Fehlercodes verarbeitet; Schlüssel und Antwortkörper werden nicht protokolliert.
- Bestehende deterministic Smalltalk-, Wissens-, Mathematik-, Recherche- und Agentenpfade bleiben erhalten. Es wurde keine zweite Chatoberfläche hinzugefügt.

### Tests
- tests/messinho-model-runtime.test.js erweitert: Priorität der MESSINHO-Variablen vor Legacy-OpenAI-Konfiguration, Legacy-Fallback, lokale Keyfreiheit, Quota-Fehler und Secret-Schutz.
- Änderungen auf Branch HEAD 677033bc57dce2f9af4082f2e5ba0782bbbe3d39.
- GitHub Actions für diesen HEAD: Node-Tests, Backend-Syntax und Staging-Branch-CI wurden gestartet; Ergebnisse zum Zeitpunkt dieses Eintrags noch nicht abschließend verifiziert.
- Das Live-Staging läuft weiterhin auf einem älteren Deployment-Commit; diese Änderung wurde noch nicht deployed.

### Bewusste Grenze
Diese Änderung entkoppelt nur die freie Unterhaltung vom direkten OpenAI-Aufruf. Die Spielersuche/Discovery, bestimmte Spieler-Folgeanalysen und MyKi-Engineering besitzen noch direkte Providerzugriffe. Sie werden einzeln migriert, nachdem jeder Pfad einem konkreten Vertrag und Regressionstest zugeordnet ist. Die ASI-Recherche über Tavily bleibt ein eigenständiger Rechercheanbieter und wird nicht mit dem Sprachmodell verwechselt.

## 10. Lesender Route-/Schema-/Migrationsabgleich — 28.11.2026

### Backend-Routen
- AST-/Quelltextinventur von backend/server.js: **75 explizite Express-Routen**.
- Enthalten sind Authentifizierung, Scout- und Spielerverwaltung, Support-Tickets, ASI-Spielersuche, MESSINHO-Capabilities, Wissen/Review, Feedback/Lernen, Vorhersage/Entwicklung, Agentenaufgaben, Admin-Diagnose und der bestehende Chat POST /api/agent/chat.
- Routenliste und Middleware-Zuordnung sind noch nicht vollständig als maschinenprüfbare Berechtigungs-Matrix verifiziert. Die reine Existenz einer Route gilt nicht als Nachweis eines erfolgreichen oder korrekt autorisierten End-to-End-Ablaufs.
- Für jede Route sind HTTP-Methode, Authentifizierungsweg, Rollen-/Owner-Scope, Eingabeschema, Datenbanktabellen, externe Abhängigkeiten, Tests und Audit-Log-Zuordnung zu dokumentieren.

### Tatsächliches STAGING-Schema
- Supabase-Projekt: myScoutingDatabase-staging, Region eu-central-1.
- 43 öffentliche Tabellen; alle 43 mit aktiviertem RLS.
- 24 MESSINHO-Tabellen und 13 ASI-Tabellen.
- Relevante persistente Daten: 44 Chatnachrichten, 84 Sprachwissenseinträge, 20 MESSINHO-Diagnosen, 11 Engineering-Review-Runs, 2 MyKi-Tickets.
- Diese Zählwerte beschreiben den lesend ermittelten STAGING-Zustand, nicht die Vollständigkeit oder fachliche Qualität der Inhalte.
- Der Agent-Control-Datensatz steht auf einem pausierten Zustand; autonome Entwicklungsarbeit darf nicht als live aktiv behauptet werden.

### Migrationen — wichtiger Befund
- Im aktuellen Branch wurden 64 SQL-Dateien unter supabase/migrations/ gefunden; Supabase registriert 74 Migrationsdatensätze.
- Ein einfacher Vergleich der Migrationsnamen ergibt 13 DB-Namen ohne exakte normalisierte Dateinamensentsprechung und 6 Dateien ohne exakte normalisierte DB-Namensentsprechung. Mehrere Einträge sind offenbar unterschiedlich benannte historische/neu benannte Migrationen.
- Dieser Namensvergleich beweist **keine** Schemaabweichung und beweist ebenso wenig, dass alle SQL-Inhalte identisch sind.
- Die Tabellenstruktur enthält zahlreiche bereits vorhandene MESSINHO-/ASI-Objekte, die durch Migrationen mit abweichenden Namen angelegt worden sein können.
- **Sicherheitsentscheidung:** Keine Migration nachträglich als angewendet markieren, keine Migration erneut ausführen und keine Schemaänderung durchführen, bevor Dateiinhalte, Migrationshistorie, tatsächliche Tabellen/Spalten/Constraints/Policies/Funktionen und gegebenenfalls SQL-Diffs einzeln abgeglichen sind.

### Offene Phase-0-Nachweise
1. Alle 75 Routen vollständig mit Authentifizierung, Rollen, Owner-Scope, Tabellen, Fähigkeiten und Tests verbinden.
2. Hintergrundworker und Engineering-Scheduler mit ihren Triggern, Laufzeitbedingungen, Locks, Stop-Gates und Datenzugriffen erfassen.
3. Migrationen anhand tatsächlicher SQL-Inhalte und pg_catalog-/RLS-/Policy-/Function-Struktur abgleichen; Namensabweichungen einzeln auflösen.
4. Providerzugriffe außerhalb des freien Chats migrieren und Regressionstests ergänzen.
5. CI auf aktuellem HEAD abschließend verifizieren, danach kontrollierter Staging-Deploy und authentifizierter Smoke-/Smalltalk-Test. Production bleibt unangetastet.

**Gate 0 bleibt OFFEN.** Keine Datenbankmigration und kein Staging-Deployment in diesem Schritt.
