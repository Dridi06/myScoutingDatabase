-- Prevent Scout replies after a ticket has been resolved.
-- Locking the ticket row serializes this check against the Admin's resolve update,
-- closing the race where a Scout message could otherwise slip in concurrently.

create or replace function public.prevent_scout_messages_on_resolved_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ticket_status text;
begin
  if new.sender_role = 'scout' then
    select status
      into ticket_status
      from public.support_tickets
      where id = new.ticket_id
      for update;

    if ticket_status is distinct from 'offen' then
      raise exception 'Dieses Ticket ist bereits erledigt. Du kannst den Verlauf weiterhin lesen.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_scout_messages_on_resolved_ticket
  on public.support_ticket_messages;

create trigger trg_prevent_scout_messages_on_resolved_ticket
before insert on public.support_ticket_messages
for each row
execute function public.prevent_scout_messages_on_resolved_ticket();

comment on function public.prevent_scout_messages_on_resolved_ticket() is
  'Prevents Scout replies on resolved tickets, including concurrent requests.';
