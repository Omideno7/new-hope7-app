/* New Hope 7 Admin v3.3.7 — request search keeps focus and scroll position */
(()=>{'use strict';
const VERSION='3.3.7-request-search-focus-scroll';
if(typeof renderRequests!=='function')return;
const normalize=value=>String(value??'').toLocaleLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200f\u202a-\u202e]/g,' ').replace(/\s+/g,' ').trim();
function emptyLabel(){try{return typeof tr==='function'?tr('empty'):(typeof lang!=='undefined'&&lang==='fa'?'موردی پیدا نشد.':typeof lang!=='undefined'&&lang==='hr'?'Nema rezultata.':'No results found.')}catch(_){return'No results found.'}}
function lockPanelHeight(panel){
  if(!panel||panel.dataset.nh7SearchHeightLocked==='1')return;
  const height=Math.ceil(panel.getBoundingClientRect().height);
  if(height>0){panel.style.minHeight=height+'px';panel.dataset.nh7SearchHeightLocked='1'}
}
function restoreViewport(input,y,top){
  const restore=()=>{
    if(!input?.isConnected)return;
    const currentTop=input.getBoundingClientRect().top;
    const delta=currentTop-top;
    if(Math.abs(delta)>1)window.scrollBy({top:delta,left:0,behavior:'auto'});
    if(Math.abs(window.scrollY-y)>2)window.scrollTo({top:y,left:0,behavior:'auto'});
    try{input.focus({preventScroll:true})}catch(_){input.focus()}
  };
  requestAnimationFrame(()=>requestAnimationFrame(restore));
  setTimeout(restore,45);
}
function filterRequests(input){
  if(!input)return;
  const y=window.scrollY,top=input.getBoundingClientRect().top;
  if(typeof currentSearch!=='undefined')currentSearch=input.value;
  const panel=input.closest('.panel-card');if(!panel)return;
  lockPanelHeight(panel);
  const query=normalize(input.value),cards=[...panel.querySelectorAll('.request-card')];let visible=0;
  for(const card of cards){const match=!query||normalize(card.textContent).includes(query);card.hidden=!match;if(match)visible++}
  let empty=panel.querySelector('.nh7-request-search-empty-v336');
  if(!empty){empty=document.createElement('div');empty.className='empty nh7-request-search-empty-v336 hidden';const toolbar=input.closest('.toolbar');(toolbar||panel).insertAdjacentElement('afterend',empty)}
  empty.textContent=emptyLabel();empty.classList.toggle('hidden',visible!==0||cards.length===0);
  if(!query){panel.style.minHeight='';delete panel.dataset.nh7SearchHeightLocked}
  restoreViewport(input,y,top);
}
window.nh7RequestSearchV336=filterRequests;
const previousRenderRequests=renderRequests;
renderRequests=window.renderRequests=function(approvedOnly=false){
  let html=previousRenderRequests.apply(this,arguments);
  if(!approvedOnly){
    html=html.replace('oninput="currentSearch=this.value;render()"','id="nh7RequestSearchV336" autocomplete="off" autocapitalize="off" spellcheck="false" onfocus="lockRequestSearchHeightV337(this)" oninput="nh7RequestSearchV336(this)"');
  }
  return html;
};
window.lockRequestSearchHeightV337=input=>lockPanelHeight(input?.closest?.('.panel-card'));
window.NH7_ADMIN_REQUEST_SEARCH_VERSION=VERSION;
})();
