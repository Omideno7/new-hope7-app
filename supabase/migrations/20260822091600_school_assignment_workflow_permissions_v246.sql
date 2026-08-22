-- New Hope 7 v2.4.6 — school workflow permission hardening and legacy score normalization.
-- RC ONLY until explicitly released.

begin;

-- Old unreviewed submissions inherited the historical default score of 100.
-- Normalize only still-pending, never-reviewed work; approved/reviewed grades are preserved.
update public.school_assignments
set score_percent=0,
    updated_at=now()
where lower(coalesce(status,''))='submitted'
  and reviewed_at is null
  and coalesce(score_percent,0)<>0;

revoke all on function public.nh7_submit_school_assignment(text,text,text,text,text) from public, anon;
revoke all on function public.nh7_admin_review_school_assignment(uuid,text,integer,text) from public, anon;
revoke all on function public.nh7_admin_delete_school_assignment(uuid) from public, anon;
revoke all on function public.nh7_assignment_score_for_user(text,text) from public, anon;

grant execute on function public.nh7_submit_school_assignment(text,text,text,text,text) to authenticated;
grant execute on function public.nh7_admin_review_school_assignment(uuid,text,integer,text) to authenticated;
grant execute on function public.nh7_admin_delete_school_assignment(uuid) to authenticated;
grant execute on function public.nh7_assignment_score_for_user(text,text) to authenticated;

commit;
