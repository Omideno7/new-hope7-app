"""Wave8 independently freezes runtime/data/backend/wrappers; evidence-only additions are explicit."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import subprocess,json,hashlib,re,tempfile
from wave8_accepted_source import prior8_bytes
BASE='ffa2cc97a7c225d3d97a5ff4e57e620360440e04'
m=json.loads(Path('scripts/fixtures/wave8-evidence-contract.json').read_text());assert m['base']==BASE
scopes=['js','css','assets','data','public','app','supabase','watchos','index.html','admin.html','admin-v239-stable.html','manifest.json','service-worker.js','sw-release-core-v403.js','document-studio.html','document-output.html','document-verify.html','my-documents.html','version.json']
objects=dict(line.split(' ',1)[::-1] for line in subprocess.check_output(['git','ls-tree','-r','--format=%(objectname) %(path)',BASE,'--',*scopes]).decode().splitlines())
for name,oid in objects.items():
 raw=prior8_bytes(name);assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==oid,'Protected runtime/backend changed: '+name
assert set(m['existing_runtime'])=={'js/app.js','sw-release-core-v403.js'},'Only reproduced reconnect handler and executable cache version may change'
patch=Path('scripts/fixtures/wave8-approved-reconnect.patch');assert hashlib.sha256(patch.read_bytes()).hexdigest()==m['patch_sha256']
with tempfile.TemporaryDirectory(prefix='nh7-wave8-inverse-') as tmp:
 for name in m['existing_runtime']:
  p=Path(tmp)/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(Path(name).read_bytes())
 subprocess.run(['git','apply','--reverse','--check','--unidiff-zero',str(patch.resolve())],cwd=tmp,check=True)
core=Path('sw-release-core-v403.js').read_text();assert core.replace('-wave8-reconnect','')==prior8_bytes('sw-release-core-v403.js').decode(),'Executable cache rotation only'
app=Path('js/app.js').read_text();assert app.count('function reconnectCurrentAccountWave8()')==1 and 'context.current(nh7ReconnectFlightWave8.actor)' in app and 'if(!current())return;' in app and 'if(current()&&state.route' in app
tracked=set(subprocess.check_output(['git','ls-files','--',*scopes]).decode().splitlines());untracked=set(subprocess.check_output(['git','ls-files','--others','--exclude-standard','--',*scopes]).decode().splitlines());old=set(subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'--',*scopes]).decode().splitlines());assert tracked|untracked==old,'No runtime/backend/native addition/removal'
changed=set(subprocess.check_output(['git','diff','--name-only',BASE]).decode().splitlines())|set(subprocess.check_output(['git','ls-files','--others','--exclude-standard']).decode().splitlines());assert changed<=set(m['approved_paths']),changed-set(m['approved_paths'])
audit=Path('docs/qa/WAVE8_INTEGRATION_PHYSICAL_ACCEPTANCE_AUDIT.md');assert hashlib.sha256(audit.read_bytes()).hexdigest()==m['audit_sha256'],'Audit must remain preserved'
ledger=Path('docs/RELEASE_PROVENANCE.md').read_bytes();before=subprocess.check_output(['git','show',BASE+':docs/RELEASE_PROVENANCE.md']);assert ledger.startswith(before),'Historical release ledger is immutable; append dated QA evidence only'
for p in ['.github/workflows/deploy-pages.yml','.github/workflows/apply-admin-full-stability-v447.yml','.github/workflows/apply-admin-listening-session-v451.yml','.github/workflows/apply-admin-stability-v439.yml']:
 assert Path(p).read_bytes()==subprocess.check_output(['git','show',BASE+':'+p]),p
assert 'REJECTED_COST' in Path('docs/qa/WAVE7_5_ZERO_COST_AUDIO_ANALYTICS_DECISION.md').read_text()
for path in ['js/nh7-audio-classic-v484.js','js/nh7-audio-library-v500.js','js/nh7-media-player-v500.js']:
 assert Path(path).read_bytes()==subprocess.check_output(['git','show',BASE+':'+path])
for p in ['document-studio.html','document-output.html','document-verify.html','my-documents.html','index.html','admin.html']:
 assert 'NH7_DOCUMENT_STUDIO_V2_BACKEND_READY=true' not in Path(p).read_text(),p
assert not any('ios-release' in p or 'DerivedData' in p or p.endswith(('.ipa','.apk','.aab','.p12','.keystore','.mobileprovision','.pyc')) for p in changed)
measurement=subprocess.check_output(['git','show',BASE+':scripts/measure-wave65.cjs']).decode()
for before,after in m['measurement_readiness_replacements']:
 assert measurement.count(before)==1;measurement=measurement.replace(before,after)
assert Path('scripts/measure-wave65.cjs').read_text()==measurement,'Only symmetric fixture latency, bounded bootstrap readiness and diagnostics; every original measurement assertion unchanged'
test_path='scripts/verify-wave6-navigation-search.cjs'
old_test=subprocess.check_output(['git','show',BASE+':'+test_path]).decode()
ready_old='async function query(value){await p.evaluate'
ready_new='async function query(value){await p.waitForSelector(\'#nh7GlobalSearch560[data-nh7-direct562="1"] [data-nh7gs-input]\');await p.evaluate'
assert old_test.count(ready_old)==1 and Path(test_path).read_text()==old_test.replace(ready_old,ready_new),'Only mounted-control readiness wait added; every original assertion byte-identical'
assert not subprocess.check_output(['git','diff',BASE,'--','supabase/migrations','supabase/functions','supabase/review'])
print('PASS Wave8 exact reversible reconnect-only delta; all other runtime/backend/review/authority/data/Watch/native sources unchanged; explicit evidence-only paths; original audit/ledger preserved; no activation/migration/analytics/deploy/native artifacts')
