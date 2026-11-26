-- Govern MESSINHO improvement hypotheses without allowing them to alter runtime behavior.
create table if not exists public.messinho_improvement_hypotheses (
  id uuid primary key default gen_random_uuid(),
  hypothesis_key text not null unique check (char_length(hypothesis_key) between 3 and 180),
  hypothesis_type text not null check (char_length(hypothesis_type) between 3 and 80),
  group_by text not null check (char_length(group_by) between 2 and 80),
  group_key text not null check (char_length(group_key) between 1 and 120),
  sample_size integer not null check (sample_size >= 1 and sample_size <= 1000000),
  priority text not null check (priority in ('low','medium','high')),
  proposal text not null check (char_length(btrim(proposal)) between 8 and 1200),
  status text not null default 'proposed' check (status in ('proposed','accepted','rejected','test_created','validated','rolled_back')),
  created_by uuid not null references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  review_reason text,
  test_plan text,
  evidence_url text check (evidence_url is null or evidence_url ~ '^https://[^[:space:]]+$'),
  evaluation jsonb not null default '{}'::jsonb check (jsonb_typeof(evaluation) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists messinho_improvement_hypotheses_status_idx
  on public.messinho_improvement_hypotheses(status, updated_at desc);
create table if not exists public.messinho_improvement_hypothesis_events (
  id uuid primary key default gen_random_uuid(),
  hypothesis_id uuid not null references public.messinho_improvement_hypotheses(id) on delete restrict,
  actor_id uuid not null references public.profiles(id),
  previous_status text check (previous_status is null or previous_status in ('proposed','accepted','rejected','test_created','validated','rolled_back')),
  next_status text not null check (next_status in ('proposed','accepted','rejected','test_created','validated','rolled_back')),
  action text not null check (action in ('create','accept','reject','create_test','validate','rollback')),
  reason text not null check (char_length(btrim(reason)) between 8 and 1200),
  test_plan text,
  evidence_url text check (evidence_url is null or evidence_url ~ '^https://[^[:space:]]+$'),
  evaluation jsonb not null default '{}'::jsonb check (jsonb_typeof(evaluation) = 'object'),
  created_at timestamptz not null default now()
);
create index if not exists messinho_improvement_hypothesis_events_history_idx
  on public.messinho_improvement_hypothesis_events(hypothesis_id, created_at desc);
alter table public.messinho_improvement_hypotheses enable row level security;
alter table public.messinho_improvement_hypothesis_events enable row level security;
revoke all on table public.messinho_improvement_hypotheses from public, anon, authenticated;
revoke all on table public.messinho_improvement_hypothesis_events from public, anon, authenticated, service_role;
grant select, insert, update on table public.messinho_improvement_hypotheses to service_role;
grant select, insert on table public.messinho_improvement_hypothesis_events to service_role;
drop policy if exists messinho_improvement_hypotheses_service_role_only on public.messinho_improvement_hypotheses;
create policy messinho_improvement_hypotheses_service_role_only on public.messinho_improvement_hypotheses for all to service_role using (true) with check (true);
drop policy if exists messinho_improvement_hypothesis_events_service_role_only on public.messinho_improvement_hypothesis_events;
create policy messinho_improvement_hypothesis_events_service_role_only on public.messinho_improvement_hypothesis_events for all to service_role using (true) with check (true);

create or replace function public.asi_transition_messinho_hypothesis(
 p_action text,p_reason text,p_actor_id uuid,p_hypothesis_id uuid default null,
 p_hypothesis jsonb default null,p_test_plan text default null,p_evidence_url text default null,
 p_evaluation jsonb default '{}'::jsonb
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_row public.messinho_improvement_hypotheses%rowtype; v_previous text; v_next text;
begin
 if not exists(select 1 from public.profiles where id=p_actor_id and role='admin' and approved=true and approval_status='approved') then
  raise exception 'approved_admin_required' using errcode='42501';
 end if;
 if p_action not in ('create','accept','reject','create_test','validate','rollback') then raise exception 'invalid_hypothesis_action' using errcode='22023'; end if;
 if char_length(btrim(coalesce(p_reason,'')))<8 or char_length(p_reason)>1200 then raise exception 'hypothesis_reason_required' using errcode='22023'; end if;
 if p_evidence_url is not null and p_evidence_url !~ '^https://[^[:space:]]+$' then raise exception 'hypothesis_evidence_must_be_https' using errcode='22023'; end if;
 if p_evaluation is null or jsonb_typeof(p_evaluation)<>'object' then raise exception 'hypothesis_evaluation_must_be_object' using errcode='22023'; end if;
 if p_action='create' then
  if p_hypothesis_id is not null or p_hypothesis is null or jsonb_typeof(p_hypothesis)<>'object'
   or char_length(coalesce(p_hypothesis->>'id','')) not between 3 and 180
   or char_length(coalesce(p_hypothesis->>'type','')) not between 3 and 80
   or char_length(coalesce(p_hypothesis->>'group_by','')) not between 2 and 80
   or char_length(coalesce(p_hypothesis->>'group','')) not between 1 and 120
   or coalesce((p_hypothesis->>'sample_size')::integer,0)<1
   or coalesce(p_hypothesis->>'priority','') not in ('low','medium','high')
   or char_length(coalesce(p_hypothesis->>'proposal','')) not between 8 and 1200 then raise exception 'invalid_hypothesis_payload' using errcode='22023'; end if;
  insert into public.messinho_improvement_hypotheses(hypothesis_key,hypothesis_type,group_by,group_key,sample_size,priority,proposal,created_by)
  values(p_hypothesis->>'id',p_hypothesis->>'type',p_hypothesis->>'group_by',p_hypothesis->>'group',(p_hypothesis->>'sample_size')::integer,p_hypothesis->>'priority',p_hypothesis->>'proposal',p_actor_id)
  returning * into v_row;
  insert into public.messinho_improvement_hypothesis_events(hypothesis_id,actor_id,previous_status,next_status,action,reason,evaluation)
  values(v_row.id,p_actor_id,null,'proposed','create',btrim(p_reason),'{}'::jsonb);
  return to_jsonb(v_row);
 end if;
 if p_hypothesis_id is null then raise exception 'hypothesis_id_required' using errcode='22023'; end if;
 select * into v_row from public.messinho_improvement_hypotheses where id=p_hypothesis_id for update;
 if not found then raise exception 'hypothesis_not_found' using errcode='P0002'; end if;
 v_previous:=v_row.status;
 v_next:=case p_action when 'accept' then 'accepted' when 'reject' then 'rejected' when 'create_test' then 'test_created' when 'validate' then 'validated' when 'rollback' then 'rolled_back' end;
 if (p_action in ('accept','reject') and v_previous<>'proposed') or (p_action='create_test' and v_previous<>'accepted')
  or (p_action='validate' and v_previous<>'test_created') or (p_action='rollback' and v_previous not in ('accepted','test_created','validated')) then
  raise exception 'hypothesis_transition_not_allowed' using errcode='23514';
 end if;
 if p_action='create_test' and char_length(btrim(coalesce(p_test_plan,'')))<20 then raise exception 'hypothesis_test_plan_required' using errcode='22023'; end if;
 if p_action='validate' and (p_evidence_url is null or coalesce(p_evaluation->>'passed','false')<>'true' or char_length(coalesce(p_evaluation->>'summary',''))<12) then
  raise exception 'hypothesis_validation_evidence_required' using errcode='23514'; end if;
 update public.messinho_improvement_hypotheses set status=v_next,reviewed_by=p_actor_id,review_reason=btrim(p_reason),
  test_plan=case when p_action='create_test' then btrim(p_test_plan) else test_plan end,
  evidence_url=coalesce(p_evidence_url,evidence_url),evaluation=case when p_action='validate' then p_evaluation else evaluation end,
  updated_at=now() where id=p_hypothesis_id returning * into v_row;
 insert into public.messinho_improvement_hypothesis_events(hypothesis_id,actor_id,previous_status,next_status,action,reason,test_plan,evidence_url,evaluation)
 values(p_hypothesis_id,p_actor_id,v_previous,v_next,p_action,btrim(p_reason),p_test_plan,p_evidence_url,p_evaluation);
 return to_jsonb(v_row);
end; $$;
revoke all on function public.asi_transition_messinho_hypothesis(text,text,uuid,uuid,jsonb,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.asi_transition_messinho_hypothesis(text,text,uuid,uuid,jsonb,text,text,jsonb) to service_role;
