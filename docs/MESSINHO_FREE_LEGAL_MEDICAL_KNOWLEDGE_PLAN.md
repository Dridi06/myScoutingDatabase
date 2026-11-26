# MESSINHO — kostenloser und rechtssicherer Medizin-Wissensaufbau

Stand: 2026-11-26
Projekt: myScoutingDatabase / MESSINHO
Branch: feature/messinho-unified-ai-integration
Umgebung: ausschließlich dediziertes STAGING

## Verbindliche Entscheidung

Der medizinisch-wissenschaftliche Wissensaufbau ist vollständig kostenlos und rechtmäßig umzusetzen. **Der Eigentümer möchte ausdrücklich keine vollständigen Bücher, PDFs oder Buchsammlungen importieren oder dauerhaft speichern.** Ziel ist, das daraus gewonnene Wissen ressourcenschonend nutzbar zu machen.

Ziel: mindestens 100 einzeln geprüfte Fachwerke als Wissens- und Quellenbasis. Die Zahl bezeichnet die geprüfte Quellenabdeckung, nicht 100 gespeicherte Bücher. MESSINHO soll aus rechtmäßig nutzbaren Quellen kompakte, eigenständig formulierte Wissenseinträge und strukturierte Fakten ableiten. Es werden nur die dafür erforderlichen Metadaten, kurzen Zusammenfassungen/Fakten, Evidenzbelege und Quellenlinks dauerhaft gespeichert. Volltexte werden – sofern rechtlich zulässig – nur temporär verarbeitet und danach verworfen; kein PDF-Archiv, kein Volltext-Dump und keine unnötige Medienkopie.

## Lizenz-Gate

„Kostenlos online lesbar“, „Open Access“ oder „Open Textbook“ bedeutet nicht automatisch, dass Inhalte in eine KI-Wissensbasis übernommen oder kommerziell genutzt werden dürfen.

Pro Werk ist zu dokumentieren:
- Titel, Autor/Herausgeber, Ausgabe, Datum, URL/DOI/ISBN
- Rechteinhaber und exakte Lizenz samt Version
- Erlaubnis für automatisierte Verarbeitung und Download
- Erlaubnis für Indexierung, Text-/Data-Mining, Embeddings und Retrieval in einer KI-Anwendung
- kommerzielle Nutzbarkeit, Bearbeitungsrecht und Weitergabe von Auszügen
- Attributions- und ShareAlike-Pflichten
- Drittmaterial-Ausnahmen für Bilder, Tabellen, Abbildungen und Anhänge
- Prüfdatum, Beleg-URL und Status

Priorität:
1. Konkret geprüftes Public-Domain-Material; US-Bundesregierungswerke können darunter fallen, aber nicht automatisch beigefügtes Drittmaterial.
2. CC0 und CC BY, sofern Rechteinhaber, Drittmaterial und KI-/TDM-Bedingungen passen.
3. Andere freie Lizenzen nur nach dokumentierter Einzelfallprüfung.

Standardmäßig ausgeschlossen bzw. bis schriftlicher Erlaubnis quarantänisiert:
- OpenStax Anatomy & Physiology 2e: OpenStax untersagt LLM-Ingestion ohne vorherige schriftliche Genehmigung, obwohl das Werk eine CC-Lizenz trägt.
- CC BY-NC / BY-NC-SA: nicht verwenden, solange kommerzielle Nutzung des Produkts nicht ausgeschlossen und rechtlich geprüft ist.
- CC BY-ND / BY-NC-ND: keine abgeleitete Wissensaufbereitung; allenfalls Metadaten/Link, soweit erlaubt.
- MSD Manuals: frei lesbar, aber Wiederverwendung, Modifikation oder öffentliche/kommerzielle Nutzung bedarf laut Rechtehinweisen schriftlicher Genehmigung.
- NCBI Bookshelf: nicht pauschal als Public Domain behandeln. Rechte sind je Werk/Seite unterschiedlich.
- Werke mit unklarer Lizenz, Drittmateriallage, Downloadbedingungen oder Login-/Paywall-Umgehung.

## Bereits geprüfte Rechts- und Suchquellen

