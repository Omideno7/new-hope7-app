(function telemetryScript(){
  'use strict';
  if(window.__NH7_BOOK_READING_TELEMETRY_V490__)return;
  window.__NH7_BOOK_READING_TELEMETRY_V490__=true;
  const VERSION='4.9.0-library-reading-telemetry';
  const URL='https://gpzcwffxnddhaeaogdyo.supabase.co';
  const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
  const SESSION='nh7_user_session_v170';
  let currentItem='',wasOpen=false,lastTick=Date.now(),pendingSeconds=0,lastSentAt=0,openRecorded=false,flushBusy=false,lastSection=0,lastTotal=1;
  function session(){try{const raw=JSON.parse(localStorage.getItem(SESSION)||'null');return raw?.currentSession||raw?.session||raw||null}catch(_){return null}}
  function bookOpen(){return document.body.classList.contains('nh7-book-open')&&!!document.querySelector('.nh7-book-modal')}
  function position(){
    const text=String(document.querySelector('[data-book-count]')?.textContent||'').trim(),m=text.match(/(\d+)\s*\/\s*(\d+)/);
    if(m){lastSection=Math.max(0,Number(m[1])-1);lastTotal=Math.max(1,Number(m[2]))}
    return{section:lastSection,total:lastTotal};
  }
  async function record(delta=0,open=false,keepalive=false){
    if(!currentItem||flushBusy)return false;
    const s=session(),token=String(s?.access_token||'');if(!token)return false;
    const p=position();flushBusy=true;
    try{
      const r=await fetch(URL+'/rest/v1/rpc/nh7_library_reading_record_v490',{
        method:'POST',cache:'no-store',keepalive:!!keepalive,
        headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},
        body:JSON.stringify({p_item_id:currentItem,p_language:localStorage.getItem('nh7_lang')||document.documentElement.lang||'en',p_total_sections:p.total,p_section:p.section,p_delta_seconds:Math.max(0,Math.min(300,Math.round(delta||0))),p_open:!!open})
      });
      if(r.ok){lastSentAt=Date.now();return true}
      return false;
    }catch(_){return false}finally{flushBusy=false}
  }
  async function flush(open=false,keepalive=false){
    const delta=pendingSeconds;pendingSeconds=0;
    const ok=await record(delta,open,keepalive);
    if(!ok)pendingSeconds+=delta;
  }
  function detectOpen(itemId){
    currentItem=String(itemId||'');openRecorded=false;pendingSeconds=0;lastTick=Date.now();lastSection=0;lastTotal=1;
    let tries=0;const t=setInterval(()=>{
      tries++;
      if(bookOpen()&&currentItem){clearInterval(t);position();openRecorded=true;flush(true).catch(()=>{});wasOpen=true}
      else if(tries>30)clearInterval(t);
    },120);
  }
  document.addEventListener('click',event=>{
    const open=event.target.closest?.('[data-nh7-book-open]');
    if(open){detectOpen(open.dataset.nh7BookOpen);return}
    if(event.target.closest?.('[data-book-prev],[data-book-next],[data-book-page],[data-book-top]')){
      setTimeout(()=>{position();if(Date.now()-lastSentAt>5000)flush(false).catch(()=>{})},180);
      return;
    }
    if(event.target.closest?.('[data-book-close]')){
      position();flush(false).catch(()=>{});wasOpen=false;
    }
  },true);
  setInterval(()=>{
    const now=Date.now(),open=bookOpen();
    if(open&&currentItem&&document.visibilityState==='visible'){
      pendingSeconds+=Math.max(0,Math.min(20,(now-lastTick)/1000));
      position();
      if(!openRecorded){openRecorded=true;flush(true).catch(()=>{})}
      else if(pendingSeconds>=45)flush(false).catch(()=>{});
    }else if(wasOpen&&!open&&currentItem){flush(false).catch(()=>{});wasOpen=false}
    wasOpen=open;lastTick=now;
  },10000);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&currentItem)flush(false,true).catch(()=>{});lastTick=Date.now()});
  window.addEventListener('pagehide',()=>{if(currentItem)flush(false,true).catch(()=>{})});
  window.NH7_BOOK_READING_TELEMETRY_VERSION=VERSION;
})();