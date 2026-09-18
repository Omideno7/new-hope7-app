/* New Hope 7 v4.5.2 — localized compact Bible toolbar; additive, no verse corpus mutation */
(()=>{'use strict';
if(window.__NH7_READER_TOOLBAR_V452__)return;window.__NH7_READER_TOOLBAR_V452__=true;
const APP_URL='https://omideno7.github.io/new-hope7-app/app/';
const lang=()=>{const v=localStorage.getItem('nh7_lang')||'en';return ['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const selected=()=>window.NH7BibleBatchV230?.selected;
const normalizeDigits=v=>String(v||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const localRef=node=>{
 const raw=node.querySelector('[data-bookmark]')?.dataset.bookmark||node.querySelector('[data-share-verse]')?.dataset.shareVerse||'';
 const title=node.closest('.card')?.querySelector('h2')?.textContent?.trim()||'';
 const verse=node.querySelector('.num')?.textContent?.trim()||'';
 if(title&&verse)return title+':'+verse;\n const m=String(raw).match(/^(.+?)\\s+(\\d+):(\\d+)$/);if(!m)return raw;\n return m[1]+' '+normalizeDigits(m[2])+':'+normalizeDigits(m[3]);
};
const item=node=>({node,ref:localRef(node),text:String(node.querySelector('.verse-text')?.textContent||'').trim()});
function items(){const map=selected();if(!map)return[];return [...map.values()].map(v=>item(v.node)).filter(x=>x.text)}
function shareText(){const rows=items().map(x=>x.ref+' — '+x.text).join('\n');return rows+'\n\n'+L('مطالعه در New Hope 7:','Read in New Hope 7:','Čitajte u New Hope 7:')+' '+APP_URL}
async function copy(){const text=shareText();try{await navigator.clipboard.writeText(text)}catch(_){const a=document.createElement('textarea');a.value=text;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove()}toast(L('کپی شد','Copied','Kopirano'))}
async function share(){const text=shareText();try{if(navigator.share)await navigator.share({text,url:APP_URL});else await copy()}catch(e){if(e?.name!=='AbortError')console.warn(e)}}
function toast(text){let el=document.getElementById('nh7ReaderToast452');if(!el){el=document.createElement('div');el.id='nh7ReaderToast452';el.className='nh7-reader-toast-v452';document.body.appendChild(el)}el.textContent=text;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),1300)}
function ensureCopyButtons(root=document){root.querySelectorAll?.('.reader-verse .verse-tools').forEach(tools=>{if(tools.querySelector('[data-nh7-copy-selected]'))return;const shareBtn=tools.querySelector('[data-share-verse]');const b=document.createElement('button');b.type='button';b.className='secondary-btn nh7-copy-v452';b.dataset.nh7CopySelected='1';b.textContent='⧉ '+L('کپی','Copy','Kopiraj');tools.insertBefore(b,shareBtn||tools.lastElementChild)})}
document.addEventListener('click',e=>{\n const cancel=e.target.closest?.('.reader-verse [data-clear-bible-selection]');if(cancel){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();window.NH7BibleBatchV230?.deselectVerse?.(cancel.closest('.reader-verse'));return}
 const copyBtn=e.target.closest?.('[data-nh7-copy-selected]');if(copyBtn){e.preventDefault();e.stopPropagation();copy();return}
 const shareBtn=e.target.closest?.('.reader-verse [data-share-verse]');if(shareBtn){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();const verse=shareBtn.closest('.reader-verse');const map=selected();if(map&&verse&&!map.has(verse.dataset.verseKey))window.NH7BibleBatchV230.toggleVerse(verse,true);share();return}
},true);
const obs=new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes)if(n.nodeType===1)ensureCopyButtons(n);ensureCopyButtons()});obs.observe(document.documentElement,{childList:true,subtree:true});ensureCopyButtons();
window.NH7ReaderToolbarV452={VERSION:'4.5.2',APP_URL,localRef,shareText,copy,share};
})();