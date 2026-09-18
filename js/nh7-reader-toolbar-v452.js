/* New Hope 7 v4.5.2 — one selection controller, existing storage contracts. */
(()=>{'use strict';
if(window.__NH7_READER_TOOLBAR_V452__)return;
window.__NH7_READER_TOOLBAR_V452__=true;
const VERSION='4.5.2-r2',APP_URL='https://omideno7.github.io/new-hope7-app/app/';
const selected=new Map(),BOOKMARKS='nh7_bookmarks',NOTE_META='nh7_my_note_meta_v234_';
let bar=null,dialog=null,lastFocus=null,observerPending=false,selectionLang='',busy=false;
const language=()=>['fa','en','hr'].includes(localStorage.getItem('nh7_lang'))?localStorage.getItem('nh7_lang'):'en';
const L=(fa,en,hr)=>language()==='fa'?fa:language()==='hr'?hr:en;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=(v,loc=language())=>loc==='fa'?String(v).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):String(v);
const read=(key,fallback)=>{const raw=localStorage.getItem(key);return raw==null?fallback:JSON.parse(raw)};
const bookmarks=()=>{const rows=read(BOOKMARKS,[]);if(!Array.isArray(rows))throw Error('Invalid saved verse data');return rows};
const labels=()=>({copy:L('کپی','Copy','Kopiraj'),highlight:L('هایلایت','Highlight','Istakni'),save:L('ذخیره','Save','Spremi'),unsave:L('لغو ذخیره','Unsave','Ukloni'),note:L('یادداشت','Note','Bilješka'),share:L('اشتراک','Share','Podijeli'),close:L('بستن انتخاب‌ها','Clear selection','Poništi odabir')});
const icons={copy:'⧉',highlight:'✦',save:'☆',unsave:'★',note:'✎',share:'↗',close:'×'};
function source(node){
  if(node.matches('.reader-verse[data-verse-key]')){
    const key=node.dataset.verseKey,m=key.match(/^nh7_bible_state_([A-Z0-9]+)_(\d+)_(\d+)$/);
    const ref=node.querySelector('[data-bookmark]')?.dataset.bookmark||'';
    if(!m||!ref)return null;
    return{kind:'bible',key,ref,bookId:m[1],chapter:+m[2],verse:+m[3],node};
  }
  const current=window.NH7ApoReaderSourceV452?.current?.(),book=current?.book,verse=+node.dataset.apoVerse;
  if(!book||!verse||!current.chapter)return null;
  const suffix=`${book.book_id}:${current.chapter}:${verse}`;
  return{kind:'apocrypha',key:'nh7_apo_note_v242:'+suffix,ref:'APO:'+suffix,bookId:book.book_id,chapter:+current.chapter,verse,book,node};
}
function displayRef(info,loc=language()){
  if(info.kind==='apocrypha')return `${info.book?.['title_'+loc]||info.bookId} ${number(info.chapter,loc)}:${number(info.verse,loc)}`;
  return window.NH7ReaderSourceV452?.label?.(info.bookId,info.chapter,info.verse,loc)||info.node.closest('.card')?.querySelector('h2')?.textContent+':'+number(info.verse,loc);
}
function textOf(info){return String(info.node.querySelector(info.kind==='bible'?'.verse-text':'.nh7-apo-verse-text')?.textContent||'').trim()}
function items(){
  for(const [key,info] of selected)if(!info.node.isConnected)selected.delete(key);
  return [...selected.values()].sort((a,b)=>a.node===b.node?0:(a.node.compareDocumentPosition(b.node)&Node.DOCUMENT_POSITION_FOLLOWING)?-1:1);
}
function syncLegacy(){const legacy=window.NH7BibleBatchV230?.selected;if(!legacy)return;legacy.clear();for(const info of items())if(info.kind==='bible')legacy.set(info.key,{...info,text:textOf(info)})}
function mark(info,on){
  info.node.classList.toggle('nh7-reader-selected452',on);
  info.node.classList.toggle('nh7-verse-selected-v230',on&&info.kind==='bible');
  info.node.classList.remove('verse-selected');
  const focus=info.kind==='bible'?info.node:info.node.querySelector('.nh7-apo-verse-main');
  focus?.setAttribute('aria-selected',String(on));
  info.node.querySelectorAll('.verse-tools,.nh7-apo-verse-tools').forEach(n=>n.classList.add('hidden'));
}
function toggle(node,force){
  const info=source(node);if(!info)return;
  if(selectionLang&&selectionLang!==language())clear();selectionLang=language();
  const on=force==null?!selected.has(info.key):!!force;
  if(on)selected.set(info.key,info);else selected.delete(info.key);
  mark(info,on);syncLegacy();paint();
}
function clear(){for(const info of selected.values())mark(info,false);selected.clear();syncLegacy();closeDialog();paint()}
function deselect(node){toggle(node,false)}
function toast(message,error=false){
  let n=document.getElementById('nh7ReaderToast452');if(!n){n=document.createElement('div');n.id='nh7ReaderToast452';n.setAttribute('role','status');n.setAttribute('aria-live','polite');document.body.appendChild(n)}
  n.textContent=message;n.className='nh7-reader-toast-v452 show'+(error?' is-error':'');clearTimeout(n._timer);n._timer=setTimeout(()=>n.classList.remove('show'),2200);
}
function ensureBar(){
  if(bar?.isConnected)return bar;
  bar=document.createElement('aside');bar.id='nh7ReaderToolbar452';bar.setAttribute('role','toolbar');
  bar.addEventListener('click',event=>{
    const button=event.target.closest('[data-reader-action452],[data-reader-color452]');if(!button||busy)return;
    event.preventDefault();const action=button.dataset.readerAction452;
    if(button.dataset.readerColor452){run(()=>apply('highlight',button.dataset.readerColor452));return}
    if(action==='copy')copy();else if(action==='share')share();else if(action==='close')clear();
    else if(action==='note')openNote();else if(action==='highlight'){const p=bar.querySelector('[data-reader-palette452]');p.hidden=!p.hidden;button.setAttribute('aria-expanded',String(!p.hidden))}
    else if(action==='save')run(()=>apply(allSaved()?'unsave':'save'));
  });
  document.body.appendChild(bar);return bar;
}
function allSaved(){const refs=new Set(bookmarks());return items().length>0&&items().every(i=>refs.has(i.ref)||(i.kind==='bible'&&read(i.key,{})?.saved===true))}
function paint(){
  const rows=items();if(!rows.length){if(bar)bar.hidden=true;document.body.classList.remove('nh7-reader-selection-open452');return}
  ensureBar();bar.hidden=false;bar.dir=language()==='fa'?'rtl':'ltr';bar.setAttribute('aria-label',L('ابزار آیات انتخاب‌شده','Selected verse tools','Alati za odabrane stihove'));
  document.body.classList.add('nh7-reader-selection-open452');
  let saved=false;try{saved=allSaved()}catch(_){ }
  const words=labels(),summary=L(`${number(rows.length)} آیه انتخاب شده`,`${rows.length} selected verses`,`${rows.length} odabranih stihova`);
  const signature=language()+'|'+rows.map(x=>x.key).join('|')+'|'+saved;
  if(bar.dataset.signature===signature)return;bar.dataset.signature=signature;
  bar.innerHTML=`<div class="nh7-reader-selection-summary452" aria-live="polite">${E(summary)}</div><div class="nh7-reader-action-row452">${['copy','highlight','save','note','share','close'].map(action=>{const label=action==='save'&&saved?words.unsave:words[action];return `<button type="button" data-reader-action452="${action}" aria-label="${E(label)}" title="${E(label)}" ${action==='save'?`aria-pressed="${saved}"`:''} ${action==='highlight'?'aria-expanded="false"':''}><span aria-hidden="true">${icons[action==='save'&&saved?'unsave':action]}</span><small>${E(label)}</small></button>`}).join('')}</div><div data-reader-palette452 hidden>${['yellow','red','green','blue'].map(color=>`<button type="button" data-reader-color452="${color}" class="nh7-reader-swatch452 ${color}" aria-label="${E(colorLabel(color))}" title="${E(colorLabel(color))}"></button>`).join('')}<button type="button" data-reader-color452="remove">${E(L('حذف هایلایت','Remove highlight','Ukloni isticanje'))}</button></div>`;
}
function colorLabel(c){return ({yellow:L('زرد','Yellow','Žuta'),red:L('قرمز','Red','Crvena'),green:L('سبز','Green','Zelena'),blue:L('آبی','Blue','Plava')})[c]||c}
function shareText(withLink=true,rows=items()){
  if(!rows.length)return'';
  const text=rows.map(info=>`${displayRef(info)} — ${textOf(info)}`).join('\n\n');
  return text+(withLink?'\n\n'+L('مطالعه در New Hope 7:','Read in New Hope 7:','Čitajte u New Hope 7:')+'\n'+APP_URL:'');
}
async function writeClipboard(text){
  if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);return}catch(_){}}
  const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;left:-9999px;top:0;font-size:16px';
  document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,ta.value.length);
  let ok=false;try{ok=document.execCommand('copy')}finally{ta.remove()}if(!ok)throw Error('Clipboard unavailable');
}
async function copy(){
  const rows=items(),text=shareText(false,rows);if(!text||busy)return;busy=true;
  try{await writeClipboard(text);clear();toast(L('آیات کپی شدند','Verses copied','Stihovi su kopirani'))}
  catch(_){toast(L('کپی انجام نشد؛ انتخاب‌ها حفظ شدند.','Copy failed; your selection was kept.','Kopiranje nije uspjelo; odabir je sačuvan.'),true)}finally{busy=false}
}
async function share(){
  const text=shareText(true);if(!text||busy)return;busy=true;
  try{if(navigator.share)await navigator.share({text});else await writeClipboard(text);clear();toast(L('انجام شد','Done','Gotovo'))}
  catch(e){if(e?.name!=='AbortError')toast(L('ارسال انجام نشد؛ انتخاب‌ها حفظ شدند.','Sharing failed; your selection was kept.','Dijeljenje nije uspjelo; odabir je sačuvan.'),true)}finally{busy=false}
}
function noteOf(info){return info.kind==='bible'?String(read(info.key,{})?.note||''):String(localStorage.getItem(info.key)||'')}
function saveMetadata(info){
  const key=NOTE_META+encodeURIComponent(info.key),previous=read(key,{});
  if(!previous||typeof previous!=='object'||Array.isArray(previous))throw Error('Invalid note metadata');
  localStorage.setItem(key,JSON.stringify({...previous,kind:info.kind==='bible'?'verse':'apocrypha',ref:info.ref,bookId:info.bookId,chapter:info.chapter,verse:info.verse,title:displayRef(info),language:language(),verseText:textOf(info),route:info.kind==='bible'?'bible':'apocrypha',params:{section:'written',mode:'chapter',bookId:info.bookId,chapter:info.chapter,verse:info.verse},updatedAt:new Date().toISOString()}));
}
function backupsFor(rows){
  const keys=new Set([BOOKMARKS,'nh7_bible_batch_queue_v230','nh7_saved_verse_text_v251']);
  for(const i of rows){keys.add(i.key);keys.add(NOTE_META+encodeURIComponent(i.key));if(i.kind==='apocrypha'){keys.add('nh7_apo_highlight_v242:'+i.ref.slice(4));keys.add('nh7_apo_highlight_color_v244:'+i.ref.slice(4))}}
  return new Map([...keys].map(k=>[k,localStorage.getItem(k)]));
}
async function apply(action,value=''){
  const rows=items();if(!rows.length)return;
  const notes=action==='note'?new Map(rows.map(i=>[i.key,typeof value==='function'?String(value(noteOf(i),i)):String(value)])):null;
  if(notes)for(const i of rows)if(notes.get(i.key).length>(i.kind==='bible'?1000:2000))throw Error(L('یادداشت بیش از حد طولانی است؛ متن قبلی حفظ شد.','The note is too long; existing text was kept.','Bilješka je preduga; prethodni tekst je sačuvan.'));
  const backup=backupsFor(rows);
  try{
    if(rows[0].kind==='bible'){
      const api=window.NH7BibleBatchV230;if(!api?.batchApply)throw Error('Reader not ready');
      for(const i of rows)if(action==='note'||action==='save')saveMetadata(i);
      syncLegacy();await api.batchApply(action,notes?((old,info)=>notes.get(info.key)):value);
    }else{
      for(const i of rows){
        if(action==='save'||action==='unsave'){
          const button=i.node.querySelector('[data-nh7-apo-save]');if(!button)throw Error('Reader not ready');
          const isSaved=bookmarks().includes(i.ref);if(isSaved!==(action==='save'))await window.NH7ApoActionsV452.toggleSave(button);
        }else if(action==='highlight'){
          const suffix=i.ref.slice(4),main=i.node.querySelector('.nh7-apo-verse-main'),color=value==='red'?'pink':value;
          const active=color!=='remove';
          if(active){localStorage.setItem('nh7_apo_highlight_v242:'+suffix,'1');localStorage.setItem('nh7_apo_highlight_color_v244:'+suffix,color)}
          else{localStorage.removeItem('nh7_apo_highlight_v242:'+suffix);localStorage.removeItem('nh7_apo_highlight_color_v244:'+suffix)}
          for(const c of ['yellow','green','blue','pink','purple'])main.classList.remove('nh7-hl-'+c);
          if(active)main.classList.add('nh7-hl-'+color);i.node.classList.toggle('is-highlighted',active);
        }else if(action==='note'){
          const text=notes.get(i.key);if(text)localStorage.setItem(i.key,text);else localStorage.removeItem(i.key);
          const input=i.node.querySelector('textarea');if(input)input.value=text;
          let mark=i.node.querySelector('.nh7-apo-note-mark');
          if(text&&!mark){mark=document.createElement('span');mark.className='nh7-apo-note-mark';mark.textContent='📓';i.node.querySelector('.nh7-apo-verse-main').appendChild(mark)}else if(!text&&mark)mark.remove();
          saveMetadata(i);
        }
      }
    }
  }catch(error){for(const [key,raw] of backup){try{raw==null?localStorage.removeItem(key):localStorage.setItem(key,raw)}catch(_){}}throw error}
  if(bar)bar.dataset.signature='';paint();
  bar?.querySelector('[data-reader-palette452]')?.setAttribute('hidden','');
  window.dispatchEvent(new CustomEvent('nh7-reader-data452',{detail:{action,refs:rows.map(i=>i.ref)}}));
  toast(L('روی آیات انتخاب‌شده اعمال شد','Applied to selected verses','Primijenjeno na odabrane stihove'));
}
async function run(work){if(busy)return;busy=true;try{await work()}catch(e){toast(e.message||L('انجام نشد؛ دوباره تلاش کنید.','Could not complete; please retry.','Nije dovršeno; pokušajte ponovno.'),true)}finally{busy=false}}
function closeDialog(){if(dialog){dialog.remove();dialog=null;try{lastFocus?.focus({preventScroll:true})}catch(_){}}}
function openNote(){
  const rows=items();if(!rows.length)return;closeDialog();lastFocus=document.activeElement;
  const old=rows.map(noteOf),same=old.every(n=>n===old[0]);
  dialog=document.createElement('dialog');dialog.className='nh7-reader-note-dialog452';dialog.dir=language()==='fa'?'rtl':'ltr';
  dialog.innerHTML=`<form method="dialog"><h3>${E(L('یادداشت برای آیات انتخاب‌شده','Note for selected verses','Bilješka za odabrane stihove'))}</h3><p>${rows.map(i=>E(displayRef(i))).join(' · ')}</p>${rows.length>1?`<label>${E(L('روش ذخیره','Save mode','Način spremanja'))}<select data-reader-note-mode452><option value="append">${E(L('افزودن به یادداشت‌های قبلی','Append to existing notes','Dodaj postojećim bilješkama'))}</option><option value="replace">${E(L('جایگزینی یادداشت‌ها','Replace notes','Zamijeni bilješke'))}</option></select></label>`:''}<label>${E(labels().note)}<textarea data-reader-note452 rows="5" maxlength="${rows[0].kind==='bible'?1000:2000}"></textarea></label><p class="muted">${E(L('یادداشت‌های قبلی بدون انتخاب جایگزینی پاک نمی‌شوند.','Existing notes are not overwritten unless you choose replacement.','Prethodne bilješke nisu prebrisane bez odabira zamjene.'))}</p><div class="button-row"><button type="button" data-reader-note-save452 class="primary-btn">${E(labels().save)}</button><button type="button" data-reader-note-cancel452 class="secondary-btn">${E(L('انصراف','Cancel','Odustani'))}</button></div></form>`;
  const input=dialog.querySelector('textarea');input.value=rows.length===1&&same?old[0]:'';
  dialog.querySelector('[data-reader-note-cancel452]').onclick=closeDialog;
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog()});
  dialog.querySelector('[data-reader-note-save452]').onclick=()=>run(async()=>{
    const text=input.value,mode=dialog.querySelector('select')?.value||'replace';
    if(rows.length>1&&mode==='replace'&&old.some(n=>n!==text&&n)&&!confirm(L('یادداشت‌های این آیات جایگزین شوند؟','Replace the notes for these verses?','Zamijeniti bilješke za ove stihove?')))return;
    if(mode==='append'&&!text.trim()){closeDialog();return}
    await apply('note',mode==='append'?previous=>previous?(previous+'\n\n'+text):text:text);closeDialog();
  });
  document.body.appendChild(dialog);dialog.showModal();input.focus();
}
async function resolveSaved(ref,locale=language()){
  if(String(ref).startsWith('APO:')){
    const m=ref.match(/^APO:([^:]+):(\d+):(\d+)$/);if(!m)return null;
    const payload=await window.NH7ApoReaderSourceV452?.load?.();if(!payload)return null;
    const book=payload.books.find(b=>b.book_id===m[1]);if(!book)return null;
    const row=book.chapters.find(c=>+c.chapter===+m[2])?.verses.find(v=>+v.verse===+m[3]);
    return{label:`${book['title_'+locale]||m[1]} ${number(m[2],locale)}:${number(m[3],locale)}`,bookName:book['title_'+locale]||m[1],text:String(row?.['text_'+locale]||'').trim(),kind:L('اپوکریفا','Apocrypha','Apokrifi')};
  }
  return window.NH7ReaderSourceV452?.resolve?.(ref,locale)||null;
}
function handle(event){
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  if(target.closest('#nh7ReaderToolbar452,.nh7-reader-note-dialog452'))return;
  const node=target.closest('.reader-verse[data-verse-key],.nh7-apo-verse');if(!node)return;
  const noteMarker=target.closest('.verse-note-marker,.nh7-apo-note-mark');
  if(target.closest('a,input,textarea,select,button,.verse-tools,.verse-note-box,.nh7-apo-verse-tools')&&!target.closest('.nh7-apo-verse-main')&&!noteMarker)return;
  if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
  if(event.type==='keydown'&&event.repeat)return;
  if(!source(node))return;
  event.preventDefault();event.stopImmediatePropagation();
  if(noteMarker){clear();toggle(node,true);openNote()}else toggle(node);
}
window.addEventListener('click',handle,true);window.addEventListener('keydown',handle,true);
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&!dialog&&items().length){clear();event.stopImmediatePropagation()}},true);
function enhance(){
  observerPending=false;
  if(selectionLang&&selectionLang!==language())clear();
  for(const [key,info] of selected)if(!info.node.isConnected)selected.delete(key);
  document.querySelectorAll('.reader.continuous-reader,.nh7-apo-continuous-reader').forEach(r=>r.classList.add('nh7-reader-managed452'));
  syncLegacy();paint();
}
new MutationObserver(()=>{if(!observerPending){observerPending=true;requestAnimationFrame(enhance)}}).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('popstate',clear);window.addEventListener('languagechange',clear);window.addEventListener('storage',event=>{if(event.key==='nh7_lang')clear();else if(event.key===BOOKMARKS){if(bar)bar.dataset.signature='';paint()}});
window.NH7ReaderToolbarV452={VERSION,APP_URL,selected,items,toggle,deselect,clear,shareText,copy,share,apply,displayRef,resolveSaved,enhance,copyText:writeClipboard,notify:toast};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
})();
