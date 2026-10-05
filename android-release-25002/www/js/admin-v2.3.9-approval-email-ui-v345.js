/* New Hope 7 Admin v3.4.5 — approval email UI only: transient warnings + official sender */
(()=>{'use strict';
const VERSION='3.4.5-approval-email-ui';
const OFFICIAL_SENDER='omideno7church@gmail.com';
const OFFICIAL_NAME='New Hope 7 Church';
function L(fa,en,hr){return typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en}
function escapeHtml(v){return String(v||'').replace(/[<>&]/g,s=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]))}
function stripPersistentEmailWarning(html){
  return String(html||'').replace(/<div class="notice small" style="margin-top:8px">⚠️[\s\S]*?<\/div>/g,'');
}
function wrapRequestCard(){
  if(typeof window.renderRequestCard!=='function'||window.renderRequestCard.__nh7ApprovalEmailUiV345)return false;
  const original=window.renderRequestCard;
  const wrapped=function(row){
    let html=stripPersistentEmailWarning(original.apply(this,arguments));
    const approved=String(row?.status||'').trim().toLowerCase()==='approved'||(typeof getEffectiveStatus==='function'&&String(getEffectiveStatus(row)||'').trim().toLowerCase()==='approved');
    if(approved&&html.includes('nh7ResendApprovalEmail(')&&!html.includes('nh7-email-official-sender')){
      const sender=`<div class="nh7-email-official-sender small" style="margin:8px 0;color:#667085">${L('فرستنده رسمی:','Official sender:','Službeni pošiljatelj:')} <b>${escapeHtml(OFFICIAL_NAME)}</b> &lt;${escapeHtml(OFFICIAL_SENDER)}&gt;</div>`;
      html=html.replace(/(<button[^>]+onclick="nh7ResendApprovalEmail\()/,sender+'$1');
    }
    return html;
  };
  wrapped.__nh7ApprovalEmailUiV345=true;
  window.renderRequestCard=wrapped;
  try{renderRequestCard=wrapped}catch(_){}
  try{if(typeof render==='function')render()}catch(_){}
  return true;
}
let attempts=0;
const timer=setInterval(()=>{attempts++;if(wrapRequestCard()||attempts>40)clearInterval(timer)},250);
wrapRequestCard();
window.NH7_ADMIN_APPROVAL_EMAIL_UI_VERSION=VERSION;
})();
