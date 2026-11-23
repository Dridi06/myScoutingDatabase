-- The public RPCs are SECURITY INVOKER; RLS remains the authorization boundary.
create or replace function public.admin_set_scout_approval(p_scout_id uuid,p_approved boolean)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'Admin-Rechte erforderlich.'; end if;
 update public.profiles set approved=p_approved,approval_status=case when p_approved then 'approved' else 'blocked' end,updated_at=now() where id=p_scout_id and role='scout';
 if not found then raise exception 'Scout nicht gefunden.'; end if;
end; $$;
create or replace function public.create_player(p_player jsonb)
returns bigint language plpgsql security invoker set search_path='' as $$
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

-- The attached PDF offers only left-foot and right-foot choices.
alter table public.players drop constraint if exists players_dominant_foot_check;
alter table public.players add constraint players_foot_pdf_check check (foot in ('Linksfuß','Rechtsfuß'));