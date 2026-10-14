"""Wave4 approved scope; retain exact Wave1–3 engine/data/backend bytes."""
from pathlib import Path
import subprocess,re
BASE='f841a1df90c07e842ebf4b910df26dfd8561b2a3'
def before(p):return subprocess.check_output(['git','show',f'{BASE}:{p}']).decode()
allowed={'js/app.js','js/nh7-spiritual-plans-v412.js','js/nh7-push-account-bind-v364.js','js/nh7-notifications-zagreb-v334.js','js/nh7-admin-push-owner-v400.js','js/nh7-admin-message-center-v416.js','js/nh7-inbox-badge-sync-v418.js'}
for p in subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'--','js','data','supabase/functions','supabase/migrations']).decode().splitlines():
 if p not in allowed:assert Path(p).read_bytes()==subprocess.check_output(['git','show',f'{BASE}:{p}']),f'Protected product/backend file changed: {p}'
# app.js may change only notification presentation/dispatch, its readiness event and
# narrowing local cancellation to this app's already-retired notification IDs.
s=Path('js/app.js').read_text()
s=s.replace('${window.NH7NotificationContractWave4?.intent(m.intent)?`<button class="secondary-btn" data-inbox-destination="${html(m.id)}">${html(l223(\'باز کردن مقصد\',\'Open destination\',\'Otvori odredište\'))}</button>`:\'\'}','')
s=s.replace("const legacy=pending.filter(x=>Number(x.id)>=17000&&Number(x.id)<=19999);if(legacy.length)await Native.cancel({notifications:legacy.map(x=>({id:x.id}))})","if(pending.length)await Native.cancel({notifications:pending.map(x=>({id:x.id}))})")
s=s.replace("const extra=ev?.notification?.extra||{};const intent=extra.nh7_intent||{version:4,route:extra.route||'home',params:{}};window.NH7NotificationIntentsWave4?.open(intent)","const route=ev?.notification?.extra?.route||'home';navigate(route,{},true)")
s=s.replace("\n  if(window.NH7NotificationIntentsWave4?.owned(m))return '';",'')
s=s.replace("\n  if(window.NH7NotificationIntentsWave4?.owned(m))return Object.assign({},m,{displayLang:m.language||m.lang||state.lang});",'')
s=s.replace("  return render(route, state.params);","  render(route, state.params);")
s=s.replace("if(n)n.textContent=status+' '+(window.NH7PushBindingWave4?.statusLabel?.()||'');","if(n)n.textContent=status;")
s=s.replace("\nwindow.dispatchEvent(new Event('nh7-router-ready-wave4'));",'')
s=s.replace("\n  if(route!=='plans'||params.tab!=='spiritual')window.NH7_SPIRITUAL_PLANS?.dispose?.();",'')
s=s.replace("else if(route==='plans') {if(params.tab==='spiritual'&&window.NH7_SPIRITUAL_PLANS)await window.NH7_SPIRITUAL_PLANS.render(params);else await plans(params);}","else if(route==='plans') await plans(params);")
assert s==before('js/app.js'),'Unrelated app data/router/engine behavior changed'
p='js/nh7-spiritual-plans-v412.js';s=Path(p).read_text().replace("// Presentation disposal only: no progress/Notes/queue/storage mutation.\nwindow.NH7_SPIRITUAL_PLANS = { render:renderPlans, sync:syncCloudQueue, active:() => active, dispose:()=>{active=false;clearTimeout(restoreTimer)} };","window.NH7_SPIRITUAL_PLANS = { render:renderPlans, sync:syncCloudQueue, active:() => active };");assert s==before(p),'Plans persistence must remain exact'
for p in ['js/nh7-push-account-bind-v364.js','js/nh7-notification-contract-wave4.js','js/nh7-notification-intents-wave4.js','js/nh7-admin-message-center-v416.js','js/nh7-admin-push-owner-v400.js']:
 s=Path(p).read_text();assert 'setInterval(' not in s,f'New notification polling: {p}'
 assert 'localStorage.clear(' not in s and 'SERVICE_ROLE' not in s and 'sb_secret_' not in s
assert "login('nh7-admin-owner')" not in Path('js/nh7-admin-push-owner-v400.js').read_text()
assert 'nh7_admin_my_access_v350' in before('js/nh7-admin-rbac-v350.js')
assert "BACKEND_READY!==true" in Path('js/nh7-push-account-bind-v364.js').read_text()
review=Path('supabase/review/wave4-notifications-2')
assert 'Deno.serve' not in (review/'edge.ts').read_text()
assert 'No user-row backfill' in (review/'candidate.sql').read_text()
for p in review.glob('*.sql'):
 s=p.read_text();assert not re.search(r'delete\s+from|truncate\s+|drop\s+table|update\s+(?:public\.)?(?:registrations|school_progress|school_assignments|nh7_account_notes|nh7_account_progress)\b',s,re.I),p
 assert 'revoke all on all functions' not in s,'Broad pre-existing privilege change forbidden'
core=Path('sw-release-core-v403.js').read_text();assert "NH7_RELEASE_DATA_CACHE='nh7-data-stable-v329'" in core and "nh7-release-core-v571-wave4-notifications" in core
print('Wave4 scope PASS: exact protected current product/backends/migrations/data, app only notification UI/dispatch and safe local cancellation, no notification polling/secrets/destructive SQL/cache reset')
