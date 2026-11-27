-- Cover the conversation-message foreign key with a dedicated index.
create index if not exists messinho_conversation_messages_conversation_id_idx
  on public.messinho_conversation_messages(conversation_id);
