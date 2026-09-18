"""Produce an isolated reader preview; do not modify the app entry or source data."""
from pathlib import Path
import re,base64
app=Path('js/app.js').read_text()
app=app.replace('const CLOUD_ENABLED = Boolean(', 'const CLOUD_ENABLED = !window.NH7_READER_PREVIEW && Boolean(')
app=app.replace("if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js')", "if(!window.NH7_READER_PREVIEW && 'serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js')")
assert 'const CLOUD_ENABLED = !window.NH7_' in app
Path('js/nh7-reader-preview-app-v452.js').write_text(app)
preview=Path('index.html').read_text()
preview=re.sub(r'<script\b[^>]*>[\s\S]*?</script>',lambda m:m[0] if 'src=' in m[0] else '',preview)
allowed={'js/app.js','js/nh7-app-enhancements-v230.js','js/nh7-my-notes-v234.js','js/nh7-apocrypha-v270.js','js/nh7-reader-toolbar-v452.js','js/nh7-my-notes-categories-v452.js'}
preview=re.sub(r'<script\b[^>]*src="([^"?]+)[^\"]*"[^>]*></script>',lambda m:m[0] if m[1] in allowed else '',preview)
preview=preview.replace('src="js/app.js?', 'src="js/nh7-reader-preview-app-v452.js?')
preview=re.sub(r'<link\b[^>]*(?:rel="(?:manifest|icon|apple-touch-icon)"|href="https?://)[^>]*>','',preview)
policy="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'"
preview=preview.replace('<head>', '<head>\n<meta http-equiv="Content-Security-Policy" content="'+policy+'">\n<meta name="robots" content="noindex,nofollow">\n<script src="js/nh7-reader-preview-v452.js?v=4.5.2-r2"></script>\n<style>.bottom-nav{grid-template-columns:repeat(2,minmax(0,1fr))!important}.bottom-nav [data-route]:not([data-route="home"]):not([data-route="bible"]),#inboxBtn,#quickNotify{display:none!important}.nh7-reader-preview-banner452{margin:8px 12px;padding:10px;border:1px solid #749ab6;border-radius:12px;font:12px/1.6 system-ui;background:#e9f3fa;color:#163b58}.nh7-reader-preview-banner452 button{margin:3px;padding:5px 12px;border:1px solid #789ab0;border-radius:8px;background:#fff;color:#17364e}</style>')
preview=preview.replace('<main id="view"','<aside class="nh7-reader-preview-banner452" dir="rtl">Reader Preview 4.5.2<br>این صفحه آزمایشی است؛ یادداشت‌ها و ذخیره‌های آن از حساب اصلی جدا هستند.<br><button type="button" data-reader-preview-theme="light">روشن / Light</button><button type="button" data-reader-preview-theme="dark">تیره / Dark</button></aside>\n<main id="view"')
logo='data:image/png;base64,'+base64.b64encode(Path('assets/new-hope7-logo-192.png').read_bytes()).decode()
def inline_logo(text):return re.sub(r'(?:\.\./)?assets/new-hope7-logo-(?:1024|512|192|180)\.png(?:\?[^\s"\'()<>]*)?',logo,text)
for m in list(re.finditer(r'<link\b[^>]*href="(css/[^"?]+)[^\"]*"[^>]*>',preview)):
    css=Path(m[1]).read_text();safe=inline_logo(re.sub(r'^@import[^\n]*https?:[^\n]*\n?','',css,flags=re.M))
    if safe!=css:
        name=m[1].replace('css/','css/nh7-reader-preview-');Path(name).write_text(safe)
        preview=preview.replace(m[0],m[0].replace(m[1],name))
Path('reader-preview.html').write_text(inline_logo(preview))
print('Isolated preview generated without changing index.html, app.js or corpus.')
