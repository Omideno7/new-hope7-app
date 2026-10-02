/* New Hope 7 Admin v5.3.3 — sermon editor search, robust edit, current-media preview, save confirmation. */
(()=>{'use strict';
if(window.__NH7_ADMIN_SERMON_EDITOR_V533__)return;
window.__NH7_ADMIN_SERMON_EDITOR_V533__=true;
const VERSION='5.3.3-admin-sermon-editor';
let searchValue='';
let decorateTimer=0;
let lastToast='';

const L=(fa,en,hr)=>{
  const v=String(typeof lang!=='undefined'?lang:'fa').toLowerCase();
  return v==='fa'?fa:v==='hr'?hr:en;
};
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=v=>String(v||'')
  .normalize('NFKC').toLowerCase()
  .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,'')
  .replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[أإٱآ]/g,'ا').replace(/ۀ/g,'ه')
  .replace(/\u200c/g,' ').replace(/[’'`]/g,'')
  .replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();

function rowById(id){
  return (Array.isArray(state?.sermons)?state.sermons:[]).find(x=>String(x?.id||'')===String(id||''))||null;
}
function currentRow(){return editingSermonId?rowById(editingSermonId):null}

function toast(text,tone='ok'){
  const msg=String(text||'').trim();if(!msg||msg===lastToast)return;lastToast=msg;
  let el=document.getElementById('nh7AdminSermonToastV533');
  if(!el){
    el=document.createElement('div');
    el.id='nh7AdminSermonToastV533';
    el.className='nh7-sermon-toast-v533';
    document.body.appendChild(el);
  }
  el.textContent=msg;
  el.className='nh7-sermon-toast-v533 is-'+tone+' is-show';
  clearTimeout(el.__timer);
  el.__timer=setTimeout(()=>el.classList.remove('is-show'),2600);
}

function editSermonV533(id){
  const x=rowById(id);
  if(!x){toast(L('موعظه پیدا نشد.','Sermon not found.','Propovijed nije pronađena.'),'error');return}
  editingSermonId=String(x.id);
  sermonDraft={
    title_fa:x.title_fa||'',
    title_en:x.title_en||'',
    title_hr:x.title_hr||'',
    description_fa:x.description_fa||'',
    description_en:x.description_en||'',
    description_hr:x.description_hr||'',
    category_id:x.category_id||'',
    youtube_url:x.youtube_url||'',
    duration_minutes:x.duration_minutes||'',
    duration_seconds:x.duration_seconds||Math.round(Number(x.duration_minutes||0)*60)||'',
    sort_order:x.sort_order||100,
    is_published:x.is_published!==false
  };
  sermonAudioFile=null;
  sermonCoverFile=null;
  try{render()}catch(error){console.error('Sermon edit render failed',error);toast(error?.message||String(error),'error');return}
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    decorate();
    document.getElementById('sermonEditor')?.scrollIntoView({behavior:'smooth',block:'start'});
  }));
}

function mediaSummaryHtml(row){
  if(!row)return '';
  const cover=String(row.cover_url||'').trim();
  const audio=String(row.audio_url||'').trim();
  const hasAny=cover||audio;
  if(!hasAny)return '<div class="nh7-sermon-current-v533"><strong>'+E(L('فایل‌های فعلی','Current files','Trenutne datoteke'))+'</strong><p>'+E(L('برای این موعظه هنوز کاور یا فایل صوتی فعالی ثبت نشده است.','No active cover or audio file is currently recorded for this sermon.','Za ovu propovijed još nema aktivne naslovnice ili audio datoteke.'))+'</p></div>';
  return '<div class="nh7-sermon-current-v533"><div><strong>'+E(L('فایل‌های فعلی موعظه','Current sermon files','Trenutne datoteke propovijedi'))+'</strong><p>'+E(L('فیلد انتخاب فایل عمداً خالی است. اگر فایل جدید انتخاب نکنی، فایل فعلی حفظ می‌شود.','The file picker is intentionally empty. If you do not choose a new file, the current file is preserved.','Odabir datoteke namjerno je prazan. Ako ne odaberete novu datoteku, postojeća se čuva.'))+'</p></div>'+
    (cover?'<div class="nh7-sermon-current-cover-v533"><img src="'+E(cover)+'" alt=""><div><b>'+E(L('کاور فعلی','Current cover','Trenutna naslovnica'))+'</b><a href="'+E(cover)+'" target="_blank" rel="noopener">'+E(L('باز کردن تصویر','Open image','Otvori sliku'))+'</a></div></div>':'')+
    (audio?'<div class="nh7-sermon-current-audio-v533"><b>🎧 '+E(L('فایل صوتی فعلی','Current audio','Trenutni audio'))+'</b><a href="'+E(audio)+'" target="_blank" rel="noopener">'+E(L('باز کردن / تست فایل','Open / test file','Otvori / testiraj datoteku'))+'</a></div>':'')+
  '</div>';
}

