create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  sender_role text not null check (sender_role in ('admin','scout')),
  message text not null check (char_length(btrim(message)) between 1 and 3000),
  created_at timestamptz not null default now()
);
create index if not exists support_ticket_messages_ticket_created_idx
  on public.support_ticket_messages(ticket_id, created_at);
alter table public.support_ticket_messages enable row level security;
revoke all on public.support_ticket_messages from anon, authenticated;
grant all on public.support_ticket_messages to service_role;
insert into public.support_ticket_messages(ticket_id,sender_id,sender_role,message,created_at)
select t.id,t.scout_id,'scout',t.message,t.created_at
from public.support_tickets t
where not exists (
  select 1 from public.support_ticket_messages m where m.ticket_id=t.id
);
comment on table public.support_ticket_messages is
  'Ticket conversation messages. Access exclusively through server endpoints with verified Admin or owning Scout identity.';
