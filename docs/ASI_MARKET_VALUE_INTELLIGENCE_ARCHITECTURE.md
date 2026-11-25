# ASI Market Value Intelligence – Architektur

**Status:** Architekturentwurf / Staging-only  
**Branch:** `feature/asi-market-value-engine`  
**Produkt:** myScoutingDatabase  
**Ziel:** ASI berechnet eine eigene, nachvollziehbare Marktwertindikation. Transfermarkt wird ausschließlich als optionaler externer Vergleich angezeigt, sofern Abruf, Speicherung und Darstellung ausdrücklich rechtmäßig lizenziert oder anderweitig zulässig sind.

## 1. Produktentscheidung und Begriffe

ASI darf einen selbst berechneten Wert nicht als offiziellen oder objektiven Marktwert ausgeben. Der Marktwert ist nicht direkt beobachtbar. Eine tatsächlich gezahlte Ablöse ist ein Transaktionspreis und kann durch Vertrag, Käufer-/Verkäufermacht, Klauseln, Leihe, Swap, Boni und Zeitpunkt stark vom theoretischen Marktwert abweichen.

Deshalb liefert ASI:
- **ASI-Marktwertindikation:** geschätzter Wert eines Spielers unter normalen Marktbedingungen, als Punktwert plus plausibles Intervall.
- **Ablöse-Szenario:** separate Schätzung eines möglichen Transaktionspreises für definierte Vertrags-/Käufer-/Verkäuferbedingungen, erst in einer späteren Ausbaustufe.
- **Transfermarkt-Vergleichswert:** optionaler externer Referenzwert, nur bei dokumentierter Rechtsgrundlage/Lizenz und mit Quelle, Abrufdatum und Originaldatum.
- **Datenvertrauen:** Qualität und Vollständigkeit der Eingangsdaten; kein zweiter Marktwert.

Transfermarkt-Daten werden standardmäßig NICHT:
- automatisiert gescrapt,
- ohne Erlaubnis dauerhaft gespeichert,
- zum Training, Fine-Tuning oder zur Kalibrierung des ASI-Modells verwendet,
- als Voraussetzung für eine ASI-Bewertung behandelt.

Fehlt eine zulässige Transfermarkt-Anbindung, wird der Vergleichsbereich ausgeblendet bzw. als „nicht verfügbar“ angezeigt. Keine Ersatzwerte oder erfundenen Quellen.

## 2. Systemkomponenten

1. **Source Registry** – Anbieter, Datensatz, Felder, Lizenz/AGB, kommerzielle Nutzung, Speicherung, Weitergabe, Aktualisierungsfrequenz, Rechtsprüfung und Ablaufdatum.
2. **Ingestion Adapters** – getrennte Adapter je Quelle. Jeder Adapter liefert normalisierte Fakten plus Herkunft; keine generischen Scraper.
3. **Identity Resolution** – Zuordnung über stabile Provider-IDs, Name, Geburtsdatum/-jahr, Nationalität, Verein und Position. Bei unklarer Zuordnung keine Bewertung oder nur ausdrücklich vorläufige Bewertung.
4. **Feature Store** – saison- und stichtagsbezogene, positionsspezifische Merkmale mit Datenherkunft und Qualitätsflags.
5. **Valuation Engine** – regelbasierte Baseline, später trainiertes statistisches Modell/Ensemble.
6. **Comparable Engine** – vergleichbare Spieler/Transfers nach Position, Rolle, Alter, Liga-/Wettbewerbsniveau, Saison und Einsatzzeit.
7. **Uncertainty & Explanation** – Intervall, Datenabdeckung, Unsicherheitsgründe und Beitragsfaktoren.
8. **Benchmark Adapter** – optionaler Transfermarkt-Connector mit harter Lizenzprüfung.
9. **Audit & Evaluation** – unveränderliche Bewertungs-Snapshots, Modellversionen, Backtesting und Fehlerkennzahlen.

## 3. Datenfluss

`Search → Identity → Legal Source Gate → Ingestion → Feature Store → Comparables → Valuation → Uncertainty → Benchmark (optional) → Human Review`

Der Legal Source Gate prüft vor jedem Abruf und jeder Speicherung:
- Quelle ist freigegeben und Lizenz ist aktuell.
- Erlaubte Felder und Zweck umfassen den konkreten Vorgang.
- Speicherung/Retention und kommerzielle Nutzung sind erlaubt.
- Kein Scraping-Verbot oder Rechtevorbehalt wird umgangen.
- Bei Transfermarkt: explizite Freigabe/Lizenz für die konkrete Zugriffsmethode und Nutzung.

