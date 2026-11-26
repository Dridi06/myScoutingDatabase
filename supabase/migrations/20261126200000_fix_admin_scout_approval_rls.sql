-- Allow the authenticated admin approval RPC to update another scout despite profiles RLS.
-- The function is narrowly scoped: it changes only approval fields and verifies the caller's admin role.
create or replace function public.admin_set_scout_approval(p_scout_id uuid, p_approved boolean)
returns void
language plpgsql
security definer
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
