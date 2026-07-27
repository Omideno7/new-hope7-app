import fs from 'node:fs';

const sourcePath='js/admin-v2.2.5.js';
const outputPath='js/admin-v2.2.5-v230.js';
let source=fs.readFileSync(sourcePath,'utf8');

const studentStart='/* ---------- Student modal: stable scrolling and closing on iPad ---------- */';
const studioStart='/* ---------- Standalone professional document studio ---------- */';
const a=source.indexOf(studentStart),b=source.indexOf(studioStart);
if(a<0||b<a)throw new Error('Could not locate v2.2.6 student modal block');
source=source.slice(0,a)+'/* Student profile handling replaced by the canonical v2.3.0 block below. */\n\n'+source.slice(b);

const v227Start=source.indexOf('/* iOS/iPad: do not freeze BODY with position:fixed; keep only the');
const v227EndMarker='window.closeStudentDashboard=closeStudentDetailV227;';
const v227End=source.indexOf(v227EndMarker,v227Start);
if(v227Start<0||v227End<v227Start)throw new Error('Could not locate v2.2.7 student subsection');
source=source.slice(0,v227Start)+source.slice(v227End+v227EndMarker.length);
source=source.replace('requestAnimationFrame(()=>{activateStudentScrollV227();ensurePreviewExitV227()});','requestAnimationFrame(ensurePreviewExitV227);');

const v228Marker='/* ============================================================\n   New Hope 7 Admin v2.2.8 — student detail scroll only';
const v228=source.indexOf(v228Marker);
if(v228<0)throw new Error('Could not locate v2.2.8 student block');
source=source.slice(0,v228).trimEnd()+'\n\n';

