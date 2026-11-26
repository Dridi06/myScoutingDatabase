-- The backend records an automatic diagnostic after a successful admin login.
-- Keep the audit source explicit and permit that value in the history table.
alter table public.system_diagnostic_runs
  drop constraint if exists system_diagnostic_runs_triggered_by_check;

alter table public.system_diagnostic_runs
  add constraint system_diagnostic_runs_triggered_by_check
  check (triggered_by = any (array['automatic','admin','admin_login','deployment']::text[]));
