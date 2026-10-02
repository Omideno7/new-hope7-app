/* New Hope 7 — Appearance & Personalization v5.1.7
 * Additive local-only appearance controller. No Supabase/account/network writes.
 * Existing users stay on Classic/current appearance until they explicitly opt in.
 */
(()=>{'use strict';
if(window.NH7AppearancePersonalizationV514)return;

const root=document.documentElement;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const KEY='nh7_appearance_personalization_v514';
const SIZE_KEY='nh7_appearance_font_size_v514';
const L=(fa,en,hr)=>((localStorage.getItem('nh7_lang')||'en')==='fa'?fa:(localStorage.getItem('nh7_lang')||'en')==='hr'?hr:en);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const NEW_THEMES={
 titaniumNatural:{name:['تیتانیوم طبیعی','Titanium Natural','Titanium Natural'],group:'modern',bg:'#ebe7df',card:'#faf8f4',text:'#37332e',muted:'#625b52',verse:'#403a33',accent:'#7d725f'},
 titaniumBlue:{name:['تیتانیوم آبی','Titanium Blue','Titanium Blue'],group:'modern',bg:'#dde8f1',card:'#f7fbff',text:'#183044',muted:'#506171',verse:'#1c3549',accent:'#4d789a'},
 silverGlass:{name:['شیشه نقره‌ای','Silver Glass','Silver Glass'],group:'modern',bg:'#e9eef3',card:'#fbfdff',text:'#1f2c37',muted:'#596772',verse:'#263643',accent:'#71879b'},
 roseGlass:{name:['شیشه رز','Rose Glass','Rose Glass'],group:'modern',bg:'#f4e7eb',card:'#fff9fb',text:'#4c2733',muted:'#72515c',verse:'#542c38',accent:'#ae6179'},
 galaxyNavy:{name:['گلکسی سرمه‌ای','Galaxy Navy','Galaxy Navy'],group:'modern',bg:'#e3ebf7',card:'#f8fbff',text:'#122844',muted:'#506176',verse:'#17304e',accent:'#315c94'},
 galaxyMint:{name:['گلکسی نعنایی','Galaxy Mint','Galaxy Mint'],group:'modern',bg:'#e1f3ec',card:'#f7fffc',text:'#123a2f',muted:'#49695e',verse:'#183f34',accent:'#3c8e78'},
 galaxyViolet:{name:['گلکسی بنفش','Galaxy Violet','Galaxy Violet'],group:'modern',bg:'#ede8f8',card:'#fbf9ff',text:'#352456',muted:'#625575',verse:'#3b2a5c',accent:'#7557b7'},
 sandstone:{name:['سنگ شنی','Sandstone','Sandstone'],group:'modern',bg:'#eee7dd',card:'#fffaf3',text:'#45382e',muted:'#67584b',verse:'#4a3a2e',accent:'#9b704e'},
 iceBlue:{name:['آبی یخی','Ice Blue','Ice Blue'],group:'modern',bg:'#e3f3fa',card:'#f9fdff',text:'#143544',muted:'#4e6976',verse:'#183b4b',accent:'#3286a5'},
 springGreen:{name:['سبز بهاری','Spring Green','Spring Green'],group:'modern',bg:'#e8f4e8',card:'#fbfffb',text:'#20442b',muted:'#556a58',verse:'#254b30',accent:'#4d8a58'},
 lavenderAir:{name:['اسطوخودوس','Lavender Air','Lavender Air'],group:'modern',bg:'#f0ebfa',card:'#fcfaff',text:'#3f315d',muted:'#685b7c',verse:'#453663',accent:'#8b6fbd'},
 peachCloud:{name:['ابر هلویی','Peach Cloud','Peach Cloud'],group:'modern',bg:'#fae9de',card:'#fffaf7',text:'#552f22',muted:'#755548',verse:'#5b3426',accent:'#c07152'},
 oledBlack:{name:['مشکی OLED','OLED Black','OLED Black'],group:'dark',bg:'#000000',card:'#0b0c0f',text:'#f8fafc',muted:'#aeb5bf',verse:'#fffdf7',accent:'#4aa8ff'},
 graphiteDark:{name:['گرافیت تیره','Graphite Dark','Graphite Dark'],group:'dark',bg:'#101214',card:'#1a1d21',text:'#f5f7fa',muted:'#b4bdc9',verse:'#ffffff',accent:'#8b97a8'},
 deepNavy:{name:['سرمه‌ای عمیق','Deep Navy','Deep Navy'],group:'dark',bg:'#06111f',card:'#0d2238',text:'#eff7ff',muted:'#afc7da',verse:'#ffffff',accent:'#4ca4ff'},
 darkEmerald:{name:['زمرد تیره','Dark Emerald','Dark Emerald'],group:'dark',bg:'#061b18',card:'#0d2c27',text:'#edfff9',muted:'#b1d2c9',verse:'#fffef8',accent:'#43d3a5'},
 purpleNight:{name:['شب بنفش','Purple Night','Purple Night'],group:'dark',bg:'#120b22',card:'#211537',text:'#f8f1ff',muted:'#cfbee2',verse:'#fff8eb',accent:'#a77cf5'},
 warmNight:{name:['شب گرم','Warm Night','Warm Night'],group:'dark',bg:'#17110d',card:'#281e17',text:'#fff7ee',muted:'#d0bdad',verse:'#fff3df',accent:'#d4a15d'}
};
const OLD_LABELS={
 hope:['امید نو','New Hope','Nova nada'],ocean:['اقیانوس','Ocean','Ocean'],forest:['جنگل','Forest','Šuma'],royal:['بنفش سلطنتی','Royal purple','Kraljevska ljubičasta'],sand:['شن گرم','Warm sand','Topli pijesak'],rose:['گل رز','Rose','Ruža'],midnight:['نیمه‌شب','Midnight','Ponoć'],sepia:['مطالعه سپیا','Sepia reading','Sepija za čitanje'],sapphire:['آبی زنده','Vivid blue','Živopisna plava'],emerald:['زمردی','Emerald','Smaragdna'],sunset:['غروب نارنجی','Sunset','Zalazak sunca'],orchid:['ارکیده','Orchid','Orhideja'],berry:['تمشکی','Berry','Bobičasta'],aurora:['شب ارغوانی','Aurora night','Ljubičasta noć']
};
const STYLE_LABELS={
 classic:['اصلی New Hope 7','Classic / Original','Classic / Original'],
 tactile:['برجسته نرم','Soft Tactile','Soft Tactile'],
 glass:['شیشه‌ای','Glass / Frosted','Glass / Frosted'],
 minimal:['مینیمال','Minimal Flat','Minimal Flat'],
 material:['متریال نرم','Material Soft','Material Soft'],
 outline:['خطی تمیز','Outline Clean','Outline Clean'],
 pill:['گرد نرم','Soft Pill','Soft Pill']
};
const FA_FONT_IDS=['system','vazirmatn','naskh','notosansarabic','notokufi','amiri','lalezar','changa','reemkufi','cairo','tajawal','baloo','markazi'];
const LATIN_FONT_IDS=['system','inter','roboto','opensans','montserrat','poppins','nunito','lora','merriweather','playfair','sourcesans','raleway','ubuntu'];
const FONT_NAMES={
 system:['فونت خود دستگاه','Device font','Font uređaja'],
 vazirmatn:['وزیرمتن','Vazirmatn','Vazirmatn'],naskh:['Noto Naskh Arabic','Noto Naskh Arabic','Noto Naskh Arabic'],notosansarabic:['Noto Sans Arabic','Noto Sans Arabic','Noto Sans Arabic'],notokufi:['Noto Kufi Arabic','Noto Kufi Arabic','Noto Kufi Arabic'],amiri:['Amiri','Amiri','Amiri'],lalezar:['Lalezar','Lalezar','Lalezar'],changa:['Changa','Changa','Changa'],reemkufi:['Reem Kufi','Reem Kufi','Reem Kufi'],cairo:['Cairo','Cairo','Cairo'],tajawal:['Tajawal','Tajawal','Tajawal'],baloo:['Baloo Bhaijaan 2','Baloo Bhaijaan 2','Baloo Bhaijaan 2'],markazi:['Markazi Text','Markazi Text','Markazi Text'],
 inter:['Inter','Inter','Inter'],roboto:['Roboto','Roboto','Roboto'],opensans:['Open Sans','Open Sans','Open Sans'],montserrat:['Montserrat','Montserrat','Montserrat'],poppins:['Poppins','Poppins','Poppins'],nunito:['Nunito Sans','Nunito Sans','Nunito Sans'],lora:['Lora','Lora','Lora'],merriweather:['Merriweather','Merriweather','Merriweather'],playfair:['Playfair Display','Playfair Display','Playfair Display'],sourcesans:['Source Sans 3','Source Sans 3','Source Sans 3'],raleway:['Raleway','Raleway','Raleway'],ubuntu:['Ubuntu','Ubuntu','Ubuntu']
};

const defaults={style:'classic',themeGroup:'all',themeId:'current',mode:'manual',dayTheme:'hope',nightTheme:'oledBlack',dayStart:'07:00',nightStart:'19:00',fontSize:100,faFont:'system',latinFont:'system',reader:false,readerMode:'paper',depth:7,glow:14,accentIntensity:100,textIntensity:100,custom:null};
let state=load();
let applying=false,pending=false,lastThemeSig='';

function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return Object.assign({},defaults,x&&typeof x==='object'?x:{})}catch(_){return {...defaults}}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));localStorage.setItem(SIZE_KEY,String(state.fontSize||100))}catch(_){}}
function rgb(h){const s=String(h||'').replace('#','');return[0,2,4].map(i=>parseInt(s.slice(i,i+2),16))}
function toHex(a){return'#'+a.map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join('')}
function mix(a,b,t){const A=rgb(a),B=rgb(b),p=Math.max(0,Math.min(1,t));return toHex(A.map((x,i)=>x+(B[i]-x)*p))}
function lum(h){const a=rgb(h).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2]}
function contrast(a,b){const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function validHex(v){return /^#[0-9a-f]{6}$/i.test(String(v||''))}
function currentOldPresets(){return window.NH7ThemeStudioV453?.PRESETS||{}}
function currentThemeConfig(){return window.NH7ThemeStudioV453?.get?.()||null}
function allThemes(){const old=currentOldPresets(),out={};for(const [id,p] of Object.entries(old)){out[id]={...p,name:OLD_LABELS[id]||[id,id,id],group:['midnight','aurora'].includes(id)?'dark':(['sapphire','emerald','sunset','orchid','berry'].includes(id)?'vivid':'soft'),old:true}}for(const [id,p] of Object.entries(NEW_THEMES))out[id]={...p,old:false};return out}
function isDarkTheme(p){return p?lum(p.card)<.2:false}
function timeMin(v){const m=String(v||'').match(/^(\d{2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):0}
function scheduledTheme(){const n=new Date(),now=n.getHours()*60+n.getMinutes(),d=timeMin(state.dayStart),k=timeMin(state.nightStart),isDay=d<k?(now>=d&&now<k):(now>=d||now<k);return isDay?state.dayTheme:state.nightTheme}
function resolvedThemeId(){if(state.mode==='system'){let dark=false;try{dark=matchMedia('(prefers-color-scheme: dark)').matches}catch(_){}return dark?state.nightTheme:state.dayTheme}if(state.mode==='auto')return scheduledTheme();return state.themeId}
function intensity(color,neutral,pct){const p=Math.max(0,Math.min(100,Number(pct)||100))/100;return mix(neutral,color,p)}
function configFor(id){
 const p=allThemes()[id];if(!p)return null;
 const text=intensity(p.text,p.card,state.textIntensity),accent=intensity(p.accent,p.card,state.accentIntensity);
 return {preset:p.old?id:'custom',bg:p.bg,card:p.card,text,muted:p.muted,verse:p.verse,accent,fa:state.faFont,latin:state.latinFont};
}
function themeInk(bg){return contrast('#ffffff',bg)>=contrast('#000000',bg)?'#ffffff':'#000000'}
function applyThemeVisual(c){
 if(!c)return;
 root.dataset.nh7Studio=c.preset||'custom';root.dataset.nh7StudioFont='1';
 root.dataset.nh7StudioTone457=lum(c.card)<.2?'dark':'light';
 root.style.setProperty('color-scheme',lum(c.card)<.2?'dark':'light');
 for(const k of ['bg','card','text','muted','verse','accent'])root.style.setProperty('--nh7-studio-'+k,c[k]);
 root.style.setProperty('--nh7-studio-button-ink',themeInk(c.accent));
 root.style.setProperty('--nh7-studio-line',c.muted+'66');
 root.style.setProperty('--nh7-studio-link',contrast(c.accent,c.card)>=4.5&&contrast(c.accent,c.bg)>=4.5?c.accent:c.text);
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',c.bg);
}
function applyFontVisual(){
 const api=window.NH7FontsV454,langNow=(localStorage.getItem('nh7_lang')||'en'),id=langNow==='fa'?state.faFont:state.latinFont,f=api?.fonts?.[id];
 if(f?.stack){root.dataset.nh7Ap514Font=id;root.style.setProperty('--nh7-ap514-font',f.stack)}
 else{delete root.dataset.nh7Ap514Font;root.style.removeProperty('--nh7-ap514-font')}
}
function applyTheme(){
 if(applying)return;
 if(state.mode==='manual'&&state.themeId==='current')return;
 const id=resolvedThemeId(),cfg=configFor(id);if(!cfg)return;
 const sig=JSON.stringify(cfg);if(sig===lastThemeSig)return;
 applying=true;
 try{
   const ok=window.NH7ThemeStudioV453?.set?.(cfg);
   applyThemeVisual(cfg);
   if(ok)window.NH7_UI_PREFS?.apply?.();
   lastThemeSig=sig;
 }finally{applying=false}
}
function applyFont(){
 const api=window.NH7FontsV454;if(!api)return;
 if(!FA_FONT_IDS.includes(state.faFont))state.faFont='system';
 if(!LATIN_FONT_IDS.includes(state.latinFont))state.latinFont='system';
 applyFontVisual();
 if(api.fonts?.[state.faFont])Promise.resolve(api.choose('fa',state.faFont)).finally(applyFontVisual);
 if(api.fonts?.[state.latinFont])Promise.resolve(api.choose('latin',state.latinFont)).finally(applyFontVisual);
}
function applySize(){const n=Math.max(80,Math.min(140,Number(state.fontSize)||100));root.style.fontSize=n+'%'}
function applyReader(){
 root.dataset.nh7EyeReader514=state.reader?'1':'0';root.dataset.nh7ReaderMode514=state.readerMode||'paper';
}
function applyStyle(){root.dataset.nh7UiStyle514=state.style||'classic';root.style.setProperty('--nh7-ap514-depth',(Number(state.depth)||7)+'px');root.style.setProperty('--nh7-ap514-glow',(Number(state.glow)||14)+'%');const cfg=currentThemeConfig();root.style.setProperty('--nh7-ap514-icon',cfg?.accent||getComputedStyle(root).getPropertyValue('--brand')||'#1858a4')}
function applyAll(){applyStyle();applySize();applyReader();applyFontVisual();applyTheme();save();syncOpenDialog()}
function resetOriginal(){
 state={...defaults,style:'classic',themeId:'current'};
 try{localStorage.removeItem(KEY);localStorage.removeItem(SIZE_KEY)}catch(_){}
 delete root.dataset.nh7EyeReader514;delete root.dataset.nh7ReaderMode514;root.dataset.nh7UiStyle514='classic';root.style.removeProperty('--nh7-ap514-depth');root.style.removeProperty('--nh7-ap514-glow');root.style.fontSize='';
 window.NH7ThemeStudioV453?.reset?.();window.NH7FontsV454?.reset?.();window.NH7_UI_PREFS?.apply?.();lastThemeSig='';mount();closeDialog();
}

function launcherHtml(){return '<section class="nh7-ap514-launcher" id="nh7AppearanceLauncher514"><div><strong>🎨 '+esc(L('ظاهر و شخصی‌سازی','Appearance & personalization','Izgled i personalizacija'))+'</strong><small>'+esc(L('تم، رنگ، فونت، اندازه نوشته، سبک کلیدها و حالت مطالعه را شخصی‌سازی کنید.','Customize themes, colors, fonts, text size, button style and reading mode.','Prilagodite teme, boje, fontove, veličinu teksta, stil gumba i način čitanja.'))+'</small></div><button type="button" class="nh7-ap514-open" data-ap514-open>'+esc(L('باز کردن','Open','Otvori'))+'</button></section>'}
function mount(){
 const panel=$('#nh7AppearancePanel');if(!panel)return;
 const studio=$('#nh7ThemeStudio453');
 panel.dataset.nh7Ap514Hidden='1';if(studio)studio.dataset.nh7Ap514Hidden='1';
 let launcher=$('#nh7AppearanceLauncher514');
 if(!launcher){panel.insertAdjacentHTML('beforebegin',launcherHtml());launcher=$('#nh7AppearanceLauncher514')}
 const openBtn=launcher.querySelector('[data-ap514-open]');
 if(openBtn&&openBtn.dataset.ap514Bound!=='1'){openBtn.dataset.ap514Bound='1';openBtn.addEventListener('click',openDialog)}
}
function styleCards(){
 return Object.keys(STYLE_LABELS).map(id=>'<button type="button" class="nh7-ap514-style" data-ap514-style="'+id+'" aria-pressed="'+String(state.style===id)+'"><span class="nh7-ap514-style-demo"><span><i></i><i></i></span><b>'+(id==='classic'?'NH7':'●')+'</b></span><strong>'+esc(L(...STYLE_LABELS[id]))+'</strong></button>').join('');
}
function themeCards(){
 const themes=allThemes(),savedThemes=readSavedThemes();
 let entries=Object.entries(themes).filter(([id,p])=>{
   if(state.themeGroup==='all')return true;if(state.themeGroup==='old')return p.old;if(state.themeGroup==='new')return !p.old;if(state.themeGroup==='dark')return p.group==='dark';if(state.themeGroup==='soft')return p.group==='soft';if(state.themeGroup==='modern')return p.group==='modern';if(state.themeGroup==='vivid')return p.group==='vivid';return true
 });
 let html='<button type="button" class="nh7-ap514-theme" data-ap514-theme="current" aria-pressed="'+String(state.themeId==='current')+'"><span class="nh7-ap514-swatch" style="--sw-bg:var(--nh7-studio-bg,var(--bg,#eef8ff));--sw-card:var(--nh7-studio-card,var(--card,#fff));--sw-text:var(--nh7-studio-text,var(--ink,#17364e));--sw-accent:var(--nh7-studio-accent,var(--brand,#1858a4))"><i></i><b>Aa</b></span><strong>'+esc(L('ظاهر فعلی / قبلی','Current / existing appearance','Trenutni izgled'))+'</strong></button>';
 html+=entries.map(([id,p])=>'<button type="button" class="nh7-ap514-theme" data-ap514-theme="'+id+'" aria-pressed="'+String(state.themeId===id)+'" style="--sw-bg:'+p.bg+';--sw-card:'+p.card+';--sw-text:'+p.text+';--sw-accent:'+p.accent+'"><span class="nh7-ap514-swatch"><i></i><b>Aa</b></span><strong>'+esc(Array.isArray(p.name)?L(...p.name):p.name)+'</strong>'+(!p.old?'<em class="nh7-ap514-new">NEW</em>':'')+'</button>').join('');
 if(savedThemes.length&&state.themeGroup==='all')html+=savedThemes.map(x=>'<button type="button" class="nh7-ap514-theme" data-ap514-saved="'+esc(x.id)+'" aria-pressed="false" style="--sw-bg:'+x.config.bg+';--sw-card:'+x.config.card+';--sw-text:'+x.config.text+';--sw-accent:'+x.config.accent+'"><span class="nh7-ap514-swatch"><i></i><b>Aa</b></span><strong>'+esc(x.name)+'</strong></button>').join('');
 return html;
}
function readSavedThemes(){try{const x=JSON.parse(localStorage.getItem('nh7_theme_library_v453')||'[]');return Array.isArray(x)?x.filter(i=>i&&i.config&&validHex(i.config.bg)&&validHex(i.config.card)).slice(0,12):[]}catch(_){return[]}}
function fontOptions(ids){return ids.map(id=>'<option value="'+id+'">'+esc(L(...(FONT_NAMES[id]||[id,id,id])))+'</option>').join('')}
function themeOptions(dark){return Object.entries(allThemes()).filter(([,p])=>isDarkTheme(p)===dark).map(([id,p])=>'<option value="'+id+'">'+esc(Array.isArray(p.name)?L(...p.name):p.name)+'</option>').join('')}
function dialogHtml(){
 return '<dialog class="nh7-ap514-dialog" id="nh7AppearanceDialog514"><div class="nh7-ap514-shell"><header class="nh7-ap514-head"><button type="button" data-ap514-close aria-label="Close">×</button><div><strong>🎨 '+esc(L('ظاهر و شخصی‌سازی','Appearance & personalization','Izgled i personalizacija'))+'</strong><small>'+esc(L('تمام تنظیمات فقط روی همین دستگاه ذخیره می‌شوند.','All appearance settings are stored on this device only.','Sve postavke izgleda spremaju se samo na ovom uređaju.'))+'</small></div><button type="button" data-ap514-reset title="Reset">↺</button></header><div class="nh7-ap514-body">'+
 card(L('سبک رابط کاربری','Interface style','Stil sučelja'),L('گزینه «اصلی New Hope 7» دقیقاً ساختار فعلی اپ را نگه می‌دارد.','Classic / Original keeps the current app structure exactly as it is.','Classic / Original zadržava postojeću strukturu aplikacije.'),'<div class="nh7-ap514-grid">'+styleCards()+'</div>')+
 card(L('حالت تم','Theme mode','Način teme'),L('دستی، مطابق روشن/تیره بودن گوشی، یا روز/شب خودکار.','Manual, follow phone light/dark mode, or automatic day/night.','Ručno, prema svijetlom/tamnom načinu uređaja ili automatski dan/noć.'),'<div class="nh7-ap514-tabs"><button class="nh7-ap514-chip" data-ap514-mode="manual">Manual</button><button class="nh7-ap514-chip" data-ap514-mode="system">System</button><button class="nh7-ap514-chip" data-ap514-mode="auto">Day/Night</button></div><div class="nh7-ap514-fields" data-ap514-schedule><label class="nh7-ap514-field">'+esc(L('تم روز','Day theme','Dnevna tema'))+'<select id="nh7ApDayTheme">'+themeOptions(false)+'</select></label><label class="nh7-ap514-field">'+esc(L('تم شب','Night theme','Noćna tema'))+'<select id="nh7ApNightTheme">'+themeOptions(true)+'</select></label><label class="nh7-ap514-field">'+esc(L('شروع روز','Day starts','Početak dana'))+'<input id="nh7ApDayStart" type="time"></label><label class="nh7-ap514-field">'+esc(L('شروع شب','Night starts','Početak noći'))+'<input id="nh7ApNightStart" type="time"></label></div>')+
 card(L('کتابخانه تم‌ها','Theme library','Biblioteka tema'),L('تمام ۱۴ تم قبلی حفظ شده‌اند و تم‌های جدید به آنها اضافه شده‌اند.','All 14 existing themes are preserved and new themes are added.','Svih 14 postojećih tema je sačuvano, a nove su dodane.'),'<div class="nh7-ap514-tabs" data-ap514-groups><button class="nh7-ap514-chip" data-ap514-group="all">'+esc(L('همه','All','Sve'))+'</button><button class="nh7-ap514-chip" data-ap514-group="old">'+esc(L('قبلی‌ها','Existing','Postojeće'))+'</button><button class="nh7-ap514-chip" data-ap514-group="new">'+esc(L('جدیدها','New','Nove'))+'</button><button class="nh7-ap514-chip" data-ap514-group="dark">'+esc(L('تیره','Dark','Tamne'))+'</button><button class="nh7-ap514-chip" data-ap514-group="modern">'+esc(L('مدرن','Modern','Moderne'))+'</button><button class="nh7-ap514-chip" data-ap514-group="soft">'+esc(L('مطالعه','Reading','Čitanje'))+'</button></div><div class="nh7-ap514-grid" id="nh7ApThemeGrid">'+themeCards()+'</div>')+
 card(L('فونت و اندازه نوشته','Fonts & text size','Fontovi i veličina teksta'),L('۱۲ انتخاب فارسی و ۱۲ انتخاب انگلیسی/کرواتی؛ بدون سرویس پولی.','12 Persian and 12 English/Croatian choices; no paid service.','12 perzijskih i 12 engleskih/hrvatskih izbora; bez plaćene usluge.'),'<div class="nh7-ap514-fields"><label class="nh7-ap514-field">'+esc(L('فونت فارسی','Persian font','Perzijski font'))+'<select id="nh7ApFaFont">'+fontOptions(FA_FONT_IDS)+'</select></label><label class="nh7-ap514-field">'+esc(L('فونت انگلیسی / کرواتی','English / Croatian font','Engleski / hrvatski font'))+'<select id="nh7ApLatinFont">'+fontOptions(LATIN_FONT_IDS)+'</select></label></div><div class="nh7-ap514-range"><label>'+esc(L('اندازه نوشته','Text size','Veličina teksta'))+'</label><output id="nh7ApSizeOut"></output><input id="nh7ApSize" type="range" min="80" max="140" step="5"></div>')+
 customCard()+
 readerCard()+
 '<div class="nh7-ap514-card"><div class="nh7-ap514-actions"><button class="nh7-ap514-btn primary" data-ap514-close>'+esc(L('تمام شد','Done','Gotovo'))+'</button><button class="nh7-ap514-btn" data-ap514-reset>'+esc(L('بازگشت کامل به ظاهر اصلی New Hope 7','Restore original New Hope 7 appearance','Vrati izvorni izgled New Hope 7'))+'</button></div></div>'+
 '</div></div></dialog>';
}
function card(title,desc,body){return '<section class="nh7-ap514-card"><h3>'+esc(title)+'</h3><p>'+esc(desc)+'</p>'+body+'</section>'}
function customCard(){const c=currentThemeConfig()||{bg:'#eef8ff',card:'#ffffff',text:'#17364e',muted:'#526777',verse:'#17364e',accent:'#1858a4'};return card(L('ساخت تم شخصی','Custom theme builder','Izrada vlastite teme'),L('پس‌زمینه، ماژول، کلید، متن و آیات را جدا انتخاب کنید.','Choose background, modules, buttons, text and verse colors separately.','Odaberite boje pozadine, modula, gumba, teksta i stihova zasebno.'),'<div class="nh7-ap514-fields"><label class="nh7-ap514-field">'+esc(L('پس‌زمینه','Background','Pozadina'))+'<input id="nh7ApBg" type="color" value="'+c.bg+'"></label><label class="nh7-ap514-field">'+esc(L('کارت / ماژول','Card / module','Kartica / modul'))+'<input id="nh7ApCard" type="color" value="'+c.card+'"></label><label class="nh7-ap514-field">'+esc(L('کلیدها','Buttons','Gumbi'))+'<input id="nh7ApAccent" type="color" value="'+c.accent+'"></label><label class="nh7-ap514-field">'+esc(L('رنگ فونت','Text color','Boja teksta'))+'<input id="nh7ApText" type="color" value="'+c.text+'"></label><label class="nh7-ap514-field">'+esc(L('متن آیات','Verse text','Tekst stihova'))+'<input id="nh7ApVerse" type="color" value="'+c.verse+'"></label></div><div class="nh7-ap514-range"><label>'+esc(L('شدت رنگ کلیدها','Button color intensity','Intenzitet boje gumba'))+'</label><output id="nh7ApAccentOut"></output><input id="nh7ApAccentIntensity" type="range" min="25" max="100" step="5"></div><div class="nh7-ap514-range"><label>'+esc(L('شدت رنگ فونت','Text color intensity','Intenzitet boje teksta'))+'</label><output id="nh7ApTextOut"></output><input id="nh7ApTextIntensity" type="range" min="35" max="100" step="5"></div><div class="nh7-ap514-actions"><button class="nh7-ap514-btn primary" data-ap514-custom>'+esc(L('اعمال تم شخصی','Apply custom theme','Primijeni vlastitu temu'))+'</button></div><p class="nh7-ap514-status" id="nh7ApContrast"></p>')}
function readerCard(){return card(L('Book Reader / آرامش چشم','Book Reader / Eye Comfort','Book Reader / ugodnije čitanje'),L('فقط صفحه‌های خواندنی تغییر می‌کنند؛ پلیر و منو عادی می‌مانند.','Only reading surfaces change; player and menus remain normal.','Mijenjaju se samo površine za čitanje; player i izbornici ostaju normalni.'),'<div class="nh7-ap514-switch-row"><div class="nh7-ap514-switch-copy"><strong>'+esc(L('فعال‌سازی حالت مطالعه','Enable reading mode','Uključi način čitanja'))+'</strong><small>'+esc(L('برای کتاب مقدس، اپوکریفا و کتاب‌خوان.','For Bible, Apocrypha and book reader.','Za Bibliju, Apokrife i čitač knjiga.'))+'</small></div><label class="nh7-ap514-switch"><input id="nh7ApReader" type="checkbox"><span></span></label></div><div class="nh7-ap514-reader-modes" id="nh7ApReaderModes"><button data-ap514-reader="paper">Warm Paper</button><button data-ap514-reader="sepia">Sepia</button><button data-ap514-reader="soft">Soft Gray</button><button data-ap514-reader="night">Night Reading</button></div><div class="nh7-ap514-reader-proof" id="nh7ApReaderProof"><strong>'+esc(L('نمونه فوری','Live sample','Uzorak'))+'</strong><p>'+esc(L('در ابتدا کلمه بود و کلمه نزد خدا بود و کلمه خدا بود.','In the beginning was the Word, and the Word was with God, and the Word was God.','U početku bijaše Riječ, i Riječ bijaše kod Boga, i Riječ bijaše Bog.'))+'</p></div>')}

function ensureDialog(){let d=$('#nh7AppearanceDialog514');if(!d){document.body.insertAdjacentHTML('beforeend',dialogHtml());d=$('#nh7AppearanceDialog514');bindDialog(d)}return d}
function openDialog(){const d=ensureDialog();syncOpenDialog();try{d.showModal()}catch(_){d.setAttribute('open','')}}
function closeDialog(){const d=$('#nh7AppearanceDialog514');if(!d)return;try{d.close()}catch(_){d.removeAttribute('open')}}
function bindDialog(d){
 d.addEventListener('click',e=>{
   if(e.target===d){closeDialog();return}
   const close=e.target.closest('[data-ap514-close]');if(close){closeDialog();return}
   if(e.target.closest('[data-ap514-reset]')){if(confirm(L('ظاهر اپ کاملاً به حالت اصلی New Hope 7 برگردد؟','Restore the original New Hope 7 appearance?','Vratiti izvorni izgled New Hope 7?')))resetOriginal();return}
   const s=e.target.closest('[data-ap514-style]');if(s){state.style=s.dataset.ap514Style;applyAll();return}
   const m=e.target.closest('[data-ap514-mode]');if(m){state.mode=m.dataset.ap514Mode;applyAll();return}
   const g=e.target.closest('[data-ap514-group]');if(g){state.themeGroup=g.dataset.ap514Group;syncOpenDialog();save();return}
   const t=e.target.closest('[data-ap514-theme]');if(t){state.themeId=t.dataset.ap514Theme;state.mode='manual';state.intensityBase=null;lastThemeSig='';if(state.themeId==='current'){lastThemeSig='';window.NH7_UI_PREFS?.apply?.();applyFontVisual()}else applyTheme();applyAll();return}
   const saved=e.target.closest('[data-ap514-saved]');if(saved){const item=readSavedThemes().find(x=>x.id===saved.dataset.ap514Saved);if(item&&window.NH7ThemeStudioV453?.set?.(item.config)){state.themeId='current';state.mode='manual';applyAll()}return}
   const rr=e.target.closest('[data-ap514-reader]');if(rr){state.readerMode=rr.dataset.ap514Reader;applyAll();return}
   if(e.target.closest('[data-ap514-custom]')){applyCustomFromForm();return}
 });
 d.addEventListener('change',e=>{
   if(e.target.id==='nh7ApReader'){state.reader=e.target.checked;applyAll()}
   else if(e.target.id==='nh7ApFaFont'){state.faFont=e.target.value;applyFont();save();syncOpenDialog()}
   else if(e.target.id==='nh7ApLatinFont'){state.latinFont=e.target.value;applyFont();save();syncOpenDialog()}
   else if(e.target.id==='nh7ApDayTheme'){state.dayTheme=e.target.value;lastThemeSig='';applyAll()}
   else if(e.target.id==='nh7ApNightTheme'){state.nightTheme=e.target.value;lastThemeSig='';applyAll()}
   else if(e.target.id==='nh7ApDayStart'){state.dayStart=e.target.value;lastThemeSig='';applyAll()}
   else if(e.target.id==='nh7ApNightStart'){state.nightStart=e.target.value;lastThemeSig='';applyAll()}
 });
 d.addEventListener('input',e=>{
   if(e.target.id==='nh7ApSize'){state.fontSize=Number(e.target.value);applySize();save();syncOpenDialog()}
   else if(e.target.id==='nh7ApAccentIntensity'){state.accentIntensity=Number(e.target.value);lastThemeSig='';if(state.mode==='manual'&&state.themeId==='current')applyCurrentIntensity();applyAll()}
   else if(e.target.id==='nh7ApTextIntensity'){state.textIntensity=Number(e.target.value);lastThemeSig='';if(state.mode==='manual'&&state.themeId==='current')applyCurrentIntensity();applyAll()}
 });
}
function applyCurrentIntensity(){
 const base=state.intensityBase&&validHex(state.intensityBase.bg)?state.intensityBase:currentThemeConfig();
 if(!base)return false;
 if(!state.intensityBase)state.intensityBase={...base};
 const cfg={...state.intensityBase,preset:'custom',text:intensity(state.intensityBase.text,state.intensityBase.card,state.textIntensity),accent:intensity(state.intensityBase.accent,state.intensityBase.card,state.accentIntensity),fa:state.faFont,latin:state.latinFont};
 const validation=window.NH7ThemeStudioV453?.validate?.(cfg);
 if(validation&&!validation.ok)return false;
 return !!window.NH7ThemeStudioV453?.set?.(cfg);
}
function applyCustomFromForm(){
 const d=$('#nh7AppearanceDialog514');if(!d)return;
 const base=currentThemeConfig()||{};
 const cfg={preset:'custom',bg:$('#nh7ApBg',d).value,card:$('#nh7ApCard',d).value,text:$('#nh7ApText',d).value,muted:$('#nh7ApText',d).value,verse:$('#nh7ApVerse',d).value,accent:$('#nh7ApAccent',d).value,fa:state.faFont,latin:state.latinFont};
 const validation=window.NH7ThemeStudioV453?.validate?.(cfg);
 const out=$('#nh7ApContrast',d);
 if(validation&&!validation.ok){if(out){out.textContent=L('کنتراست بعضی رنگ‌ها برای خوانایی کافی نیست.','Some colors do not have enough contrast for readability.','Neke boje nemaju dovoljan kontrast za čitljivost.');out.classList.add('bad')}return}
 if(window.NH7ThemeStudioV453?.set?.(cfg)){state.themeId='current';state.mode='manual';state.custom=cfg;state.intensityBase=cfg;lastThemeSig='';if(out){out.textContent=L('تم شخصی اعمال شد ✓','Custom theme applied ✓','Vlastita tema je primijenjena ✓');out.classList.remove('bad')}applyAll()}
}
function syncOpenDialog(){
 const d=$('#nh7AppearanceDialog514');if(!d)return;
 $$('[data-ap514-style]',d).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ap514Style===state.style)));
 $$('[data-ap514-mode]',d).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ap514Mode===state.mode)));
 $$('[data-ap514-group]',d).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ap514Group===state.themeGroup)));
 const grid=$('#nh7ApThemeGrid',d);if(grid)grid.innerHTML=themeCards();
 const sched=$('[data-ap514-schedule]',d);if(sched)sched.hidden=state.mode==='manual';
 const ds=$('#nh7ApDayTheme',d),ns=$('#nh7ApNightTheme',d);if(ds)ds.value=state.dayTheme;if(ns)ns.value=state.nightTheme;
 const dt=$('#nh7ApDayStart',d),nt=$('#nh7ApNightStart',d);if(dt)dt.value=state.dayStart;if(nt)nt.value=state.nightStart;
 const ff=$('#nh7ApFaFont',d),lf=$('#nh7ApLatinFont',d);if(ff)ff.value=state.faFont;if(lf)lf.value=state.latinFont;
 const size=$('#nh7ApSize',d),so=$('#nh7ApSizeOut',d);if(size)size.value=String(state.fontSize);if(so)so.textContent=state.fontSize+'%';
 const ai=$('#nh7ApAccentIntensity',d),ao=$('#nh7ApAccentOut',d);if(ai)ai.value=String(state.accentIntensity);if(ao)ao.textContent=state.accentIntensity+'%';
 const ti=$('#nh7ApTextIntensity',d),to=$('#nh7ApTextOut',d);if(ti)ti.value=String(state.textIntensity);if(to)to.textContent=state.textIntensity+'%';
 const reader=$('#nh7ApReader',d);if(reader)reader.checked=!!state.reader;
 const modes=$('#nh7ApReaderModes',d);if(modes)modes.hidden=!state.reader;
 $$('[data-ap514-reader]',d).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ap514Reader===state.readerMode)));
 const proof=$('#nh7ApReaderProof',d);if(proof){proof.dataset.on=state.reader?'1':'0';proof.dataset.mode=state.readerMode}
}
function start(){
 if(!localStorage.getItem(KEY)){
   const fonts=window.NH7FontsV454;
   const fa=fonts?.choice?.('fa'),la=fonts?.choice?.('latin');
   if(FA_FONT_IDS.includes(fa))state.faFont=fa;
   if(LATIN_FONT_IDS.includes(la))state.latinFont=la;
   const legacySize=Number(localStorage.getItem('nh7_ui_font_size_v425')||100);
   if(Number.isFinite(legacySize))state.fontSize=Math.max(80,Math.min(140,legacySize));
 }
 if(!FA_FONT_IDS.includes(state.faFont))state.faFont='system';
 if(!LATIN_FONT_IDS.includes(state.latinFont))state.latinFont='system';
 applyStyle();applySize();applyReader();applyFontVisual();
 if(state.mode!=='manual'||state.themeId!=='current')applyTheme();
 mount();
 new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;mount();applyReader()})}}).observe(document.documentElement,{childList:true,subtree:true});
 window.addEventListener('nh7:ui-preferences',()=>{applySize();applyStyle();applyFontVisual()});
 window.addEventListener('change',e=>{if(['langSelect','settingsLang'].includes(e.target?.id))setTimeout(applyFontVisual,0)},true);
 window.addEventListener('storage',e=>{if(e.key===KEY){state=load();applyAll()}});
 try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(state.mode==='system'){lastThemeSig='';applyTheme()}})}catch(_){}
 setInterval(()=>{if(state.mode==='auto'){lastThemeSig='';applyTheme()}},60000);
}
window.NH7AppearancePersonalizationV514={VERSION:'5.1.7',KEY,get:()=>JSON.parse(JSON.stringify(state)),apply:applyAll,open:openDialog,reset:resetOriginal};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();