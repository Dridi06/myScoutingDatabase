-- Canonical fresh-install baseline for myScoutingDatabase.
-- Designed for an empty dedicated STAGING database.
create schema if not exists private;
create extension if not exists pgcrypto;
create sequence if not exists public.scout_number_seq as integer start with 1 increment by 1;
create sequence if not exists public.player_id_seq as bigint start with 1 increment by 1;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  email text not null,
  role text not null default 'scout' check (role in ('admin','scout')),
  approved boolean not null default false,
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','blocked')),
  scout_number integer unique,
  last_login_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_approval_consistent check (approved = (approval_status = 'approved')),
  constraint profiles_username_length check (char_length(username) between 3 and 32)
);
create unique index if not exists profiles_username_lower_idx on public.profiles(lower(username));
create unique index if not exists profiles_email_lower_idx on public.profiles(lower(email));

create table if not exists public.players (
  player_id bigint primary key default nextval('public.player_id_seq'),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, club text, year text not null check (year ~ '^[0-9]{4}$'),
  foot text not null default 'Rechtsfuß' check (foot in ('Linksfuß','Rechtsfuß')),
  positions text[] not null default '{}',
  category text check (category is null or category in ('Eins','Zwei','Drei')),
  height integer check (height is null or height between 100 and 230),
  observed_on date, documented_by text,
  contract boolean not null default false, contract_term text,
  agent boolean not null default false, agent_name text,
  father_contact text, father_phone text, mother_contact text, mother_phone text,
  notes text,
  ratings jsonb not null default '{}'::jsonb check (jsonb_typeof(ratings) = 'object'),
  performance_metrics jsonb not null default '{}'::jsonb check (jsonb_typeof(performance_metrics) = 'object'),
  metrics jsonb not null default '{}'::jsonb check (jsonb_typeof(metrics) = 'object'),
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_positions_valid check (positions <@ array['AV re/li','IV re/li','6er','8er','10er','Flügel re/li','9er']::text[])
);
create index if not exists players_owner_id_idx on public.players(owner_id);
create index if not exists players_year_idx on public.players(year);
create index if not exists players_positions_idx on public.players using gin(positions);
create index if not exists players_name_lower_idx on public.players(lower(name));

-- Deliberately no FK to players: deletion history survives player removal.
create table if not exists public.player_deletion_logs (
  id uuid primary key default gen_random_uuid(),
  player_id bigint not null,
  owner_id uuid references public.profiles(id) on delete set null,
  deleted_by uuid references auth.users(id) on delete set null,
  player_name text, reason text,
  player_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists player_deletion_logs_created_idx on public.player_deletion_logs(created_at desc);

alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.player_deletion_logs enable row level security;
