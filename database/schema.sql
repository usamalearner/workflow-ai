-- ============================================================================
--  WorkFlow AI — Database schema
--  Run order: schema.sql → functions.sql → indexes.sql → policies.sql
--  Target: Supabase Postgres with the pgvector extension.
-- ============================================================================

create extension if not exists "vector";
create extension if not exists "pgcrypto";

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
    id          uuid primary key references auth.users (id) on delete cascade,
    email       text not null,
    full_name   text default '',
    avatar_url  text,
    created_at  timestamptz not null default now()
);

-- ── documents ───────────────────────────────────────────────────────────────
create table if not exists public.documents (
    id                 uuid primary key default gen_random_uuid(),
    user_id            uuid not null references auth.users (id) on delete cascade,
    filename           text not null,
    original_filename  text not null,
    file_type          text not null check (file_type in ('pdf', 'docx', 'xlsx', 'csv')),
    file_size          bigint not null default 0,
    storage_path       text,
    status             text not null default 'uploading'
                       check (status in ('uploading', 'processing', 'ready', 'failed')),
    page_count         integer not null default 0,
    chunk_count        integer not null default 0,
    error              text,
    is_demo            boolean not null default false,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now()
);

-- ── document_chunks (vector store) ──────────────────────────────────────────
create table if not exists public.document_chunks (
    id            uuid primary key default gen_random_uuid(),
    document_id   uuid not null references public.documents (id) on delete cascade,
    user_id       uuid not null references auth.users (id) on delete cascade,
    content       text not null,
    page_number   integer not null default 1,
    chunk_number  integer not null default 0,
    embedding     vector(384), -- intfloat/multilingual-e5-small output size
    created_at    timestamptz not null default now()
);

-- ── conversations ───────────────────────────────────────────────────────────
create table if not exists public.conversations (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users (id) on delete cascade,
    title       text not null default 'New conversation',
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- ── messages ────────────────────────────────────────────────────────────────
create table if not exists public.messages (
    id               uuid primary key default gen_random_uuid(),
    conversation_id  uuid not null references public.conversations (id) on delete cascade,
    user_id          uuid not null references auth.users (id) on delete cascade,
    role             text not null check (role in ('user', 'assistant')),
    content          text not null,
    sources          jsonb not null default '[]'::jsonb,
    created_at       timestamptz not null default now()
);

-- ── actions ─────────────────────────────────────────────────────────────────
create table if not exists public.actions (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users (id) on delete cascade,
    source_document_id  uuid references public.documents (id) on delete set null,
    title               text not null,
    description         text not null default '',
    owner               text not null default '',
    deadline            date,
    priority            text not null default 'medium'
                        check (priority in ('low', 'medium', 'high', 'critical')),
    status              text not null default 'pending'
                        check (status in ('pending', 'in_progress', 'completed')),
    is_demo             boolean not null default false,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

-- ── reports ─────────────────────────────────────────────────────────────────
create table if not exists public.reports (
    id                uuid primary key default gen_random_uuid(),
    user_id           uuid not null references auth.users (id) on delete cascade,
    title             text not null,
    report_type       text not null check (report_type in (
                          'executive_summary', 'technical_report', 'management_brief',
                          'risk_assessment', 'meeting_summary', 'document_comparison')),
    content           text not null,
    source_documents  jsonb not null default '[]'::jsonb,
    source_filenames  jsonb not null default '[]'::jsonb,
    is_demo           boolean not null default false,
    created_at        timestamptz not null default now()
);

-- ── analytics (event log) ───────────────────────────────────────────────────
create table if not exists public.analytics (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users (id) on delete cascade,
    kind        text not null check (kind in (
                    'documents_processed', 'questions_answered', 'actions_extracted',
                    'reports_generated', 'minutes_saved')),
    value       integer not null default 1,
    created_at  timestamptz not null default now()
);

-- ── auto-create a profile row on signup ─────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name)
    values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
