-- Allow administrators to remove audit rows without touching player records.
-- The player_deletion_logs table intentionally has no FK to players.
alter table public.player_deletion_logs enable row level security;

drop policy if exists "Admins can delete player deletion logs" on public.player_deletion_logs;
create policy "Admins can delete player deletion logs"
on public.player_deletion_logs
for delete
to authenticated
using ((select private.is_admin()));

-- Never rewind the player ID sequence when a player or an audit row is deleted.
-- Preserve the greater of the current sequence value and the highest existing player ID.
do $$
declare
  current_seq bigint;
  max_player bigint;
begin
  select last_value into current_seq from public.player_id_seq;
  select coalesce(max(player_id), 0) into max_player from public.players;
  perform setval('public.player_id_seq', greatest(current_seq, max_player, 1), true);
end $$;
