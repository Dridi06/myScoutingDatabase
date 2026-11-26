-- Idempotent uniqueness guard; valid positions are constrained in the canonical baseline.
create unique index if not exists players_unique_name_year_club_idx
on public.players (lower(name), year, coalesce(lower(club), ''));
