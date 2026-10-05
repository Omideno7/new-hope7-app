import json
import subprocess
import time
import urllib.request
from pathlib import Path
import websocket

PACKAGE = 'com.omideno7.newhope7.qa'
OUT = Path('out')
OUT.mkdir(exist_ok=True)

def adb(*args):
    return subprocess.check_output(['adb', *args], text=True).strip()

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

seed = {
    'nh7_sermon_note_release_upgrade_test': 'یادداشت موعظه\nخط دوم — saved before update',
    'nh7_note_school-A1': 'تکلیف مدرسه\nMy existing assignment draft',
    'nh7_bible_state_john_3_16': json.dumps({'saved': True, 'highlight': 'yellow', 'note': 'یادداشت آیه\nKeep this verse'}, ensure_ascii=False, separators=(',', ':')),
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
adb('shell', 'am', 'force-stop', PACKAGE)
adb('install', '-r', 'out/qa-candidate-25002.apk')
adb('shell', 'am', 'start', '-n', PACKAGE + '/com.omideno7.newhope7.MainActivity')
ws = connect()
candidate = ready(ws, True)
assert candidate['version'] == '2.5.0', candidate
assert candidate['origin'] == baseline['origin'], (baseline, candidate)
actual = evaluate(ws, '(() => {const data=' + json.dumps(seed, ensure_ascii=False) + ';return Object.fromEntries(Object.keys(data).map(key=>[key,localStorage.getItem(key)]));})()')
assert actual == seed, {'expected': seed, 'actual': actual}
marker = evaluate(ws, "new Promise((resolve,reject)=>{const req=indexedDB.open('nh7-upgrade-preservation-test',1);req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction('state','readonly'),get=tx.objectStore('state').get('marker');get.onsuccess=()=>{resolve(get.result);db.close()};get.onerror=()=>reject(get.error)}})")
assert marker == 'offline-user-state-preserved', marker
native = adb('shell', 'run-as', PACKAGE, 'cat', 'files/nh7-upgrade-marker.txt')
assert native == 'native-user-files-preserved', native
assert evaluate(ws, "window.NH7_AUTO_UPDATE_VERSION") == '2.5.0-native-packaged'
assert evaluate(ws, "!!window.NH7CommunityV502 && typeof window.NH7CommunityV502.renderProfile==='function' && typeof window.NH7CommunityV502.renderTestimonies==='function' && typeof window.NH7CommunityV502.renderPrayer==='function'")
workers = evaluate(ws, "navigator.serviceWorker ? navigator.serviceWorker.getRegistrations().then(x=>x.length) : 0")
assert workers == 0, workers
ws.close()
with (OUT / 'android-25002-upgrade.png').open('wb') as screenshot:
    subprocess.run(['adb', 'exec-out', 'screencap', '-p'], stdout=screenshot, check=True)
result = {'status': 'PASS', 'baseline': baseline, 'candidate': candidate, 'notes_and_assignment_draft': 'preserved', 'saved_verse_and_highlight': 'preserved', 'indexeddb_state': 'preserved', 'native_user_files': 'preserved', 'native_web_workers': workers, 'community_modules': 'loaded', 'scope': 'isolated QA package, same local origin and native dependencies as production'}
(OUT / 'upgrade-smoke.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(json.dumps(result, ensure_ascii=False))