Jeder Datenpunkt enthält mindestens `source_id`, `source_record_id` (falls zulässig), `source_url`, `retrieved_at`, `published_at`/Ereignisdatum, `license_version`, `usage_basis`, `confidence` und `valid_until`.

## 4. Bewertungslogik

### 4.1 MVP – erklärbare Baseline

Noch kein ML-Modell, solange ausreichend rechtmäßig nutzbare, qualitätsgesicherte Trainingsdaten fehlen. Die erste Version ist eine transparente Vergleichs- und Regelengine.

Merkmalsgruppen (positionsspezifisch gewichtet):
- Alter und Karrierephase; nichtlineare Alterskurve.
- Einsatzzeit, Startelfquote, Verfügbarkeit als reine Einsatz-/Teilnahmedaten.
- Leistungskennzahlen pro 90 Minuten und Gesamtvolumen.
- Position und taktische Rolle.
- Liga-/Wettbewerbsstärke und Teamkontext.
- Leistungsentwicklung über mehrere Saisons.
- Vertragsrestlaufzeit nur bei belastbarer, zulässiger Quelle.
- Marktliquidität und Vergleichstransaktionen nur bei ausreichender Vergleichbarkeit.

Die bestehende ASI-Scoutbewertung (34 Feldspieler- bzw. 12 Torwartkriterien) ist ein eigener sportlicher Input. Sie darf nicht ungeprüft in Geldwerte übersetzt werden. Die aktuelle 1–4/1–5-Skalenabweichung muss vor einer quantitativen Nutzung über Schema-/Bewertungsversionen aufgelöst werden.

### 4.2 Vergleichsgruppen

Vergleiche werden mindestens nach Position/Spielrolle, Altersband, Liga-/Wettbewerbsniveau, Saison und ausreichender Einsatzzeit gebildet. Bei zu wenigen Vergleichsfällen wird die Gruppe schrittweise verbreitert und diese Verbreiterung sichtbar gemacht. Kein Vergleich zwischen Stürmern und Innenverteidigern anhand derselben Rohmetriken.

### 4.3 Modellstufen

- **V0 Baseline:** robuste Median-/Quantilwerte vergleichbarer, zulässig dokumentierter Transaktionen; nachvollziehbare Anpassungen, keine Blackbox.
- **V1 Regression:** regularisierte Regression oder Gradient Boosting mit zeitlicher Validierung und positionsbezogenen Modellen, sobald genügend Daten vorhanden sind.
- **V2 Ensemble:** z. B. Gradient Boosting plus Zeitreihen-/Hierarchiekomponente, Kalibrierung der Prognoseintervalle und SHAP/Feature-Beiträge.
- **V3 Longitudinal:** Verlauf und Szenarien über mehrere Stichtage; Modellmonitoring und kontrollierte Retrainings.

Keine Modellstufe darf als „KI lernt selbst“ dargestellt werden, bevor Training, Testdaten, Evaluierung und Freigabe tatsächlich durchgeführt wurden.

## 5. Zielvariable und Trainingsdaten

Es gibt keine perfekte beobachtbare Wahrheit für einen abstrakten Marktwert. Reale Ablösen sind beobachtbar, aber nicht identisch mit Marktwerten.

Daher:
- Trainingslabel zunächst **bereinigte, tatsächlich gezahlte Transferablöse** aus rechtmäßig nutzbaren Daten, nicht Transfermarkt-Marktwerte.
- Freie Transfers, Leihen, Swaps, unbekannte Gebühren, Boni und Klauseln getrennt kennzeichnen; nicht als normale Ablöse behandeln.
- Ablöse-Labels nur verwenden, wenn Betrag, Währung, Datum, Transferart und Spieleridentität hinreichend verifiziert sind.
- Zielvariable und Produktbezeichnung klar trennen: Modell aus Ablösen liefert zunächst eine **ablösebasierte Marktwertindikation**, nicht einen offiziell beobachteten Marktwert.
- Transfermarkt-Werte dürfen nur dann als zusätzliches Vergleichslabel/Benchmark genutzt werden, wenn die Nutzungsrechte auch Speicherung und Modellnutzung ausdrücklich abdecken. Standardmäßig sind sie davon ausgeschlossen.
- Train/Test strikt zeitlich trennen; Spieler-/Transfer-Dubletten und Daten-Leakage verhindern.
- Bewertung nach Liga, Position, Altersband und Wertsegment; Metriken: MAE, Median Absolute Error, RMSE, MAPE nur ergänzend (bei kleinen Werten instabil), Intervallabdeckung und Kalibrierung.
- Vor Produktivsetzung Mindeststichproben und Mindestgüte pro Segment festlegen. Bei nicht erfüllten Schwellen: „Datenbasis unzureichend“, keine scheinpräzise Zahl.

