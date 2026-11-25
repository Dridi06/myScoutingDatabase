# ASI Market Value Engine – Open-Source Data Source Register

**Stand:** 25.11.2026  
**Zweck:** Quellen für eine eigenständige ASI-Marktwertindikation erfassen. „Kostenlos abrufbar“ bedeutet nicht automatisch „kommerziell frei nutzbar“. Jede Quelle muss vor Import durch ein dokumentiertes Rights-Gate.

## 1. Source policy

Jeder Connector bekommt einen Zustand:
- `approved_public`: Lizenz und konkrete Nutzung geprüft; nur genehmigte Felder/Zwecke.
- `research_only`: nur Forschung/Prototyping gemäß Anbieterbedingungen; keine produktive kommerzielle Nutzung.
- `manual_only`: manuelle Recherche/Link, kein automatischer Abruf.
- `blocked`: Nutzungsbedingungen, Herkunft oder Datenbankrechte ungeklärt bzw. untersagen geplante Nutzung.

Für jede Quelle dokumentieren: Betreiber, Dataset/Version, URL, Lizenz/AGB-Version, kommerzielle Nutzung, Speicherung, Weitergabe, abgeleitete Daten/Modelltraining, Attribution, Abrufmethode, erlaubte Felder, letzte Rechtsprüfung und Ablaufdatum.

Keine Scraper, keine Umgehung von robots.txt/Rate-Limits/AGB. Öffentliche Suchmaschinen-Snippets sind Hinweise und kein verlässlicher Datensatz oder Nutzungsrecht.

## 2. Quellenregister (Priorität und Grenzen)

| Quelle | Nutzbarer Inhalt | Einsatz im ASI | Rechte-/Qualitätsstatus |
|---|---|---|---|
| Reep Register | Spieler-/Team-Identitäten und Provider-ID-Verknüpfungen | Primärer Identitäts-Crosswalk | Register-Download CC0 laut Projekt; Provider-IDs/verbundene Daten behalten jeweils eigene Rechte. |
| StatsBomb Open Data | Ereignisse, Aufstellungen, ausgewählte 360-Daten und Wettbewerbe | Tiefe Leistungsmerkmale für abgedeckte Wettbewerbe; Attribution und Logo-Hinweis beachten | Eigene Custom-Attribution-Bedingungen; zunächst Research/Prototyping. Vor kommerziellem Produktbetrieb schriftliche/aktuelle Lizenzbedingungen verifizieren. |
| Wyscout Pappalardo et al. | Historische Ereignisdaten (Big Five 2017/18, WC 2018, Euro 2016) | Forschung/Feature-Entwicklung und historische Benchmarks | CC BY 4.0 laut Datensatzverzeichnis; Attribution und ursprüngliche Publikationsbedingungen beachten. Alt und begrenzte Abdeckung. |
| Impect Open Data | Bundesliga 2023/24 Eventdaten und KPIs (Packing, xG, pxT) | Positions-/Rollenleistungsmerkmale | Lizenz und konkrete kommerzielle Nutzung vor Import einzeln verifizieren; bis dahin Research-only. |
| American Soccer Analysis | Öffentliche API und MLS/NWSL/USL-Metriken (xG, g+, xPass u. a.) | Nordamerika-spezifische Leistungsmerkmale | API-/Datennutzungsbedingungen vor produktiver kommerzieller Nutzung prüfen. |
| football-data.org Free | Fixtures, Ergebnisse, Tabellen; 12 Wettbewerbe, verzögerte Daten und 10 Calls/Minute im Free-Tarif | Kontext, Resultate, Ligaform; keine Marktwertquelle und keine ausreichenden detaillierten Spielerleistungsdaten | Kostenloser Tarif; API-Bedingungen und Limits einhalten. |
| openfootball | Öffentliche Fixtures/Ergebnisse, JSON-Datensätze | Historischer Team-/Wettbewerbskontext | Je Repository/Dataset Lizenz prüfen; nicht als Spielerleistungs- oder Marktwertquelle behandeln. |
| football-data.co.uk | Historische Ergebnisse, Teamstatistiken und Quoten in CSV | Team-/Wettbewerbskontext, nicht individueller Spielerwert | Lizenz/kommerzieller Gebrauch und Datenherkunft vor Nutzung verifizieren. |
| FBref | Spieler-, Team- und Wettbewerbsstatistiken | Potenziell sehr nützlich für Leistungsfeatures | Kein automatisiertes Scraping. Terms/Zugriff/kommerzielle Nutzung und Datenrechte vor Connector prüfen; bis dahin manuelle Recherche oder gesperrt. |
| Understat | Schussdaten/xG in ausgewählten Ligen | Potenziell Stürmer-/Offensivmerkmale | Automatisierte Zugriffe können durch Website-Regeln ausgeschlossen sein; kein Scraper. Erst nach ausdrücklicher Freigabe. |
| Wikidata | Identität, Geburtsdatum, Nationalität, Vereins-/Karrierebeziehungen soweit gepflegt | Identitätsauflösung und Kontext | Datenbank-Inhalte CC0; Aussagen/Statements und externe Links separat prüfen. |
| Kaggle | Unterschiedliche historische Datensätze (z. B. FIFA/EA-Spielerratings) | Nur Zusatz-/Proxy-Merkmale und Forschung | Jedes Dataset hat eigene Lizenz. FIFA/EA Ratings sind Videospielratings, keine reale Scout- oder Marktwert-Wahrheit. |
| Metrica Sports sample data | Kleine anonymisierte Event-/Tracking-Beispiele | Methodik-/Testdaten für Trackingmodelle | Datensatzlizenz prüfen; sehr kleine Stichprobe, nicht für Marktwertmodell trainieren. |
| SkillCorner Open Data | Kleine Zahl anonymisierter Tracking-Matches | Forschung zu Laufwegen/Tracking-Features | CC BY-NC-SA laut Quellenverzeichnis; nicht für kommerzielles Produkttraining/-betrieb ohne passende Rechte. |
| GitHub Open Football Index | Verzeichnis zu weiteren offenen Quellen | Laufende Quellenermittlung | Index selbst CC0; verlinkte Daten haben ihre eigenen Lizenzen. Kein pauschaler Rechtepass. |

