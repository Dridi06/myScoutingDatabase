-- MESSINHO owner-scoped, source-backed general knowledge memory.
-- Staging migration. The service key is server-only; browser access is RLS-scoped.
create table if not exists public.messinho_knowledge_memory (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  question text not null check (char_length(question) between 12 and 700),
  question_fingerprint text not null check (question_fingerprint ~ '^[a-f0-9]{64}$'),
  answer text not null check (char_length(answer) between 1 and 6000),
  answer_mode text not null check (answer_mode in ('evidence_synthesized','source_digest')),
  claims jsonb not null default '[]'::jsonb check (jsonb_typeof(claims) = 'array'),
  sources jsonb not null check (jsonb_typeof(sources) = 'array' and octet_length(sources::text) <= 48000),
  evidence_summary jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence_summary) = 'object'),
  verification_status text not null default 'corroborated'
    check (verification_status in ('corroborated','needs_review','conflicting','stale','rejected')),
  source_count integer not null check (source_count between 2 and 8),
  distinct_domains integer not null check (distinct_domains between 2 and 8),
  last_verified_at timestamptz not null,
  expires_at timestamptz not null,
  last_accessed_at timestamptz,
  hit_count integer not null default 0 check (hit_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, question_fingerprint),
  check (expires_at > last_verified_at)
);

comment on table public.messinho_knowledge_memory is
  'Owner-scoped general knowledge cache. Only corroborated, source-backed answers are reused; this is not model training.';
comment on column public.messinho_knowledge_memory.verification_status is
  'corroborated means at least two substantial independent source domains; it is not human-reviewed truth.';

create index if not exists messinho_knowledge_memory_owner_expiry_idx
  on public.messinho_knowledge_memory(owner_id, verification_status, expires_at desc);
create index if not exists messinho_knowledge_memory_last_accessed_idx
  on public.messinho_knowledge_memory(owner_id, last_accessed_at desc);

alter table public.messinho_knowledge_memory enable row level security;

drop policy if exists messinho_knowledge_memory_select_own on public.messinho_knowledge_memory;
create policy messinho_knowledge_memory_select_own
  on public.messinho_knowledge_memory for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists messinho_knowledge_memory_insert_own on public.messinho_knowledge_memory;
create policy messinho_knowledge_memory_insert_own
  on public.messinho_knowledge_memory for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists messinho_knowledge_memory_update_own on public.messinho_knowledge_memory;
create policy messinho_knowledge_memory_update_own
  on public.messinho_knowledge_memory for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists messinho_knowledge_memory_delete_own on public.messinho_knowledge_memory;
create policy messinho_knowledge_memory_delete_own
  on public.messinho_knowledge_memory for delete to authenticated
  using ((select auth.uid()) = owner_id);

revoke all on table public.messinho_knowledge_memory from anon, authenticated, service_role;
grant select, insert, update, delete on table public.messinho_knowledge_memory to authenticated;
grant select, insert, update, delete on table public.messinho_knowledge_memory to service_role;