1. NCBI Bookshelf Copyright Notice: https://www.ncbi.nlm.nih.gov/sites/books/about/copyright/
   - Rechte verbleiben beim jeweiligen Rechteinhaber.
   - Lizenzhinweise gelten je Werk und auch für zugehörige Bilder/Ergänzungen.
   - US-Regierungswerke können Public Domain sein; Drittmaterial kann ausgenommen sein.
2. NCBI Bookshelf FAQ: https://www.ncbi.nlm.nih.gov/sites/books/NBK45610/
   - Abbildungen und Tabellen müssen anhand des konkreten Werkes geprüft werden.
3. OpenStax Anatomy & Physiology 2e: https://openstax.org/books/anatomy-and-physiology-2e/pages/preface
   - LLM-Ingestion ohne vorherige schriftliche Genehmigung ausgeschlossen.
4. WHO Open Access Policy: https://www.who.int/about/policies/publishing/open-access
   - WHO-Veröffentlichungen ab 12.11.2016 grundsätzlich CC BY-NC-SA 3.0 IGO; für kommerziell nutzbare MESSINHO-Wissensbasis nicht einplanen.
5. MSD Manual FAQ: https://www.msdmanuals.com/professional/resourcespages/faqs
   - Kostenloser Zugriff ist keine Wiederverwendungslizenz.
6. Open Textbook Library FAQ: https://open.umn.edu/opentextbooks/faq
   - Discovery-Verzeichnis; Lizenz und Quelldatei müssen am jeweiligen Werk geprüft werden.
7. NLM Sports Medicine Collection Guidelines: https://www.ncbi.nlm.nih.gov/books/NBK518802/
   - Fachliche Suchlandkarte, aber kein Buchpaket und keine pauschale Wiederverwendungslizenz.
8. PubMed Central Open Access Subset: https://pmc.ncbi.nlm.nih.gov/tools/openftlist/
   - Volltextkandidaten; Lizenz und TDM-Bedingungen pro Artikel prüfen.

## Fachliche Abdeckung

- Sportmedizin und Sportverletzungen
- Orthopädie, Traumatologie, muskuloskelettale Medizin
- Allgemeinmedizin und Innere Medizin mit Sportbezug
- Anatomie, funktionelle Anatomie und Biomechanik
- Physiologie, Belastungsphysiologie und Trainingsanpassung
- Neurologie und neuromuskuläre Funktion
- Sportphysiotherapie, Rehabilitation und Return-to-Sport
- Kardiologie und Belastungsdiagnostik
- Pneumologie und Atemphysiologie
- Endokrinologie und Stoffwechsel
- Ernährungsmedizin und Flüssigkeitshaushalt
- Schlaf, Regeneration und Prävention
- Sportpsychologie nur für nicht-diagnostische, evidenzbasierte Inhalte

Zielverteilung (flexibel und abhängig von rechtmäßig verfügbaren Werken):
- Sportmedizin / Verletzungsprävention: 20
- Orthopädie / Traumatologie: 20
- Allgemeinmedizin / Innere Medizin: 15
- Anatomie / Biomechanik: 10
- Physiologie / Belastungsphysiologie: 10
- Rehabilitation / Physiotherapie: 10
- Kardiologie / Pneumologie / Neurologie: 5
- Ernährung / Stoffwechsel: 5
- Schlaf / Regeneration / Prävention: 5

## Wissenschaftliche Qualitätsregeln

- Lehrbücher liefern Grundlagen, nicht automatisch aktuelle Behandlungsstandards.
- Diagnostik- und Therapieempfehlungen benötigen zusätzlich aktuelle Leitlinien, systematische Reviews und hochwertige Primärstudien.
- Jede Aussage muss auf konkrete Quelle, Ausgabe/Version, Kapitel/Abschnitt und Datum zurückführbar sein.
- Evidenzhierarchie, Studiendesign, Population, Einschränkungen und Interessenkonflikte speichern.
- Widersprüchliche Evidenz sichtbar machen; keinen künstlichen Konsens erzeugen.
- Zeitkritische Empfehlungen erhalten Review-Daten und müssen neu recherchiert werden.
- Keine erfundenen Seitenzahlen, Zitate, DOI oder Lizenzangaben.
- Keine langen geschützten Textpassagen reproduzieren; eigene Zusammenfassungen mit Quellenangabe erstellen.

