-- Draft only. Review and approve before applying to the STAGING Supabase project.
create table if not exists public.messinho_myki_tickets (
  id uuid primary key,
  ticket_id text not null unique,
  title text not null,
  explanation text not null,
  rationale text not null,
  diff text not null,
  files jsonb not null default '[]'::jsonb,
  tests jsonb not null default '[]'::jsonb,
  risks text not null default '',
  rollback text not null,
  baseline_id text not null,
  candidate_id text not null,
  fingerprint text not null unique,
  status text not null check (status in ('submitted','reviewing','ready_for_staging','integrating','integration_failed','integrated','deleted')),
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  integrated_at timestamptz
);
create table if not exists public.messinho_myki_ticket_events (
  id bigint generated always as identity primary key,
  ticket_id uuid not null references public.messinho_myki_tickets(id),
  actor_id uuid,
  actor_type text not null check (actor_type in ('admin','messinho','system')),
  action text not null,
  from_status text,
  to_status text,
  error_code text,
  safe_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists messinho_myki_tickets_status_created_idx
  on public.messinho_myki_tickets(status,created_at desc);
create index if not exists messinho_myki_events_ticket_created_idx
  on public.messinho_myki_ticket_events(ticket_id,created_at desc);
alter table public.messinho_myki_tickets enable row level security;
alter table public.messinho_myki_ticket_events enable row level security;
-- No client policies: browser anon/authenticated roles receive no direct table access.
revoke all on public.messinho_myki_tickets from anon, authenticated;
revoke all on public.messinho_myki_ticket_events from anon, authenticated;
grant all on public.messinho_myki_tickets to service_role;
grant all on public.messinho_myki_ticket_events to service_role;
