-- Preserve the pre-conflict state and restore it only after all competing proposals are reviewed.
alter table public.messinho_knowledge_conflicts
  add column if not exists previous_concept_status text not null default 'active'
  check (previous_concept_status in ('candidate','active','conflicting'));

create or replace function public.messinho_record_knowledge_conflict(
  p_concept_id uuid,p_proposed_concept jsonb,p_evidence jsonb,p_conflict_reason text
) returns uuid
language plpgsql security definer set search_path=public,pg_temp
as $function$
declare v_current public.messinho_knowledge_concepts; v_updated public.messinho_knowledge_concepts; v_conflict_id uuid:=gen_random_uuid();
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
  if p_concept_id is null or jsonb_typeof(p_proposed_concept)<>'object'
     or jsonb_typeof(coalesce(p_evidence,'{}'::jsonb))<>'object'
     or char_length(coalesce(p_conflict_reason,'')) not between 5 and 500 then
    raise exception 'invalid_conflict_payload' using errcode='22023';
  end if;
  select * into v_current from public.messinho_knowledge_concepts where id=p_concept_id for update;
  if not found then raise exception 'concept_not_found' using errcode='P0002'; end if;
  insert into public.messinho_knowledge_conflicts(id,concept_id,proposed_concept,evidence,conflict_reason,status,previous_concept_status)
    values(v_conflict_id,p_concept_id,p_proposed_concept,p_evidence,p_conflict_reason,'open',v_current.knowledge_status);
  if v_current.knowledge_status='active' then
    update public.messinho_knowledge_concepts set knowledge_status='conflicting',version=version+1,updated_at=now()
      where id=p_concept_id returning * into v_updated;
    insert into public.messinho_knowledge_versions(concept_id,version,snapshot,change_reason,changed_by)
      values(v_updated.id,v_updated.version,to_jsonb(v_updated),'Automatically quarantined after a competing source-backed concept was detected','messinho');
  end if;
  return v_conflict_id;
end;
$function$;
revoke all on function public.messinho_record_knowledge_conflict(uuid,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.messinho_record_knowledge_conflict(uuid,jsonb,jsonb,text) to service_role;

create or replace function public.messinho_resolve_knowledge_conflict(
  p_conflict_id uuid,p_decision text,p_reason text,p_reviewer_id uuid
) returns table(conflict_id uuid,conflict_status text,concept_status text,concept_version integer)
language plpgsql security definer set search_path=public,pg_temp
as $function$
declare v_conflict public.messinho_knowledge_conflicts; v_concept public.messinho_knowledge_concepts; v_other_open integer;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'service_role_required' using errcode='42501'; end if;
  if p_conflict_id is null or p_reviewer_id is null or p_decision is null or p_decision not in ('reject_proposal','keep_existing')
     or char_length(coalesce(p_reason,'')) not between 10 and 500 then
    raise exception 'invalid_conflict_resolution' using errcode='22023';
  end if;
  if not exists(select 1 from public.profiles p where p.id=p_reviewer_id and p.role='admin' and p.approved=true and p.approval_status='approved') then
    raise exception 'approved_admin_required' using errcode='42501';
  end if;
  select * into v_conflict from public.messinho_knowledge_conflicts where id=p_conflict_id for update;
  if not found then raise exception 'conflict_not_found' using errcode='P0002'; end if;
  if v_conflict.status<>'open' then raise exception 'conflict_already_reviewed' using errcode='55000'; end if;
  select * into v_concept from public.messinho_knowledge_concepts where id=v_conflict.concept_id for update;
  if not found then raise exception 'concept_not_found' using errcode='P0002'; end if;
  select count(*) into v_other_open from public.messinho_knowledge_conflicts
    where concept_id=v_conflict.concept_id and status='open' and id<>p_conflict_id;
  if v_other_open=0 and v_concept.knowledge_status='conflicting' then
    update public.messinho_knowledge_concepts
      set knowledge_status=v_conflict.previous_concept_status,version=version+1,updated_at=now()
      where id=v_concept.id returning * into v_concept;
    insert into public.messinho_knowledge_versions(concept_id,version,snapshot,change_reason,changed_by)
      values(v_concept.id,v_concept.version,to_jsonb(v_concept),'Conflict reviewed; prior knowledge state restored: '||p_reason,'admin:'||p_reviewer_id::text);
  end if;
  update public.messinho_knowledge_conflicts
    set status=case when p_decision='reject_proposal' then 'rejected' else 'resolved' end,
        reviewed_by=p_reviewer_id::text,reviewed_at=now(),resolution_note=p_reason
    where id=p_conflict_id returning * into v_conflict;
  return query select v_conflict.id,v_conflict.status,v_concept.knowledge_status,v_concept.version;
end;
$function$;
revoke all on function public.messinho_resolve_knowledge_conflict(uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.messinho_resolve_knowledge_conflict(uuid,text,text,uuid) to service_role;
