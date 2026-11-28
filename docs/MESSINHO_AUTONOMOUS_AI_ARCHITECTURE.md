# MESSINHO — Eigenständige KI-Architektur

## Verbindliches Entwicklungsziel
MESSINHO wird als eigenständiges, providerunabhängiges intelligentes System entwickelt. OpenAI ist weder Zielarchitektur noch zwingende Laufzeitabhängigkeit. Externe oder lokal gehostete Sprachmodelle dürfen vorübergehend als austauschbare Inferenzkomponenten dienen; Sprachverständnis, Kontext, Gedächtnis, Wissen, Planung, Rechte, Werkzeuge, Ausführung und Qualitätskontrolle bleiben Teil der eigenen MESSINHO-Architektur.

## Zielschichten
1. **Linguistische Engine:** Spracherkennung aus Text, Normalisierung, Grammatik, Morphologie, Syntax, Semantik, Pragmatik, Mehrsprachigkeit und Umgang mit Tipp-/Diktatfehlern.
2. **Dialog- und Kontextengine:** Gesprächsverlauf, Referenzauflösung, Dialogzustand, Rückfragen, Korrekturen und kontrollierte Langzeitgedächtnis-Nutzung.
3. **Wissensarchitektur:** kuratiertes Grundlagenwissen, Fachwissensmodule, Wissensgraph, Quellen-/Vertrauensbewertung, zeitliche Gültigkeit und Wissenslücken.
4. **Reasoning- und Planungsengine:** nachvollziehbare Teilziele, Regeln, Berechnungen, Hypothesen, Unsicherheit und Verifikation.
5. **Capability-/Agentenlaufzeit:** explizit registrierte Werkzeuge, Rollen-/Mandantenrechte, begrenzte Ausführung, Idempotenz, Audit-Trail und sichere Rückfragen.
6. **Inferenzadapter:** ein austauschbarer Adapter für lokal/self-hosted ausführbare Modelle. Kein fest verdrahteter OpenAI-Standard. Modellaufrufe sind optional und dürfen keine deterministisch lösbaren Dialog-/Berechnungs-/Routingpfade blockieren.
7. **Lernen und Qualitätskontrolle:** nur geprüfte Daten, versionierte Trainings-/Wissensänderungen, Benchmarks, Regressionstests, Freigaben und Rollback. Keine unkontrollierte Selbständerung oder Behauptung, Modellgewichte seien trainiert worden.

## Migrationsregeln
- Vorhandene Module zuerst inventarisieren und durch Tests absichern; keine bereits entwickelte Linguistik-, Kontext- oder Wissensfunktion ersetzen.
- Direkte Provideraufrufe schrittweise hinter eine neutrale Inferenzschnittstelle migrieren.
- Provider-abhängige Features getrennt ausweisen; Recherche-/Datenzugriff nicht mit Sprachgenerierung verwechseln.
- Lokale Inferenz benötigt eine tatsächlich erreichbare, abgesicherte Laufzeit und passende Hardware/Ressourcen. Ein localhost-Default in einem gehosteten Render-Prozess gilt nicht als bereitgestelltes Modell.
- Solange ein eigener Inferenzdienst nicht bereitgestellt und abgenommen ist, dürfen nicht-providerabhängige Dialoge, Regeln, Berechnungen und vorhandene Datenbankfunktionen weiterlaufen. Bei Aufgaben, die externe aktuelle Daten benötigen, muss MESSINHO transparent die fehlende Fähigkeit benennen.
- STAGING-only; Production bleibt unangetastet.

## Implementierungsphasen
1. Bestand und direkte externe Modellaufrufe vollständig inventarisieren; Funktions- und Testzuordnung erstellen.
2. Providerneutrale Inferenzschnittstelle mit expliziter Konfiguration, Timeout, Abbruch, Ressourcenlimits und sicheren Diagnosen fertigstellen.
3. Deterministische Linguistik-/Kontext-/Dialogpfade vor Modellaufrufen ausbauen.
4. Lokal/self-hosted Inferenzdienst auswählen, bereitstellen und mit deutschen Dialog-, Scouting- und Reasoning-Benchmarks evaluieren.
5. Intent-/Planungsengine und Capability-Aufrufe schrittweise providerunabhängig machen.
6. Wissensintegration, Retrieval, Provenienz und Wissensgraph erweitern.
7. Lernpipeline, Offline-Evaluation, Modell-/Wissensversionierung und kontrollierte Verbesserung implementieren.

## Erster Umsetzungsschritt
Der Dialogpfad erhält eine providerunabhängige, kontextgebundene Rückfrage, wenn der Nutzer eine zuvor angebotene Recherche, Spieleranalyse oder Datenauswertung annimmt. Diese Rückfrage startet noch keine Recherche und führt keine Aktion aus; sie sammelt nur den fehlenden Gegenstand.
