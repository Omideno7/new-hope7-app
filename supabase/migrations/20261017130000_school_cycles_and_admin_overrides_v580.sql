-- School progression v580: UNAPPLIED; requires explicit Production review/approval.
-- No data UPDATE/DELETE/backfill. Existing rows are generation zero by column default.
-- Activate only after compatible Store/Web client adoption and reviewed preflight.
BEGIN;
DO $preflight$
BEGIN
 IF to_regprocedure('private.nh7_admin_is_owner_v350()') IS NULL OR to_regprocedure('public.nh7_school_access_approved_v230(uuid,text,text)') IS NULL THEN RAISE EXCEPTION 'School authorization prerequisite missing';END IF;
 IF to_regclass('private.nh7_school_cycles_v580') IS NOT NULL THEN RAISE EXCEPTION 'School cycle capability already exists; inspect instead of rerunning';END IF;
END $preflight$;
-- Review-only additive model. Included by the generated unapplied migration.
create table private.nh7_school_cycles_v580 (
 user_id uuid not null references auth.users(id) on delete cascade,
 course_code text not null,
 cycle integer not null check(cycle>=0),
 created_at timestamptz not null default now(),
 ended_at timestamptz,
 legacy_failed_baseline integer not null default 0 check(legacy_failed_baseline>=0),
 reset_failed_baseline integer not null default 0 check(reset_failed_baseline>=0),
 extra_attempts integer not null default 0 check(extra_attempts>=0),
 admin_pass boolean not null default false,
 repair_stage integer not null default 0 check(repair_stage between 0 and 7),
 primary key(user_id,course_code,cycle)
);
create unique index nh7_school_one_active_cycle_v580 on private.nh7_school_cycles_v580(user_id,course_code) where ended_at is null;
create table private.nh7_school_receipts_v580 (
 user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 course_code text not null,
 cycle integer not null,
 action text not null,
 input jsonb not null,
 receipt jsonb not null,
 transaction_id bigint not null default txid_current(),
 failed_final boolean not null default false,
 attempt_id uuid,
 created_at timestamptz not null default now(),
 primary key(user_id,request_id),
 foreign key(user_id,course_code,cycle) references private.nh7_school_cycles_v580(user_id,course_code,cycle)
);
create index nh7_school_receipts_cycle_v580 on private.nh7_school_receipts_v580(user_id,course_code,cycle) where failed_final;
create table private.nh7_school_admin_audit_v580 (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null,
 target_user_id uuid not null references auth.users(id) on delete cascade,
 actor_user_id uuid not null references auth.users(id),
 course_code text not null,
 cycle integer not null,
 action text not null,
 reason text not null check(length(trim(reason)) between 3 and 2000),
 before_state jsonb not null,
 after_state jsonb not null,
 input jsonb not null,
 created_at timestamptz not null default now(),
 unique(actor_user_id,request_id)
);
alter table private.nh7_school_cycles_v580 enable row level security;
alter table private.nh7_school_receipts_v580 enable row level security;
alter table private.nh7_school_admin_audit_v580 enable row level security;
revoke all on table private.nh7_school_cycles_v580,private.nh7_school_receipts_v580,private.nh7_school_admin_audit_v580 from public,anon,authenticated;
-- Existing rows retain their original IDs/values and logically belong to generation zero.
alter table public.school_progress add column school_cycle integer not null default 0;
alter table public.school_assignments add column school_cycle integer not null default 0;
alter table public.school_exam_attempts add column school_cycle integer not null default 0;

create function private.nh7_school_cycle_v580(p_uid uuid,p_course text)
returns integer language sql stable security definer set search_path='' as $$
 select coalesce((select c.cycle from private.nh7_school_cycles_v580 c where c.user_id=p_uid and c.course_code=coalesce(nullif(trim(p_course),''),'foundation_school') and c.ended_at is null),0)
$$;
revoke all on function private.nh7_school_cycle_v580(uuid,text) from public,anon,authenticated;

-- Preserve existing UID-first/unbound-email fallback without allowing unbound old-cycle
-- evidence to satisfy a restarted UID. Ambiguous aliases are quarantined, never assigned.
create function private.nh7_school_activity_owner_v580(p_uid uuid,p_email text)
returns uuid language sql stable security definer set search_path='' as $$
 select coalesce(p_uid,(select case when count(distinct u.id)=1 then (array_agg(distinct u.id))[1] else null end from auth.users u left join public.school_student_identities i on i.user_id=u.id and i.status='active' left join public.registrations r on r.id=i.source_registration_id where lower(trim(p_email))<>'' and (lower(trim(u.email))=lower(trim(p_email)) or lower(trim(r.payload->>'email'))=lower(trim(p_email)))))
$$;
revoke all on function private.nh7_school_activity_owner_v580(uuid,text) from public,anon,authenticated;
-- Internal views are not API endpoints; caller-bound session RPCs retain their UID checks.
create view private.nh7_school_progress_active_v580 as select p.* from public.school_progress p where private.nh7_school_activity_owner_v580(p.user_id,p.user_email) is not null and p.school_cycle=private.nh7_school_cycle_v580(private.nh7_school_activity_owner_v580(p.user_id,p.user_email),case when p.lesson_code like 'course:%' then substr(p.lesson_code,8) else coalesce((select l.course_code from public.school_lessons l where l.lesson_code=p.lesson_code limit 1),'foundation_school') end);
create view private.nh7_school_assignments_active_v580 as select a.* from public.school_assignments a where private.nh7_school_activity_owner_v580(a.user_id,a.user_email) is not null and a.school_cycle=private.nh7_school_cycle_v580(private.nh7_school_activity_owner_v580(a.user_id,a.user_email),a.course_code);
create view private.nh7_school_attempts_active_v580 as select a.* from public.school_exam_attempts a where private.nh7_school_activity_owner_v580(a.user_id,a.user_email) is not null and a.school_cycle=private.nh7_school_cycle_v580(private.nh7_school_activity_owner_v580(a.user_id,a.user_email),a.course_code);
revoke all on table private.nh7_school_progress_active_v580,private.nh7_school_assignments_active_v580,private.nh7_school_attempts_active_v580 from public,anon,authenticated;

