"""Exact Wave5 changed-file boundary and retained current product/backend bytes."""
from pathlib import Path
import subprocess,re,json,hashlib
import sys
sys.dont_write_bytecode=True
from wave6_accepted_source import accepted_bytes
subprocess.run(['python3','scripts/verify-wave6-safety.py'],check=True)
BASE='46c0ebf9aaabf67f07bcbae4e02028913b86b951'
def old(p):return subprocess.check_output(['git','show',BASE+':'+p])
for scope in ('js','css','assets','data','public','supabase/functions','supabase/migrations'):
 for name in subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'--',scope]).decode().splitlines():assert accepted_bytes(name)==old(name),f'Protected product/backend changed: {name}'
allowed={'scripts/verify-report-pdf-v119.cjs','scripts/verify-school-reports-browser-v116.cjs','scripts/verify-local-first-wave2-browser.cjs','admin.html','index.html','sw-release-core-v403.js','.github/workflows/validate-develop.yml','document-studio.html','document-output.html','document-verify.html','my-documents.html','css/document-studio-v2.css','js/vendor/document-qrcode-1.5.4.js','js/vendor/document-qrcode-LICENSE.txt','js/vendor/document-qrcode-dependencies.json'}
files=set(subprocess.check_output(['git','diff','--name-only',BASE]).decode().splitlines())|set(subprocess.check_output(['git','ls-files','--others','--exclude-standard']).decode().splitlines())
from wave6_accepted_source import manifest
allowed.update(manifest()['existing_ui_files']);allowed.update(manifest()['new_ui_files']);allowed.update({'scripts/wave6_accepted_source.py','scripts/verify-profile-search-inbox-qa.cjs','scripts/verify-calendar-lock-parity-v250.py','scripts/fixtures/wave6-user.cjs','scripts/fixtures/wave6-approved-ui.json','scripts/fixtures/wave6-approved-ui.patch','docs/qa/CODEX_WAVE6_USER_APP_COMPLETION_BUG_SWEEP.md','docs/qa/WAVE6_USER_APP_COMPLETION_AUDIT.md','docs/qa/WAVE6_USER_APP_COMPLETION_REPORT.md','docs/qa/WAVE6_USER_APP_MEASUREMENTS.json','docs/qa/WAVE6_HISTORICAL_UI_CONVERGENCE.md','scripts/verify-wave3-safety.py','scripts/verify-wave4-safety.py'})
from wave65_accepted_source import manifest as security_manifest
allowed.update(security_manifest()['approved_paths'])
for name in files:assert name in allowed or name.startswith(('scripts/verify-wave6','scripts/measure-wave6')) or name.startswith(('js/document-studio-v2/','supabase/review/wave5-document-studio-v2/','scripts/document-studio-v2/','scripts/verify-wave5','scripts/measure-wave5','docs/qa/WAVE5_DOCUMENT_STUDIO_')),f'Unexpected scope: {name}'
for file,module in [('admin.html','admin-entry'),('index.html','archive-entry')]:
 s=accepted_bytes(file).decode().replace('  <script type="module" src="js/document-studio-v2/'+module+'.mjs?v=wave5"></script>\n','');assert s.encode()==old(file),'Only additive current page entry permitted'
core=accepted_bytes('sw-release-core-v403.js').decode();assert "NH7_RELEASE_DATA_CACHE='nh7-data-stable-v329'" in core
before=old('sw-release-core-v403.js').decode();s=core.replace('nh7-release-core-v571-wave4-notifications-wave5-documents','nh7-release-core-v571-wave4-notifications');s='\n'.join(l for l in s.split('\n') if not any(x in l for x in ['./document-studio.html','./document-output.html','./document-verify.html','./my-documents.html','./css/document-studio-v2.css','./js/vendor/document-qrcode-1.5.4.js','./js/document-studio-v2/']));assert s==before,'No worker/data/cache policy changes permitted'
for p in Path('js/document-studio-v2').glob('*.mjs'):
 s=p.read_text();assert 'setInterval(' not in s and 'localStorage.clear(' not in s and 'SERVICE_ROLE' not in s and 'sb_secret_' not in s,p
assert 'nh7_admin_my_access_v350' in Path('js/document-studio-v2/api.mjs').read_text()
assert 'nh7_admin_is_admin_v170' not in Path('js/document-studio-v2/editor.mjs').read_text()
for p in Path('supabase/review/wave5-document-studio-v2').glob('*.sql'):
 s=re.sub(r'--[^\n]*','',p.read_text());assert not re.search(r'\b(delete\s+from|truncate\s+|drop\s+table|update\s+(?:public\.)?(?:school_|registrations|nh7_account_|nh7_library_items|auth\.users))',s,re.I),p
assert 'private.nh7_admin_is_owner_v350()' in Path('supabase/review/wave5-document-studio-v2/candidate.sql').read_text()
manifest=json.loads(Path('js/vendor/document-qrcode-dependencies.json').read_text());assert hashlib.sha256(Path('js/vendor/document-qrcode-1.5.4.js').read_bytes()).hexdigest()==manifest['sha256'];assert 'Wyatt Baldwin' in Path('js/vendor/document-qrcode-LICENSE.txt').read_text() and 'Ryan Day' in Path('js/vendor/document-qrcode-LICENSE.txt').read_text()
for name,entry in [('document-studio.html','editor'),('document-output.html','output-page'),('document-verify.html','verification'),('my-documents.html','archive')]:
 s=Path(name).read_text();assert 'css/document-studio-v2.css' in s and 'js/vendor/document-qrcode-1.5.4.js' in s and 'js/document-studio-v2/'+entry+'.mjs' in s;assert not re.search(r'<script[^>]*src=[\"\']https?://',s)
print('Wave5 scope PASS: exact current product/legacy/School/reports/Auth/Wave1–4/backend/migration/data bytes, additive entries only, executable-cache-only rotation, no Studio polling/client secret/data deletion; local licensed QR dependency and coherent entrypoints')

# Parse every new HTML entry and verify all local executable/style dependencies exist.
from html.parser import HTMLParser
class Entry(HTMLParser):
 def __init__(self):super().__init__();self.ids=set();self.errors=[]
 def handle_starttag(self,tag,attributes):
  a=dict(attributes)
  if 'id' in a:
   assert a['id'] not in self.ids,'Duplicate HTML id: '+a['id'];self.ids.add(a['id'])
  source=a.get('src') if tag=='script' else a.get('href') if tag=='link' and a.get('rel')=='stylesheet' else None
  if source:assert not source.startswith(('http:','https:')) and Path(source.split('?')[0]).is_file(),source
for name in ['document-studio.html','document-output.html','document-verify.html','my-documents.html']:
 parser=Entry();parser.feed(Path(name).read_text());parser.close()
for p in list(Path('js/document-studio-v2').glob('*.json'))+[Path('js/vendor/document-qrcode-dependencies.json')]:json.loads(p.read_text())
print('PASS parsed HTML dependencies/unique IDs and new dependency JSON')
