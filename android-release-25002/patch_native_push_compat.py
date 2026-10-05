"""Keep OneSignal 5.5.3 compatible with pre-Chrome-85 Android WebViews.

Capacitor injects Cordova plugins together with its native bridge. Four local
callback defaults in OneSignal use ??=, making the entire injected script fail
to parse on Chrome 83. These equivalent expressions preserve return values
and avoid changing plugin versions, app data or the approved web payload.
"""
from pathlib import Path
import hashlib
import json
import re

root = Path('native-release/node_modules/onesignal-cordova-plugin')
assert json.loads((root / 'package.json').read_text())['version'] == '5.5.3'
path = root / 'dist/index.cjs'
before = path.read_text()
pattern = re.compile(r'\b([A-Za-z_$][\w$]*)\?\?=([A-Za-z_$][\w$]*)\b')
after, count = pattern.subn(lambda m: f'({m[1]}==null?({m[1]}={m[2]}):{m[1]})', before)
assert count == 4, f'Expected four OneSignal callback defaults; got {count}'
assert '??=' not in after and '&&=' not in after and '||=' not in after
path.write_text(after)
out = Path('out')
out.mkdir(exist_ok=True)
result = {'status': 'PASS', 'plugin': 'onesignal-cordova-plugin', 'version': '5.5.3',
          'callback_defaults_rewritten': count,
          'before_sha256': hashlib.sha256(before.encode()).hexdigest(),
          'after_sha256': hashlib.sha256(after.encode()).hexdigest()}
(out / 'native-push-compat.json').write_text(json.dumps(result, indent=2))
print(json.dumps(result))
