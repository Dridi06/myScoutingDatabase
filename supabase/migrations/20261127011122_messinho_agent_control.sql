begin;
create table if not exists public.messinho_agent_control (
  id text primary key default 'global' check (id = 'global'),
  mode text not null default 'paused' check (mode in ('paused','working','developing')),
  stop_requested boolean not null default true,
  current_task text,
  status_message text not null default 'MESSINHO ist pausiert. Aktivierung nur durch einen Administrator.',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  stopped_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.messinho_agent_control enable row level security;
revoke all on table public.messinho_agent_control from anon, authenticated;
grant all on table public.messinho_agent_control to service_role;
drop policy if exists messinho_agent_control_service_role_all on public.messinho_agent_control;
create policy messinho_agent_control_service_role_all
  on public.messinho_agent_control for all to service_role
  using (true) with check (true);
insert into public.messinho_agent_control (id,mode,stop_requested,status_message)
values ('global','paused',true,'MESSINHO ist pausiert. Aktivierung nur durch einen Administrator.')
on conflict (id) do nothing;
comment on table public.messinho_agent_control is 'Singleton control plane for MESSINHO autonomous work. Only the trusted backend service role may access it; admin API performs authorization.';
commit;
