-- MESSINHO cross-domain taxonomy expansion: chemistry and ethics.
-- Apply to the dedicated STAGING Supabase project only after review.
-- This migration changes allowed domain labels only; it inserts no knowledge and grants no new access.
alter table public.messinho_knowledge_concepts
  drop constraint if exists messinho_knowledge_concepts_domain_check;
alter table public.messinho_knowledge_concepts
  add constraint messinho_knowledge_concepts_domain_check
  check (domain in (
    'mathematics','physics','chemistry','biology','medicine','ethics',
    'risk_management','banking','financial_markets','statistics',
    'sports_science','football','computer_science','general'
  ));

alter table public.messinho_domain_knowledge
  drop constraint if exists messinho_domain_knowledge_domain_check;
alter table public.messinho_domain_knowledge
  add constraint messinho_domain_knowledge_domain_check
  check (domain in (
    'mathematics','physics','chemistry','biology','medicine','ethics',
    'risk_management','banking','financial_markets','statistics',
    'sports_science','football','computer_science','general'
  ));
