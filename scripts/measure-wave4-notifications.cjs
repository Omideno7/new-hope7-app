/* Real-timer browser counters; every remote request/provider call is intercepted. */
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const {intercept,seed}=require('./fixtures/wave3-admin.cjs');
const base=process.argv[2]||'http://127.0.0.1:8878',out=process.argv[3];
assert.match(base,/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/);
async function sample(browser,panel){
 const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:820,height:1180}});
 try{await seed(ctx,'owner',panel);const calls=await intercept(ctx,base);await ctx.addInitScript(()=>{
  window.__w4={timers:{},sdk:[],notification_ticks:0,observers:0,listeners:0,hidden:false};
  for(const name of ['setTimeout','setInterval']){const original=window[name];window[name]=function(fn,ms,...args){const file=(new Error().stack||'').match(/\/js\/([^?:]+\.js)/)?.[1]||'inline';return original(typeof fn==='function'?function(...a){if(fn.name==='queueBind'||String(fn).includes('attempts++;install()'))__w4.notification_ticks++;__w4.timers[file]=(__w4.timers[file]||0)+1;return fn(...a)}:fn,ms,...args)}}
  const M=MutationObserver;window.MutationObserver=class extends M{constructor(fn){super((...args)=>{__w4.observers++;fn(...args)})}};
  const add=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(...args){__w4.listeners++;return add.apply(this,args)};
  Object.defineProperty(document,'hidden',{get:()=>__w4.hidden});
  let externalId='';const record=(method,value)=>{__w4.sdk.push({method,value});return Promise.resolve()};
  const sdk={init:()=>record('init'),login:id=>{externalId=id;return record('login',id)},logout:()=>{externalId='';return record('logout')},User:{getExternalId:()=>externalId,setLanguage:l=>record('language',l),getLanguage:()=>localStorage.getItem('nh7_lang'),addTags:t=>record('tags',t),removeTag:t=>record('removeTag',t),PushSubscription:{id:'fixture-subscription',optedIn:true,addEventListener:()=>{},optIn:()=>record('optIn')}},Notifications:{permission:true,isPushSupported:()=>true,addEventListener:()=>{}}};
  const queue=[];queue.push=fn=>{Promise.resolve().then(()=>fn(sdk)).catch(()=>{});return 1};window.OneSignalDeferred=queue;
 });const page=await ctx.newPage();
 await page.goto(base+(panel?'/admin-v239-stable.html':'/index.html'));
 await page.waitForFunction(panel?()=>window.nh7OpenMessageCenterV416&&window.NH7AdminAuthorityWave3?.snapshot().is_owner:()=>window.NH7_NAVIGATE);
 await new Promise(r=>setTimeout(r,12000));const phases=[];
 async function phase(name,action,ms){const start=calls.length,a=await page.evaluate(()=>structuredClone(__w4));await action();await new Promise(r=>setTimeout(r,ms));const b=await page.evaluate(()=>structuredClone(__w4));phases.push({name,observed_ms:ms,requests:calls.slice(start),sdk:b.sdk.slice(a.sdk.length),observers:b.observers-a.observers,listeners:b.listeners-a.listeners,notification_ticks:b.notification_ticks-a.notification_ticks,timer_callbacks:Object.fromEntries(Object.entries(b.timers).map(([k,v])=>[k,v-(a.timers[k]||0)]))})}
 await phase('foreground_idle',async()=>{},60000);
 await phase('stable_binding_lifecycle',()=>page.evaluate(()=>{for(let n=0;n<20;n++)window.dispatchEvent(new Event('pageshow'))}),750);
 if(panel)await phase('compose_open_preview_cancel',async()=>{await page.evaluate(()=>nh7OpenMessageCenterV416());await page.waitForSelector('#nh7MsgBodyV416:not(.hidden)');await page.click('#nh7MsgCloseV416')},500);
 await phase('background',()=>page.evaluate(()=>{__w4.hidden=true;document.dispatchEvent(new Event('visibilitychange'))}),60000);
 if(!panel)await phase('account_switch_binding',()=>page.evaluate(()=>{const uid='32345678-1234-4234-8234-123456789abc';localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'e30.'+btoa(JSON.stringify({sub:uid,exp:4102444800}))+'.fixture',user:{id:uid,email:'switch@example.invalid'}}));window.dispatchEvent(new StorageEvent('storage',{key:'nh7_user_session_v170'}));window.dispatchEvent(new Event('pageshow'))}),750);
 assert.equal(calls.filter(c=>c.path.endsWith('nh7-admin-messaging-v360')).length,0);
 return{surface:panel?'Admin':'signed-in app',startup_requests:calls.slice(0,calls.length-phases.reduce((n,p)=>n+p.requests.length,0)),phases,request_total:calls.length,metrics:await page.evaluate(()=>__w4)};
 }finally{await ctx.close()}
}
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{const surfaces=await Promise.all([sample(browser,false),sample(browser,true)]);const result={source_url:base,date:'2026-10-14',limitations:'Actual advancing browser clock and real wall timers, local intercepted .invalid data and fake SDK only. No live sends, SQL latency, physical energy, provider/device delivery or billing inference.',surfaces};if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(surfaces.map(s=>({surface:s.surface,requests:s.request_total,phases:s.phases.map(p=>({...p,requests:p.requests.length}))})),null,2))}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
