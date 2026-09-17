const { chromium } = require('/tmp/nh7-rc/node_modules/playwright');

const lessonCodes = [
  'class_01_new_creation','class_02_holy_spirit','class_03_christian_doctrine',
  'class_04a_evangelism','class_04b_cell_ministry','class_05_character_prosperity',
  'class_06_local_assembly','class_07_mobile_technology'
];

const rows = lessonCodes.map((code, i) => ({
  id: `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
  lesson_code: code,
  lesson_order: i + 1,
  is_active: true,
  publish_state: 'published',
  content_data: {
    lesson_code: code,
    lesson_order: i + 1,
    course: { code: 'foundation_school', order: 1, title: { en:'New Hope 7 School', fa:'مدرسه New Hope 7', hr:'Škola New Hope 7' } },
    translations: {
      en: { class_title:`Class ${i<3?i+1:i<5?4:i}`, lesson_title:`Existing Teaching ${i+1}`, lesson_text:i===0?'RC EXISTING SCHOOL TEXT — PRESERVE':'Existing lesson text', assignment_question:`Existing assignment ${i+1}` },
      fa: { class_title:`کلاس ${i<3?i+1:i<5?4:i}`, lesson_title:`تعلیم موجود ${i+1}`, lesson_text:i===0?'متن موجود مدرسه در RC — حفظ شود':'متن درس موجود', assignment_question:`تکلیف موجود ${i+1}` },
      hr: { class_title:`Razred ${i<3?i+1:i<5?4:i}`, lesson_title:`Postojeća lekcija ${i+1}`, lesson_text:i===0?'POSTOJEĆI RC TEKST — SAČUVAJ':'Postojeći tekst', assignment_question:`Postojeći zadatak ${i+1}` }
    },
    written: {
      en:{text:i===0?'RC EXISTING FULL WRITTEN TEACHING — PRESERVE':'Existing full teaching'},
      fa:{text:'متن کامل موجود'}, hr:{text:'Postojeći puni tekst'}
    },
    audio:{available:true,src:i===0?'https://media.example.test/original-school-1.mp3':`https://media.example.test/original-school-${i+1}.mp3`,duration_seconds:600},
    video:{},pdf:{},image:{}
  }
}));

const classes = [
  {class_key:'class_01',class_unlocked:true,passed_already:true,lessons_total:1,lessons_completed:1,lessons_complete:true,assignments_total:1,assignments_approved_count:1,assignments_approved:true,repeat_required:false,ready:false,remaining_attempts:0,week_days:7},
  {class_key:'class_02',class_unlocked:true,passed_already:true,lessons_total:1,lessons_completed:1,lessons_complete:true,assignments_total:1,assignments_approved_count:1,assignments_approved:true,repeat_required:false,ready:false,remaining_attempts:0,week_days:7},
  {class_key:'class_03',class_unlocked:true,passed_already:true,lessons_total:1,lessons_completed:1,lessons_complete:true,assignments_total:1,assignments_approved_count:1,assignments_approved:true,repeat_required:false,ready:false,remaining_attempts:0,week_days:7},
  {class_key:'class_04',class_unlocked:true,passed_already:false,lessons_total:2,lessons_completed:0,lessons_complete:false,assignments_total:2,assignments_approved_count:0,assignments_approved:false,repeat_required:false,ready:false,remaining_attempts:3,week_days:7},
  {class_key:'class_05',class_unlocked:false,passed_already:false,lessons_total:1,lessons_completed:0,lessons_complete:false,assignments_total:1,assignments_approved_count:0,assignments_approved:false,repeat_required:false,ready:false,remaining_attempts:3,week_days:7},
  {class_key:'class_06',class_unlocked:false,passed_already:false,lessons_total:1,lessons_completed:0,lessons_complete:false,assignments_total:1,assignments_approved_count:0,assignments_approved:false,repeat_required:false,ready:false,remaining_attempts:3,week_days:7},
  {class_key:'class_07',class_unlocked:false,passed_already:false,lessons_total:1,lessons_completed:0,lessons_complete:false,assignments_total:1,assignments_approved_count:0,assignments_approved:false,repeat_required:false,ready:false,remaining_attempts:3,week_days:7}
];

