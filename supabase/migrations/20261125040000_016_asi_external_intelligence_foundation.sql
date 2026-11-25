-- ASI External Intelligence foundation. Staging rollout only.
-- External collection remains disabled until provider licensing and legal approval.
begin;

create table if not exists public.asi_research_runs (
  id uuid primary key default gen_random_uuid(),
  player_id bigint not null references public.players(player_id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  initiated_by uuid references auth.users(id) on delete set null,
  run_type text not null default 'manual',
  status text not null default 'queued'
    check (status in ('queued','running','completed','partial','failed','cancelled')),
  provider_key text,
  query_fingerprint text,
  started_at timestamptz,
  finished_at timestamptz,
  result_summary jsonb not null default '{}'::jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  constraint asi_research_runs_type_check check (run_type in ('manual','scheduled','refresh','backfill'))
);

create table if not exists public.asi_external_evidence (
  id uuid primary key default gen_random_uuid(),
  player_id bigint not null references public.players(player_id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  research_run_id uuid references public.asi_research_runs(id) on delete set null,
  source_id uuid references public.asi_external_sources(id) on delete set null,
  claim_type text not null check (claim_type in (
    'contract_status','contract_start','contract_end','contract_option','loan','transfer',
    'transfer_rumour','contract_negotiation','appearance','minutes_played','performance_stat',
    'position','discipline','suspension','injury','absence','return_to_play','workload',
    'professional_statement','other'
  )),
  claim_title text not null,
  claim_text text not null,
  event_date date,
  published_at timestamptz,
  source_url text not null,
  publisher text,
  source_category text not null default 'unknown'
    check (source_category in ('official_club','league_federation','competition','licensed_provider','reputable_media','other','unknown')),
  evidence_excerpt text,
  identity_status text not null default 'pending'
    check (identity_status in ('pending','matched','ambiguous','rejected')),
  identity_confidence numeric(5,4) check (identity_confidence between 0 and 1),
  fact_confidence numeric(5,4) check (fact_confidence between 0 and 1),
  verification_status text not null default 'unconfirmed'
    check (verification_status in ('confirmed','corroborated','unconfirmed','conflicting','outdated','rejected')),
  data_classification text not null default 'ordinary'
    check (data_classification in ('ordinary','health_sensitive','special_review')),
  legal_review_status text not null default 'not_approved'
    check (legal_review_status in ('not_approved','approved','not_required','rejected')),
  review_status text not null default 'pending'
    check (review_status in ('pending','approved','rejected','needs_clarification')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  last_verified_at timestamptz,
  valid_until timestamptz,
  supersedes_id uuid references public.asi_external_evidence(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint asi_evidence_source_url_check check (source_url ~ '^https?://'),
  constraint asi_evidence_health_gate check (
    data_classification <> 'health_sensitive'
    or (legal_review_status = 'approved' and review_status <> 'approved' or legal_review_status = 'approved')
  )
);

create table if not exists public.asi_contract_snapshots (
  id uuid primary key default gen_random_uuid(),
  player_id bigint not null references public.players(player_id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  evidence_id uuid references public.asi_external_evidence(id) on delete set null,
  contract_status text not null
    check (contract_status in (
      'active','expiring','expired','extension_reported','extension_confirmed',
      'option_reported','option_confirmed','loan_active','loan_return_due',
      'loan_returned','purchase_option_reported','purchase_option_exercised',
      'purchase_obligation_reported','transfer_agreed','transfer_completed',
      'terminated','free_agent_confirmed','unknown','conflicting'
    )),
  club_name text,
  parent_club_name text,
  contract_start date,
  contract_end date,
  option_type text check (option_type is null or option_type in ('club','player','mutual','purchase','obligation','unknown')),
  option_details text,
  effective_date date,
  confidence numeric(5,4) check (confidence between 0 and 1),
  verification_status text not null default 'unconfirmed'
    check (verification_status in ('confirmed','corroborated','unconfirmed','conflicting','outdated')),
  source_url text,
  source_checked_at timestamptz,
  is_current boolean not null default true,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint asi_contract_date_order check (contract_start is null or contract_end is null or contract_end >= contract_start)
);

create table if not exists public.asi_evidence_reviews (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.asi_external_evidence(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  decision text not null check (decision in ('approve','reject','clarify','mark_conflict')),
  reason text not null,
  previous_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists asi_research_runs_player_created_idx on public.asi_research_runs(player_id, created_at desc);
create index if not exists asi_evidence_player_claim_date_idx on public.asi_external_evidence(player_id, claim_type, event_date desc);
create index if not exists asi_evidence_review_queue_idx on public.asi_external_evidence(review_status, created_at desc) where review_status = 'pending';
create index if not exists asi_evidence_source_idx on public.asi_external_evidence(source_id, published_at desc);
create index if not exists asi_contract_player_current_idx on public.asi_contract_snapshots(player_id, created_at desc) where is_current;
create unique index if not exists asi_contract_one_current_snapshot_idx on public.asi_contract_snapshots(player_id) where is_current;

alter table public.asi_research_runs enable row level security;
alter table public.asi_external_evidence enable row level security;
alter table public.asi_contract_snapshots enable row level security;
alter table public.asi_evidence_reviews enable row level security;

drop policy if exists asi_research_runs_admin_all on public.asi_research_runs;
create policy asi_research_runs_admin_all on public.asi_research_runs
for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists asi_evidence_read_scoped on public.asi_external_evidence;
create policy asi_evidence_read_scoped on public.asi_external_evidence
for select to authenticated using (
  (select private.is_admin())
  or (
    owner_id = (select auth.uid())
    and data_classification = 'ordinary'
    and review_status = 'approved'
    and verification_status in ('confirmed','corroborated')
  )
);

drop policy if exists asi_evidence_admin_write on public.asi_external_evidence;
create policy asi_evidence_admin_write on public.asi_external_evidence
for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists asi_contract_read_scoped on public.asi_contract_snapshots;
create policy asi_contract_read_scoped on public.asi_contract_snapshots
for select to authenticated using (owner_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists asi_contract_admin_write on public.asi_contract_snapshots;
create policy asi_contract_admin_write on public.asi_contract_snapshots
for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists asi_evidence_reviews_admin_all on public.asi_evidence_reviews;
create policy asi_evidence_reviews_admin_all on public.asi_evidence_reviews
for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

grant select on public.asi_research_runs to authenticated;
grant select on public.asi_external_evidence to authenticated;
grant select on public.asi_contract_snapshots to authenticated;
grant select on public.asi_evidence_reviews to authenticated;
grant insert, update, delete on public.asi_research_runs to authenticated;
grant insert, update, delete on public.asi_external_evidence to authenticated;
grant insert, update, delete on public.asi_contract_snapshots to authenticated;
grant insert, update, delete on public.asi_evidence_reviews to authenticated;

comment on table public.asi_external_evidence is 'Atomic, source-attributed external claims. External ingestion is disabled until provider and legal approval.';
comment on table public.asi_contract_snapshots is 'Versioned contract-state observations; retain source and verification status. Do not infer undisclosed contract terms.';
comment on table public.asi_research_runs is 'Auditable ASI research jobs; provider execution is separately gated.';
comment on table public.asi_evidence_reviews is 'Admin review decisions and audit trail for external evidence.';

commit;
