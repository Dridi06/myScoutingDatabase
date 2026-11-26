-- MESSINHO feedback ledger and atomic admin review functions.
-- Feedback is kept separate from verified football outcomes and model-weight training.

create table if not exists public.messinho_feedback (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  submitted_role text not null check (submitted_role in ('admin','scout')),
  message_id text not null check (char_length(message_id) between 3 and 100),
  question text not null check (char_length(question) between 1 and 1200),
  answer text not null check (char_length(answer) between 1 and 6000),
  feedback_type text not null check (feedback_type in ('quality_rating','factual_correction','bug_report','feature_request')),
  rating smallint check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1200),
  intent text check (intent is null or char_length(intent) <= 80),
  engine_version text check (engine_version is null or char_length(engine_version) <= 40),
  model_version text check (model_version is null or char_length(model_version) <= 80),
  capability_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(capability_ids) = 'array'),
  status text not null default 'pending' check (status in ('pending','reviewed','verified','rejected','applied')),
  reviewer_id uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_reason text check (review_reason is null or char_length(review_reason) <= 1200),
  evidence_url text check (evidence_url is null or evidence_url ~ '^https://[^[:space:]]+$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint messinho_feedback_owner_message_unique unique(owner_id,message_id),
  constraint messinho_feedback_rating_required check (feedback_type <> 'quality_rating' or rating is not null),
  constraint messinho_feedback_detail_required check (feedback_type = 'quality_rating' or (comment is not null and char_length(btrim(comment)) >= 8))
);

comment on table public.messinho_feedback is
  'Auditable MESSINHO answer feedback. Never used as verified player outcome or model-weight training data.';

create index if not exists messinho_feedback_review_queue_idx
  on public.messinho_feedback(status, created_at desc);
create index if not exists messinho_feedback_owner_history_idx
  on public.messinho_feedback(owner_id, created_at desc);

alter table public.messinho_feedback enable row level security;
revoke all on table public.messinho_feedback from public, anon, authenticated;
grant select, insert, update, delete on table public.messinho_feedback to service_role;
drop policy if exists messinho_feedback_service_role_only on public.messinho_feedback;
create policy messinho_feedback_service_role_only on public.messinho_feedback
  for all to service_role using (true) with check (true);

-- Atomic, server-mediated scout calibration review. The API authenticates the admin;
-- the function independently checks that the supplied actor is an approved admin.
create or replace function public.asi_review_scout_calibration(
  p_record_id uuid,
  p_decision text,
  p_reason text,
  p_verified_outcome numeric default null,
  p_observed_on date default null,
  p_source_url text default null,
  p_actor_id uuid default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_record public.asi_scout_calibration_records%rowtype;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and role = 'admin' and approved = true and approval_status = 'approved'
  ) then
    raise exception 'approved_admin_required' using errcode = '42501';
  end if;
  if p_decision not in ('verify','reject') then
    raise exception 'invalid_calibration_decision' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_reason,''))) < 8 or char_length(p_reason) > 1200 then
    raise exception 'calibration_review_reason_required' using errcode = '22023';
  end if;
  if p_decision = 'verify' then
    if p_verified_outcome is null or p_verified_outcome < 0 or p_verified_outcome > 100 then
      raise exception 'invalid_verified_outcome' using errcode = '22023';
    end if;
    if p_observed_on is null or p_observed_on > current_date then
      raise exception 'invalid_observation_date' using errcode = '22023';
    end if;
    if p_source_url is null or p_source_url !~ '^https://[^[:space:]]+$' then
      raise exception 'https_source_required' using errcode = '22023';
    end if;
    update public.asi_scout_calibration_records
      set verification_status = 'verified', verified_outcome = p_verified_outcome,
          outcome_observed_on = p_observed_on, verification_source_url = p_source_url,
          verification_reason = btrim(p_reason), verified_by = p_actor_id, updated_at = now()
      where id = p_record_id and verification_status = 'pending'
      returning * into v_record;
  else
    update public.asi_scout_calibration_records
      set verification_status = 'rejected', verified_outcome = null, outcome_observed_on = null,
          verification_source_url = null, verification_reason = btrim(p_reason),
          verified_by = p_actor_id, updated_at = now()
      where id = p_record_id and verification_status = 'pending'
      returning * into v_record;
  end if;
  if not found then raise exception 'calibration_not_pending_or_missing' using errcode = 'P0002'; end if;
  return to_jsonb(v_record);
end;
$$;
revoke all on function public.asi_review_scout_calibration(uuid,text,text,numeric,date,text,uuid) from public, anon, authenticated;
grant execute on function public.asi_review_scout_calibration(uuid,text,text,numeric,date,text,uuid) to service_role;

-- Atomic model approval/rejection; candidate activation and retirement of the old
-- active version happen in one transaction. Feedback records never enter this path.
create or replace function public.asi_review_model_candidate(
  p_model_version_id uuid,
  p_decision text,
  p_reason text,
  p_actor_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_candidate public.asi_model_versions%rowtype;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and role = 'admin' and approved = true and approval_status = 'approved'
  ) then
    raise exception 'approved_admin_required' using errcode = '42501';
  end if;
  if p_decision not in ('approve','reject') then
    raise exception 'invalid_model_decision' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_reason,''))) < 8 or char_length(p_reason) > 1200 then
    raise exception 'model_review_reason_required' using errcode = '22023';
  end if;
  select * into v_candidate from public.asi_model_versions
    where id = p_model_version_id and model_key = 'messinho_position_weights' and status = 'candidate'
    for update;
  if not found then raise exception 'model_candidate_not_found' using errcode = 'P0002'; end if;
  if p_decision = 'approve' then
    if coalesce((v_candidate.metrics->>'trained')::boolean,false) is not true
      or jsonb_typeof(v_candidate.configuration->'profiles') <> 'object'
      or not exists (select 1 from public.asi_model_evaluations e where e.model_version_id = p_model_version_id and e.passed = true)
    then
      raise exception 'model_candidate_failed_evaluation_gate' using errcode = '23514';
    end if;
    update public.asi_model_versions set status = 'retired'
      where model_key = 'messinho_position_weights' and status = 'active' and id <> p_model_version_id;
    update public.asi_model_versions
      set status = 'active', approved_by = p_actor_id, approved_at = now(),
          metrics = metrics || jsonb_build_object('review',jsonb_build_object('decision','approve','reason',btrim(p_reason),'reviewed_at',now(),'reviewed_by',p_actor_id))
      where id = p_model_version_id and status = 'candidate'
      returning * into v_candidate;
  else
    update public.asi_model_versions
      set status = 'retired',
          metrics = metrics || jsonb_build_object('review',jsonb_build_object('decision','reject','reason',btrim(p_reason),'reviewed_at',now(),'reviewed_by',p_actor_id))
      where id = p_model_version_id and status = 'candidate'
      returning * into v_candidate;
  end if;
  if not found then raise exception 'model_candidate_state_changed' using errcode = '40001'; end if;
  return to_jsonb(v_candidate);
end;
$$;
revoke all on function public.asi_review_model_candidate(uuid,text,text,uuid) from public, anon, authenticated;
grant execute on function public.asi_review_model_candidate(uuid,text,text,uuid) to service_role;
