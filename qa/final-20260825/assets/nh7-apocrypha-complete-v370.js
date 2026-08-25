/* New Hope 7 Final QA v3.7.0 — complete 19-book trilingual Apocrypha reader.
 * Uses structured chapter/verse text when complete and the reviewed prepared
 * Persian/Croatian payloads as the reader fallback, matching the approved
 * standalone 19-book preview behavior without changing production main.
 */
(()=>{'use strict';
if(window.__NH7_APOCRYPHA_COMPLETE_V370__)return;
window.__NH7_APOCRYPHA_COMPLETE_V370__=true;
const VERSION='3.7.0-complete-apocrypha';
const AP_SHA='a4235c6c0c38d24abf4dbd6a975f2a03c196de60';
const DATA_URL=`https://raw.githack.com/Omideno7/new-hope7-app/${AP_SHA}/data/apocrypha/runtime/apocrypha-browser-19.preview.json?v=3700`;
const NOTE_PREFIX='nh7_apo_note_v370:';
const HIGHLIGHT_PREFIX='nh7_apo_highlight_v370:';
let asset=null,loading=null,active=false,selected=null,mode='chapters',currentUnit=1;
const $=(s,r=document)=>r.querySelector(s);
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>lang()==='fa'?String(v).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):String(v);
const titleFor=b=>b?.['title_'+lang()]||b?.title_en||b?.title_fa||b?.title_hr||b?.book_id||'';
const view=()=>$('#view');
function setBread(text){const el=$('#breadcrumb');if(el)el.textContent=text||L('کتاب','Bible','Biblija')}
function preparedHr(book){return book?.hr_prepared||book?.croatian_prepared||null}
function structuredRows(book,chapter,locale=lang()){
  const ch=(book?.chapters||[]).find(x=>Number(x.chapter)===Number(chapter));
  if(!ch)return[];
  const key='text_'+locale;
  return (ch.verses||[]).filter(v=>typeof v[key]==='string'&&v[key].trim()).map(v=>({verse:Number(v.verse),text:String(v[key]),status:v['status_'+locale]||v.status||''}));
}
function preparedHrRows(book,chapter){
  const ch=(preparedHr(book)?.chapters||[]).find(x=>Number(x.chapter)===Number(chapter));
  return (ch?.verses||[]).filter(v=>typeof v.text_hr==='string'&&v.text_hr.trim()).map(v=>({verse:Number(v.verse),text:String(v.text_hr),status:'prepared'}));
}
function structuredUnits(book,locale=lang()){
  return (book?.chapters||[]).filter(c=>structuredRows(book,c.chapter,locale).length).map(c=>Number(c.chapter)).filter(Number.isFinite).sort((a,b)=>a-b);
}
function allEnglishRows(book){return Number(book?.coverage?.en?.rows||0)}
function translatedRows(book,locale){
  if(locale==='fa')return Number(book?.coverage?.fa?.structured?.translated_rows||0);
  if(locale==='hr')return Number(book?.coverage?.hr?.structured?.translated_rows||book?.coverage?.hr?.rows||0);
  return allEnglishRows(book);
}
function resolveMode(book){
  const l=lang();
  if(l==='en')return{kind:'chapters',units:structuredUnits(book,'en'),source:'structured'};
  if(l==='hr'){
    const prepared=preparedHr(book);
    if(Array.isArray(prepared?.chapters)&&prepared.chapters.length){
      const units=prepared.chapters.map(c=>Number(c.chapter)).filter(Number.isFinite).sort((a,b)=>a-b);
      return{kind:'chapters',units,source:'hr_prepared'};
    }
    return{kind:'chapters',units:structuredUnits(book,'hr'),source:'structured'};
  }
  const enRows=allEnglishRows(book),faRows=translatedRows(book,'fa'),pages=book?.fa_document?.pages||[];
  if(enRows>0&&faRows>=enRows){return{kind:'chapters',units:structuredUnits(book,'fa'),source:'structured'};}
  if(pages.length){return{kind:'pages',units:pages.map((_,i)=>i+1),source:'fa_document'};}
  const units=structuredUnits(book,'fa');
  return{kind:units.length?'chapters':'none',units,source:'structured_partial'};
}
function load(force=false){
  if(asset&&!force)return Promise.resolve(asset);
  if(loading&&!force)return loading;
  loading=fetch(DATA_URL,{cache:force?'reload':'no-store'}).then(r=>{if(!r.ok)throw new Error('Apocrypha asset HTTP '+r.status);return r.json()}).then(data=>{
    if(data?.asset_id!=='new_hope_7_apocrypha_browser_19_preview'||data?.totals?.books!==19||data?.totals?.english_books!==19)throw new Error('Incomplete 19-book Apocrypha asset');
    asset=data;return data;
  }).finally(()=>loading=null);
  return loading;
}
function shell(html){const root=view();if(root)root.innerHTML=html}
function backToBible(){active=false;selected=null;$('.nav-item[data-route="bible"]')?.click();setBread()}
function statusFor(book){
  const l=lang(),resolved=resolveMode(book);
  if(l==='en')return L('متن مرجع انگلیسی','English reference text','Engleski referentni tekst');
  if(l==='fa'&&resolved.source==='fa_document')return L('متن فارسی کامل آماده — نمایش صفحه‌ای','Complete prepared Persian text — page view','Potpuni pripremljeni perzijski tekst — prikaz stranica');
  if(l==='hr'&&resolved.source==='hr_prepared')return L('متن کرواتی آماده','Prepared Croatian text','Pripremljeni hrvatski tekst');
  if(resolved.units.length)return L('ترجمه فصل‌بندی‌شده آماده','Structured translation ready','Strukturirani prijevod je spreman');
  return L('متن در دسترس نیست','Text unavailable','Tekst nije dostupan');
}
function renderLoading(){active=true;setBread(L('اپوکریفا','Apocrypha','Apokrifi'));shell(`<section class="card nh7-apo-v370-state"><h2>${esc(L('کتاب‌های اپوکریفا','Apocrypha books','Apokrifne knjige'))}</h2><p>${esc(L('در حال آماده‌سازی ۱۹ کتاب…','Preparing 19 books…','Priprema 19 knjiga…'))}</p></section>`)}
function renderError(error){active=true;shell(`<button type="button" class="secondary-btn" data-v370-back-bible>‹ ${esc(L('بازگشت','Back','Natrag'))}</button><section class="card nh7-apo-v370-state"><h2>${esc(L('اپوکریفا','Apocrypha','Apokrifi'))}</h2><div class="notice"><p>${esc(L('داده‌های ۱۹ کتاب بارگذاری نشد.','The 19-book data could not be loaded.','Podaci za 19 knjiga nisu učitani.'))}</p><small>${esc(error?.message||error||'')}</small><br><button class="primary-btn" data-v370-retry>${esc(L('تلاش دوباره','Retry','Pokušaj ponovno'))}</button></div></section>`)}
function renderCatalog(){
  active=true;selected=null;setBread(L('اپوکریفا','Apocrypha','Apokrifi'));
  const books=asset?.books||[];
  shell(`<button type="button" class="secondary-btn nh7-apo-v370-back" data-v370-back-bible>‹ ${esc(L('بازگشت به کتاب','Back to Bible','Natrag na Bibliju'))}</button><section class="card nh7-apo-v370-card"><div class="section-title"><h2>${esc(L('کتاب‌های اپوکریفا','Apocrypha books','Apokrifne knjige'))}</h2><p>${esc(L('۱۹ کتاب با پوشش فارسی، انگلیسی و کرواتی','19 books with Persian, English and Croatian coverage','19 knjiga s perzijskim, engleskim i hrvatskim tekstom'))}</p></div><div class="nh7-apo-v370-grid">${books.map((b,i)=>`<button type="button" class="nh7-apo-v370-book" data-v370-book="${esc(b.book_id)}"><span class="nh7-apo-v370-number">${num(i+1)}</span><span><strong>${esc(titleFor(b))}</strong><small>${esc(b.title_en||'')}</small><em>${esc(statusFor(b))}</em></span></button>`).join('')}</div></section>`);
}
function noteKey(book,unit,verse){return `${NOTE_PREFIX}${book.book_id}:${unit}:${verse}`}
function hiKey(book,unit,verse){return `${HIGHLIGHT_PREFIX}${book.book_id}:${unit}:${verse}`}
function noteFor(book,unit,verse){return localStorage.getItem(noteKey(book,unit,verse))||''}
function highlighted(book,unit,verse){return localStorage.getItem(hiKey(book,unit,verse))==='1'}
function rowHtml(book,unit,row){
  const note=noteFor(book,unit,row.verse),hi=highlighted(book,unit,row.verse);
  return `<article class="nh7-apo-verse ${hi?'is-highlighted':''}" data-apo-verse="${row.verse}"><button type="button" class="nh7-apo-verse-main" data-v370-tools="${row.verse}" aria-expanded="false"><span class="nh7-apo-verse-num">${num(row.verse)}</span><span class="nh7-apo-verse-text">${esc(row.text)}</span>${note?'<span class="nh7-apo-note-mark">📓</span>':''}</button><div class="nh7-apo-verse-tools hidden" data-v370-toolbox="${row.verse}"><div class="nh7-apo-tool-buttons"><button type="button" data-v370-highlight="${row.verse}">🖍 ${esc(hi?L('حذف هایلایت','Remove highlight','Ukloni isticanje'):L('هایلایت','Highlight','Istakni'))}</button><button type="button" data-v370-note="${row.verse}">📝 ${esc(L('یادداشت','Note','Bilješka'))}</button><button type="button" data-v370-copy="${row.verse}">📋 ${esc(L('کپی','Copy','Kopiraj'))}</button><button type="button" data-v370-share="${row.verse}">↗ ${esc(L('ارسال','Share','Podijeli'))}</button></div><div class="nh7-apo-note-editor ${note?'':'hidden'}" data-v370-note-editor="${row.verse}"><textarea rows="3" maxlength="2000" placeholder="${esc(L('یادداشت خصوصی شما…','Your private note…','Vaša privatna bilješka…'))}">${esc(note)}</textarea><button type="button" class="primary-btn" data-v370-save-note="${row.verse}">${esc(L('ذخیره','Save','Spremi'))}</button></div></div></article>`;
}
function rowsFor(book,unit,resolved){return resolved.source==='hr_prepared'?preparedHrRows(book,unit):structuredRows(book,unit,lang())}
function renderBook(book,requestedUnit){
  active=true;selected=book;const resolved=resolveMode(book);mode=resolved.kind;
  const units=resolved.units,current=units.includes(Number(requestedUnit))?Number(requestedUnit):(units[0]||1);currentUnit=current;
  const books=asset?.books||[],bi=Math.max(0,books.findIndex(b=>b.book_id===book.book_id)),prevBook=books[bi-1],nextBook=books[bi+1],ui=units.indexOf(current),prev=ui>0?units[ui-1]:null,next=ui>=0&&ui<units.length-1?units[ui+1]:null;
  setBread(titleFor(book));
  let body='';
  if(mode==='pages'){
    const page=book.fa_document?.pages?.[Math.max(0,current-1)];
    body=page?.text?`<div class="nh7-apo-v370-page" dir="rtl">${esc(page.text).replaceAll('\n','<br>')}</div>`:`<div class="notice">${esc(L('متن این صفحه در دسترس نیست.','This page is unavailable.','Ova stranica nije dostupna.'))}</div>`;
  }else if(mode==='chapters'){
    const rows=rowsFor(book,current,resolved);
    body=rows.length?`<div class="nh7-apo-continuous-reader" data-apo-swipe="1">${rows.map(row=>rowHtml(book,current,row)).join('')}</div>`:`<div class="notice">${esc(L('متن این فصل در دسترس نیست.','This chapter is unavailable.','Ovo poglavlje nije dostupno.'))}</div>`;
  }else body=`<div class="notice">${esc(L('برای این کتاب در این زبان متن قابل نمایش پیدا نشد.','No displayable text was found for this book in this language.','Za ovu knjigu na ovom jeziku nije pronađen tekst.'))}</div>`;
  const unitLabel=mode==='pages'?L('صفحه','Page','Stranica'):L('باب','Chapter','Poglavlje');
  shell(`<button type="button" class="secondary-btn nh7-apo-v370-back" data-v370-catalog>‹ ${esc(L('فهرست کتاب‌ها','Book list','Popis knjiga'))}</button><section class="card nh7-apo-reader-card nh7-apo-v370-card"><div class="nh7-apo-book-nav"><button class="secondary-btn" ${prevBook?`data-v370-book="${esc(prevBook.book_id)}"`:'disabled'}>‹ ${esc(L('کتاب قبلی','Previous book','Prethodna knjiga'))}</button><button class="secondary-btn" data-v370-catalog>☷ ${esc(L('فهرست کتاب‌ها','Book list','Popis knjiga'))}</button><button class="secondary-btn" ${nextBook?`data-v370-book="${esc(nextBook.book_id)}"`:'disabled'}>${esc(L('کتاب بعدی','Next book','Sljedeća knjiga'))} ›</button></div><header class="nh7-apo-reader-head"><div><h2>${esc(titleFor(book))}</h2><p class="muted">${esc(statusFor(book))}</p></div><label>${esc(unitLabel)} <select data-rc-apo-chapter data-v370-unit>${units.map(n=>`<option value="${n}" ${n===current?'selected':''}>${num(n)}</option>`).join('')}</select></label></header><div class="nh7-apo-v370-review"><strong>${esc(L('نسخه نهایی آزمایشی','Final QA','Završni QA'))}</strong><span>${esc(mode==='pages'?L('متن فارسی آمادهٔ کامل — نمایش صفحه‌ای','Complete prepared Persian text — page view','Potpuni pripremljeni perzijski tekst — prikaz stranica'):L('متن فصل‌بندی‌شدهٔ پروژه','Project structured text','Strukturirani tekst projekta'))}</span></div>${body}<div class="nh7-apo-chapter-nav"><button class="secondary-btn" ${prev?`data-v370-unit-nav="${prev}"`:'disabled'}>‹ ${esc(mode==='pages'?L('صفحه قبلی','Previous page','Prethodna stranica'):L('باب قبلی','Previous chapter','Prethodno poglavlje'))}</button><span>${esc(unitLabel)} ${num(current)} / ${num(units.length)}</span><button class="secondary-btn" ${next?`data-v370-unit-nav="${next}"`:'disabled'}>${esc(mode==='pages'?L('صفحه بعدی','Next page','Sljedeća stranica'):L('باب بعدی','Next chapter','Sljedeće poglavlje'))} ›</button></div></section>`);
  if(mode==='chapters')bindSwipe(prev,next);
}
function bindSwipe(prev,next){const reader=$('[data-apo-swipe]');if(!reader)return;let sx=0,sy=0,tracking=false;reader.addEventListener('touchstart',e=>{if(e.touches.length!==1||e.target.closest('button,textarea,input,a,select'))return;tracking=true;sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});reader.addEventListener('touchend',e=>{if(!tracking||!e.changedTouches.length)return;tracking=false;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)<65||Math.abs(dx)<Math.abs(dy)*1.35)return;const target=dx<0?next:prev;if(target)renderBook(selected,target)},{passive:true})}
async function openCatalog(){renderLoading();try{await load();renderCatalog()}catch(error){renderError(error)}}
function copyText(text){if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text).catch(()=>{});const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(_){}ta.remove();return Promise.resolve()}
function currentRow(verse){const resolved=resolveMode(selected);return rowsFor(selected,currentUnit,resolved).find(v=>Number(v.verse)===Number(verse))}
function shareText(row){return `${titleFor(selected)} ${currentUnit}:${row.verse} — ${row.text}`}
function saveNote(verse,button){const editor=$(`[data-v370-note-editor="${CSS.escape(String(verse))}"]`),text=editor?.querySelector('textarea')?.value?.trim()||'',key=noteKey(selected,currentUnit,verse);if(text)localStorage.setItem(key,text);else localStorage.removeItem(key);if(button)button.textContent='✓ '+L('ذخیره شد','Saved','Spremljeno');setTimeout(()=>renderBook(selected,currentUnit),180)}
function injectStyle(){if($('#nh7-apocrypha-complete-v370-style'))return;const s=document.createElement('style');s.id='nh7-apocrypha-complete-v370-style';s.textContent=`
.nh7-apo-v370-back{margin:0 0 10px}.nh7-apo-v370-card{max-width:980px;margin-inline:auto}.nh7-apo-v370-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.nh7-apo-v370-book{display:flex;align-items:flex-start;gap:10px;text-align:start;border:1px solid #d9e7e4;background:#fff;border-radius:15px;padding:13px;color:inherit}.nh7-apo-v370-number{display:flex;align-items:center;justify-content:center;min-width:32px;height:32px;border-radius:10px;background:#e9f5f2;color:#0b6a5d;font-weight:900}.nh7-apo-v370-book strong,.nh7-apo-v370-book small,.nh7-apo-v370-book em{display:block}.nh7-apo-v370-book small{opacity:.68;margin-top:3px}.nh7-apo-v370-book em{font-style:normal;color:#0f766e;font-size:.75rem;margin-top:5px}.nh7-apo-v370-review{display:flex;flex-direction:column;gap:3px;margin:10px 0 15px;padding:10px 12px;border:1px solid #e7c96c;border-radius:12px;background:#fff8df;color:#5b4100;font-size:.88rem}.nh7-apo-v370-page{direction:rtl;text-align:right;white-space:normal;line-height:2.05;font-size:1.02rem;overflow-wrap:anywhere}.nh7-apo-v370-state{text-align:center;padding:26px 18px}.nh7-apo-verse.is-highlighted{background:#fff7c9;border-radius:10px}.nh7-apo-verse-main{width:100%;display:flex;align-items:flex-start;gap:8px;text-align:start;border:0;background:transparent;color:inherit;padding:10px 4px}.nh7-apo-verse-num{min-width:29px;height:29px;display:inline-flex;align-items:center;justify-content:center;border-radius:9px;background:#e9f5f2;color:#0b6a5d;font-weight:800}.nh7-apo-verse-tools{padding:0 4px 10px}.nh7-apo-tool-buttons{display:flex;flex-wrap:wrap;gap:6px}.nh7-apo-tool-buttons button{font-size:.82rem}.nh7-apo-note-editor{margin-top:8px}.nh7-apo-note-editor textarea{width:100%;box-sizing:border-box}.nh7-apo-book-nav,.nh7-apo-chapter-nav{display:flex;align-items:center;justify-content:space-between;gap:7px;flex-wrap:wrap;margin:10px 0}.nh7-apo-reader-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}.nh7-apo-reader-head select{padding:7px;border-radius:8px}.hidden{display:none!important}@media(max-width:560px){.nh7-apo-v370-grid{grid-template-columns:1fr}.nh7-apo-book-nav button{flex:1;min-width:96px}.nh7-apo-chapter-nav button{flex:1}.nh7-apo-chapter-nav span{width:100%;text-align:center;order:-1}}
`;document.head.appendChild(s)}
injectStyle();
document.addEventListener('click',async e=>{
  const launch=e.target.closest?.('[data-go="apocrypha"]');if(launch){e.preventDefault();e.stopImmediatePropagation();openCatalog();return}
  if(!active)return;
  const back=e.target.closest?.('[data-v370-back-bible]');if(back){e.preventDefault();e.stopImmediatePropagation();backToBible();return}
  const cat=e.target.closest?.('[data-v370-catalog]');if(cat){e.preventDefault();e.stopImmediatePropagation();renderCatalog();return}
  const book=e.target.closest?.('[data-v370-book]');if(book){e.preventDefault();e.stopImmediatePropagation();const b=(asset?.books||[]).find(x=>x.book_id===book.dataset.v370Book);if(b)renderBook(b);return}
  const nav=e.target.closest?.('[data-v370-unit-nav]');if(nav){e.preventDefault();e.stopImmediatePropagation();renderBook(selected,Number(nav.dataset.v370UnitNav));return}
  const tools=e.target.closest?.('[data-v370-tools]');if(tools){e.preventDefault();const n=tools.dataset.v370Tools,box=$(`[data-v370-toolbox="${CSS.escape(String(n))}"]`);box?.classList.toggle('hidden');tools.setAttribute('aria-expanded',box?.classList.contains('hidden')?'false':'true');return}
  const hi=e.target.closest?.('[data-v370-highlight]');if(hi){e.preventDefault();const n=hi.dataset.v370Highlight,key=hiKey(selected,currentUnit,n);localStorage.getItem(key)==='1'?localStorage.removeItem(key):localStorage.setItem(key,'1');renderBook(selected,currentUnit);return}
  const note=e.target.closest?.('[data-v370-note]');if(note){e.preventDefault();$(`[data-v370-note-editor="${CSS.escape(String(note.dataset.v370Note))}"]`)?.classList.toggle('hidden');return}
  const save=e.target.closest?.('[data-v370-save-note]');if(save){e.preventDefault();saveNote(save.dataset.v370SaveNote,save);return}
  const copy=e.target.closest?.('[data-v370-copy]');if(copy){e.preventDefault();const row=currentRow(copy.dataset.v370Copy);if(row){await copyText(shareText(row));copy.textContent='✓ '+L('کپی شد','Copied','Kopirano')}return}
  const share=e.target.closest?.('[data-v370-share]');if(share){e.preventDefault();const row=currentRow(share.dataset.v370Share);if(!row)return;const text=shareText(row);if(navigator.share){try{await navigator.share({text})}catch(_){}}else await copyText(text);return}
  const retry=e.target.closest?.('[data-v370-retry]');if(retry){e.preventDefault();renderLoading();load(true).then(renderCatalog).catch(renderError)}
},true);
document.addEventListener('change',e=>{if(active&&e.target.matches?.('[data-v370-unit]'))renderBook(selected,Number(e.target.value));if(e.target.id==='langSelect'&&active)setTimeout(()=>selected?renderBook(selected,currentUnit):renderCatalog(),40)},true);
window.addEventListener('languagechange',()=>{if(active)setTimeout(()=>selected?renderBook(selected,currentUnit):renderCatalog(),20)});
window.NH7_APOCRYPHA_COMPLETE_VERSION=VERSION;
window.NH7_APOCRYPHA_COMPLETE_OPEN=openCatalog;
})();
