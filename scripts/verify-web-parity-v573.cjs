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
  const bounds=await page.evaluate(()=>({header:document.querySelector('.topbar').getBoundingClientRect().bottom,content:document.querySelector('#view').getBoundingClientRect().top,scroll:document.documentElement.scrollWidth,width:innerWidth}));
  assert(bounds.content>=bounds.header-1,JSON.stringify(bounds));assert(bounds.scroll<=bounds.width+1,JSON.stringify(bounds));
  await page.evaluate(()=>{document.getElementById('date').style.height='140px'});await page.waitForTimeout(100);
  assert(await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nh7-parity-header'))>=140));
  await page.locator('#nh7TopProfile564').focus();await page.keyboard.press('Enter');assert(await page.locator('dialog').isVisible());
  await page.locator('[data-photo-in]').click();assert.match(await page.locator('dialog img').getAttribute('style'),/1.25/);
  await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'nh7TopProfile564');
  const virtual=await page.evaluate(()=>NH7MyNotesV234.collectNotes().filter(n=>n.kind==='plan'));assert.equal(virtual.length,1);assert.equal(virtual[0].text,'Current reflection');assert.equal(virtual[0].readOnly,true);
  assert.equal(virtual[0].title,{fa:'یادداشت پلن روحانی — روز ۳',en:'Spiritual plan note — day 3',hr:'Bilješka duhovnog plana — dan 3'}[lang]);
  assert(!virtual[0].title.includes('prayer-30'));
  assert.equal(await page.locator('.nh7-my-note-head-v234 strong').filter({hasText:'prayer-30'}).count(),0);
  assert.equal(await page.locator('[data-nh7-note-delete]').count(),1);
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
 for(const asset of ['js/nh7-web-parity-v573.js','css/nh7-web-parity-v573.css']){assert(index.includes(asset));assert(core.includes(asset))}
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
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
