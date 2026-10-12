/* New Hope 7 v5.6.2 — exact-result Home search.
 * Read-only search layer. Shows actual Bible verses, audio messages and local notes,
 * then opens the exact verse/message/note destination in one tap.
 */
(()=>{'use strict';
if(window.__NH7_GLOBAL_SEARCH_DIRECT_V562__)return;window.__NH7_GLOBAL_SEARCH_DIRECT_V562__=true;

const VERSION='5.6.2';
let corpusPromise=null,searchSerial=0,debounce=0,observerQueued=false;
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[ۀة]/g,'ه').replace(/\u200c/g,' ').replace(/\s+/g,' ').trim();
const clip=(value,max=150)=>{const s=String(value??'').replace(/\s+/g,' ').trim();return s.length>max?s.slice(0,max-1)+'…':s};

function ensureStyle(){
  if(document.getElementById('nh7GlobalSearch562Style'))return;
  const style=document.createElement('style');
  style.id='nh7GlobalSearch562Style';
  style.textContent=`
    #nh7GlobalSearch560 .nh7-global-search560-results{max-height:min(62vh,620px);overflow:auto;padding-inline-end:2px}
    #nh7GlobalSearch560 .nh7-global-search560-row{align-items:flex-start}
    #nh7GlobalSearch560 .nh7-global-search560-copy strong{white-space:normal;line-height:1.45;font-size:.84rem}
    #nh7GlobalSearch560 .nh7-global-search560-copy small{white-space:normal;line-height:1.55;font-size:.72rem;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    #nh7GlobalSearch560 .nh7-global-search560-kind{padding-top:3px}
    #nh7GlobalSearch560 .nh7-global-search562-status{padding:8px 4px;font-size:.72rem;opacity:.68}
  `;
  document.head.appendChild(style);
}

function audioCatalog(){
  for(const [store,key] of [[sessionStorage,'nh7_audio_catalog_cache_v446'],[localStorage,'nh7_audio_catalog_cache_v470']]){
    try{const d=JSON.parse(store.getItem(key)||'null');if(d?.sermons?.length)return d}catch(_){}
  }
  return {categories:[],sermons:[]};
}
function audioMatches(q){
  const needle=normalize(q),d=audioCatalog(),categories=d.categories||[],sermons=d.sermons||[];
  return sermons.map(item=>{
    const fields=[item.title_fa,item.title_en,item.title_hr,item.title,item.description_fa,item.description_en,item.description_hr].filter(Boolean);
    if(!fields.some(x=>normalize(x).includes(needle)))return null;
    const title=item['title_'+lang()]||item.title_fa||item.title_en||item.title_hr||item.title||L('پیام صوتی','Audio message','Audio poruka');
    const desc=item['description_'+lang()]||item.description_fa||item.description_en||item.description_hr||'';
    const category=categories.find(c=>String(c.id)===String(item.category_id));
    const categoryName=category?.['name_'+lang()]||category?.name_fa||category?.name_en||category?.name_hr||'';
    return {icon:'🎧',kind:L('پیام صوتی','Audio','Audio'),title,sub:clip(desc||categoryName||L('برای پخش مستقیم لمس کنید','Tap to play directly','Dodirnite za izravnu reprodukciju')),route:'audio',params:{open:String(item.id||''),q:String(q)}};
  }).filter(Boolean).slice(0,6);
}
function noteText(raw){
  if(typeof raw!=='string')return'';
  try{const x=JSON.parse(raw);if(x&&typeof x==='object')return String(x.note??x.text??x.value??'')}catch(_){}
  return raw;
}
function noteDestination(key){
  if(key.startsWith('nh7_sermon_note_'))return {route:'audio',params:{open:key.replace(/^nh7_sermon_note_/,'')}};
  if(key.startsWith('nh7_bible_state_')){
    const id=key.replace(/^nh7_bible_state_/,'');
    const m=id.match(/^([A-Z0-9]+)_(\d+)_(\d+)$/i);
    if(m)return {route:'bible',params:{section:'written',mode:'chapter',bookId:m[1].toUpperCase(),chapter:Number(m[2]),verse:Number(m[3])}};
  }
  if(key.startsWith('nh7_note_school-'))return {route:'school',params:{lesson:key.replace(/^nh7_note_school-/,'')}};
  if(key.startsWith('nh7_gratitude_note_')){
    const day=Number(key.replace(/^nh7_gratitude_note_/,''));
    return {route:'daily',params:{tab:'gratitude',...(day?{gday:day}:{})}};
  }
  return {route:'home',params:{}};
}
function localNotes(q){
  const out=[],needle=normalize(q);
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i)||'';
    if(!/^(nh7_bible_state_|nh7_sermon_note_|nh7_apo_note_v242:|nh7_gratitude_note_|nh7_note_)/.test(key))continue;
    let text='';try{text=noteText(localStorage.getItem(key))}catch(_){}
    if(!text||!normalize(text).includes(needle))continue;
    const dest=noteDestination(key);
    let icon='📝',kind=L('یادداشت','Note','Bilješka');
    if(key.startsWith('nh7_bible_state_')){icon='📖';kind=L('یادداشت آیه','Bible note','Bilješka stiha')}
    else if(key.startsWith('nh7_sermon_note_')){icon='🎧';kind=L('یادداشت پیام','Audio note','Bilješka poruke')}
    else if(key.startsWith('nh7_note_school-')){icon='🎓';kind=L('یادداشت مدرسه','School note','Školska bilješka')}
    else if(key.startsWith('nh7_gratitude_note_')){icon='🙏';kind=L('یادداشت شکرگزاری','Gratitude note','Bilješka zahvalnosti')}
    out.push({icon,kind,title:clip(text,82),sub:L('باز کردن همان محل یادداشت','Open the exact note location','Otvori točno mjesto bilješke'),...dest});
    if(out.length>=5)break;
  }
  return out;
}
function savedReferenceMatches(q){
  let refs=[];try{refs=JSON.parse(localStorage.getItem('nh7_bookmarks')||'[]')}catch(_){}
  const needle=normalize(q);
  return (Array.isArray(refs)?refs:[]).filter(ref=>normalize(ref).includes(needle)).slice(0,4).map(ref=>({icon:'★',kind:L('آیه ذخیره‌شده','Saved verse','Spremljeni stih'),title:String(ref),sub:L('باز کردن مستقیم همان آیه','Open this exact verse','Otvori točno ovaj stih'),savedRef:String(ref)}));
}
async function bibleCorpus(){
  if(!corpusPromise)corpusPromise=Promise.all(['01_18','19_39','40_66'].map(async group=>{
    const r=await fetch(`data/bible/groups/bible_group_${group}.json`,{cache:'force-cache'});
    if(!r.ok)throw new Error('Bible group '+group);
    const d=await r.json();return Array.isArray(d?.verses)?d.verses:[];
  })).then(parts=>parts.flat()).catch(error=>{corpusPromise=null;throw error});
  return corpusPromise;
}
function bibleRef(v){
  const raw=v?.reference;
  if(raw&&typeof raw==='object')return raw[lang()]||raw.en||raw.fa||raw.hr||'';
  return String(raw||`${v.bookId||''} ${v.chapter||''}:${v.verse||''}`);
}
function bibleText(v){
  let text=String(v?.text?.[lang()]||v?.text?.en||v?.text?.fa||v?.text?.hr||'');
  if(lang()==='en')text=text.replace(new RegExp('^\\s*'+Number(v?.verse||0)+'\\.\\s+'),'');
  return text;
}
async function bibleMatches(q,serial){
  const needle=normalize(q),verses=await bibleCorpus(),out=[];
  for(let i=0;i<verses.length;i++){
    if(serial!==searchSerial)return[];
    const v=verses[i],text=bibleText(v);
    if(text&&normalize(text).includes(needle)){
      out.push({icon:'📖',kind:L('آیه کتاب مقدس','Bible verse','Biblijski stih'),title:bibleRef(v),sub:clip(text,180),route:'bible',params:{section:'written',mode:'chapter',bookId:String(v.bookId||''),chapter:Number(v.chapter||1),verse:Number(v.verse||1)}});
      if(out.length>=8)break;
    }
    if(i&&i%1200===0)await new Promise(resolve=>setTimeout(resolve,0));
  }
  return out;
}
function rowHtml(item,index){return `<button type="button" class="nh7-global-search560-row" data-nh7gs562-index="${index}"><span class="nh7-global-search560-icon">${esc(item.icon)}</span><span class="nh7-global-search560-copy"><strong>${esc(item.title)}</strong><small>${esc(item.sub||'')}</small></span><span class="nh7-global-search560-kind">${esc(item.kind||'')}</span></button>`}
function paint(root,items,status=''){
  const results=root?.querySelector('[data-nh7gs-results]');if(!results)return;
  root.__nh7Items562=items;
  results.innerHTML=(status?`<div class="nh7-global-search562-status">${esc(status)}</div>`:'')+(items.length?items.map(rowHtml).join(''):`<div class="nh7-global-search560-empty">${esc(L('نتیجه‌ای پیدا نشد.','No results found.','Nema rezultata.'))}</div>`);
  results.hidden=false;
}
async function runSearch(root,value){
  const q=String(value||'').trim(),serial=++searchSerial;
  const results=root?.querySelector('[data-nh7gs-results]');if(!results)return;
  if(q.length<2){root.__nh7Items562=[];results.hidden=true;results.innerHTML='';return}
  const quick=[...audioMatches(q),...savedReferenceMatches(q),...localNotes(q)];
  paint(root,quick,L('در حال جستجو در متن کتاب مقدس…','Searching Bible text…','Pretraživanje teksta Biblije…'));
  try{
    const bible=await bibleMatches(q,serial);if(serial!==searchSerial)return;
    const items=[...bible,...audioMatches(q),...savedReferenceMatches(q),...localNotes(q)].slice(0,18);
    paint(root,items,'');
  }catch(error){
    console.warn('Global Bible search',error);if(serial!==searchSerial)return;paint(root,quick,'');
  }
}
async function openItem(item){
  if(!item)return;
  if(item.savedRef&&window.NH7ReaderSourceV452?.resolve){
    try{const r=await window.NH7ReaderSourceV452.resolve(item.savedRef,lang());if(r){window.NH7_NAVIGATE?.('bible',{section:'written',mode:'chapter',bookId:r.bookId,chapter:r.chapter,verse:r.verse});return}}catch(_){}
  }
  if(typeof window.NH7_NAVIGATE==='function'){window.NH7_NAVIGATE(item.route,item.params||{});return}
  const params=item.params&&Object.keys(item.params).length?':'+encodeURIComponent(JSON.stringify(item.params)):'';
  location.hash='#'+encodeURIComponent(item.route||'home')+params;
}
function wire(root){
  if(!root||root.dataset.nh7Direct562==='1')return false;
  root.dataset.nh7Direct562='1';ensureStyle();
  root.addEventListener('input',event=>{
    const input=event.target.closest?.('[data-nh7gs-input]');if(!input)return;
    event.stopImmediatePropagation();clearTimeout(debounce);debounce=setTimeout(()=>runSearch(root,input.value),220);
  },true);
  root.addEventListener('keydown',event=>{
    const input=event.target.closest?.('[data-nh7gs-input]');if(!input||event.key!=='Enter')return;
    event.preventDefault();event.stopImmediatePropagation();clearTimeout(debounce);runSearch(root,input.value);
  },true);
  root.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-nh7gs562-index]');if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();openItem(root.__nh7Items562?.[Number(button.dataset.nh7gs562Index)]);
  },true);
  return true;
}
function mount(){ensureStyle();return wire(document.getElementById('nh7GlobalSearch560'))}
function schedule(){if(observerQueued)return;observerQueued=true;requestAnimationFrame(()=>{observerQueued=false;mount()})}
function start(){
  ensureStyle();mount();const view=document.getElementById('view');if(view)new MutationObserver(schedule).observe(view,{subtree:true,childList:true});
  document.getElementById('langSelect')?.addEventListener('change',()=>setTimeout(schedule,0));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.NH7GlobalSearchDirectV562={VERSION,mount,search:q=>{const root=document.getElementById('nh7GlobalSearch560');if(root)runSearch(root,q)}};
})();
