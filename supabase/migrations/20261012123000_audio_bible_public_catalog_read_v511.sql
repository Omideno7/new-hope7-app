-- New Hope 7 v5.1.1 — restore read-only Audio Bible catalog access.
-- Published/active catalog rows are readable by app clients; all existing admin
-- write policies remain unchanged.

grant select on table public.audio_bible_books to anon, authenticated;
grant select on table public.audio_bible_chapters to anon, authenticated;
grant select on table public.audio_bible_books_v220 to anon, authenticated;
grant select on table public.audio_bible_chapters_v220 to anon, authenticated;

drop policy if exists "audio bible books public read v511" on public.audio_bible_books;
create policy "audio bible books public read v511"
on public.audio_bible_books
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "audio bible chapters public read v511" on public.audio_bible_chapters;
create policy "audio bible chapters public read v511"
on public.audio_bible_chapters
for select
to anon, authenticated
using (is_published = true and admin_deleted_at is null);
