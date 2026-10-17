"""Compile reviewed cycle-aware RPCs from exact repository UID-first School source.
No database connection. Existing checkpoint migrations are never rewritten.
"""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
REVIEW=ROOT/'supabase/review/school-progression-v580'
def function(file,name):
 s=(ROOT/file).read_text();m=re.search(r'create or replace function '+re.escape(name)+r'\([\s\S]*?\$function\$;',s,re.I)
 if not m:raise ValueError(name)
 return m[0]
def active(s):
 for old,new in [('school_progress','nh7_school_progress_active_v580'),('school_assignments','nh7_school_assignments_active_v580'),('school_exam_attempts','nh7_school_attempts_active_v580')]:
  s=re.sub(r'(?i)(from|join) public\.'+old+r'\b',lambda m:m[1]+' private.'+new,s)
 return s
READ='supabase/migrations/20261009124356_school_exam_read_identity_v351.sql'
SUB='supabase/migrations/20261009162431_school_exam_submit_identity_v128.sql'
SCORE='supabase/migrations/20261009130632_school_exam_scoring_identity_v128.sql'
parts=[]
s=active(function(READ,'public.nh7_school_exam_session_v340'))
s=s.replace("'remaining_attempts',case when v_passed then 0 else greatest(0,v_exam.max_attempts-v_attempts) end,", "'budget',private.nh7_school_budget_v580(v_uid,coalesce(v_exam.course_code,'foundation_school')),'school_cycle',private.nh7_school_cycle_v580(v_uid,coalesce(v_exam.course_code,'foundation_school')),'unlimited_attempts',not (v_exam.exam_scope='course' and v_exam.course_code='foundation_school' and v_exam.lesson_code='course:foundation_school'),\n    'remaining_attempts',case when not (v_exam.exam_scope='course' and v_exam.course_code='foundation_school' and v_exam.lesson_code='course:foundation_school') then null else (private.nh7_school_budget_v580(v_uid,coalesce(v_exam.course_code,'foundation_school'))->>'remaining_attempts')::integer end,")
parts.append(s)
s=active(function(READ,'public.nh7_school_class_exam_session_v351'))
s=s.replace('and (v_last_failed is null or p.updated_at>v_last_failed)','').replace('and (v_last_failed is null or coalesce(a.reviewed_at,a.updated_at,a.submitted_at)>v_last_failed)','')
s=s.replace('v351-hotfix1','v580-cycle')
s=s.replace('v_anchor:=coalesce(v_anchor,0);', "v_anchor:=coalesce(v_anchor,0);if private.nh7_school_cycle_v580(v_uid,'foundation_school')>0 then v_anchor:=0;v_legacy_graduate:=false;end if;")
s=s.replace('if v_course_passed or v_legacy_graduate then', "if v_course_passed or v_legacy_graduate or (private.nh7_school_budget_v580(v_uid,'foundation_school')->>'admin_override')::boolean then")
s=s.replace("v_base:=coalesce(v_base,'{}'::jsonb);", "v_base:=coalesce(v_base,'{}'::jsonb)||jsonb_build_object('unlimited_attempts',true,'school_cycle',private.nh7_school_cycle_v580(v_uid,'foundation_school'));")
s=s.replace("v_ready := v_prev_passed and", "v_prev_passed:=v_prev_passed or v_class_no<=(private.nh7_school_budget_v580(v_uid,'foundation_school')->>'repair_stage')::integer;\n  v_ready := v_prev_passed and")
s=s.replace("and coalesce((v_base->>'remaining_attempts')::integer,0)>0 and",'and')
parts.append(s)
s=active(function(READ,'public.nh7_school_final_exam_session_v351'))
s=s.replace('v_anchor:=coalesce(v_anchor,0);',"v_anchor:=coalesce(v_anchor,0);if private.nh7_school_cycle_v580(v_uid,v_course)>0 then v_anchor:=0;v_legacy_graduate:=false;end if;")
s=s.replace('if v_course_passed or v_legacy_graduate then',"if v_course_passed or v_legacy_graduate or (private.nh7_school_budget_v580(v_uid,v_course)->>'admin_override')::boolean then")
s=s.replace('return jsonb_build_object(',"return private.nh7_school_budget_v580(v_uid,v_course)||jsonb_build_object(")
s=s.replace('v_remaining:=case when v_passed then 0 else greatest(0,v_exam.max_attempts-v_attempts) end;',"v_remaining:=case when v_passed then 0 else (private.nh7_school_budget_v580(v_uid,v_course)->>'remaining_attempts')::integer end;")
s=s.replace('return v_base || jsonb_build_object(',"return v_base || private.nh7_school_budget_v580(v_uid,v_course) || jsonb_build_object(")
s=s.replace('v351-hotfix1','v580-cycle');parts.append(s)
s=function(READ,'public.nh7_school_path_state_v351').replace("'classes',jsonb_build_array(","'cycle',private.nh7_school_budget_v580(v_uid,'foundation_school'),\n    'classes',jsonb_build_array(")
parts.append(s)
s=active(function('supabase/migrations/20261009074806_school_snapshot_dual_key_v2110.sql','public.nh7_get_my_school_snapshot_v2110'))
s=s.replace("'progress',coalesce(v_progress,'[]'::jsonb),", "'school_cycle',private.nh7_school_budget_v580(v_uid,'foundation_school'),\n    'progress',coalesce(v_progress,'[]'::jsonb),")
parts.append(s)
parts.append(active(function(SCORE,'private.nh7_assignment_score_for_identity_v128')))
s=active(function(SCORE,'private.nh7_recalculate_exam_scores_identity_v128'))
s=re.sub(r'  for v_attempt in[\s\S]*?  end loop;', '  -- Finalized historical attempts are immutable; only derive the active progress summary.', s, count=1)
s=s.replace("and se.exam_scope='course' and se.course_code=v_course\n  loop", "and se.exam_scope='course' and se.course_code=v_course and not exists(select 1 from private.nh7_school_receipts_v580 r where r.attempt_id=sea.id)\n  loop")
s=s.replace("where p.user_id=p_user_id and p.lesson_code=", "where p.school_cycle=private.nh7_school_cycle_v580(p_user_id,v_course) and p.user_id=p_user_id and p.lesson_code=")
s=s.replace("where lower(trim(p.user_email))=v_email and p.lesson_code=", "where p.school_cycle=private.nh7_school_cycle_v580(p_user_id,v_course) and lower(trim(p.user_email))=v_email and p.lesson_code=")
s=s.replace('insert into public.school_progress(user_email,','insert into public.school_progress(school_cycle,user_email,').replace('values(v_write_email,', 'values(private.nh7_school_cycle_v580(p_user_id,v_course),v_write_email,')
parts.append(s)
# Grade from the exact current server question selector, never trust a client score.
s=active(function(SUB,'public.nh7_submit_school_exam_v340'))
s=s.replace('public.nh7_submit_school_exam_v340(', 'private.nh7_school_grade_v580(').replace('p_answers jsonb\n)', 'p_answers jsonb, p_expected_cycle integer\n)')
s=s.replace("if v_attempts>=v_exam.max_attempts then raise exception 'max_attempts_reached'; end if;", "if private.nh7_school_cycle_v580(v_uid,coalesce(v_exam.course_code,'foundation_school'))<>p_expected_cycle then raise exception 'school_cycle_changed';end if;")
s=s.replace('user_id,exam_id,user_email,user_name,course_code,lesson_code,attempt_number,','school_cycle,user_id,exam_id,user_email,user_name,course_code,lesson_code,attempt_number,').replace('v_uid,v_exam.id,v_write_email,v_name,','p_expected_cycle,v_uid,v_exam.id,v_write_email,v_name,')
s=s.replace('where p.user_id=v_uid and p.lesson_code=', 'where p.school_cycle=p_expected_cycle and p.user_id=v_uid and p.lesson_code=')
s=s.replace('user_id,user_email,user_name,lesson_code,progress_percent,completed_at,exam_id,exam_score,','school_cycle,user_id,user_email,user_name,lesson_code,progress_percent,completed_at,exam_id,exam_score,').replace('v_uid,v_write_email,v_name,v_exam.lesson_code,', 'p_expected_cycle,v_uid,v_write_email,v_name,v_exam.lesson_code,')
# Preserve the narrowly scoped approved-assignment completion bridge from the checkpoint hotfix.
old="""and not exists(
          select 1 from private.nh7_school_progress_active_v580 p
          where p.lesson_code=l.lesson_code
            and (
              p.user_id=v_uid
              or (p.user_id is null and v_email<>'' and lower(trim(p.user_email))=v_email)
            )
            and (p.completed_at is not null or p.progress_percent>=100)
        );"""
