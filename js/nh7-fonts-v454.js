/* Fonts v454: one device-local script-aware controller; no theme or user-data migration. */
(()=>{'use strict';if(window.NH7FontsV454)return;
const KEY='nh7_reader_fonts_v454',OLD='nh7_ui_font_family_v425',root=document.documentElement;
const lang=()=>['fa','en','hr'].includes(localStorage.getItem('nh7_lang'))?localStorage.getItem('nh7_lang'):'en';
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const fonts={
 default:{stack:'',name:['پیش‌فرض برنامه','App default','Zadano aplikacije'],script:'both'},
 system:{stack:'system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif',name:['فونت دستگاه','Device font','Font uređaja'],script:'both'},
 readable:{stack:'"Trebuchet MS",Verdana,Tahoma,Arial,sans-serif',name:['خوانا (قبلی)','Readable (existing)','Čitljivo (postojeće)'],script:'both'},
 serif:{stack:'Georgia,"Times New Roman",serif',name:['کلاسیک (قبلی)','Classic (existing)','Klasično (postojeće)'],script:'both'},
 persian:{stack:'Tahoma,"Geeza Pro",Arial,sans-serif',name:['مناسب فارسی (قبلی)','Persian friendly (existing)','Perzijski (postojeće)'],script:'both'},
 vazirmatn:{stack:'"NH7 Vazirmatn",Tahoma,sans-serif',family:'NH7 Vazirmatn',name:['وزیرمتن — ساده و خوانا','Vazirmatn — Persian','Vazirmatn — perzijski'],script:'fa'},
 naskh:{stack:'"NH7 Noto Naskh",Tahoma,serif',family:'NH7 Noto Naskh',name:['نسخ — Noto Naskh','Noto Naskh — Persian','Noto Naskh — perzijski'],script:'fa'},
 estedad:{stack:'"NH7 Estedad",Tahoma,sans-serif',family:'NH7 Estedad',name:['استعداد — مدرن','Estedad — Persian','Estedad — perzijski'],script:'fa'},
 amiri:{stack:'"NH7 Amiri",Tahoma,serif',family:'NH7 Amiri',name:['امیری — نسخ کلاسیک','Amiri — Persian','Amiri — perzijski'],script:'fa'},
 markazi:{stack:'"NH7 Markazi",Tahoma,serif',family:'NH7 Markazi',name:['مرکزی — کتابی','Markazi Text — Persian','Markazi Text — perzijski'],script:'fa'},
 inter:{stack:'"NH7 Inter",Arial,sans-serif',family:'NH7 Inter',name:['اینتر — لاتین','Inter — modern','Inter — moderni'],script:'latin'},
 lora:{stack:'"NH7 Lora",Georgia,serif',family:'NH7 Lora',name:['لورا — لاتین کتابی','Lora — book serif','Lora — knjiški'],script:'latin'},
 nunito:{stack:'"NH7 Nunito",Arial,sans-serif',family:'NH7 Nunito',name:['نونیتو — لاتین','Nunito Sans — rounded','Nunito Sans — zaobljeni'],script:'latin'},
 classic:{stack:'Georgia,"Times New Roman",serif',name:['جورجیا — لاتین','Georgia / Classic','Georgia / klasični'],script:'latin'}
};
let pending=false,generation=0,last='',message='',failed=false;
const label=f=>L(...f.name),script=()=>lang()==='fa'?'fa':'latin';
function read(key){try{const x=JSON.parse(localStorage.getItem(key)||'null');return x&&typeof x==='object'&&!Array.isArray(x)?x:null}catch(_){return null}}
function choice(which=script()){
 const own=read(KEY);if(own&&Object.hasOwn(fonts,own[which]))return own[which];
 const theme=read('nh7_theme_studio_v453');if(theme&&Object.hasOwn(fonts,theme[which]))return theme[which];
 const old=localStorage.getItem(OLD)||'default';return Object.hasOwn(fonts,old)?old:'default';
}
function announce(text,error=false){message=text;failed=error;const el=document.getElementById('nh7FontStatus454');if(el){el.textContent=text;el.dataset.error=error?'1':'0'}}
function apply(){
 const id=choice(),f=fonts[id],signature=lang()+'|'+id;
 if(last===signature&&root.dataset.nh7Font454===id)return;last=signature;
 if(!f.stack){delete root.dataset.nh7Font454;root.style.removeProperty('--nh7-font454');root.style.removeProperty('--nh7-proof-font454')}
 else{root.dataset.nh7Font454=id;root.style.setProperty('--nh7-font454',f.stack);root.style.setProperty('--nh7-proof-font454',f.stack)}
 document.querySelectorAll('#nh7FontSelect').forEach(n=>{if([...n.options].some(o=>o.value===id))n.value=id});
 document.querySelectorAll('[data-studio-font453]').forEach(n=>{const v=choice(n.dataset.studioFont453);if([...n.options].some(o=>o.value===v))n.value=v});
}
async function choose(which,id){
 if(!['fa','latin'].includes(which)||!Object.hasOwn(fonts,id))return false;
 const request=++generation,f=fonts[id];announce(L('در حال بارگذاری فونت…','Loading font…','Učitavanje fonta…'));
 try{
  if(f.family){if(!document.fonts?.load)throw Error('Font loading unavailable');const sample=which==='fa'?'پژوهش کتاب مقدس — گچ‌پژ — ۱۲۳':'Čitati riječ: č ć ž š đ — 123';const faces=await document.fonts.load(`20px "${f.family}"`,sample);if(!faces.length||!faces.every(face=>face.status==='loaded'))throw Error('Font did not load')}
  if(request!==generation)return false;
  const current=read(KEY)||{},next={...current,[which]:id};localStorage.setItem(KEY,JSON.stringify(next));
  if(which===script())localStorage.setItem(OLD,id);
  const theme=read('nh7_theme_studio_v453');if(theme&&Object.hasOwn(theme,which)){theme[which]=id;localStorage.setItem('nh7_theme_studio_v453',JSON.stringify(theme))}
  last='';apply();announce(L('فونت اعمال و ذخیره شد: ','Font applied and saved: ','Font primijenjen i spremljen: ')+label(f));
  window.dispatchEvent(new CustomEvent('nh7:font454',{detail:{script:which,id}}));mount();return true;
 }catch(_){if(request===generation){announce(L('فونت بارگذاری نشد؛ انتخاب قبلی حفظ شد.','Font could not load; the previous choice was kept.','Font nije učitan; prethodni izbor je sačuvan.'),true);apply();mount()}return false}
}
function addOptions(select,which,legacy=false){
 if(!select)return;
 const signature=lang()+'|'+which+'|'+legacy;if(select.dataset.fontOptions454===signature)return;
 const keep=[...select.options].map(o=>o.value);
 for(const [id,f] of Object.entries(fonts)){
  if(!legacy&&f.script==='both'&&!['system','default'].includes(id))continue;
  if(f.script!=='both'&&f.script!==which)continue;
  let o=[...select.options].find(x=>x.value===id);if(!o){o=document.createElement('option');o.value=id;select.append(o)}o.textContent=label(f);
 }
 select.dataset.fontOptions454=signature;
}
function mount(){
 const panel=document.getElementById('nh7AppearancePanel');if(!panel)return;
 addOptions(document.getElementById('nh7FontSelect'),script(),true);
 document.querySelectorAll('[data-studio-font453]').forEach(n=>addOptions(n,n.dataset.studioFont453));
 let box=document.getElementById('nh7FontProof454');
 if(!box){box=document.createElement('div');box.id='nh7FontProof454';box.innerHTML='<p data-font-sample454></p><small data-font-help454></small><p id="nh7FontStatus454" role="status" aria-live="polite"></p>';panel.append(box)}
 const sample=L('فیض، ایمان و محبت؛ پژوهش در کتاب مقدس — ۱۲۳','Grace, faith and love; reading the Bible — 123','Milost, vjera i ljubav; čitajte Božju riječ — 123');
 if(box.querySelector('[data-font-sample454]').textContent!==sample)box.querySelector('[data-font-sample454]').textContent=sample;
 const help=L('تغییر فونت فوراً روی متن اعمال می‌شود؛ برای فونت نیازی به دکمهٔ «اعمال ظاهر» نیست. فونت فارسی و لاتین جدا ذخیره می‌شوند.','Font changes apply to text immediately; no Apply appearance button is needed for fonts. Persian and Latin choices are saved separately.','Promjena fonta odmah se primjenjuje na tekst; nije potreban gumb Primijeni izgled. Perzijski i latinični izbor spremaju se zasebno.');
 if(box.querySelector('[data-font-help454]').textContent!==help)box.querySelector('[data-font-help454]').textContent=help;
 const status=box.querySelector('#nh7FontStatus454');if(status.textContent!==message)status.textContent=message;status.dataset.error=failed?'1':'0';
 apply();
}
function reset(){generation++;localStorage.removeItem(KEY);last='';message='';apply();schedule()}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;apply();mount()})}
window.addEventListener('change',event=>{
 const target=event.target;
 if(target.id==='nh7FontSelect'){event.preventDefault();event.stopImmediatePropagation();choose(script(),target.value);return}
 if(target.matches?.('[data-studio-font453]')){const which=target.dataset.studioFont453,id=target.value;choose(which,id);return}
 if(['langSelect','settingsLang'].includes(target.id)){generation++;message='';last='';schedule()}
},true);
window.addEventListener('click',event=>{if(event.target.closest?.('#nh7AppearanceReset,[data-studio-reset453]')){reset();if(event.target.closest('#nh7AppearanceReset')){try{localStorage.removeItem('nh7_theme_studio_v453')}catch(_){}}}},true);
window.addEventListener('nh7:ui-preferences',schedule);window.addEventListener('storage',event=>{if([KEY,OLD,'nh7_lang','nh7_theme_studio_v453'].includes(event.key)){last='';schedule()}});
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.NH7FontsV454={KEY,fonts,choice,choose,apply,mount,reset};schedule();
})();
