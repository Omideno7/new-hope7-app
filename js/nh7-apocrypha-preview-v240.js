/* New Hope 7 v2.4.0 RC — 19-book trilingual Apocrypha preview integration.
 * Release-candidate branch only. Keeps review/draft content out of production until approval.
 */
(()=>{'use strict';
const VERSION='2.4.0-rc-apocrypha-19';
const DATA_URL='data/apocrypha/runtime/apocrypha-browser-19.preview.json?v=6402';
let payload=null,loading=null,active=false,currentBook=null,currentUnit=1;
const $=(s,r=document)=>r.querySelector(s);
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>lang()==='fa'?String(v).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):String(v);
const view=()=>$('#view');
function title(book){return book?.['title_'+lang()]||book?.title_en||book?.title_fa||book?.title_hr||book?.book_id||''}
function load(force=false){if(payload&&!force)return Promise.resolve(payload);if(loading&&!force)return loading;loading=fetch(DATA_URL,{cache:force?'reload':'force-cache'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(data=>{if(data?.totals?.books!==19||!Array.isArray(data?.books))throw new Error('Incomplete 19-book preview asset');payload=data;return data}).finally(()=>loading=null);return loading}
function shell(body){const root=view();if(!root)return;root.innerHTML=body}
function goBible(){active=false;const btn=$('.nav-item[data-route="bible"]');if(btn)btn.click();else location.hash='#bible'}
function backButton(target='bible'){return `<button type="button" class="secondary-btn nh7-apo-back" data-rc-apo-back="${target}">‹ ${esc(target==='catalog'?L('فهرست اپوکریفا','Apocrypha catalogue','Popis apokrifa'):L('بازگشت به کتاب‌ها','Back to books','Natrag na knjige'))}</button>`}
function statusText(book){const loc=lang();const coverage=book?.coverage?.[loc]||{};const state=coverage.status||book?.status||'in_review';if(String(state).includes('review'))return L('در حال بازبینی','In review','U provjeri');if(String(state).includes('draft'))return L('پیش‌نویس','Draft','Nacrt');return L('آمادهٔ پیش‌نمایش','Preview ready','Spremno za pregled')}
function renderLoading(){active=true;shell(backButton()+`<section class="card nh7-apo-client-card"><h2>${esc(L('کتاب‌های اپوکریفا','Apocrypha books','Apokrifne knjige'))}</h2><div class="nh7-apo-loading"><span></span><p>${esc(L('در حال آماده‌سازی ۱۹ کتاب…','Preparing 19 books…','Priprema 19 knjiga…'))}</p></div></section>`)}
function renderError(error){shell(backButton()+`<section class="card"><h2>${esc(L('اپوکریفا','Apocrypha','Apokrifi'))}</h2><div class="notice"><p>${esc(L('نسخهٔ تست اپوکریفا بارگذاری نشد. دوباره تلاش کنید.','The Apocrypha preview could not be loaded. Try again.','Pregled apokrifa nije učitan. Pokušajte ponovno.'))}</p><small>${esc(error?.message||error||'')}</small><div class="button-row"><button class="primary-btn" data-rc-apo-retry>${esc(L('تلاش دوباره','Retry','Pokušaj ponovno'))}</button></div></div></section>`)}
function renderCatalog(){active=true;currentBook=null;const books=payload?.books||[];shell(backButton()+`<section class="card nh7-apo-client-card"><h2>${esc(L('کتاب‌های اپوکریفا','Apocrypha books','Apokrifne knjige'))}</h2><p class="muted">${esc(L('۱۹ کتاب با پوشش فارسی، انگلیسی و کرواتی — نسخهٔ نامزد انتشار برای بازبینی.','19 books with Persian, English and Croatian coverage — release-candidate review build.','19 knjiga s perzijskim, engleskim i hrvatskim tekstom — kandidat za izdanje.'))}</p><div class="nh7-apo-book-grid">${books.map(book=>`<button type="button" class="nh7-apo-book" data-rc-apo-book="${esc(book.book_id)}"><span>📜</span><strong>${esc(title(book))}</strong><small>${esc(statusText(book))}</small></button>`).join('')}</div></section>`)}
function preparedHr(book){return Array.isArray(book?.hr_prepared?.chapters)?book.hr_prepared.chapters:Array.isArray(book?.croatian_prepared?.chapters)?book.croatian_prepared.chapters:[]}
function useFaDocument(book){if(lang()!=='fa'||!Array.isArray(book?.fa_document?.pages)||!book.fa_document.pages.length)return false;const structured=Number(book?.coverage?.fa?.structured?.translated_rows||0),total=Number(book?.coverage?.en?.rows||0);return total>0&&structured<total}
function chapterRows(book,chapterNo){const chapter=(book?.chapters||[]).find(c=>Number(c.chapter)===Number(chapterNo));if(!chapter)return[];if(lang()==='hr'){
  const direct=(chapter.verses||[]).filter(v=>String(v.text_hr||'').trim());if(direct.length)return direct.map(v=>({verse:v.verse,text:v.text_hr,status:v.status_hr||v.status}));
  const alt=preparedHr(book).find(c=>Number(c.chapter)===Number(chapterNo));return(alt?.verses||[]).map(v=>({verse:v.verse,text:v.text_hr,status:v.status_hr||v.status}));
}
const key=lang()==='fa'?'text_fa':'text_en',statusKey=lang()==='fa'?'status_fa':'status_en';return(chapter.verses||[]).filter(v=>String(v[key]||'').trim()).map(v=>({verse:v.verse,text:v[key],status:v[statusKey]||v.status}));}
function renderBook(book,requested=1){active=true;currentBook=book;currentUnit=Math.max(1,Number(requested)||1);const doc=useFaDocument(book);let max=1,content='';if(doc){const pages=book.fa_document.pages||[];max=pages.length||1;if(currentUnit>max)currentUnit=1;const page=pages[currentUnit-1];content=`<div class="nh7-apo-page-text" dir="rtl" style="white-space:pre-wrap;line-height:2">${esc(page?.text||'')}</div>`;}else{max=Math.max(1,(book.chapters||[]).length);if(currentUnit>max)currentUnit=1;const rows=chapterRows(book,currentUnit);content=rows.length?`<div class="nh7-apo-text-verses">${rows.map(v=>`<p class="verse-row"><b>${num(v.verse)}</b> ${esc(v.text)}</p>`).join('')}</div>`:`<div class="notice">${esc(L('برای این فصل در زبان انتخاب‌شده متنی پیدا نشد.','No text was found for this chapter in the selected language.','Nema teksta za ovo poglavlje na odabranom jeziku.'))}</div>`;}
const label=doc?L('صفحه','Page','Stranica'):L('فصل','Chapter','Poglavlje');shell(backButton('catalog')+`<section class="card nh7-apo-client-card"><div style="display:flex;gap:12px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap"><div><h2>${esc(title(book))}</h2><p class="muted">${esc(statusText(book))} · ${esc(L('این متن هنوز برای انتشار نهایی تأیید نشده است.','This text has not yet been approved for final publication.','Ovaj tekst još nije odobren za konačnu objavu.'))}</p></div><label>${esc(label)} <select data-rc-apo-unit>${Array.from({length:max},(_,i)=>i+1).map(n=>`<option value="${n}" ${n===currentUnit?'selected':''}>${num(n)}</option>`).join('')}</select></label></div><div class="notice" style="margin:12px 0"><strong>${esc(L('نسخهٔ تست پیش از انتشار','Pre-release test build','Testna verzija prije objave'))}</strong></div>${content}</section>`)}
function openCatalog(){renderLoading();load().then(renderCatalog).catch(renderError)}
function openBook(id){const book=(payload?.books||[]).find(b=>String(b.book_id)===String(id));if(book)renderBook(book,1)}
document.addEventListener('click',event=>{
  const launch=event.target.closest?.('[data-go="apocrypha"]');if(launch){event.preventDefault();event.stopImmediatePropagation();openCatalog();return}
  const book=event.target.closest?.('[data-rc-apo-book]');if(book){event.preventDefault();event.stopImmediatePropagation();openBook(book.dataset.rcApoBook);return}
  const back=event.target.closest?.('[data-rc-apo-back]');if(back){event.preventDefault();event.stopImmediatePropagation();if(back.dataset.rcApoBack==='catalog')renderCatalog();else goBible();return}
  const retry=event.target.closest?.('[data-rc-apo-retry]');if(retry){event.preventDefault();renderLoading();load(true).then(renderCatalog).catch(renderError)}
},true);
document.addEventListener('change',event=>{if(event.target.matches?.('[data-rc-apo-unit]')&&currentBook){renderBook(currentBook,Number(event.target.value)||1);return}if(event.target.id==='langSelect'&&active){setTimeout(()=>{if(currentBook)renderBook(currentBook,currentUnit);else if(payload)renderCatalog()},40)}},true);
window.NH7_APOCRYPHA_RC_VERSION=VERSION;
})();