new=old.replace('and not exists(', 'and not (exists(',1).replace('        );',"""        ) or (v_course='foundation_school' and coalesce(v_exam.require_assignments_before_exam,false) and exists(select 1 from private.nh7_school_assignments_active_v580 a where a.user_id=v_uid and a.lesson_code=l.lesson_code and a.status='approved')));""")
assert old in s;s=s.replace(old,new);parts.append(s)
# Compile the existing official assignment/progress functions with explicit cycle inputs.
for file,oldname,newname in [
 ('supabase/migrations/20261009163134_school_assignment_submit_identity_v128.sql','public.nh7_submit_school_assignment','private.nh7_school_assignment_v580'),
 ('supabase/migrations/20261009091333_school_progress_identity_save_v340.sql','public.nh7_school_progress_save_v340','private.nh7_school_progress_v580')]:
 s=active(function(file,oldname)).replace(oldname+'(',newname+'(',1)
 mark="p_user_name text default ''\n)" if 'assignment' in newname else 'p_completed_at timestamptz default null\n)'
 assert mark in s;s=s.replace(mark,mark[:-2]+', p_expected_cycle integer default 0\n)')
 if 'assignment' in newname:
  s=s.replace("if v_lesson='' then", "perform private.nh7_school_ensure_cycle_v580(v_uid,v_course);if private.nh7_school_cycle_v580(v_uid,v_course)<>p_expected_cycle then raise exception 'school_cycle_changed';end if;\n  if v_lesson='' then")
  s=s.replace('user_id,user_email,user_name,course_code,lesson_code,answer_text,language,','school_cycle,user_id,user_email,user_name,course_code,lesson_code,answer_text,language,').replace("v_uid,v_write_email,coalesce(p_user_name,''),", "p_expected_cycle,v_uid,v_write_email,coalesce(p_user_name,''),")
 else:
  s=s.replace('v_row public.school_progress;',"v_row public.school_progress; v_course text;")
  s=s.replace("if v_code=''", "select coalesce(course_code,'foundation_school') into v_course from public.school_lessons where lesson_code=v_code limit 1;v_course:=coalesce(v_course,'foundation_school');perform private.nh7_school_ensure_cycle_v580(v_uid,v_course);if private.nh7_school_cycle_v580(v_uid,v_course)<>p_expected_cycle then raise exception 'school_cycle_changed';end if;\n  if v_code=''")
  s=s.replace('where p.user_id=v_uid', 'where p.school_cycle=p_expected_cycle and p.user_id=v_uid')
  s=s.replace('user_email,user_name,lesson_code,progress_percent,completed_at,updated_at','school_cycle,user_email,user_name,lesson_code,progress_percent,completed_at,updated_at').replace('v_email,v_name,v_code,v_progress,','p_expected_cycle,v_email,v_name,v_code,v_progress,')
 parts.append(s)
