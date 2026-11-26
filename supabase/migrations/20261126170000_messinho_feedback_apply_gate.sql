-- A factual correction must be verified with evidence before it can be marked applied.
-- This preserves the meaning of the quality-intelligence verified-correction metric.
create or replace function public.asi_review_messinho_feedback(
  p_feedback_id uuid,
  p_decision text,
  p_reason text,
  p_evidence_url text default null,
  p_actor_id uuid default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_feedback public.messinho_feedback%rowtype;
  v_updated public.messinho_feedback%rowtype;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and role = 'admin' and approved = true and approval_status = 'approved'
  ) then
    raise exception 'approved_admin_required' using errcode = '42501';
  end if;
  if p_decision is null or p_decision not in ('reviewed','verified','rejected','applied') then
    raise exception 'invalid_feedback_decision' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_reason,''))) < 8 or char_length(p_reason) > 1200 then
    raise exception 'feedback_review_reason_required' using errcode = '22023';
  end if;
  if p_evidence_url is not null and p_evidence_url !~ '^https://[^[:space:]]+$' then
    raise exception 'feedback_evidence_must_be_https' using errcode = '22023';
  end if;
  select * into v_feedback from public.messinho_feedback where id = p_feedback_id for update;
  if not found then raise exception 'feedback_not_found' using errcode = 'P0002'; end if;
  if p_decision = 'verified' then
    if v_feedback.feedback_type <> 'factual_correction' or p_evidence_url is null
      or v_feedback.status not in ('pending','reviewed') then
      raise exception 'feedback_verification_gate_failed' using errcode = '23514';
    end if;
  elsif p_decision = 'reviewed' then
    if v_feedback.status <> 'pending' then raise exception 'feedback_transition_not_allowed' using errcode = '23514'; end if;
  elsif p_decision = 'rejected' then
    if v_feedback.status not in ('pending','reviewed') then raise exception 'feedback_transition_not_allowed' using errcode = '23514';
    end if;
  elsif p_decision = 'applied' then
    if v_feedback.feedback_type = 'factual_correction' then
      if v_feedback.status <> 'verified' then
        raise exception 'factual_correction_must_be_verified_before_apply' using errcode = '23514';
      end if;
    elsif v_feedback.status <> 'reviewed' then
      raise exception 'feedback_transition_not_allowed' using errcode = '23514';
    end if;
  end if;
  insert into public.messinho_feedback_reviews(feedback_id,reviewer_id,previous_status,decision,reason,evidence_url)
    values(p_feedback_id,p_actor_id,v_feedback.status,p_decision,btrim(p_reason),p_evidence_url);
  update public.messinho_feedback
    set status = p_decision, reviewer_id = p_actor_id, reviewed_at = now(),
        review_reason = btrim(p_reason), evidence_url = p_evidence_url, updated_at = now()
    where id = p_feedback_id returning * into v_updated;
  return to_jsonb(v_updated);
end;
$$;
revoke all on function public.asi_review_messinho_feedback(uuid,text,text,text,uuid) from public, anon, authenticated;
grant execute on function public.asi_review_messinho_feedback(uuid,text,text,text,uuid) to service_role;
