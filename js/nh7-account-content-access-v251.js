/* New Hope 7 v2.5.1 RC — account-ID access bridge for ministers library and visual media. */
(()=>{'use strict';
if(window.__NH7_ACCOUNT_CONTENT_ACCESS_V251__)return;window.__NH7_ACCOUNT_CONTENT_ACCESS_V251__=true;
const VERSION='2.5.1-account-content-access';
const SUPABASE='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
const LIBRARY_SENTINEL_KEY='nh7_minister_library_code';
const VIDEO_SENTINEL_KEY='nh7_video_portal_code_v270';
const SENTINEL='NH7_ACCOUNT_ID_ACCESS_V251';
const nativeFetch=window.fetch.bind(window);
let status={authenticated:false,library_any:false,media_any:false,grants:[]};
let statusAt=0,statusToken='',checking=null,patchTimer=0;
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function token(){return String(session()?.access_token||'')}
function rewrite(raw){
  let value=String(raw||'');
  value=value.replace('/rest/v1/nh7_library_items_v224','/rest/v1/nh7_library_items_v251');
  value=value.replace('/rest/v1/nh7_library_collections_public_v322','/rest/v1/nh7_library_collections_public_v251');
  value=value.replace(/\/functions\/v1\/nh7-library-access(?=\?|#|$)/,'/functions/v1/nh7-library-access-v251');
  value=value.replace(/\/functions\/v1\/nh7-school-media-access(?=\?|#|$)/,'/functions/v1/nh7-school-media-access-v251');
  return value;
}
window.fetch=function nh7V251Fetch(input,init){
  try{
    const raw=typeof input==='string'?input:input instanceof URL?input.href:input?.url||'';
    const next=rewrite(raw);
    if(next===raw)return nativeFetch(input,init);
    if(input instanceof Request)return nativeFetch(new Request(next,input),init);
    return nativeFetch(next,init);
  }catch(_){return nativeFetch(input,init)}
};
function clearLegacyLocalSecrets(){
  try{sessionStorage.removeItem(LIBRARY_SENTINEL_KEY)}catch(_){}
  try{if(localStorage.getItem(VIDEO_SENTINEL_KEY)!==SENTINEL)localStorage.removeItem(VIDEO_SENTINEL_KEY)}catch(_){}
}
clearLegacyLocalSecrets();
function applySentinels(){
  try{
    if(status.library_any)sessionStorage.setItem(LIBRARY_SENTINEL_KEY,JSON.stringify({code:SENTINEL,at:Date.now(),mode:'account_id'}));
    else sessionStorage.removeItem(LIBRARY_SENTINEL_KEY);
  }catch(_){}
  try{
    if(status.media_any)localStorage.setItem(VIDEO_SENTINEL_KEY,SENTINEL);
    else if(localStorage.getItem(VIDEO_SENTINEL_KEY)===SENTINEL)localStorage.removeItem(VIDEO_SENTINEL_KEY);
  }catch(_){}
}
async function refresh(force=false){
  const access=token();
  if(!access){status={authenticated:false,library_any:false,media_any:false,grants:[]};statusToken='';statusAt=Date.now();applySentinels();schedulePatch();return status}
  if(!force&&checking)return checking;
  if(!force&&access===statusToken&&Date.now()-statusAt<15000)return status;
  checking=(async()=>{
    try{
      const response=await nativeFetch(`${SUPABASE}/rest/v1/rpc/nh7_my_content_access_v251`,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+access,'Content-Type':'application/json'},body:'{}',cache:'no-store'});
      if(!response.ok)throw new Error(await response.text());
      const data=await response.json();
      status=data&&typeof data==='object'?data:{authenticated:true,library_any:false,media_any:false,grants:[]};
    }catch(error){console.warn('[NH7 v251 access]',error);status={authenticated:true,library_any:false,media_any:false,grants:[]}}
    statusToken=access;statusAt=Date.now();applySentinels();schedulePatch();window.dispatchEvent(new CustomEvent('nh7-content-access-v251',{detail:status}));return status;
  })().finally(()=>checking=null);
  return checking;
}
function friendlyDenied(kind){return kind==='library'?L('این حساب هنوز اجازهٔ ورود به کتابخانهٔ خادمین را ندارد. مدیر باید دسترسی را برای همین حساب فعال کند.','This account does not yet have access to the ministers library. An administrator must grant access to this account.','Ovaj račun još nema pristup knjižnici za služitelje. Administrator mora odobriti pristup ovom računu.'):L('این حساب هنوز اجازهٔ ورود به رسانه‌های تصویری خصوصی را ندارد. مدیر باید دسترسی را برای همین حساب فعال کند.','This account does not yet have access to private visual media. An administrator must grant access to this account.','Ovaj račun još nema pristup privatnim vizualnim medijima. Administrator mora odobriti pristup ovom računu.')}
function patchLibrary(){
  document.querySelectorAll('.library-user-tabs').forEach(tabs=>{
    const minister=tabs.querySelector('[data-library-tab="ministers"]');if(!minister)return;
    minister.hidden=!status.library_any;minister.classList.toggle('nh7-v251-no-access',!status.library_any);
    if(!status.library_any&&sessionStorage.getItem('nh7_library_tab')==='ministers')tabs.querySelector('[data-library-tab="public"]')?.click();
  });
  document.querySelectorAll('.library-lock-note').forEach(note=>{if(status.library_any)note.innerHTML='🔐 '+L('دسترسی این بخش با حساب کاربری شما کنترل می‌شود؛ رمز جداگانه‌ای لازم نیست.','Access to this section is controlled by your account; no separate password is required.','Pristup ovom odjeljku kontrolira vaš račun; posebna lozinka nije potrebna.')});
}
function patchMedia(){
  document.querySelectorAll('[data-nh7-video-portal]').forEach(tile=>{
    tile.hidden=!status.media_any;tile.classList.toggle('nh7-v251-no-access',!status.media_any);
    const small=tile.querySelector('small');if(small)small.textContent=L('دسترسی امن بر اساس حساب کاربری','Secure account-based access','Siguran pristup putem računa');
  });
  document.querySelectorAll('[data-media-change-code],[data-media-retry]').forEach(node=>node.remove());
  document.querySelectorAll('.nh7-media-dialog header p').forEach(p=>p.textContent=L('دسترسی خصوصی مستقیماً به حساب شما متصل است و مدیر می‌تواند آن را فعال یا لغو کند.','Private access is linked directly to your account and can be granted or revoked by an administrator.','Privatni pristup izravno je povezan s vašim računom i administrator ga može odobriti ili ukinuti.'));
  document.querySelectorAll('.nh7-media-empty').forEach(box=>{const raw=box.textContent||'';if(/content_access_required|invalid_code|code_required|portal_login_required/i.test(raw))box.textContent=friendlyDenied('media')});
}
function patch(){patchLibrary();patchMedia()}
function schedulePatch(){clearTimeout(patchTimer);patchTimer=setTimeout(patch,30)}

document.addEventListener('click',async event=>{
  const ministerTab=event.target.closest?.('[data-library-tab="ministers"]');
  if(ministerTab&&!status.library_any){event.preventDefault();event.stopImmediatePropagation();await refresh(true);if(!status.library_any)alert(friendlyDenied('library'));else{applySentinels();ministerTab.click()}return}
  if(event.target.closest?.('[data-library-open]')&&sessionStorage.getItem('nh7_library_tab')==='ministers'){
    if(status.library_any)applySentinels();
  }
  const mediaTrigger=event.target.closest?.('[data-nh7-video-portal],[data-media-play]');
  if(mediaTrigger){
    if(!status.media_any){event.preventDefault();event.stopImmediatePropagation();await refresh(true);if(!status.media_any){alert(friendlyDenied('media'));return}mediaTrigger.click();return}
    applySentinels();
  }
},true);

const observer=new MutationObserver(schedulePatch);observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('storage',event=>{if(event.key===SESSION_KEY||event.key==='nh7_lang')refresh(true)});
window.addEventListener('nh7-access-status',()=>refresh(true));
setInterval(()=>refresh(false),8000);
setTimeout(()=>refresh(true),250);
window.NH7ContentAccessV251={VERSION,get status(){return status},refresh,canLibrary:()=>!!status.library_any,canMedia:()=>!!status.media_any};
})();
