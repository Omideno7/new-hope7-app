/* v452: source-aware note/saved-verse grouping; no storage migration. */
(()=>{'use strict';
if(window.__NH7_NOTES_CATEGORIES_V452__)return;window.__NH7_NOTES_CATEGORIES_V452__=true;
const language=()=>localStorage.getItem('nh7_lang')||'en',L=(fa,en,hr)=>language()==='fa'?fa:language()==='hr'?hr:en;
const number=n=>language()==='fa'?String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):String(n);
let timer=0,notesBusy=false,savedBusy=false;const expanded=new Set(),resolvedCache=new Map();
const labels={bible:()=>L('کتاب مقدس','Bible','Biblija'),apocrypha:()=>L('اپوکریفا','Apocrypha','Apokrifi'),audio:()=>L('موعظات و فایل‌های صوتی','Sermons and audio','Propovijedi i audio'),school:()=>L('مدرسه','School','Škola'),gratitude:()=>L('شکرگزاری','Gratitude','Zahvalnost'),other:()=>L('سایر یادداشت‌ها','Other notes','Ostale bilješke')};
function category(n){
  const k=n.storageKey||'',m=n.meta||{};
  if(n.kind==='apocrypha'||k.startsWith('nh7_apo_note_v242:'))return'apocrypha';
  if(k.startsWith('nh7_bible_state_'))return'bible';
  if(k.startsWith('nh7_gratitude_note_'))return'gratitude';
  if(m.lessonCode||m.route==='school'||k.startsWith('nh7_note_school-')||k.startsWith('nh7_sermon_note_school-'))return'school';
  if(k.startsWith('nh7_sermon_note_'))return'audio';return'other';
}
function noteRef(n){
  if(n.kind==='apocrypha')return'APO:'+n.storageKey.replace(/^nh7_apo_note_v242:/,'');
  if(n.kind!=='verse')return'';
  if(n.meta?.ref)return n.meta.ref;
  const m=n.storageKey.match(/^nh7_bible_state_([A-Z0-9]+)_(\d+)_(\d+)$/);return m?`${m[1]} ${m[2]}:${m[3]}`:'';
}
async function resolve(ref,locale){
  const key=locale+'|'+ref;
  if(!resolvedCache.has(key))resolvedCache.set(key,Promise.resolve(window.NH7ReaderToolbarV452?.resolveSaved?.(ref,locale)).catch(()=>null));
  const result=await resolvedCache.get(key);if(!result)resolvedCache.delete(key);return result;
}
function groupBox(key,label,count){
  const group=document.createElement('details');group.className='nh7-note-category-v452';group.dataset.readerGroup452=key;group.open=expanded.has(key);
  const summary=document.createElement('summary'),title=document.createElement('strong'),badge=document.createElement('span');title.textContent=label;badge.textContent=number(count);summary.append(title,badge);group.append(summary);
  const list=document.createElement('div');list.className='nh7-note-category-list-v452';group.append(list);
  group.addEventListener('toggle',()=>{if(group.open)expanded.add(key);else expanded.delete(key)});
  return{group,list};
}
async function notesPanel(){
  const api=window.NH7MyNotesV234,panel=document.getElementById('notesPanel');if(!api||!panel||notesBusy)return;
  const notes=api.collectNotes(),cards=[...panel.querySelectorAll('.nh7-my-note-card-v234')],locale=language();
  if(!notes.length||cards.length!==notes.length)return;
  const signature=locale+'|'+JSON.stringify(notes.map(n=>[n.storageKey,n.text,n.title]));
  if(panel.dataset.categories452===signature&&panel.querySelector('.nh7-note-categories-v452'))return;
  notesBusy=true;
  try{
    const refs=await Promise.all(notes.map(n=>{const ref=noteRef(n);return ref?resolve(ref,locale):null}));
    if(!panel.isConnected||language()!==locale||cards.some(c=>!panel.contains(c)))return;
    const byKey=new Map(cards.map(card=>{let key='';try{key=decodeURIComponent(card.querySelector('[data-nh7-note-open]')?.dataset.nh7NoteOpen||'')}catch(_){ }return[key,card]})),groups=new Map();
    notes.forEach((n,index)=>{
      const card=byKey.get(n.storageKey);if(!card)return;
      const kind=category(n),title=refs[index]?.label;
      if(title){const strong=card.querySelector('.nh7-my-note-head-v234 strong');if(strong&&strong.textContent!==title)strong.textContent=title}
      if(kind==='gratitude'){const strong=card.querySelector('.nh7-my-note-head-v234 strong'),day=n.storageKey.replace('nh7_gratitude_note_','');const title=L('یادداشت شکرگزاری روز ','Gratitude note — day ','Bilješka zahvalnosti — dan ')+number(day);if(strong&&strong.textContent!==title)strong.textContent=title}
      const type=card.querySelector('.nh7-my-note-type-v234');if(type&&type.textContent!==labels[kind]())type.textContent=labels[kind]();
      if(!groups.has(kind))groups.set(kind,[]);groups.get(kind).push(card);
    });
    const wrap=document.createElement('div');wrap.className='nh7-note-categories-v452';
    for(const key of ['bible','apocrypha','audio','school','gratitude','other'])if(groups.has(key)){const {group,list}=groupBox('notes:'+key,labels[key](),groups.get(key).length);list.append(...groups.get(key));wrap.append(group)}
    panel.replaceChildren(wrap);panel.dataset.categories452=signature;
  }finally{notesBusy=false}
}
function savedRef(card){return card.querySelector('[data-delete-bookmark]')?.dataset.deleteBookmark||''}
function addSavedActions(card,result,ref){
  let row=card.querySelector('[data-reader-saved-actions452]');if(row)return;
  row=document.createElement('div');row.className='button-row nh7-saved-extra452';row.dataset.readerSavedActions452='1';
  for(const action of ['copy','share']){
    const button=document.createElement('button');button.type='button';button.className='secondary-btn';button.dataset.readerSavedAction452=action;button.textContent=action==='copy'?'⧉ '+L('کپی','Copy','Kopiraj'):'↗ '+L('اشتراک','Share','Podijeli');
    button.onclick=async event=>{
      event.stopPropagation();const api=window.NH7ReaderToolbarV452;if(!api)return;
      if(!result.text){api.notify(L('متن این ترجمه در دسترس نیست.','Text is unavailable in this translation.','Tekst nije dostupan na ovom jeziku.'),true);return}
      let text=result.label+' — '+result.text;
      if(action==='share')text+='\n\n'+L('مطالعه در New Hope 7:','Read in New Hope 7:','Čitajte u New Hope 7:')+'\n'+api.APP_URL;
      try{if(action==='share'&&navigator.share)await navigator.share({text});else await api.copyText(text);api.notify(L('انجام شد','Done','Gotovo'))}catch(e){if(e.name!=='AbortError')api.notify(L('انجام نشد؛ دوباره تلاش کنید.','Could not complete; please retry.','Nije dovršeno; pokušajte ponovno.'),true)}
    };row.append(button);
  }
  card.append(row);
}
async function savedPanel(){
  const panel=document.getElementById('savedVersesPanel');if(!panel||savedBusy)return;
  const cards=[...panel.querySelectorAll('.saved-verse-card')],locale=language();if(!cards.length)return;
  const signature=locale+'|'+cards.map(savedRef).sort().join('|');
  if(panel.dataset.grouped452===signature&&panel.querySelector('.nh7-saved-groups452'))return;
  savedBusy=true;
  try{
    const results=await Promise.all(cards.map(c=>resolve(savedRef(c),locale)));
    if(!panel.isConnected||language()!==locale||cards.some(c=>!panel.contains(c)))return;
    const groups=new Map();
    cards.forEach((card,index)=>{
      const ref=savedRef(card),result=results[index],kind=ref.startsWith('APO:')?'apocrypha':'bible',name=result?.bookName||L('سایر آیات','Other verses','Ostali stihovi'),key=kind+':'+name;
      if(result){const title=card.querySelector(':scope > strong');if(title&&title.textContent!==result.label)title.textContent=result.label;addSavedActions(card,result,ref)}
      if(!groups.has(key))groups.set(key,{label:(kind==='apocrypha'?labels.apocrypha()+' · ':'')+name,cards:[]});groups.get(key).cards.push(card);
    });
    const wrap=document.createElement('div');wrap.className='nh7-note-categories-v452 nh7-saved-groups452';
    for(const [key,value] of groups){const {group,list}=groupBox('saved:'+key,value.label,value.cards.length);list.append(...value.cards);wrap.append(group)}
    panel.replaceChildren(wrap);panel.dataset.grouped452=signature;
  }finally{savedBusy=false}
}
function enhance(){notesPanel().catch(console.warn);savedPanel().catch(console.warn)}
function schedule(){clearTimeout(timer);timer=setTimeout(enhance,70)}
window.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-delete-bookmark]');if(!button||button.dataset.deleteBookmark.startsWith('APO:'))return;
  const handler=button.onclick;if(typeof handler!=='function'||!window.NH7ReaderSourceV452)return;
  event.preventDefault();event.stopImmediatePropagation();button.disabled=true;
  window.NH7ReaderSourceV452.removeSaved(button.dataset.deleteBookmark).then(()=>handler.call(button,new MouseEvent('click',{bubbles:false}))).catch(error=>{button.disabled=false;window.NH7ReaderToolbarV452?.notify(error.message,true)});
},true);
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('storage',schedule);window.addEventListener('nh7-reader-data452',schedule);window.addEventListener('languagechange',schedule);
window.NH7NotesCategoriesV452={VERSION:'4.5.2-r2',category,enhance};schedule();
})();
