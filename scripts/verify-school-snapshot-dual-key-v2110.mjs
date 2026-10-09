import fs from 'node:fs';
const path='supabase/migrations/20261009074537_school_snapshot_dual_key_v2110.sql';
const sql=fs.readFileSync(path,'utf8');
const need=(s,msg)=>{if(!sql.includes(s))throw new Error(msg)};
const forbid=(r,msg)=>{if(r.test(sql))throw new Error(msg)};

need('create or replace function public.nh7_get_my_school_snapshot_v2110()','snapshot RPC replacement missing');
need("set search_path=''",'snapshot RPC search_path must be empty');
need('v_uid uuid:=(select auth.uid())','stable Auth user ID missing');
need('p.user_id=v_uid','progress user_id ownership missing');
need('a.user_id=v_uid','assignment user_id ownership missing');
need('p.user_id is null','progress fenced email fallback missing');
need('a.user_id is null','assignment fenced email fallback missing');
need("'progress',coalesce(v_progress,'[]'::jsonb)",'progress JSON contract missing');
need("'assignments',coalesce(v_assignments,'[]'::jsonb)",'assignment JSON contract missing');
need('revoke all on function public.nh7_get_my_school_snapshot_v2110()','ACL reset missing');
need('grant execute on function public.nh7_get_my_school_snapshot_v2110()','authenticated execute grant missing');
need('do $postflight$','postflight missing');

forbid(/\b(?:insert\s+into|update\s+public\.|delete\s+from|truncate)\b/i,'Wave 1E must not mutate table data');
forbid(/alter\s+(?:table|policy)\b/i,'Wave 1E must not alter tables or RLS policies');
forbid(/school_certificates/i,'Wave 1E must not touch certificates');
forbid(/school_student_identities/i,'Wave 1E must not touch Student Identity Core');

const replacements=[...sql.matchAll(/create or replace function public\.nh7_get_my_school_snapshot_v2110\(\)/gi)];
if(replacements.length!==1) throw new Error(`expected exactly one snapshot replacement, found ${replacements.length}`);

console.log('School Snapshot Dual-Key v2110 verifier: PASS');
console.log('Scope: one active snapshot RPC only; JSON contract preserved; data/schema/RLS untouched');
