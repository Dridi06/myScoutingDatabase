-- MESSINHO extends the existing ASI calibration ledger; no parallel learning tables are created.
alter table public.asi_scout_calibration_records
  add column if not exists messinho_position_group text,
  add column if not exists messinho_dimension_scores jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='asi_scout_calibration_messinho_dimensions_object'
      and conrelid='public.asi_scout_calibration_records'::regclass
  ) then
    alter table public.asi_scout_calibration_records
      add constraint asi_scout_calibration_messinho_dimensions_object
      check (jsonb_typeof(messinho_dimension_scores)='object');
  end if;
end $$;

create index if not exists asi_scout_calibration_messinho_training_idx
  on public.asi_scout_calibration_records(messinho_position_group,verification_status,created_at desc);

comment on column public.asi_scout_calibration_records.messinho_position_group
  is 'MESSINHO position group snapshot captured when the scout calibration record is created.';
comment on column public.asi_scout_calibration_records.messinho_dimension_scores
  is 'MESSINHO 0-100 dimension snapshot captured from player ratings; only admin-verified outcomes enter training.';
