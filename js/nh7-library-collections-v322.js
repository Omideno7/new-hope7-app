/* New Hope 7 v3.2.7 — dynamic library collections with offline cache */
(()=>{'use strict';
const VERSION='3.2.7-library-collections-offline';
const URL='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
const CACHE_PREFIX='nh7_library_collections_cache_v327_';
let collections=[],itemMap=new Map(),loading=false,lastLoad=0,mountTimer=0,selectedCollection='',selectedAudience='';
const lang=()=>{const value=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(value)?value:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const E=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function token(){return String(session()?.access_token||'')}
function email(){return String(session()?.user?.email||'').trim().toLowerCase()}
function hash(value){let h=2166136261;for(let i=0;i<String(value).length;i++){h^=String(value).charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
function cacheKey(){return CACHE_PREFIX+hash(email()||'guest')}
function headers(){return{apikey:KEY,Authorization:'Bearer '+(token()||KEY),'Content-Type':'application/json'}}
function title(row){const l=lang();return row?.['title_'+l]||row?.title_en||row?.title_fa||row?.title_hr||row?.slug||L('مجموعه','Collection','Zbirka')}
function description(row){const l=lang();return row?.['description_'+l]||row?.description_en||row?.description_fa||row?.description_hr||''}
function applyCache(value){if(!value||!Array.isArray(value.collections)||!Array.isArray(value.items))return false;collections=value.collections;itemMap=new Map(value.items.map(row=>[String(row.id),row]));lastLoad=Number(value.saved_at||Date.now());return true}
function readCache(){try{return JSON.parse(localStorage.getItem(cacheKey())||'null')}catch(_){return null}}
function saveCache(items){try{localStorage.setItem(cacheKey(),JSON.stringify({collections,items,saved_at:Date.now(),user_email:email()}))}catch(_){}}
async function load(force=false){
  if(loading||!token()||(!force&&Date.now()-lastLoad<20000))return;
  if(!navigator.onLine){applyCache(readCache());scheduleMount();return}
  loading=true;
  try{
    const[cRes,iRes]=await Promise.all([
      fetch(`${URL}/rest/v1/nh7_library_collections_public_v322?select=*&order=audience.asc,sort_order.asc`,{headers:headers(),cache:'no-store'}),
      fetch(`${URL}/rest/v1/nh7_library_items_v224?select=id,collection_id,audience,resource_type&resource_type=eq.library`,{headers:headers(),cache:'no-store'})
    ]);
    if(!cRes.ok)throw new Error(await cRes.text());if(!iRes.ok)throw new Error(await iRes.text());
    collections=await cRes.json();const items=await iRes.json();itemMap=new Map((Array.isArray(items)?items:[]).map(row=>[String(row.id),row]));lastLoad=Date.now();saveCache(Array.isArray(items)?items:[])
  }catch(error){console.warn('Library collections',error);if(!applyCache(readCache())){collections=[];itemMap=new Map()}}
  finally{loading=false;scheduleMount()}
}
function audience(){return sessionStorage.getItem('nh7_library_tab')==='ministers'?'ministers':'public'}
function libraryRoot(){const tabs=document.querySelector('.library-user-tabs');if(!tabs)return null;return tabs.closest('section,.card')||tabs.parentElement}
function originalGrid(root){return root?.querySelector('.library-user-grid[data-nh7-original-library-grid]')||root?.querySelector('.library-user-grid')}
function cardId(card){return String(card.querySelector('[data-library-open]')?.dataset.libraryOpen||'')}
function restoreCards(root){const grid=originalGrid(root),display=root?.querySelector('[data-nh7-collection-books]');if(!grid)return;display?.querySelectorAll('.library-user-card').forEach(card=>grid.appendChild(card));grid.style.display='none'}
function available(root){const grid=originalGrid(root);if(!grid)return[];return Array.from(grid.querySelectorAll('.library-user-card')).map(card=>({card,id:cardId(card)})).filter(x=>x.id)}
function countFor(root,id){return available(root).filter(x=>String(itemMap.get(x.id)?.collection_id||'')===String(id)).length}
function unassignedCount(root){return available(root).filter(x=>!itemMap.get(x.id)?.collection_id).length}
function hideOriginalTitle(root){Array.from(root.querySelectorAll('h2')).find(node=>!node.closest('.nh7-collection-hub,.nh7-collection-content'))?.classList.add('nh7-library-original-title-hidden')}
function hubHtml(root,aud){const list=collections.filter(row=>row.audience===aud).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)),unassigned=unassignedCount(root);return `<section class="nh7-collection-hub"><div class="nh7-collection-head"><div><h2>🗂️ ${E(L('مجموعه‌های کتابخانه','Library collections','Zbirke knjižnice'))}</h2><p>${E(L('یک مجموعه را انتخاب کنید تا کتاب‌ها و جزوه‌های داخل آن نمایش داده شوند.','Choose a collection to see its books and handouts.','Odaberite zbirku za prikaz knjiga i materijala.'))}</p></div></div><div class="nh7-collection-grid">${list.map(row=>`<button type="button" class="nh7-collection-card" data-nh7-open-collection="${E(row.id)}"><span class="nh7-collection-icon">${E(row.icon||'📚')}</span><strong>${E(title(row))}</strong>${description(row)?`<small>${E(description(row))}</small>`:''}<em>${countFor(root,row.id)} ${E(L('عنوان','items','stavki'))}</em></button>`).join('')}${unassigned?`<button type="button" class="nh7-collection-card" data-nh7-open-collection="__unassigned"><span class="nh7-collection-icon">📄</span><strong>${E(L('کتاب‌های بدون مجموعه','Books without a collection','Knjige bez zbirke'))}</strong><small>${E(L('کتاب‌هایی که هنوز به مجموعه‌ای متصل نشده‌اند.','Books not assigned to a collection yet.','Knjige koje još nisu dodijeljene zbirci.'))}</small><em>${unassigned} ${E(L('عنوان','items','stavki'))}</em></button>`:''}</div></section>`}
function renderHub(root,force=false){if(!root)return;const currentHost=root.querySelector('[data-nh7-library-collection-host]');if(!force&&currentHost?.dataset.nh7CurrentCollection==='')return;restoreCards(root);const grid=originalGrid(root);if(!grid)return;grid.dataset.nh7OriginalLibraryGrid='1';grid.style.display='none';let host=currentHost;if(!host){host=document.createElement('div');host.dataset.nh7LibraryCollectionHost='1';grid.insertAdjacentElement('beforebegin',host)}host.dataset.nh7CurrentCollection='';host.innerHTML=hubHtml(root,audience());hideOriginalTitle(root)}
function showCollection(root,id,force=false){if(!root)return;const existingHost=root.querySelector('[data-nh7-library-collection-host]');if(!force&&existingHost?.dataset.nh7CurrentCollection===String(id))return;restoreCards(root);const grid=originalGrid(root),host=existingHost||root.querySelector('[data-nh7-library-collection-host]');if(!grid||!host)return;const aud=audience(),row=collections.find(x=>String(x.id)===String(id)&&x.audience===aud);if(id!=='__unassigned'&&!row){selectedCollection='';return renderHub(root,true)}const name=id==='__unassigned'?L('کتاب‌های بدون مجموعه','Books without a collection','Knjige bez zbirke'):title(row),desc=id==='__unassigned'?'':description(row);host.dataset.nh7CurrentCollection=String(id);host.innerHTML=`<section class="nh7-collection-content"><div class="nh7-collection-content-head"><button type="button" class="secondary-btn" data-nh7-collections-back>‹ ${E(L('مجموعه‌ها','Collections','Zbirke'))}</button><div><h2>${E(row?.icon||'📚')} ${E(name)}</h2>${desc?`<p>${E(desc)}</p>`:''}</div></div><div class="library-user-grid" data-nh7-collection-books></div><p class="muted nh7-collection-empty" hidden>${E(L('هنوز کتابی در این مجموعه قرار نگرفته است.','There are no books in this collection yet.','U ovoj zbirci još nema knjiga.'))}</p></section>`;const target=host.querySelector('[data-nh7-collection-books]');const cards=Array.from(grid.querySelectorAll('.library-user-card')).filter(card=>{const mapped=String(itemMap.get(cardId(card))?.collection_id||'');return id==='__unassigned'?!mapped:mapped===String(id)});cards.forEach(card=>target.appendChild(card));host.querySelector('.nh7-collection-empty').hidden=cards.length>0;grid.style.display='none';hideOriginalTitle(root)}
function mount(){const root=libraryRoot();if(!root||!token())return;const grid=originalGrid(root);if(!grid)return;if(!grid.dataset.nh7OriginalLibraryGrid)grid.dataset.nh7OriginalLibraryGrid='1';const activeAudience=audience(),list=collections.filter(row=>row.audience===activeAudience);if(!list.length&&unassignedCount(root)===0)return;if(selectedAudience!==activeAudience){selectedAudience=activeAudience;selectedCollection='';root.querySelector('[data-nh7-library-collection-host]')?.remove()}if(selectedCollection)showCollection(root,selectedCollection);else renderHub(root)}
function scheduleMount(){clearTimeout(mountTimer);mountTimer=setTimeout(()=>{if(!collections.length)load(false);mount()},140)}
document.addEventListener('click',event=>{const open=event.target.closest?.('[data-nh7-open-collection]');if(open){event.preventDefault();event.stopPropagation();selectedCollection=open.dataset.nh7OpenCollection||'';showCollection(libraryRoot(),selectedCollection,true);return}if(event.target.closest?.('[data-nh7-collections-back]')){event.preventDefault();event.stopPropagation();selectedCollection='';renderHub(libraryRoot(),true)}},true);
const observer=new MutationObserver(scheduleMount);observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('storage',event=>{if(event.key==='nh7_lang'){lastLoad=0;scheduleMount()}});
setInterval(()=>{if(navigator.onLine&&libraryRoot()){load(false);scheduleMount()}},6000);
setTimeout(()=>load(true),900);
window.NH7_LIBRARY_COLLECTIONS_VERSION=VERSION;
})();
