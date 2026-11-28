create or replace function public.enforce_messinho_myki_ticket_retention()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_category text;
  v_old record;
begin
  perform pg_catalog.pg_advisory_xact_lock(20261128, 50);
  v_category := case when new.error_code = 'diagnostic_finding' then 'diagnostic' else 'development' end;

  for v_old in
    select t.id, t.ticket_id, t.status, t.fingerprint
    from public.messinho_myki_tickets as t
    where t.status <> 'deleted'
      and (
        (v_category = 'diagnostic' and t.error_code = 'diagnostic_finding')
        or
        (v_category = 'development' and t.error_code is distinct from 'diagnostic_finding')
      )
    order by t.created_at desc, t.id desc
    offset 50
  loop
    update public.messinho_myki_tickets
    set status = 'deleted',
        deleted_at = pg_catalog.clock_timestamp(),
        updated_at = pg_catalog.clock_timestamp()
    where id = v_old.id
      and status <> 'deleted';

    if found then
      insert into public.messinho_myki_ticket_events
        (ticket_id, actor_type, action, from_status, to_status, safe_message, metadata)
      values
        (v_old.id, 'system', 'retention_pruned', v_old.status, 'deleted',
         'Ältestes Ticket wurde gemäß der 50-Ticket-Aufbewahrungsgrenze aus dem aktiven Eingang entfernt.',
         pg_catalog.jsonb_build_object('active_limit', 50, 'category', v_category, 'fingerprint', v_old.fingerprint));
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists messinho_myki_ticket_retention_after_insert on public.messinho_myki_tickets;
create trigger messinho_myki_ticket_retention_after_insert
after insert on public.messinho_myki_tickets
for each row execute function public.enforce_messinho_myki_ticket_retention();

comment on function public.enforce_messinho_myki_ticket_retention() is
'Keeps at most 50 active diagnostic tickets and 50 active development tickets. Older tickets are soft-deleted and an audit event is retained.';
