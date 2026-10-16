"""Single exact reconnect delta, independently reversed/guarded by verify-wave8-safety.py."""
from pathlib import Path
import json,hashlib,subprocess
BASE='ffa2cc97a7c225d3d97a5ff4e57e620360440e04'
def prior8_bytes(path):
 current=Path(path).read_bytes();m=json.loads(Path('scripts/fixtures/wave8-evidence-contract.json').read_text());row=m.get('existing_runtime',{}).get(path)
 if row is None:return current
 before=subprocess.check_output(['git','show',BASE+':'+path]);assert hashlib.sha256(current).hexdigest()==row['after'],path;assert hashlib.sha256(before).hexdigest()==row['before'],path
 return before
