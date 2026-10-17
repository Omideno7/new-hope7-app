"""Exact Batch1 delta adapter. Historical guards still compare their original accepted bytes."""
from pathlib import Path
import hashlib,json,subprocess
BASE='9ad13f338aae4f3eba10850b57e02305c1d66ea9'
def contract():return json.loads(Path('scripts/fixtures/batch1-source-contract.json').read_text())
def prior_batch1_bytes(path):
 current=Path(path).read_bytes();row=contract()['runtime'].get(path)
 if row is None:return current
 before=subprocess.check_output(['git','show',BASE+':'+path])
 assert hashlib.sha256(before).hexdigest()==row['before'],path
 assert hashlib.sha256(current).hexdigest()==row['after'],path
 return before
