-- System diagnostic history is admin-readable through RLS and service-role writable.
-- Remove default API grants: TRUNCATE bypasses RLS, so broad grants are unsafe.
revoke all on table public.system_diagnostic_runs from public, anon, authenticated;
grant select, insert on table public.system_diagnostic_runs to authenticated;
grant select, insert, update, delete on table public.system_diagnostic_runs to service_role;