-- A read must not create a new enrollment or consume an attempt.
create function private.nh7_school_budget_v580(p_uid uuid,p_course text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare c private.nh7_school_cycles_v580; n integer; legacy integer;
begin
 select * into c from private.nh7_school_cycles_v580 where user_id=p_uid and course_code=p_course and ended_at is null;
 if not found then
  select count(*) into legacy from public.school_exam_attempts a join public.school_exams e on e.id=a.exam_id where private.nh7_school_activity_owner_v580(a.user_id,a.user_email)=p_uid and e.course_code=p_course and e.exam_scope='course' and e.lesson_code='course:'||p_course and not a.passed;
  c.cycle:=0; c.legacy_failed_baseline:=legacy; c.reset_failed_baseline:=0; c.extra_attempts:=0;c.admin_pass:=false;c.repair_stage:=0;
 end if;
 select count(*) into n from private.nh7_school_receipts_v580 r where r.user_id=p_uid and r.course_code=p_course and r.cycle=c.cycle and r.failed_final;
 n:=coalesce(c.legacy_failed_baseline,0)+n;
 return jsonb_build_object('contract',580,'cycle',c.cycle,'failed_total',n,'failed_since_reset',greatest(0,n-c.reset_failed_baseline),'extra_attempts',c.extra_attempts,'remaining_attempts',case when c.admin_pass then 0 else greatest(0,3+c.extra_attempts-greatest(0,n-c.reset_failed_baseline)) end,'admin_override',c.admin_pass,'repair_stage',c.repair_stage);
end $$;
revoke all on function private.nh7_school_budget_v580(uuid,text) from public,anon,authenticated;

create function private.nh7_school_ensure_cycle_v580(p_uid uuid,p_course text)
returns void language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 -- Every cycle/submit/override mutation uses this same lock, before other row locks.
 perform pg_advisory_xact_lock(hashtextextended('nh7-cycle|'||p_uid::text||'|'||p_course,0));
 if not exists(select 1 from private.nh7_school_cycles_v580 where user_id=p_uid and course_code=p_course and ended_at is null) then
  select count(*) into n from public.school_exam_attempts a join public.school_exams e on e.id=a.exam_id where private.nh7_school_activity_owner_v580(a.user_id,a.user_email)=p_uid and e.course_code=p_course and e.exam_scope='course' and e.lesson_code='course:'||p_course and not a.passed;
  insert into private.nh7_school_cycles_v580(user_id,course_code,cycle,legacy_failed_baseline) values(p_uid,p_course,0,n);
 end if;
end $$;
revoke all on function private.nh7_school_ensure_cycle_v580(uuid,text) from public,anon,authenticated;

-- Replace only activity uniqueness, retaining every row and its primary ID.
do $$
declare r record; cols text;
begin
 for r in select c.oid,c.conname,c.conrelid::regclass as rel,array_agg(a.attname::text order by k.ord) as names
   from pg_constraint c cross join lateral unnest(c.conkey) with ordinality k(n,ord) join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.n
   where c.contype='u' and c.conrelid in('public.school_progress'::regclass,'public.school_assignments'::regclass) group by c.oid,c.conname,c.conrelid
 loop
  if r.names in(array['user_email','lesson_code'],array['user_id','lesson_code']) then
   select string_agg(quote_ident(x),',') into cols from unnest(r.names) x;
   execute format('alter table %s drop constraint %I',r.rel,r.conname);
   execute format('alter table %s add constraint %I unique(%s,school_cycle)',r.rel,r.conname,cols);
  end if;
 end loop;
end $$;
create index school_attempt_cycle_number_v580 on public.school_exam_attempts(user_id,exam_id,school_cycle,attempt_number) where user_id is not null;
create index school_progress_cycle_v580 on public.school_progress(user_id,school_cycle,lesson_code);
create index school_assignments_cycle_v580 on public.school_assignments(user_id,school_cycle,lesson_code);

create function private.nh7_school_activity_cycle_guard_v580()
returns trigger language plpgsql security definer set search_path='' as $$
declare course text; current_cycle integer;
begin

 course:=case when TG_TABLE_NAME='school_progress' then case when new.lesson_code like 'course:%' then substr(new.lesson_code,8) else coalesce((select l.course_code from public.school_lessons l where l.lesson_code=new.lesson_code limit 1),'foundation_school') end else coalesce(nullif(to_jsonb(new)->>'course_code',''),'foundation_school') end;
 if TG_TABLE_NAME='school_exam_attempts' then
  if TG_OP='UPDATE' then raise exception 'finalized_attempt_immutable';end if;
  if not exists(select 1 from private.nh7_school_receipts_v580 r where r.user_id=new.user_id and r.user_id=auth.uid() and r.course_code=course and r.cycle=new.school_cycle and r.action='exam_pending' and r.transaction_id=txid_current() and r.input->>'exam'=new.exam_id::text and r.attempt_id is null) then raise exception 'idempotent_school_submission_required';end if;
 elsif TG_TABLE_NAME='school_progress' and new.lesson_code like 'course:%' and coalesce((to_jsonb(new)->>'exam_passed')::boolean,false) then
  if not exists(select 1 from public.school_exam_attempts a where a.user_id=new.user_id and a.school_cycle=new.school_cycle and a.exam_id=new.exam_id and a.passed) then raise exception 'authoritative_exam_pass_required';end if;
 end if;
 current_cycle:=private.nh7_school_cycle_v580(new.user_id,course);
 if new.school_cycle<>current_cycle then raise exception 'school_cycle_changed';end if;
 if TG_OP='UPDATE' and (old.school_cycle<>new.school_cycle or (old.user_id is not null and old.user_id is distinct from new.user_id)) then raise exception 'school_history_identity_immutable';end if;
 return new;
end $$;
revoke all on function private.nh7_school_activity_cycle_guard_v580() from public,anon,authenticated;
create trigger zz_school_cycle_guard_v580 before insert or update on public.school_progress for each row execute function private.nh7_school_activity_cycle_guard_v580();
create trigger zz_school_cycle_guard_v580 before insert or update on public.school_assignments for each row execute function private.nh7_school_activity_cycle_guard_v580();
create trigger zz_school_cycle_guard_v580 before insert or update on public.school_exam_attempts for each row execute function private.nh7_school_activity_cycle_guard_v580();


-- Generated by scripts/build-school-cycle-source-v580.py; never execute against Production without separate approval.

create or replace function public.nh7_school_exam_session_v340(
  p_course_code text default null,
  p_lesson_code text default null
)
returns jsonb
language plpgsql
stable security definer
set search_path=''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(trim(coalesce((select auth.jwt())->>'email','')));
  v_seed_email text := '';
  v_course text := trim(coalesce(p_course_code,''));
  v_lesson text := trim(coalesce(p_lesson_code,''));
  v_exam public.school_exams;
  v_attempts integer := 0;
  v_attempt_no integer := 1;
  v_total integer := 0;
  v_take integer := 0;
  v_questions jsonb := '[]'::jsonb;
  v_passed boolean := false;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(v_uid,'','') then
    raise exception 'school_approval_required';
  end if;

  select lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))
    into v_seed_email
  from public.school_student_identities i
  left join public.registrations r on r.id=i.source_registration_id
  where i.user_id=v_uid and i.status='active'
  limit 1;
  v_seed_email:=coalesce(nullif(v_seed_email,''),nullif(v_email,''),v_uid::text);

  if v_course<>'' then
    select * into v_exam
    from public.school_exams e
    where e.is_active and e.exam_scope='course' and e.course_code=v_course
    order by e.sort_order,e.created_at
    limit 1;
  elsif v_lesson<>'' then
    select * into v_exam
    from public.school_exams e
    where e.is_active and e.exam_scope<>'course' and e.lesson_code=v_lesson
    order by e.sort_order,e.created_at
    limit 1;
  else
    raise exception 'exam_scope_required';
  end if;

  if not found then return jsonb_build_object('ok',true,'exam',null); end if;

  select count(*)::integer,coalesce(bool_or(a.passed),false)
    into v_attempts,v_passed
  from private.nh7_school_attempts_active_v580 a
  where a.exam_id=v_exam.id
    and (
      a.user_id=v_uid
      or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)
    );

  v_attempt_no:=v_attempts+1;
  v_total:=jsonb_array_length(coalesce(v_exam.questions,'[]'::jsonb));
  v_take:=case when v_exam.questions_per_attempt>0 then least(v_exam.questions_per_attempt,v_total) else v_total end;

  with raw as (
    select q,ord::integer as qid
    from jsonb_array_elements(coalesce(v_exam.questions,'[]'::jsonb)) with ordinality as x(q,ord)
  ), ordered as (
    select q,qid,row_number() over(
      order by case when v_exam.shuffle_questions
        then md5(v_exam.id::text||'|'||v_seed_email||'|'||v_attempt_no::text||'|'||qid::text)
        else lpad(qid::text,12,'0') end
    ) as rn
    from raw
  )
  select coalesce(jsonb_agg((q-'correct') || jsonb_build_object('_nh7_qid',qid) order by rn),'[]'::jsonb)
    into v_questions
  from ordered
  where rn<=v_take;

  return jsonb_build_object(
    'ok',true,
    'attempts_used',v_attempts,
    'attempt_number',v_attempt_no,
    'passed_already',v_passed,
    'budget',private.nh7_school_budget_v580(v_uid,coalesce(v_exam.course_code,'foundation_school')),'school_cycle',private.nh7_school_cycle_v580(v_uid,coalesce(v_exam.course_code,'foundation_school')),'unlimited_attempts',not (v_exam.exam_scope='course' and v_exam.course_code='foundation_school' and v_exam.lesson_code='course:foundation_school'),
    'remaining_attempts',case when not (v_exam.exam_scope='course' and v_exam.course_code='foundation_school' and v_exam.lesson_code='course:foundation_school') then null else (private.nh7_school_budget_v580(v_uid,coalesce(v_exam.course_code,'foundation_school'))->>'remaining_attempts')::integer end,
    'exam',(to_jsonb(v_exam)-'questions') || jsonb_build_object(
      'questions',v_questions,
      'shuffle_questions',false,
      'questions_per_attempt',v_take,
      '_nh7_secure_server_scoring',true,
      '_nh7_attempt_number',v_attempt_no
    )
  );
end;
$function$;

create or replace function public.nh7_school_class_exam_session_v351(p_class_key text)
returns jsonb
language plpgsql
stable security definer
set search_path=''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(trim(coalesce((select auth.jwt())->>'email','')));
  v_legacy_email text := '';
  v_key text := lower(trim(coalesce(p_class_key,'')));
  v_cutoff timestamptz := '2026-09-17 22:54:58.329357+00'::timestamptz;
  v_class_no integer := 0;
  v_lessons text[];
  v_prev text := null;
  v_prev_passed boolean := true;
  v_incomplete integer := 0;
  v_assignment_total integer := 0;
  v_assignment_approved integer := 0;
  v_last_failed timestamptz := null;
  v_passed boolean := false;
  v_course_passed boolean := false;
  v_base jsonb := '{}'::jsonb;
  v_ready boolean := false;
  v_repeat boolean := false;
  v_anchor integer := 0;
  v_legacy_graduate boolean := false;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(v_uid,'','') then raise exception 'school_approval_required'; end if;

  select lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))
    into v_legacy_email
  from public.school_student_identities i
  left join public.registrations r on r.id=i.source_registration_id
  where i.user_id=v_uid and i.status='active'
  limit 1;
  v_legacy_email:=coalesce(nullif(v_legacy_email,''),v_email);

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
  from public.school_legacy_progress_v542 where lower(trim(user_email))=v_legacy_email;
  v_anchor:=coalesce(v_anchor,0);if private.nh7_school_cycle_v580(v_uid,'foundation_school')>0 then v_anchor:=0;v_legacy_graduate:=false;end if;
  v_legacy_graduate:=coalesce(v_legacy_graduate,false);

  select exists(
    select 1 from private.nh7_school_attempts_active_v580 a join public.school_exams e on e.id=a.exam_id
    where (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)) and a.passed=true and e.exam_scope='course' and e.course_code='foundation_school'
  ) or exists(
    select 1 from private.nh7_school_progress_active_v580 p join public.school_exams e on e.id=p.exam_id
    where (p.user_id=v_uid or (p.user_id is null and v_email<>'' and lower(trim(p.user_email))=v_email)) and p.lesson_code='course:foundation_school' and coalesce(p.exam_passed,false)=true
      and e.exam_scope='course' and e.course_code='foundation_school'
  ) into v_course_passed;

  select count(*)::integer into v_assignment_total
  from public.school_lessons l
  where l.is_active=true and l.lesson_code=any(v_lessons)
    and length(trim(coalesce(
      nullif(l.content_data#>>'{translations,en,assignment_question}',''),
      nullif(l.content_data#>>'{translations,fa,assignment_question}',''),
      nullif(l.content_data#>>'{translations,hr,assignment_question}',''),'')
    ))>0;

  if v_course_passed or v_legacy_graduate or (private.nh7_school_budget_v580(v_uid,'foundation_school')->>'admin_override')::boolean then
    return jsonb_build_object(
      'ok',true,'exam',null,'attempts_used',0,'attempt_number',1,'passed_already',true,'remaining_attempts',0,
      'class_key',v_key,'class_unlocked',true,'lessons_total',coalesce(array_length(v_lessons,1),0),
      'lessons_completed',coalesce(array_length(v_lessons,1),0),'lessons_complete',true,
      'assignments_total',v_assignment_total,'assignments_approved_count',v_assignment_total,'assignments_approved',true,
      'repeat_required',false,'ready',false,'week_days',7,'last_failed_at',null,
      'legacy_course_passed',true,'graduated',true,'legacy_class_completed',false,
      'legacy_completed_through_class',greatest(v_anchor,7),'path_version','v580-cycle'
    );
  end if;

  if v_class_no<=v_anchor then
    return jsonb_build_object(
      'ok',true,'exam',null,'attempts_used',0,'attempt_number',1,'passed_already',true,'remaining_attempts',0,
      'class_key',v_key,'class_unlocked',true,'lessons_total',coalesce(array_length(v_lessons,1),0),
      'lessons_completed',coalesce(array_length(v_lessons,1),0),'lessons_complete',true,
      'assignments_total',v_assignment_total,'assignments_approved_count',v_assignment_total,'assignments_approved',true,
      'repeat_required',false,'ready',false,'week_days',7,'last_failed_at',null,
      'legacy_course_passed',false,'graduated',false,'legacy_class_completed',true,
      'legacy_completed_through_class',v_anchor,'path_version','v580-cycle'
    );
  end if;

  if v_prev is not null then
    if v_class_no-1<=v_anchor then
      v_prev_passed:=true;
    else
      select exists(
        select 1 from private.nh7_school_attempts_active_v580 a join public.school_exams e on e.id=a.exam_id
        where (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)) and a.passed=true and a.submitted_at>=v_cutoff and e.is_active=true
          and e.exam_scope='class' and e.course_code='foundation_school' and e.lesson_code='class_exam:'||v_prev
      ) into v_prev_passed;
    end if;
  end if;

  select exists(
    select 1 from private.nh7_school_attempts_active_v580 a join public.school_exams e on e.id=a.exam_id
    where (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)) and a.passed=true and a.submitted_at>=v_cutoff and e.is_active=true
      and e.exam_scope='class' and e.course_code='foundation_school' and e.lesson_code='class_exam:'||v_key
  ) into v_passed;

  if not v_passed then
    select max(a.submitted_at) into v_last_failed
    from private.nh7_school_attempts_active_v580 a join public.school_exams e on e.id=a.exam_id
    where (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)) and a.passed=false and a.submitted_at>=v_cutoff and e.is_active=true
      and e.exam_scope='class' and e.course_code='foundation_school' and e.lesson_code='class_exam:'||v_key;
  end if;

  select count(*)::integer into v_incomplete
  from unnest(v_lessons) as x(code)
  where not (
    exists(
      select 1 from private.nh7_school_progress_active_v580 p
      where (p.user_id=v_uid or (p.user_id is null and v_email<>'' and lower(trim(p.user_email))=v_email)) and p.lesson_code=x.code
        and (p.completed_at is not null or p.progress_percent>=100)

    )
    or exists(
      select 1 from private.nh7_school_assignments_active_v580 a
      where (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)) and a.lesson_code=x.code and lower(coalesce(a.status,''))='approved'

    )
  );

  select count(distinct a.lesson_code)::integer into v_assignment_approved
  from private.nh7_school_assignments_active_v580 a
  where (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)) and a.lesson_code=any(v_lessons) and lower(coalesce(a.status,''))='approved';

  select public.nh7_school_exam_session_v340(null,'class_exam:'||v_key) into v_base;
  v_base:=coalesce(v_base,'{}'::jsonb)||jsonb_build_object('unlimited_attempts',true,'school_cycle',private.nh7_school_cycle_v580(v_uid,'foundation_school'));

  v_repeat := v_last_failed is not null and not v_passed and v_incomplete>0;
  v_prev_passed:=v_prev_passed or v_class_no<=(private.nh7_school_budget_v580(v_uid,'foundation_school')->>'repair_stage')::integer;
  v_ready := v_prev_passed and not v_passed and v_incomplete=0 and v_assignment_approved>=v_assignment_total
             and jsonb_typeof(v_base->'exam')='object';

  if not v_ready and jsonb_typeof(v_base->'exam')='object' then
    v_base:=jsonb_set(v_base,'{exam,questions}','[]'::jsonb,true);
  end if;

  return v_base || jsonb_build_object(
    'class_key',v_key,'class_unlocked',v_prev_passed,'lessons_total',coalesce(array_length(v_lessons,1),0),
    'lessons_completed',coalesce(array_length(v_lessons,1),0)-v_incomplete,'lessons_complete',v_incomplete=0,
    'assignments_total',v_assignment_total,'assignments_approved_count',v_assignment_approved,
    'assignments_approved',v_assignment_approved>=v_assignment_total,'repeat_required',v_repeat,'ready',v_ready,
    'week_days',7,'last_failed_at',v_last_failed,'passed_already',v_passed,'legacy_course_passed',false,
    'graduated',false,'legacy_class_completed',false,'legacy_completed_through_class',v_anchor,'path_version','v580-cycle'
  );
