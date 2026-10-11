/* Synthetic WKWebView geometry guard. NOT physical-device verification. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
 try{
 const base=process.env.NH7_PARITY_APP_URL;if(!base)throw Error('NH7_PARITY_APP_URL is required');
 const cases=[['iPhone portrait',390,844,59,34,0],['iPhone landscape',844,390,0,21,59],['iPad portrait',820,1180,24,20,0],['iPad landscape',1180,820,24,20,0]];
 for(const [name,width,height,top,bottom,side] of cases)for(const lang of ['fa','en','hr']){
  const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  await page.addInitScript(({lang})=>{
   window.Capacitor={getPlatform:()=>'ios',isNativePlatform:()=>true};
   localStorage.setItem('nh7_lang',lang);localStorage.setItem('nh7_profile_photo_v561','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=');
  },{lang});
  await page.goto(base);await page.locator('#amenButton').click();await page.waitForSelector('#nh7HomeProfile564 img');
  await page.evaluate(({top,bottom,side})=>{
   const root=document.documentElement;for(const [key,value] of Object.entries({top,bottom,left:side,right:side}))root.style.setProperty('--nh7-parity-safe-'+key,value+'px');
   NH7WebParityV573.measure();
  },{top,bottom,side});
  assert.equal(await page.locator('#nh7HomeProfile564 img').isVisible(),true);
  const photoBefore=await page.evaluate(()=>localStorage.getItem('nh7_profile_photo_v561'));
  const rects=await page.evaluate(()=>{
   const rect=n=>{const r=n.getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height}};
   const nav=document.querySelector('.bottom-nav'),shell=document.querySelector('#appShell'),view=document.querySelector('#view');
   return{header:rect(document.querySelector('.topbar')),headerContent:rect(document.querySelector('.topbar .brand')),nav:rect(nav),view:rect(view),shell:rect(shell),items:[...nav.querySelectorAll('.nav-item')].map(n=>({button:rect(n),icon:rect(n.querySelector('span')),label:rect(n.querySelector('small'))})),max:getComputedStyle(nav).maxHeight,rootScroll:document.scrollingElement.scrollHeight,rootHeight:document.scrollingElement.clientHeight,width:innerWidth,scrollWidth:document.scrollingElement.scrollWidth};
  });
  assert(rects.headerContent.top>=top,JSON.stringify(rects));assert.equal(rects.items.length,6);assert.equal(rects.max,'none');
  assert(Math.abs(rects.header.bottom-rects.view.top)<=1);assert(Math.abs(rects.view.bottom-rects.nav.top)<=1,'no intervening white band');
  assert(Math.abs(rects.nav.bottom-height)<=1);assert(rects.scrollWidth<=width+1);assert(rects.rootScroll<=rects.rootHeight+1,'no page scrolling');
  for(const item of rects.items){
   assert(item.button.height>=44);assert(item.button.bottom<=height-bottom+1);
   for(const r of [item.icon,item.label]){assert(r.height>0);assert(r.top>=rects.nav.top);assert(r.bottom<=height-bottom+1);assert(r.left>=side-1&&r.right<=width-side+1)}
  }
  const hits=await page.evaluate(()=>[...document.querySelectorAll('.bottom-nav .nav-item')].map(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2))}));assert(hits.every(Boolean),'all six nav controls must receive taps');
  await page.evaluate(()=>NH7_NAVIGATE('plans',{tab:'spiritual'}));await page.waitForSelector('.nh7-plans-tabs');
  const tabsBefore=await page.locator('.nh7-plans-tabs').evaluate(n=>({top:n.getBoundingClientRect().top,position:getComputedStyle(n).position,offset:getComputedStyle(n).top}));assert.equal(tabsBefore.position,'relative');assert(['auto','0px'].includes(tabsBefore.offset));
  await page.evaluate(()=>{document.querySelector('#view').insertAdjacentHTML('beforeend','<div style="height:2000px"></div>');document.querySelector('#view').scrollTop=150});
  const tabsAfter=await page.locator('.nh7-plans-tabs').evaluate(n=>n.getBoundingClientRect().top);assert(tabsAfter<tabsBefore.top-100,'Programs tabs must scroll away');
  // Exercise existing dock measurement and actual player CSS without playing audio.
  const playerCSS=fs.readFileSync('js/nh7-media-player-v500.js','utf8').match(/style\.textContent=`([\s\S]*?)`;/)[1];await page.addStyleTag({content:playerCSS});
  await page.evaluate(()=>{document.documentElement.classList.add('nh7p500-active');const p=document.createElement('div');p.id='nh7NativeDockProbe';p.className='nh7p500';p.style.height='56px';p.textContent='Synthetic player geometry probe';document.body.append(p);dispatchEvent(new Event('resize'))});await page.waitForTimeout(100);
  const dock=await page.evaluate(()=>{const p=document.querySelector('#nh7NativeDockProbe');return{player:p.getBoundingClientRect().bottom,position:getComputedStyle(p).position,bottom:getComputedStyle(p).bottom,nav:document.querySelector('.bottom-nav').getBoundingClientRect().top,navMeasure:document.documentElement.style.getPropertyValue('--nh7-parity-nav'),dockMeasure:document.documentElement.style.getPropertyValue('--nh7-mini-dock-bottom'),classes:document.documentElement.className}});assert.equal(dock.position,'fixed');assert(dock.player<=dock.nav-2,JSON.stringify(dock));
  // WKWebView may report a visual viewport shorter than 100dvh: grid must follow it.
  await page.evaluate(height=>{Object.defineProperty(window,'visualViewport',{configurable:true,value:Object.assign(new EventTarget(),{height:height-40,offsetTop:0})});NH7WebParityV573.measure()},height);
  assert(Math.abs(await page.locator('#appShell').evaluate(n=>n.getBoundingClientRect().height)-(height-40))<=1);
  assert.equal(await page.evaluate(()=>localStorage.getItem('nh7_profile_photo_v561')),photoBefore);
  assert.deepEqual(errors,[]);await page.close();console.log(`PASS synthetic ${name} ${lang}: safe rows, six tappable labels/icons, single scroll, tabs, dock, photo and viewport sizing`);
 }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
