/* New Hope 7 v5.5.8 — measure exact mini-player dock position. */
(()=>{'use strict';
if(window.__NH7_MINI_DOCK_V558__)return;window.__NH7_MINI_DOCK_V558__=true;

let raf=0;
function syncMiniDock(){
  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(()=>{
    const nav=document.querySelector('.bottom-nav');
    if(!nav)return;
    const r=nav.getBoundingClientRect();
    if(!r.height||r.top<=0)return;

    // Distance from viewport bottom to the visual top of the fixed navigation.
    // Add only a tiny 3px breathing gap so the mini player looks docked, not floating.
    const visualViewportHeight=window.visualViewport?.height || window.innerHeight;
    const viewportOffsetTop=window.visualViewport?.offsetTop || 0;
    const viewportBottom=viewportOffsetTop + visualViewportHeight;
    const dock=Math.max(0,Math.round(viewportBottom-r.top+3));
    document.documentElement.style.setProperty('--nh7-mini-dock-bottom',dock+'px');
  });
}

addEventListener('resize',syncMiniDock,{passive:true});
addEventListener('orientationchange',()=>setTimeout(syncMiniDock,100),{passive:true});
addEventListener('pageshow',syncMiniDock,{passive:true});
window.visualViewport?.addEventListener('resize',syncMiniDock,{passive:true});
window.visualViewport?.addEventListener('scroll',syncMiniDock,{passive:true});

const mo=new MutationObserver(syncMiniDock);
mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',syncMiniDock,{once:true});
}else{
  syncMiniDock();
}
setTimeout(syncMiniDock,120);
setTimeout(syncMiniDock,500);
})();

/* New Hope 7 v5.5.9 — notification inbox presentation polish.
 * UI-only. Does not change notification delivery, receipts, Supabase, OneSignal,
 * message deletion, read state, timestamps, or stored inbox data.
 */
(()=>{'use strict';
if(window.__NH7_INBOX_POLISH_V559__)return;window.__NH7_INBOX_POLISH_V559__=true;

const TECHNICAL_NOTES=new Set([
  'Automatic push sending uses OneSignal + Supabase Edge Function. This inbox also keeps messages inside the app.',
  'ارسال خودکار اعلان‌ها با OneSignal و Supabase Edge Function انجام می‌شود. این صندوق، پیام‌ها را داخل اپ هم نگه می‌دارد.',
  'Automatsko slanje push obavijesti koristi OneSignal + Supabase Edge Function. Ova ulazna pošta čuva poruke i u aplikaciji.'
]);

function ensureStyle(){
  if(document.getElementById('nh7InboxPolish559Style'))return;
  const style=document.createElement('style');
  style.id='nh7InboxPolish559Style';
  style.textContent=`
    .nh7-inbox559 .button-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0 14px}
    .nh7-inbox559 .button-row .badge{margin-inline-end:auto}
    .nh7-inbox559 .button-row button{min-height:40px;border-radius:12px}
    .nh7-inbox559 .inbox-list{display:grid;gap:10px}
    .nh7-inbox559 .inbox-list>.inbox-item{margin:0;border:1px solid color-mix(in srgb,var(--brand,#1858a4) 16%,transparent);border-radius:18px;overflow:hidden;background:var(--card,#fff);box-shadow:0 8px 24px rgba(15,23,42,.06)}
    .nh7-inbox559 .inbox-list>.inbox-item.unread{border-color:color-mix(in srgb,var(--brand,#1858a4) 42%,transparent);box-shadow:0 9px 26px color-mix(in srgb,var(--brand,#1858a4) 10%,transparent)}
    .nh7-inbox559 .inbox-list>.inbox-item>button.inbox-item{width:100%;margin:0;padding:14px 15px;border:0;border-radius:0;background:transparent;box-shadow:none;display:flex;flex-direction:column;align-items:stretch;gap:7px;text-align:start}
    .nh7-inbox559 .inbox-list>.inbox-item>button.inbox-item strong{line-height:1.45;font-size:1rem}
    .nh7-inbox559 .inbox-list>.inbox-item>button.inbox-item small{display:block;opacity:.72;font-size:.82rem;line-height:1.35;font-variant-numeric:tabular-nums}
    .nh7-inbox559 .inbox-list>.inbox-item>button.inbox-item small::before{content:'◷ ';opacity:.8}
    .nh7-inbox559 .accordion-panel{margin:0;padding:0 15px 14px;border:0;background:transparent}
    .nh7-inbox559 .accordion-panel p{margin:0 0 12px;line-height:1.7}
    .nh7-inbox559 .accordion-panel .danger-btn{min-height:38px;border-radius:11px}
    [dir='rtl'] .nh7-inbox559 .inbox-list>.inbox-item>button.inbox-item{text-align:right}
    @media (max-width:620px){.nh7-inbox559 .button-row .badge{width:100%;margin-inline-end:0}.nh7-inbox559 .button-row button{flex:1 1 46%}}
  `;
  document.head.appendChild(style);
}

function polishInbox(){
  const markAll=document.getElementById('markAllRead');
  if(!markAll)return false;
  const card=markAll.closest('.card')||markAll.parentElement?.parentElement;
  if(!card)return false;
  card.classList.add('nh7-inbox559');
  card.querySelectorAll('p.muted').forEach(p=>{
    if(TECHNICAL_NOTES.has(String(p.textContent||'').trim()))p.remove();
  });
  card.querySelectorAll('.inbox-list>.inbox-item').forEach(item=>{
    item.setAttribute('data-nh7-inbox-card','1');
  });
  return true;
}

let scheduled=false;
function schedule(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;ensureStyle();polishInbox()});
}
function start(){
  ensureStyle();polishInbox();
  const view=document.getElementById('view');
  if(view)new MutationObserver(schedule).observe(view,{subtree:true,childList:true});
  document.getElementById('langSelect')?.addEventListener('change',()=>setTimeout(schedule,0));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.NH7InboxPolishV559={VERSION:'5.5.9',polish:polishInbox};
})();

