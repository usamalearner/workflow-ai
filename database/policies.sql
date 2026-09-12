-- ============================================================================
--  WorkFlow AI — Row Level Security
--  Every user-owned table is locked to auth.uid(). The backend uses the service
--  role for trusted server-side writes; these policies protect any direct
--  (anon/authenticated) access, e.g. from the Supabase client.
-- ============================================================================

alter table public.profiles          enable row level security;
alter table public.documents         enable row level security;
alter table public.document_chunks   enable row level security;
alter table public.conversations     enable row level security;
alter table public.messages          enable row level security;
alter table public.actions           enable row level security;
alter table public.reports           enable row level security;
alter table public.analytics         enable row level security;

-- ── profiles ────────────────────────────────────────────────────────────────
drop policy if exists "profiles self" on public.profiles;
create policy "profiles self" on public.profiles
    for all using (id = auth.uid()) with check (id = auth.uid());

-- ── documents ───────────────────────────────────────────────────────────────
drop policy if exists "documents owner" on public.documents;
create policy "documents owner" on public.documents
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── document_chunks ─────────────────────────────────────────────────────────
drop policy if exists "chunks owner" on public.document_chunks;
create policy "chunks owner" on public.document_chunks
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── conversations ───────────────────────────────────────────────────────────
drop policy if exists "conversations owner" on public.conversations;
create policy "conversations owner" on public.conversations
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── messages ────────────────────────────────────────────────────────────────
drop policy if exists "messages owner" on public.messages;
create policy "messages owner" on public.messages
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── actions ─────────────────────────────────────────────────────────────────
drop policy if exists "actions owner" on public.actions;
create policy "actions owner" on public.actions
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── reports ─────────────────────────────────────────────────────────────────
drop policy if exists "reports owner" on public.reports;
create policy "reports owner" on public.reports
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── analytics ───────────────────────────────────────────────────────────────
drop policy if exists "analytics owner" on public.analytics;
create policy "analytics owner" on public.analytics
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
--  Storage — PRIVATE bucket 'workflow-documents'
--  Create the bucket (private) in the dashboard or with:
--    insert into storage.buckets (id, name, public)
--    values ('workflow-documents', 'workflow-documents', false)
--    on conflict (id) do nothing;
--  Objects are keyed  {user_id}/{document_id}/{filename}
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('workflow-documents', 'workflow-documents', false)
on conflict (id) do nothing;

drop policy if exists "wf storage read own"   on storage.objects;
drop policy if exists "wf storage write own"  on storage.objects;
drop policy if exists "wf storage update own" on storage.objects;
drop policy if exists "wf storage delete own" on storage.objects;

create policy "wf storage read own" on storage.objects
    for select using (
        bucket_id = 'workflow-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "wf storage write own" on storage.objects
    for insert with check (
        bucket_id = 'workflow-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "wf storage update own" on storage.objects
    for update using (
        bucket_id = 'workflow-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "wf storage delete own" on storage.objects
    for delete using (
        bucket_id = 'workflow-documents'
        and (storage.foldername(name))[1] = auth.uid()::text
    );
