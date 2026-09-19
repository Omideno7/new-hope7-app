/* New Hope 7 — Soul Winning Tracker v4.7.2
 * Local-first preview/runtime module. No Supabase or account writes in this phase.
 */
const STORAGE_KEY='nh7_soul_tracker_v472';
const VERSION=1;

const STAGES=[
  {id:'contact',fa:'آشنایی / شخص جدید',en:'New contact',hr:'Novi kontakt'},
  {id:'gospel',fa:'انجیل را شنیده',en:'Gospel shared',hr:'Naviješteno evanđelje'},
  {id:'followup',fa:'پیگیری / علاقه‌مند',en:'Follow-up / interested',hr:'Praćenje / zainteresiran'},
  {id:'salvation',fa:'دعای نجات کرده',en:'Prayed for salvation',hr:'Molitva spasenja'},
  {id:'church',fa:'به کلیسا متصل شده',en:'Connected to church',hr:'Povezan s crkvom'},
  {id:'discipleship',fa:'در شاگردسازی است',en:'In discipleship',hr:'U učeništvu'},
  {id:'serving',fa:'در خدمت / تکثیر',en:'Serving / multiplying',hr:'Služi / umnaža'}
];

const TXT={
  fa:{
    title:'نجات جان‌ها',subtitle:'ثبت و پیگیری بشارت تا شاگردسازی',add:'ثبت شخص جدید',search:'جستجوی نام یا یادداشت',
    all:'همه مراحل',total:'کل افراد',gospel:'انجیل را شنیده‌اند',salvation:'دعای نجات',church:'متصل به کلیسا',discipleship:'شاگردسازی',
    due:'پیگیری‌های رسیده',empty:'هنوز کسی ثبت نشده است.',emptyFilter:'موردی با این جستجو یا فیلتر پیدا نشد.',
    privacy:'برای حفظ حریم خصوصی بهتر است فقط نام کوچک یا نام مستعار و اطلاعات ضروری را ثبت کنید. در این نسخهٔ آزمایشی اطلاعات فقط در همین مرورگر/دستگاه ذخیره می‌شود و به Supabase فرستاده نمی‌شود.',
    name:'نام یا نام مستعار',met:'تاریخ آشنایی',stage:'مرحله فعلی',context:'کجا یا چگونه آشنا شدید؟',next:'پیگیری بعدی',
    notes:'یادداشت خصوصی',save:'ذخیره',cancel:'لغو',back:'بازگشت',edit:'ویرایش',delete:'حذف این شخص',deleteConfirm:'این شخص و تاریخچهٔ محلی او حذف شود؟',
    saved:'ذخیره شد',required:'نام را وارد کنید.',journey:'مسیر رشد',history:'تاریخچه پیگیری',followupNote:'یادداشت پیگیری جدید',
    addNote:'ثبت یادداشت پیگیری',noHistory:'هنوز تاریخچه‌ای ثبت نشده است.',created:'شخص ثبت شد',stageChanged:'مرحله تغییر کرد',
    noteAdded:'یادداشت پیگیری ثبت شد',updated:'اطلاعات به‌روزرسانی شد',today:'امروز',overdue:'عقب‌افتاده',upcoming:'آینده',
    lastUpdate:'آخرین تغییر',view:'باز کردن',people:'افراد',clearSearch:'پاک کردن',progress:'پیشرفت مسیر'
  },
  en:{
    title:'Soul Winning',subtitle:'Track evangelism from first contact to discipleship',add:'Add new person',search:'Search name or notes',
    all:'All stages',total:'People',gospel:'Gospel shared',salvation:'Salvation prayer',church:'Connected to church',discipleship:'Discipleship',
    due:'Follow-ups due',empty:'No one has been added yet.',emptyFilter:'No matching person found.',
    privacy:'For privacy, use a first name or nickname and record only what is necessary. In this preview, data stays only in this browser/device and is not sent to Supabase.',
    name:'Name or nickname',met:'Date first met',stage:'Current stage',context:'Where or how did you meet?',next:'Next follow-up',
    notes:'Private notes',save:'Save',cancel:'Cancel',back:'Back',edit:'Edit',delete:'Delete this person',deleteConfirm:'Delete this person and local history?',
    saved:'Saved',required:'Please enter a name.',journey:'Growth journey',history:'Follow-up history',followupNote:'New follow-up note',
    addNote:'Add follow-up note',noHistory:'No history yet.',created:'Person added',stageChanged:'Stage changed',
    noteAdded:'Follow-up note added',updated:'Information updated',today:'Today',overdue:'Overdue',upcoming:'Upcoming',
    lastUpdate:'Last update',view:'Open',people:'People',clearSearch:'Clear',progress:'Journey progress'
  },
  hr:{
    title:'Osvajanje duša',subtitle:'Praćenje evangelizacije od prvog kontakta do učeništva',add:'Dodaj novu osobu',search:'Pretraži ime ili bilješke',
    all:'Sve faze',total:'Osobe',gospel:'Naviješteno evanđelje',salvation:'Molitva spasenja',church:'Povezani s crkvom',discipleship:'Učeništvo',
    due:'Praćenja za danas',empty:'Još nitko nije dodan.',emptyFilter:'Nema rezultata za ovu pretragu ili filtar.',
    privacy:'Radi privatnosti koristite ime ili nadimak i zapisujte samo nužne podatke. U ovom pregledu podaci ostaju samo u ovom pregledniku/uređaju i ne šalju se u Supabase.',
    name:'Ime ili nadimak',met:'Datum upoznavanja',stage:'Trenutna faza',context:'Gdje ili kako ste se upoznali?',next:'Sljedeće praćenje',
    notes:'Privatne bilješke',save:'Spremi',cancel:'Odustani',back:'Natrag',edit:'Uredi',delete:'Izbriši ovu osobu',deleteConfirm:'Izbrisati ovu osobu i lokalnu povijest?',
    saved:'Spremljeno',required:'Unesite ime.',journey:'Put rasta',history:'Povijest praćenja',followupNote:'Nova bilješka praćenja',
    addNote:'Dodaj bilješku praćenja',noHistory:'Još nema povijesti.',created:'Osoba je dodana',stageChanged:'Faza je promijenjena',
    noteAdded:'Bilješka praćenja dodana',updated:'Podaci su ažurirani',today:'Danas',overdue:'Kasni',upcoming:'Nadolazeće',
    lastUpdate:'Zadnja promjena',view:'Otvori',people:'Osobe',clearSearch:'Očisti',progress:'Napredak puta'
  }
};

