#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
err=[]
def need(ok,msg):
 if not ok: err.append(msg)
def rd(p): return (root/p).read_text(encoding='utf-8')
idx=rd('index.html'); js=rd('js/nh7-spiritual-plans-v412.js'); css=rd('css/nh7-spiritual-plans-v240.css'); sw=rd('service-worker.js'); core=rd('sw-release-core-v403.js')
need('background:var(--nh7-studio-card,var(--card,#fff));color:var(--nh7-studio-verse,var(--ink,#16364c))' in js,'inline verse runtime does not follow active Studio theme')
for token in [
 'html[data-nh7-studio] #view .nh7-plans-tabs',
 'html[data-nh7-studio] #view .nh7-plans-hero',
 'var(--nh7-studio-card)!important',
 'var(--nh7-studio-text)!important',
 'var(--nh7-studio-muted)!important',
 'var(--nh7-studio-accent)!important',
 '.nh7-scripture-reveal .inline-verse',
 'html[data-nh7-studio-tone457="dark"]']:
 need(token in css,f'missing Plans theme contract: {token}')
need('css/nh7-spiritual-plans-v240.css?v=5.3.4-theme' in idx,'Plans CSS cache tag mismatch')
need('js/nh7-spiritual-plans-v412.js?v=5.3.4-theme' in idx,'Plans JS cache tag mismatch')
need('service-worker.js?v=' in idx,'service worker registration missing')
need('sw-release-core-v403.js?v=' in sw,'release core import missing')
for asset in ["'./js/nh7-spiritual-plans-v412.js'","'./css/nh7-spiritual-plans-v240.css'"]:
 need(asset in core,f'Plans offline asset missing: {asset}')
if err:
 print('Plans theme parity verification: FAIL')
 for e in err: print(' -',e)
 sys.exit(1)
print('Plans theme parity verification: PASS')
print(' - Spiritual/Fasting Plans cards, text, controls, progress and revealed verses follow Studio palette')
print(' - dark themes inherit readable themed verse colors')