function decorateEditor(){
  const editor=document.getElementById('sermonEditor');if(!editor)return;
  const row=currentRow();
  let current=editor.querySelector('[data-nh7-sermon-current-v533]');
  if(row){
    if(!current){
      current=document.createElement('div');
      current.dataset.nh7SermonCurrentV533='1';
      const actions=[...editor.querySelectorAll('.actions')].find(x=>x.querySelector('button[onclick*="saveSermon"]'));
      (actions||editor).insertAdjacentElement(actions?'beforebegin':'beforeend',current);
    }
    current.innerHTML=mediaSummaryHtml(row);
  }else if(current){current.remove()}

  let badge=editor.querySelector('[data-nh7-sermon-editing-v533]');
  if(row){
    if(!badge){
      badge=document.createElement('div');
      badge.dataset.nh7SermonEditingV533='1';
      badge.className='nh7-sermon-editing-v533';
      editor.querySelector('h3')?.insertAdjacentElement('afterend',badge);
    }
    badge.textContent=L('در حال ویرایش: ','Editing: ','Uređivanje: ')+(row.title_fa||row.title_en||row.title_hr||'');
  }else if(badge){badge.remove()}

  const save=[...editor.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('saveSermon'));
  if(save){
    save.type='button';
    save.dataset.nh7SermonSaveV533='1';
    save.textContent='💾 '+L('ذخیره تغییرات','Save changes','Spremi promjene');
  }

  const cover=document.getElementById('sv_cover');
  if(cover&&cover.dataset.nh7PreviewBoundV533!=='1'){
    cover.dataset.nh7PreviewBoundV533='1';
    cover.addEventListener('change',()=>{
      const file=cover.files?.[0];if(!file)return;
      toast(L('تصویر انتخاب شد؛ برای ثبت نهایی «ذخیره تغییرات» را بزن.','Cover selected; press “Save changes” to store it.','Naslovnica je odabrana; pritisnite “Spremi promjene”.'),'ready');
    });
  }

  const status=editor.querySelector('#nh7SermonUploadStatusV497');
  if(status?.classList.contains('is-ok')&&status.textContent.trim()){
    if(status.dataset.nh7ToastV533!==status.textContent){
      status.dataset.nh7ToastV533=status.textContent;
      toast(L('✅ ذخیره شد','✅ Saved','✅ Spremljeno'),'ok');
    }
  }
}

function sermonListSection(){
  const sections=[...document.querySelectorAll('.panel-card')];
  return sections.find(sec=>sec.querySelector('button[onclick*="editSermon"]'))||null;
}

function applySearch(){
  const section=sermonListSection();if(!section)return;
  const q=N(searchValue);
  const tokens=q.split(' ').filter(Boolean);
  const cards=[...section.querySelectorAll('.request-card')].filter(card=>card.querySelector('button[onclick*="editSermon"]'));
  let shown=0;
  cards.forEach(card=>{
    const btn=card.querySelector('button[onclick*="editSermon"]');
    const id=btn?.dataset?.id||'';
    const row=rowById(id);
    const hay=N([row?.title_fa,row?.title_en,row?.title_hr].filter(Boolean).join(' '));
    const match=!q||tokens.every(t=>hay.includes(t));
    card.hidden=!match;
    if(!match)card.style.setProperty('display','none','important');
    else{card.style.removeProperty('display');shown++}
  });
  const count=section.querySelector('[data-nh7-sermon-search-count-v533]');
  if(count){
    count.textContent=q
      ?(shown?L(shown+' نتیجه',shown+' result'+(shown===1?'':'s'),shown+' rezultata'):L('نتیجه‌ای پیدا نشد','No matching sermons','Nema odgovarajućih propovijedi'))
      :L('کل موعظه‌ها: ','Total sermons: ','Ukupno propovijedi: ')+cards.length;
  }
}

