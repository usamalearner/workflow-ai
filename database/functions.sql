-- ============================================================================
--  WorkFlow AI — RPC functions
-- ============================================================================

-- Vector similarity search over the caller's own chunks only.
-- Called from the backend service role; p_user_id scopes the result set and
-- RLS on document_chunks is the hard boundary.
create or replace function public.match_document_chunks(
    p_user_id         uuid,
    p_query_embedding vector(384),
    p_match_count     int default 6,
    p_document_ids    uuid[] default null
)
returns table (
    id            uuid,
    document_id   uuid,
    content       text,
    page_number   int,
    chunk_number  int,
    score         float
)
language sql stable
as $$
    select
        c.id,
        c.document_id,
        c.content,
        c.page_number,
        c.chunk_number,
        1 - (c.embedding <=> p_query_embedding) as score
    from public.document_chunks c
    where c.user_id = p_user_id
      and c.embedding is not null
      and (p_document_ids is null or c.document_id = any (p_document_ids))
    order by c.embedding <=> p_query_embedding
    limit greatest(p_match_count, 1);
$$;

-- Aggregate analytics totals for a user.
create or replace function public.analytics_totals(p_user_id uuid)
returns table (kind text, total bigint)
language sql stable
as $$
    select kind, sum(value)::bigint as total
    from public.analytics
    where user_id = p_user_id
    group by kind;
$$;
