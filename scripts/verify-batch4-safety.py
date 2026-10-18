"""Independent current Batch4 scope plus exact older-checkpoint reconciliation."""
from pathlib import Path
import subprocess,re,hashlib,yaml,tempfile,json
from batch4_accepted_source import BASE,verify4,before4
m=verify4();changed=set(subprocess.check_output(['git','diff','--name-only',BASE]).decode().splitlines())|set(subprocess.check_output(['git','ls-files','--others','--exclude-standard']).decode().splitlines())
assert changed==set(m['approved_paths']),changed^set(m['approved_paths'])
runtime={'index.html','js/app.js','js/nh7-appearance-personalization-v514.js','js/nh7-notification-intents-wave4.js','js/nh7-push-account-bind-v364.js','js/nh7-settings-account-v252.js','js/nh7-settings-controller-v403.js','js/nh7-theme-studio-v453.js','sw-release-core-v403.js','css/nh7-settings-appearance-batch4.css','js/nh7-settings-batch4.js','js/nh7-settings-storage-batch4.js'}
assert {p for p in changed if p.startswith(('js/','css/')) or p.endswith('.html') or p=='sw-release-core-v403.js'}==runtime
assert not any(p.startswith(('supabase/','data/','public/','ios/','android/','watchos/')) or p=='service-worker.js' for p in changed)
def functions(s):
 hits=list(re.finditer(r'^(?:async )?function (\w+)\(',s,re.M));return {h[1]:s[h.start():hits[i+1].start() if i+1<len(hits) else len(s)] for i,h in enumerate(hits)}
a,b=functions(before4('js/app.js').decode()),functions(Path('js/app.js').read_text());assert set(a)==set(b);assert {k for k in a if a[k]!=b[k]}=={'settings','maybeCreateScheduledInboxMessages'}
# The original scheduling algorithm is unchanged apart from explicit optional preference gates.
s=b['maybeCreateScheduledInboxMessages'].replace("localStorage.getItem('nh7_notifications_enabled_v252')==='0'||",'').replace("if(window.NH7SettingsBatch4&&!window.NH7SettingsBatch4.allows(row.key))continue;",'');assert s==a['maybeCreateScheduledInboxMessages']
# Existing Account/full deletion implementation stays byte-identical.
s=Path('js/nh7-settings-account-v252.js').read_text();assert s.replace("if(window.NH7SettingsBatch4){window.NH7SettingsBatch4.mount();return}",'')==before4('js/nh7-settings-account-v252.js').decode()
for p in ['scripts/fixtures/batch3b-source-contract.json','scripts/fixtures/batch3a-source-contract.json','scripts/fixtures/batch3a-approved.patch','scripts/fixtures/school-source-contract-v580.json','scripts/fixtures/school-approved-v580.patch']:
 assert Path(p).read_bytes()==before4(p),p
# Only an additive independent current gate; all older commands and permissions exact.
a=yaml.safe_load(before4('.github/workflows/validate-develop.yml'));b=yaml.safe_load(Path('.github/workflows/validate-develop.yml').read_text());steps=b['jobs']['validate']['steps'];new=[s for s in steps if s['name']=='Validate Batch 4 Settings storage notifications appearance without activation'];assert len(new)==1;b['jobs']['validate']['steps']=[s for s in steps if s not in new];assert a==b
index=Path('index.html').read_text();assert index.index('js/nh7-settings-storage-batch4.js')<index.index('js/nh7-settings-batch4.js')<index.index('js/nh7-settings-controller-v403.js')
worker=Path('sw-release-core-v403.js').read_text()
for dependency in ['js/nh7-settings-storage-batch4.js','js/nh7-settings-batch4.js','css/nh7-settings-appearance-batch4.css']:assert "'./"+dependency+"'" in worker
controller=Path('js/nh7-settings-controller-v403.js').read_text()
for name,action in [('clearOffline','cleanup'),('prepareOffline','prepare'),('refresh','refresh')]:
 expected="async function "+name+"(btn){if(window.NH7SettingsBatch4)return window.NH7SettingsBatch4.action('"+action+"');show(L("
 assert expected in controller and 'Settings tools are unavailable.' in controller
