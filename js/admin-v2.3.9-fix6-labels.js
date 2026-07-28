/* New Hope 7 Admin — Fix 6 visible labels */
(()=>{'use strict';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
function apply(){
  const title=document.querySelector('.nh7-f4-head h2');if(title)title.textContent='🎨 '+L('استودیوی مستقل مدارک — Fix 6','Standalone Document Studio — Fix 6','Samostalni studio dokumenata — Fix 6');
  const card=document.querySelector('.nh7-f4-card strong');if(card)card.textContent='🎨 '+L('استودیوی مدارک Fix 6','Document Studio Fix 6','Studio dokumenata Fix 6');
  const badge=document.querySelector('.nh7-admin-version-v235');if(badge)badge.setAttribute('title','New Hope 7 v2.3.9 Fix 6');
}
const observer=new MutationObserver(()=>requestAnimationFrame(apply));observer.observe(document.documentElement,{childList:true,subtree:true});setInterval(apply,1600);setTimeout(apply,250);window.NH7_ADMIN_FIX6_LABELS=true;
})();