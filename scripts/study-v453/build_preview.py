"""Generate dedicated preview without modifying the app entry or source texts."""
from pathlib import Path
import base64,re
app=Path('js/app.js').read_text()
app=app.replace('const CLOUD_ENABLED = Boolean(', 'const CLOUD_ENABLED = !window.NH7_STUDY_PREVIEW && Boolean(')
app=app.replace("if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js')", "if(!window.NH7_STUDY_PREVIEW && 'serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js')")
assert 'const CLOUD_ENABLED = !window.NH7_STUDY_PREVIEW' in app
Path('js/nh7-study-preview-app-v453.js').write_text(app)
s=Path('index.html').read_text()
s=re.sub(r'<script\b[^>]*>[\s\S]*?</script>',lambda m:m[0] if 'src=' in m[0] else '',s)
allowed={'js/app.js','js/nh7-app-enhancements-v230.js','js/nh7-my-notes-v234.js','js/nh7-apocrypha-v270.js','js/nh7-reader-toolbar-v452.js','js/nh7-my-notes-categories-v452.js','js/nh7-theme-studio-v453.js','js/nh7-original-language-v453.js'}
s=re.sub(r'<script\b[^>]*src="([^"?]+)[^\"]*"[^>]*></script>',lambda m:m[0] if m[1] in allowed else '',s)
s=s.replace('src="js/app.js?','src="js/nh7-study-preview-app-v453.js?')
s=re.sub(r'<link\b[^>]*(?:rel="(?:manifest|icon|apple-touch-icon)"|href="https?://)[^>]*>','',s)
policy="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'"
s=s.replace('<head>','<head>\n<meta http-equiv="Content-Security-Policy" content="'+policy+'">\n<meta name="robots" content="noindex,nofollow">\n<script src="js/nh7-study-preview-guard-v453.js?v=4.5.3"></script>\n<style>.bottom-nav{grid-template-columns:repeat(2,minmax(0,1fr))!important}.bottom-nav [data-route]:not([data-route="home"]):not([data-route="bible"]),#inboxBtn,#quickNotify,#enableNotify,#syncCloud,#prepareOffline,#clearOfflineMedia,#clearCache{display:none!important}.nh7-study-preview-banner453{margin:8px 12px;padding:10px;border:1px solid #7899af;border-radius:12px;font:12px/1.65 system-ui;background:#edf4f9;color:#17364e}.nh7-study-preview-banner453 button{min-height:40px;margin-top:6px;padding:7px 14px;background:#fff;color:#17364e;border:1px solid #7899af;border-radius:9px}</style>')
s=s.replace('<main id="view"','<aside class="nh7-study-preview-banner453" dir="rtl"><strong>Study Preview 4.5.3</strong><br>نسخهٔ آزمایشی مستقل؛ یادداشت‌ها و تنظیمات حساب اصلی در این صفحه تغییر نمی‌کنند.<br><button type="button" data-go="settings">🎨 ظاهر / Theme Studio / Izgled</button></aside>\n<main id="view"')
logo='data:image/png;base64,'+base64.b64encode(Path('assets/new-hope7-logo-192.png').read_bytes()).decode()
def inline_logo(value):return re.sub(r'(?:\.\./)?assets/new-hope7-logo-(?:1024|512|192|180)\.png(?:\?[^\s"\'()<>]*)?',logo,value)
for m in list(re.finditer(r'<link\b[^>]*href="(css/[^"?]+)[^\"]*"[^>]*>',s)):
    css=Path(m[1]).read_text();safe=inline_logo(re.sub(r'^@import[^\n]*https?:[^\n]*\n?','',css,flags=re.M))
    if css!=safe:
        name=m[1].replace('css/','css/nh7-study-preview-');Path(name).write_text(safe);s=s.replace(m[0],m[0].replace(m[1],name))
Path('study-preview.html').write_text(inline_logo(s))
print('Study Preview generated; real account and notification services disabled.')
