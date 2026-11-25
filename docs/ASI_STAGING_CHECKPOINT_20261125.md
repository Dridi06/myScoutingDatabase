# ASI – Staging Checkpoint 2026-11-25

## Git
- Commit: f2e0996f013885bf99239ce771dd34a326e98419 – Integrate Adaptive Scouting Intelligence workspace
- Commit: 100181b30ea509870a8dee04ea85df43b7a314ad – Load ASI responsive styles
- Commit: f8f04febe6dc8b7f6ae35042e57e648c0bbcdf65 – Add Adaptive Scouting Intelligence workspace foundation
- Commit: c7f296933146adaaa6d8b267c18a0e05263e4975 – KI-Einstieg direkt in jedem Spielerprofil
- Commit: e92953d75171cfa61a7c2fe59fd15c4c5e58bdf8 – Datenschutzvalidierung für Beobachtungen und Feedback
- Commit: 0f4d66de9aece2488a83acfd31ce53a586be8c51 – Berechtigungen der SECURITY-DEFINER-Funktionen gehärtet

## Datenbank
- Migration asi_foundation erfolgreich auf Staging angewendet.
- Migration asi_indexes_and_policy_cleanup erfolgreich angewendet.
- ASI-Tabellen: asi_player_observations, asi_player_analyses, asi_scout_feedback, asi_prediction_records, asi_prediction_outcomes, asi_model_versions, asi_model_evaluations, asi_training_runs, asi_external_sources.
- pgvector Extension aktiviert.
- Baseline-Modellregister: player_snapshot_baseline@0.1.0 (deterministische Regeln, keine trainierte Prognose).
- Datenbestand bei Prüfung: 2 Spieler, 3 Profile, 0 ASI-Beobachtungen, 0 Analysen, 0 Feedbacks, 0 Prognose-Outcomes; daher keine belastbare Modelltrainingsbasis.
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
- Freitext in ASI-Beobachtungen und Scout-Feedback wird vor dem Speichern auf E-Mail-Adressen und Telefonnummern geprüft.
- Triggerfunktionen handle_new_scout_profile() und prevent_scout_messages_on_resolved_ticket() sind nicht mehr direkt durch anon/authenticated ausführbar.
- scout_heartbeat() und scout_mark_login() bleiben für authenticated freigegeben, da das Frontend sie für Online-Status und Login-Zeitstempel benötigt; anon ist ausgeschlossen.
- Supporttabellen support_tickets und support_ticket_messages haben RLS ohne Client-Policies. Das ist derzeit Backend-only-Zugriff über den Server-Service-Key; direkter Clientzugriff ist damit gesperrt.
- Supabase Auth Leaked Password Protection ist derzeit deaktiviert; bestehender Hinweis.
- Der Performance-Advisor hatte vor dem Index-Cleanup mehrere fehlende FK-Indizes gemeldet; ASI-FK-Indizes wurden ergänzt.

## Noch zu verifizieren
- Render-Build/Live-Status des letzten Dokumentations-Commits.
- Browser-Test mit Admin und Scout.
- RLS-Negativtest: Scout darf keine fremden ASI-Datensätze lesen/schreiben.
- Beobachtung/Feedback/Analyse speichern und erneut laden.
- Supabase Auth Leaked Password Protection aktivieren (über Auth-Projektkonfiguration; nicht per SQL verfügbar).
- Produktionssystem wurde nicht angefasst.


## Nachprüfung – 2026-11-25, 00:14 UTC
- Neuester Commit `56f72eb2fead9b915216866c982c9824976b1bff` („Update ASI staging checkpoint and security controls“) ist auf Render als `LIVE` bestätigt.
- Render-Service `myscoutingdatabase` läuft in Frankfurt; aktuelle Logs bestätigen gestarteten Node-Server, vorhandene Supabase-Server-Credentials und HTTP 200 der Supabase Data API.
- Supabase-Projektstatus: `ACTIVE_HEALTHY`; Migration `20261125001150 restrict_security_definer_function_execution` ist registriert.
- Live-Dateninventur erneut bestätigt: 2 Spieler, 3 Profile, 0 Beobachtungen, 0 Analysen, 0 Feedbacks, 0 Prognosen, 0 Prognose-Outcomes.
- RLS-Policies der ASI-Tabellen wurden aus `pg_policies` geprüft. Scout-Datensätze sind auf `owner_id = auth.uid()` begrenzt; Admin-Zugriff läuft über `private.is_admin()`. Die Admin-Register-/Trainings-/Evaluationsbereiche sind Admin-only.
- SECURITY-DEFINER-Funktionen geprüft: `scout_heartbeat()` und `scout_mark_login()` prüfen `auth.uid()` und aktualisieren ausschließlich das Profil dieser angemeldeten Person. Advisor-Warnung bleibt deshalb dokumentiert und ist funktional begründet.
- Aktueller Security-Advisor: 2 INFO-Hinweise für RLS-geschützte Backend-only-Supporttabellen ohne Client-Policies (beabsichtigt); 2 WARN-Hinweise für die benötigten authentifizierten SECURITY-DEFINER-RPCs; 1 WARN-Hinweis für deaktivierten Schutz gegen kompromittierte Passwörter.
- Performance-Advisor meldet weiterhin fehlende FK-Indizes auf `player_deletion_logs.deleted_by`, `support_ticket_messages.sender_id` und `support_tickets.resolved_by`. Diese betreffen bestehende Nicht-ASI-Tabellen und werden nicht ohne Prüfung der vorhandenen Zugriffsmuster verändert. Unbenutzte Indizes sind bei der sehr kleinen Testdatenmenge kein belastbarer Löschgrund.
- Einschränkung: Ein Browser-Login-/UI-Test sowie echte Scout-Session-RLS-Negativtests konnten über die verfügbaren Deployment-/Datenbankwerkzeuge nicht authentifiziert ausgeführt werden. Die leeren ASI-Tabellen erlauben zudem keinen belastbaren Read/Write-Negativtest anhand existierender Datensätze.
- Auth-Leaked-Password-Protection ist eine Supabase-Auth-Projekteinstellung und nicht per SQL-Migration zu aktivieren. Sie bleibt als Dashboard-Schritt offen.
- Keine Änderung an Produktion.
