-- Restrict trigger-only and authenticated RPC functions to intended callers.
do $$
begin
  if to_regprocedure('public.handle_new_scout_profile()') is not null then
    execute 'revoke execute on function public.handle_new_scout_profile() from public, anon, authenticated';
  end if;
  if to_regprocedure('public.prevent_scout_messages_on_resolved_ticket()') is not null then
    execute 'revoke execute on function public.prevent_scout_messages_on_resolved_ticket() from public, anon, authenticated';
  end if;
end;
$$;

revoke execute on function public.scout_heartbeat() from public, anon;
grant execute on function public.scout_heartbeat() to authenticated, service_role;
revoke execute on function public.scout_mark_login() from public, anon;
grant execute on function public.scout_mark_login() to authenticated, service_role;
