/* New Hope 7 v6.0.0 — Christian Calendar modal/reader lock recovery.
 * Releases only an orphaned Calendar-owned app-shell inert state.
 */
(()=>{'use strict';
if(window.__NH7_CALENDAR_LOCK_GUARD_V600__)return;
window.__NH7_CALENDAR_LOCK_GUARD_V600__=true;

const VERSION='6.0.0-calendar-lock-recovery';
let scheduled=0;

function visibleModal(node){
  if(!node||!node.isConnected||node.hidden||node.classList?.contains('hidden'))return false;
  const style=getComputedStyle(node);
  return style.display!=='none'&&style.visibility!=='hidden'&&style.pointerEvents!=='none';
}
function otherModalOwnsLock(){
  return Array.from(document.querySelectorAll('[aria-modal="true"],dialog[open]')).some(node=>{
    if(node.closest?.('.nh7-celebration-modal464'))return false;
    return visibleModal(node);
  });
}
function releaseOrphanedCalendarLock(){
  cancelAnimationFrame(scheduled);
  scheduled=requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const shell=document.getElementById('appShell');
    if(!shell)return;
    if(document.querySelector('.nh7-celebration-modal464'))return;
    if(otherModalOwnsLock())return;
    if(shell.inert||shell.hasAttribute('inert')){
      shell.inert=false;
      shell.removeAttribute('inert');
    }
    // A removed celebration dialog must never retain focus in WebView.
    const active=document.activeElement;
    if(active&&active.closest?.('.nh7-celebration-modal464')){
      try{active.blur()}catch(_){}
    }
  }));
}

// Close, calendar-item -> feast, and feast-verse -> Bible are all hand-offs.
document.addEventListener('click',event=>{
  if(event.target?.closest?.('.nh7-celebration-close464,.nh7-calendar-item464,.nh7-feast-verse464')){
    setTimeout(releaseOrphanedCalendarLock,0);
  }
},false);

document.addEventListener('keydown',event=>{
  if((event.key==='Enter'||event.key===' ')&&event.target?.closest?.('.nh7-feast-verse464')){
    setTimeout(releaseOrphanedCalendarLock,0);
  }
  if(event.key==='Escape'&&event.target?.closest?.('.nh7-celebration-modal464')){
    setTimeout(releaseOrphanedCalendarLock,0);
  }
},false);

const observer=new MutationObserver(records=>{
  for(const record of records){
    for(const node of record.removedNodes){
      if(node.nodeType===1&&(node.matches?.('.nh7-celebration-modal464')||node.querySelector?.('.nh7-celebration-modal464'))){
        releaseOrphanedCalendarLock();
        return;
      }
    }
  }
});
observer.observe(document.body||document.documentElement,{childList:true,subtree:true});

addEventListener('pageshow',releaseOrphanedCalendarLock,{passive:true});
window.NH7CalendarLockGuardV600={version:VERSION,release:releaseOrphanedCalendarLock};
})();
