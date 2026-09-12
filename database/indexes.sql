-- ============================================================================
--  WorkFlow AI — Indexes
-- ============================================================================

create index if not exists idx_documents_user            on public.documents (user_id, created_at desc);
create index if not exists idx_documents_status          on public.documents (user_id, status);

create index if not exists idx_chunks_document           on public.document_chunks (document_id);
create index if not exists idx_chunks_user               on public.document_chunks (user_id);

-- Approximate nearest-neighbour index for cosine distance.
-- Build after the table has data for best results; lists ~ rows/1000.
create index if not exists idx_chunks_embedding
    on public.document_chunks
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

create index if not exists idx_conversations_user        on public.conversations (user_id, updated_at desc);
create index if not exists idx_messages_conversation     on public.messages (conversation_id, created_at);

create index if not exists idx_actions_user              on public.actions (user_id, created_at desc);
create index if not exists idx_actions_priority          on public.actions (user_id, priority);
create index if not exists idx_actions_status            on public.actions (user_id, status);

create index if not exists idx_reports_user              on public.reports (user_id, created_at desc);
create index if not exists idx_analytics_user            on public.analytics (user_id, created_at);
