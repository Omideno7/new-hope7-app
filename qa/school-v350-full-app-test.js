const { chromium } = require('/tmp/nh7-full/node_modules/playwright');

const codes = [
  'class_01_new_creation','class_02_holy_spirit','class_03_christian_doctrine',
  'class_04a_evangelism','class_04b_cell_ministry','class_05_character_prosperity',
  'class_06_local_assembly','class_07_mobile_technology'
];

const rows = codes.map((code, i) => ({
  id: `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
  lesson_code: code,
  lesson_order: i + 1,
  is_active: true,
  publish_state: 'published',
  content_data: {
    lesson_code: code,
    lesson_order: i + 1,
    course: { code: 'foundation_school', order: 1, title: { en: 'New Hope 7 School', fa: 'مدرسه New Hope 7', hr: 'Škola New Hope 7' } },
    translations: {
      en: { class_title: `Class ${i < 3 ? i + 1 : i < 5 ? 4 : i}`, lesson_title: `Existing Teaching ${i + 1}`, lesson_text: i === 0 ? 'EXISTING SCHOOL LESSON TEXT — KEEP ME' : `Lesson text ${i + 1}`, assignment_question: `Existing assignment ${i + 1}` },
      fa: { class_title: `کلاس ${i < 3 ? i + 1 : i < 5 ? 4 : i}`, lesson_title: `تعلیم موجود ${i + 1}`, lesson_text: i === 0 ? 'متن موجود مدرسه — باید حفظ شود' : `متن درس ${i + 1}`, assignment_question: `تکلیف موجود ${i + 1}` },
      hr: { class_title: `Razred ${i < 3 ? i + 1 : i < 5 ? 4 : i}`, lesson_title: `Postojeća lekcija ${i + 1}`, lesson_text: i === 0 ? 'POSTOJEĆI TEKST ŠKOLE — SAČUVAJ' : `Tekst lekcije ${i + 1}`, assignment_question: `Postojeći zadatak ${i + 1}` }
    },
    written: { en: { text: i === 0 ? 'EXISTING FULL WRITTEN TEACHING — KEEP ME' : 'Full written lesson' } },
    audio: { available: true, src: i === 0 ? 'https://media.example.test/school-class-1.mp3' : `https://media.example.test/school-${i + 1}.mp3`, duration_seconds: 600 },
    video: {}, pdf: {}, image: {}
  }
}));

