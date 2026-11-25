begin;
create table if not exists public.asi_player_candidates (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 created_by uuid references auth.users(id) on delete set null,
 player_name text not null,
 birth_year integer,
 nationality text,
 current_club text,
 positions text[] not null default '{}',
 search_query text,
 analysis jsonb not null default '{}'::jsonb,
 sources jsonb not null default '[]'::jsonb,
 recommendation text not null default 'review' check (recommendation in ('priority','watchlist','review','reject')),
 status text not null default 'saved' check (status in ('saved','promoted','dismissed')),
 identity_confidence numeric(5,4) check (identity_confidence between 0 and 1),
 researched_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists asi_candidates_owner_created_idx on public.asi_player_candidates(owner_id,created_at desc);
create index if not exists asi_candidates_status_idx on public.asi_player_candidates(status,recommendation);
alter table public.asi_player_candidates enable row level security;
drop policy if exists asi_candidates_owner_read on public.asi_player_candidates;
create policy asi_candidates_owner_read on public.asi_player_candidates for select to authenticated using (owner_id=(select auth.uid()) or (select private.is_admin()));
drop policy if exists asi_candidates_owner_insert on public.asi_player_candidates;
create policy asi_candidates_owner_insert on public.asi_player_candidates for insert to authenticated with check (owner_id=(select auth.uid()) or (select private.is_admin()));
drop policy if exists asi_candidates_owner_update on public.asi_player_candidates;
create policy asi_candidates_owner_update on public.asi_player_candidates for update to authenticated using (owner_id=(select auth.uid()) or (select private.is_admin())) with check (owner_id=(select auth.uid()) or (select private.is_admin()));
grant select,insert,update on public.asi_player_candidates to authenticated;
comment on table public.asi_player_candidates is 'Research candidates awaiting scout decision; separate from canonical players table.';
commit;