-- MESSINHO autonomous engineering work windows (Europe/Berlin).
-- Preserve historic daily review rows and allow one run per permitted work window.
alter table public.messinho_engineering_review_runs
  add column if not exists review_slot text;

update public.messinho_engineering_review_runs
set review_slot = 'legacy'
where review_slot is null;

alter table public.messinho_engineering_review_runs
  alter column review_slot set default 'morning',
  alter column review_slot set not null;

do $$
declare item record;
begin
  for item in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.messinho_engineering_review_runs'::regclass
      and c.contype = 'u'
      and pg_get_constraintdef(c.oid) ilike '%(review_date)%'
  loop
    execute format('alter table public.messinho_engineering_review_runs drop constraint %I', item.conname);
  end loop;
  for item in
    select i.indexrelid::regclass as index_name
    from pg_index i
    where i.indrelid = 'public.messinho_engineering_review_runs'::regclass
      and i.indisunique
      and not i.indisprimary
      and pg_get_indexdef(i.indexrelid) ilike '%(review_date)%'
  loop
    execute format('drop index if exists %s', item.index_name);
  end loop;
end $$;

create unique index if not exists messinho_engineering_review_runs_date_slot_uidx
  on public.messinho_engineering_review_runs (review_date, review_slot);

comment on column public.messinho_engineering_review_runs.review_slot is
'Idempotency slot for MESSINHO daily engineering work windows: morning (03:00-08:00 Europe/Berlin) or daytime (10:00-23:00 Europe/Berlin); legacy preserves historical rows.';
