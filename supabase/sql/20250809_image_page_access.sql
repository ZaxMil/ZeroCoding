-- Run in Supabase SQL editor if migrations folder is read-only
create extension if not exists pgcrypto;
create table if not exists public.image_page_access (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null default now(),
  uid uuid not null,
  cid text not null,
  i int not null,
  ip text,
  ua text,
  fmt text,
  wm boolean,
  req_id text
);
alter table public.image_page_access enable row level security;
create policy "admins can read image logs"
on public.image_page_access for select
to authenticated
using (is_admin(auth.uid()));
create index if not exists ipa_ts_desc on public.image_page_access (ts desc);
create index if not exists ipa_uid_ts on public.image_page_access (uid, ts desc);
create index if not exists ipa_cid_i on public.image_page_access (cid, i);
-- Down
-- drop index if exists ipa_cid_i;
-- drop index if exists ipa_uid_ts;
-- drop index if exists ipa_ts_desc;
-- drop policy if exists "admins can read image logs" on public.image_page_access;
-- drop table if exists public.image_page_access;