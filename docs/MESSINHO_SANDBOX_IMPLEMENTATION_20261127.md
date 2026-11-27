# MESSINHO – Isolierte Programmierumgebung (27.11.2026)

## Ziel
MESSINHO soll Änderungsvorschläge nicht nur beschreiben, sondern auf einer exakt festgehaltenen Quellversion reproduzierbar prüfen. Die Sandbox darf niemals den laufenden Render-Prozess, produktive Daten oder Zugangsdaten verwenden.

## Umgesetzte Bausteine
- `.github/sandbox/Dockerfile`: separates Compiler-Image mit Node.js 24, TypeScript, Python 3, Java, Go, Rust, C/C++, PHP, .NET 8, ShellCheck, HTML/CSS-Prüfern und PostgreSQL.
- `.github/sandbox/runner.sh`: kopiert den Quellcode und die Abhängigkeiten in ein temporäres Arbeitsverzeichnis (kein Symlink auf den read-only Dependency-Mount), prüft Baseline und Kandidaten getrennt und führt sprachspezifische Syntax-/Testprüfungen nur für tatsächlich geänderte Dateien aus.
- `.github/sandbox/engineering-memory-contract.sql`: führt einen isolierten PostgreSQL-Vertragstest für Speicherung, Idempotenz, Admin-Freigabe-Gate und Datenbankrechte durch.
- `backend/messinho-github-oidc.js`: verifiziert GitHub-Actions-Identität kryptografisch anhand der offiziellen JWKS, der festgelegten Repository-/Branch-/Workflow-Claims sowie Commit-, Run- und Attempt-Bindung. Kein statisches Callback-Geheimnis nötig.
- `.github/workflows/messinho-isolated-engineering.yml`: GitHub-Actions-Workflow mit exakter Commit-Bindung, begrenzter Patchgröße, erlaubten Pfaden, Hash- und Identitätsprüfung sowie einem nicht privilegierten Container.
- Container-Schutz: kein Netzwerk, read-only Root-Dateisystem, keine Linux-Capabilities, `no-new-privileges`, non-root Benutzer, CPU-/RAM-/Prozesslimits und nur temporäre beschreibbare Dateisysteme. Der Projekt-Checkout und die installierten Abhängigkeiten werden read-only eingebunden; Arbeitskopien verbleiben im temporären Container.
- `backend/messinho-sandbox-dispatch.js`: Auslösung ausschließlich mit expliziter Aktivierung und passender Render-STAGING-Service-ID. GitHub-Workflow wird nur für den exakten aktuellen Feature-Branch-Commit ausgelöst.
- `backend/messinho-engineering-memory.js` und `backend/messinho-engineering-memory-context.js`: Prüfung und Speicherung von Sandbox-Nachweisen. Wiederverwendung als Programmierwissen nur nach Admin-Freigabe und nur für belegte Ergebnisse.
- `supabase/migrations/20261127000600_messinho_engineering_sandbox_memory.sql`: Job-Ledger und versioniertes Programmiergedächtnis.
- Admin-myKI: bestehende UI kann Sandbox-Prüfungen starten, Status/Protokolle anzeigen und Lerneinträge freigeben oder ablehnen.

## STAGING-Datenbank
Die Migration `messinho_engineering_sandbox_memory` wurde am 27.11.2026 ausschließlich auf Supabase-Projekt `nwqwnrhupbyhshsprxjt` angewendet.
Nachprüfung:
- Beide neuen Tabellen sind vorhanden.
- RLS ist auf beiden Tabellen aktiviert.
- `anon` und `authenticated` besitzen kein SELECT-Recht.
- `service_role` besitzt die für den Backend-Prozess benötigten Rechte.
- Beide RPC-Funktionen sind ausschließlich für `service_role` ausführbar.
- Keine Spieler- oder Produktionsdaten wurden geändert.

## Verifizierte Ergebnisse und offener Ersttest
- Für Commit `ce84cbbb0f6984f592769ee392f017c46fce994f` liefen die Node-Tests mit 379 bestanden und 0 fehlgeschlagen.
- Backend-Syntaxprüfung, Staging-Branch-CI und Staging-Health-Smoke-Test liefen erfolgreich.
- Der erste isolierte Baseline-Lauf war **nicht bestanden / nicht aussagekräftig**: Die Tests waren grün, aber Vite fand `rollup` wegen einer fehlerhaften Auflösung über einen symbolischen Link des read-only Dependency-Mounts nicht. Das ist ein Fehler des Sandbox-Setups, kein nachgewiesener Projektfehler.
- Korrektur: Abhängigkeiten werden in der temporären Arbeitskopie physisch kopiert, nicht mehr per Symlink eingebunden.
- Der erneute Sandbox-Lauf für den folgenden Branch-Commit ist gestartet. Sein Ergebnis ist in diesem Dokument noch nicht als bestanden markiert.

## Noch nicht freigeschaltet
Die Sandbox bleibt absichtlich deaktiviert, bis die STAGING-Umgebung folgende Geheimnisse sicher enthält:
- `MESSINHO_SANDBOX_GITHUB_TOKEN`: eng begrenzter GitHub-Token mit Actions-Write-Recht ausschließlich für dieses Repository.
- `MESSINHO_SANDBOX_CALLBACK_SECRET`: starkes, zufälliges Geheimnis für den Ergebnis-Callback.
- `MESSINHO_SANDBOX_CALLBACK_URL`: interne STAGING-Callback-Adresse.
- `MESSINHO_SANDBOX_ENABLED=true` erst nach Eintragung und erfolgreichem Ende-zu-Ende-Test.
Der Callback wird mit GitHub OIDC abgesichert. Dafür muss der Workflow `id-token: write` besitzen; der Server akzeptiert ausschließlich signierte Tokens für das festgelegte Repository, den Feature-Branch, diesen Workflow, das Ereignis `workflow_dispatch` und den passenden Commit/Run. Ein statisches Callback-Geheimnis wird nicht verwendet.

Der eng begrenzte GitHub-Token und die explizite STAGING-Freischaltung sind noch nicht konfiguriert. Es wird nicht behauptet, dass die automatische Sandbox-Ausführung bereits für Admin-Tickets live funktioniert.

## Sicherheits- und Betriebsgrenzen
- Es wird ausschließlich `feature/messinho-unified-ai-integration` verwendet.
- Kein Merge nach `main`, keine Produktion, kein Render-Deploy in diesem Arbeitsschritt.
- Ein Sandbox-Pass ist kein automatisches Integrationsrecht. Die Freigabe eines Lernergebnisses und die Freigabe einer Code-Integration sind getrennte Entscheidungen.
- Fehlgeschlagene oder unvollständige Prüfungen werden nicht als erfolgreiches Wissen gespeichert.
- Der Code wird in einer temporären, netzwerkisolierten Umgebung geprüft; er kann sich nicht selbst in den aktiven Branch schreiben.
