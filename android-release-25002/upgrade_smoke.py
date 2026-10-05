import json
import subprocess
import time
import urllib.request
from pathlib import Path
import websocket
import atexit

PACKAGE = 'com.omideno7.newhope7.qa'
OUT = Path('out')
OUT.mkdir(exist_ok=True)

def adb(*args):
    return subprocess.check_output(['adb', *args], text=True).strip()

def capture_diagnostics():
    try:
        lines = adb('logcat', '-d').splitlines()
        relevant = [line for line in lines if any(word in line for word in ['Capacitor', 'chromium', 'WebView', 'OneSignal', 'FATAL EXCEPTION'])]
        (OUT / 'android-webview-logcat.txt').write_text('\n'.join(relevant))
        print('Native/WebView diagnostic tail:\n' + '\n'.join(relevant[-35:]))
    except Exception as error:
        print('Diagnostic capture failed: ' + str(error))

atexit.register(capture_diagnostics)

def connect():
    deadline = time.time() + 100
    last_error = None
    while time.time() < deadline:
        try:
            sockets = adb('shell', 'cat', '/proc/net/unix').splitlines()
            names = [line.split()[-1].lstrip('@') for line in sockets if 'webview_devtools_remote' in line]
            for name in reversed(names):
                adb('forward', 'tcp:9222', 'localabstract:' + name)
                with urllib.request.urlopen('http://127.0.0.1:9222/json/list', timeout=5) as response:
                    targets = json.load(response)
                for target in targets:
                    if target.get('type') == 'page' and 'localhost' in target.get('url', ''):
                        return websocket.create_connection(target['webSocketDebuggerUrl'], timeout=20, suppress_origin=True)
        except Exception as error:
            last_error = str(error)
        time.sleep(2)
    raise RuntimeError('WebView debug page unavailable: ' + str(last_error))

sequence = 0
def evaluate(ws, expression):
    global sequence
    sequence += 1
    ws.send(json.dumps({'id': sequence, 'method': 'Runtime.evaluate', 'params': {'expression': expression, 'returnByValue': True, 'awaitPromise': True}}))
    while True:
        response = json.loads(ws.recv())
        if response.get('id') != sequence:
            continue
        if 'error' in response or response.get('result', {}).get('exceptionDetails'):
            raise RuntimeError(json.dumps(response))
        return response['result']['result'].get('value')

def ready(ws, candidate=False):
    for _ in range(50):
        state = evaluate(ws, "({version:window.NH7_VERSION,origin:location.origin,body:document.querySelector('#view')?.textContent?.length||0,community:!!window.NH7CommunityV502})")
        if state and state['body'] > 30 and (not candidate or state['community']):
            return state
        time.sleep(2)
    raise RuntimeError('App did not render: ' + json.dumps(state))

def install_scroll_probe(ws):
    return evaluate(ws, """(() => {
      document.getElementById('nh7ScrollProbe')?.remove();
      const probe=document.createElement('div');
      probe.id='nh7ScrollProbe';
      probe.setAttribute('aria-hidden','true');
      probe.style.cssText='display:block;width:1px;height:2400px;min-height:2400px;pointer-events:none;opacity:0';
      (document.querySelector('#view')||document.body).appendChild(probe);
      window.scrollTo(0,0);
      return true;
    })()""")

def scroll_snapshot(ws):
    return evaluate(ws, """(() => {
      const s=document.scrollingElement||document.documentElement;
      const hs=getComputedStyle(document.documentElement);
      const bs=getComputedStyle(document.body);
      const view=document.querySelector('#view');
      const vs=view?getComputedStyle(view):null;
      const stack=document.elementsFromPoint(Math.round(innerWidth/2),Math.round(innerHeight/2)).slice(0,10).map(el=>{
        const cs=getComputedStyle(el);
        return {tag:el.tagName,id:el.id||'',cls:typeof el.className==='string'?el.className:'',display:cs.display,visibility:cs.visibility,position:cs.position,pointerEvents:cs.pointerEvents,zIndex:cs.zIndex,touchAction:cs.touchAction,overflowY:cs.overflowY};
      });
      return {
        width:innerWidth,height:innerHeight,dpr:devicePixelRatio,
        scrollY:window.scrollY,scrollTop:s.scrollTop,
        scrollHeight:s.scrollHeight,clientHeight:s.clientHeight,
        maxScroll:Math.max(0,s.scrollHeight-innerHeight),
        html:{className:document.documentElement.className,overflowX:hs.overflowX,overflowY:hs.overflowY,position:hs.position,touchAction:hs.touchAction,height:hs.height,minHeight:hs.minHeight},
        body:{className:document.body.className,overflowX:bs.overflowX,overflowY:bs.overflowY,position:bs.position,touchAction:bs.touchAction,height:bs.height,minHeight:bs.minHeight},
        view:view?{className:view.className,overflowY:vs.overflowY,position:vs.position,scrollHeight:view.scrollHeight,clientHeight:view.clientHeight}:null,
        centerStack:stack
      };
    })()""")

