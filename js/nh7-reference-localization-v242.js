/* New Hope 7 v2.4.0.242 — universal Scripture reference localization for QA/release candidate. */
(()=>{'use strict';
const VERSION='2.4.0.242-reference-localization';
let books=[];
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'};
const normalize=v=>String(v||'').trim().toLowerCase().replace(/[.]/g,'').replace(/\s+/g,' ');
function aliases(book){const a=[book.id,book.names?.en,book.names?.fa,book.names?.hr];const id=book.id;if(id==='PSA')a.push('Psalm','Psalms','Ps','مزمور','مزامیر');if(id==='SNG')a.push('Song of Solomon','Song of Songs','Canticles');if(id==='JHN')a.push('Gospel of John');const ord={
'1SA':['1 Samuel','First Samuel'],'2SA':['2 Samuel','Second Samuel'],'1KI':['1 Kings','First Kings'],'2KI':['2 Kings','Second Kings'],'1CH':['1 Chronicles','First Chronicles'],'2CH':['2 Chronicles','Second Chronicles'],'1CO':['1 Corinthians','First Corinthians'],'2CO':['2 Corinthians','Second Corinthians'],'1TH':['1 Thessalonians','First Thessalonians'],'2TH':['2 Thessalonians','Second Thessalonians'],'1TI':['1 Timothy','First Timothy'],'2TI':['2 Timothy','Second Timothy'],'1PE':['1 Peter','First Peter'],'2PE':['2 Peter','Second Peter'],'1JN':['1 John','First John'],'2JN':['2 John','Second John'],'3JN':['3 John','Third John']};if(ord[id])a.push(...ord[id]);return a.filter(Boolean).map(normalize)}
function localNum(v){return lang()==='fa'?String(v).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):String(v)}
function localize(ref){let s=String(ref||'').trim();const m=s.match(/^(.+?)\s+(\d+):(\d+)/);if(m&&books.length){const name=normalize(m[1]),book=books.find(b=>aliases(b).includes(name));if(book){const local=book.names?.[lang()]||book.names?.en||m[1];s=local+s.slice(m[1].length)}}return localNum(s)}
function applyButton(el){const ref=el?.dataset?.revealRef;if(!ref)return;const value=localize(ref);const label=el.querySelector(':scope > span');if(label)label.textContent=value;else if(el.classList.contains('verse-ref-btn')||el.children.length===0)el.textContent=value;}
function applyInline(root=document){root.querySelectorAll?.('[data-reveal-ref]').forEach(applyButton);root.querySelectorAll?.('.inline-verse').forEach(box=>{const btn=box.previousElementSibling;if(!btn?.dataset?.revealRef)return;const strong=box.querySelector('strong');if(strong)strong.textContent=localize(btn.dataset.revealRef)});}
async function load(){try{const r=await fetch('data/bible/plans/reading_plans_1yr_2yr.json',{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const data=await r.json();books=Array.isArray(data.books)?data.books:[];applyInline();}catch(e){console.warn('NH7 reference localization',e)}}
const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1){if(node.matches?.('[data-reveal-ref]'))applyButton(node);applyInline(node)}});observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('change',e=>{if(e.target?.id==='langSelect')setTimeout(applyInline,60)},true);
load();window.NH7_REFERENCE_LOCALIZATION_VERSION=VERSION;
})();