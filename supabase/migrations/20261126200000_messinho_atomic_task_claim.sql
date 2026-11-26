-- STAGING-only: safe atomic claim primitive for explicitly opted-in MESSINHO tasks.
-- No existing task is opted in by this migration.
alter table public.messinho_agent_tasks
  add column if not exists autonomous_resume_enabled boolean not null default false,
  add column if not exists next_retry_at timestamptz,
  add column if not exists claimed_by text,
  add column if not exists lease_token uuid;

alter table public.messinho_agent_tasks
  drop constraint if exists messinho_agent_tasks_claimed_by_length_check;
alter table public.messinho_agent_tasks
  add constraint messinho_agent_tasks_claimed_by_length_check
  check (claimed_by is null or char_length(claimed_by) between 1 and 120);

create index if not exists messinho_agent_tasks_resume_queue_idx
  on public.messinho_agent_tasks(next_retry_at, created_at)
  where autonomous_resume_enabled = true and status in ('queued','partial');

create or replace function public.claim_next_messinho_agent_task(p_worker_id text)
returns setof public.messinho_agent_tasks
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  if p_worker_id is null or char_length(p_worker_id) < 1 or char_length(p_worker_id) > 120 then
    raise exception 'invalid_worker_id' using errcode = '22023';
  end if;

  return query
  update public.messinho_agent_tasks as task
  set status = 'running',
      attempt_count = task.attempt_count + 1,
      claimed_by = p_worker_id,
      lease_token = gen_random_uuid(),
      lease_until = now() + interval '2 minutes',
      updated_at = now()
  where task.id = (
    select candidate.id
    from public.messinho_agent_tasks as candidate
    where candidate.autonomous_resume_enabled = true
      and candidate.status in ('queued','partial')
      and candidate.expires_at > now()
      and candidate.attempt_count < 4
      and (candidate.next_retry_at is null or candidate.next_retry_at <= now())
    order by candidate.next_retry_at nulls first, candidate.created_at asc
    for update skip locked
    limit 1
  )
  returning task.*;
end;
$$;

revoke all on function public.claim_next_messinho_agent_task(text) from public, anon, authenticated;
grant execute on function public.claim_next_messinho_agent_task(text) to service_role;
