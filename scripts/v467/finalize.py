from pathlib import Path
import subprocess

def change(path,old,new):
 p=Path(path);s=p.read_text();assert s.count(old)==1,(path,old[:80],s.count(old));p.write_text(s.replace(old,new,1))
# Cache isolation is local only. The authenticated server receives its real UUID.
change('js/nh7-audio-classic-v400.js',"edge({kind:'sermon',sermon_id:id})","edge({kind:'sermon',sermon_id:mediaId(item)})")
change('js/nh7-sermon-list-detail-v445.js',"  row.querySelector('strong').textContent=title;","  const heading=row.querySelector('strong');if(heading.textContent!==title)heading.textContent=title;")
change('js/nh7-sermon-list-detail-v445.js',"    small.textContent=meta||L('برای باز کردن موعظه لمس کنید','Tap to open sermon','Dodirnite za otvaranje');","    const label=meta||L('برای باز کردن موعظه لمس کنید','Tap to open sermon','Dodirnite za otvaranje');if(small.textContent!==label)small.textContent=label;")
change('js/app.js',"      snapshot={progress:Array.isArray(progress)?progress:[],assignments:Array.isArray(assignments)?assignments:[]};","      if(!Array.isArray(progress)||!Array.isArray(assignments))throw new Error('invalid_school_snapshot');\n      snapshot={progress,assignments};")
# A stalled device/IndexedDB lookup must not hang otherwise available streaming.
change('js/nh7-audio-classic-v400.js','async function playItem(item){',"async function availableLocalUrl(item){let timer;try{return await Promise.race([localUrl(item),new Promise(resolve=>{timer=setTimeout(()=>resolve(''),3500)})])}finally{clearTimeout(timer)}}\nasync function playItem(item){")
change('js/nh7-audio-classic-v400.js',"const local=failedLocal.has(id)?'':await localUrl(item);","const local=failedLocal.has(id)?'':await availableLocalUrl(item);")
change('js/nh7-audio-classic-v400.js','    localUrl(item).then(local=>local||signedUrl(item))','    availableLocalUrl(item).then(local=>local||signedUrl(item))')
# Do not record the previous listener's lesson on a newly switched account.
change('js/nh7-audio-classic-v400.js',"async function rpc(name,body){const token=await accessToken();if(!token)throw new Error('login_required');","async function rpc(name,body,expectedOwner=accountEmail()){const token=await accessToken();if(!token||expectedOwner!==accountEmail()||localStorage.getItem('nh7_explicit_logout')==='1')throw new Error('login_required');")
change('js/nh7-audio-classic-v400.js',"const tracked=current,trackedSession=sessionId,delta=Math.floor(listenedPending);","const tracked=current,trackedSession=sessionId,trackedOwner=playingOwner,delta=Math.floor(listenedPending);if(trackedOwner!==accountEmail())return;")
change('js/nh7-audio-classic-v400.js',"p_delta_seconds:delta,p_ended:!!ended});","p_delta_seconds:delta,p_ended:!!ended},trackedOwner);")
change('js/nh7-audio-classic-v400.js',"p_user_email:accountEmail(),p_media_type:isSchool(tracked)","p_user_email:trackedOwner,p_media_type:isSchool(tracked)")
change('js/nh7-audio-classic-v400.js',"p_seek_count:0,p_started_position_seconds:0}).catch(()=>{});","p_seek_count:0,p_started_position_seconds:0},trackedOwner).catch(()=>{});")
change('index.html','js/nh7-sermon-list-detail-v445.js?v=4.4.6','js/nh7-sermon-list-detail-v445.js?v=4.6.7')
p=Path('sw-release-core-v403.js');s=p.read_text();i=s.index(']);',s.index('const NH7_READER_RELEASE_PATHS_V452'));s=s[:i]+', "js/nh7-sermon-list-detail-v445.js"'+s[i:];p.write_text(s)

p=Path('scripts/v467/qa.py');s=p.read_text()
a="  if(u.pathname==='/functions/v1/nh7-school-media-access'){"
b=a+"\n   if(body.kind==='sermon'&&!/^[0-9a-f-]{36}$/i.test(body.sermon_id||''))return new Response(JSON.stringify({code:'invalid_sermon'}),{status:400});"
assert s.count(a)==1;s=s.replace(a,b)
# A Playwright evaluate fixture installer must not return the mock function.
for a,b in [
 ('p.evaluate("window.fetch=()=>new Promise(()=>{})")','p.evaluate("()=>{window.fetch=()=>new Promise(()=>{});}")'),
 ('p.evaluate("window.n=0;window.fetch=async()=>{n++;throw new TypeError(\'Load failed\')}")','p.evaluate("()=>{window.n=0;window.fetch=async()=>{n++;throw new TypeError(\'Load failed\')};}")')
]:
 assert s.count(a)==1,a;s=s.replace(a,b)