// Full-app content-preservation scenario: Classes 1–3 already passed, Class 4 is now unlocked.
// This lets us verify both the existing Class 1 lesson route and the 4A+4B grouping on the real app shell.
const classes = [
  { class_key:'class_01', class_unlocked:true, passed_already:true, lessons_total:1, lessons_completed:1, lessons_complete:true, assignments_total:1, assignments_approved_count:1, assignments_approved:true, repeat_required:false, ready:false, remaining_attempts:0 },
  { class_key:'class_02', class_unlocked:true, passed_already:true, lessons_total:1, lessons_completed:1, lessons_complete:true, assignments_total:1, assignments_approved_count:1, assignments_approved:true, repeat_required:false, ready:false, remaining_attempts:0 },
  { class_key:'class_03', class_unlocked:true, passed_already:true, lessons_total:1, lessons_completed:1, lessons_complete:true, assignments_total:1, assignments_approved_count:1, assignments_approved:true, repeat_required:false, ready:false, remaining_attempts:0 },
  { class_key:'class_04', class_unlocked:true, passed_already:false, lessons_total:2, lessons_completed:0, lessons_complete:false, assignments_total:2, assignments_approved_count:0, assignments_approved:false, repeat_required:false, ready:false, remaining_attempts:3 },
  { class_key:'class_05', class_unlocked:false, passed_already:false, lessons_total:1, lessons_completed:0, assignments_total:1, assignments_approved_count:0 },
  { class_key:'class_06', class_unlocked:false, passed_already:false, lessons_total:1, lessons_completed:0, assignments_total:1, assignments_approved_count:0 },
  { class_key:'class_07', class_unlocked:false, passed_already:false, lessons_total:1, lessons_completed:0, assignments_total:1, assignments_approved_count:0 }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const page = await context.newPage();

  await page.route('**/*', async route => {
    const u = new URL(route.request().url());
    const cors = { 'Access-Control-Allow-Origin': '*' };
    if (u.hostname === '127.0.0.1') return route.continue();
    if (u.hostname === 'cdn.onesignal.com') return route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.OneSignalDeferred=window.OneSignalDeferred||[];' });
    if (u.hostname === 'cdn.jsdelivr.net') return route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.mammoth=window.mammoth||{};' });
    if (u.hostname === 'media.example.test') return route.fulfill({ status: 200, contentType: 'audio/mpeg', body: '' });
    if (u.hostname === 'gpzcwffxnddhaeaogdyo.supabase.co') {
      if (u.pathname.endsWith('/rest/v1/rpc/nh7_registration_access_v2')) return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ found:true, status:'approved', approved:true, email:'qa@example.com', payload:{ email:'qa@example.com', firstName:'QA', lastName:'Student' } }) });
      if (u.pathname.endsWith('/rest/v1/rpc/nh7_registration_status')) return route.fulfill({ status: 200, contentType:'application/json', headers:cors, body:JSON.stringify({ found:true, status:'approved', approved:true }) });
      if (u.pathname.endsWith('/rest/v1/rpc/nh7_get_my_school_snapshot_v2110')) return route.fulfill({ status:200, contentType:'application/json', headers:cors, body:JSON.stringify({ progress:[], assignments:[] }) });
      if (u.pathname.endsWith('/rest/v1/rpc/nh7_school_path_state_v350')) return route.fulfill({ status:200, contentType:'application/json', headers:cors, body:JSON.stringify({ classes, final:{ passed_classes:3, required_classes:7, ready:false, passed_already:false } }) });
      if (u.pathname.endsWith('/rest/v1/school_lessons')) return route.fulfill({ status:200, contentType:'application/json', headers:cors, body:JSON.stringify(rows) });
      if (u.pathname.endsWith('/rest/v1/school_exams')) return route.fulfill({ status:200, contentType:'application/json', headers:cors, body:'[]' });
      if (u.pathname.startsWith('/rest/v1/')) return route.fulfill({ status:200, contentType:'application/json', headers:cors, body:'[]' });
      if (u.pathname.startsWith('/auth/v1/') || u.pathname.startsWith('/functions/v1/')) return route.fulfill({ status:200, contentType:'application/json', headers:cors, body:'{}' });
    }
    return route.fulfill({ status:204, body:'' });
  });

  const started = Date.now();
  await page.goto('http://127.0.0.1:4173/index.html', { waitUntil:'domcontentloaded', timeout:30000 });
  await page.waitForFunction(() => document.querySelector('#view')?.innerText?.length > 0, null, { timeout:10000 });

  await page.evaluate(() => {
    document.getElementById('amenGate')?.classList.add('hidden');
    localStorage.setItem('nh7_user_session_v170', JSON.stringify({ access_token:'qa-access', user:{ id:'qa-user', email:'qa@example.com' } }));
    localStorage.setItem('nh7_school_access', JSON.stringify({ status:'approved', approvedBy:'admin', email:'qa@example.com', firstName:'QA', lastName:'Student' }));
    localStorage.setItem('nh7_user_profile', JSON.stringify({ name:'QA Student', email:'qa@example.com' }));
    localStorage.setItem('nh7_lang','en');
    localStorage.removeItem('nh7_explicit_logout');
  });

  await page.addScriptTag({ url:'http://127.0.0.1:4173/js/nh7-school-path-v350.js' });
  await page.locator('.nav-item[data-route="school"]').click({ force:true });
  await page.waitForSelector('[data-school-path-v350]', { timeout:8000 });

  if (await page.locator('.nh7-school-class-v350').count() !== 7) throw Error('seven-stage wrapper missing');
  if (await page.locator('.school-course-group .list-btn').count() !== 8) throw Error('original 8 lessons not retained');

  const originalParams = await page.locator('.school-course-group .list-btn').evaluateAll(btns => btns.map(b => b.dataset.params || ''));
  if (!originalParams.some(x => x.includes('class_04a_evangelism')) || !originalParams.some(x => x.includes('class_04b_cell_ministry'))) throw Error('source School lost 4A/4B lesson codes');
  if (await page.locator('.nh7-school-class-v350').nth(3).locator('.list-btn').count() !== 2) throw Error('unlocked Class 4 did not show both 4A and 4B');

  await page.locator('.nh7-school-class-v350').nth(0).locator('.list-btn').click({ force:true });
  await page.waitForFunction(() => document.querySelector('#view')?.innerText.includes('EXISTING SCHOOL LESSON TEXT — KEEP ME'), null, { timeout:8000 });
  const text = await page.locator('#view').innerText();
  if (!text.includes('EXISTING FULL WRITTEN TEACHING — KEEP ME')) throw Error('full existing text missing');
  if (await page.locator('.school-audio-card').count() !== 1) throw Error('School audio card missing');
  if (await page.locator('[data-sermon-play="school-class_01_new_creation"]').count() !== 1) throw Error('School audio play button missing');
  if (await page.locator('.school-assignment').count() !== 1) throw Error('existing assignment UI missing');
  if (await page.locator('#completeSchoolLesson').count() !== 1) throw Error('existing completion control missing');

  const mapped = await page.evaluate(() => window.__sermonMap?.['school-class_01_new_creation']?.audio_url || '');
  if (mapped !== 'https://media.example.test/school-class-1.mp3') throw Error('School audio URL changed');
  await page.locator('[data-sermon-play="school-class_01_new_creation"]').click({ force:true });
  await page.waitForTimeout(300);
  const audioSrc = await page.evaluate(() => document.querySelector('audio')?.src || '');
  if (!audioSrc.includes('media.example.test/school-class-1.mp3')) throw Error('shared player did not receive School audio');

  console.log(JSON.stringify({ FULL_APP_SCHOOL_V350_OK:true, schoolMs:Date.now()-started, stages:7, originalLessons:8, class4Lessons:2, textPreserved:true, audioPreserved:true, assignmentPreserved:true }));
  await page.screenshot({ path:'qa-school-v350-full-app-v3.png', fullPage:true });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
