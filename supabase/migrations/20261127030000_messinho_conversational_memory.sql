-- Durable, owner-scoped MESSINHO conversations for STAGING.
-- Chat history is managed exclusively by the authenticated backend service.
create table if not exists public.messinho_conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Neues Gespräch' check (char_length(title) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists messinho_conversations_owner_updated_idx
  on public.messinho_conversations(owner_id, updated_at desc);

create table if not exists public.messinho_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.messinho_conversations(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(btrim(content)) between 1 and 12000),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 24000),
  created_at timestamptz not null default now()
);

create index if not exists messinho_conversation_messages_history_idx
  on public.messinho_conversation_messages(owner_id, conversation_id, created_at desc);

alter table public.messinho_conversations enable row level security;
alter table public.messinho_conversation_messages enable row level security;

drop policy if exists messinho_conversations_select_own on public.messinho_conversations;
create policy messinho_conversations_select_own
  on public.messinho_conversations for select
  using ((select auth.uid()) = owner_id);

drop policy if exists messinho_conversation_messages_select_own on public.messinho_conversation_messages;
create policy messinho_conversation_messages_select_own
  on public.messinho_conversation_messages for select
  using ((select auth.uid()) = owner_id);

revoke all on public.messinho_conversations, public.messinho_conversation_messages from anon, authenticated;
grant all on public.messinho_conversations, public.messinho_conversation_messages to service_role;

comment on table public.messinho_conversations is
  'Private per-user MESSINHO conversation threads. All writes and runtime reads are performed by the authenticated backend service.';
comment on table public.messinho_conversation_messages is
  'Durable user/assistant messages and bounded response metadata for MESSINHO; access is owner-scoped and backend-managed.';