function safeLang(value){return ['fa','en','hr'].includes(value)?value:'en'}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function id(){return globalThis.crypto?.randomUUID?.()||('sw_'+Date.now()+'_'+Math.random().toString(36).slice(2))}
function isoDay(d=new Date()){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function now(){return new Date().toISOString()}
function stageIndex(stage){const i=STAGES.findIndex(s=>s.id===stage);return i<0?0:i}
function stageLabel(stage,lang){const s=STAGES.find(x=>x.id===stage)||STAGES[0];return s[lang]||s.en}
function normalizePerson(p={}){
  const created=String(p.createdAt||now());
  return {
    id:String(p.id||id()),
    name:String(p.name||'').trim().slice(0,90),
    metDate:/^\d{4}-\d{2}-\d{2}$/.test(String(p.metDate||''))?String(p.metDate):isoDay(),
    stage:STAGES.some(s=>s.id===p.stage)?p.stage:'contact',
    context:String(p.context||'').trim().slice(0,500),
    nextFollowUp:/^\d{4}-\d{2}-\d{2}$/.test(String(p.nextFollowUp||''))?String(p.nextFollowUp):'',
    notes:String(p.notes||'').trim().slice(0,3000),
    createdAt:created,
    updatedAt:String(p.updatedAt||created),
    history:Array.isArray(p.history)?p.history.slice(-100).map(h=>({
      id:String(h.id||id()),at:String(h.at||now()),type:String(h.type||'note'),
      stage:STAGES.some(s=>s.id===h.stage)?h.stage:null,
      from:STAGES.some(s=>s.id===h.from)?h.from:null,
      text:String(h.text||'').slice(0,1000)
    })):[]
  };
}
function normalizeStore(raw){
  const people=Array.isArray(raw?.people)?raw.people.map(normalizePerson).filter(p=>p.name):[];
  return {version:VERSION,people,updatedAt:String(raw?.updatedAt||now())};
}
function loadStore(){
  try{return normalizeStore(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'))}
  catch(_){return normalizeStore({})}
}
function saveStore(store){
  const clean=normalizeStore({...store,updatedAt:now()});
  localStorage.setItem(STORAGE_KEY,JSON.stringify(clean));
  return clean;
}
function stats(people){
  const countAt=id=>people.filter(p=>stageIndex(p.stage)>=stageIndex(id)).length;
  const today=isoDay();
  return {
    total:people.length,gospel:countAt('gospel'),salvation:countAt('salvation'),
    church:countAt('church'),discipleship:countAt('discipleship'),
    due:people.filter(p=>p.nextFollowUp&&p.nextFollowUp<=today).length
  };
}
function fmtDate(value,lang){
  if(!value)return '—';
  try{return new Intl.DateTimeFormat(lang==='fa'?'fa-IR':lang==='hr'?'hr-HR':'en-US',{year:'numeric',month:'short',day:'numeric'}).format(new Date(value+'T12:00:00'))}
  catch(_){return value}
}
function followUpState(value,t){
  if(!value)return '';
  const today=isoDay();
  if(value<today)return '<span class="nh7-sw-date-state overdue">'+esc(t.overdue)+'</span>';
  if(value===today)return '<span class="nh7-sw-date-state today">'+esc(t.today)+'</span>';
  return '<span class="nh7-sw-date-state upcoming">'+esc(t.upcoming)+'</span>';
}

export function createSoulWinningV472(options={}){
  const mount=()=>typeof options.mount==='function'?options.mount():document.getElementById('view');
  const lang=()=>safeLang(typeof options.lang==='function'?options.lang():localStorage.getItem('nh7_lang')||document.documentElement.lang||'en');
  const nav=(params={})=>{if(typeof options.navigate==='function')options.navigate('soulWinning',params,true);else render(params)};
  const tr=()=>TXT[lang()];
  const stageOptions=(selected='')=>STAGES.map(s=>'<option value="'+esc(s.id)+'" '+(selected===s.id?'selected':'')+'>'+esc(stageLabel(s.id,lang()))+'</option>').join('');

  function renderDashboard(){
    const root=mount(),t=tr(),store=loadStore(),people=store.people.slice().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))),s=stats(people);
    if(!root)return;
    root.innerHTML=`
      <section class="card nh7-sw-hero">
        <div class="nh7-sw-head"><div><span class="nh7-sw-eyebrow">🌾 SOUL TRACKER</span><h2>${esc(t.title)}</h2><p>${esc(t.subtitle)}</p></div><button class="primary-btn" data-sw-add>＋ ${esc(t.add)}</button></div>
        <div class="nh7-sw-stats">
          <div><strong>${s.total}</strong><span>${esc(t.total)}</span></div>
          <div><strong>${s.gospel}</strong><span>${esc(t.gospel)}</span></div>
          <div><strong>${s.salvation}</strong><span>${esc(t.salvation)}</span></div>
          <div><strong>${s.church}</strong><span>${esc(t.church)}</span></div>
          <div><strong>${s.discipleship}</strong><span>${esc(t.discipleship)}</span></div>
          <div><strong>${s.due}</strong><span>${esc(t.due)}</span></div>
        </div>
      </section>
      <section class="card">
        <div class="notice nh7-sw-privacy">🔒 ${esc(t.privacy)}</div>
        <div class="nh7-sw-toolbar">
          <input type="search" data-sw-search placeholder="${esc(t.search)}" autocomplete="off">
          <select data-sw-filter aria-label="${esc(t.stage)}"><option value="">${esc(t.all)}</option>${stageOptions()}</select>
        </div>
        <div class="nh7-sw-list" data-sw-list></div>
      </section>`;
    const list=root.querySelector('[data-sw-list]'),search=root.querySelector('[data-sw-search]'),filter=root.querySelector('[data-sw-filter]');
    const draw=()=>{
      const q=String(search?.value||'').trim().toLowerCase(),f=String(filter?.value||'');
      const rows=people.filter(p=>(!f||p.stage===f)&&(!q||[p.name,p.notes,p.context].some(x=>String(x||'').toLowerCase().includes(q))));
      list.innerHTML=rows.length?rows.map(p=>`
        <button class="nh7-sw-person" type="button" data-sw-person="${esc(p.id)}">
          <span class="nh7-sw-person-main"><strong>${esc(p.name)}</strong><small>${esc(stageLabel(p.stage,lang()))}</small></span>
          <span class="nh7-sw-person-meta">${p.nextFollowUp?'<small>'+esc(t.next)+': '+esc(fmtDate(p.nextFollowUp,lang()))+'</small>'+followUpState(p.nextFollowUp,t):'<small>'+esc(t.lastUpdate)+': '+esc(fmtDate(String(p.updatedAt).slice(0,10),lang()))+'</small>'}</span>
          <span class="nh7-sw-chevron">›</span>
        </button>`).join(''):'<p class="muted">'+esc((q||f)?t.emptyFilter:t.empty)+'</p>';
      list.querySelectorAll('[data-sw-person]').forEach(b=>b.addEventListener('click',()=>nav({person:b.dataset.swPerson})));
    };
    search?.addEventListener('input',draw);filter?.addEventListener('change',draw);root.querySelector('[data-sw-add]')?.addEventListener('click',()=>nav({new:true}));draw();
  }

  function renderForm(existing=null){
    const root=mount(),t=tr(),p=existing?normalizePerson(existing):normalizePerson({metDate:isoDay(),stage:'gospel'});
    if(!root)return;
    root.innerHTML=`
      <section class="card">
        <button class="secondary-btn nh7-sw-back" data-sw-back>‹ ${esc(t.back)}</button>
        <h2>${esc(existing?t.edit:t.add)}</h2>
        <div class="notice nh7-sw-privacy">🔒 ${esc(t.privacy)}</div>
        <form data-sw-form class="nh7-sw-form">
          <label>${esc(t.name)}<input name="name" maxlength="90" required value="${esc(p.name)}"></label>
          <div class="nh7-sw-two">
            <label>${esc(t.met)}<input name="metDate" type="date" value="${esc(p.metDate)}"></label>
            <label>${esc(t.stage)}<select name="stage">${stageOptions(p.stage)}</select></label>
          </div>
          <label>${esc(t.context)}<input name="context" maxlength="500" value="${esc(p.context)}"></label>
          <label>${esc(t.next)}<input name="nextFollowUp" type="date" value="${esc(p.nextFollowUp)}"></label>
          <label>${esc(t.notes)}<textarea name="notes" maxlength="3000" rows="5">${esc(p.notes)}</textarea></label>
          <div class="button-row"><button class="primary-btn" type="submit">${esc(t.save)}</button><button class="secondary-btn" type="button" data-sw-back>${esc(t.cancel)}</button></div>
        </form>
      </section>`;
    root.querySelectorAll('[data-sw-back]').forEach(b=>b.addEventListener('click',()=>existing?nav({person:p.id}):nav({})));
    root.querySelector('[data-sw-form]')?.addEventListener('submit',e=>{
      e.preventDefault();
      const fd=new FormData(e.currentTarget),name=String(fd.get('name')||'').trim();
      if(!name){alert(t.required);return}
      let store=loadStore(),old=existing?store.people.find(x=>x.id===p.id):null;
      const stage=String(fd.get('stage')||'contact');
      const next=normalizePerson({
        ...(old||p),name,metDate:fd.get('metDate'),stage,context:fd.get('context'),nextFollowUp:fd.get('nextFollowUp'),notes:fd.get('notes'),updatedAt:now()
      });
      const history=Array.isArray(old?.history)?old.history.slice():[];
      if(!old)history.push({id:id(),at:now(),type:'created',stage,text:t.created});
      else if(old.stage!==stage)history.push({id:id(),at:now(),type:'stage',from:old.stage,stage,text:t.stageChanged});
      else history.push({id:id(),at:now(),type:'updated',stage,text:t.updated});
      next.history=history.slice(-100);
      if(old)store.people=store.people.map(x=>x.id===next.id?next:x);else store.people.push(next);
      saveStore(store);nav({person:next.id});
    });
  }

  function renderDetail(personId){
    const root=mount(),t=tr(),store=loadStore(),p=store.people.find(x=>x.id===personId);
    if(!p){renderDashboard();return}
    const idx=stageIndex(p.stage),history=p.history.slice().reverse();
    if(!root)return;
    root.innerHTML=`
      <section class="card">
        <div class="nh7-sw-detail-head"><button class="secondary-btn" data-sw-back>‹ ${esc(t.back)}</button><button class="secondary-btn" data-sw-edit>✎ ${esc(t.edit)}</button></div>
        <div class="nh7-sw-title-row"><div><span class="nh7-sw-stage-chip">${esc(stageLabel(p.stage,lang()))}</span><h2>${esc(p.name)}</h2></div>${p.nextFollowUp?'<div class="nh7-sw-next"><small>'+esc(t.next)+'</small><strong>'+esc(fmtDate(p.nextFollowUp,lang()))+'</strong>'+followUpState(p.nextFollowUp,t)+'</div>':''}</div>
        <h3>${esc(t.journey)}</h3>
        <div class="nh7-sw-journey" aria-label="${esc(t.progress)}">${STAGES.map((s,i)=>'<div class="'+(i<idx?'done':i===idx?'current':'')+'"><i>'+(i<idx?'✓':i+1)+'</i><span>'+esc(stageLabel(s.id,lang()))+'</span></div>').join('')}</div>
        <div class="nh7-sw-detail-grid">
          <div><small>${esc(t.met)}</small><strong>${esc(fmtDate(p.metDate,lang()))}</strong></div>
          <div><small>${esc(t.context)}</small><strong>${esc(p.context||'—')}</strong></div>
        </div>
        ${p.notes?'<div class="nh7-sw-notes"><small>'+esc(t.notes)+'</small><p>'+esc(p.notes)+'</p></div>':''}
      </section>
      <section class="card">
        <h3>${esc(t.followupNote)}</h3>
        <textarea data-sw-followup rows="4" maxlength="1000" placeholder="${esc(t.followupNote)}"></textarea>
        <button class="primary-btn" data-sw-add-note>${esc(t.addNote)}</button>
      </section>
      <section class="card">
        <h3>${esc(t.history)}</h3>
        <div class="nh7-sw-history">${history.length?history.map(h=>'<article><i></i><div><strong>'+esc(h.type==='stage'?(stageLabel(h.from,lang())+' → '+stageLabel(h.stage,lang())):h.type==='created'?t.created:h.type==='updated'?t.updated:t.noteAdded)+'</strong><small>'+esc(new Intl.DateTimeFormat(lang()==='fa'?'fa-IR':lang()==='hr'?'hr-HR':'en-US',{dateStyle:'medium',timeStyle:'short'}).format(new Date(h.at)))+'</small>'+(h.text?'<p>'+esc(h.text)+'</p>':'')+'</div></article>').join(''):'<p class="muted">'+esc(t.noHistory)+'</p>'}</div>
        <button class="danger-btn nh7-sw-delete" data-sw-delete>${esc(t.delete)}</button>
      </section>`;
    root.querySelector('[data-sw-back]')?.addEventListener('click',()=>nav({}));
    root.querySelector('[data-sw-edit]')?.addEventListener('click',()=>renderForm(p));
    root.querySelector('[data-sw-add-note]')?.addEventListener('click',()=>{
      const field=root.querySelector('[data-sw-followup]'),value=String(field?.value||'').trim();if(!value)return;
      const fresh=loadStore(),target=fresh.people.find(x=>x.id===p.id);if(!target)return;
      target.history=[...(target.history||[]),{id:id(),at:now(),type:'note',stage:target.stage,text:value}].slice(-100);target.updatedAt=now();
      saveStore(fresh);nav({person:p.id});
    });
    root.querySelector('[data-sw-delete]')?.addEventListener('click',()=>{
      if(!confirm(t.deleteConfirm))return;
      const fresh=loadStore();fresh.people=fresh.people.filter(x=>x.id!==p.id);saveStore(fresh);nav({});
    });
  }

  function render(params={}){
    if(params?.new){renderForm(null);return}
    if(params?.person){renderDetail(String(params.person));return}
    renderDashboard();
  }

  return {render,load:loadStore,save:saveStore,stages:STAGES};
}

if(typeof window!=='undefined')window.NH7SoulWinningV472={createSoulWinningV472,STORAGE_KEY,STAGES};

export {STORAGE_KEY,STAGES,normalizeStore,stats};
