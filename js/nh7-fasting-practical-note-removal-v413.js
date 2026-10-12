/* New Hope 7 — fasting practical-note removal v4.1.3
 * Scope: remove only the practical-note box from the Fasting & Prayer setup form.
 */
(()=>{
  'use strict';
  if(window.__NH7_FASTING_NOTE_REMOVAL_V413__) return;
  window.__NH7_FASTING_NOTE_REMOVAL_V413__=true;

  const SELECTOR='.nh7-fasting-form > .nh7-safety-note';

  const style=document.createElement('style');
  style.id='nh7FastingNoteRemovalV413Style';
  style.textContent=`${SELECTOR}{display:none!important}`;
  document.head.appendChild(style);

  function removeNote(root=document){
    root.querySelectorAll?.(SELECTOR).forEach(node=>node.remove());
  }

  function start(){
    removeNote();
    const view=document.querySelector('#view');
    if(!view) return;
    new MutationObserver(()=>removeNote(view)).observe(view,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();

  window.NH7_FASTING_NOTE_REMOVAL_VERSION='4.1.3';
})();
