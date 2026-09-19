from pathlib import Path
import subprocess,re
BASE='44dfd189832c4a6031562851765811f941e0efe4'
def replace(s,a,b):
 assert s.count(a)==1,(a[:100],s.count(a));return s.replace(a,b,1)
def between(s,a,b,new):
 start=s.index(a);end=s.index(b,start);return s[:start]+new+s[end:]
Path('js/nh7-session-v467.js').write_text(Path('scripts/v467/session-runtime.js').read_text())
p=Path('js/nh7-school-media-session-v262.js')
p.write_text('''/* New Hope 7 — use the shared, account-safe refresh coordinator. */
(()=>{'use strict';
const refresh=(force=false)=>window.NH7_SESSION_V467?.refresh(force)||Promise.resolve(null);
window.NH7_SCHOOL_MEDIA_REFRESH=refresh;
const check=()=>{if(!document.hidden&&navigator.onLine)refresh(false).catch(()=>{})};
document.addEventListener('visibilitychange',check);window.addEventListener('online',check);
setInterval(check,8*60*1000);setTimeout(check,250);
})();
''')
p=Path('js/app.js');s=p.read_text()
s=between(s,'async function refreshUserSession(){','function authEmail()', '''async function refreshUserSession(){
  // A transient network error must never erase the user's saved sign-in.
  return await window.NH7_SESSION_V467?.refresh(true)||null;
}
''')
s=replace(s,"if(!navigator.onLine||message==='failed to fetch')","if(!navigator.onLine||/failed to fetch|load failed|network_error|request_timeout/.test(message))")
s=replace(s,"const r=await fetch(SUPABASE_CONFIG.url+'/auth/v1/'+path,Object.assign({},options,{headers}));","const r=await (window.NH7_SESSION_V467?.request||fetch)(SUPABASE_CONFIG.url+'/auth/v1/'+path,Object.assign({},options,{headers}));")
s=replace(s,"  const fallback=await jfetch('data/school/school_content.json');","  // The public placeholder is optional; its failure must not block real lessons.\n  const fallback=await (window.NH7_SESSION_V467?.request||fetch)('data/school/school_content.json',{cache:'no-cache'},{timeoutMs:4000}).then(r=>{if(!r.ok)throw Error('placeholder_unavailable');return r.json()}).catch(()=>({meta:{protectedContent:true},lessons:[]}));")
s=replace(s,"  }catch(e){console.warn('school cloud fallback',e)}\n  return fallback;","  }catch(e){console.warn('school cloud fallback',e);if(!baseLessons.length)throw e}\n  if(!baseLessons.length)throw Object.assign(new Error('school_content_unavailable'),{code:'school_content_unavailable'});\n  return fallback;")
start=s.index('async function cloudFetch(');end=s.index('\nasync function cloudRpc',start);block=s[start:end]
block=replace(block,"  let res=await fetch(","  const transport=window.NH7_SESSION_V467?.request||fetch;\n  const readOnly=['GET','HEAD'].includes(String(options.method||'GET').toUpperCase())||/^rpc\\/(nh7_registration_access_v2|nh7_registration_status)$/.test(path);\n  const send=()=>transport(SUPABASE_CONFIG.url + '/rest/v1/' + path, Object.assign({}, options, {headers:makeHeaders()}),{retryRead:readOnly});\n  let res=await fetch(")
block=block.replace("fetch(SUPABASE_CONFIG.url + '/rest/v1/' + path, Object.assign({}, options, {headers:makeHeaders()}))",'send()')
block=block.replace("throw new Error(await res.text().catch(()=>res.statusText));","throw Object.assign(new Error(await res.text().catch(()=>res.statusText)),{status:res.status});")
block=block.replace("throw new Error(txt || res.statusText);","throw Object.assign(new Error(txt || res.statusText),{status:res.status});")
s=s[:start]+block+s[end:]
s=replace(s,"  const d=await loadSchoolContent();\n  if(schoolEpochV465",'''  let d;
  try{d=await loadSchoolContent()}catch(error){
    if(schoolEpochV465!==nh7NavigationEpochV456)return;
    const t=(fa,en,hr)=>state.lang==='fa'?fa:state.lang==='hr'?hr:en;
    const message=t('دریافت درس‌ها کامل نشد. ثبت‌نام و پیشرفت شما پاک نشده است. اتصال را بررسی و دوباره تلاش کنید.','Lessons could not be loaded. Your registration and progress have not been cleared. Check your connection and try again.','Lekcije se nisu učitale. Vaša registracija i napredak nisu izbrisani. Provjerite vezu i pokušajte ponovno.');
    view.innerHTML=card(tr('school'),`<p role="status">${html(message)}</p><button class="primary-btn wide-btn" data-go="school" data-params='${html(JSON.stringify(params))}'>${html(t('تلاش دوباره','Try again','Pokušaj ponovno'))}</button><button class="secondary-btn wide-btn" data-go="school">${html(tr('back'))}</button>`);
    return;
  }
  if(schoolEpochV465''')
