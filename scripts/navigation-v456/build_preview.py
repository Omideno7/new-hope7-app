"""Generate a dedicated Preview. Production entry never loads this guard or app copy."""
from pathlib import Path
import re,base64
GUARD=r'''(()=>{'use strict';
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
})();'''
Path('js/nh7-navigation-preview-guard-v456.js').write_text(GUARD+'\n')
app=Path('js/app.js').read_text()
app=app.replace('const CLOUD_ENABLED = Boolean(','const CLOUD_ENABLED = !window.NH7_NAVIGATION_PREVIEW && Boolean(')
app=app.replace("if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js')","if(!window.NH7_NAVIGATION_PREVIEW && 'serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js')")
assert 'const CLOUD_ENABLED = !window.NH7_NAVIGATION_PREVIEW' in app
Path('js/nh7-navigation-preview-app-v456.js').write_text(app)
s=Path('index.html').read_text()
s=re.sub(r'<script\b[^>]*>[\s\S]*?</script>',lambda m:m[0] if 'src=' in m[0] else '',s)
allowed={'js/app.js','js/nh7-app-enhancements-v230.js','js/nh7-my-notes-v234.js','js/nh7-reader-toolbar-v452.js','js/nh7-my-notes-categories-v452.js','js/nh7-theme-studio-v453.js','js/nh7-original-language-v453.js','js/nh7-fonts-v454.js','js/nh7-audio-quick-bible-v454.js','js/nh7-header-date-v455.js','js/nh7-ui-stability-v329.js','js/nh7-secure-media-v270.js','js/nh7-spiritual-plans-v412.js','js/nh7-fasting-practical-note-removal-v413.js'}
s=re.sub(r'<script\b[^>]*src="([^"?]+)[^\"]*"[^>]*></script>',lambda m:m[0] if m[1] in allowed else '',s)
s=s.replace('src="js/app.js?','src="js/nh7-navigation-preview-app-v456.js?')
s=re.sub(r'<link\b[^>]*(?:rel="(?:manifest|icon|apple-touch-icon)"|href="https?://)[^>]*>','',s)
policy="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'"
s=s.replace('<head>','<head>\n<meta http-equiv="Content-Security-Policy" content="'+policy+'">\n<meta name="robots" content="noindex,nofollow">\n<script src="js/nh7-navigation-preview-guard-v456.js?v=4.5.6"></script>\n<style>.nh7-nav-preview-banner456{margin:8px 12px;padding:10px 12px;border:1px solid #879fb2;border-radius:12px;font:12px/1.65 system-ui;background:#edf4f9;color:#17364e}.nh7-nav-preview-banner456 p{margin:0}#nh7NavPreviewStatus456:empty{display:none}</style>')
s=s.replace('<main id="view"','<aside class="nh7-nav-preview-banner456" dir="rtl"><strong>Navigation Preview 4.5.6</strong><p>آزمایش مستقلِ منوها؛ حساب و اطلاعات واقعی شما در این صفحه تغییر نمی‌کنند.</p><p id="nh7NavPreviewStatus456" role="status"></p></aside>\n<main id="view"')
logo='data:image/png;base64,'+base64.b64encode(Path('assets/new-hope7-logo-192.png').read_bytes()).decode()
def inline_logo(value):return re.sub(r'(?:\.\./)?assets/new-hope7-logo-(?:1024|512|192|180)\.png(?:\?[^\s"\'()<>]*)?',logo,value)
for m in list(re.finditer(r'<link\b[^>]*href="(css/[^"?]+)[^\"]*"[^>]*>',s)):
 css=Path(m[1]).read_text();safe=inline_logo(re.sub(r'^@import[^\n]*https?:[^\n]*\n?','',css,flags=re.M))
 if safe!=css:
  name=m[1].replace('css/','css/nh7-nav-preview-');Path(name).write_text(safe);s=s.replace(m[0],m[0].replace(m[1],name))
Path('navigation-preview.html').write_text(inline_logo(s))
print('Isolated navigation Preview generated. No account/cloud writes or service-worker registration.')
