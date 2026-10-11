/* Browser regression using current Web CSS and real presentation/Notes modules. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const read=p=>fs.readFileSync(p,'utf8');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true});
 try{
 for(const width of [390,768,1440])for(const lang of ['fa','en','hr']){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('**/*',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><head></head><body></body></html>'}));
  await page.goto('http://parity.test/');
  const css=['css/styles.css','css/nh7-header-date-v455.css','css/nh7-finalqa-v558.css','css/nh7-web-parity-v573.css'].map(read).join('\n');
  await page.addStyleTag({content:css});
  await page.evaluate(({lang})=>{
   document.documentElement.dir=lang==='fa'?'rtl':'ltr';localStorage.setItem('nh7_lang',lang);
   const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
   localStorage.setItem('nh7_profile_photo_v561',photo);
   localStorage.setItem('nh7_user_session_v170',JSON.stringify({user:{id:'current'},access_token:'fixture-only'}));
   const progress={version:1,plans:{'prayer-30':{startedAt:'2026-10-01',days:{'3':{note:'Current reflection',updatedAt:'2026-10-02'}}}}};
   localStorage.setItem('nh7_spiritual_plans_v240:current',JSON.stringify(progress));
   progress.plans['prayer-30'].days['3'].note='Other account secret';localStorage.setItem('nh7_spiritual_plans_v240:other',JSON.stringify(progress));
   localStorage.setItem('nh7_note_example','Ordinary note');
   document.body.innerHTML='<div id="appShell" class="app-shell"><header class="topbar"><span id="nh7TopProfile564"><img width="40" height="40" src="'+photo+'"></span><div id="date">Header</div></header><main id="view" class="view"><div id="notesPanel"></div><button id="existing">Existing control</button></main><nav class="bottom-nav"><button>Home</button><button>Bible</button></nav></div>';
   window.NH7ProfilePhotoV564={read:()=>localStorage.getItem('nh7_profile_photo_v561')};window.NH7_SPIRITUAL_PLANS={render:params=>{window.openedDay=params}};
   history.replaceState({route:'home',params:{}},'','#home');
   window.addEventListener('popstate',event=>{if(event.state?.route==='plans')NH7_SPIRITUAL_PLANS.render(event.state.params)});
   window.writes=[];const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
   Storage.prototype.setItem=function(...args){window.writes.push(['set',...args]);return set.apply(this,args)};Storage.prototype.removeItem=function(...args){window.writes.push(['remove',...args]);return remove.apply(this,args)};
   window.fetch=()=>{throw Error('Unexpected backend request')};window.confirm=()=>{throw Error('Unexpected delete confirmation')};
   document.getElementById('existing').onclick=()=>window.existingClicked=true;
  },{lang});
  await page.addScriptTag({content:read('js/nh7-web-parity-v573.js')});
  await page.addScriptTag({content:read('js/nh7-my-notes-v234.js')});
  await page.evaluate(()=>NH7WebParityV573.sidebar(document.getElementById('view'),[{label:'Bible chapter 3',route:'bible',params:{section:'written',mode:'chapter',bookId:'GEN',chapter:3},active:true}],'Bible'));
  await page.waitForTimeout(150);
  assert.equal(await page.locator('.nh7-parity-sidebar').isVisible(),width>=768);
  assert.equal(await page.locator('.nh7-parity-sidebar button').getAttribute('data-params'),JSON.stringify({section:'written',mode:'chapter',bookId:'GEN',chapter:3}));
  await page.locator('#existing').click();assert.equal(await page.evaluate(()=>existingClicked),true);
  const bounds=await page.evaluate(()=>{const h=document.querySelector('.topbar').getBoundingClientRect(),n=document.querySelector('.bottom-nav').getBoundingClientRect(),v=document.querySelector('#view'),r=v.getBoundingClientRect(),st=getComputedStyle(v),dateNode=document.querySelector('.nh7-header-date-row455'),dateDisplay=dateNode?getComputedStyle(dateNode).display:'absent';return{headerTop:h.top,headerBottom:h.bottom,headerHeight:h.height,navTop:n.top,navBottom:n.bottom,navHeight:n.height,viewTop:r.top,viewBottom:r.bottom,scroll:document.documentElement.scrollWidth,width:innerWidth,viewOverflowY:st.overflowY,viewPaddingTop:parseFloat(st.paddingTop),viewPaddingBottom:parseFloat(st.paddingBottom),shellHeight:document.querySelector('#appShell').getBoundingClientRect().height,dateDisplay}});
  assert.equal(bounds.headerTop,0,JSON.stringify(bounds));assert(Math.abs(bounds.navBottom-900)<=1,JSON.stringify(bounds));assert.equal(bounds.viewOverflowY,'auto',JSON.stringify(bounds));assert(Math.abs(bounds.viewTop-bounds.headerBottom)<=1,JSON.stringify(bounds));assert(Math.abs(bounds.navTop-bounds.viewBottom)<=1,JSON.stringify(bounds));assert(bounds.viewPaddingTop<=8&&bounds.viewPaddingBottom<=8,JSON.stringify(bounds));assert(bounds.scroll<=bounds.width+1,JSON.stringify(bounds));assert(bounds.shellHeight<=901,JSON.stringify(bounds));if(width<=1366){assert(['none','absent'].includes(bounds.dateDisplay),JSON.stringify(bounds));assert(bounds.headerHeight<=58,JSON.stringify(bounds));assert(bounds.navHeight<=40,JSON.stringify(bounds));}
  const chromeBefore=await page.evaluate(()=>({h:document.querySelector('.topbar').getBoundingClientRect().top,n:document.querySelector('.bottom-nav').getBoundingClientRect().bottom}));
  await page.evaluate(()=>{const v=document.querySelector('#view');v.innerHTML+='<div style="height:1800px"></div>';v.scrollTop=900});await page.waitForTimeout(60);
  const chromeAfter=await page.evaluate(()=>({h:document.querySelector('.topbar').getBoundingClientRect().top,n:document.querySelector('.bottom-nav').getBoundingClientRect().bottom,scrollTop:document.querySelector('#view').scrollTop}));
  assert(chromeAfter.scrollTop>0);assert.equal(chromeAfter.h,chromeBefore.h);assert.equal(chromeAfter.n,chromeBefore.n);
  await page.evaluate(()=>{document.getElementById('date').style.height='140px'});await page.waitForTimeout(100);
  assert(await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nh7-parity-header'))>=140));
  assert(await page.evaluate(()=>{const h=document.querySelector('.topbar').getBoundingClientRect(),v=document.querySelector('#view').getBoundingClientRect();return Math.abs(v.top-h.bottom)<=1}));
  await page.locator('#nh7TopProfile564').focus();await page.keyboard.press('Enter');assert(await page.locator('dialog').isVisible());
  await page.locator('[data-photo-in]').click();assert.match(await page.locator('dialog img').getAttribute('style'),/1.25/);
  await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'nh7TopProfile564');
  const virtual=await page.evaluate(()=>NH7MyNotesV234.collectNotes().filter(n=>n.kind==='plan'));assert.equal(virtual.length,1);assert.equal(virtual[0].text,'Current reflection');assert.equal(virtual[0].readOnly,true);
  const bidi=await page.evaluate(()=>{const p=document.createElement('p');p.setAttribute('dir','auto');p.textContent='یادداشت فارسی';document.body.append(p);return{dir:p.dir,computed:getComputedStyle(p).direction}});assert.equal(bidi.dir,'auto');assert.equal(bidi.computed,'rtl');
  assert.equal(virtual[0].title,{fa:'یادداشت پلن روحانی — روز ۳',en:'Spiritual plan note — day 3',hr:'Bilješka duhovnog plana — dan 3'}[lang]);
  assert(!virtual[0].title.includes('prayer-30'));
  assert.equal(await page.locator('.nh7-my-note-head-v234 strong').filter({hasText:'prayer-30'}).count(),0);
  assert.equal(await page.locator('[data-nh7-note-delete]').count(),1);
  assert.equal(await page.locator('.nh7-my-note-card-v234 p').first().getAttribute('dir'),'auto');
  const progressBefore=await page.evaluate(()=>localStorage.getItem('nh7_spiritual_plans_v240:current'));
  await page.evaluate(async key=>{await NH7MyNotesV234.deleteNote(key);NH7MyNotesV234.openNote(key)},virtual[0].storageKey);
  assert.deepEqual(await page.evaluate(()=>openedDay),{tab:'spiritual',plan:'prayer-30',day:3});assert.deepEqual(await page.evaluate(()=>writes),[]);
  assert.deepEqual(await page.evaluate(()=>history.state),{route:'plans',params:{tab:'spiritual',plan:'prayer-30',day:3}});
  assert.equal(await page.evaluate(()=>localStorage.getItem('nh7_spiritual_plans_v240:current')),progressBefore);
  await page.evaluate(()=>history.back());await page.waitForFunction(()=>history.state?.route==='home');
  await page.evaluate(()=>{localStorage.setItem('nh7_user_session_v170',JSON.stringify({user:{id:'other'},access_token:'fixture-only'}))});
  assert.equal(await page.evaluate(()=>NH7MyNotesV234.collectNotes().find(n=>n.kind==='plan').text),'Other account secret');
  await page.close();console.log(`PASS ${width}px ${lang}: sidebar, chrome, viewer, read-only identity-scoped reflections`);
 }
 // Guard actual integration points and untouched authoritative Profile behavior.
 const app=read('js/app.js'),index=read('index.html'),core=read('sw-release-core-v403.js');
 for(const marker of ['nh7BibleSidebarV573(bookId);','nh7BibleSidebarV573(bookId,chapter);','nh7AudioSidebarV573(categories,catId);','nh7AudioSidebarV573(d.categories,params.cat,true);','sidebar(view,d.lessons.map'])assert(app.includes(marker),marker);
 for(const marker of ["'nav.more':'Više'","audio:'Audio poruke'","testimonies:'Svjedočanstva'","prayerRequest:'Molitveni zahtjev'","['audio','🎧']","['testimonies','✨']","['prayerRequest','🙏']"])assert(app.includes(marker),marker);
 for(const asset of ['js/nh7-web-parity-v573.js','css/nh7-web-parity-v573.css']){assert(index.includes(asset));assert(core.includes(asset))}
 for(const marker of ['publicAudioCardV573','bindPublicAudioV573','audio/mp4;codecs=mp4a.40.2','audio/webm;codecs=opus'])assert(read('js/nh7-community-v502.js').includes(marker),marker);
 const profile564=read('js/nh7-profile-photo-v564.js');assert(profile564.includes("document.getElementById('logoutAccountBtn')||document.getElementById('signInBtn')"),'profile picker must mount for signed-in and signed-out My Profile');
 assert(app.includes("const book=(state.bible.books||[]).find(item=>item.id===bookId)"),'Bible sidebar must be scoped to selected book');
 console.log('PASS current Web route integration and release cache wiring');
 if(process.env.NH7_PARITY_APP_URL){
  for(const width of [390,768,1440]){
   const page=await browser.newPage({viewport:{width,height:1024},serviceWorkers:'block'}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   const base=process.env.NH7_PARITY_APP_URL;
   await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,contentType:'application/json',body:'[]'}));
   await page.addInitScript(()=>{
    localStorage.setItem('nh7_lang','en');
    localStorage.setItem('nh7_spiritual_plans_v240:guest',JSON.stringify({version:1,plans:{'prayer-30':{startedAt:'2026-10-01',days:{'3':{status:'in_progress',startedAt:'2026-10-01',note:'Guest reflection',updatedAt:'2026-10-01'}}}}}));
   });
   await page.goto(base);await page.waitForFunction(()=>typeof window.NH7_NAVIGATE==='function');
   await page.locator('#amenButton').click();
   await page.evaluate(()=>NH7_NAVIGATE('bible',{section:'written',mode:'chapter',bookId:'GEN',chapter:3,verse:4}));
   await page.waitForSelector('#v-4');assert.equal(await page.locator('.nh7-parity-sidebar').isVisible(),width>=768);
   assert(await page.locator('#v-4').evaluate(node=>node.classList.contains('saved-focus')));
   if(width>=768){
    const sidebarParams=await page.locator('.nh7-parity-sidebar button').evaluateAll(nodes=>nodes.map(node=>JSON.parse(node.dataset.params||'{}')));
    assert(sidebarParams.length>1);assert(sidebarParams.every(p=>p.mode==='chapter'&&p.bookId==='GEN'));assert.deepEqual(sidebarParams.slice(0,3).map(p=>p.chapter),[1,2,3]);
    for(const preset of ['midnight','aurora','sapphire']){
     const contrast=await page.evaluate(preset=>{
      const api=NH7ThemeStudioV453;api.set({...api.PRESETS[preset],preset});
      const style=getComputedStyle(document.querySelector('.nh7-parity-sidebar button'));
      const hex=color=>'#'+color.match(/\d+/g).slice(0,3).map(n=>Number(n).toString(16).padStart(2,'0')).join('');
      return api.contrast(hex(style.color),hex(style.backgroundColor));
     },preset);assert(contrast>=4.5,`${preset} sidebar contrast ${contrast}`);
    }
    await page.locator('.nh7-parity-sidebar button').filter({hasText:/^Chapter 2$/}).click();
    await page.waitForFunction(()=>history.state?.params?.chapter===2);await page.waitForSelector('.reader-verse');
   }
   // Physical QA found a Croatian fallback risk: exercise the real language switch and More renderer after Bible checks.
   await page.locator('#langSelect').selectOption('hr');await page.waitForFunction(()=>localStorage.getItem('nh7_lang')==='hr');
   assert.equal((await page.locator('.nav-item[data-route="more"] small').textContent()).trim(),'Više');
   await page.evaluate(()=>NH7_NAVIGATE('more'));await page.waitForSelector('[data-more-navigation456]');
   for(const [route,label] of [['audio','Audio poruke'],['testimonies','Svjedočanstva'],['prayerRequest','Molitveni zahtjev']]){const tile=page.locator(`[data-more-navigation456] [data-go="${route}"]`);assert.equal(await tile.count(),1,route);assert((await tile.textContent()).includes(label),`${route} Croatian label`)}
   await page.locator('#langSelect').selectOption('en');await page.waitForFunction(()=>localStorage.getItem('nh7_lang')==='en');
   await page.evaluate(()=>NH7_NAVIGATE('home'));await page.waitForSelector('#notesPanel',{state:'attached'});
   const before=await page.evaluate(()=>localStorage.getItem('nh7_spiritual_plans_v240:guest'));
   await page.locator('[data-toggle-panel="notesPanel"]').click();
   await page.locator('#notesPanel summary').filter({hasText:'Spiritual Plans'}).click();
   assert.equal(await page.locator('#notesPanel .nh7-my-note-head-v234 strong').textContent(),'Spiritual plan note — day 3');
   await page.locator('#notesPanel [data-nh7-note-open]').click();
   await page.waitForSelector('#nh7PlanNote');assert.equal(await page.locator('#nh7PlanNote').inputValue(),'Guest reflection');
   assert.deepEqual(await page.evaluate(()=>history.state),{route:'plans',params:{tab:'spiritual',plan:'prayer-30',day:3}});
   assert.equal(await page.evaluate(()=>localStorage.getItem('nh7_spiritual_plans_v240:guest')),before);
   await page.evaluate(()=>history.back());await page.waitForFunction(()=>history.state?.route==='home');
   await page.waitForSelector('#notesPanel',{state:'attached'});await page.waitForTimeout(300);
   assert.equal(await page.locator('#nh7PlanNote').count(),0);assert.equal(await page.evaluate(()=>NH7_SPIRITUAL_PLANS.active()),false);
   assert.equal(await page.evaluate(()=>localStorage.getItem('nh7_spiritual_plans_v240:guest')),before);
   await page.evaluate(()=>history.forward());await page.waitForSelector('#nh7PlanNote');
   assert.deepEqual(await page.evaluate(()=>history.state.params),{tab:'spiritual',plan:'prayer-30',day:3});
   assert.equal(await page.locator('#nh7PlanNote').inputValue(),'Guest reflection');
   assert.equal(await page.evaluate(()=>localStorage.getItem('nh7_spiritual_plans_v240:guest')),before);
   assert.deepEqual(errors,[]);await page.close();console.log(`PASS actual index.html ${width}px: exact Bible navigation, localized reflection title, plan route and Back/Forward with byte-identical progress`);
  }
 }
 const profilePage=await browser.newPage({viewport:{width:768,height:900}});
 await profilePage.route('**/*',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));await profilePage.goto('http://profile.test/');
 await profilePage.evaluate(()=>{localStorage.clear();localStorage.setItem('nh7_lang','en');document.body.innerHTML='<select id="langSelect"><option value="en">EN</option></select><div id="view"><section class="card"><h3>Account</h3><button id="signInBtn">Sign in</button></section></div><header class="topbar"><button id="inboxBtn"></button></header>'});
 await profilePage.addScriptTag({content:read('js/nh7-profile-photo-v564.js')});await profilePage.waitForSelector('#nh7AccountProfile564 [data-nh7-profile-pick]');assert.equal(await profilePage.locator('#nh7AccountProfile564 [data-nh7-profile-pick]').count(),1);await profilePage.close();console.log('PASS signed-out My Profile still exposes device-local photo picker');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
