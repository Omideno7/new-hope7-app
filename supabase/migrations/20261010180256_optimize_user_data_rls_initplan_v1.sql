alter policy "NH7 account notes own"
on public.nh7_account_notes
using (
  lower(user_email) = lower(coalesce(((select auth.jwt()) ->> 'email'::text), ''::text))
  or coalesce((select public.nh7_is_admin()), false)
)
with check (
  lower(user_email) = lower(coalesce(((select auth.jwt()) ->> 'email'::text), ''::text))
  or coalesce((select public.nh7_is_admin()), false)
);

alter policy "NH7 account progress own"
on public.nh7_account_progress
using (
  lower(user_email) = lower(coalesce(((select auth.jwt()) ->> 'email'::text), ''::text))
  or coalesce((select public.nh7_is_admin()), false)
)
with check (
  lower(user_email) = lower(coalesce(((select auth.jwt()) ->> 'email'::text), ''::text))
  or coalesce((select public.nh7_is_admin()), false)
);

alter policy "NH7 account saved verses own"
on public.nh7_account_saved_verses
using (
  lower(user_email) = lower(coalesce(((select auth.jwt()) ->> 'email'::text), ''::text))
  or coalesce((select public.nh7_is_admin()), false)
)
with check (
  lower(user_email) = lower(coalesce(((select auth.jwt()) ->> 'email'::text), ''::text))
  or coalesce((select public.nh7_is_admin()), false)
);

alter policy "NH7 users read own verse marks v230"
on public.nh7_account_verse_marks_v230
using ((select auth.uid()) = user_id);

alter policy "NH7 users insert own verse marks v230"
on public.nh7_account_verse_marks_v230
with check (
  (select auth.uid()) = user_id
  and lower(user_email) = lower(coalesce(((select auth.jwt()) ->> 'email'::text), ''::text))
);

alter policy "NH7 users update own verse marks v230"
on public.nh7_account_verse_marks_v230
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and lower(user_email) = lower(coalesce(((select auth.jwt()) ->> 'email'::text), ''::text))
);

alter policy "NH7 users delete own verse marks v230"
on public.nh7_account_verse_marks_v230
using ((select auth.uid()) = user_id);

alter policy nh7_prayer_insert_own_v502
on public.nh7_prayer_requests_v502
with check (
  user_id = (select auth.uid())
  and status = 'new'::text
  and length(trim(both from request_text)) > 0
);

alter policy nh7_prayer_select_own_v502
on public.nh7_prayer_requests_v502
using (user_id = (select auth.uid()));

alter policy nh7_testimony_insert_own_v502
on public.nh7_testimonies_v502
with check (
  user_id = (select auth.uid())
  and status = 'pending'::text
);

alter policy nh7_testimony_select_own_v502
on public.nh7_testimonies_v502
using (user_id = (select auth.uid()));
