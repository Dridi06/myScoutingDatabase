\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users(id uuid primary key);
create table public.profiles(
  id uuid primary key references auth.users(id),
  role text not null,
  approved boolean not null,
  approval_status text not null
);
create table public.messinho_myki_tickets(
  id uuid primary key,
  status text not null,
  tests jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
create table public.messinho_myki_ticket_events(
  id bigint generated always as identity primary key,
  ticket_id uuid not null references public.messinho_myki_tickets(id),
  actor_id uuid,
  actor_type text not null,
  action text not null,
  from_status text,
  to_status text,
  error_code text,
  safe_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant usage on schema auth, public to service_role;
grant all on all tables in schema auth, public to service_role;
grant usage, select on all sequences in schema public to service_role;

insert into auth.users(id) values ('33333333-3333-4333-8333-333333333333');
insert into public.messinho_myki_tickets(id,status,tests)
values ('22222222-2222-4222-8222-222222222222','submitted','[{"name":"Regressionstest","status":"not_run"}]'::jsonb);

\ir /src/supabase/migrations/20261127000600_messinho_engineering_sandbox_memory.sql

insert into public.messinho_engineering_jobs(
 id,ticket_id,requested_by,source_sha,patch_sha256,status
) values (
 '11111111-1111-4111-8111-111111111111',
 '22222222-2222-4222-8222-222222222222',
 '33333333-3333-4333-8333-333333333333',
 repeat('a',40),repeat('b',64),'queued'
);

set role service_role;
select public.asi_record_messinho_engineering_result(jsonb_build_object(
 'job_id','11111111-1111-4111-8111-111111111111',
 'ticket_id','22222222-2222-4222-8222-222222222222',
 'source_sha',repeat('a',40),
 'patch_sha256',repeat('b',64),
 'outcome','passed',
 'summary','Sandbox-Vertragstest erfolgreich.',
 'evidence',jsonb_build_object('exit_code',0,'logs','baseline=0 candidate=0'),
 'toolchain',jsonb_build_object('node','24'),
 'github_run_id',123,
 'github_run_attempt',1
));
select public.asi_record_messinho_engineering_result(jsonb_build_object(
 'job_id','11111111-1111-4111-8111-111111111111',
 'ticket_id','22222222-2222-4222-8222-222222222222',
 'source_sha',repeat('a',40),
 'patch_sha256',repeat('b',64),
 'outcome','passed',
 'summary','Sandbox-Vertragstest erfolgreich.',
 'evidence',jsonb_build_object('exit_code',0,'logs','baseline=0 candidate=0'),
 'toolchain',jsonb_build_object('node','24'),
 'github_run_id',123,
 'github_run_attempt',1
));
reset role;

do $$
begin
 if (select status from public.messinho_engineering_jobs where id='11111111-1111-4111-8111-111111111111') <> 'completed' then raise exception 'job_status_not_completed'; end if;
 if not (select evidence_verified from public.messinho_engineering_memory where job_id='11111111-1111-4111-8111-111111111111') then raise exception 'evidence_not_verified'; end if;
 if (select review_state from public.messinho_engineering_memory where job_id='11111111-1111-4111-8111-111111111111') <> 'pending_admin_review' then raise exception 'memory_review_gate_missing'; end if;
 if (select status from public.messinho_myki_tickets where id='22222222-2222-4222-8222-222222222222') <> 'reviewing' then raise exception 'ticket_not_moved_to_reviewing'; end if;
 if has_table_privilege('anon','public.messinho_engineering_memory','select') then raise exception 'anon_can_read_memory'; end if;
 if has_function_privilege('anon','public.asi_record_messinho_engineering_result(jsonb)','execute') then raise exception 'anon_can_execute_callback_rpc'; end if;
end $$;
select 'engineering_memory_contract_ok' as result;
