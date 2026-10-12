const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const base = process.argv[2] || 'http://127.0.0.1:8878';
assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/);

const cases = [
  ['fa', 'rtl', 'right'],
  ['en', 'ltr', 'left'],
  ['hr', 'ltr', 'left'],
];

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox'],
  });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await context.route('**/*', route => route.request().url().startsWith(base + '/') ? route.continue() : route.fulfill({ status: 204, body: '' }));
    await context.addInitScript(() => localStorage.setItem('nh7_lang', 'fa'));
    const page = await context.newPage();
    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.NH7_USER_WRITING_DIRECTION_V571?.version === '5.7.1');

    await page.evaluate(() => {
      const shell = document.getElementById('appShell');
      const shellNote = document.createElement('textarea');
      shellNote.id = 'nh7DirectionShellFixture';
      shellNote.value = 'یادداشت فارسی و English';
      shell.appendChild(shellNote);

      const player = document.createElement('div');
      player.className = 'nh7p500';
      player.innerHTML = '<textarea id="nh7DirectionPlayerFixture">پیام صوتی</textarea>';
      document.body.appendChild(player);

      const dialog = document.createElement('textarea');
      dialog.dataset.readerNote452 = '1';
      dialog.id = 'nh7DirectionReaderFixture';
      dialog.value = 'یادداشت آیه';
      document.body.appendChild(dialog);
    });

    const ids = ['#nh7DirectionShellFixture', '#nh7DirectionPlayerFixture', '#nh7DirectionReaderFixture'];
    const check = async ([locale, dir, align]) => {
      await page.evaluate(locale => {
        localStorage.setItem('nh7_lang', locale);
        document.documentElement.lang = locale;
        document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
        window.NH7_USER_WRITING_DIRECTION_V571.refresh();
      }, locale);
      for (const selector of ids) {
        const control = page.locator(selector);
        await control.waitFor();
        assert.equal(await control.getAttribute('dir'), dir, `${locale} ${selector} dir`);
        assert.equal(await control.evaluate(el => getComputedStyle(el).direction), dir, `${locale} ${selector} computed direction`);
        assert.equal(await control.evaluate(el => getComputedStyle(el).textAlign), align, `${locale} ${selector} align`);
      }
    };

    const shell = page.locator(ids[0]);
    await shell.focus();
    await shell.evaluate(el => el.setSelectionRange(4, 4));
    const original = await shell.inputValue();
    for (const row of cases) {
      await check(row);
      assert.equal(await shell.inputValue(), original, `${row[0]} preserved text`);
      assert.equal(await shell.evaluate(el => el.selectionStart), 4, `${row[0]} preserved caret`);
    }

    // A textarea added after initial load must be repaired by the MutationObserver.
    await page.evaluate(() => {
      localStorage.setItem('nh7_lang', 'fa');
      const late = document.createElement('textarea');
      late.id = 'nh7DirectionLateFixture';
      document.getElementById('appShell').appendChild(late);
    });
    await page.waitForFunction(() => {
      const el = document.getElementById('nh7DirectionLateFixture');
      return el?.dir === 'rtl' && getComputedStyle(el).textAlign === 'right';
    });

    // An explicit opt-out remains untouched for any future special-purpose field.
    await page.evaluate(() => {
      const keep = document.createElement('textarea');
      keep.id = 'nh7DirectionPreserveFixture';
      keep.dataset.nh7WritingDirection = 'preserve';
      keep.dir = 'ltr';
      document.getElementById('appShell').appendChild(keep);
      window.NH7_USER_WRITING_DIRECTION_V571.refresh();
    });
    assert.equal(await page.locator('#nh7DirectionPreserveFixture').getAttribute('dir'), 'ltr');

    console.log('PASS: all user writing surfaces follow FA RTL/right and EN/HR LTR/left; dynamic controls, text and caret are preserved.');
    await context.close();
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
