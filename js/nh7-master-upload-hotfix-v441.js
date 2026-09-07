(()=>{'use strict';
if(window.NH7_MASTER441)return;window.NH7_MASTER441='4.4.1';
function fix(){
  const dlg=[...document.querySelectorAll('dialog')].find(d=>/MASTER/.test(d.textContent||''));
  if(!dlg)return;
  const collection=dlg.querySelector('#m-collection');
  const ok=dlg.querySelector('#m-ok');
  const save=dlg.querySelector('#m-save');
  const rows=['fa','en','hr'].map(l=>dlg.querySelector('#m-s-'+l)?.textContent||'');
  const all=rows.every(t=>t.includes('✅'));
  const counts=rows.map(t=>{const m=t.match(/—\s*(\d+)\s*بخش/);return m?Number(m[1]):NaN});
  const same=all&&counts.every(Number.isFinite)&&new Set(counts).size===1;
  if(collection&&!collection.value){
    const first=[...collection.options].find(o=>o.value);
    if(first){collection.value=first.value;collection.dispatchEvent(new Event('change',{bubbles:true}));}
  }
  const hasCollection=!!collection?.value;
  if(ok)ok.disabled=!(all&&same&&hasCollection);
  if(save)save.disabled=!(all&&same&&hasCollection&&ok?.checked);
  const status=dlg.querySelector('#m-status');
  if(status&&all&&same&&!hasCollection){status.textContent='مجموعهٔ مقصد انتخاب نشده است. ابتدا قفسهٔ مقصد را انتخاب کنید.';status.style.color='#a11';}
}
const mo=new MutationObserver(fix);mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','value']});
document.addEventListener('change',e=>{if(e.target?.closest?.('dialog'))setTimeout(fix,0)},true);
setInterval(fix,700);fix();
})();
