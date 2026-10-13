/* Real Library/Inbox/audio UI and persistence under intercepted local fixtures. */
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:8878';assert.match(base,/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/);
const id='12345678-1234-4234-8234-123456789abc';
const session={access_token:'e30.'+Buffer.from(JSON.stringify({exp:4102444800,sub:'qa-wave'})).toString('base64url')+'.fixture',refresh_token:'fixture',user:{id:'qa-wave',email:'wave@example.invalid'}};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
 let catalog={items:[{id:'public',audience:'public',resource_type:'library',reader_mode:'text',title_en:'Book before',title_fa:'کتاب',title_hr:'Knjiga',collection_id:'collection'}],collections:[{id:'collection',audience:'public',title_en:'Collection',title_fa:'مجموعه',title_hr:'Zbirka'}]},counts={};
 await ctx.addInitScript(session=>{
  localStorage.setItem('nh7_user_session_v170',JSON.stringify(session));localStorage.setItem('nh7_school_access',JSON.stringify({status:'approved',email:session.user.email}));localStorage.setItem('nh7_lang','en');
  localStorage.setItem('nh7_sermon_note_12345678-1234-4234-8234-123456789abc','Existing note');
  window.__hidden=false;Object.defineProperty(document,'hidden',{get:()=>__hidden});Object.defineProperty(document,'visibilityState',{get:()=>__hidden?'hidden':'visible'});
  const paused=new WeakMap(),positions=new WeakMap(),loaded=new WeakMap();
  Object.defineProperty(HTMLMediaElement.prototype,'paused',{get(){return paused.get(this)!==false}});
  Object.defineProperty(HTMLMediaElement.prototype,'duration',{get(){return 120}});
  Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{get(){return positions.get(this)||0},set(value){positions.set(this,Number(value))}});
  HTMLMediaElement.prototype.play=function(){paused.set(this,false);if(loaded.get(this)!==this.src){loaded.set(this,this.src);this.dispatchEvent(new Event('loadedmetadata'))}this.dispatchEvent(new Event('playing'));return Promise.resolve()};
  HTMLMediaElement.prototype.pause=function(){if(!this.paused){paused.set(this,true);this.dispatchEvent(new Event('pause'))}};
  window.__mediaActions={};Object.defineProperty(navigator,'mediaSession',{value:{setActionHandler:(key,fn)=>__mediaActions[key]=fn,setPositionState:()=>{}}});
 },session);
 await ctx.route('**/*',async route=>{
  const r=route.request(),url=new URL(r.url());if(url.origin===base)return route.continue();if(!url.hostname.endsWith('.supabase.co'))return route.fulfill({json:[]});
  counts[url.pathname]=(counts[url.pathname]||0)+1;let data=[];const body=r.postData()?JSON.parse(r.postData()):{};
  if(url.pathname.includes('/auth/'))data=session;
  else if(url.pathname.endsWith('nh7_library_catalog_v396'))data=catalog;
  else if(url.pathname.endsWith('nh7_library_reader_access_v321'))data={allowed:true,audience:'public',item_id:'public',reader_mode:'text',reader_text:{text:'Verified reader '+body.p_language,pages:[]}};
  else if(url.pathname.endsWith('nh7-content-access'))data=body.action==='catalog'?{items:[{id,title_en:'Sermon',audio_url:base+'/fixture.wav'}],approved:true}:{authenticated:true,approved:true,user_email:session.user.email};
  else if(url.pathname.endsWith('nh7-school-media-access'))data={signed_url:base+'/fixture.wav',expires_in:900};
  else if(url.pathname.includes('nh7_registration'))data=[{found:true,status:'approved',approved:true,payload:{email:session.user.email}}];
  else if(url.pathname.endsWith('nh7_get_my_school_snapshot_v2110'))data={access:{status:'approved'},lessons:[],assignments:[],progress:[]};
  else if(url.pathname.endsWith('nh7_inbox_snapshot_v419'))data={messages:[{id:'wave-message',title:'Message',body:'Content',language:body.p_language,delivered_at:'2026-10-13T07:00:00Z'}],receipts:[]};
  else if(url.pathname.includes('sermon_social'))data={items:[{sermon_id:id,like_count:0,blessings:[]}]};
  await route.fulfill({json:data});
 });
 const p=await ctx.newPage();
 try{
  await p.goto(base+'/');await p.waitForFunction(()=>NH7_MEDIA_PLAYER_V500&&window.NH7_NAVIGATE);if(await p.locator('#amenButton').isVisible())await p.locator('#amenButton').click();
  await p.evaluate(()=>NH7_NAVIGATE('library'));await p.waitForSelector('[data-nh7-open-collection="collection"]');await p.locator('[data-nh7-open-collection="collection"]').click();
  assert(await p.locator('[data-nh7-library-collection-host] [data-library-open="public"]').isVisible());
  catalog={...catalog,items:[{...catalog.items[0],title_en:'Book after'}]};await p.evaluate(()=>NH7LibrarySecurityV125.catalog(true));
  await p.waitForFunction(()=>document.querySelector('[data-nh7-library-collection-host]')?.dataset.nh7CurrentCollection==='collection'&&document.querySelector('[data-nh7-collection-books]')?.textContent.includes('Book after'));
  for(const language of ['fa','en','hr']){
   await p.evaluate(language=>{const select=document.getElementById('langSelect');select.value=language;select.dispatchEvent(new Event('change',{bubbles:true}))},language);
   await p.waitForFunction(language=>document.documentElement.lang===language,language);
   const reader=await p.evaluate(async language=>(await fetch('https://gpzcwffxnddhaeaogdyo.supabase.co/rest/v1/rpc/nh7_library_reader_access_v321',{method:'POST',body:JSON.stringify({p_item_id:'public',p_language:language})})).json(),language);
   assert.equal(reader.allowed,true);
   await p.waitForFunction(()=>NH7LibraryReaderCacheV125.ready('public'));
   await ctx.setOffline(true);await p.evaluate(()=>window.dispatchEvent(new Event('offline')));
   const offline=await p.evaluate(async()=>(await fetch('https://gpzcwffxnddhaeaogdyo.supabase.co/rest/v1/rpc/nh7_library_reader_access_v321',{method:'POST',body:JSON.stringify({p_item_id:'public'})})).json());
   assert.equal(offline.reader_text.text,'Verified reader '+language);
   await ctx.setOffline(false);await p.evaluate(()=>window.dispatchEvent(new Event('online')));
  }
  await p.evaluate(()=>NH7_NAVIGATE('inbox'));await p.waitForSelector('[data-inbox-open="wave-message"]');await p.locator('[data-inbox-open="wave-message"]').click();await p.evaluate(()=>NH7_INBOX_BADGE_SYNC.sync(true));
  assert((await p.evaluate(()=>JSON.parse(localStorage.getItem('nh7_inbox_messages')))).find(x=>x.id==='wave-message').read);
  await p.evaluate(()=>{localStorage.setItem('nh7_inbox_deleted_ids',JSON.stringify(['wave-message']))});await p.evaluate(()=>NH7_INBOX_BADGE_SYNC.sync(true));
  assert(!(await p.evaluate(()=>JSON.parse(localStorage.getItem('nh7_inbox_messages')))).some(x=>x.id==='wave-message'));
  await p.evaluate(async({id,base})=>{await NH7_AUDIO_CLASSIC_V400.playItem({id,title_en:'Sermon',analytics_type:'sermon',audio_url:base+'/fixture.wav',duration_seconds:120});NH7_MEDIA_PLAYER_V500.setExpanded(true)}, {id,base});
  await p.locator('[data-note]').click();assert.equal(await p.locator('.nh7p500 [data-note-input]').inputValue(),'Existing note');
  await p.locator('.nh7p500 [data-note-input]').fill('Saved Wave note');await p.locator('[data-note-save]').click();await p.locator('[data-note-close]').click();await p.locator('[data-note]').click();assert.equal(await p.locator('.nh7p500 [data-note-input]').inputValue(),'Saved Wave note');
  await p.evaluate(()=>{const a=NH7_AUDIO_CLASSIC_V400.getState().audio;a.currentTime=31.75;a.dispatchEvent(new Event('timeupdate'));a.pause()});
  const progress=await p.evaluate(id=>JSON.parse(localStorage.getItem('nh7_sermon_progress_'+id)),id);assert.equal(progress.time,31.75);
  await p.evaluate(()=>NH7_AUDIO_CLASSIC_V400.getState().audio.play());
  await p.evaluate(()=>{__hidden=true;document.dispatchEvent(new Event('visibilitychange'))});
  assert.equal(await p.evaluate(()=>NH7_AUDIO_CLASSIC_V400.getState().audio.paused),false,'background must not pause playback');
  await p.evaluate(()=>__mediaActions.pause());assert.equal(await p.evaluate(()=>NH7_AUDIO_CLASSIC_V400.getState().audio.paused),true);
  await p.evaluate(()=>__mediaActions.play());assert.equal(await p.evaluate(()=>NH7_AUDIO_CLASSIC_V400.getState().audio.paused),false);
  await p.evaluate(()=>__mediaActions.seekforward({seekOffset:15}));assert.equal(await p.evaluate(()=>NH7_AUDIO_CLASSIC_V400.getState().audio.currentTime),46.75);
  await p.evaluate(()=>{__hidden=false;document.dispatchEvent(new Event('visibilitychange'))});await p.waitForFunction(()=>document.querySelector('.nh7p500 [data-now]').textContent==='0:46');
  assert.equal(await p.evaluate(id=>localStorage.getItem('nh7_sermon_note_'+id),id),'Saved Wave note');
  console.log('PASS real Library refresh keeps collection open; FA/EN/HR verified v321 offline replay; Inbox read/delete preservation; actual engine note/progress save, pause/resume/background and Media Session actions. Remote endpoints mocked; not native-device energy acceptance.');
 }finally{await ctx.close();await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
