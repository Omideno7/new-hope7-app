-- New Hope 7 v5.4.2 — unified school progression with safe legacy anchors
-- Preserves real pre-v3.5 progress without manufacturing exams or mutating historical rows.
-- From the first class after the legacy anchor, all students use the same gated workflow.

create table if not exists public.school_legacy_progress_v542 (
  user_email text primary key,
  completed_through_class integer not null default 0 check (completed_through_class between 0 and 7),
  is_legacy_graduate boolean not null default false,
  source_cutoff timestamptz not null,
  source_note text not null default 'pre-v3.5 contiguous completed classes',
  created_at timestamptz not null default now()
);

alter table public.school_legacy_progress_v542 enable row level security;

drop policy if exists "school legacy anchors admin read" on public.school_legacy_progress_v542;
create policy "school legacy anchors admin read"
on public.school_legacy_progress_v542 for select to authenticated
using (coalesce((select public.nh7_is_admin()),false));

revoke all on public.school_legacy_progress_v542 from public,anon,authenticated;
grant select on public.school_legacy_progress_v542 to authenticated;

-- Exact Production transition point: first v3.5 class exams were created at this timestamp.
with pre as (
  select lower(trim(user_email)) email,
    bool_or(lesson_code='class_01_new_creation' and (completed_at is not null or coalesce(progress_percent,0)>=100)) as c1,
    bool_or(lesson_code='class_02_holy_spirit' and (completed_at is not null or coalesce(progress_percent,0)>=100)) as c2,
    bool_or(lesson_code='class_03_christian_doctrine' and (completed_at is not null or coalesce(progress_percent,0)>=100)) as c3,
    bool_or(lesson_code='class_04a_evangelism' and (completed_at is not null or coalesce(progress_percent,0)>=100)) as c4a,
    bool_or(lesson_code='class_04b_cell_ministry' and (completed_at is not null or coalesce(progress_percent,0)>=100)) as c4b,
    bool_or(lesson_code='class_05_character_prosperity' and (completed_at is not null or coalesce(progress_percent,0)>=100)) as c5,
    bool_or(lesson_code='class_06_local_assembly' and (completed_at is not null or coalesce(progress_percent,0)>=100)) as c6,
    bool_or(lesson_code='class_07_mobile_technology' and (completed_at is not null or coalesce(progress_percent,0)>=100)) as c7
  from public.school_progress
  where coalesce(trim(user_email),'')<>''
    and coalesce(completed_at,updated_at) < timestamptz '2026-09-17 22:54:58.329357+00'
  group by lower(trim(user_email))
),
floors as (
  select email,
    case
      when c1 and c2 and c3 and c4a and c4b and c5 and c6 and c7 then 7
      when c1 and c2 and c3 and c4a and c4b and c5 and c6 then 6
      when c1 and c2 and c3 and c4a and c4b and c5 then 5
      when c1 and c2 and c3 and c4a and c4b then 4
      when c1 and c2 and c3 then 3
      when c1 and c2 then 2
      when c1 then 1
      else 0
    end legacy_floor
  from pre
),
legacy_grads as (
  select distinct lower(trim(user_email)) email
  from public.school_progress
  where lesson_code='course:foundation_school' and coalesce(exam_passed,false)=true
  union
  select distinct lower(trim(a.user_email))
  from public.school_exam_attempts a
  join public.school_exams e on e.id=a.exam_id
  where a.passed=true and e.exam_scope='course' and e.course_code='foundation_school'
),
source as (
  select email,7 as floor,true as grad from legacy_grads
  union all
  select f.email,f.legacy_floor,false
  from floors f
  where f.legacy_floor>0
    and not exists(select 1 from legacy_grads g where g.email=f.email)
)
insert into public.school_legacy_progress_v542(
  user_email,completed_through_class,is_legacy_graduate,source_cutoff,source_note
)
select email,floor,grad,timestamptz '2026-09-17 22:54:58.329357+00',
       case when grad then 'pre-v3.5 completed/final-passed graduate'
            else 'pre-v3.5 contiguous completed classes' end
