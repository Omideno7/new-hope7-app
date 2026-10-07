/** Execute complete before/after Edge entrypoints locally. No network or Production mutations. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {libraryCatalog} from '../supabase/functions/nh7-content-access/library-catalog.mjs';
const before=fs.readFileSync(new URL('./fixtures/nh7-content-access-before-v125.ts',import.meta.url),'utf8');
const after=fs.readFileSync(new URL('../supabase/functions/nh7-content-access/index.ts',import.meta.url),'utf8');
function withoutLibrary(source){
 const marker=source.match(/^( +)if \(resource === 'library'\) \{/m);assert(marker);
 const start=marker.index,end=source.indexOf('\n'+marker[1]+'}',start);assert(end>start);
 return source.slice(0,start)+source.slice(end+marker[1].length+2);
}
assert.equal(withoutLibrary(after.replace("import { libraryCatalog } from './library-catalog.mjs';\n",'')),withoutLibrary(before),'Only the Library branch and its import may change');
assert.match(fs.readFileSync(new URL('../supabase/config.toml',import.meta.url),'utf8'),/\[functions\.nh7-content-access\]\s*verify_jwt\s*=\s*true/);
const rows=[
 {id:'public',title_en:'Public fixture',audience:'public',is_active:true,is_published:true,sort_order:0},
 {id:'minister-scoped',title_en:'Restricted synthetic fixture',audience:'ministers',is_active:true,is_published:true,sort_order:1},
 {id:'minister-other',title_en:'Other synthetic fixture',audience:'ministers',is_active:true,is_published:true,sort_order:2},
];
const authUser=token=>['normal','school','minister','revoked','admin'].includes(token)?{id:'uid-'+token,email:token+'@example.invalid'}:null;
const allowedRows=token=>token==='admin'?rows:token==='minister'?rows.slice(0,2):rows.slice(0,1);
const samples={
 audio_bible_books:[{id:'book',book_order:1,is_active:true}],
 audio_bible_chapters:[{id:'chapter',language:'fa',storage_path:'audio-bible/fa/one.mp3',audio_url:'old',is_published:true,admin_deleted_at:null,book_code:'GEN',chapter_number:1},{id:'chapter2',language:'en',storage_path:'',audio_url:'https://gpzcwffxnddhaeaogdyo.supabase.co/storage/v1/object/public/church-audio/audio-bible/en/two.mp3',is_published:true,admin_deleted_at:null,book_code:'GEN',chapter_number:2}],
 sermons:[{id:'sermon',audio_url:'https://gpzcwffxnddhaeaogdyo.supabase.co/storage/v1/object/public/church-audio/messages/fixture.mp3',is_published:true,sort_order:1,published_at:'2026-01-01'},{id:'no-audio',audio_url:'',is_published:true,sort_order:2}],
 nh7_library_items:rows,
};
async function execute(source,test){
 const calls=[];let handler;
 const env={SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service-role',SUPABASE_ANON_KEY:'synthetic-publishable',...test.env};
 const admin={
  auth:{getUser:async token=>{calls.push(['getUser',token]);return{data:{user:authUser(token)},error:test.invalidSession?'invalid':null}}},
  rpc:async(name,args)=>{calls.push(['rpc',name,args]);assert.equal(name,'nh7_school_access_approved_v223');return{data:test.approved!==false,error:test.approvalError?{message:'synthetic approval failure'}:null}},
  from(table){
   calls.push(['from',table]);let data=structuredClone(samples[table]||[]);const builder={
    select(fields){calls.push(['select',table,fields]);return builder},
    eq(field,value){calls.push(['eq',table,field,value]);data=data.filter(row=>row[field]===value);return builder},
    is(field,value){calls.push(['is',table,field,value]);data=data.filter(row=>row[field]===value);return builder},
    order(field,options){calls.push(['order',table,field,options]);return builder},
    async upsert(value,options){calls.push(['upsert',table,value,options]);return{error:test.tableError?new Error('synthetic write failure'):null}},
    then(resolve,reject){return Promise.resolve({data,error:test.tableError?new Error('synthetic table failure'):null}).then(resolve,reject)},
   };return builder;
  },
  storage:{from(bucket){return{async createSignedUrl(path,ttl){calls.push(['sign',bucket,path,ttl]);return{data:{signedUrl:'https://signed.invalid/'+path},error:test.signError?'synthetic sign error':null}}}}},
 };
 const fetcher=async(url,init)=>{
  calls.push(['callerFetch',url,init.headers,init.cache]);
  assert.equal(init.headers.apikey,'synthetic-publishable');assert.equal(init.headers.Authorization,'Bearer '+(test.token||'school'));
  const token=init.headers.Authorization.slice(7);
  if(url.endsWith('/auth/v1/user'))return Response.json(authUser(token),{status:authUser(token)?200:401});
  assert(url.endsWith('/rpc/nh7_library_catalog_v396'));assert.equal(init.method,'POST');assert.equal(init.body,'{}');
  return Response.json({items:allowedRows(token),collections:[]},{status:test.catalogStatus||200});
 };
 const fixtureLibrary=(request,payload,options)=>libraryCatalog(request,payload,{...options,fetcher});
 const sandbox={Request,Response,Headers,URL,URLSearchParams,console:{error(){}},crypto:{randomUUID:()=> 'synthetic-batch-id'},Date:class extends Date{constructor(...args){super(...(args.length?args:['2026-10-07T00:00:00.000Z']))}},libraryCatalog:fixtureLibrary,createClient:(url,key,options)=>{calls.push(['createClient',url,key,options]);return admin},Deno:{env:{get:name=>env[name]},serve:fn=>{handler=fn}}};
 const executable=stripTypeScriptTypes(source.replace(/^import .*;\n/gm,''));
 vm.runInNewContext(executable,sandbox);assert.equal(typeof handler,'function');
 const headers={origin:test.origin===undefined?'https://omideno7.github.io':test.origin,'x-device-id':'header-fixture-device','x-user-email':'forged@example.invalid'};
 if(headers.origin===null)delete headers.origin;if(test.token!==null)headers.authorization='Bearer '+(test.token||'school');
 const method=test.method||'POST';
 const request=new Request('https://edge.invalid',{method,headers,...(method==='POST'?{body:test.rawBody===undefined?JSON.stringify(test.body||{}):test.rawBody}:{})});
 const response=await handler(request);
 const text=await response.text();let body;try{body=JSON.parse(text)}catch(_){body=text}
 return JSON.parse(JSON.stringify({status:response.status,headers:Object.fromEntries(response.headers),body,calls}));
}
const cases=[
 ...['https://omideno7.github.io','http://localhost','https://localhost','capacitor://localhost','https://untrusted.invalid',null].flatMap(origin=>[{method:'OPTIONS',origin},{body:{action:'status'},origin}]),
 {method:'GET'}, {token:null},{token:'invalid'},{invalidSession:true},{env:{SUPABASE_URL:''}},{env:{SUPABASE_SERVICE_ROLE_KEY:''}},
 {approved:false,body:{action:'status'}},{approvalError:true},{approved:false,body:{action:'catalog',resource:'sermons'}},
 {rawBody:'invalid json'}, {body:{action:'catalog',resource:'audio_bible_books'}},
 {body:{action:'catalog',resource:'audio_bible_books'},tableError:true},
 {body:{action:'catalog',resource:'audio_bible_chapters',language:'fa'}},
 {body:{action:'catalog',resource:'audio_bible_chapters',language:'fa',query:'language=eq.en'}},
 {body:{action:'catalog',resource:'audio_bible_chapters'},signError:true},
 {body:{action:'catalog',resource:'sermons'}},{body:{action:'catalog',resource:'sermons'},signError:true},
 {body:{action:'catalog',resource:'sermons'},tableError:true},{body:{action:'catalog',resource:'unknown'}},
 {body:{action:'unknown'}},{body:{action:'save_bible_batch',items:[]}},
 {body:{action:'save_bible_batch',user_id:'forged',user_email:'forged@example.invalid',device_id:'body-fixture-device',language:'hr',items:[{verse_ref:'John 3:16',verse_key:'JHN_3_16',verse_text:'synthetic',saved:true,note:'preserve',highlight_color:'yellow'}]}},
 {body:{action:'save_bible_batch',items:Array.from({length:251},(_,i)=>({verse_ref:'fixture-'+i,verse_key:'fixture-'+i,saved:i===0,note:'x'.repeat(3100)}))}},
 {body:{action:'save_bible_batch',items:[{verse_ref:'fixture'}]},tableError:true},
 {approved:false,body:{action:'save_bible_batch',items:[{verse_ref:'must not save'}]}},
];
for(const test of cases)assert.deepEqual(await execute(after,test),await execute(before,test),JSON.stringify(test.body||test));
console.log(`PASS full Edge: ${cases.length} before/after cases have identical responses, CORS, School checks, audio signatures and synthetic Bible writes; non-Library source bytes unchanged.`);
for(const token of ['normal','school','minister','revoked','admin']){
 const test={token,body:{action:'catalog',resource:'library',user_email:'forged@example.invalid',role:'admin'}};
 const old=await execute(before,test),fixed=await execute(after,test);
 assert.equal(old.body.items.filter(row=>row.audience==='ministers').length,2,'Exact legacy School-approved/service-role Library path reproduces the leak');
 assert.deepEqual(fixed.body.items,allowedRows(token));assert.equal(fixed.body.approved,true);assert.equal(fixed.body.user_email,token+'@example.invalid');
 assert.deepEqual(fixed.headers,old.headers,'Existing reply/CORS behavior is retained for Library too');
 assert(!fixed.calls.some(call=>call[0]==='from'&&call[1]==='nh7_library_items'));
 assert.deepEqual(fixed.calls.slice(0,3),old.calls.slice(0,3),'JWT validation and School gate run identically before Library routing');
}
for(const test of [{token:null},{token:'invalid'},{approved:false},{token:'normal',approved:false}]){
 const body={action:'catalog',resource:'library'};
 assert.deepEqual(await execute(after,{...test,body}),await execute(before,{...test,body}));
}
const denied=await execute(after,{catalogStatus:403,body:{action:'catalog',resource:'library'}});assert.equal(denied.status,403);assert.equal(denied.body.items,undefined);
assert(!denied.calls.some(call=>call[0]==='from'&&call[1]==='nh7_library_items'));
console.log('PASS exact Library path: School-approved non-minister/revoked get zero restricted rows; scoped minister/Admin use caller-JWT v396; anonymous/School denial unchanged; no service-role Library read.');
