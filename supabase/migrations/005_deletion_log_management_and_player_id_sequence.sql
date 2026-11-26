-- Preserve deletion audit access for administrators.
alter table public.player_deletion_logs enable row level security;
drop policy if exists "Admins can delete player deletion logs" on public.player_deletion_logs;
create policy "Admins can delete player deletion logs"
on public.player_deletion_logs for delete to authenticated
using ((select private.is_admin()));

-- Preserve the sequence without skipping the first ID on an empty database.
do $migrate$
declare max_player bigint;
begin
  select coalesce(max(player_id),0) into max_player from public.players;
  if max_player > 0 then
    perform setval('public.player_id_seq', max_player, true);
  else
    perform setval('public.player_id_seq', 1, false);
  end if;
end;
$migrate$;
