"""Exact Batch3B inverse projection, independently guarded before historical freeze checks."""
from pathlib import Path
import subprocess,hashlib,json
from functools import lru_cache
from batch4_accepted_source import prior_batch4_bytes,batch4_paths,batch4_additions
BASE='73610310eaccebe417975aaa48b17b563b642796'
@lru_cache(maxsize=None)
def before3b(p):return subprocess.check_output(['git','show',BASE+':'+p])
def contract3b():
 m=json.loads(Path('scripts/fixtures/batch3b-source-contract.json').read_text());assert m['base']==BASE;m['approved_paths']=sorted(set(m['approved_paths'])|batch4_paths());return m
def verify3b():
 m=contract3b()
 for p,row in m['files'].items():
  assert hashlib.sha256(prior_batch4_bytes(p)).hexdigest()==row['after'],'Unreviewed Batch3B source: '+p
  if row['before'] is not None:assert hashlib.sha256(before3b(p)).hexdigest()==row['before'],p
 return m
def prior_batch3b_bytes(p):
 row=contract3b()['files'].get(p);current=prior_batch4_bytes(p)
 if not row:return current
 assert hashlib.sha256(current).hexdigest()==row['after'],p
 return before3b(p) if row['before'] is not None else current
def batch3b_paths():return set(verify3b()['approved_paths'])
def batch3b_additions():return {p for p,r in verify3b()['files'].items() if r['before'] is None}|batch4_additions()
def diff_without3b(base,paths):
 m=verify3b();names=set(subprocess.check_output(['git','diff','--name-only',base,'--',*paths]).decode().splitlines());return names-set(m['files'])-batch4_paths()