def verify_touch_scroll(ws, label, swipe):
    install_scroll_probe(ws)
    time.sleep(.25)
    before=scroll_snapshot(ws)
    assert before['maxScroll'] > 900, {'stage': label+' scroll range', 'snapshot': before}
    evaluate(ws, 'window.scrollTo(0,420); true')
    time.sleep(.35)
    programmed=scroll_snapshot(ws)
    assert max(programmed['scrollY'],programmed['scrollTop']) > 150, {'stage': label+' programmatic scroll', 'before': before, 'after': programmed}
    evaluate(ws, 'window.scrollTo(0,0); true')
    time.sleep(.25)
    adb('shell','input','swipe',*[str(x) for x in swipe])
    time.sleep(1)
    swiped=scroll_snapshot(ws)
    result={'label':label,'before':before,'programmatic':programmed,'after_swipe':swiped}
    print('SCROLL_DIAGNOSTIC '+label+': '+json.dumps(result, ensure_ascii=False))
    assert max(swiped['scrollY'],swiped['scrollTop']) > 80, {'stage': label+' real touch swipe', 'diagnostic': result}
    evaluate(ws, "document.getElementById('nh7ScrollProbe')?.remove(); window.scrollTo(0,0); true")
    return result

seed = {
    'nh7_sermon_note_release_upgrade_test': 'یادداشت موعظه\nخط دوم — saved before update',
    'nh7_note_school-A1': 'تکلیف مدرسه\nMy existing assignment draft',
    'nh7_bible_state_john_3_16': json.dumps({'saved': True, 'highlight': True, 'highlightColor': 'yellow', 'note': 'یادداشت آیه\nKeep this verse'}, ensure_ascii=False, separators=(',', ':')),
    'nh7_lang': 'en',
}
adb('install', '-r', 'out/qa-baseline-24001.apk')
adb('shell', 'am', 'start', '-n', PACKAGE + '/com.omideno7.newhope7.MainActivity')
ws = connect()
baseline = ready(ws)
assert baseline['origin'] == 'https://localhost', baseline
evaluate(ws, '(() => {const data=' + json.dumps(seed, ensure_ascii=False) + ';for(const [key,value] of Object.entries(data))localStorage.setItem(key,value);return true;})()')
assert evaluate(ws, "new Promise((resolve,reject)=>{const req=indexedDB.open('nh7-upgrade-preservation-test',1);req.onupgradeneeded=()=>req.result.createObjectStore('state');req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put('offline-user-state-preserved','marker');tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>reject(tx.error)}})")
ws.close()
adb('shell', f"run-as {PACKAGE} sh -c 'mkdir -p files; echo native-user-files-preserved > files/nh7-upgrade-marker.txt'")
# WebView commits localStorage to disk asynchronously. Simulate leaving the app
# normally, then verify the seeded data survives a real cold restart before
# upgrading. This separates persistent user data from transient renderer state.
adb('shell', 'input', 'keyevent', 'KEYCODE_HOME')
time.sleep(3)
adb('shell', 'am', 'force-stop', PACKAGE)
adb('shell', 'am', 'start', '-n', PACKAGE + '/com.omideno7.newhope7.MainActivity')
ws = connect()
baseline_cold = ready(ws)
cold_data = evaluate(ws, '(() => {const data=' + json.dumps(seed, ensure_ascii=False) + ';return Object.fromEntries(Object.keys(data).map(key=>[key,localStorage.getItem(key)]));})()')
assert cold_data == seed, {'stage': 'baseline cold restart before upgrade', 'expected': seed, 'actual': cold_data}
ws.close()
adb('shell', 'input', 'keyevent', 'KEYCODE_HOME')
time.sleep(2)
adb('shell', 'am', 'force-stop', PACKAGE)
adb('install', '-r', 'out/qa-candidate-25002.apk')
adb('shell', 'am', 'start', '-n', PACKAGE + '/com.omideno7.newhope7.MainActivity')
ws = connect()
candidate = ready(ws, True)
print('Candidate runtime: ' + json.dumps(evaluate(ws, "({userAgent:navigator.userAgent,capacitorType:typeof window.Capacitor,capacitorKeys:Object.keys(window.Capacitor||{}),nativeBridge:typeof window.androidBridge,cordova:typeof window.cordova})")))
assert candidate['version'] == '2.5.0', candidate
assert candidate['origin'] == baseline['origin'], (baseline, candidate)
actual = evaluate(ws, '(() => {const data=' + json.dumps(seed, ensure_ascii=False) + ';return Object.fromEntries(Object.keys(data).map(key=>[key,localStorage.getItem(key)]));})()')
assert actual == seed, {'expected': seed, 'actual': actual}
notes = evaluate(ws, "window.NH7MyNotesV234.collectNotes().map(x=>({key:x.storageKey,text:x.text}))")
expected_notes = {key: value for key, value in seed.items() if key.startswith('nh7_sermon_note_') or key.startswith('nh7_note_')}
expected_notes['nh7_bible_state_john_3_16'] = json.loads(seed['nh7_bible_state_john_3_16'])['note']
collected = {row['key']: row['text'] for row in notes}
assert all(collected.get(key) == value for key, value in expected_notes.items()), notes
marker = evaluate(ws, "new Promise((resolve,reject)=>{const req=indexedDB.open('nh7-upgrade-preservation-test',1);req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction('state','readonly'),get=tx.objectStore('state').get('marker');get.onsuccess=()=>{resolve(get.result);db.close()};get.onerror=()=>reject(get.error)}})")
assert marker == 'offline-user-state-preserved', marker
native = adb('shell', 'run-as', PACKAGE, 'cat', 'files/nh7-upgrade-marker.txt')
assert native == 'native-user-files-preserved', native
updater = evaluate(ws, "({version:window.NH7_AUTO_UPDATE_VERSION,platform:window.Capacitor?.getPlatform?.(),native:window.Capacitor?.isNativePlatform?.(),script:[...document.scripts].find(x=>x.src.includes('nh7-auto-update-v335'))?.src})")
assert updater.get('version') == '2.5.0-native-packaged', updater
assert updater.get('native') is True and updater.get('platform') == 'android', updater
native_file = evaluate(ws, "window.Capacitor.Plugins.Filesystem.readFile({directory:'DATA',path:'nh7-upgrade-marker.txt',encoding:'utf8'}).then(x=>x.data.trim())")
assert native_file == 'native-user-files-preserved', native_file
push = evaluate(ws, "({cordova:!!window.cordova,oneSignal:!!window.plugins?.OneSignal,initialized:!!window.plugins?.OneSignal?.initialize})")
assert push['cordova'] and push['oneSignal'] and push['initialized'], push
assert evaluate(ws, "!!window.NH7CommunityV502 && typeof window.NH7CommunityV502.renderProfile==='function' && typeof window.NH7CommunityV502.renderTestimonies==='function' && typeof window.NH7CommunityV502.renderPrayer==='function'")
workers = evaluate(ws, "navigator.serviceWorker ? navigator.serviceWorker.getRegistrations().then(x=>x.length) : 0")
assert workers == 0, workers
compat = evaluate(ws, "({hasOwn:Object.hasOwn({a:1},'a'),negativeArrayIndex:[1,2].at(-1),replaceChildren:typeof Element.prototype.replaceChildren})")
assert compat == {'hasOwn': True, 'negativeArrayIndex': 2, 'replaceChildren': 'function'}, compat

