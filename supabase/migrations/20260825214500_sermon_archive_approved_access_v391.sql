-- New Hope 7 v3.9.1
-- The client intentionally protects Sermons behind approved School access.
-- The previous sermons RLS configuration allowed only administrators to read,
-- so ordinary approved users received zero cloud rows and the app silently
-- fell back to the obsolete bundled v1 archive.

drop policy if exists "approved users read published sermons v391" on public.sermons;

create policy "approved users read published sermons v391"
on public.sermons
for select
to authenticated
using (
  is_published = true
  and (
    coalesce(public.nh7_is_admin(), false)
    or public.nh7_school_access_approved_v230(
      auth.uid(),
      lower(trim(coalesce(auth.jwt()->>'email',''))),
      ''
    )
  )
);

grant select on table public.sermons to authenticated;

comment on policy "approved users read published sermons v391" on public.sermons is
'Allows signed-in administrators and fully approved School accounts to read only published sermons. The client no longer uses the obsolete bundled archive when this protected cloud archive is unavailable.';
