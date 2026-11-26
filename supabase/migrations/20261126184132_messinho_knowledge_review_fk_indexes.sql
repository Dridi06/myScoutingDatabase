-- Cover the remaining knowledge review/conflict foreign keys.
create index if not exists messinho_knowledge_conflicts_resolved_version_id_idx
  on public.messinho_knowledge_conflicts(resolved_version_id);
create index if not exists messinho_knowledge_reviews_reviewer_id_idx
  on public.messinho_knowledge_reviews(reviewer_id);
