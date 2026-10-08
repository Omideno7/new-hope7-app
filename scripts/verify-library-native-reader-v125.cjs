/* Persistent Chromium processes + unavailable CacheStorage model the reported native limitation.
 * This exercises shipped UI/IndexedDB; it is not a physical WKWebView test. All remote calls mocked. */
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{chromium}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765';assert.match(base,/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/);
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'nh7-reader-restart-'));
const pub={id:'native-public',audience:'public',reader_available:true,reader_mode:'text',reader_status:'ready',resource_type:'library',collection_id:'native-collection',title_en:'Native public text'},
 miss={...pub,id:'native-miss',title_en:'Unprepared public text'},restricted={...pub,id:'native-minister',audience:'ministers'};
let context,phase='public',readerCalls=0,offline=false,lastAlert='';
async function boot(seed=false){
 context=await chromium.launchPersistentContext(profile,{executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox'],serviceWorkers:'block'});
 await context.addInitScript(()=>Object.defineProperty(window,'caches',{value:undefined,configurable:true}));
 if(seed)await context.addInitScript(()=>{
 localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'fixture',expires_at:4102444800,user:{id:'native-uid',email:'qa@example.invalid'}}));localStorage.setItem('nh7_lang','en');
 });
 await context.route('**/*',async route=>{
 const u=route.request().url();if(u.startsWith(base+'/')){if(!offline)return route.continue();const pathname=decodeURIComponent(new URL(u).pathname),file=path.resolve(process.env.NH7_TEST_SOURCE||'.','.'+(pathname==='/'?'/index.html':pathname));const ext=path.extname(file);return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'})[ext]||'application/octet-stream'});}
 if(offline)return route.abort('internetdisconnected');
 let json=[];
 if(u.includes('nh7_library_catalog_v396'))json={items:phase==='reclassified'?[{...pub,audience:'ministers'},miss,restricted]:[pub,miss,restricted],collections:[{id:'native-collection',audience:'public',title_en:'Native collection'}]};
 if(/nh7_library_reader_access_v(?:250|321)/.test(u)){readerCalls++;return route.fulfill({status:phase==='denied'?403:phase==='server-error'?500:200,json:phase==='denied'?{allowed:false,code:'content_access_required'}:phase==='server-error'?{message:'temporary outage'}:{allowed:true,audience:'public',reader_mode:'text',reader_language:'en',reader:{text:'Persistent verified reader bytes'},available_languages:['en']}});}
 assert(!u.includes('/functions/v1/nh7-library-access'),'Text-only book must not use signed-file transport');
 if(u.includes('nh7-content-access'))json={authenticated:true,approved:true};
 if(u.includes('/auth/v1/user'))json={id:'native-uid',email:'qa@example.invalid'};
 if(u.includes('registration'))json={status:'approved'};
 return route.fulfill({json});
 });
 const page=context.pages()[0]||await context.newPage();page.on('dialog',async d=>{lastAlert=d.message();await d.dismiss();});
 await context.setOffline(offline);await page.goto(base+'/');await page.waitForFunction(()=>typeof NH7_NAVIGATE==='function');
 if(await page.locator('#amenButton').isVisible())await page.locator('#amenButton').click();
 await page.evaluate(()=>NH7_NAVIGATE('library',{tab:'public'}));
 await page.locator('[data-nh7-open-collection="native-collection"]').click();return page;
}
async function waitPurged(page){await page.waitForFunction(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('nh7-reader-public-v125',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('readers'),q=tx.objectStore('readers').count();q.onsuccess=()=>resolve(q.result===0);tx.oncomplete=()=>db.close();};r.onerror=()=>reject(r.error);}));}
async function count(page){return page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('nh7-reader-public-v125',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('readers'),q=tx.objectStore('readers').count();q.onsuccess=()=>resolve(q.result);tx.oncomplete=()=>db.close();};r.onerror=()=>reject(r.error);}));}
(async()=>{try{
 let page=await boot(true);
 await page.locator('[data-library-offline="native-public"]').click();await page.waitForSelector('.nh7-book-article');await page.locator('[data-book-close]').click();
 await page.waitForFunction(()=>document.querySelector('[data-library-offline="native-public"]')?.dataset.offlineCached==='1');
 assert.equal(await count(page),1);const onlineCalls=readerCalls;
 await context.close();offline=true;page=await boot(); // New Chromium process; same persisted profile.
 assert(await page.evaluate(()=>NH7LibraryReaderCacheV125.ready('native-public')));
 await page.locator('[data-library-offline="native-public"]').click();await page.waitForSelector('.nh7-book-article');assert.match(await page.locator('.nh7-book-article').innerText(),/Persistent verified reader bytes/);await page.locator('[data-book-close]').click();assert.equal(readerCalls,onlineCalls);
 assert.equal(await page.evaluate(()=>NH7_OPEN_BOOK('native-miss')),false);
 assert.match(lastAlert,/not available offline/);assert.equal(await page.locator('[data-library-open="native-public"]').count(),1);
 assert.equal((await page.evaluate(()=>NH7LibrarySecurityV125.catalog())).items.filter(x=>x.audience==='public').length,2,'Offline miss must not zero the PUBLIC catalog');
 assert.equal(await page.evaluate(()=>NH7_OPEN_BOOK('native-minister')),false);assert.equal(await count(page),1);
 offline=false;await context.setOffline(false);phase='server-error';await page.evaluate(()=>NH7_OPEN_BOOK('native-public'));
 assert.equal(await count(page),1,'Transient online failure must not purge verified data');assert((await page.evaluate(()=>NH7LibrarySecurityV125.catalog())).items.length);
 phase='reclassified';await page.evaluate(()=>NH7LibrarySecurityV125.catalog());await page.waitForFunction(async()=>!(await NH7LibraryReaderCacheV125.ready('native-public')));
 await waitPurged(page);assert.equal(await count(page),0,'PUBLIC→Ministers must purge persistent text');
 phase='public';await page.evaluate(()=>NH7LibrarySecurityV125.catalog());await page.evaluate(()=>NH7_OPEN_BOOK('native-public'));await page.locator('[data-book-close]').click();assert.equal(await count(page),1);
 phase='denied';await page.evaluate(()=>NH7_OPEN_BOOK('native-public'));await waitPurged(page);assert.equal(await count(page),0,'Real online 403 purges payload');
 for(const mode of ['switch','logout']){
 phase='public';await page.evaluate(()=>{localStorage.removeItem('nh7_explicit_logout');localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'fixture',user:{id:'native-uid'}}));window.dispatchEvent(new Event('nh7-library-auth-change'));});
 await page.evaluate(()=>NH7LibrarySecurityV125.catalog());await page.evaluate(()=>NH7_OPEN_BOOK('native-public'));await page.locator('[data-book-close]').click();assert.equal(await count(page),1);
 await page.evaluate(mode=>{if(mode==='logout')localStorage.setItem('nh7_explicit_logout','1');else localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'other',user:{id:'other-uid'}}));window.dispatchEvent(new Event('nh7-library-auth-change'));},mode);
 await waitPurged(page);assert.equal(await count(page),0,mode+' must purge PUBLIC reader records');
 }
 console.log('PASS native persistence model: CacheStorage absent; actual PUBLIC UI ready → full browser process restart/airplane-mode reopen; offline miss retains catalog; transient failure retains data; Ministers/reclassification/403/logout/account switch purge; zero signed-file calls.');
}finally{if(context)await context.close();fs.rmSync(profile,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
