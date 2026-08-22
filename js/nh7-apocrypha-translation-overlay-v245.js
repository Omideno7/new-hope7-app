/* New Hope 7 v2.4.6 RC — overlays fresh in-house FA/HR translations onto canonical English runtime. */
(()=>{'use strict';
if(window.__NH7_APO_TRANSLATION_OVERLAY_V245__)return;window.__NH7_APO_TRANSLATION_OVERLAY_V245__=true;
const VERSION='2.4.6-apocrypha-translation-overlay';
const REGISTRIES=[
  'data/apocrypha/review/translation-overlays-v245.json?v=2452',
  'data/apocrypha/review/translation-overlays-v246-continuation.json?v=2461'
];
const TARGET=/data\/apocrypha\/runtime\/apocrypha-browser-19\.preview\.json(?:[?#]|$)/;
const previousFetch=window.fetch.bind(window);
let overlaysPromise=null;
function isTarget(input){try{const raw=typeof input==='string'?input:input instanceof URL?input.href:input?.url||'';return TARGET.test(new URL(raw,document.baseURI).href)}catch(_){return false}}
function indexBooks(data){const out=new Map();for(const book of data?.books||[])out.set(String(book.book_id),book);return out}
function ensureChapter(book,no){let ch=(book.chapters||[]).find(x=>Number(x.chapter)===Number(no));if(!ch){ch={chapter:Number(no),verses:[]};book.chapters=book.chapters||[];book.chapters.push(ch);book.chapters.sort((a,b)=>Number(a.chapter)-Number(b.chapter))}return ch}
function ensureVerse(ch,no){let v=(ch.verses||[]).find(x=>Number(x.verse)===Number(no));if(!v){v={verse:Number(no),text_en:null,text_fa:null,text_hr:null};ch.verses=ch.verses||[];ch.verses.push(v);ch.verses.sort((a,b)=>Number(a.verse)-Number(b.verse))}return v}
function applyLocalizedRow(v,row,loc,textField,statusField){const text=String(row?.[textField]||'').trim(),status=String(row?.[statusField]||'');if(status==='in_review'&&text){v['text_'+loc]=row[textField];v['status_'+loc]='in_review'}}
function mergeDocument(runtime,doc){if(!doc?.book_id)return;const books=indexBooks(runtime);const book=books.get(String(doc.book_id));if(!book)return;
  if(Array.isArray(doc.verses)){
    const ch=ensureChapter(book,Number(doc.chapter||1));
    for(const row of doc.verses||[]){const v=ensureVerse(ch,row.verse);applyLocalizedRow(v,row,'fa','text_fa','status_fa');applyLocalizedRow(v,row,'hr','text_hr','status_hr')}
  }
  if(Array.isArray(doc.chapters)){
    const declared=String(doc.language||'');
    for(const chapter of doc.chapters){const ch=ensureChapter(book,chapter.chapter);for(const row of chapter.verses||[]){const v=ensureVerse(ch,row.verse);
      if(['fa','hr'].includes(declared)){const text=String(row.text||'').trim();if(text){v['text_'+declared]=row.text;v['status_'+declared]='in_review'}}
      else{applyLocalizedRow(v,row,'fa','text_fa','status_fa');applyLocalizedRow(v,row,'hr','text_hr','status_hr')}
    }}
  }
}
async function loadOverlays(){
  if(overlaysPromise)return overlaysPromise;
  overlaysPromise=(async()=>{
    const docs=[],seenPaths=new Set();
    for(const registryUrl of REGISTRIES){
      try{
        const rr=await previousFetch(registryUrl,{cache:'no-store'});
        if(!rr.ok)throw new Error('HTTP '+rr.status);
        const reg=await rr.json();
        for(const path of reg.files||[]){
          if(seenPaths.has(path))continue;
          seenPaths.add(path);
          try{const r=await previousFetch(path,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);docs.push(await r.json())}
          catch(e){console.warn('NH7 overlay file failed',path,e)}
        }
      }catch(e){console.warn('NH7 overlay registry failed',registryUrl,e)}
    }
    return docs;
  })().catch(e=>{console.warn('NH7 overlay loading failed',e);return[]});
  return overlaysPromise;
}
window.fetch=async function nh7ApocryphaOverlayFetch(input,init={}){if(!isTarget(input))return previousFetch(input,init);const response=await previousFetch(input,init);if(!response.ok)return response;try{const data=await response.clone().json();for(const doc of await loadOverlays())mergeDocument(data,doc);return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}catch(e){console.warn('NH7 Apocrypha overlay merge failed',e);return response}};
window.NH7_APOCRYPHA_TRANSLATION_OVERLAY_VERSION=VERSION;
})();
