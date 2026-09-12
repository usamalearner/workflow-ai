-- ============================================================================
--  Migration: switch document_chunks.embedding from the old 512-dim hashed
--  vectors to 384-dim intfloat/multilingual-e5-small embeddings.
--
--  Only needed on a database that already ran the old schema.sql (i.e. has a
--  vector(512) column). A fresh install should just run schema.sql →
--  functions.sql → indexes.sql → policies.sql as-is; skip this file.
--
--  The old vectors are NOT compatible with the new model's embedding space,
--  so this drops existing embeddings outright. After running this, every
--  chunk has embedding = null until you re-embed it — run
--  backend/scripts/reembed_documents.py (or just delete and re-upload your
--  documents) before Copilot search will work again.
-- ============================================================================

begin;

-- Arg types are part of a function's identity in Postgres, so a plain
-- "create or replace" with a new vector() width would add a second
-- overload rather than replace this one — drop it explicitly first.
drop function if exists public.match_document_chunks(uuid, vector(512), int, uuid[]);

alter table public.document_chunks drop column embedding;
alter table public.document_chunks add column embedding vector(384);

commit;

-- Re-run these after the migration (both are idempotent):
--   database/functions.sql   -- recreates match_document_chunks at 384 dims
--   database/indexes.sql     -- recreates the ivfflat index (dropped with the column)
