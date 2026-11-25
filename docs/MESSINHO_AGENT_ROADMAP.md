# Messinho Agent – Implementierungsstand

## Projektzuordnung
Messinho ist ein integriertes Modul innerhalb von myScoutingDatabase. Es ist kein separates Projekt und erhält keine eigene Plattform oder Datenbank.

## Aktueller Implementierungsstand auf feature/messinho-agent-workspace
- Navigationspunkt und integrierte Agentenoberfläche hinzugefügt.
- Text-Chat mit authentifiziertem Backend-Endpunkt `POST /api/agent/chat`.
- Browserbasierte Spracheingabe über Web Speech API, sofern der Browser sie unterstützt.
- Optionale Sprachausgabe über Speech Synthesis.
- Erste deterministische Intent-Verarbeitung ohne OpenAI- oder Tavily-Abhängigkeit.
- Unterstützte Leseaktionen: Datenbestandsübersicht, persönliche Kandidaten anzeigen, Spieler im zentralen Spielerkatalog und persönlichen Kandidatenbestand suchen.
- Endpunkt prüft Supabase-Access-Token und Profilrolle, begrenzt Anfragen und führt nur lesende Abfragen aus.
- Der Agent führt in dieser Ausbaustufe keine externe Recherche, keine Schreiboperationen und keine autonomen Modelländerungen aus.

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
1. Dedizierte myScoutingDatabase-Staging-Instanz bereitstellen bzw. bestätigen.
2. Build- und Integrationstests für den neuen Agenten ausführen.
3. Chat-Intent-Tests und Berechtigungstests ergänzen.
4. Datenquellenregister und tägliche Scheduler-Komponente implementieren.
5. Erst nach rechtlicher Quellenfreigabe die Hintergrundrecherche aktivieren.
