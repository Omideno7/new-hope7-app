"""Owner-approved exact School delta above Batch2. No wildcard/directory exception."""
from pathlib import Path
import hashlib,json,subprocess
BASE='b769df6d91cc2ffb4cc86905ab35d2c022fb2447'
EXISTING={'admin.html','index.html','js/app.js','js/nh7-school-drafts-v468.js','js/nh7-school-path-v351.js','js/nh7-security-core-v340.js','sw-release-core-v403.js'}
NEW_RUNTIME={'js/nh7-school-cycles-v580.js','js/nh7-admin-school-cycles-v580.js'}
REVIEW={'README.md','schema.sql','compiled-rpcs.sql','actions.sql','compatibility.sql','report-compatibility.sql','acl.sql','preflight-readonly.sql','activation-checklist.md','rollback.sql'}
NEW_BACKEND={'supabase/review/school-progression-v580/'+p for p in REVIEW}|{'supabase/migrations/20261017130000_school_cycles_and_admin_overrides_v580.sql'}
def school_contract():
 m=json.loads(Path('scripts/fixtures/school-source-contract-v580.json').read_text());assert m['base']==BASE;assert set(m['files'])==EXISTING|NEW_RUNTIME|NEW_BACKEND
 return m
def verify_school_contract():
 m=school_contract()
 for name,row in m['files'].items():
  assert hashlib.sha256(Path(name).read_bytes()).hexdigest()==row['after'],'Unreviewed School source: '+name
  if name in EXISTING:assert hashlib.sha256(subprocess.check_output(['git','show',BASE+':'+name])).hexdigest()==row['before'],name
  else:assert row['before'] is None,name
 return m
def prior_school_bytes(path):
 current=Path(path).read_bytes();row=school_contract()['files'].get(path)
 if path not in EXISTING:return current
 assert hashlib.sha256(current).hexdigest()==row['after'],'Unreviewed School source: '+path
 before=subprocess.check_output(['git','show',BASE+':'+path]);assert hashlib.sha256(before).hexdigest()==row['before'];return before
def school_additions():
 verify_school_contract();return NEW_RUNTIME|NEW_BACKEND
def protected_diff(base,paths):
 verify_school_contract();names=set(subprocess.check_output(['git','diff','--name-only',base,'--',*paths]).decode().splitlines());return names-(EXISTING|NEW_RUNTIME|NEW_BACKEND)
