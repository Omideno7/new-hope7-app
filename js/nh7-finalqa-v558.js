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
