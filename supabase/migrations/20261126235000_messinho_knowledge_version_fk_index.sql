-- Index the self-referential previous-version foreign key for knowledge graph lookups.
create index if not exists messinho_knowledge_concepts_previous_version_id_idx
  on public.messinho_knowledge_concepts(previous_version_id);
