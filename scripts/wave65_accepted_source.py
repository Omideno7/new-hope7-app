"""Exact, hash-bound Wave 6.5 security delta; historical guards can still validate prior accepted bytes."""
from pathlib import Path
import hashlib,json,subprocess
BASE='fd7191653d45fc53791b867feb54181e2b90bf77'
def manifest():return json.loads(Path('scripts/fixtures/wave65-approved-security.json').read_text())
def prior_bytes(path):
 row=manifest()['existing_runtime'].get(path)
 if row is None:return Path(path).read_bytes()
 current=Path(path).read_bytes();old=subprocess.check_output(['git','show',BASE+':'+path])
 assert hashlib.sha256(current).hexdigest()==row['after'],'Unapproved Wave65 delta: '+path
 assert hashlib.sha256(old).hexdigest()==row['before'],'Invalid Wave65 source: '+path
 return old
