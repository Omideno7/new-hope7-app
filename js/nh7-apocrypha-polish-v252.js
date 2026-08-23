/* New Hope 7 v2.5.2 — presentation-only cleanup for the finished Apocrypha reader. */
(()=>{'use strict';
if(window.__NH7_APOCRYPHA_POLISH_V252__)return;window.__NH7_APOCRYPHA_POLISH_V252__=true;
const s=document.createElement('style');s.id='nh7-apocrypha-polish-v252';s.textContent=`
.nh7-apo-client-card>p.muted{display:none!important}
.nh7-apo-book>small{display:none!important}
.nh7-apo-reader-head p.muted{display:none!important}
.nh7-apo-book{min-height:84px}
.nh7-apo-reader-head>div{display:flex;align-items:center;min-height:44px}
`;document.head.appendChild(s);
function clean(){
  document.querySelectorAll('.nh7-apo-client-card>p.muted,.nh7-apo-book>small,.nh7-apo-reader-head p.muted').forEach(el=>{el.setAttribute('aria-hidden','true')});
}
let t=0;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(clean,20)}).observe(document.documentElement,{childList:true,subtree:true});
clean();window.NH7_APOCRYPHA_POLISH_VERSION='2.5.2';
})();
