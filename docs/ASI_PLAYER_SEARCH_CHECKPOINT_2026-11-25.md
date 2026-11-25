# ASI KI-Spielersuche – Checkpoint 2026-11-25

## Ziel
Eine eigenständige KI-Suchoberfläche, in der ein Scout/Admin einen Spielernamen eingibt, optionale Positions-/Jahrgangs-/Nationalitätsfilter ergänzt und ein quellenbasiertes Dossier erhält. Rechercheergebnisse werden zunächst als Kandidaten gespeichert, nicht automatisch in `players` übernommen.

## Implementiert
- `src/asi/PlayerSearchWorkspace.jsx`: Suchformular, Filter, Ergebnisdarstellung, Quellenliste, Speichern als Kandidat, Kandidatenübersicht.
- `src/asi/playerSearch.css`: responsive Darstellung.
- `src/main.jsx`: Navigationseintrag „KI-Spielersuche“ und Workspace-Routing.
- `backend/server.js`: authentifizierter Endpoint `POST /api/asi/player-search`; prüft Supabase-Token und Rolle, begrenzt Anfragen, nutzt Tavily-Suche und OpenAI-Analyse, liefert nur Suchquellen-Metadaten an den Client.
- `public.asi_player_candidates`: Kandidatenliste getrennt von kanonischen Spielerdatensätzen; RLS owner/admin.
- SQL-Migration `supabase/migrations/20261125060000_017_asi_player_candidates.sql`.
- Die Kandidatenaufnahme speichert Analyse, Quellen, Empfehlung und Identitätskonfidenz. Es gibt keinen automatischen Insert in `players`.

## Provider / notwendige Render-Staging-Konfiguration
Die Recherche-API antwortet bewusst mit HTTP 503, solange beide Variablen fehlen:
- `TAVILY_API_KEY`
- `OPENAI_API_KEY`

Optional:
- `OPENAI_MODEL` (Standard `gpt-4.1-mini`)

API-Schlüssel ausschließlich in Render Staging → Environment hinterlegen. Niemals in GitHub, Frontend oder Chat veröffentlichen. Für externe Anbieter sind Datenschutz-/Auftragsverarbeitungs- und Nutzungsbedingungen vor Live-Nutzung zu prüfen.

## Schutzregeln
- Authentifizierung und Rollenprüfung auf dem Server; nur Admin oder freigeschaltete Scouts.
- Rate limit: 20 Recherchen/Stunde pro Serverprozess.
- Keine privaten Scout-Notizen oder internen Spielerprofile werden an Suchanbieter übermittelt.
- Gesundheitsdaten/Verletzungen sind im aktuellen Rechercheprompt ausdrücklich deaktiviert und müssen gesondert rechtlich freigegeben werden.
- Keine psychologischen Diagnosen oder Persönlichkeitsprofile.
- Suchtreffer gelten als nicht vertrauenswürdiger Input; KI darf keine Anweisungen daraus befolgen.
- Quellenlinks werden angezeigt; fehlende Belege bleiben unbekannt.
- Die Bewertung ist eine Voranalyse, keine automatische Wahrheit oder Entscheidung.
- Kandidaten bleiben getrennt von der produktiven Spielerdatenbank, bis ein Mensch sie übernimmt.

## Noch offen
- TAVILY_API_KEY und OPENAI_API_KEY in Render Staging setzen.
- CI des jüngsten UI-Commits abwarten.
- Render-Deployment des neuesten Commits als LIVE bestätigen.
- End-to-End-Test mit Messi und einem mehrdeutigen Namen.
- Qualitätsverbesserung: mehrere Suchrunden, strukturierte Liga-/Spielstatistik-Provider, Duplikatabgleich gegen bestehende Spieler, Admin-Übernahme in `players`, Audit-Trail.
- Verletzungs- und Vertragsdaten nicht aktivieren, bevor Lizenz- und Datenschutzprüfung abgeschlossen sind.

## Umgebung
- Ausschließlich Staging: Render-Service `srv-dc25n13rjlhs73e2ae1g`
- Supabase-Staging: `vxtybjaabtfhxfwctnyj`
- Produktion nicht geändert.
