(()=>{'use strict';
if(!location.pathname.endsWith('/navigation-preview.html'))throw Error('Navigation Preview entry required');
const prefix='nh7_preview_nav_v456:';
function isolate(real){
 const keys=()=>Array.from({length:real.length},(_,i)=>real.key(i)).filter(k=>k?.startsWith(prefix)).map(k=>k.slice(prefix.length));
 const methods={getItem:k=>real.getItem(prefix+String(k)),setItem:(k,v)=>real.setItem(prefix+String(k),String(v)),removeItem:k=>real.removeItem(prefix+String(k)),key:i=>keys()[+i]??null,clear:()=>keys().forEach(k=>real.removeItem(prefix+k))};
 return new Proxy(Object.create(null),{get:(_,k)=>k==='length'?keys().length:k===Symbol.toStringTag?'Storage':typeof k==='symbol'?undefined:Object.hasOwn(methods,k)?methods[k]:methods.getItem(k),set:(_,k,v)=>{methods.setItem(k,v);return true},deleteProperty:(_,k)=>{methods.removeItem(k);return true},ownKeys:keys,getOwnPropertyDescriptor:(_,k)=>methods.getItem(k)===null?undefined:{configurable:true,enumerable:true,writable:true,value:methods.getItem(k)}});
}
Object.defineProperty(window,'localStorage',{value:isolate(window.localStorage)});
Object.defineProperty(window,'sessionStorage',{value:isolate(window.sessionStorage)});
window.NH7_NAVIGATION_PREVIEW=true;window.NH7_BIBLE_PREVIEW=true;window.NH7_CANONICAL_SETTINGS=true;
if(!localStorage.getItem('nh7_lang'))localStorage.setItem('nh7_lang','fa');
window.NH7AccessV230={isApproved:()=>false,token:()=>'',checkStatus:async()=>({approved:false,authenticated:false,preview:true}),edge:()=>Promise.reject(Error('Account services are disabled in Preview'))};
const send=window.fetch.bind(window),folder=new URL('.',location.href).pathname;
window.fetch=(input,options={})=>{const u=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href),method=String(options.method||(input instanceof Request?input.method:'GET')).toUpperCase();if(u.origin!==location.origin||!u.pathname.startsWith(folder)||!['GET','HEAD'].includes(method))return Promise.reject(Error('External and write requests disabled in Preview'));return send(input,{...options,credentials:'omit'})};
function explain(){let n=document.getElementById('nh7NavPreviewStatus456');if(n)n.textContent=({fa:'حساب واقعی، دانلود و فعال‌سازی اعلان در این پیش‌نمایش غیرفعال‌اند.',en:'Real accounts, downloads and notification activation are disabled in this Preview.',hr:'Stvarni računi, preuzimanja i aktiviranje obavijesti onemogućeni su u ovom pregledu.'})[localStorage.getItem('nh7_lang')]||'Preview only';}
window.addEventListener('click',e=>{const n=e.target.closest?.('#quickNotify,#enableNotify,#nh7-v252-notify-toggle,#syncCloud,#clearCache,#prepareOffline,#clearOfflineMedia,[data-nh7-video-portal],[data-submit-registration],[data-v252-refresh-health]');if(n){e.preventDefault();e.stopImmediatePropagation();explain()}},true);
})();
