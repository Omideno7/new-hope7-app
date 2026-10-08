/* Real browser IDB/Cache Storage + native Filesystem fixture. No Production/network access. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8765';
assert.match(base, /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/);
const host = 'https://gpzcwffxnddhaeaogdyo.supabase.co',
  pub = { id: 'public-book', audience: 'public' },
  minister = { id: 'minister-book', audience: 'ministers' };
const url = (id) =>
  host + '/storage/v1/object/sign/nh7-library/' + id + '.pdf?token=synthetic';
(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  try {
    const context = await browser.newContext({ serviceWorkers: 'block' }),
      page = await context.newPage();
    let phase = 'minister',
      fileCalls = 0;
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await context.route('**/*', async (route) => {
      const req = route.request(),
        u = req.url();
      if (u === base + '/__optionb_test__')
        return route.fulfill({
          contentType: 'text/html',
          body: '<!doctype html><html lang="en"><body></body></html>',
        });
      if (u.startsWith(base + '/')) return route.continue();
      if (u.includes('nh7_library_catalog_v396'))
        return route.fulfill({
          json: {
            items:
              phase === 'minister'
                ? [pub, minister]
                : phase === 'reclassify'
                  ? [{ ...pub, audience: 'ministers' }]
                  : [pub],
            collections: [],
          },
        });
      if (u.includes('nh7_library_reader_access_v321')) {
        const id = JSON.parse(req.postData()).p_item_id;
        return route.fulfill({
          json: {
            allowed: true,
            item: { id },
            reader: {
              pages: [
                {
                  text:
                    id === 'public-book' ? 'PUBLIC TEXT' : 'MINISTERS SECRET',
                },
              ],
            },
          },
        });
      }
      if (u.includes('nh7-library-access'))
        return route.fulfill({
          json: { signed_url: url(JSON.parse(req.postData()).item_id) },
        });
      if (u.includes('/storage/')) {
        fileCalls++;
        return route.fulfill({
          contentType: 'application/pdf',
          body: 'PUBLIC FILE BYTES',
        });
      }
      return route.abort();
    });
    await page.goto(base + '/__optionb_test__');
    await page.evaluate(() => {
      localStorage.setItem(
        'nh7_user_session_v170',
        JSON.stringify({
          access_token: 'fixture',
          user: { id: 'uid-one', email: 'fixture@example.invalid' },
        }),
      );
      for (const key of [
        'nh7_account_notes',
        'nh7_bible_marks',
        'nh7_school_progress',
      ])
        localStorage.setItem(key, 'KEEP');
    });
    await page.evaluate(async () => {
      const legacy = await caches.open('nh7reader-offline-v327');
      for (const id of ['public-book', 'minister-book']) {
        const identity = ['fixture@example.invalid', id, 'fa'].join('|');
        let h = 2166136261;
        for (let i = 0; i < identity.length; i++) {
          h ^= identity.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        await legacy.put(
          new Request(
            new URL(
              '__nh7_reader_cache_v327__/' + (h >>> 0).toString(16),
              location.href,
            ),
          ),
          Response.json({
            allowed: true,
            item: { id },
            reader: {
              pages: [
                {
                  text:
                    id === 'public-book' ? 'LEGACY PUBLIC' : 'LEGACY MINISTERS',
                },
              ],
            },
          }),
        );
      }
    });
    for (const file of [
      'js/nh7-library-security-v125.js',
      'js/nh7-offline-persistence-v323.js',
      'js/nh7-library-language-v321.js',
    ])
      await page.addScriptTag({ url: base + '/' + file });
    const result = await page.evaluate(
      async ({ host, publicUrl, restrictedUrl }) => {
        const security = NH7LibrarySecurityV125,
          offline = NH7OfflineV325;
        await security.catalog();
        // Successful existing signed-file flow binds an EXACT path to a current UID-scoped item.
        await fetch(host + '/functions/v1/nh7-library-access', {
          method: 'POST',
          body: JSON.stringify({ item_id: 'public-book' }),
        });
        await fetch(host + '/functions/v1/nh7-library-access', {
          method: 'POST',
          body: JSON.stringify({ item_id: 'minister-book' }),
        });
        const download = await offline.download(publicUrl, 'Public');
        let blocked = false;
        try {
          await offline.download(restrictedUrl, 'Restricted');
        } catch (_) {
          blocked = true;
        }
        const reader = await fetch(
          host + '/rest/v1/rpc/nh7_library_reader_access_v250',
          {
            method: 'POST',
            body: JSON.stringify({ p_item_id: 'public-book' }),
          },
        );
        const restrictedReader = await fetch(
          host + '/rest/v1/rpc/nh7_library_reader_access_v250',
          {
            method: 'POST',
            body: JSON.stringify({ p_item_id: 'minister-book' }),
          },
        );
        const readerKeys = await (
          await caches.open('nh7reader-public-v125')
        ).keys();
        const snapshots = JSON.stringify({
          ...localStorage,
          ...sessionStorage,
        });
        return {
          bytes: download.bytes,
          blocked,
          cached: (await offline.status(publicUrl, true)).cached,
          local: !!(await offline.localPlayable(publicUrl)),
          reader: reader.ok,
          restrictedReader: restrictedReader.ok,
          readerKeys: readerKeys.map((x) => x.url),
          secret: snapshots.includes('MINISTERS SECRET'),
        };
      },
      { host, publicUrl: url(pub.id), restrictedUrl: url(minister.id) },
    );
    assert(
      result.bytes > 0 &&
        result.blocked &&
        result.cached &&
        result.local &&
        result.reader &&
        result.restrictedReader &&
        !result.secret,
    );
    assert.equal(
      result.readerKeys.length,
      2,
      'Verified legacy public reader survives migration alongside new English reader',
    );
    assert.equal(
      await page.evaluate(
        async () =>
          (await (await caches.open('nh7reader-offline-v327')).keys()).length,
      ),
      0,
      'Identifiable Ministers reader deleted, public migrated',
    );
    assert(result.readerKeys[0].includes(pub.id));
    assert.equal(fileCalls, 1, 'Ministers download must not request bytes');
    // Exercise the actual shipped worker with real browser IDB/cache and an isolated worker scope.
    const worker = fs.readFileSync('sw-offline-v329.js', 'utf8');
    await page.evaluate((code) => {
      const handlers = {};
      const scope = {
        location: { origin: location.origin },
        registration: { scope: location.origin + '/' },
        addEventListener(type, fn) {
          handlers[type] = fn;
        },
      };
      window.testWorker = new Function(
        'self',
        code + ';return {storedMedia,mediaKey};',
      )(scope);
      testWorker.fetchForTest = (request) =>
        new Promise((resolve) =>
          handlers.fetch({
            request,
            respondWith: (response) => resolve(response),
            waitUntil() {},
          }),
        );
    }, worker);
    assert.equal(
      await page.evaluate(
        async (u) => !!(await testWorker.storedMedia(u)),
        url(pub.id),
      ),
      true,
    );
    assert.equal(
      await page.evaluate(
        async (u) => !!(await testWorker.storedMedia(u)),
        url(minister.id),
      ),
      false,
    );
    // Seed an unknown legacy restricted file: neither canonical URL nor worker may replay it.
    await page.evaluate(async (u) => {
      const identity = NH7OfflineV325.canonical(u);
      await new Promise((resolve) => {
        const r = indexedDB.open('nh7-offline-media-v4', 1);
        r.onsuccess = () => {
          const tx = r.result.transaction('media', 'readwrite');
          tx.objectStore('media').put({
            identity,
            sourceUrl: u,
            blob: new Blob(['UNKNOWN LEGACY SECRET']),
          });
          tx.oncomplete = () => {
            r.result.close();
            resolve();
          };
        };
      });
    }, url('unknown'));
    assert.equal(
      await page.evaluate(
        async (u) =>
          (await NH7OfflineV325.status(NH7OfflineV325.canonical(u), true))
            .cached,
        url('unknown'),
      ),
      false,
    );
    assert.equal(
      await page.evaluate(
        async (u) => !!(await testWorker.storedMedia(u)),
        url('unknown'),
      ),
      false,
    );
    assert.equal(
      await page.evaluate(
        async (u) =>
          (await testWorker.fetchForTest(testWorker.mediaKey(u))).status,
        url('unknown'),
      ),
      403,
      'Stable hashed URL must not bypass quarantine',
    );
    assert.equal(
      await page.evaluate(
        async (base) =>
          (
            await testWorker.fetchForTest(
              new Request(base + '/__nh7_reader_cache_v327__/old'),
            )
          ).status,
        base,
      ),
      403,
      'Legacy reader deep link cannot replay cache',
    );
    // Unrelated audio and School offline bytes must survive Ministers cleanup.
    const audioUrl = url('audio').replace('/nh7-library/', '/church-audio/'),
      schoolUrl = url('lesson').replace('/nh7-library/', '/nh7-school-media/');
    for (const u of [audioUrl, schoolUrl])
      await page.evaluate(
        async (u) => NH7OfflineV325.download(u, 'Unrelated fixture'),
        u,
      );
    // Seed an identifiable legacy Ministers download; public existing data must survive cleanup.
    await page.evaluate(async (u) => {
      const identity = NH7OfflineV325.canonical(u);
      await new Promise((resolve) => {
        const r = indexedDB.open('nh7-offline-media-v4', 1);
        r.onsuccess = () => {
          const tx = r.result.transaction('media', 'readwrite');
          tx.objectStore('media').put({
            identity,
            sourceUrl: u,
            blob: new Blob(['LEGACY SECRET']),
          });
          tx.oncomplete = () => {
            r.result.close();
            resolve();
          };
        };
      });
      await fetch(
        'https://gpzcwffxnddhaeaogdyo.supabase.co/functions/v1/nh7-library-access',
        { method: 'POST', body: JSON.stringify({ item_id: 'minister-book' }) },
      );
    }, url(minister.id));
    phase = 'revoked';
    await page.evaluate(() => NH7LibrarySecurityV125.catalog());
    await page.context().setOffline(true);
    const offlineResult = await page.evaluate(
      async ({ host, publicUrl, restrictedUrl }) => {
        const publicReader = await fetch(
            host + '/rest/v1/rpc/nh7_library_reader_access_v250',
            {
              method: 'POST',
              body: JSON.stringify({ p_item_id: 'public-book' }),
            },
          ),
          restrictedReader = await fetch(
            host + '/rest/v1/rpc/nh7_library_reader_access_v250',
            {
              method: 'POST',
              body: JSON.stringify({ p_item_id: 'minister-book' }),
            },
          );
        return {
          public: (await NH7OfflineV325.status(publicUrl, true)).cached,
          local: !!(await NH7OfflineV325.localPlayable(publicUrl)),
          reader: (await publicReader.json()).reader?.pages[0].text,
          restricted: restrictedReader.status,
          privateLocal: await NH7OfflineV325.localPlayable(
            NH7OfflineV325.canonical(restrictedUrl),
          ),
          workerPrivate: !!(await testWorker.storedMedia(restrictedUrl)),
        };
      },
      { host, publicUrl: url(pub.id), restrictedUrl: url(minister.id) },
    );
    assert.deepEqual(offlineResult, {
      public: true,
      local: true,
      reader: 'PUBLIC TEXT',
      restricted: 403,
      privateLocal: '',
      workerPrivate: false,
    });
    // A fresh page/module instance retains durable public files + reader while offline.
    const restart = await page.context().newPage();
    await restart.goto(base + '/__optionb_test__');
    for (const file of [
      'js/nh7-library-security-v125.js',
      'js/nh7-offline-persistence-v323.js',
      'js/nh7-library-language-v321.js',
    ])
      await restart.addScriptTag({ content: fs.readFileSync(file, 'utf8') });
    assert(
      await restart.evaluate(
        async (u) => (await NH7OfflineV325.status(u, true)).cached,
        url(pub.id),
      ),
    );
    assert.equal(
      await restart.evaluate(
        async (host) =>
          (
            await (
              await fetch(
                host + '/rest/v1/rpc/nh7_library_reader_access_v250',
                {
                  method: 'POST',
                  body: JSON.stringify({ p_item_id: 'public-book' }),
                },
              )
            ).json()
          ).reader.pages[0].text,
        host,
      ),
      'PUBLIC TEXT',
    );
    await restart.close();
    for (const u of [audioUrl, schoolUrl])
      assert(
        await page.evaluate(
          async (u) => (await NH7OfflineV325.status(u, true)).cached,
          u,
        ),
      );
    for (const change of ['logout', 'switch']) {
      const value = await page.evaluate(
        async ({ change, u }) => {
          if (change === 'logout')
            localStorage.setItem('nh7_explicit_logout', '1');
          else {
            localStorage.removeItem('nh7_explicit_logout');
            localStorage.setItem(
              'nh7_user_session_v170',
              JSON.stringify({
                access_token: 'other',
                user: { id: 'uid-two' },
              }),
            );
          }
          window.dispatchEvent(new Event('nh7-library-auth-change'));
          return {
            local: await NH7OfflineV325.localPlayable(u),
            cached: (await NH7OfflineV325.status(u, true)).cached,
          };
        },
        { change, u: url(minister.id) },
      );
      assert.deepEqual(value, { local: '', cached: false });
    }
    await page.context().setOffline(false);
    await page.evaluate(() => {
      localStorage.setItem(
        'nh7_user_session_v170',
        JSON.stringify({
          access_token: 'fixture',
          user: { id: 'uid-one', email: 'fixture@example.invalid' },
        }),
      );
      window.dispatchEvent(new Event('nh7-library-auth-change'));
    });
    await page.evaluate(() => NH7LibrarySecurityV125.catalog());
    assert(
      await page.evaluate(
        async (u) => (await NH7OfflineV325.status(u, true)).cached,
        url(pub.id),
      ),
    );
    // Reclassification drops the public permission, bytes and reader cache (all retained scopes).
    phase = 'reclassify';
    await page.evaluate(() => NH7LibrarySecurityV125.catalog());
    assert.equal(
      await page.evaluate(
        async (u) => !!(await testWorker.storedMedia(u)),
        url(pub.id),
      ),
      false,
    );
    assert.equal(
      await page.evaluate(
        async (u) => (await NH7OfflineV325.status(u, true)).cached,
        url(pub.id),
      ),
      false,
    );
    assert.deepEqual(
      await page.evaluate(() =>
        ['nh7_account_notes', 'nh7_bible_marks', 'nh7_school_progress'].map(
          (k) => localStorage.getItem(k),
        ),
      ),
      ['KEEP', 'KEEP', 'KEEP'],
    );
    // Native mock verifies Filesystem access without touching device/production data.
    phase = 'minister';
    const native = await page.evaluate(
      async ({ p, m }) => {
        localStorage.setItem(
          'nh7_user_session_v170',
          JSON.stringify({ access_token: 'fixture', user: { id: 'uid-one' } }),
        );
        await NH7LibrarySecurityV125.catalog();
        for (const id of ['public-book', 'minister-book'])
          await fetch(
            'https://gpzcwffxnddhaeaogdyo.supabase.co/functions/v1/nh7-library-access',
            { method: 'POST', body: JSON.stringify({ item_id: id }) },
          );
        const files = new Map(),
          deleted = [];
        window.Capacitor = {
          isNativePlatform: () => true,
          convertFileSrc: (x) => 'native:' + x,
          Plugins: {
            Filesystem: {
              mkdir: async () => {},
              getUri: async ({ path }) => ({ uri: path }),
              stat: async ({ path }) => {
                if (!files.has(path)) throw new Error('missing');
                return { size: 17 };
              },
              deleteFile: async ({ path }) => {
                files.delete(path);
                deleted.push(path);
              },
            },
            FileTransfer: {
              downloadFile: async ({ path }) => files.set(path, true),
            },
          },
        };
        await NH7OfflineV325.download(p, 'Public');
        const identity = NH7OfflineV325.canonical(m);
        let h = 2166136261;
        for (let i = 0; i < identity.length; i++) {
          h ^= identity.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        const path = 'offline_media_v4/legacy-restricted.pdf';
        files.set(path, true);
        localStorage.setItem(
          'nh7_offline_stable_' +
            (h >>> 0).toString(16) +
            '_' +
            identity.length,
          JSON.stringify({ identity, url: m, path, uri: path, native: true }),
        );
        await fetch(
          'https://gpzcwffxnddhaeaogdyo.supabase.co/functions/v1/nh7-library-access',
          {
            method: 'POST',
            body: JSON.stringify({ item_id: 'minister-book' }),
          },
        );
        let denied = false;
        try {
          await NH7OfflineV325.download(m, 'Restricted');
        } catch (_) {
          denied = true;
        }
        return {
          cached: (await NH7OfflineV325.status(p, true)).cached,
          local: !!(await NH7OfflineV325.localPlayable(p)),
          denied,
          files: files.size,
          deleted: deleted.length,
        };
      },
      { p: url(pub.id), m: url(minister.id) },
    );
    assert.deepEqual(native, {
      cached: true,
      local: true,
      denied: true,
      files: 1,
      deleted: 1,
    });
    assert.deepEqual(errors, []);
    console.log(
      'PASS Option B: public web/IDB/cache/native download and offline reader; Ministers persistence/replay blocked; revoke/logout/switch; public retained; reclassification purged; unrelated data retained.',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
