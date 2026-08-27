/* New Hope 7 v2.8.3 — chapter-aware, trilingual in-app reader for books and Apocrypha. */
(()=>{'use strict';
if(window.__NH7_BOOK_READER_V283__)return;
window.__NH7_BOOK_READER_V283__=true;

const VERSION='2.8.3-book-reader';
const URL='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
const CODE_KEY='nh7_minister_library_code';
const POS_PREFIX='nh7_book_position_';
let catalog=new Map(),catalogBusy=false,lastCatalog=0,modal=null,book=null,pageIndex=0,searchTimer=0,refreshing=null;

const lang=()=>{const value=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(value)?value:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const E=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function storedSession(){try{const raw=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');return raw?.currentSession||raw?.session||raw||null}catch(_){return null}}
function jwtExpiry(token){try{const part=String(token||'').split('.')[1]||'';const normalized=part.replace(/-/g,'+').replace(/_/g,'/');const payload=JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length/4)*4,'=')));return Number(payload.exp||0)*1000}catch(_){return 0}}
function persistSession(value){if(!value)return;localStorage.setItem(SESSION_KEY,JSON.stringify(value))}
async function ensureSession(){
  let value=storedSession();
  if(value?.access_token&&jwtExpiry(value.access_token)>Date.now()+90000)return value;
  if(!value?.refresh_token||!navigator.onLine)return value;
  if(refreshing)return refreshing;
  refreshing=(async()=>{
    try{
      const response=await fetch(`${URL}/auth/v1/token?grant_type=refresh_token`,{method:'POST',cache:'no-store',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:value.refresh_token})});
      if(!response.ok)return value;
      const next=await response.json();
      if(next?.access_token){persistSession(next);value=next}
      return value;
    }catch(_){return value}finally{refreshing=null}
  })();
  return refreshing;
}
function userEmail(value=storedSession()){return String(value?.user?.email||localStorage.getItem('nh7_manual_email')||'').trim().toLowerCase()}
function deviceId(){let value=localStorage.getItem('nh7_device_id');if(!value){value='dev_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));localStorage.setItem('nh7_device_id',value)}return value}
async function headers(){const value=await ensureSession();const token=String(value?.access_token||'');return{apikey:KEY,Authorization:'Bearer '+(token||KEY),'Content-Type':'application/json'}}
function titleOf(row){const l=lang();return row?.['title_'+l]||row?.title_en||row?.title_fa||row?.title_hr||row?.file_name||L('کتاب','Book','Knjiga')}
const SELECT_FIELDS='id,title_fa,title_en,title_hr,audience,resource_type,apocrypha_book,reader_mode,reader_language,reader_status,reader_available,reader_page_count,collection_id';

async function loadCatalog(force=false){
  if(catalogBusy||(!force&&Date.now()-lastCatalog<15000))return;
  const current=await ensureSession();
  if(!current?.access_token)return;
  catalogBusy=true;
  try{
    const response=await fetch(`${URL}/rest/v1/nh7_library_items_v224?select=${SELECT_FIELDS}&reader_available=eq.true`,{headers:await headers(),cache:'no-store'});
    if(!response.ok)throw new Error(await response.text());
    const rows=await response.json();
    catalog=new Map((Array.isArray(rows)?rows:[]).map(row=>[String(row.id),row]));
    lastCatalog=Date.now();
  }catch(error){console.warn('[NH7 book catalog]',error)}finally{catalogBusy=false;decorate()}
}
async function ensureItem(id){
  id=String(id||'');
  if(catalog.has(id))return catalog.get(id);
  const current=await ensureSession();
  if(!current?.access_token)return null;
  try{
    const response=await fetch(`${URL}/rest/v1/nh7_library_items_v224?select=${SELECT_FIELDS}&id=eq.${encodeURIComponent(id)}&reader_available=eq.true&limit=1`,{headers:await headers(),cache:'no-store'});
    if(!response.ok)throw new Error(await response.text());
    const rows=await response.json(),item=Array.isArray(rows)?rows[0]:null;
    if(item)catalog.set(id,item);
    return item||null;
  }catch(error){console.warn('[NH7 book item]',error);return null}
}
function decorate(){
  document.querySelectorAll('[data-library-open]').forEach(fileButton=>{
    const id=String(fileButton.dataset.libraryOpen||''),row=catalog.get(id);
    if(!row?.reader_available)return;
    const actions=fileButton.parentElement;
    if(!actions)return;
    let readButton=actions.querySelector(`[data-nh7-book-open="${CSS.escape(id)}"]`);
    if(!readButton){
      readButton=document.createElement('button');
      readButton.type='button';
      readButton.className='primary-btn nh7-book-open-btn';
      readButton.dataset.nh7BookOpen=id;
      readButton.textContent='📖 '+L('مطالعه کتاب داخل اپ','Read book in app','Čitaj knjigu u aplikaciji');
      actions.insertBefore(readButton,fileButton);
    }
    if(row.reader_mode==='text')fileButton.style.display='none';
    else{
      fileButton.style.display='';
      fileButton.textContent='📄 '+L('فایل اصلی','Original file','Izvorna datoteka');
      fileButton.classList.remove('primary-btn');
      fileButton.classList.add('secondary-btn');
    }
  });
}
function savedMinisterCode(){try{const data=JSON.parse(sessionStorage.getItem(CODE_KEY)||'null');return data&&Date.now()-Number(data.at||0)<12*60*60*1000?String(data.code||''):''}catch(_){return''}}
async function readerRpc(item,code=''){
  const current=await ensureSession();
  const response=await fetch(`${URL}/rest/v1/rpc/nh7_library_reader_access_v250`,{method:'POST',headers:await headers(),body:JSON.stringify({p_item_id:item.id,p_code:code,p_device_id:deviceId(),p_user_email:userEmail(current)}),cache:'no-store'});
  const text=await response.text();let data={};
  try{data=text?JSON.parse(text):{}}catch(_){data={message:text}}
  if(!response.ok)throw new Error(data.message||text||response.statusText);
  return Array.isArray(data)?data[0]:data;
}
function accessError(data){
  const code=String(data?.code||'');
  if(code==='login_required')return L('برای مطالعه کتاب ابتدا وارد حساب شوید.','Sign in before reading.','Prijavite se prije čitanja.');
  if(code==='school_approval_required')return L('دسترسی مدرسه شما هنوز تأیید نشده است.','Your school access is not approved yet.','Pristup školi još nije odobren.');
  if(code==='content_access_required')return L('این کتاب مخصوص خادمان است و هنوز برای حساب شما فعال نشده است.','This ministers-only book has not been enabled for your account.','Ova knjiga za služitelje još nije omogućena za vaš račun.');
  if(['code_required','invalid_code','expired','max_uses'].includes(code))return L('کد کتابخانه خادمان نامعتبر یا منقضی است.','The ministers library code is invalid or expired.','Kod knjižnice nije valjan ili je istekao.');
  if(code==='reader_not_ready')return L('نسخهٔ کتاب داخل اپ هنوز آماده نشده است.','The in-app book is not ready yet.','Knjiga u aplikaciji još nije spremna.');
  return data?.message||L('کتاب باز نشد.','The book could not be opened.','Knjiga se nije mogla otvoriti.');
}
function readerPayload(data){
  const raw=data?.reader;
  if(typeof raw==='string')return{text:raw,pages:[]};
  if(raw&&typeof raw==='object')return{text:String(raw.text||''),pages:Array.isArray(raw.pages)?raw.pages:[]};
  return{text:'',pages:[]};
}
function looksLikeHeading(value){
  const text=String(value||'').trim();
  if(!text||text.length>150)return false;
  return /^(chapter|section|part|introduction|foreword|preface|appendix|conclusion|باب|فصل|بخش|قسمت|مقدمه|پیشگفتار|ضمیمه|نتیجه|poglavlje|dio|uvod|predgovor|dodatak|zaključak)\b/i.test(text)||/^\d+[.)\-:]/.test(text);
}
function normalizePage(page,index){
  const raw=String(page?.text||'').trim();
  let title=String(page?.title||'').trim();
  let text=raw;
  if(!title&&raw){
    const lines=raw.split(/\n/).map(line=>line.trim()).filter(Boolean);
    if(lines[0]&&looksLikeHeading(lines[0])){
      title=lines[0];
      const offset=raw.indexOf(lines[0])+lines[0].length;
      const remainder=raw.slice(offset).replace(/^\s+/,'').trim();
      if(remainder)text=remainder;
    }
  }
  return{number:Number(page?.number||index+1),title,text};
}
function makePages(payload){
  if(payload.pages.length)return payload.pages.map(normalizePage);
  const paragraphs=String(payload.text||'').split(/\n\s*\n/).map(value=>value.trim()).filter(Boolean),pages=[];
  let current='';
  for(const paragraph of paragraphs){
    if(current&&current.length+paragraph.length+2>5200){pages.push(normalizePage({number:pages.length+1,text:current.trim()},pages.length));current=''}
    current+=(current?'\n\n':'')+paragraph;
  }
  if(current.trim())pages.push(normalizePage({number:pages.length+1,text:current.trim()},pages.length));
  return pages.length?pages:[normalizePage({number:1,text:String(payload.text||'').trim()},0)];
}
function pageLabel(page,index){return String(page?.title||'').trim()||`${L('بخش','Section','Dio')} ${index+1}`}
function readPosition(id){try{return JSON.parse(localStorage.getItem(POS_PREFIX+id)||'{}')}catch(_){return{}}}
function savePosition(){if(!book)return;localStorage.setItem(POS_PREFIX+book.item.id,JSON.stringify({page:pageIndex,scroll:modal?.querySelector('.nh7-book-article')?.scrollTop||0,at:Date.now()}))}

async function openBook(id){
  const item=await ensureItem(id);
  if(!item){alert(L('نسخهٔ متنی این کتاب پیدا نشد.','The text edition of this book was not found.','Tekstualno izdanje knjige nije pronađeno.'));return false}
  const current=await ensureSession();
  if(!current?.access_token){alert(L('برای مطالعه کتاب ابتدا وارد حساب شوید.','Sign in before reading.','Prijavite se prije čitanja.'));return false}
  let code=item.audience==='ministers'?savedMinisterCode():'';
  let data=await readerRpc(item,code).catch(error=>({allowed:false,code:'request_failed',message:error.message}));
  if(!data?.allowed&&item.audience==='ministers'&&['code_required','invalid_code','expired','max_uses'].includes(String(data?.code||''))){
    code=String(prompt(L('کد کتابخانه خادمان را وارد کنید:','Enter the ministers library code:','Unesite kod knjižnice:'),'')||'').trim();
    if(!code)return false;
    data=await readerRpc(item,code).catch(error=>({allowed:false,code:'request_failed',message:error.message}));
    if(data?.allowed)sessionStorage.setItem(CODE_KEY,JSON.stringify({code,at:Date.now()}));
  }
  if(!data?.allowed){alert(accessError(data));return false}
  const pages=makePages(readerPayload(data)),position=readPosition(item.id);
  book={item,data,pages,language:data.reader_language||lang()};
  pageIndex=Math.max(0,Math.min(pages.length-1,Number(position.page||0)));
  showReader(Number(position.scroll||0));
  return true;
}
function removeModal(preserveBook=false){if(modal){savePosition();modal.remove();modal=null}document.body.classList.remove('nh7-book-open');if(!preserveBook)book=null}
function closeReader(){removeModal(false)}
function shell(){
  const title=book.data['title_'+book.language]||titleOf(book.item);
  return `<section class="nh7-book-shell"><header class="nh7-book-head"><button type="button" data-book-close>‹ ${E(L('بازگشت','Back','Natrag'))}</button><div><h2>${E(title)}</h2><small>${E(L('کتاب داخل اپ','In-app book','Knjiga u aplikaciji'))} · ${book.pages.length} ${E(L('بخش','sections','dijelova'))}</small></div><button type="button" data-book-top aria-label="${E(L('بالای صفحه','Top','Vrh'))}">↑</button></header><div class="nh7-book-toolbar"><input type="search" data-book-search placeholder="${E(L('جست‌وجو در کتاب…','Search in book…','Pretraži knjigu…'))}"><button type="button" class="nh7-book-tool-btn" data-book-font-down>A−</button><button type="button" class="nh7-book-tool-btn" data-book-font-up>A+</button><select data-book-theme><option value="light">${E(L('روشن','Light','Svijetlo'))}</option><option value="sepia">${E(L('کاغذی','Sepia','Sepija'))}</option><option value="dark">${E(L('تیره','Dark','Tamno'))}</option></select></div><div class="nh7-book-search-results" data-book-results></div><div class="nh7-book-progress"><i data-book-progress></i></div><main class="nh7-book-main"><article class="nh7-book-article"></article><aside class="nh7-book-sidebar"><h3>${E(L('فهرست بخش‌ها','Contents','Sadržaj'))}</h3><div class="nh7-book-page-list"></div></aside></main><footer class="nh7-book-footer"><button type="button" class="nh7-book-prev" data-book-prev>‹ ${E(L('بخش قبلی','Previous','Prethodno'))}</button><span class="nh7-book-count" data-book-count></span><button type="button" class="nh7-book-next" data-book-next>${E(L('بخش بعدی','Next','Sljedeće'))} ›</button></footer></section>`;
}
function showReader(savedScroll=0){
  if(!book)return;
  removeModal(true);
  modal=document.createElement('div');
  modal.className='nh7-book-modal';
  modal.dir=book.language==='fa'?'rtl':'ltr';
  modal.dataset.theme=localStorage.getItem('nh7_book_theme')||'light';
  modal.innerHTML=shell();
  document.body.appendChild(modal);
  document.body.classList.add('nh7-book-open');
  bindReader();
  renderPage(pageIndex,'',savedScroll);
}
function highlight(text,query){
  const safe=E(text);
  if(!query)return safe;
  const escaped=query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  try{return safe.replace(new RegExp(escaped,'gi'),match=>`<mark>${match}</mark>`)}catch(_){return safe}
}
function renderPage(index,query='',savedScroll=0){
  if(!book||!modal)return;
  savePosition();
  pageIndex=Math.max(0,Math.min(book.pages.length-1,index));
  const page=book.pages[pageIndex],article=modal.querySelector('.nh7-book-article'),paragraphs=String(page.text||'').split(/\n\s*\n/).filter(Boolean),heading=pageLabel(page,pageIndex);
  article.innerHTML=`<section class="nh7-book-page"><h3 class="nh7-book-chapter-title">${E(heading)}</h3>${paragraphs.length?paragraphs.map(paragraph=>`<p>${highlight(paragraph,query).replace(/\n/g,'<br>')}</p>`).join(''):`<div>${highlight(page.text||'',query).replace(/\n/g,'<br>')}</div>`}</section>`;
  article.style.fontSize=(Number(localStorage.getItem('nh7_book_font')||20))+'px';
  modal.querySelector('[data-book-count]').textContent=`${pageIndex+1} / ${book.pages.length}`;
  modal.querySelector('[data-book-progress]').style.width=((pageIndex+1)/book.pages.length*100)+'%';
  modal.querySelector('[data-book-prev]').disabled=pageIndex===0;
  modal.querySelector('[data-book-next]').disabled=pageIndex===book.pages.length-1;
  modal.querySelector('.nh7-book-page-list').innerHTML=book.pages.map((item,i)=>`<button type="button" data-book-page="${i}" class="${i===pageIndex?'active':''}" title="${E(pageLabel(item,i))}"><span>${i+1}</span>${E(pageLabel(item,i))}</button>`).join('');
  requestAnimationFrame(()=>{article.scrollTop=savedScroll||0;savePosition()});
}
function searchBook(query){
  query=String(query||'').trim();
  const results=modal?.querySelector('[data-book-results]');
  if(!results)return;
  if(!query){results.classList.remove('show');results.textContent='';renderPage(pageIndex);return}
  const matches=[];
  book.pages.forEach((page,index)=>{
    const text=String(page.text||''),haystack=(page.title+'\n'+text).toLocaleLowerCase(),position=haystack.indexOf(query.toLocaleLowerCase());
    if(position>=0){const textPosition=text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());matches.push({index,snippet:textPosition>=0?text.slice(Math.max(0,textPosition-45),textPosition+query.length+80).replace(/\s+/g,' '):pageLabel(page,index)})}
  });
  results.classList.add('show');
  results.innerHTML=matches.length?matches.slice(0,25).map(match=>`<button type="button" data-book-search-page="${match.index}"><strong>${E(pageLabel(book.pages[match.index],match.index))}</strong><span>${highlight(match.snippet,query)}</span></button>`).join(''):E(L('نتیجه‌ای پیدا نشد.','No matches found.','Nema rezultata.'));
  renderPage(pageIndex,query);
}
function changeFont(delta){const current=Number(localStorage.getItem('nh7_book_font')||20),next=Math.max(15,Math.min(34,current+delta));localStorage.setItem('nh7_book_font',String(next));const article=modal?.querySelector('.nh7-book-article');if(article)article.style.fontSize=next+'px'}
function bindReader(){
  modal.querySelector('[data-book-theme]').value=modal.dataset.theme;
  modal.querySelector('[data-book-theme]').onchange=event=>{modal.dataset.theme=event.target.value;localStorage.setItem('nh7_book_theme',event.target.value)};
  modal.querySelector('[data-book-search]').oninput=event=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>searchBook(event.target.value),180)};
  modal.addEventListener('click',event=>{
    if(event.target.closest('[data-book-close]'))return closeReader();
    if(event.target.closest('[data-book-top]'))return modal.querySelector('.nh7-book-article')?.scrollTo({top:0,behavior:'smooth'});
    if(event.target.closest('[data-book-prev]'))return renderPage(pageIndex-1);
    if(event.target.closest('[data-book-next]'))return renderPage(pageIndex+1);
    if(event.target.closest('[data-book-font-up]'))return changeFont(1);
    if(event.target.closest('[data-book-font-down]'))return changeFont(-1);
    const pageButton=event.target.closest('[data-book-page]');if(pageButton)return renderPage(Number(pageButton.dataset.bookPage));
    const resultButton=event.target.closest('[data-book-search-page]');if(resultButton)return renderPage(Number(resultButton.dataset.bookSearchPage),modal.querySelector('[data-book-search]').value);
  });
  modal.querySelector('.nh7-book-article').addEventListener('scroll',()=>{clearTimeout(modal._saveTimer);modal._saveTimer=setTimeout(savePosition,150)},{passive:true});
}

