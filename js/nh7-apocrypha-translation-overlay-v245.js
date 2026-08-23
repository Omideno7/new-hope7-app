/* New Hope 7 v2.5.0 RC — overlays fresh in-house FA/HR translations onto canonical English runtime. */
(()=>{'use strict';
if(window.__NH7_APO_TRANSLATION_OVERLAY_V245__)return;window.__NH7_APO_TRANSLATION_OVERLAY_V245__=true;
const VERSION='2.5.0-apocrypha-translation-overlay';
const REGISTRIES=[
  'data/apocrypha/review/translation-overlays-v245.json?v=2452',
  'data/apocrypha/review/translation-overlays-v246-continuation.json?v=2461',
  'data/apocrypha/review/translation-overlays-v247-audit-corrections.json?v=2501'
];
const TARGET=/data\/apocrypha\/runtime\/apocrypha-browser-19\.preview\.json(?:[?#]|$)/;
const previousFetch=window.fetch.bind(window);
let overlaysPromise=null;
function isTarget(input){try{const raw=typeof input==='string'?input:input instanceof URL?input.href:input?.url||'';return TARGET.test(new URL(raw,document.baseURI).href)}catch(_){return false}}
function indexBooks(data){const out=new Map();for(const book of data?.books||[])out.set(String(book.book_id),book);return out}
function findChapter(book,no){return (book?.chapters||[]).find(x=>Number(x.chapter)===Number(no))||null}
function findVerse(ch,no){return (ch?.verses||[]).find(x=>Number(x.verse)===Number(no))||null}
function applyLocalizedRow(v,row,loc,textField,statusField){if(!v)return;const text=String(row?.[textField]||'').trim(),status=String(row?.[statusField]||'');if(status==='in_review'&&text){v['text_'+loc]=row[textField];v['status_'+loc]='in_review'}}
function mergeRows(book,bookId,chapterNo,rows,declared){const ch=findChapter(book,chapterNo);if(!ch){console.warn('NH7 overlay skipped non-source chapter',bookId,chapterNo);return}for(const row of rows||[]){const v=findVerse(ch,row.verse);if(!v){console.warn('NH7 overlay skipped non-source verse',bookId,chapterNo,row.verse);continue}if(['fa','hr'].includes(declared)){const text=String(row.text||'').trim();if(text){v['text_'+declared]=row.text;v['status_'+declared]='in_review'}}else{applyLocalizedRow(v,row,'fa','text_fa','status_fa');applyLocalizedRow(v,row,'hr','text_hr','status_hr')}}}
function mergeDocument(runtime,doc){if(!doc?.book_id)return;const books=indexBooks(runtime);const book=books.get(String(doc.book_id));if(!book)return;const declared=String(doc.language||'');if(Array.isArray(doc.verses))mergeRows(book,doc.book_id,Number(doc.chapter||1),doc.verses,declared);if(Array.isArray(doc.chapters))for(const chapter of doc.chapters||[])mergeRows(book,doc.book_id,chapter.chapter,chapter.verses,declared)}
function applyAuditDisplayNormalizations(runtime){
  const books=indexBooks(runtime);
  const enoch=books.get('1_enoch');
  if(enoch){const ch=findChapter(enoch,108);const v=findVerse(ch,15);if(v){
    if(typeof v.text_en==='string')v.text_en=v.text_en.replace(/\s*Printed in Great Britain by Richard Clay and Company, Ltd\., Bungay, Suffolk\.?\s*$/i,'').trim();
    if(typeof v.text_hr==='string')v.text_hr=v.text_hr.replace(/\s*Tiskano u Velikoj Britaniji u tiskari Richard Clay and Company, Ltd\., Bungay, Suffolk\.?\s*$/i,'').trim();
    if(typeof v.text_fa==='string')v.text_fa=v.text_fa.replace(/\s*چاپ‌شده در بریتانیای کبیر توسط Richard Clay and Company, Ltd\.، Bungay، Suffolk\.?\s*$/,'').trim();
  }}
  const azariah=books.get('prayer_of_azariah');
  if(azariah){const ch=findChapter(azariah,1);const v=findVerse(ch,55);if(v)v.text_en='O ye fountains, bless ye the Lord: praise and exalt him above all for ever.'}
}
async function loadOverlays(){if(overlaysPromise)return overlaysPromise;overlaysPromise=(async()=>{const docs=[],seenPaths=new Set();for(const registryUrl of REGISTRIES){try{const rr=await previousFetch(registryUrl,{cache:'no-store'});if(!rr.ok)throw new Error('HTTP '+rr.status);const reg=await rr.json();for(const path of reg.files||[]){if(seenPaths.has(path))continue;seenPaths.add(path);try{const r=await previousFetch(path,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);docs.push(await r.json())}catch(e){console.warn('NH7 overlay file failed',path,e)}}}catch(e){console.warn('NH7 overlay registry failed',registryUrl,e)}}return docs})().catch(e=>{console.warn('NH7 overlay loading failed',e);return[]});return overlaysPromise}
window.fetch=async function nh7ApocryphaOverlayFetch(input,init={}){if(!isTarget(input))return previousFetch(input,init);const response=await previousFetch(input,init);if(!response.ok)return response;try{const data=await response.clone().json();for(const doc of await loadOverlays())mergeDocument(data,doc);applyAuditDisplayNormalizations(data);return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}catch(e){console.warn('NH7 Apocrypha overlay merge failed',e);return response}};
window.NH7_APOCRYPHA_TRANSLATION_OVERLAY_VERSION=VERSION;
})();
