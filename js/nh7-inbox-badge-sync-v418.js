/* New Hope 7 v4.1.8 — live, account-scoped Inbox unread badge sync.
   User app only. Does not modify or depend on the Admin panel. */
(()=>{'use strict';
if(window.__NH7_INBOX_BADGE_SYNC_V418__)return;
window.__NH7_INBOX_BADGE_SYNC_V418__=true;

const VERSION='4.1.8-inbox-badge-sync';
const SUPABASE_URL='https://gpzcwffxnddhaeaogdyo.supabase.co';
const SUPABASE_KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
const LOGOUT_KEY='nh7_explicit_logout';
const INBOX_KEY='nh7_inbox_messages';
const DELETED_KEY='nh7_inbox_deleted_ids';
const OWNER_KEY='nh7_inbox_cache_owner_v418';
const POLL_MS=30000;
const MAX_LOCAL_MESSAGES=200;

let activeSync=null;
let lastSuccessfulSync=0;
let lastCount=-1;
let observerTimer=0;

function parseJson(value,fallback){try{const out=JSON.parse(value);return out==null?fallback:out}catch(_){return fallback}}
function readJson(key,fallback){return parseJson(localStorage.getItem(key)||'',fallback)}
function session(){return readJson(SESSION_KEY,null)}
function explicitlyLoggedOut(){return localStorage.getItem(LOGOUT_KEY)==='1'}
function language(){const value=String(localStorage.getItem('nh7_lang')||document.documentElement.lang||'en').toLowerCase();return value.startsWith('fa')?'fa':value.startsWith('hr')?'hr':'en'}
function deviceId(){let value=String(localStorage.getItem('nh7_device_id')||'').trim();if(!value){value='dev_'+(globalThis.crypto?.randomUUID?.()||Date.now()+'_'+Math.random().toString(16).slice(2));localStorage.setItem('nh7_device_id',value)}return value}
function profileEmail(){
  if(explicitlyLoggedOut())return'';
  const auth=String(session()?.user?.email||'').trim().toLowerCase();
  if(auth)return auth;
  try{
    const manual=String(localStorage.getItem('nh7_manual_email')||'').trim().toLowerCase();
    const school=readJson(localStorage.getItem('nh7_school_access')||'',{});
    const meeting=readJson(localStorage.getItem('nh7_meeting_access')||'',{});
    return String(manual||school?.email||meeting?.email||'').trim().toLowerCase();
  }catch(_){return String(localStorage.getItem('nh7_manual_email')||'').trim().toLowerCase()}
}
function ownerKey(){const email=profileEmail();return email?'email:'+email:'device:'+deviceId().toLowerCase()}
function requestUserKey(){return ownerKey()}
function authToken(){return String(session()?.access_token||SUPABASE_KEY)}
function headers(){return{
  apikey:SUPABASE_KEY,
  Authorization:'Bearer '+authToken(),
  Accept:'application/json',
  'Content-Type':'application/json',
  'Cache-Control':'no-store',
  'x-device-id':deviceId(),
  'x-user-email':profileEmail()
}}
async function refreshSession(){
  const current=session(),refresh=String(current?.refresh_token||'');
  if(!refresh)return false;
  try{
    const response=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token',{
      method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json','Cache-Control':'no-store'},
      body:JSON.stringify({refresh_token:refresh}),cache:'no-store'
    });
    if(!response.ok){if(response.status===400||response.status===401)localStorage.removeItem(SESSION_KEY);return false}
    const next=await response.json();
    if(!next?.access_token)return false;
    localStorage.setItem(SESSION_KEY,JSON.stringify(next));
    return true;
  }catch(_){return false}
}
async function rest(path,retry=true){
  const response=await fetch(SUPABASE_URL+'/rest/v1/'+path,{method:'GET',headers:headers(),cache:'no-store'});
  if(response.status===401&&retry){const before=authToken();const refreshed=await refreshSession();if(refreshed||authToken()!==before||authToken()===SUPABASE_KEY)return rest(path,false)}
  if(!response.ok){const detail=await response.text().catch(()=>'');throw new Error(`Inbox REST ${response.status}: ${detail||response.statusText}`)}
  if(response.status===204)return[];
  const out=await response.json().catch(()=>[]);
  return Array.isArray(out)?out:[];
}
function ensureOwnerScope(){
  const current=ownerKey(),previous=String(localStorage.getItem(OWNER_KEY)||'');
  if(previous&&previous!==current){
    localStorage.removeItem(INBOX_KEY);
    localStorage.removeItem(DELETED_KEY);
    lastCount=-1;
  }
  if(previous!==current)localStorage.setItem(OWNER_KEY,current);
}
function localMessages(){const rows=readJson(INBOX_KEY,[]);return Array.isArray(rows)?rows:[]}
function deletedIds(){const rows=readJson(DELETED_KEY,[]);return new Set(Array.isArray(rows)?rows.map(String):[])}
function messageKey(message){
  const category=String(message?.category||'').toLowerCase();
  const title=String(message?.title||'').toLowerCase();
  const body=String(message?.body||'').toLowerCase();
  if(category==='daily_word'||title.includes('daily word')||title.includes('کلام روزانه')||title.includes('dnevna riječ'))return'daily_word';
  if(category==='faith'||title.includes('faith proclamation')||title.includes('اعلان ایمان')||title.includes('proglas vjere'))return'faith';
  if(category==='daily_juice'||category==='juice'||title.includes('daily juice')||title.includes('آبمیوه')||title.includes('آب حیات')||title.includes('dnevni sok'))return'daily_juice';
  if(category==='gratitude'||title.includes('gratitude')||title.includes('شکرگزاری')||title.includes('zahvalnosti'))return'gratitude';
  if(category==='morning_meeting'||title.includes('morning prayer')||title.includes('دعای صبحگاهی')||title.includes('jutarnju molitvu'))return'morning_meeting';
  if(category==='sunday_service'||title.includes('sunday church')||title.includes('یکشنبه')||title.includes('nedjeljni'))return'sunday_service';
  if(category==='meeting'&&(body.includes('morning')||body.includes('صبح')||body.includes('jutarnji')))return'morning_meeting';
  if(category==='meeting'&&(body.includes('sunday')||body.includes('یکشنبه')||body.includes('nedjeljni')))return'sunday_service';
  return'';
}
function dateKey(message){const raw=String(message?.createdAt||message?.delivered_at||new Date().toISOString()),date=new Date(raw);if(Number.isNaN(date.getTime()))return raw.slice(0,10);return`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function canonicalGroup(message){const key=messageKey(message);return key?`scheduled:${key}:${dateKey(message)}`:`message:${String(message?.id||'')}`}
function visibleMessages(){
  const lang=language(),deleted=deletedIds(),groups=new Map();
  for(const message of localMessages()){
    const id=String(message?.id||'');
    if(!id||deleted.has(id)||deleted.has(canonicalGroup(message)))continue;
    const scheduled=!!messageKey(message),rowLang=String(message?.language||message?.lang||'').toLowerCase();
    if(rowLang&&rowLang!==lang&&!scheduled)continue;
    const group=canonicalGroup(message),existing=groups.get(group);
    if(!existing){groups.set(group,message);continue}
    const existingLocal=String(existing?.language||existing?.lang||'').toLowerCase()===lang;
    const messageLocal=rowLang===lang;
    if(messageLocal&&!existingLocal)groups.set(group,{...message,read:!!message.read&&!!existing.read});
    else groups.set(group,{...existing,read:!!existing.read&&!!message.read});
  }
  return[...groups.values()];
}
function unreadCount(){return visibleMessages().filter(message=>!message.read).length}
function addStyle(){
  if(document.getElementById('nh7-inbox-badge-v418-style'))return;
  const style=document.createElement('style');style.id='nh7-inbox-badge-v418-style';style.textContent=`
[data-go="inbox"]{position:relative}.nh7-inbox-tile-badge-v418{position:absolute;top:8px;right:8px;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:#ef4444;color:#fff;font-size:12px;font-weight:900;line-height:22px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.25);z-index:2}.nh7-inbox-tile-badge-v418[hidden]{display:none!important}
`;document.head.appendChild(style)
}
function paintBadge(count=unreadCount()){
  count=Math.max(0,Number(count)||0);lastCount=count;
  const label=count>99?'99+':String(count);
  const top=document.getElementById('inboxBadge');
  if(top){if(top.textContent!==label)top.textContent=label;top.classList.toggle('hidden',count===0);top.hidden=count===0;top.setAttribute('aria-label',`${count} unread messages`)}
  const tile=document.querySelector('.tile[data-go="inbox"],[data-go="inbox"].tile,[data-go="inbox"]');
  if(tile){
    let badge=tile.querySelector(':scope > .nh7-inbox-tile-badge-v418');
    if(!badge){badge=document.createElement('span');badge.className='nh7-inbox-tile-badge-v418';badge.setAttribute('aria-hidden','true');tile.appendChild(badge)}
    if(badge.textContent!==label)badge.textContent=label;badge.hidden=count===0;
  }
  window.dispatchEvent(new CustomEvent('nh7:inbox-badge',{detail:{count,version:VERSION}}));
  return count;
}
function saveMerged(rows,deleted){
  const next=JSON.stringify(rows.slice(0,MAX_LOCAL_MESSAGES));
  if(localStorage.getItem(INBOX_KEY)!==next)localStorage.setItem(INBOX_KEY,next);
  const removed=JSON.stringify([...deleted].slice(-1000));
  if(localStorage.getItem(DELETED_KEY)!==removed)localStorage.setItem(DELETED_KEY,removed);
}
async function doSync(){
  ensureOwnerScope();
  if(!navigator.onLine){paintBadge();return{ok:false,offline:true,count:lastCount}}
  const email=profileEmail(),device=encodeURIComponent(deviceId()),lang=encodeURIComponent(language());
  const ownPath=email
    ?`notification_inbox?select=id,title,body,category,language,delivered_at,read_at,admin_deleted_at&or=(device_id.eq.${device},user_email.eq.${encodeURIComponent(email)})&order=delivered_at.desc&limit=100`
    :`notification_inbox?select=id,title,body,category,language,delivered_at,read_at,admin_deleted_at&device_id=eq.${device}&order=delivered_at.desc&limit=100`;
  const globalPath=`notification_inbox?select=id,title,body,category,language,delivered_at,read_at,admin_deleted_at&device_id=is.null&user_email=is.null&language=eq.${lang}&order=delivered_at.desc&limit=100`;
  const receiptsPath=`notification_inbox_receipts?select=message_id,read_at,deleted_at&user_key=eq.${encodeURIComponent(requestUserKey())}&limit=500`;
  const [ownRows,globalRows,receipts]=await Promise.all([rest(ownPath),rest(globalPath).catch(()=>[]),rest(receiptsPath).catch(()=>[])]);
  const receiptMap=new Map(receipts.map(row=>[String(row?.message_id||''),row]));
  const deleted=deletedIds(),byId=new Map(localMessages().filter(row=>!deleted.has(String(row?.id||''))).map(row=>[String(row.id),row]));
  for(const row of [...ownRows,...globalRows]){
    const id=String(row?.id||'');if(!id)continue;
    const receipt=receiptMap.get(id);
    if(row?.admin_deleted_at||receipt?.deleted_at||deleted.has(id)){
      byId.delete(id);if(row?.admin_deleted_at)deleted.add(id);continue;
    }
    const old=byId.get(id)||{};
    byId.set(id,{...old,id,title:String(row?.title||''),body:String(row?.body||''),category:String(row?.category||'cloud'),language:String(row?.language||language()),createdAt:row?.delivered_at||old.createdAt||new Date().toISOString(),read:!!(old.read||receipt?.read_at||row?.read_at),readAt:receipt?.read_at||row?.read_at||old.readAt||null,lang:String(row?.language||language())});
  }
  const merged=[...byId.values()].sort((a,b)=>String(b?.createdAt||'').localeCompare(String(a?.createdAt||'')));
  saveMerged(merged,deleted);
  lastSuccessfulSync=Date.now();
  return{ok:true,count:paintBadge(),rows:merged.length};
}
function sync({force=false}={}){
  ensureOwnerScope();
  if(!force&&Date.now()-lastSuccessfulSync<4000){paintBadge();return Promise.resolve({ok:true,cached:true,count:lastCount})}
  if(activeSync)return activeSync;
  activeSync=doSync().catch(error=>{console.warn('[NH7 inbox badge] sync failed',error);return{ok:false,error:String(error?.message||error),count:paintBadge()}}).finally(()=>{activeSync=null});
  return activeSync;
}
function scheduleSync(delay=120,force=false){setTimeout(()=>sync({force}),Math.max(0,delay))}
function hookOneSignal(){
  try{
    window.OneSignalDeferred=window.OneSignalDeferred||[];
    window.OneSignalDeferred.push(async OneSignal=>{
      try{OneSignal?.Notifications?.addEventListener?.('foregroundWillDisplay',()=>scheduleSync(150,true));OneSignal?.Notifications?.addEventListener?.('click',()=>scheduleSync(100,true))}catch(error){console.warn('[NH7 inbox badge] OneSignal hook',error)}
    });
  }catch(_){ }
}
function start(){
  addStyle();ensureOwnerScope();paintBadge();hookOneSignal();scheduleSync(250,true);
  window.setInterval(()=>{if(!document.hidden&&navigator.onLine)sync()},POLL_MS);
  ['focus','pageshow','online'].forEach(name=>window.addEventListener(name,()=>scheduleSync(80,true)));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleSync(80,true)});
  window.addEventListener('storage',event=>{
    if([SESSION_KEY,LOGOUT_KEY,'nh7_manual_email','nh7_school_access','nh7_meeting_access','nh7_device_id','nh7_lang',INBOX_KEY,DELETED_KEY].includes(String(event.key||''))){ensureOwnerScope();paintBadge();scheduleSync(120,true)}
  });
  document.addEventListener('click',event=>{
    const target=event.target?.closest?.('#inboxBtn,[data-go="inbox"],[data-inbox-open],[data-inbox-delete],#markAllRead,#deleteVisibleInbox,#cleanInboxLang');
    if(!target)return;
    setTimeout(()=>paintBadge(),120);
    scheduleSync(700,true);
  },true);
  new MutationObserver(()=>{clearTimeout(observerTimer);observerTimer=setTimeout(()=>paintBadge(lastCount<0?unreadCount():lastCount),35)}).observe(document.documentElement,{childList:true,subtree:true});
  window.NH7_INBOX_BADGE_SYNC={version:VERSION,sync:()=>sync({force:true}),count:()=>unreadCount()};
  window.NH7_INBOX_BADGE_SYNC_VERSION=VERSION;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
