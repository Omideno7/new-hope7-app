-- New Hope 7 v5.4.3 — lightweight academic status supplement.
-- Used beside the proven v541 dashboard RPC to avoid nested v542 timeout.

create or replace function public.nh7_admin_student_exam_status_v543()
returns jsonb
language plpgsql
stable
security definer
set search_path=public,pg_catalog
as $$
declare
  v_rows jsonb;
begin
  if not coalesce(public.nh7_is_admin(),false) then
    raise exception 'Admin access required';
  end if;

  with
  class_key_map(class_no,class_key) as (
    values (1,'class_01'),(2,'class_02'),(3,'class_03'),(4,'class_04'),
           (5,'class_05'),(6,'class_06'),(7,'class_07')
  ),
  per_class as (
    select lower(a.user_email) email,m.class_no,
           bool_or(a.passed) has_pass,
           bool_or(not a.passed) has_fail
    from public.school_exam_attempts a
    join public.school_exams e on e.id=a.exam_id
    join class_key_map m on e.lesson_code='class_exam:'||m.class_key
    where e.exam_scope='class'
      and e.course_code='foundation_school'
      and a.user_email is not null and a.user_email<>''
    group by lower(a.user_email),m.class_no
  ),
  class_agg as (
    select email,
      count(*) filter(where has_pass)::integer class_exams_passed,
      count(*) filter(where has_fail and not has_pass)::integer unresolved_failed_class_exams
    from per_class group by email
  ),
  final_agg as (
    select lower(a.user_email) email,
      count(*)::integer final_exam_attempts,
      bool_or(a.passed) final_exam_passed,
      max(coalesce(a.final_score_percent,a.score_percent))::integer final_exam_best_score,
      max(a.submitted_at) final_exam_last_at
    from public.school_exam_attempts a
    join public.school_exams e on e.id=a.exam_id
    where e.exam_scope='course'
      and e.course_code='foundation_school'
      and a.user_email is not null and a.user_email<>''
    group by lower(a.user_email)
  ),
  cert as (
    select lower(user_email) email,
      bool_or(status='approved' and revoked_at is null) certificate_approved
    from public.school_certificates
    where course_code='foundation_school'
      and user_email is not null and user_email<>''
    group by lower(user_email)
  ),
  identities as (
    select user_email email from public.school_legacy_progress_v542
    union select email from class_agg
    union select email from final_agg
    union select email from cert
  ),
  enriched as (
    select i.email,
      coalesce(l.completed_through_class,0) legacy_completed_through_class,
      coalesce(l.is_legacy_graduate,false) legacy_graduate,
      coalesce(ca.class_exams_passed,0) class_exams_passed,
      coalesce(ca.unresolved_failed_class_exams,0) unresolved_failed_class_exams,
      coalesce(fa.final_exam_attempts,0) final_exam_attempts,
      coalesce(fa.final_exam_passed,false) final_exam_passed,
      fa.final_exam_best_score,
      fa.final_exam_last_at,
      coalesce(c.certificate_approved,false) certificate_approved
    from identities i
    left join public.school_legacy_progress_v542 l on l.user_email=i.email
    left join class_agg ca using(email)
    left join final_agg fa using(email)
    left join cert c using(email)
  ),
  validated as (
    select e.*,
      (
        select count(*)::integer
        from class_key_map m
        left join per_class pc on pc.email=e.email and pc.class_no=m.class_no
        where m.class_no<=e.legacy_completed_through_class
           or coalesce(pc.has_pass,false)
      ) validated_classes
    from enriched e
  )
  select coalesce(jsonb_agg(
    to_jsonb(v) || jsonb_build_object(
      'course_completed',(v.legacy_graduate or v.final_exam_passed),
      'graduated',(v.legacy_graduate or v.certificate_approved)
    )
    order by v.email
  ),'[]'::jsonb)
  into v_rows
  from validated v;

  return jsonb_build_object('rows',v_rows,'version','5.4.3');
end;
$$;

revoke all on function public.nh7_admin_student_exam_status_v543() from public,anon;
grant execute on function public.nh7_admin_student_exam_status_v543() to authenticated;

notify pgrst,'reload schema';
