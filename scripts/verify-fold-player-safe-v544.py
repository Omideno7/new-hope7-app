from pathlib import Path

def need(text, needle, msg):
    if needle not in text:
        raise SystemExit('FAIL: '+msg)

def reject(text, needle, msg):
    if needle in text:
        raise SystemExit('FAIL: '+msg)

player=Path('js/nh7-media-player-v500.js').read_text()
lib=Path('js/nh7-audio-library-v500.js').read_text()
idx=Path('index.html').read_text()
sw=Path('sw-release-core-v403.js').read_text()
svc=Path('service-worker.js').read_text()

for needle in [
    '@media(min-width:600px) and (max-width:767px)',
    '@media(min-width:768px) and (max-width:1023px)',
    '@media(min-width:1024px)',
    'var(--safe-area-inset-bottom, env(safe-area-inset-bottom,0px))',
    "attr('[data-play]','aria-label',L('پخش / توقف','Play / Pause','Reproduciraj / Pauziraj'))",
    "attr('[data-back]','aria-label',L('۱۵ ثانیه عقب','Back 15 seconds','15 sekundi natrag'))",
    "attr('[data-forward]','aria-label',L('۳۰ ثانیه جلو','Forward 30 seconds','30 sekundi naprijed'))",
]: need(player,needle,'player responsive/localization contract missing: '+needle)
need(lib,'@media(min-width:600px)','audio library adaptive tablet sizing missing')
need(lib,'@media(min-width:1024px)','audio library desktop sizing missing')
reject(lib,'NEW HOPE 7 AUDIO</span>','hard-coded English hero label regression must not be forward-ported')
need(idx,'nh7-audio-library-v500.js?v=5.4.4-fold-safe&ui=123','audio library wiring mismatch')
need(idx,'nh7-media-player-v500.js?v=5.4.4-fold-safe&ui=123','media player wiring mismatch')
need(idx,'service-worker.js?v=5.4.4-fold-player-safe&ui=123&library=125.5','service worker wiring mismatch')
need(sw,"NH7_RELEASE_CORE_VERSION='5.4.4-fold-player-safe'",'release core version mismatch')
need(svc,'sw-release-core-v403.js?v=5.4.4-fold-player-safe','service worker release import mismatch')
print('Fold/Tablet player safety verification: PASS')
print(' - responsive player placement + safe-area variables present')
print(' - audio library adaptive hero sizing present')
print(' - existing FA/EN/HR player localization preserved')
print(' - hard-coded English Store regression excluded')
