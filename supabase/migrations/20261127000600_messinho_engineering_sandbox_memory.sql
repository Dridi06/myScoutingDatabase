-- Durable engineering job ledger and evidence-backed programming memory.
-- Apply to the STAGING Supabase project only.

create table if not exists public.messinho_engineering_jobs (
  id uuid primary key,
  ticket_id uuid not null references public.messinho_myki_tickets(id) on delete restrict,
  requested_by uuid not null references auth.users(id) on delete restrict,
  source_sha text not null check (source_sha ~ '^[a-f0-9]{40}$'),
  patch_sha256 text not null check (patch_sha256 ~ '^[a-f0-9]{64}$'),
  status text not null check (status in ('queued','completed','failed','inconclusive')),
  github_run_id bigint,
  github_run_attempt integer not null default 1 check (github_run_attempt > 0),
  result jsonb not null default '{}'::jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists messinho_engineering_jobs_ticket_created_idx
  on public.messinho_engineering_jobs(ticket_id,created_at desc);
create unique index if not exists messinho_engineering_jobs_one_active_per_ticket_idx
  on public.messinho_engineering_jobs(ticket_id) where status='queued';

create table if not exists public.messinho_engineering_memory (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.messinho_engineering_jobs(id) on delete restrict,
  ticket_id uuid not null references public.messinho_myki_tickets(id) on delete restrict,
  source_sha text not null check (source_sha ~ '^[a-f0-9]{40}$'),
  patch_sha256 text not null check (patch_sha256 ~ '^[a-f0-9]{64}$'),
  outcome text not null check (outcome in ('passed','failed','inconclusive')),
  summary text not null,
  evidence jsonb not null default '{}'::jsonb check (octet_length(evidence::text) <= 20000),
  toolchain jsonb not null default '{}'::jsonb,
  evidence_verified boolean not null default false,
  review_state text not null default 'pending_admin_review'
    check (review_state in ('pending_admin_review','approved','rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messinho_engineering_memory_review_idx
  on public.messinho_engineering_memory(review_state,created_at desc);
create index if not exists messinho_engineering_memory_outcome_idx
  on public.messinho_engineering_memory(outcome,created_at desc);

alter table public.messinho_engineering_jobs enable row level security;
alter table public.messinho_engineering_memory enable row level security;
revoke all on public.messinho_engineering_jobs, public.messinho_engineering_memory from public,anon,authenticated;
grant select,insert,update on public.messinho_engineering_jobs to service_role;
grant select,insert,update on public.messinho_engineering_memory to service_role;

create or replace function public.asi_record_messinho_engineering_result(p_result jsonb)
returns jsonb
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_job public.messinho_engineering_jobs;
  v_outcome text;
  v_ticket public.messinho_myki_tickets;
begin
  select * into v_job from public.messinho_engineering_jobs
   where id=(p_result->>'job_id')::uuid for update;
  if not found then raise exception 'sandbox_job_not_found' using errcode='P0002'; end if;
  if v_job.ticket_id<>(p_result->>'ticket_id')::uuid
     or v_job.source_sha<>p_result->>'source_sha'
     or v_job.patch_sha256<>p_result->>'patch_sha256' then
    raise exception 'sandbox_result_identity_mismatch' using errcode='22000';
  end if;
  if exists(select 1 from public.messinho_engineering_memory where job_id=v_job.id) then
    return jsonb_build_object('accepted',true,'duplicate',true);
  end if;
  if v_job.status<>'queued' then
    raise exception 'sandbox_job_not_pending' using errcode='55000';
  end if;
  v_outcome:=p_result->>'outcome';
  if v_outcome not in ('passed','failed','inconclusive') then
    raise exception 'sandbox_outcome_invalid' using errcode='22000';
  end if;

  update public.messinho_engineering_jobs
    set status=case when v_outcome='passed' then 'completed' else v_outcome end,
        github_run_id=nullif(p_result->>'github_run_id','')::bigint,
        github_run_attempt=coalesce(nullif(p_result->>'github_run_attempt','')::integer,1),
        result=p_result,started_at=coalesce(started_at,now()),finished_at=now()
    where id=v_job.id;

  insert into public.messinho_engineering_memory(
    job_id,ticket_id,source_sha,patch_sha256,outcome,summary,evidence,toolchain,evidence_verified
  ) values (
    v_job.id,v_job.ticket_id,v_job.source_sha,v_job.patch_sha256,v_outcome,
    left(coalesce(p_result->>'summary','Sandbox-Prüfung abgeschlossen.'),1000),
    coalesce(p_result->'evidence','{}'::jsonb),coalesce(p_result->'toolchain','{}'::jsonb),
    v_outcome in ('passed','failed')
  );

  select * into v_ticket from public.messinho_myki_tickets where id=v_job.ticket_id for update;
  if found then
    update public.messinho_myki_tickets
      set status=case when status='submitted' then 'reviewing' else status end,
          tests=coalesce(tests,'[]'::jsonb)||jsonb_build_array(jsonb_build_object(
            'name','Isolierter MESSINHO-Sandbox-Test','status',v_outcome,
            'details',left(coalesce(p_result->>'summary',''),500),
            'source_sha',v_job.source_sha,'github_run_id',p_result->'github_run_id')),
          updated_at=now()
      where id=v_ticket.id;
    insert into public.messinho_myki_ticket_events(
      ticket_id,actor_type,action,from_status,to_status,safe_message,metadata
    ) values (
      v_ticket.id,'system','sandbox_result_recorded',v_ticket.status,
      case when v_ticket.status='submitted' then 'reviewing' else v_ticket.status end,
      'MESSINHO-Sandbox hat das Ergebnis mit Quellversion und Prüfprotokoll gespeichert.',
      jsonb_build_object('job_id',v_job.id,'outcome',v_outcome,'source_sha',v_job.source_sha)
    );
  end if;
  return jsonb_build_object('accepted',true,'duplicate',false,'outcome',v_outcome);
end;
$$;

revoke all on function public.asi_record_messinho_engineering_result(jsonb) from public,anon,authenticated;
grant execute on function public.asi_record_messinho_engineering_result(jsonb) to service_role;
