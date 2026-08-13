/* New Hope 7 v3.3.5 — iOS School lesson viewport + playback guard hotfix */
(()=>{'use strict';
const VERSION='3.3.5-school-ios-hotfix';
const SUPABASE='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION='nh7_user_session_v170';
const warmed=new Map();
let timer=0;
const parse=v=>{try{return JSON.parse(v||'null')}catch(_){return null}};
function token(){return String(parse(localStorage.getItem(SESSION))?.access_token||'')}
function device(){let id=localStorage.getItem('nh7_device_id');if(!id){id='dev_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));localStorage.setItem('nh7_device_id',id)}return id}
function schoolCard(){return document.querySelector('#view .school-audio-card')}
function setPlaybackGuard(){window.NH7_SCHOOL_AUDIO_ACTIVE=true;try{sessionStorage.setItem('nh7_school_audio_guard_v335',String(Date.now()))}catch(_){}}
function addStyle(){
  if(document.getElementById('nh7SchoolIosHotfixV335'))return;
  const style=document.createElement('style');style.id='nh7SchoolIosHotfixV335';
  style.textContent=`
html.nh7-school-lesson-v335,html.nh7-school-lesson-v335 body{height:auto!important;min-height:100%!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important}
body.nh7-school-lesson-v335{position:static!important;max-height:none!important;overscroll-behavior-y:auto!important}
body.nh7-school-lesson-v335 .app-shell{display:flex!important;flex-direction:column!important;height:auto!important;min-height:100dvh!important;max-height:none!important;overflow:visible!important;contain:none!important}
body.nh7-school-lesson-v335 #view{display:block!important;flex:0 0 auto!important;width:100%!important;height:auto!important;min-height:calc(100dvh - 150px)!important;max-height:none!important;overflow:visible!important;contain:none!important;clip:auto!important;clip-path:none!important;padding-bottom:calc(126px + env(safe-area-inset-bottom,0px))!important;-webkit-overflow-scrolling:touch!important}
body.nh7-school-lesson-v335 #view>.card{display:block!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;contain:none!important;clip:auto!important;clip-path:none!important;margin-bottom:18px!important}
body.nh7-school-lesson-v335 #view>.card>p,body.nh7-school-lesson-v335 #view>.card>h2,body.nh7-school-lesson-v335 #view>.card>h3,body.nh7-school-lesson-v335 .school-assignment,body.nh7-school-lesson-v335 .school-audio-card{height:auto!important;max-height:none!important;overflow:visible!important;clip:auto!important;clip-path:none!important}
body.nh7-school-lesson-v335 .school-audio-card{position:relative!important;z-index:1!important}
body.nh7-school-lesson-v335 .inline-sermon-player{max-height:none!important;overflow:visible!important}
body.nh7-school-lesson-v335 .bottom-nav{transform:translateX(-50%) translateZ(0)!important}
@media(max-width:760px){body.nh7-school-lesson-v335 #view{padding-inline:14px!important;padding-top:14px!important;padding-bottom:calc(132px + env(safe-area-inset-bottom,0px))!important}body.nh7-school-lesson-v335 #view>.card{border-radius:20px!important}}
`;
  document.head.appendChild(style);
}
function syncLayout(){
  const on=!!schoolCard();
  document.documentElement.classList.toggle('nh7-school-lesson-v335',on);
  document.body?.classList.toggle('nh7-school-lesson-v335',on);
  if(on){
    document.body.style.removeProperty('height');
    const root=document.getElementById('view');
    if(root){root.style.removeProperty('height');root.style.removeProperty('max-height');root.style.removeProperty('overflow')}
  }
}
async function secureUrl(code){
  const cached=warmed.get(code);if(cached&&cached.expires>Date.now()+60000)return cached.url;
  const access=token();if(!access||!navigator.onLine)return'';
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),7000);
  try{
    const r=await fetch(`${SUPABASE}/functions/v1/nh7-school-media-access`,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+access,'Content-Type':'application/json'},body:JSON.stringify({kind:'audio',lesson_code:code,device_id:device()}),cache:'no-store',signal:controller.signal});
    if(!r.ok)return'';const data=await r.json().catch(()=>null),url=String(data?.signed_url||'');if(!url)return'';
    const expires=Date.now()+Math.max(5*60*1000,(Number(data?.expires_in)||21600)*1000-120000);warmed.set(code,{url,expires});return url;
  }catch(_){return''}finally{clearTimeout(timeout)}
}
async function warmCard(card){
  const play=card?.querySelector?.('[data-sermon-play^="school-"]');if(!play)return;
  const id=String(play.dataset.sermonPlay||''),code=id.replace(/^school-/,'');if(!code)return;
  const item=window.__sermonMap?.[id];if(!item)return;
  const url=await secureUrl(code);if(!url)return;
  item.__nh7SchoolOriginalUrl=url;item.audio_url=url;item.__nh7SchoolSecureWarmV335=true;
}
function warmVisible(){document.querySelectorAll('#view .school-audio-card').forEach(card=>warmCard(card).catch(()=>{}))}
function settle(){clearTimeout(timer);timer=setTimeout(()=>{syncLayout();warmVisible()},35)}
document.addEventListener('pointerdown',event=>{if(event.target.closest?.('#view .school-audio-card [data-sermon-play^="school-"]'))setPlaybackGuard()},true);
document.addEventListener('touchstart',event=>{if(event.target.closest?.('#view .school-audio-card [data-sermon-play^="school-"]'))setPlaybackGuard()},{capture:true,passive:true});
document.addEventListener('click',event=>{if(event.target.closest?.('#view .school-audio-card [data-sermon-play^="school-"]'))setPlaybackGuard()},true);
window.addEventListener('pageshow',settle);window.addEventListener('resize',settle,{passive:true});window.addEventListener('orientationchange',settle,{passive:true});
const observer=new MutationObserver(settle);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:false});
addStyle();settle();window.NH7_SCHOOL_IOS_HOTFIX_VERSION=VERSION;
})();
