/* New Hope 7 v2.3.0
   - Server-authoritative access gate for protected church content
   - Signed URLs for private audio and library files
   - Bible multi-verse selection and batch actions
   - Fix Space key inside verse note fields
*/
(()=>{'use strict';
const VERSION='2.3.0';
const SUPABASE_URL='https://gpzcwffxnddhaeaogdyo.supabase.co';
const SUPABASE_KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
const LOGOUT_KEY='nh7_explicit_logout';
const PROTECTED_ROUTES=new Set(['audio','audioBible','library','apocrypha']);
const secureMediaCache=new Map();
let accessCache={at:0,data:null};
let gateBusy=false;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const lang=()=>localStorage.getItem('nh7_lang')||'en';
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));

function readSession(){
  if(localStorage.getItem(LOGOUT_KEY)==='1')return null;
  try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}
}
function saveSession(session){
  if(session?.access_token){localStorage.setItem(SESSION_KEY,JSON.stringify(session));localStorage.removeItem(LOGOUT_KEY)}
  else localStorage.removeItem(SESSION_KEY);
}
async function refreshSession(){
  const old=readSession();
  if(!old?.refresh_token)return null;
  try{
    const response=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{
      method:'POST',
      headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({refresh_token:old.refresh_token}),
      cache:'no-store'
    });
    if(!response.ok)throw new Error(await response.text());
    const next=await response.json();
    saveSession(next);
    return next;
  }catch(error){
    console.warn('NH7 protected session refresh failed',error);
    saveSession(null);
    return null;
  }
}
async function authenticatedFetch(url,options={},retry=true){
  let session=readSession();
  if(!session?.access_token){
    const error=new Error('login_required');error.code='login_required';throw error;
  }
  const headers=Object.assign({
    apikey:SUPABASE_KEY,
    Authorization:`Bearer ${session.access_token}`,
    'Content-Type':'application/json',
    'x-device-id':localStorage.getItem('nh7_device_id')||''
  },options.headers||{});
  const response=await fetch(url,Object.assign({},options,{headers,cache:'no-store'}));
  if(response.status===401&&retry&&await refreshSession())return authenticatedFetch(url,options,false);
  const text=await response.text();
  let data={};try{data=text?JSON.parse(text):{}}catch(_){data={message:text}}
  if(!response.ok){
    const error=new Error(data.message||data.error||data.code||text||response.statusText);
    error.code=data.code||String(response.status);
    error.status=response.status;
    throw error;
  }
  return data;
}
function localApproval(){
  try{
    const row=JSON.parse(localStorage.getItem('nh7_school_access')||'{}');
    return String(row?.status||'').toLowerCase()==='approved'||row?.approvedBy==='admin';
  }catch(_){return false}
}
function markLocalApproval(data){
  if(!data?.allowed)return;
  let row={};try{row=JSON.parse(localStorage.getItem('nh7_school_access')||'{}')||{}}catch(_){row={}}
  row.status='approved';row.approvedBy='admin';row.email=data.email||row.email||'';row.syncedAt=new Date().toISOString();
  localStorage.setItem('nh7_school_access',JSON.stringify(row));
}
async function checkProtectedAccess(force=false){
  if(!readSession()?.access_token)return{allowed:false,status:'login_required'};
  const now=Date.now();
  if(!force&&accessCache.data&&now-accessCache.at<30000)return accessCache.data;
  try{
    const data=await authenticatedFetch(`${SUPABASE_URL}/rest/v1/rpc/nh7_my_protected_access_v230`,{
      method:'POST',body:'{}'
    });
    const result=Array.isArray(data)?data[0]:data;
    accessCache={at:now,data:result||{allowed:false,status:'access_check_failed'}};
    markLocalApproval(accessCache.data);
    return accessCache.data;
  }catch(error){
    const raw=String(error?.message||'');
    // Safe deployment bridge: before the SQL migration is installed, keep an
    // already-approved signed-in user working. Once the RPC exists it is the
    // only authority.
    if(/PGRST202|nh7_my_protected_access_v230|schema cache|function/i.test(raw)){
      const fallback={allowed:localApproval(),status:localApproval()?'approved':'migration_required',migration_pending:true};
      accessCache={at:now,data:fallback};return fallback;
    }
    console.warn('NH7 protected access check',error);
    return{allowed:false,status:error.code==='login_required'?'login_required':'access_check_failed'};
  }
}
function currentRoute(){
  const hash=String(location.hash||'').replace(/^#/,'');
  const raw=hash.split(':')[0]||'';
  try{return decodeURIComponent(raw)}catch(_){return raw}
}
function routeLabel(route){
  const labels={
    audio:L('فایل‌های صوتی','Audio messages','Audio poruke'),
    audioBible:L('کتاب مقدس صوتی','Audio Bible','Audio Biblija'),
    library:L('کتاب‌ها و جزوه‌ها','Books and handouts','Knjige i materijali'),
    apocrypha:L('کتاب‌های اپوکریفا','Apocrypha','Apokrifi')
  };
  return labels[route]||route;
}
function showProtectedGate(status='login_required',label=''){
  const view=$('#view');if(!view)return;
  const pending=status==='pending';
  const title=L('ثبت‌نام و تأیید مدرسه لازم است','School registration and approval are required','Potrebna je registracija i odobrenje škole');
  const message=pending
    ?L('ثبت‌نام شما دریافت شده و هنوز در انتظار تأیید مدیر است. پس از تأیید، این محتوا باز می‌شود.','Your registration was received and is awaiting administrator approval.','Vaša registracija čeka odobrenje administratora.')
    :L('برای دسترسی به فایل‌های صوتی، کتاب مقدس صوتی، کتاب‌ها و جزوه‌ها ابتدا وارد حساب مدرسه شوید یا ثبت‌نام کنید.','Sign in to your school account or register before opening audio, Audio Bible, books and handouts.','Prijavite se u školski račun ili se registrirajte prije otvaranja zaštićenog sadržaja.');
  view.dataset.nh7ProtectedGate='1';
  view.innerHTML=`<section class="card nh7-protected-gate-v230"><div class="nh7-protected-gate-icon">🔐</div><h2>${esc(title)}</h2><p>${esc(message)}</p>${label?`<p class="muted"><strong>${esc(label)}</strong></p>`:''}<span class="badge">${esc(pending?L('در انتظار تأیید','Pending approval','Čeka odobrenje'):L('دسترسی محافظت‌شده','Protected access','Zaštićeni pristup'))}</span><div class="button-row"><button type="button" class="primary-btn" data-nh7-go-school-v230>${esc(L('ورود یا ثبت‌نام در مدرسه','School sign-in or registration','Prijava ili registracija u školu'))}</button></div></section>`;
  $('[data-nh7-go-school-v230]',view)?.addEventListener('click',()=>document.querySelector('.nav-item[data-route="school"]')?.click());
}
async function ensureProtectedAccess(label=''){
  const result=await checkProtectedAccess(false);
  if(result?.allowed)return true;
  showProtectedGate(result?.status||'login_required',label);
  return false;
}

// Capture protected route navigation before the older route handler runs.
document.addEventListener('click',async event=>{
  const go=event.target.closest?.('[data-go]');
  const route=go?.dataset?.go;
  if(!go||!PROTECTED_ROUTES.has(route)||go.dataset.nh7AccessPassV230==='1')return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();
  if(gateBusy)return;
  gateBusy=true;
  try{
    if(await ensureProtectedAccess(routeLabel(route))){
      go.dataset.nh7AccessPassV230='1';
      go.click();
      setTimeout(()=>delete go.dataset.nh7AccessPassV230,0);
    }
  }finally{gateBusy=false}
},true);

async function invokeProtectedContent(payload){
  return authenticatedFetch(`${SUPABASE_URL}/functions/v1/nh7-protected-content-v230`,{
    method:'POST',body:JSON.stringify(Object.assign({device_id:localStorage.getItem('nh7_device_id')||''},payload||{}))
  });
}
function mediaDescriptor(button){
  const card=button.closest?.('[data-sermon-card]');
  const key=String(button.dataset.sermonPlay||card?.dataset?.sermonCard||'');
  const item=window.__sermonMap?.[key]||window.__audioBibleMap?.[key]||null;
  if(!item)return null;
  const kind=String(item.analytics_type||(key.startsWith('bible-')?'audio_bible':'sermon'));
  const mediaId=String(item.analytics_id||(kind==='audio_bible'?key.replace(/^bible-/,''):item.id||key));
  return{key,item,kind,mediaId,card};
}
async function secureMedia(descriptor){
  const cacheKey=`${descriptor.kind}:${descriptor.mediaId}`;
  const cached=secureMediaCache.get(cacheKey);
  if(cached&&cached.expiresAt>Date.now()+60000)return cached.url;
  const data=await invokeProtectedContent({kind:descriptor.kind,media_id:descriptor.mediaId});
  if(!data?.allowed||!data.signed_url){const error=new Error(data?.code||'signed_url_failed');error.code=data?.code||'';throw error}
  const expiresAt=data.expires_at?new Date(data.expires_at).getTime():Date.now()+Number(data.expires_in||600)*1000;
  secureMediaCache.set(cacheKey,{url:data.signed_url,expiresAt});
  descriptor.item.audio_url=data.signed_url;
  descriptor.card?.querySelectorAll('[data-offline-download]').forEach(el=>{el.dataset.offlineDownload=data.signed_url});
  return data.signed_url;
}
function accessErrorText(error){
  const code=String(error?.code||error?.message||'').toLowerCase();
  if(code.includes('login'))return L('ابتدا وارد حساب مدرسه شوید.','Sign in to your school account first.','Najprije se prijavite u školski račun.');
  if(code.includes('pending')||code.includes('approval'))return L('دسترسی شما هنوز توسط مدیر تأیید نشده است.','Your access has not yet been approved.','Vaš pristup još nije odobren.');
  if(code.includes('code_required'))return L('کد دسترسی خادمان لازم است.','A ministers access code is required.','Potreban je pristupni kod za služitelje.');
  if(code.includes('invalid')||code.includes('expired')||code.includes('max_uses')||code.includes('not_allowed'))return L('کد واردشده معتبر نیست، منقضی شده یا برای این فایل مجاز نیست.','The code is invalid, expired, or not allowed for this file.','Kod nije valjan, istekao je ili nije dopušten za ovu datoteku.');
  return L('فایل محافظت‌شده باز نشد. اتصال اینترنت و ورود حساب را بررسی کنید.','The protected file could not be opened. Check internet and sign-in.','Zaštićena datoteka nije otvorena. Provjerite internet i prijavu.');
}

// Replace direct public audio URLs with short-lived signed URLs.
document.addEventListener('click',async event=>{
  const play=event.target.closest?.('[data-sermon-play]');
  if(!play||play.dataset.nh7SecurePassV230==='1')return;
  const descriptor=mediaDescriptor(play);if(!descriptor)return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();
  try{
    if(!await ensureProtectedAccess(routeLabel(descriptor.kind==='audio_bible'?'audioBible':'audio')))return;
    play.disabled=true;
    await secureMedia(descriptor);
    play.dataset.nh7SecurePassV230='1';play.disabled=false;play.click();
    setTimeout(()=>delete play.dataset.nh7SecurePassV230,0);
  }catch(error){play.disabled=false;alert(accessErrorText(error))}
},true);

document.addEventListener('click',async event=>{
  const download=event.target.closest?.('[data-offline-download]');
  if(!download||download.dataset.nh7SecurePassV230==='1')return;
  const descriptor=mediaDescriptor(download);if(!descriptor)return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();
  try{
    if(!await ensureProtectedAccess(routeLabel(descriptor.kind==='audio_bible'?'audioBible':'audio')))return;
    download.disabled=true;
    const url=await secureMedia(descriptor);download.dataset.offlineDownload=url;
    download.dataset.nh7SecurePassV230='1';download.disabled=false;download.click();
    setTimeout(()=>delete download.dataset.nh7SecurePassV230,0);
  }catch(error){download.disabled=false;alert(accessErrorText(error))}
},true);

function closeDocumentViewer(){
  document.getElementById('nh7ProtectedViewerV230')?.remove();
  document.documentElement.classList.remove('nh7-protected-viewer-open-v230');
  document.body.classList.remove('nh7-protected-viewer-open-v230');
}
async function showProtectedDocument(data,title){
  closeDocumentViewer();
  const modal=document.createElement('div');
  modal.id='nh7ProtectedViewerV230';modal.className='nh7-protected-viewer-v230';
  modal.innerHTML=`<div class="nh7-protected-viewer-dialog-v230"><header><strong>${esc(title||data.title||data.file_name||L('سند','Document','Dokument'))}</strong><div><a class="secondary-btn" href="${esc(data.signed_url)}" target="_blank" rel="noopener">${esc(L('باز کردن جداگانه','Open separately','Otvori zasebno'))}</a><button type="button" class="icon-btn" data-nh7-close-viewer-v230 aria-label="Close">×</button></div></header><div class="nh7-protected-viewer-loading-v230">${esc(L('در حال آماده‌سازی فایل…','Preparing the file…','Priprema datoteke…'))}</div><iframe class="hidden" title="Document"></iframe><div class="nh7-protected-docx-v230 hidden"></div></div>`;
  document.body.appendChild(modal);document.documentElement.classList.add('nh7-protected-viewer-open-v230');document.body.classList.add('nh7-protected-viewer-open-v230');
  modal.querySelectorAll('[data-nh7-close-viewer-v230]').forEach(el=>el.onclick=closeDocumentViewer);
  modal.onclick=event=>{if(event.target===modal)closeDocumentViewer()};
  const loading=$('.nh7-protected-viewer-loading-v230',modal);
  const mime=String(data.mime_type||'').toLowerCase();
  if(mime.includes('wordprocessingml')||/\.docx$/i.test(data.file_name||'')){
    try{
      const response=await fetch(data.signed_url,{cache:'no-store'});if(!response.ok)throw new Error(String(response.status));
      if(!window.mammoth)throw new Error('DOCX reader unavailable');
      const result=await window.mammoth.convertToHtml({arrayBuffer:await response.arrayBuffer()});
      const reader=$('.nh7-protected-docx-v230',modal);reader.innerHTML=`<article>${result.value}</article>`;reader.classList.remove('hidden');loading?.classList.add('hidden');
    }catch(error){if(loading)loading.textContent=accessErrorText(error)}
  }else{
    const frame=$('iframe',modal);frame.src=data.signed_url+'#toolbar=1&navpanes=0&view=FitH';frame.classList.remove('hidden');frame.onload=()=>loading?.classList.add('hidden');
  }
}

// Secure private books/handouts and bind a ministers code to the signed-in account.
document.addEventListener('click',async event=>{
  const button=event.target.closest?.('[data-library-open]');
  if(!button||button.dataset.nh7SecurePassV230==='1')return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();
  if(!await ensureProtectedAccess(routeLabel('library')))return;
  const itemId=String(button.dataset.libraryOpen||'');if(!itemId)return;
  const card=button.closest('.library-user-card');
  const ministers=!!card?.querySelector('.library-audience.ministers');
  const title=card?.querySelector('h3')?.textContent?.trim()||L('سند','Document','Dokument');
  button.disabled=true;
  try{
    let data;
    try{data=await invokeProtectedContent({kind:'library',media_id:itemId,code:''})}
    catch(error){
      if(!ministers||!String(error.code||error.message).toLowerCase().includes('code_required'))throw error;
      const code=String(prompt(L('کد دسترسی خادمان را وارد کنید','Enter the ministers access code','Unesite pristupni kod za služitelje'),'')||'').trim();
      if(!code)return;
      data=await invokeProtectedContent({kind:'library',media_id:itemId,code});
    }
    if(!data?.signed_url)throw new Error(data?.code||'signed_url_failed');
    await showProtectedDocument(data,title);
  }catch(error){alert(accessErrorText(error))}
  finally{button.disabled=false}
},true);

// ---------------- Bible multi-verse tools ----------------
function verseNumber(verse){
  const id=String(verse.id||'');const match=id.match(/^v-(\d+)$/);if(match)return Number(match[1]);
  const raw=verse.querySelector('.num')?.textContent||'';
  const latin=raw.replace(/[۰-۹]/g,ch=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch)));
  return Number(latin)||0;
}
function selectedVerses(reader){return $$('.reader-verse.nh7-batch-selected-v230',reader)}
function updateBatchCount(toolbar,reader){
  const count=selectedVerses(reader).length;
  $('[data-nh7-batch-count-v230]',toolbar).textContent=L(`${count} آیه انتخاب شده`,`${count} verses selected`,`${count} stihova odabrano`);
  toolbar.classList.toggle('has-selection',count>0);
}
function clearIndividualVerseUi(reader){
  $$('.reader-verse.verse-selected',reader).forEach(v=>{v.classList.remove('verse-selected');v.querySelector('.verse-tools')?.classList.add('hidden');v.querySelector('.verse-note-box')?.classList.add('hidden')});
}
function setBatchMode(toolbar,reader,on){
  toolbar.dataset.nh7BatchModeV230=on?'1':'0';
  reader.classList.toggle('nh7-batch-mode-v230',on);
  $('[data-nh7-batch-toggle-v230]',toolbar).textContent=on?L('پایان انتخاب گروهی','Finish multi-select','Završi višestruki odabir'):L('انتخاب گروهی آیات','Select multiple verses','Odaberi više stihova');
  if(on)clearIndividualVerseUi(reader);
  else $$('.reader-verse.nh7-batch-selected-v230',reader).forEach(v=>v.classList.remove('nh7-batch-selected-v230'));
  updateBatchCount(toolbar,reader);
}
function selectedVerseInfo(reader){
  return selectedVerses(reader).map(verse=>({
    verse,
    ref:verse.querySelector('[data-bookmark]')?.dataset.bookmark||'',
    text:verse.querySelector('[data-share-verse]')?.dataset.shareText||verse.querySelector('.verse-text')?.textContent||'',
    key:verse.dataset.verseKey||'',
    number:verseNumber(verse)
  })).sort((a,b)=>a.number-b.number);
}
function installNoteSpaceFix(root=document){
  $$('textarea[data-note-input],.verse-note-box textarea',root).forEach(input=>{
    if(input.dataset.nh7SpaceFixedV230==='1')return;
    input.dataset.nh7SpaceFixedV230='1';
    const stop=event=>event.stopPropagation();
    input.addEventListener('keydown',stop);
    input.addEventListener('keypress',stop);
    input.addEventListener('keyup',stop);
  });
}
async function shareBatch(reader){
  const info=selectedVerseInfo(reader);if(!info.length)return;
  const text=info.map(row=>`${row.ref}\n${row.text}`).join('\n\n');
  try{
    if(navigator.share)await navigator.share({text});
    else{await navigator.clipboard.writeText(text);alert(L('آیات کپی شدند.','Verses copied.','Stihovi su kopirani.'))}
  }catch(_){ }
}
function buildBatchToolbar(reader){
  if(reader.previousElementSibling?.classList?.contains('nh7-bible-batch-toolbar-v230'))return;
  const verses=$$('.reader-verse',reader);if(!verses.length)return;
  const max=Math.max(...verses.map(verseNumber),1);
  const toolbar=document.createElement('section');toolbar.className='nh7-bible-batch-toolbar-v230';toolbar.dataset.nh7BatchModeV230='0';
  toolbar.innerHTML=`<div class="nh7-batch-top-v230"><button type="button" class="primary-btn" data-nh7-batch-toggle-v230>${esc(L('انتخاب گروهی آیات','Select multiple verses','Odaberi više stihova'))}</button><strong data-nh7-batch-count-v230>${esc(L('۰ آیه انتخاب شده','0 verses selected','0 stihova odabrano'))}</strong></div><div class="nh7-batch-range-v230"><label>${esc(L('از آیه','From verse','Od stiha'))}<input type="number" min="1" max="${max}" value="1" data-nh7-batch-start-v230></label><label>${esc(L('تا آیه','To verse','Do stiha'))}<input type="number" min="1" max="${max}" value="${Math.min(6,max)}" data-nh7-batch-end-v230></label><button type="button" class="secondary-btn" data-nh7-batch-range-v230>${esc(L('انتخاب بازه','Select range','Odaberi raspon'))}</button></div><div class="nh7-batch-actions-v230"><button type="button" class="secondary-btn" data-nh7-batch-save-v230>★ ${esc(L('ذخیره همه','Save all','Spremi sve'))}</button><span class="nh7-batch-colors-v230"><button type="button" data-nh7-batch-color-v230="yellow" aria-label="Yellow"></button><button type="button" data-nh7-batch-color-v230="red" aria-label="Red"></button><button type="button" data-nh7-batch-color-v230="green" aria-label="Green"></button><button type="button" data-nh7-batch-color-v230="blue" aria-label="Blue"></button></span><button type="button" class="secondary-btn" data-nh7-batch-clear-highlight-v230>${esc(L('حذف هایلایت','Clear highlight','Ukloni oznaku'))}</button><button type="button" class="secondary-btn" data-nh7-batch-note-toggle-v230>📝 ${esc(L('یادداشت مشترک','Common note','Zajednička bilješka'))}</button><button type="button" class="secondary-btn" data-nh7-batch-share-v230>↗ ${esc(L('کپی/اشتراک','Copy/share','Kopiraj/podijeli'))}</button><button type="button" class="secondary-btn" data-nh7-batch-clear-v230>${esc(L('لغو انتخاب','Clear selection','Poništi odabir'))}</button></div><div class="nh7-batch-note-v230 hidden"><textarea maxlength="1000" rows="4" placeholder="${esc(L('متنی که برای همه آیات انتخاب‌شده ذخیره می‌شود','Text saved for every selected verse','Tekst koji se sprema za svaki odabrani stih'))}"></textarea><button type="button" class="primary-btn" data-nh7-batch-note-save-v230>${esc(L('ذخیره یادداشت برای همه','Save note for all','Spremi bilješku za sve'))}</button></div>`;
  reader.before(toolbar);
  installNoteSpaceFix(toolbar);
  toolbar.querySelector('[data-nh7-batch-toggle-v230]').onclick=()=>setBatchMode(toolbar,reader,toolbar.dataset.nh7BatchModeV230!=='1');
  toolbar.querySelector('[data-nh7-batch-range-v230]').onclick=()=>{
    setBatchMode(toolbar,reader,true);
    const start=Math.max(1,Number(toolbar.querySelector('[data-nh7-batch-start-v230]').value)||1);
    const end=Math.max(start,Number(toolbar.querySelector('[data-nh7-batch-end-v230]').value)||start);
    verses.forEach(v=>v.classList.toggle('nh7-batch-selected-v230',verseNumber(v)>=start&&verseNumber(v)<=end));updateBatchCount(toolbar,reader);
  };
  toolbar.querySelector('[data-nh7-batch-save-v230]').onclick=()=>{
    const saved=new Set(JSON.parse(localStorage.getItem('nh7_bookmarks')||'[]'));
    selectedVerseInfo(reader).forEach(row=>{const button=row.verse.querySelector('[data-bookmark]');if(button&&row.ref&&!saved.has(row.ref)){saved.add(row.ref);button.click()}});
  };
  toolbar.querySelectorAll('[data-nh7-batch-color-v230]').forEach(button=>button.onclick=()=>{
    selectedVerses(reader).forEach(verse=>verse.querySelector(`[data-highlight-color="${button.dataset.nh7BatchColorV230}"]`)?.click());
  });
  toolbar.querySelector('[data-nh7-batch-clear-highlight-v230]').onclick=()=>selectedVerses(reader).forEach(verse=>verse.querySelector('[data-highlight-clear]')?.click());
  toolbar.querySelector('[data-nh7-batch-note-toggle-v230]').onclick=()=>toolbar.querySelector('.nh7-batch-note-v230').classList.toggle('hidden');
  toolbar.querySelector('[data-nh7-batch-note-save-v230]').onclick=()=>{
    const note=toolbar.querySelector('.nh7-batch-note-v230 textarea').value.slice(0,1000);
    if(!selectedVerses(reader).length){alert(L('ابتدا آیات را انتخاب کنید.','Select verses first.','Najprije odaberite stihove.'));return}
    selectedVerses(reader).forEach(verse=>{const input=verse.querySelector('[data-note-input]'),save=verse.querySelector('[data-save-verse-note]');if(input&&save){input.value=note;save.click()}});
    alert(L('یادداشت برای همه آیات انتخاب‌شده ذخیره شد.','The note was saved for all selected verses.','Bilješka je spremljena za sve odabrane stihove.'));
  };
  toolbar.querySelector('[data-nh7-batch-share-v230]').onclick=()=>shareBatch(reader);
  toolbar.querySelector('[data-nh7-batch-clear-v230]').onclick=()=>{selectedVerses(reader).forEach(v=>v.classList.remove('nh7-batch-selected-v230'));updateBatchCount(toolbar,reader)};
  reader.addEventListener('click',event=>{
    if(toolbar.dataset.nh7BatchModeV230!=='1')return;
    if(event.target.closest('button,textarea,input,a,.verse-tools,.verse-note-box'))return;
    const verse=event.target.closest('.reader-verse');if(!verse||!reader.contains(verse))return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();
    verse.classList.toggle('nh7-batch-selected-v230');updateBatchCount(toolbar,reader);
  },true);
}
function enhanceBible(){
  installNoteSpaceFix(document);
  $$('.reader.continuous-reader').forEach(buildBatchToolbar);
}

let observerQueued=false;
const observer=new MutationObserver(()=>{
  if(observerQueued)return;observerQueued=true;
  requestAnimationFrame(async()=>{
    observerQueued=false;enhanceBible();
    const route=currentRoute();
    const view=$('#view');
    if(PROTECTED_ROUTES.has(route)&&view&&!view.dataset.nh7ProtectedGate){
      const access=await checkProtectedAccess(false);
      if(!access?.allowed)showProtectedGate(access?.status||'login_required',routeLabel(route));
    }
  });
});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('online',()=>{accessCache={at:0,data:null}});
window.addEventListener('storage',event=>{if(event.key===SESSION_KEY||event.key==='nh7_school_access')accessCache={at:0,data:null}});
document.addEventListener('DOMContentLoaded',enhanceBible,{once:true});
requestAnimationFrame(enhanceBible);
window.NH7_PROTECTED_BIBLE_VERSION=VERSION;
})();
