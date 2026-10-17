"""Exact Batch2 presentation delta; historical guards retain their accepted baseline."""
from pathlib import Path
import hashlib,json,subprocess
from school_accepted_source_v580 import prior_school_bytes,school_contract
BASE='d06b170f052390c84a500a7b78bd18115a84b04f'
def contract2():
 m=json.loads(Path('scripts/fixtures/batch2-source-contract.json').read_text());m['approved_paths']=sorted(set(m['approved_paths'])|set(school_contract()['approved_paths']));return m
def prior_batch2_bytes(path):
 current=prior_school_bytes(path);row=contract2()['runtime'].get(path)
 if row is None:return current
 before=subprocess.check_output(['git','show',BASE+':'+path]);assert hashlib.sha256(current).hexdigest()==row['after'],path;assert hashlib.sha256(before).hexdigest()==row['before'],path
 return before
