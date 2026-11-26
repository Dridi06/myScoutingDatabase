-- Durable, owner-scoped MESSINHO task checkpoints.
-- Apply to the STAGING Supabase project only before using task resume.

create table if not exists public.messinho_agent_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  goal text not null check (char_length(goal) <= 1200),
  status text not null default 'queued'
    check (status in ('queued','partial','waiting_for_input','completed','failed','cancelled')),
  plan jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb
    check (octet_length(context::text) <= 65536),
  completed_results jsonb not null default '[]'::jsonb
    check (octet_length(completed_results::text) <= 65536),
  pending_capabilities text[] not null default '{}',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists messinho_agent_tasks_owner_status_updated_idx
  on public.messinho_agent_tasks(owner_id,status,updated_at desc);
create index if not exists messinho_agent_tasks_expiry_idx
  on public.messinho_agent_tasks(expires_at);

alter table public.messinho_agent_tasks enable row level security;
drop policy if exists "messinho_agent_tasks_select_own" on public.messinho_agent_tasks;
create policy "messinho_agent_tasks_select_own"
  on public.messinho_agent_tasks for select
  using (auth.uid() = owner_id);

-- Server-side service-role access performs inserts and updates.
-- No client-side write policy is granted.
