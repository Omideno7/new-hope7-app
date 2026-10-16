"""Hash-bound presentation-only delta; retain all historical safety assertions on accepted prior bytes."""
from pathlib import Path
import hashlib,json,subprocess
BASE='8bdb9a0cad807440b36bdca7c5a6f53562cc9e70'
def manifest():return json.loads(Path('scripts/fixtures/wave7-approved-platform.json').read_text())
def previous_bytes(path):
 row=manifest()['existing_runtime'].get(path)
 current=Path(path).read_bytes()
 if row is None:return current
 old=subprocess.check_output(['git','show',BASE+':'+path])
 assert hashlib.sha256(current).hexdigest()==row['after'],'Unapproved Wave7 presentation bytes: '+path
 assert hashlib.sha256(old).hexdigest()==row['before'],'Invalid Wave7 baseline: '+path
 return old
