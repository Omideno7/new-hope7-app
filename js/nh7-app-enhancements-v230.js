/* New Hope 7 v2.3.3 — protected access + Bible tap selection using the original verse tools */
(()=>{'use strict';
const VERSION='2.3.3';
const access=window.NH7AccessV230;
const selected=new Map();
let bypassRouteOnce=false;
let gate=null;
const RESTRICTED=new Set(['audio','audioBible','library','apocrypha']);
const QUEUE_KEY='nh7_bible_batch_queue_v230';

function lang(){return localStorage.getItem('nh7_lang')||'en'}
function t(fa,en,hr){return lang()==='fa'?fa:lang()==='hr'?hr:en}
function esc(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function closeGate(){gate?.remove();gate=null;document.body.classList.remove('nh7-gate-open-v230')}
function openGate(mode='required',checking=false){
  closeGate();gate=document.createElement('div');gate.className='nh7-access-gate-v230';gate.setAttribute('role','dialog');gate.setAttribute('aria-modal','true');
  gate.innerHTML=`<section class="nh7-access-card-v230"><button type="button" class="nh7-access-close-v230" aria-label="${esc(t('بستن','Close','Zatvori'))}">×</button><div class="nh7-access-icon-v230">🔐</div><h2>${esc(checking?t('در حال بررسی دسترسی…','Checking access…','Provjera pristupa…'):t('برای مشاهده این بخش ثبت‌نام لازم است','Registration is required','Za ovaj sadržaj potrebna je registracija'))}</h2><p>${esc(checking?t('چند لحظه صبر کنید.','Please wait a moment.','Pričekajte trenutak.'):t('برای دسترسی به فایل‌های صوتی، کتاب مقدس صوتی، کتاب‌ها و جزوه‌ها باید با حساب خود وارد شوید، در مدرسه ثبت‌نام کنید و تأیید ادمین را دریافت کنید.','To access audio files, the Audio Bible, books and handouts, sign in, register for the school and receive admin approval.','Za pristup audio datotekama, Audio Bibliji, knjigama i materijalima prijavite se, registrirajte se za školu i pričekajte odobrenje administratora.'))}</p>${checking?'':`<div class="nh7-access-actions-v230"><button type="button" class="primary-btn" data-nh7-go-account>${esc(t('ورود به حساب','Sign in','Prijava'))}</button><button type="button" class="secondary-btn" data-nh7-go-school>${esc(t('ثبت‌نام مدرسه','School registration','Registracija za školu'))}</button></div>`}</section>`;
  document.body.appendChild(gate);document.body.classList.add('nh7-gate-open-v230');
  gate.querySelector('.nh7-access-close-v230').onclick=closeGate;
  gate.onclick=e=>{if(e.target===gate)closeGate()};
  gate.querySelector('[data-nh7-go-school]')?.addEventListener('click',()=>{closeGate();document.querySelector('[data-route="school"]')?.click()});
  gate.querySelector('[data-nh7-go-account]')?.addEventListener('click',()=>{closeGate();document.querySelector('[data-route="more"]')?.click();setTimeout(()=>document.querySelector('[data-go="account"]')?.click(),100)});
}
function routeFromTarget(target){const el=target?.closest?.('[data-go],[data-route]');return el?String(el.dataset.go||el.dataset.route||''):''}
async function interceptRestricted(event){
  if(bypassRouteOnce){bypassRouteOnce=false;return}
  const route=routeFromTarget(event.target);if(!RESTRICTED.has(route))return;
  if(access?.isApproved?.())return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();
  const trigger=event.target.closest('[data-go],[data-route]');
  if(access?.token?.()){
    openGate('checking',true);
    const status=await access.checkStatus(true);
    closeGate();
    if(status?.approved&&trigger){bypassRouteOnce=true;trigger.click();return}
  }
  openGate('required',false);
}
document.addEventListener('click',interceptRestricted,true);

document.addEventListener('keydown',event=>{
  const target=event.target;
  if(!target?.matches?.('input,textarea,[contenteditable="true"],[role="textbox"]'))return;
  if(event.key===' '||event.code==='Space'||event.key==='Enter'||event.key==='Escape')event.stopImmediatePropagation();
},true);

function verseInfo(node){
  const bookmark=node.querySelector('[data-bookmark]');
  const share=node.querySelector('[data-share-verse]');
  const key=node.dataset.verseKey||node.querySelector('[data-save-verse-note]')?.dataset.saveVerseNote||('nh7_bible_state_'+String(node.id||Math.random()).replace(/[^a-zA-Z0-9_-]/g,'_'));
  const ref=bookmark?.dataset.bookmark||share?.dataset.shareVerse||node.dataset.verseRef||key.replace(/^nh7_bible_state_/,'');
  const text=share?.dataset.shareText||node.querySelector('.verse-text')?.textContent||node.querySelector('.clean-verse-line span:not(.num)')?.textContent||node.textContent||'';
  return{node,key:String(key),ref:String(ref),text:String(text).trim().replace(/\s+/g,' ')};
}
function removeLegacyCircle(node){node.querySelectorAll(':scope > .nh7-verse-select-v230').forEach(button=>button.remove())}
function removeAddedToolbar(){
  document.getElementById('nh7BibleBatchToolbarV230')?.remove();
  document.body.classList.remove('nh7-batch-open-v230');
}
function cleanupDetachedSelection(){selected.forEach((info,key)=>{if(!info.node?.isConnected)selected.delete(key)})}
function selectedCount(){cleanupDetachedSelection();return selected.size}
function toggleVerse(node,force){
  const info=verseInfo(node),on=force==null?!selected.has(info.key):!!force;
  if(on)selected.set(info.key,info);else selected.delete(info.key);
  node.classList.toggle('nh7-verse-selected-v230',on);
  node.setAttribute('aria-selected',String(on));
  removeAddedToolbar();
}
function isActionTarget(target,node){
  const action=target?.closest?.('button,a,input,textarea,select,option,label,[contenteditable="true"],[role="textbox"],.verse-actions,.verse-tools,.verse-toolbar,.verse-note-box,.verse-note-preview');
  return !!action&&action!==node;
}
function bindVerseTap(node){
  removeLegacyCircle(node);
  if(node.dataset.nh7TapSelectReady==='1')return;
  node.dataset.nh7TapSelectReady='1';
  node.classList.add('nh7-verse-tap-select-v231');
  node.addEventListener('click',event=>{
    if(isActionTarget(event.target,node))return;
    toggleVerse(node);
  },true);
  node.addEventListener('keydown',event=>{
    if(event.key!=='Enter'||isActionTarget(event.target,node))return;
    event.preventDefault();toggleVerse(node);
  });
}
function enhanceVerses(root=document){
  root.querySelectorAll?.('.reader .reader-verse[data-verse-key],#bibleReaderContent [data-verse-key],.bible-verses [data-verse-key],.clean-verse[data-verse-key]').forEach(node=>{
    node.dataset.nh7BatchReady='1';
    bindVerseTap(node);
  });
  root.querySelectorAll?.('.nh7-verse-select-v230').forEach(button=>button.remove());
  removeAddedToolbar();
}
function clearSelection(){
  selected.forEach(v=>{v.node?.classList.remove('nh7-verse-selected-v230');v.node?.setAttribute('aria-selected','false')});
  selected.clear();
  removeAddedToolbar();
}
function readState(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch(_){return{}}}
function writeState(key,value){localStorage.setItem(key,JSON.stringify(value))}
function queueBatch(payload){let q=[];try{q=JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]')}catch(_){};q.push(payload);localStorage.setItem(QUEUE_KEY,JSON.stringify(q.slice(-50)))}
async function syncPayload(payload){if(!access?.token?.()){queueBatch(payload);return false}try{await access.edge('nh7-content-access',{action:'save_bible_batch',items:payload.items,batch_id:payload.batch_id,language:lang()},true);return true}catch(error){console.warn('Bible batch cloud sync',error);queueBatch(payload);return false}}
async function flushQueue(){if(!navigator.onLine||!access?.token?.())return;let q=[];try{q=JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]')}catch(_){};if(!q.length)return;const left=[];for(const item of q){try{await access.edge('nh7-content-access',Object.assign({action:'save_bible_batch'},item),true)}catch(_){left.push(item)}}localStorage.setItem(QUEUE_KEY,JSON.stringify(left))}
function colorName(value){
  const raw=String(value||'yellow').toLowerCase();
  if(['yellow','red','green','blue'].includes(raw))return raw;
  if(raw==='#c9f7d4')return'green';if(raw==='#cde8ff')return'blue';if(raw==='#f7d0ef')return'red';return'yellow';
}
function ensureNoteMarker(info,note){
  const verse=info.node,input=verse.querySelector(`[data-note-input="${CSS.escape(info.key)}"]`);
  if(input)input.value=note;
  let marker=verse.querySelector('.verse-note-marker');
  const box=input?.closest('.verse-note-box');
  if(note&&!marker){
    marker=document.createElement('button');marker.type='button';marker.className='verse-note-marker';marker.dataset.noteMarker=box?.id||'';marker.textContent='📓';marker.title=t('برای این آیه یادداشت ذخیره شده است','A note is saved for this verse','Bilješka je spremljena za ovaj stih');
    marker.onclick=()=>box?.classList.toggle('hidden');verse.querySelector('.verse-text')?.after(marker);
  }else if(!note&&marker)marker.remove();
}
async function batchApply(action,value=''){
  cleanupDetachedSelection();
  if(!selected.size)return;
  const batchId=crypto.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2);
  let stored=[];try{stored=JSON.parse(localStorage.getItem('nh7_bookmarks')||'[]')}catch(_){}
  const bookmarks=new Set(Array.isArray(stored)?stored:[]),items=[];
  selected.forEach(info=>{
    const st=readState(info.key);
    if(action==='save'){st.saved=true;bookmarks.add(info.ref);const button=info.node.querySelector('[data-bookmark]');if(button)button.textContent='★ '+t('ذخیره شد','Saved','Spremljeno')}
    if(action==='highlight'){
      info.node.classList.remove('highlight-yellow','highlight-red','highlight-green','highlight-blue');
      if(value==='remove'){st.highlight=false;delete st.highlightColor;info.node.classList.remove('highlighted')}
      else{const color=colorName(value);st.highlight=true;st.highlightColor=color;info.node.classList.add('highlighted','highlight-'+color)}
    }
    if(action==='note'){st.note=String(value).slice(0,1000);ensureNoteMarker(info,st.note)}
    st.updatedAt=new Date().toISOString();st.batchId=batchId;writeState(info.key,st);
    items.push({verse_key:info.key,verse_ref:info.ref,verse_text:info.text,saved:!!st.saved,highlight_color:st.highlight?String(st.highlightColor||'yellow'):'',note:String(st.note||'')});
  });
  localStorage.setItem('nh7_bookmarks',JSON.stringify([...bookmarks]));
  await syncPayload({batch_id:batchId,items});
}
function selectedText(){return [...selected.values()].map(v=>`${v.ref} — ${v.text}`).join('\n')}
async function copySelected(share){const text=selectedText();try{if(share&&navigator.share)await navigator.share({text});else{await navigator.clipboard.writeText(text);alert(t('آیات انتخاب‌شده کپی شدند.','Selected verses copied.','Odabrani stihovi su kopirani.'))}}catch(error){console.warn(error)}}

document.addEventListener('click',event=>{
  const share=event.target?.closest?.('[data-share-verse]');
  if(share&&selectedCount()>1){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();copySelected(true);return}
  if(selectedCount()<2)return;
  const action=event.target?.closest?.('[data-bookmark],[data-highlight-color],[data-highlight-clear],[data-save-verse-note]');
  if(!action)return;
  setTimeout(()=>{
    if(action.matches('[data-bookmark]'))batchApply('save');
    else if(action.matches('[data-highlight-color]'))batchApply('highlight',action.dataset.highlightColor||'yellow');
    else if(action.matches('[data-highlight-clear]'))batchApply('highlight','remove');
    else if(action.matches('[data-save-verse-note]')){
      const key=action.dataset.saveVerseNote||'';
      const input=action.closest('.reader-verse')?.querySelector(`[data-note-input="${CSS.escape(key)}"]`);
      batchApply('note',input?.value||'');
    }
  },0);
},true);

let observerQueued=false;
const observer=new MutationObserver(records=>{
  if(observerQueued)return;
  observerQueued=true;
  requestAnimationFrame(()=>{
    observerQueued=false;
    records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1)enhanceVerses(n)}));
    enhanceVerses(document);cleanupDetachedSelection();removeAddedToolbar();
  });
});
observer.observe(document.documentElement,{childList:true,subtree:true});
enhanceVerses(document);removeAddedToolbar();
window.addEventListener('online',flushQueue);window.addEventListener('nh7-access-status',flushQueue);setTimeout(flushQueue,1200);
window.NH7BibleBatchV230={VERSION,selected,clearSelection,batchApply,enhanceVerses,toggleVerse};
})();
