(()=>{'use strict';
if(window.__NH7_AUDIO_LIST_DETAIL_V445__)return;
window.__NH7_AUDIO_LIST_DETAIL_V445__=true;

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let timer=0;

function lang(){
  const x=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';
  return ['fa','en','hr'].includes(x)?x:'en';
}
function L(fa,en,hr){return lang()==='fa'?fa:lang()==='hr'?hr:en}
function rawCardId(card){return String(card?.dataset?.sermonCard||'')}
function sermonId(card){const id=rawCardId(card);return UUID.test(id)?id:''}
function isAudioMessageCard(card){
  const id=rawCardId(card);
  return !!id&&!card.classList.contains('school-audio-card')&&!id.startsWith('bible-');
}
function mappedTitle(card){
  const id=rawCardId(card),m=window.__sermonMap?.[id]||{},key='title_'+lang();
  return String(m?.[key]||m?.title_fa||m?.title_en||m?.title_hr||card.querySelector('.sermon-card-copy strong,strong')?.textContent||L('موعظه صوتی','Audio sermon','Audio propovijed')).trim();
}
function durationText(card){
  return String(card.querySelector('.sermon-card-copy small')?.textContent||'').trim();
}
function requestedId(){
  try{
    const id=new URL(location.href).searchParams.get('sermon')||'';
    return UUID.test(id)?id:'';
  }catch(_){return''}
}
function addStyle(){
  if(document.getElementById('nh7AudioListDetailV445Style'))return;
  const s=document.createElement('style');
  s.id='nh7AudioListDetailV445Style';
  s.textContent=`
  .sermon-list{display:grid!important;gap:8px!important}
  .sermon-card.nh7-audio-item-v445{padding:0!important;overflow:hidden;border-radius:16px!important}
  .nh7-audio-row-v445{width:100%;display:grid;grid-template-columns:1fr auto;align-items:center;gap:12px;padding:14px 15px;border:0;background:var(--card);color:var(--ink);text-align:start;font:inherit;cursor:pointer}
  .nh7-audio-row-copy-v445{min-width:0;display:grid;gap:4px}
  .nh7-audio-row-copy-v445 strong{font-size:.98rem;line-height:1.5;white-space:normal}
  .nh7-audio-row-copy-v445 small{color:var(--muted);font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .nh7-audio-chevron-v445{font-size:1.25rem;color:var(--muted);transition:transform .16s ease}
  .nh7-audio-item-v445.is-open>.nh7-audio-row-v445{background:color-mix(in srgb,var(--brand) 8%,var(--card));border-bottom:1px solid var(--line)}
  .nh7-audio-item-v445.is-open>.nh7-audio-row-v445 .nh7-audio-chevron-v445{transform:rotate(180deg)}
  .nh7-audio-item-v445:not(.is-open)>:not(.nh7-audio-row-v445){display:none!important}
  .nh7-audio-item-v445.is-open>.sermon-card-main{padding:14px 14px 4px}
  .nh7-audio-item-v445.is-open>.sermon-card-main .sermon-card-copy>strong{display:none!important}
  .nh7-audio-item-v445.is-open>.inline-sermon-player,
  .nh7-audio-item-v445.is-open>[data-classic-player],
  .nh7-audio-item-v445.is-open>[data-nh7-social-v440]{margin-left:14px;margin-right:14px}
  .nh7-audio-item-v445.is-open>[data-nh7-social-v440]{margin-bottom:14px}
  html[data-nh7-theme="dark"] .nh7-audio-row-v445{background:var(--nh7-dark-card,#101d2d);color:var(--nh7-dark-ink,#eef6ff)}
  html[data-nh7-theme="dark"] .nh7-audio-item-v445.is-open>.nh7-audio-row-v445{background:color-mix(in srgb,var(--brand) 16%,#101d2d)}
  @media(max-width:480px){
    .nh7-audio-row-v445{padding:13px}
    .nh7-audio-row-copy-v445 strong{font-size:.93rem}
    .nh7-audio-item-v445.is-open>.sermon-card-main{padding:12px 12px 4px}
    .nh7-audio-item-v445.is-open>.inline-sermon-player,
    .nh7-audio-item-v445.is-open>[data-classic-player],
    .nh7-audio-item-v445.is-open>[data-nh7-social-v440]{margin-left:12px;margin-right:12px}
  }
  @media(prefers-reduced-motion:reduce){.nh7-audio-chevron-v445{transition:none}}
  `;
  document.head.appendChild(s);
}
function closeOthers(card){
  card.closest('.sermon-list')?.querySelectorAll('.nh7-audio-item-v445.is-open').forEach(x=>{
    if(x!==card){
      x.classList.remove('is-open');
      x.querySelector('.nh7-audio-row-v445')?.setAttribute('aria-expanded','false');
    }
  });
}
function setOpen(card,open,scroll=false){
  if(!card)return;
  if(open)closeOthers(card);
  card.classList.toggle('is-open',!!open);
  card.querySelector('.nh7-audio-row-v445')?.setAttribute('aria-expanded',open?'true':'false');
  if(open){
    setTimeout(()=>{
      window.NH7_SERMON_SOCIAL_PATCH?.();
      if(sermonId(card))window.NH7_SERMON_SOCIAL_REFRESH_CARD?.(card);
    },0);
  }
  if(open&&scroll)setTimeout(()=>card.scrollIntoView({behavior:'smooth',block:'start'}),70);
}
function ensure(card){
  if(!isAudioMessageCard(card))return;
  card.classList.add('nh7-audio-item-v445');
  let row=card.querySelector(':scope > .nh7-audio-row-v445');
  const title=mappedTitle(card),meta=durationText(card);
  if(!row){
    row=document.createElement('button');
    row.type='button';
    row.className='nh7-audio-row-v445';
    row.setAttribute('aria-expanded','false');
    row.innerHTML='<span class="nh7-audio-row-copy-v445"><strong></strong><small></small></span><span class="nh7-audio-chevron-v445" aria-hidden="true">⌄</span>';
    row.addEventListener('click',()=>{
      const open=!card.classList.contains('is-open');
      setOpen(card,open,false);
    });
    card.prepend(row);
  }
  row.querySelector('strong').textContent=title;
  const small=row.querySelector('small');
  if(small){
    small.textContent=meta||L('برای باز کردن موعظه لمس کنید','Tap to open sermon','Dodirnite za otvaranje');
  }
  const requested=requestedId();
  if(requested&&requested===sermonId(card)&&!card.dataset.nh7RequestedOpened){
    card.dataset.nh7RequestedOpened='1';
    setOpen(card,true,true);
  }
}
function patch(){
  addStyle();
  document.querySelectorAll('[data-sermon-card]').forEach(ensure);
  window.NH7_SERMON_SOCIAL_PATCH?.();
}
new MutationObserver(()=>{
  clearTimeout(timer);
  timer=setTimeout(patch,70);
}).observe(document.documentElement,{childList:true,subtree:true});
window.NH7_AUDIO_LIST_DETAIL_PATCH=patch;
window.addEventListener('pageshow',patch);
window.addEventListener('popstate',()=>setTimeout(patch,80));
addStyle();
patch();
window.NH7_AUDIO_LIST_DETAIL_VERSION='4.4.6';
})();