## Zielarchitektur

Die Literatur wird weder als 100 auswählbare Funktionen noch als dauerhaft gespeicherte Buch-/PDF-Sammlung eingebaut, sondern dient als geprüfte Quellenbasis für eine zentrale, automatisch genutzte, kompakte Evidenz-Wissensschicht:
1. Quellen- und Lizenzregister; Quarantäne bis Rechteprüfung abgeschlossen.
2. Rechtmäßiger, speichersparender Quellenadapter mit Rate Limits und Quellbedingungen; bevorzugt Abruf gezielter Abschnitte statt kompletter Werke.
3. Temporäre Verarbeitung zulässiger PDF/HTML/XML-Abschnitte; Rohdateien und Volltexte nach Extraktion verwerfen, sofern keine ausdrücklich erlaubte und notwendige Zwischenspeicherung besteht.
4. Kompakte, eigenständig formulierte Wissensbausteine mit fachlichen Metadaten und kontrolliertem medizinischem Vokabular.
5. Schlanker Retrieval-Index nur für notwendige Wissensbausteine, Quellen-IDs, Links, Lizenz, Version, Aktualität und Fachgebiet; keine Volltext- oder Bildersammlung.
6. Claim-Level Evidence: medizinische Aussagen verweisen auf konkrete Stellen.
7. Konflikt- und Evidenzbewertung; keine Diagnose aus unzureichenden Angaben.
8. Automatische Agenten-Anbindung: Spielerbewertung, Belastungs-/Leistungsanalyse, Präventionshinweise, Konversation und Recherche.
9. Keine automatische Änderung von Scoring-Gewichten oder medizinischen Regeln durch bloße Literaturaufnahme.
10. Kontrollierte Updates, Audit-Log und Entfernbarkeit bei Lizenzänderung.

## Medizinische Sicherheitsgrenzen

MESSINHO ist ein Scouting- und Informationssystem, kein Arzt und kein diagnostisch zugelassenes Medizinprodukt. Es darf Grundlagen erklären, allgemeine evidenzbasierte Präventions- und Belastungsinformationen bereitstellen, Studien zusammenfassen und bei Warnzeichen ärztliche Abklärung empfehlen.

Es darf keine Diagnosen oder individuellen medizinischen Freigaben vortäuschen, Verletzungen aus Leistungsdaten/Videos diagnostizieren, Return-to-Play allein entscheiden, Medikamente/Therapien individuell verordnen oder Gesundheitsdaten ohne Rechtsgrundlage verarbeiten. Medizinische Informationen bleiben vom Talent-/Scoring-Wert getrennt. DSGVO, Zweckbindung, Datenminimierung, Art. 9 DSGVO und ggf. Medizinprodukterecht sind vor entsprechender Verarbeitung gesondert zu prüfen.

## Umsetzungsphasen

Phase 0 — Lizenz-Gate und Quellregister:
- Lizenzschema und Quelleninventar anlegen.
- 100er-Zielliste erst nach Einzelfallprüfung füllen.
- OpenStax-LLM-Verbot, MSD-Copyright, WHO-NC und unklare NCBI-Rechte als Negativtests abbilden.

Phase 1 — Audit der 100 Fähigkeiten:
- Jede Katalog-ID gegen Runtime-Handler, echte Fachlogik, Agentenplan-Auswahl, Daten-/Provider-Abhängigkeiten, Rollenrechte und Tests prüfen.
- Status: vollständig integriert / teilweise integriert / datenabhängig / policy-blockiert / nicht integriert / fehlerhaft.
- Generische Fallbacks zählen nicht als vollständige Umsetzung.
- End-to-End-Beleg muss zeigen, dass der normale Chat die Fähigkeit automatisch ausgewählt, ausgeführt und validiert hat.
- Registry-/Runtime-Zählwerte sind keine Fertigstellungsquote.

Phase 2 — Medizinische Wissensbasis:
- Rechtegeprüfte Quellen importieren.
- Retrieval und Quellenbelege integrieren.
- Fachtests für orthopädische, sportmedizinische und allgemeinmedizinische Fragen erstellen.

