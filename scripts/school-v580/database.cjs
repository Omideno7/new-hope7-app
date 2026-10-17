/* Isolated synthetic PostgreSQL only; no network or Production connection. */
const fs=require('node:fs'),{PGlite}=require('@electric-sql/pglite');
const OWNER='00000000-0000-0000-0000-000000000001',A='00000000-0000-0000-0000-000000000002',B='00000000-0000-0000-0000-000000000003',DELEGATE='00000000-0000-0000-0000-000000000004';
const read=p=>fs.readFileSync(p,'utf8');
const definition=(file,name)=>{const s=read(file),at=s.indexOf('create or replace function '+name+'(');if(at<0)throw Error(name);return s.slice(at,s.indexOf('$function$;',at)+11)};
async function database(){const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create schema private;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
create function private.nh7_admin_is_owner_v350() returns boolean language sql stable as $$select auth.uid()='${OWNER}'::uuid$$;
create function public.nh7_admin_is_admin_v170() returns boolean language sql stable as $$select private.nh7_admin_is_owner_v350()$$;
create table public.registrations(id uuid primary key,payload jsonb);
create table public.school_student_identities(user_id uuid,student_code text,status text,source_registration_id uuid);
create table public.school_lessons(lesson_code text primary key,course_code text default 'foundation_school',lesson_order integer,content_data jsonb,is_active boolean default true);
create table public.school_legacy_progress_v542(user_email text,completed_through_class integer,is_legacy_graduate boolean);
create table public.school_course_stages(course_code text,stage_code text,stage_order integer,is_active boolean default true);create table public.school_course_stage_lessons(course_code text,stage_code text,lesson_code text);
create function public.nh7_school_access_approved_v230(p_uid uuid,p_email text,p_device text) returns boolean language sql stable security definer set search_path='' as $$select p_uid is not null and exists(select 1 from public.school_student_identities where user_id=p_uid and status='active')$$;
create function public.nh7_assignment_unit_key(p_code text) returns text language sql immutable as $$select coalesce(substring(p_code from '^(class_[0-9]+)'),p_code)$$;
grant usage on schema auth to authenticated,anon;grant execute on function auth.uid(),auth.jwt() to authenticated,anon;`);
const v19=read('supabase_v1_9_0_school_exams_progress.sql'),v21=read('supabase_v2_1_1_exam_assignments_weighted.sql');
for(const [s,name]of [[v19,'school_exams'],[v19,'school_progress'],[v21,'school_assignments'],[v21,'school_exam_attempts']]){const m=s.match(new RegExp('create table if not exists public\\.'+name+' \\([\\s\\S]*?\\n\\);'));if(!m)throw Error(name);await db.exec(m[0])}
await db.exec(v21.split('\n').filter(l=>/^alter table public\.school_(exams|progress|exam_attempts) add column/.test(l)).join('\n'));
for(const t of ['school_progress','school_assignments','school_exam_attempts'])await db.exec(`alter table public.${t} add column user_id uuid;alter table public.${t} enable row level security;grant select on public.${t} to authenticated;create policy own_read on public.${t} for select to authenticated using(user_id=auth.uid());`);
await db.exec(definition('supabase/migrations/20261009071217_school_activity_user_id_bridge_v128.sql','private.nh7_school_activity_user_id_guard_v128'));
for(const t of ['school_progress','school_assignments','school_exam_attempts'])await db.exec(`create trigger identity_guard before insert or update on public.${t} for each row execute function private.nh7_school_activity_user_id_guard_v128()`);
for(const [uid,email]of [[OWNER,'owner@example.invalid'],[A,'a@example.invalid'],[B,'b@example.invalid'],[DELEGATE,'delegate@example.invalid']])await db.query('insert into auth.users(id,email) values($1,$2)',[uid,email]);
for(const [uid,code]of [[A,'S-A'],[B,'S-B']])await db.query("insert into school_student_identities(user_id,student_code,status) values($1,$2,'active')",[uid,code]);
const lessons=['class_01_new_creation','class_02_holy_spirit','class_03_christian_doctrine','class_04a_evangelism','class_04b_cell_ministry','class_05_character_prosperity','class_06_local_assembly','class_07_mobile_technology'];
for(let i=0;i<lessons.length;i++)await db.query('insert into school_lessons(lesson_code,lesson_order,content_data) values($1,$2,$3)',[lessons[i],i+1,{course:{code:'foundation_school'},translations:{en:{assignment_question:'Explain this lesson.'}}}]);
for(const lesson of lessons)await db.query("insert into school_course_stage_lessons values('foundation_school',$1,$2)",[lesson.slice(0,8),lesson]);
const exams=[];
for(let n=1;n<=7;n++){const stage='class_'+String(n).padStart(2,'0');await db.query("insert into school_course_stages(course_code,stage_code,stage_order) values('foundation_school',$1,$2)",[stage,n]);const r=await db.query("insert into school_exams(lesson_code,exam_scope,course_code,questions,passing_score,max_attempts) values($1,'class','foundation_school',$2,70,3) returning id",['class_exam:'+stage,[{question:{fa:'پرسش',en:'Question',hr:'Pitanje'},options:[{en:'Right'},{en:'Wrong'}],correct:0}]]);exams.push(r.rows[0].id)}
const f=await db.query("insert into school_exams(lesson_code,exam_scope,course_code,questions,passing_score,exam_weight,assignment_weight,require_assignments_before_exam,require_course_completion) values('course:foundation_school','course','foundation_school',$1,70,70,30,true,true) returning id",[[{question:{en:'Final'},options:[{en:'Right'},{en:'Wrong'}],correct:0}]]);
await db.exec(`create function public.nh7_admin_student_profile_v238(p_email text) returns jsonb language sql as $$select jsonb_build_object('identity','preserved','school',jsonb_build_object('registration',jsonb_build_object('status','approved')),'activity',jsonb_build_object('untouched',true))$$;create function public.nh7_admin_student_profile_v451(p_email text) returns jsonb language sql as $$select public.nh7_admin_student_profile_v238(p_email)$$;create function public.nh7_admin_student_profile_v452(p_email text) returns jsonb language sql as $$select public.nh7_admin_student_profile_v451(p_email)||jsonb_build_object('student_identity','preserved')$$;create function public.nh7_admin_student_academic_center_v543(p_inactive_days integer default 30) returns jsonb language sql as $$select jsonb_build_object('summary',jsonb_build_object('non_school_metric',123),'rows',jsonb_build_array(jsonb_build_object('email','a@example.invalid','total_lessons',8,'graduated',true,'course_completed',true,'display_name','Preserved A')))$$;`);
try{await db.exec(read('supabase/migrations/20261017130000_school_cycles_and_admin_overrides_v580.sql'))}catch(e){throw Error('migration: '+e.message,{cause:e})}
await db.exec(definition('supabase/migrations/20261009130632_school_exam_scoring_identity_v128.sql','public.nh7_assignment_recalculate_trigger'));
await db.exec('create trigger recalculate_fixture after insert or update or delete on school_assignments for each row execute function public.nh7_assignment_recalculate_trigger()');
async function actor(uid){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid||'']);const u=uid?(await db.query('select email from auth.users where id=$1',[uid])).rows[0]:null;await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:uid,email:u?.email||'',user_metadata:{full_name:'Synthetic student'}})]);await db.exec('set role '+(uid?'authenticated':'anon'))}
async function rpc(uid,name,args=[]){await actor(uid);const slots=args.map((_,i)=>'$'+(i+1)).join(',');const r=await db.query('select to_jsonb(public.'+name+'('+slots+')) as value',args);return r.rows[0].value}
return{db,actor,rpc,exams,final:f.rows[0].id,lessons,OWNER,A,B,DELEGATE};}
module.exports={database,OWNER,A,B,DELEGATE};
