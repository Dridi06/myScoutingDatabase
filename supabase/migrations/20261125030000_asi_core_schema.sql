-- ASI core tables required by MESSINHO's verified learning and development flows.
-- These objects must exist before the ASI evidence foundation and MESSINHO extensions.
create table if not exists public.asi_external_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_url text,
  domain text,
  source_category text not null default 'unknown'
    check (source_category in ('official_club','league_federation','competition','licensed_provider','reputable_media','other','unknown')),
  trust_level numeric(5,4) check (trust_level between 0 and 1),
  license_status text not null default 'not_reviewed'
    check (license_status in ('not_reviewed','approved','restricted','rejected')),
  enabled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asi_scout_calibration_records (
  id uuid primary key default gen_random_uuid(),
  player_id bigint not null references public.players(player_id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  scout_id uuid not null references public.profiles(id) on delete restrict,
  created_by uuid references public.profiles(id) on delete set null,
  scout_rating numeric(5,2) not null check (scout_rating between 0 and 100),
  outcome_metric text not null,
  verified_outcome numeric(5,2) check (verified_outcome between 0 and 100),
  outcome_observed_on date,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected')),
  verified_by uuid references public.profiles(id) on delete set null,
  verification_source_url text,
  verification_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists asi_calibration_owner_created_idx
  on public.asi_scout_calibration_records(owner_id,created_at desc);
create index if not exists asi_calibration_verification_idx
  on public.asi_scout_calibration_records(verification_status,outcome_metric,created_at desc);

create table if not exists public.asi_prediction_records (
  id uuid primary key default gen_random_uuid(),
  player_id bigint not null references public.players(player_id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  target_metric text not null,
  prediction_horizon_days integer not null check (prediction_horizon_days > 0),
  predicted_value numeric(8,3) not null,
  prediction_interval_low numeric(8,3),
  prediction_interval_high numeric(8,3),
  probability numeric(6,5) check (probability is null or probability between 0 and 1),
  model_version text not null,
  input_cutoff_at timestamptz,
  status text not null default 'pending',
  explanation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint asi_prediction_interval_order check (
    prediction_interval_low is null or prediction_interval_high is null
    or prediction_interval_high >= prediction_interval_low
  )
);
create index if not exists asi_prediction_owner_created_idx
  on public.asi_prediction_records(owner_id,created_at desc);
create index if not exists asi_prediction_player_metric_idx
  on public.asi_prediction_records(player_id,target_metric,created_at desc);

create table if not exists public.asi_prediction_outcomes (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references public.asi_prediction_records(id) on delete cascade,
  player_id bigint not null references public.players(player_id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  observed_metric text not null,
  observed_value numeric(8,3) not null,
  observed_on date not null,
  outcome_source text not null default 'scout_submitted_pending_review',
  verification_source_url text,
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected')),
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  verification_reason text,
  created_at timestamptz not null default now()
);
create index if not exists asi_prediction_outcomes_prediction_idx
  on public.asi_prediction_outcomes(prediction_id,created_at desc);
create index if not exists asi_prediction_outcomes_verified_idx
  on public.asi_prediction_outcomes(verification_status,observed_on desc);

create table if not exists public.asi_model_versions (
  id uuid primary key default gen_random_uuid(),
  model_key text not null,
  version text not null,
  model_family text not null,
  status text not null default 'candidate' check (status in ('candidate','active','retired')),
  training_data_cutoff timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(model_key,version)
);
create index if not exists asi_model_versions_key_status_idx
  on public.asi_model_versions(model_key,status,created_at desc);

create table if not exists public.asi_training_runs (
  id uuid primary key default gen_random_uuid(),
  model_key text not null,
  candidate_version text,
  status text not null default 'queued'
    check (status in ('queued','running','succeeded','failed','rejected','insufficient_data')),
  data_cutoff_at timestamptz,
  dataset_fingerprint text,
  training_config jsonb not null default '{}'::jsonb,
  evaluation_summary jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists asi_training_runs_key_created_idx
  on public.asi_training_runs(model_key,created_at desc);

create table if not exists public.asi_model_evaluations (
  id uuid primary key default gen_random_uuid(),
  model_version_id uuid not null references public.asi_model_versions(id) on delete cascade,
  baseline_version_id uuid references public.asi_model_versions(id) on delete set null,
  evaluation_name text not null,
  dataset_start date,
  dataset_end date,
  metrics jsonb not null default '{}'::jsonb,
  passed boolean not null default false,
  evaluated_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists asi_model_evaluations_model_created_idx
  on public.asi_model_evaluations(model_version_id,created_at desc);

create table if not exists public.asi_player_analyses (
  id uuid primary key default gen_random_uuid(),
  player_id bigint not null references public.players(player_id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  analysis_type text not null,
  model_version text,
  analysis_json jsonb not null default '{}'::jsonb,
  input_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists asi_player_analyses_owner_created_idx
  on public.asi_player_analyses(owner_id,created_at desc);
create index if not exists asi_player_analyses_player_created_idx
  on public.asi_player_analyses(player_id,created_at desc);

alter table public.asi_external_sources enable row level security;
alter table public.asi_scout_calibration_records enable row level security;
alter table public.asi_prediction_records enable row level security;
alter table public.asi_prediction_outcomes enable row level security;
alter table public.asi_model_versions enable row level security;
alter table public.asi_training_runs enable row level security;
alter table public.asi_model_evaluations enable row level security;
alter table public.asi_player_analyses enable row level security;

revoke all on public.asi_external_sources,public.asi_scout_calibration_records,
  public.asi_prediction_records,public.asi_prediction_outcomes,public.asi_model_versions,
  public.asi_training_runs,public.asi_model_evaluations,public.asi_player_analyses
from anon,authenticated;
grant all on public.asi_external_sources,public.asi_scout_calibration_records,
  public.asi_prediction_records,public.asi_prediction_outcomes,public.asi_model_versions,
  public.asi_training_runs,public.asi_model_evaluations,public.asi_player_analyses
to service_role;
