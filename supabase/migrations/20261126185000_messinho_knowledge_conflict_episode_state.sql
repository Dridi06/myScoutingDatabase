-- Preserve the original state across every conflict in one open conflict episode.
-- Without this, a second proposal arriving while a concept is already quarantined
-- would store "conflicting" as its prior state and prevent restoration after review.
create or replace function public.messinho_record_knowledge_conflict(
  p_concept_id uuid,p_proposed_concept jsonb,p_evidence jsonb,p_conflict_reason text
) returns uuid
language plpgsql security definer set search_path=public,pg_temp
as $function$
declare
  v_current public.messinho_knowledge_concepts;
  v_updated public.messinho_knowledge_concepts;
  v_conflict_id uuid:=gen_random_uuid();
  v_previous_status text;
begin
  if coalesce(auth.role(),'')<>'service_role' then
    raise exception 'service_role_required' using errcode='42501';
  end if;
  if p_concept_id is null or jsonb_typeof(p_proposed_concept)<>'object'
     or jsonb_typeof(coalesce(p_evidence,'{}'::jsonb))<>'object'
     or char_length(coalesce(p_conflict_reason,'')) not between 5 and 500 then
    raise exception 'invalid_conflict_payload' using errcode='22023';
  end if;

  select * into v_current
  from public.messinho_knowledge_concepts
  where id=p_concept_id
  for update;
  if not found then raise exception 'concept_not_found' using errcode='P0002'; end if;

  v_previous_status:=v_current.knowledge_status;
  if v_current.knowledge_status='conflicting' then
    select previous_concept_status into v_previous_status
    from public.messinho_knowledge_conflicts
    where concept_id=p_concept_id and status='open'
      and previous_concept_status in ('candidate','active')
    order by created_at asc,id asc
    limit 1;
    v_previous_status:=coalesce(v_previous_status,'conflicting');
  end if;

  insert into public.messinho_knowledge_conflicts(
    id,concept_id,proposed_concept,evidence,conflict_reason,status,previous_concept_status
  ) values (
    v_conflict_id,p_concept_id,p_proposed_concept,coalesce(p_evidence,'{}'::jsonb),
    p_conflict_reason,'open',v_previous_status
  );

  if v_current.knowledge_status='active' then
    update public.messinho_knowledge_concepts
      set knowledge_status='conflicting',version=version+1,updated_at=now()
      where id=p_concept_id returning * into v_updated;
    insert into public.messinho_knowledge_versions(concept_id,version,snapshot,change_reason,changed_by)
      values(v_updated.id,v_updated.version,to_jsonb(v_updated),
        'Automatically quarantined after a competing source-backed concept was detected','messinho');
  end if;

  return v_conflict_id;
end;
$function$;
revoke all on function public.messinho_record_knowledge_conflict(uuid,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.messinho_record_knowledge_conflict(uuid,jsonb,jsonb,text) to service_role;
