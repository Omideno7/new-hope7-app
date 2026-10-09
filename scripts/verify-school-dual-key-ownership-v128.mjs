import fs from 'node:fs';
const path='supabase/migrations/20261009072252_school_dual_key_ownership_v128.sql';
const sql=fs.readFileSync(path,'utf8');
const need=(s,msg)=>{if(!sql.includes(s))throw new Error(msg)};
const forbid=(r,msg)=>{if(r.test(sql))throw new Error(msg)};

need('do $preflight$','preflight missing');
need('alter policy "school assignments own or admin read"','assignment read policy missing');
need('alter policy "school exam attempts own or admin read"','exam read policy missing');
need('alter policy "NH7 school progress own or admin select"','progress read policy missing');
need('alter policy "NH7 school progress safe lesson insert v340"','progress insert policy missing');
need('alter policy "NH7 school progress safe lesson update v340"','progress update policy missing');
need('user_id = (select auth.uid())','stable user_id ownership missing');
need("lower(user_email) = lower(coalesce((select auth.jwt()) ->> 'email',''))",'legacy email fallback missing');
need("lesson_code not like 'course:%'",'course pseudo-row restriction missing');
need('final_score_percent is null','final score write restriction missing');
need('do $postflight$','postflight missing');

forbid(/\b(?:insert\s+into|update\s+public\.|delete\s+from|truncate)\b/i,'Wave 1C must not mutate table data');
forbid(/\b(?:create|drop)\s+policy\b/i,'Wave 1C must ALTER existing policies only');
forbid(/alter\s+table\b/i,'Wave 1C must not alter table schema');
forbid(/school_student_identities\s+(?:set|add|drop|alter|update|insert)/i,'Wave 1C must not change Student Identity Core');
forbid(/school_certificates/i,'Wave 1C must not touch certificates');

const alters=[...sql.matchAll(/alter policy /gi)];
if(alters.length!==5) throw new Error(`expected exactly 5 ALTER POLICY statements, found ${alters.length}`);
const uid=[...sql.matchAll(/user_id = \(select auth\.uid\(\)\)/g)];
if(uid.length<5) throw new Error(`expected user_id ownership in all policy paths, found ${uid.length}`);

console.log('School Dual-Key Ownership v128 verifier: PASS');
console.log('Scope: 5 existing School policies only; user_id primary + legacy email fallback preserved');
