/* New Hope 7 v2.3.4 — unified My Notes for Bible, audio and app sections */
(()=>{'use strict';
const VERSION='2.3.4';
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
function normalizedText(value){return String(value||'').trim()}
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
  return{route:'audio',params:{}};
}
function inferGenericLocation(storageKey){
  const raw=storageKey.replace(/^nh7_note_/,'');
  if(raw.startsWith('school-'))return{route:'school',params:{lesson:raw.slice(7)}};
  if(raw.startsWith('daily-')||raw.startsWith('word-'))return{route:'daily',params:{tab:'word'}};
  return{route:'home',params:{}};
}
function noteTitle(kind,storageKey,meta){
  if(meta.title)return String(meta.title);
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
  if(kind==='verse')return t('آیه','Verse','Stih');
  if(kind==='audio')return t('فایل صوتی','Audio','Audio');
  if(kind==='gratitude')return t('شکرگزاری','Gratitude','Zahvalnost');
  return t('یادداشت','Note','Bilješka');
}
function collectNotes(){
  const notes=[];
  for(let i=0;i<localStorage.length;i++){
    const storageKey=localStorage.key(i);if(!storageKey||storageKey.startsWith(META_PREFIX))continue;
    let kind='',text='',stateValue=null;
    if(storageKey.startsWith('nh7_bible_state_')){
      stateValue=safeJson(localStorage.getItem(storageKey),{});text=normalizedText(stateValue?.note);kind='verse';
    }else if(storageKey.startsWith('nh7_sermon_note_')){
      text=normalizedText(localStorage.getItem(storageKey));kind='audio';
    }else if(storageKey.startsWith('nh7_gratitude_note_')){
      text=normalizedText(localStorage.getItem(storageKey));kind='gratitude';
    }else if(storageKey.startsWith('nh7_note_')){
      text=normalizedText(localStorage.getItem(storageKey));kind='generic';
    }
    if(!kind||!text)continue;
    const meta=readMeta(storageKey);
    let location={route:meta.route||'',params:meta.params||{}};
    if(!location.route){
      if(kind==='verse')location=inferVerseLocation(storageKey);
      else if(kind==='audio')location=inferAudioLocation(storageKey.replace(/^nh7_sermon_note_/,''));
      else if(kind==='gratitude')location={route:'daily',params:{tab:'gratitude',gday:Number(storageKey.replace(/^nh7_gratitude_note_/,'')||1)}};
      else location=inferGenericLocation(storageKey);
    }
    notes.push({storageKey,kind,text,title:noteTitle(kind,storageKey,meta),meta,stateValue,route:location.route,params:location.params||{},updatedAt:meta.updatedAt||''});
  }
  return notes.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))||b.storageKey.localeCompare(a.storageKey));
}
function noteCard(note){
  const encoded=encodeURIComponent(note.storageKey);
  const openText=t('باز کردن منبع','Open source','Otvori izvor');
  const deleteText=t('پاک کردن','Delete','Obriši');
  return `<article class="nh7-my-note-card-v234"><div class="nh7-my-note-head-v234"><span class="nh7-my-note-type-v234">${esc(typeLabel(note.kind))}</span><strong>${esc(note.title)}</strong></div><p>${esc(note.text).replace(/\n/g,'<br>')}</p><div class="button-row nh7-my-note-actions-v234"><button type="button" class="secondary-btn" data-nh7-note-open="${encoded}">↗ ${esc(openText)}</button><button type="button" class="danger-btn" data-nh7-note-delete="${encoded}">🗑 ${esc(deleteText)}</button></div></article>`;
}
function renderNotesPanel(){
  if(rendering)return;
  const panel=document.getElementById('notesPanel');if(!panel)return;
  const notes=collectNotes();
  const signature=notes.map(n=>`${n.storageKey}:${n.text.length}:${n.updatedAt}`).join('|');
  if(panel.dataset.nh7NotesSignature===signature)return;
  rendering=true;
  panel.dataset.nh7NotesSignature=signature;
  panel.innerHTML=notes.length?`<div class="nh7-my-notes-list-v234">${notes.map(noteCard).join('')}</div>`:`<p class="muted">${esc(t('هنوز یادداشتی ذخیره نشده است.','No notes have been saved yet.','Još nema spremljenih bilješki.'))}</p>`;
  const toggle=document.querySelector('[data-toggle-panel="notesPanel"]');
  if(toggle){toggle.dataset.nh7NoteCount=String(notes.length);const base=t('نمایش یادداشت‌های من','Show my notes','Prikaži moje bilješke');if(panel.classList.contains('hidden'))toggle.textContent=`${base} (${notes.length})`}
  rendering=false;
}
function scheduleRender(){clearTimeout(renderTimer);renderTimer=setTimeout(renderNotesPanel,40)}