from source
on conflict(user_email) do update set
  completed_through_class=excluded.completed_through_class,
  is_legacy_graduate=excluded.is_legacy_graduate,
  source_cutoff=excluded.source_cutoff,
  source_note=excluded.source_note;

create or replace function public.nh7_school_class_exam_session_v350(p_class_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_key text := lower(trim(coalesce(p_class_key,'')));
  v_class_no integer := 0;
  v_lessons text[];
  v_prev text := null;
  v_prev_passed boolean := true;
  v_incomplete integer := 0;
  v_assignment_total integer := 0;
  v_assignment_approved integer := 0;
  v_last_failed timestamptz := null;
  v_passed boolean := false;
  v_base jsonb := '{}'::jsonb;
  v_ready boolean := false;
  v_repeat boolean := false;
  v_anchor integer := 0;
  v_legacy_graduate boolean := false;
begin
  if auth.uid() is null or v_email='' then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(auth.uid(),v_email,'') then
    raise exception 'school_approval_required';
  end if;

  case v_key
    when 'class_01' then v_class_no:=1; v_lessons:=array['class_01_new_creation']; v_prev:=null;
    when 'class_02' then v_class_no:=2; v_lessons:=array['class_02_holy_spirit']; v_prev:='class_01';
    when 'class_03' then v_class_no:=3; v_lessons:=array['class_03_christian_doctrine']; v_prev:='class_02';
    when 'class_04' then v_class_no:=4; v_lessons:=array['class_04a_evangelism','class_04b_cell_ministry']; v_prev:='class_03';
    when 'class_05' then v_class_no:=5; v_lessons:=array['class_05_character_prosperity']; v_prev:='class_04';
    when 'class_06' then v_class_no:=6; v_lessons:=array['class_06_local_assembly']; v_prev:='class_05';
    when 'class_07' then v_class_no:=7; v_lessons:=array['class_07_mobile_technology']; v_prev:='class_06';
    else raise exception 'invalid_class_key';
  end case;

  select coalesce(completed_through_class,0),coalesce(is_legacy_graduate,false)
  into v_anchor,v_legacy_graduate
  from public.school_legacy_progress_v542
  where user_email=v_email;
  v_anchor:=coalesce(v_anchor,0);
  v_legacy_graduate:=coalesce(v_legacy_graduate,false);

  select count(*)::integer
  into v_assignment_total
  from public.school_lessons l
  where l.is_active=true
    and l.lesson_code=any(v_lessons)
    and length(trim(coalesce(
      nullif(l.content_data#>>'{translations,en,assignment_question}',''),
      nullif(l.content_data#>>'{translations,fa,assignment_question}',''),
      nullif(l.content_data#>>'{translations,hr,assignment_question}',''),
      ''
    )))>0;

  -- Completed old stages stay valid. No historical exam/assignment records are fabricated.
  if v_legacy_graduate or v_class_no<=v_anchor then
    return jsonb_build_object(
      'ok',true,'exam',null,'attempts_used',0,'attempt_number',1,
      'passed_already',true,'remaining_attempts',0,
      'class_key',v_key,'class_unlocked',true,
      'lessons_total',coalesce(array_length(v_lessons,1),0),
      'lessons_completed',coalesce(array_length(v_lessons,1),0),
      'lessons_complete',true,
      'assignments_total',v_assignment_total,
      'assignments_approved_count',v_assignment_total,
      'assignments_approved',true,
      'repeat_required',false,'ready',false,'week_days',7,
      'last_failed_at',null,
      'legacy_course_passed',v_legacy_graduate,
      'legacy_class_completed',not v_legacy_graduate and v_class_no<=v_anchor,
      'legacy_completed_through_class',v_anchor
    );
  end if;

  if v_prev is not null then
    if v_class_no-1<=v_anchor then
      v_prev_passed:=true;
    else
      select exists(
        select 1
        from public.school_exam_attempts a
        join public.school_exams e on e.id=a.exam_id
        where lower(a.user_email)=v_email
          and a.passed=true
          and e.is_active=true
          and e.exam_scope='class'
          and e.course_code='foundation_school'
          and e.lesson_code='class_exam:'||v_prev
      ) into v_prev_passed;
    end if;
  end if;

  select exists(
    select 1
    from public.school_exam_attempts a
    join public.school_exams e on e.id=a.exam_id
    where lower(a.user_email)=v_email
      and a.passed=true
      and e.is_active=true
      and e.exam_scope='class'
      and e.course_code='foundation_school'
      and e.lesson_code='class_exam:'||v_key
  ) into v_passed;

  if not v_passed then
    select max(a.submitted_at)
    into v_last_failed
    from public.school_exam_attempts a
    join public.school_exams e on e.id=a.exam_id
    where lower(a.user_email)=v_email
      and a.passed=false
      and e.is_active=true
      and e.exam_scope='class'
      and e.course_code='foundation_school'
      and e.lesson_code='class_exam:'||v_key;
  end if;

  select count(*)::integer
  into v_incomplete
  from unnest(v_lessons) as x(code)
  where not exists(
    select 1
    from public.school_progress p
    where lower(p.user_email)=v_email
      and p.lesson_code=x.code
      and (p.completed_at is not null or coalesce(p.progress_percent,0)>=100)
      and (v_last_failed is null or p.updated_at>v_last_failed)
  );

  select count(distinct a.lesson_code)::integer
  into v_assignment_approved
  from public.school_assignments a
  where lower(a.user_email)=v_email
    and a.lesson_code=any(v_lessons)
    and lower(coalesce(a.status,''))='approved';

  select public.nh7_school_exam_session_v340(null,'class_exam:'||v_key) into v_base;
  v_base:=coalesce(v_base,'{}'::jsonb);

  v_repeat := v_last_failed is not null and not v_passed and v_incomplete>0;
  v_ready := v_prev_passed
             and not v_passed
             and v_incomplete=0
             and v_assignment_approved>=v_assignment_total
             and coalesce((v_base->>'remaining_attempts')::integer,0)>0
             and jsonb_typeof(v_base->'exam')='object';

  if not v_ready and jsonb_typeof(v_base->'exam')='object' then
    v_base:=jsonb_set(v_base,'{exam,questions}','[]'::jsonb,true);
  end if;

  return v_base || jsonb_build_object(
    'class_key',v_key,'class_unlocked',v_prev_passed,
    'lessons_total',coalesce(array_length(v_lessons,1),0),
    'lessons_completed',coalesce(array_length(v_lessons,1),0)-v_incomplete,
    'lessons_complete',v_incomplete=0,
    'assignments_total',v_assignment_total,
    'assignments_approved_count',v_assignment_approved,
    'assignments_approved',v_assignment_approved>=v_assignment_total,
    'repeat_required',v_repeat,'ready',v_ready,'week_days',7,
    'last_failed_at',v_last_failed,'passed_already',v_passed,
    'legacy_course_passed',false,'legacy_class_completed',false,
    'legacy_completed_through_class',v_anchor
  );
end;
$$;

create or replace function public.nh7_school_final_exam_session_v350(
  p_course_code text default 'foundation_school'
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  v_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  v_course text := coalesce(nullif(trim(p_course_code),''),'foundation_school');
  v_anchor integer := 0;
  v_legacy_graduate boolean := false;
  v_passed_classes integer := 0;
  v_exam public.school_exams;
  v_attempts integer := 0;
  v_attempt_no integer := 1;
  v_total integer := 0;
  v_take integer := 0;
  v_questions jsonb := '[]'::jsonb;
  v_passed boolean := false;
  v_remaining integer := 0;
  v_ready boolean := false;
  v_base jsonb := '{}'::jsonb;
begin
  if auth.uid() is null or v_email='' then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(auth.uid(),v_email,'') then
    raise exception 'school_approval_required';
  end if;

  select coalesce(completed_through_class,0),coalesce(is_legacy_graduate,false)
  into v_anchor,v_legacy_graduate
  from public.school_legacy_progress_v542
  where user_email=v_email;
  v_anchor:=coalesce(v_anchor,0);
  v_legacy_graduate:=coalesce(v_legacy_graduate,false);

  if v_legacy_graduate then
    return jsonb_build_object(
      'ok',true,'exam',null,'attempts_used',0,'attempt_number',1,
      'passed_already',true,'remaining_attempts',0,'ready',false,
      'passed_classes',7,'required_classes',7,
      'legacy_course_passed',true,'legacy_completed_through_class',7
    );
  end if;

  with classes(class_no,class_key) as (
    values (1,'class_01'),(2,'class_02'),(3,'class_03'),(4,'class_04'),
           (5,'class_05'),(6,'class_06'),(7,'class_07')
  )
  select count(*)::integer
  into v_passed_classes
  from classes c
  where c.class_no<=v_anchor
     or exists(
       select 1
       from public.school_exam_attempts a
       join public.school_exams e on e.id=a.exam_id
       where lower(a.user_email)=v_email
         and a.passed=true
         and e.is_active=true
         and e.exam_scope='class'
         and e.course_code=v_course
         and e.lesson_code='class_exam:'||c.class_key
     );

  if v_passed_classes=7 then
    select e.* into v_exam
    from public.school_exams e
    where e.is_active=true
      and e.exam_scope='course'
      and e.course_code=v_course
    order by e.require_assignments_before_exam desc,e.created_at asc
    limit 1;

    if found then
      select count(*)::integer,coalesce(bool_or(a.passed),false)
      into v_attempts,v_passed
      from public.school_exam_attempts a
      where a.exam_id=v_exam.id and lower(a.user_email)=v_email;

      v_attempt_no:=v_attempts+1;
      v_total:=jsonb_array_length(coalesce(v_exam.questions,'[]'::jsonb));
      v_take:=case when v_exam.questions_per_attempt>0
                   then least(v_exam.questions_per_attempt,v_total) else v_total end;

      with raw as (
        select q,ord::integer as qid
        from jsonb_array_elements(coalesce(v_exam.questions,'[]'::jsonb))
             with ordinality as x(q,ord)
      ), ordered as (
        select q,qid,row_number() over(
          order by case when v_exam.shuffle_questions
            then md5(v_exam.id::text||'|'||v_email||'|'||v_attempt_no::text||'|'||qid::text)
            else lpad(qid::text,12,'0') end
        ) rn
        from raw
      )
      select coalesce(
        jsonb_agg((q-'correct') || jsonb_build_object('_nh7_qid',qid) order by rn),
        '[]'::jsonb
      )
      into v_questions
      from ordered where rn<=v_take;

      v_remaining:=case when v_passed then 0 else greatest(0,v_exam.max_attempts-v_attempts) end;
      v_ready:=not v_passed and v_remaining>0;

      v_base:=jsonb_build_object(
        'ok',true,'attempts_used',v_attempts,'attempt_number',v_attempt_no,
        'passed_already',v_passed,'remaining_attempts',v_remaining,
        'exam',(to_jsonb(v_exam)-'questions') || jsonb_build_object(
          'questions',v_questions,'shuffle_questions',false,
          'questions_per_attempt',v_take,'_nh7_secure_server_scoring',true,
          '_nh7_attempt_number',v_attempt_no
        )
      );
    else
      v_base:=jsonb_build_object('ok',true,'exam',null,'passed_already',false,'remaining_attempts',0);
    end if;
  else
    v_base:=jsonb_build_object('ok',true,'exam',null,'passed_already',false,'remaining_attempts',0);
  end if;

  return v_base || jsonb_build_object(
    'ready',v_ready,'passed_classes',v_passed_classes,'required_classes',7,
    'legacy_course_passed',false,'legacy_completed_through_class',v_anchor
  );
end;
$$;

-- Clear academic status model for Admin reports.
create or replace function public.nh7_admin_student_academic_center_v542(
  p_inactive_days integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public,auth,pg_catalog
as $$
declare
  v_base jsonb;
  v_rows jsonb;
  v_summary jsonb;
begin
  if not coalesce(public.nh7_is_admin(),false) then raise exception 'Admin access required'; end if;
  v_base:=public.nh7_admin_student_academic_center_v541(p_inactive_days);

  with class_key_map(class_no,class_key) as (
    values (1,'class_01'),(2,'class_02'),(3,'class_03'),(4,'class_04'),
           (5,'class_05'),(6,'class_06'),(7,'class_07')
  ),
  per_class as (
    select lower(trim(a.user_email)) email,
           m.class_no,
           bool_or(a.passed) has_pass,
           bool_or(not a.passed) has_fail
    from public.school_exam_attempts a
    join public.school_exams e on e.id=a.exam_id
    join class_key_map m on e.lesson_code='class_exam:'||m.class_key
    where e.exam_scope='class' and e.course_code='foundation_school'
    group by lower(trim(a.user_email)),m.class_no
  ),
  class_agg as (
    select email,
      count(*) filter(where has_pass)::integer class_exams_passed,
      count(*) filter(where has_fail and not has_pass)::integer unresolved_failed_class_exams
    from per_class group by email
  ),
  final_agg as (
    select lower(trim(a.user_email)) email,
      count(*)::integer final_exam_attempts,
      bool_or(a.passed) final_exam_passed,
      max(coalesce(a.final_score_percent,a.score_percent))::integer final_exam_best_score,
      max(a.submitted_at) final_exam_last_at
    from public.school_exam_attempts a
    join public.school_exams e on e.id=a.exam_id
    where e.exam_scope='course' and e.course_code='foundation_school'
    group by lower(trim(a.user_email))
  ),
  cert as (
    select lower(trim(user_email)) email,
      bool_or(status='approved' and revoked_at is null) certificate_approved
    from public.school_certificates
    where course_code='foundation_school'
    group by lower(trim(user_email))
  ),
  enriched as (
    select
      r,
      coalesce(l.completed_through_class,0) legacy_completed_through_class,
      coalesce(l.is_legacy_graduate,false) legacy_graduate,
      coalesce(ca.class_exams_passed,0) class_exams_passed,
      coalesce(ca.unresolved_failed_class_exams,0) unresolved_failed_class_exams,
      coalesce(fa.final_exam_attempts,0) final_exam_attempts,
      coalesce(fa.final_exam_passed,false) final_exam_passed,
      fa.final_exam_best_score,
      fa.final_exam_last_at,
      coalesce(cert.certificate_approved,false) certificate_approved,
      least(
        7,
        coalesce(l.completed_through_class,0) +
        (
          select count(*) from per_class pc
          where pc.email=lower(trim(r->>'email'))
            and pc.has_pass=true
            and pc.class_no>coalesce(l.completed_through_class,0)
        )
      )::integer validated_classes
    from jsonb_array_elements(coalesce(v_base->'rows','[]'::jsonb)) r
    left join public.school_legacy_progress_v542 l
      on l.user_email=lower(trim(r->>'email'))
    left join class_agg ca on ca.email=lower(trim(r->>'email'))
    left join final_agg fa on fa.email=lower(trim(r->>'email'))
    left join cert on cert.email=lower(trim(r->>'email'))
  ),
  classified as (
    select e.*,
      (e.legacy_graduate or e.final_exam_passed) course_completed,
      (e.legacy_graduate or e.certificate_approved) graduated,
      case
        when e.legacy_graduate or e.certificate_approved
          then 'graduated'
        when e.final_exam_passed
          then 'completed'
        when coalesce((e.r->>'in_church_roster')::boolean,false)
             and not coalesce((e.r->>'app_account_exists')::boolean,false)
             and not coalesce((e.r->>'app_activity_seen')::boolean,false)
          then 'member_no_app'
        when coalesce((e.r->>'app_account_exists')::boolean,false)
             and not coalesce((e.r->>'school_registered')::boolean,false)
          then 'app_no_school'
        when coalesce((e.r->>'school_registered')::boolean,false)
             and not coalesce((e.r->>'started_school')::boolean,false)
          then 'registered_never_started'
        when coalesce((e.r->>'revision_assignments')::integer,0)>0
          then 'needs_revision'
        when e.final_exam_attempts>0 and not e.final_exam_passed
          then 'final_exam_failed'
        when e.unresolved_failed_class_exams>0
          then 'class_exam_failed'
        when coalesce((e.r->>'school_registered')::boolean,false)
             and nullif(e.r->>'days_since_activity','')::integer>=greatest(1,least(coalesce(p_inactive_days,30),365))
          then 'inactive'
        when coalesce((e.r->>'school_registered')::boolean,false)
          then 'in_progress'
        else 'known_user'
      end academic_status_code
    from enriched e
  )
  select
    coalesce(jsonb_agg(
      r || jsonb_build_object(
        'legacy_completed_through_class',legacy_completed_through_class,
        'legacy_graduate',legacy_graduate,
        'class_exams_passed',class_exams_passed,
        'unresolved_failed_class_exams',unresolved_failed_class_exams,
        'validated_classes',validated_classes,
        'final_exam_attempts',final_exam_attempts,
        'final_exam_passed',final_exam_passed,
        'final_exam_best_score',final_exam_best_score,
        'final_exam_last_at',final_exam_last_at,
        'certificate_approved',certificate_approved,
        'course_completed',course_completed,
        'graduated',graduated,
        'academic_status_code',academic_status_code
      )
      order by coalesce(r->>'display_name',r->>'email')
    ),'[]'::jsonb),
    coalesce(v_base->'summary','{}'::jsonb) || jsonb_build_object(
      'class_exam_failed_students',count(*) filter(where unresolved_failed_class_exams>0),
      'final_exam_failed_students',count(*) filter(where final_exam_attempts>0 and not final_exam_passed),
      'final_exam_passed_students',count(*) filter(where final_exam_passed),
      'course_completed_students',count(*) filter(where course_completed),
      'graduated_students',count(*) filter(where graduated),
      'legacy_graduates',count(*) filter(where legacy_graduate)
    )
  into v_rows,v_summary
  from classified;

  return jsonb_build_object(
    'summary',v_summary,'rows',v_rows,'generated_at',now(),'version','5.4.2'
  );
end;
$$;

revoke all on function public.nh7_admin_student_academic_center_v542(integer) from public,anon;
grant execute on function public.nh7_admin_student_academic_center_v542(integer) to authenticated;

create or replace function public.nh7_admin_school_legacy_summary_v542()
returns jsonb
language sql
stable
security definer
set search_path=public,pg_catalog
as $$
  select case when coalesce(public.nh7_is_admin(),false) then jsonb_build_object(
    'total_anchors',count(*),
    'legacy_graduates',count(*) filter(where is_legacy_graduate),
    'partial_legacy_students',count(*) filter(where not is_legacy_graduate),
    'by_floor',coalesce((
      select jsonb_object_agg(completed_through_class,n)
      from (
        select completed_through_class,count(*) n
        from public.school_legacy_progress_v542
        where not is_legacy_graduate
        group by completed_through_class
        order by completed_through_class
      ) x
    ),'{}'::jsonb),
    'source_cutoff',max(source_cutoff)
  ) else jsonb_build_object('error','Admin access required') end
  from public.school_legacy_progress_v542;
$$;

revoke all on function public.nh7_admin_school_legacy_summary_v542() from public,anon;
grant execute on function public.nh7_admin_school_legacy_summary_v542() to authenticated;

notify pgrst,'reload schema';
