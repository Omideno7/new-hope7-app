/* Actual shipped card/download/PDF viewer and zero-note routes; synthetic service responses only. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  { chromium, webkit } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8765';
assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/);
const app = fs.readFileSync('js/app.js', 'utf8');
assert(app.includes("$$('[data-save-verse-note]').forEach"));
assert(!/(?<!\$)\$\('\[data-save-verse-note\]'\)\.forEach/.test(app));
const pub = {
    id: 'pdf-public',
    audience: 'public',
    resource_type: 'library',
    reader_available: false,
    mime_type: 'application/pdf',
    file_name: 'public.pdf',
    title_en: 'Public PDF',
    title_fa: 'فایل عمومی',
    title_hr: 'Javni PDF',
  },
  minister = { ...pub, id: 'pdf-minister', audience: 'ministers' },
  unknown = { ...pub, id: 'pdf-unknown', audience: 'unknown' };
const host = 'https://gpzcwffxnddhaeaogdyo.supabase.co',
  file = (id) =>
    host + '/storage/v1/object/sign/nh7-library/' + id + '.pdf?token=fixture';
function pdf() {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << >> /Contents 4 0 R >>',
    '<< /Length 0 >>\nstream\n\nendstream',
  ];
  let text = '%PDF-1.4\n',
    offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(text));
    text += i + 1 + ' 0 obj\n' + objects[i] + '\nendobj\n';
  }
  const start = Buffer.byteLength(text);
  text +=
    'xref\n0 5\n0000000000 65535 f \n' +
    offsets
      .slice(1)
      .map((x) => String(x).padStart(10, '0') + ' 00000 n \n')
      .join('') +
    'trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n' +
    start +
    '\n%%EOF\n';
  return text;
}
(async () => {
  const engine = process.env.NH7_TEST_WEBKIT === '1' ? webkit : chromium,
    browser = await engine.launch(
      engine === chromium
        ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] }
        : { headless: true },
    );
  try {
    const context = await browser.newContext({ serviceWorkers: 'block' }),
      page = await context.newPage(),
      errors = [],
      edgeCalls = [];
    let phase = 'granted',
      fileCalls = 0;
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('dialog', (d) => {
      return d.type() === 'confirm' ? d.accept() : d.dismiss();
    });
    await context.route('**/*', async (route) => {
      const req = route.request(),
        u = req.url();
      if (u.startsWith(base + '/')) return route.continue();
      let body = [];
      if (u.includes('nh7_library_catalog_v396'))
        body = {
          items:
            phase === 'reclassified'
              ? [{ ...pub, audience: 'ministers' }, minister, unknown]
              : phase === 'revoked'
                ? [minister, unknown]
                : [pub, minister, unknown],
          collections: [],
        };
      if (u.includes('/functions/v1/nh7-library-access')) {
        const id = JSON.parse(req.postData()).item_id;
        edgeCalls.push(id);
        return route.fulfill({
          json: {
            signed_url: file(id),
            mime_type: 'application/pdf',
            file_name: 'fixture.pdf',
          },
        });
      }
      if (u.includes('/storage/')) {
        fileCalls++;
        return route.fulfill({ contentType: 'application/pdf', body: pdf() });
      }
      if (u.includes('/auth/v1/user'))
        body = { id: 'uid-ui', email: 'fixture@example.invalid' };
      if (u.includes('nh7-content-access'))
        body = { authenticated: true, approved: true };
      if (u.includes('registration')) body = { status: 'approved' };
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });
    await page.addInitScript(() => {
      localStorage.setItem(
        'nh7_user_session_v170',
        JSON.stringify({
          access_token: 'fixture',
          expires_at: 4102444800,
          user: { id: 'uid-ui', email: 'fixture@example.invalid' },
        }),
      );
      localStorage.setItem(
        'nh7_school_access',
        JSON.stringify({ status: 'approved' }),
      );
      localStorage.setItem('nh7_lang', 'en');
    });
    await page.goto(base + '/');
    await page.waitForFunction(() => typeof NH7_NAVIGATE === 'function');
    if (await page.locator('#amenButton').isVisible())
      await page.locator('#amenButton').click();
    const zeroNoteRoutes = ['home', 'more', 'about', 'settings', 'account'];
    if (process.env.NH7_TEST_TEST5 === '1')
      zeroNoteRoutes.push('testimonies', 'prayerRequest');
    for (const route of zeroNoteRoutes) {
      const previousCrumb=await page.locator('#breadcrumb').innerText();
      await page.evaluate((route) => NH7_NAVIGATE(route), route);
      // Navigation starts async rendering; wait until completion before opening the next route.
      await page.waitForFunction(({previousCrumb,route})=>Array.from(document.querySelectorAll('#view h1,#view h2,#view h3')).some(x=>x.textContent==='Error')||document.getElementById('breadcrumb')?.textContent!==previousCrumb||(route==='home'&&!!document.querySelector('#view [data-go]')?.onclick),{previousCrumb,route});
      assert.equal(await page.locator('[data-save-verse-note]').count(), 0);
      assert(await page.locator('#view').isVisible());
      assert(
        !(
          await page.locator('#view h1,#view h2,#view h3').allTextContents()
        ).includes('Error'),
        'Render must not hide runtime crash on ' +
          route +
          ': ' +
          (await page.locator('#view').innerText()),
      );
    }
    assert.deepEqual(
      errors,
      [],
      'Routes without verse-note controls must execute without a Safari null.forEach crash',
    );
    await page.evaluate(() => (window.__offlineDeniedCards = []));
    for (const [tab, id] of [
      ['ministers', 'pdf-minister'],
      ['unknown', 'pdf-unknown'],
    ]) {
      await page.evaluate((tab) => NH7_NAVIGATE('library', { tab }), tab);
      await page.waitForSelector('[data-library-open="' + id + '"]');
      assert.equal(
        await page.locator('[data-library-offline="' + id + '"]').count(),
        0,
      );
      await page.evaluate(
        (id) =>
          __offlineDeniedCards.push(
            document.querySelector('[data-library-open="' + id + '"]'),
          ),
        id,
      );
    }
    await page.evaluate(() => NH7_NAVIGATE('library', { tab: 'public' }));
    await page.waitForSelector('[data-library-offline="pdf-public"]');
    assert.equal(
      await page
        .locator(
          '[data-library-offline="pdf-minister"],[data-library-offline="pdf-unknown"]',
        )
        .count(),
      0,
    );
    await page.locator('[data-library-offline="pdf-public"]').click();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-library-offline="pdf-public"]')?.dataset
          .offlineCached === '1',
    );
    assert.equal(edgeCalls.length, 1);
    assert.equal(fileCalls, 1);
    await context.setOffline(true);
    const before = edgeCalls.length;
    for (let i = 0; i < 2; i++) {
      await page.locator('[data-library-open="pdf-public"]').click();
      await page.waitForSelector('#nh7PdfFrameV223:not(.hidden)');
      const src = await page.locator('#nh7PdfFrameV223').getAttribute('src');
      assert(src.startsWith('blob:'));
      const bytes = await page.evaluate(
        async () =>
          new Uint8Array(
            await (
              await fetch(
                document.querySelector('#nh7PdfFrameV223').src.split('#')[0],
              )
            ).arrayBuffer(),
          ),
      );
      assert.equal(
        Buffer.from(Object.values(bytes)).subarray(0, 8).toString(),
        '%PDF-1.4',
      );
      await page.locator('#nh7PdfViewerV223 [data-pdf-close]').first().click();
    }
    assert.equal(
      edgeCalls.length,
      before,
      'Offline UI reopen must not invoke signed-file Edge',
    );
    assert.equal(fileCalls, 1);
    for (let i = 0; i < 2; i++) {
      await page.evaluate((i) => __offlineDeniedCards[i].click(), i);
      assert.equal(
        await page.locator('#nh7PdfFrameV223:not(.hidden)').count(),
        0,
      );
      if (await page.locator('#nh7PdfViewerV223').count())
        await page
          .locator('#nh7PdfViewerV223 [data-pdf-close]')
          .first()
          .click();
    }
    assert.equal(edgeCalls.length, before);
    await context.setOffline(false);
    phase = 'reclassified';
    await page.evaluate(() => NH7LibrarySecurityV125.catalog());
    assert.equal(
      await page.locator('[data-library-offline="pdf-public"]').count(),
      0,
    );
    assert.equal(
      await page.evaluate(() =>
        NH7LibrarySecurityV125.publicFile('pdf-public'),
      ),
      '',
    );
    assert.equal(
      await page.evaluate(
        async (u) => (await NH7OfflineV325.status(u, true)).cached,
        file(pub.id),
      ),
      false,
    );
    phase = 'granted';
    await page.evaluate(() => NH7_NAVIGATE('library', { tab: 'public' }));
    await page.locator('[data-library-offline="pdf-public"]').click();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-library-offline="pdf-public"]')?.dataset
          .offlineCached === '1',
    );
    phase = 'revoked';
    await page.evaluate(() => NH7LibrarySecurityV125.catalog());
    assert.equal(
      await page.locator('[data-library-open="pdf-public"]').count(),
      0,
    );
    assert.equal(
      await page.evaluate(
        async (u) => (await NH7OfflineV325.status(u, true)).cached,
        file(pub.id),
      ),
      false,
    );
    phase = 'granted';
    await page.evaluate(() => NH7_NAVIGATE('library', { tab: 'public' }));
    await page.locator('[data-library-offline="pdf-public"]').click();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-library-offline="pdf-public"]')?.dataset
          .offlineCached === '1',
    );
    await page.evaluate(
      () =>
        (window.__publicOfflineCard = document.querySelector(
          '[data-library-open="pdf-public"]',
        )),
    );
    await context.setOffline(true);
    for (const mode of ['logout', 'switch']) {
      await page.evaluate((mode) => {
        if (mode === 'logout') localStorage.setItem('nh7_explicit_logout', '1');
        else {
          localStorage.removeItem('nh7_explicit_logout');
          localStorage.setItem(
            'nh7_user_session_v170',
            JSON.stringify({
              access_token: 'other',
              user: { id: 'uid-other' },
            }),
          );
        }
        window.dispatchEvent(new Event('nh7-library-auth-change'));
      }, mode);
      await page.evaluate(() => __publicOfflineCard.click());
      assert.equal(
        await page.locator('#nh7PdfFrameV223:not(.hidden)').count(),
        0,
      );
      if (await page.locator('#nh7PdfViewerV223').count())
        await page
          .locator('#nh7PdfViewerV223 [data-pdf-close]')
          .first()
          .click();
    }
    assert.deepEqual(errors, []);
    console.log(
      'PASS ' +
        (engine === webkit ? 'WebKit' : 'Chromium') +
        ': zero-note runtime routes; actual PUBLIC card verify/download/status → repeated offline PDF opens without Edge/network; Ministers/unknown denied; reclassification/revoke/logout/account switch safe.',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
