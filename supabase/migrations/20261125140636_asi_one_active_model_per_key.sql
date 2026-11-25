-- Exactly one active version per deterministic or statistical model key.
-- Existing active versions were checked for duplicates before applying this constraint.
create unique index if not exists asi_model_versions_one_active_per_key_idx
  on public.asi_model_versions(model_key)
  where status='active';
