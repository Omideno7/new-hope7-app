/* New Hope 7 v5.7.0 — adaptive layout enhancement for fold/tablet/desktop.
 * Presentation-only: does not mutate account, School, Bible, Audio or Supabase data.
 * Phone layout remains canonical. Sidebar controls mirror the current rendered controls
 * and forward clicks to those canonical buttons so existing route logic stays authoritative.
 */
(()=>{'use strict';
if(window.__NH7_ADAPTIVE_LAYOUT_V570__)return;
window.__NH7_ADAPTIVE_LAYOUT_V570__=true;

const VERSION='5.7.0';
const MIN_SPLIT=768;
let queued=false;
const view=()=>document.getElementById('view');
const route=()=>document.querySelector('.bottom-nav .nav-item.active')?.dataset?.route||'';

function installStyle(){
  if(document.getElementById('nh7Adaptive570Style'))return;
  const style=document.createElement('style');
  style.id='nh7Adaptive570Style';
  style.textContent=`
    .nh7-adaptive570-layout{display:contents}
    .nh7-adaptive570-sidebar{display:none}
    @media (min-width:${MIN_SPLIT}px){
      .nh7-adaptive570-layout{display:grid;grid-template-columns:minmax(210px,26%) minmax(0,1fr);gap:18px;align-items:start;min-width:0}
      .nh7-adaptive570-main{min-width:0}
      .nh7-adaptive570-sidebar{display:flex;flex-direction:column;position:sticky;top:calc(96px + var(--safe-area-inset-top,env(safe-area-inset-top,0px)));max-height:calc(100dvh - 120px - var(--safe-area-inset-top,env(safe-area-inset-top,0px)));overflow:hidden;border:1px solid var(--line,#d9e6f7);border-radius:20px;background:var(--card,#fff);color:var(--ink,inherit);box-shadow:0 10px 26px rgba(15,35,55,.09)}
      .nh7-adaptive570-head{padding:13px 14px 11px;border-bottom:1px solid var(--line,#d9e6f7);background:color-mix(in srgb,var(--brand,#1d4ed8) 7%,var(--card,#fff));font-size:.82rem;font-weight:800}
      .nh7-adaptive570-scroll{overflow:auto;overscroll-behavior:contain;padding:9px;scrollbar-width:thin}
      .nh7-adaptive570-tabs{display:grid;grid-template-columns:1fr;gap:6px}
      .nh7-adaptive570-tabs .tab,.nh7-adaptive570-link{width:100%;min-height:40px;margin:0;padding:8px 9px;border-radius:11px;text-align:start;white-space:normal;overflow-wrap:anywhere}
      .nh7-adaptive570-links{display:grid;gap:5px;margin-top:8px}
      .nh7-adaptive570-link{appearance:none;border:1px solid color-mix(in srgb,var(--line,#d9e6f7) 84%,transparent);background:transparent;color:inherit;font:inherit;cursor:pointer}
      .nh7-adaptive570-link:hover,.nh7-adaptive570-link:focus-visible{border-color:color-mix(in srgb,var(--brand,#1d4ed8) 46%,transparent);background:color-mix(in srgb,var(--brand,#1d4ed8) 7%,transparent);outline:none}
      .nh7-adaptive570-link.active,.nh7-adaptive570-tabs .tab.active{background:var(--brand,#1d4ed8);color:#fff;border-color:var(--brand,#1d4ed8)}
      .nh7-adaptive570-main>.card:first-child{margin-top:0}
      [dir='rtl'] .nh7-adaptive570-tabs .tab,[dir='rtl'] .nh7-adaptive570-link{text-align:right}
    }
    @media (min-width:1024px){.nh7-adaptive570-layout{grid-template-columns:minmax(250px,24%) minmax(0,1fr);gap:22px}}
    @media (min-width:1366px){.nh7-adaptive570-layout{grid-template-columns:290px minmax(0,1fr);gap:26px}}
  `;
  document.head.appendChild(style);
}

function cloneDataButton(source,extraClass='nh7-adaptive570-link'){
  const b=document.createElement('button');
  b.type='button';
  b.className=extraClass+(source.classList.contains('active')?' active':'');
  for(const {name,value} of Array.from(source.attributes)){
    if(name.startsWith('data-'))b.setAttribute(name,value);
  }
  b.innerHTML=source.innerHTML;
  b.removeAttribute('id');
  b.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  b.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    source.click();
  });
  return b;
}

