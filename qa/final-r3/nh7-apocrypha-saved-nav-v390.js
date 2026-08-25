/* New Hope 7 Final QA R3 v3.9.0 — saved Apocrypha verse -> exact book/chapter/verse. */
(()=>{'use strict';if(window.__NH7_APO_SAVED_NAV_V390__)return;window.__NH7_APO_SAVED_NAV_V390__=true;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(sel,tries=55){for(let i=0;i<tries;i++){const x=document.querySelector(sel);if(x)return x;await sleep(80)}return null}
function refFrom(card){return String(card?.querySelector('[data-delete-bookmark]')?.dataset.deleteBookmark||card?.querySelector('[data-open-ref]')?.dataset.openRef||card?.querySelector('strong[data-v251-saved-ref]')?.dataset.v251SavedRef||'')}
async function openRef(ref){
  const m=String(ref||'').match(/^APO:([^:]+):(\d+):(\d+)$/);if(!m)return false;const [,bookId,chapter,verse]=m;
  const launch=document.querySelector('[data-go="apocrypha"]');
  if(launch)launch.click();else document.querySelector('.nav-item[data-route="bible"]')?.click();
  let book=await wait(`[data-rc-apo-book="${CSS.escape(bookId)}"]`);
  if(!book){const launch2=await wait('[data-go="apocrypha"]',20);launch2?.click();book=await wait(`[data-rc-apo-book="${CSS.escape(bookId)}"]`)}
  if(!book)return false;book.click();
  const select=await wait('[data-rc-apo-chapter]');if(select){const option=[...select.options].find(o=>Number(o.value)===Number(chapter));if(option){select.value=String(chapter);select.dispatchEvent(new Event('change',{bubbles:true}));await sleep(180)}}
  const row=await wait(`[data-apo-verse="${CSS.escape(String(verse))}"]`,40);if(row){row.scrollIntoView({behavior:'smooth',block:'center'});row.classList.add('nh7-apo-saved-target390');setTimeout(()=>row.classList.remove('nh7-apo-saved-target390'),2600)}return !!row;
}
document.addEventListener('click',e=>{const card=e.target.closest?.('.saved-verse-card');if(!card)return;const ref=refFrom(card);if(!ref.startsWith('APO:'))return;const trigger=e.target.closest?.('[data-v252-open-chapter],[data-open-ref]')||e.target.closest?.('strong[data-v251-saved-ref]');if(!trigger)return;e.preventDefault();e.stopImmediatePropagation();openRef(ref).catch(console.warn)},true);
const st=document.createElement('style');st.textContent='.nh7-apo-saved-target390{outline:3px solid #16a765!important;outline-offset:5px;border-radius:12px;transition:outline-color .3s}';document.head.appendChild(st);window.NH7_APOCRYPHA_SAVED_NAV_VERSION='3.9.0';})();