function installStyle(){
  if(document.getElementById('nh7BookReaderV283Style'))return;
  const style=document.createElement('style');style.id='nh7BookReaderV283Style';style.textContent=`
.nh7-book-chapter-title{font-size:1.28em!important;line-height:1.55!important;margin:0 0 1rem!important;padding-bottom:.65rem!important;border-bottom:1px solid currentColor!important;opacity:.96}.nh7-book-page-list button{display:grid!important;grid-template-columns:30px minmax(0,1fr)!important;gap:8px!important;align-items:start!important;text-align:start!important}.nh7-book-page-list button span{display:grid;place-items:center;width:25px;height:25px;border-radius:8px;background:rgba(11,95,170,.1);font-size:.72rem;font-weight:900}.nh7-book-page-list button.active span{background:rgba(255,255,255,.22)}.nh7-book-search-results button{display:grid!important;gap:4px!important;text-align:start!important}.nh7-book-search-results button span{font-size:.83rem;opacity:.8}.nh7-book-modal[data-theme="dark"] .nh7-book-chapter-title{border-bottom-color:rgba(255,255,255,.2)!important}`;
  document.head.appendChild(style);
}

document.addEventListener('click',event=>{const button=event.target.closest?.('[data-nh7-book-open]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();openBook(button.dataset.nh7BookOpen)},true);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal)closeReader()},true);
window.addEventListener('beforeunload',savePosition);
window.addEventListener('online',()=>loadCatalog(true));
const observer=new MutationObserver(()=>{if(document.querySelector('[data-library-open]'))loadCatalog();decorate()});
observer.observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>{if(document.querySelector('[data-library-open]'))loadCatalog();decorate()},4000);
installStyle();
setTimeout(()=>loadCatalog(true),700);
window.NH7_OPEN_BOOK=openBook;
window.NH7_BOOK_READER_VERSION=VERSION;
})();
