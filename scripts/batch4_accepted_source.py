"""Exact Batch4 projection; independent CURRENT tests run before older freeze gates."""
from pathlib import Path
import hashlib,json,subprocess
from functools import lru_cache
BASE='eef4e4fe365f50fe5b859e4e4acbc064c6a30cc0'
@lru_cache(maxsize=None)
def before4(p):return subprocess.check_output(['git','show',BASE+':'+p])
def contract4():
 m=json.loads(Path('scripts/fixtures/batch4-source-contract.json').read_text());assert m['base']==BASE;return m
def verify4():
 m=contract4()
 for p,r in m['files'].items():
  assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==r['after'],'Unreviewed Batch4 source: '+p
  if r['before'] is not None:assert hashlib.sha256(before4(p)).hexdigest()==r['before'],p
 return m
def prior_batch4_bytes(p):
 r=contract4()['files'].get(p);current=Path(p).read_bytes()
 if not r:return current
 assert hashlib.sha256(current).hexdigest()==r['after'],p
 return before4(p) if r['before'] is not None else current
def batch4_paths():return set(verify4()['approved_paths'])
def batch4_additions():return {p for p,r in verify4()['files'].items() if r['before'] is None and p.startswith(('js/','css/','supabase/'))}
def diff_without4(base,paths):return set(subprocess.check_output(['git','diff','--name-only',base,'--',*paths]).decode().splitlines())-batch4_paths()