# Explicitly reject test IndexedDB errors instead of leaving its promise pending.
a=s.index('  def download_kept():');b=s.index('  browser.close()',a)
s=s[:a]+r'''  def download_kept():
   ctx,p,err=page();card(p)
   # A deliberately invalid in-memory recording exercises the error path.
   # This is a synthetic fixture, never real downloaded content.
   p.evaluate("""()=>new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('fixture_idb_write_timeout')),4000);
    const fail=e=>{clearTimeout(timer);reject(Error('fixture_idb_write_failed: '+String(e?.target?.error||e)))};
    const q=indexedDB.open('nh7-offline-audio-v397',1);
    q.onerror=q.onblocked=fail;q.onupgradeneeded=()=>q.result.createObjectStore('media',{keyPath:'id'});
    q.onsuccess=()=>{const d=q.result;try{const t=d.transaction('media','readwrite');t.onerror=t.onabort=fail;t.oncomplete=()=>{d.close();clearTimeout(timer);resolve(true)};t.objectStore('media').put({id:'school-class_01_new_creation',blob:new Blob(['synthetic invalid audio'],{type:'audio/mpeg'})})}catch(e){d.close();fail(e)}};
   })""")
   script(p,'js/nh7-audio-classic-v400.js');p.wait_for_timeout(450);p.locator('[data-classic-toggle]').click();p.wait_for_timeout(150)
   p.evaluate("Array.from(document.querySelectorAll('audio')).find(a=>a.src)?.dispatchEvent(new Event('error'))")
   keep=p.evaluate("""()=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('fixture_idb_read_timeout')),4000),q=indexedDB.open('nh7-offline-audio-v397',1);q.onerror=q.onblocked=e=>{clearTimeout(timer);reject(Error('fixture_idb_read_failed'))};q.onsuccess=()=>{const d=q.result,r=d.transaction('media').objectStore('media').get('school-class_01_new_creation');r.onerror=()=>{d.close();clearTimeout(timer);reject(Error('fixture_get_failed'))};r.onsuccess=()=>{resolve(!!r.result?.blob);clearTimeout(timer);d.close()}}})""");assert keep;protect(p);assert not err,err;ctx.close()
  run(engine+': playback error leaves offline audio and metadata intact',download_kept)
  def stalled_local_lookup():
   ctx,p,err=page();card(p)
   p.evaluate("()=>{Object.defineProperty(window,'indexedDB',{configurable:true,value:{open(){return {}}}});}")
   script(p,'js/nh7-audio-classic-v400.js')
   p.wait_for_function("document.querySelector('[data-classic-status]')?.className==='is-ok'",timeout=6500)
   assert p.evaluate("calls.filter(x=>x.path.includes('nh7-school-media-access')).length")==1
   protect(p);assert not err,err;ctx.close()
  run(engine+': stalled offline lookup falls back without deleting the saved download',stalled_local_lookup)
  def wrapper_integration():
   ctx,p,err=page();id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';card(p,id)
   for file in ['js/nh7-security-core-v340.js','js/nh7-audio-route-stability-v423.js','js/nh7-offline-playback-bridge-v332.js','js/nh7-audio-classic-v400.js','js/nh7-sermon-list-detail-v445.js']:
    script(p,file)
   p.wait_for_timeout(750)
   p.evaluate("window.mutations=0;new MutationObserver(r=>mutations+=r.length).observe(document.getElementById('view'),{childList:true,subtree:true})")
   p.wait_for_timeout(450);assert p.evaluate('mutations')<8,p.evaluate('mutations')
   p.locator('.nh7-audio-row-v445').click();p.locator('[data-sermon-play]').click()
   p.wait_for_function("Array.from(document.querySelectorAll('audio')).some(a=>!a.paused&&a.currentTime>0)")
   requests=p.evaluate("calls.filter(x=>x.path.includes('nh7-school-media-access'))")
   assert len(requests)==1 and requests[0]['body']['sermon_id']==id,requests
   p.locator('[data-classic-toggle]').click();p.wait_for_timeout(200)
   p.evaluate('mutations=0');p.wait_for_timeout(450);assert p.evaluate('mutations')<8
   protect(p);assert not err,err;ctx.close()
  run(engine+': full security/catalogue/player wrapper stack and stable sermon DOM',wrapper_integration)
'''+s[b:]
p.write_text(s)
for path in ['js/app.js','js/nh7-audio-classic-v400.js','js/nh7-sermon-list-detail-v445.js','sw-release-core-v403.js']:
 subprocess.run(['node','--check',path],check=True)
print('Finalized ten runtime files; backend identifiers, gates, accepted student work preserved.')
