/* Issue #115: isolated browser regression. Start a static server at the checkout root,
 * then run: node scripts/verify-i18n-v115.cjs http://127.0.0.1:8765
 * Requires Playwright and Chromium. All non-local requests are mocked; no Production access.
 */
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8765';
assert.match(base, /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/, 'Use an isolated local server');
const locales = ['fa', 'en', 'hr', 'fa'];
const labels = {
  fa: {home:'خانه', back:'برگشت', inbox:'صندوق پیام', language:'زبان برنامه', play:'پخش / توقف', zoom:'بزرگ‌نمایی', mode:'دستی', paper:'کاغذ گرم'},
  en: {home:'Home', back:'Back', inbox:'Notification Inbox', language:'Language', play:'Play / Pause', zoom:'Zoom', mode:'Manual', paper:'Warm Paper'},
  hr: {home:'Početna', back:'Natrag', inbox:'Ulazna pošta obavijesti', language:'Jezik aplikacije', play:'Reproduciraj / Pauziraj', zoom:'Zumiranje', mode:'Ručno', paper:'Topli papir'}
};
(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox']});
  try {
    const context = await browser.newContext({serviceWorkers:'block'});
    const page = await context.newPage();
    const errors = [], writes = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', async route => {
      const request = route.request(), url = request.url();
      if (url.startsWith(base + '/')) return route.continue();
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(url);
      let body = [];
      if (url.includes('/rest/v1/rpc/nh7_library_catalog_v396')) body={items:[{id:'fixture-book',reader_available:true,title_en:'Fixture book',reader_mode:'text'}]};
      if (/\/rest\/v1\/rpc\/nh7_library_reader_access_v(?:250|321)/.test(url)) body={allowed:true,reader_language:'en',title_en:'Fixture book',reader:{pages:[{title:'Chapter 1',text:'Fixture book content'}]}};
      if (url.includes('/auth/v1/user')) body = {id:'00000000-0000-4000-8000-000000000115', email:'fixture@example.invalid'};
      await route.fulfill({status:200, contentType:'application/json', body:JSON.stringify(body)});
    });
    await page.addInitScript(() => {
      const session = {access_token:'isolated-test-token', refresh_token:'isolated-test-refresh', expires_at:4102444800, user:{id:'00000000-0000-4000-8000-000000000115', email:'fixture@example.invalid'}};
      const seed = {
        nh7_lang:'fa', nh7_user_session_v170:JSON.stringify(session),
        nh7_user_profile:JSON.stringify({name:'Fixture User', email:'fixture@example.invalid'}),
        nh7_bookmarks:JSON.stringify(['John 3:16']),
        nh7_bible_state_JHN_3_16:JSON.stringify({saved:true, note:'i18nfixture note', highlight:true, highlightColor:'yellow'}),
        nh7_note_school_fixture:'i18nfixture assignment', nh7_school_progress_fixture:'preserved',
        nh7_audio_favorites_v500:JSON.stringify(['fixture-audio']), nh7_offline_meta_fixture:JSON.stringify({path:'offline_media/fixture.mp3'}),
        nh7_audio_catalog_cache_v470:JSON.stringify({categories:[],sermons:[{id:'00000000-0000-4000-8000-000000000116',title_fa:'صدای i18nfixture',title_en:'i18nfixture audio',title_hr:'i18nfixture zvuk'}]})
      };
      for (const [key,value] of Object.entries(seed)) localStorage.setItem(key,value);
      window.__i18nSeed = seed;
      window.__shared = [];
      navigator.share = async data => window.__shared.push(data);
    });
    await page.goto(base + '/');
    await page.waitForFunction(() => typeof window.NH7_NAVIGATE === 'function');
    if (await page.locator('#amenButton').isVisible()) await page.locator('#amenButton').click();
    const switchLanguage = async locale => {
      // Dispatch the real app's language control event; works while a dialog is open.
      await page.evaluate(locale => {
        const select = document.getElementById('langSelect');
        select.value = locale; select.dispatchEvent(new Event('change', {bubbles:true}));
      }, locale);
      await page.waitForFunction(locale => document.documentElement.lang === locale && document.documentElement.dir === (locale === 'fa' ? 'rtl' : 'ltr'), locale);
      await page.waitForTimeout(300);
      assert.equal(await page.locator('body').getAttribute('dir'), locale === 'fa' ? 'rtl' : 'ltr');
      assert.equal(await page.locator('[data-route="home"] small').innerText(), labels[locale].home);
      assert.equal(await page.locator('#langSelect').getAttribute('aria-label'), labels[locale].language);
      assert.equal(await page.locator('#backBtn').getAttribute('aria-label'), labels[locale].back);
    };
    const routes = ['home','account','settings','bible','daily','school','salvation','inbox','more','audio','soulWinning'];
    for (const route of routes) {
      await page.evaluate(route => window.NH7_NAVIGATE(route), route);
      for (const locale of locales) {
        await switchLanguage(locale);
        const text = await page.locator('#view').innerText();
        assert.ok(text.trim().length, route + ': missing UI');
        if (locale !== 'fa') assert.doesNotMatch(text.replaceAll('فارسی',''), /[\u0600-\u06ff]/, route + ': Persian-only UI in ' + locale);
      }
    }
    console.log('PASS: 11 representative routes, FA → EN → HR → FA; RTL/LTR and navigation labels');
    // Existing appearance dialog must update without replacing controls or draft values.
    await page.evaluate(() => window.NH7AppearancePersonalizationV514.open());
    await page.locator('#nh7ApBg').fill('#123456');
    await page.evaluate(() => {window.__appearanceInput = document.getElementById('nh7ApBg')});
    for (const locale of locales) {
      await switchLanguage(locale);
      assert.equal(await page.locator('[data-ap514-mode="manual"]').innerText(), labels[locale].mode);
      assert.equal(await page.locator('[data-ap514-reader="paper"]').innerText(), labels[locale].paper);
      assert.equal(await page.locator('#nh7ApBg').inputValue(), '#123456');
      assert.equal(await page.evaluate(() => window.__appearanceInput === document.getElementById('nh7ApBg')), true);
      const text = await page.locator('#nh7AppearanceDialog514').innerText();
      if (locale === 'hr') assert.doesNotMatch(text, /Titanium Natural|Classic \/ Original|Warm Paper|Night Reading/);
    }
    await page.locator('#nh7AppearanceDialog514 [data-ap514-close]').first().click();
    console.log('PASS: open appearance dialog translates in place; custom color draft and controls preserved');
    // Exercise the existing picker/crop using an in-memory image; never save or remove a photo.
    await page.evaluate(() => window.NH7_NAVIGATE('account'));
    await page.locator('[data-nh7-profile-file]' ).waitFor({state:'attached'});
    const image = await page.evaluate(() => {const c=document.createElement('canvas');c.width=64;c.height=64;c.getContext('2d').fillRect(0,0,64,64);return c.toDataURL('image/png').split(',')[1]});
    await page.locator('[data-nh7-profile-file]' ).setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
    await page.locator('#nh7PhotoEditor564').waitFor({state:'visible'});
    await page.locator('[data-nh7-crop-zoom]').fill('1.75');
    await page.locator('[data-nh7-crop-zoom]').dispatchEvent('input');
    await page.evaluate(() => {window.__cropCanvas=document.querySelector('[data-nh7-crop-canvas]');window.__cropPixels=window.__cropCanvas.toDataURL()});
    for (const locale of locales) {
      await switchLanguage(locale);
      assert.equal(await page.locator('[data-nh7-crop-zoom]').getAttribute('aria-label'), labels[locale].zoom);
      assert.equal(await page.locator('[data-nh7-crop-zoom]').inputValue(), '1.75');
      assert.equal(await page.evaluate(() => window.__cropCanvas === document.querySelector('[data-nh7-crop-canvas]') && window.__cropPixels === window.__cropCanvas.toDataURL()), true);
    }
    await page.locator('[data-nh7-crop-cancel]').click();
    console.log('PASS: photo picker and crop canvas/zoom survive language switches; photo persistence not changed');
    // Read-only player state fixture: retain the real engine functions and never play/download.
    await page.evaluate(() => {
      const engine=window.NH7_AUDIO_CLASSIC_V400;
      window.__engineGetter=engine.getState;
      const audio={src:'fixture.mp3',paused:true,currentTime:15,duration:120,playbackRate:1,volume:1,muted:false};
      const current={id:'fixture-player',title_fa:'صوت نمونه',title_en:'Fixture audio',title_hr:'Primjer zvuka'};
      engine.getState=()=>({audio,current,playQueue:[current],queueIndex:0,volumeControlSupported:true});
    });
    for (const locale of locales) {
      await switchLanguage(locale);
      assert.equal(await page.locator('[data-mini-toggle]').first().getAttribute('aria-label'),labels[locale].play);
      assert.equal(await page.locator('.nh7p500 [data-play]').first().getAttribute('aria-label'),labels[locale].play);
    }
    await page.evaluate(() => {window.NH7_AUDIO_CLASSIC_V400.getState=window.__engineGetter});
    console.log('PASS: mounted mini/full player accessibility labels; engine behavior untouched');
    await page.waitForFunction(async()=>await window.NH7_OPEN_BOOK('fixture-book'),null,{polling:500});
    await page.locator('[data-book-search]').fill('nonexistentfixture');
    await page.waitForTimeout(250);
    await page.evaluate(()=>{window.__bookArticle=document.querySelector('.nh7-book-article')});
    for(const locale of locales){
      await switchLanguage(locale);
      assert.equal(await page.locator('[data-book-close]').innerText(),'‹ '+(locale==='fa'?'بازگشت':labels[locale].back));
      assert.equal(await page.evaluate(()=>window.__bookArticle===document.querySelector('.nh7-book-article')),true);
      assert.equal(await page.locator('.nh7-book-article').getAttribute('dir'),'ltr');
      assert.equal(await page.locator('[data-book-search]').inputValue(),'nonexistentfixture');
    }
    await page.locator('[data-book-close]').click();
    console.log('PASS: book reader UI switches in place; original document direction and search retained');
    // Search still links to the exact saved verse, then share the actual reference/text.
    await page.evaluate(() => window.NH7_NAVIGATE('home'));
    await switchLanguage('en');
    await page.locator('[data-nh7gs-input]').fill('John 3:16');
    await page.locator('[data-nh7gs562-index]').first().waitFor({state:'visible'});
    await page.locator('[data-nh7gs562-index]').first().click();
    await page.locator('[data-verse-key="nh7_bible_state_JHN_3_16"]').waitFor({state:'visible'});
    assert.ok(decodeURIComponent(await page.evaluate(() => location.hash)).includes('"verse":16'));
    for (const locale of locales) {
      await switchLanguage(locale);
      await page.locator('[data-verse-key="nh7_bible_state_JHN_3_16"]').waitFor({state:'visible'});
    }
    await switchLanguage('en');
    await page.locator('[data-verse-key="nh7_bible_state_JHN_3_16"]').click();
    await page.locator('[data-reader-action452="share"]').click();
    assert.ok((await page.evaluate(() => window.__shared)).some(x=>x.text.includes('3:16')));
    console.log('PASS: exact-result search → John 3:16; FA/EN/HR verse target and native share payload');
    const changed = await page.evaluate(() => Object.entries(window.__i18nSeed).filter(([key,value])=>key!=='nh7_lang' && localStorage.getItem(key)!==value));
    assert.deepEqual(changed, [], 'Language switches altered seeded user data');
    assert.deepEqual(errors, [], 'Runtime JavaScript errors');
    console.log('PASS: notes, saved verses, assignments, progress, favorites, download metadata, profile/account fixtures preserved');
    console.log('All service calls mocked; intercepted background write attempts:', writes.length);
    console.log('Testimony/Prayer user routes absent from this main baseline; no feature import or protected Admin edits.');
  } finally {await browser.close()}
})().catch(error => {console.error(error);process.exitCode=1});
