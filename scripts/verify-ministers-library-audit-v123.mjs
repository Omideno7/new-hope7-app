/* Repository behavior probes, not live security tests. Only synthetic sentinels. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
const cases=[];
const base='5d376214295491a0d78b2637477a5bbd58eb14e0';
const changed=execFileSync('git',['diff','--name-only',base],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const added=execFileSync('git',['ls-files','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
for(const path of [...changed,...added])assert.match(path,/^(docs\/audit\/ISSUE_123_|scripts\/verify-ministers-library-(audit|sql)-v123\.|supabase\/review\/issue123\/)/,'Out-of-scope runtime change: '+path);
cases.push({case:'all baseline app/admin/School/Print/PDF/CSV/audio/profile/testimony/notification/SQL sources unchanged',baseline:base,verified:true});
const store=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k),key:i=>[...values.keys()][i],get length(){return values.size}}};
const app=read('js/app.js');
const fragment=app.slice(app.indexOf("let nh7LibraryTab="),app.indexOf("let nh7LibraryBlobUrlV224="));
assert.ok(fragment.includes('async function loadLibraryCatalog'));
const cache=store();let rpcCalls=0;
const synthetic=[{id:'synthetic-only',audience:'ministers',title_en:'SYNTHETIC_TEST_SENTINEL'}];
cache.setItem('nh7_library_catalog_cache_v1',JSON.stringify({at:Date.now(),items:synthetic}));
const catalog=vm.createContext({sessionStorage:cache,Date,console:{warn(){}},cloudRpc:async()=>{rpcCalls++;throw Error('content_access_required')}});
vm.runInContext(fragment,catalog);
assert.equal((await vm.runInContext('loadLibraryCatalog()',catalog)).length,1);assert.equal(rpcCalls,0);
cases.push({case:'shared session cache returns prior restricted row without server recheck',confirmed:true});
cache.setItem('nh7_library_catalog_cache_v1',JSON.stringify({at:0,items:synthetic}));vm.runInContext('nh7LibraryCatalog=[]',catalog);
assert.equal((await vm.runInContext('loadLibraryCatalog(true)',catalog)).length,1);assert.equal(rpcCalls,1);
cases.push({case:'denied server response restores even expired restricted cache',confirmed:true});
// Execute the actual access bootstrap with a logged-out synthetic session.
const local=store(),session=store();local.setItem('nh7_user_session_v170',JSON.stringify({access_token:'SYNTHETIC_TOKEN',user:{email:'synthetic@example.invalid'}}));local.setItem('nh7_explicit_logout','1');
session.setItem('nh7_content_access_status_v230',JSON.stringify({authenticated:true,approved:true,checked_at:0,user_email:'synthetic@example.invalid'}));
const bootstrap=vm.createContext({window:{fetch:async()=>new Response('{}',{status:403}),addEventListener(){},dispatchEvent(){}},localStorage:local,sessionStorage:session,navigator:{onLine:false},location:{href:'http://localhost/'},Date,URL,Request,Response,Headers,CustomEvent:class{},console:{warn(){}}});
vm.runInContext(read('js/nh7-access-bootstrap-v230.js'),bootstrap);
assert.equal(bootstrap.window.NH7AccessV230.token(),'');assert.equal(bootstrap.window.NH7AccessV230.isApproved(),true);
cases.push({case:'offline cached UI approval survives explicit logout; not server authority',confirmed:true});
// Actual SW fetch handler, with only its IndexedDB reader substituted by an
// in-memory synthetic Blob. All identity/authorization/response logic stays real.
const handlers={},sw=vm.createContext({self:{location:{origin:'http://localhost'},registration:{scope:'http://localhost/'},addEventListener:(name,fn)=>{handlers[name]=fn}},URL,Request,Response,Headers,Blob,console});
vm.runInContext(read('sw-offline-v329.js'),sw);
let network=0;sw.fetch=async()=>{network++;throw Error('offline')};sw.fixtureBlob=new Blob(['SYNTHETIC_BYTES_ONLY'],{type:'application/pdf'});
vm.runInContext('dbGet=async()=>({blob:fixtureBlob,mime:"application/pdf"})',sw);
const signed='https://gpzcwffxnddhaeaogdyo.supabase.co/storage/v1/object/sign/nh7-library/fixture-only.pdf?token=EXPIRED_SYNTHETIC_TOKEN';
const unsigned=signed.replace('/sign/','/public/').split('?')[0];
assert.equal(vm.runInContext(`mediaIdentity(${JSON.stringify(signed)})`,sw),vm.runInContext(`mediaIdentity(${JSON.stringify(unsigned)})`,sw));
for(const identity of ['anonymous','normal-user','revoked-user']){
 let response;handlers.fetch({request:new Request(signed,{headers:identity==='anonymous'?{}:{Authorization:'Bearer SYNTHETIC_'+identity}}),respondWith:p=>{response=p}});
 assert.equal(await(await response).text(),'SYNTHETIC_BYTES_ONLY');
}assert.equal(network,0);
cases.push({case:'seeded Library offline Blob returned independent of identity/expired signed token',confirmed:true,identities:3,networkRechecks:0});
// Current Global Search only searches Bible/audio/saved refs/notes, not Library rows.
const search=read('js/nh7-global-search-direct-v562.js');assert.doesNotMatch(search,/nh7_library_catalog|libraryMatches|reader_text/);
assert.match(search,/audioMatches\(q\).*savedReferenceMatches\(q\).*localNotes\(q\)/);
const searchLocal=store(),searchSession=store(),results={innerHTML:'',hidden:true};
searchSession.setItem('nh7_library_catalog_cache_v1',JSON.stringify({items:synthetic}));
const root={querySelector:()=>results};
const searchContext=vm.createContext({window:{},document:{readyState:'loading',documentElement:{lang:'en'},addEventListener(){},getElementById:()=>root},localStorage:searchLocal,sessionStorage:searchSession,fetch:async()=>new Response('{"verses":[]}'),Response,console:{warn(){}},setTimeout,clearTimeout});
vm.runInContext(search,searchContext);
for(const language of ['fa','en','hr','fa']){
 searchLocal.setItem('nh7_lang',language);searchContext.window.NH7GlobalSearchDirectV562.search('SYNTHETIC_TEST_SENTINEL');
 await new Promise(resolve=>setTimeout(resolve,0));assert.equal(root.__nh7Items562.length,0);
}
cases.push({case:'Global Search ignores seeded restricted catalog in FA/EN/HR/FA',simulated:true,restrictedResults:0});
const candidate=read('supabase/review/issue123/01_authorization_rehearsal.sql');
assert.match(candidate,/auth\.uid\(\)/);assert.match(candidate,/SET search_path=''/);assert.match(candidate,/AS RESTRICTIVE/);assert.match(candidate,/ROLLBACK;\s*$/);
assert.doesNotMatch(candidate.replace(/^--.*$/gm,''),/\bDROP\s|\bDELETE\s|\bTRUNCATE\s|\bUPDATE\s|\bINSERT\s|p_user_email|p_user_id/i);
assert.doesNotMatch(read('supabase/review/issue123/02_rollback_rehearsal.sql'),/\bDROP\s|\bDELETE\s|\bTRUNCATE\s/i);
assert.match(read('supabase/review/issue123/00_read_only_inventory.sql'),/READ ONLY/);
assert.ok(!fs.readdirSync('supabase/migrations').some(n=>/v123|issue123|ministers/i.test(n)));
cases.push({case:'review-only SQL is gated, rollback-only and outside automatic migrations',sourceVerified:true});
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({productionTested:false,cases},null,2)+'\n');
console.log('PASS #123 repository audit probes:',cases.length,'cases. Known baseline cache exposures REPRODUCED; no Production security claim.');
