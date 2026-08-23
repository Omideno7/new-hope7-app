/* New Hope 7 Admin v3.3.8 — stable mobile search, focus, caret and scroll preservation. */
(()=>{'use strict';
if(window.__NH7_ADMIN_SEARCH_STABILITY_V338__)return;window.__NH7_ADMIN_SEARCH_STABILITY_V338__=true;
const VERSION='3.3.8-admin-search-stability';
if(typeof renderRequests!=='function')return;
const normalize=value=>String(value??'').toLocaleLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200f\u202a-\u202e]/g,' ').replace(/\s+/g,' ').trim();
const escapeAttr=value=>String(value??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function emptyLabel(){try{return typeof tr==='function'?tr('empty'):(typeof lang!=='undefined'&&lang==='fa'?'موردی پیدا نشد.':typeof lang!=='undefined'&&lang==='hr'?'Nema rezultata.':'No results found.')}catch(_){return'No results found.'}}
function lockPanelHeight(panel){
  if(!panel||panel.dataset.nh7SearchHeightLocked==='1')return;
  const height=Math.ceil(panel.getBoundingClientRect().height);
  if(height>0){panel.style.minHeight=height+'px';panel.dataset.nh7SearchHeightLocked='1'}
}
function restoreViewport(input,y,top,selectionStart,selectionEnd){
  const restore=()=>{
    if(!input?.isConnected)return;
    try{input.focus({preventScroll:true})}catch(_){try{input.focus()}catch(__){}}
    try{if(typeof input.setSelectionRange==='function'&&Number.isInteger(selectionStart))input.setSelectionRange(selectionStart,Number.isInteger(selectionEnd)?selectionEnd:selectionStart)}catch(_){}
    const currentTop=input.getBoundingClientRect().top;
    const delta=currentTop-top;
    if(Math.abs(delta)>2)window.scrollBy({top:delta,left:0,behavior:'auto'});
    if(Math.abs(window.scrollY-y)>3)window.scrollTo({top:y,left:0,behavior:'auto'});
  };
  requestAnimationFrame(()=>requestAnimationFrame(restore));
  setTimeout(restore,40);setTimeout(restore,120);
}
function filterRequests(input){
  if(!input)return;
  const y=window.scrollY,top=input.getBoundingClientRect().top,start=input.selectionStart,end=input.selectionEnd;
  if(typeof currentSearch!=='undefined')currentSearch=input.value;
  const panel=input.closest('.panel-card');if(!panel)return;
  lockPanelHeight(panel);
  const query=normalize(input.value),cards=[...panel.querySelectorAll('.request-card')];let visible=0;
  for(const card of cards){const match=!query||normalize(card.textContent).includes(query);card.hidden=!match;if(match)visible++}
  let empty=panel.querySelector('.nh7-request-search-empty-v336');
  if(!empty){empty=document.createElement('div');empty.className='empty nh7-request-search-empty-v336 hidden';const toolbar=input.closest('.toolbar');(toolbar||panel).insertAdjacentElement('afterend',empty)}
  empty.textContent=emptyLabel();empty.classList.toggle('hidden',visible!==0||cards.length===0);
  if(!query){panel.style.minHeight='';delete panel.dataset.nh7SearchHeightLocked}
  restoreViewport(input,y,top,start,end);
}
window.nh7RequestSearchV336=filterRequests;
window.lockRequestSearchHeightV337=input=>lockPanelHeight(input?.closest?.('.panel-card'));

/* Requests + Approved: render the full row set once, then filter locally while typing. */
const previousRenderRequests=renderRequests;
renderRequests=window.renderRequests=function(approvedOnly=false){
  const saved=typeof currentSearch!=='undefined'?String(currentSearch||''):'';
  try{if(typeof currentSearch!=='undefined')currentSearch='';}catch(_){}
  let html=previousRenderRequests.apply(this,arguments);
  try{if(typeof currentSearch!=='undefined')currentSearch=saved;}catch(_){}
  const replacement=`id="nh7RequestSearchV336" data-nh7-stable-search="requests" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" value="${escapeAttr(saved)}" onfocus="lockRequestSearchHeightV337(this)" oninput="nh7RequestSearchV336(this)"`;
  html=html.replace(/value=""\s+oninput="currentSearch=this\.value;render\(\)"/,replacement);
  setTimeout(()=>{const input=document.getElementById('nh7RequestSearchV336');if(input&&saved)filterRequests(input)},0);
  return html;
};

/* Generic mobile focus guard for other Admin search/filter fields that still rerender. */
let snapshot=null,serial=0;
function editable(el){return !!el&&((el.tagName==='INPUT'&&!['button','checkbox','radio','file','range','color','date','time'].includes(String(el.type||'text').toLowerCase()))||el.tagName==='TEXTAREA')}
function headingOf(panel){return String(panel?.querySelector('h1,h2,h3,h4')?.textContent||'').trim().slice(0,160)}
function capture(el){
  if(!editable(el))return null;
  const panel=el.closest('.panel-card,.card,.student-modal,.nh7-rbac-shell')||document.body;
  const all=[...panel.querySelectorAll('input,textarea')].filter(editable),index=Math.max(0,all.indexOf(el));
  snapshot={serial:++serial,tag:el.tagName,type:String(el.type||''),id:el.id||'',name:el.name||'',placeholder:el.getAttribute('placeholder')||'',searchKey:el.dataset?.nh7StableSearch||'',panelHeading:headingOf(panel),index,value:el.value,start:el.selectionStart,end:el.selectionEnd,y:window.scrollY,top:el.getBoundingClientRect().top,at:Date.now()};
  return snapshot;
}
function findReplacement(s){
  if(!s)return null;if(s.id){const byId=document.getElementById(s.id);if(editable(byId))return byId}
  if(s.searchKey){const byKey=document.querySelector(`[data-nh7-stable-search="${CSS.escape(s.searchKey)}"]`);if(editable(byKey))return byKey}
  const panels=[...document.querySelectorAll('.panel-card,.card,.student-modal,.nh7-rbac-shell')];let panel=panels.find(p=>headingOf(p)===s.panelHeading)||document.body;
  let list=[...panel.querySelectorAll('input,textarea')].filter(editable);
  let candidate=list[s.index]||null;
  if(candidate&&s.placeholder&&candidate.getAttribute('placeholder')!==s.placeholder)candidate=null;
  if(!candidate&&s.placeholder)candidate=list.find(x=>x.getAttribute('placeholder')===s.placeholder)||null;
  if(!candidate&&s.name)candidate=list.find(x=>x.name===s.name)||null;
  return candidate;
}
function restoreSnapshot(s){
  if(!s||Date.now()-s.at>900||s.serial!==serial)return;
  const active=document.activeElement;if(editable(active)&&active!==findReplacement(s))return;
  const el=findReplacement(s);if(!el)return;
  if(el.value!==s.value)el.value=s.value;
  try{el.focus({preventScroll:true})}catch(_){try{el.focus()}catch(__){}}
  try{if(typeof el.setSelectionRange==='function'&&Number.isInteger(s.start))el.setSelectionRange(s.start,Number.isInteger(s.end)?s.end:s.start)}catch(_){}
  const delta=el.getBoundingClientRect().top-s.top;if(Math.abs(delta)>2)window.scrollBy({top:delta,left:0,behavior:'auto'});
  if(Math.abs(window.scrollY-s.y)>3)window.scrollTo({top:s.y,left:0,behavior:'auto'});
}
function scheduleRestore(s){requestAnimationFrame(()=>requestAnimationFrame(()=>restoreSnapshot(s)));setTimeout(()=>restoreSnapshot(s),35);setTimeout(()=>restoreSnapshot(s),110);setTimeout(()=>restoreSnapshot(s),240)}
document.addEventListener('input',event=>{if(editable(event.target)){const s=capture(event.target);scheduleRestore(s)}},true);
document.addEventListener('focusin',event=>{if(editable(event.target))capture(event.target)},true);
document.addEventListener('pointerdown',event=>{if(snapshot&&editable(document.activeElement)&&event.target!==document.activeElement){snapshot=null;serial++}},true);
window.NH7_ADMIN_REQUEST_SEARCH_VERSION=VERSION;
})();
