/* New Hope 7 Admin v5.0.8 — live Approved + Student search without full-page rerenders. */
(()=>{'use strict';
if(window.__NH7_ADMIN_LIVE_SEARCH_V508__)return;window.__NH7_ADMIN_LIVE_SEARCH_V508__=true;
const oldRegistration=typeof window.queueRegistrationSearch==='function'?window.queueRegistrationSearch:null;
const oldStudent=typeof window.queueStudentSearch==='function'?window.queueStudentSearch:null;
const normalize=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200d\u200e\u200f\u202a-\u202e]/g,'').replace(/\s+/g,' ').trim();
function removeEmpty(root){root?.querySelector?.('[data-nh7-live-search-empty-v508]')?.remove()}
function filterCards(input,root,cardSelector){
  if(!root)return;
  const query=normalize(input?.value||''),cards=[...root.querySelectorAll(cardSelector)];let visible=0;
  for(const card of cards){const show=!query||normalize(card.textContent).includes(query);card.hidden=!show;card.style.display=show?'':'none';if(show)visible++}
  removeEmpty(root);
  if(query&&cards.length&&!visible){const empty=document.createElement('div');empty.dataset.nh7LiveSearchEmptyV508='1';empty.className='empty';empty.textContent=(typeof lang!=='undefined'&&lang==='fa')?'نتیجه‌ای با این نام، ایمیل یا کد پیدا نشد.':(typeof lang!=='undefined'&&lang==='hr')?'Nema rezultata za ovo ime, e-mail ili studentski ID.':'No result matches this name, email, or Student ID.';root.appendChild(empty)}
}
function applyRegistration(input){filterCards(input,input?.closest?.('.panel-card'),'.request-card')}
function applyStudents(input){filterCards(input,document.querySelector('.student-grid'),'.student-card')}
window.queueRegistrationSearch=function(el){try{oldRegistration?.call(this,el)}catch(_){}applyRegistration(el)};
window.queueStudentSearch=function(el){try{oldStudent?.call(this,el)}catch(_){}applyStudents(el)};
try{queueRegistrationSearch=window.queueRegistrationSearch;queueStudentSearch=window.queueStudentSearch}catch(_){}
let frame=0;const observer=new MutationObserver(()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;const r=document.getElementById('registrationSearchInput');if(r?.value)applyRegistration(r);const s=document.getElementById('studentSearchInput');if(s?.value)applyStudents(s)})});observer.observe(document.documentElement,{subtree:true,childList:true});
window.NH7_ADMIN_LIVE_SEARCH_VERSION='5.0.8';
})();
