/* New Hope 7 v2.5.2 — keep inline saved-verse text and restore a direct Go to chapter action. */
(()=>{'use strict';
if(window.__NH7_SAVED_VERSES_CHAPTER_V252__)return;window.__NH7_SAVED_VERSES_CHAPTER_V252__=true;
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
function patchCard(card){
  if(card.querySelector('[data-v252-open-chapter]'))return;
  const original=card.querySelector('[data-open-ref][data-open-ref-mode="chapter"]');
  const actions=card.querySelector('.saved-verse-actions');
  if(!original||!actions)return;
  const button=document.createElement('button');button.type='button';button.className='secondary-btn';button.dataset.v252OpenChapter='1';button.textContent='📖 '+L('رفتن به این فصل','Go to chapter','Idi na poglavlje');
  button.addEventListener('click',async event=>{
    event.preventDefault();event.stopPropagation();
    const handler=original.onclick;
    if(typeof handler==='function'){
      try{await handler.call(original,new MouseEvent('click',{bubbles:false,cancelable:true}))}catch(e){console.warn('[NH7 saved verse chapter]',e)}
      return;
    }
    const ref=String(original.dataset.openRef||'');
    console.warn('[NH7 saved verse chapter] original chapter handler is not ready',ref);
    setTimeout(()=>{const h=original.onclick;if(typeof h==='function')h.call(original,new MouseEvent('click',{bubbles:false,cancelable:true}))},120);
  });
  const del=actions.querySelector('[data-delete-bookmark]');actions.insertBefore(button,del||null);
}
function patch(){document.querySelectorAll('.saved-verse-card').forEach(patchCard)}
let timer=0;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(patch,30)}).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('languagechange',patch);patch();window.NH7_SAVED_VERSES_CHAPTER_VERSION='2.5.2';
})();
