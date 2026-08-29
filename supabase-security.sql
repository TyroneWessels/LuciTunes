begin;

-- Run this in the Supabase SQL Editor before deploying the matching frontend change.
alter table public.posts enable row level security;

-- Visitors must never query the base table. Authenticated authors can access only
-- their own rows; the public site reads the explicitly limited view below.
revoke all on table public.posts from public, anon;
grant select, insert, update, delete on table public.posts to authenticated;

drop policy if exists "Public posts are readable" on public.posts;
drop policy if exists "Authors can read their own posts" on public.posts;
drop policy if exists "Authors can create their own posts" on public.posts;
drop policy if exists "Authors can update their own posts" on public.posts;
drop policy if exists "Authors can delete their own posts" on public.posts;
drop policy if exists "Anyone can read posts" on public.posts;
drop policy if exists "Editors can create their own posts" on public.posts;
drop policy if exists "Editors can update their own posts" on public.posts;
drop policy if exists "Editors can delete their own posts" on public.posts;

create policy "Authors can read their own posts"
  on public.posts for select to authenticated
  using ((select auth.uid()) = author_id);

create policy "Authors can create their own posts"
  on public.posts for insert to authenticated
  with check ((select auth.uid()) = author_id);

create policy "Authors can update their own posts"
  on public.posts for update to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

create policy "Authors can delete their own posts"
  on public.posts for delete to authenticated
  using ((select auth.uid()) = author_id);

-- A security-definer view exposes only the fields intentionally published by the site.
create or replace view public.public_posts
  with (security_barrier = true)
as
select id, artist, title, genre, rating, note, reflection, spotify, image_url, featured, reviewer, created_at
from public.posts;

revoke all on table public.public_posts from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on table public.public_posts to anon, authenticated;

-- Images remain publicly readable because the site uses public URLs. These policies
-- prevent one signed-in user from writing or deleting another user's uploads.
drop policy if exists "Users can upload their own post images" on storage.objects;
drop policy if exists "Users can update their own post images" on storage.objects;
drop policy if exists "Users can delete their own post images" on storage.objects;

create policy "Users can upload their own post images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can update their own post images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can delete their own post images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

commit;