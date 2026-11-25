-- MESSINHO controlled learning storage. Apply only to the staging Supabase project first.
create table if not exists public.messinho_scout_feedback (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  candidate_id uuid null references public.asi_player_candidates(id) on delete set null,
  scout_id uuid not null references auth.users(id) on delete cascade,
  position_group text not null,
  target_score numeric(5,2) not null check (target_score between 0 and 100),
  dimension_scores jsonb not null check (jsonb_typeof(dimension_scores) = 'object'),
  comment text not null default '' check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists messinho_feedback_position_created_idx on public.messinho_scout_feedback(position_group, created_at desc);
create index if not exists messinho_feedback_player_idx on public.messinho_scout_feedback(player_id);
create index if not exists messinho_feedback_scout_idx on public.messinho_scout_feedback(scout_id, created_at desc);

create table if not exists public.messinho_model_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  status text not null default 'proposed' check (status in ('proposed','active','retired','rejected')),
  profiles jsonb not null check (jsonb_typeof(profiles) = 'object'),
  evaluation jsonb not null default '{}'::jsonb,
  learning_version text not null,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists messinho_one_active_model_idx on public.messinho_model_versions(status) where status='active';

alter table public.messinho_scout_feedback enable row level security;
alter table public.messinho_model_versions enable row level security;
drop policy if exists messinho_feedback_read_own on public.messinho_scout_feedback;
create policy messinho_feedback_read_own on public.messinho_scout_feedback for select to authenticated using (scout_id = auth.uid());
drop policy if exists messinho_feedback_insert_own on public.messinho_scout_feedback;
create policy messinho_feedback_insert_own on public.messinho_scout_feedback for insert to authenticated with check (scout_id = auth.uid());
drop policy if exists messinho_models_admin_read on public.messinho_model_versions;
create policy messinho_models_admin_read on public.messinho_model_versions for select to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

-- Atomic model activation: only administrators may activate a proposed model.
create or replace function public.messinho_activate_model(p_model_id uuid,p_admin_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id=p_admin_id and role='admin') then
    raise exception 'administrator approval required';
  end if;
  if not exists (select 1 from public.messinho_model_versions where id=p_model_id and status='proposed') then
    raise exception 'proposed model not found';
  end if;
  update public.messinho_model_versions
    set status='retired'
    where status='active';
  update public.messinho_model_versions
    set status='active', approved_by=p_admin_id, approved_at=now()
    where id=p_model_id and status='proposed';
end;
$$;
revoke all on function public.messinho_activate_model(uuid,uuid) from public, anon, authenticated;
grant execute on function public.messinho_activate_model(uuid,uuid) to service_role;
