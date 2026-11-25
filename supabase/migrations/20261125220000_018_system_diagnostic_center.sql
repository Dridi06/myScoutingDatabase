-- Persistent administrator-only system diagnostics history.
create table if not exists public.system_diagnostic_runs (
  id uuid primary key default gen_random_uuid(),
  triggered_by text not null check (triggered_by in ('automatic','admin','deployment')),
  actor_profile_id uuid null references public.profiles(id) on delete set null,
  status text not null check (status in ('healthy','warning','critical')),
  started_at timestamptz not null default now(),
  finished_at timestamptz not null default now(),
  duration_ms integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  checks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists system_diagnostic_runs_created_idx
  on public.system_diagnostic_runs(created_at desc);
alter table public.system_diagnostic_runs enable row level security;
drop policy if exists "Admins read system diagnostic history" on public.system_diagnostic_runs;
create policy "Admins read system diagnostic history"
  on public.system_diagnostic_runs for select to authenticated
  using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "Admins insert system diagnostic history" on public.system_diagnostic_runs;
create policy "Admins insert system diagnostic history"
  on public.system_diagnostic_runs for insert to authenticated
  with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
comment on table public.system_diagnostic_runs is 'Persistent system health and diagnostic history; administrator-only.';
