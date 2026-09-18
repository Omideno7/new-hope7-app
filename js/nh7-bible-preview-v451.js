/* Dedicated Bible preview. Runs before app scripts; no production services. */
(()=>{'use strict';
  const prefix='nh7_preview_bible_v451:';
  const real=window.localStorage;
  const keys=()=>Array.from({length:real.length},(_,i)=>real.key(i)).filter(k=>k?.startsWith(prefix)).map(k=>k.slice(prefix.length));
  const methods={
    getItem:key=>real.getItem(prefix+String(key)),
    setItem:(key,value)=>real.setItem(prefix+String(key),String(value)),
    removeItem:key=>real.removeItem(prefix+String(key)),
    key:i=>keys()[Number(i)]??null,
    clear:()=>keys().forEach(k=>real.removeItem(prefix+k))
  };
  const isolated=new Proxy(Object.create(null),{
    get:(_,key)=>key==='length'?keys().length:key===Symbol.toStringTag?'Storage':
      typeof key==='symbol'?undefined:Object.hasOwn(methods,key)?methods[key]:methods.getItem(key),
    set:(_,key,value)=>{methods.setItem(key,value);return true;},
    deleteProperty:(_,key)=>{methods.removeItem(key);return true;},
    ownKeys:keys,
    has:(_,key)=>Object.hasOwn(methods,key)||methods.getItem(key)!==null,
    getOwnPropertyDescriptor:(_,key)=>methods.getItem(key)===null?undefined:{configurable:true,enumerable:true,writable:true,value:methods.getItem(key)}
  });
  Object.defineProperty(window,'localStorage',{value:isolated,configurable:false});
  window.NH7_BIBLE_PREVIEW=true;
  window.NH7_CANONICAL_SETTINGS=true;
  if(!localStorage.getItem('nh7_lang'))localStorage.setItem('nh7_lang','fa');
  const originalFetch=window.fetch.bind(window);
  window.fetch=(input,options={})=>{
    const url=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href);
    const method=String(options.method||(input instanceof Request?input.method:'GET')).toUpperCase();
    if(url.origin!==location.origin||!['GET','HEAD'].includes(method))
      return Promise.reject(new Error('Bible preview blocks external services and writes'));
    return originalFetch(input,{...options,credentials:'omit'});
  };
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-go],[data-route]');
    const route=button?.dataset.go||button?.dataset.route;
    if(route&&!['home','bible'].includes(route)){
      event.preventDefault();event.stopImmediatePropagation();return;
    }
    const theme=event.target.closest?.('[data-bible-preview-theme]');
    if(theme){localStorage.setItem('nh7_ui_theme_v425',theme.dataset.biblePreviewTheme);window.NH7_UI_PREFS?.apply?.();}
  },true);
})();
