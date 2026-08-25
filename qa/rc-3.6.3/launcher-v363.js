/* New Hope 7 — isolated full-app integration QA launcher 3.6.3 */
(async function nh7IntegrationQaLauncher(){
  'use strict';

  const MAIN_SHA='ce823ba7629466c0dbeb9468b47e5740fd9a690d';
  const OVERLAY_SHA='a4235c6c0c38d24abf4dbd6a975f2a03c196de60';
  const REPO='Omideno7/new-hope7-app';
  const MAIN_BASE=`https://raw.githack.com/${REPO}/${MAIN_SHA}/`;
  const OVERLAY_BASE=`https://raw.githack.com/${REPO}/${OVERLAY_SHA}/`;
  const MAIN_INDEX=MAIN_BASE+'index.html?qa=3.6.3';
  const CACHE_TAG=`qa-363-${Date.now()}`;
  const errorBox=document.getElementById('qaError');

  function showError(error){
    console.error('[NH7 QA launcher]',error);
    document.querySelector('.spinner')?.remove();
    if(!errorBox)return;
    errorBox.style.display='block';
    errorBox.textContent='نسخهٔ آزمایشی بارگذاری نشد.\n\n'+String(error?.message||error||'Unknown error');
    const button=document.createElement('button');
    button.type='button';
    button.textContent='تلاش دوباره';
    button.onclick=()=>location.reload();
    errorBox.appendChild(document.createElement('br'));
    errorBox.appendChild(button);
  }

  try{
    if('serviceWorker' in navigator){
      try{
        const registrations=await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration=>registration.unregister()));
      }catch(error){console.warn('[NH7 QA] service-worker cleanup',error)}
    }
    if('caches' in window){
      try{
        const keys=await caches.keys();
        await Promise.all(keys.filter(key=>/nh7|new.?hope|omideno/i.test(key)).map(key=>caches.delete(key)));
      }catch(error){console.warn('[NH7 QA] cache cleanup',error)}
    }

    const response=await fetch(MAIN_INDEX,{cache:'no-store'});
    if(!response.ok)throw new Error(`Main app snapshot HTTP ${response.status}`);
    const source=await response.text();
    const appDoc=new DOMParser().parseFromString(source,'text/html');
    if(!appDoc?.documentElement||!appDoc.querySelector('#appShell'))throw new Error('The current app shell could not be parsed.');

    appDoc.title='New Hope 7 — Integration QA 3.6.3';
    appDoc.documentElement.setAttribute('data-nh7-qa','3.6.3');
    appDoc.querySelectorAll('base').forEach(node=>node.remove());
    appDoc.querySelectorAll('link[rel="manifest"]').forEach(node=>node.remove());

    const base=appDoc.createElement('base');
    base.href=MAIN_BASE;
    appDoc.head.prepend(base);

    const removeSrcFragments=[
      'onesignal',
      'nh7-auto-update-',
      'nh7-offline-startup-',
      'nh7-offline-core-',
      'nh7-offline-data-',
      'nh7-offline-playback-',
      'nh7-offline-persistence-',
      'nh7-push-account-bind-',
      'nh7-apocrypha-v270.js',
      'nh7-apocrypha-preview-v240.js',
      'nh7-apocrypha-reader-flow-v244.js',
      'nh7-apocrypha-translation-overlay-v245.js',
      'nh7-apocrypha-fresh-filter-v243.js',
      'nh7-reference-localization-v242.js',
      'nh7-reader-ux-v251.js',
      'nh7-apocrypha-polish-v252.js',
      'nh7-saved-verses-chapter-v252.js',
      'nh7-settings-account-v252.js',
      'nh7-account-content-access-v251.js',
      'nh7-minister-library-lock-v253.js',
      'nh7-spiritual-plans-bridge-v240.js',
      'nh7-qa-library-v363.js',
      'nh7-registration-canonical-v353.js'
    ];

    appDoc.querySelectorAll('script').forEach(script=>{
      const src=String(script.getAttribute('src')||'').toLowerCase();
      const inline=String(script.textContent||'').toLowerCase();
      const removeBySrc=removeSrcFragments.some(fragment=>src.includes(fragment));
      const removeInline=inline.includes('nh7_onesignal_app_id')||inline.includes('navigator.serviceworker.register')||inline.includes('onesignaldeferred.push');
      if(removeBySrc||removeInline)script.remove();
    });

    const config=appDoc.createElement('script');
    config.setAttribute('data-nh7-qa-config','3.6.3');
    config.textContent=`(()=>{'use strict';
window.NH7_VERSION='3.6.3-INTEGRATION-QA';
window.NH7_RELEASE_CHANNEL='qa_integration';
window.NH7_DISABLE_PREVIEW_SERVICE_WORKER=true;
window.NH7_DISABLE_PREVIEW_PUSH=true;
window.NH7_QA_LIBRARY_V363=true;
window.NH7_BASE_PATH='/new-hope7-app/';
window.NH7_SERVICE_WORKER='';
window.NH7_ONESIGNAL_WORKER='';
window.NH7_ONESIGNAL_APP_ID='';
window.OneSignalDeferred=[];
try{if('serviceWorker' in navigator){Object.defineProperty(navigator.serviceWorker,'register',{configurable:true,value:async()=>({scope:location.pathname})});}}catch(error){console.warn('[NH7 QA] register guard',error)}
try{if('caches' in window){caches.keys().then(keys=>Promise.all(keys.filter(key=>/nh7|new.?hope|omideno/i.test(key)).map(key=>caches.delete(key)))).catch(()=>{});}}catch(_){}
const qaNativeFetch=window.fetch.bind(window);
window.fetch=function nh7QaAssetFetch(input,init={}){
  let url='';
  try{url=typeof input==='string'?input:(input instanceof URL?input.href:input?.url||'');}catch(_){}
  if(String(url).includes('data/apocrypha/runtime/apocrypha-browser-19.preview.json')){
    const nextInit=Object.assign({},init,{cache:'no-store'});
    return qaNativeFetch('${OVERLAY_BASE}data/apocrypha/runtime/apocrypha-browser-19.preview.json?v=${CACHE_TAG}',nextInit);
  }
  return qaNativeFetch(input,init);
};
window.NH7_QA_MAIN_SHA='${MAIN_SHA}';
window.NH7_QA_OVERLAY_SHA='${OVERLAY_SHA}';
})();`;
    appDoc.head.insertBefore(config,base.nextSibling);

    const qaStyles=appDoc.createElement('style');
    qaStyles.setAttribute('data-nh7-qa-style','3.6.3');
    qaStyles.textContent=`
.nh7-integration-qa-banner{position:relative;z-index:2147483000;padding:9px 12px;background:#fff3cd;border-bottom:1px solid #e6cc78;color:#5d4700;text-align:center;font:700 12px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
.nh7-integration-qa-banner small{display:block;font-weight:500;margin-top:2px}
`;
    appDoc.head.appendChild(qaStyles);

    [
      'css/nh7-apocrypha-reader-v242.css',
      'css/nh7-apocrypha-reader-flow-v244.css',
      'css/nh7-spiritual-plans-v240.css'
    ].forEach(path=>{
      const link=appDoc.createElement('link');
      link.rel='stylesheet';
      link.href=OVERLAY_BASE+path+'?v='+CACHE_TAG;
      link.setAttribute('data-nh7-qa-overlay','3.6.3');
      appDoc.head.appendChild(link);
    });

    const banner=appDoc.createElement('div');
    banner.className='nh7-integration-qa-banner';
    banner.innerHTML='<strong>NEW HOPE 7 · INTEGRATION QA 3.6.3</strong><small>نسخهٔ آزمایشی یکپارچه — هیچ‌یک از این تغییرات هنوز به main یا نسخهٔ کاربران منتقل نشده است.</small>';
    appDoc.body.prepend(banner);

    const appModule=Array.from(appDoc.querySelectorAll('script[src]')).find(script=>/\/js\/app\.js(?:\?|$)/.test(String(script.getAttribute('src')||'')));
    if(!appModule)throw new Error('The current app module was not found.');

    function insertBlockingBeforeApp(src,label){
      const script=appDoc.createElement('script');
      script.src=src;
      script.setAttribute('data-nh7-qa-early',label);
      appModule.parentNode.insertBefore(script,appModule);
    }

    insertBlockingBeforeApp(OVERLAY_BASE+'js/nh7-qa-library-v363.js?v='+CACHE_TAG,'unpublished-library');
    insertBlockingBeforeApp(MAIN_BASE+'js/nh7-registration-canonical-v353.js?v='+CACHE_TAG,'canonical-registration');

    const lateScripts=[
      {path:'js/nh7-message-audio-bridge-v242.js'},
      {path:'js/nh7-spiritual-plans-bridge-v240.js',type:'module'},
      {path:'js/nh7-apocrypha-translation-overlay-v245.js'},
      {path:'js/nh7-apocrypha-fresh-filter-v243.js'},
      {path:'js/nh7-apocrypha-preview-v240.js'},
      {path:'js/nh7-apocrypha-reader-flow-v244.js'},
      {path:'js/nh7-reference-localization-v242.js'},
      {path:'js/nh7-school-assignment-workflow-v246.js'},
      {path:'js/nh7-reader-ux-v251.js'},
      {path:'js/nh7-apocrypha-polish-v252.js'},
      {path:'js/nh7-saved-verses-chapter-v252.js'},
      {path:'js/nh7-settings-account-v252.js'},
      {path:'js/nh7-account-content-access-v251.js'},
      {path:'js/nh7-minister-library-lock-v253.js'}
    ];

    const lateBootstrap=appDoc.createElement('script');
    lateBootstrap.setAttribute('data-nh7-qa-bootstrap','3.6.3');
    lateBootstrap.textContent=`(()=>{'use strict';
const scripts=${JSON.stringify(lateScripts)};
const base='${OVERLAY_BASE}';
const tag='${CACHE_TAG}';
function loadOne(item){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=base+item.path+'?v='+tag;if(item.type)s.type=item.type;s.dataset.nh7QaOverlay='3.6.3';s.onload=()=>resolve(item.path);s.onerror=()=>reject(new Error('Could not load '+item.path));document.body.appendChild(s);});}
async function start(){for(const item of scripts){try{await loadOne(item);}catch(error){console.error('[NH7 QA overlay]',error);}}window.NH7_INTEGRATION_QA_READY=true;document.dispatchEvent(new CustomEvent('nh7:integration-qa-ready',{detail:{version:'3.6.3'}}));console.info('NH7 integration QA 3.6.3 overlays loaded');}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,0),{once:true});else setTimeout(start,0);
})();`;
    appDoc.body.appendChild(lateBootstrap);

    const serialized='<!doctype html>\n'+appDoc.documentElement.outerHTML;
    document.open();
    document.write(serialized);
    document.close();
  }catch(error){
    showError(error);
  }
})();
