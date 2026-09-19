/* Quick Bible: separate dialog; never navigates, pauses, replaces or recreates audio. */
(()=>{'use strict';if(window.NH7QuickBibleV454)return;
const KEY='nh7_quick_bible_place_v454';let modal=null,origin=null,books=[],chapterRows=[],requestId=0,scheduled=false;
const lang=()=>['fa','en','hr'].includes(localStorage.getItem('nh7_lang'))?localStorage.getItem('nh7_lang'):'en';
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>lang()==='fa'?String(v).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):String(v);
const normalize=v=>String(v).normalize('NFKD').replace(/\p{M}/gu,'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\s+/g,' ').trim().toLowerCase();
const query=s=>modal?.querySelector(s),title=()=>L('کتاب مقدس کنار پلیر','Bible beside the player','Biblija uz reprodukciju');
function place(){try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');return{bookId:books.some(b=>b.id===p.bookId)?p.bookId:'JHN',chapter:Number.isInteger(p.chapter)?p.chapter:3,verse:Number.isInteger(p.verse)?p.verse:16}}catch(_){return{bookId:'JHN',chapter:3,verse:16}}}
function close(){requestId++;if(modal){modal.close();modal.remove();modal=null}if(origin?.isConnected)try{origin.focus({preventScroll:true})}catch(_){}}
function status(text){const n=query('[data-quick-status454]');if(n)n.textContent=text}
function options(select,max,value){select.innerHTML=Array.from({length:max},(_,i)=>`<option value="${i+1}">${num(i+1)}</option>`).join('');select.value=String(Math.max(1,Math.min(max,value||1)))}
async function chapter(bookId,chapterNumber,verseNumber){
 const turn=++requestId;status(L('در حال بارگذاری آیات…','Loading verses…','Učitavanje stihova…'));
 const book=books.find(b=>b.id===bookId);if(!book)return;
 const chapterCount=book.chapters;chapterNumber=Math.min(chapterCount,Math.max(1,chapterNumber||1));
 options(query('[data-quick-chapter454]'),chapterCount,chapterNumber);
 try{
  const rows=await window.NH7QuickBibleSourceV454.chapter(bookId,chapterNumber,lang());
  if(!modal||turn!==requestId)return;chapterRows=rows;
  if(!rows.length)throw Error('empty');
  const select=query('[data-quick-verse454]');select.innerHTML=rows.map(r=>`<option value="${r.verse}">${num(r.verse)}</option>`).join('');select.value=String(rows.some(r=>r.verse===verseNumber)?verseNumber:rows[0].verse);
  show(false);status('');
 }catch(_){if(turn===requestId&&modal){status(L('آیات بارگذاری نشدند؛ پخش صوت تغییری نکرده است. دوباره تلاش کن.','Verses could not load; audio playback was not changed. Please retry.','Stihovi nisu učitani; reprodukcija nije promijenjena. Pokušajte ponovno.'));query('[data-quick-content454]').replaceChildren()}}
}
function show(all=false,endVerse=null){
 if(!modal||!chapterRows.length)return;
 const bookId=query('[data-quick-book454]').value,ch=+query('[data-quick-chapter454]').value,start=+query('[data-quick-verse454]').value;
 const rows=all?chapterRows:chapterRows.filter(r=>r.verse>=start&&r.verse<=(endVerse||start));
 const book=books.find(b=>b.id===bookId),heading=(book.names[lang()]||bookId)+' '+num(ch)+(all?'':':'+num(start)+(endVerse&&endVerse!==start?'–'+num(endVerse):''));
 query('[data-quick-content454]').innerHTML=`<h3>${E(heading)}</h3>${rows.map(r=>`<p data-quick-line454="${r.verse}" ${r.verse===start?'class="is-focus"':''}><sup>${num(r.verse)}</sup> <span>${E(r.text)}</span></p>`).join('')}`;
 query('[data-quick-content454]').dir=lang()==='fa'?'rtl':'ltr';query('[data-quick-content454]').scrollTop=0;
 query('[data-quick-copy454]').dataset.text=heading+'\n'+rows.map(r=>num(r.verse)+' '+r.text).join('\n');
 try{localStorage.setItem(KEY,JSON.stringify({bookId,chapter:ch,verse:start}))}catch(_){ }
}
async function findReference(){
 const text=normalize(query('[data-quick-reference454]').value),m=text.match(/^(.+?)\s+(\d+)\s*[:：]\s*(\d+)(?:\s*[-–]\s*(\d+))?$/);
 if(!m){status(L('نمونه: یوحنا ۳:۱۶ یا John 3:16','Example: John 3:16 or John 3:16-18','Primjer: Ivan 3:16 ili Ivan 3:16-18'));return}
 const book=books.find(b=>[b.id,...Object.values(b.names)].some(n=>normalize(n)===m[1]));
 const ch=+m[2],v=+m[3],end=+(m[4]||m[3]);
 if(!book||ch<1||ch>book.chapters||v<1||end<v){status(L('آدرس آیه معتبر نیست.','The verse reference is not valid.','Navod retka nije valjan.'));return}
 query('[data-quick-book454]').value=book.id;await chapter(book.id,ch,v);
 if(!modal)return;if(!chapterRows.some(r=>r.verse===v)||!chapterRows.some(r=>r.verse===end)){status(L('شمارهٔ آیه در این باب موجود نیست.','This chapter does not contain that verse number.','Ovo poglavlje ne sadrži taj broj retka.'));return}show(false,end);
}
async function open(button){
 if(modal){modal.focus();return}origin=button||document.activeElement;const locale=lang();
 modal=document.createElement('dialog');modal.id='nh7QuickBible454';modal.className='nh7-quick-bible454';modal.dir=locale==='fa'?'rtl':'ltr';modal.setAttribute('aria-labelledby','nh7QuickTitle454');
 modal.innerHTML=`<header><h2 id="nh7QuickTitle454">📖 ${E(title())}</h2><button type="button" class="secondary-btn" data-quick-close454 aria-label="${E(L('بازگشت به پلیر','Back to player','Povratak na reprodukciju'))}">×</button></header><p class="muted">${E(L('هم‌زمان با گوش‌دادن، آیه را پیدا کن؛ از صفحهٔ صوت خارج نمی‌شوی.','Find a verse while listening, without leaving the audio page.','Pronađite redak dok slušate, bez napuštanja audio stranice.'))}</p><form data-quick-form454><label>${E(L('آدرس آیه','Verse reference','Navod retka'))}<input data-quick-reference454 type="search" maxlength="100" placeholder="${E(L('یوحنا ۳:۱۶','John 3:16','Ivan 3:16'))}" autocomplete="off"></label><button type="submit" class="primary-btn">${E(L('یافتن','Find','Pronađi'))}</button></form><div class="nh7-quick-pickers454"><label>${E(L('کتاب','Book','Knjiga'))}<select data-quick-book454></select></label><label>${E(L('باب','Chapter','Poglavlje'))}<select data-quick-chapter454></select></label><label>${E(L('آیه','Verse','Redak'))}<select data-quick-verse454></select></label></div><p data-quick-status454 role="status" aria-live="polite"></p><section data-quick-content454 aria-live="polite"></section><footer><button type="button" class="secondary-btn" data-quick-prev454>‹ ${E(L('آیهٔ قبل','Previous verse','Prethodni redak'))}</button><button type="button" class="secondary-btn" data-quick-next454>${E(L('آیهٔ بعد','Next verse','Sljedeći redak'))} ›</button><button type="button" class="secondary-btn" data-quick-all454>${E(L('نمایش باب','Show chapter','Prikaži poglavlje'))}</button><button type="button" class="secondary-btn" data-quick-copy454>⧉ ${E(L('کپی','Copy','Kopiraj'))}</button><button type="button" class="primary-btn" data-quick-close454>${E(L('بازگشت به پلیر','Back to player','Povratak na reprodukciju'))}</button></footer>`;
 document.body.appendChild(modal);modal.showModal();
 modal.addEventListener('cancel',e=>{e.preventDefault();close()});
 modal.querySelectorAll('[data-quick-close454]').forEach(b=>b.onclick=close);
 query('[data-quick-form454]').onsubmit=e=>{e.preventDefault();findReference()};
 query('[data-quick-book454]').onchange=e=>chapter(e.target.value,1,1);
 query('[data-quick-chapter454]').onchange=e=>chapter(query('[data-quick-book454]').value,+e.target.value,1);
 query('[data-quick-verse454]').onchange=()=>show(false);
 query('[data-quick-all454]').onclick=()=>show(true);
 for(const [name,delta] of [['prev',-1],['next',1]])query('[data-quick-'+name+'454]').onclick=()=>{const s=query('[data-quick-verse454]');s.selectedIndex=Math.min(s.options.length-1,Math.max(0,s.selectedIndex+delta));show(false)};
 query('[data-quick-copy454]').onclick=async e=>{try{await window.NH7ReaderToolbarV452.copyText(e.currentTarget.dataset.text||'');status(L('کپی شد','Copied','Kopirano'))}catch(_){status(L('کپی انجام نشد.','Copy failed.','Kopiranje nije uspjelo.'))}};
 try{books=await window.NH7QuickBibleSourceV454.books();if(!modal||lang()!==locale)return;query('[data-quick-book454]').innerHTML=books.map(b=>`<option value="${b.id}">${E(b.names[locale]||b.id)}</option>`).join('');const saved=place();query('[data-quick-book454]').value=saved.bookId;await chapter(saved.bookId,saved.chapter,saved.verse)}catch(_){status(L('کتاب مقدس بارگذاری نشد؛ دوباره باز کن.','The Bible could not load. Close and retry.','Biblija nije učitana. Zatvorite i pokušajte ponovno.'))}
}
function enhance(){scheduled=false;
 document.querySelectorAll('[data-sermon-card]').forEach(card=>{
  let b=card.querySelector('[data-quick-bible454]');if(!b){const row=card.querySelector('.sermon-card-actions')||card.querySelector('[data-classic-player] .button-row')||card;b=document.createElement('button');b.type='button';b.dataset.quickBible454='1';b.className='secondary-btn compact-player-btn';row.append(b);b.onclick=e=>{e.preventDefault();e.stopPropagation();open(b)}}
  const text='📖 '+L('کتاب مقدس سریع','Quick Bible','Brza Biblija');if(b.textContent!==text)b.textContent=text;
 });
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(enhance)}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('change',event=>{if(['langSelect','settingsLang'].includes(event.target.id)){close();schedule()}},true);
window.NH7QuickBibleV454={open,close,enhance};schedule();
})();
