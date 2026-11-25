create or replace function public.save_messinho_diagnostic_run(p_record jsonb)
returns public.messinho_diagnostic_runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved public.messinho_diagnostic_runs;
begin
  perform pg_catalog.pg_advisory_xact_lock(20261126, 51);
  insert into public.messinho_diagnostic_runs (
    triggered_by, actor_profile_id, status, started_at, finished_at,
    duration_ms, summary, checks, created_at
  ) values (
    coalesce(nullif(p_record->>'triggered_by',''),'admin'),
    nullif(p_record->>'actor_profile_id','')::uuid,
    p_record->>'status',
    coalesce(nullif(p_record->>'started_at','')::timestamptz,pg_catalog.clock_timestamp()),
    coalesce(nullif(p_record->>'finished_at','')::timestamptz,pg_catalog.clock_timestamp()),
    coalesce((p_record->>'duration_ms')::integer,0),
    coalesce(p_record->'summary','{}'::jsonb),
    coalesce(p_record->'checks','[]'::jsonb),
    pg_catalog.clock_timestamp()
  ) returning * into saved;

  delete from public.messinho_diagnostic_runs
  where id in (
    select id from public.messinho_diagnostic_runs
    order by created_at desc, id desc
    offset 50
  );
  return saved;
end;
$$;
revoke all on function public.save_messinho_diagnostic_run(jsonb) from public, anon, authenticated;
grant execute on function public.save_messinho_diagnostic_run(jsonb) to service_role;