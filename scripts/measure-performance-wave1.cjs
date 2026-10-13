/* Development-only synthetic measurement: no remote request leaves the browser fixture. */
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:8878',out=process.argv[3];
assert.match(base,/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/);
const id='12345678-1234-4234-8234-123456789abc';
const session={access_token:'e30.'+Buffer.from(JSON.stringify({exp:4102444800,sub:'qa-wave1'})).toString('base64url')+'.fixture',refresh_token:'fixture-refresh',expires_at:4102444800,user:{id:'qa-wave1',email:'wave1@example.invalid'}};
const item={id:'public-book',audience:'public',resource_type:'library',reader_mode:'text',title_en:'Fixture book',title_fa:'کتاب آزمایشی',title_hr:'Test knjiga',is_active:true,is_published:true};
const sermon={id,title_en:'Fixture sermon',title_fa:'موعظه آزمایشی',title_hr:'Test propovijed',audio_url:base+'/fixture.wav',duration_seconds:180};
async function run(){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});let phase='launch',requests=[];
 const p=await ctx.newPage();await p.clock.install({time:new Date('2026-10-13T00:00:00Z')});await p.clock.pauseAt(new Date('2026-10-13T00:00:01Z'));
 await ctx.addInitScript(()=>{
  window.__wave={timers:{},queries:0,observers:0,listeners:0,hidden:false};
  for(const name of ['setInterval','setTimeout']){const old=window[name];window[name]=function(fn,ms,...args){const source=(new Error().stack.split('\n')[2]||'').match(/\/js\/([^?:]+\.js)/)?.[1]||'other';return old(typeof fn==='function'?function(...a){__wave.timers[source]=(__wave.timers[source]||0)+1;return fn(...a)}:fn,ms,...args)}}
  for(const klass of [Document,Element])for(const name of ['querySelector','querySelectorAll']){const old=klass.prototype[name];klass.prototype[name]=function(...a){__wave.queries++;return old.apply(this,a)}}
  const old=window.MutationObserver;window.MutationObserver=class extends old{constructor(fn){super((...args)=>{__wave.observers++;fn(...args)})}};
  const add=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(...a){__wave.listeners++;return add.apply(this,a)};
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>__wave.hidden});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>__wave.hidden?'hidden':'visible'});
 });
 await ctx.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.origin===base)return route.continue();
  if(!u.hostname.endsWith('.supabase.co'))return route.fulfill({json:[]});
  requests.push({phase,path:u.pathname,method:req.method()});
  const path=u.pathname;let data=[];
  if(req.method()==='POST'&&['user_notes','nh7_account_notes','user_progress','nh7_account_progress','saved_verses','nh7_account_saved_verses'].includes(path.split('/').at(-1)))data=[req.postDataJSON()];
  else if(path.includes('/auth/'))data=path.includes('token')?session:session.user;
  else if(path.endsWith('nh7_library_catalog_v396'))data={allowed:true,items:[item],collections:[]};
  else if(path.endsWith('nh7_inbox_snapshot_v419'))data={messages:[{id:'qa-message',title:'Fixture message',body:'Message',language:'en',delivered_at:'2026-10-13T07:00:00Z'}],receipts:[]};
  else if(path.endsWith('nh7-content-access')){const body=req.postDataJSON();data=body?.action==='save_bible_batch'?{ok:true,saved:body.items.length,batch_id:body.batch_id}:body?.action==='catalog'?{items:[sermon],approved:true}:{authenticated:true,approved:true,user_email:session.user.email};}
  else if(path.endsWith('nh7-school-media-access'))data={signed_url:base+'/fixture.wav',expires_in:900};
  else if(path.includes('nh7_registration'))data=[{found:true,status:'approved',approved:true,payload:{email:session.user.email,firstName:'Fixture'}}];
  else if(path.endsWith('nh7_get_my_school_snapshot_v2110'))data={access:{status:'approved'},lessons:[],assignments:[],progress:[]};
  else if(path.endsWith('nh7_my_student_identity_v127'))data={student_code:'QA-1'};
  else if(path.includes('sermon_social'))data={items:[{sermon_id:id,liked:false,like_count:0,blessings:[]}]};
  else if(path.endsWith('/sermons'))data=[sermon];
  await route.fulfill({json:data});
 });
 const steps=[];
 try{
  await p.goto(base+'/');await p.waitForFunction(()=>window.NH7_NAVIGATE&&window.NH7_MEDIA_PLAYER_V500);if(await p.locator('#amenButton').isVisible())await p.locator('#amenButton').click();
  const step=async(name,action,ms=1000)=>{console.log('MEASURE:',name);phase=name;const before=requests.length,a=await p.evaluate(()=>structuredClone(__wave));await action();await p.clock.runFor(ms);const b=await p.evaluate(()=>structuredClone(__wave));steps.push({name,elapsed_ms:ms,requests:requests.length-before,queries:b.queries-a.queries,observer_callbacks:b.observers-a.observers,timer_callbacks:Object.fromEntries(Object.keys(b.timers).map(k=>[k,b.timers[k]-(a.timers[k]||0)]))});};
  const nav=(r,params={})=>p.evaluate(({r,params})=>NH7_NAVIGATE(r,params),{r,params});
  await step('sign_in',async()=>{await nav('account');await p.waitForSelector('#accountEmail');await p.locator('#accountEmail').fill(session.user.email);await p.locator('#accountPassword').fill('fixture-only');await p.locator('#signInBtn').click();await p.waitForFunction(()=>localStorage.getItem('nh7_user_session_v170')&&location.hash.startsWith('#school'));await nav('home');await p.evaluate(()=>NH7LibrarySecurityV125.catalog());});
  await step('home_idle',async()=>{},45000);
  await step('library',()=>nav('library'),1000);
  await step('library_idle_and_reopen',async()=>{for(let i=0;i<4;i++){await p.clock.runFor(25000);await p.evaluate(()=>NH7LibrarySecurityV125.catalog());}},1000);
  await step('sermon',async()=>{await nav('audio');await p.evaluate(sermon=>{const audio={src:'fixture-only',paused:false,currentTime:15,duration:180,playbackRate:1,volume:1};window.__waveAudio=audio;window.NH7_AUDIO_CLASSIC_V400.getState=()=>({audio,current:sermon,playQueue:[sermon],queueIndex:0});NH7_MEDIA_PLAYER_V500.sync();},sermon);},15000);
  await step('bible_save_note',async()=>{await nav('bible',{section:'written',mode:'chapter',bookId:'JHN',chapter:3,verse:16});await p.waitForSelector('[data-save-verse-note]',{state:'attached'});const button=p.locator('[data-save-verse-note]').first();const noteKey=await button.getAttribute('data-save-verse-note');await p.locator(`textarea[data-note-input="${noteKey}"]`).evaluate(el=>{el.value='Fixture wave note';});await button.evaluate(el=>el.click());},1000);
  await step('inbox',()=>nav('inbox'),1000);
  await step('background',()=>p.evaluate(()=>{__wave.hidden=true;document.dispatchEvent(new Event('visibilitychange'));}),60000);
  await step('foreground',()=>p.evaluate(()=>{__wave.hidden=false;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));}),1000);
  const counts={};for(const r of requests)counts[r.path]=(counts[r.path]||0)+1;
  const result={scenario:'anonymous launch, real account form sign-in against fixture backend, Home 45s, Library 4x25s, passive sermon 15s, actual Bible note save, Inbox, hidden 60s, foreground',limitations:'Mock backend; virtual timers; passive audio state for repeatable UI measurement, not native playback/energy/Production SQL latency.',steps,request_total:requests.length,request_counts:counts,requests,metrics:await p.evaluate(()=>__wave)};
  if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({request_total:result.request_total,request_counts:counts,steps},null,2));
 }finally{await ctx.close();await browser.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1});
