/* Actual active Library modules; all non-local services replaced with synthetic fixtures. */
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765';assert.match(base,/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/);
const pub={id:'fixture-public',audience:'public',resource_type:'library',reader_available:true,reader_mode:'text',title_en:'Public fixture',title_fa:'کتاب عمومی',title_hr:'Javna knjiga'};
const restricted={...pub,id:'fixture-restricted',audience:'ministers',title_en:'RESTRICTED125',title_fa:'RESTRICTED125',title_hr:'RESTRICTED125'};
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({serviceWorkers:'block'});const errors=[],requests=[];let phase='minister',status=200;
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',async route=>{
  const req=route.request(),url=req.url();if(url.startsWith(base+'/'))return route.continue();requests.push(url);
  let body=[];let code=200;
  if(url.includes('nh7_library_catalog_v396')){body={items:phase==='minister'?[pub,restricted]:[pub],collections:[]};code=status}
  if(/nh7_library_reader_access_v(?:250|321)/.test(url))body={allowed:phase==='minister'||JSON.parse(req.postData()).p_item_id===pub.id,reader_language:'en',title_en:'Synthetic reader',reader:{pages:[{text:'Synthetic text only'}]}};
  if(url.includes('/auth/v1/user'))body={id:'uid-fixture',email:'fixture@example.invalid'};
  if(url.includes('nh7-content-access')){const payload=JSON.parse(req.postData()||'{}');assert(!(payload.action==='catalog'&&payload.resource==='library'),'Must not invoke School-only Library Edge');body={authenticated:true,approved:true}}
  if(url.includes('registration'))body={status:'approved'};
  await route.fulfill({status:code,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.addInitScript(()=>{
  localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'synthetic-token',expires_at:4102444800,user:{id:'uid-fixture',email:'fixture@example.invalid'}}));
  localStorage.setItem('nh7_school_access',JSON.stringify({status:'approved'}));localStorage.setItem('nh7_lang','fa');
  sessionStorage.setItem('nh7_library_catalog_cache_v1',JSON.stringify({at:Date.now(),items:[{id:'stale',audience:'ministers',title_en:'STALE125'}]}));
 });
 await page.goto(base+'/');await page.waitForFunction(()=>typeof NH7_NAVIGATE==='function');
 if(await page.locator('#amenButton').isVisible())await page.locator('#amenButton').click();
 for(const lang of ['fa','en','hr','fa']){
  await page.evaluate(lang=>{const select=document.getElementById('langSelect');select.value=lang;select.dispatchEvent(new Event('change',{bubbles:true}))},lang);
  await page.evaluate(()=>NH7_NAVIGATE('library',{tab:'ministers'}));
  await page.waitForSelector('[data-library-open="fixture-restricted"]',{state:'attached'});
  assert.equal(await page.locator('html').getAttribute('dir'),lang==='fa'?'rtl':'ltr');
  assert(!await page.locator('#view').innerText().then(x=>x.includes('STALE125')));
 }
 assert(await page.evaluate(()=>NH7_OPEN_BOOK('fixture-restricted')));await page.waitForSelector('.nh7-book-modal');
 phase='revoked';await page.evaluate(()=>NH7LibrarySecurityV125.catalog());
 assert.equal(await page.locator('[data-library-open="fixture-restricted"]').count(),0);assert.equal(await page.locator('.nh7-book-modal').count(),0);
 const readsBefore=requests.filter(url=>url.includes('reader_access')).length;
 assert.equal(await page.evaluate(async()=>{window.alert=()=>{};return NH7_OPEN_BOOK('fixture-restricted')}),false);
 assert.equal(requests.filter(url=>url.includes('reader_access')).length,readsBefore,'Denied deep link must not call reader');
 await page.evaluate(()=>NH7_NAVIGATE('library',{tab:'public'}));await page.waitForSelector('[data-library-open="fixture-public"]',{state:'attached'});
 assert(await page.evaluate(()=>NH7_OPEN_BOOK('fixture-public')));await page.locator('[data-book-close]').click();
 // The active legacy view interception is also UID-scoped, with no Edge catalog fallback.
 const legacy=await page.evaluate(async()=>await(await fetch('https://gpzcwffxnddhaeaogdyo.supabase.co/rest/v1/nh7_library_items_v224?reader_available=eq.true')).json());assert.deepEqual(legacy.map(x=>x.id),[pub.id]);
 phase='minister';await page.evaluate(()=>NH7_NAVIGATE('library',{tab:'ministers'}));await page.waitForSelector('[data-library-open="fixture-restricted"]',{state:'attached'});
 status=403;await page.evaluate(()=>NH7LibrarySecurityV125.catalog());assert.equal(await page.locator('[data-library-open="fixture-restricted"]').count(),0);
 status=200;await page.evaluate(()=>NH7_NAVIGATE('library',{tab:'ministers'}));await page.waitForSelector('[data-library-open="fixture-restricted"]',{state:'attached'});
 await page.evaluate(()=>{localStorage.setItem('nh7_explicit_logout','1');window.dispatchEvent(new Event('nh7-library-auth-change'))});assert.equal(await page.locator('[data-library-open="fixture-restricted"]').count(),0);
 await page.evaluate(()=>NH7_NAVIGATE('home'));await page.waitForSelector('#nh7GlobalSearch560');
 await page.evaluate(()=>NH7GlobalSearchDirectV562.search('RESTRICTED125'));await page.waitForTimeout(800);
 assert.equal(await page.locator('#nh7GlobalSearch560 .nh7-global-search560-row').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS actual active Library: FA → EN → HR → FA, restricted render, revocation removes card/reader, denied direct ID, public reader, legacy view routing, 403 and same-tab logout.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