end;
$function$;

create or replace function public.nh7_school_final_exam_session_v351(p_course_code text default 'foundation_school')
returns jsonb
language plpgsql
stable security definer
set search_path=''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(trim(coalesce((select auth.jwt())->>'email','')));
  v_legacy_email text := '';
  v_course text := coalesce(nullif(trim(p_course_code),''),'foundation_school');
  v_cutoff timestamptz := '2026-09-17 22:54:58.329357+00'::timestamptz;
  v_anchor integer := 0;
  v_legacy_graduate boolean := false;
  v_course_passed boolean := false;
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
  if v_uid is null then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(v_uid,'','') then raise exception 'school_approval_required'; end if;

  select lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))
    into v_legacy_email
  from public.school_student_identities i
  left join public.registrations r on r.id=i.source_registration_id
  where i.user_id=v_uid and i.status='active'
  limit 1;
  v_legacy_email:=coalesce(nullif(v_legacy_email,''),v_email);

  select coalesce(completed_through_class,0),coalesce(is_legacy_graduate,false)
    into v_anchor,v_legacy_graduate
  from public.school_legacy_progress_v542
  where lower(trim(user_email))=v_legacy_email;
  v_anchor:=coalesce(v_anchor,0);if private.nh7_school_cycle_v580(v_uid,v_course)>0 then v_anchor:=0;v_legacy_graduate:=false;end if;
  v_legacy_graduate:=coalesce(v_legacy_graduate,false);

  select exists(
    select 1 from private.nh7_school_attempts_active_v580 a join public.school_exams e on e.id=a.exam_id
    where (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)) and a.passed=true and e.exam_scope='course' and e.course_code=v_course
  ) or exists(
    select 1 from private.nh7_school_progress_active_v580 p join public.school_exams e on e.id=p.exam_id
    where (p.user_id=v_uid or (p.user_id is null and v_email<>'' and lower(trim(p.user_email))=v_email)) and p.lesson_code='course:'||v_course and coalesce(p.exam_passed,false)=true
      and e.exam_scope='course' and e.course_code=v_course
  ) into v_course_passed;

  if v_course_passed or v_legacy_graduate or (private.nh7_school_budget_v580(v_uid,v_course)->>'admin_override')::boolean then
    return private.nh7_school_budget_v580(v_uid,v_course)||jsonb_build_object(
      'ok',true,'exam',null,'attempts_used',0,'attempt_number',1,'passed_already',true,'remaining_attempts',0,
      'ready',false,'passed_classes',7,'required_classes',7,'legacy_course_passed',true,'graduated',true,
      'legacy_completed_through_class',greatest(v_anchor,7),'path_version','v580-cycle'
    );
  end if;

  with classes(class_no,class_key) as (
    values (1,'class_01'),(2,'class_02'),(3,'class_03'),(4,'class_04'),(5,'class_05'),(6,'class_06'),(7,'class_07')
  )
  select count(*)::integer into v_passed_classes
  from classes c
  where c.class_no<=v_anchor
     or exists(
       select 1 from private.nh7_school_attempts_active_v580 a join public.school_exams e on e.id=a.exam_id
       where (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)) and a.passed=true and a.submitted_at>=v_cutoff and e.is_active=true
         and e.exam_scope='class' and e.course_code=v_course and e.lesson_code='class_exam:'||c.class_key
     );

  if v_passed_classes=7 then
    select e.* into v_exam
    from public.school_exams e
    where e.is_active=true and e.exam_scope='course' and e.course_code=v_course and e.lesson_code='course:'||v_course
    order by e.require_assignments_before_exam desc,e.created_at desc
    limit 1;

    if found then
      select count(*)::integer,coalesce(bool_or(a.passed),false)
        into v_attempts,v_passed
      from private.nh7_school_attempts_active_v580 a
      where a.exam_id=v_exam.id and (a.user_id=v_uid or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email));

      v_attempt_no:=v_attempts+1;
      v_total:=jsonb_array_length(coalesce(v_exam.questions,'[]'::jsonb));
      v_take:=case when v_exam.questions_per_attempt>0 then least(v_exam.questions_per_attempt,v_total) else v_total end;

      with raw as (
        select q,ord::integer as qid
        from jsonb_array_elements(coalesce(v_exam.questions,'[]'::jsonb)) with ordinality as x(q,ord)
      ), ordered as (
        select q,qid,row_number() over(
          order by case when v_exam.shuffle_questions
            then md5(v_exam.id::text||'|'||v_legacy_email||'|'||v_attempt_no::text||'|'||qid::text)
            else lpad(qid::text,12,'0') end
        ) as rn
        from raw
      )
      select coalesce(jsonb_agg((q-'correct') || jsonb_build_object('_nh7_qid',qid) order by rn),'[]'::jsonb)
        into v_questions
      from ordered where rn<=v_take;

      v_remaining:=case when v_passed then 0 else (private.nh7_school_budget_v580(v_uid,v_course)->>'remaining_attempts')::integer end;
      v_ready:=not v_passed and v_remaining>0;
      v_base:=jsonb_build_object(
        'ok',true,'attempts_used',v_attempts,'attempt_number',v_attempt_no,'passed_already',v_passed,
        'remaining_attempts',v_remaining,
        'exam',(to_jsonb(v_exam)-'questions') || jsonb_build_object(
          'questions',v_questions,'shuffle_questions',false,'questions_per_attempt',v_take,
          '_nh7_secure_server_scoring',true,'_nh7_attempt_number',v_attempt_no
        )
      );
    else
      v_base:=jsonb_build_object('ok',true,'exam',null,'passed_already',false,'remaining_attempts',0);
    end if;
  else
    v_base:=jsonb_build_object('ok',true,'exam',null,'passed_already',false,'remaining_attempts',0);
  end if;

  return v_base || private.nh7_school_budget_v580(v_uid,v_course) || jsonb_build_object(
    'ready',v_ready,'passed_classes',v_passed_classes,'required_classes',7,
    'legacy_course_passed',false,'graduated',false,'legacy_completed_through_class',v_anchor,
    'path_version','v580-cycle'
  );
end;
$function$;

create or replace function public.nh7_school_path_state_v351()
returns jsonb
language plpgsql
stable security definer
set search_path=''
as $function$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if not public.nh7_school_access_approved_v230(v_uid,'','') then raise exception 'school_approval_required'; end if;

  return jsonb_build_object(
    'cycle',private.nh7_school_budget_v580(v_uid,'foundation_school'),
    'classes',jsonb_build_array(
      public.nh7_school_class_exam_session_v351('class_01'),
      public.nh7_school_class_exam_session_v351('class_02'),
      public.nh7_school_class_exam_session_v351('class_03'),
      public.nh7_school_class_exam_session_v351('class_04'),
      public.nh7_school_class_exam_session_v351('class_05'),
      public.nh7_school_class_exam_session_v351('class_06'),
      public.nh7_school_class_exam_session_v351('class_07')
    ),
    'final',public.nh7_school_final_exam_session_v351('foundation_school')
  );
end;
$function$;

create or replace function public.nh7_get_my_school_snapshot_v2110()
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid:=(select auth.uid());
  v_email text:=lower(trim(coalesce((select auth.jwt())->>'email','')));
  v_progress jsonb;
  v_assignments jsonb;
