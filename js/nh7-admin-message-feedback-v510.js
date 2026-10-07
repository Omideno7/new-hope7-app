/* New Hope 7 Admin feedback colors v5.1.0
 * Success confirmations = green, errors = red, progress/info stays neutral.
 * Non-destructive UI-only layer.
 */
(()=>{'use strict';
if(window.__NH7_ADMIN_MESSAGE_FEEDBACK_V510__)return;
window.__NH7_ADMIN_MESSAGE_FEEDBACK_V510__=true;

const STYLE_ID='nh7AdminMessageFeedbackV510Css';
const SUCCESS='nh7-feedback-success';
const ERROR='nh7-feedback-error';
const NEUTRAL='nh7-feedback-neutral';

function ensureCss(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
    #adminMsg.${SUCCESS},
    .notice.${SUCCESS},
    [role="status"].${SUCCESS},
    [role="alert"].${SUCCESS}{
      background:#ecfdf3!important;
      color:#067647!important;
      border:1px solid #86efac!important;
      border-inline-start:5px solid #12b76a!important;
      border-radius:16px!important;
      padding:12px 14px!important;
      margin:10px 0!important;
      font-weight:800!important;
      box-shadow:0 6px 18px rgba(18,183,106,.08)!important;
    }
    #adminMsg.${ERROR},
    .notice.${ERROR},
    .notice.error,
    .notice.danger,
    [role="status"].${ERROR},
    [role="alert"].${ERROR}{
      background:#fef3f2!important;
      color:#b42318!important;
      border:1px solid #fda29b!important;
      border-inline-start:5px solid #d92d20!important;
      border-radius:16px!important;
      padding:12px 14px!important;
      margin:10px 0!important;
      font-weight:800!important;
      box-shadow:0 6px 18px rgba(217,45,32,.08)!important;
    }
    #adminMsg.success{background:#ecfdf3!important;color:#067647!important;border:1px solid #86efac!important;border-inline-start:5px solid #12b76a!important;border-radius:16px!important;padding:12px 14px!important;margin:10px 0!important}
    #adminMsg.danger,#adminMsg.error{background:#fef3f2!important;color:#b42318!important;border:1px solid #fda29b!important;border-inline-start:5px solid #d92d20!important;border-radius:16px!important;padding:12px 14px!important;margin:10px 0!important}
    .notice.success{background:#ecfdf3!important;color:#067647!important;border:1px solid #86efac!important;border-inline-start:5px solid #12b76a!important}
  `;
  document.head.appendChild(s);
}

function textOf(el){return String(el?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase()}
function hasAny(t,arr){return arr.some(x=>t.includes(x))}

const ERROR_WORDS=[
  'خطا','ناموفق','انجام نشد','پاک‌سازی نشد','حذف نشد','یافت نشد','اجازه ندار','مشکل',
  'error','failed','failure','could not','cannot','not authorized','missing','invalid',
  'greška','nije uspjelo','neuspje','nedostaje','nije moguće'
];
const PROGRESS_WORDS=[
  'در حال ','لطفاً صبر','بارگذاری','آماده‌سازی','در حال بررسی',
  'loading','preparing','publishing','saving','checking','processing','please wait',
  'učitavanje','priprema','objavljivanje','spremanje','provjera'
];
const SUCCESS_WORDS=[
  '✓','✅','موفق','انجام شد','ذخیره شد','حذف شد','پاک شد','منتشر شد','تأیید شد','هماهنگ است','وجود ندارد',
  'success','saved','deleted','removed','published','approved','completed','complete','matches the database','no orphan files',
  'uspješno','spremljeno','izbrisano','uklonjeno','objavljeno','odobreno','dovršeno','nema datoteka bez zapisa','odgovara bazi'
];

function paint(el,forced){
  if(!(el instanceof Element))return;
  const t=textOf(el);
  const cls=String(el.className||'').toLowerCase();
  let state=forced||'';
  if(!state){
    if(/(^|\s)(error|danger)(\s|$)/.test(cls)||hasAny(t,ERROR_WORDS))state='error';
    else if(hasAny(t,PROGRESS_WORDS))state='neutral';
    else if(/(^|\s)success(\s|$)/.test(cls)||hasAny(t,SUCCESS_WORDS))state='success';
  }
  el.classList.remove(SUCCESS,ERROR,NEUTRAL);
  if(state==='success')el.classList.add(SUCCESS);
  else if(state==='error')el.classList.add(ERROR);
  else if(state==='neutral')el.classList.add(NEUTRAL);
}

function scan(root=document){
  ensureCss();
  const selectors=[
    '#adminMsg','#nh7StorageMsg','#nh7StorageAuditV509','#nh7StorageAuditV507','#nh7TestimonyMsg',
    '.notice.error','.notice.danger','.notice.success','[role="status"]','[role="alert"]'
  ].join(',');
  if(root instanceof Element&&root.matches?.(selectors))paint(root);
  root.querySelectorAll?.(selectors).forEach(paint);
}

function wrapSetMessage(){
  const old=window.setMessage;
  if(typeof old!=='function'||old.__nh7FeedbackV510)return false;
  function wrapped(msg,type='muted'){
    const out=old.apply(this,arguments);
    queueMicrotask(()=>{
      const el=document.getElementById('adminMsg');
      if(!el)return;
      const k=String(type||'').toLowerCase();
      paint(el,k==='success'?'success':(k==='danger'||k==='error'?'error':''));
    });
    return out;
  }
  wrapped.__nh7FeedbackV510=true;
  wrapped.__nh7Original=old;
  window.setMessage=wrapped;
  return true;
}

function boot(){
  ensureCss();
  wrapSetMessage();
  scan();
}

const mo=new MutationObserver(muts=>{
  wrapSetMessage();
  for(const m of muts){
    if(m.type==='characterData'){paint(m.target.parentElement);continue}
    if(m.target instanceof Element)paint(m.target);
    m.addedNodes?.forEach(n=>{if(n instanceof Element)scan(n)});
  }
});
mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
setTimeout(boot,400);
setTimeout(boot,1200);

window.NH7AdminMessageFeedbackV510={scan,paint,VERSION:'5.1.0'};
})();
