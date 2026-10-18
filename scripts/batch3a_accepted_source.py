"""Exact Batch3A delta; original School/Batch1/2/Wave assertions retain their original bytes.
Current-source behavior and authority are independently tested before this projection.
"""
from pathlib import Path
import hashlib,json,subprocess
from functools import lru_cache
BASE='ae2c9d4c460a7dc999c9713449366ac427ac5cea'
EXISTING={'index.html','sw-release-core-v403.js','js/app.js','js/nh7-my-notes-v234.js','js/nh7-inbox-badge-sync-v418.js','js/nh7-spiritual-plans-v240.js','js/nh7-spiritual-plans-v412.js','js/document-studio-v2/archive-entry.mjs','js/document-studio-v2/archive.mjs'}
ADDITIONS={'js/nh7-batch3a-v581.js','supabase/review/batch3a-qa-owner-removal/README.md','supabase/review/batch3a-qa-owner-removal/preflight-readonly.sql','supabase/review/batch3a-qa-owner-removal/candidate.sql','supabase/review/batch3a-qa-owner-removal/rollback.sql'}
@lru_cache(maxsize=None)
def before_bytes(p):return subprocess.check_output(['git','show',BASE+':'+p])
def manifest3a():
 m=json.loads(Path('scripts/fixtures/batch3a-source-contract.json').read_text());assert m['base']==BASE;assert set(m['files'])==EXISTING|ADDITIONS
 return m
def verify3a():
 m=manifest3a()
 for p,row in m['files'].items():
  assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==row['after'],'Unreviewed Batch3A source: '+p
  if p in EXISTING:assert hashlib.sha256(before_bytes(p)).hexdigest()==row['before'],p
  else:assert row['before'] is None,p
 return m
def prior_batch3a_bytes(p):
 current=Path(p).read_bytes()
 if p not in EXISTING:return current
 row=manifest3a()['files'][p];assert hashlib.sha256(current).hexdigest()==row['after'],p
 before=before_bytes(p);assert hashlib.sha256(before).hexdigest()==row['before'];return before
def batch3a_paths():return set(verify3a()['approved_paths'])
def batch3a_additions():verify3a();return ADDITIONS
