-- Align schema with the current React application and server API.
alter table public.players drop constraint if exists players_birth_year_check;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists approved boolean not null default false;
update public.profiles set approved = (approval_status = 'approved') where approved is distinct from (approval_status = 'approved');
alter table public.players rename column id to player_id;
alter table public.players rename column player_name to name;
alter table public.players rename column birth_year to year;
alter table public.players alter column year type text using year::text;
alter table public.players add constraint players_year_format check (year ~ '^[0-9]{4}$');
alter table public.players rename column dominant_foot to foot;
alter table public.players rename column assessment_date to observed_on;
alter table public.players rename column height_cm to height;
alter table public.players rename column contract_exists to contract;
alter table public.players rename column agent_exists to agent;
alter table public.players add column if not exists father_contact text;
alter table public.players add column if not exists mother_contact text;
create unique index if not exists profiles_username_lower_idx on public.profiles(lower(username));
create index if not exists players_name_lower_idx on public.players(lower(name));

create or replace function private.is_approved_scout() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='scout' and p.approved=true and p.approval_status='approved');
$$;
revoke all on function private.is_approved_scout() from public, anon;
grant execute on function private.is_approved_scout() to authenticated;

create or replace function private.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare requested_username text; scout_count integer;
begin
 requested_username:=nullif(trim(coalesce(new.raw_user_meta_data->>'username','')),'');
 if requested_username is null then raise exception 'Ein Benutzername ist erforderlich.'; end if;
 perform pg_advisory_xact_lock(92384711);
 select count(*) into scout_count from public.profiles where role='scout';
 if scout_count>=15 then raise exception 'Die maximale Anzahl von 15 Scouts ist erreicht.'; end if;
 insert into public.profiles(id,username,email,role,approval_status,approved) values(new.id,requested_username,lower(new.email),'scout','pending',false);
 return new;
end; $$;

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists players_touch_updated_at on public.players;
create trigger players_touch_updated_at before update on public.players for each row execute function public.touch_updated_at();

create or replace function public.admin_set_scout_approval(p_scout_id uuid,p_approved boolean) returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'Admin-Rechte erforderlich.'; end if;
 update public.profiles set approved=p_approved,approval_status=case when p_approved then 'approved' else 'blocked' end,updated_at=now() where id=p_scout_id and role='scout';
 if not found then raise exception 'Scout nicht gefunden.'; end if;
end; $$;

create or replace function public.create_player(p_player jsonb) returns bigint language plpgsql security invoker set search_path='' as $$
declare new_id bigint; owner uuid:=auth.uid();
begin
 if owner is null or (not private.is_admin() and not private.is_approved_scout()) then raise exception 'Freigeschalteter Login erforderlich.'; end if;
 insert into public.players(owner_id,name,club,year,foot,positions,category,height,observed_on,documented_by,contract,contract_term,agent,agent_name,father_contact,father_phone,mother_contact,mother_phone,notes,ratings)
 values(owner,trim(p_player->>'name'),nullif(p_player->>'club',''),p_player->>'year',coalesce(p_player->>'foot','Rechtsfuß'),
 coalesce(array(select jsonb_array_elements_text(coalesce(p_player->'positions','[]'::jsonb))),'{}'),nullif(p_player->>'category',''),nullif(p_player->>'height','')::integer,
 nullif(p_player->>'observed_on','')::date,nullif(p_player->>'documented_by',''),coalesce((p_player->>'contract')::boolean,false),nullif(p_player->>'contract_term',''),
 coalesce((p_player->>'agent')::boolean,false),nullif(p_player->>'agent_name',''),nullif(p_player->>'father_contact',''),nullif(p_player->>'father_phone',''),nullif(p_player->>'mother_contact',''),nullif(p_player->>'mother_phone',''),nullif(p_player->>'notes',''),coalesce(p_player->'ratings','{}'::jsonb))
 returning player_id into new_id;
 return new_id;
end; $$;
revoke all on function public.admin_set_scout_approval(uuid,boolean) from public,anon;
revoke all on function public.create_player(jsonb) from public,anon;
grant execute on function public.admin_set_scout_approval(uuid,boolean) to authenticated;
grant execute on function public.create_player(jsonb) to authenticated;