(REVIEW/'compiled-rpcs.sql').write_text('-- Generated by scripts/build-school-cycle-source-v580.py; never execute against Production without separate approval.\n\n'+'\n\n'.join(parts)+'\n')
compiled=REVIEW/'compiled-rpcs.sql';compiled.write_text('\n'.join(line.rstrip() for line in compiled.read_text().splitlines())+'\n')
print('Compiled',len(parts),'cycle-aware source functions; no database connection')
# One canonical, unapplied executable candidate. No migration is applied by this compiler.
files=['schema.sql','compiled-rpcs.sql','actions.sql','compatibility.sql','report-compatibility.sql','acl.sql']
header="""-- School progression v580: UNAPPLIED; requires explicit Production review/approval.
-- No data UPDATE/DELETE/backfill. Existing rows are generation zero by column default.
-- Activate only after compatible Store/Web client adoption and reviewed preflight.
BEGIN;
DO $preflight$
BEGIN
 IF to_regprocedure('private.nh7_admin_is_owner_v350()') IS NULL OR to_regprocedure('public.nh7_school_access_approved_v230(uuid,text,text)') IS NULL THEN RAISE EXCEPTION 'School authorization prerequisite missing';END IF;
 IF to_regclass('private.nh7_school_cycles_v580') IS NOT NULL THEN RAISE EXCEPTION 'School cycle capability already exists; inspect instead of rerunning';END IF;
END $preflight$;
"""
path=ROOT/'supabase/migrations/20261017130000_school_cycles_and_admin_overrides_v580.sql'
path.write_text(header+'\n\n'.join((REVIEW/f).read_text() for f in files)+'\nCOMMIT;\n')
print('Generated',path.name,'UNAPPLIED')
