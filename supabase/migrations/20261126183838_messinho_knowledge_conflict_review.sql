create table if not exists public.messinho_knowledge_conflicts (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.messinho_knowledge_concepts(id) on delete restrict,
  proposed_concept jsonb not null check (jsonb_typeof(proposed_concept)='object' and octet_length(proposed_concept::text)<=30000),
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence)='object' and octet_length(evidence::text)<=16000),
  conflict_reason text not null check (char_length(conflict_reason) between 5 and 500),
  status text not null default 'open' check (status in ('open','approved','rejected','resolved')),
  created_at timestamptz not null default now(),
  reviewed_by text,
  reviewed_at timestamptz,
  resolution_note text,
  resolved_version_id uuid references public.messinho_knowledge_versions(id) on delete restrict,
  check ((status='open' and reviewed_at is null) or (status<>'open' and reviewed_at is not null))
);
create index if not exists messinho_knowledge_conflicts_status_created_idx on public.messinho_knowledge_conflicts(status,created_at desc);
create index if not exists messinho_knowledge_conflicts_concept_idx on public.messinho_knowledge_conflicts(concept_id,created_at desc);
alter table public.messinho_knowledge_conflicts enable row level security;
revoke all on public.messinho_knowledge_conflicts from public,anon,authenticated;
grant select,insert,update on public.messinho_knowledge_conflicts to service_role;
revoke delete,truncate,references,trigger on public.messinho_knowledge_conflicts from service_role;
comment on table public.messinho_knowledge_conflicts is 'Retains competing MESSINHO knowledge proposals for explicit review; never silently overwrites an active concept.';
