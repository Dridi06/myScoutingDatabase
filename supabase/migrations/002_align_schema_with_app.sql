-- Fresh-install application alignment and least-privilege access policies.
create schema if not exists private;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin');
$$;

create or replace function private.is_approved_scout()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(select 1 from public.profiles p where p.id=(select auth.uid())
    and p.role='scout' and p.approved=true and p.approval_status='approved');
$$;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare requested_username text; scout_count integer;
begin
  requested_username := nullif(btrim(coalesce(new.raw_user_meta_data->>'username','')), '');
  if requested_username is null or requested_username !~ '^[a-zA-Z0-9._-]{3,32}$' then
    raise exception 'Ein gültiger Benutzername ist erforderlich.';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(92384711);
  select count(*) into scout_count from public.profiles where role='scout';
  if scout_count >= 15 then raise exception 'Die maximale Anzahl von 15 Scouts ist erreicht.'; end if;
  insert into public.profiles(id,username,email,role,approval_status,approved,scout_number)
  values(new.id,requested_username,lower(new.email),'scout','pending',false,nextval('public.scout_number_seq'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_myscouting on auth.users;
drop trigger if exists on_auth_user_created_myscouting_private on auth.users;
create trigger on_auth_user_created_myscouting_private after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at := pg_catalog.now(); return new; end; $$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();
drop trigger if exists players_touch_updated_at on public.players;
create trigger players_touch_updated_at before update on public.players
for each row execute function public.touch_updated_at();

drop policy if exists profiles_read_self_or_admin on public.profiles;
create policy profiles_read_self_or_admin on public.profiles for select to authenticated
using (id=(select auth.uid()) or (select private.is_admin()));
drop policy if exists profiles_update_own_presence on public.profiles;
create policy profiles_update_own_presence on public.profiles for update to authenticated
using (id=(select auth.uid())) with check (id=(select auth.uid()));


drop policy if exists players_read_tenant on public.players;
create policy players_read_tenant on public.players for select to authenticated
using ((select private.is_admin()) or (owner_id=(select auth.uid()) and (select private.is_approved_scout())));
drop policy if exists players_insert_tenant on public.players;
create policy players_insert_tenant on public.players for insert to authenticated
with check (owner_id=(select auth.uid()) and ((select private.is_admin()) or (select private.is_approved_scout())));
drop policy if exists players_update_tenant on public.players;
create policy players_update_tenant on public.players for update to authenticated
using ((select private.is_admin()) or (owner_id=(select auth.uid()) and (select private.is_approved_scout())))
with check ((select private.is_admin()) or (owner_id=(select auth.uid()) and (select private.is_approved_scout())));
drop policy if exists players_delete_tenant on public.players;
create policy players_delete_tenant on public.players for delete to authenticated
using ((select private.is_admin()) or (owner_id=(select auth.uid()) and (select private.is_approved_scout())));

drop policy if exists player_deletion_logs_admin_read on public.player_deletion_logs;
create policy player_deletion_logs_admin_read on public.player_deletion_logs for select to authenticated
using ((select private.is_admin()));

grant usage on schema public, private to authenticated, service_role;
revoke all on public.profiles, public.players, public.player_deletion_logs from anon, authenticated;
grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (last_login_at,last_seen_at) on public.profiles to authenticated;
grant select, insert, update, delete on public.players to authenticated;
grant select, delete on public.player_deletion_logs to authenticated;
grant all on public.profiles, public.players, public.player_deletion_logs to service_role;
grant usage, select on sequence public.player_id_seq, public.scout_number_seq to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;
grant execute on function private.is_approved_scout() to authenticated, service_role;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;

create or replace function public.admin_set_scout_approval(p_scout_id uuid,p_approved boolean)
returns void language plpgsql security invoker set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not (select private.is_admin()) then raise exception 'Admin-Rechte erforderlich.'; end if;
  update public.profiles set approved=p_approved,
    approval_status=case when p_approved then 'approved' else 'blocked' end,
    updated_at=pg_catalog.now()
  where id=p_scout_id and role='scout';
  if not found then raise exception 'Scout nicht gefunden.'; end if;
end;
$$;

create or replace function public.create_player(p_player jsonb)
returns bigint language plpgsql security invoker set search_path = ''
as $$
declare new_id bigint; owner uuid := (select auth.uid());
begin
  if owner is null or (not (select private.is_admin()) and not (select private.is_approved_scout())) then
    raise exception 'Freigeschalteter Login erforderlich.';
  end if;
  insert into public.players(owner_id,name,club,year,foot,positions,category,height,observed_on,documented_by,
    contract,contract_term,agent,agent_name,father_contact,father_phone,mother_contact,mother_phone,notes,ratings,performance_metrics,metrics)
  values(owner,btrim(p_player->>'name'),nullif(p_player->>'club',''),p_player->>'year',
    coalesce(p_player->>'foot','Rechtsfuß'),
    coalesce(array(select jsonb_array_elements_text(coalesce(p_player->'positions','[]'::jsonb))),'{}'),
    nullif(p_player->>'category',''),nullif(p_player->>'height','')::integer,
    nullif(p_player->>'observed_on','')::date,nullif(p_player->>'documented_by',''),
    coalesce((p_player->>'contract')::boolean,false),nullif(p_player->>'contract_term',''),
    coalesce((p_player->>'agent')::boolean,false),nullif(p_player->>'agent_name',''),
    nullif(p_player->>'father_contact',''),nullif(p_player->>'father_phone',''),
    nullif(p_player->>'mother_contact',''),nullif(p_player->>'mother_phone',''),
    nullif(p_player->>'notes',''),coalesce(p_player->'ratings','{}'::jsonb),
    coalesce(p_player->'performance_metrics','{}'::jsonb),coalesce(p_player->'metrics','{}'::jsonb))
  returning player_id into new_id;
  return new_id;
end;
$$;

create or replace function public.scout_heartbeat()
returns void language plpgsql security definer set search_path = ''
as $$ begin
  update public.profiles set last_seen_at=pg_catalog.now()
  where id=(select auth.uid()) and role='scout' and approved=true;
end; $$;

create or replace function public.scout_mark_login()
returns void language plpgsql security definer set search_path = ''
as $$ begin
  update public.profiles set last_login_at=pg_catalog.now(),last_seen_at=pg_catalog.now()
  where id=(select auth.uid());
end; $$;

revoke all on function public.admin_set_scout_approval(uuid,boolean) from public,anon;
revoke all on function public.create_player(jsonb) from public,anon;
revoke all on function public.scout_heartbeat() from public,anon;
revoke all on function public.scout_mark_login() from public,anon;
grant execute on function public.admin_set_scout_approval(uuid,boolean) to authenticated,service_role;
grant execute on function public.create_player(jsonb) to authenticated,service_role;
grant execute on function public.scout_heartbeat() to authenticated,service_role;
grant execute on function public.scout_mark_login() to authenticated,service_role;
