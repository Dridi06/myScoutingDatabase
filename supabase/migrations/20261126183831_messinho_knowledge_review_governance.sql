-- STAGING-only MESSINHO knowledge candidate and admin review governance.
create table if not exists public.messinho_knowledge_reviews (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.messinho_knowledge_concepts(id) on delete restrict,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  decision text not null check (decision in ('approved','rejected','marked_conflicting')),
  previous_status text not null,
  resulting_status text not null,
  reason text not null check (char_length(reason) between 10 and 500),
  created_at timestamptz not null default now()
);
create index if not exists messinho_knowledge_reviews_concept_idx
  on public.messinho_knowledge_reviews(concept_id,created_at desc);
alter table public.messinho_knowledge_reviews enable row level security;
revoke all on public.messinho_knowledge_reviews from public,anon,authenticated;
grant all on public.messinho_knowledge_reviews to service_role;

create or replace function public.messinho_create_knowledge_candidate(
  p_record jsonb,
  p_change_reason text default 'Initial verified compact knowledge candidate'
)
returns table(id uuid,concept_key text,version integer,knowledge_status text)
language plpgsql
security definer
set search_path=public,pg_temp
as $function$
declare
  v_row public.messinho_knowledge_concepts;
  v_saved public.messinho_knowledge_concepts;
  v_id uuid := gen_random_uuid();
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'service_role_required' using errcode='42501';
  end if;
  if jsonb_typeof(p_record) <> 'object' or p_record->>'knowledge_status' <> 'candidate'
     or p_record->>'rights' is null then
    raise exception 'invalid_candidate_payload' using errcode='22023';
  end if;
  v_row := jsonb_populate_record(
    null::public.messinho_knowledge_concepts,
    p_record || jsonb_build_object('id',v_id,'version',1,'knowledge_status','candidate','created_at',now(),'updated_at',now())
  );
  insert into public.messinho_knowledge_concepts select (v_row).* returning * into v_saved;
  insert into public.messinho_knowledge_versions(concept_id,version,snapshot,change_reason,changed_by)
  values(v_saved.id,1,to_jsonb(v_saved)||jsonb_build_object('content_fingerprint',p_record->'content_fingerprint'),
    left(coalesce(p_change_reason,'Initial verified compact knowledge candidate'),500),'messinho');
  return query select v_saved.id,v_saved.concept_key,v_saved.version,v_saved.knowledge_status;
end;
$function$;

create or replace function public.messinho_review_knowledge_concept(
  p_concept_id uuid,p_decision text,p_reason text,p_reviewer_id uuid
)
returns table(id uuid,knowledge_status text,version integer)
language plpgsql
security definer
set search_path=public,pg_temp
as $function$
declare
  v_current public.messinho_knowledge_concepts;
  v_updated public.messinho_knowledge_concepts;
  v_next_version integer;
  v_decision text;
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'service_role_required' using errcode='42501';
  end if;
  if p_reviewer_id is null or p_decision not in ('approve','reject','mark_conflicting')
     or char_length(coalesce(p_reason,'')) not between 10 and 500 then
    raise exception 'invalid_review_request' using errcode='22023';
  end if;
  if not exists(select 1 from public.profiles p where p.id=p_reviewer_id and p.role='admin' and p.approved=true and p.approval_status='approved') then
    raise exception 'approved_admin_required' using errcode='42501';
  end if;
  select * into v_current from public.messinho_knowledge_concepts where messinho_knowledge_concepts.id=p_concept_id for update;
  if not found then raise exception 'concept_not_found' using errcode='P0002'; end if;
  if v_current.knowledge_status not in ('candidate','conflicting') then
    raise exception 'concept_not_reviewable' using errcode='55000';
  end if;
  if p_decision='approve' then
    if v_current.knowledge_status <> 'candidate'
       or v_current.rights->>'status' <> 'verified_permitted'
       or v_current.rights->>'ai_tdm' <> 'true'
       or v_current.rights->>'commercial_use' <> 'true'
       or v_current.rights->>'derivative_use' <> 'true'
       or jsonb_array_length(v_current.sources) < 2
       or jsonb_array_length(v_current.claims) < 1 then
      raise exception 'candidate_evidence_or_rights_incomplete' using errcode='55000';
    end if;
    v_decision := 'approved';
    update public.messinho_knowledge_concepts set knowledge_status='active',updated_at=now()
      where messinho_knowledge_concepts.id=p_concept_id returning * into v_updated;
  elsif p_decision='reject' then
    v_decision := 'rejected';
    update public.messinho_knowledge_concepts set knowledge_status='rejected',updated_at=now()
      where messinho_knowledge_concepts.id=p_concept_id returning * into v_updated;
  else
    v_decision := 'marked_conflicting';
    update public.messinho_knowledge_concepts set knowledge_status='conflicting',updated_at=now()
      where messinho_knowledge_concepts.id=p_concept_id returning * into v_updated;
  end if;
  v_next_version := v_updated.version + 1;
  update public.messinho_knowledge_concepts set version=v_next_version where messinho_knowledge_concepts.id=p_concept_id returning * into v_updated;
  insert into public.messinho_knowledge_versions(concept_id,version,snapshot,change_reason,changed_by)
  values(v_updated.id,v_next_version,to_jsonb(v_updated),left(p_reason,500),'admin:'||p_reviewer_id::text);
  insert into public.messinho_knowledge_reviews(concept_id,reviewer_id,decision,previous_status,resulting_status,reason)
  values(v_updated.id,p_reviewer_id,v_decision,v_current.knowledge_status,v_updated.knowledge_status,p_reason);
  return query select v_updated.id,v_updated.knowledge_status,v_updated.version;
end;
$function$;

revoke all on function public.messinho_create_knowledge_candidate(jsonb,text) from public,anon,authenticated;
grant execute on function public.messinho_create_knowledge_candidate(jsonb,text) to service_role;
revoke all on function public.messinho_review_knowledge_concept(uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.messinho_review_knowledge_concept(uuid,text,text,uuid) to service_role;