s=Path('js/nh7-settings-storage-batch4.js').read_text();assert not re.search(r'deleteDatabase|\.clear\(|recursive|setInterval|fetch\(',s)
s=Path('js/nh7-settings-batch4.js').read_text();assert not re.search(r'fetch\(|setInterval|location.reload|\.init\(|sendBeacon',s)
s=Path('js/nh7-appearance-personalization-v514.js').read_text();assert 'setInterval' not in s and 'scheduleThemeBoundary' in s
css=Path('css/nh7-settings-appearance-batch4.css').read_text();assert css.count('{')==css.count('}') and 'prefers-reduced-motion:reduce' in css and 'infinite' not in css
# Historical gate transforms must be exact. No deleted assertion or broad whitelist.
p='scripts/batch3b_accepted_source.py';x=before4(p).decode().replace('from functools import lru_cache','from functools import lru_cache\nfrom batch4_accepted_source import prior_batch4_bytes,batch4_paths,batch4_additions').replace("assert m['base']==BASE;return m", "assert m['base']==BASE;m['approved_paths']=sorted(set(m['approved_paths'])|batch4_paths());return m").replace('Path(p).read_bytes()','prior_batch4_bytes(p)').replace("if r['before'] is None}","if r['before'] is None}|batch4_additions()").replace("return names-set(m['files'])","return names-set(m['files'])-batch4_paths()");assert Path(p).read_text()==x
p='scripts/verify-batch3b-safety.py';x=before4(p).decode().replace('from batch3b_accepted_source import BASE,verify3b,prior_batch3b_bytes','from batch3b_accepted_source import BASE,verify3b,prior_batch3b_bytes\nfrom batch4_accepted_source import prior_batch4_bytes,diff_without4').replace("not subprocess.check_output(['git','diff',BASE,'--',*protected])",'not diff_without4(BASE,protected)')
for name in ['js/app.js','index.html','sw-release-core-v403.js','.github/workflows/validate-develop.yml']:x=x.replace(f"Path('{name}').read_text()",f"prior_batch4_bytes('{name}').decode()")
marker='# Guard reconciliation is an exact additive transform, never a broad whitelist or removed assertion.'
x=x.split(marker)[0]+marker+before4(p).decode().split(marker)[1]
assert Path(p).read_text()==x
# This one stale v572 source guard retains ALL original assertions verbatim.
p='scripts/verify-offline-reconciliation-v572.mjs';source=Path(p).read_text();marker='// Original v572 checkpoint assertions remain unchanged below.\n'
original=before4(p).decode();assert source.split(marker)[1]==original[original.index('const settings=read('):]
assert "const read=p=>p==='js/nh7-settings-controller-v403.js'?acceptedSettings:fs.readFileSync(p,'utf8');" in source
assert 'verify4(); sys.stdout.buffer.write(prior_batch4_bytes(sys.argv[1]))' in source
for p in runtime:
 if p.endswith('.js'):subprocess.run(['node','--check',p],check=True)
with tempfile.TemporaryDirectory() as d:
 path=Path(d)/'capacitor.config.json'
 for name,mode,ok in [('New Hope 7','release',True),('New Hope 7 QA','qa',True),('New Hope 7 QA','release',False),('New Hope 7 Test','release',False)]:
  path.write_text(json.dumps({'appId':'example.synthetic.unchanged','appName':name}));r=subprocess.run(['python3','scripts/verify-native-display-name.py','--config',str(path),'--mode',mode],capture_output=True);assert (r.returncode==0)==ok,(name,mode)
subprocess.run(['python3','scripts/verify-supabase-migration-parity.py'],check=True)
print('PASS Batch4 exact source/paths, two app functions only, unchanged Account/full-delete/backends/engines/migrations/earlier fixtures; exact historical projection and additive CI; no new polling/provider/analytics; syntax/CSS balance')
