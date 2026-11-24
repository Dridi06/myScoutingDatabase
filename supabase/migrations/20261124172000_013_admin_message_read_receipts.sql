alter table public.support_ticket_messages add column if not exists admin_read_at timestamptz;
update public.support_ticket_messages set admin_read_at=created_at where sender_role='scout' and admin_read_at is null;
create index if not exists support_ticket_messages_unread_admin_idx on public.support_ticket_messages(ticket_id, admin_read_at) where sender_role='scout' and admin_read_at is null;
comment on column public.support_ticket_messages.admin_read_at is 'Timestamp when an Admin read this Scout message.';
