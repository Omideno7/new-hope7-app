/* New Hope 7 admin 2.3.9.47: stable session + MASTER isolated from admin render lifecycle. */
(()=>{'use strict';const RELEASE='2.3.9.47';let checkBusy=false,lastCheck=0;
let header=null,resize=null;
function measureHeader(){const next=document.querySelector('.admin-shell>.topbar');if(header===next)return;resize?.disconnect();header=next;if(!header||!window.ResizeObserver)return;resize=new ResizeObserver(()=>{const h=Math.ceil(header.getBoundingClientRect().height)+'px';if(document.documentElement.style.getPropertyValue('--nh7-admin-header-height')!==h)document.documentElement.style.setProperty('--nh7-admin-header-height',h)});resize.observe(header)}
function masterLink(){if(document.querySelector('input[type="password"]'))return;const tabs=document.querySelector('.tabs');if(!tabs||document.getElementById('nh7MasterStandaloneLink'))return;const a=document.createElement('a');a.id='nh7MasterStandaloneLink';a.className='tab';a.href='./admin-master-v462.html?build=4.6.2-'+Date.now();a.textContent='📚 بارگذاری کتاب MASTER';a.style.textDecoration='none';tabs.appendChild(a)}
function installSessionGuard(){
  if(window.__NH7_ADMIN_SESSION_GUARD_246||!window.nh7AdminAccessReady||typeof token!=='string'||!token||typeof authFetch!=='function')return;
  window.__NH7_ADMIN_SESSION_GUARD_246=true;
  const guardedFetch=async function(path,opt={}){
    const run=async()=>{
      const headers=Object.assign({apikey:SUPABASE_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation'},opt.headers||{});
      const url=SUPABASE_URL+path;
      const r=typeof fetchWithTimeout==='function'?await fetchWithTimeout(url,Object.assign({},opt,{headers})):await fetch(url,Object.assign({},opt,{headers}));
      if(r.ok)return r.status===204?null:r.json();
      const txt=await r.text();const expired=(r.status===401)||(typeof jwtExpiredText==='function'&&jwtExpiredText(txt));
      if(expired&&typeof refreshAdminSession==='function'&&await refreshAdminSession()){
        const retryHeaders=Object.assign({},headers,{Authorization:'Bearer '+token});
        const rr=typeof fetchWithTimeout==='function'?await fetchWithTimeout(url,Object.assign({},opt,{headers:retryHeaders})):await fetch(url,Object.assign({},opt,{headers:retryHeaders}));
        if(rr.ok)return rr.status===204?null:rr.json();
        const retryText=await rr.text();throw Object.assign(new Error(retryText||'Admin request failed after session refresh'),{status:rr.status,code:'ADMIN_REQUEST_FAILED'});
      }
      throw Object.assign(new Error(txt||('Admin request failed: '+r.status)),{status:r.status,code:expired?'ADMIN_SESSION_RETRY':'ADMIN_REQUEST_FAILED'});
    };
    return run();
  };
  guardedFetch.__nh7SessionGuard246=true;
  authFetch=window.authFetch=guardedFetch;
  adminRpc=window.adminRpc=(name,payload={})=>guardedFetch('/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(payload)});
}
function ready(){measureHeader();document.documentElement.dataset.nh7AdminBuild=RELEASE;document.querySelectorAll('.nh7-admin-version-v235,.nh7-clean-scroll-badge,.nh7-stable-final-badge,.nh7-fix12-badge,.nh7-stable-badge,[data-ready-import-card],[data-master435],[data-master436-menu],[data-master440-menu],[data-master441-menu],[data-master450-menu],[data-master450-panel]').forEach(n=>n.remove());masterLink();installSessionGuard();window.NH7AdminUI?.installNetwork();window.NH7AdminUI?.installReview()}
async function check(){if(document.hidden||!navigator.onLine||checkBusy||Date.now()-lastCheck<60000)return;checkBusy=true;lastCheck=Date.now();try{const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),5000);let v;try{const r=await fetch('./version.json?t='+Date.now(),{cache:'no-store',signal:ctrl.signal});v=r.ok?await r.json():null}finally{clearTimeout(timer)}if(v?.admin&&v.admin!==RELEASE&&!document.getElementById('nh7AdminUpdateNotice')){const el=document.createElement('button');el.id='nh7AdminUpdateNotice';el.type='button';el.className='btn secondary';el.style.cssText='position:fixed;bottom:12px;left:12px;z-index:190;max-width:80vw';el.textContent=document.documentElement.lang==='fa'?'نسخهٔ جدید آماده است؛ پس از ذخیره، برای به‌روزرسانی بزنید.':document.documentElement.lang==='hr'?'Nova verzija. Spremite rad, zatim ažurirajte.':'New version available. Save your work, then update.';el.onclick=()=>{if(window.NH7AdminUI?.hasDrafts()&&!confirm(document.documentElement.lang==='fa'?'نوشتهٔ ذخیره‌نشده دارید. صفحه دوباره بارگذاری شود؟':'Unsaved work exists. Reload anyway?'))return;location.replace('./admin-v239-stable.html?release='+encodeURIComponent(v.admin)+'&update='+Date.now())};document.body.appendChild(el)}}catch(_){}finally{checkBusy=false}}
if(typeof logout==='function'){const original=logout;logout=window.logout=function(...args){window.NH7AdminUI?.clearPrivateDrafts();return original.apply(this,args)}}
document.addEventListener('nh7:admin-render',ready);window.addEventListener('pageshow',check);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
function initial(){ready();const requested=new URL(location.href).searchParams.get('tab');if(requested&&typeof setTab==='function'&&requested!==activeTab)setTab(requested)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initial,{once:true});else initial();
})();
