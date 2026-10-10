alter policy "NH7 secure pending registration insert"
on public.registrations
with check (
  device_id = (select public.nh7_device_id())
  and type = any (array['school'::text,'meeting'::text,'general'::text])
  and status = 'pending'::text
  and lower(trim(both from coalesce(payload ->> 'email'::text, ''::text))) <> ''::text
  and (
    (select auth.role()) <> 'authenticated'::text
    or lower(trim(both from (payload ->> 'email'::text))) = lower(trim(both from coalesce(((select auth.jwt()) ->> 'email'::text), ''::text)))
  )
);

alter policy "NH7 secure read own registrations"
on public.registrations
using (
  coalesce((select public.nh7_is_admin()), false)
  or device_id = (select public.nh7_device_id())
  or (
    (select auth.role()) = 'authenticated'::text
    and lower(trim(both from coalesce(payload ->> 'email'::text, ''::text))) = lower(trim(both from coalesce(((select auth.jwt()) ->> 'email'::text), ''::text)))
  )
);

alter policy "school certificates own or admin read"
on public.school_certificates
using (
  lower(user_email) = lower(coalesce(((select auth.jwt()) ->> 'email'::text), ''::text))
  or coalesce((select public.nh7_admin_is_admin_v170()), false)
);

alter policy "approved students read active school lessons v340"
on public.school_lessons
using (
  (
    is_active
    and (select public.nh7_school_access_approved_v230(
      (select auth.uid()),
      coalesce(((select auth.jwt()) ->> 'email'::text), ''::text),
      ''::text
    ))
  )
  or coalesce((select public.nh7_admin_is_admin_v170()), false)
);