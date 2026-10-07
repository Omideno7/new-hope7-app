/* New Hope 7 Admin feedback colors v5.1.1b
 * Success confirmations = green, errors = red, progress/info stays neutral.
 * Safe UI-only layer: no class-attribute observation and no storage/data logic changes.
 */
(()=>{'use strict';
if(window.__NH7_ADMIN_MESSAGE_FEEDBACK_V511__)return;
window.__NH7_ADMIN_MESSAGE_FEEDBACK_V511__=true;

const STYLE_ID='nh7AdminMessageFeedbackV511Css';
const SUCCESS='nh7-feedback-success';
const ERROR='nh7-feedback-error';
const NEUTRAL='nh7-feedback-neutral';
const ALL=[SUCCESS,ERROR,NEUTRAL];

function ensureCss(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
    #adminMsg.${SUCCESS},.notice.${SUCCESS},[role="status"].${SUCCESS},[role="alert"].${SUCCESS}{
      background:#ecfdf3!important;color:#067647!important;border:1px solid #86efac!important;border-inline-start:5px solid #12b76a!important;border-radius:16px!important;padding:12px 14px!important;margin:10px 0!important;font-weight:800!important;box-shadow:0 6px 18px rgba(18,183,106,.08)!important}
    #adminMsg.${ERROR},.notice.${ERROR},.notice.error,.notice.danger,[role="status"].${ERROR},[role="alert"].${ERROR}{
      background:#fef3f2!important;color:#b42318!important;border:1px solid #fda29b!important;border-inline-start:5px solid #d92d20!important;border-radius:16px!important;padding:12px 14px!important;margin:10px 0!important;font-weight:800!important;box-shadow:0 6px 18px rgba(217,45,32,.08)!important}
    #adminMsg.success,.notice.success{background:#ecfdf3!important;color:#067647!important;border:1px solid #86efac!important;border-inline-start:5px solid #12b76a!important;border-radius:16px!important;padding:12px 14px!important;margin:10px 0!important}
    #adminMsg.danger,#adminMsg.error{background:#fef3f2!important;color:#b42318!important;border:1px solid #fda29b!important;border-inline-start:5px solid #d92d20!important;border-radius:16px!important;padding:12px 14px!important;margin:10px 0!important}
  `;
  document.head.appendChild(s);
}

function textOf(el){return String(el?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase()}
function hasAny(t,arr){return arr.some(x=>t.includes(x))}
const ERROR_WORDS=['خطا','ناموفق','انجام نشد','پاک‌سازی نشد','حذف نشد','یافت نشد','اجازه ندار','مشکل','error','failed','failure','could not','cannot','not authorized','missing','invalid','greška','nije uspjelo','neuspje','nedostaje','nije moguće'];
const PROGRESS_WORDS=['در حال ','لطفاً صبر','بارگذاری','آماده‌سازی','در حال بررسی','loading','preparing','publishing','saving','checking','processing','please wait','učitavanje','priprema','objavljivanje','spremanje','provjera'];
const SUCCESS_WORDS=['✓','✅','موفق','انجام شد','ذخیره شد','حذف شد','پاک شد','منتشر شد','تأیید شد','هماهنگ است','وجود ندارد','success','saved','deleted','removed','published','approved','completed','complete','matches the database','no orphan files','uspješno','spremljeno','izbrisano','uklonjeno','objavljeno','odobreno','dovršeno','nema datoteka bez zapisa','odgovara bazi'];

function desiredState(el,forced){
  if(forced)return forced;
  const t=textOf(el),cls=String(el?.className||'').toLowerCase();
  if(/(^|\s)(error|danger)(\s|$)/.test(cls)||hasAny(t,ERROR_WORDS))return'error';
  if(hasAny(t,PROGRESS_WORDS))return'neutral';
  if(/(^|\s)success(\s|$)/.test(cls)||hasAny(t,SUCCESS_WORDS))return'success';
  return'';
}
function setI(el,key,value){try{el.style.setProperty(key,value,'important')}catch(_){}}
function clearFeedbackInline(el){
  for(const key of ['background','background-color','color','border','border-color','border-inline-start','border-inline-start-color','box-shadow']){
    try{el.style.removeProperty(key)}catch(_){}
  }
}
function applyInline(el,state){
  clearFeedbackInline(el);
  if(state==='success'){
    setI(el,'background','#ecfdf3');setI(el,'background-color','#ecfdf3');setI(el,'color','#067647');
    setI(el,'border','1px solid #86efac');setI(el,'border-inline-start','5px solid #12b76a');
    setI(el,'box-shadow','0 6px 18px rgba(18,183,106,.08)');
  }else if(state==='error'){
    setI(el,'background','#fef3f2');setI(el,'background-color','#fef3f2');setI(el,'color','#b42318');
    setI(el,'border','1px solid #fda29b');setI(el,'border-inline-start','5px solid #d92d20');
    setI(el,'box-shadow','0 6px 18px rgba(217,45,32,.08)');
  }
}
function paint(el,forced){
  if(!(el instanceof Element))return;
  const state=desiredState(el,forced);
  const wanted=state==='success'?SUCCESS:state==='error'?ERROR:state==='neutral'?NEUTRAL:'';
  ALL.forEach(c=>{if(c!==wanted&&el.classList.contains(c))el.classList.remove(c)});
  if(wanted&&!el.classList.contains(wanted))el.classList.add(wanted);
  applyInline(el,state);
}

const SELECTORS=['#adminMsg','#nh7StorageMsg','#nh7StorageAuditV509','#nh7StorageAuditV507','#nh7TestimonyMsg','.notice.error','.notice.danger','.notice.success','[role="status"]','[role="alert"]'].join(',');
function scan(root=document){
  ensureCss();
  if(root instanceof Element&&root.matches?.(SELECTORS))paint(root);
  root.querySelectorAll?.(SELECTORS).forEach(el=>paint(el));
}

function wrapSetMessage(){
  const old=window.setMessage;
  if(typeof old!=='function'||old.__nh7FeedbackV511)return false;
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
  wrapped.__nh7FeedbackV511=true;
  wrapped.__nh7Original=old;
  window.setMessage=wrapped;
  return true;
}

function boot(){ensureCss();wrapSetMessage();scan()}
const mo=new MutationObserver(muts=>{
  wrapSetMessage();
  for(const m of muts){
    if(m.type==='characterData'){const p=m.target.parentElement;if(p)paint(p);continue}
    if(m.target instanceof Element&&m.target.matches?.(SELECTORS))paint(m.target);
    m.addedNodes?.forEach(n=>{if(n instanceof Element)scan(n)});
  }
});
mo.observe(document.documentElement,{subtree:true,childList:true,characterData:true});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
setTimeout(boot,500);
window.NH7AdminMessageFeedbackV511={scan,paint,VERSION:'5.1.1b'};
})();
