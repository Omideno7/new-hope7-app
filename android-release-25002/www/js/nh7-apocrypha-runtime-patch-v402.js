/* New Hope 7 Wave 1A v4.0.2 — restores Esther 10:1-3 in the trilingual runtime.
 * The large 19-book asset remains unchanged and lazy; this tiny overlay is applied
 * only when that asset is parsed.
 */
(()=>{'use strict';
if(window.__NH7_APOCRYPHA_RUNTIME_PATCH_V402__)return;
window.__NH7_APOCRYPHA_RUNTIME_PATCH_V402__=true;
const VERSION='4.0.2-esther-10-1-3';
const TARGET='/data/apocrypha/runtime/apocrypha-browser-19.preview.json';
const PATCH_URL='data/apocrypha/runtime/additions-to-esther-ch1-v402.json?v=4020';
const nativeJson=Response.prototype.json;
let patchPromise=null;

function isTarget(response){
  const url=String(response?.url||'');
  return url.includes(TARGET);
}
function loadPatch(){
  if(!patchPromise){
    patchPromise=fetch(PATCH_URL,{cache:'force-cache'})
      .then(response=>{
        if(!response.ok)throw new Error('Esther overlay HTTP '+response.status);
        return response.json();
      })
      .then(patch=>{
        const numbers=(patch?.verses||[]).map(row=>Number(row.verse)).sort((a,b)=>a-b);
        if(patch?.book_id!=='additions_to_esther'||Number(patch?.chapter)!==1||numbers.join(',')!=='1,2,3'){
          throw new Error('Invalid Esther 10:1-3 overlay');
        }
        for(const row of patch.verses){
          for(const locale of ['en','fa','hr']){
            if(!String(row?.['text_'+locale]||'').trim())throw new Error(`Esther ${row.verse}: missing ${locale}`);
          }
        }
        return patch;
      });
  }
  return patchPromise;
}
function countRows(book,key){
  return (book?.chapters||[]).reduce((total,chapter)=>total+(chapter?.verses||[]).filter(row=>String(row?.[key]||'').trim()).length,0);
}
function updateCoverage(book){
  const en=countRows(book,'text_en'),fa=countRows(book,'text_fa'),hr=countRows(book,'text_hr');
  if(book?.coverage?.en&&Object.prototype.hasOwnProperty.call(book.coverage.en,'rows'))book.coverage.en.rows=en;
  for(const [locale,count] of [['fa',fa],['hr',hr]]){
    const coverage=book?.coverage?.[locale];
    for(const key of ['structured','canonical_aligned']){
      const section=coverage?.[key];
      if(!section||typeof section!=='object')continue;
      if(Object.prototype.hasOwnProperty.call(section,'translated_rows'))section.translated_rows=count;
      if(Object.prototype.hasOwnProperty.call(section,'source_rows'))section.source_rows=en;
      if(Array.isArray(section.missing_chapters)&&count===en)section.missing_chapters=[];
    }
  }
}
function applyPatch(data,patch){
  if(!data||!Array.isArray(data.books)||!patch)return data;
  const book=data.books.find(row=>String(row?.book_id)===String(patch.book_id));
  const chapter=(book?.chapters||[]).find(row=>Number(row?.chapter)===Number(patch.chapter));
  if(!book||!chapter)throw new Error('Additions to Esther chapter 1 not found');
  const rows=new Map((chapter.verses||[]).map(row=>[Number(row.verse),row]));
  for(const verse of patch.verses){
    const number=Number(verse.verse);
    rows.set(number,Object.assign({},rows.get(number)||{},verse,{verse:number}));
  }
  chapter.verses=[...rows.values()].sort((a,b)=>Number(a.verse)-Number(b.verse));
  updateCoverage(book);
  data.nh7_runtime_patches=[...new Set([...(Array.isArray(data.nh7_runtime_patches)?data.nh7_runtime_patches:[]),VERSION])];
  return data;
}
Response.prototype.json=function(...args){
  const targeted=isTarget(this);
  const parsed=nativeJson.apply(this,args);
  if(!targeted)return parsed;
  return Promise.all([
    parsed,
    loadPatch().catch(error=>{
      console.error('[NH7 Esther runtime overlay]',error);
      return null;
    })
  ]).then(([data,patch])=>applyPatch(data,patch));
};
window.NH7_APOCRYPHA_RUNTIME_PATCH_VERSION=VERSION;
})();
