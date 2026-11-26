-- Harden the feedback review ledger against mutation and index its reviewer foreign keys.
-- The audit table is append-only even for the backend service role.
revoke all on table public.messinho_feedback_reviews from public, anon, authenticated, service_role;
grant select, insert on table public.messinho_feedback_reviews to service_role;

create index if not exists messinho_feedback_reviewer_idx
  on public.messinho_feedback(reviewer_id) where reviewer_id is not null;
create index if not exists messinho_feedback_reviews_reviewer_idx
  on public.messinho_feedback_reviews(reviewer_id);