Phase 3 — Agentenkomposition:
- Medizinwissen automatisch mit Leistungs-, Belastungs-, Positions- und Entwicklungsanalyse verbinden.
- Gesundheits-/Diagnosefragen von Talentbewertung und Scoring trennen.
- Bei fehlendem Kontext gezielte Rückfragen stellen.

Phase 4 — Qualitätssicherung und STAGING:
- Lizenztests, Parser-/Retrievaltests, Quellenkonflikte, medizinische Sicherheitsfälle, Rollen- und Datenschutztests.
- Vollständige npm test-, Syntax- und Frontend-Build-Prüfung.
- Nur manuelles STAGING-Deployment; Auto-Deploy bleibt aus.
- Erst nach verifizierter Deployment-ID/Commit und Smoke Tests als live melden.
- Authentifizierte Tests nur mit vom Eigentümer kontrollierter Sitzung.

## Arbeitsgrenzen

- Nur Dridi06/myScoutingDatabase, Branch feature/messinho-unified-ai-integration.
- Nur dediziertes Render-/Supabase-STAGING.
- Produktion, main, PFMS/PFSS und PR-Merge bleiben unangetastet.
- Render Auto-Deploy bleibt deaktiviert.
- Keine API-Keys/Zugangsdaten in Git.
- Keine kostenpflichtigen Quellen oder Dienste; keine Lizenzumgehung.
- Erkenntnisse in PROJECTSCOUT.md und diesem Dokument checkpointen.

## Status beim Anlegen

- Lizenz- und Quellenprüfung begonnen; noch keine Bücher in die KI importiert.
- 100 vollständig rechtegeprüfte Fachwerke sind noch nicht identifiziert.
- Keine medizinische Wissensdatenbank oder Migration deployed.
- Bisherige Runtime-Prüfung: 100 Katalogeinträge, Handler-Zuordnungen vorhanden, completion_verified_count = 0; generische Fallbacks und echte End-to-End-Integration müssen einzeln auditiert werden.
- OpenStax Anatomy & Physiology 2e bleibt bis zur schriftlichen Genehmigung vom KI-Import ausgeschlossen.
- NCBI Bookshelf wird nur werkbezogen nach Rechteprüfung genutzt.
- Alle nächsten Änderungen ausschließlich in STAGING und nach erfolgreicher vollständiger Test-/Build-Prüfung.


## Verbindliche Speicher- und Kostenoptimierung — Eigentümerpräzisierung 2026-11-26

- Keine vollständigen Bücher, Buch-PDFs, Kapitelarchive oder umfangreichen Volltextkorpora dauerhaft in Supabase, Render-Dateisystem, GitHub oder Objekt-Storage ablegen.
- Die 100 Werke sind eine geprüfte externe Quellenbasis, nicht 100 lokal gespeicherte Bücher.
- Nur kompakte, eigenständig formulierte Wissenseinträge speichern: Kernaussage, fachlicher Kontext, Evidenzgrad/Limitierungen, Quellen-ID/URL, Werk-/Kapitelreferenz, Lizenznachweis, Versions-/Prüfdatum und Ablauf-/Reviewdatum.
- Inhalte nur dann dauerhaft speichern, wenn Lizenz und Nutzungsrechte genau diese Verarbeitung und Speicherung gestatten. Keine unzulässigen Ersatzkopien oder umfangreichen abgeleiteten Textsammlungen erzeugen.
- Zulässige Quellenabschnitte nach Möglichkeit gezielt abrufen und temporär verarbeiten; Rohdateien, OCR-Ausgaben und temporäre Volltexte nach erfolgreicher Extraktion löschen. Temporäre Verarbeitung ist ebenfalls nur zulässig, wenn die Quellenbedingungen sie erlauben.
- Embeddings sind kein rechtlicher oder technischer Freibrief. Nur erforderliche, rechtlich zulässige Embeddings erzeugen; Speicherbedarf begrenzen, Duplikate deduplizieren und veraltete Einträge kontrolliert ersetzen.
- Kein separates Vektor-DB-/Storage-Angebot oder kostenpflichtiger Dienst ohne ausdrückliche Kosten-/Architekturprüfung. Vorhandene Datenbank und Infrastruktur bevorzugen, sofern sie technisch geeignet sind.
- Retrieval bevorzugt: gespeicherte kompakte Wissensnotizen plus Quellenlinks; bei aktuellen oder fehlenden Fakten gezielte Live-Recherche. Antwort immer mit Herkunft und Aktualität.
- Keine vollständigen Bücher zum Modelltraining und keine automatische Veränderung der MESSINHO-Scoring-Gewichte durch extrahierte medizinische Inhalte.
- Speicherbudget, maximale Textlänge je Wissensbaustein, TTL, Deduplizierung und Cleanup-Tests vor Implementierung festlegen.


