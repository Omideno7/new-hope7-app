/* Full app local-first UI/restart/reconciliation under intercepted fixtures. */
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:8878';assert.match(base,/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/);
const id='12345678-1234-4234-8234-123456789abc';
const session={access_token:'e30.'+Buffer.from(JSON.stringify({exp:4102444800,sub:'qa-wave'})).toString('base64url')+'.fixture',refresh_token:'fixture',user:{id:'qa-wave',email:'wave@example.invalid'}};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
 const db=new Map(),writes=[];let failTable='';
 let catalog={items:[{id:'public',audience:'public',resource_type:'library',reader_mode:'text',title_en:'Book before',title_fa:'کتاب',title_hr:'Knjiga',collection_id:'collection'}],collections:[{id:'collection',audience:'public',title_en:'Collection',title_fa:'مجموعه',title_hr:'Zbirka'}]},counts={};
 await ctx.addInitScript(session=>{
  window.__rawQa=localStorage;
  if(!localStorage.getItem('qa_lf_seeded')){localStorage.setItem('qa_lf_seeded','1');localStorage.setItem('nh7_user_session_v170',JSON.stringify(session));}
  window.__offline=sessionStorage.getItem('qa_lf_offline')==='1';Object.defineProperty(navigator,'onLine',{get:()=>!__offline});localStorage.setItem('nh7_school_access',JSON.stringify({status:'approved',email:session.user.email}));localStorage.setItem('nh7_lang','en');
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
  if(await route.request().frame().evaluate(()=>window.__offline))return route.abort('internetdisconnected');
  const table=url.pathname.split('/').at(-1),supported=['user_notes','nh7_account_notes','user_progress','nh7_account_progress','saved_verses','nh7_account_saved_verses'];
  if(supported.includes(table)){
   if(table===failTable)return route.fulfill({status:503,json:{error:'fixture partial failure'}});
   const q=url.searchParams,rows=db.get(table)||[],body=r.postDataJSON()||{},match=row=>[...q].every(([k,v])=>!v.startsWith('eq.')||String(row[k])===v.slice(3)),selected=rows.filter(match);
   if(r.method()==='GET')return route.fulfill({json:selected});
   writes.push({table,method:r.method()});
   if(r.method()==='DELETE'){db.set(table,rows.filter(row=>!match(row)));return route.fulfill({json:selected})}
   if(r.method()==='PATCH'){selected.forEach(row=>Object.assign(row,body));return route.fulfill({json:selected})}
   const keys=(q.get('on_conflict')||'').split(',');let existing=rows.find(row=>keys.every(k=>row[k]===body[k]));
   if(existing&&r.headers().prefer?.includes('ignore-duplicates'))return route.fulfill({json:[]});
   if(existing)Object.assign(existing,body);else{existing=body;rows.push(body)}db.set(table,rows);return route.fulfill({json:[existing]});
  }
  counts[url.pathname]=(counts[url.pathname]||0)+1;let data=[];const body=r.postData()?JSON.parse(r.postData()):{};
  if(url.pathname.includes('/auth/'))data=session;
  else if(url.pathname.endsWith('nh7_library_catalog_v396'))data=catalog;
  else if(url.pathname.endsWith('nh7_library_reader_access_v321'))data={allowed:true,audience:'public',item_id:'public',reader_mode:'text',reader_text:{text:'Verified reader '+body.p_language,pages:[]}};
  else if(url.pathname.endsWith('nh7-content-access'))data=body.action==='save_bible_batch'?{ok:true,saved:body.items.length,batch_id:body.batch_id}:body.action==='catalog'?{items:[{id,title_en:'Sermon',audio_url:base+'/fixture.wav'}],approved:true}:{authenticated:true,approved:true,user_email:session.user.email};
  else if(url.pathname.endsWith('nh7-school-media-access'))data={signed_url:base+'/fixture.wav',expires_in:900};
  else if(url.pathname.includes('nh7_registration'))data=[{found:true,status:'approved',approved:true,payload:{email:session.user.email}}];
  else if(url.pathname.endsWith('nh7_get_my_school_snapshot_v2110'))data={access:{status:'approved'},lessons:[],assignments:[],progress:[]};
  else if(url.pathname.endsWith('nh7_inbox_snapshot_v419'))data={messages:[{id:'wave-message',title:'Message',body:'Content',language:body.p_language,delivered_at:'2026-10-13T07:00:00Z'}],receipts:[]};
  else if(url.pathname.includes('sermon_social'))data={items:[{sermon_id:id,like_count:0,blessings:[]}]};
  await route.fulfill({json:data});
 });
 const p=await ctx.newPage();
 const offline=async(value)=>p.evaluate(value=>{__offline=value;sessionStorage.setItem('qa_lf_offline',value?'1':'0');window.dispatchEvent(new Event(value?'offline':'online'))},value);
 const play=async()=>p.evaluate(async({id,base})=>{await NH7_AUDIO_CLASSIC_V400.playItem({id,title_en:'Sermon',analytics_type:'sermon',audio_url:base+'/fixture.wav',duration_seconds:120});NH7_MEDIA_PLAYER_V500.setExpanded(true)}, {id,base});
 const start=async()=>{await p.goto(base+'/');await p.waitForFunction(()=>window.NH7LocalFirstWave2&&window.NH7_NAVIGATE&&window.NH7_MEDIA_PLAYER_V500);if(await p.locator('#amenButton').isVisible())await p.locator('#amenButton').click();};
 try{
  await start();await p.waitForTimeout(1200);await play();await p.locator('[data-note]').click();
  assert.equal(await p.locator('.nh7p500 [data-note-input]').inputValue(),'Existing note');
  for(const language of ['fa','en','hr']){
   await p.evaluate(language=>{const select=document.getElementById('langSelect');select.value=language;select.dispatchEvent(new Event('change',{bubbles:true}))},language);
   await p.waitForFunction(language=>document.documentElement.lang===language,language);
   const input=p.locator('.nh7p500 [data-note-input]');assert.equal(await input.getAttribute('dir'),language==='fa'?'rtl':'ltr');
   await input.fill('Online '+language);await p.locator('[data-note-save]').click();await p.locator('[data-note-close]').click();await p.locator('[data-note]').click();assert.equal(await input.inputValue(),'Online '+language);
   await p.evaluate(()=>NH7LocalFirstWave2.flush());
   await offline(true);await input.fill('Offline '+language);await p.locator('[data-note-save]').click();
   assert.equal(await p.evaluate(id=>localStorage.getItem('nh7_sermon_note_'+id),id),'Offline '+language);
   await start();assert.equal(await p.evaluate(()=>navigator.onLine),false);
   assert.equal(await p.evaluate(id=>localStorage.getItem('nh7_sermon_note_'+id),id),'Offline '+language);
   await offline(false);await play();await p.locator('[data-note]').click();assert.equal(await p.locator('.nh7p500 [data-note-input]').inputValue(),'Offline '+language);
   await p.evaluate(()=>NH7LocalFirstWave2.flush());await p.waitForTimeout(100);
   assert.equal(db.get('nh7_account_notes').find(row=>row.note_key==='sermon_note_'+id).content,'Offline '+language);
  }
  const toggleApo=()=>p.evaluate(async()=>{const article=document.createElement('article');article.className='nh7-apo-verse';article.innerHTML='<span class="nh7-apo-verse-text">Fixture public verse</span><button data-nh7-apo-save="APO:TOB:1:1"></button>';document.getElementById('view').append(article);await NH7ApoActionsV452.toggleSave(article.querySelector('button'));article.remove()});
  await offline(true);await toggleApo();assert((await p.evaluate(()=>JSON.parse(localStorage.getItem('nh7_bookmarks')))).includes('APO:TOB:1:1'));await start();assert((await p.evaluate(()=>JSON.parse(localStorage.getItem('nh7_bookmarks')))).includes('APO:TOB:1:1'));await offline(false);await p.evaluate(()=>NH7LocalFirstWave2.flush());assert(db.get('nh7_account_saved_verses').some(row=>row.ref==='APO:TOB:1:1'));
  await offline(true);await toggleApo();await start();await offline(false);await p.evaluate(()=>NH7LocalFirstWave2.flush());assert(!db.get('nh7_account_saved_verses').some(row=>row.ref==='APO:TOB:1:1'));
  await play();await p.locator('[data-favorite]').click();assert((await p.evaluate(()=>JSON.parse(localStorage.getItem('nh7_audio_favorites_v500')))).includes(id));
  const ownerText=await p.evaluate(id=>localStorage.getItem('nh7_sermon_note_'+id),id);
  await offline(true);await p.evaluate(()=>NH7_SERMON_NOTE_BRIDGE_V527.save('owner-pending','User one secret'));
  await p.evaluate(()=>{localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'other',user:{id:'other',email:'other@example.invalid'}}));window.dispatchEvent(new Event('nh7-library-auth-change'))});
  assert.equal(await p.evaluate(id=>localStorage.getItem('nh7_sermon_note_'+id),id),null);
  assert.equal(await p.locator('.nh7p500 [data-note-input]').inputValue(),'');assert.equal(await p.locator('[data-note-panel]').isVisible(),false);
  assert.equal(await p.evaluate(()=>NH7LocalFirstWave2.pending().length),0);
  await p.evaluate(()=>{const a=NH7_AUDIO_CLASSIC_V400.getState().audio;a.currentTime=55;a.dispatchEvent(new Event('timeupdate'))});assert.equal(await p.evaluate(id=>localStorage.getItem('nh7_sermon_progress_'+id),id),null,'old playing session cannot write new-owner progress');
  await p.evaluate(session=>{localStorage.setItem('nh7_user_session_v170',JSON.stringify(session));window.dispatchEvent(new Event('nh7-library-auth-change'))},session);
  assert.equal(await p.evaluate(id=>localStorage.getItem('nh7_sermon_note_'+id),id),ownerText);
  // Actual My Notes delete action, with browser confirm and offline durable intent.
  await p.evaluate(()=>NH7_SERMON_NOTE_BRIDGE_V527.save('delete-browser','Delete browser note'));await offline(false);await p.evaluate(()=>NH7LocalFirstWave2.flush());await offline(true);
  p.on('dialog',dialog=>dialog.accept());await p.evaluate(()=>{NH7_MEDIA_PLAYER_V500.setExpanded(false);NH7_NAVIGATE('profile')});await p.waitForTimeout(500);
  await p.evaluate(()=>{let panel=document.getElementById('notesPanel');if(!panel){panel=document.createElement('section');panel.id='notesPanel';document.getElementById('view').append(panel)}NH7MyNotesV234.renderNotesPanel()});
  await p.locator('[data-nh7-note-delete="nh7_sermon_note_delete-browser"]').click();
  assert.equal(await p.evaluate(()=>localStorage.getItem('nh7_sermon_note_delete-browser')),null);
  await start();await offline(false);await p.evaluate(()=>NH7LocalFirstWave2.flush());assert(!db.get('nh7_account_notes').some(row=>row.note_key==='sermon_note_delete-browser'));
  await play();await p.evaluate(()=>{const a=NH7_AUDIO_CLASSIC_V400.getState().audio;a.currentTime=38.5;a.dispatchEvent(new Event('timeupdate'));a.pause()});
  const position=await p.evaluate(id=>JSON.parse(localStorage.getItem('nh7_sermon_progress_'+id)),id);assert.equal(position.time,38.5);
  await p.evaluate(()=>{__hidden=true;document.dispatchEvent(new Event('visibilitychange'))});await p.evaluate(()=>{__hidden=false;document.dispatchEvent(new Event('visibilitychange'))});await p.evaluate(()=>NH7LocalFirstWave2.flush());
  assert.equal(JSON.parse(await p.evaluate(id=>localStorage.getItem('nh7_sermon_progress_'+id),id)).time,38.5);
  await start();assert.equal(JSON.parse(await p.evaluate(id=>localStorage.getItem('nh7_sermon_progress_'+id),id)).time,38.5);
  assert((await p.evaluate(()=>JSON.parse(localStorage.getItem('nh7_audio_favorites_v500')))).includes(id));
  for(const width of [390,820,1280]){await p.setViewportSize({width,height:900});await p.evaluate(()=>NH7_NAVIGATE('profile'));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))}
  console.log('PASS full-app authenticated/offline startup, FA/EN/HR note direction/save/reopen, offline reload/reconnect, owner fencing of open editor, actual My Notes offline deletion, position/restart, phone/tablet/desktop. Fixtures intercept all remote requests; no Production mutation.');
 }finally{await ctx.close();await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
