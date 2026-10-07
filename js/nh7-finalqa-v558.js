/* New Hope 7 v5.5.9 — precise mini-player dock + Android scroll compatibility + testimony compact UI. */
(()=>{'use strict';
if(window.__NH7_MINI_DOCK_V558__)return;window.__NH7_MINI_DOCK_V558__=true;

const isNativeAndroid=()=>{
  try{return !!window.Capacitor?.isNativePlatform?.() && window.Capacitor?.getPlatform?.()==='android'}catch(_){return false}
};

/*
  The iOS Final-QA styles intentionally disable root overscroll to suppress
  WKWebView rubber-banding. Some Samsung/Android System WebView builds handle
  root overscroll-behavior differently and can stop finger panning even though
  programmatic scrolling still works. Restore the Android browser default only
  on the native Android wrapper. Do not touch overflow/position because modal,
  reader and profile-crop flows legitimately use those for temporary locks.
*/
function ensureAndroidRootScroll(){
  if(!isNativeAndroid())return false;
  const root=document.documentElement,body=document.body;
  if(root.dataset.nh7AndroidScrollCompat==='1')return true;
  root.dataset.nh7NativeAndroid='1';
  root.style.setProperty('overscroll-behavior','auto','important');
  root.style.setProperty('overscroll-behavior-y','auto','important');
  if(body){
    body.style.setProperty('overscroll-behavior','auto','important');
    body.style.setProperty('overscroll-behavior-y','auto','important');
  }
  root.dataset.nh7AndroidScrollCompat='1';
  return true;
}

/*
  Amen is a fixed full-viewport dialog. The canonical app handler adds .hidden;
  this extra cleanup guarantees that after the user's Amen tap the invisible
  gate cannot remain in Android/Samsung hit-testing due to a compositor quirk.
*/
function cleanupAmenGate(){
  if(!isNativeAndroid())return;
  const gate=document.getElementById('amenGate');
  if(!gate)return;
  gate.classList.add('hidden');
  gate.setAttribute('aria-hidden','true');
  gate.style.setProperty('pointer-events','none','important');
  ensureAndroidRootScroll();
}

document.addEventListener('click',event=>{
  if(event.target?.closest?.('#amenButton'))setTimeout(cleanupAmenGate,0);
},true);

let raf=0;
function syncMiniDock(){
  ensureAndroidRootScroll();
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
    const value=dock+'px';
    if(document.documentElement.style.getPropertyValue('--nh7-mini-dock-bottom')!==value){
      document.documentElement.style.setProperty('--nh7-mini-dock-bottom',value);
    }
  });
}

/* Testimony UI v5.5.9
   Keep the submission form collapsed until requested and keep published
   testimony rows compact; details/audio expand only after the user taps one. */