## Übergreifende Wissensarchitektur — dauerhaftes, domänenweites Wissen (Eigentümerentscheidung 2026-11-26)

Die medizinische Wissensbasis ist nur ein Fachbereich einer allgemeinen MESSINHO-Wissensarchitektur. Das Ziel gilt für **alle** Wissensgebiete und Funktionen, insbesondere Mathematik, Biologie, Physik sowie Sportwissenschaft, Medizin, Statistik, Informatik und Fußballanalyse.

### Verbindliches Verhalten

- Sobald MESSINHO neues Wissen rechtmäßig und ausreichend verifiziert erworben hat, soll es als dauerhaftes, wiederverwendbares Wissen verfügbar bleiben und bei späteren passenden Aufgaben automatisch berücksichtigt werden.
- Dieses Wissen darf nicht nur im flüchtigen Gesprächskontext, in einem Prompt oder in einem kurzlebigen Cache liegen. Es benötigt einen persistenten, versionierten und gesicherten Wissensbestand.
- MESSINHO muss gespeichertes Wissen in normalen Gesprächen automatisch abrufen, anwenden, analysieren, kritisch bewerten, verständlich erklären und – wo methodisch zulässig – zur Berechnung und Prognose verwenden.
- Die automatische Nutzung gilt domänenübergreifend und für sämtliche Agentenfunktionen. Es darf keine manuelle Aktivierung einzelner Wissensmodule voraussetzen.
- Wissen muss mit Herkunft, Lizenz/Rechten, Version, Datum, Vertrauensgrad, Gültigkeitsbereich und gegebenenfalls Ablauf-/Reviewdatum gespeichert werden.
- Widersprüchliche Erkenntnisse werden nicht still überschrieben: Versionen und Gegenbelege bleiben nachvollziehbar; MESSINHO kennzeichnet Unsicherheit und erklärt, warum eine Quelle höher gewichtet wird.
- Neue Erkenntnisse ergänzen oder korrigieren den Wissensbestand nachvollziehbar. Korrekturen dürfen ältere Versionen nicht spurlos vernichten.
- Zeitabhängige Fakten werden als historisch erhalten, aber als möglicherweise nicht mehr aktuell markiert. Das Wissen wird also nicht gelöscht, nur weil seine Aktualität abläuft.
- Nutzerbezogene/private Gesprächsdaten sind von allgemeinem Fachwissen strikt getrennt und dürfen nicht versehentlich in den globalen Wissensbestand gelangen.

### Dauerhaftigkeit und Schutz vor Wissensverlust

„Niemals verlieren“ ist ein Produktziel, das technisch durch Ausfallsicherheit und Wiederherstellbarkeit bestmöglich abgesichert wird; absolute Unfehlbarkeit kann kein System garantieren. Erforderlich sind:
1. Persistente Speicherung mit stabilen Wissens-IDs und Versionierung.
2. Automatische, verschlüsselte und getestete Backups nach festgelegtem Wiederherstellungsziel (RPO/RTO).
3. Regelmäßige Restore-Tests, Integritätsprüfungen und Prüfsummen.
4. Audit-Log für Aufnahme, Änderung, Korrektur, Verknüpfung und Deaktivierung.
5. Schutz vor versehentlichem Löschen; geregelte Retention und Wiederherstellung.
6. Export-/Migrationsfähigkeit in einem dokumentierten, offenen Format, damit Wissen nicht an einen einzelnen Anbieter gebunden ist.
7. Deduplizierung und Speicherbudgets, ohne die einzige verifizierte Wissensfassung zu entfernen.
8. Rechtewidrige Inhalte müssen sperrbar und gegebenenfalls löschbar sein. Rechtliche Löschpflichten und Datenschutz gehen einem absoluten Behalten vor; zulässige Provenienz-/Auditinformationen bleiben soweit erlaubt erhalten.

