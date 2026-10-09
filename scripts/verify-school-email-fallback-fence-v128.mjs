import fs from 'node:fs';
const path='supabase/migrations/20261009073345_school_email_fallback_fence_v128.sql';
const sql=fs.readFileSync(path,'utf8');
const need=(s,msg)=>{if(!sql.includes(s))throw new Error(msg)};
const forbid=(r,msg)=>{if(r.test(sql))throw new Error(msg)};

need('do $preflight$','preflight missing');
need('user_id is null','unbound-row email fallback fence missing');
need('user_id = (select auth.uid())','stable user ownership missing');
need("lower(user_email) = lower(coalesce((select auth.jwt()) ->> 'email',''))",'legacy email fallback missing');
need("lesson_code not like 'course:%'",'progress course restriction missing');
need('final_score_percent is null','progress final score restriction missing');
need('do $postflight$','postflight missing');

forbid(/\b(?:insert\s+into|update\s+public\.|delete\s+from|truncate)\b/i,'Wave 1D must not mutate table data');
forbid(/\b(?:create|drop)\s+policy\b/i,'Wave 1D must ALTER existing policies only');
forbid(/alter\s+table\b/i,'Wave 1D must not alter table schema');
forbid(/school_certificates/i,'Wave 1D must not touch certificates');
forbid(/school_student_identities/i,'Wave 1D must not touch Student Identity Core');

const alters=[...sql.matchAll(/alter policy /gi)];
if(alters.length!==5) throw new Error(`expected exactly 5 ALTER POLICY statements, found ${alters.length}`);
const fences=[...sql.matchAll(/user_id is null/g)];
if(fences.length<5) throw new Error(`expected fenced fallback in all policy paths, found ${fences.length}`);

console.log('School Email Fallback Fence v128 verifier: PASS');
console.log('Scope: 5 existing School policies only; email fallback limited to unbound rows');
