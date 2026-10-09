import fs from 'node:fs';
const file='supabase/review/issue127/multi_course_candidate.sql';
const sql=fs.readFileSync(file,'utf8');
const fail=m=>{throw new Error(m)};
const need=(s,m)=>{if(!sql.includes(s))fail(m||`Missing ${s}`)};

need('REVIEW CANDIDATE ONLY','candidate must remain review-only');
need('alter table public.school_lessons\n  add column if not exists course_code text','lessons must become course-aware');
need('alter table public.school_progress\n  add column if not exists course_code text','progress must become course-aware');
need("content_data#>>'{course,code}'",'existing lesson course backfill missing');
need('create table if not exists public.school_course_stages','generic course stages missing');
need('create table if not exists public.school_course_stage_lessons','stage-to-lesson mapping missing');
need('create table if not exists public.school_course_prerequisites','prerequisite table missing');
need('create table if not exists public.school_course_access_grants','manual grant table missing');
need('requires_manual_grant boolean not null default false','course manual grant setting missing');
need('private.nh7_course_passed_v127','server completion helper missing');
need('private.nh7_course_access_state_v127','server access helper missing');
need("'reason','prerequisite_required'",'prerequisite lock state missing');
need("'reason','ministry_grant_required'",'manual ministry grant lock state missing');
need('public.nh7_my_school_courses_v127','caller course catalog missing');
need('public.nh7_admin_set_course_access_v127','Admin grant/revoke RPC missing');
need('public.nh7_is_admin()','Admin grant authorization missing');
need("('foundation_school','class_04','class_04a_evangelism',1)",'Foundation class 4 lesson A mapping missing');
need("('foundation_school','class_04','class_04b_cell_ministry',2)",'Foundation class 4 lesson B mapping missing');

for(const forbidden of [/\bdrop\s+table\b/i,/\btruncate\b/i,/\bdelete\s+from\b/i]){
  if(forbidden.test(sql))fail(`Destructive SQL found: ${forbidden}`);
}

const accessStart=sql.indexOf('create or replace function private.nh7_course_access_state_v127');
const accessEnd=sql.indexOf('-- ---------------------------------------------------------------------------\n-- 6.',accessStart);
if(accessStart<0||accessEnd<0)fail('Unable to isolate course access function');
const access=sql.slice(accessStart,accessEnd);
if(access.indexOf('v_prereq_passed<v_prereq_total')<0)fail('Access does not enforce prerequisite completion');
if(access.indexOf('if v_course.requires_manual_grant then')<0)fail('Access does not enforce manual grant setting');
if(access.indexOf("g.status='granted'")<0)fail('Access does not require active grant');
if(access.indexOf("'can_open',true") < access.indexOf('if v_course.requires_manual_grant then'))fail('can_open=true appears before manual grant gate');

console.log('Issue #127 multi-course contract OK');
