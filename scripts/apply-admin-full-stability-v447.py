from pathlib import Path
import json

def replace(path, old, new, count=None):
    p=Path(path); s=p.read_text(encoding='utf-8')
    if old not in s: raise SystemExit(f'missing contract in {path}: {old[:80]}')
    s=s.replace(old,new) if count is None else s.replace(old,new,count)
    p.write_text(s,encoding='utf-8')

# MASTER page: lightweight dashboard + optimized exact-text import.
p=Path('admin-master.html'); s=p.read_text(encoding='utf-8')
for old,new in [('MASTER Upload 4.6.0','MASTER Upload 4.6.1'),('MASTER — v4.6.0','MASTER — v4.6.1'),("rpc('nh7_admin_library_dashboard_v224',{})","rpc('nh7_admin_library_dashboard_light_v440',{})"),("rpc('nh7_admin_library_import_ready_v434',{p_item:payload,p_expected_updated_at:book?.updated_at||null})","rpc('nh7_admin_library_import_ready_v440',{p_item:payload,p_expected_updated_at:book?.updated_at||null})")]:
    if old not in s: raise SystemExit('MASTER contract missing: '+old)
    s=s.replace(old,new)
old="load().catch(err=>{$('auth').textContent='❌ '+err.message+'\\nابتدا در پنل ادمین وارد شوید و سپس دوباره این صفحه را باز کنید.';$('auth').className='status bad'})"
new="load().catch(err=>{const m=String(err?.message||err);const login=/jwt|token|401|authenticated|دسترسی|وارد پنل/i.test(m);$('auth').textContent='❌ '+m+(login?'\\nابتدا در پنل ادمین وارد شوید و سپس دوباره این صفحه را باز کنید.':'\\nخطا از سرور یا بارگذاری اطلاعات است؛ ورود شما لزوماً مشکل ندارد.');$('auth').className='status bad'})"
if old not in s: raise SystemExit('MASTER error contract missing')
s=s.replace(old,new);p.write_text(s,encoding='utf-8')

# Requests: background refresh may update data, but must not redraw while user is scrolling/typing/reading an open detail.
p=Path('js/admin-v2.3.9-registration-requests-v331.js'); s=p.read_text(encoding='utf-8')
old='let refreshing=false;'
new='''let refreshing=false,deferredRender=false,lastUserInteraction=0;\nconst userBusy=()=>Date.now()-lastUserInteraction<1800||!!document.activeElement?.matches?.('input,textarea,select,[contenteditable="true"]')||!!document.querySelector('.request-card details[open]');\n['input','focusin','touchstart','pointerdown','keydown'].forEach(t=>document.addEventListener(t,()=>{lastUserInteraction=Date.now()},true));window.addEventListener('scroll',()=>{lastUserInteraction=Date.now()},{passive:true});\nfunction flushDeferred(){if(!deferredRender||userBusy())return;deferredRender=false;renderAt(window.scrollY)}\ndocument.addEventListener('toggle',()=>setTimeout(flushDeferred,50),true);document.addEventListener('focusout',()=>setTimeout(flushDeferred,100),true);'''
if old not in s: raise SystemExit('requests state contract missing')
s=s.replace(old,new,1)
old="if(renderChanged&&before!==after&&typeof activeTab!=='undefined'&&['requests','approved','overview'].includes(activeTab))renderAt()"
new="if(renderChanged&&before!==after&&typeof activeTab!=='undefined'&&['requests','approved','overview'].includes(activeTab)){if(userBusy())deferredRender=true;else renderAt()}"
if old not in s: raise SystemExit('requests refresh contract missing')
s=s.replace(old,new,1);p.write_text(s,encoding='utf-8')

# Stable shell: load the final preservation runtime after existing admin modules.
p=Path('admin-v239-stable.html'); s=p.read_text(encoding='utf-8')
for old,new in [('Stable 2.3.9.46','Stable 2.3.9.47'),('نسخهٔ پایدار ۲.۳.۹.۴۶','نسخهٔ پایدار ۲.۳.۹.۴۷'),("const RELEASE='2.3.9.46';","const RELEASE='2.3.9.47';"),("const BUILD='2.3.9.46-session-stable';","const BUILD='2.3.9.47-full-stable';")]:
    if old not in s: raise SystemExit('stable contract missing: '+old)
    s=s.replace(old,new)
old='<script src="js/nh7-admin-ready-v439.js?v=${BUILD}"><\\/script></body>'
new='<script src="js/nh7-admin-ready-v439.js?v=${BUILD}"><\\/script><script src="js/nh7-admin-full-stability-v447.js?v=${BUILD}"><\\/script></body>'
if old not in s: raise SystemExit('stable runtime insertion contract missing')
s=s.replace(old,new,1)
old="html=html.replaceAll('2.3.9.45','2.3.9.46').replaceAll('2.3.9.44','2.3.9.46').replaceAll('2.3.9.43','2.3.9.46').replaceAll('2.3.9.42','2.3.9.46').replaceAll('2.3.9.39','2.3.9.46').replaceAll('2.3.9.40','2.3.9.46').replaceAll('2.3.9.41','2.3.9.46');"
new="html=html.replaceAll('2.3.9.46','2.3.9.47').replaceAll('2.3.9.45','2.3.9.47').replaceAll('2.3.9.44','2.3.9.47').replaceAll('2.3.9.43','2.3.9.47').replaceAll('2.3.9.42','2.3.9.47').replaceAll('2.3.9.39','2.3.9.47').replaceAll('2.3.9.40','2.3.9.47').replaceAll('2.3.9.41','2.3.9.47');"
if old not in s: raise SystemExit('stable version map contract missing')
s=s.replace(old,new,1);p.write_text(s,encoding='utf-8')

v=Path('version.json'); data=json.loads(v.read_text(encoding='utf-8')); data['admin']='2.3.9.47'; data['updated_at']='2026-09-07T15:55:00+00:00'; v.write_text(json.dumps(data,separators=(',',':'))+'\n',encoding='utf-8')

# Static safety contracts.
master=Path('admin-master.html').read_text(encoding='utf-8')
stable=Path('admin-v239-stable.html').read_text(encoding='utf-8')
req=Path('js/admin-v2.3.9-registration-requests-v331.js').read_text(encoding='utf-8')
assert 'nh7_admin_library_dashboard_light_v440' in master and 'nh7_admin_library_import_ready_v440' in master
assert 'nh7-admin-full-stability-v447.js' in stable and '2.3.9.47' in stable
assert 'userBusy()' in req and 'deferredRender=true' in req
print('admin full stability 2.3.9.47 patch applied')
