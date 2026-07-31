/* New Hope 7 v3.2.6 — deterministic offline playback bridge */
(()=>{'use strict';
const VERSION='3.2.6-offline-playback-bridge';
function replay(button){
  button.dataset.nh7OfflineBridgeBypass='1';
  queueMicrotask(()=>{
    button.click();
    setTimeout(()=>delete button.dataset.nh7OfflineBridgeBypass,0);
  });
}
async function handle(event){
  const button=event.target.closest?.('[data-sermon-play]');
  if(!button||button.dataset.nh7OfflineBridgeBypass==='1'||button.dataset.nh7OfflinePlayBypass==='1')return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const id=String(button.dataset.sermonPlay||'');
  const card=button.closest('[data-sermon-card],.sermon-card');
  const downloadButton=card?.querySelector?.('[data-offline-download]');
  const item=window.__sermonMap?.[id]||window.__audioBibleMap?.[id]||null;
  const raw=downloadButton?.dataset.offlineDownload||item?.__nh7OriginalAudioUrl||item?.audio_url||'';
  if(!raw||!window.NH7OfflineV325){replay(button);return}
  try{
    const result=await window.NH7OfflineV325.status(raw,true);
    if(result?.cached){
      const local=await window.NH7OfflineV325.localPlayable(raw);
      if(local&&item){
        if(!item.__nh7OriginalAudioUrl)item.__nh7OriginalAudioUrl=raw;
        item.audio_url=local;
      }
    }
  }catch(error){console.warn('Offline playback bridge',error)}
  replay(button);
}
function hideOfflineNotice(){
  document.querySelectorAll('.offline').forEach(node=>{
    if(node.dataset.nh7AutoHide==='1')return;
    node.dataset.nh7AutoHide='1';
    node.style.transition='opacity .25s ease';
    setTimeout(()=>{node.style.opacity='0';setTimeout(()=>node.remove(),300)},2200);
  });
}
document.addEventListener('click',handle,true);
const observer=new MutationObserver(hideOfflineNotice);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('offline',()=>setTimeout(hideOfflineNotice,0));
setTimeout(hideOfflineNotice,100);
window.NH7_OFFLINE_PLAYBACK_BRIDGE_VERSION=VERSION;
})();
