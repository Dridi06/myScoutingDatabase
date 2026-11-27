create table if not exists public.messinho_engineering_review_runs (
  id uuid primary key default gen_random_uuid(),
  review_date date not null unique,
  status text not null check (status in ('running','ticket_created','no_improvement','duplicate','failed')),
  source_sha text,
  ticket_id text,
  error_code text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
alter table public.messinho_engineering_review_runs enable row level security;
revoke all on public.messinho_engineering_review_runs from public, anon, authenticated;
grant all on public.messinho_engineering_review_runs to service_role;
