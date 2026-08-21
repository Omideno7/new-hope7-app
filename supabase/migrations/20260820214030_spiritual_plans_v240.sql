-- New Hope 7 v2.4.0 — private spiritual-plan progress and fasting journal.
-- This migration is additive and intentionally does not touch School progress.

create table if not exists public.spiritual_plan_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null,
  day_number smallint not null,
  status text not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  reflection text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, plan_id, day_number),
  constraint spiritual_plan_progress_plan_id_safe
    check (plan_id ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  constraint spiritual_plan_progress_day_range
    check (day_number between 1 and 366),
  constraint spiritual_plan_progress_status_valid
    check (status in ('in_progress', 'completed')),
  constraint spiritual_plan_progress_completion_valid
    check (status = 'in_progress' or completed_at is not null),
  constraint spiritual_plan_progress_reflection_size
    check (length(reflection) <= 4000)
);

create index if not exists spiritual_plan_progress_user_updated_idx
  on public.spiritual_plan_progress (user_id, updated_at desc);
create index if not exists spiritual_plan_progress_user_status_idx
  on public.spiritual_plan_progress (user_id, status, completed_at desc);

create table if not exists public.fasting_journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fasting_type text not null,
  start_date date not null,
  end_date date not null,
  purpose text not null default '',
  status text not null default 'active',
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fasting_journeys_id_user_unique unique (id, user_id),
  constraint fasting_journeys_type_valid
    check (fasting_type in ('partial', 'daniel', 'sunrise', 'one_meal', 'media', 'custom')),
  constraint fasting_journeys_dates_valid
    check (end_date >= start_date),
  constraint fasting_journeys_status_valid
    check (status in ('active', 'completed', 'cancelled')),
  constraint fasting_journeys_purpose_size
    check (length(purpose) <= 1000)
);

create index if not exists fasting_journeys_user_status_idx
  on public.fasting_journeys (user_id, status, created_at desc);

create table if not exists public.fasting_daily_logs (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  completed boolean not null default false,
  prayer_minutes smallint not null default 0,
  scripture_note text not null default '',
  reflection text not null default '',
  updated_at timestamptz not null default now(),
  constraint fasting_daily_logs_journey_owner_fk
    foreign key (journey_id, user_id)
    references public.fasting_journeys (id, user_id)
    on delete cascade,
  constraint fasting_daily_logs_user_journey_date_unique
    unique (user_id, journey_id, log_date),
  constraint fasting_daily_logs_prayer_minutes_range
    check (prayer_minutes between 0 and 1440),
  constraint fasting_daily_logs_scripture_note_size
    check (length(scripture_note) <= 4000),
  constraint fasting_daily_logs_reflection_size
    check (length(reflection) <= 4000)
);

create index if not exists fasting_daily_logs_user_date_idx
  on public.fasting_daily_logs (user_id, log_date desc);
create index if not exists fasting_daily_logs_journey_date_idx
  on public.fasting_daily_logs (journey_id, log_date);
create index if not exists fasting_daily_logs_journey_owner_idx
  on public.fasting_daily_logs (journey_id, user_id);

alter table public.spiritual_plan_progress enable row level security;
alter table public.fasting_journeys enable row level security;
alter table public.fasting_daily_logs enable row level security;

revoke all on table public.spiritual_plan_progress from anon, authenticated;
revoke all on table public.fasting_journeys from anon, authenticated;
revoke all on table public.fasting_daily_logs from anon, authenticated;

grant select, insert, update, delete on table public.spiritual_plan_progress to authenticated;
grant select, insert, update, delete on table public.fasting_journeys to authenticated;
grant select, insert, update, delete on table public.fasting_daily_logs to authenticated;

drop policy if exists "spiritual progress select own" on public.spiritual_plan_progress;
drop policy if exists "spiritual progress insert own" on public.spiritual_plan_progress;
drop policy if exists "spiritual progress update own" on public.spiritual_plan_progress;
drop policy if exists "spiritual progress delete own" on public.spiritual_plan_progress;
create policy "spiritual progress select own"
  on public.spiritual_plan_progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "spiritual progress insert own"
  on public.spiritual_plan_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "spiritual progress update own"
  on public.spiritual_plan_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "spiritual progress delete own"
  on public.spiritual_plan_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "fasting journeys select own" on public.fasting_journeys;
drop policy if exists "fasting journeys insert own" on public.fasting_journeys;
drop policy if exists "fasting journeys update own" on public.fasting_journeys;
drop policy if exists "fasting journeys delete own" on public.fasting_journeys;
create policy "fasting journeys select own"
  on public.fasting_journeys for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "fasting journeys insert own"
  on public.fasting_journeys for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "fasting journeys update own"
  on public.fasting_journeys for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "fasting journeys delete own"
  on public.fasting_journeys for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "fasting logs select own" on public.fasting_daily_logs;
drop policy if exists "fasting logs insert own" on public.fasting_daily_logs;
drop policy if exists "fasting logs update own" on public.fasting_daily_logs;
drop policy if exists "fasting logs delete own" on public.fasting_daily_logs;
create policy "fasting logs select own"
  on public.fasting_daily_logs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "fasting logs insert own"
  on public.fasting_daily_logs for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "fasting logs update own"
  on public.fasting_daily_logs for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "fasting logs delete own"
  on public.fasting_daily_logs for delete to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.spiritual_plan_progress is
  'Private per-user spiritual plan progress and reflections for New Hope 7 v2.4.0.';
comment on table public.fasting_journeys is
  'Private per-user fasting journeys for New Hope 7 v2.4.0.';
comment on table public.fasting_daily_logs is
  'Private idempotent daily fasting logs for New Hope 7 v2.4.0.';
