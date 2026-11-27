-- MESSINHO Admin Control Plane
-- Staging-first: one durable control row governs autonomous engineering work.
create table if not exists public.messinho_agent_control (
  id text primary key check (id = 'global'),
  mode text not null default 'paused' check (mode in ('paused','working','developing')),
  stop_requested boolean not null default false,
  current_task text,
  status_message text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  stopped_at timestamptz
);

insert into public.messinho_agent_control (id, mode, stop_requested, status_message)
values ('global','paused',false,'MESSINHO wartet auf einen Admin-Auftrag.')
on conflict (id) do nothing;

alter table public.messinho_agent_control enable row level security;
revoke all on public.messinho_agent_control from anon, authenticated;
grant select, insert, update on public.messinho_agent_control to service_role;

comment on table public.messinho_agent_control is
'Server-only MESSINHO operating mode and cooperative stop control. Admin API is the only user-facing access path.';
