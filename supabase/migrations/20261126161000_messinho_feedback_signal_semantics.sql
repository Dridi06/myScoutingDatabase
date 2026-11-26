-- A numerical rating measures answer quality only. Corrections, bugs and feature requests
-- remain separate qualitative signals and must not masquerade as scored training labels.
alter table public.messinho_feedback
  add constraint messinho_feedback_rating_type_semantics
  check (feedback_type = 'quality_rating' or rating is null);

comment on constraint messinho_feedback_rating_type_semantics on public.messinho_feedback is
  'Only answer-quality feedback may carry a 1-5 rating; factual corrections and requests are qualitative signals.';
