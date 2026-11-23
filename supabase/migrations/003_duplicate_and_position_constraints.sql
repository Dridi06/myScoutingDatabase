alter table public.players add constraint players_positions_valid
check (positions <@ array['AV re/li','IV re/li','6er','8er','10er','Flügel re/li','9er']::text[]);
create unique index if not exists players_unique_name_year_club_idx
on public.players (lower(name), year, coalesce(lower(club), ''));