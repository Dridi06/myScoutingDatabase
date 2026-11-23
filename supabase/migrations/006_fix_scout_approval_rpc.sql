-- Fix Scout approval RPC: remove obsolete dependency on public.current_role().
-- The database's current authorization helper is private.is_admin().
-- SECURITY INVOKER keeps RLS as the authorization boundary.

create or replace function public.admin_set_scout_approval(p_scout_id uuid,p_approved boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if auth.uid() is null or not private.is_admin() then
    raise exception 'Admin-Rechte erforderlich.';
  end if;

  update public.profiles
  set approved = p_approved,
      approval_status = case
        when p_approved then 'approved'
        when approval_status = 'approved' then 'blocked'
        else 'pending'
      end,
      updated_at = now()
  where id = p_scout_id
    and role = 'scout';

  if not found then
    raise exception 'Scout nicht gefunden.';
  end if;
end;
$function$;

revoke all on function public.admin_set_scout_approval(uuid, boolean) from public, anon;
grant execute on function public.admin_set_scout_approval(uuid, boolean) to authenticated;
