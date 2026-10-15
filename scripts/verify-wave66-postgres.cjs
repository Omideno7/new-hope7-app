/* Local PostgreSQL WASM only. No network client, credentials, Production or real rows. */
const {PGlite}=require('@electric-sql/pglite'),fs=require('node:fs'),assert=require('node:assert/strict');
const root='supabase/review/wave6_6-live-security/',contract=JSON.parse(fs.readFileSync(root+'library-live-contract.json')).views;
const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
function template(name){return fs.readFileSync(root+name,'utf8').split('-- FIXTURE-SQL-BEGIN\n')[1].split('-- FIXTURE-SQL-END')[0]}
(async()=>{const db=new PGlite(),q=(s,p)=>db.query(s,p);const denied=async(s,p)=>assert.rejects(q(s,p));
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema private;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('email','fixture@example.test')$$;
create table private.flags(uid uuid primary key,approved boolean,admin boolean);
create table private.grants(uid uuid,scope text,resource uuid);
create function public.nh7_is_admin() returns boolean language sql stable security definer set search_path='' as $$select coalesce((select admin from private.flags where uid=auth.uid()),false)$$;
create function public.nh7_content_access_active_v251(p_uid uuid,p_scope text,p_resource uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from private.grants where uid=p_uid and scope=p_scope and resource=p_resource)$$;
create function public.nh7_school_access_approved_v230(p_uid uuid,p_email text,p_device text) returns boolean language sql stable security definer set search_path='' as $$select coalesce((select approved from private.flags where uid=p_uid),false)$$;
revoke all on schema private from public,anon,authenticated;
create table nh7_library_items(${contract[0].columns.filter(c=>!['reader_available'].includes(c[0])).map(c=>c.join(' ')).join(',')},is_active boolean,is_published boolean);
alter table nh7_library_items add primary key(id);
create table nh7_library_collections_v322(${contract[2].columns.filter(c=>c[0]!=='item_count').map(c=>c.join(' ')).join(',')},is_active boolean,created_at timestamptz);
alter table nh7_library_collections_v322 add primary key(id);
alter table nh7_library_items enable row level security;alter table nh7_library_collections_v322 enable row level security;
revoke all on nh7_library_items,nh7_library_collections_v322 from public,anon,authenticated;
insert into private.flags values('${uuid(1)}',false,false),('${uuid(2)}',true,false),('${uuid(3)}',false,false),('${uuid(4)}',true,false),('${uuid(5)}',true,true);
insert into private.grants values('${uuid(3)}','library_item','${uuid(20)}'),('${uuid(3)}','library_collection','${uuid(11)}');`);
for(const [id,audience] of [[10,'public'],[11,'ministers'],[12,'public']])await q('insert into nh7_library_collections_v322(id,slug,audience,is_active,sort_order,created_at) values($1,$2,$3,$4,1,now())',[uuid(id),'collection-'+id,audience,id!==12]);
for(const [id,audience,active,published,collection,mode,status,type]of [[19,'public',true,true,10,'both','ready','library'],[20,'ministers',true,true,11,'text','ready','library'],[21,'ministers',true,true,11,null,null,'library'],[22,'public',true,false,10,'text','ready','library'],[23,'public',false,true,10,'text','ready','library'],[24,'public',true,true,10,'text','ready','other']])await q(`insert into nh7_library_items(id,title_fa,title_en,title_hr,audience,is_active,is_published,collection_id,reader_mode,reader_status,reader_text,resource_type) values($1,'فارسی','English','Hrvatski',$2,$3,$4,$5,$6,$7,'{"secret":"REAL READER BODY MUST NOT LEAK"}',$8)`,[uuid(id),audience,active,published,uuid(collection),mode,status,type]);
for(const v of contract)await db.exec(`create view ${v.name} as ${v.definition} grant select on ${v.name} to anon,authenticated,service_role;`);
const columns=async name=>(await q("select attname,format_type(atttypid,atttypmod) type from pg_attribute where attrelid=$1::regclass and attnum>0 and not attisdropped order by attnum",[name])).rows.map(x=>[x.attname,x.type]);
const expected=[[],[],[19,24],[20],[19,24],[19,20,21,24]];
async function capture(){const out=[];for(const [i,uid]of ['',uuid(1),uuid(2),uuid(3),uuid(4),uuid(5)].entries()){
 await q("select set_config('request.jwt.claim.sub',$1,false)",[uid]);await db.exec('set role '+(uid?'authenticated':'anon'));
 const state=[];for(const [j,v]of contract.entries()){const rows=(await q('select * from '+v.name+' order by id')).rows;if(j<2){assert.deepEqual(rows.map(r=>r.id),expected[i].map(uuid));for(const r of rows)assert.deepEqual(r.reader_text,{});}state.push(rows)}
 await denied('select * from nh7_library_items');await denied('select * from nh7_library_collections_v322');await denied('select * from private.flags');await db.exec('reset role');out.push(state)}return out}
const before=await capture(),aclBefore=(await q("select oid::regclass::text name,relacl::text acl from pg_class where oid=any($1::regclass[]) order by oid::regclass::text",[contract.map(v=>v.name)])).rows;
const source=fs.readFileSync(root+'library-proposal.sql','utf8'),guard=source.slice(source.indexOf('DO $preflight$'),source.indexOf('-- FIXTURE-SQL-BEGIN'));
await assert.rejects(db.exec(guard.replaceAll(contract[0].before_md5,'0'.repeat(32))),/WAVE66_VIEW_DRIFT/,'Unknown view fingerprint must fail closed');
for(const v of contract)assert.equal((await q('select md5(pg_get_viewdef($1::regclass,true)) hash',[v.name])).rows[0].hash,v.before_md5,'Exact live SELECT produces supplied PostgreSQL fingerprint');
await db.exec(guard);
await db.exec('create role fixture_extra;alter default privileges grant execute on functions to fixture_extra;');
await assert.rejects(db.exec('BEGIN;'+template('library-proposal.sql')+'COMMIT;'),/WAVE66_UNEXPECTED_DEFAULT_FUNCTION_ACL/);await db.exec('ROLLBACK;alter default privileges revoke execute on functions from fixture_extra;');
await db.exec('grant select on nh7_library_items_v224 to public;');
await assert.rejects(db.exec('BEGIN;'+template('library-proposal.sql')+'COMMIT;'),/WAVE66_PUBLIC_VIEW_ACL_REQUIRES_SEPARATE_REVIEW/);await db.exec('ROLLBACK;revoke select on nh7_library_items_v224 from public;');
await db.exec('BEGIN;'+template('library-proposal.sql')+'COMMIT;');
assert.deepEqual(await capture(),before,'All four role results identical before/after');
for(const v of contract)assert.deepEqual(await columns(v.name),v.columns.map(([n,t])=>[n,t==='timestamptz'?'timestamp with time zone':t]));
const aclAfter=(await q("select oid::regclass::text name,relacl::text acl from pg_class where oid=any($1::regclass[]) order by oid::regclass::text",[contract.map(v=>v.name)])).rows;assert.deepEqual(aclAfter,aclBefore,'View ACLs untouched');
assert((await q("select reloptions from pg_class where oid='nh7_library_items_v224'::regclass")).rows[0].reloptions.includes('security_invoker=true'));
await q("select set_config('request.jwt.claim.sub',$1,false)",[uuid(3)]);await db.exec('set role authenticated');let collection=(await q('select * from nh7_library_collections_public_v322')).rows;assert.equal(collection.length,1);assert.equal(collection[0].item_count,1);await db.exec('reset role');
await q('delete from private.grants where uid=$1 and scope=$2',[uuid(3),'library_item']);await db.exec('set role authenticated');assert.equal((await q('select * from nh7_library_items_v251')).rows.length,0);assert.equal((await q('select item_count from nh7_library_collections_public_v322')).rows[0].item_count,0);await db.exec('reset role');
await q('delete from private.grants where uid=$1',[uuid(3)]);await db.exec('set role authenticated');assert.equal((await q('select * from nh7_library_collections_public_v322')).rows.length,0);await db.exec('reset role');
await q("update nh7_library_items set is_published=true where id=$1",[uuid(22)]);await q("select set_config('request.jwt.claim.sub',$1,false)",[uuid(2)]);await db.exec('set role authenticated');assert.equal((await q('select * from nh7_library_items_v224')).rows.length,3);await db.exec('reset role');
// Exact constant masking and SQL three-valued reader_available for Admin's null-mode row.
await q("select set_config('request.jwt.claim.sub',$1,false)",[uuid(5)]);await db.exec('set role authenticated');assert.equal((await q('select reader_available from nh7_library_items_v224 where id=$1',[uuid(21)])).rows[0].reader_available,null);await db.exec('reset role');
await db.exec(template('rollback.sql'));for(const v of contract)assert.equal((await q('select md5(pg_get_viewdef($1::regclass,true)) h',[v.name])).rows[0].h,v.before_md5,'Rollback restores exact original definition fingerprint');assert.deepEqual((await q("select relacl::text acl from pg_class where oid='nh7_library_items_v224'::regclass")).rows[0].acl,aclBefore.find(r=>r.name==='nh7_library_items_v224').acl);assert.equal((await q("select to_regprocedure('public.nh7_library_items_compat_wave66()') fn")).rows[0].fn,null);
// Real PostgreSQL trigger semantics after direct client EXECUTE revocation. Synthetic only, not a live revoke proposal.
await db.exec(`create table private.fixture_audit(n integer);create table public.fixture_rows(n integer);grant insert on fixture_rows to authenticated;
create function public.fixture_trigger() returns trigger language plpgsql security definer set search_path='' as $$begin insert into private.fixture_audit values(new.n);return new;end;$$;
create trigger fixture_trigger after insert on fixture_rows for each row execute function public.fixture_trigger();
revoke execute on function public.fixture_trigger() from public,anon,authenticated;set role authenticated;insert into fixture_rows values(1);`);await denied('select public.fixture_trigger()');await db.exec('reset role');assert.equal((await q('select n from private.fixture_audit')).rows[0].n,1);
// Exact matched production body for public token lookup; schema is synthetic, no real certificate read.
const lookup=JSON.parse(fs.readFileSync(root+'function-dispositions.json')).rows.find(r=>r.row===172),path=lookup.source_evidence[0].path,sql=fs.readFileSync(path,'utf8'),start=sql.search(/create or replace function public\.nh7_public_certificate_lookup/i),section=sql.slice(start),end=section.indexOf('$$;',section.indexOf('as $$'))+3,ddl=section.slice(0,end);
const fields=[...new Set([...ddl.matchAll(/c\.(\w+)/g)].map(m=>m[1]))];await db.exec('create table school_certificates('+fields.map(f=>f+' '+(f==='public_token'?'uuid':'text')).join(',')+');'+ddl);
await q("insert into school_certificates(public_token,status,user_name) values($1,'approved','Synthetic public certificate')",[uuid(88)]);await q("select set_config('request.jwt.claim.sub','',false)");await db.exec('set role anon');assert.equal((await q('select auth.uid() uid')).rows[0].uid,null,'Anonymous verification fixture must carry no prior authenticated JWT');assert.equal((await q('select nh7_public_certificate_lookup($1) r',[uuid(88)])).rows[0].r.user_name,'Synthetic public certificate');assert.equal((await q('select nh7_public_certificate_lookup($1) r',[uuid(89)])).rows[0].r,null);await db.exec('reset role');
// Execute exact matched Admin and owner wrappers with explicit synthetic authority dependencies.
function matchedDDL(row){const r=JSON.parse(fs.readFileSync(root+'function-dispositions.json')).rows.find(r=>r.row===row),f=fs.readFileSync(r.source_evidence[0].path,'utf8'),start=f.split('\n').slice(0,r.source_evidence[0].line-1).join('\n').length+(r.source_evidence[0].line>1?1:0),tail=f.slice(start),tag=tail.match(/\bas\s+(\$\w*\$)/i),end=tail.indexOf(tag[1],tag.index+tag[0].length)+tag[1].length;return tail.slice(0,end)+';'}
await db.exec(`create table private.nh7_admin_members_v350(user_id uuid,role text,is_active boolean,updated_at timestamptz);
create table private.nh7_admin_audit_log_v350(actor_user_id uuid,action text,target_user_id uuid);
create function private.nh7_admin_require_owner_v350() returns void language plpgsql security definer set search_path='' as $$begin if auth.uid() is distinct from '${uuid(6)}'::uuid then raise exception 'owner_required';end if;end;$$;
create table public.nh7_sermon_blessings_v440(id uuid primary key);alter table nh7_sermon_blessings_v440 enable row level security;revoke all on nh7_sermon_blessings_v440 from public,anon,authenticated;
insert into nh7_sermon_blessings_v440 values('${uuid(70)}');insert into private.nh7_admin_members_v350 values('${uuid(5)}','delegate',true,now());`);
await db.exec(matchedDDL(96)+matchedDDL(153));
for(const id of ['',uuid(1)]){await q("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');await denied('select nh7_admin_sermon_blessing_hard_delete_v504($1)',[uuid(70)]);await denied('select nh7_owner_deactivate_admin_v350($1)',[uuid(5)]);await db.exec('reset role');}
await q("select set_config('request.jwt.claim.sub',$1,false)",[uuid(5)]);await db.exec('set role authenticated');await denied('select nh7_owner_deactivate_admin_v350($1)',[uuid(5)]);assert.equal((await q('select nh7_admin_sermon_blessing_hard_delete_v504($1) r',[uuid(70)])).rows[0].r.deleted,true);await db.exec('reset role');
await q("select set_config('request.jwt.claim.sub',$1,false)",[uuid(6)]);await db.exec('set role authenticated');assert.equal((await q('select nh7_owner_deactivate_admin_v350($1) r',[uuid(5)])).rows[0].r,true);await db.exec('reset role');
// Compatibility model uses the owner-confirmed pre65 contract, not a reconstructed live body.
// Install the actual strict proposal in synthetic PostgreSQL to prove why its global trigger must wait.
await db.exec(`create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);create function private.nh7_admin_is_owner_v350() returns boolean language sql as $$select false$$;
create table registrations(id uuid primary key default gen_random_uuid(),type text,device_id text,status text,language text,payload jsonb,created_at timestamptz default now(),updated_at timestamptz default now());`);
const oldPayload={email:'legacy@example.test',phone:'09121234567',birthDate:'2000-01-01'};
await q("insert into registrations(type,device_id,status,payload) values('school','old-store','pending',$1)",[oldPayload]);
await db.exec(fs.readFileSync('supabase/review/wave6_5-security-registration/registration.sql','utf8'));
await assert.rejects(q("insert into registrations(type,device_id,status,payload) values('school','old-store','pending',$1)",[oldPayload]),undefined,'Global strict trigger rejects legacy Store payload; adoption must precede activation');
assert.deepEqual((await q('select payload from registrations')).rows[0].payload,oldPayload,'Existing legacy data not migrated/backfilled');
await db.exec('drop trigger nh7_registration_strict_wave65 on registrations;drop trigger nh7_auth_signup_strict_wave65 on auth.users;');
await q("insert into registrations(type,device_id,status,payload) values('school','old-store','pending',$1)",[oldPayload]);
assert.equal((await q('select count(*)::integer n from registrations')).rows[0].n,2,'Removing fixture-only strict enforcement preserves compatibility');
console.log('PASS Wave66 local PostgreSQL: exact four 25/12 typed views; anonymous/unapproved/School/non-School minister/revoked/Admin equivalence; per-item/collection revocation/counts, dynamic publish, null reader state, body masking/base denial; unknown fingerprint rejected; ACL/definition rollback; direct client trigger denial with trigger preserved; exact matched public verification callable');await db.close();})().catch(e=>{console.error(e);process.exitCode=1});
