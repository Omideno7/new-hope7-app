import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const core=read('supabase/review/issue127/student_identity_candidate.sql');
const legacy=read('supabase/review/issue127/legacy_activity_bridge_candidate.sql');
const wrappers=read('supabase/review/issue127/integration_wrappers_candidate.sql');
const fail=m=>{throw new Error(m)};
const need=(text,s,m)=>{if(!text.includes(s))fail(m||`Missing ${s}`)};

need(legacy,"'legacy_activity'",'legacy provenance missing');
need(legacy,'join auth.users u','legacy activity must bind to Auth user');
need(legacy,'on conflict(user_id) do nothing','legacy identity backfill must be idempotent');
need(legacy,'update public.school_progress','progress durable user bridge missing');
need(legacy,'update public.school_assignments','assignment durable user bridge missing');
need(legacy,'update public.school_exam_attempts','exam durable user bridge missing');

need(wrappers,'public.nh7_school_path_state_v352','one-call School identity wrapper missing');
need(wrappers,"jsonb_build_object('student_identity',v_identity)",'School wrapper must return student_identity');
need(wrappers,'public.nh7_admin_student_academic_center_v543','Academic Center identity wrapper missing');
need(wrappers,'left join lateral','Academic Center identity lookup must be row-safe');
need(wrappers,'left join auth.users u on u.id=i.user_id','Academic Center identity lookup must support current Auth email');
need(wrappers,"lower(trim(coalesce(u.email,'')))=lower(trim(r->>'email'))",'Academic Center identity lookup must match current Auth email');

need(wrappers,'public.nh7_admin_student_academic_center_v542(p_inactive_days)','must preserve optimized existing Academic Center');
need(wrappers,"'student_code',i.student_code",'Admin rows must include Student Code');
need(wrappers,'public.nh7_admin_student_profile_v452','individual Admin identity profile missing');
need(wrappers,'public.nh7_is_admin()','Admin wrappers must enforce admin authorization');

for(const [name,text] of [['core',core],['legacy',legacy],['wrappers',wrappers]]){
  if(/\bdrop\s+table\b/i.test(text))fail(`${name} candidate drops a table`);
  if(/\btruncate\b/i.test(text))fail(`${name} candidate truncates data`);
  if(/\bdelete\s+from\b/i.test(text))fail(`${name} candidate deletes historical data`);
}

// No per-row client request design: the batch School/Admin responses are enriched
// server-side. These wrappers should call the prior batch RPC once, not loop RPCs.
const rpcCallMatches=wrappers.match(/nh7_admin_student_academic_center_v542\(/g)||[];
if(rpcCallMatches.length!==1)fail('Academic Center wrapper should call v542 exactly once');

console.log('Issue #127 identity integration contract OK');