begin
  if v_uid is null then
    raise exception 'Login required';
  end if;

  select coalesce(jsonb_agg(to_jsonb(p) order by p.updated_at desc),'[]'::jsonb)
  into v_progress
  from private.nh7_school_progress_active_v580 p
  where p.user_id=v_uid
     or (
       p.user_id is null
       and v_email<>''
       and lower(trim(p.user_email))=v_email
     );

  select coalesce(jsonb_agg(to_jsonb(a) order by a.updated_at desc),'[]'::jsonb)
  into v_assignments
  from private.nh7_school_assignments_active_v580 a
  where a.user_id=v_uid
     or (
       a.user_id is null
       and v_email<>''
       and lower(trim(a.user_email))=v_email
     );

  return jsonb_build_object(
    'school_cycle',private.nh7_school_budget_v580(v_uid,'foundation_school'),
    'progress',coalesce(v_progress,'[]'::jsonb),
    'assignments',coalesce(v_assignments,'[]'::jsonb)
  );
end;
$function$;

create or replace function private.nh7_assignment_score_for_identity_v128(p_user_id uuid,p_user_email text,p_course_code text)
returns table(score_percent integer,completed_count integer,total_count integer)
language sql stable security definer set search_path=''
as $function$
with expected as (
  select l.lesson_code,public.nh7_assignment_unit_key(l.lesson_code) as unit_key
  from public.school_lessons l
  where l.is_active is not false
    and coalesce(nullif(l.content_data #>> '{course,code}',''),'foundation_school')=coalesce(nullif(p_course_code,''),'foundation_school')
    and (length(trim(coalesce(l.content_data #>> '{translations,fa,assignment_question}','')))>0 or length(trim(coalesce(l.content_data #>> '{translations,en,assignment_question}','')))>0 or length(trim(coalesce(l.content_data #>> '{translations,hr,assignment_question}','')))>0)
), per_lesson as (
  select e.unit_key,e.lesson_code,
    case when lower(coalesce(a.status,''))='approved' then greatest(0,least(100,coalesce(a.score_percent,0))) else 0 end as lesson_score,
    case when lower(coalesce(a.status,''))='approved' then 1 else 0 end as lesson_complete
  from expected e
  left join private.nh7_school_assignments_active_v580 a on a.lesson_code=e.lesson_code and ((p_user_id is not null and a.user_id=p_user_id) or (a.user_id is null and coalesce(trim(p_user_email),'')<>'' and lower(trim(a.user_email))=lower(trim(p_user_email))))
), per_unit as (
  select unit_key,round(avg(lesson_score))::integer as unit_score,min(lesson_complete)::integer as unit_complete from per_lesson group by unit_key
)
select coalesce(round(avg(unit_score))::integer,100),coalesce(sum(unit_complete),0)::integer,count(*)::integer from per_unit
$function$;

create or replace function private.nh7_recalculate_exam_scores_identity_v128(p_user_id uuid,p_user_email text,p_course_code text default 'foundation_school')
returns void language plpgsql security definer set search_path=''
as $function$
declare
  v_email text:=lower(trim(coalesce(p_user_email,'')));
  v_write_email text:=v_email;
  v_course text:=coalesce(nullif(trim(p_course_code),''),'foundation_school');
  v_score integer:=100; v_completed integer:=0; v_total integer:=0;
  v_attempt public.school_exam_attempts%rowtype;
  v_objective integer; v_final integer; v_any_pass boolean;
  v_exam_weight integer; v_assignment_weight integer; v_passing_score integer;
  v_best_user_name text; v_best_exam_id uuid; v_best_final integer; v_best_objective integer; v_best_assignment integer; v_best_submitted timestamptz;
begin
  if p_user_id is null and v_email='' then return; end if;
  if p_user_id is not null then
    select lower(trim(u.email)) into v_write_email from auth.users u where u.id=p_user_id limit 1;
    v_write_email:=coalesce(nullif(v_write_email,''),v_email);
  end if;
  perform pg_advisory_xact_lock(hashtextextended('nh7-exam-recalc|'||coalesce(p_user_id::text,v_email)||'|'||v_course,0));
  select s.score_percent,s.completed_count,s.total_count into v_score,v_completed,v_total from private.nh7_assignment_score_for_identity_v128(p_user_id,v_email,v_course) s;
  v_score:=coalesce(v_score,100); v_completed:=coalesce(v_completed,0); v_total:=coalesce(v_total,0);
  -- Finalized historical attempts are immutable; only derive the active progress summary.
  select exists(select 1 from private.nh7_school_attempts_active_v580 sea join public.school_exams se on se.id=sea.exam_id where ((p_user_id is not null and sea.user_id=p_user_id) or (sea.user_id is null and v_email<>'' and lower(trim(sea.user_email))=v_email)) and se.exam_scope='course' and se.course_code=v_course and sea.passed=true) into v_any_pass;
  select sea.user_name,sea.exam_id,sea.final_score_percent,sea.objective_score_percent,sea.assignment_score_percent,sea.submitted_at
    into v_best_user_name,v_best_exam_id,v_best_final,v_best_objective,v_best_assignment,v_best_submitted
  from private.nh7_school_attempts_active_v580 sea join public.school_exams se on se.id=sea.exam_id
  where ((p_user_id is not null and sea.user_id=p_user_id) or (sea.user_id is null and v_email<>'' and lower(trim(sea.user_email))=v_email)) and se.exam_scope='course' and se.course_code=v_course
  order by sea.final_score_percent desc,sea.submitted_at desc limit 1;
  if found then
    if p_user_id is not null then
      update public.school_progress p set user_name=coalesce(v_best_user_name,''),progress_percent=case when v_any_pass then 100 else v_best_final end,completed_at=case when v_any_pass then coalesce(p.completed_at,now()) else null end,exam_id=v_best_exam_id,exam_score=v_best_final,objective_score_percent=v_best_objective,assignment_score_percent=v_best_assignment,final_score_percent=v_best_final,exam_passed=v_any_pass,exam_attempted_at=v_best_submitted,updated_at=now() where p.school_cycle=private.nh7_school_cycle_v580(p_user_id,v_course) and p.user_id=p_user_id and p.lesson_code='course:'||v_course;
    else
      update public.school_progress p set user_name=coalesce(v_best_user_name,''),progress_percent=case when v_any_pass then 100 else v_best_final end,completed_at=case when v_any_pass then coalesce(p.completed_at,now()) else null end,exam_id=v_best_exam_id,exam_score=v_best_final,objective_score_percent=v_best_objective,assignment_score_percent=v_best_assignment,final_score_percent=v_best_final,exam_passed=v_any_pass,exam_attempted_at=v_best_submitted,updated_at=now() where p.school_cycle=private.nh7_school_cycle_v580(p_user_id,v_course) and lower(trim(p.user_email))=v_email and p.lesson_code='course:'||v_course;
    end if;
    if not found then
      insert into public.school_progress(school_cycle,user_email,user_name,lesson_code,progress_percent,completed_at,exam_id,exam_score,objective_score_percent,assignment_score_percent,final_score_percent,exam_passed,exam_attempted_at,updated_at)
      values(private.nh7_school_cycle_v580(p_user_id,v_course),v_write_email,coalesce(v_best_user_name,''),'course:'||v_course,case when v_any_pass then 100 else v_best_final end,case when v_any_pass then now() else null end,v_best_exam_id,v_best_final,v_best_objective,v_best_assignment,v_best_final,v_any_pass,v_best_submitted,now());
    end if;
  else
    null;
  end if;
end;
$function$;

create or replace function private.nh7_school_grade_v580(
  p_exam_id uuid,
  p_answers jsonb, p_expected_cycle integer
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(trim(coalesce((select auth.jwt())->>'email','')));
  v_write_email text := '';
  v_seed_email text := '';
  v_name text := trim(coalesce((select auth.jwt())->'user_metadata'->>'full_name',(select auth.jwt())->'user_metadata'->>'name',''));
  v_exam public.school_exams;
  v_course text := '';
  v_attempts integer := 0;
  v_attempt_no integer := 1;
  v_total_all integer := 0;
  v_take integer := 0;
  v_expected integer := 0;
  v_submitted integer := 0;
  v_distinct integer := 0;
  v_extra integer := 0;
  v_missing integer := 0;
  v_bad_options integer := 0;
  v_correct integer := 0;
  v_objective integer := 0;
  v_assignment integer := 100;
  v_assignment_completed integer := 0;
  v_assignment_total integer := 0;
  v_final integer := 0;
  v_passed boolean := false;
  v_incomplete integer := 0;
  v_safe_answers jsonb := '[]'::jsonb;
  v_attempt_id uuid;
  v_attempt public.school_exam_attempts;
begin
  if v_uid is null then
    raise exception 'login_required';
  end if;
  if not public.nh7_school_access_approved_v230(v_uid,'','') then
    raise exception 'school_approval_required';
  end if;
  if p_exam_id is null or jsonb_typeof(coalesce(p_answers,'null'::jsonb))<>'array' then
    raise exception 'invalid_exam_submission';
  end if;

  select lower(trim(u.email)) into v_write_email
  from auth.users u where u.id=v_uid limit 1;
  v_write_email:=coalesce(nullif(v_write_email,''),nullif(v_email,''));
  if coalesce(v_write_email,'')='' then raise exception 'login_required'; end if;

  select lower(trim(coalesce(r.payload->>'email',r.payload->>'user_email','')))
    into v_seed_email
  from public.school_student_identities i
  left join public.registrations r on r.id=i.source_registration_id
  where i.user_id=v_uid and i.status='active'
  limit 1;
  v_seed_email:=coalesce(nullif(v_seed_email,''),nullif(v_email,''),v_uid::text);

  perform pg_advisory_xact_lock(hashtextextended('nh7-exam|'||p_exam_id::text||'|'||v_uid::text,0));

  select * into v_exam
  from public.school_exams
  where id=p_exam_id and is_active
  for share;
  if not found then raise exception 'exam_not_found'; end if;

  select count(*)::integer into v_attempts
  from private.nh7_school_attempts_active_v580 a
  where a.exam_id=v_exam.id
    and (
      a.user_id=v_uid
      or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)
    );

  if exists(
    select 1 from private.nh7_school_attempts_active_v580 a
    where a.exam_id=v_exam.id and a.passed=true
      and (
        a.user_id=v_uid
        or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)
      )
  ) then
    raise exception 'exam_already_passed';
  end if;
  if private.nh7_school_cycle_v580(v_uid,coalesce(v_exam.course_code,'foundation_school')) is distinct from p_expected_cycle then raise exception 'school_cycle_changed';end if;
  v_attempt_no:=v_attempts+1;

  if v_exam.exam_scope='course' then
    v_course:=coalesce(nullif(trim(v_exam.course_code),''),'foundation_school');
    select s.score_percent,s.completed_count,s.total_count
      into v_assignment,v_assignment_completed,v_assignment_total
    from private.nh7_assignment_score_for_identity_v128(v_uid,v_email,v_course) s;
    v_assignment:=coalesce(v_assignment,100);
    v_assignment_completed:=coalesce(v_assignment_completed,0);
    v_assignment_total:=coalesce(v_assignment_total,0);

    if v_exam.require_assignments_before_exam and v_assignment_completed<v_assignment_total then
      raise exception 'assignments_required';
    end if;

    if v_exam.require_course_completion then
      select count(*)::integer into v_incomplete
      from public.school_lessons l
      where l.is_active
        and coalesce(nullif(l.content_data#>>'{course,code}',''),'foundation_school')=v_course
        and not (exists(
          select 1 from private.nh7_school_progress_active_v580 p
          where p.lesson_code=l.lesson_code
            and (
              p.user_id=v_uid
              or (p.user_id is null and v_email<>'' and lower(trim(p.user_email))=v_email)
            )
            and (p.completed_at is not null or p.progress_percent>=100)
        ) or (v_course='foundation_school' and coalesce(v_exam.require_assignments_before_exam,false) and exists(select 1 from private.nh7_school_assignments_active_v580 a where a.user_id=v_uid and a.lesson_code=l.lesson_code and a.status='approved')));
      if v_incomplete>0 then raise exception 'course_completion_required'; end if;
    end if;
  end if;

  v_total_all:=jsonb_array_length(coalesce(v_exam.questions,'[]'::jsonb));
  v_take:=case when v_exam.questions_per_attempt>0 then least(v_exam.questions_per_attempt,v_total_all) else v_total_all end;

  with raw as (
    select q,ord::integer as qid
    from jsonb_array_elements(coalesce(v_exam.questions,'[]'::jsonb)) with ordinality as x(q,ord)
  ), ordered as (
    select q,qid,row_number() over(
      order by case when v_exam.shuffle_questions
        then md5(v_exam.id::text||'|'||v_seed_email||'|'||v_attempt_no::text||'|'||qid::text)
        else lpad(qid::text,12,'0') end
    ) as rn
    from raw
  ), expected as (
    select q,qid from ordered where rn<=v_take
  ), submitted as (
    select (a->>'question_id')::integer as qid,(a->>'selected')::integer as selected
    from jsonb_array_elements(p_answers) a
  ), joined as (
    select e.q,e.qid,s.selected
    from expected e left join submitted s on s.qid=e.qid
  )
  select
    (select count(*)::integer from expected),
    (select count(*)::integer from submitted),
    (select count(distinct qid)::integer from submitted),
    (select count(*)::integer from submitted s left join expected e on e.qid=s.qid where e.qid is null),
    (select count(*)::integer from expected e left join submitted s on s.qid=e.qid where s.qid is null),
    (select count(*)::integer from joined j where j.selected is null or j.selected<0 or j.selected>=jsonb_array_length(coalesce(j.q->'options','[]'::jsonb))),
    (select count(*)::integer from joined j where j.selected=(j.q->>'correct')::integer),
    (select coalesce(jsonb_agg(jsonb_build_object(
      'question_id',j.qid,
      'question_number',coalesce((j.q->>'number')::integer,j.qid),
      'selected',j.selected
    ) order by j.qid),'[]'::jsonb) from joined j)
  into v_expected,v_submitted,v_distinct,v_extra,v_missing,v_bad_options,v_correct,v_safe_answers;

  if v_expected=0 or v_submitted<>v_expected or v_distinct<>v_expected or v_extra>0 or v_missing>0 or v_bad_options>0 then
    raise exception 'invalid_answers';
  end if;

  v_objective:=round(v_correct::numeric*100/greatest(1,v_expected))::integer;
  if v_exam.exam_scope='course' then
    v_final:=round((v_objective*v_exam.exam_weight + v_assignment*v_exam.assignment_weight)::numeric /
      greatest(1,v_exam.exam_weight+v_exam.assignment_weight))::integer;
  else
    v_final:=v_objective;
  end if;
  v_passed:=v_final>=v_exam.passing_score;

  insert into public.school_exam_attempts(
    school_cycle,user_id,exam_id,user_email,user_name,course_code,lesson_code,attempt_number,
    correct_count,total_questions,objective_score_percent,assignment_score_percent,final_score_percent,
    assignment_completed_count,assignment_total_count,score_percent,passed,answers,submitted_at
  ) values(
    p_expected_cycle,v_uid,v_exam.id,v_write_email,v_name,coalesce(v_exam.course_code,''),v_exam.lesson_code,v_attempt_no,
    v_correct,v_expected,v_objective,v_assignment,v_final,
    v_assignment_completed,v_assignment_total,v_final,v_passed,v_safe_answers,now()
  ) returning id into v_attempt_id;

  if v_exam.exam_scope='course' then
    perform private.nh7_recalculate_exam_scores_identity_v128(v_uid,v_email,v_course);
  else
    update public.school_progress p
       set user_name=case when v_name<>'' then v_name else p.user_name end,
           progress_percent=greatest(p.progress_percent,case when v_passed then 100 else 0 end),
           completed_at=case when v_passed then coalesce(p.completed_at,now()) else p.completed_at end,
           exam_id=v_exam.id,
           exam_score=v_final,
           objective_score_percent=v_objective,
           assignment_score_percent=100,
           final_score_percent=v_final,
           exam_passed=v_passed,
           exam_attempted_at=now(),
           updated_at=now()
     where p.school_cycle=p_expected_cycle and p.user_id=v_uid and p.lesson_code=v_exam.lesson_code;

    if not found then
      insert into public.school_progress(
        school_cycle,user_id,user_email,user_name,lesson_code,progress_percent,completed_at,exam_id,exam_score,
        objective_score_percent,assignment_score_percent,final_score_percent,exam_passed,exam_attempted_at,updated_at
      ) values(
        p_expected_cycle,v_uid,v_write_email,v_name,v_exam.lesson_code,case when v_passed then 100 else 0 end,
        case when v_passed then now() else null end,v_exam.id,v_final,v_objective,100,v_final,v_passed,now(),now()
      );
    end if;
  end if;

  select * into v_attempt from private.nh7_school_attempts_active_v580 where id=v_attempt_id;
  return jsonb_build_object(
    'ok',true,'attempt_id',v_attempt.id,'attempt_number',v_attempt.attempt_number,
    'correct_count',v_attempt.correct_count,'total_questions',v_attempt.total_questions,
    'objective_score_percent',v_attempt.objective_score_percent,
    'assignment_score_percent',v_attempt.assignment_score_percent,
    'final_score_percent',v_attempt.final_score_percent,'score_percent',v_attempt.score_percent,
    'passed',v_attempt.passed,
    'exam_weight',v_exam.exam_weight,'assignment_weight',v_exam.assignment_weight,
    'passing_score',v_exam.passing_score
  );
end;
$function$;

create or replace function private.nh7_school_assignment_v580(
  p_course_code text,
  p_lesson_code text,
  p_answer_text text,
  p_language text default 'en',
  p_user_name text default '', p_expected_cycle integer default 0
)
returns public.school_assignments
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(trim(coalesce((select auth.jwt())->>'email','')));
  v_write_email text := '';
  v_course text := coalesce(nullif(trim(p_course_code),''),'foundation_school');
  v_lesson text := trim(coalesce(p_lesson_code,''));
  v_answer text := trim(coalesce(p_answer_text,''));
  v_existing public.school_assignments;
  v_row public.school_assignments;
begin
  if v_uid is null then raise exception 'Login required'; end if;
  if not public.nh7_school_access_approved_v230(v_uid,'','') then
    raise exception 'school_approval_required';
  end if;
  perform private.nh7_school_ensure_cycle_v580(v_uid,v_course);if private.nh7_school_cycle_v580(v_uid,v_course) is distinct from p_expected_cycle then raise exception 'school_cycle_changed';end if;
  if v_lesson='' then raise exception 'Lesson code is required'; end if;
  if length(v_answer)<10 then raise exception 'Assignment answer is too short'; end if;

  select lower(trim(u.email)) into v_write_email
  from auth.users u where u.id=v_uid limit 1;
  v_write_email:=coalesce(nullif(v_write_email,''),nullif(v_email,''));
  if coalesce(v_write_email,'')='' then raise exception 'Login required'; end if;

  select * into v_existing
  from private.nh7_school_assignments_active_v580 a
  where a.lesson_code=v_lesson
    and (
      a.user_id=v_uid
      or (a.user_id is null and v_email<>'' and lower(trim(a.user_email))=v_email)
    )
  order by case when a.user_id=v_uid then 0 else 1 end,a.updated_at desc
  limit 1
  for update;

  if found and lower(coalesce(v_existing.status,''))='approved' then
    raise exception 'assignment_already_approved';
  end if;

  if found then
    update public.school_assignments a
       set user_name=coalesce(p_user_name,''),
           course_code=v_course,
           answer_text=v_answer,
           language=case when lower(coalesce(p_language,'en')) in ('fa','en','hr') then lower(p_language) else 'en' end,
           status='submitted',
           score_percent=0,
           admin_feedback='',
           submitted_at=now(),
           reviewed_at=null,
           updated_at=now()
     where a.id=v_existing.id
     returning * into v_row;
  else
    insert into public.school_assignments(
      school_cycle,user_id,user_email,user_name,course_code,lesson_code,answer_text,language,
      status,score_percent,admin_feedback,submitted_at,reviewed_at,updated_at
    ) values(
      p_expected_cycle,v_uid,v_write_email,coalesce(p_user_name,''),v_course,v_lesson,v_answer,
      case when lower(coalesce(p_language,'en')) in ('fa','en','hr') then lower(p_language) else 'en' end,
      'submitted',0,'',now(),null,now()
    )
    returning * into v_row;
  end if;

  perform private.nh7_recalculate_exam_scores_identity_v128(v_uid,v_email,v_course);
  return v_row;
end;
$function$;

create or replace function private.nh7_school_progress_v580(
  p_lesson_code text,
  p_progress_percent integer default null,
  p_completed_at timestamptz default null, p_expected_cycle integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_uid uuid:=(select auth.uid());
  v_email text:=lower(trim(coalesce((select auth.jwt())->>'email','')));
  v_name text:=trim(coalesce((select auth.jwt())->'user_metadata'->>'full_name',(select auth.jwt())->'user_metadata'->>'name',''));
  v_code text:=trim(coalesce(p_lesson_code,''));
  v_progress integer:=least(100,greatest(0,coalesce(p_progress_percent,0)));
  v_row public.school_progress; v_course text;
begin
  if v_uid is null or v_email='' then
    raise exception 'login_required';
  end if;
  if not public.nh7_school_access_approved_v230(v_uid,v_email,'') then
    raise exception 'school_approval_required';
  end if;
  select coalesce(course_code,'foundation_school') into v_course from public.school_lessons where lesson_code=v_code limit 1;v_course:=coalesce(v_course,'foundation_school');perform private.nh7_school_ensure_cycle_v580(v_uid,v_course);if private.nh7_school_cycle_v580(v_uid,v_course) is distinct from p_expected_cycle then raise exception 'school_cycle_changed';end if;
  if v_code='' or v_code like 'course:%' then
    raise exception 'invalid_lesson';
  end if;
  if not exists(select 1 from public.school_lessons l where l.lesson_code=v_code and l.is_active) then
    raise exception 'lesson_not_found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('nh7-progress|'||v_uid::text||'|'||v_code,0));

  update public.school_progress p
     set user_name=case when v_name<>'' then v_name else p.user_name end,
         progress_percent=greatest(p.progress_percent,v_progress),
         completed_at=coalesce(p.completed_at,p_completed_at),
         updated_at=now()
   where p.school_cycle=p_expected_cycle and p.user_id=v_uid
     and p.lesson_code=v_code
  returning p.* into v_row;

  if not found then
    insert into public.school_progress(
      school_cycle,user_email,user_name,lesson_code,progress_percent,completed_at,updated_at
    ) values(
      p_expected_cycle,v_email,v_name,v_code,v_progress,p_completed_at,now()
    )
    returning * into v_row;
  end if;

  return jsonb_build_object(
    'ok',true,
    'lesson_code',v_row.lesson_code,
    'progress_percent',v_row.progress_percent,
    'completed_at',v_row.completed_at,
    'updated_at',v_row.updated_at
  );
end;
$function$;


-- Review-only current-identity cycle operations. No implicit restart or issuance.
create function private.nh7_school_summary_v580(p_uid uuid,p_course text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare b jsonb; p jsonb; a jsonb; passed boolean; current_stage integer; anchor integer:=0; legacy_graduate boolean:=false;
begin
 b:=private.nh7_school_budget_v580(p_uid,p_course);
 if (b->>'cycle')::integer=0 then
  select coalesce(max(l.completed_through_class),0),coalesce(bool_or(l.is_legacy_graduate),false) into anchor,legacy_graduate from public.school_legacy_progress_v542 l join auth.users u on u.id=p_uid left join public.school_student_identities i on i.user_id=u.id and i.status='active' left join public.registrations r on r.id=i.source_registration_id where lower(trim(l.user_email))=lower(trim(coalesce(nullif(r.payload->>'email',''),u.email)));
 end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]'::jsonb) into p from private.nh7_school_progress_active_v580 x where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid and (x.lesson_code='course:'||p_course or exists(select 1 from public.school_lessons l where l.lesson_code=x.lesson_code and l.course_code=p_course));
 select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]'::jsonb) into a from private.nh7_school_assignments_active_v580 x where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid and x.course_code=p_course;
 select exists(select 1 from private.nh7_school_attempts_active_v580 x join public.school_exams e on e.id=x.exam_id where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid and e.course_code=p_course and e.exam_scope='course' and x.passed) into passed;
 select coalesce(min(s.stage_order),8) into current_stage from public.school_course_stages s where s.course_code=p_course and s.is_active and s.stage_order>anchor and not exists(select 1 from private.nh7_school_attempts_active_v580 x join public.school_exams e on e.id=x.exam_id where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid and e.course_code=p_course and e.lesson_code='class_exam:'||s.stage_code and x.passed);
 return b||jsonb_build_object('user_id',p_uid,'course_code',p_course,'progress',p,'assignments',a,'current_stage',greatest(current_stage,(b->>'repair_stage')::integer),'completed',passed or legacy_graduate or (b->>'admin_override')::boolean,'completion_source',case when (b->>'admin_override')::boolean then 'ADMIN_OVERRIDE' when legacy_graduate then 'LEGACY_PRESERVED' when passed then 'EXAM' else null end,'access_state',case when passed or legacy_graduate or (b->>'admin_override')::boolean then 'COMPLETED' when (b->>'remaining_attempts')::integer=0 then 'RESTART_REQUIRED' else 'IN_PROGRESS' end);
end $$;
revoke all on function private.nh7_school_summary_v580(uuid,text) from public,anon,authenticated;

create function private.nh7_school_override_v580(p_target uuid,p_course text,p_cycle integer,p_action text,p_reason text,p_request uuid,p_confirm boolean,p_stage integer default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); before_state jsonb; after_state jsonb; input jsonb; old_event private.nh7_school_admin_audit_v580;
begin
 if actor is null then raise exception 'login_required' using errcode='42501';end if;
 if p_target is null or p_request is null or p_confirm is distinct from true or length(trim(coalesce(p_reason,''))) not between 3 and 2000 then raise exception 'confirmation_reason_request_required';end if;
 if p_course<>'foundation_school' then raise exception 'unsupported_school_course';end if;
 if p_action='student_restart' then
  if p_target<>actor then raise exception 'permission_denied' using errcode='42501';end if;
  if not public.nh7_school_access_approved_v230(actor,'','') then raise exception 'school_approval_required';end if;
 elsif not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'owner_required' using errcode='42501';end if;
 if not exists(select 1 from public.school_student_identities where user_id=p_target and status='active') then raise exception 'student_not_found';end if;
 input:=jsonb_build_object('target',p_target,'course',p_course,'cycle',p_cycle,'action',p_action,'reason',trim(p_reason),'stage',p_stage);
 perform private.nh7_school_ensure_cycle_v580(p_target,p_course);
 select * into old_event from private.nh7_school_admin_audit_v580 where actor_user_id=actor and request_id=p_request;
 if found then
  if old_event.input<>input then raise exception 'request_id_reused';end if;
  return jsonb_build_object('ok',true,'audit_id',old_event.id,'state',old_event.after_state,'replayed',true);
 end if;
 if private.nh7_school_cycle_v580(p_target,p_course) is distinct from p_cycle then raise exception 'school_cycle_changed';end if;
 before_state:=private.nh7_school_summary_v580(p_target,p_course);
 if p_action='student_restart' and before_state->>'access_state'<>'RESTART_REQUIRED' then raise exception 'restart_not_required';end if;
 case p_action
  when 'grant_extra_attempt' then update private.nh7_school_cycles_v580 set extra_attempts=extra_attempts+1 where user_id=p_target and course_code=p_course and cycle=p_cycle;
  when 'reset_attempt_allowance' then update private.nh7_school_cycles_v580 set reset_failed_baseline=(before_state->>'failed_total')::integer,extra_attempts=0 where user_id=p_target and course_code=p_course and cycle=p_cycle;
  when 'admin_pass' then update private.nh7_school_cycles_v580 set admin_pass=true where user_id=p_target and course_code=p_course and cycle=p_cycle;
  when 'repair_stage' then
   if p_stage is null or p_stage not between 1 and 7 then raise exception 'invalid_stage';end if;
   update private.nh7_school_cycles_v580 set repair_stage=greatest(repair_stage,p_stage) where user_id=p_target and course_code=p_course and cycle=p_cycle;
  when 'admin_restart','student_restart' then
   update private.nh7_school_cycles_v580 set ended_at=now() where user_id=p_target and course_code=p_course and cycle=p_cycle;
   insert into private.nh7_school_cycles_v580(user_id,course_code,cycle) values(p_target,p_course,p_cycle+1);
  else raise exception 'invalid_school_action';
 end case;
 after_state:=private.nh7_school_summary_v580(p_target,p_course);
 insert into private.nh7_school_admin_audit_v580(request_id,target_user_id,actor_user_id,course_code,cycle,action,reason,before_state,after_state,input)
 values(p_request,p_target,actor,p_course,p_cycle,p_action,trim(p_reason),before_state,after_state,input) returning * into old_event;
 return jsonb_build_object('ok',true,'audit_id',old_event.id,'state',after_state,'replayed',false);
end $$;
revoke all on function private.nh7_school_override_v580(uuid,text,integer,text,text,uuid,boolean,integer) from public,anon,authenticated;

create function public.nh7_admin_school_state_v580(p_email text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid; history jsonb; audits jsonb;
begin
 if auth.uid() is null or not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'owner_required' using errcode='42501';end if;
 select u.id into uid from auth.users u join public.school_student_identities i on i.user_id=u.id and i.status='active' where lower(trim(u.email))=lower(trim(p_email));
 if uid is null then raise exception 'student_not_found';end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.cycle desc),'[]'::jsonb) into history from (select * from private.nh7_school_cycles_v580 where user_id=uid and course_code='foundation_school' order by cycle desc limit 50) x;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into audits from (select * from private.nh7_school_admin_audit_v580 where target_user_id=uid order by created_at desc limit 50) x;
 return jsonb_build_object('contract',580,'can_manage',true,'state',private.nh7_school_summary_v580(uid,'foundation_school'),'cycles',history,'audit',audits);
end $$;
revoke all on function public.nh7_admin_school_state_v580(text) from public,anon,authenticated;
grant execute on function public.nh7_admin_school_state_v580(text) to authenticated;

create function public.nh7_admin_school_action_v580(p_target uuid,p_cycle integer,p_action text,p_reason text,p_request uuid,p_confirm boolean,p_stage integer default null)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'owner_required' using errcode='42501';end if;
 if p_action not in('grant_extra_attempt','reset_attempt_allowance','admin_pass','repair_stage','admin_restart') then raise exception 'invalid_admin_action';end if;
 return private.nh7_school_override_v580(p_target,'foundation_school',p_cycle,p_action,p_reason,p_request,p_confirm,p_stage);
end $$;
revoke all on function public.nh7_admin_school_action_v580(uuid,integer,text,text,uuid,boolean,integer) from public,anon,authenticated;
grant execute on function public.nh7_admin_school_action_v580(uuid,integer,text,text,uuid,boolean,integer) to authenticated;

create function public.nh7_school_restart_v580(p_cycle integer,p_request uuid,p_confirm boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 return private.nh7_school_override_v580(auth.uid(),'foundation_school',p_cycle,'student_restart','Student confirmed School restart',p_request,p_confirm,null);
end $$;
revoke all on function public.nh7_school_restart_v580(integer,uuid,boolean) from public,anon,authenticated;
grant execute on function public.nh7_school_restart_v580(integer,uuid,boolean) to authenticated;

create function public.nh7_school_submit_v580(p_exam_id uuid,p_answers jsonb,p_cycle integer,p_request uuid,p_class_key text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); e public.school_exams; s jsonb; b jsonb; result jsonb; payload jsonb; prior private.nh7_school_receipts_v580; course text; final_exam boolean;
begin
 if uid is null or not public.nh7_school_access_approved_v230(uid,'','') then raise exception 'school_approval_required' using errcode='42501';end if;
 if p_request is null or p_exam_id is null or jsonb_typeof(p_answers)<>'array' then raise exception 'invalid_exam_submission';end if;
 select * into e from public.school_exams where id=p_exam_id and is_active;
 if not found then raise exception 'exam_not_found';end if;
 course:=coalesce(nullif(e.course_code,''),'foundation_school');
 perform private.nh7_school_ensure_cycle_v580(uid,course);
 if private.nh7_school_cycle_v580(uid,course) is distinct from p_cycle then raise exception 'school_cycle_changed';end if;
 payload:=jsonb_build_object('exam',p_exam_id,'cycle',p_cycle,'class',p_class_key,'answers',p_answers);
 select * into prior from private.nh7_school_receipts_v580 where user_id=uid and request_id=p_request;
 if found then
  if prior.input<>payload or prior.action<>'exam_submit' then raise exception 'request_id_reused';end if;
  return prior.receipt||jsonb_build_object('replayed',true);
 end if;
 final_exam:=e.exam_scope='course' and course='foundation_school' and e.lesson_code='course:foundation_school';
 if final_exam then
  s:=public.nh7_school_final_exam_session_v351(course);
  if not coalesce((s->>'ready')::boolean,false) or nullif(s#>>'{exam,id}','')::uuid is distinct from p_exam_id then raise exception 'final_exam_not_ready';end if;
 elsif e.exam_scope='class' then
  if p_class_key is null or e.lesson_code<>'class_exam:'||p_class_key then raise exception 'invalid_class_key';end if;
  s:=public.nh7_school_class_exam_session_v351(p_class_key);
  if not coalesce((s->>'ready')::boolean,false) or nullif(s#>>'{exam,id}','')::uuid is distinct from p_exam_id then raise exception 'class_exam_not_ready';end if;
 else
  -- A lesson quiz cannot substitute for another course/class/final examination.
  if e.exam_scope not in('lesson','course') then raise exception 'unsupported_exam_scope';end if;
  -- Lesson quizzes do not bypass class/assignment gates: class advancement is still checked separately.
  if exists(select 1 from public.school_course_stage_lessons sl where sl.course_code=course and sl.lesson_code=e.lesson_code) then
   select public.nh7_school_class_exam_session_v351(sl.stage_code) into s from public.school_course_stage_lessons sl where sl.course_code=course and sl.lesson_code=e.lesson_code;
   if not coalesce((s->>'class_unlocked')::boolean,false) then raise exception 'previous_class_required';end if;
  end if;
 end if;
 insert into private.nh7_school_receipts_v580(user_id,request_id,course_code,cycle,action,input,receipt) values(uid,p_request,course,p_cycle,'exam_pending',payload,'{}');
 result:=private.nh7_school_grade_v580(p_exam_id,p_answers,p_cycle);
 result:=result||jsonb_build_object('school_cycle',p_cycle,'submission_id',p_request,'replayed',false);
 update private.nh7_school_receipts_v580 set action='exam_submit',receipt=result,failed_final=final_exam and not (result->>'passed')::boolean,attempt_id=(result->>'attempt_id')::uuid where user_id=uid and request_id=p_request;
 b:=private.nh7_school_budget_v580(uid,course);
 result:=result||jsonb_build_object('budget',b,'access_state',case when (result->>'passed')::boolean and final_exam then 'COMPLETED' when final_exam and (b->>'remaining_attempts')::integer=0 then 'RESTART_REQUIRED' else 'RETRY_ALLOWED' end);
 update private.nh7_school_receipts_v580 set receipt=result where user_id=uid and request_id=p_request;
 return result;
end $$;
revoke all on function public.nh7_school_submit_v580(uuid,jsonb,integer,uuid,text) from public,anon,authenticated;
grant execute on function public.nh7_school_submit_v580(uuid,jsonb,integer,uuid,text) to authenticated;

create function public.nh7_school_progress_save_cycle_v580(p_lesson_code text,p_progress_percent integer,p_completed_at timestamptz,p_cycle integer)
returns jsonb language plpgsql security definer set search_path='' as $$
begin return private.nh7_school_progress_v580(p_lesson_code,p_progress_percent,p_completed_at,p_cycle);end $$;
revoke all on function public.nh7_school_progress_save_cycle_v580(text,integer,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.nh7_school_progress_save_cycle_v580(text,integer,timestamptz,integer) to authenticated;

create function public.nh7_school_assignment_submit_cycle_v580(p_course_code text,p_lesson_code text,p_answer_text text,p_language text,p_user_name text,p_cycle integer)
returns public.school_assignments language plpgsql security definer set search_path='' as $$
begin return private.nh7_school_assignment_v580(p_course_code,p_lesson_code,p_answer_text,p_language,p_user_name,p_cycle);end $$;
revoke all on function public.nh7_school_assignment_submit_cycle_v580(text,text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.nh7_school_assignment_submit_cycle_v580(text,text,text,text,text,integer) to authenticated;

create function public.nh7_admin_school_history_v580(p_target uuid,p_cycle integer,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare attempts jsonb; progress jsonb; assignments jsonb;
begin
 if auth.uid() is null or not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'owner_required' using errcode='42501';end if;
 if p_cycle<0 or p_offset<0 then raise exception 'invalid_history_page';end if;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into attempts from (select * from public.school_exam_attempts where private.nh7_school_activity_owner_v580(user_id,user_email)=p_target and school_cycle=p_cycle order by submitted_at desc,id limit 100 offset p_offset) x;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into progress from public.school_progress x where private.nh7_school_activity_owner_v580(user_id,user_email)=p_target and school_cycle=p_cycle;
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into assignments from public.school_assignments x where private.nh7_school_activity_owner_v580(user_id,user_email)=p_target and school_cycle=p_cycle;
 return jsonb_build_object('cycle',p_cycle,'attempts',attempts,'progress',progress,'assignments',assignments,'offset',p_offset,'page_size',100);
end $$;
revoke all on function public.nh7_admin_school_history_v580(uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.nh7_admin_school_history_v580(uuid,integer,integer) to authenticated;


-- Fail closed for obsolete unidentifiable exam submissions after explicit activation.
-- Current clients use nh7_school_submit_v580 with a durable request ID.
create or replace function public.nh7_submit_school_exam_v340(p_exam_id uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
begin raise exception 'update_school_client_required';end $$;
revoke all on function public.nh7_submit_school_exam_v340(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.nh7_submit_school_exam_v340(uuid,jsonb) to authenticated;

create or replace function public.nh7_school_progress_save_v340(p_lesson_code text,p_progress_percent integer default null,p_completed_at timestamptz default null)
returns jsonb language plpgsql security definer set search_path='' as $$
begin return private.nh7_school_progress_v580(p_lesson_code,p_progress_percent,p_completed_at,0);end $$;
create or replace function public.nh7_submit_school_assignment(p_course_code text,p_lesson_code text,p_answer_text text,p_language text default 'en',p_user_name text default '')
returns public.school_assignments language plpgsql security definer set search_path='' as $$
begin return private.nh7_school_assignment_v580(p_course_code,p_lesson_code,p_answer_text,p_language,p_user_name,0);end $$;

-- Keep standard assignment review contract/approved gating, but never alter a closed cycle.
create or replace function public.nh7_admin_review_school_assignment(p_id uuid,p_status text,p_score integer,p_feedback text default '')
returns public.school_assignments language plpgsql security definer set search_path='' as $$
declare r public.school_assignments; v_status text:=lower(coalesce(p_status,''));
begin
 if auth.uid() is null or not coalesce(public.nh7_admin_is_admin_v170(),false) then raise exception 'Admin access required' using errcode='42501';end if;
 if v_status not in('approved','needs_revision','submitted') then raise exception 'invalid_assignment_status';end if;
 select * into r from public.school_assignments where id=p_id;
 if not found then raise exception 'assignment_not_found';end if;
 perform private.nh7_school_ensure_cycle_v580(r.user_id,r.course_code);
 if r.school_cycle<>private.nh7_school_cycle_v580(r.user_id,r.course_code) then raise exception 'closed_cycle_immutable';end if;
 update public.school_assignments set status=v_status,score_percent=greatest(0,least(100,coalesce(p_score,0))),admin_feedback=coalesce(p_feedback,''),reviewed_at=case when v_status in('approved','needs_revision') then now() else null end,updated_at=now() where id=p_id returning * into r;
 perform private.nh7_recalculate_exam_scores_identity_v128(r.user_id,r.user_email,r.course_code);
 return r;
end $$;
revoke all on function public.nh7_admin_review_school_assignment(uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.nh7_admin_review_school_assignment(uuid,text,integer,text) to authenticated;

revoke all on function private.nh7_school_grade_v580(uuid,jsonb,integer),private.nh7_school_progress_v580(text,integer,timestamptz,integer),private.nh7_school_assignment_v580(text,text,text,text,text,integer) from public,anon,authenticated,service_role;
revoke all on function public.nh7_school_progress_save_v340(text,integer,timestamptz),public.nh7_submit_school_assignment(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.nh7_school_progress_save_v340(text,integer,timestamptz),public.nh7_submit_school_assignment(text,text,text,text,text) to authenticated;

-- Legacy score lookup remains read-only, but never accepts another student's email
-- as authority. Preserve the existing TABLE result contract for actual own/Admin callers.
create or replace function public.nh7_assignment_score_for_user(p_user_email text,p_course_code text)
returns table(score_percent integer,completed_count integer,total_count integer)
language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid(); target uuid;
begin
 if uid is null then raise exception 'login_required' using errcode='42501';end if;
 target:=private.nh7_school_activity_owner_v580(null,p_user_email);
 if target is null then raise exception 'student_identity_required' using errcode='42501';end if;
 if target<>uid and not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'permission_denied' using errcode='42501';end if;
 if target=uid and not public.nh7_school_access_approved_v230(uid,'','') then raise exception 'school_approval_required' using errcode='42501';end if;
 return query select * from private.nh7_assignment_score_for_identity_v128(target,p_user_email,p_course_code);
end $$;
revoke all on function public.nh7_assignment_score_for_user(text,text) from public,anon,authenticated;
grant execute on function public.nh7_assignment_score_for_user(text,text) to authenticated;


-- Preserve deployed report bodies rather than reconstruct unknown live definitions.
-- Only School fields of cycle-managed students are overlaid. No extra client requests.
create function private.nh7_school_report_v580(p_uid uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s jsonb; attempts jsonb; progress jsonb; assignments jsonb; counts jsonb; last_activity timestamptz; unresolved integer;
begin
 s:=private.nh7_school_summary_v580(p_uid,'foundation_school');
 select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]') into progress from private.nh7_school_progress_active_v580 x where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]') into assignments from private.nh7_school_assignments_active_v580 x where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.submitted_at desc),'[]') into attempts from private.nh7_school_attempts_active_v580 x where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid;
 select jsonb_build_object('progress_rows',count(*),'completed_lessons',count(*) filter(where p.completed_at is not null or p.progress_percent>=100)) into counts from private.nh7_school_progress_active_v580 p where private.nh7_school_activity_owner_v580(p.user_id,p.user_email)=p_uid and p.lesson_code not like 'course:%';
 select counts||jsonb_build_object('assignment_rows',count(*),'approved_assignments',count(*) filter(where status='approved'),'revision_assignments',count(*) filter(where status='needs_revision'),'pending_assignments',count(*) filter(where status='submitted'),'assignment_average',avg(score_percent)) into counts from private.nh7_school_assignments_active_v580 where private.nh7_school_activity_owner_v580(user_id,user_email)=p_uid;
 select counts||jsonb_build_object('exam_attempts',count(*),'passed_attempts',count(*) filter(where passed),'failed_attempts',count(*) filter(where not passed),'best_final_score',max(final_score_percent) filter(where lesson_code='course:foundation_school'),'final_exam_attempts',count(*) filter(where lesson_code='course:foundation_school')) into counts from private.nh7_school_attempts_active_v580 where private.nh7_school_activity_owner_v580(user_id,user_email)=p_uid;
 select max(t) into last_activity from (select updated_at t from private.nh7_school_progress_active_v580 where private.nh7_school_activity_owner_v580(user_id,user_email)=p_uid union all select updated_at from private.nh7_school_assignments_active_v580 where private.nh7_school_activity_owner_v580(user_id,user_email)=p_uid union all select submitted_at from private.nh7_school_attempts_active_v580 where private.nh7_school_activity_owner_v580(user_id,user_email)=p_uid) x;
 select count(*) into unresolved from public.school_exams e where e.exam_scope='class' and e.course_code='foundation_school' and exists(select 1 from private.nh7_school_attempts_active_v580 x where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid and x.exam_id=e.id and not x.passed) and not exists(select 1 from private.nh7_school_attempts_active_v580 x where private.nh7_school_activity_owner_v580(x.user_id,x.user_email)=p_uid and x.exam_id=e.id and x.passed);
 counts:=counts||jsonb_build_object('last_school_activity',last_activity,'days_since_activity',case when last_activity is not null then floor(extract(epoch from(now()-last_activity))/86400)::integer else null end,'unresolved_failed_class_exams',unresolved);
 return jsonb_build_object('progress',progress,'assignments',assignments,'attempts',attempts,'summary',counts,'cycle_state',s);
end $$;
revoke all on function private.nh7_school_report_v580(uuid) from public,anon,authenticated;

-- Rename inside the transaction: retain exact baseline bodies and search_path.
-- Required endpoints must exist; preflight/transaction abort rather than guessing.
do $install$
declare n text; args text;
begin
 foreach n in array array['nh7_admin_student_profile_v238','nh7_admin_student_profile_v451','nh7_admin_student_profile_v452','nh7_admin_student_academic_center_v543'] loop
  args:=case when n='nh7_admin_student_academic_center_v543' then 'integer' else 'text' end;
  if to_regprocedure('public.'||n||'('||args||')') is null then raise exception 'School report prerequisite missing: %',n;end if;
  if (select prorettype from pg_proc where oid=to_regprocedure('public.'||n||'('||args||')'))<>'jsonb'::regtype then raise exception 'School report contract drift: %',n;end if;
  execute format('alter function public.%I(%s) set schema private',n,args);
  execute format('alter function private.%I(%s) rename to %I',n,args,n||'_before580');
  execute format('revoke all on function private.%I(%s) from public,anon,authenticated,service_role',n||'_before580',args);
 end loop;
end $install$;

create function private.nh7_school_profile_overlay_v580(p_base jsonb,p_email text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid; s jsonb; old_school jsonb;
begin
 select u.id into uid from auth.users u join public.school_student_identities i on i.user_id=u.id and i.status='active' where lower(trim(u.email))=lower(trim(p_email));
 if uid is null then return p_base;end if;
 s:=private.nh7_school_budget_v580(uid,'foundation_school');old_school:=coalesce(p_base->'school','{}');
 -- Cycle zero remains legacy-compatible unless explicitly accepted by Admin.
 if (s->>'cycle')::integer=0 and not (s->>'admin_override')::boolean then
  return jsonb_set(p_base,'{school}',old_school||jsonb_build_object('cycle_state',s),true);
 end if;
 s:=private.nh7_school_report_v580(uid);
 return jsonb_set(p_base,'{school}',old_school||s,true);
end $$;
revoke all on function private.nh7_school_profile_overlay_v580(jsonb,text) from public,anon,authenticated;

do $install$
declare n text;
begin
 foreach n in array array['nh7_admin_student_profile_v238','nh7_admin_student_profile_v451','nh7_admin_student_profile_v452'] loop
  execute format($ddl$create function public.%I(p_email text) returns jsonb language plpgsql stable security definer set search_path='' as $body$
   begin
    if auth.uid() is null or not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'owner_required' using errcode='42501';end if;
    return private.nh7_school_profile_overlay_v580(private.%I(p_email),p_email);
   end $body$$ddl$,n,n||'_before580');
  execute format('revoke all on function public.%I(text) from public,anon,authenticated',n);
  execute format('grant execute on function public.%I(text) to authenticated',n);
 end loop;
end $install$;

create function public.nh7_admin_student_academic_center_v543(p_inactive_days integer default 30)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare base jsonb; r jsonb; rows jsonb:='[]'; uid uuid; s jsonb; summary jsonb; status text; total integer;
begin
 if auth.uid() is null or not coalesce(private.nh7_admin_is_owner_v350(),false) then raise exception 'owner_required' using errcode='42501';end if;
 base:=private.nh7_admin_student_academic_center_v543_before580(p_inactive_days);
 for r in select value from jsonb_array_elements(coalesce(base->'rows','[]')) loop
  select u.id into uid from auth.users u join public.school_student_identities i on i.user_id=u.id and i.status='active' where lower(trim(u.email))=lower(trim(r->>'email'));
  -- Avoid materializing full answers/history for unchanged generation-zero roster rows.
  if uid is not null and exists(select 1 from private.nh7_school_cycles_v580 c where c.user_id=uid and c.course_code='foundation_school' and c.ended_at is null and (c.cycle>0 or c.admin_pass)) then
   s:=private.nh7_school_report_v580(uid);
   r:=r||jsonb_build_object('school_cycle',s->'cycle_state');
   if (s#>>'{cycle_state,cycle}')::integer>0 or (s#>>'{cycle_state,admin_override}')::boolean then
    total:=coalesce((r->>'total_lessons')::integer,0);
    r:=r||(s->'summary')||jsonb_build_object('graduated',s#>'{cycle_state,completed}','course_completed',s#>'{cycle_state,completed}','final_exam_passed',s#>'{cycle_state,completed}','completion_source',s#>'{cycle_state,completion_source}','remaining_lessons',greatest(0,total-(s#>>'{summary,completed_lessons}')::integer),'progress_percent',case when total>0 then round(100.0*(s#>>'{summary,completed_lessons}')::integer/total,1) else 0 end,'started_school',jsonb_array_length(s->'progress')+jsonb_array_length(s->'assignments')+jsonb_array_length(s->'attempts')>0);
    status:=case when (s#>>'{cycle_state,completed}')::boolean then 'completed' when (s#>>'{summary,revision_assignments}')::integer>0 then 'needs_revision' when (s#>>'{summary,final_exam_attempts}')::integer>0 then 'final_exam_failed' when (s#>>'{summary,unresolved_failed_class_exams}')::integer>0 then 'class_exam_failed' when not (r->>'started_school')::boolean then 'registered_never_started' when coalesce((s#>>'{summary,days_since_activity}')::integer,-1)>=greatest(1,least(coalesce(p_inactive_days,30),365)) then 'inactive' else 'in_progress' end;
    r:=r||jsonb_build_object('academic_status_code',status,'status_code',status);
   end if;
  end if;
  rows:=rows||jsonb_build_array(r);
 end loop;
 summary:=coalesce(base->'summary','{}');
 select summary||jsonb_build_object('registered_never_started',count(*) filter(where value->>'status_code'='registered_never_started'),'in_progress',count(*) filter(where value->>'status_code'='in_progress'),'needs_revision',count(*) filter(where value->>'status_code'='needs_revision'),'exam_failed',count(*) filter(where value->>'status_code' in('final_exam_failed','exam_failed','class_exam_failed')),'passed',count(*) filter(where coalesce((value->>'graduated')::boolean,false) or value->>'status_code' in('passed','completed')),'completed',count(*) filter(where coalesce((value->>'course_completed')::boolean,false)),'inactive',count(*) filter(where value->>'academic_status_code'='inactive'),'pending_assignment_students',count(*) filter(where coalesce((value->>'pending_assignments')::integer,0)>0)) into summary from jsonb_array_elements(rows);
 return base||jsonb_build_object('rows',rows,'summary',summary,'school_cycle_contract',580);
end $$;
revoke all on function public.nh7_admin_student_academic_center_v543(integer) from public,anon,authenticated;
grant execute on function public.nh7_admin_student_academic_center_v543(integer) to authenticated;

-- Read-only completion adapter. Never issues or alters a certificate.
create function public.nh7_school_completion_v580()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.nh7_school_access_approved_v230(auth.uid(),'','') then raise exception 'school_approval_required' using errcode='42501';end if;
 return private.nh7_school_summary_v580(auth.uid(),'foundation_school');
end $$;
revoke all on function public.nh7_school_completion_v580() from public,anon,authenticated;
grant execute on function public.nh7_school_completion_v580() to authenticated;


-- Exact function list; no blanket GRANT or privileged client credentials.
revoke all on function private.nh7_assignment_score_for_identity_v128(uuid,text,text),private.nh7_recalculate_exam_scores_identity_v128(uuid,text,text) from public,anon,authenticated;
revoke all on function public.nh7_school_exam_session_v340(text,text),public.nh7_school_class_exam_session_v351(text),public.nh7_school_final_exam_session_v351(text),public.nh7_school_path_state_v351(),public.nh7_get_my_school_snapshot_v2110() from public,anon,authenticated;
grant execute on function public.nh7_school_exam_session_v340(text,text),public.nh7_school_class_exam_session_v351(text),public.nh7_school_final_exam_session_v351(text),public.nh7_school_path_state_v351(),public.nh7_get_my_school_snapshot_v2110() to authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
