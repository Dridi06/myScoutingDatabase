-- Harden MESSINHO knowledge retention on dedicated STAGING.
-- Concepts and relationships cannot be deleted through the backend role.
-- Version snapshots are append-only.
revoke all on public.messinho_knowledge_concepts,public.messinho_knowledge_links,public.messinho_knowledge_versions from public,anon,authenticated;
revoke delete,truncate,references,trigger on public.messinho_knowledge_concepts,public.messinho_knowledge_links from service_role;
revoke update,delete,truncate,references,trigger on public.messinho_knowledge_versions from service_role;
grant select,insert,update on public.messinho_knowledge_concepts,public.messinho_knowledge_links to service_role;
grant select,insert on public.messinho_knowledge_versions to service_role;
