/* New Hope 7 Theme Studio 4.5.3. Appearance-only storage, no account writes. */
(()=>{'use strict';
if(window.NH7ThemeStudioV453)return;
const KEY='nh7_theme_studio_v453',SAVED='nh7_theme_library_v453',root=document.documentElement;
const lang=()=>['fa','en','hr'].includes(localStorage.getItem('nh7_lang'))?localStorage.getItem('nh7_lang'):'en';
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LABELS={hope:['امید نو','New Hope','Nova nada'],ocean:['اقیانوس','Ocean','Ocean'],forest:['جنگل','Forest','Šuma'],royal:['بنفش سلطنتی','Royal purple','Kraljevska ljubičasta'],sand:['شن گرم','Warm sand','Topli pijesak'],rose:['گل رز','Rose','Ruža'],midnight:['نیمه‌شب','Midnight','Ponoć'],sepia:['مطالعه سپیا','Sepia reading','Sepija za čitanje']};
const PRESETS={
 hope:{bg:'#eef8ff',card:'#ffffff',text:'#14364d',muted:'#526777',verse:'#17364e',accent:'#1858a4'},
 ocean:{bg:'#e8f5f7',card:'#fbffff',text:'#103e49',muted:'#49666c',verse:'#143d49',accent:'#006b83'},
 forest:{bg:'#ecf3ec',card:'#fefffb',text:'#23432e',muted:'#526753',verse:'#284432',accent:'#316547'},
 royal:{bg:'#f0ecf8',card:'#fffaff',text:'#382454',muted:'#6a5779',verse:'#35234d',accent:'#703da0'},
 sand:{bg:'#f7efe2',card:'#fffaf0',text:'#4b3829',muted:'#76604b',verse:'#4b3829',accent:'#885124'},
 rose:{bg:'#f9edf1',card:'#fffafc',text:'#562b3b',muted:'#785766',verse:'#542b39',accent:'#a53261'},
 midnight:{bg:'#091522',card:'#142b3c',text:'#f0f6fc',muted:'#b1c6d8',verse:'#f2f1e5',accent:'#76c5ea'},
 sepia:{bg:'#eee2c8',card:'#faf0db',text:'#403323',muted:'#6f5b3e',verse:'#433321',accent:'#785326'}
};
const FONT_FA={system:'Tahoma,"Geeza Pro",Arial,sans-serif',vazirmatn:'"NH7 Vazirmatn",Tahoma,sans-serif',naskh:'"NH7 Noto Naskh",Tahoma,serif',estedad:'"NH7 Estedad",Tahoma,sans-serif'};
const FONT_LATIN={system:'system-ui,-apple-system,"Segoe UI",Arial,sans-serif',inter:'"NH7 Inter",Arial,sans-serif',lora:'"NH7 Lora",Georgia,serif',nunito:'"NH7 Nunito",Arial,sans-serif',classic:'Georgia,"Times New Roman",serif'};
const COLOR_NAMES={bg:['پس‌زمینهٔ کل','App background','Pozadina aplikacije'],card:['پس‌زمینهٔ کارت‌ها','Card background','Pozadina kartica'],text:['متن اصلی','Main text','Glavni tekst'],muted:['متن فرعی','Secondary text','Sporedni tekst'],verse:['متن آیات','Verse text','Tekst stihova'],accent:['دکمه‌ها و رنگ تأکید','Buttons and accent','Gumbi i naglasak']};
const fields=Object.keys(COLOR_NAMES),pick=a=>L(...a);
let draft=null,lastApplied='',renderKey='',pending=false,ownChange=false;
function read(key,fallback){try{const value=localStorage.getItem(key);return value===null?fallback:JSON.parse(value)}catch(_){return fallback}}
function clean(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const cfg={preset:Object.hasOwn(LABELS,value.preset)?value.preset:'custom',fa:Object.hasOwn(FONT_FA,value.fa)?value.fa:'system',latin:Object.hasOwn(FONT_LATIN,value.latin)?value.latin:'system'};
 for(const key of fields){if(!/^#[0-9a-f]{6}$/i.test(value[key]||''))return null;cfg[key]=value[key].toLowerCase()}
 return cfg;
}
function luminance(hex){const a=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2]}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function validate(value){const c=clean(value);if(!c)return{ok:false,failed:['format'],pairs:[]};const pairs=[['text','bg'],['text','card'],['muted','bg'],['muted','card'],['verse','card']].map(([f,b])=>({foreground:f,background:b,ratio:contrast(c[f],c[b])}));return {ok:pairs.every(x=>x.ratio>=4.5),pairs,failed:pairs.filter(x=>x.ratio<4.5).map(x=>x.foreground)}}
function base(id='hope'){return{preset:id,...PRESETS[id],fa:'system',latin:'system'}}
function ink(bg){return contrast('#ffffff',bg)>contrast('#000000',bg)?'#ffffff':'#000000'}
function clearVariables(){delete root.dataset.nh7Studio;delete root.dataset.nh7StudioFont;for(const k of ['bg','card','text','muted','verse','accent','button-ink','link','line','fa-font','latin-font','font'])root.style.removeProperty('--nh7-studio-'+k)}
function apply(){
 const c=clean(read(KEY,null));if(!c||!validate(c).ok){clearVariables();lastApplied='';return}
 const signature=lang()+'|'+JSON.stringify(c);if(lastApplied===signature&&root.dataset.nh7Studio)return;
 lastApplied=signature;root.dataset.nh7Studio=c.preset;root.dataset.nh7StudioFont='1';
 fields.forEach(k=>root.style.setProperty('--nh7-studio-'+k,c[k]));
 root.style.setProperty('--nh7-studio-button-ink',ink(c.accent));
 root.style.setProperty('--nh7-studio-link',contrast(c.accent,c.card)>=4.5&&contrast(c.accent,c.bg)>=4.5?c.accent:c.text);
 root.style.setProperty('--nh7-studio-line',c.muted+'66');
 root.style.setProperty('--nh7-studio-fa-font',FONT_FA[c.fa]);root.style.setProperty('--nh7-studio-latin-font',FONT_LATIN[c.latin]);
 root.style.setProperty('--nh7-studio-font',lang()==='fa'?FONT_FA[c.fa]:FONT_LATIN[c.latin]);
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',c.bg);
}
function status(text,bad=false){const n=document.getElementById('nh7StudioStatus453');if(n){n.textContent=text;n.dataset.error=bad?'1':'0'}}
function set(value){const c=clean(value);if(!c||!validate(c).ok)return false;try{localStorage.setItem(KEY,JSON.stringify(c))}catch(_){status(L('ذخیرهٔ ظاهر انجام نشد؛ تنظیم قبلی حفظ شد.','Could not save appearance; the previous setting was kept.','Izgled nije spremljen; prethodna postavka je sačuvana.'),true);return false}lastApplied='';apply();return true}
function library(){const x=read(SAVED,[]);return Array.isArray(x)?x.filter(i=>i&&typeof i==='object'&&typeof i.id==='string'&&typeof i.name==='string'&&i.name.length<=40&&clean(i.config)&&validate(i.config).ok).slice(0,12):[]}
function reset(){try{localStorage.removeItem(KEY)}catch(_){status(L('بازنشانی انجام نشد.','Reset failed.','Vraćanje nije uspjelo.'),true);return}lastApplied='';clearVariables();window.NH7_UI_PREFS?.apply?.();draft=base();renderKey='';mount();status(L('فقط ظاهر بازنشانی شد؛ یادداشت‌ها و پیشرفت‌ها تغییر نکردند.','Only appearance was reset; notes and progress were unchanged.','Vraćen je samo izgled; bilješke i napredak nisu promijenjeni.'))}
function preview(){
 const panel=document.getElementById('nh7ThemeStudio453');if(!panel||!draft)return;
 const card=panel.querySelector('[data-studio-sample453]');fields.forEach(k=>card.style.setProperty('--sample-'+k,draft[k]));
 card.style.setProperty('--sample-font',lang()==='fa'?FONT_FA[draft.fa]:FONT_LATIN[draft.latin]);card.style.setProperty('--sample-button-ink',ink(draft.accent));
 const v=validate(draft),indicator=panel.querySelector('[data-studio-contrast453]');indicator.textContent=v.ok?L('خوانایی مناسب ✓','Readable contrast ✓','Dobar kontrast ✓'):L('کنتراست متن کم است؛ رنگ‌ها را اصلاح کن یا «خوانایی خودکار» را بزن.','Text contrast is too low. Adjust colors or use Auto readability.','Kontrast teksta je preslab. Promijenite boje ili odaberite Automatsku čitljivost.');
 indicator.dataset.valid=v.ok?'1':'0';panel.querySelector('[data-studio-apply453]').disabled=!v.ok;panel.querySelector('[data-studio-save453]').disabled=!v.ok;
 panel.querySelectorAll('[data-studio-preset453]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.studioPreset453===draft.preset)));
}
function mount(){
 const old=document.getElementById('nh7AppearancePanel');if(!old)return;
 const signature=lang()+'|'+JSON.stringify(read(KEY,null))+'|'+JSON.stringify(library().map(x=>[x.id,x.name]));
 let panel=document.getElementById('nh7ThemeStudio453');if(panel&&renderKey===signature)return;
 if(panel)panel.remove();draft=clean(read(KEY,null))||base();renderKey=signature;
 panel=document.createElement('section');panel.id='nh7ThemeStudio453';panel.className='nh7-studio-panel453';panel.dir=lang()==='fa'?'rtl':'ltr';
 const fontOptions=(set,names,current)=>Object.keys(set).map(id=>`<option value="${id}" ${id===current?'selected':''}>${E(names[id]||id)}</option>`).join('');
 panel.innerHTML=`<header><span class="nh7-studio-eyebrow453">NEW HOPE 7 · PERSONAL</span><h3>🎨 ${E(L('استودیوی ظاهر','Theme Studio','Studio izgleda'))}</h3><p>${E(L('یک تم آماده انتخاب کن یا ظاهر دلخواهت را بساز. این تنظیمات فقط برای همین دستگاه هستند.','Choose a preset or create your own look. These settings apply only to this device.','Odaberite temu ili stvorite vlastiti izgled. Postavke vrijede samo za ovaj uređaj.'))}</p></header><div class="nh7-studio-presets453">${Object.entries(PRESETS).map(([id,c])=>`<button type="button" data-studio-preset453="${id}" aria-pressed="${draft.preset===id}" style="--chip-bg:${c.bg};--chip-card:${c.card};--chip-ink:${c.text};--chip-accent:${c.accent}"><span class="nh7-studio-mini453"><i></i><b>Aa</b></span><strong>${E(pick(LABELS[id]))}</strong></button>`).join('')}</div><div class="nh7-studio-sample453" data-studio-sample453><div><b>${E(L('پیش‌نمایش ظاهر','Appearance preview','Pregled izgleda'))}</b><p>${E(L('رنگ و فونت را پیش از اعمال بررسی کن.','Check colors and fonts before applying.','Provjerite boje i fontove prije primjene.'))}</p><blockquote>${E(L('نمونهٔ متن خواندنی — امید و محبت','Reader text sample — hope and love','Primjer teksta — nada i ljubav'))}</blockquote><span>${E(L('دکمهٔ نمونه','Sample button','Primjer gumba'))}</span></div></div><details class="nh7-studio-custom453"><summary>${E(L('شخصی‌سازی رنگ و فونت','Customize colors and fonts','Prilagodite boje i fontove'))}</summary><div class="nh7-studio-fields453">${fields.map(k=>`<label>${E(pick(COLOR_NAMES[k]))}<input type="color" data-studio-color453="${k}" value="${draft[k]}" aria-label="${E(pick(COLOR_NAMES[k]))}"></label>`).join('')}<label>${E(L('فونت فارسی','Persian font','Perzijski font'))}<select data-studio-font453="fa">${fontOptions(FONT_FA,{system:L('فونت دستگاه','Device font','Font uređaja'),vazirmatn:'Vazirmatn · وزیرمتن',naskh:'Noto Naskh · نسخ',estedad:'Estedad · استعداد'},draft.fa)}</select></label><label>${E(L('فونت انگلیسی و کرواتی','English and Croatian font','Engleski i hrvatski font'))}<select data-studio-font453="latin">${fontOptions(FONT_LATIN,{system:L('فونت دستگاه','Device font','Font uređaja'),inter:'Inter',lora:'Lora',nunito:'Nunito Sans',classic:'Georgia / Classic'},draft.latin)}</select></label></div></details><p data-studio-contrast453 role="status"></p><div class="nh7-studio-actions453"><button type="button" data-studio-apply453>${E(L('اعمال ظاهر','Apply appearance','Primijeni izgled'))}</button><button type="button" data-studio-auto453>${E(L('خوانایی خودکار','Auto readability','Automatska čitljivost'))}</button><button type="button" data-studio-reset453>${E(L('ظاهر پیش‌فرض','Default appearance','Zadani izgled'))}</button></div><details><summary>${E(L('تم‌های من','My themes','Moje teme'))}</summary><label>${E(L('نام تم','Theme name','Naziv teme'))}<input data-studio-name453 maxlength="40" placeholder="${E(L('تم من','My theme','Moja tema'))}"></label><button type="button" data-studio-save453>${E(L('ذخیرهٔ تم','Save theme','Spremi temu'))}</button><div class="nh7-studio-library453">${library().map(i=>`<div><button type="button" data-studio-load453="${E(i.id)}">${E(i.name)}</button><button type="button" data-studio-delete453="${E(i.id)}" aria-label="${E(L('حذف تم ','Delete theme ','Obriši temu ')+i.name)}">×</button></div>`).join('')}</div></details><p id="nh7StudioStatus453" role="status" aria-live="polite"></p>`;
 old.insertAdjacentElement('afterend',panel);preview();
 panel.addEventListener('input',event=>{const input=event.target;if(input.matches('[data-studio-color453]')){draft[input.dataset.studioColor453]=input.value;draft.preset='custom';preview()}});
 panel.addEventListener('change',event=>{const input=event.target;if(input.matches('[data-studio-font453]')){draft[input.dataset.studioFont453]=input.value;preview()}});
 panel.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.studioPreset453){const fonts={fa:draft.fa,latin:draft.latin};draft={...base(b.dataset.studioPreset453),...fonts};fields.forEach(k=>panel.querySelector(`[data-studio-color453="${k}"]`).value=draft[k]);preview();status(L('پیش‌نمایش آماده است؛ برای ذخیره «اعمال ظاهر» را بزن.','Preview ready. Select Apply appearance to save.','Pregled je spreman. Odaberite Primijeni izgled za spremanje.'))}
  else if(b.hasAttribute('data-studio-apply453')){if(set(draft)){renderKey='';mount();status(L('ظاهر ذخیره و اعمال شد ✓','Appearance saved and applied ✓','Izgled je spremljen i primijenjen ✓'))}}
  else if(b.hasAttribute('data-studio-auto453')){for(const key of ['text','muted'])draft[key]=['#000000','#ffffff'].sort((a,b)=>Math.min(contrast(b,draft.bg),contrast(b,draft.card))-Math.min(contrast(a,draft.bg),contrast(a,draft.card)))[0];draft.verse=ink(draft.card);if(!validate(draft).ok){draft.card=draft.bg;draft.text=draft.muted=draft.verse=ink(draft.bg)}draft.preset='custom';fields.forEach(k=>panel.querySelector(`[data-studio-color453="${k}"]`).value=draft[k]);preview()}
  else if(b.hasAttribute('data-studio-reset453'))reset();
  else if(b.hasAttribute('data-studio-save453')){const rows=library();if(rows.length>=12){status(L('حداکثر ۱۲ تم؛ ابتدا یکی را حذف کن.','Maximum 12 themes. Remove one first.','Najviše 12 tema. Najprije uklonite jednu.'),true);return}const name=panel.querySelector('[data-studio-name453]').value.trim()||L('تم من','My theme','Moja tema');try{rows.push({id:crypto.randomUUID?.()||String(Date.now()),name,config:clean(draft)});localStorage.setItem(SAVED,JSON.stringify(rows));set(draft);renderKey='';mount();status(L('تم ذخیره شد ✓','Theme saved ✓','Tema je spremljena ✓'))}catch(_){status(L('ذخیره انجام نشد.','Save failed.','Spremanje nije uspjelo.'),true)}}
  else if(b.dataset.studioLoad453){const item=library().find(x=>x.id===b.dataset.studioLoad453);if(item&&set(item.config)){renderKey='';mount()}}
  else if(b.dataset.studioDelete453){const id=b.dataset.studioDelete453;if(confirm(L('فقط این تم از فهرست تم‌ها حذف شود؟','Remove only this theme from My themes?','Ukloniti samo ovu temu iz Mojih tema?'))){try{localStorage.setItem(SAVED,JSON.stringify(library().filter(x=>x.id!==id)));renderKey='';mount()}catch(_){status(L('حذف تم انجام نشد.','Theme removal failed.','Tema nije uklonjena.'),true)}}}
 });
}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;apply();mount()})}
window.addEventListener('nh7:ui-preferences',()=>{lastApplied='';schedule()});window.addEventListener('storage',event=>{if([KEY,SAVED,'nh7_lang'].includes(event.key)){lastApplied='';renderKey='';schedule()}});
window.addEventListener('change',event=>{if(['langSelect','settingsLang'].includes(event.target.id)){renderKey='';lastApplied='';schedule()}},true);
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.NH7ThemeStudioV453={VERSION:'4.5.3',KEY,SAVED,PRESETS,contrast,validate,get:()=>clean(read(KEY,null)),set,reset,apply,mount};
apply();schedule();
})();