function sidebarTitle(r){
  const lang=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';
  if(r==='bible')return lang==='fa'?'کتاب مقدس':lang==='hr'?'Biblija':'Bible';
  if(r==='audio')return lang==='fa'?'پیام‌های صوتی':lang==='hr'?'Audio poruke':'Audio';
  return 'New Hope 7';
}

function collectNavSources(root,r){
  const out=[];
  const tabs=Array.from(root.querySelectorAll('.tabs')).filter(el=>!el.closest('.nh7-adaptive570-sidebar'));
  const firstTabs=tabs[0];
  if(firstTabs){
    for(const b of firstTabs.querySelectorAll('button,[data-go]')){
      if(b.closest('.nh7-adaptive570-sidebar'))continue;
      out.push(b);
    }
  }
  if(r==='bible'&&out.length<4){
    const buttons=Array.from(root.querySelectorAll('.grid [data-go="bible"],.nh7-chapter-grid [data-go="bible"]'));
    for(const b of buttons.slice(0,80))if(!out.includes(b))out.push(b);
  }
  if(r==='audio'&&out.length<2){
    const buttons=Array.from(root.querySelectorAll('[data-go="audio"]'));
    for(const b of buttons.slice(0,40))if(!out.includes(b))out.push(b);
  }
  return out;
}

function sourceSignature(sources,r){
  return r+'|'+sources.map(source=>{
    const data=Array.from(source.attributes).filter(a=>a.name.startsWith('data-')).map(a=>a.name+'='+a.value).sort().join('&');
    return data+'|'+String(source.textContent||'').replace(/\s+/g,' ').trim()+'|'+(source.classList.contains('active')?'1':'0');
  }).join('||');
}

function buildSidebar(root,r){
  const sources=collectNavSources(root,r);
  if(!sources.length)return null;
  const aside=document.createElement('aside');
  aside.className='nh7-adaptive570-sidebar';
  aside.setAttribute('aria-label',sidebarTitle(r));
  aside.dataset.nh7Signature=sourceSignature(sources,r);
  const head=document.createElement('div');
  head.className='nh7-adaptive570-head';
  head.textContent=sidebarTitle(r);
  const scroll=document.createElement('div');
  scroll.className='nh7-adaptive570-scroll';
  const list=document.createElement('div');
  list.className='nh7-adaptive570-links';
  sources.forEach(source=>list.appendChild(cloneDataButton(source)));
  scroll.appendChild(list);aside.append(head,scroll);
  return aside;
}

function unwrap(root){
  const layout=root.querySelector(':scope > .nh7-adaptive570-layout');
  if(!layout)return;
  const main=layout.querySelector(':scope > .nh7-adaptive570-main');
  const frag=document.createDocumentFragment();
  if(main)while(main.firstChild)frag.appendChild(main.firstChild);
  layout.replaceWith(frag);
}

function enhance(){
  const root=view();if(!root)return;
  const r=route();
  root.dataset.nh7AdaptiveRoute=r;
  const eligible=(r==='bible'||r==='audio');
  const split=matchMedia(`(min-width:${MIN_SPLIT}px)`).matches;
  if(!eligible||!split){unwrap(root);return}

  let layout=root.querySelector(':scope > .nh7-adaptive570-layout');
  if(layout){
    const old=layout.querySelector(':scope > .nh7-adaptive570-sidebar');
    const main=layout.querySelector(':scope > .nh7-adaptive570-main');
    if(old&&main){
      const fresh=buildSidebar(main,r);
      if(fresh&&fresh.dataset.nh7Signature!==old.dataset.nh7Signature)old.replaceWith(fresh);
    }
    return;
  }

  const sidebar=buildSidebar(root,r);if(!sidebar)return;
  layout=document.createElement('div');layout.className='nh7-adaptive570-layout';
  const main=document.createElement('div');main.className='nh7-adaptive570-main';
  const children=Array.from(root.childNodes);
  children.forEach(node=>main.appendChild(node));
  layout.append(sidebar,main);root.appendChild(layout);
}

function schedule(){
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;try{enhance()}catch(error){console.warn('[NH7 adaptive 570]',error)}});
}

function start(){
  installStyle();schedule();
  const root=view();
  if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  document.querySelector('.bottom-nav')?.addEventListener('click',()=>setTimeout(schedule,0));
  document.getElementById('langSelect')?.addEventListener('change',()=>setTimeout(schedule,0));
  addEventListener('resize',schedule,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(schedule,80),{passive:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.NH7AdaptiveLayoutV570={VERSION,refresh:schedule};
})();
