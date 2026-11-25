-- Trigger-only functions must not be directly callable through PostgREST RPC.
REVOKE EXECUTE ON FUNCTION public.handle_new_scout_profile() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_scout_messages_on_resolved_ticket() FROM PUBLIC, anon, authenticated;

-- Presence/login RPCs are intentionally called by signed-in clients only.
REVOKE EXECUTE ON FUNCTION public.scout_heartbeat() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.scout_heartbeat() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.scout_mark_login() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.scout_mark_login() TO authenticated, service_role;