## 6. Ergebnisformat

Jede Bewertung speichert und zeigt:
- Punktwert und Intervall (z. B. € 8–12 Mio.; nur wenn Datenbasis dies trägt).
- Währung, Bewertungsstichtag und Modellversion.
- Datenvertrauen und Feature-Abdeckung separat.
- Vergleichsgruppe (Position, Altersband, Liga-/Niveau, Zeitraum, n).
- Wichtigste wertsteigernde/-mindernde Faktoren mit Richtung und Beleg.
- Fehlende/konfligierende Daten und Intervallverbreiterung.
- Datenquellen mit Abruf-/Publikationsdatum und Lizenzreferenz.
- optional Transfermarkt-Vergleich mit dessen eigenem Stichtag und Quelle.
- ausdrücklichen Hinweis: Schätzung, keine garantierte Ablöse und keine Finanz-/Transferberatung.

## 7. Datenbankentwurf (Supabase, nur Staging)

Vorgeschlagene Tabellen; vor Migration gegen vorhandenes Schema und tatsächliche RLS-Funktionen prüfen:

- `asi_valuation_sources`: Quellenregister und Lizenzfreigaben (provider, dataset, permitted_fields, allowed_purposes, commercial_use, storage_allowed, model_training_allowed, terms_url, license_reference, reviewed_by, reviewed_at, expires_at, status).
- `asi_valuation_observations`: normalisierte, quellgebundene Fakten/Transaktionen; jede Beobachtung hat source_id, player identity, field, value, unit, dates, confidence, rights metadata.
- `asi_market_value_runs`: Spieler, Stichtag, Modellversion, Punktwert, Unter-/Obergrenze, Datenvertrauen, Feature-Abdeckung, Vergleichsgruppe, Status und vollständiges Explainability-JSON.
- `asi_market_value_features`: Feature-Snapshot je Run, normalisierter Wert, Position/Zeitraum und Quellenreferenzen.
- `asi_market_value_comparables`: Vergleichsobjekte mit Matching-Grund, Distanz/Ähnlichkeit und zulässigen Referenzen.
- `asi_market_value_benchmarks`: externe Referenzwerte (Transfermarkt nur nach Freigabe), mit Anbieterwert, Originaldatum, Abrufdatum, URL, Nutzungsstatus und Retention.
- `asi_market_value_reviews`: menschliche Freigaben, Korrekturen und Kommentare, getrennt von Modelloutput.

Alle Tabellen in public: RLS aktiv, konkrete Owner-/Admin-Policies, keine offenen anon-Rechte. Service-Role ausschließlich serverseitig. Lizenzregisteränderungen und menschliche Reviews revisionsfähig protokollieren. Keine Gesundheitsdaten in dieser Engine; Verletzungsdaten bleiben separat gesperrt, solange keine rechtliche Grundlage und Freigabe besteht.

## 8. API-Entwurf

- `POST /api/asi/market-value/estimate` – authentifiziert; startet Bewertung für Kandidat/Spieler und Stichtag.
- `GET /api/asi/market-value/:runId` – liefert Ergebnis und Quellen-/Erklärungsdaten gemäß Berechtigung.
- `GET /api/asi/market-value/:playerId/history` – Verlauf mit Modellversionen.
- `POST /api/asi/market-value/:runId/review` – menschliche Review/Override, protokolliert.
- `GET /api/asi/market-value/benchmark/:playerId` – nur wenn Benchmark-Connector rechtlich aktiviert ist.

Alle Endpunkte prüfen Supabase-Token, Rolle, Freigabe, Rate-Limits, Eingabevalidierung und Mandantenzugehörigkeit. Keine API-Keys im Frontend. Der externe Benchmark-Adapter ist standardmäßig deaktiviert (Feature-Flag plus serverseitiger Lizenzstatus).

## 9. UI in der KI-Spielersuche

Im Spieler-Dossier:
- **ASI-Marktwertindikation** als Hauptwert.
- darunter Intervall, Stichtag, Modellversion und Datenvertrauen.
- „Warum dieser Wert?“ mit nachvollziehbaren Faktoren.
- Vergleichsspieler/Transaktionen mit Stichprobengröße und Kontext.
- optional daneben „Transfermarkt-Vergleich“; nur wenn rechtlich aktiviert.
- Warnung bei geringer Datenbasis und Konflikten.
- Marktwertverlauf nur aus gespeicherten ASI-Snapshots bzw. rechtmäßig gespeicherten Benchmarks.

