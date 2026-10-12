/* Local request search without delayed focus/scroll restoration. */
(()=>{'use strict';if(window.__NH7_REQUEST_SEARCH_439)return;window.__NH7_REQUEST_SEARCH_439=true;
const normalize=v=>String(v??'').toLocaleLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200f\u202a-\u202e]/g,' ').replace(/\s+/g,' ').trim();
const escape=v=>String(v??'').replace(/[&"<>]/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));
function filter(input){if(!input)return;currentSearch=input.value;const panel=input.closest('.panel-card');if(!panel)return;const q=normalize(input.value);let count=0;const cards=Array.from(panel.querySelectorAll('.request-card'));for(const card of cards){const show=!q||normalize(card.textContent).includes(q);if(card.hidden===show)card.hidden=!show;if(show)count++}let empty=panel.querySelector('.nh7-request-search-empty-v336');if(!empty){empty=document.createElement('div');empty.className='empty nh7-request-search-empty-v336';panel.appendChild(empty)}const text=typeof tr==='function'?tr('empty'):'No results';if(empty.textContent!==text)empty.textContent=text;empty.hidden=count!==0||cards.length===0}
window.nh7RequestSearchV336=filter;window.lockRequestSearchHeightV337=()=>{};
if(typeof renderRequests==='function'){const original=renderRequests;renderRequests=window.renderRequests=function(approvedOnly=false){const saved=String(currentSearch||'');let html;try{currentSearch='';html=original(approvedOnly)}finally{currentSearch=saved}return html.replace(/value=""\s+oninput="currentSearch=this\.value;render\(\)"/,`id="nh7RequestSearchV336" autocomplete="off" value="${escape(saved)}" oninput="nh7RequestSearchV336(this)"`)}}
document.addEventListener('nh7:admin-render',()=>{const field=document.getElementById('nh7RequestSearchV336');if(field)filter(field)});
window.NH7_ADMIN_REQUEST_SEARCH_VERSION='4.3.9-local-search';
})();
