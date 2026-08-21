-- Cover the composite fasting-log foreign key for efficient ownership checks
-- and cascading journey deletes. Safe to run after spiritual_plans_v240.
create index if not exists fasting_daily_logs_journey_owner_idx
  on public.fasting_daily_logs (journey_id, user_id);
