from pathlib import Path
import json

stable=Path('admin-v239-stable.html')
s=stable.read_text(encoding='utf-8')
old=s
s=s.replace('Stable 2.3.9.47','Stable 2.3.9.48').replace('نسخهٔ پایدار ۲.۳.۹.۴۷','نسخهٔ پایدار ۲.۳.۹.۴۸')
s=s.replace("const RELEASE='2.3.9.47';","const RELEASE='2.3.9.48';")
s=s.replace("const BUILD='2.3.9.47-full-stable';","const BUILD='2.3.9.48-listening-session';")
s=s.replace('js/nh7-admin-listening-analytics-v427.js','js/nh7-admin-listening-analytics-v451.js')
needle='<script src="js/nh7-admin-rbac-v350.js?v=${BUILD}"><\\/script>'
insert='<script src="js/nh7-admin-session-keepalive-v451.js?v=${BUILD}"><\\/script>'+needle
if needle not in s: raise SystemExit('RBAC loader contract not found')
s=s.replace(needle,insert,1)
# Runtime source may contain older release strings; stable wrapper already normalizes them.
s=s.replace("html=html.replaceAll('2.3.9.46','2.3.9.47')","html=html.replaceAll('2.3.9.47','2.3.9.48').replaceAll('2.3.9.46','2.3.9.48')")
if s==old: raise SystemExit('stable loader unchanged')
for required in ['2.3.9.48-listening-session','nh7-admin-listening-analytics-v451.js','nh7-admin-session-keepalive-v451.js']:
    if required not in s: raise SystemExit('missing '+required)
stable.write_text(s,encoding='utf-8')

vf=Path('version.json');v=json.loads(vf.read_text(encoding='utf-8'));v['admin']='2.3.9.48';v['updated_at']='2026-09-08T14:25:00+00:00';vf.write_text(json.dumps(v,separators=(',',':'))+'\n',encoding='utf-8')
print('patched admin 2.3.9.48 listening/session only')
