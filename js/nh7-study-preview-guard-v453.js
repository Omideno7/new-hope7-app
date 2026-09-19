/* Dedicated study-preview.html only. Never load in index.html. */
(()=>{'use strict';
if(!location.pathname.endsWith('/study-preview.html'))throw Error('Study Preview entry required');
const prefix='nh7_preview_study_v454:',raw=window.localStorage;
const keys=()=>Array.from({length:raw.length},(_,i)=>raw.key(i)).filter(k=>k?.startsWith(prefix)).map(k=>k.slice(prefix.length));
const methods={getItem:k=>raw.getItem(prefix+String(k)),setItem:(k,v)=>raw.setItem(prefix+String(k),String(v)),removeItem:k=>raw.removeItem(prefix+String(k)),key:i=>keys()[+i]??null,clear:()=>keys().forEach(k=>raw.removeItem(prefix+k))};
const local=new Proxy(Object.create(null),{get:(_,k)=>k==='length'?keys().length:k===Symbol.toStringTag?'Storage':typeof k==='symbol'?undefined:Object.hasOwn(methods,k)?methods[k]:methods.getItem(k),set:(_,k,v)=>{methods.setItem(k,v);return true},deleteProperty:(_,k)=>{methods.removeItem(k);return true},ownKeys:keys,has:(_,k)=>Object.hasOwn(methods,k)||methods.getItem(k)!==null,getOwnPropertyDescriptor:(_,k)=>methods.getItem(k)===null?undefined:{configurable:true,enumerable:true,writable:true,value:methods.getItem(k)}});
Object.defineProperty(window,'localStorage',{value:local,configurable:false});
window.NH7_STUDY_PREVIEW=true;window.NH7_READER_PREVIEW=true;window.NH7_BIBLE_PREVIEW=true;window.NH7_CANONICAL_SETTINGS=true;
if(!localStorage.getItem('nh7_lang'))localStorage.setItem('nh7_lang','fa');
window.NH7AccessV230={isApproved:()=>true,token:()=>'',checkStatus:async()=>({approved:true,preview:true}),edge:()=>Promise.reject(Error('Account services disabled in Preview'))};
const original=window.fetch.bind(window),base=new URL('.',location.href).pathname;
window.fetch=(input,options={})=>{const u=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href),method=String(options.method||(input instanceof Request?input.method:'GET')).toUpperCase();if(u.origin!==location.origin||!u.pathname.startsWith(base)||!['GET','HEAD'].includes(method))return Promise.reject(Error('Preview blocks external requests and writes'));return original(input,{...options,credentials:'omit'})};
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-go],[data-route]'),route=button?.dataset.go||button?.dataset.route;if(route&&!['home','bible','apocrypha','settings'].includes(route)){event.preventDefault();event.stopImmediatePropagation()}const action=event.target.closest?.('#enableNotify,#syncCloud,#prepareOffline,#clearOfflineMedia,#clearCache');if(action){event.preventDefault();event.stopImmediatePropagation()}},true);
})();
