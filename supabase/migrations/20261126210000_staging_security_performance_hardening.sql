-- STAGING security and performance hardening discovered during the 2026-11-26 test run.
-- Diagnostic history is written only by the backend service role; browser roles must have no table privileges.
revoke all on table public.messinho_diagnostic_runs from public, anon, authenticated;
grant select, insert, update, delete on table public.messinho_diagnostic_runs to service_role;

-- Cover foreign keys flagged by Supabase's performance advisor.
create index if not exists asi_model_versions_approved_by_idx
  on public.asi_model_versions(approved_by);
create index if not exists messinho_diagnostic_runs_actor_profile_id_idx
  on public.messinho_diagnostic_runs(actor_profile_id);
create index if not exists system_diagnostic_runs_actor_profile_id_idx
  on public.system_diagnostic_runs(actor_profile_id);

-- Avoid per-row auth.uid() evaluation in the two administrator-only RLS policies.
drop policy if exists "Admins read system diagnostic history" on public.system_diagnostic_runs;
create policy "Admins read system diagnostic history"
  on public.system_diagnostic_runs for select to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ));

drop policy if exists "Admins insert system diagnostic history" on public.system_diagnostic_runs;
create policy "Admins insert system diagnostic history"
  on public.system_diagnostic_runs for insert to authenticated
  with check (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  ));

comment on table public.messinho_diagnostic_runs is
  'Separate administrator-only MESSINHO diagnostics history; backend service_role only, maximum 50 reports.';
