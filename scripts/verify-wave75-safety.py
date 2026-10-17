"""Independent current-source boundary: exact documented documents/Admin delta, frozen engines/data/backend."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import subprocess,hashlib,re,tempfile,json
from wave75_accepted_source import BASE,manifest,prior75_bytes
from wave8_accepted_source import prior8_bytes
from batch1_accepted_source import prior_batch1_bytes,contract as batch1_contract
m=manifest();assert m['base']==BASE
subprocess.run(['python3','scripts/verify-wave8-safety.py'],check=True)
wave8=json.loads(Path('scripts/fixtures/wave8-evidence-contract.json').read_text())
scopes=['js','css','assets','data','public','supabase','watchos','index.html','admin.html','reset-password.html','sw-release-core-v403.js','service-worker.js','manifest.json']
old=set(subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'--',*scopes]).decode().splitlines())
now=set(subprocess.check_output(['git','ls-files','--',*scopes]).decode().splitlines())|set(subprocess.check_output(['git','ls-files','--others','--exclude-standard','--',*scopes]).decode().splitlines())
assert now-old==set(m['new_runtime'])|set(m['new_review']),'Unexpected runtime/review addition'
objects=dict(line.split(' ',1)[::-1] for line in subprocess.check_output(['git','ls-tree','-r','--format=%(objectname) %(path)',BASE,'--',*scopes]).decode().splitlines())
for p in old:
 raw=prior75_bytes(p);assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==objects[p],'Unapproved product/backend change: '+p
for p,h in (m['new_runtime']|m['new_review']).items():assert hashlib.sha256(prior_batch1_bytes(p)).hexdigest()==h,p
patch=Path('scripts/fixtures/wave75-approved-documents.patch');assert hashlib.sha256(patch.read_bytes()).hexdigest()==m['patch_sha256']
with tempfile.TemporaryDirectory(prefix='nh7-wave75-check-') as tmp:
 for p in m['existing_runtime']:
  target=Path(tmp)/p;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(prior8_bytes(p))
 subprocess.run(['git','apply','--reverse','--check','--unidiff-zero',str(patch.resolve())],cwd=tmp,check=True)
changed=set(subprocess.check_output(['git','diff','--name-only',BASE]).decode().splitlines())|set(subprocess.check_output(['git','ls-files','--others','--exclude-standard']).decode().splitlines())
assert changed<=set(m['approved_paths'])|set(wave8['approved_paths'])|set(batch1_contract()['approved_paths']),changed-set(m['approved_paths'])-set(wave8['approved_paths'])
assert hashlib.sha256(Path('docs/qa/WAVE7_5_ADMIN_DOCUMENTS_ZERO_COST_ANALYTICS_AUDIT.md').read_bytes()).hexdigest()==m['audit_sha256']
cost=Path('js/nh7-admin-audio-cost-wave75.js').read_text()
assert 'REJECTED_COST' in cost
for token in ['fetch(', 'setTimeout(', 'setInterval(', 'localStorage','sessionStorage','XMLHttpRequest','supabase','WebSocket','sendBeacon']:
 assert token not in cost,token
for p in Path('js/document-studio-v2').glob('*.mjs'):
 s=p.read_text();assert not re.search(r'setInterval\(|localStorage\.clear\(|sessionStorage\.clear\(|service_role|sb_secret_',s),p
issue=Path('js/document-studio-v2/issuance.mjs').read_text();assert all(t in issue for t in ['issuance_contract===75','archive_delivered','publicProjection','request_id!==request','owner_uid===uid'])
editor=Path('js/document-studio-v2/editor.mjs').read_text();assert 'issuedReceipt(' in editor and 'preparedReceipt(' in editor and 'recipientSearchSerial' in editor and 'confirmDialog' in editor
verify=Path('js/document-studio-v2/verification.mjs').read_text();assert 'response?.number' in verify and not re.search(r'response\??\.document|render\(|download\(|window\.print',verify)
assert "if(scope==='public'){invalidate();throw Error('verifyError')}" in Path('js/document-studio-v2/output-page.mjs').read_text()
for p in ['document-studio.html','document-output.html','document-verify.html','my-documents.html','admin.html','index.html']:
 assert 'NH7_DOCUMENT_STUDIO_V2_BACKEND_READY=true' not in Path(p).read_text(),p
core=Path('sw-release-core-v403.js').read_text();assert "NH7_RELEASE_DATA_CACHE='nh7-data-stable-v329'" in core
for p in m['new_runtime']:assert './'+p in core
review=Path('supabase/review/wave7_5-admin-documents')
sql=(review/'document-backend-proposal.sql').read_text();rollback=(review/'rollback.sql').read_text()
assert 'private.nh7_admin_is_owner_v350()' in sql and 'auth.uid()' in sql and 'default false' in sql.lower() and 'for update' in sql.lower()
for s in [sql,(review/'rls-acl-proposal.sql').read_text(),rollback]:
 clean=re.sub(r'--[^\n]*','',s)
 assert not re.search(r'grant\s+.+\bon\s+all\b|truncate\b|drop\s+table|delete\s+from',clean,re.I)
assert 'enabled=false' in rollback.replace(' ','')
assert not subprocess.check_output(['git','diff',BASE,'--','supabase/migrations','supabase/functions','data','public','js/nh7-audio-classic-v484.js','js/nh7-audio-library-v500.js','js/nh7-media-player-v500.js','js/nh7-admin-rbac-v350.js','js/nh7-profile-photo-v564.js','js/nh7-local-first-wave2.js'])
print('PASS Wave75 exact reversible document/Admin presentation delta; all audio/auth/School/Notes/Library/profile/data/backend/migrations and older review bytes frozen; no new analytics I/O/timers/storage; default-off issuance and non-destructive rollback')
