/* Real note UI and save bridge; remote services mocked, playback state passive. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8878';
assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/);
const id = '12345678-1234-4234-8234-123456789abc';
const key = 'nh7_sermon_note_' + id;
const oldNote = 'یادداشت قدیمی\nExisting note — stara bilješka';
const cases = [
  ['fa', 'rtl', 'right', 'یادداشت خود را بنویسید…', 'English first, سپس متن فارسی'],
  ['en', 'ltr', 'left', 'Write your note…', 'فارسی در ابتدا, then English'],
  ['hr', 'ltr', 'left', 'Napišite bilješku…', 'فارسی در ابتدا, zatim hrvatski'],
];

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  try {
    for (const width of [360, 390, 820]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
      try {
        await context.route('**/*', route => route.request().url().startsWith(base + '/') ? route.continue() : route.fulfill({ json: [] }));
        await context.addInitScript(({ key, oldNote }) => {
          localStorage.setItem('nh7_lang', 'fa');
          localStorage.setItem(key, oldNote);
        }, { key, oldNote });
        const page = await context.newPage();
        await page.goto(base + '/');
        await page.waitForFunction(() => window.NH7_MEDIA_PLAYER_V500 && window.NH7_AUDIO_CLASSIC_V400 && window.NH7_SERMON_NOTE_BRIDGE_V527);
        if (await page.locator('#amenButton').isVisible()) await page.locator('#amenButton').click();
        await page.evaluate(id => {
          const current = { id, title_fa: 'موعظه آزمایشی', title_en: 'Test sermon', title_hr: 'Test propovijed' };
          // No play(), downloads, telemetry or real audio requests are exercised.
          const audio = { src: 'fixture-only', paused: true, currentTime: 0, duration: 120, playbackRate: 1, volume: 1 };
          window.NH7_AUDIO_CLASSIC_V400.getState = () => ({ current, audio, playQueue: [current], queueIndex: 0 });
          window.NH7_MEDIA_PLAYER_V500.sync();
          window.NH7_MEDIA_PLAYER_V500.setExpanded(true);
        }, id);
        const input = page.locator('[data-note-input]');
        const open = () => page.locator('[data-note]').click();
        const close = () => page.locator('[data-note-close]').click();
        const choose = async locale => {
          await page.evaluate(locale => {
            const select = document.getElementById('langSelect');
            select.value = locale;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }, locale);
          await page.waitForFunction(locale => document.documentElement.lang === locale, locale);
        };
        const direction = async ([locale, dir, align, placeholder]) => {
          await page.waitForFunction(({ dir, align }) => {
            const input = document.querySelector('[data-note-input]');
            return input.dir === dir && getComputedStyle(input).direction === dir && getComputedStyle(input).textAlign === align;
          }, { dir, align }, { timeout: 3000 });
          assert.equal(await input.getAttribute('dir'), dir);
          assert.equal(await input.getAttribute('placeholder'), placeholder);
          assert.notEqual(await input.getAttribute('dir'), 'auto');
          const bounds = await input.boundingBox();
          assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width + 1, `${locale}: input overflow`);
          for (const selector of ['[data-note-save]', '[data-note-playpause]', '[data-note-close]']) {
            const button = page.locator(selector);
            assert(await button.isVisible());
            const box = await button.boundingBox();
            assert(box && box.x >= 0 && box.x + box.width <= width + 1, `${locale}: button overflow`);
          }
        };
        await open();
        await direction(cases[0]);
        assert.equal(await input.inputValue(), oldNote);
        assert.equal(await page.evaluate(key => localStorage.getItem(key), key), oldNote);
        // Switching language on an open editor must preserve text, caret and stored bytes.
        await input.evaluate(el => el.setSelectionRange(3, 3));
        for (const locale of ['en', 'fa', 'hr', 'fa']) {
          await choose(locale);
          await direction(cases.find(row => row[0] === locale));
          assert.equal(await input.inputValue(), oldNote);
          assert.equal(await input.evaluate(el => el.selectionStart), 3);
          assert.equal(await page.evaluate(key => localStorage.getItem(key), key), oldNote);
        }
        for (const row of cases) {
          await choose(row[0]);
          await input.fill('');
          await input.focus();
          await direction(row); // Empty editor / placeholder: direction before typing.
          assert.equal(await input.evaluate(el => el.selectionStart), 0);
          await input.fill(row[4]); // First strong character deliberately disagrees with app language.
          await direction(row);
          await page.locator('[data-note-save]').click();
          await page.waitForFunction(({ key, text }) => localStorage.getItem(key) === text, { key, text: row[4] });
          await close();
          await open();
          await direction(row);
          assert.equal(await input.inputValue(), row[4]);
          assert.equal(await page.evaluate(key => localStorage.getItem(key), key), row[4]);
        }
        console.log(`PASS ${width}px: FA RTL/right, EN/HR LTR/left; empty/typed/save/reopen, old-note bytes, live language switching/caret and button bounds.`);
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
