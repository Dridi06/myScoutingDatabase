-- Keep the MESSINHO admin review ledger append-only.
revoke all on public.messinho_knowledge_reviews from public,anon,authenticated;
revoke update,delete,truncate,references,trigger on public.messinho_knowledge_reviews from service_role;
grant select,insert on public.messinho_knowledge_reviews to service_role;
