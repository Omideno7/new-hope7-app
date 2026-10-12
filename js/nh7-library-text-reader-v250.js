/* New Hope 7 — secure in-app library text reader v2.5.0 */
(()=>{'use strict';
const VERSION='2.5.0-library-reader';
const URL='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
const CODE_KEY='nh7_minister_library_code';
let catalog=new Map(),loading=false,lastLoad=0,decorateQueued=false,currentModal=null;
const lang=()=>{const x=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(x)?x:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function token(){return session()?.access_token||''}
function email(){return String(session()?.user?.email||localStorage.getItem('nh7_manual_email')||'').trim().toLowerCase()}
function device(){let id=localStorage.getItem('nh7_device_id');if(!id){id='dev_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));localStorage.setItem('nh7_device_id',id)}return id}
function headers(){return{apikey:KEY,Authorization:'Bearer '+(token()||KEY),'Content-Type':'application/json'}}
function titleOf(row){const l=lang();return row?.['title_'+l]||row?.title_en||row?.title_fa||row?.title_hr||row?.file_name||L('کتاب','Book','Knjiga')}
async function loadCatalog(force=false){
  if(loading||(!force&&Date.now()-lastLoad<20000))return;const access=token();if(!access)return;loading=true;
  try{const response=await fetch(`${URL}/rest/v1/nh7_library_items_v224?select=id,title_fa,title_en,title_hr,audience,reader_mode,reader_language,reader_status,reader_available,reader_page_count&reader_available=eq.true`,{headers:headers(),cache:'no-store'});if(!response.ok)throw new Error(await response.text());const rows=await response.json();catalog=new Map((Array.isArray(rows)?rows:[]).map(row=>[String(row.id),row]));lastLoad=Date.now()}catch(error){console.warn('Library text catalog',error)}finally{loading=false;decorate()}
}
function decorate(){
  if(decorateQueued)return;decorateQueued=true;requestAnimationFrame(()=>{decorateQueued=false;
    document.querySelectorAll('[data-library-open]').forEach(original=>{
      const id=String(original.dataset.libraryOpen||''),row=catalog.get(id);if(!row||!row.reader_available)return;
      const parent=original.parentElement;if(!parent||parent.querySelector(`[data-nh7-reader-open="${CSS.escape(id)}"]`))return;
      const button=document.createElement('button');button.type='button';button.className='primary-btn nh7-reader-open-btn';button.dataset.nh7ReaderOpen=id;button.textContent='📖 '+L('مطالعه نوشته داخل اپ','Read in app','Čitaj u aplikaciji');parent.insertBefore(button,original);
      if(row.reader_mode==='text'){original.style.display='none'}else{original.textContent='📄 '+L('PDF اصلی','Original PDF','Izvorni PDF');original.classList.remove('primary-btn');original.classList.add('secondary-btn')}
      const card=original.closest('.library-user-card');if(card&&!card.querySelector('.nh7-reader-available')){const badge=document.createElement('span');badge.className='nh7-reader-available';badge.textContent='Aa '+L('نسخه متنی','Text version','Tekstualna verzija');card.querySelector('h3')?.insertAdjacentElement('beforebegin',badge)}
    })
  })
}
function readSavedCode(){try{const x=JSON.parse(sessionStorage.getItem(CODE_KEY)||'null');return x&&Date.now()-Number(x.at||0)<12*60*60*1000?String(x.code||''):''}catch(_){return''}}
async function rpc(item,code=''){
  const response=await fetch(`${URL}/rest/v1/rpc/nh7_library_reader_access_v250`,{method:'POST',headers:headers(),body:JSON.stringify({p_item_id:item.id,p_code:code||'',p_device_id:device(),p_user_email:email()}),cache:'no-store'}),text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={message:text}}if(!response.ok)throw new Error(data.message||text||response.statusText);return Array.isArray(data)?data[0]:data
}
async function openItem(id){
  const item=catalog.get(String(id));if(!item)return;if(!token()){alert(L('برای مطالعه کتاب ابتدا وارد حساب مدرسه شوید.','Sign in to your school account first.','Najprije se prijavite.'));return}
  let code=item.audience==='ministers'?readSavedCode():'';
  let data=await rpc(item,code).catch(error=>({allowed:false,code:'request_failed',message:error.message}));
  if(!data?.allowed&&item.audience==='ministers'&&['code_required','invalid_code','expired','max_uses'].includes(String(data?.code||''))){code=String(prompt(L('کد کتابخانه خادمان را وارد کنید:','Enter the ministers library code:','Unesite kod knjižnice za služitelje:'),'')||'').trim();if(!code)return;data=await rpc(item,code).catch(error=>({allowed:false,code:'request_failed',message:error.message}));if(data?.allowed)sessionStorage.setItem(CODE_KEY,JSON.stringify({code,at:Date.now()}))}
  if(!data?.allowed){alert(errorText(data));return}showReader(item,data)
}
function errorText(data){const code=String(data?.code||'');if(code==='school_approval_required')return L('دسترسی مدرسه شما هنوز تأیید نشده است.','Your school access is not approved yet.','Pristup školi još nije odobren.');if(['code_required','invalid_code','expired','max_uses'].includes(code))return L('کد خادمان نامعتبر یا منقضی است.','The ministers code is invalid or expired.','Kod nije valjan ili je istekao.');if(code==='reader_not_ready')return L('نسخه متنی این کتاب هنوز آماده نشده است.','The text version is not ready yet.','Tekstualna verzija još nije spremna.');return data?.message||L('کتاب باز نشد. دوباره تلاش کنید.','The book could not be opened.','Knjiga se nije mogla otvoriti.')}
function payload(data){const raw=data?.reader;if(typeof raw==='string')return{text:raw,pages:[]};if(raw&&typeof raw==='object')return{text:String(raw.text||''),pages:Array.isArray(raw.pages)?raw.pages:[]};return{text:'',pages:[]}}
function closeReader(){if(!currentModal)return;const article=currentModal.querySelector('.nh7-reader-article'),id=currentModal.dataset.itemId;if(article&&id)localStorage.setItem('nh7_reader_scroll_'+id,String(article.scrollTop||0));currentModal.remove();currentModal=null;document.body.classList.remove('nh7-reader-modal-open')}
function showReader(item,data){
  closeReader();const content=payload(data),l=data.reader_language||lang(),modal=document.createElement('div');modal.className='nh7-reader-modal';modal.dataset.itemId=item.id;modal.dir=l==='fa'?'rtl':'ltr';modal.innerHTML=`<section class="nh7-reader-dialog"><header><div><h2>${E(data['title_'+l]||titleOf(item))}</h2><small>${E(L('نسخه متنی برای مطالعه داخل اپ','In-app reading version','Tekstualna verzija u aplikaciji'))} · ${Number(data.reader_page_count||content.pages.length||0)} ${E(L('صفحه','pages','stranica'))}</small></div><button type="button" data-reader-close>× ${E(L('بستن','Close','Zatvori'))}</button></header><div class="nh7-reader-toolbar"><label>${E(L('اندازه نوشته','Text size','Veličina teksta'))}<input type="range" min="15" max="32" value="20" data-reader-font><output>20</output></label><label>${E(L('فاصله خطوط','Line spacing','Prored'))}<input type="range" min="1.3" max="2.4" step=".1" value="1.8" data-reader-line><output>1.8</output></label><label>${E(L('حالت صفحه','Page theme','Tema'))}<select data-reader-theme><option value="light">${E(L('روشن','Light','Svijetlo'))}</option><option value="sepia">${E(L('کاغذی','Sepia','Sepija'))}</option><option value="dark">${E(L('تیره','Dark','Tamno'))}</option></select></label><label class="nh7-reader-search">${E(L('جست‌وجو','Search','Pretraži'))}<input type="search" data-reader-search placeholder="${E(L('کلمه موردنظر…','Search text…','Pretraži tekst…'))}"></label></div><div class="nh7-reader-results" data-reader-results></div><article class="nh7-reader-article"></article><footer><button type="button" data-reader-top>↑ ${E(L('ابتدای کتاب','Top','Na vrh'))}</button><button type="button" data-reader-close>${E(L('بستن کتاب','Close book','Zatvori knjigu'))}</button></footer></section>`;
  document.body.appendChild(modal);document.body.classList.add('nh7-reader-modal-open');currentModal=modal;
  const article=modal.querySelector('.nh7-reader-article');renderContent(article,content,'');const pos=Number(localStorage.getItem('nh7_reader_scroll_'+item.id)||0);requestAnimationFrame(()=>article.scrollTop=pos);
  modal.addEventListener('click',event=>{if(event.target===modal||event.target.closest('[data-reader-close]'))closeReader();if(event.target.closest('[data-reader-top]'))article.scrollTo({top:0,behavior:'smooth'})});
  modal.querySelector('[data-reader-font]').oninput=e=>{article.style.fontSize=e.target.value+'px';e.target.nextElementSibling.textContent=e.target.value};modal.querySelector('[data-reader-line]').oninput=e=>{article.style.lineHeight=e.target.value;e.target.nextElementSibling.textContent=e.target.value};modal.querySelector('[data-reader-theme]').onchange=e=>modal.dataset.theme=e.target.value;
  let timer;modal.querySelector('[data-reader-search]').oninput=e=>{clearTimeout(timer);timer=setTimeout(()=>{const q=e.target.value.trim();renderContent(article,content,q);modal.querySelector('[data-reader-results]').textContent=q?L('نتیجه‌های پیدا شده در متن هایلایت شدند.','Matches are highlighted in the text.','Rezultati su označeni.'):''},180)};
}
function highlight(text,q){const safe=E(text);if(!q)return safe;const escaped=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');try{return safe.replace(new RegExp(escaped,'gi'),m=>`<mark>${m}</mark>`)}catch(_){return safe}}
function renderContent(article,content,q){
  const pages=Array.isArray(content.pages)&&content.pages.length?content.pages:null;
  if(pages){article.innerHTML=pages.map((page,index)=>`<section class="nh7-reader-page" data-page="${Number(page.number||index+1)}"><h3>${E(L('صفحه','Page','Stranica'))} ${Number(page.number||index+1)}</h3><div>${highlight(String(page.text||''),q).replace(/\n/g,'<br>')}</div></section>`).join('')}
  else{const paragraphs=String(content.text||'').split(/\n\s*\n/).filter(Boolean);article.innerHTML=paragraphs.length?paragraphs.map(x=>`<p>${highlight(x,q).replace(/\n/g,'<br>')}</p>`).join(''):`<div class="nh7-reader-empty">${E(L('متنی برای نمایش وجود ندارد.','No text is available.','Nema teksta.'))}</div>`}
}
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-nh7-reader-open]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();openItem(button.dataset.nh7ReaderOpen)},true);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&currentModal)closeReader()},true);
const observer=new MutationObserver(()=>{if(document.querySelector('[data-library-open]'))loadCatalog();else decorate()});observer.observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>{if(document.querySelector('[data-library-open]'))loadCatalog();decorate()},5000);setTimeout(()=>loadCatalog(true),800);
window.NH7_LIBRARY_TEXT_READER_VERSION=VERSION;
})();