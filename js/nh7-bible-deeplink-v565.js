/* New Hope 7 v5.6.5 — exact Bible deep links + share URLs.
 * UI/navigation-only. No Supabase, auth, Storage, School or testimony changes.
 */
(()=>{'use strict';
if(window.__NH7_BIBLE_DEEPLINK_V565__)return;window.__NH7_BIBLE_DEEPLINK_V565__=true;
const VERSION='5.6.5';
const INITIAL=String(window.__NH7_INITIAL_URL_V565__||location.href);
let booksPromise=null,handled=false;

const clean=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[ۀة]/g,'ه').replace(/[._-]+/g,' ').replace(/\s+/g,' ').trim();
const positive=n=>{n=Number(n);return Number.isInteger(n)&&n>0?n:0};
async function books(){
  if(!booksPromise)booksPromise=fetch('data/bible/plans/reading_plans_1yr_2yr.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('Bible metadata '+r.status);return r.json()}).then(d=>Array.isArray(d?.books)?d.books:[]).catch(e=>{booksPromise=null;throw e});
  return booksPromise;
}
function parseInternalHash(hash){
  const raw=String(hash||'').replace(/^#/,'');
  if(!raw)return null;
  const slash=raw.match(/^bible\/([^/]+)\/(\d+)\/(\d+)$/i);
  if(slash)return {bookToken:decodeURIComponent(slash[1]),chapter:positive(slash[2]),verse:positive(slash[3]),source:'hash-friendly'};
  const i=raw.indexOf(':');
  const route=decodeURIComponent(i<0?raw:raw.slice(0,i));
  if(route!=='bible'||i<0)return null;
  try{
    const p=JSON.parse(decodeURIComponent(raw.slice(i+1)));
    if(p?.mode!=='chapter'||!p?.bookId)return null;
    return {bookToken:String(p.bookId),chapter:positive(p.chapter),verse:positive(p.verse),source:'hash-route'};
  }catch(_){return null}
}
function parseTextRef(value){
  const s=String(value||'').trim();if(!s)return null;
  let m=s.match(/^([^/:.]+(?:\s+[^/:.]+)*)[\s/:.]+(\d+)[\s:/.]+(\d+)$/u);
  if(m)return {bookToken:m[1].trim(),chapter:positive(m[2]),verse:positive(m[3]),source:'text'};
  m=s.match(/^([1-3]?[A-Za-z]{2,5})[.:/](\d+)[.:/](\d+)$/);
  if(m)return {bookToken:m[1],chapter:positive(m[2]),verse:positive(m[3]),source:'compact'};
  return null;
}
function parseIncoming(href){
  let url;try{url=new URL(href,location.href)}catch(_){return null}
  const sp=url.searchParams;
  const explicitBook=sp.get('bookId')||sp.get('book')||'';
  const explicitChapter=sp.get('chapter')||sp.get('ch')||'';
  const explicitVerse=sp.get('verse')||sp.get('v')||'';
  if(explicitBook&&positive(explicitChapter)&&positive(explicitVerse))return {bookToken:explicitBook,chapter:positive(explicitChapter),verse:positive(explicitVerse),source:'query-fields'};
  const bible=sp.get('bible')||sp.get('ref')||'';
  if(bible){const p=parseTextRef(bible);if(p)return p}
  return parseInternalHash(url.hash);
}
async function normalizeDescriptor(desc){
  if(!desc||!desc.bookToken||!desc.chapter||!desc.verse)return null;
  const list=await books(),token=clean(desc.bookToken);
  const book=list.find(b=>clean(b.id)===token)||list.find(b=>Object.values(b.names||{}).some(n=>clean(n)===token));
  if(!book)return null;
  if(desc.chapter>Number(book.chapters||0))return null;
  const order=Number(book.order||0),group=order<=18?'01_18':order<=39?'19_39':'40_66';
  try{
    const r=await fetch(`data/bible/groups/bible_group_${group}.json`,{cache:'force-cache'});if(!r.ok)return null;const data=await r.json();
    const exists=(data?.verses||[]).some(v=>String(v.bookId)===String(book.id)&&Number(v.chapter)===desc.chapter&&Number(v.verse)===desc.verse);
    if(!exists)return null;
  }catch(_){return null}
  return {bookId:String(book.id),chapter:desc.chapter,verse:desc.verse};
}
function canonicalUrl(bookId,chapter,verse){
  const basePath=window.NH7_BASE_PATH||new URL('.',location.href).pathname;
  const u=new URL(basePath,location.origin);u.searchParams.set('bible',`${bookId}.${chapter}.${verse}`);u.hash='';return u.href;
}
function currentBibleLocation(target){
  const h=parseInternalHash(location.hash);if(!h)return null;
  const verse=positive(target?.closest?.('.reader-verse')?.id?.replace(/^v-/,''))||positive((String(target?.dataset?.shareVerse||'').match(/:(\d+)\s*$/)||[])[1])||h.verse;
  if(!verse)return null;return {bookToken:h.bookToken,chapter:h.chapter,verse};
}
async function applyIncoming(){
  if(handled)return;const raw=parseIncoming(INITIAL);if(!raw)return;
  const exact=await normalizeDescriptor(raw);if(!exact){console.warn('New Hope 7 Bible deep link ignored: invalid reference',raw);handled=true;return}
  let tries=0;
  const open=()=>{
    if(typeof window.NH7_NAVIGATE==='function'){
      handled=true;window.NH7_NAVIGATE('bible',{section:'written',mode:'chapter',bookId:exact.bookId,chapter:exact.chapter,verse:exact.verse},true);return true;
    }
    return false;
  };
  if(open())return;
  const timer=setInterval(()=>{if(open()||++tries>100)clearInterval(timer)},50);
}
async function shareExactVerse(button,event){
  const current=currentBibleLocation(button);if(!current)return false;
  const exact=await normalizeDescriptor(current);if(!exact)return false;
  const url=canonicalUrl(exact.bookId,exact.chapter,exact.verse);
  const ref=String(button.dataset.shareVerse||'').trim(),text=String(button.dataset.shareText||'').trim();
  const body=[ref,text].filter(Boolean).join(' — ');
  event?.preventDefault?.();event?.stopImmediatePropagation?.();
  try{
    if(navigator.share)await navigator.share({title:'New Hope 7',text:body,url});
    else if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(`${body}${body?'\n':''}${url}`);
    else window.prompt('Copy link',url);
    window.NH7BibleBatchV230?.clearSelection?.();
  }catch(e){if(e?.name!=='AbortError')console.warn('Bible share failed',e)}
  return true;
}
document.addEventListener('click',e=>{
  const button=e.target?.closest?.('[data-share-verse]');if(!button)return;
  const loc=currentBibleLocation(button);if(!loc)return;
  e.preventDefault();e.stopImmediatePropagation();shareExactVerse(button,e);
},true);

window.NH7BibleDeepLinkV565={VERSION,parseIncoming,normalizeDescriptor,canonicalUrl,apply:applyIncoming};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyIncoming,{once:true});else applyIncoming();
})();