## 10. Sicherheit, Recht und Betrieb

- Nur Datenquellen mit dokumentierter Rechtsgrundlage/Lizenz aufnehmen.
- AGB, Datenbankrechte, Urheberrecht, Datenschutz und kommerzielle Nutzung pro Quelle prüfen.
- Keine Annahme „öffentlich zugänglich = frei verwendbar“.
- Keine Transfermarkt-Scraper, keine Umgehung von Rate Limits/Robots/AGB.
- Datenminimierung, Aufbewahrungsfristen, Lösch-/Korrekturprozesse und Audit Trail.
- Keine sensiblen Gesundheitsdaten in der Marktwertengine.
- Modelloutput ist Entscheidungshilfe; finale Transferentscheidung bleibt beim Verein/Menschen.

## 11. Umsetzung in Releases

**Phase 0 – Read-only Audit:** aktuelles Schema, Datenbestand, RLS, Kandidaten- und Spielerbeziehungen, bestehende Scout-Skalen prüfen.

**Phase 1 – Foundation:** Source Registry, Migrationsentwurf, Datenverträge, Feature-Schema, Bewertungs- und API-Interfaces; Transfermarkt-Connector deaktiviert.

**Phase 2 – Baseline:** positionsbezogene Vergleichslogik, Intervall-/Datenvertrauen, Unit-Tests und synthetische Testfälle; synthetische Daten niemals als reale Spielerwerte anzeigen.

**Phase 3 – UI & Candidate Integration:** Ergebnis in KI-Spielersuche anzeigen, Runs und Reviews speichern, Kandidat bleibt getrennt vom kanonischen Spielerbestand.

**Phase 4 – Historical Evaluation:** rechtmäßig nutzbare historische Daten importieren, zeitliches Backtesting, segmentierte Fehleranalyse und Freigabeschwellen.

**Phase 5 – Model Training:** nur bei ausreichender Datenmenge und Lizenzfreigabe; Modellartefakte versionieren, reproduzierbare Trainingspipeline und Monitoring.

**Phase 6 – Optionaler Transfermarkt-Benchmark:** erst nach schriftlicher Freigabe der konkreten API-/Daten-/Speicher-/Anzeige-/Modellnutzung.

## 12. Akzeptanzkriterien

- Ohne Benchmark-Lizenz funktioniert die ASI-eigene Schätzung vollständig.
- Ohne ausreichende Daten gibt ASI keinen erfundenen Marktwert aus.
- Jeder Zahlenwert ist reproduzierbar auf Datenstand, Modellversion und Vergleichsgruppe zurückführbar.
- Marktwert und Ablöseprognose sind getrennte Felder und Begriffe.
- Transfermarkt-Werte fließen nicht in Training oder Kalibrierung ein, solange dies nicht ausdrücklich lizenziert ist.
- RLS und Rollenprüfungen verhindern Zugriff zwischen Vereinen/Mandanten.
- CI deckt Identitätsauflösung, Währungsnormalisierung, Vergleichsgruppen, Intervallbildung, Lizenz-Gates, Rechtefehler und fehlende Daten ab.
- Alle Arbeiten erfolgen auf Staging/Feature-Branch; Produktion bleibt unangetastet.

## Forschungsgrundlage

- Wang, Wu & Wang (2026), *Predicting player transfer market value with ensemble machine learning models*, Scientific Reports. Die Studie verwendet Transfermarkt-Werte als Proxy und weist selbst auf die Begrenzung durch diese Zielvariable hin.
- *Machine Learning for the Prediction of Football Players’ Market Value in Five European Leagues* (2026): 14.413 Spieler-Saison-Beobachtungen; Alter und Einsatzzeit zeigen hohe Bedeutung; die Studie weist u. a. auf fehlende Vertrags-/Positionsmerkmale und die Abgrenzung zu Ablösen hin.
- Systematic review, *Determinants of football players’ valuation*: Marktwerte und tatsächliche Transferpreise sind unterschiedliche Messgrößen; Transfermarkt-Werte werden in Forschung häufig als Crowd-Schätzer genutzt, nicht als tatsächlich gezahlte Ablösen.

Diese Literatur dient als methodische Orientierung, nicht als Beleg dafür, dass unser Modell bereits trainiert oder validiert wäre.
