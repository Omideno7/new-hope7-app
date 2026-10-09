import fs from 'node:fs';
const path='supabase/migrations/20261009064545_school_student_identity_foundation_v127.sql';
const sql=fs.readFileSync(path,'utf8');
const need=(s,msg)=>{if(!sql.includes(s))throw new Error(msg)};
const forbid=(r,msg)=>{if(r.test(sql))throw new Error(msg)};

need('DO $preflight$','fail-closed preflight missing');
need('create sequence if not exists public.school_student_code_seq','Student Code sequence missing');
need('create table if not exists public.school_student_identities','identity table missing');
need("identity_source text not null default 'approved_registration'",'identity provenance missing');
need("'legacy_activity'",'legacy identity bridge missing');
need('private.nh7_sync_student_identity_v127','future approval sync missing');
need("identity_source='approved_registration'",'legacy-to-approved promotion missing');
need('public.nh7_my_student_identity_v127()','caller-safe identity RPC missing');
need('public.nh7_admin_student_identity_search_v127','Admin identity search missing');
need('alter table public.school_progress add column if not exists user_id uuid','progress user bridge missing');
need('alter table public.school_assignments add column if not exists user_id uuid','assignment user bridge missing');
need('alter table public.school_exam_attempts add column if not exists user_id uuid','exam user bridge missing');
need('public.nh7_school_path_state_v352()','School path identity wrapper missing');
need('public.nh7_admin_student_academic_center_v543','Academic Center identity wrapper missing');
need('left join lateral','current-email-safe row lookup missing');
need('left join auth.users u on u.id=i.user_id','current Auth email lookup missing');
need('public.nh7_admin_student_profile_v452','individual Admin identity wrapper missing');
need('public.nh7_set_my_student_photo_v127','private Student photo setter missing');
need('public.nh7_my_student_identity_v128()','private-path identity RPC missing');
need("(storage.foldername(name))[1]='student-photos'",'Student photo folder fence missing');
need("(storage.foldername(name))[2]=(select auth.uid())::text",'Student photo UID fence missing');
need('DO $postflight$','fail-closed postflight missing');
need("has_table_privilege('anon','public.school_student_identities','select')",'direct table ACL assertion missing');
need("to_regprocedure('public.nh7_public_certificate_verify_v127(uuid)') is not null",'out-of-scope public verifier assertion missing');
need("notify pgrst, 'reload schema'",'PostgREST schema refresh missing');

forbid(/create\s+(?:table|or\s+replace\s+function)[^;]*(?:school_courses|course_studio|course_grant|credential_delivery)/is,'multi-course/Course Studio/credential backend leaked into Foundation migration');
forbid(/create\s+or\s+replace\s+function\s+public\.nh7_public_certificate_verify_v127/i,'public certificate verifier must remain deferred');
forbid(/\bdelete\s+from\b/i,'Foundation migration must not delete user data');
forbid(/\bdrop\s+table\b/i,'Foundation migration must not drop tables');
forbid(/\btruncate\b/i,'Foundation migration must not truncate data');

console.log('School Student Identity Foundation migration v127: PASS');
