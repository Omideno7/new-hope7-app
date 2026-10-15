/* Executes review SQL against real local PostgreSQL WASM. No remote database/provider. */
const {PGlite}=require('@electric-sql/pglite'),fs=require('node:fs'),assert=require('node:assert/strict');
const root='supabase/review/wave6_5-security-registration/',coverage=JSON.parse(fs.readFileSync(root+'identity-coverage.json'));
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',O='33333333-3333-4333-8333-333333333333',N='44444444-4444-4444-8444-444444444444',J='55555555-5555-4555-8555-555555555555';
const good={firstName:'Sara',lastName:'Novak',city:'Zagreb',country:'Hrvatska',spiritualAge:'2 years',testimony:'My story',howFound:'Family',churchMember:'no',waterBaptism:'yes',salvationPrayer:'yes',eventsInterest:'no',phone:'+989121234567',email:'a@example.test',birthDate:'2000-02-29'};
(async()=>{const db=new PGlite();const q=(sql,params)=>db.query(sql,params);const denied=async(sql,params)=>{await assert.rejects(q(sql,params),undefined,sql.slice(0,100));};
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema private;create schema storage;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table auth.users(id uuid primary key,email text unique,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
create table auth.identities(user_id uuid references auth.users(id) on delete cascade);create table auth.sessions(user_id uuid references auth.users(id) on delete cascade);create table auth.refresh_tokens(user_id uuid references auth.users(id) on delete cascade);
create table private.nh7_admin_members_v350(user_id uuid,role text,is_active boolean);
create function private.nh7_admin_is_owner_v350() returns boolean language sql stable as $$select exists(select 1 from private.nh7_admin_members_v350 where user_id=auth.uid() and role='owner' and is_active)$$;
create function public.nh7_is_admin() returns boolean language sql stable as $$select exists(select 1 from private.nh7_admin_members_v350 where user_id=auth.uid() and is_active)$$;
create table public.registrations(id uuid primary key default gen_random_uuid(),type text,device_id text,status text,language text,payload jsonb,created_at timestamptz default now(),updated_at timestamptz default now());
insert into auth.users(id,email,email_confirmed_at) values('${A}','a@example.test',now()),('${B}','b@example.test',now()),('${O}','owner@example.test',now());
insert into auth.identities values('${A}'),('${B}');insert into auth.sessions values('${A}'),('${B}');insert into auth.refresh_tokens values('${A}'),('${B}');
insert into private.nh7_admin_members_v350 values('${O}','owner',true);`);
await db.exec(fs.readFileSync(root+'registration.sql','utf8'));
const error=p=>q('select private.nh7_registration_error_wave65($1,$2) err',[p.email,JSON.stringify(p)]);
for(const p of ['00000000000','11111111111','12345678','09121234567','00385912345678','abc','+11111111111','+9891','+1234567890123456'])assert.equal((await error({...good,phone:p})).rows[0].err,'REG_PHONE_E164',p);
for(const p of ['+989121234567','+385912345678','+۹۸۹۱۲۱۲۳۴۵۶۷','+٣٨٥٩١٢٣٤٥٦٧٨','+98 (912) 123-4567'])assert.equal((await error({...good,phone:p})).rows[0].err,null,p);
assert.equal((await error({...good,firstName:'محمد',lastName:'احمدی'})).rows[0].err,null);
for(const p of [{...good,birthDate:'2001-02-29'},{...good,city:'!!!'},{...good,firstName:'aaaa'},{...good,email:'x@gmil.com'}])assert.ok((await error(p)).rows[0].err);
await db.exec(`set role anon;`);await denied('select public.nh7_submit_registration_wave65($1,$2,$3,$4,$5)',['school',good.email,'shared','fa',good]);await db.exec('reset role');
await q("select set_config('request.jwt.claim.sub',$1,false)",[A]);
const submit=p=>q('select public.nh7_submit_registration_wave65($1,$2,$3,$4,$5) result',['school',p.email,'shared','fa',p]);
for(let i=0;i<10;i++)await assert.rejects(submit({...good,phone:'00000000000'}));
assert.equal((await q('select count(*)::int n from registrations')).rows[0].n,0);
await submit({...good,phone:'+98 (912) 123-4567'});await submit(good);assert.equal((await q('select count(*)::int n from registrations')).rows[0].n,1);
assert.equal((await q("select payload->>'phone' p from registrations")).rows[0].p,'+989121234567');
await assert.rejects(submit({...good,email:'b@example.test'}));
await q("update registrations set status='rejected'");await submit(good);assert.equal((await q('select count(*)::int n from registrations')).rows[0].n,1);
await assert.rejects(q("update registrations set status='approved'"),/APPROVAL_PERMISSION/);await q("select set_config('request.jwt.claim.sub',$1,false)",[O]);await q('update auth.users set email_confirmed_at=null where id=$1',[A]);await assert.rejects(q("update registrations set status='approved'"));await q('update auth.users set email_confirmed_at=now() where id=$1',[A]);
await q("select set_config('request.jwt.claim.sub',$1,false)",[A]);
// Direct table bypass is rejected by the BEFORE trigger as well as the new RPC.
await assert.rejects(q("update registrations set payload=jsonb_set(payload,'{phone}','\"00000000000\"')"));
// Atomic Auth signup triggers: BEFORE rejects before Auth exists; trusted AFTER creates pending while unconfirmed.
await db.exec(`create function public.fixture_atomic_signup() returns trigger language plpgsql security definer as $$begin insert into public.registrations(type,device_id,status,payload) values('school','new-device','pending',new.raw_user_meta_data->'school_registration');return new;end;$$;create trigger fixture_atomic after insert on auth.users for each row execute function public.fixture_atomic_signup();`);
await q("select set_config('request.jwt.claim.sub','',false)");
await assert.rejects(q('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[N,'new@example.test',{school_registration:{...good,email:'new@example.test',phone:'09121234567'}}]));
assert.equal((await q('select count(*)::int n from auth.users where id=$1',[N])).rows[0].n,0);
await q('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[N,'new@example.test',{school_registration:{...good,email:'new@example.test'}}]);
await q("select set_config('request.jwt.claim.sub',$1,false)",[N]);await assert.rejects(q("update registrations set status='approved' where payload->>'email'='new@example.test'"));
await db.exec('drop trigger fixture_atomic on auth.users;drop trigger nh7_auth_signup_strict_wave65 on auth.users;');
// Library: restrictive base RLS; caller-authorized definer RPC; invoker views grant only captured public projection.
await db.exec(`create table public.fixture_library(id text,title text,audience text,is_active boolean,is_published boolean,storage_secret text);alter table fixture_library enable row level security;revoke all on fixture_library from public,anon,authenticated;
create table private.fixture_grants(uid uuid,minister boolean,approved boolean,admin boolean);
insert into private.fixture_grants values('${A}',false,true,false),('${B}',true,true,false),('${O}',true,true,true);
insert into fixture_library values('public','Public','public',true,true,'secret-path'),('minister','Minister','ministers',true,true,'secret-path'),('draft','Draft','public',true,false,'secret-path'),('inactive','Inactive','public',false,true,'secret-path');
create function public.nh7_library_catalog_v396() returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'title',i.title,'audience',i.audience)) from public.fixture_library i join private.fixture_grants g on g.uid=auth.uid() where (g.approved or g.admin) and i.is_active and i.is_published and (i.audience='public' or g.minister or g.admin)),'[]'::jsonb),'collections',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'title',i.title,'audience',i.audience)) from public.fixture_library i join private.fixture_grants g on g.uid=auth.uid() where (g.approved or g.admin) and i.is_active and i.is_published and (i.audience='public' or g.minister or g.admin)),'[]'::jsonb))$$;revoke all on function public.nh7_library_catalog_v396() from public,anon;grant execute on function public.nh7_library_catalog_v396() to authenticated;`);
await db.exec(fs.readFileSync(root+'library.sql','utf8'));
const views=['nh7_library_items_v224','nh7_library_items_v251','nh7_library_collections_public_v251','nh7_library_collections_public_v322'];
for(const name of views)await db.exec(`create view public.${name} with(security_invoker=true,security_barrier=true) as select r->>'id' id,r->>'title' title,r->>'audience' audience from public.nh7_library_catalog_wave65('${name.includes('collections')?'collections':'items'}') r;grant select on public.${name} to authenticated;`);
for(const [uid,expected] of [['',null],[N,0],[A,1],[B,2],[O,2]]){
 await q("select set_config('request.jwt.claim.sub',$1,false)",[uid]);await db.exec('set role '+(uid?'authenticated':'anon'));
 for(const view of views){if(!uid)await denied('select * from '+view);else{const r=(await q('select * from '+view)).rows;assert.equal(r.length,expected);for(const row of r)assert.deepEqual(Object.keys(row).sort(),['audience','id','title']);}}
 await denied('select * from fixture_library');await db.exec('reset role');
}
await q('update private.fixture_grants set minister=false where uid=$1',[B]);await q("select set_config('request.jwt.claim.sub',$1,false)",[B]);await db.exec('set role authenticated');assert.equal((await q('select * from '+views[0])).rows.length,1);await db.exec('reset role');
await q("insert into fixture_library values('new','New','public',true,true,'hidden')");await db.exec('set role authenticated');assert.equal((await q('select * from '+views[0])).rows.length,2);await db.exec('reset role');
// Complete source discovery superset: synthetic A/B in every candidate, explicit exceptions cannot be ignored.
await db.exec(fs.readFileSync(root+'delete.sql','utf8'));
await db.exec('drop trigger nh7_registration_strict_wave65 on registrations');await q('delete from registrations');
for(const row of coverage.rows){
 if(row.table==='public.registrations')continue;
 if(row.table==='private.nh7_admin_members_v350')continue;
 await db.exec(`create table if not exists ${row.table}(id uuid primary key default gen_random_uuid(),user_id uuid,user_email text,device_id text,payload jsonb default '{}');`);
}
for(const row of coverage.rows){
 if(row.domain==='retention-policy-exception')continue;
 if(row.table==='public.registrations'){for(const [uid,email]of [[A,good.email],[B,'b@example.test']])await q("insert into registrations(type,device_id,status,payload) values('school','shared','pending',$1)",[{auth_user_id:uid,email}]);}
 else await q(`insert into ${row.table}(user_id,user_email,device_id) values($1,$2,'shared'),($3,$4,'shared')`,[A,good.email,B,'b@example.test']);
 await q('insert into private.nh7_delete_scope_wave65 values($1,$2,$3,$4,$5,true)',[row.table,row.uid_keys,row.email_keys,row.json_keys,'purge']);
}
// Legacy device-only content has no proven owner and is preserved, never silently attributed to A.
await db.exec("create table private.fixture_device_only(device_id text,body text);insert into private.fixture_device_only values('shared','B legacy note')");
const hash='a'.repeat(64),prepare=(id,target=A,actor=A)=>q('select public.nh7_full_delete_prepare_wave65($1,$2,$3,$4,$5,$6) job',[id,actor,target,target===O?'owner@example.test':good.email,hash,'DELETE']);
await assert.rejects(prepare(J,O,O));await assert.rejects(prepare(J,A,B));await db.exec('set role service_role');await prepare(J);await db.exec('reset role');await assert.rejects(prepare(J,B,A));
await assert.rejects(q('select public.nh7_full_delete_database_wave65($1)',[J]));
await q('select public.nh7_full_delete_stage_wave65($1,$2)',[J,'storage']);
assert.equal((await q('select private.nh7_delete_reference_wave65($1,$2,$3,$4,$5,$6) hit',[{actor_user_id:O,target_user_id:A},A,good.email,['actor_user_id','target_user_id'],[],[]])).rows[0].hit,true);
// Every retention exception with target PII blocks full purge transaction; B/history remains.
for(const row of coverage.rows.filter(r=>r.domain==='retention-policy-exception')){
 if(row.table==='private.nh7_admin_members_v350')await q('insert into private.nh7_admin_members_v350 values($1,$2,false)',[A,'delegate']);
 else await q(`insert into ${row.table}(user_id,user_email,device_id) values($1,$2,'shared')`,[A,good.email]);
 await q('insert into private.nh7_delete_scope_wave65 values($1,$2,$3,$4,$5,true)',[row.table,row.uid_keys,row.email_keys,row.json_keys,'exception']);
}
await assert.rejects(q('select public.nh7_full_delete_database_wave65($1)',[J]),/RETENTION_APPROVAL/);
assert.equal((await q("select count(*)::int n from registrations where payload->>'auth_user_id'=$1",[A])).rows[0].n,1,'failed purge rolls back partial domain deletions');
// Synthetic policy fixture now has no active target PII in retained/shared content. This is not a live redaction implementation.
for(const row of coverage.rows.filter(r=>r.domain==='retention-policy-exception'))await q(`delete from ${row.table} where user_id=$1`,[A]);
await db.exec('set role service_role');await q('select public.nh7_full_delete_database_wave65($1)',[J]);await db.exec('reset role');
let total=0;for(const row of coverage.rows){if(row.domain==='retention-policy-exception')continue;
 const result=await q(`select count(*)::int n from ${row.table} r where private.nh7_delete_match_wave65(to_jsonb(r),$1,$2,$3,$4,$5)`,[A,good.email,row.uid_keys,row.email_keys,row.json_keys]);assert.equal(result.rows[0].n,0,row.table);
 const b=await q(`select count(*)::int n from ${row.table} r where private.nh7_delete_match_wave65(to_jsonb(r),$1,$2,$3,$4,$5)`,[B,'b@example.test',row.uid_keys,row.email_keys,row.json_keys]);assert.equal(b.rows[0].n,1,row.table);total++;
}
assert.equal((await q('select body from private.fixture_device_only')).rows[0].body,'B legacy note');
await q('delete from auth.users where id=$1',[A]);for(const table of ['identities','sessions','refresh_tokens']){assert.equal((await q('select count(*)::int n from auth.'+table+' where user_id=$1',[A])).rows[0].n,0);assert.equal((await q('select count(*)::int n from auth.'+table+' where user_id=$1',[B])).rows[0].n,1);}await q('select public.nh7_full_delete_stage_wave65($1,$2)',[J,'auth']);await q('select public.nh7_full_delete_stage_wave65($1,$2)',[J,'verified']);
// Fresh UID same email, then retry OLD UUID job: fresh account and registration survive byte-for-byte.
await q('delete from auth.users where id=$1',[N]);await q('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[N,good.email]);await q("select set_config('request.jwt.claim.sub',$1,false)",[N]);await db.exec('create trigger nh7_registration_strict_wave65 before insert or update on registrations for each row execute function private.nh7_registration_before_wave65()');await submit(good);await prepare(J);await q('select public.nh7_full_delete_database_wave65($1)',[J]);assert.equal((await q('select count(*)::int n from auth.users where id=$1',[N])).rows[0].n,1);assert.equal((await q("select count(*)::int n from registrations where payload->>'auth_user_id'=$1",[N])).rows[0].n,1);
for(const role of ['anon','authenticated']){await db.exec('set role '+role);await denied('select * from private.nh7_delete_jobs_wave65');await denied('select * from private.nh7_delete_scope_wave65');await denied('select public.nh7_full_delete_database_wave65($1)',[J]);await denied('select private.nh7_registration_error_wave65($1,$2)',[good.email,good]);await db.exec('reset role');}
console.log(`PASS Wave65 PostgreSQL strict phone/email/date/bypass/atomic signup/confirmation/idempotency/rejected reapply; four invoker views on narrow UID RPC; public/normal/minister/revoked/admin/column/base denial/dynamic publication; ${total} identity-table purge fixtures, B shared-device preserved, old-UUID retry preserves fresh same-email registration; private deny-all and service-only grants`);await db.close();})().catch(e=>{console.error(e);process.exitCode=1});
