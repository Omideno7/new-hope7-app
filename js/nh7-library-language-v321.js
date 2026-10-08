/* Option B: UID/language-scoped PUBLIC reader cache; Ministers always online + v321 authorization. */
(() => {
  'use strict';
  const VERSION = '125.2-library-public-offline',
    CACHE = 'nh7reader-public-v125',
    LEGACY = 'nh7reader-offline-v327';
  if (window.fetch?.__nh7LibraryLanguageV125) return;
  const original = window.fetch.bind(window);
  const key = (uid, id, language) =>
    new Request(
      new URL(
        '__nh7_reader_public_v125__/' +
          [uid, id, language].map(encodeURIComponent).join('/'),
        location.href,
      ).href,
    );
  function hash(value) {
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }
  const denial = () =>
    Response.json(
      { allowed: false, code: 'content_access_required' },
      { status: 403, headers: { 'Cache-Control': 'private, no-store' } },
    );
  async function cached(owner, row, language) {
    if (row?.audience !== 'public' || !window.caches) return null;
    try {
      const cache = await caches.open(CACHE);
      return await cache.match(key(owner, row.id, language));
    } catch (_) {
      return null;
    }
  }
  // Legacy email/hash reader entries cannot be trusted offline. Production v321 bodies lack
  // item identity: keep those quarantined, requiring one verified PUBLIC online reopen.
  // Never infer identity from audience, title, storage metadata or the legacy hash alone.
  window.addEventListener('nh7-library-security', async (event) => {
    if (event.detail.reason !== 'verified' || !window.caches) return;
    const security = window.NH7LibrarySecurityV125,
      owner = security.uid();
    let email = '';
    try {
      const s = JSON.parse(
        localStorage.getItem('nh7_user_session_v170') || 'null',
      );
      email = String((s?.currentSession || s?.session || s)?.user?.email || '')
        .trim()
        .toLowerCase();
    } catch (_) {}
    try {
      const legacy = await caches.open(LEGACY),
        target = await caches.open(CACHE);
      for (const row of event.detail.bundle.items.filter(
        (x) => x.audience === 'public',
      ))
        for (const language of ['fa', 'en', 'hr']) {
          const old = new Request(
              new URL(
                '__nh7_reader_cache_v327__/' +
                  hash([email, row.id, language].join('|')),
                location.href,
              ).href,
            ),
            response = await legacy.match(old);
          const data = response ? await response.clone().json() : null;
          if (
            response &&
            owner === security.uid() &&
            data?.allowed === true &&
            String(data?.item?.id || data?.item_id || '') === String(row.id)
          ) {
            await target.put(key(owner, row.id, language), response.clone());
            await legacy.delete(old);
          }
        } // Unidentified legacy bodies remain quarantined; do not destroy possible public downloads.
      for (const row of event.detail.bundle.items.filter(
        (x) => x.audience === 'ministers',
      ))
        for (const language of ['fa', 'en', 'hr']) {
          const old = new Request(
              new URL(
                '__nh7_reader_cache_v327__/' +
                  hash([email, row.id, language].join('|')),
                location.href,
              ).href,
            ),
            response = await legacy.match(old),
            data = response ? await response.clone().json() : null;
          if (String(data?.item?.id || data?.item_id || '') === String(row.id))
            await legacy.delete(old);
        }
      for (const request of await target.keys()) {
        const parts = new URL(request.url).pathname.split('/'),
          itemId = decodeURIComponent(parts[parts.length - 2] || '');
        const row = event.detail.bundle.items.find(
          (x) => String(x.id) === itemId,
        );
        if (row?.audience !== 'public') await target.delete(request);
      }
    } catch (_) {}
  });
  const wrapped = async function (input, init = {}) {
    const raw = typeof input === 'string' ? input : input?.url || '';
    if (
      !/\/rest\/v1\/rpc\/nh7_library_reader_access_v(?:250|321)(?:$|\?)/.test(
        raw,
      )
    )
      return original(input, init);
    const next = { ...init, cache: 'no-store' };
    let body = {};
    try {
      body = JSON.parse(String(next.body || '{}')) || {};
    } catch (_) {}
    const language =
      localStorage.getItem('nh7_lang') || document.documentElement.lang || 'fa';
    body.p_language = ['fa', 'en', 'hr'].includes(language) ? language : 'fa';
    next.body = JSON.stringify(body);
    const security = window.NH7LibrarySecurityV125,
      owner = security?.uid(),
      catalog = await security?.catalog();
    const row = catalog?.items.find(
      (x) => String(x.id) === String(body.p_item_id),
    );
    if (!owner || owner !== security?.uid() || !row) return denial();
    if (!navigator.onLine)
      return (await cached(owner, row, body.p_language)) || denial();
    // v321 retains its five-parameter contract and authorizes through v230/auth.uid().
    let response;
    try {
      response = await original(
        raw.replace(
          '/nh7_library_reader_access_v250',
          '/nh7_library_reader_access_v321',
        ),
        next,
      );
    } catch (error) {
      return owner === security.uid()
        ? (await cached(owner, row, body.p_language)) || denial()
        : denial();
    }
    if (owner !== security.uid()) return denial();
    const data = await response
      .clone()
      .json()
      .catch(() => null);
    if (!response.ok || data?.allowed === false) {
      security.invalidate('reader_denied');
      if (window.caches)
        try {
          await (
            await caches.open(CACHE)
          ).delete(key(owner, row.id, body.p_language));
        } catch (_) {}
      return response;
    }
    if (row.audience === 'public' && data?.allowed === true && window.caches) {
      const current = await security.catalog();
      if (
        owner !== security.uid() ||
        !current.items.some(
          (x) => String(x.id) === String(row.id) && x.audience === 'public',
        )
      )
        return denial();
      try {
        await (
          await caches.open(CACHE)
        ).put(key(owner, row.id, body.p_language), response.clone());
      } catch (_) {}
    }
    return response;
  };
  wrapped.__nh7LibraryLanguageV125 = true;
  wrapped.__nh7LibraryLanguageV321 = true;
  window.fetch = wrapped;
  window.NH7_LIBRARY_LANGUAGE_VERSION = VERSION;
})();
