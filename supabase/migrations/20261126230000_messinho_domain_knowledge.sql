-- Canonical, compact, cross-domain MESSINHO knowledge.
-- Apply to the dedicated STAGING Supabase project only.
-- Full source texts/PDFs are intentionally not stored.
create table if not exists public.messinho_domain_knowledge (
 id uuid primary key default gen_random_uuid(),
 fingerprint text not null unique check (fingerprint ~ '^[a-f0-9]{64}$'),
 domain text not null check (domain in ('mathematics','physics','biology','medicine','risk_management','banking','financial_markets','statistics','sports_science','football','computer_science','general')),
 question text not null check (char_length(question) between 12 and 500),
 content text not null check (char_length(content) between 40 and 1600),
 claims jsonb not null default '[]'::jsonb check (jsonb_typeof(claims)='array' and octet_length(claims::text)<=6000),
 sources jsonb not null check (jsonb_typeof(sources)='array' and octet_length(sources::text)<=8000),
 rights jsonb not null check (jsonb_typeof(rights)='object' and rights->>'status'='verified_permitted' and rights->>'ai_tdm'='true' and rights->>'commercial_use'='true' and rights->>'derivative_use'='true'),
 confidence numeric(4,3) not null default 0 check (confidence between 0 and 1),
 knowledge_status text not null default 'active' check (knowledge_status in ('active','stale','conflicting','superseded','quarantined','removed')),
 version integer not null default 1 check (version>0),
 verified_at timestamptz not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists messinho_domain_knowledge_domain_status_idx on public.messinho_domain_knowledge(domain,knowledge_status,verified_at desc);
alter table public.messinho_domain_knowledge enable row level security;
revoke all on public.messinho_domain_knowledge from anon,authenticated;
grant select,insert,update,delete on public.messinho_domain_knowledge to service_role;
comment on table public.messinho_domain_knowledge is 'Compact rights-verified permanent cross-domain knowledge; no source full text or PDFs; server-only access.';