function testimonyLang(){
  const x=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';
  return ['fa','en','hr'].includes(x)?x:'en';
}
function testimonyText(fa,en,hr){const x=testimonyLang();return x==='fa'?fa:x==='hr'?hr:en}
function ensureTestimonyCss(){
  if(document.getElementById('nh7TestimonyCompactV559Css'))return;
  const s=document.createElement('style');s.id='nh7TestimonyCompactV559Css';s.textContent=`
    .nh7-testimony-compose-v559,.nh7-testimony-public-v559{border:1px solid color-mix(in srgb,var(--text) 13%,transparent);border-radius:16px;background:color-mix(in srgb,var(--card) 97%,var(--accent) 3%);overflow:hidden}
    .nh7-testimony-compose-v559>summary,.nh7-testimony-public-v559>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px;font-weight:850}
    .nh7-testimony-compose-v559>summary::-webkit-details-marker,.nh7-testimony-public-v559>summary::-webkit-details-marker{display:none}
    .nh7-testimony-compose-v559>summary::after,.nh7-testimony-public-v559>summary::after{content:'⌄';font-size:1.05rem;transition:transform .18s ease;opacity:.75}
    .nh7-testimony-compose-v559[open]>summary::after,.nh7-testimony-public-v559[open]>summary::after{transform:rotate(180deg)}
    .nh7-testimony-compose-body-v559{padding:4px 14px 14px;border-top:1px solid color-mix(in srgb,var(--text) 9%,transparent)}
    .nh7-testimony-public-v559{margin:8px 0}
    .nh7-testimony-public-v559>summary{padding:11px 13px}
    .nh7-testimony-public-main-v559{display:flex;min-width:0;align-items:center;gap:9px}
    .nh7-testimony-public-icon-v559{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:color-mix(in srgb,var(--accent) 16%,var(--card));flex:0 0 auto}
    .nh7-testimony-public-title-v559{min-width:0;display:grid;gap:2px}
    .nh7-testimony-public-title-v559 strong{font-size:.94rem;white-space:normal;line-height:1.45}
    .nh7-testimony-public-title-v559 small{color:var(--muted);font-size:.76rem}
    .nh7-testimony-public-body-v559{padding:0 13px 13px;border-top:1px solid color-mix(in srgb,var(--text) 9%,transparent)}
    .nh7-testimony-public-body-v559 p{white-space:pre-wrap;line-height:1.75;margin:10px 0;color:var(--muted)}
    .nh7-testimony-public-body-v559 audio{width:100%;margin-top:8px}
  `;document.head.appendChild(s)
}
function compactTestimonyUi(){
  ensureTestimonyCss();
  const titleInput=document.getElementById('nh7c502Title');
  const composerCard=titleInput?.closest?.('.card');
  if(composerCard&&!composerCard.dataset.nh7TestimonyComposerV559){
    composerCard.dataset.nh7TestimonyComposerV559='1';
    const heading=composerCard.querySelector(':scope > h2');
    const details=document.createElement('details');details.className='nh7-testimony-compose-v559';
    const summary=document.createElement('summary');summary.textContent=testimonyText('🎙️ ضبط یا ارسال فایل صوتی','🎙️ Record or upload audio','🎙️ Snimi ili pošalji audio');
    const body=document.createElement('div');body.className='nh7-testimony-compose-body-v559';
    [...composerCard.childNodes].forEach(node=>{if(node!==heading)body.appendChild(node)});
    details.append(summary,body);heading?.remove();composerCard.appendChild(details);
  }

  document.querySelectorAll('.nh7c502-list-card').forEach(card=>{
    if(card.dataset.nh7TestimonyPublicV559==='1'||!card.querySelector('.nh7c502-audio-head'))return;
    card.dataset.nh7TestimonyPublicV559='1';
    const copy=card.querySelector('.nh7c502-copy'),title=copy?.querySelector('strong')?.textContent?.trim()||testimonyText('شهادت','Testimony','Svjedočanstvo'),name=copy?.querySelector('small')?.textContent?.trim()||'';
    const note=copy?.querySelector('p'),audio=card.querySelector('audio');
    const details=document.createElement('details');details.className='nh7-testimony-public-v559';
    const summary=document.createElement('summary');
    const main=document.createElement('span');main.className='nh7-testimony-public-main-v559';
    const icon=document.createElement('span');icon.className='nh7-testimony-public-icon-v559';icon.textContent='🎙️';
    const label=document.createElement('span');label.className='nh7-testimony-public-title-v559';
    const strong=document.createElement('strong');strong.textContent=name?name+' — '+title:title;label.appendChild(strong);
    if(name){const small=document.createElement('small');small.textContent=testimonyText('برای شنیدن شهادت لمس کنید','Tap to hear the testimony','Dodirnite za slušanje');label.appendChild(small)}
    main.append(icon,label);summary.appendChild(main);
    const body=document.createElement('div');body.className='nh7-testimony-public-body-v559';
    if(note?.textContent?.trim()){const p=document.createElement('p');p.textContent=note.textContent.trim();body.appendChild(p)}
    if(audio)body.appendChild(audio);
    details.append(summary,body);card.replaceWith(details);
  });
}
function installTestimonyCompactUi(){
  const api=window.NH7CommunityV502;
  if(!api?.renderTestimonies){setTimeout(installTestimonyCompactUi,80);return}
  if(api.__NH7_TESTIMONY_UI_V559__)return;api.__NH7_TESTIMONY_UI_V559__=true;
  const original=api.renderTestimonies.bind(api);
  api.renderTestimonies=async(...args)=>{const result=await original(...args);compactTestimonyUi();return result};
  if(location.hash?.includes('testimon'))setTimeout(compactTestimonyUi,0);
}

addEventListener('resize',syncMiniDock,{passive:true});
addEventListener('orientationchange',()=>setTimeout(syncMiniDock,100),{passive:true});
addEventListener('pageshow',syncMiniDock,{passive:true});
window.visualViewport?.addEventListener('resize',syncMiniDock,{passive:true});
window.visualViewport?.addEventListener('scroll',syncMiniDock,{passive:true});

const mo=new MutationObserver(syncMiniDock);
mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>{ensureAndroidRootScroll();syncMiniDock();installTestimonyCompactUi()},{once:true});
}else{
  ensureAndroidRootScroll();
  syncMiniDock();
  installTestimonyCompactUi();
}
setTimeout(syncMiniDock,120);
setTimeout(syncMiniDock,500);
setTimeout(installTestimonyCompactUi,250);
})();
