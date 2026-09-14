/* New Hope 7: network-first handling ONLY for the public app download page.
 * Imported before the legacy offline handler, which otherwise serves a stale
 * /app/ cache entry and ignores query strings. No app/media/auth data is changed.
 */
(function () {
  'use strict';
  var landing = new URL('app/', self.registration.scope);
  var cacheName = 'nh7-public-download-v1-' + landing.pathname;
  var cacheKey = landing.href;

  function offlinePage() {
    return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New Hope 7</title></head><body><h1>New Hope 7</h1><p>Connect to the internet to download the app.</p><p><a href="https://apps.apple.com/hr/app/new-hope-7/id6803187205" target="_blank" rel="noopener noreferrer">App Store - iPhone &amp; iPad</a></p><p><a href="https://play.google.com/store/apps/details?id=com.omideno7.newhope7" target="_blank" rel="noopener noreferrer">Google Play - Android</a></p></body></html>', {
      status: 503,
      headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}
    });
  }

  async function freshLanding(request) {
    try {
      var url = new URL(request.url);
      url.searchParams.set('_nh7_download', String(Date.now()));
      var response = await fetch(url.href, {cache: 'no-store', credentials: 'same-origin'});
      if (!response.ok) throw new Error('Download page unavailable');
      var html = await response.text();
      // Never put an old non-clickable Coming Soon page into the fallback cache.
      if (!/<a\b[^>]*\bhref=["']https:\/\/apps\.apple\.com\//i.test(html)) {
        throw new Error('App Store link missing');
      }
      var headers = new Headers(response.headers);
      headers.set('Content-Type', 'text/html; charset=utf-8');
      headers.set('Cache-Control', 'no-store');
      // The network response may have been decoded before constructing this body.
      headers.delete('Content-Encoding');
      headers.delete('Content-Length');
      var fresh = new Response(html, {status: 200, headers: headers});
      try { await (await caches.open(cacheName)).put(cacheKey, fresh.clone()); } catch (_) {}
      return fresh;
    } catch (_) {
      try {
        var cached = await (await caches.open(cacheName)).match(cacheKey);
        if (cached) return cached;
      } catch (_) {}
      return offlinePage();
    }
  }

  self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET' || event.request.mode !== 'navigate') return;
    var url = new URL(event.request.url);
    if (url.origin !== landing.origin) return;
    if (url.pathname !== landing.pathname && url.pathname !== landing.pathname + 'index.html') return;
    event.respondWith(freshLanding(event.request));
    event.stopImmediatePropagation();
  });
}());
