-- Universal timestamp coverage for persisted MESSINHO memory.
-- Existing memory rows receive the migration timestamp as a baseline; their
-- original creation time cannot be reconstructed retroactively.
alter table public.messinho_agent_memory
  add column if not exists created_at timestamptz not null default now();

drop trigger if exists messinho_agent_memory_touch_updated_at on public.messinho_agent_memory;
create trigger messinho_agent_memory_touch_updated_at
  before update on public.messinho_agent_memory
  for each row execute function public.touch_updated_at();

comment on column public.messinho_agent_memory.created_at is
  'Server/database timestamp when this durable owner memory row was first created.';
comment on column public.messinho_agent_memory.updated_at is
  'Server/database timestamp of the most recent memory update.';
