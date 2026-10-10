#!/usr/bin/env python3
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
errors=[]
def need(cond,msg):
    if not cond: errors.append(msg)
def text(rel):
    p=root/rel
    need(p.exists(),f'missing {rel}')
    return p.read_text(encoding='utf-8') if p.exists() else ''

index=text('index.html')
js=text('js/nh7-celebrations-v464.js')
css=text('css/nh7-celebrations-v464.css')
worker=text('service-worker.js')
release=text('sw-release-core-v403.js')

need("VERSION:'4.6.6-calendar-lock-finalqa'" in js,'calendar runtime version mismatch')
need('function annualEvents' in js,'annual calendar list missing')
need('function openCalendar' in js,'calendar entry point missing')
need("closeModal();setTimeout(()=>Promise.resolve(window.NH7ReaderSourceV452?.open?.(ref)).catch(()=>{}),0)" in js,
     'verse handoff must release modal/inert before opening Reader')
need("old.shell.inert=old.wasInert" in js,'closeModal must restore appShell inert state')
need("active={kind:'calendar'" in js,'calendar modal state missing')
need('nh7-calendar-dialog464' in css and 'nh7-feast-verse464.is-link' in css,'calendar/link styles missing')
need('js/nh7-celebrations-v464.js?v=4.6.6-calendar-lock-finalqa' in index,'calendar JS cache tag mismatch')
need('css/nh7-celebrations-v464.css?v=4.6.6-calendar-lock-finalqa' in index,'calendar CSS cache tag mismatch')
need('service-worker.js?v=5.3.8-calendar-lock-parity&ui=117&library=125.5' in index,'service worker URL not rotated')
need('sw-release-core-v403.js?v=5.3.8-calendar-lock-parity&ui=117&library=125.5' in worker,'worker release-core import not rotated')
need("NH7_RELEASE_CORE_VERSION='5.3.8-calendar-lock-parity'" in release,'release core version mismatch')
need("NH7_RELEASE_CORE_CACHE='nh7-release-core-v538-calendar-lock-parity-library125'" in release,'release cache name not rotated')
need("'./js/nh7-celebrations-v464.js'" in release and "'./css/nh7-celebrations-v464.css'" in release,'calendar assets missing from release cache')

if errors:
    print('Calendar lock parity verification: FAIL')
    for e in errors: print(' -',e)
    sys.exit(1)
print('Calendar lock parity verification: PASS')
print(' - annual calendar + verse handoff present')
print(' - modal inert state restored before Bible Reader navigation')
print(' - release cache/service-worker tags rotated')
