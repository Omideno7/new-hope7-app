/* New Hope 7 — isolated real-device QA policy. Production is read-only media; app APIs are remapped to test. */
(function (root, factory) {
  const policy = factory();
  if (typeof module === 'object' && module.exports) module.exports = policy;
  else Object.defineProperty(root, 'NH7_TEST_POLICY', { value: policy, configurable: false });
})(globalThis, function () {
  'use strict';
  const projectRef = 'tudggktogusnjvmxpege';
  const backend = 'https://' + projectRef + '.supabase.co';
  const productionBackend = 'https://gpzcwffxnddhaeaogdyo.supabase.co';
  const build = 'isolated-real-device-23';
  const safeMethods = new Set(['GET','HEAD','POST','PUT','PATCH','DELETE']);
  function allowedPage(raw) {
    try {
      const u = new URL(raw);
      if (u.username || u.password) return false;
      if (['http:','https:'].includes(u.protocol) && ['localhost','127.0.0.1','[::1]'].includes(u.hostname)) return true;
      if (u.protocol === 'capacitor:' && u.hostname === 'localhost') return true;
      if (u.protocol !== 'https:') return false;
      if (/^new-hope7-test-preview(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(u.hostname)) return true;
      if (u.hostname === 'raw.githack.com' || u.hostname === 'rawcdn.githack.com') {
        return /^\/Omideno7\/new-hope7-app\/(?:qa\/real-device-preview-20260911|[0-9a-f]{40})\/index\.html$/i.test(u.pathname);
      }
      return false;
    } catch (_) { return false; }
  }
  function sameSite(a,b){ return a.protocol===b.protocol && a.hostname===b.hostname && a.port===b.port; }
  function isPublicProductionMedia(u,m){ return ['GET','HEAD'].includes(m) && /^\/storage\/v1\/object\/public\/church-audio\/.+/.test(u.pathname); }
  function remap(raw, method, base) {
    const m=String(method||'GET').toUpperCase();
    let u; try{u=new URL(raw,base)}catch(_){return String(raw)}
    if(u.origin===productionBackend && !isPublicProductionMedia(u,m)){
      return backend + u.pathname + u.search + u.hash;
    }
    return u.href;
  }
  function decide(raw, method, base) {
    const deny = reason => ({allowed:false,reason});
    if (!allowedPage(base)) return deny('UNAPPROVED_PREVIEW_ORIGIN');
    const m = String(method || 'GET').toUpperCase();
    if (!safeMethods.has(m)) return deny('METHOD_NOT_ALLOWED');
    let u,page; try { u=new URL(remap(raw,m,base),base); page=new URL(base); } catch(_){ return deny('INVALID_URL'); }
    if (u.username || u.password) return deny('URL_CREDENTIALS');
    if (u.protocol === 'data:') return {allowed:true,local:true,url:u.href};
    if (u.protocol === 'blob:') return {allowed:true,local:true,url:u.href};
    if (sameSite(u,page)) return {allowed:true,local:true,url:u.href};
    if (u.origin === productionBackend) {
      if (isPublicProductionMedia(u,m)) return {allowed:true,local:false,productionReadOnly:true,url:u.href};
      return deny('PRODUCTION_ENDPOINT_BLOCKED');
    }
    if (u.origin !== backend) return deny('EXTERNAL_ENDPOINT');
    const path=u.pathname;
    if (/^\/auth\/v1\//.test(path)) return {allowed:true,local:false,testBackend:true,url:u.href};
    if (/^\/rest\/v1\/rpc\/[a-zA-Z0-9_]+$/.test(path)) return {allowed:true,local:false,testBackend:true,url:u.href};
    if (/^\/rest\/v1\/[a-zA-Z0-9_]+$/.test(path)) return {allowed:true,local:false,testBackend:true,url:u.href};
    if (/^\/storage\/v1\//.test(path)) return {allowed:true,local:false,testBackend:true,url:u.href};
    return deny('UNREVIEWED_TEST_ENDPOINT');
  }
  function nativeAllowed(plugin) {
    if (['OneSignalPush','OneSignal','LocalNotifications','PushNotifications'].includes(plugin)) return false;
    if (plugin === 'Browser') return false;
    return true;
  }
  return Object.freeze({projectRef,backend,productionBackend,build,readOnly:false,allowedPage,decide,remap,nativeAllowed});
});