function routeTo(route,params={}){
  const state={route,params};
  try{history.pushState(state,'','#'+encodeURIComponent(route)+':'+encodeURIComponent(JSON.stringify(params||{})))}catch(_){}
  try{window.dispatchEvent(new PopStateEvent('popstate',{state}))}catch(_){window.dispatchEvent(new Event('popstate'))}
}
function scrollToPending(){
  if(!pendingTarget)return;
  let target=null;
  if(pendingTarget.kind==='verse')target=document.getElementById('v-'+pendingTarget.verse)||document.querySelector(`[data-verse-key="${CSS.escape(pendingTarget.storageKey)}"]`);
  if(pendingTarget.kind==='audio')target=document.querySelector(`[data-sermon-card="${CSS.escape(pendingTarget.id)}"],[data-sermon-play="${CSS.escape(pendingTarget.id)}"]`);
  if(pendingTarget.kind==='generic'&&pendingTarget.lesson)target=document.querySelector('.school-assignment,textarea#schoolAssignmentAnswer');
  if(target){target.scrollIntoView({behavior:'smooth',block:'center'});target.classList.add('nh7-note-source-focus-v234');setTimeout(()=>target.classList.remove('nh7-note-source-focus-v234'),2400);pendingTarget=null}
}
function openNote(storageKey){
  const note=collectNotes().find(n=>n.storageKey===storageKey);if(!note)return;
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
  const dev=encodeURIComponent(deviceId()),key=encodeURIComponent(noteKey),mail=email();
  try{await cloudRequest(`user_notes?device_id=eq.${dev}&note_key=eq.${key}`,{method:'DELETE'})}catch(_){}
  if(mail)try{await cloudRequest(`nh7_account_notes?user_email=eq.${encodeURIComponent(mail)}&note_key=eq.${key}`,{method:'DELETE'})}catch(_){}
}
async function syncVerseState(note){
  const st=note.stateValue||safeJson(localStorage.getItem(note.storageKey),{})||{};
  st.note='';localStorage.setItem(note.storageKey,JSON.stringify(st));
  const now=new Date().toISOString(),mail=email(),dev=deviceId();
  try{await cloudRequest('user_progress?on_conflict=device_id,progress_key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({device_id:dev,progress_key:note.storageKey,value:st,language:lang(),updated_at:now})})}catch(_){}
  if(mail)try{await cloudRequest('nh7_account_progress?on_conflict=user_email,progress_key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_email:mail,progress_key:note.storageKey,value:st,language:lang(),updated_at:now})})}catch(_){}
  const meta=note.meta||{};
  try{await window.NH7AccessV230?.edge?.('nh7-content-access',{action:'save_bible_batch',batch_id:crypto.randomUUID?.()||String(Date.now()),language:lang(),items:[{verse_key:note.storageKey,verse_ref:meta.ref||'',verse_text:meta.verseText||'',saved:!!st.saved,highlight_color:st.highlight?String(st.highlightColor||'yellow'):'',note:''}]},true)}catch(_){}
}
async function deleteNote(storageKey){
  const note=collectNotes().find(n=>n.storageKey===storageKey);if(!note)return;
  if(!confirm(t('این یادداشت پاک شود؟','Delete this note?','Obrisati ovu bilješku?')))return;
  if(note.kind==='verse')await syncVerseState(note);else{
    localStorage.removeItem(storageKey);
    const cloudKey=storageKey.replace(/^nh7_/,'');
    await deleteCloudNote(cloudKey);
  }
  deleteMeta(storageKey);renderNotesPanel();
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
window.addEventListener('popstate',()=>setTimeout(scrollToPending,250));
scheduleRender();
window.NH7MyNotesV234={VERSION,collectNotes,renderNotesPanel,openNote,deleteNote};
})();