### Fachliche Verarbeitung und Prognosen

- **Mathematik:** nachvollziehbare Herleitung, Einheiten-/Definitionsprüfung, deterministische Berechnung, Plausibilitäts- und Randfallkontrolle.
- **Physik:** Modellannahmen, Größen/Einheiten, Formeln, Randbedingungen, Messunsicherheit und Gültigkeitsbereich offenlegen.
- **Biologie und Medizin:** Mechanismen und Evidenz erklären, Kausalität nicht aus bloßer Korrelation ableiten, aktuelle Leitlinien/Quellen berücksichtigen und medizinische Sicherheitsgrenzen einhalten.
- **Statistik und Prognosen:** Datenqualität, Stichprobengröße, Verzerrungen, Modellannahmen, Konfidenz-/Prognoseintervalle und alternative Szenarien ausweisen. Prognosen sind Wahrscheinlichkeitsaussagen, keine Gewissheiten.
- **Alle übrigen Funktionen:** das passende Wissen automatisch mit konkreten Daten, Regeln und Werkzeugen kombinieren; Quellen, Annahmen und Grenzen der Antwort sichtbar machen.

Wissensspeicher, Gesprächsgedächtnis, Suchindex, Rechen-/Fachwerkzeuge und Modellparameter sind unterschiedliche Komponenten. Wissen wird nicht dadurch dauerhaft gesichert, dass es einmal in einem Chat erwähnt oder in Modellgewichte geschrieben wurde. MESSINHO soll verifizierte Erkenntnisse primär in einem kontrollierten Wissensspeicher erhalten und bei Bedarf abrufen. Ein Modelltraining ist dafür weder Voraussetzung noch Ersatz.

### Architekturvorgabe

Eine zentrale, domänenübergreifende Knowledge Layer mit:
- fachgebietsneutralem Wissenseintrag und kontrolliertem Taxonomie-/Begriffsregister;
- Quellen- und Rechteverwaltung;
- Claim-/Regel-/Formel-/Methode-Einträgen mit Provenienz;
- Versionen, Gültigkeitszeiträumen, Konfliktbeziehungen und Review-Status;
- kompaktem Retrieval-Index und optional rechtlich zulässigen Embeddings;
- deterministischen Werkzeugen für Berechnung/Simulation, getrennt von beschreibendem Wissen;
- Agenten-Router, der passende Wissens- und Werkzeugbausteine automatisch in jeden Plan einbezieht;
- Qualitätsprüfung, Unsicherheitsbewertung und nachvollziehbarer Prognoseausgabe;
- Backup/Restore, Audit, Export und Rechte-gesteuerter Löschung.

Keine kostenpflichtigen Zusatzdienste oder unbegrenzte Speicherhaltung ohne vorherige Kostenprüfung. Das System muss Speicher- und Backup-Kosten transparent messen und begrenzen. Vor Implementierung sind Schema, Zugriffsschutz, Backupziel, Speicherbudgets und Wiederherstellungstests festzulegen.


## Erweiterung: Risikomanagement, Banken, Börsen und Finanzmarktanalyse — Eigentümerentscheidung 2026-11-26

Diese Wissensdomäne wird als gleichwertiger Teil der domänenübergreifenden MESSINHO-Wissensarchitektur aufgenommen. MESSINHO soll die Funktionsweisen von Banken, Börsen und Finanzmärkten verstehen und Methoden aus professionellem Risikomanagement für Analysen, Szenarien und Prognosen anwenden können.

### Fachliche Themenfelder

