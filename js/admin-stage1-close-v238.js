/* New Hope 7 — Stage 1 v2.3.8: independent viewport close control */
(()=>{'use strict';
const ID='nh7-student-close-portal-v238';
const PROFILE_SELECTORS=[
  '.nh7-student-overlay-v237',
  '.nh7-student-overlay-v236',
  '.nh7-student-overlay-v235',
  '.nh7-student-overlay-v234',
  '.nh7-student-overlay-v233',
  '.student-modal-backdrop'
].join(',');
let closing=false;

function isStudentProfile(node){
  if(!node||node.id==='nh7EmailModal')return false;
  const modal=node.querySelector?.('.student-modal');
  return !!modal&&!modal.classList.contains('email-modal');
}

function findProfile(){
  return Array.from(document.querySelectorAll(PROFILE_SELECTORS)).find(isStudentProfile)||null;
}

function unlockDocument(){
  const html=document.documentElement;
  const body=document.body;
  body.classList.remove(
    'nh7-student-lock-v226',
    'nh7-student-modal-open',
    'nh7-student-detail-open-v227',
    'nh7-student-detail-open-v228'
  );
  body.style.removeProperty('--nh7-lock-scroll-y');
  for(const prop of ['overflow','height'])html.style.removeProperty(prop);
  for(const prop of ['position','top','left','right','bottom','inset','width','height','overflow','touch-action']){
    body.style.removeProperty(prop);
  }
}

function clearStudentSelection(){
  try{selectedStudentEmail=''}catch(_){ }
  try{window.selectedStudentEmail=''}catch(_){ }
  try{Function("try{selectedStudentEmail=''}catch(_){ }")()}catch(_){ }
}

function closeProfile(event){
  event?.preventDefault?.();
  event?.stopPropagation?.();
  event?.stopImmediatePropagation?.();
  if(closing)return false;
  closing=true;

  document.querySelectorAll(PROFILE_SELECTORS).forEach(node=>{
    if(isStudentProfile(node)){
      node.style.setProperty('display','none','important');
      node.remove();
    }
  });
  document.getElementById(ID)?.remove();
  clearStudentSelection();
  unlockDocument();

  /* A clean reload resets the legacy lexical selection state that the old
     patch stack does not expose reliably. Login remains stored. */
  setTimeout(()=>{
    const url=new URL(location.href);
    url.searchParams.set('nh7-profile-closed',String(Date.now()));
    location.replace(url.toString());
  },80);
  return false;
}

function createPortalButton(){
  const button=document.createElement('button');
  button.id=ID;
  button.type='button';
  button.textContent='×';
  button.setAttribute('aria-label','بستن پروفایل دانشجو');
  button.setAttribute('title','بستن پروفایل');
  Object.assign(button.style,{
    position:'fixed',
    top:'calc(10px + env(safe-area-inset-top))',
    left:'12px',
    zIndex:'2147483647',
    display:'grid',
    placeItems:'center',
    width:'50px',
    height:'50px',
    minWidth:'50px',
    padding:'0',
    margin:'0',
    border:'3px solid #fff',
    borderRadius:'999px',
    background:'#b42318',
    color:'#fff',
    fontSize:'31px',
    fontWeight:'900',
    lineHeight:'1',
    boxShadow:'0 7px 24px rgba(0,0,0,.35)',
    cursor:'pointer',
    pointerEvents:'auto',
    touchAction:'manipulation',
    WebkitAppearance:'none',
    userSelect:'none'
  });
  button.onpointerdown=closeProfile;
  button.ontouchstart=closeProfile;
  button.onclick=closeProfile;
  return button;
}

function ensurePortal(){
  const profile=findProfile();
  let portal=document.getElementById(ID);
  if(!profile){
    portal?.remove();
    return;
  }

  /* Hide every legacy close control so the user only sees the independent
     viewport button, which is outside the conflicting modal event tree. */
  profile.querySelectorAll('.close-round,[data-nh7-close-student],[data-close-student],.nh7-student-close-v237').forEach(button=>{
    button.style.setProperty('display','none','important');
    button.setAttribute('aria-hidden','true');
  });

  if(!portal){
    portal=createPortalButton();
    document.body.appendChild(portal);
  }
}

const observer=new MutationObserver(()=>requestAnimationFrame(ensurePortal));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('orientationchange',()=>setTimeout(ensurePortal,150),{passive:true});
setInterval(ensurePortal,300);
requestAnimationFrame(ensurePortal);
window.NH7_CLOSE_PATCH_VERSION='2.3.8';
})();
