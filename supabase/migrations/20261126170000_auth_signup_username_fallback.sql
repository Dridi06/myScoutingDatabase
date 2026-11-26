create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  requested_username text;
  fallback_base text;
  scout_count integer;
begin
  requested_username := nullif(btrim(coalesce(new.raw_user_meta_data->>'username','')), '');

  if requested_username is null or requested_username !~ '^[a-zA-Z0-9._-]{3,32}$' then
    fallback_base := lower(split_part(coalesce(new.email,''), '@', 1));
    fallback_base := btrim(regexp_replace(fallback_base, '[^a-z0-9._-]+', '-', 'g'), '._-');
    if length(fallback_base) < 3 then
      fallback_base := 'user';
    end if;
    requested_username := left(fallback_base, 23) || '-' || left(replace(new.id::text, '-', ''), 8);
  end if;

  if requested_username !~ '^[a-zA-Z0-9._-]{3,32}$' then
    raise exception 'Es konnte kein gültiger Benutzername erzeugt werden.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(92384711);
  select count(*) into scout_count from public.profiles where role='scout';
  if scout_count >= 15 then
    raise exception 'Die maximale Anzahl von 15 Scouts ist erreicht.';
  end if;

  insert into public.profiles(id,username,email,role,approval_status,approved,scout_number)
  values(new.id,requested_username,lower(new.email),'scout','pending',false,nextval('public.scout_number_seq'));

  return new;
end;
$function$;