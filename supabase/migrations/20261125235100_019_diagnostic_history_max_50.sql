-- Keep only the 50 newest system diagnostic reports.
-- Writes are serialized in the database function so concurrent runs cannot
-- exceed the retention limit.
create or replace function public.save_system_diagnostic_run(p_record jsonb)
returns public.system_diagnostic_runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved public.system_diagnostic_runs;
begin
  perform pg_catalog.pg_advisory_xact_lock(20261125, 50);

  insert into public.system_diagnostic_runs (
    triggered_by, actor_profile_id, status, started_at, finished_at,
    duration_ms, summary, checks
  )
  values (
    p_record->>'triggered_by',
    nullif(p_record->>'actor_profile_id', '')::uuid,
    p_record->>'status',
    coalesce(nullif(p_record->>'started_at', '')::timestamptz, pg_catalog.now()),
    coalesce(nullif(p_record->>'finished_at', '')::timestamptz, pg_catalog.now()),
    coalesce((p_record->>'duration_ms')::integer, 0),
    coalesce(p_record->'summary', '{}'::jsonb),
    coalesce(p_record->'checks', '[]'::jsonb)
  )
  returning * into saved;

  delete from public.system_diagnostic_runs
  where id in (
    select id
    from public.system_diagnostic_runs
    order by created_at desc, started_at desc, id desc
    offset 50
  );

  return saved;
end;
$$;

revoke all on function public.save_system_diagnostic_run(jsonb) from public, anon, authenticated;
grant execute on function public.save_system_diagnostic_run(jsonb) to service_role;
