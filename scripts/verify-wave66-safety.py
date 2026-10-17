"""Exact frozen app/backend/prior review bytes; enumerate only inert current-wave review additions."""
import sys
sys.dont_write_bytecode=True
from wave75_accepted_source import manifest as wave75_manifest
from pathlib import Path
from school_accepted_source_v580 import school_additions,protected_diff
import json,subprocess,hashlib,re
from wave7_accepted_source import previous_bytes,manifest as platform_manifest
subprocess.run(['python3','scripts/verify-wave7-safety.py'],check=True)
BASE='4f6c702c3f9e996256a5f9410bfd6096b5f3f018'
m=json.loads(Path('scripts/fixtures/wave66-approved-review.json').read_text());assert m['base']==BASE
scopes=['js','css','assets','data','public','supabase','index.html','admin.html','reset-password.html','sw-release-core-v403.js']
old=set(subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'--',*scopes]).decode().splitlines());now=set(subprocess.check_output(['git','ls-files','--',*scopes]).decode().splitlines())|set(subprocess.check_output(['git','ls-files','--others','--exclude-standard','--',*scopes]).decode().splitlines())
assert now-old==set(m['new_review'])|set(platform_manifest()['new_runtime'])|set(wave75_manifest()['new_runtime'])|set(wave75_manifest()['new_review'])|school_additions(),'Unexpected runtime/backend/review addition'
objects=dict(line.split(' ',1)[::-1] for line in subprocess.check_output(['git','ls-tree','-r','--format=%(objectname) %(path)',BASE,'--',*scopes]).decode().splitlines())
for p in old:
 data=previous_bytes(p);assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==objects[p],'Wave66 must not alter existing product/backend/review source '+p
for p,h in m['new_review'].items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h,'Unrecorded review source '+p
for p,h in m['metadata'].items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==h,'Authoritative metadata altered '+p
assert hashlib.sha256(Path('docs/qa/WAVE6_6_LIVE_SECURITY_PREFLIGHT_AUDIT.md').read_bytes()).hexdigest()==m['original_audit_sha256'],'Preserve original audit exactly'
for p in Path('supabase/review/wave6_6-live-security').rglob('*'):
 if p.is_file():assert p.suffix in ['.md','.json','.sql'] and '__pycache__' not in str(p),p
for p in Path('supabase/review/wave6_6-live-security').glob('*.sql'):
 s=p.read_text();assert not re.search(r'\b(?:delete\s+from|truncate|create\s+policy|alter\s+extension)\b',re.sub(r'--[^\n]*','',s),re.I),p
assert not protected_diff(BASE,['supabase/migrations','supabase/functions','data'])
print('PASS Wave66 accepted prior app bytes exact (independently guarded Wave7 presentation delta); data/engines/authority/backend/migrations/Wave1–6.5 review exact; enumerated inert review additions and owner metadata hash-bound; original audit unchanged')
