/* New Hope 7 v2.3.9.35c — combined PWA + OneSignal service worker */
/* OneSignal Web Push must share this root-scope worker with the existing PWA worker. */
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

importScripts('./sw-media-stream-bypass-v332.js?v=2.3.9.35b');
importScripts('./sw-offline-v329.js?v=2.3.9.35b');
importScripts('./sw-offline-path-fix-v329.js?v=2.3.9.35b');
