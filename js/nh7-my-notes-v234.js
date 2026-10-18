/* New Hope 7 v2.3.4 — unified My Notes for Bible, audio and app sections */
(()=>{'use strict';
const VERSION='2.3.5-web-account-merge';
const META_PREFIX='nh7_my_note_meta_v234_';
const SESSION_KEY='nh7_user_session_v170';
const SUPABASE_URL='https://gpzcwffxnddhaeaogdyo.supabase.co';
const PUBLISHABLE_KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
let rendering=false;
let pendingTarget=null;
let renderTimer=0;

function lang(){return localStorage.getItem('nh7_lang')||'en'}
function t(fa,en,hr){return lang()==='fa'?fa:lang()==='hr'?hr:en}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function safeJson(value,fallback=null){try{return JSON.parse(value)}catch(_){return fallback}}
function session(){return safeJson(localStorage.getItem(SESSION_KEY),null)}
function email(){return String(session()?.user?.email||'').trim().toLowerCase()}
function token(){return String(session()?.access_token||'')}
function deviceId(){let id=localStorage.getItem('nh7_device_id');if(!id){id='dev_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));localStorage.setItem('nh7_device_id',id)}return id}
function metaKey(storageKey){return META_PREFIX+encodeURIComponent(storageKey)}
function readMeta(storageKey){return safeJson(localStorage.getItem(metaKey(storageKey)),{})||{}}
function saveMeta(storageKey,meta){localStorage.setItem(metaKey(storageKey),JSON.stringify(Object.assign({},readMeta(storageKey),meta,{storageKey,updatedAt:new Date().toISOString()})))}
function deleteMeta(storageKey){localStorage.removeItem(metaKey(storageKey))}
function historyLocation(){const s=history.state||{};return{route:String(s.route||''),params:s.params&&typeof s.params==='object'?JSON.parse(JSON.stringify(s.params)):{} }}
function presented(value){return window.NH7NoteTextV501?.display?.(value)||{text:String(value??'')}}
function normalizedText(value){return presented(value).text||''}
function decodeKey(value){try{return decodeURIComponent(String(value||''))}catch(_){return String(value||'')}}

function inferVerseLocation(storageKey){
  const raw=storageKey.replace(/^nh7_bible_state_/,'');
  const parts=raw.split('_').filter(Boolean);
  const nums=parts.map((x,i)=>/^\d+$/.test(x)?i:-1).filter(i=>i>=0);
  if(nums.length>=2){
    const chapter=Number(parts[nums[nums.length-2]]),verse=Number(parts[nums[nums.length-1]]);
    const bookId=parts.slice(0,nums[nums.length-2]).join('_').toUpperCase();
    if(bookId&&chapter>0)return{route:'bible',params:{section:'written',mode:'chapter',bookId,chapter,verse},verse};
  }
  return{route:'bible',params:{section:'written'}};
}
function inferAudioLocation(id){
  if(id.startsWith('school-'))return{route:'school',params:{lesson:id.slice(7)}};
  if(id.startsWith('bible-')||id.startsWith('audio-bible-'))return{route:'audioBible',params:{}};
  return{route:'audio',params:{open:id}};
}
function inferGenericLocation(storageKey){
  const raw=storageKey.replace(/^nh7_note_/,'');
  if(raw.startsWith('school-'))return{route:'school',params:{lesson:raw.slice(7)}};
  if(raw.startsWith('daily-')||raw.startsWith('word-'))return{route:'daily',params:{tab:'word'}};
  return{route:'home',params:{}};
}
function noteTitle(kind,storageKey,meta){
  if(meta.userAuthoredTitle===true&&meta.title)return String(meta.title);
  if(kind==='generic')return storageKey.startsWith('nh7_note_school-')?t('یادداشت درس مدرسه','School lesson note','Bilješka školske lekcije'):t('یادداشت من','My note','Moja bilješka');
  if(kind==='gratitude')return `${t('یادداشت شکرگزاری روز','Gratitude note — day','Bilješka zahvalnosti — dan')} ${storageKey.replace(/^nh7_gratitude_note_/,'').replace(/\d/g,n=>lang()==='fa'?'۰۱۲۳۴۵۶۷۸۹'[+n]:n)}`;
  if(kind==='verse'){const location=inferVerseLocation(storageKey),p=location.params;return window.NH7ReaderSourceV452?.label?.(p.bookId,p.chapter,p.verse,lang())||t('یادداشت آیه کتاب مقدس','Bible verse note','Bilješka uz biblijski stih')}
  if(meta.title&&!/^(?:\d+|[a-z0-9]+(?:-[a-z0-9]+)*-\d+|[0-9a-f]{8}-[0-9a-f-]{27,}|nh7_.+|[A-Z0-9]+_\d+_\d+)$/.test(String(meta.title)))return String(meta.title);
  if(kind==='verse')return meta.ref||t('یادداشت آیه کتاب مقدس','Bible verse note','Bilješka uz biblijski stih');
  if(kind==='audio'){
    const id=storageKey.replace(/^nh7_sermon_note_/,'');
    if(id.startsWith('school-'))return t('یادداشت فایل صوتی درس','School audio note','Bilješka uz audio lekciju');
    if(id.startsWith('bible-')||id.startsWith('audio-bible-'))return t('یادداشت کتاب مقدس صوتی','Audio Bible note','Bilješka uz Audio Bibliju');
    return t('یادداشت پیام صوتی','Audio message note','Bilješka uz audio poruku');
  }
  if(kind==='gratitude')return `${t('یادداشت شکرگزاری روز','Gratitude note — day','Bilješka zahvalnosti — dan')} ${storageKey.replace(/^nh7_gratitude_note_/,'')}`;
  if(kind==='generic'&&storageKey.startsWith('nh7_note_school-'))return t('یادداشت درس مدرسه','School lesson note','Bilješka školske lekcije');
  return t('یادداشت من','My note','Moja bilješka');
}
function typeLabel(kind){
  if(kind==='plan')return t('پلن روحانی','Spiritual plan','Duhovni plan');
  if(kind==='verse')return t('آیه','Verse','Stih');
  if(kind==='audio')return t('فایل صوتی','Audio','Audio');
  if(kind==='gratitude')return t('شکرگزاری','Gratitude','Zahvalnost');
  return t('یادداشت','Note','Bilješka');
}
function collectNotes(){
  const notes=[];
  for(let i=0;i<localStorage.length;i++){
    const storageKey=localStorage.key(i);if(!storageKey||storageKey.startsWith(META_PREFIX))continue;
    let kind='',text='',stateValue=null,rawValue=null;
    if(storageKey.startsWith('nh7_bible_state_')){
      stateValue=safeJson(localStorage.getItem(storageKey),{});rawValue=stateValue?.note;text=normalizedText(rawValue);kind='verse';
    }else if(storageKey.startsWith('nh7_apo_note_v242:')){
      rawValue=localStorage.getItem(storageKey);text=normalizedText(rawValue);kind='apocrypha';
    }else if(storageKey.startsWith('nh7_sermon_note_')){
      rawValue=localStorage.getItem(storageKey);text=normalizedText(rawValue);kind='audio';
    }else if(storageKey.startsWith('nh7_gratitude_note_')){
      rawValue=localStorage.getItem(storageKey);text=normalizedText(rawValue);kind='gratitude';
    }else if(storageKey.startsWith('nh7_note_')){
      rawValue=localStorage.getItem(storageKey);text=normalizedText(rawValue);kind='generic';
    }
    const presentation=presented(rawValue);if(!kind||presentation.omitted||(!text.trim()&&!presentation.recoverable))continue;
    const meta=readMeta(storageKey);
    let location={route:meta.route||'',params:meta.params||{}};
    if(!location.route){
      if(kind==='verse')location=inferVerseLocation(storageKey);
      else if(kind==='audio')location=inferAudioLocation(storageKey.replace(/^nh7_sermon_note_/,''));
      else if(kind==='gratitude')location={route:'daily',params:{tab:'gratitude',gday:Number(storageKey.replace(/^nh7_gratitude_note_/,'')||1)}};
      else location=inferGenericLocation(storageKey);
    }
    notes.push({recoverable:!!presentation.recoverable,original:presentation.original,storageKey,kind,text,title:noteTitle(kind,storageKey,meta),meta,stateValue,route:location.route,params:location.params||{},updatedAt:meta.updatedAt||''});
  }
  // Read-only virtual entries: one exact current UID scope; never enumerate accounts.
  const actor=window.NH7UserContextWave6?.identity(),scope=actor?.uid||'guest';
  const progress=safeJson(localStorage.getItem('nh7_spiritual_plans_v240:'+scope),null);
  if(progress?.version===1&&progress.plans&&typeof progress.plans==='object')for(const [planId,plan] of Object.entries(progress.plans)){
    if(!plan?.startedAt)continue;
    for(const [day,value] of Object.entries(plan.days||{})){
      const text=normalizedText(value?.note);if(!text.trim()||!/^\d+$/.test(day)||+day<1)continue;
      const dayLabel=lang()==='fa'?day.replace(/\d/g,n=>'۰۱۲۳۴۵۶۷۸۹'[n]):day;
      notes.push({storageKey:'nh7_virtual_plan_note_wave6:'+encodeURIComponent(scope)+':'+encodeURIComponent(planId)+':'+day,kind:'plan',readOnly:true,text,title:t('یادداشت پلن روحانی — روز','Spiritual plan note — day','Bilješka duhovnog plana — dan')+' '+dayLabel,route:'plans',params:{tab:'spiritual',plan:planId,day:+day},updatedAt:value.updatedAt||'',meta:{planId,dayNumber:+day}});
    }
  }
  return notes.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))||b.storageKey.localeCompare(a.storageKey));
}
function noteCard(note){
  const encoded=encodeURIComponent(note.storageKey);
  const openText=t('باز کردن منبع','Open source','Otvori izvor');
  const deleteText=t('پاک کردن','Delete','Obriši');
  return `<article class="nh7-my-note-card-v234"><div class="nh7-my-note-head-v234"><span class="nh7-my-note-type-v234">${esc(typeLabel(note.kind))}</span><strong>${esc(note.title)}</strong></div><p style="white-space:pre-wrap">${esc(note.recoverable?t('یادداشت قدیمی نیاز به بررسی دارد؛ نسخهٔ اصلی محفوظ است.','Legacy note needs review; the original is preserved.','Staru bilješku treba pregledati; izvornik je sačuvan.'):note.text)}</p><div class="button-row nh7-my-note-actions-v234"><button type="button" class="secondary-btn" data-nh7-note-open="${encoded}">↗ ${esc(openText)}</button>${note.recoverable?'':`<button type="button" class="secondary-btn" data-nh7-note-edit="${encoded}">${esc(t('ویرایش','Edit','Uredi'))}</button>`}${note.readOnly||note.recoverable?'':`<button type="button" class="danger-btn" data-nh7-note-delete="${encoded}">🗑 ${esc(deleteText)}</button>`}</div></article>`;
}
function renderNotesPanel(){
  if(rendering)return;
  const panel=document.getElementById('notesPanel');if(!panel)return;
  const notes=collectNotes();
  const conflicts=window.NH7LocalFirstWave2?.conflicts()||[];
  const signature=lang()+'|'+JSON.stringify(conflicts)+'|'+JSON.stringify(notes.map(n=>[n.storageKey,n.text,n.title,n.updatedAt]));
  if(panel.dataset.nh7NotesSignature===signature)return;
  rendering=true;
  panel.dataset.nh7NotesSignature=signature;
  panel.innerHTML=notes.length?`<div class="nh7-my-notes-list-v234">${notes.map(noteCard).join('')}</div>`:`<p class="muted">${esc(t('هنوز یادداشتی ذخیره نشده است.','No notes have been saved yet.','Još nema spremljenih bilješki.'))}</p>`;
  if(conflicts.length){
    const text=(value,cloud=false)=>value===null?(cloud?t('نسخهٔ ابری تأیید نشده است','Cloud version could not be verified','Verzija u oblaku nije potvrđena'):t('حذف محلی','Local deletion','Lokalno brisanje')):String(value?.content??value?.note??value?.reflection??(typeof value==='string'?t('حذف محلی','Local deletion','Lokalno brisanje'):JSON.stringify(value?.value??value,null,2)));
    const details=conflicts.map(item=>`<details><summary>${esc(notes.find(note=>note.storageKey===item.key)?.title||t('نسخه‌های محفوظ','Preserved versions','Sačuvane verzije'))}</summary>${item.versions.map(v=>`<strong>${esc(t('نسخهٔ محلی','Local version','Lokalna verzija'))}</strong><pre style="white-space:pre-wrap;overflow-wrap:anywhere" dir="${lang()==='fa'?'rtl':'ltr'}">${esc(text(v.local))}</pre><strong>${esc(t('نسخهٔ ابری','Cloud version','Verzija u oblaku'))}</strong><pre style="white-space:pre-wrap;overflow-wrap:anywhere" dir="${lang()==='fa'?'rtl':'ltr'}">${esc(text(v.remote,true))}</pre>`).join('')}</details>`).join('');
    panel.insertAdjacentHTML('afterbegin',`<aside class="card nh7-sync-conflicts-wave2"><strong>${esc(t('هر دو نسخهٔ یادداشت حفظ شدند','Both note versions were preserved','Obje verzije bilješke su sačuvane'))}</strong><p>${esc(t('همگام‌سازی موارد متعارض متوقف است. قبل از ادامه، هر دو متن را بررسی و کپی کنید.','Sync of conflicting entries is paused. Review and copy both texts before continuing.','Sinkronizacija sukobljenih zapisa je pauzirana. Pregledajte i kopirajte oba teksta prije nastavka.'))}</p>${details}</aside>`);
  }
  const toggle=document.querySelector('[data-toggle-panel="notesPanel"]');
  if(toggle){toggle.dataset.nh7NoteCount=String(notes.length);const base=t('نمایش یادداشت‌های من','Show my notes','Prikaži moje bilješke');if(panel.classList.contains('hidden'))toggle.textContent=`${base} (${notes.length})`}
  rendering=false;
}
function scheduleRender(){clearTimeout(renderTimer);renderTimer=setTimeout(renderNotesPanel,40)}

function routeTo(route,params={}){
  if(window.NH7_NAVIGATE)return window.NH7_NAVIGATE(route,params);
  const state={route,params};
  try{history.pushState(state,'','#'+encodeURIComponent(route)+':'+encodeURIComponent(JSON.stringify(params||{})))}catch(_){}
  try{window.dispatchEvent(new PopStateEvent('popstate',{state}))}catch(_){window.dispatchEvent(new Event('popstate'))}
}
function showNote(note){
  const ticket=window.NH7UserContextWave6?.identity(),dialog=document.createElement('dialog'),heading=document.createElement('h2'),body=document.createElement('pre'),close=document.createElement('button');
  heading.textContent=note.title;body.textContent=note.recoverable?String(note.original||''):note.text;body.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere';close.textContent=t('بستن','Close','Zatvori');dialog.style.cssText='max-width:min(92vw,700px);max-height:85vh;overflow:auto;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:16px';dialog.append(heading,body,close);close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();const fence=()=>{if(!window.NH7UserContextWave6.current(ticket))dialog.close()};for(const event of ['storage','nh7-personal-owner-wave2'])addEventListener(event,fence);const leave=()=>dialog.close();for(const event of ['popstate','nh7-route-changed-wave6'])addEventListener(event,leave);dialog.addEventListener('close',()=>{for(const event of ['storage','nh7-personal-owner-wave2'])removeEventListener(event,fence);for(const event of ['popstate','nh7-route-changed-wave6'])removeEventListener(event,leave)},{once:true});
}
function scrollToPending(){
  if(!pendingTarget)return;
  let target=null;
  if(pendingTarget.kind==='verse')target=document.getElementById('v-'+pendingTarget.verse)||document.querySelector(`[data-verse-key="${CSS.escape(pendingTarget.storageKey)}"]`);
  if(pendingTarget.kind==='audio')target=document.querySelector(`[data-sermon-card="${CSS.escape(pendingTarget.id)}"],[data-sermon-play="${CSS.escape(pendingTarget.id)}"]`);
  if(pendingTarget.kind==='generic'&&pendingTarget.lesson)target=document.querySelector('.school-assignment,textarea#schoolAssignmentAnswer');
  if(target){target.scrollIntoView({behavior:'smooth',block:'center'});target.classList.add('nh7-note-source-focus-v234');setTimeout(()=>target.classList.remove('nh7-note-source-focus-v234'),2400);pendingTarget=null}
}
async function openNote(storageKey){
  const note=collectNotes().find(n=>n.storageKey===storageKey);if(!note)return;
  if(note.kind==='apocrypha'){window.NH7_OPEN_SAVED_APOCRYPHA_V394?.('APO:'+storageKey.replace(/^nh7_apo_note_v242:/,''));return;}
  if(note.recoverable||note.route==='home'){showNote(note);return;}
  if(note.kind==='plan'){const ticket=window.NH7UserContextWave6.identity(),route=location.hash;let valid=false;try{valid=await window.NH7_SPIRITUAL_PLANS?.validExistingDay?.(note.params.plan,note.params.day)}catch{}if(!window.NH7UserContextWave6.current(ticket)||location.hash!==route)return;pendingTarget=null;if(valid)routeTo('plans',note.params);else showNote(note);return;}
  const meta=note.meta||{};
  pendingTarget={kind:note.kind,storageKey};
  if(note.kind==='verse')pendingTarget.verse=Number(meta.verse||note.params?.verse||inferVerseLocation(storageKey).verse||0);
  if(note.kind==='audio')pendingTarget.id=storageKey.replace(/^nh7_sermon_note_/,'');
  if(note.kind==='generic'&&storageKey.startsWith('nh7_note_school-'))pendingTarget.lesson=storageKey.replace(/^nh7_note_school-/,'');
  routeTo(note.route||'home',note.params||{});
  setTimeout(scrollToPending,350);setTimeout(scrollToPending,900);setTimeout(scrollToPending,1800);
}
async function cloudRequest(path,options={}){
  if(!navigator.onLine)return false;
  const accessToken=token(),headers=new Headers(options.headers||{});headers.set('apikey',PUBLISHABLE_KEY);headers.set('Authorization','Bearer '+(accessToken||PUBLISHABLE_KEY));headers.set('Content-Type','application/json');
  const response=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,Object.assign({},options,{headers,cache:'no-store'}));
  return response.ok;
}
async function deleteCloudNote(noteKey){
  if(window.NH7_PERSONAL_SYNC_BRIDGE_WAVE2)return window.NH7_PERSONAL_SYNC_BRIDGE_WAVE2.deleteNote(noteKey);
  const dev=encodeURIComponent(deviceId()),key=encodeURIComponent(noteKey),mail=email();
  try{await cloudRequest(`user_notes?device_id=eq.${dev}&note_key=eq.${key}`,{method:'DELETE'})}catch(_){}
  if(mail)try{await cloudRequest(`nh7_account_notes?user_email=eq.${encodeURIComponent(mail)}&note_key=eq.${key}`,{method:'DELETE'})}catch(_){}
}
async function syncVerseState(note){
  const st=note.stateValue||safeJson(localStorage.getItem(note.storageKey),{})||{};
  st.note='';localStorage.setItem(note.storageKey,JSON.stringify(st));
  if(window.NH7_PERSONAL_SYNC_BRIDGE_WAVE2){
    const meta=note.meta||{};
    await window.NH7_PERSONAL_SYNC_BRIDGE_WAVE2.clearVerse(note.storageKey,st,{batch_id:crypto.randomUUID?.()||String(Date.now()),language:lang(),items:[{verse_key:note.storageKey,verse_ref:meta.ref||'',verse_text:meta.verseText||'',saved:!!st.saved,highlight_color:st.highlight?String(st.highlightColor||'yellow'):'',note:''}]});return;
  }
  const now=new Date().toISOString(),mail=email(),dev=deviceId();
  try{await cloudRequest('user_progress?on_conflict=device_id,progress_key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({device_id:dev,progress_key:note.storageKey,value:st,language:lang(),updated_at:now})})}catch(_){}
  if(mail)try{await cloudRequest('nh7_account_progress?on_conflict=user_email,progress_key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_email:mail,progress_key:note.storageKey,value:st,language:lang(),updated_at:now})})}catch(_){}
  const meta=note.meta||{};
  try{await window.NH7AccessV230?.edge?.('nh7-content-access',{action:'save_bible_batch',batch_id:crypto.randomUUID?.()||String(Date.now()),language:lang(),items:[{verse_key:note.storageKey,verse_ref:meta.ref||'',verse_text:meta.verseText||'',saved:!!st.saved,highlight_color:st.highlight?String(st.highlightColor||'yellow'):'',note:''}]},true)}catch(_){}
}
async function deleteNote(storageKey){
  const actor=window.NH7UserContextWave6?.identity();
  const note=collectNotes().find(n=>n.storageKey===storageKey);if(!note||note.readOnly||note.recoverable)return;
  if(!confirm(t('این یادداشت پاک شود؟','Delete this note?','Obrisati ovu bilješku?')))return;
  if(note.kind==='apocrypha'){localStorage.removeItem(storageKey);deleteMeta(storageKey);renderNotesPanel();return;}
  if(note.kind==='verse')await syncVerseState(note);else{
    if(!window.NH7_PERSONAL_SYNC_BRIDGE_WAVE2)localStorage.removeItem(storageKey);
    const cloudKey=storageKey.replace(/^nh7_/,'');
    await deleteCloudNote(cloudKey);
  }
  if(!window.NH7UserContextWave6?.current(actor))return;deleteMeta(storageKey);renderNotesPanel();
}

function editNote(storageKey){
 const actor=window.NH7UserContextWave6?.identity(),note=collectNotes().find(n=>n.storageKey===storageKey);if(!actor||!note||note.recoverable)return;
 const original=note.text,draftKey='nh7_editor_draft_batch3a:'+encodeURIComponent(actor.owner)+':'+encodeURIComponent(storageKey),draft=safeJson(localStorage.getItem(draftKey));
 const dialog=document.createElement('dialog');dialog.className='nh7-note-editor3a';dialog.style.cssText='width:min(92vw,700px);max-height:85dvh;overflow:auto;box-sizing:border-box;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:16px;padding:18px';dialog.dir=lang()==='fa'?'rtl':'ltr';
 dialog.innerHTML=`<form><h2 id="nh7NoteEditTitle3A">${esc(t('ویرایش یادداشت','Edit note','Uredi bilješku'))}</h2><label for="nh7NoteEditText3A">${esc(note.title)}</label><textarea id="nh7NoteEditText3A" rows="8" style="width:100%;box-sizing:border-box;direction:${lang()==='fa'?'rtl':'ltr'};text-align:${lang()==='fa'?'right':'left'}" dir="${lang()==='fa'?'rtl':'ltr'}" maxlength="${note.kind==='plan'?4000:note.kind==='verse'?1000:8000}"></textarea><p role="status" aria-live="polite"></p><div class="button-row"><button type="submit" class="primary-btn" data-note-save3a>${esc(t('ذخیره','Save','Spremi'))}</button><button type="button" class="secondary-btn" data-note-cancel3a>${esc(t('لغو','Cancel','Odustani'))}</button></div></form>`;
 dialog.setAttribute('aria-labelledby','nh7NoteEditTitle3A');const input=dialog.querySelector('textarea'),status=dialog.querySelector('[role=status]'),save=dialog.querySelector('[type=submit]'),opener=document.activeElement;
 input.value=draft&&draft.base===original?draft.text:original;let busy=false;
 const current=()=>window.NH7UserContextWave6.current(actor),retain=()=>{if(current())localStorage.setItem(draftKey,JSON.stringify({base:original,text:input.value}))};
 input.oninput=()=>{try{retain();status.textContent=''}catch{status.textContent=t('ذخیرهٔ پیش‌نویس ممکن نیست؛ متن را کپی کنید.','Draft storage unavailable; copy your text.','Pohrana nacrta nije dostupna; kopirajte tekst.')}};
 const cancel=()=>{if(busy)return;if(current())localStorage.removeItem(draftKey);dialog.close()};dialog.querySelector('[data-note-cancel3a]').onclick=cancel;dialog.oncancel=e=>{e.preventDefault();cancel()};
 const fence=()=>{if(!current())dialog.close()};for(const name of ['nh7-personal-before-owner-wave2','nh7-personal-owner-wave2','storage','nh7-session-refreshed'])addEventListener(name,fence);
 const routeFence=()=>dialog.close();for(const name of ['nh7-route-changed-wave6','popstate'])addEventListener(name,routeFence);
 dialog.addEventListener('close',()=>{for(const name of ['nh7-personal-before-owner-wave2','nh7-personal-owner-wave2','storage','nh7-session-refreshed'])removeEventListener(name,fence);for(const name of ['nh7-route-changed-wave6','popstate'])removeEventListener(name,routeFence);dialog.remove();if(current()&&opener?.isConnected)opener.focus()},{once:true});
 dialog.querySelector('form').onsubmit=async e=>{
  e.preventDefault();if(busy||!current())return;const text=input.value;if(!text.trim()){status.textContent=t('برای حذف، از گزینهٔ حذف استفاده کنید.','Use Delete to remove a note.','Za uklanjanje bilješke koristite Obriši.');return}
  busy=true;save.disabled=true;input.readOnly=true;
  try{retain();const latest=collectNotes().find(n=>n.storageKey===storageKey);if(!latest||latest.text!==original)throw Error('changed');
   if(note.kind==='plan'){if(!window.NH7_SPIRITUAL_PLANS?.editExistingNote)throw Error('unavailable');await window.NH7_SPIRITUAL_PLANS.editExistingNote(note.meta.planId,note.meta.dayNumber,text,original)}
   else if(note.kind==='verse'){const st=safeJson(localStorage.getItem(storageKey),{})||{};st.note=text;const m=note.meta||{};if(!window.NH7_PERSONAL_SYNC_BRIDGE_WAVE2?.clearVerse)throw Error('unavailable');await window.NH7_PERSONAL_SYNC_BRIDGE_WAVE2.clearVerse(storageKey,st,{batch_id:crypto.randomUUID(),language:lang(),items:[{verse_key:storageKey,verse_ref:m.ref||'',verse_text:m.verseText||'',saved:!!st.saved,highlight_color:st.highlight?String(st.highlightColor||'yellow'):'',note:text}]})}
   else if(note.kind==='apocrypha')localStorage.setItem(storageKey,text);
   else{if(!window.NH7_PERSONAL_SYNC_BRIDGE_WAVE2?.saveNote)throw Error('unavailable');await window.NH7_PERSONAL_SYNC_BRIDGE_WAVE2.saveNote(storageKey.replace(/^nh7_/,''),text)}
   if(!current())return;if(note.kind!=='plan')saveMeta(storageKey,note.meta||{});localStorage.removeItem(draftKey);renderNotesPanel();dialog.close();
  }catch{if(current())status.textContent=t('ذخیره تأیید نشد؛ متن و پیش‌نویس شما محفوظ است. دوباره تلاش کنید.','Save was not confirmed; your text and draft are preserved. Retry.','Spremanje nije potvrđeno; tekst i nacrt su sačuvani. Pokušajte ponovno.')}
  finally{busy=false;if(dialog.isConnected){save.disabled=false;input.readOnly=false}}
 };
 document.body.append(dialog);dialog.showModal();input.focus();
}

function verseSaveMeta(button){
  const storageKey=button.dataset.saveVerseNote||'';if(!storageKey)return;
  const verse=button.closest('.reader-verse'),input=verse?.querySelector(`[data-note-input="${CSS.escape(storageKey)}"]`),text=normalizedText(input?.value);if(!text)return;
  const ref=verse?.querySelector('[data-bookmark]')?.dataset.bookmark||verse?.querySelector('[data-share-verse]')?.dataset.shareVerse||'';
  const verseText=verse?.querySelector('.verse-text')?.textContent||'';
  const verseNumber=Number(String(verse?.id||'').replace(/^v-/,''))||Number(verse?.querySelector('.num')?.textContent)||0;
  const loc=historyLocation(),params=Object.assign({},loc.params,{section:'written',mode:'chapter'});if(verseNumber)params.verse=verseNumber;
  saveMeta(storageKey,{kind:'verse',title:ref||t('یادداشت آیه','Verse note','Bilješka stiha'),ref,verseText,verse:verseNumber,route:'bible',params});
}
function audioSaveMeta(button){
  const id=button.dataset.saveModalNote||'';if(!id)return;
  const modal=button.closest('#sermonNoteModal,.sermon-note-modal'),text=normalizedText(modal?.querySelector('#sermonModalNote')?.value);if(!text)return;
  const item=window.__sermonMap?.[id]||{},loc=historyLocation(),fallback=inferAudioLocation(id);
  const title=modal?.querySelector('h3')?.textContent||item['title_'+lang()]||item.title_fa||item.title_en||item.title_hr||'';
  saveMeta('nh7_sermon_note_'+id,{kind:'audio',id,title,route:loc.route||fallback.route,params:Object.keys(loc.params||{}).length?loc.params:fallback.params,mediaType:item.analytics_type||item.mediaType||'',bookCode:item.book_code||'',chapter:Number(item.chapter_number||0),lessonCode:item.lesson_code||item.course_code||''});
}
function gratitudeSaveMeta(button){
  const day=Number(button.dataset.gratitudeDay||1),text=normalizedText(document.getElementById('gratitudeNote')?.value);if(!text)return;
  saveMeta('nh7_gratitude_note_'+day,{kind:'gratitude',title:`${t('یادداشت شکرگزاری روز','Gratitude note — day','Bilješka zahvalnosti — dan')} ${day}`,route:'daily',params:{tab:'gratitude',gday:day}});
}
function genericSaveMeta(button){
  const id=button.dataset.saveNote||'';if(!id)return;
  const text=normalizedText(button.previousElementSibling?.value);if(!text)return;
  const storageKey='nh7_note_'+id,loc=historyLocation();
  saveMeta(storageKey,{kind:'generic',title:t('یادداشت من','My note','Moja bilješka'),route:loc.route||inferGenericLocation(storageKey).route,params:loc.params||{}});
}

document.addEventListener('click',event=>{
  const edit=event.target.closest?.('[data-nh7-note-edit]');if(edit){event.preventDefault();event.stopPropagation();editNote(decodeKey(edit.dataset.nh7NoteEdit));return}
  const open=event.target.closest?.('[data-nh7-note-open]');if(open){event.preventDefault();event.stopPropagation();openNote(decodeKey(open.dataset.nh7NoteOpen));return}
  const del=event.target.closest?.('[data-nh7-note-delete]');if(del){event.preventDefault();event.stopPropagation();deleteNote(decodeKey(del.dataset.nh7NoteDelete));return}
  const verse=event.target.closest?.('[data-save-verse-note]');if(verse){verseSaveMeta(verse);setTimeout(scheduleRender,50);return}
  const audio=event.target.closest?.('[data-save-modal-note]');if(audio){audioSaveMeta(audio);setTimeout(scheduleRender,50);return}
  const gratitude=event.target.closest?.('#completeGratitude');if(gratitude){gratitudeSaveMeta(gratitude);setTimeout(scheduleRender,50);return}
  const generic=event.target.closest?.('[data-save-note]');if(generic){genericSaveMeta(generic);setTimeout(scheduleRender,50)}
},true);

const observer=new MutationObserver(()=>{scheduleRender();if(pendingTarget)setTimeout(scrollToPending,80)});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('storage',scheduleRender);
window.addEventListener('nh7-sync-conflict-wave2',scheduleRender);
window.addEventListener('nh7-personal-owner-wave2',scheduleRender);
window.addEventListener('nh7-reader-data452',scheduleRender);
window.addEventListener('nh7-note-text-repaired-v501',scheduleRender);
window.addEventListener('nh7-account-data-restored-v544',scheduleRender);
window.addEventListener('popstate',()=>setTimeout(scrollToPending,250));
scheduleRender();
window.NH7MyNotesV234={VERSION,collectNotes,renderNotesPanel,openNote,deleteNote,editNote};
})();
