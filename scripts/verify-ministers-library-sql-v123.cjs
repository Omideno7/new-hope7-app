/* SQL rehearsal only: isolated in-memory PostgreSQL (PGlite), synthetic fixtures.
 * No credentials, production URLs, network, real content or member data.
 * Install pinned @electric-sql/pglite@0.3.14 outside the repository;
 * set NH7_PGLITE_PACKAGE to that package directory. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require(process.env.NH7_PGLITE_PACKAGE||'@electric-sql/pglite');
const evidence={engine:'PGlite 0.3.14 / local PostgreSQL',productionTested:false,cases:[]};
const who={normal:'10000000-0000-4000-8000-000000000001',item:'10000000-0000-4000-8000-000000000002',collection:'10000000-0000-4000-8000-000000000003',all:'10000000-0000-4000-8000-000000000004',revoked:'10000000-0000-4000-8000-000000000005',expired:'10000000-0000-4000-8000-000000000006',admin:'10000000-0000-4000-8000-000000000007',inactiveAdmin:'10000000-0000-4000-8000-000000000008'};
const a='20000000-0000-4000-8000-000000000001',b='20000000-0000-4000-8000-000000000002',other='20000000-0000-4000-8000-000000000003',folder='30000000-0000-4000-8000-000000000001';
(async()=>{const db=new PGlite();try{
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE SCHEMA fixture;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 GRANT USAGE ON SCHEMA auth TO PUBLIC; GRANT EXECUTE ON FUNCTION auth.uid() TO PUBLIC;
 CREATE TABLE public.nh7_library_items(id uuid PRIMARY KEY,collection_id uuid,audience text,is_active boolean,is_published boolean,title_fa text,title_en text,title_hr text,reader_text jsonb);
 INSERT INTO public.nh7_library_items VALUES
 ('${a}','${folder}','ministers',true,true,'آزمایش ساختگی','Synthetic fixture A','Sintetički primjer A','{"text":"SYNTHETIC_ONLY"}'),
 ('${b}','${folder}','ministers',true,true,'آزمایش ساختگی','Synthetic fixture B','Sintetički primjer B','{}'),
 ('${other}',null,'ministers',true,true,'آزمایش ساختگی','Synthetic fixture C','Sintetički primjer C','{}'),
 ('20000000-0000-4000-8000-000000000004',null,'public',true,true,'ساختگی','Synthetic public','Sintetički javni','{}'),
 ('20000000-0000-4000-8000-000000000005',null,'ministers',false,true,'ساختگی','Synthetic inactive','Sintetički neaktivan','{}');
 GRANT SELECT ON public.nh7_library_items TO anon,authenticated;
 ALTER TABLE public.nh7_library_items ENABLE ROW LEVEL SECURITY;
 CREATE POLICY fixture_old_allow ON public.nh7_library_items FOR SELECT TO anon,authenticated USING(true);
 CREATE SCHEMA storage; CREATE TABLE storage.objects(bucket_id text,name text);
 CREATE TABLE storage.buckets(id text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 INSERT INTO storage.objects VALUES ('nh7-ministers-private-v123','fixture/a.pdf'),('nh7-ministers-private-v123','fixture/b.pdf'),('nh7-ministers-private-v123','fixture/unmapped.pdf'),('unrelated-public','fixture/public.txt');
 GRANT USAGE ON SCHEMA storage TO anon,authenticated;GRANT SELECT ON storage.objects TO anon,authenticated;
 ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 CREATE POLICY fixture_old_storage_allow ON storage.objects FOR SELECT TO anon,authenticated USING(true);
 CREATE TABLE fixture.grants(user_id uuid,scope text,resource_id uuid,expires_at timestamptz,active boolean);
 CREATE TABLE fixture.admins(user_id uuid,active boolean);
 CREATE TABLE fixture.objects(bucket_id text,object_name text,item_id uuid);
 INSERT INTO fixture.grants VALUES
 ('${who.normal}','library_all','${a}',null,true),('${who.normal}','library_item',null,null,true),('${who.normal}','school_approved',null,null,true),
 ('${who.item}','library_item','${a}',null,true),('${who.collection}','library_collection','${folder}',null,true),
 ('${who.all}','library_all',null,null,true),('${who.revoked}','library_all',null,null,false),
 ('${who.expired}','library_all',null,'2000-01-01',true);
 INSERT INTO fixture.admins VALUES ('${who.admin}',true),('${who.inactiveAdmin}',false);
 INSERT INTO fixture.objects VALUES ('nh7-ministers-private-v123','fixture/a.pdf','${a}'),('nh7-ministers-private-v123','fixture/b.pdf','${b}');
 SET nh7.review_environment='local-fixture';`);
 const candidate=fs.readFileSync('supabase/review/issue123/01_authorization_rehearsal.sql','utf8');
 assert.match(candidate,/ROLLBACK;\s*$/);await db.exec(candidate.replace(/ROLLBACK;\s*$/,''));
 assert.equal((await db.query(`SELECT count(*)::int n FROM nh7_ministers_security_v123.nh7_library_grants_adapter_v123`)).rows[0].n,0);
 await db.exec(`SET ROLE authenticated;SET request.jwt.claim.sub='${who.item}'`);
 assert.equal((await db.query('SELECT public.nh7_ministers_catalog_v123() AS d')).rows[0].d.items.length,0);
 await db.exec('RESET ROLE');evidence.cases.push({case:'unverified empty adapters fail closed despite existing synthetic grant',restrictedRows:0});
 // Empty adapters must deny before any mapping is assumed. Only synthetic local
 // adapters are replaced, without touching a user's grant source of truth.
 await db.exec(`CREATE OR REPLACE VIEW nh7_ministers_security_v123.nh7_library_grants_adapter_v123 AS SELECT * FROM fixture.grants;
 CREATE OR REPLACE VIEW nh7_ministers_security_v123.nh7_library_admin_adapter_v123 AS SELECT * FROM fixture.admins;
 CREATE OR REPLACE VIEW nh7_ministers_security_v123.nh7_library_objects_adapter_v123 AS SELECT * FROM fixture.objects;`);
 async function actor(uid,role='authenticated'){await db.exec(`RESET ROLE; SET ROLE ${role}; SET request.jwt.claim.sub='${uid||''}';`)}
 async function denied(sql){await db.exec('SAVEPOINT denied_probe');let error=null;try{await db.query(sql)}catch(e){error=e}await db.exec('ROLLBACK TO SAVEPOINT denied_probe; RELEASE SAVEPOINT denied_probe');assert.equal(error?.code,'42501');}
 async function counts(label,uid,expectedRows,expectedFiles,role='authenticated'){
  await actor(uid,role);
  const rows=(await db.query(`SELECT count(*)::int n FROM public.nh7_library_items WHERE audience='ministers'`)).rows[0].n;
  const files=(await db.query(`SELECT count(*)::int n FROM storage.objects WHERE bucket_id='nh7-ministers-private-v123'`)).rows[0].n;
  assert.equal(rows,expectedRows,label+' rows');assert.equal(files,expectedFiles,label+' objects');
  assert.equal((await db.query(`SELECT count(*)::int n FROM public.nh7_library_items WHERE audience='public'`)).rows[0].n,1);
  assert.equal((await db.query(`SELECT count(*)::int n FROM storage.objects WHERE bucket_id='unrelated-public'`)).rows[0].n,1);
  if(role==='anon')await denied('SELECT public.nh7_ministers_catalog_v123()');
  else{const payload=(await db.query('SELECT public.nh7_ministers_catalog_v123() AS d')).rows[0].d;assert.equal(payload.items.length,expectedRows);assert.ok(payload.items.every(i=>!('reader_text'in i)&&!('storage_path'in i)));}
  evidence.cases.push({case:label,restrictedRows:rows,restrictedObjects:files});
 }
 await counts('anonymous',null,0,0,'anon');await counts('authenticated without grant',who.normal,0,0);
 await counts('item grant',who.item,1,1);await counts('collection grant',who.collection,2,2);await counts('all-library grant',who.all,3,2);
 await counts('revoked minister',who.revoked,0,0);await counts('expired minister',who.expired,0,0);
 await counts('explicit server admin',who.admin,3,2);await counts('inactive server admin',who.inactiveAdmin,0,0);
 await actor(who.normal);await db.exec(`SET request.jwt.claim.email='synthetic-admin@example.invalid'; SET request.jwt.claim.role='service_role';`);
 assert.equal((await db.query(`SELECT nh7_ministers_security_v123.nh7_ministers_can_read_v123('${a}') AS allowed`)).rows[0].allowed,false);
 assert.equal((await db.query(`SELECT public.nh7_ministers_reader_v123('${a}') AS d`)).rows[0].d.allowed,false);
 await denied('SELECT * FROM nh7_ministers_security_v123.nh7_library_grants_adapter_v123');
 await denied(`UPDATE fixture.grants SET active=true`);
 evidence.cases.push({case:'spoofed email/role and direct item ID; grant data protected',allowed:false});
 await actor(who.item);assert.equal((await db.query(`SELECT public.nh7_ministers_reader_v123('${a}') AS d`)).rows[0].d.allowed,true);
 assert.equal((await db.query(`SELECT public.nh7_ministers_reader_v123('${other}') AS d`)).rows[0].d.allowed,false);
 await db.exec('RESET ROLE');await db.exec(`UPDATE fixture.grants SET active=false WHERE user_id='${who.item}'`);
 await counts('same identity immediately after revoke',who.item,0,0);await counts('fresh login after revoke',who.item,0,0);
 await db.exec('RESET ROLE');await db.exec(`UPDATE fixture.grants SET active=true WHERE user_id='${who.item}'`);await counts('fresh login after grant',who.item,1,1);
 await db.exec(`RESET ROLE;INSERT INTO fixture.objects VALUES
 ('nh7-ministers-private-v123','fixture/shared.pdf','${a}'),('nh7-ministers-private-v123','fixture/shared.pdf','${other}')`);
 await actor(who.item);assert.equal((await db.query(`SELECT nh7_ministers_security_v123.nh7_ministers_can_read_object_v123('nh7-ministers-private-v123','fixture/shared.pdf') AS allowed`)).rows[0].allowed,false);
 await actor(who.all);assert.equal((await db.query(`SELECT nh7_ministers_security_v123.nh7_ministers_can_read_object_v123('nh7-ministers-private-v123','fixture/shared.pdf') AS allowed`)).rows[0].allowed,true);
 evidence.cases.push({case:'shared-object mapping requires access to every linked restricted item',itemGrantAllowed:false,allGrantAllowed:true});
 // An owning view/SECURITY DEFINER endpoint can bypass base-table RLS. This is a
 // synthetic demonstration, NOT a claim that these fake endpoints exist in Production.
 await db.exec(`RESET ROLE;CREATE VIEW public.fixture_owning_library_view AS SELECT * FROM public.nh7_library_items;
 GRANT SELECT ON public.fixture_owning_library_view TO authenticated;
 CREATE FUNCTION public.fixture_insecure_reader() RETURNS bigint LANGUAGE sql SECURITY DEFINER AS $$SELECT count(*) FROM public.nh7_library_items WHERE audience='ministers' AND is_active$$;
 GRANT EXECUTE ON FUNCTION public.fixture_insecure_reader() TO authenticated;`);
 await actor(who.normal);assert.equal(Number((await db.query(`SELECT count(*) n FROM public.fixture_owning_library_view WHERE audience='ministers' AND is_active`)).rows[0].n),3);
 assert.equal(Number((await db.query('SELECT public.fixture_insecure_reader() AS n')).rows[0].n),3);
 await db.exec(`RESET ROLE;ALTER VIEW public.fixture_owning_library_view SET (security_invoker=true)`);await actor(who.normal);
 assert.equal(Number((await db.query(`SELECT count(*) n FROM public.fixture_owning_library_view WHERE audience='ministers'`)).rows[0].n),0);
 evidence.cases.push({case:'owning view/definer bypass reproduced; invoker view closes view bypass',legacyBypassRows:3,invokerRows:0});
 await db.exec('RESET ROLE;SAVEPOINT rollback_rehearsal');
 const rollback=fs.readFileSync('supabase/review/issue123/02_rollback_rehearsal.sql','utf8').replace(/^BEGIN;$/m,'').replace(/ROLLBACK;\s*$/,'');await db.exec(rollback);
 await actor(who.normal);assert.equal(Number((await db.query(`SELECT count(*) n FROM public.nh7_library_items WHERE audience='ministers' AND is_active`)).rows[0].n),3);
 await db.exec('RESET ROLE;ROLLBACK TO SAVEPOINT rollback_rehearsal');await counts('rollback recovery retains deny after savepoint undo',who.normal,0,0);
 await db.exec('RESET ROLE;ROLLBACK');assert.equal((await db.query(`SELECT to_regprocedure('public.nh7_ministers_catalog_v123()') AS p`)).rows[0].p,null);
 evidence.cases.push({case:'review transaction leaves no installed candidate',installed:false});
 await db.exec(fs.readFileSync('supabase/review/issue123/00_read_only_inventory.sql','utf8'));
 evidence.cases.push({case:'read-only metadata inventory executes against synthetic PostgreSQL catalogs',passed:true});
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(evidence,null,2)+'\n');
 console.log('PASS #123 SQL rehearsal:',evidence.cases.length,'synthetic cases; auth.uid/RLS/objects, grant/revoke, server admin, spoofing, view/definer bypass and rollback. Production not tested.');
 }finally{await db.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
