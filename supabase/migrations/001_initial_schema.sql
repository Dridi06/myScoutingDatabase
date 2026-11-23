-- myScoutingDatabase: isolated multi-tenant scouting schema.
-- Apply only to the dedicated myScoutingDatabase Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null unique,
  role text not null default 'scout' check (role in ('admin','scout')),
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  check (char_length(username) between 3 and 32)
);

create sequence if not exists public.player_id_seq as bigint start with 1 increment by 1;
create table if not exists public.players (
  player_id bigint primary key default nextval('public.player_id_seq'),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, club text, year text not null check (year ~ '^[0-9]{4}$'),
  foot text not null default 'Rechtsfuß' check (foot in ('Linksfuß','Rechtsfuß','Beidfüßig')),
  positions text[] not null default '{}',
  category text check (category in ('Eins','Zwei','Drei')),
  height integer check (height is null or height between 100 and 230),
  observed_on date, documented_by text, contract boolean not null default false,
  contract_term text, agent boolean not null default false, agent_name text,
  father_contact text, father_phone text, mother_contact text, mother_phone text,
  notes text, ratings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint player_positions_valid check (positions <@ array['AV re/li','IV re/li','6er','8er','10er','Flügel re/li','9er']::text[])
);
create index if not exists players_owner_id_idx on public.players(owner_id);
create index if not exists players_year_idx on public.players(year);
create index if not exists players_positions_idx on public.players using gin(positions);
create index if not exists players_name_lower_idx on public.players(lower(name));

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists players_touch_updated_at on public.players;
create trigger players_touch_updated_at before update on public.players for each row execute function public.touch_updated_at();

create or replace function public.current_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;
create or replace function public.is_approved_scout()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select approved from public.profiles where id = auth.uid()), false);
$$;

alter table public.profiles enable row level security;
alter table public.players enable row level security;
drop policy if exists profiles_read_self_or_admin on public.profiles;
create policy profiles_read_self_or_admin on public.profiles for select to authenticated
using (id = auth.uid() or public.current_role() = 'admin');
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated
using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
drop policy if exists players_read_tenant on public.players;
create policy players_read_tenant on public.players for select to authenticated
using (public.is_approved_scout() and (owner_id = auth.uid() or public.current_role() = 'admin'));
drop policy if exists players_insert_tenant on public.players;
create policy players_insert_tenant on public.players for insert to authenticated
with check (public.is_approved_scout() and (owner_id = auth.uid() or public.current_role() = 'admin'));
drop policy if exists players_update_tenant on public.players;
create policy players_update_tenant on public.players for update to authenticated
using (public.is_approved_scout() and (owner_id = auth.uid() or public.current_role() = 'admin'))
with check (public.is_approved_scout() and (owner_id = auth.uid() or public.current_role() = 'admin'));
drop policy if exists players_delete_tenant on public.players;
create policy players_delete_tenant on public.players for delete to authenticated
using (public.is_approved_scout() and (owner_id = auth.uid() or public.current_role() = 'admin'));

create or replace function public.handle_new_scout_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare uname text;
begin
  uname := coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1));
  insert into public.profiles(id, username, email, role, approved)
  values(new.id, uname, lower(new.email), 'scout', false)
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created_myscouting on auth.users;
create trigger on_auth_user_created_myscouting after insert on auth.users
for each row execute procedure public.handle_new_scout_profile();

create or replace function public.admin_set_scout_approval(p_scout_id uuid, p_approved boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.current_role() <> 'admin' then raise exception 'Admin-Rechte erforderlich.'; end if;
  update public.profiles set approved=p_approved where id=p_scout_id and role='scout';
  if not found then raise exception 'Scout nicht gefunden.'; end if;
end; $$;

create or replace function public.create_player(p_player jsonb)
returns bigint language plpgsql security definer set search_path = public as $$
declare new_id bigint; owner uuid := auth.uid();
begin
  if owner is null or not public.is_approved_scout() then raise exception 'Freigeschalteter Login erforderlich.'; end if;
  insert into public.players(owner_id,name,club,year,foot,positions,category,height,observed_on,documented_by,contract,contract_term,agent,agent_name,father_contact,father_phone,mother_contact,mother_phone,notes,ratings)
  values(owner, p_player->>'name', p_player->>'club', p_player->>'year', coalesce(p_player->>'foot','Rechtsfuß'),
    coalesce(array(select jsonb_array_elements_text(p_player->'positions')), '{}'),p_player->>'category',nullif(p_player->>'height','')::integer,
    nullif(p_player->>'observed_on','')::date,p_player->>'documented_by',coalesce((p_player->>'contract')::boolean,false),p_player->>'contract_term',
    coalesce((p_player->>'agent')::boolean,false),p_player->>'agent_name',p_player->>'father_contact',p_player->>'father_phone',p_player->>'mother_contact',p_player->>'mother_phone',p_player->>'notes',coalesce(p_player->'ratings','{}'::jsonb))
  returning player_id into new_id;
  return new_id;
end; $$;
revoke all on function public.admin_set_scout_approval(uuid,boolean) from public;
revoke all on function public.create_player(jsonb) from public;
grant execute on function public.admin_set_scout_approval(uuid,boolean) to authenticated;
grant execute on function public.create_player(jsonb) to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_approved_scout() to authenticated;
create unique index if not exists profiles_username_lower_idx on public.profiles(lower(username));