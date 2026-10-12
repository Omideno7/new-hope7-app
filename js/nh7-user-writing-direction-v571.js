/* New Hope 7 v5.7.1 — keep user-authored textareas aligned with the active app language. */
(()=>{
  if(window.NH7_USER_WRITING_DIRECTION_V571)return;
  const SELECTOR='#appShell textarea,.nh7p500 textarea,textarea[data-reader-note452],#sermonModalNote';
  const language=()=>{
    const value=String(localStorage.getItem('nh7_lang')||document.documentElement.lang||'en').toLowerCase().slice(0,2);
    return ['fa','en','hr'].includes(value)?value:'en';
  };
  function apply(control,locale=language()){
    if(!(control instanceof HTMLTextAreaElement))return;
    if(control.dataset.nh7WritingDirection==='preserve')return;
    const rtl=locale==='fa';
    control.dir=rtl?'rtl':'ltr';
    control.style.direction=rtl?'rtl':'ltr';
    control.style.textAlign=rtl?'right':'left';
    control.dataset.nh7WritingDirection=locale;
  }
  function scan(root=document,locale=language()){
    if(root instanceof Element&&root.matches(SELECTOR))apply(root,locale);
    root.querySelectorAll?.(SELECTOR).forEach(control=>apply(control,locale));
  }
  function refresh(){scan(document,language())}
  const observer=new MutationObserver(records=>{
    const locale=language();
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType===Node.ELEMENT_NODE)scan(node,locale);
      }
    }
  });
  function start(){
    refresh();
    observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('change',event=>{
      if(['langSelect','settingsLang'].includes(event.target?.id))setTimeout(refresh,0);
    },true);
    window.addEventListener('storage',event=>{if(event.key==='nh7_lang')refresh()});
    window.addEventListener('pageshow',refresh);
  }
  window.NH7_USER_WRITING_DIRECTION_V571={version:'5.7.1',refresh,apply,selector:SELECTOR};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