- **Risikomanagement:** Risikoidentifikation, Risikokategorien, Risikoappetit/-toleranz, Eintrittswahrscheinlichkeit, Schadenshöhe, Exposure, Konzentrationsrisiken, Frühwarnindikatoren, Kontrollen, Restrisiko und Maßnahmensteuerung.
- **Bankwesen:** Geschäftsmodelle von Geschäfts- und Zentralbanken, Einlagen/Kredite, Zinsmargen, Liquiditäts- und Fristentransformation, Kreditprüfung, Sicherheiten, Ausfallrisiko, Kapital- und Liquiditätsanforderungen sowie Zahlungsverkehr.
- **Börsen und Marktmechanik:** Primär-/Sekundärmarkt, Ordertypen, Orderbuch, Geld-/Briefkurs, Spread, Liquidität, Volatilität, Handelszeiten, Preisbildung, Market Maker, Auktionen, Marktindizes und Handelsunterbrechungen.
- **Kapitalmarktinstrumente:** Aktien, Anleihen, Fonds/ETFs, Devisen, Rohstoffe, Optionen, Futures und weitere Derivate; jeweils Funktionsweise, Bewertung, Risiken und Grenzen.
- **Quantitative Analyse:** Zeitreihen, Rendite/Risiko, Volatilität, Korrelation, Kovarianz, Regression, Szenarioanalyse, Sensitivität, Monte-Carlo-Simulation, Drawdown, Value-at-Risk und Expected Shortfall.
- **Kredit- und Gegenparteirisiko:** Bonität, PD/LGD/EAD als Modellgrößen, Ratinglogik, Ausfall- und Migrationsrisiken, Sicherheiten, Stresstests und Konzentrationen.
- **Liquiditäts- und Marktrisiko:** Funding-Liquidität, Marktliquidität, Zinsänderungsrisiko, Währungsrisiko, Spreadrisiko und Stressereignisse.
- **Makroökonomie:** Inflation, Zinsen, Geldpolitik, Konjunktur, Arbeitsmarkt, Wechselkurse und deren mögliche Übertragung auf Märkte.
- **Governance und Regulierung:** Kontrollsysteme, Modellrisiko, Interessenkonflikte, Marktmissbrauch, Compliance, Datenschutz und einschlägige regulatorische Rahmenwerke.

### Analyse- und Prognoseverhalten

MESSINHO soll:
1. Fragestellung, Zeithorizont, Zielgröße und verfügbare Daten bestimmen.
2. Datenqualität, Aktualität, Stichprobengröße, Verzerrungen und fehlende Werte prüfen.
3. Risikoquellen, Abhängigkeiten, Konzentrationen und mögliche Kaskadeneffekte identifizieren.
4. Basis-, Positiv-, Negativ- und Extrem-/Stressszenarien entwickeln.
5. Kennzahlen und Modelle passend auswählen, Annahmen offenlegen und Ergebnisse reproduzierbar berechnen.
6. Prognosen als Bandbreiten/Wahrscheinlichkeiten mit Unsicherheit und Grenzen ausgeben, niemals als sichere Zukunftsaussagen.
7. Backtesting und Out-of-sample-Prüfungen nutzen, Überanpassung vermeiden und Prognosegüte dokumentieren.
8. Gegenargumente, alternative Erklärungen und Ereignisse berücksichtigen, die das Modell ungültig machen könnten.
9. Ergebnisse verständlich und sachlich erklären, inklusive Quellen, Datenstand und Risikohinweisen.
10. Bei dynamischen Marktinformationen aktuelle, datierte Quellen oder Datenfeeds verwenden; historische Wissensnotizen allein reichen nicht.

### Wichtige methodische Schutzregeln

- Korrelation ist keine Kausalität; vergangene Renditen oder Muster garantieren keine künftige Entwicklung.
- VaR ist kein maximal möglicher Verlust und muss mit Expected Shortfall, Szenarien und Stressanalysen ergänzt werden.
- Modelle müssen Annahmen, Datenfenster, Konfidenzniveau, Zeithorizont und bekannte Schwächen offenlegen.
- Keine erfundenen Echtzeitkurse, Bankdaten, Orderbücher, Volumina oder Makrodaten.
- Keine Prognose ohne Datenbasis; bei fehlenden oder unzureichenden Daten ausdrücklich Unsicherheit oder Nichtbeurteilbarkeit melden.
- Backtests müssen Transaktionskosten, Gebühren, Slippage, Liquidität, Survivorship Bias und Look-ahead Bias soweit relevant berücksichtigen.
- Finanzanalysen und allgemeine Bildung klar von individueller Anlageberatung, Kreditentscheidung oder regulierter Finanzdienstleistung trennen. Vor einer solchen Produktfunktion sind rechtliche/regulatorische Prüfung und geeignete organisatorische Kontrollen erforderlich.
- Keine Handelsausführung, Kontoaktionen oder sonstigen finanziellen Nebenwirkungen ohne gesonderte ausdrückliche Autorisierung und Sicherheitsprüfung.

