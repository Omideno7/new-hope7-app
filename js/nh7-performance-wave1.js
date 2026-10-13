/* Shared user-app cost controls. No authorization decisions or analytics uploads. */
(()=>{'use strict';
if(window.NH7PerformanceWave1)return;
const originalFetch=window.fetch.bind(window),flights=new Map();
const reads=new Set(['nh7_registration_access_v2','nh7_registration_status','nh7_school_access_approved_v230','nh7_admin_my_access_v350','nh7_my_student_identity_v127','nh7_inbox_snapshot_v419']);
window.fetch=function(input,init={}){
  let url;try{url=new URL(typeof input==='string'?input:input.url,location.href)}catch(_){return originalFetch(input,init)}
  const method=String(init.method||input?.method||'GET').toUpperCase();
  if(url.origin!=='https://gpzcwffxnddhaeaogdyo.supabase.co'||init.signal||input instanceof Request||(init.body!==undefined&&typeof init.body!=='string'))return originalFetch(input,init);
  const rpc=url.pathname.split('/rest/v1/rpc/')[1];
  let status=false;try{status=url.pathname==='/functions/v1/nh7-content-access'&&JSON.parse(init.body||'{}').action==='status'}catch(_){}
  const safe=(method==='GET'&&(url.pathname==='/auth/v1/user'||url.pathname==='/rest/v1/registrations'))||
    (method==='POST'&&(reads.has(rpc)||status||(url.pathname==='/auth/v1/token'&&url.searchParams.get('grant_type')==='refresh_token')));
  if(!safe)return originalFetch(input,init);
  const headers=[...new Headers(init.headers||{}).entries()].sort();
  const key=JSON.stringify([url.href,method,headers,init.body||'',init.credentials||'',init.cache||'',init.mode||'',init.redirect||'',init.referrer||'',init.integrity||'',!!init.keepalive]);
  if(!flights.has(key)){
    const flight=Promise.resolve().then(()=>originalFetch(input,init)).finally(()=>{if(flights.get(key)===flight)flights.delete(key)});
    flights.set(key,flight);
  }
  return flights.get(key).then(response=>response.clone());
};
function visibleLoop(fn,delay){
  let timer=0,active=true;
  const stop=()=>{clearInterval(timer);timer=0};
  const resume=()=>{stop();if(active&&!document.hidden)timer=setInterval(fn,delay)};
  const visibility=()=>{if(document.hidden)stop();else{resume();fn()}};
  document.addEventListener('visibilitychange',visibility);
  window.addEventListener('pagehide',stop);window.addEventListener('pageshow',resume);resume();
  return()=>{active=false;stop();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',stop);window.removeEventListener('pageshow',resume)};
}
// Useful aggregates remain local until a separately reviewed UID-secure batch RPC exists.
// No free-form text, note contents, restricted Library titles or raw event log is collected.
const PREFIX='nh7_analytics_summary_wave1_',pending=new Map(),recent=new Map(),audioOwners=new Map();let persistTimer=0;
function owner(){try{const s=JSON.parse(localStorage.getItem('nh7_user_session_v170')||'null');return localStorage.getItem('nh7_explicit_logout')!=='1'&&s?.access_token&&s.user?.id?'uid:'+s.user.id:'device:'+(localStorage.getItem('nh7_device_id')||'anonymous')}catch(_){return'device:anonymous'}}
function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch(_){return{}}}
function identifier(value){const text=String(value||'overview');return /^[a-z0-9_:.-]{1,120}$/i.test(text)?text:'overview'}
function flush(){
  clearTimeout(persistTimer);persistTimer=0;
  for(const [key,delta] of pending){const rows=read(key),cutoff=new Date(Date.now()-30*86400000).toISOString().slice(0,10);for(const id of Object.keys(rows))if(rows[id].day<cutoff)delete rows[id];for(const [id,value] of Object.entries(delta)){
    if(!rows[id]&&Object.keys(rows).length>=400)delete rows[Object.keys(rows).sort()[0]];
    const previous=rows[id]||{};rows[id]={...value,opens:Number(previous.opens||0)+Number(value.opens||0),seconds:Number(previous.seconds||0)+Number(value.seconds||0),completed:!!(previous.completed||value.completed)};
  }try{localStorage.setItem(key,JSON.stringify(rows));pending.delete(key)}catch(_){/* Keep unsaved counters in memory on quota failure. */}}
}
function add(kind,id,values){
  const day=new Date().toISOString().slice(0,10),language=localStorage.getItem('nh7_lang')||'en',key=PREFIX+owner(),record=day+'|'+language+'|'+kind+'|'+String(id||'overview').slice(0,120),delta=pending.get(key)||{},old=delta[record]||{};
  if(!delta[record]&&Object.keys(delta).length>=400)return;
  delta[record]={...old,day,kind,id:String(id||'overview').slice(0,120),language,...(values.media_id?{media_id:values.media_id,duration_seconds:values.duration_seconds}:{}),opens:Number(old.opens||0)+Number(values.opens||0),seconds:Number(old.seconds||0)+Number(values.seconds||0),completed:!!(old.completed||values.completed)};pending.set(key,delta);
  if(!persistTimer)persistTimer=setTimeout(flush,60000);
}
function content(type,id){
  type=identifier(type);id=identifier(id);
  const key=owner()+'|'+(localStorage.getItem('nh7_lang')||'en')+'|'+type+'|'+id,now=Date.now();if(now-(recent.get(key)||0)<30000)return;recent.set(key,now);
  if(recent.size>400)recent.delete(recent.keys().next().value);
  add('app',type,{opens:1});add('content:'+type,id,{opens:1});
}
function audio(sessionId,item,seconds,completed=false){
  if(!sessionId||!item?.id)return;
  if(audioOwners.has(sessionId)&&audioOwners.get(sessionId)!==owner())return;
  audioOwners.set(sessionId,owner());if(audioOwners.size>400)audioOwners.delete(audioOwners.keys().next().value);
  const type=['sermon','school','audio_bible'].includes(item.analytics_type)?item.analytics_type:'sermon';
  add('audio:'+type,identifier(sessionId),{seconds:Math.max(0,Math.min(5,Number(seconds)||0)),completed,media_id:identifier(item.id),duration_seconds:Math.max(0,Number(item.duration_seconds||0)||Number(item.duration_minutes||0)*60)});
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});window.addEventListener('pagehide',flush);
window.NH7PerformanceWave1={visibleLoop,content,audio,flush,summary:()=>{flush();return read(PREFIX+owner())}};
})();
