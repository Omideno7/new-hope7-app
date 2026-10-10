#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
err=[]
def need(ok,msg):
 if not ok: err.append(msg)
def rd(p): return (root/p).read_text(encoding='utf-8')
idx=rd('index.html'); ap=rd('css/nh7-appearance-personalization-v514.css'); base=rd('css/nh7-appearance-v427.css'); sw=rd('service-worker.js'); core=rd('sw-release-core-v403.js')
# Requested visual separation: Outline = layered frame/depth, Neon = luminous floating glow.
for token in [
 'html[data-nh7-ui-style514="outline"] #view',
 '4px 5px 0 color-mix',
 'html[data-nh7-ui-style514="neon"] #view',
 '0 0 30px color-mix',
 '.nh7-ap514-style[data-style="outline"] .nh7-ap514-style-demo',
 '.nh7-ap514-style[data-style="neon"] .nh7-ap514-style-demo']:
 need(token in ap,f'Appearance depth contract missing: {token}')
# Dark mode revealed verses must remain readable independently of Studio theme.
need('html[data-nh7-theme="dark"] #view .inline-verse,' in base,'dark mode inline verse surface missing')
need('color:var(--nh7-dark-ink,#f5f9ff)!important' in base,'dark mode inline verse text color missing')
# CSS-only forward-port: keep current localized JS stack untouched.
need('js/nh7-appearance-personalization-v514.js?v=5.2.0' in idx,'current Appearance JS should remain on Web v5.2.0')
need('js/nh7-appearance-i18n-v515.js?v=5.1.5' in idx,'current Web Appearance i18n overlay must remain loaded')
need('css/nh7-appearance-v427.css?v=4.4.8-dark-verse' in idx,'base Appearance CSS tag mismatch')
need('css/nh7-appearance-personalization-v514.css?v=5.2.1-depth' in idx,'personalization CSS tag mismatch')
need('service-worker.js?v=' in idx,'service worker registration missing')
need('sw-release-core-v403.js?v=' in sw,'release core import missing')
for asset in ["'./css/nh7-appearance-v427.css'","'./css/nh7-appearance-personalization-v514.css'","'./js/nh7-appearance-personalization-v514.js'","'./js/nh7-appearance-i18n-v515.js'"]:
 need(asset in core,f'Appearance offline asset missing: {asset}')
if err:
 print('Appearance CSS parity verification: FAIL')
 for e in err: print(' -',e)
 sys.exit(1)
print('Appearance CSS parity verification: PASS')
print(' - Outline Clean and Neon Edge are visually distinct with separate depth models')
print(' - revealed verses remain readable in base dark mode')
print(' - current Web localization JS is preserved; Store JS regressions are excluded')
