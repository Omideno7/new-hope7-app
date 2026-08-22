/* New Hope 7 v2.4.5 RC — overlays fresh in-house FA/HR translations onto canonical English runtime. */
(()=>{'use strict';
if(window.__NH7_APO_TRANSLATION_OVERLAY_V245__)return;window.__NH7_APO_TRANSLATION_OVERLAY_V245__=true;
const VERSION='2.4.5-apocrypha-translation-overlay';
const REGISTRY='data/apocrypha/review/translation-overlays-v245.json?v=2451';
const TARGET=/data\/apocrypha\/runtime\/apocrypha-browser-19\.preview\.json(?:[?#]|$)/;
const previousFetch=window.fetch.bind(window);
let overlaysPromise=null;
function isTarget(input){try{const raw=typeof input==='string'?input:input instanceof URL?input.href:input?.url||'';return TARGET.test(new URL(raw,document.baseURI).href)}catch(_){return false}}
function indexBooks(data){const out=new Map();for(const book of data?.books||[])out.set(String(book.book_id),book);return out}
function ensureChapter(book,no){let ch=(book.chapters||[]).find(x=>Number(x.chapter)===Number(no));if(!ch){ch={chapter:Number(no),verses:[]};book.chapters=book.chapters||[];book.chapters.push(ch);book.chapters.sort((a,b)=>Number(a.chapter)-Number(b.chapter))}return ch}
function ensureVerse(ch,no){let v=(ch.verses||[]).find(x=>Number(x.verse)===Number(no));if(!v){v={verse:Number(no),text_en:null,text_fa:null,text_hr:null};ch.verses=ch.verses||[];ch.verses.push(v);ch.verses.sort((a,b)=>Number(a.verse)-Number(b.verse))}return v}
function mergeDocument(runtime,doc){if(!doc?.book_id)return;const books=indexBooks(runtime);const book=books.get(String(doc.book_id));if(!book)return;
  if(Array.isArray(doc.verses)){
    const ch=ensureChapter(book,Number(doc.chapter||1));
    for(const row of doc.verses||[]){const v=ensureVerse(ch,row.verse);if(String(row.status_fa||'')==='in_review'&&String(row.text_fa||'').trim()){v.text_fa=row.text_fa;v.status_fa='in_review'}if(String(row.status_hr||'')==='in_review'&&String(row.text_hr||'').trim()){v.text_hr=row.text_hr;v.status_hr='in_review'}}
  }
  if(Array.isArray(doc.chapters)&&['fa','hr'].includes(String(doc.language||''))){const loc=String(doc.language),key='text_'+loc,status='status_'+loc;for(const chapter of doc.chapters){const ch=ensureChapter(book,chapter.chapter);for(const row of chapter.verses||[]){if(!String(row.text||'').trim())continue;const v=ensureVerse(ch,row.verse);v[key]=row.text;v[status]='in_review'}}}
}
async function loadOverlays(){if(overlaysPromise)return overlaysPromise;overlaysPromise=(async()=>{const rr=await previousFetch(REGISTRY,{cache:'no-store'});if(!rr.ok)throw new Error('Overlay registry HTTP '+rr.status);const reg=await rr.json();const docs=[];for(const path of reg.files||[]){try{const r=await previousFetch(path,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);docs.push(await r.json())}catch(e){console.warn('NH7 overlay file failed',path,e)}}return docs})().catch(e=>{console.warn('NH7 overlay registry failed',e);return[]});return overlaysPromise}
window.fetch=async function nh7ApocryphaOverlayFetch(input,init={}){if(!isTarget(input))return previousFetch(input,init);const response=await previousFetch(input,init);if(!response.ok)return response;try{const data=await response.clone().json();for(const doc of await loadOverlays())mergeDocument(data,doc);return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}catch(e){console.warn('NH7 Apocrypha overlay merge failed',e);return response}};
window.NH7_APOCRYPHA_TRANSLATION_OVERLAY_VERSION=VERSION;
})();
