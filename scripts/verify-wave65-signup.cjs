/* Real current canonical module, isolated form and synthetic GoTrue/RPC responses only. */
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{A,B,session}=require('./fixtures/wave6-user.cjs');const base=process.argv[2]||'http://127.0.0.1:8878';assert.match(base,/^http:\/\/127\.0\.0\.1:\d+$/);
const fields={firstName:'Sara',lastName:'Novak',birthDate:'2000-02-29',city:'Zagreb',country:'Croatia',spiritualAge:'2 years',churchMember:'no',waterBaptism:'yes',salvationPrayer:'yes',eventsInterest:'no',testimony:'Fixture story',howFound:'Family',phone:'+385912345678',email:'a@example.invalid',password:'CorrectPass123!',confirmPassword:'CorrectPass123!'};
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
for(const scenario of ['created','confirmation','existing-correct','existing-wrong','unconfirmed-existing','offline','timeout','stale-signup','invalid-repeat','strict-confirmation']){
 const ctx=await browser.newContext({serviceWorkers:'block'}),calls=[];let submit=0,auth=0,release,held=false;
 await ctx.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());if(u.origin===base){if(u.pathname==='/wave65-fixture.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><script src="js/nh7-security-registration-wave65.js"></script><script src="js/nh7-registration-canonical-v353.js"></script></head><body><div id="view">'+Object.entries(fields).map(([k,v])=>`<div class="form-row"><input id="reg_${k}" value="${v}"></div>`).join('')+'<button data-submit-registration="school">Submit</button><div id="registrationSubmitStatus"></div></div></body></html>'});return route.continue();}
 calls.push(u.pathname);let status=200,data={};if(scenario==='offline')return route.abort('internetdisconnected');if(scenario==='timeout'){await new Promise(r=>setTimeout(r,100));return route.abort('timedout');}
 if(u.pathname.includes('/signup')){auth++;if(scenario==='stale-signup'){held=true;await new Promise(r=>release=r);}if(scenario.startsWith('existing')||scenario==='unconfirmed-existing'){status=422;data={code:'user_already_exists',message:'already registered'}}else data=scenario.includes('confirmation')?{user:{id:A,identities:[{id:'synthetic'}]}}:session(A);}
 else if(u.pathname.includes('/token')){if(scenario==='existing-wrong'){status=400;data={code:'invalid_credentials',message:'Invalid login credentials'}}else if(scenario==='unconfirmed-existing'){status=400;data={code:'email_not_confirmed',message:'email not confirmed'}}else data=session(A);}
 else if(u.pathname.includes('/rpc/nh7_submit_registration')){submit++;data={status:'pending',registration_id:'fixture'};}
 else if(u.pathname.includes('/rpc/nh7_registration_status'))data={found:true,status:'pending',registration_id:'fixture'};
 await route.fulfill({status,json:data});
 });const p=await ctx.newPage();await p.goto(base+'/wave65-fixture.html');await p.waitForFunction(()=>window.NH7CanonicalRegistrationV353);await p.waitForFunction(()=>document.getElementById('reg_phone').inputMode==='tel');
 if(scenario==='timeout')await p.evaluate(()=>{const original=setTimeout;window.setTimeout=(fn,ms,...args)=>original(fn,ms===22000?30:ms,...args)});
 if(scenario==='strict-confirmation')await p.evaluate(()=>window.NH7_REGISTRATION_STRICT_WAVE65_ENABLED=true);
 if(scenario==='invalid-repeat')await p.locator('#reg_phone').fill('00000000000');
 await p.locator('[data-submit-registration]').click();
 if(scenario==='stale-signup'){for(let i=0;i<100&&!held;i++)await p.waitForTimeout(10);assert(held);await p.evaluate(s=>{localStorage.setItem('nh7_user_session_v170',JSON.stringify(s));localStorage.setItem('nh7_user_profile','B stays');},session(B));release();}
 await p.waitForFunction(()=>document.querySelector('[data-submit-registration]').dataset.submitting!=='1');
 if(['created','confirmation','existing-correct','unconfirmed-existing'].includes(scenario))assert.equal(submit,1,scenario);
 else assert.equal(submit,0,scenario);
 if(scenario==='strict-confirmation')assert(calls.some(x=>x.endsWith('nh7_registration_status')));
 if(scenario==='existing-wrong'){assert(calls.some(x=>x.endsWith('/recover')));assert.equal(await p.evaluate(()=>localStorage.getItem('nh7_school_access')),null);}
 if(scenario==='unconfirmed-existing')assert(calls.some(x=>x.endsWith('/resend')));
 if(scenario==='invalid-repeat'){for(let i=0;i<5;i++)await p.locator('[data-submit-registration]').click();assert.equal(auth,0);assert.equal(calls.length,0);}
 if(scenario==='stale-signup'){assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('nh7_user_session_v170')).user.id),B);assert.equal(await p.evaluate(()=>localStorage.getItem('nh7_user_profile')),'B stays');}
 assert(calls.length<=4,scenario+' bounded');await ctx.close();console.log('PASS Wave65 signup fixture',scenario);
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
