/* New Hope 7 — Global Icon System v5.1.0 preview
 * Visual-only icon renderer. No navigation, audio, school, Bible, auth,
 * storage, network, Supabase, service worker, or data logic.
 */
(()=>{'use strict';
if(window.__NH7_ICON_SYSTEM_V510__)return;
window.__NH7_ICON_SYSTEM_V510__=true;

const NS='http://www.w3.org/2000/svg';
const ICONS={
  play:'<path d="M9 7.4v9.2c0 1.1 1.2 1.8 2.2 1.2l7-4.6c.9-.6.9-1.9 0-2.5l-7-4.6C10.2 5.6 9 6.3 9 7.4Z"/>',
  pause:'<rect x="7" y="5.8" width="3.4" height="12.4" rx="1.3"/><rect x="13.6" y="5.8" width="3.4" height="12.4" rx="1.3"/>',
  previous:'<path d="M7.2 6v12"/><path d="m17.2 6.5-7.1 5.2a.4.4 0 0 0 0 .6l7.1 5.2V6.5Z"/>',
  next:'<path d="M16.8 6v12"/><path d="m6.8 6.5 7.1 5.2a.4.4 0 0 1 0 .6l-7.1 5.2V6.5Z"/>',
  rewind15:'<path d="M8.2 7.5H4.8V4.2"/><path d="M5.1 7.2A8 8 0 1 1 4 14"/><text x="12" y="15.4" text-anchor="middle" font-size="7.2" font-weight="800">15</text>',
  forward30:'<path d="M15.8 7.5h3.4V4.2"/><path d="M18.9 7.2A8 8 0 1 0 20 14"/><text x="12" y="15.4" text-anchor="middle" font-size="7.2" font-weight="800">30</text>',
  speed:'<path d="M5.2 17.2a8 8 0 1 1 13.6 0"/><path d="m12 13.2 4.5-4.1"/><circle cx="12" cy="13.2" r="1.4"/>',
  queue:'<path d="M5 7.2h9"/><path d="M5 12h9"/><path d="M5 16.8h6.2"/><path d="m16 14.2 3 2.6-3 2.6v-5.2Z"/>',
  bible:'<path d="M5.2 5.6c2.8-.6 5.1.1 6.8 1.9v11c-1.7-1.8-4-2.5-6.8-1.9v-11Z"/><path d="M18.8 5.6c-2.8-.6-5.1.1-6.8 1.9v11c1.7-1.8 4-2.5 6.8-1.9v-11Z"/>',
  notes:'<path d="M6.2 4.8h8.4l3.2 3.2v11.2H6.2V4.8Z"/><path d="M14.6 4.8V8h3.2"/><path d="M8.7 11.2h6.5"/><path d="M8.7 14.2h5.1"/><path d="m14.8 18 3.4-3.4 1.2 1.2-3.4 3.4-1.8.5.6-1.7Z"/>',
  heart:'<path d="M12 19.2 5.7 13a4.2 4.2 0 0 1 5.9-6l.4.5.4-.5a4.2 4.2 0 1 1 5.9 6L12 19.2Z"/>',
  blessing:'<path d="M8.5 19V9.3c0-1 .8-1.8 1.8-1.8S12 8.2 12 9.2V5.5c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8v4.1-2.3c0-1 .8-1.8 1.8-1.8S19 6.3 19 7.3v5.2c0 4-2.8 7-6.8 7H8.5Z"/><path d="M8.5 12.2 6.9 10.8a1.8 1.8 0 0 0-2.5 2.6l4.1 4"/>',
  favorite:'<path d="m12 4.2 2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2-3.8-3.7 5.2-.8L12 4.2Z"/>',
  download:'<path d="M12 4.5v9.2"/><path d="m8.5 10.5 3.5 3.5 3.5-3.5"/><path d="M5.2 16.2v2.5h13.6v-2.5"/>',
  check:'<path d="m6.2 12.3 3.5 3.5 8.2-8.2"/>',
  share:'<circle cx="6.2" cy="12" r="2"/><circle cx="17.8" cy="6.2" r="2"/><circle cx="17.8" cy="17.8" r="2"/><path d="m8 11 7.8-3.8"/><path d="m8 13 7.8 3.8"/>',
  search:'<circle cx="10.5" cy="10.5" r="5.5"/><path d="m14.6 14.6 4.2 4.2"/>',
  copy:'<rect x="8.5" y="8.5" width="9.2" height="10" rx="1.6"/><path d="M6.2 15.5H5.4c-.9 0-1.6-.7-1.6-1.6V5.4c0-.9.7-1.6 1.6-1.6h8.5c.9 0 1.6.7 1.6 1.6v.8"/>',
  bookmark:'<path d="M7 4.5h10v15l-5-3.2-5 3.2v-15Z"/>',
  highlight:'<path d="m6.2 14.8 7.9-7.9 3 3-7.9 7.9H6.2v-3Z"/><path d="m13.1 7.9 3 3"/><path d="M5 20h14"/>',
  book:'<path d="M5.5 5.2h10.8c1 0 1.7.8 1.7 1.7v12H7.2c-.9 0-1.7-.8-1.7-1.7v-12Z"/><path d="M8.2 5.2v13.7"/><path d="M10.6 9h4.7"/><path d="M10.6 12h4.7"/>',
  chapterPrev:'<path d="m14.8 6-6 6 6 6"/><path d="M19 6v12"/>',
  chapterNext:'<path d="m9.2 6 6 6-6 6"/><path d="M5 6v12"/>',
  audio:'<path d="M5.2 15.5V8.5l6-3v13l-6-3Z"/><path d="M14.5 9.2a4 4 0 0 1 0 5.6"/><path d="M17 6.8a7.2 7.2 0 0 1 0 10.4"/>',
  lesson:'<path d="M5.3 5.2h13.4v13.6H5.3V5.2Z"/><path d="M8.3 8.3h7.4"/><path d="M8.3 11.3h7.4"/><path d="M8.3 14.3h4.8"/>',
  assignment:'<path d="M7.2 5h7.6l3 3v11H7.2V5Z"/><path d="M14.8 5v3h3"/><path d="m9.2 13 1.5 1.5 3.3-3.3"/><path d="M9.2 17h5.7"/>',
  exam:'<path d="M6 4.8h12v14.4H6V4.8Z"/><path d="M9 8.3h6"/><path d="M9 11.8h6"/><path d="M9 15.3h3"/><circle cx="15.4" cy="15.3" r="1.3"/>',
  certificate:'<path d="M6 5h12v10H6V5Z"/><path d="m9 15-1 4 4-2 4 2-1-4"/><path d="M9 8.5h6"/><path d="M9 11.5h4"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M12 4.2v2"/><path d="M12 17.8v2"/><path d="m6.5 6.5 1.4 1.4"/><path d="m16.1 16.1 1.4 1.4"/><path d="M4.2 12h2"/><path d="M17.8 12h2"/><path d="m6.5 17.5 1.4-1.4"/><path d="m16.1 7.9 1.4-1.4"/>',
  profile:'<circle cx="12" cy="8.2" r="3.2"/><path d="M5.7 19c.8-3.2 3-5 6.3-5s5.5 1.8 6.3 5"/>',
  inbox:'<path d="M5 6.2h14v11.6H5V6.2Z"/><path d="m5 7 7 5 7-5"/>',
  prayer:'<path d="M9.2 19V9.2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8V5.5c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8v7.8c0 3.5-2.5 5.7-6 5.7H9.2Z"/><path d="m9.2 13.2-2-2a1.7 1.7 0 0 0-2.4 2.4L9.2 18"/>',
  testimony:'<path d="M5.2 5.2h13.6v10.2H10l-4.8 3.4V5.2Z"/><path d="m9 10.3 2 2 4-4"/>',
  home:'<path d="m4.8 10.3 7.2-6 7.2 6v8.2h-5v-5h-4.4v5h-5v-8.2Z"/>',
  more:'<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>'
};

function svg(name){
  const body=ICONS[name]||ICONS.more;
  const el=document.createElementNS(NS,'svg');
  el.setAttribute('viewBox','0 0 24 24');
  el.setAttribute('aria-hidden','true');
  el.setAttribute('focusable','false');
  el.classList.add('nh7-ui-icon-svg');
  el.innerHTML=body;
  return el;
}
function decorate(root=document){
  root.querySelectorAll('[data-nh7-icon]').forEach(el=>{
    const name=String(el.dataset.nh7Icon||'more');
    let slot=el.querySelector(':scope > .nh7-ui-icon');
    if(!slot){slot=document.createElement('span');slot.className='nh7-ui-icon';el.prepend(slot)}
    if(slot.dataset.iconName!==name){slot.replaceChildren(svg(name));slot.dataset.iconName=name}
  });
}
window.NH7_ICON_SYSTEM_V510={version:'5.1.0-preview',decorate,svg,names:()=>Object.keys(ICONS)};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>decorate(),{once:true}):decorate();
})();