## 3. Besonders kritische Datensätze

### Transfermarkt-abgeleitete Transferdaten (nicht automatisch freigegeben)

Das Dataset `TiagoCumetti/football_transfers_dataset` beschreibt 141.538 Transfers, 41.734 Spieler, 1.531 Clubs und 50 Ligen (2005–2024) und führt CC BY 4.0 an. Das README erklärt zugleich, dass Transferhistorien von öffentlich zugänglichen Transfermarkt-Seiten gesammelt wurden und die Vorverarbeitung Marktwerte voraussetzt.

**Entscheidung:** Nicht in produktive ASI-Datenbank importieren und nicht zum Training/Kalibrieren verwenden, bis Herkunftsrechte, Datenbankrechte und die Befugnis zur Weiterlizenzierung unabhängig geklärt sind. Eine GitHub- oder Dataset-Lizenz des Uploader-Repositories ist nicht automatisch ein Nachweis, dass Rechte an der zugrundeliegenden Drittanbieter-Datenbank eingeräumt werden konnten. Gleiches gilt für andere Transfermarkt-Dumps, Repackages und Scraper-Repositories.

### StatsBomb

StatsBomb Open Data eignet sich für ausgewählte historische Ereignisanalysen. Die veröffentlichte Repository-Dokumentation verlangt bei Veröffentlichung/Weitergabe von Analysen Quellenangabe und Logo. Das ist keine pauschale kommerzielle Lizenz für die Integration in ein geschlossenes Scouting-Produkt. Vor produktiver kommerzieller Nutzung Terms und Freigabe verifizieren.

### football-data.org

Der kostenlose Tarif bietet laut Preisseite 12 Wettbewerbe, verzögerte Scores/Spielpläne/Tabellen und 10 Calls/Minute. Er liefert keine fertigen Marktwerte und ersetzt keine detaillierte Spielerleistungsdatenbank. Nur für Kontext und Resultate einplanen.

## 4. Marktwertmodell: was tatsächlich geschätzt wird

ASI schätzt einen hypothetischen wirtschaftlichen Spielerwert. Das Modell darf den Begriff „offizieller Marktwert“ nicht verwenden. Tatsächlich gezahlte Transferablösen sind Transaktionspreise, nicht identisch mit dem latenten Marktwert.

