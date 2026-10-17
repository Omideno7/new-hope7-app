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
