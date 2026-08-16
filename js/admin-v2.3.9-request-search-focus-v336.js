/* New Hope 7 Admin v3.3.6 — request search keeps focus and filters in place */
(()=>{'use strict';
const VERSION='3.3.6-request-search-focus';
if(typeof renderRequests!=='function')return;
const normalize=value=>String(value??'').toLocaleLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200f\u202a-\u202e]/g,' ').replace(/\s+/g,' ').trim();
function emptyLabel(){try{return typeof tr==='function'?tr('empty'):(typeof lang!=='undefined'&&lang==='fa'?'موردی پیدا نشد.':typeof lang!=='undefined'&&lang==='hr'?'Nema rezultata.':'No results found.')}catch(_){return'No results found.'}}
function filterRequests(input){
  if(typeof currentSearch!=='undefined')currentSearch=input.value;
  const panel=input.closest('.panel-card');if(!panel)return;
  const query=normalize(input.value),cards=[...panel.querySelectorAll('.request-card')];let visible=0;
  for(const card of cards){const match=!query||normalize(card.textContent).includes(query);card.hidden=!match;if(match)visible++}
  let empty=panel.querySelector('.nh7-request-search-empty-v336');
  if(!empty){empty=document.createElement('div');empty.className='empty nh7-request-search-empty-v336 hidden';const toolbar=input.closest('.toolbar');(toolbar||panel).insertAdjacentElement('afterend',empty)}
  empty.textContent=emptyLabel();empty.classList.toggle('hidden',visible!==0||cards.length===0);
}
window.nh7RequestSearchV336=filterRequests;
const previousRenderRequests=renderRequests;
renderRequests=window.renderRequests=function(approvedOnly=false){
  let html=previousRenderRequests.apply(this,arguments);
  if(!approvedOnly){
    html=html.replace('oninput="currentSearch=this.value;render()"','id="nh7RequestSearchV336" autocomplete="off" autocapitalize="off" spellcheck="false" oninput="nh7RequestSearchV336(this)"');
  }
  return html;
};
window.NH7_ADMIN_REQUEST_SEARCH_VERSION=VERSION;
})();
