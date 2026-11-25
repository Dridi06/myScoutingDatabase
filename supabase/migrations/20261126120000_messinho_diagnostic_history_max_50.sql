-- Independent MESSINHO diagnostic history, isolated from system diagnostic reports.
create table if not exists public.messinho_diagnostic_runs (
  id uuid primary key default gen_random_uuid(),
  triggered_by text not null default 'admin' check (triggered_by in ('admin','manual')),
  actor_profile_id uuid null references public.profiles(id) on delete set null,
  status text not null check (status in ('healthy','warning','critical')),
  started_at timestamptz not null default now(),
  finished_at timestamptz not null default now(),
  duration_ms integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  checks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists messinho_diagnostic_runs_created_idx
  on public.messinho_diagnostic_runs(created_at desc);
alter table public.messinho_diagnostic_runs enable row level security;
comment on table public.messinho_diagnostic_runs is 'Separate administrator-only MESSINHO diagnostics history; max 50 reports.';

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
    duration_ms, summary, checks
  ) values (
    coalesce(nullif(p_record->>'triggered_by',''),'admin'),
    nullif(p_record->>'actor_profile_id','')::uuid,
    p_record->>'status',
    coalesce(nullif(p_record->>'started_at','')::timestamptz,pg_catalog.now()),
    coalesce(nullif(p_record->>'finished_at','')::timestamptz,pg_catalog.now()),
    coalesce((p_record->>'duration_ms')::integer,0),
    coalesce(p_record->'summary','{}'::jsonb),
    coalesce(p_record->'checks','[]'::jsonb)
  ) returning * into saved;

  delete from public.messinho_diagnostic_runs
  where id in (
    select id from public.messinho_diagnostic_runs
    order by created_at desc, started_at desc, id desc
    offset 50
  );
  return saved;
end;
$$;
revoke all on function public.save_messinho_diagnostic_run(jsonb) from public, anon, authenticated;
grant execute on function public.save_messinho_diagnostic_run(jsonb) to service_role;
