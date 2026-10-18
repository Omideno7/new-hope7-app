#!/usr/bin/env python3
"""Read-only future wrapper label check; never builds, signs or edits native identity."""
import argparse,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--config',type=Path,required=True);p.add_argument('--mode',choices=['qa','release'],required=True);a=p.parse_args();c=json.loads(a.config.read_text());name=c.get('appName');assert isinstance(name,str) and name.strip(),'Missing explicit wrapper appName'
if a.mode=='release':assert name=='New Hope 7','Release appName must be exactly New Hope 7; QA/Test/Wave suffix is forbidden'
else:assert name.startswith(('New Hope 7','NH7')) and name!='New Hope 7','QA must remain distinguishable from Production'
assert isinstance(c.get('appId'),str) and c['appId'],'Missing identity; this validator never changes it'
print('PASS read-only wrapper source display name; installed iOS CFBundleDisplayName/Android label/resources and physical icon label still require artifact/device verification')
