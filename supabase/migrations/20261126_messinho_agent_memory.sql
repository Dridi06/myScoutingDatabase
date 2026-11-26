-- MESSINHO durable, owner-scoped agent memory and execution traces.
-- Apply to the STAGING Supabase project only before enabling persistent memory there.

create table if not exists public.messinho_agent_memory (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  active_player_ids bigint[] not null default '{}',
  user_preferences jsonb not null default '{}'::jsonb,
  active_entities jsonb not null default '{}'::jsonb,
  last_intent text,
  last_goal text,
  updated_at timestamptz not null default now()
);

alter table public.messinho_agent_memory enable row level security;

drop policy if exists "messinho_agent_memory_select_own" on public.messinho_agent_memory;
create policy "messinho_agent_memory_select_own"
  on public.messinho_agent_memory for select
  using (auth.uid() = owner_id);

drop policy if exists "messinho_agent_memory_insert_own" on public.messinho_agent_memory;
create policy "messinho_agent_memory_insert_own"
  on public.messinho_agent_memory for insert
  with check (auth.uid() = owner_id);

drop policy if exists "messinho_agent_memory_update_own" on public.messinho_agent_memory;
create policy "messinho_agent_memory_update_own"
  on public.messinho_agent_memory for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create table if not exists public.messinho_agent_traces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  goal text not null check (char_length(goal) <= 1200),
  status text not null,
  plan jsonb not null default '{}'::jsonb,
  result_summary jsonb not null default '[]'::jsonb,
  duration_ms integer not null default 0 check (duration_ms >= 0),
  created_at timestamptz not null default now()
);

create index if not exists messinho_agent_traces_owner_created_idx
  on public.messinho_agent_traces(owner_id, created_at desc);

alter table public.messinho_agent_traces enable row level security;

drop policy if exists "messinho_agent_traces_select_own" on public.messinho_agent_traces;
create policy "messinho_agent_traces_select_own"
  on public.messinho_agent_traces for select
  using (auth.uid() = owner_id);

-- Inserts/updates are performed by the server's service-role client only.
-- No client-side write policy is granted for execution traces.
