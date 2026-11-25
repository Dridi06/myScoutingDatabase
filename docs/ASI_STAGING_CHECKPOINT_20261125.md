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


## Meta-Intelligence-Qualitätskontrolle – 2026-11-25
- Commit `0511007d6727ec28dbcfe9f60f3598b2dfb9d1df`: Beobachtungsverlauf je Spieler ergänzt; Commit `7f70f3c4528cc2ef8e6997b7b6378482cee33455`: Timeline-Styling. Render-Deploy `dep-dc32ha4sg75s73d2gbgg` wurde als `LIVE` bestätigt.
- Commit `875f783986f3164a5d38831699874aabb2962186`: Admin-Meta-Intelligence mit Datenqualitätskennzahlen, zeitlicher Vergleichbarkeit, vollständigen Rating-Snapshots, passenden Prognose-/Ergebnispaaren, MAE und dokumentierten Modell-Evaluationen.
- Commit `537dc2d14e4c8ace670864c34f295a544f7ff5d0`: Styling der Qualitätskontrolle. Render-Deploy `dep-dc32i1qvmuic73f7bk70` wurde beim Check noch als `QUEUED` gemeldet; Live-Status muss nachgeprüft werden.
- Admin-Qualitätsbereich verwendet nur tatsächliche Daten aus ASI-Tabellen. MAE wird nur bei passender Ziel-/Beobachtungsmetrik und verknüpftem Prognoseergebnis berechnet. Keine Paare = kein Fehlerwert.
- Interne Freigabeschwellen sind sichtbar und explizit als interne Mindestkriterien gekennzeichnet: mindestens 30 passende Ergebnispaare und 10 Spieler für die Trainingsdatenbasis; mindestens 5 Spieler mit zwei Beobachtungen im Abstand von mindestens 30 Tagen für zeitliche Vergleichbarkeit. Modellfreigabe bleibt bis zu einer bestandenen Evaluation und ausreichender Ergebnisbasis gesperrt. Diese Schwellen ersetzen keine fachliche Validierung oder unabhängige Prüfung.
- Direkte Staging-Datenbankzählung nach Implementierung: 0 Beobachtungen, 0 Analysen, 0 Feedbacks, 0 Prognosen, 0 Outcomes, 0 Evaluationen, 0 Trainingsläufe. Entsprechend sind MAE und Modellgüte derzeit nicht berechenbar; die Qualitätskontrolle muss „gesperrt/nicht ausreichend“ anzeigen.
- Die Admin-Qualitätsabfragen laufen ausschließlich bei Admin-Ansicht; Scout-Ansichten erhalten keine globalen ASI-Statistiken.
- Weiter offen: Live-Status des Deploys `dep-dc32i1qvmuic73f7bk70` und Browserprüfung mit Admin-/Scout-Konten sowie RLS-Negativtest. Produktionssystem weiterhin unangetastet.


## ASI-Datennormalisierung und Beobachtungsvalidierung – 2026-11-25
- Render deploy `dep-dc32nnri7qqc739s48j0` für Commit `1eaed0dc0027ce1e068b77b781dd2ed1c29478f0` ist LIVE. Commit `dc4e4a58e75ddd2e3465e6cdaa701996804cfbad` (ASI-Komponente erhält nur benötigte, nicht-kontaktbezogene Spielerfelder) wurde im nachfolgenden Deploy-Zyklus durch den neueren Commit ersetzt und ist damit ebenfalls enthalten.
- ASI-Rating-Validierung akzeptiert ausschließlich ganzzahlige Werte 1–5; leere Werte bleiben fehlend und werden nicht als 0 interpretiert.
- Commit `a40bfb09daafa17aa9d78d9f48ddfcd4ea7a119f`: ASI-Analysen und Beobachtungen speichern normalisierte Ratings ausschließlich aus den 34 definierten Kriterien. Der Analyse-Snapshot kennzeichnet die Skala als `1-5_integer_v1`.
- Beobachtungsdatum darf nicht fehlen, ungültig sein oder in der Zukunft liegen.
- Diese zuletzt genannte Änderung ist in GitHub gespeichert; Render-Deployment muss noch auf LIVE geprüft werden.
- Datenbestand zuletzt: weiterhin 0 ASI-Beobachtungen, Analysen, Feedbacks, Prognosen, Outcomes, Evaluationen und Trainingsläufe. Keine Testdaten wurden erzeugt.
- Browser-/RLS-Tests mit echten Admin- und Scout-Sitzungen bleiben offen. Ausschließlich Staging, Produktion unangetastet.


## Spielerwechsel- und Snapshot-Schutz – 2026-11-25
- Commit `37278580f108da5a69750cc9dbc85802a630b47c`: Beim Wechsel des ausgewählten Spielers werden vorherige Analyse, Feedback, Fehlermeldung, Historie und Beobachtungsverlauf sofort zurückgesetzt, damit keine Daten des zuvor ausgewählten Spielers im neuen Kontext angezeigt werden.
- Leere Snapshots ohne gültige Bewertungen werden verhindert. Der Snapshot-Button ist deaktiviert, solange kein gültiger ganzzahliger Ratingwert 1–5 vorliegt; die Funktion prüft dies zusätzlich vor dem Datenbank-Insert.
- Die Daten bleiben unverändert; keine Testdatensätze eingefügt. Nur Staging.
- Deploy für diesen Commit steht noch aus und muss auf LIVE geprüft werden.
