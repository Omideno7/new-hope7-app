/* New Hope 7 Appearance i18n patch v5.1.5
 * UI-only localization for remaining hard-coded controls in Appearance & Personalization.
 * Does not touch themes, user data, Supabase, testimony storage, or admin logic.
 */
(()=>{'use strict';
if(window.__NH7_APPEARANCE_I18N_V515__)return;
window.__NH7_APPEARANCE_I18N_V515__=true;

const COPY={
  fa:{manual:'دستی',system:'سیستم',auto:'روز / شب',reset:'بازنشانی',close:'بستن',new:'جدید'},
  en:{manual:'Manual',system:'System',auto:'Day / Night',reset:'Reset',close:'Close',new:'NEW'},
  hr:{manual:'Ručno',system:'Sustav',auto:'Dan / noć',reset:'Vrati zadano',close:'Zatvori',new:'NOVO'}
};

function lang(){
  const v=String(document.documentElement.lang||localStorage.getItem('lang')||'en').toLowerCase();
  return v.startsWith('fa')?'fa':v.startsWith('hr')?'hr':'en';
}
function setText(root,selector,value){const el=root.querySelector(selector);if(el&&el.textContent!==value)el.textContent=value}
function localize(root=document){
  const dialog=root.matches?.('#nh7AppearanceDialog514')?root:root.querySelector?.('#nh7AppearanceDialog514');
  if(!dialog)return false;
  window.NH7AppearancePersonalizationV514?.refreshDialogCopy?.();
  const t=COPY[lang()]||COPY.en;
  setText(dialog,'[data-ap514-mode="manual"]',t.manual);
  setText(dialog,'[data-ap514-mode="system"]',t.system);
  setText(dialog,'[data-ap514-mode="auto"]',t.auto);
  dialog.querySelectorAll('.nh7-ap514-new').forEach(el=>{if(el.textContent!==t.new)el.textContent=t.new});
  const reset=dialog.querySelector('[data-ap514-reset]');
  if(reset){reset.setAttribute('title',t.reset);reset.setAttribute('aria-label',t.reset)}
  const close=dialog.querySelector('[data-ap514-close]');
  if(close){close.setAttribute('aria-label',t.close);close.setAttribute('title',t.close)}
  dialog.setAttribute('lang',lang());
  dialog.setAttribute('dir',lang()==='fa'?'rtl':'ltr');
  return true;
}

function scanNode(node){
  if(!(node instanceof Element))return;
  if(node.matches?.('#nh7AppearanceDialog514')||node.querySelector?.('#nh7AppearanceDialog514'))queueMicrotask(()=>localize(node.matches?.('#nh7AppearanceDialog514')?node:document));
}

const bodyObserver=new MutationObserver(mutations=>{
  for(const m of mutations)m.addedNodes?.forEach(scanNode);
});
function start(){
  localize();
  if(document.body)bodyObserver.observe(document.body,{subtree:true,childList:true});
  const langObserver=new MutationObserver(()=>queueMicrotask(()=>localize()));
  langObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.getElementById('langSelect')?.addEventListener('change',()=>setTimeout(localize,0));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

window.NH7AppearanceI18nV515={localize,VERSION:'5.1.5'};
})();