function decorateSearch(){
  const section=sermonListSection();if(!section)return;
  let bar=section.querySelector('[data-nh7-sermon-search-v533]');
  if(!bar){
    bar=document.createElement('div');
    bar.dataset.nh7SermonSearchV533='1';
    bar.className='nh7-sermon-search-v533';
    bar.innerHTML='<input type="search" inputmode="search" autocomplete="off" data-nh7-sermon-search-input-v533 placeholder="'+E(L('جستجوی نام موعظه…','Search sermon title…','Pretraži naslov propovijedi…'))+'"><span data-nh7-sermon-search-count-v533></span>';
    const h3=section.querySelector('h3');
    h3?.insertAdjacentElement('afterend',bar);
    const input=bar.querySelector('input');
    input.value=searchValue;
    input.addEventListener('input',()=>{
      searchValue=input.value||'';
      applySearch();
    });
  }
  applySearch();
}

function decorate(){
  decorateEditor();
  decorateSearch();
}

try{
  window.editSermon=editSermonV533;
  editSermon=editSermonV533;
}catch(_){}

const style=document.createElement('style');
style.textContent=`
.nh7-sermon-search-v533{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;margin:10px 0 14px;padding:10px;border:1px solid #cfe4e2;border-radius:16px;background:#f8fcfc}
.nh7-sermon-search-v533 input{margin:0!important}
.nh7-sermon-search-v533 span{font-size:.82rem;color:#667085;white-space:nowrap}
.nh7-sermon-editing-v533{margin:8px 0 12px;padding:9px 11px;border-radius:12px;background:#eff8ff;color:#175cd3;font-weight:800}
.nh7-sermon-current-v533{display:grid;gap:10px;margin:12px 0;padding:12px;border:1px solid #d8ecea;border-radius:16px;background:#f8fcfc}
.nh7-sermon-current-v533 p{margin:3px 0 0;color:#667085;font-size:.82rem;line-height:1.65}
.nh7-sermon-current-cover-v533{display:grid;grid-template-columns:76px 1fr;gap:10px;align-items:center}
.nh7-sermon-current-cover-v533 img{width:76px;height:76px;object-fit:cover;border-radius:12px;border:1px solid #d8ecea;background:#fff}
.nh7-sermon-current-cover-v533 a,.nh7-sermon-current-audio-v533 a{display:inline-block;margin-top:4px;color:#0b5faa;font-weight:700;text-decoration:none}
.nh7-sermon-current-audio-v533{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.nh7-sermon-toast-v533{position:fixed;z-index:99999;left:50%;bottom:24px;transform:translate(-50%,24px);opacity:0;pointer-events:none;transition:.2s ease;padding:11px 16px;border-radius:999px;background:#102033;color:#fff;font-weight:800;box-shadow:0 12px 36px #0003;max-width:min(92vw,520px);text-align:center}
.nh7-sermon-toast-v533.is-show{opacity:1;transform:translate(-50%,0)}
.nh7-sermon-toast-v533.is-ok{background:#08783d}.nh7-sermon-toast-v533.is-error{background:#b42318}.nh7-sermon-toast-v533.is-ready{background:#175cd3}
@media(max-width:620px){.nh7-sermon-search-v533{grid-template-columns:1fr}.nh7-sermon-search-v533 span{white-space:normal}.nh7-sermon-current-cover-v533{grid-template-columns:64px 1fr}.nh7-sermon-current-cover-v533 img{width:64px;height:64px}}
`;
document.head.appendChild(style);

const observer=new MutationObserver(()=>{clearTimeout(decorateTimer);decorateTimer=setTimeout(decorate,60)});
observer.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else setTimeout(decorate,0);
window.NH7_ADMIN_SERMON_EDITOR_VERSION=VERSION;
})();