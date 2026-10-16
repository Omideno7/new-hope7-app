"""Exact review-bound Wave7.5 delta; earlier assertions still validate their accepted prior source."""
from pathlib import Path
import json,hashlib,subprocess
BASE='3e209b646eac811d47a735408365c06a01c5b7de'
def manifest():return json.loads(Path('scripts/fixtures/wave75-approved-documents.json').read_text())
def prior75_bytes(path):
 current=Path(path).read_bytes();row=manifest()['existing_runtime'].get(path)
 if row is None:return current
 before=subprocess.check_output(['git','show',BASE+':'+path])
 assert hashlib.sha256(current).hexdigest()==row['after'],'Unapproved Wave75 source: '+path
 assert hashlib.sha256(before).hexdigest()==row['before'],'Invalid Wave75 baseline: '+path
 return before