s=replace(s,"function invalidateSchoolSnapshot(email=currentUserEmail()){if(email)localStorage.removeItem(schoolSnapshotCacheKey(email))}","function invalidateSchoolSnapshot(email=currentUserEmail()){/* The next call already forces a server read. Keep the last good snapshot for network failure. */}")
s=replace(s,"    const clean={\n      progress:Array.isArray(snapshot?.progress)?snapshot.progress:[],","    if(!snapshot||!Array.isArray(snapshot.progress)||!Array.isArray(snapshot.assignments))throw new Error('invalid_school_snapshot');\n    const clean={\n      progress:Array.isArray(snapshot?.progress)?snapshot.progress:[],")
p.write_text(s)
p=Path('js/nh7-audio-route-stability-v423.js');s=p.read_text()
s=between(s,'async function refreshSession(){','async function freshRequest(','''async function refreshSession(){return !!(await window.NH7_SESSION_V467?.refresh(true))}
''');p.write_text(s)
p=Path('js/nh7-school-path-v351.js');s=p.read_text()
s=between(s,'async function refresh(s){','async function rpc(','''async function refresh(s){const n=await window.NH7_SESSION_V467?.refresh(true,s?.access_token||'');if(!n)throw Error('session_expired');return n}
''')
s=s.replace('const q=await fetch(`${SB}/rest/v1/rpc/${name}`','const q=await (window.NH7_SESSION_V467?.request||fetch)(`${SB}/rest/v1/rpc/${name}`')
p.write_text(s)
p=Path('js/nh7-audio-classic-v400.js');s=p.read_text()
s=between(s,'async function accessToken(){','function accountEmail()', '''async function accessToken(){return await window.NH7_SESSION_V467.token()}
''')
s=between(s,'async function refreshAudioSession(){','async function edge(','''async function refreshAudioSession(rejectedToken=''){return await window.NH7_SESSION_V467.refresh(true,rejectedToken)}
''')
s=replace(s,"const refreshed=await refreshAudioSession();","const refreshed=await refreshAudioSession(token);")
s=s.replace("const response=await fetch(`${SB}/functions/v1/nh7-school-media-access`","const response=await window.NH7_SESSION_V467.request(`${SB}/functions/v1/nh7-school-media-access`")
s=replace(s,"body:JSON.stringify(Object.assign({device_id:deviceId()},payload)),cache:'no-store'});","body:JSON.stringify(Object.assign({device_id:deviceId()},payload)),cache:'no-store'},{retryRead:true});")
s=replace(s,"const id=mediaId(item),cached=signed.get(id);","const id=accountEmail()+'|'+mediaId(item),cached=signed.get(id);")
s=replace(s,"let audio=null,current=null,currentPanel=null,patchTimer=0,prewarmBusy=false;","let audio=null,current=null,currentPanel=null,patchTimer=0,prewarmBusy=false;\nlet selection=0,transitioning=false,preparingId='',playingOwner='';\nconst boundCards=new WeakSet(),failedLocal=new Set();\nfunction text(node,value){if(node&&node.textContent!==String(value))node.textContent=String(value)}")
s=s.replace("if(code.includes('login_required')||code.includes('invalid_session'))","if(code.includes('login_required')||code.includes('invalid_session')||code.includes('session_unavailable'))")
s=s.replace("if(code.includes('network')||code.includes('failed to fetch')||code.includes('load failed'))","if(code.includes('network')||code.includes('request_timeout')||code.includes('failed to fetch')||code.includes('load failed'))")
s=replace(s,"node.textContent=text||'';node.className=type?'is-'+type:''","if(node.textContent!==(text||''))node.textContent=text||'';const cls=type?'is-'+type:'';if(node.className!==cls)node.className=cls")
s=replace(s,"play.textContent=same&&!audio?.paused?'❚❚':'▶'","text(play,same&&!audio?.paused?'❚❚':'▶')")
s=replace(s,"panel.querySelector('[data-classic-now]').textContent=fmt(now);","text(panel.querySelector('[data-classic-now]'),fmt(now));")
s=replace(s,"panel.querySelector('[data-classic-total]').textContent=fmt(duration);","text(panel.querySelector('[data-classic-total]'),fmt(duration));")
s=replace(s,"panel.querySelector('[data-classic-rate]').textContent=`${L('سرعت','Speed','Brzina')} ${nearestSpeed(rate)}×`;","text(panel.querySelector('[data-classic-rate]'),`${L('سرعت','Speed','Brzina')} ${nearestSpeed(rate)}×`);")
s=replace(s,"audio.addEventListener('playing',()=>{if(!current)return;lastWall","audio.addEventListener('playing',()=>{transitioning=false;if(!current)return;lastWall")
s=replace(s,"audio.addEventListener('pause',()=>{if(!current)return;","audio.addEventListener('pause',()=>{if(!current||transitioning)return;")
start=s.index("  audio.addEventListener('error',async()=>");end=s.index('\n  return audio;',start)
s=s[:start]+'''  audio.addEventListener('error',()=>{if(!current)return;const id=mediaId(current),local=localUrls.get(id);if(local&&audio.src===local)failedLocal.add(id);else signed.delete(accountEmail()+'|'+id);transitioning=false;setStatus(current,L('پخش متوقف شد؛ برای تلاش دوباره Play را بزنید. دانلود ذخیره‌شده پاک نشده است.','Playback stopped; tap Play to retry. Your saved download has not been deleted.','Reprodukcija je stala; dodirnite Play za ponovni pokušaj. Spremljeno preuzimanje nije izbrisano.'),'error');syncPanel(current)});'''+s[end:]
s=s.replace("catch(_){removeMeta(item);return''}","catch(_){return''}")
s=s.replace("catch(_){removeMeta(item);return false}","catch(_){return false}")
start=s.index('async function playItem(item){');end=s.index('\nfunction downloadLabel(',start)
s=s[:start]+'''async function playItem(item){
  if(!supported(item))return;
  const id=mediaId(item),who=accountEmail();if(localStorage.getItem('nh7_explicit_logout')==='1'){setStatus(item,errorText({code:'login_required'}),'error');return}if(preparingId===id)return;
  showCurrentPanel(item);const player=ensureAudio();
  if(current&&mediaId(current)===id&&playingOwner===who&&player.src&&!player.error){if(player.paused){try{await player.play()}catch(error){setStatus(item,errorText(error),'error')}}else player.pause();syncPanel(item);return}
  const epoch=++selection;preparingId=id;
  const valid=()=>epoch===selection&&who===accountEmail()&&localStorage.getItem('nh7_explicit_logout')!=='1';
  const start=url=>{
    if(!valid())return Promise.resolve();
    // Capture the old lesson BEFORE changing current, so pause cannot credit another lesson.
    if(current){captureListen();saveProgress(current,!!player.ended);flushTracking(false,true)}
    transitioning=true;player.pause();current=item;playingOwner=who;sessionId='classic_'+(crypto.randomUUID?.()||Date.now());listenedPending=0;lastWall=Date.now();lastPosition=0;
    player.src=url;player.playbackRate=nearestSpeed(Number(localStorage.getItem('nh7_sermon_speed')||1)||1);player.load();syncPanel(item);
    return player.play();
  };
  try{
    const ready=signed.get(who+'|'+id),knownLocal=failedLocal.has(id)?'':localUrls.get(id);
    let playing;
    // A prewarmed link starts synchronously in the user's gesture (important on Safari).
    if(knownLocal)playing=start(knownLocal);
    else if(ready?.url&&ready.expires>Date.now()+60000)playing=start(ready.url);
    else{
      const local=failedLocal.has(id)?'':await localUrl(item);if(!valid())return;
      if(!local&&!navigator.onLine)throw Object.assign(new Error('network_error'),{code:'network_error'});
      setStatus(item,L('در حال آماده‌سازی فایل صوتی…','Preparing audio…','Priprema audio datoteke…'),'busy');
      const url=local||await signedUrl(item);if(!valid())return;playing=start(url);
    }
    try{await playing}catch(error){if(!valid())return;if(error?.name==='NotAllowedError')setStatus(item,L('فایل آماده است؛ برای شروع پخش Play را بزنید.','Audio is ready; tap Play to start.','Audio je spreman; dodirnite Play.'),'busy');else if(error?.name!=='AbortError')setStatus(item,errorText(error),'error')}
  }catch(error){if(valid())setStatus(item,errorText(error)+(error?.status?` [${error.status}]`:''),'error')}
  finally{if(epoch===selection)preparingId=''}
}
'''+s[end:]
start=s.index('async function flushTracking(');end=s.index('\nasync function localUrl(',start);block=s[start:end]
block=block.replace("const delta=Math.floor(listenedPending);","const tracked=current,trackedSession=sessionId,delta=Math.floor(listenedPending);")
block=block.replace('durationFor(current)','durationFor(tracked)').replace('isSchool(current)','isSchool(tracked)').replace('lessonCode(current)','lessonCode(tracked)').replace('mediaId(current)','mediaId(tracked)').replace('titleFor(current)','titleFor(tracked)').replace('current.analytics_','tracked.analytics_').replace('current.topic','tracked.topic').replace('current.category_id','tracked.category_id').replace("p_session_id:sessionId||","p_session_id:trackedSession||")
s=s[:start]+block+s[end:]
s=replace(s,"  card.dataset.classicAudioV400='1';","  if(boundCards.has(card)){syncPanel(item);return}boundCards.add(card);\n  card.dataset.classicAudioV400='1';")
s=replace(s,"    signedUrl(item).then(()=>setStatus(item,L('فایل صوتی آماده است.','Audio is ready.','Audio je spreman.'),'ok')).catch(error=>setStatus(item,errorText(error),'error'));","    localUrl(item).then(local=>local||signedUrl(item)).then(()=>{if(card.isConnected&&(!current||mediaId(current)!==mediaId(item)))setStatus(item,L('فایل صوتی آماده است.','Audio is ready.','Audio je spreman.'),'ok')}).catch(error=>{if(card.isConnected)setStatus(item,errorText(error),'error')});")
start=s.index('function prewarm(){');end=s.index('\nfunction itemFromPanelNode',start)
s=s[:start]+'''function prewarm(){/* Signing is lazy: current school card or a user gesture only. */}
'''+s[end:]
start=s.index("  const toggle=event.target.closest?.('[data-classic-toggle]')");end=s.index("\n  const back=",start)
s=s[:start]+"  const toggle=event.target.closest?.('[data-classic-toggle]');if(toggle){const item=itemFromPanelNode(toggle);if(item){event.preventDefault();event.stopImmediatePropagation();playItem(item)}return true}"+s[end:]
s=replace(s,"new MutationObserver(()=>{clearTimeout(patchTimer);patchTimer=setTimeout(()=>{patch();prewarm()},40)}).observe(document.documentElement,{childList:true,subtree:true});",'''const observeRoot=document.getElementById('view')||document.body;
new MutationObserver(records=>{if(!records.some(r=>!r.target.closest?.('[data-classic-player]')&&[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('[data-sermon-card]')||n.querySelector?.('[data-sermon-card]')))))return;clearTimeout(patchTimer);patchTimer=setTimeout(patch,40)}).observe(observeRoot,{childList:true,subtree:true});
window.addEventListener('storage',e=>{if(e.key===SESSION_KEY||e.key==='nh7_explicit_logout'){selection++;preparingId='';signed.clear();if(audio)audio.pause()}});''')
s=s.replace("window.NH7_AUDIO_SIGNED_VERSION='4.6.1-401-refresh';","window.NH7_AUDIO_SIGNED_VERSION='4.6.7-stable-audio';")
p.write_text(s)
p=Path('index.html');s=p.read_text();s=replace(s,'  <script src="js/nh7-security-core-v340.js','  <script src="js/nh7-session-v467.js?v=4.6.7"></script>\n  <script src="js/nh7-security-core-v340.js')
for path in ['js/app.js','js/nh7-school-path-v351.js','js/nh7-audio-classic-v400.js','js/nh7-audio-route-stability-v423.js','js/nh7-school-media-session-v262.js']:
 s,n=re.subn(re.escape(path)+r'\?v=[^"\s]+',path+'?v=4.6.7',s);assert n==1,(path,n)
s=s.replace('service-worker.js?v=4.6.6','service-worker.js?v=4.6.7');p.write_text(s)
p=Path('service-worker.js');p.write_text(p.read_text().replace('sw-release-core-v403.js?v=4.6.6','sw-release-core-v403.js?v=4.6.7'))
p=Path('sw-release-core-v403.js');s=p.read_text().replace('4.6.6-school-guide','4.6.7-school-audio').replace('nh7-release-core-v466-school-guide','nh7-release-core-v467-school-audio');i=s.index('];',s.index('const NH7_RELEASE_ASSETS=['));s=s[:i]+", './js/nh7-session-v467.js'"+s[i:];i=s.index(']);',s.index('const NH7_READER_RELEASE_PATHS_V452'));s=s[:i]+', "js/nh7-session-v467.js", "js/nh7-school-media-session-v262.js"'+s[i:];p.write_text(s)
for path in ['js/app.js','js/nh7-session-v467.js','js/nh7-audio-classic-v400.js','js/nh7-audio-route-stability-v423.js','js/nh7-school-path-v351.js','service-worker.js','sw-release-core-v403.js']:
 subprocess.run(['node','--check',path],check=True)
print('Prepared bounded, non-destructive school/audio recovery. No progression-policy change.')
