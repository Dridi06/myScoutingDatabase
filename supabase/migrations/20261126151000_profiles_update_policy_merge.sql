-- Authenticated users may update only their own presence fields.
-- All administrative profile changes go through the server's service-role API.
drop policy if exists profiles_admin_update on public.profiles;
drop policy if exists profiles_update_own_presence on public.profiles;
create policy profiles_update_own_presence on public.profiles
for update to authenticated
using (id=(select auth.uid()))
with check (id=(select auth.uid()));

revoke all on function public.admin_set_scout_approval(uuid,boolean) from public,anon,authenticated;
grant execute on function public.admin_set_scout_approval(uuid,boolean) to service_role;
revoke update on public.profiles from authenticated;
grant update (last_login_at,last_seen_at) on public.profiles to authenticated;