# Real Android gesture verification. The previous smoke only checked rendering,
# so a page could pass CI while touch scrolling was completely blocked.
phone_scroll = verify_touch_scroll(ws, 'phone', (540, 1500, 540, 550, 650))
ws.close()

# Emulate an unfolded/foldable CSS viewport (>600px at 420dpi) so the tablet
# breakpoint used by Samsung foldables is exercised by a real Android swipe.
adb('shell', 'am', 'force-stop', PACKAGE)
adb('shell', 'wm', 'size', '1840x2208')
adb('shell', 'wm', 'density', '420')
time.sleep(1)
adb('shell', 'am', 'start', '-n', PACKAGE + '/com.omideno7.newhope7.MainActivity')
ws = connect()
fold_candidate = ready(ws, True)
fold_scroll = verify_touch_scroll(ws, 'fold', (920, 1750, 920, 600, 700))
ws.close()
adb('shell', 'am', 'force-stop', PACKAGE)
adb('shell', 'wm', 'size', 'reset')
adb('shell', 'wm', 'density', 'reset')

with (OUT / 'android-25002-upgrade.png').open('wb') as screenshot:
    subprocess.run(['adb', 'exec-out', 'screencap', '-p'], stdout=screenshot, check=True)
result = {'status': 'PASS', 'baseline': baseline, 'baseline_cold_restart': 'PASS', 'candidate': candidate, 'fold_candidate': fold_candidate, 'notes_and_assignment_draft': 'preserved and readable by My Notes', 'saved_verse_and_highlight': 'preserved', 'indexeddb_state': 'preserved', 'native_user_files': 'preserved', 'native_bridge': 'android, connected', 'native_filesystem_call': 'PASS', 'native_push_plugin': push, 'native_web_workers': workers, 'community_modules': 'loaded', 'older_webview_compatibility': compat, 'phone_touch_scroll': phone_scroll, 'fold_touch_scroll': fold_scroll, 'scope': 'isolated QA package, same local origin and native dependencies as production'}
(OUT / 'upgrade-smoke.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(json.dumps(result, ensure_ascii=False))
