-- Durable, once-per-Berlin-date ledger for the optional STAGING-only MESSINHO engineering review.
create table if not exists public.messinho_engineering_review_runs (
  id uuid primary key default gen_random_uuid(),
  review_date date not null unique,
  status text not null check (status in ('running','no_improvement','ticket_created','duplicate','failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  source_sha text check (source_sha is null or source_sha ~ '^[a-f0-9]{40}$'),
  ticket_id text,
  error_code text,
  created_at timestamptz not null default now(),
  constraint messinho_engineering_review_finished_check
    check ((status='running' and finished_at is null) or (status<>'running' and finished_at is not null))
);

create index if not exists messinho_engineering_review_status_idx
  on public.messinho_engineering_review_runs(status, review_date desc);

alter table public.messinho_engineering_review_runs enable row level security;
revoke all on table public.messinho_engineering_review_runs from public, anon, authenticated;
grant select, insert, update on table public.messinho_engineering_review_runs to service_role;