const canonical=String.raw`/* ============================================================
   New Hope 7 Admin v2.3.0 — canonical student profile
   One modal, one inner scroller, one close handler.
   ============================================================ */
(()=>{'use strict';
let nh7StudentScrollYV230=0;
let nh7StudentClosingV230=false;

function nh7StudentTextV230(fa,en,hr){try{return lang==='fa'?fa:lang==='hr'?hr:en}catch(_){return fa}}
function nh7StudentUnlockV230(){
  const html=document.documentElement,body=document.body;
  html.classList.remove('nh7-student-profile-open-v230');
  body.classList.remove('nh7-student-profile-open-v230','nh7-student-lock-v226','nh7-student-modal-open','nh7-student-detail-open-v227','nh7-student-detail-open-v228');
  html.style.removeProperty('overflow');html.style.removeProperty('overscroll-behavior');
  for(const p of ['position','top','left','right','width','overflow','overscroll-behavior'])body.style.removeProperty(p);
  body.style.removeProperty('--nh7-lock-scroll-y');
  requestAnimationFrame(()=>window.scrollTo(0,nh7StudentScrollYV230));
}
function nh7StudentLockV230(){
  if(!document.body.classList.contains('nh7-student-profile-open-v230'))nh7StudentScrollYV230=window.scrollY||document.documentElement.scrollTop||0;
  const html=document.documentElement,body=document.body;
  html.classList.add('nh7-student-profile-open-v230');body.classList.add('nh7-student-profile-open-v230');
  html.style.setProperty('overflow','hidden','important');html.style.setProperty('overscroll-behavior','none','important');
  body.style.setProperty('position','fixed','important');body.style.setProperty('top',(-nh7StudentScrollYV230)+'px','important');
  body.style.setProperty('left','0','important');body.style.setProperty('right','0','important');body.style.setProperty('width','100%','important');
  body.style.setProperty('overflow','hidden','important');body.style.setProperty('overscroll-behavior','none','important');
}
function nh7CloseStudentProfileV230(event){
  if(event){event.preventDefault?.();event.stopPropagation?.();event.stopImmediatePropagation?.()}
  if(nh7StudentClosingV230)return false;
  nh7StudentClosingV230=true;
  document.querySelector('.student-modal-backdrop')?.remove();
  try{selectedStudentEmail=''}catch(_){try{window.selectedStudentEmail=''}catch(__){}}
  nh7StudentUnlockV230();
  try{render()}catch(error){console.error('NH7 close student profile v2.3.0',error)}
  setTimeout(()=>{nh7StudentClosingV230=false},250);
  return false;
}
function nh7StudentBoundaryV230(scroller){
  if(scroller.dataset.nh7BoundaryV230==='1')return;
  scroller.dataset.nh7BoundaryV230='1';let lastY=0;
  scroller.addEventListener('touchstart',event=>{
    lastY=event.touches?.[0]?.clientY||0;
    const max=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
    if(max>0){if(scroller.scrollTop<=0)scroller.scrollTop=1;else if(scroller.scrollTop>=max)scroller.scrollTop=Math.max(1,max-1)}
  },{passive:true});
  scroller.addEventListener('touchmove',event=>{
    const y=event.touches?.[0]?.clientY||lastY,delta=y-lastY;lastY=y;
    const max=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
    if(max>0&&((scroller.scrollTop<=1&&delta>0)||(scroller.scrollTop>=max-1&&delta<0)))event.preventDefault();
  },{passive:false});
}
function nh7SetupStudentProfileV230(){
  const back=document.querySelector('.student-modal-backdrop');
  if(!back){nh7StudentUnlockV230();return}
  const modal=back.querySelector('.student-modal');if(!modal)return;
  nh7StudentLockV230();back.classList.add('nh7-student-backdrop-v230');back.setAttribute('role','dialog');back.setAttribute('aria-modal','true');
  const head=modal.querySelector(':scope > .student-modal-head')||modal.querySelector('.student-modal-head');
  let scroller=modal.querySelector(':scope > .nh7-student-scroll-v230');
  if(!scroller){
    scroller=document.createElement('div');scroller.className='nh7-student-scroll-v230';
    for(const node of Array.from(modal.childNodes)){if(node!==head)scroller.appendChild(node)}
    modal.appendChild(scroller);
  }
  const oldClose=head?.querySelector('.close-round,[data-nh7-close-student],[data-close-student],.nh7-student-close-v230');
  if(oldClose&&!oldClose.classList.contains('nh7-student-close-v230')){
    const close=oldClose.cloneNode(true);close.textContent='×';close.className='nh7-student-close-v230';close.type='button';
    close.removeAttribute('onclick');close.removeAttribute('data-nh7-close-student');close.removeAttribute('data-close-student');
    close.setAttribute('aria-label',nh7StudentTextV230('بستن پرونده دانشجو','Close student profile','Zatvori profil učenika'));
    close.onclick=nh7CloseStudentProfileV230;close.onpointerup=nh7CloseStudentProfileV230;oldClose.replaceWith(close);
  }else if(oldClose){oldClose.onclick=nh7CloseStudentProfileV230;oldClose.onpointerup=nh7CloseStudentProfileV230}
  nh7StudentBoundaryV230(scroller);
  if(!scroller.dataset.nh7OpenedV230){scroller.dataset.nh7OpenedV230='1';scroller.scrollTop=0}
  try{
    const email=String(selectedStudentEmail||'').trim().toLowerCase();
    state.studentActivityV223=state.studentActivityV223&&typeof state.studentActivityV223==='object'?state.studentActivityV223:{};
    if(email&&!state.studentActivityV223[email]&&typeof window.nh7LoadStudentV223==='function')window.nh7LoadStudentV223(email,true).catch(console.warn);
  }catch(error){console.warn('NH7 student analytics v2.3.0',error)}
}
const nh7RenderBeforeStudentV230=render;
render=function(){const result=nh7RenderBeforeStudentV230();requestAnimationFrame(nh7SetupStudentProfileV230);return result};
const nh7StudentObserverV230=new MutationObserver(()=>requestAnimationFrame(nh7SetupStudentProfileV230));
nh7StudentObserverV230.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',event=>{const close=event.target.closest?.('.nh7-student-close-v230');if(close)nh7CloseStudentProfileV230(event)},true);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.querySelector('.student-modal-backdrop'))nh7CloseStudentProfileV230(event)},true);
window.closeStudentDashboard=nh7CloseStudentProfileV230;
requestAnimationFrame(nh7SetupStudentProfileV230);
window.NH7_ADMIN_VERSION='2.3.0';
})();
`;
source+=canonical;
fs.writeFileSync(outputPath,source,'utf8');

let admin=fs.readFileSync('admin.html','utf8');
admin=admin.replace(/<script\s+src=["']js\/admin-v2\.2\.5\.js[^"']*["']><\/script>/i,'<script src="js/admin-v2.2.5-v230.js?v=2.3.0"></script>');
if(!admin.includes('admin-v2.3.0-student-profile.css'))admin=admin.replace('</head>','  <link rel="stylesheet" href="css/admin-v2.3.0-student-profile.css?v=2.3.0">\n</head>');
fs.writeFileSync('admin.html',admin,'utf8');
console.log('Generated',outputPath,'and updated admin.html');