### Wissensspeicherung

- Auch diese Domäne nutzt denselben dauerhaften, versionierten und quellenbasierten Wissenskern.
- Speichern: kompakte Definitionen, Formeln, Modellannahmen, Verfahrensschritte, Kennzahlen, Grenzen, Quellen-/Lizenznachweise und Review-Daten.
- Dynamische Kurse, Marktstände und Konjunkturdaten werden nicht als ewiges Wissen behandelt; sie erhalten Zeitstempel und kurze Aktualitätsfenster oder werden bei Bedarf live abgerufen.
- Kein kostenpflichtiger Marktdatenfeed und kein kostenpflichtiger Dienst ohne vorherige Zustimmung und Kostenprüfung.


## Technischer Zwischenstand — erste dauerhafte domänenübergreifende Wissensschicht (2026-11-26)

- Implementiert: `backend/messinho-domain-knowledge.js` mit Domänenklassifizierung, kompaktem Record-Aufbau, stabilen Fingerprints, begrenztem Retrieval, rights-gated Speicherung und fail-closed Verhalten.
- Unterstützte Domänen: mathematics, physics, biology, medicine, risk_management, banking, financial_markets, statistics, sports_science, football, computer_science und general.
- Dauerhafte Einträge haben keine reguläre Cache-TTL. Zeitabhängigkeit wird über `knowledge_status` (active/stale/conflicting/superseded/quarantined/removed), Version und Prüfdatum gesteuert. Volltexte und PDFs werden nicht gespeichert.
- Speicherung verlangt explizit verifizierten Rechte-Status, Lizenz, Rechteinhaber, HTTPS-Lizenzbeleg sowie AI/TDM-, kommerzielle und Bearbeitungsfreigabe. Fehlt auch nur eine Angabe, wird nicht dauerhaft gespeichert.
- Allgemeine Recherche normalisiert Lizenzmetadaten nur dann, wenn die Quelle diese tatsächlich liefert; HTTPS allein ist kein Lizenzbeleg. Rechte nicht verifiziert = kein dauerhafter Import.
- MESSINHO-Chat ruft passende dauerhaft gespeicherte Einträge automatisch ab und kann sie mit Quellen-/Rechte-Metadaten als Kontext verwenden.
- Neue Migration `supabase/migrations/20261126230000_messinho_domain_knowledge.sql` ist in Supabase STAGING angewendet. Verifikation: Tabelle vorhanden, RLS aktiv, service_role SELECT erlaubt, authenticated SELECT verweigert, aktuell 0 Wissenseinträge.
- Tests/Build auf Render STAGING: 258 bestanden, 0 fehlgeschlagen; Backend-Syntaxprüfungen und Vite-Build erfolgreich.
- Render STAGING Deployment: `dep-dc474gc9v7es73e2msdg`, live am 2026-11-26 17:54:43 UTC, Commit `5db7f60006eda1c1c02e2254b4af22ae43aa73fc`.
- Render Auto-Deploy bleibt aus. Produktion/main, PFMS/PFSS und PR-Merge nicht verändert.
- Noch NICHT abgeschlossen: geprüfter Rechtekatalog/100 Fachwerke, Backup-/Restore-Konfiguration und Restore-Test, breitere automatische Einbindung in spezialisierte Capability-Ausführung/Mathematik-/Physik-Workflows, Konfliktauflösung/Review-Pipeline, Prognosevalidierung und End-to-End-Tests im authentifizierten Chat. Diese Grundlage darf daher nicht als vollständige Realisierung des Gesamtziels ausgegeben werden.
