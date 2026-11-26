-- MESSINHO hierarchical knowledge foundation.
-- Dedicated STAGING only. Compact original knowledge records; no source full text or PDFs.
create table if not exists public.messinho_knowledge_concepts (
  id uuid primary key default gen_random_uuid(),
  concept_key text not null unique check (concept_key ~ '^[a-z0-9][a-z0-9._:-]{2,159}$'),
  domain text not null check (domain in ('mathematics','physics','biology','medicine','risk_management','banking','financial_markets','statistics','sports_science','football','computer_science','general')),
  topic text not null check (char_length(topic) between 2 and 180),
  title text not null check (char_length(title) between 3 and 220),
  definition text not null check (char_length(definition) between 40 and 1800),
  knowledge_level text not null check (knowledge_level in ('foundational','intermediate','advanced','specialist')),
  knowledge_type text not null check (knowledge_type in ('concept','principle','formula','method','rule','metric','model','procedure')),
  parent_concept_key text references public.messinho_knowledge_concepts(concept_key) on update cascade on delete restrict,
  prerequisites text[] not null default '{}',
  formula text,
  formula_variables jsonb not null default '{}'::jsonb check (jsonb_typeof(formula_variables)='object' and octet_length(formula_variables::text)<=5000),
  applicability text,
  limitations text[] not null default '{}',
  claims jsonb not null default '[]'::jsonb check (jsonb_typeof(claims)='array' and octet_length(claims::text)<=10000),
  sources jsonb not null check (jsonb_typeof(sources)='array' and octet_length(sources::text)<=12000),
  rights jsonb not null check (jsonb_typeof(rights)='object' and rights->>'status'='verified_permitted' and rights->>'ai_tdm'='true' and rights->>'commercial_use'='true' and rights->>'derivative_use'='true'),
  evidence_grade text not null check (evidence_grade in ('A','B','C','D','E','not_applicable')),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  knowledge_status text not null default 'candidate' check (knowledge_status in ('candidate','active','conflicting','stale','superseded','quarantined','rejected')),
  conflict_group text,
  version integer not null default 1 check (version>0),
  previous_version_id uuid references public.messinho_knowledge_concepts(id) on delete restrict,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  review_due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_concept_key is null or parent_concept_key <> concept_key),
  check (valid_until is null or valid_until > valid_from)
);
create index if not exists messinho_knowledge_concepts_domain_level_idx on public.messinho_knowledge_concepts(domain,knowledge_level,knowledge_status);
create index if not exists messinho_knowledge_concepts_parent_idx on public.messinho_knowledge_concepts(parent_concept_key);
create index if not exists messinho_knowledge_concepts_review_idx on public.messinho_knowledge_concepts(review_due_at) where knowledge_status='active';
create table if not exists public.messinho_knowledge_links (
  id uuid primary key default gen_random_uuid(),
  from_concept_id uuid not null references public.messinho_knowledge_concepts(id) on delete cascade,
  to_concept_id uuid not null references public.messinho_knowledge_concepts(id) on delete restrict,
  relation_type text not null check (relation_type in ('prerequisite','related','extends','contradicts','applies_to','derived_from')),
  rationale text,
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence)='array' and octet_length(evidence::text)<=6000),
  created_at timestamptz not null default now(),
  unique(from_concept_id,to_concept_id,relation_type),
  check(from_concept_id <> to_concept_id)
);
create index if not exists messinho_knowledge_links_from_idx on public.messinho_knowledge_links(from_concept_id,relation_type);
create index if not exists messinho_knowledge_links_to_idx on public.messinho_knowledge_links(to_concept_id,relation_type);
create table if not exists public.messinho_knowledge_versions (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.messinho_knowledge_concepts(id) on delete restrict,
  version integer not null check(version>0),
  snapshot jsonb not null check(jsonb_typeof(snapshot)='object' and octet_length(snapshot::text)<=30000),
  change_reason text not null check(char_length(change_reason) between 5 and 500),
  changed_by text not null default 'messinho',
  created_at timestamptz not null default now(),
  unique(concept_id,version)
);
create index if not exists messinho_knowledge_versions_concept_idx on public.messinho_knowledge_versions(concept_id,version desc);
alter table public.messinho_knowledge_concepts enable row level security;
alter table public.messinho_knowledge_links enable row level security;
alter table public.messinho_knowledge_versions enable row level security;
revoke all on public.messinho_knowledge_concepts,public.messinho_knowledge_links,public.messinho_knowledge_versions from anon,authenticated;
grant select,insert,update,delete on public.messinho_knowledge_concepts,public.messinho_knowledge_links to service_role;
grant select,insert on public.messinho_knowledge_versions to service_role;
comment on table public.messinho_knowledge_concepts is 'MESSINHO compact hierarchical cross-domain concepts; server-only, rights-verified, versioned; no source full texts.';
comment on table public.messinho_knowledge_links is 'Typed relationships between MESSINHO knowledge concepts.';
comment on table public.messinho_knowledge_versions is 'Append-only snapshots for MESSINHO concept version history.';
