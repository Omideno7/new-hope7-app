/* New Hope 7 — Stage 1 v2.3.9: native browser close link */
(()=>{'use strict';
const ID='nh7-native-close-v239';
const PROFILE_SELECTORS=[
  '.nh7-student-overlay-v237',
  '.nh7-student-overlay-v236',
  '.nh7-student-overlay-v235',
  '.nh7-student-overlay-v234',
  '.nh7-student-overlay-v233',
  '.student-modal-backdrop'
].join(',');

function isProfile(node){
  if(!node||node.id==='nh7EmailModal')return false;
  const modal=node.querySelector?.('.student-modal');
  return !!modal&&!modal.classList.contains('email-modal');
}

function findProfile(){
  return Array.from(document.querySelectorAll(PROFILE_SELECTORS)).find(isProfile)||null;
}

function createNativeClose(){
  const link=document.createElement('a');
  link.id=ID;
  link.href='admin-stage1-clean-v240.html?profileClosed='+Date.now();
  link.target='_self';
  link.rel='nofollow';
  link.textContent='×  بستن پروفایل';
  link.setAttribute('aria-label','بستن پروفایل دانشجو');
  Object.assign(link.style,{
    position:'fixed',
    top:'calc(10px + env(safe-area-inset-top))',
    left:'12px',
    zIndex:'2147483647',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    minWidth:'154px',
    height:'52px',
    padding:'0 16px',
    margin:'0',
    border:'3px solid #fff',
    borderRadius:'999px',
    background:'#b42318',
    color:'#fff',
    font:'900 16px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif',
    lineHeight:'1',
    textDecoration:'none',
    boxShadow:'0 8px 28px rgba(0,0,0,.38)',
    cursor:'pointer',
    pointerEvents:'auto',
    touchAction:'manipulation',
    WebkitTapHighlightColor:'transparent',
    WebkitAppearance:'none',
    userSelect:'none'
  });
  return link;
}

function ensureNativeClose(){
  const profile=findProfile();
  let link=document.getElementById(ID);
  if(!profile){link?.remove();return;}

  profile.querySelectorAll('.close-round,[data-nh7-close-student],[data-close-student],.nh7-student-close-v237').forEach(button=>{
    button.style.setProperty('display','none','important');
    button.setAttribute('aria-hidden','true');
  });

  if(!link){
    link=createNativeClose();
    document.body.appendChild(link);
  }
}

const observer=new MutationObserver(()=>requestAnimationFrame(ensureNativeClose));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('orientationchange',()=>setTimeout(ensureNativeClose,150),{passive:true});
setInterval(ensureNativeClose,300);
requestAnimationFrame(ensureNativeClose);
window.NH7_NATIVE_CLOSE_VERSION='2.3.9';
})();