**Label-Strategie:**
1. Nur belegte und rechtmäßig nutzbare Ablösen als Trainingsziel verwenden.
2. Leihen, freie Transfers, Swaps, unbekannte Gebühren, Boni und Klauseln separat codieren und nicht als normale Ablösen behandeln.
3. Wenn keine ausreichend rechtmäßig nutzbaren Ablösedaten vorhanden sind, eine transparente regel-/vergleichsbasierte Indikation mit niedriger Vertrauensstufe ausgeben oder den Wert unterdrücken.
4. Transfermarkt-Schätzwerte werden weder Trainingslabel noch Kalibrierungsziel, solange keine ausdrückliche Lizenz auch für Speicherung und Modellnutzung vorliegt.

**Feature-Gruppen:**
- Alter/Karrierephase und nichtlineare Alterskurve.
- Position und taktische Rolle.
- Einsatzzeit, Startelfquote, Einsatzkontinuität.
- Rollenbezogene Eventdaten: xG, xA, Schüsse, Chancen, Progression, Pass-/Defensivaktionen, Torwartwerte.
- Per-90- und Volumenwerte getrennt.
- Liga-/Wettbewerbsniveau und Teamkontext.
- Mehrsaison-Verlauf und Leistungstrend.
- Vertragsrestlaufzeit nur aus zulässiger, verifizierter Quelle.
- Vergleichstransaktionen nach Position, Alter, Liga, Saison, Spielminuten und Transferbedingungen.

**Wichtig:** Nicht jede Datenquelle deckt jeden Spieler ab. Der Quellenindex dokumentiert ausdrücklich, dass offene Event-/Trackingdaten für Afrika, Asien und Südamerika lückenhaft sind. Deshalb kann ASI nicht für jeden Spieler dieselbe Präzision versprechen.

## 5. Ergebnisregeln

Jede Schätzung muss enthalten:
- ASI-Marktwertindikation als Intervall plus optionalen Mittelpunkt.
- Stichtag, Währung, Modellversion.
- Datenvertrauen getrennt von sportlichem Rating.
- Anzahl und Qualität der Vergleichstransaktionen.
- Quellenabdeckung nach Feature-Gruppe.
- Erklärbare wertsteigernde/-mindernde Faktoren.
- Konfidenz-/Unsicherheitsintervall und Limitations.
- Transfermarkt-Referenz ausschließlich nach dokumentierter Rechtsfreigabe.

Keine Datenbasis = kein erfundener Betrag. Fehlende Daten sind nicht automatisch negative Leistung. Keine Scheingenauigkeit bis auf einzelne Euro.

## 6. Nächste technische Schritte

1. Source Registry in vorhandene `asi_external_sources` integrieren, nachdem Spalten, Constraints und RLS geprüft wurden.
2. Für jede Quelle Connector-Status und erlaubte Felder serverseitig erzwingen.
3. Reep/Wikidata als Identitätsquellen prüfen; keine Drittanbieter-IDs als Eigentumsrechte behandeln.
4. Mit rechtmäßig freigegebenen historischen Eventdaten zunächst Performance-Features und Baseline testen.
5. Transfer-Labels nur aus Quellen importieren, deren Lizenz die konkrete Nutzung zulässt.
6. Marktwert-Runs in bestehende Prognose-/Modelltabellen integrieren, sofern Schema und RLS geeignet sind.
7. Zeitbasiertes Backtesting, Leakage-Schutz und Segmentmetriken (Position/Liga/Alter) implementieren.
8. Erst danach UI-Integration und spätere ML-Modellfreigabe.

## Quellen / Einstiegspunkte

- Open Football source index: https://github.com/withqwerty/open-football
- StatsBomb Open Data: https://github.com/statsbomb/open-data
- Reep Register: https://github.com/reep-io/reep
- Football Transfers Dataset (2005–2024): https://github.com/TiagoCumetti/football_transfers_dataset
- football-data.org pricing: https://www.football-data.org/pricing
- football-data.org coverage: https://www.football-data.org/coverage
- American Soccer Analysis: https://www.americansocceranalysis.com/
- Wikidata: https://www.wikidata.org/
- FBref: https://fbref.com/
- Understat: https://understat.com/
- football-data.co.uk: https://www.football-data.co.uk/

**Status:** Quelleninventar und Nutzungspolitik dokumentiert. Noch kein Datenimport, kein Training und keine Marktwertberechnung live ausgeführt. Alle Änderungen auf Feature-Branch/Staging; Produktion unangetastet.
