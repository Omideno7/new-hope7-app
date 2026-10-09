import fs from 'node:fs';
const path='supabase/migrations/20261009071217_school_activity_user_id_bridge_v128.sql';
const sql=fs.readFileSync(path,'utf8');
const need=(s,msg)=>{if(!sql.includes(s))throw new Error(msg)};
const forbid=(r,msg)=>{if(r.test(sql))throw new Error(msg)};

need('do $preflight$','fail-closed preflight missing');
need('alter table public.school_progress add column user_id uuid','progress user_id missing');
need('alter table public.school_assignments add column user_id uuid','assignment user_id missing');
need('alter table public.school_exam_attempts add column user_id uuid','exam user_id missing');
need('private.nh7_school_activity_user_id_guard_v128','future-write guard missing');
need("set search_path=''",'guard search_path must be pinned');
need('new.user_id:=v_resolved','client-supplied user_id must be overridden');
need('old.user_id is not null','existing user_id immutability guard missing');
need('do $postflight$','fail-closed postflight missing');
need("notify pgrst, 'reload schema'",'PostgREST schema refresh missing');

forbid(/\bdelete\s+from\b/i,'Wave 1B must not delete user data');
forbid(/\bdrop\s+(?:table|column)\b/i,'Wave 1B must not drop tables or columns');
forbid(/\btruncate\b/i,'Wave 1B must not truncate data');
forbid(/alter\s+table\s+public\.school_student_identities/i,'Wave 1B must not alter Student Identity Core');
forbid(/(?:insert\s+into|update)\s+public\.school_student_identities/i,'Wave 1B must not write Student Identity rows');
forbid(/public\.school_certificates/i,'Wave 1B must not touch certificates');
forbid(/\b(?:create|alter|drop)\s+policy\b/i,'Wave 1B must not change RLS policies');
forbid(/\bdrop\s+column\s+user_email\b/i,'legacy email identity must remain');

const addCols=[...sql.matchAll(/alter table public\.(school_progress|school_assignments|school_exam_attempts) add column user_id uuid;/g)];
if(addCols.length!==3) throw new Error(`expected exactly 3 user_id columns, found ${addCols.length}`);
const triggers=[...sql.matchAll(/create trigger nh7_school_(?:progress|assignments|exam_attempts)_user_id_guard_v128/g)];
if(triggers.length!==3) throw new Error(`expected exactly 3 guard triggers, found ${triggers.length}`);

console.log('School Activity User ID Bridge v128 verifier: PASS');
console.log('Scope: progress + assignments + exam attempts only; email/RLS/certificates/identity core preserved');
