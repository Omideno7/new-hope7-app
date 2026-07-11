-- New Hope 7 v1.8.0 Hotfix 1 - School table repair and audio support
create extension if not exists pgcrypto;
create table if not exists public.school_lessons (
 id uuid primary key default gen_random_uuid(), lesson_code text not null unique,
 lesson_order integer not null default 100, content_data jsonb not null default '{}'::jsonb,
 is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists school_lessons_order_idx on public.school_lessons(lesson_order);
alter table public.school_lessons enable row level security;
drop policy if exists "public read active school lessons" on public.school_lessons;
create policy "public read active school lessons" on public.school_lessons for select to anon,authenticated using (is_active or coalesce((select public.nh7_admin_is_admin_v170()),false));
drop policy if exists "admin manage school lessons" on public.school_lessons;
create policy "admin manage school lessons" on public.school_lessons for all to authenticated using (coalesce((select public.nh7_admin_is_admin_v170()),false)) with check (coalesce((select public.nh7_admin_is_admin_v170()),false));
grant select on public.school_lessons to anon,authenticated;
grant insert,update,delete on public.school_lessons to authenticated;
drop policy if exists "nh7 admin upload church audio" on storage.objects;
create policy "nh7 admin upload church audio" on storage.objects for insert to authenticated with check (bucket_id='church-audio' and coalesce((select public.nh7_admin_is_admin_v170()),false));
drop policy if exists "nh7 admin update church audio" on storage.objects;
create policy "nh7 admin update church audio" on storage.objects for update to authenticated using (bucket_id='church-audio' and coalesce((select public.nh7_admin_is_admin_v170()),false)) with check (bucket_id='church-audio' and coalesce((select public.nh7_admin_is_admin_v170()),false));
drop policy if exists "nh7 admin delete church audio" on storage.objects;
create policy "nh7 admin delete church audio" on storage.objects for delete to authenticated using (bucket_id='church-audio' and coalesce((select public.nh7_admin_is_admin_v170()),false));
notify pgrst, 'reload schema';
select to_regclass('public.school_lessons') is not null as table_ready;
