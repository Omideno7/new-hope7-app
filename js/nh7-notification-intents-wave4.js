/* Notification intents converge on existing Web/Admin routers and existing Inbox.
 * No incoming payload creates an Inbox row or grants access. */
(()=>{'use strict';if(window.NH7NotificationIntentsWave4)return;
const C=window.NH7NotificationContractWave4,KEY='nh7_notification_pending_wave4';
const t=(fa,en,hr)=>localStorage.getItem('nh7_lang')==='fa'?fa:localStorage.getItem('nh7_lang')==='hr'?hr:en;
let adminDetail=null,pending=null,serial=0,hooks=new WeakSet(),handled=new Set();
const who=()=>window.NH7PushBindingWave4?.identity?.()||{uid:'',jwt:''};
const same=i=>{const n=who();return n.uid===i.uid&&n.jwt===i.jwt};
function tell(message,action){
 let box=document.getElementById('nh7NotificationNotice4');if(!box){box=document.createElement('div');box.id='nh7NotificationNotice4';box.setAttribute('role','status');box.style.cssText='position:fixed;inset-inline:12px;top:calc(env(safe-area-inset-top,0px) + 74px);z-index:290;background:var(--card,#f7fbfb);color:var(--text,#123);padding:12px;border:1px solid #638;border-radius:12px;max-width:540px;margin:auto;display:flex;gap:10px;align-items:center;overflow-wrap:anywhere';document.body.append(box)}
 box.replaceChildren();const text=document.createElement('span');text.textContent=message;box.append(text);
 if(action){const b=document.createElement('button');b.type='button';b.textContent=t('باز کردن','Open','Otvori');b.onclick=()=>{box.remove();action()};box.append(b)}
 const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label',t('بستن','Close','Zatvori'));close.onclick=()=>box.remove();box.append(close);
 box.dir=localStorage.getItem('nh7_lang')==='fa'?'rtl':'ltr';
}
const unavailable=()=>tell(t('این مقصد در دسترس نیست. صندوق ورودی را بررسی کنید.','This destination is unavailable. Check your Inbox.','Ovo odredište nije dostupno. Provjerite ulaznu poštu.'));
function remember(value){pending={value,expires:Date.now()+900000};try{sessionStorage.setItem(KEY,JSON.stringify(pending))}catch(_){}}
function forget(){pending=null;try{sessionStorage.removeItem(KEY)}catch(_){}}
const adminTabs={overview:'workspace:overview',registration:'requests',prayer:'prayers',qa:'qa',assignment:'assignments',testimony:'testimonies',messages:'workspace:messaging'};
function mountAdminDetail(){
 const d=adminDetail;if(!d||!same(d.identity)||typeof activeTab!=='string'||activeTab!==adminTabs[d.section])return;
 const app=document.getElementById('adminApp');if(!app)return;
 let detail=document.getElementById('nh7AdminNotificationDetail4');if(!detail){detail=document.createElement('section');detail.id='nh7AdminNotificationDetail4';detail.className='panel-card';detail.setAttribute('role','region');detail.tabIndex=-1;const heading=document.createElement('h3');heading.textContent=t('جزئیات درخواست','Request details','Pojedinosti zahtjeva');const source=document.createElement('small');source.textContent=d.id;const body=document.createElement('p');body.style.whiteSpace='pre-wrap';body.textContent=String(d.summary||'').slice(0,20000);detail.append(heading,source,body);app.append(detail)}
 if(d.focus){d.focus=false;detail.focus({preventScroll:true});detail.scrollIntoView({block:'center',behavior:'instant'})}
}
function openAdmin(value,record,restore=false){
 if(!document.getElementById('adminApp')){const url=new URL('admin-v239-stable.html',location.href);url.searchParams.set('workspace','1');url.searchParams.set('nh7_intent',JSON.stringify(value));location.assign(url.href);return}
 const {section,id}=value.params;if(typeof setTab!=='function')throw Error('unavailable');
 if(id&&record?.id!==id)throw Error('unavailable');
 adminDetail=id?{...record,id,section,identity:who(),focus:true}:null;
 // Compose with the EXISTING renderer. Finite render work, no observer/polling.
 if(typeof render==='function'&&!render.__nh7Notification4){const original=render;const wrapped=function(){const out=original.apply(this,arguments);mountAdminDetail();return out};wrapped.__nh7Notification4=true;render=window.render=wrapped}
 if(!restore)setTab(adminTabs[section]);else if(typeof render==='function')render();
 if(!restore)history.replaceState({...history.state,nh7Notification:value},'',location.hash+(id?'/'+id:''));
 mountAdminDetail();
}
async function open(raw,restore=false){
 const value=C?.intent(raw);if(!value){unavailable();return {ok:false,reason:'invalid_intent'}}
 if(!window.NH7_NAVIGATE&&!document.getElementById('adminApp')){remember(value);return{ok:false,reason:'router_pending'}}
 let record=null;const i=who(),ticket=++serial,key=i.uid+'|'+C.canonical(value);
 if(value.recipient_uid&&i.uid&&value.recipient_uid!==i.uid){forget();unavailable();return {ok:false,reason:'wrong_account'}}
 const publicRoute=['home','inbox','settings','meetings','daily','bible'].includes(value.route)&&!value.recipient_uid;
 if(!i.uid&&!publicRoute){remember(value);window.NH7_NAVIGATE?.('account');tell(t('برای باز کردن اعلان وارد حساب مربوط شوید.','Sign in to the notification account to continue.','Prijavite se na račun obavijesti za nastavak.'));return{ok:false,reason:'sign_in_required'}}
 if(!navigator.onLine&&!publicRoute){remember(value);tell(t('برای بررسی دسترسی دوباره آنلاین شوید.','Reconnect to verify access.','Ponovno se povežite za provjeru pristupa.'));return{ok:false,reason:'offline'}}
 const onTarget=value.route==='admin'?C.canonical(history.state?.nh7Notification)===C.canonical(value):history.state?.route===value.route&&C.canonical(history.state?.params||{})===C.canonical(value.params);
 if(handled.has(key)&&onTarget&&!restore){forget();return{ok:true,duplicate:true}}
 if(!publicRoute){
  if(window.NH7_NOTIFICATION_WAVE4_BACKEND_READY!==true){forget();unavailable();return{ok:false,reason:'backend_review_required'}}
  const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),10000);
  try{const r=await fetch('https://gpzcwffxnddhaeaogdyo.supabase.co/rest/v1/rpc/nh7_notification_resolve_wave4',{method:'POST',headers:{apikey:'sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37',Authorization:'Bearer '+i.jwt,'Content-Type':'application/json'},body:JSON.stringify({p_intent:value}),signal:ctrl.signal});const out=await r.json();if(ticket!==serial||!same(i))return{ok:false,reason:'stale'};if(!r.ok||out?.allowed!==true||C.canonical(C.intent(out.intent))!==C.canonical(value))throw Error('unavailable');record=out.record}
  catch(_){if(ticket===serial&&same(i)){forget();if(value.route==='admin'&&!document.getElementById('adminApp'))window.NH7_NAVIGATE?.('inbox');unavailable()}return{ok:false,reason:'denied'}}finally{clearTimeout(timeout)}
 }
 if(ticket!==serial||!same(i))return{ok:false,reason:'stale'};
 // Current Plans renderer creates progress when opening an unmaterialized day.
 // A notification must never implicitly start it; require an existing owner day.
 if(value.route==='plans'){let progress=null;try{progress=JSON.parse(localStorage.getItem('nh7_spiritual_plans_v240:'+i.uid)||'null')}catch(_){}const plan=progress?.plans?.[value.params.plan];if(!plan?.startedAt||!plan.days?.[String(value.params.day)]){forget();unavailable();return{ok:false,reason:'plan_day_not_started'}}}
 forget();document.getElementById('nh7NotificationNotice4')?.remove();try{
  if(value.route==='admin')openAdmin(value,record,restore);
  else if(value.route==='audio'&&value.params.item_id){const url=new URL(location.href);url.searchParams.set('sermon',value.params.item_id);history.replaceState(history.state,'',url.href);await window.NH7_NAVIGATE?.('audio',{item:value.params.item_id})}
  else await window.NH7_NAVIGATE?.(value.route,value.params);
  if(ticket!==serial||!same(i))return{ok:false,reason:'stale'};
  if(value.route!=='admin'){const heading=document.querySelector('#view h1,#view h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}}
  handled.add(key);if(handled.size>32)handled.delete(handled.values().next().value);return{ok:true};
 }catch(_){unavailable();return{ok:false,reason:'unavailable'}}
}
function data(event){const raw=event?.notification?.additionalData||event?.notification?.data||event?.result?.notification?.additionalData||event;return raw?.nh7_intent||(['home','inbox','settings','meetings','audio','school'].includes(raw?.route)?{version:4,route:raw.route,params:{}}:null)}
function hook(O){if(!O||hooks.has(O))return;hooks.add(O);const N=O.Notifications;N?.addEventListener?.('click',e=>{const value=data(e);if(value)void open(value)});N?.addEventListener?.('foregroundWillDisplay',e=>{e.preventDefault?.();const value=C?.intent(data(e));if(!value||value.recipient_uid&&value.recipient_uid!==who().uid)return;tell(t('اعلان تازه دریافت شد.','A new notification arrived.','Stigla je nova obavijest.'),()=>void open(value))})}
function resume(){if(!window.NH7_NAVIGATE&&!document.getElementById('adminApp'))return;if(pending&&pending.expires>Date.now())void open(pending.value);else if(pending&&pending.expires<=Date.now())forget()}
window.addEventListener('nh7-personal-owner-wave2',()=>{serial++;handled.clear();adminDetail=null;document.getElementById('nh7NotificationNotice4')?.remove();document.getElementById('nh7AdminNotificationDetail4')?.remove();if(pending?.value.recipient_uid&&who().uid&&pending.value.recipient_uid!==who().uid)forget();else resume()});
window.addEventListener('nh7-admin-clear-wave3',()=>{serial++;handled.clear();adminDetail=null;document.getElementById('nh7NotificationNotice4')?.remove();document.getElementById('nh7AdminNotificationDetail4')?.remove()});
window.addEventListener('popstate',e=>{if(e.state?.nh7Notification)void open(e.state.nh7Notification,true)});window.addEventListener('nh7-router-ready-wave4',resume);window.addEventListener('nh7-admin-access-wave3',resume);window.addEventListener('online',resume);
window.OneSignalDeferred=window.OneSignalDeferred||[];window.OneSignalDeferred.push(hook);
document.addEventListener('deviceready',()=>hook(window.plugins?.OneSignal),{once:true});hook(window.plugins?.OneSignal);
document.addEventListener('click',e=>{const button=e.target?.closest?.('[data-inbox-destination]');if(!button)return;try{const rows=JSON.parse(localStorage.getItem('nh7_inbox_messages')||'[]'),row=rows.find(r=>String(r.id)===button.dataset.inboxDestination);if(row?.intent)void open(row.intent)}catch(_){unavailable()}});
window.NH7NotificationIntentsWave4=Object.freeze({owned:m=>{const v=C?.intent(m?.intent);return !!v?.recipient_uid&&v.recipient_uid===who().uid},open,parse:C?.intent,receive:(value)=>tell(t('اعلان تازه دریافت شد.','A new notification arrived.','Stigla je nova obavijest.'),()=>void open(value))});
function start(){try{pending=JSON.parse(sessionStorage.getItem(KEY)||'null');const url=new URL(location.href),raw=url.searchParams.get('nh7_intent');if(raw){url.searchParams.delete('nh7_intent');history.replaceState(history.state,'',url.href);if(raw.length<=2048){const value=C?.intent(JSON.parse(raw));if(value)remember(value)}}}catch(_){forget()}if(pending)resume()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