/* New Hope 7 v5.6.0 — unified Home search.
 * Safe presentation/search layer only. Reuses the existing Bible and Audio routes,
 * reads existing local notes/bookmarks/catalog caches, and never mutates user data.
 */
(()=>{'use strict';
if(window.__NH7_GLOBAL_SEARCH_V560__)return;window.__NH7_GLOBAL_SEARCH_V560__=true;

const VERSION='5.6.0';
let debounceTimer=0,observerQueued=false;
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ').trim();
const clip=(value,max=96)=>{const s=String(value??'').replace(/\s+/g,' ').trim();return s.length>max?s.slice(0,max-1)+'…':s};

function ensureStyle(){
  if(document.getElementById('nh7GlobalSearch560Style'))return;
  const style=document.createElement('style');
  style.id='nh7GlobalSearch560Style';
  style.textContent=`
    .nh7-global-search560{margin:0 0 14px;padding:14px;border:1px solid color-mix(in srgb,var(--brand,#1858a4) 18%,transparent);border-radius:20px;background:var(--card,#fff);box-shadow:0 9px 28px rgba(15,23,42,.055)}
    .nh7-global-search560-head{display:flex;align-items:center;gap:9px;margin-bottom:9px}.nh7-global-search560-head span{font-size:1.12rem}.nh7-global-search560-head strong{font-size:.96rem}
    .nh7-global-search560-box{position:relative}.nh7-global-search560-box input{width:100%;min-height:47px;padding-inline:42px 13px;border-radius:15px}.nh7-global-search560-box>span{position:absolute;inset-inline-start:14px;top:50%;transform:translateY(-50%);pointer-events:none;opacity:.72}
    .nh7-global-search560-results{display:grid;gap:7px;margin-top:9px}.nh7-global-search560-results[hidden]{display:none!important}
    .nh7-global-search560-row{width:100%;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:9px;padding:9px 10px;border:1px solid color-mix(in srgb,var(--brand,#1858a4) 13%,transparent);border-radius:13px;background:color-mix(in srgb,var(--card,#fff) 94%,var(--brand,#1858a4));color:inherit;text-align:start}
    .nh7-global-search560-row:hover,.nh7-global-search560-row:focus-visible{border-color:color-mix(in srgb,var(--brand,#1858a4) 42%,transparent);outline:none}
    .nh7-global-search560-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:color-mix(in srgb,var(--brand,#1858a4) 10%,transparent);font-size:1rem}.nh7-global-search560-copy{min-width:0}.nh7-global-search560-copy strong,.nh7-global-search560-copy small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nh7-global-search560-copy strong{font-size:.82rem}.nh7-global-search560-copy small{margin-top:2px;font-size:.68rem;opacity:.68}.nh7-global-search560-kind{font-size:.6rem;opacity:.64;white-space:nowrap}
    .nh7-global-search560-empty{padding:8px 3px;font-size:.76rem;opacity:.68}
    [dir='rtl'] .nh7-global-search560-row{text-align:right}
  `;
  document.head.appendChild(style);
}

function audioCatalog(){
  try{const d=window.nh7ReadAudioCatalogCacheV446?.();if(d?.sermons?.length)return d}catch(_){}
  for(const [store,key] of [[sessionStorage,'nh7_audio_catalog_cache_v446'],[localStorage,'nh7_audio_catalog_cache_v470']]){
    try{const d=JSON.parse(store.getItem(key)||'null');if(d?.sermons?.length)return d}catch(_){}
  }
  return {categories:[],sermons:[]};
}
function noteText(raw){
  if(typeof raw!=='string')return'';
  try{const x=JSON.parse(raw);if(x&&typeof x==='object')return String(x.note??x.text??x.value??'')}catch(_){}
  return raw;
}
function localNotes(q){
  const out=[],needle=normalize(q);
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i)||'';
    if(!/^(nh7_bible_state_|nh7_sermon_note_|nh7_apo_note_v242:|nh7_gratitude_note_|nh7_note_)/.test(key))continue;
    let text='';
    try{text=noteText(localStorage.getItem(key))}catch(_){}
    if(!text||!normalize(text).includes(needle))continue;
    let icon='📝',kind=L('یادداشت','Note','Bilješka'),route='home',params={};
    if(key.startsWith('nh7_bible_state_')){icon='📖';kind=L('یادداشت آیه','Bible note','Bilješka stiha');route='bible';params={section:'written',q:key.replace(/^nh7_bible_state_/,'')}}
    else if(key.startsWith('nh7_sermon_note_')){icon='🎧';kind=L('یادداشت پیام','Audio note','Bilješka poruke');route='audio';params={open:key.replace(/^nh7_sermon_note_/,'')}}
    else if(key.startsWith('nh7_gratitude_note_')){icon='🙏';kind=L('یادداشت شکرگزاری','Gratitude note','Bilješka zahvalnosti');route='daily';params={tab:'gratitude'}}
    out.push({icon,kind,title:clip(text,72),sub:L('از یادداشت‌های شما','From your notes','Iz vaših bilješki'),route,params});
    if(out.length>=5)break;
  }
  return out;
}
function savedVerses(q){
  let refs=[];try{refs=JSON.parse(localStorage.getItem('nh7_bookmarks')||'[]')}catch(_){}
  const needle=normalize(q);
  return (Array.isArray(refs)?refs:[]).filter(ref=>normalize(ref).includes(needle)).slice(0,4).map(ref=>({icon:'★',kind:L('آیه ذخیره‌شده','Saved verse','Spremljeni stih'),title:String(ref),sub:L('باز کردن در کتاب مقدس','Open in Bible','Otvori u Bibliji'),route:'bible',params:{section:'written',q:String(ref)}}));
}
function audioMatches(q){
  const needle=normalize(q),sermons=audioCatalog().sermons||[];
  return sermons.map(item=>{
    const titles=[item.title_fa,item.title_en,item.title_hr,item.title].filter(Boolean);
    const hit=titles.some(x=>normalize(x).includes(needle));
    if(!hit)return null;
    const title=item['title_'+lang()]||item.title_fa||item.title_en||item.title_hr||item.title||L('پیام صوتی','Audio message','Audio poruka');
    return {icon:'🎧',kind:L('پیام صوتی','Audio','Audio'),title,sub:L('پخش یا باز کردن پیام','Open audio message','Otvori audio poruku'),route:'audio',params:{open:String(item.id||'')}};
  }).filter(Boolean).slice(0,5);
}
function go(route,params={}){
  try{if(typeof window.navigate==='function'){window.navigate(route,params);return}}catch(_){}
  const target=document.querySelector(`[data-route="${CSS.escape(route)}"],[data-go="${CSS.escape(route)}"]`);target?.click();
}
function rowHtml(item,index){return `<button type="button" class="nh7-global-search560-row" data-nh7gs-index="${index}"><span class="nh7-global-search560-icon">${esc(item.icon)}</span><span class="nh7-global-search560-copy"><strong>${esc(item.title)}</strong><small>${esc(item.sub||'')}</small></span><span class="nh7-global-search560-kind">${esc(item.kind||'')}</span></button>`}
function runSearch(root,value){
  const results=root?.querySelector('[data-nh7gs-results]');if(!results)return;
  const q=String(value||'').trim();
  if(q.length<2){root.__nh7Items=[];results.hidden=true;results.innerHTML='';return}
  const items=[...audioMatches(q),...savedVerses(q),...localNotes(q)];
  items.push({icon:'📖',kind:L('کتاب مقدس','Bible','Biblija'),title:L(`جستجوی «${q}» در تمام کتاب مقدس`,`Search the whole Bible for “${q}”`,`Pretraži cijelu Bibliju za „${q}”`),sub:L('نمایش نتایج آیات','Show verse results','Prikaži rezultate stihova'),route:'bible',params:{section:'written',q}});
  items.push({icon:'🎙',kind:L('پیام‌ها','Audio','Audio'),title:L(`جستجوی «${q}» در همه پیام‌های صوتی`,`Search all audio messages for “${q}”`,`Pretraži sve audio poruke za „${q}”`),sub:L('نمایش همه نتایج صوتی','Show all audio results','Prikaži sve audio rezultate'),route:'audio',params:{q}});
  root.__nh7Items=items.slice(0,12);
  results.innerHTML=root.__nh7Items.length?root.__nh7Items.map(rowHtml).join(''):`<div class="nh7-global-search560-empty">${esc(L('نتیجه‌ای پیدا نشد.','No results found.','Nema rezultata.'))}</div>`;
  results.hidden=false;
}
function mount(){
  ensureStyle();
  const view=document.getElementById('view'),homeMarker=document.getElementById('quickNotify');
  if(!view||!homeMarker)return false;
  if(document.getElementById('nh7GlobalSearch560'))return true;
  const root=document.createElement('section');root.id='nh7GlobalSearch560';root.className='nh7-global-search560';
  root.innerHTML=`<div class="nh7-global-search560-head"><span>⌕</span><strong>${esc(L('جستجوی همه‌جا','Search everywhere','Pretraži sve'))}</strong></div><div class="nh7-global-search560-box"><span>⌕</span><input type="search" data-nh7gs-input autocomplete="off" spellcheck="false" placeholder="${esc(L('کتاب مقدس، پیام‌های صوتی، آیات ذخیره‌شده و یادداشت‌ها…','Bible, audio messages, saved verses and notes…','Biblija, audio poruke, spremljeni stihovi i bilješke…'))}" aria-label="${esc(L('جستجوی سراسری','Global search','Globalno pretraživanje'))}"></div><div class="nh7-global-search560-results" data-nh7gs-results hidden></div>`;
  const firstCard=view.querySelector('.card');
  if(firstCard)firstCard.insertAdjacentElement('afterend',root);else view.prepend(root);
  const input=root.querySelector('[data-nh7gs-input]');
  input?.addEventListener('input',()=>{clearTimeout(debounceTimer);debounceTimer=setTimeout(()=>runSearch(root,input.value),160)});
  input?.addEventListener('keydown',event=>{if(event.key==='Enter'&&String(input.value||'').trim().length>=2){event.preventDefault();go('bible',{section:'written',q:String(input.value).trim()})}});
  root.addEventListener('click',event=>{const button=event.target.closest('[data-nh7gs-index]');if(!button)return;const item=root.__nh7Items?.[Number(button.dataset.nh7gsIndex)];if(item)go(item.route,item.params||{})});
  return true;
}
function scheduleMount(){
  if(observerQueued)return;observerQueued=true;
  requestAnimationFrame(()=>{observerQueued=false;mount()});
}
function start(){
  ensureStyle();mount();
  const view=document.getElementById('view');if(view)new MutationObserver(scheduleMount).observe(view,{subtree:true,childList:true});
  document.getElementById('langSelect')?.addEventListener('change',()=>setTimeout(()=>{document.getElementById('nh7GlobalSearch560')?.remove();mount()},0));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.NH7GlobalSearchV560={VERSION,mount,search:q=>{const root=document.getElementById('nh7GlobalSearch560');if(root)runSearch(root,q)}};
})();
