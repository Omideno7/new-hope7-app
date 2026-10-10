#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
err=[]
def need(ok,msg):
 if not ok: err.append(msg)
def rd(p): return (root/p).read_text(encoding='utf-8')
idx=rd('index.html'); js=rd('js/nh7-audio-classic-v484.js'); sw=rd('service-worker.js'); core=rd('sw-release-core-v403.js')
need("window.NH7_AUDIO_CLASSIC_VERSION='4.8.6'" in js,'audio classic v4.8.6 marker missing')
# Refresh must preserve existing session/user fields instead of replacing the session object.
need("session=Object.assign({},session,data,{user:data.user||session.user})" in js,'refresh-token session preservation missing')
# Signed URL cache must be account-scoped and reject session switches mid-request.
need("const id=mediaId(item),owner=accountEmail(),key=owner+'|'+id" in js,'signed URL cache is not account-scoped')
need("if(owner!==accountEmail())throw Object.assign(new Error('session_changed')" in js,'session-change race guard missing')
# Playback selection race protection.
need('let audio=null,current=null,currentPanel=null,patchTimer=0,prewarmBusy=false,nowPlayingBar=null,playQueue=[],queueIndex=-1,queueBusy=false,volumeControlSupported=null,selection=0' in js,'playback selection counter missing')
need('const request=++selection' in js,'play request sequencing missing')
need(js.count('if(request!==selection)return false')>=2,'stale playback request cancellation missing')
# Broken downloaded file must not be silently deleted; retry may use network while online.
need('const failedLocal=new Set()' in js,'failed offline-copy registry missing')
need('failedLocal.add(id)' in js,'failed local playback is not remembered')
need('فایل پاک نشده است' in js and 'file was not deleted' in js,'offline file preservation message missing')
need('const local=(storedLocal&&(!failedLocal.has(mediaId(item))||!navigator.onLine))?storedLocal:\'\'' in js,'network fallback after local playback failure missing')
need('failedLocal.delete(mediaId(item));updateDownloadButtons' in js,'successful re-download does not clear failed-local state')
# Cost guard: retired School listening telemetry must stay retired.
need('function scheduleTracking(){return false}' in js,'retired tracking scheduler was re-enabled')
need('School listening telemetry retired. Playback and local resume remain unchanged.' in js and 'async function flushTracking' in js and 'return false;' in js,'retired tracking flush guard missing')
# Existing localization remains multilingual in engine errors/statuses.
need("L('جلسه ورود منقضی شده است؛ دوباره وارد حساب شوید.','Your sign-in session expired; sign in again.','Sesija je istekla; ponovno se prijavite.')" in js,'FA/EN/HR session error localization regressed')
need('js/nh7-audio-classic-v484.js?v=4.8.6-safe-playback' in idx,'audio classic cache tag mismatch')
need('service-worker.js?v=5.4.3-push-bind364&ui=122&library=125.5' in idx,'service worker tag mismatch')
need('sw-release-core-v403.js?v=5.4.3-push-bind364&ui=122&library=125.5' in sw,'release core import mismatch')
need("NH7_RELEASE_CORE_VERSION='5.4.3-push-bind364'" in core,'release core version mismatch')
need("'./js/nh7-audio-classic-v484.js'" in core,'audio engine missing from offline release cache')
if err:
 print('Audio playback safety verification: FAIL')
 for e in err: print(' -',e)
 sys.exit(1)
print('Audio playback safety verification: PASS')
print(' - signed media URLs are scoped to the active account and session-switch races are rejected')
print(' - stale Play requests cannot replace a newer selection')
print(' - failed offline copies are preserved and can fall back to network while online')
print(' - retired listening telemetry remains disabled')
