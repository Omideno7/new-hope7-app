import fs from 'node:fs';
import path from 'node:path';
const dir='supabase/migrations';
const files=fs.readdirSync(dir).filter(x=>x.endsWith('_school_exam_scoring_identity_v128.sql')).sort();
if(files.length!==1) throw new Error(`expected one Wave 1H-B1 migration, found ${files.length}`);
const file=path.join(dir,files[0]);
const sql=fs.readFileSync(file,'utf8');
const low=sql.toLowerCase();
const need=(s,msg)=>{if(!low.includes(s.toLowerCase())) throw new Error(msg)};
need('create or replace function private.nh7_assignment_score_for_identity_v128','identity assignment score helper missing');
need('create or replace function private.nh7_recalculate_exam_scores_identity_v128','identity exam recalculation helper missing');
need('create or replace function public.nh7_assignment_recalculate_trigger','assignment trigger replacement missing');
need('a.user_id=p_user_id','assignment UID ownership missing');
need('sea.user_id=p_user_id','exam UID ownership missing');
need('p.user_id=p_user_id','progress UID update missing');
need('a.user_id is null','assignment legacy fallback not fenced to unbound rows');
need('sea.user_id is null','exam legacy fallback not fenced to unbound rows');
need('pg_advisory_xact_lock','identity recalculation lock missing');
need('from auth.users u where u.id=p_user_id','current Auth email resolution missing');
need('private.nh7_recalculate_exam_scores_identity_v128(','assignment trigger is not wired to identity helper');
need("set search_path=''",'empty search_path hardening missing');
need('revoke all on function private.nh7_assignment_score_for_identity_v128','private score ACL revoke missing');
need('revoke all on function private.nh7_recalculate_exam_scores_identity_v128','private recalc ACL revoke missing');
for(const re of [
  /^\s*alter\s+table\s+/mi,
  /^\s*create\s+table\s+/mi,
  /^\s*drop\s+table\s+/mi,
  /^\s*create\s+policy\s+/mi,
  /^\s*alter\s+policy\s+/mi,
  /create\s+or\s+replace\s+function\s+public\.nh7_submit_school_/i,
  /create\s+or\s+replace\s+function\s+public\.nh7_school_(?:exam_session|class_exam_session|final_exam_session|path_state)/i,
  /storage\.objects/i,
  /school_certificates/i
]) if(re.test(sql)) throw new Error(`forbidden Wave 1H-B1 scope matched: ${re}`);
console.log(`School Exam Scoring Identity v128 verifier: PASS (${files[0]})`);
console.log('Scope: private identity scoring/recalc + assignment trigger only; submit/read RPCs, tables, RLS, Storage, certificates untouched');
