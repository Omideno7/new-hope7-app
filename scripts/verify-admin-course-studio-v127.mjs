import fs from 'node:fs';
const sql=fs.readFileSync('supabase/review/issue127/admin_course_studio_candidate.sql','utf8');
const fail=m=>{throw new Error(m)};
const need=(s,m)=>{if(!sql.includes(s))fail(m||`Missing ${s}`)};

need('REVIEW CANDIDATE ONLY','Course Studio candidate must stay review-only');
need('public.nh7_admin_course_studio_snapshot_v127','snapshot RPC missing');
need('public.nh7_admin_upsert_course_v127','course upsert missing');
need('public.nh7_admin_archive_course_v127','course archive missing');
need('public.nh7_admin_upsert_course_stage_v127','stage upsert missing');
need('public.nh7_admin_archive_course_stage_v127','stage archive missing');
need('public.nh7_admin_upsert_course_lesson_v127','lesson upsert missing');
need('public.nh7_admin_archive_course_lesson_v127','lesson archive missing');
need('public.nh7_admin_set_course_prerequisite_v127','prerequisite editor missing');
need('public.nh7_admin_course_grants_v127','grant lookup missing');
need("foundation_course_cannot_be_archived_here",'Foundation archive protection missing');
need("requires_manual_grant",'manual grant course setting missing');
need("'student_code',i.student_code",'grant lookup must expose Student ID to Admin');
need('private.nh7_course_passed_v127','grant lookup must evaluate prerequisite completion');

const adminFns=(sql.match(/create or replace function public\.nh7_admin_[\s\S]*?\$\$;/g)||[]);
if(adminFns.length<8)fail('Expected full Admin RPC surface');
for(const fn of adminFns){
  if(!fn.includes('nh7_is_admin()'))fail('An Admin RPC is missing server-side admin authorization');
}

for(const forbidden of [/\bdrop\s+table\b/i,/\btruncate\b/i]) if(forbidden.test(sql))fail(`Destructive SQL found: ${forbidden}`);
for(const table of ['school_progress','school_assignments','school_exam_attempts','school_certificates','school_student_identities']){
  const re=new RegExp(`delete\\s+from\\s+public\\.${table}`,'i');
  if(re.test(sql))fail(`Course Studio must not delete academic/student history: ${table}`);
}

// Relationship removal is intentionally limited to course prerequisite config.
const deletes=[...sql.matchAll(/delete\s+from\s+public\.([a-z0-9_]+)/ig)].map(x=>x[1]);
if(deletes.some(t=>t!=='school_course_prerequisites'))fail(`Unexpected DELETE target(s): ${deletes.join(',')}`);

if(!sql.includes("publish_state='archived',is_active=false"))fail('Course archival must be non-destructive');
if(!sql.includes("is_active=false,publish_state='archived'"))fail('Lesson archival must be non-destructive');

console.log('Issue #127 Admin Course Studio contract OK');
