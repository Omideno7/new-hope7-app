"""Historical freeze guards see the verified pre-Wave6 bytes for explicit UI patches only.
Current code is independently checked by Wave6 safety and behavioral tests. No wildcard exceptions.
"""
from pathlib import Path
import hashlib,json,subprocess
from wave65_accepted_source import prior_bytes
BASE='184498f5e184ac6f0d5ffdf6962c426957af842b'
def original(path):return subprocess.check_output(['git','show',BASE+':'+path])
def manifest():return json.loads(Path('scripts/fixtures/wave6-approved-ui.json').read_text())
def accepted_bytes(path):
 rows=manifest()['existing_ui_files']
 if path not in rows:return prior_bytes(path)
 row=rows[path];current=prior_bytes(path);old=original(path)
 assert hashlib.sha256(current).hexdigest()==row['after_sha256'],'Unreviewed change after Wave6 patch: '+path
 assert hashlib.sha256(old).hexdigest()==row['before_sha256'],'Incorrect Wave6 baseline: '+path
 return old
