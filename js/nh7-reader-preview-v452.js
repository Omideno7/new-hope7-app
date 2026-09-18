/* Used only by reader-preview.html. Never include in the production entry. */
(()=>{'use strict';
if(!location.pathname.endsWith('/reader-preview.html'))throw Error('Reader preview entry required');
const prefix='nh7_preview_reader_v452:',real=window.localStorage;
const keys=()=>Array.from({length:real.length},(_,i)=>real.key(i)).filter(k=>k?.startsWith(prefix)).map(k=>k.slice(prefix.length));
const methods={getItem:key=>real.getItem(prefix+String(key)),setItem:(key,value)=>real.setItem(prefix+String(key),String(value)),removeItem:key=>real.removeItem(prefix+String(key)),key:i=>keys()[Number(i)]??null,clear:()=>keys().forEach(k=>real.removeItem(prefix+k))};
const isolated=new Proxy(Object.create(null),{
 get:(_,key)=>key==='length'?keys().length:key===Symbol.toStringTag?'Storage':typeof key==='symbol'?undefined:Object.hasOwn(methods,key)?methods[key]:methods.getItem(key),
 set:(_,key,value)=>{methods.setItem(key,value);return true},deleteProperty:(_,key)=>{methods.removeItem(key);return true},ownKeys:keys,
 has:(_,key)=>Object.hasOwn(methods,key)||methods.getItem(key)!==null,
 getOwnPropertyDescriptor:(_,key)=>methods.getItem(key)===null?undefined:{configurable:true,enumerable:true,writable:true,value:methods.getItem(key)}
});
Object.defineProperty(window,'localStorage',{value:isolated,configurable:false});
window.NH7_BIBLE_PREVIEW=true;window.NH7_READER_PREVIEW=true;window.NH7_CANONICAL_SETTINGS=true;
if(!localStorage.getItem('nh7_lang'))localStorage.setItem('nh7_lang','fa');
// Public bundled reader data only. No authenticated session or account API exists here.
window.NH7AccessV230={isApproved:()=>true,token:()=>'',checkStatus:async()=>({approved:true,preview:true}),edge:()=>Promise.reject(new Error('Account services are disabled in Preview'))};
const originalFetch=window.fetch.bind(window),basePath=new URL('.',location.href).pathname;
window.fetch=(input,options={})=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href);
 const method=String(options.method||(input instanceof Request?input.method:'GET')).toUpperCase();
 if(url.origin!==location.origin||!url.pathname.startsWith(basePath)||!['GET','HEAD'].includes(method))return Promise.reject(new Error('Reader preview blocks external services and writes'));
 return originalFetch(input,{...options,credentials:'omit'});
};
document.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-go],[data-route]'),route=button?.dataset.go||button?.dataset.route;
 if(route&&!['home','bible','apocrypha'].includes(route)){event.preventDefault();event.stopImmediatePropagation();return}
 const theme=event.target.closest?.('[data-reader-preview-theme]');
 if(theme){const value=theme.dataset.readerPreviewTheme;if(['light','dark'].includes(value)){document.documentElement.dataset.nh7Theme=value;localStorage.setItem('nh7_ui_theme_v425',value)}}
},true);
})();
