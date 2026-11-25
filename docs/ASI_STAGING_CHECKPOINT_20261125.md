# ASI – Staging Checkpoint 2026-11-25

## Git
- Commit: f2e0996f013885bf99239ce771dd34a326e98419 – Integrate Adaptive Scouting Intelligence workspace
- Commit: 100181b30ea509870a8dee04ea85df43b7a314ad – Load ASI responsive styles
- Commit: f8f04febe6dc8b7f6ae35042e57e648c0bbcdf65 – Add Adaptive Scouting Intelligence workspace foundation

## Datenbank
- Migration asi_foundation erfolgreich auf Staging angewendet.
- Migration asi_indexes_and_policy_cleanup erfolgreich angewendet.
- ASI-Tabellen: asi_player_observations, asi_player_analyses, asi_scout_feedback, asi_prediction_records, asi_prediction_outcomes, asi_model_versions, asi_model_evaluations, asi_training_runs, asi_external_sources.
- pgvector Extension aktiviert.
- Baseline-Modellregister: player_snapshot_baseline@0.1.0 (deterministische Regeln, keine trainierte Prognose).
- Zusätzliche Indizes für ASI-Fremdschlüssel angelegt; doppelte Modell-SELECT-Policy entfernt.

## Frontend
- Neue Komponente src/asi/ASIWorkspace.jsx.
- Styles src/asi/asi.css.
- Integration in src/main.jsx und Sidebar.
- Features: Spieler-Snapshot, Datenabdeckung, Stärken/Entwicklungsfelder, Scout-Feedback, Beobachtungsnotizen, Admin-Modellregister und externe Quellenübersicht.

## Sicherheits- und Qualitätsstatus
- ASI-Tabellen haben RLS aktiviert.
- Neue Tabellen haben explizite Grants.
- private.is_admin() wird für Admin-RLS verwendet; public.current_role() war im Live-Schema nicht vorhanden und wurde daher nicht verwendet.
- Keine Spieler-Kontaktfelder werden im ASI-Frontend geladen.
- Bestehende Supabase-Advisor-Hinweise zu Supporttabellen ohne Policies und älteren SECURITY DEFINER-Funktionen wurden festgestellt; sie sind nicht durch ASI verursacht und wurden nicht verändert.
- Supabase Auth Leaked Password Protection ist derzeit deaktiviert; bestehender Hinweis.
- Der Performance-Advisor hatte vor dem Index-Cleanup mehrere fehlende FK-Indizes gemeldet; ASI-FK-Indizes wurden ergänzt.

## Noch zu verifizieren
- Render-Build und Live-Status der neuesten Commit-Version.
- Browser-Test mit Admin und Scout.
- RLS-Negativtest: Scout darf keine fremden ASI-Datensätze lesen/schreiben.
- Beobachtung/Feedback/Analyse speichern und erneut laden.
- Produktionssystem wurde nicht angefasst.
