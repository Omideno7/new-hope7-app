/* New Hope 7 QA v3.8.1 — direct saved Apocrypha verse navigation. */
(()=>{'use strict';if(window.__NH7_APO_SAVED_NAV_V381__)return;window.__NH7_APO_SAVED_NAV_V381__=true;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(sel,tries=40){for(let i=0;i<tries;i++){const x=document.querySelector(sel);if(x)return x;await sleep(80)}return null}
function refFrom(card){return String(card?.querySelector('[data-delete-bookmark]')?.dataset.deleteBookmark||card?.querySelector('[data-open-ref]')?.dataset.openRef||'')}
async function openRef(ref){
  const m=String(ref||'').match(/^APO:([^:]+):(\d+):(\d+)$/);if(!m)return false;
  const [,bookId,chapter,verse]=m;if(typeof window.NH7_APOCRYPHA_COMPLETE_OPEN!=='function')return false;
  await window.NH7_APOCRYPHA_COMPLETE_OPEN();
  const book=await wait(`[data-f381-book="${CSS.escape(bookId)}"],[data-v370-book="${CSS.escape(bookId)}"]`);if(!book)return false;book.click();
  const unit=await wait('[data-f381-unit],[data-v370-unit]');if(unit){const option=[...unit.options].find(o=>Number(o.value)===Number(chapter));if(option){unit.value=String(chapter);unit.dispatchEvent(new Event('change',{bubbles:true}));await sleep(160)}}
  const row=await wait(`[data-apo-verse="${CSS.escape(String(verse))}"]`,30);if(row){row.scrollIntoView({behavior:'smooth',block:'center'});row.classList.add('nh7-apo-saved-target381');setTimeout(()=>row.classList.remove('nh7-apo-saved-target381'),2400)}
  return !!row;
}
document.addEventListener('click',e=>{const card=e.target.closest?.('.saved-verse-card');if(!card)return;const ref=refFrom(card);if(!ref.startsWith('APO:'))return;const trigger=e.target.closest?.('[data-v252-open-chapter],[data-open-ref],[data-v251-saved-ref]')||e.target.closest?.('strong');if(!trigger)return;e.preventDefault();e.stopImmediatePropagation();openRef(ref).catch(console.warn)},true);
const st=document.createElement('style');st.textContent='.nh7-apo-saved-target381{outline:3px solid #16a765!important;outline-offset:4px;border-radius:10px;transition:outline-color .3s}';document.head.appendChild(st);window.NH7_APOCRYPHA_SAVED_NAV_VERSION='3.8.1';})();
