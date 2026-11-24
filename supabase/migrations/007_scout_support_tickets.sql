create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  scout_id uuid not null references public.profiles(id) on delete cascade,
  scout_username text not null,
  message text not null default 'Der Account ist gesperrt. Ich benötige Ihre Hilfe.',
  status text not null default 'offen' check (status in ('offen','erledigt')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);
create index if not exists support_tickets_status_created_idx
  on public.support_tickets(status, created_at desc);
create index if not exists support_tickets_scout_created_idx
  on public.support_tickets(scout_id, created_at desc);
alter table public.support_tickets enable row level security;
revoke all on table public.support_tickets from anon, authenticated;
comment on table public.support_tickets is 'Support-Tickets gesperrter Scouts; Zugriff ausschließlich serverseitig über Service Role und geprüfte Admin-/Ticket-Tokens.';
