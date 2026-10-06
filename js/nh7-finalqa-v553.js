/* New Hope 7 v5.5.3 — small final-QA runtime helpers. */
(()=>{'use strict';
if(window.__NH7_FINALQA_V553__)return;window.__NH7_FINALQA_V553__=true;
const L=(fa,en,hr)=>{const l=localStorage.getItem('nh7_lang')||'en';return l==='fa'?fa:l==='hr'?hr:en};
let scale=1,startDist=0,startScale=1;
function viewer(){
 let m=document.getElementById('nh7ProfileViewer553');if(m)return m;
 m=document.createElement('div');m.id='nh7ProfileViewer553';m.className='nh7-profile-viewer553';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');
 m.innerHTML='<img id="nh7ProfileViewerImage553" alt=""><div class="nh7-photo-tools553"><button type="button" data-photo-minus553 aria-label="Zoom out">−</button><button type="button" data-photo-reset553>100%</button><button type="button" data-photo-plus553 aria-label="Zoom in">+</button><button type="button" data-photo-close553>✕</button></div>';
 document.body.appendChild(m);
 const img=m.querySelector('img'),reset=m.querySelector('[data-photo-reset553]');
 const apply=()=>{scale=Math.max(1,Math.min(4,scale));m.style.setProperty('--nh7-photo-scale',String(scale));reset.textContent=Math.round(scale*100)+'%'};
 m.addEventListener('click',e=>{if(e.target===m||e.target.closest('[data-photo-close553]')){m.classList.remove('open');return}if(e.target.closest('[data-photo-plus553]')){scale+=.25;apply()}if(e.target.closest('[data-photo-minus553]')){scale-=.25;apply()}if(e.target.closest('[data-photo-reset553]')){scale=1;apply()}});
 m.addEventListener('touchstart',e=>{if(e.touches.length===2){const [a,b]=e.touches;startDist=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);startScale=scale}}, {passive:true});
 m.addEventListener('touchmove',e=>{if(e.touches.length===2&&startDist){e.preventDefault();const [a,b]=e.touches,d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);scale=startScale*(d/startDist);apply()}},{passive:false});
 m.openImage=src=>{if(!src)return;img.src=src;scale=1;apply();m.classList.add('open')};
 return m;
}
function enhanceCrop(){
 const range=document.getElementById('nh7c502Zoom');if(!range||range.dataset.v553)return;range.dataset.v553='1';
 const wrap=document.createElement('div');wrap.className='nh7-profile-zoom-controls553';wrap.innerHTML='<button type="button" data-crop-minus553>−</button><span>100%</span><button type="button" data-crop-plus553>+</button>';
 range.insertAdjacentElement('afterend',wrap);const label=wrap.querySelector('span');
 const set=v=>{range.value=String(Math.max(1,Math.min(3,Number(v)||1)));range.dispatchEvent(new Event('input',{bubbles:true}));label.textContent=Math.round(Number(range.value)*100)+'%'};
 wrap.addEventListener('click',e=>{if(e.target.closest('[data-crop-minus553]'))set(Number(range.value)-.2);if(e.target.closest('[data-crop-plus553]'))set(Number(range.value)+.2)});
 range.addEventListener('input',()=>{label.textContent=Math.round(Number(range.value)*100)+'%'});label.textContent=Math.round(Number(range.value||1)*100)+'%';
}
function enhance(){enhanceCrop()}
document.addEventListener('click',e=>{const img=e.target.closest?.('#nh7c502Avatar img');if(img){e.preventDefault();e.stopPropagation();viewer().openImage(img.currentSrc||img.src)}},true);
new MutationObserver(enhance).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('nh7-account-data-restored-v553',()=>{setTimeout(()=>{window.NH7MyNotesV234?.renderNotesPanel?.();window.NH7NotesCategoriesV452?.enhance?.()},80)});
enhance();
})();
