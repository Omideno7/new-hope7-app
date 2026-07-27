/* New Hope 7 v2.3.1 — UI access gate + Bible tap-to-select batch tools */
(()=>{'use strict';
const VERSION='2.3.1';
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

/* Space in a note editor must remain text input, never a global shortcut. */
document.addEventListener('keydown',event=>{
  const target=event.target;
  if(!target?.matches?.('input,textarea,[contenteditable="true"],[role="textbox"]'))return;
  if(event.key===' '||event.code==='Space'||event.key==='Enter'||event.key==='Escape')event.stopImmediatePropagation();
},true);

function verseInfo(node){
  const bookmark=node.querySelector('[data-bookmark]');
  const share=node.querySelector('[data-share-verse]');
  const key=node.dataset.verseKey||node.querySelector('[data-toggle-highlight]')?.dataset.toggleHighlight||node.querySelector('[data-save-verse-note]')?.dataset.saveVerseNote||('nh7_bible_state_'+String(node.id||Math.random()).replace(/[^a-zA-Z0-9_-]/g,'_'));
  const ref=bookmark?.dataset.bookmark||share?.dataset.shareVerse||node.dataset.verseRef||key.replace(/^nh7_bible_state_/,'');
  const text=share?.dataset.shareText||node.querySelector('.verse-text')?.textContent||node.querySelector('.clean-verse-line span:not(.num)')?.textContent||node.textContent||'';
  return{node,key:String(key),ref:String(ref),text:String(text).trim().replace(/\s+/g,' ')};
}
function removeLegacyCircle(node){node.querySelectorAll(':scope > .nh7-verse-select-v230').forEach(button=>button.remove())}
function cleanupDetachedSelection(){selected.forEach((info,key)=>{if(!info.node?.isConnected)selected.delete(key)})}
function selectedCount(){cleanupDetachedSelection();return selected.size}
function toggleVerse(node,force){
  const info=verseInfo(node),on=force==null?!selected.has(info.key):!!force;
  if(on)selected.set(info.key,info);else selected.delete(info.key);
  node.classList.toggle('nh7-verse-selected-v230',on);
  node.setAttribute('aria-selected',String(on));
  renderToolbar();
}
function isActionTarget(target,node){
  const action=target?.closest?.('button,a,input,textarea,select,option,label,[contenteditable="true"],[role="textbox"],[data-bookmark],[data-share-verse],[data-toggle-highlight],[data-save-verse-note],[data-note-input],.verse-actions,.verse-tools,.verse-toolbar,.verse-note-preview');
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
}
function toolbar(){let bar=document.getElementById('nh7BibleBatchToolbarV230');if(bar)return bar;bar=document.createElement('aside');bar.id='nh7BibleBatchToolbarV230';bar.className='nh7-bible-batch-toolbar-v230 hidden';bar.innerHTML=`<div class="nh7-batch-head-v230"><strong data-nh7-batch-count></strong><button type="button" data-nh7-batch-clear aria-label="${esc(t('لغو انتخاب','Clear selection','Poništi odabir'))}">×</button></div><div class="nh7-batch-actions-v230"><button type="button" data-nh7-batch-save>★ ${esc(t('ذخیره','Save','Spremi'))}</button><label>${esc(t('رنگ','Color','Boja'))}<select data-nh7-batch-color><option value="#fff3a3">${esc(t('زرد','Yellow','Žuta'))}</option><option value="#c9f7d4">${esc(t('سبز','Green','Zelena'))}</option><option value="#cde8ff">${esc(t('آبی','Blue','Plava'))}</option><option value="#f7d0ef">${esc(t('صورتی','Pink','Ružičasta'))}</option><option value="remove">${esc(t('حذف هایلایت','Remove','Ukloni'))}</option></select></label><button type="button" data-nh7-batch-highlight>✦ ${esc(t('هایلایت','Highlight','Označi'))}</button><button type="button" data-nh7-batch-note>📝 ${esc(t('یادداشت','Note','Bilješka'))}</button><button type="button" data-nh7-batch-copy>⧉ ${esc(t('کپی','Copy','Kopiraj'))}</button><button type="button" data-nh7-batch-share>↗ ${esc(t('اشتراک','Share','Podijeli'))}</button></div>`;document.body.appendChild(bar);
  bar.querySelector('[data-nh7-batch-clear]').onclick=clearSelection;
  bar.querySelector('[data-nh7-batch-save]').onclick=()=>batchApply('save');
  bar.querySelector('[data-nh7-batch-highlight]').onclick=()=>batchApply('highlight',bar.querySelector('[data-nh7-batch-color]').value);
  bar.querySelector('[data-nh7-batch-note]').onclick=()=>{const value=prompt(t('یادداشت مشترک برای همه آیات انتخاب‌شده:','Shared note for all selected verses:','Zajednička bilješka za odabrane stihove:'),'');if(value!=null)batchApply('note',value)};
  bar.querySelector('[data-nh7-batch-copy]').onclick=()=>copySelected(false);
  bar.querySelector('[data-nh7-batch-share]').onclick=()=>copySelected(true);
  return bar;
}
function renderToolbar(){const bar=toolbar(),count=selectedCount();bar.classList.toggle('hidden',!count);bar.querySelector('[data-nh7-batch-count]').textContent=t(`${count} آیه انتخاب شده`,`${count} verse${count===1?'':'s'} selected`,`Odabrano stihova: ${count}`);document.body.classList.toggle('nh7-batch-open-v230',!!count)}
function clearSelection(){selected.forEach(v=>{v.node?.classList.remove('nh7-verse-selected-v230');v.node?.setAttribute('aria-selected','false')});selected.clear();renderToolbar()}
function readState(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch(_){return{}}}
function writeState(key,value){localStorage.setItem(key,JSON.stringify(value))}
function queueBatch(payload){let q=[];try{q=JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]')}catch(_){};q.push(payload);localStorage.setItem(QUEUE_KEY,JSON.stringify(q.slice(-50)))}
async function syncPayload(payload){if(!access?.token?.()){queueBatch(payload);return false}try{await access.edge('nh7-content-access',{action:'save_bible_batch',items:payload.items,batch_id:payload.batch_id,language:lang()},true);return true}catch(error){console.warn('Bible batch cloud sync',error);queueBatch(payload);return false}}
async function flushQueue(){if(!navigator.onLine||!access?.token?.())return;let q=[];try{q=JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]')}catch(_){};if(!q.length)return;const left=[];for(const item of q){try{await access.edge('nh7-content-access',Object.assign({action:'save_bible_batch'},item),true)}catch(_){left.push(item)}}localStorage.setItem(QUEUE_KEY,JSON.stringify(left))}
async function batchApply(action,value=''){
  if(!selected.size)return;const batchId=crypto.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2),bookmarks=new Set(JSON.parse(localStorage.getItem('nh7_bookmarks')||'[]'));
  const items=[];selected.forEach(info=>{
    const st=readState(info.key);
    if(action==='save'){st.saved=true;bookmarks.add(info.ref)}
    if(action==='highlight'){if(value==='remove'){st.highlight=false;delete st.highlightColor;info.node.style.removeProperty('--nh7-verse-highlight')}else{st.highlight=true;st.highlightColor=value;info.node.style.setProperty('--nh7-verse-highlight',value)}info.node.classList.toggle('highlighted',!!st.highlight)}
    if(action==='note'){st.note=String(value).slice(0,3000);let preview=info.node.querySelector('.verse-note-preview');if(!preview){preview=document.createElement('div');preview.className='verse-note-preview';info.node.appendChild(preview)}preview.textContent='📝 '+st.note;const input=info.node.querySelector('[data-note-input]');if(input)input.value=st.note}
    st.updatedAt=new Date().toISOString();st.batchId=batchId;writeState(info.key,st);
    items.push({verse_key:info.key,verse_ref:info.ref,verse_text:info.text,saved:!!st.saved,highlight_color:st.highlight?String(st.highlightColor||'#fff3a3'):'',note:String(st.note||'')});
  });
  localStorage.setItem('nh7_bookmarks',JSON.stringify([...bookmarks]));
  await syncPayload({batch_id:batchId,items});
  const btn=toolbar().querySelector(action==='save'?'[data-nh7-batch-save]':action==='highlight'?'[data-nh7-batch-highlight]':'[data-nh7-batch-note]');if(btn){const old=btn.textContent;btn.textContent='✓ '+t('انجام شد','Done','Gotovo');setTimeout(()=>btn.textContent=old,1200)}
}
function selectedText(){return [...selected.values()].map(v=>`${v.ref} — ${v.text}`).join('\n')}
async function copySelected(share){const text=selectedText();try{if(share&&navigator.share)await navigator.share({text});else{await navigator.clipboard.writeText(text);alert(t('آیات انتخاب‌شده کپی شدند.','Selected verses copied.','Odabrani stihovi su kopirani.'))}}catch(error){console.warn(error)}}

const observer=new MutationObserver(records=>{records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1)enhanceVerses(n)}));enhanceVerses(document);renderToolbar()});
observer.observe(document.documentElement,{childList:true,subtree:true});
enhanceVerses(document);toolbar();
window.addEventListener('online',flushQueue);window.addEventListener('nh7-access-status',flushQueue);setTimeout(flushQueue,1200);
window.NH7BibleBatchV230={VERSION,selected,clearSelection,batchApply,enhanceVerses,toggleVerse};
})();
