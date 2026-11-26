-- Post-install hardening for the dedicated STAGING database.
-- Service-role policies are explicit; anon/authenticated remain denied on server-only tables.

-- Presence RPCs execute as invoker and can update only the caller's presence columns.
alter function public.scout_heartbeat() security invoker;
alter function public.scout_mark_login() security invoker;
drop policy if exists profiles_update_own_presence on public.profiles;
create policy profiles_update_own_presence on public.profiles
for update to authenticated
using (id=(select auth.uid()))
with check (id=(select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (last_login_at,last_seen_at) on public.profiles to authenticated;

-- Server-only tables have explicit service_role policies and no client grants.
drop policy if exists asi_external_sources_service_role on public.asi_external_sources;
create policy asi_external_sources_service_role on public.asi_external_sources
for all to service_role using (true) with check (true);
drop policy if exists asi_scout_calibration_service_role on public.asi_scout_calibration_records;
create policy asi_scout_calibration_service_role on public.asi_scout_calibration_records
for all to service_role using (true) with check (true);
drop policy if exists asi_prediction_records_service_role on public.asi_prediction_records;
create policy asi_prediction_records_service_role on public.asi_prediction_records
for all to service_role using (true) with check (true);
drop policy if exists asi_prediction_outcomes_service_role on public.asi_prediction_outcomes;
create policy asi_prediction_outcomes_service_role on public.asi_prediction_outcomes
for all to service_role using (true) with check (true);
drop policy if exists asi_model_versions_service_role on public.asi_model_versions;
create policy asi_model_versions_service_role on public.asi_model_versions
for all to service_role using (true) with check (true);
drop policy if exists asi_training_runs_service_role on public.asi_training_runs;
create policy asi_training_runs_service_role on public.asi_training_runs
for all to service_role using (true) with check (true);
drop policy if exists asi_model_evaluations_service_role on public.asi_model_evaluations;
create policy asi_model_evaluations_service_role on public.asi_model_evaluations
for all to service_role using (true) with check (true);
drop policy if exists asi_player_analyses_service_role on public.asi_player_analyses;
create policy asi_player_analyses_service_role on public.asi_player_analyses
for all to service_role using (true) with check (true);
drop policy if exists support_tickets_service_role on public.support_tickets;
create policy support_tickets_service_role on public.support_tickets
for all to service_role using (true) with check (true);
drop policy if exists support_ticket_messages_service_role on public.support_ticket_messages;
create policy support_ticket_messages_service_role on public.support_ticket_messages
for all to service_role using (true) with check (true);
drop policy if exists player_deletion_logs_service_role on public.player_deletion_logs;
create policy player_deletion_logs_service_role on public.player_deletion_logs
for all to service_role using (true) with check (true);

-- Owner predicates in MESSINHO memory/traces are evaluated once per statement.
drop policy if exists messinho_agent_memory_select_own on public.messinho_agent_memory;
create policy messinho_agent_memory_select_own on public.messinho_agent_memory
for select using ((select auth.uid()) = owner_id);
drop policy if exists messinho_agent_memory_insert_own on public.messinho_agent_memory;
create policy messinho_agent_memory_insert_own on public.messinho_agent_memory
for insert with check ((select auth.uid()) = owner_id);
drop policy if exists messinho_agent_memory_update_own on public.messinho_agent_memory;
create policy messinho_agent_memory_update_own on public.messinho_agent_memory
for update using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
drop policy if exists messinho_agent_traces_select_own on public.messinho_agent_traces;
create policy messinho_agent_traces_select_own on public.messinho_agent_traces
for select using ((select auth.uid()) = owner_id);

-- Remove duplicate SELECT policy paths: admin writes are separate from scoped reads.
drop policy if exists asi_evidence_admin_write on public.asi_external_evidence;
drop policy if exists asi_evidence_admin_insert on public.asi_external_evidence;
drop policy if exists asi_evidence_admin_update on public.asi_external_evidence;
drop policy if exists asi_evidence_admin_delete on public.asi_external_evidence;
create policy asi_evidence_admin_insert on public.asi_external_evidence
for insert to authenticated with check ((select private.is_admin()));
create policy asi_evidence_admin_update on public.asi_external_evidence
for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy asi_evidence_admin_delete on public.asi_external_evidence
for delete to authenticated using ((select private.is_admin()));

drop policy if exists asi_contract_admin_write on public.asi_contract_snapshots;
drop policy if exists asi_contract_admin_insert on public.asi_contract_snapshots;
drop policy if exists asi_contract_admin_update on public.asi_contract_snapshots;
drop policy if exists asi_contract_admin_delete on public.asi_contract_snapshots;
create policy asi_contract_admin_insert on public.asi_contract_snapshots
for insert to authenticated with check ((select private.is_admin()));
create policy asi_contract_admin_update on public.asi_contract_snapshots
for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy asi_contract_admin_delete on public.asi_contract_snapshots
for delete to authenticated using ((select private.is_admin()));

-- Cover all foreign-key columns used for joins/deletes. Some composite query indexes already cover other FKs.
create index if not exists asi_contract_snapshots_evidence_id_idx on public.asi_contract_snapshots(evidence_id);
create index if not exists asi_contract_snapshots_owner_id_idx on public.asi_contract_snapshots(owner_id);
create index if not exists asi_contract_snapshots_recorded_by_idx on public.asi_contract_snapshots(recorded_by);
create index if not exists asi_evidence_reviews_evidence_id_idx on public.asi_evidence_reviews(evidence_id);
create index if not exists asi_evidence_reviews_reviewer_id_idx on public.asi_evidence_reviews(reviewer_id);
create index if not exists asi_external_evidence_owner_id_idx on public.asi_external_evidence(owner_id);
create index if not exists asi_external_evidence_research_run_id_idx on public.asi_external_evidence(research_run_id);
create index if not exists asi_external_evidence_reviewed_by_idx on public.asi_external_evidence(reviewed_by);
create index if not exists asi_external_evidence_supersedes_id_idx on public.asi_external_evidence(supersedes_id);
create index if not exists asi_model_evaluations_baseline_version_id_idx on public.asi_model_evaluations(baseline_version_id);
create index if not exists asi_model_evaluations_evaluated_by_idx on public.asi_model_evaluations(evaluated_by);
create index if not exists asi_player_analyses_created_by_idx on public.asi_player_analyses(created_by);
create index if not exists asi_player_candidates_created_by_idx on public.asi_player_candidates(created_by);
create index if not exists asi_prediction_outcomes_owner_id_idx on public.asi_prediction_outcomes(owner_id);
create index if not exists asi_prediction_outcomes_player_id_idx on public.asi_prediction_outcomes(player_id);
create index if not exists asi_prediction_outcomes_recorded_by_idx on public.asi_prediction_outcomes(recorded_by);
create index if not exists asi_prediction_outcomes_verified_by_idx on public.asi_prediction_outcomes(verified_by);
create index if not exists asi_prediction_records_created_by_idx on public.asi_prediction_records(created_by);
create index if not exists asi_research_runs_initiated_by_idx on public.asi_research_runs(initiated_by);
create index if not exists asi_research_runs_owner_id_idx on public.asi_research_runs(owner_id);
create index if not exists asi_scout_calibration_records_created_by_idx on public.asi_scout_calibration_records(created_by);
create index if not exists asi_scout_calibration_records_scout_id_idx on public.asi_scout_calibration_records(scout_id);
create index if not exists asi_scout_calibration_records_verified_by_idx on public.asi_scout_calibration_records(verified_by);
create index if not exists asi_training_runs_created_by_idx on public.asi_training_runs(created_by);
create index if not exists player_deletion_logs_deleted_by_idx on public.player_deletion_logs(deleted_by);
create index if not exists player_deletion_logs_owner_id_idx on public.player_deletion_logs(owner_id);
create index if not exists support_ticket_messages_sender_id_idx on public.support_ticket_messages(sender_id);
create index if not exists support_tickets_resolved_by_idx on public.support_tickets(resolved_by);