function fakeJwt(){
  const enc=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${enc({alg:'none',typ:'JWT'})}.${enc({sub:'11111111-1111-1111-1111-111111111111',email:'qa@example.com',role:'authenticated',exp:Math.floor(Date.now()/1000)+7200})}.qa`;
}

async function installCommonMocks(page, { backendMissing=false }={}) {
  let pathCalls=0, mediaAccessCalls=0, productionCalls=0;
  await page.route('**/*', async route => {
    const u = new URL(route.request().url());
    const cors={'Access-Control-Allow-Origin':'*'};
    if(u.hostname==='127.0.0.1') return route.continue();
    if(u.hostname==='cdn.onesignal.com') return route.fulfill({status:200,contentType:'application/javascript',body:'window.OneSignalDeferred=window.OneSignalDeferred||[];'});
    if(u.hostname==='cdn.jsdelivr.net') return route.fulfill({status:200,contentType:'application/javascript',body:'window.mammoth=window.mammoth||{};'});
    if(u.hostname==='media.example.test' || u.hostname==='signed.example.test') return route.fulfill({status:200,contentType:'audio/mpeg',body:''});
    if(u.hostname==='gpzcwffxnddhaeaogdyo.supabase.co') {
      productionCalls++;
      if(u.pathname.endsWith('/rest/v1/rpc/nh7_school_path_state_v350')) {
        pathCalls++;
        if(backendMissing) return route.fulfill({status:404,contentType:'application/json',headers:cors,body:JSON.stringify({code:'PGRST202',message:'function not found'})});
        return route.fulfill({status:200,contentType:'application/json',headers:cors,body:JSON.stringify({classes,final:{passed_classes:3,required_classes:7,ready:false,passed_already:false}})});
      }
      if(u.pathname.endsWith('/functions/v1/nh7-school-media-access')) {
        mediaAccessCalls++;
        const body=route.request().postDataJSON?.()||{};
        if(body.lesson_code!=='class_01_new_creation') return route.fulfill({status:400,contentType:'application/json',headers:cors,body:JSON.stringify({error:'unexpected_lesson'})});
        return route.fulfill({status:200,contentType:'application/json',headers:cors,body:JSON.stringify({signed_url:'https://signed.example.test/class1.mp3',expires_in:900,mime_type:'audio/mpeg'})});
      }
      if(u.pathname.endsWith('/rest/v1/rpc/nh7_registration_access_v2')) return route.fulfill({status:200,contentType:'application/json',headers:cors,body:JSON.stringify({found:true,status:'approved',approved:true,email:'qa@example.com',registration_id:'reg-qa',payload:{email:'qa@example.com',firstName:'QA',lastName:'Student'}})});
      if(u.pathname.endsWith('/rest/v1/rpc/nh7_registration_status')) return route.fulfill({status:200,contentType:'application/json',headers:cors,body:JSON.stringify({found:true,status:'approved',approved:true,email:'qa@example.com'})});
      if(u.pathname.endsWith('/rest/v1/rpc/nh7_get_my_school_snapshot_v2110')) return route.fulfill({status:200,contentType:'application/json',headers:cors,body:JSON.stringify({progress:[],assignments:[]})});
      if(u.pathname.endsWith('/rest/v1/school_lessons')) return route.fulfill({status:200,contentType:'application/json',headers:cors,body:JSON.stringify(rows)});
      if(u.pathname.endsWith('/rest/v1/school_exams')) return route.fulfill({status:200,contentType:'application/json',headers:cors,body:'[]'});
      if(u.pathname.endsWith('/auth/v1/user')) return route.fulfill({status:200,contentType:'application/json',headers:cors,body:JSON.stringify({id:'11111111-1111-1111-1111-111111111111',email:'qa@example.com'})});
      if(u.pathname.startsWith('/rest/v1/')) return route.fulfill({status:200,contentType:'application/json',headers:cors,body:'[]'});
      if(u.pathname.startsWith('/functions/v1/') || u.pathname.startsWith('/auth/v1/')) return route.fulfill({status:200,contentType:'application/json',headers:cors,body:'{}'});
      return route.fulfill({status:200,contentType:'application/json',headers:cors,body:'{}'});
    }
    return route.fulfill({status:204,body:''});
  });
  return {stats:()=>({pathCalls,mediaAccessCalls,productionCalls})};
}

(async()=>{
  const browser=await chromium.launch({headless:true});

  // Scenario A: v3.5 is loaded naturally by RC index.html and mounts on the real app shell.
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await ctx.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const mock=await installCommonMocks(page);
  await page.addInitScript(({token})=>{
    localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:token,user:{id:'11111111-1111-1111-1111-111111111111',email:'qa@example.com',user_metadata:{full_name:'QA Student'}}}));
    localStorage.setItem('nh7_school_access',JSON.stringify({status:'approved',approvedBy:'admin',email:'qa@example.com',firstName:'QA',lastName:'Student'}));
    localStorage.setItem('nh7_user_profile',JSON.stringify({name:'QA Student',email:'qa@example.com'}));
    localStorage.setItem('nh7_lang','en');
    localStorage.removeItem('nh7_explicit_logout');
  },{token:fakeJwt()});

  const started=Date.now();
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.NH7_SCHOOL_PATH_VERSION==='3.5.0',null,{timeout:8000});
  await page.evaluate(()=>document.getElementById('amenGate')?.classList.add('hidden'));
  await page.locator('.nav-item[data-route="school"]').click({force:true});
  await page.waitForSelector('[data-school-path-v350]',{timeout:8000});
  const mountMs=Date.now()-started;

  if(await page.locator('[data-school-path-v350]').count()!==1) throw Error('v350 mounted more than once');
  if(await page.locator('.nh7-school-class-v350').count()!==7) throw Error('expected seven class cards');
  if(await page.locator('.school-course-group .list-btn').count()!==8) throw Error('source 8 lessons not preserved');
  if(await page.locator('.nh7-school-class-v350').nth(3).locator('.list-btn').count()!==2) throw Error('unlocked class 4 must contain 4A + 4B');
  if(await page.locator('.nh7-school-class-v350').nth(4).locator('.list-btn').count()!==0) throw Error('locked class 5 exposed lesson content');
  if(await page.locator('.nh7-school-guide-v350').getAttribute('open')!==null) throw Error('guide should be collapsed by default');
  if(!(await page.locator('.nh7-school-guide-v350 summary').innerText()).includes('School Guide')) throw Error('English guide missing');

  // Natural language rerender must not duplicate the wrapper.
  for(const [lang,label] of [['fa','راهنمای مدرسه'],['hr','Vodič škole'],['en','School Guide']]){
    await page.selectOption('#langSelect',lang); await page.locator('#langSelect').dispatchEvent('change');
    await page.waitForFunction(expected=>document.querySelector('.nh7-school-guide-v350 summary')?.innerText.includes(expected),label,{timeout:6000});
    if(await page.locator('[data-school-path-v350]').count()!==1) throw Error('language change duplicated v350 wrapper');
  }

  // Candidate clone must still delegate to real app.js lesson rendering.
  await page.locator('.nh7-school-class-v350').nth(0).locator('.list-btn').click({force:true});
  await page.waitForFunction(()=>document.querySelector('#view')?.innerText.includes('RC EXISTING SCHOOL TEXT — PRESERVE'),null,{timeout:8000});
  const txt=await page.locator('#view').innerText();
  if(!txt.includes('RC EXISTING FULL WRITTEN TEACHING — PRESERVE')) throw Error('existing full written lesson not preserved');
  if(await page.locator('.school-assignment').count()!==1) throw Error('existing assignment UI not preserved');
  if(await page.locator('#completeSchoolLesson').count()!==1) throw Error('existing lesson completion control missing');
  if(await page.locator('.school-audio-card').count()!==1) throw Error('existing school audio card missing');
  const mapped=await page.evaluate(()=>window.__sermonMap?.['school-class_01_new_creation']?.audio_url||'');
  if(mapped!=='https://media.example.test/original-school-1.mp3') throw Error('original school audio metadata changed');

  await page.waitForSelector('[data-classic-player]',{timeout:5000});
  await page.locator('[data-classic-toggle]').click({force:true});
  await page.waitForFunction(()=>[...document.querySelectorAll('audio')].some(a=>a.src.includes('signed.example.test/class1.mp3')),null,{timeout:5000});
  if(mock.stats().mediaAccessCalls<1) throw Error('secure school media access was not used');
  if(errors.length) throw Error('page errors: '+errors.join(' | '));

  await page.screenshot({path:'qa-school-v350-rc-natural.png',fullPage:true});
  const statsA=mock.stats();
  await ctx.close();

  // Scenario B: if backend v3.5 is absent, the current School must remain visible and usable.
  const ctx2=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page2=await ctx2.newPage();
  const mock2=await installCommonMocks(page2,{backendMissing:true});
  await page2.addInitScript(({token})=>{
    localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:token,user:{id:'11111111-1111-1111-1111-111111111111',email:'qa@example.com'}}));
    localStorage.setItem('nh7_school_access',JSON.stringify({status:'approved',approvedBy:'admin',email:'qa@example.com',firstName:'QA',lastName:'Student'}));
    localStorage.setItem('nh7_user_profile',JSON.stringify({name:'QA Student',email:'qa@example.com'}));
    localStorage.setItem('nh7_lang','en');
    localStorage.removeItem('nh7_explicit_logout');
  },{token:fakeJwt()});
  await page2.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page2.waitForFunction(()=>window.NH7_SCHOOL_PATH_VERSION==='3.5.0',null,{timeout:8000});
  await page2.evaluate(()=>document.getElementById('amenGate')?.classList.add('hidden'));
  await page2.locator('.nav-item[data-route="school"]').click({force:true});
  await page2.waitForSelector('.school-course-group',{timeout:8000});
  await page2.waitForTimeout(1400);
  if(await page2.locator('[data-school-path-v350]').count()!==0) throw Error('v350 mounted despite missing backend');
  if(await page2.locator('.school-course-group').evaluate(el=>getComputedStyle(el).display)==='none') throw Error('fallback hid existing School');
  if(await page2.locator('.school-course-group .list-btn').count()!==8) throw Error('fallback lost existing lessons');
  await ctx2.close();

  console.log(JSON.stringify({
    RC_SCHOOL_V350_NATURAL_LOAD_OK:true,
    mountMs,
    sourceLessons:8,
    stages:7,
    class4Lessons:2,
    textPreserved:true,
    assignmentPreserved:true,
    audioMetadataPreserved:true,
    signedAudioHandoff:true,
    pathCalls:statsA.pathCalls,
    fallbackPathCalls:mock2.stats().pathCalls
  }));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
