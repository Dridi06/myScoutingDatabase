# MESSINHO — Programmier-Sprachcurriculum 1.0.0

Stand: 2026-11-27  
Geltungsbereich: ausschließlich myScoutingDatabase / MESSINHO

## Ziel

MESSINHO erhält versioniertes, wiederverwendbares Grundlagenwissen zu den wichtigsten Programmiersprachen. Die Profile beschreiben Kernkonzepte, Laufzeitmodell, typische Werkzeuge, Sicherheitsrisiken und überprüfbare Lernziele. Sie werden bei der technischen Selbstprüfung in den Programmier-Lernkontext geladen.

Dieses Curriculum verändert keine Modellgewichte. Es ist dauerhaftes Projektwissen im Repository. Neue Inhalte werden erst nach Quellenprüfung, Versionsabgleich, Testbelegen und Admin-Freigabe als verifiziertes Wissen übernommen.

## Sprachen und Reihenfolge

| Priorität | Sprache / Technologie | Schwerpunkt |
|---:|---|---|
| 1 | JavaScript und TypeScript | Web-Frontend, Node.js, APIs, asynchrone Abläufe |
| 2 | Python | Backend, Datenanalyse, Automatisierung, KI |
| 3 | SQL / PostgreSQL | Datenmodelle, Transaktionen, RLS, Integrität |
| 4 | HTML und CSS | Responsive, barrierearme Weboberflächen |
| 5 | Java | JVM, Enterprise-Backend, nebenläufige Services |
| 6 | C# und .NET | Backend, APIs, Datenzugriff, asynchrone Services |
| 7 | Go | Netzwerkdienste, Cloud, Goroutines und Channels |
| 8 | Rust | Ownership, Speichersicherheit und Performance |
| 9 | C und C++ | Systemprogrammierung, Speicher- und Laufzeitverständnis |
| 10 | PHP | Web-Backend, Composer und verbreitete Frameworks |
| 11 | Bash / Shell | sichere Automatisierung und CI/CD |

## Einheitliche Lernanforderungen

Für jede Sprache muss MESSINHO mindestens Folgendes beherrschen:

1. Syntax, Typmodell, Datenstrukturen und idiomatische Programmierweise.
2. Laufzeit, Speicher-/Lebensdauer-Modell und Nebenläufigkeit.
3. Module, Paketverwaltung, Build-Werkzeuge und Versionsbindung.
4. Fehlerbehandlung, Debugging und reproduzierbare Minimalbeispiele.
5. Unit-, Integrations-, Negativ-, Grenzwert- und Regressionstests.
6. Häufige Sicherheitsfehler und passende Gegenmaßnahmen.
7. Offizielle Dokumentation und versionsbezogene API-Prüfung.
8. Ein kleines Beispiel erklären, prüfen und mit Testfällen absichern.

## Lernreihenfolge

- **Grundlage:** Programmierlogik und Datenstrukturen.
- **Direkt relevant für das Projekt:** JavaScript/TypeScript, Python, SQL sowie HTML/CSS.
- **Weitere Backend-Ökosysteme:** Java und C#/.NET.
- **Nebenläufigkeit und Systemnähe:** Go und Rust.
- **Speicher- und Performanceverständnis:** C/C++.
- **Web-Ökosystem und Automatisierung:** PHP und Bash.

Die Reihenfolge priorisiert den Stack des bestehenden Projekts, nicht eine pauschale Wertung der Sprachen.

## Quellen- und Sicherheitsregeln

- Version und tatsächliche Projektumgebung zuerst feststellen; keine API-Version erraten.
- Offizielle Sprach- und Framework-Dokumentation bevorzugen.
- Community-Beiträge nur ergänzend und auf Aktualität prüfen.
- Keine Codebeispiele ungeprüft ausführen.
- Keine Shell-, Netzwerk-, Datei-, Datenbank- oder Deploymentaktionen aus Lernmaterial ableiten.
- Keine Secrets, echten Zugangsdaten oder personenbezogenen Daten in Beispiele übernehmen.
- Unklare Herkunft, Lizenz, widersprüchliche oder veraltete Inhalte kennzeichnen.
- Neue Wissenseinträge erst nach Admin-Freigabe dauerhaft als verifiziert markieren.

## Technische Einbindung

- Definitionen: `backend/messinho-programming-languages.js`
- Gemeinsamer Lernkontext: `backend/messinho-programming-learning.js`
- Regressionstests: `tests/messinho-programming-learning.test.js`

MESSINHOs Engineering-Reviewer erhält diese Profile über `buildMessinhoProgrammingLearningContext()`. Der Lernkontext ist versioniert und deterministisch. Ein erfolgreicher Test des Curriculums belegt die Struktur und Einbindung, nicht automatisch praktische Meisterschaft in jeder Sprache.
