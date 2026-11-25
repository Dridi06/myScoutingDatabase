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
