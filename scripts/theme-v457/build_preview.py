"""Generate theme-only Preview with isolated local/session storage and no cloud services."""
from pathlib import Path
import re,base64
GUARD=r'''(()=>{'use strict';
if(!location.pathname.endsWith('/theme-preview.html'))throw Error('Theme Preview entry required');
const prefix='nh7_preview_theme_v457:';
function isolate(real){const keys=()=>Array.from({length:real.length},(_,i)=>real.key(i)).filter(k=>k?.startsWith(prefix)).map(k=>k.slice(prefix.length));const f={getItem:k=>real.getItem(prefix+String(k)),setItem:(k,v)=>real.setItem(prefix+String(k),String(v)),removeItem:k=>real.removeItem(prefix+String(k)),key:i=>keys()[+i]??null,clear:()=>keys().forEach(k=>real.removeItem(prefix+k))};return new Proxy(Object.create(null),{get:(_,k)=>k==='length'?keys().length:k===Symbol.toStringTag?'Storage':typeof k==='symbol'?undefined:Object.hasOwn(f,k)?f[k]:f.getItem(k),set:(_,k,v)=>{f.setItem(k,v);return true},deleteProperty:(_,k)=>{f.removeItem(k);return true},ownKeys:keys,getOwnPropertyDescriptor:(_,k)=>f.getItem(k)===null?undefined:{configurable:true,enumerable:true,writable:true,value:f.getItem(k)}})}
Object.defineProperty(window,'localStorage',{value:isolate(window.localStorage)});Object.defineProperty(window,'sessionStorage',{value:isolate(window.sessionStorage)});
window.NH7_THEME_PREVIEW=true;window.NH7_BIBLE_PREVIEW=true;window.NH7_CANONICAL_SETTINGS=true;
if(!localStorage.getItem('nh7_lang'))localStorage.setItem('nh7_lang','fa');
window.NH7AccessV230={isApproved:()=>false,token:()=>'',checkStatus:async()=>({approved:false,authenticated:false,preview:true}),edge:()=>Promise.reject(Error('Accounts disabled in Preview'))};
const original=window.fetch.bind(window),base=new URL('.',location.href).pathname;
window.fetch=(input,options={})=>{const u=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href),method=String(options.method||(input instanceof Request?input.method:'GET')).toUpperCase();if(u.origin!==location.origin||!u.pathname.startsWith(base)||!['GET','HEAD'].includes(method))return Promise.reject(Error('External services disabled in theme Preview'));return original(input,{...options,credentials:'omit'})};
window.addEventListener('click',event=>{const target=event.target.closest?.('[data-go],[data-route]'),route=target?.dataset.go||target?.dataset.route,action=event.target.closest?.('#quickNotify,#enableNotify,#syncCloud,#clearCache,#prepareOffline,#clearOfflineMedia,#inboxBtn');if((route&&!['home','bible','settings','more'].includes(route))||action){event.preventDefault();event.stopImmediatePropagation();const p=document.getElementById('themePreviewStatus457');if(p)p.textContent=({fa:'این صفحه فقط برای آزمایش ظاهر است؛ ورود به حساب، اعلان و دانلود غیرفعال است.',en:'This page tests appearance only; account sign-in, notifications and downloads are disabled.',hr:'Ova stranica služi samo za pregled izgleda; prijava, obavijesti i preuzimanja su onemogućeni.'})[localStorage.getItem('nh7_lang')]||'Theme Preview only';}},true);
})();'''
Path('js/nh7-theme-preview-guard-v457.js').write_text(GUARD+'\n')
app=Path('js/app.js').read_text();app=app.replace('const CLOUD_ENABLED = Boolean(','const CLOUD_ENABLED = !window.NH7_THEME_PREVIEW && Boolean(')
app=app.replace("if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js')","if(!window.NH7_THEME_PREVIEW && 'serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js')")
assert 'const CLOUD_ENABLED = !window.NH7_THEME_PREVIEW' in app
Path('js/nh7-theme-preview-app-v457.js').write_text(app)
s=Path('index.html').read_text();s=re.sub(r'<script\b[^>]*>[\s\S]*?</script>',lambda m:m[0] if 'src=' in m[0] else '',s)
allowed={'js/app.js','js/nh7-app-enhancements-v230.js','js/nh7-my-notes-v234.js','js/nh7-reader-toolbar-v452.js','js/nh7-my-notes-categories-v452.js','js/nh7-theme-studio-v453.js','js/nh7-original-language-v453.js','js/nh7-fonts-v454.js','js/nh7-audio-quick-bible-v454.js','js/nh7-header-date-v455.js','js/nh7-ui-stability-v329.js'}
s=re.sub(r'<script\b[^>]*src="([^"?]+)[^\"]*"[^>]*></script>',lambda m:m[0] if m[1] in allowed else '',s);s=s.replace('src="js/app.js?','src="js/nh7-theme-preview-app-v457.js?')
s=re.sub(r'<link\b[^>]*(?:rel="(?:manifest|icon|apple-touch-icon)"|href="https?://)[^>]*>','',s)
policy="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'"
s=s.replace('<head>','<head>\n<meta http-equiv="Content-Security-Policy" content="'+policy+'">\n<meta name="robots" content="noindex,nofollow">\n<script src="js/nh7-theme-preview-guard-v457.js?v=4.5.7"></script>\n<style>.nh7-theme-preview-banner457{margin:8px 12px;padding:10px;border:1px solid #7899af;border-radius:12px;font:12px/1.6 system-ui;background:#edf4f9;color:#17364e}.nh7-theme-preview-banner457 button{margin-top:6px;min-height:40px;border:1px solid #7899af;background:#fff;color:#17364e;border-radius:8px;padding:6px 12px}.nh7-theme-preview-banner457 p:empty{display:none}</style>')
s=s.replace('<main id="view"','<aside class="nh7-theme-preview-banner457" dir="rtl"><strong>Theme Preview 4.5.7</strong><br>ظاهر آزمایشی؛ تنظیمات و اطلاعات اپ اصلی شما در این صفحه تغییر نمی‌کنند.<br><button type="button" data-go="settings">🎨 انتخاب تم / Choose theme / Odaberi temu</button><p id="themePreviewStatus457" role="status"></p></aside>\n<main id="view"')
logo='data:image/png;base64,'+base64.b64encode(Path('assets/new-hope7-logo-192.png').read_bytes()).decode()
def inline_logo(v):return re.sub(r'(?:\.\./)?assets/new-hope7-logo-(?:1024|512|192|180)\.png(?:\?[^\s"\'()<>]*)?',logo,v)
for m in list(re.finditer(r'<link\b[^>]*href="(css/[^"?]+)[^\"]*"[^>]*>',s)):
 css=Path(m[1]).read_text();safe=inline_logo(re.sub(r'^@import[^\n]*https?:[^\n]*\n?','',css,flags=re.M))
 if safe!=css:
  name=m[1].replace('css/','css/nh7-theme-preview-');Path(name).write_text(safe);s=s.replace(m[0],m[0].replace(m[1],name))
Path('theme-preview.html').write_text(inline_logo(s))
print('Theme Preview generated: no real login, external account requests or shared user settings.')
