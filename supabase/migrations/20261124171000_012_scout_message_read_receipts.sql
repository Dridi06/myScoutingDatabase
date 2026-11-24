alter table public.support_ticket_messages
  add column if not exists scout_read_at timestamptz;
create index if not exists support_ticket_messages_unread_scout_idx
  on public.support_ticket_messages(ticket_id, scout_read_at)
  where sender_role='admin' and scout_read_at is null;
comment on column public.support_ticket_messages.scout_read_at is
  'Timestamp when the owning Scout read this Admin message.';
