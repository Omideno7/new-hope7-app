"""Exact Batch1 delta adapter. Historical guards still compare their original accepted bytes."""
from pathlib import Path
import hashlib,json,subprocess
from batch2_accepted_source import prior_batch2_bytes,contract2
BASE='9ad13f338aae4f3eba10850b57e02305c1d66ea9'
def contract():
 m=json.loads(Path('scripts/fixtures/batch1-source-contract.json').read_text());m['approved_paths']=sorted(set(m['approved_paths'])|set(contract2()['approved_paths']));return m
def prior_batch1_bytes(path):
 current=prior_batch2_bytes(path);row=contract()['runtime'].get(path)
 if row is None:return current
 before=subprocess.check_output(['git','show',BASE+':'+path])
 assert hashlib.sha256(before).hexdigest()==row['before'],path
 assert hashlib.sha256(current).hexdigest()==row['after'],path
 return before
