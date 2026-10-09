import fs from 'node:fs';
import path from 'node:path';
const dir='supabase/migrations';
const files=fs.readdirSync(dir).filter(x=>x.endsWith('_school_exam_read_identity_v351.sql')).sort();
if(files.length!==1) throw new Error(`expected one Wave 1H-A migration, found ${files.length}`);
const file=path.join(dir,files[0]);
const sql=fs.readFileSync(file,'utf8');
const low=sql.toLowerCase();
const need=(s,msg)=>{if(!low.includes(s.toLowerCase())) throw new Error(msg)};
const count=(s)=>(low.match(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length;
for(const fn of ['nh7_school_exam_session_v340','nh7_school_class_exam_session_v351','nh7_school_final_exam_session_v351','nh7_school_path_state_v351']) need(`create or replace function public.${fn}`,`missing ${fn}`);
if(count("set search_path=''" )!==4) throw new Error('all four Wave 1H-A RPCs must pin empty search_path');
need('a.user_id=v_uid','exam attempt reads are not user_id-first');
need('p.user_id=v_uid','progress reads are not user_id-first');
need('a.user_id is null','legacy exam/assignment fallback is not fenced to unbound rows');
need('p.user_id is null','legacy progress fallback is not fenced to unbound rows');
need('source_registration_id','canonical registration-email lookup missing');
need('v_seed_email','stable exam shuffle seed missing');
need("lower(trim(user_email))=v_legacy_email",'legacy anchor is not using canonical registration email');
need("'_nh7_secure_server_scoring'",'secure exam JSON contract marker missing');
need("'path_version','v351-hotfix1'",'v351 path contract marker missing');
need("'classes',jsonb_build_array",'path-state classes contract missing');
need("'final',public.nh7_school_final_exam_session_v351",'path-state final contract missing');
for(const sig of ['nh7_school_path_state_v351()','nh7_school_exam_session_v340(text,text)','nh7_school_class_exam_session_v351(text)','nh7_school_final_exam_session_v351(text)']){
  need(`revoke all on function public.${sig} from public,anon,authenticated,service_role`,`${sig} revoke missing`);
  need(`grant execute on function public.${sig} to authenticated,service_role`,`${sig} authenticated/service grant missing`);
}
for(const forbidden of [
  /^\s*insert\s+into\s+/mi,/^\s*update\s+public\./mi,/^\s*delete\s+from\s+/mi,/^\s*alter\s+table\s+/mi,
  /^\s*create\s+table\s+/mi,/^\s*drop\s+table\s+/mi,/^\s*create\s+policy\s+/mi,/^\s*alter\s+policy\s+/mi,
  /create\s+or\s+replace\s+function\s+public\.nh7_submit_school_/i
]) if(forbidden.test(sql)) throw new Error(`forbidden Wave 1H-A scope matched: ${forbidden}`);
console.log(`School Exam Read Identity v351 verifier: PASS (${files[0]})`);
console.log('Scope: 4 read/session RPCs only; durable user_id primary, legacy unbound-email fallback, scoring/data/RLS untouched');
