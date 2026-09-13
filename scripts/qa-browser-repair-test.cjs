'use strict';
const fs=require('fs'),path=require('path');
const {chromium,webkit}=require('/tmp/nh7-browser/node_modules/playwright');
const ROOT=process.cwd(),OUT=path.join(ROOT,'qa-repair-evidence');
fs.mkdirSync(OUT,{recursive:true});
const report={source:process.env.GITHUB_SHA,mode:'browser-functional-test-no-production-network',cases:[]};
const mime=f=>f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.html')?'text/html':f.endsWith('.json')?'application/json':f.endsWith('.png')?'image/png':'text/plain';
const safetyDeadline=setTimeout(()=>{console.error('Browser test deadline exceeded');process.exit(1)},180000);safetyDeadline.unref();
let activePage=null;
(async()=>{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch({headless:true});
  for(const staleSession of [false,true]){
   const item={engine,staleSession,errors:[],missing:[],intercepted:[],views:[]};report.cases.push(item);
   const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   await ctx.routeWebSocket('**/*',ws=>ws.close());
   await ctx.route('**/*',async route=>{
    const req=route.request(),u=new URL(req.url());
    if(['blob:','data:'].includes(u.protocol))return route.continue();
    if(u.hostname==='raw.githack.com'&&['GET','HEAD'].includes(req.method())){
     const match=u.pathname.match(/^\/Omideno7\/new-hope7-app\/[^/]+\/(.*)$/);
     if(match){const rel=decodeURIComponent(match[1]);if(!rel.split('/').includes('..')){const f=path.join(ROOT,rel);if(fs.existsSync(f)&&fs.statSync(f).isFile())return route.fulfill({status:200,body:fs.readFileSync(f),contentType:mime(f),headers:{'Access-Control-Allow-Origin':'*'}})}}
     item.missing.push(u.pathname);return route.fulfill({status:404,body:'Missing QA asset'});
    }
    item.intercepted.push({method:req.method(),host:u.hostname,path:u.pathname});
    return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({message:'External API blocked by browser test harness'}),headers:{'Access-Control-Allow-Origin':'*'}});
   });
   if(staleSession)await ctx.addInitScript(()=>{localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'synthetic-not-a-real-token',refresh_token:'synthetic-not-a-real-refresh',user:{id:'00000000-0000-4000-8000-000000000001',email:'qa@example.invalid'}}))});
   const p=await ctx.newPage();activePage=p;p.on('pageerror',e=>item.errors.push({message:e.message,stack:e.stack}));
   p.on('console',e=>{if(e.type()==='error'&&/QA load error|Startup script|Unpackaged/.test(e.text()))item.errors.push({message:e.text()})});
   const started=Date.now();
   await p.goto('https://raw.githack.com/Omideno7/new-hope7-app/'+process.env.GITHUB_SHA+'/qa-runtime-repaired.html',{waitUntil:'domcontentloaded',timeout:30000});
   await p.waitForFunction(()=>document.getElementById('view')?.textContent.trim().length>80,{},{timeout:15000});
   item.localHomeMs=Date.now()-started;
   await p.waitForTimeout(2500);
   item.loadStatus=await p.locator('#nh7QaLoadStatus').allTextContents();
   if(item.loadStatus.some(x=>/error|loading/i.test(x)))throw new Error(engine+' loader did not finish: '+item.loadStatus.join(' '));
   if(await p.locator('#amenButton').isVisible())await p.locator('#amenButton').click();
   await p.screenshot({path:path.join(OUT,engine+'-'+staleSession+'-home.png')});
   for(const [r,expected] of [['home','Church'],['daily','Daily'],['bible','Bible'],['more','Settings']]){
    await p.locator('.nav-item[data-route="'+r+'"]').click({timeout:4000});
    await p.waitForFunction(text=>document.getElementById('view')?.textContent.includes(text),expected,{timeout:10000});
    const text=await p.locator('#view').innerText();item.views.push({route:r,characters:text.length,text:text.slice(0,400)});
   }
   await p.locator('.nav-item[data-route="audio"]').click({timeout:4000});
   await p.waitForFunction(()=>{
    const gate=document.querySelector('.nh7-access-card-v230,.nh7-audio-login-gate');
    return (gate&&/Sign in|Registration/i.test(gate.textContent))||/School registration is required/.test(document.getElementById('view')?.textContent||'');
   },{},{timeout:10000});
   item.audioGate=true;
   const close=p.locator('.nh7-access-close-v230');if(await close.isVisible())await close.click();
   await p.locator('.nav-item[data-route="more"]').click({timeout:4000});
   await p.locator('[data-go="settings"]').click({timeout:4000});
   await p.waitForFunction(()=>document.getElementById('view')?.querySelectorAll('input,select,button').length>5,{},{timeout:10000});
   item.settingsControls=await p.locator('#view input,#view select,#view button').count();
   await p.screenshot({path:path.join(OUT,engine+'-'+staleSession+'-settings.png')});
   item.newFeatureFlags=await p.evaluate(()=>({appearance:!!window.NH7_APPEARANCE_V430,quickBible:!!window.NH7_BIBLE_QUICK_V430,audioSocial:!!window.NH7_AUDIO_SOCIAL_V430,progress:!!window.NH7_PROGRESS_V431,experience:!!window.NH7_SOUL_JOURNAL_V440,guard:!!window.NH7_TEST_STATUS?.readOnly}));
   if(item.errors.length||item.missing.length||Object.values(item.newFeatureFlags).some(v=>!v))throw new Error(engine+' failed runtime checks');
   item.passed=true;await ctx.close();activePage=null;
  }
  await browser.close();
 }
 report.passed=report.cases.length===4&&report.cases.every(x=>x.passed);
 fs.writeFileSync(path.join(OUT,'browser-report.json'),JSON.stringify(report,null,2));
 console.log('QA_BROWSER_REPORT',JSON.stringify(report,null,2));clearTimeout(safetyDeadline);
})().catch(async e=>{report.passed=false;report.failure=String(e);if(activePage){report.failureText=(await activePage.locator('body').innerText().catch(()=>'' )).slice(0,2500);await activePage.screenshot({path:path.join(OUT,'failure.png')}).catch(()=>{})}fs.writeFileSync(path.join(OUT,'browser-report.json'),JSON.stringify(report,null,2));console.error('QA_BROWSER_REPORT',JSON.stringify(report,null,2));process.exit(1)});
