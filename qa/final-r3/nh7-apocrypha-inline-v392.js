/* New Hope 7 Final QA R3.2 v3.9.2 — true continuous Apocrypha verse flow.
 * Safari keeps <button> elements as separate layout boxes in this reader even
 * when CSS says inline. This patch converts only each delegated verse trigger
 * to an inline semantic span and keeps the original article/toolbox structure.
 */
(()=>{'use strict';
if(window.__NH7_APOCRYPHA_INLINE_V392__)return;window.__NH7_APOCRYPHA_INLINE_V392__=true;
function replaceTrigger(article){
  let main=article.querySelector(':scope > .nh7-apo-verse-main');if(!main)return;
  if(main.tagName==='BUTTON'){
    const span=document.createElement('span');
    for(const attr of [...main.attributes])if(!['type','class','style'].includes(attr.name))span.setAttribute(attr.name,attr.value);
    span.className=main.className;span.setAttribute('role','button');span.setAttribute('tabindex','0');
    while(main.firstChild)span.appendChild(main.firstChild);main.replaceWith(span);main=span;
  }
  main.dataset.nh7Inline392='1';
  main.style.setProperty('display','inline','important');main.style.setProperty('width','auto','important');main.style.setProperty('padding','0','important');main.style.setProperty('margin','0','important');main.style.setProperty('text-align','inherit','important');
  if(!main.nextElementSibling?.classList.contains('nh7-apo-inline-gap392')){
    const gap=document.createElement('span');gap.className='nh7-apo-inline-gap392';gap.setAttribute('aria-hidden','true');gap.textContent=' ';main.insertAdjacentElement('afterend',gap);
  }
}
function patch(){
  document.querySelectorAll('.nh7-apo-continuous-reader').forEach(reader=>{
    reader.dataset.nh7Inline392='1';reader.style.setProperty('display','block','important');reader.style.setProperty('text-align','start','important');
    reader.querySelectorAll(':scope > .nh7-apo-verse').forEach(article=>{
      article.dataset.nh7Inline392='1';article.style.setProperty('display','contents','important');replaceTrigger(article);
    });
  });
}
document.addEventListener('keydown',event=>{const trigger=event.target.closest?.('.nh7-apo-verse-main[data-nh7-inline392]');if(!trigger||!['Enter',' '].includes(event.key))return;event.preventDefault();trigger.click()},true);
const style=document.createElement('style');style.id='nh7-apocrypha-inline-v392-style';style.textContent=`
.nh7-apo-continuous-reader[data-nh7-inline392]{display:block!important;text-align:start!important;line-height:2.12!important;white-space:normal!important;padding:3px 0!important}
.nh7-apo-continuous-reader[data-nh7-inline392]>.nh7-apo-verse[data-nh7-inline392]{display:contents!important;border:0!important;padding:0!important;margin:0!important;background:transparent!important}
.nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-verse-main[data-nh7-inline392]{display:inline!important;width:auto!important;min-width:0!important;max-width:none!important;border:0!important;border-radius:0!important;background:transparent!important;color:inherit!important;padding:0!important;margin:0!important;text-align:inherit!important;font:inherit!important;line-height:inherit!important;vertical-align:baseline!important;white-space:normal!important;cursor:pointer!important}
.nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-verse-num{display:inline!important;min-width:0!important;width:auto!important;height:auto!important;margin:0 .12em!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#08765d!important;font-size:.72em!important;font-weight:900!important;line-height:1!important;vertical-align:super!important}
.nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-verse-text{display:inline!important;font-size:calc(1rem * var(--nh7-reader-scale-v251,1))!important;line-height:2.12!important;white-space:normal!important}
.nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-note-mark{display:inline!important;margin-inline:2px!important;font-size:.75em!important;vertical-align:super!important}
.nh7-apo-inline-gap392{display:inline!important;white-space:pre!important}
.nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-verse.is-highlighted>.nh7-apo-verse-main,.nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-verse.is-highlighted .nh7-apo-verse-main{background:#fff2a8!important;border-radius:5px!important;box-decoration-break:clone!important;-webkit-box-decoration-break:clone!important;padding:1px 2px!important}
.nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-verse-tools{display:block!important;width:100%!important;box-sizing:border-box!important;margin:8px 0 10px!important;padding:9px!important;border:1px solid #dce8e6!important;border-radius:12px!important;background:#f8fbfb!important;line-height:1.4!important}
.nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-verse-tools.hidden{display:none!important}
.nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-tool-buttons{display:flex!important;flex-wrap:wrap!important;gap:6px!important}
.nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-note-editor{display:block!important;width:100%!important;margin-top:8px!important}
.nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-note-editor.hidden{display:none!important}
`;
document.head.appendChild(style);
let timer=0;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(patch,25)}).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('languagechange',()=>setTimeout(patch,40));setTimeout(patch,120);window.NH7_APOCRYPHA_INLINE_VERSION='3.9.2';
})();
