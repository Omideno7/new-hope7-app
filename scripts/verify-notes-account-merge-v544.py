#!/usr/bin/env python3
from pathlib import Path
import sys
root=Path(__file__).resolve().parents[1]
errs=[]
def need(ok,msg):
    if not ok: errs.append(msg)
def read(p): return (root/p).read_text(encoding='utf-8')
app=read('js/app.js'); note=read('js/nh7-note-text-v501.js'); my=read('js/nh7-my-notes-v234.js'); idx=read('index.html'); sw=read('service-worker.js'); core=read('sw-release-core-v403.js')

# Canonical repair must combine Store wrapped-value repair with current Web whitespace/visible repair.
need("VERSION='5.0.4-web-account-merge'" in note,'note repair version missing')
need('function unwrap(value)' in note and 'let s=unwrap(value)' in note,'wrapped-value note repair missing')
for token in [".replace(/%09/gi,'\\t')", ".replace(/\\\\t/g,'\\t')", 'function repairVisibleNotes', 'MutationObserver(scheduleVisibleRepair)']:
    need(token in note,f'current Web repair regressed: {token}')
need('NH7NoteTextV501={VERSION,unwrap,normalize,repairKnownNotes,repairVisibleNotes}' in note,'note repair API mismatch')

# Account restore must be additive/non-destructive.
need('function nh7UnwrapCloudValueV544' in app,'cloud unwrap helper missing')
need("const marker='nh7_account_cloud_restore_v544_'+email" in app,'restore marker not versioned')
need('nh7_account_verse_marks_v230?select=verse_key,verse_ref,saved,highlight_color,note,updated_at' in app,'verse marks restore missing')
need('function nh7MergeBibleStateV544' in app,'Bible state merge missing')
need('const merged=Object.assign({},incoming,local)' in app,'local Bible state must win field conflicts')
need("if(!String(local.note||'').trim()&&String(incoming.note||'').trim())merged.note=incoming.note" in app,'local Bible note preservation guard missing')
need('else if(localStorage.getItem(key)===null)restoreAccountProgressValue(key,row.value)' in app,'non-Bible progress must only fill missing local state')
need("if(incoming&&!String(local).trim())localStorage.setItem(key,String(incoming))" in app,'account notes must only fill empty local text')
need("window.dispatchEvent(new CustomEvent('nh7-account-data-restored-v544'))" in app,'restore completion event missing')
need('window.NH7BibleBatchV230?.syncPayload?.({batch_id:' in app,'single verse note account sync missing')
need("window.addEventListener('nh7-account-data-restored-v544',scheduleRender)" in my,'My Notes restore rerender missing')

# Simple behavioral model of merge policy: local canonical note survives; missing fields can fill from cloud.
def merge_bible(local,incoming):
    merged={**incoming,**local}
    if not str(local.get('note','')).strip() and str(incoming.get('note','')).strip(): merged['note']=incoming['note']
    if local.get('saved') is not True and incoming.get('saved') is True: merged['saved']=True
    if not local.get('highlight') and incoming.get('highlight'):
        merged['highlight']=True; merged['highlightColor']=incoming.get('highlightColor') or merged.get('highlightColor') or 'yellow'
    return merged
m=merge_bible({'note':'LOCAL NOTE','saved':False,'highlight':False},{'note':'CLOUD NOTE','saved':True,'highlight':True,'highlightColor':'blue'})
need(m.get('note')=='LOCAL NOTE','behavior: cloud overwrote local note')
need(m.get('saved') is True and m.get('highlight') is True and m.get('highlightColor')=='blue','behavior: missing cloud verse flags were not merged')

for token in [
 'js/nh7-note-text-v501.js?v=5.0.4-web-account-merge',
 'js/nh7-my-notes-v234.js?v=5.4.4-account-merge-web',
 'notesmerge=544']:
    need(token in idx,f'index Notes tag missing: {token}')
need('service-worker.js?v=' in idx,'service worker registration missing')
need('sw-release-core-v403.js?v=' in sw,'release core import missing')
for asset in ["'./js/nh7-note-text-v501.js'","'./js/nh7-my-notes-v234.js'","'./js/app.js'"]:
    need(asset in core,f'offline cache missing {asset}')

if errs:
    print('Notes account-merge verification: FAIL')
    for e in errs: print(' -',e)
    sys.exit(1)
print('Notes account-merge verification: PASS')
print(' - any existing local note text wins over cloud restore; cloud only fills empty notes')
print(' - Bible note/saved/highlight state merges additively across devices')
print(' - wrapped legacy note repair is combined with current Web whitespace repair')
