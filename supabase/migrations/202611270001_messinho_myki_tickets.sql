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

-- Atomic trusted MESSINHO submission: ticket and first audit event commit together.
create or replace function public.asi_create_messinho_myki_ticket(p_ticket jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.messinho_myki_tickets;
begin
  insert into public.messinho_myki_tickets (
    id,ticket_id,title,explanation,rationale,diff,files,tests,risks,rollback,
    baseline_id,candidate_id,fingerprint,status,created_at,updated_at
  ) values (
    (p_ticket->>'id')::uuid,p_ticket->>'ticket_id',p_ticket->>'title',
    p_ticket->>'explanation',p_ticket->>'rationale',p_ticket->>'diff',
    coalesce(p_ticket->'files','[]'::jsonb),coalesce(p_ticket->'tests','[]'::jsonb),
    coalesce(p_ticket->>'risks',''),p_ticket->>'rollback',p_ticket->>'baseline_id',
    p_ticket->>'candidate_id',p_ticket->>'fingerprint','submitted',
    coalesce((p_ticket->>'created_at')::timestamptz,now()),
    coalesce((p_ticket->>'updated_at')::timestamptz,now())
  ) returning * into v_ticket;
  insert into public.messinho_myki_ticket_events(ticket_id,actor_type,action,to_status,safe_message)
  values(v_ticket.id,'messinho','submitted','submitted','MESSINHO hat einen Verbesserungsvorschlag eingereicht.');
  return to_jsonb(v_ticket);
end;
$$;

-- Atomic Admin soft-delete and audit event. Admin approval is rechecked in the DB.
create or replace function public.asi_admin_delete_messinho_myki_ticket(p_ticket_id uuid,p_actor_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.messinho_myki_tickets;
begin
  if not exists (
    select 1 from public.profiles
    where id=p_actor_id and role='admin' and approved=true and approval_status='approved'
  ) then
    raise exception 'approved_admin_required' using errcode='42501';
  end if;
  select * into v_ticket from public.messinho_myki_tickets
  where id=p_ticket_id and status <> 'deleted'
  for update;
  if not found then return false; end if;
  if v_ticket.status='integrating' then
    raise exception 'ticket_integration_in_progress' using errcode='55000';
  end if;
  update public.messinho_myki_tickets
  set status='deleted',deleted_at=now(),updated_at=now()
  where id=p_ticket_id;
  insert into public.messinho_myki_ticket_events(ticket_id,actor_id,actor_type,action,from_status,to_status,safe_message)
  values(p_ticket_id,p_actor_id,'admin','deleted',v_ticket.status,'deleted','Ticket aus dem aktiven myKI-Eingang entfernt.');
  return true;
end;
$$;

revoke all on function public.asi_create_messinho_myki_ticket(jsonb) from public,anon,authenticated;
revoke all on function public.asi_admin_delete_messinho_myki_ticket(uuid,uuid) from public,anon,authenticated;
grant execute on function public.asi_create_messinho_myki_ticket(jsonb) to service_role;
grant execute on function public.asi_admin_delete_messinho_myki_ticket(uuid,uuid) to service_role;

grant usage, select on sequence public.messinho_myki_ticket_events_id_seq to service_role;
