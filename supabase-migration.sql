-- Run this once in Supabase SQL Editor.
-- It adds the long reflection field and keeps post changes owner-only.

alter table public.posts
add column if not exists reflection text;

alter table public.posts
add column if not exists author_id uuid references auth.users(id) on delete cascade;

alter table public.posts enable row level security;

drop policy if exists "Editors can create posts" on public.posts;
drop policy if exists "Editors can create their own posts" on public.posts;
drop policy if exists "Editors can update their own posts" on public.posts;
drop policy if exists "Editors can delete their own posts" on public.posts;

drop policy if exists "Anyone can read posts" on public.posts;
create policy "Anyone can read posts"
on public.posts for select
to anon, authenticated
using (true);

create policy "Editors can create their own posts"
on public.posts for insert
to authenticated
with check ((select auth.uid()) = author_id);

create policy "Editors can update their own posts"
on public.posts for update
to authenticated
using ((select auth.uid()) = author_id)
with check ((select auth.uid()) = author_id);

create policy "Editors can delete their own posts"
on public.posts for delete
to authenticated
using ((select auth.uid()) = author_id);
