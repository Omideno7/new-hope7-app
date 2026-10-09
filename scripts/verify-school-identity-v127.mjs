import fs from 'node:fs';

const file='supabase/review/issue127/student_identity_candidate.sql';
const sql=fs.readFileSync(file,'utf8');
const fail=m=>{throw new Error(m)};
const need=(s,m)=>{if(!sql.includes(s))fail(m||`Missing ${s}`)};

need('REVIEW CANDIDATE ONLY','candidate must be explicitly non-production');
need('create table if not exists public.school_student_identities','identity table missing');
need('user_id uuid unique','durable user identity uniqueness missing');
need('student_code text not null unique','student code uniqueness missing');
need("'^NH7-[0-9]{4,}$'",'student code format guard missing');
need('alter table public.school_student_identities enable row level security','RLS missing');
need('revoke all on public.school_student_identities from public, anon, authenticated','direct client table access must be revoked');
need('on conflict (user_id) do nothing','existing-student backfill must be idempotent');
need('private.nh7_sync_student_identity_v127','registration sync trigger missing');
need('public.nh7_my_student_identity_v127','caller-safe identity RPC missing');
need('where i.user_id=v_uid','caller RPC must be bound to auth.uid()');
need('public.nh7_admin_student_identity_search_v127','admin search RPC missing');
need('public.nh7_is_admin()','admin authorization check missing');
need('alter table public.school_progress add column if not exists user_id uuid','progress user_id bridge missing');
need('alter table public.school_assignments add column if not exists user_id uuid','assignment user_id bridge missing');
need('alter table public.school_exam_attempts add column if not exists user_id uuid','exam user_id bridge missing');
need('alter table public.school_certificates add column if not exists recipient_user_id uuid','certificate recipient binding missing');
need('alter table public.school_certificates add column if not exists student_code text','certificate student-code snapshot missing');
need('public.nh7_public_certificate_verify_v127','safe public verifier missing');

const verifierStart=sql.indexOf('create or replace function public.nh7_public_certificate_verify_v127');
const verifierEnd=sql.indexOf('-- IMPORTANT: Do not retire',verifierStart);
if(verifierStart<0||verifierEnd<0)fail('Unable to isolate public verifier');
const verifier=sql.slice(verifierStart,verifierEnd).toLowerCase();

for(const forbidden of [
  "'user_name'",
  "'student_code'",
  "'user_email'",
  "'recipient_user_id'",
  "'photo_url'",
  "'photo_path'",
  "'final_score_percent'",
  "'pdf_url'",
  "'preview_url'",
  "'body_fa'",
  "'body_en'",
  "'body_hr'"
]){
  if(verifier.includes(forbidden))fail(`Public verifier exposes forbidden field ${forbidden}`);
}

for(const required of [
  "'verification_status'",
  "'certificate_number'",
  "'certificate_type'",
  "'issue_date'",
  "'issuer'",
  "'document_version'"
]) if(!verifier.includes(required))fail(`Public verifier missing allow-listed field ${required}`);

if(/\bdrop\s+table\b/i.test(sql))fail('Candidate must not drop tables');
if(/\btruncate\b/i.test(sql))fail('Candidate must not truncate data');
if(/\bdelete\s+from\b/i.test(sql))fail('Candidate must not delete historical rows');
if(/service[_-]?role/i.test(verifier))fail('Public verifier must not mention/use service role');

console.log('Issue #127 Wave-1 SQL contract OK');
