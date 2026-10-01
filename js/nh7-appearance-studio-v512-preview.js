/* New Hope 7 — Appearance Studio Pro v5.1.2 preview only
 * Preview-specific local state only. No Production/app/account/network writes.
 */
(()=>{'use strict';
if(window.__NH7_APPEARANCE_STUDIO_V512__)return;
window.__NH7_APPEARANCE_STUDIO_V512__=true;

const root=document.documentElement;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const STORE='nh7_appearance_v512_preview_only';

const OLD={
 hope:{name:'امید نو',group:'soft',bg:'#eef8ff',card:'#ffffff',text:'#14364d',muted:'#526777',verse:'#17364e',accent:'#1858a4',icon:'#1858a4'},
 ocean:{name:'اقیانوس',group:'soft',bg:'#e8f5f7',card:'#fbffff',text:'#103e49',muted:'#49666c',verse:'#143d49',accent:'#006b83',icon:'#006b83'},
 forest:{name:'جنگل',group:'soft',bg:'#ecf3ec',card:'#fefffb',text:'#23432e',muted:'#526753',verse:'#284432',accent:'#316547',icon:'#316547'},
 royal:{name:'بنفش سلطنتی',group:'soft',bg:'#f0ecf8',card:'#fffaff',text:'#382454',muted:'#6a5779',verse:'#35234d',accent:'#703da0',icon:'#703da0'},
 sand:{name:'شن گرم',group:'soft',bg:'#f7efe2',card:'#fffaf0',text:'#4b3829',muted:'#76604b',verse:'#4b3829',accent:'#885124',icon:'#885124'},
 rose:{name:'گل رز',group:'soft',bg:'#f9edf1',card:'#fffafc',text:'#562b3b',muted:'#785766',verse:'#542b39',accent:'#a53261',icon:'#a53261'},
 midnight:{name:'نیمه‌شب',group:'dark',bg:'#091522',card:'#142b3c',text:'#f0f6fc',muted:'#b1c6d8',verse:'#f2f1e5',accent:'#76c5ea',icon:'#76c5ea'},
 sepia:{name:'مطالعه سپیا',group:'soft',bg:'#eee2c8',card:'#faf0db',text:'#403323',muted:'#6f5b3e',verse:'#433321',accent:'#785326',icon:'#785326'},
 sapphire:{name:'آبی زنده',group:'vivid',bg:'#adc8ff',card:'#f3f6ff',text:'#11274f',muted:'#354d73',verse:'#142e54',accent:'#1944d8',icon:'#1944d8'},
 emerald:{name:'زمردی',group:'vivid',bg:'#8addc3',card:'#eefff7',text:'#073c31',muted:'#255648',verse:'#093d31',accent:'#00724f',icon:'#00724f'},
 sunset:{name:'غروب نارنجی',group:'vivid',bg:'#ffc082',card:'#fff5e9',text:'#4a2309',muted:'#734323',verse:'#4c290e',accent:'#b74509',icon:'#b74509'},
 orchid:{name:'ارکیده',group:'vivid',bg:'#d0afff',card:'#f9f1ff',text:'#331551',muted:'#593b70',verse:'#41195b',accent:'#8031c2',icon:'#8031c2'},
 berry:{name:'تمشکی',group:'vivid',bg:'#ffa8bc',card:'#fff0f4',text:'#57122b',muted:'#7b344d',verse:'#4f1b30',accent:'#bb1b57',icon:'#bb1b57'},
 aurora:{name:'شب ارغوانی',group:'dark',bg:'#131034',card:'#272250',text:'#faf5ff',muted:'#d0bfea',verse:'#fff5e4',accent:'#efc759',icon:'#d6b5ff'}
};
const NEW={
 titaniumNatural:{name:'Titanium Natural',group:'modern',bg:'#ebe7df',card:'#faf8f4',text:'#37332e',muted:'#777067',verse:'#403a33',accent:'#7d725f',icon:'#6b6254'},
 titaniumBlue:{name:'Titanium Blue',group:'modern',bg:'#dde8f1',card:'#f7fbff',text:'#183044',muted:'#617485',verse:'#1c3549',accent:'#4d789a',icon:'#46789e'},
 silverGlass:{name:'Silver Glass',group:'modern',bg:'#e9eef3',card:'#fbfdff',text:'#1f2c37',muted:'#6f7c88',verse:'#263643',accent:'#71879b',icon:'#607b95'},
 roseGlass:{name:'Rose Glass',group:'modern',bg:'#f4e7eb',card:'#fff9fb',text:'#4c2733',muted:'#84626c',verse:'#542c38',accent:'#ae6179',icon:'#b45777'},
 galaxyNavy:{name:'Galaxy Navy',group:'modern',bg:'#e3ebf7',card:'#f8fbff',text:'#122844',muted:'#586b82',verse:'#17304e',accent:'#315c94',icon:'#315c94'},
 galaxyMint:{name:'Galaxy Mint',group:'modern',bg:'#e1f3ec',card:'#f7fffc',text:'#123a2f',muted:'#527266',verse:'#183f34',accent:'#3c8e78',icon:'#26876d'},
 galaxyViolet:{name:'Galaxy Violet',group:'modern',bg:'#ede8f8',card:'#fbf9ff',text:'#352456',muted:'#6a5d82',verse:'#3b2a5c',accent:'#7557b7',icon:'#7959c6'},
 sandstone:{name:'Sandstone',group:'modern',bg:'#eee7dd',card:'#fffaf3',text:'#45382e',muted:'#76685c',verse:'#4a3a2e',accent:'#9b704e',icon:'#916544'},
 iceBlue:{name:'Ice Blue',group:'modern',bg:'#e3f3fa',card:'#f9fdff',text:'#143544',muted:'#587482',verse:'#183b4b',accent:'#3286a5',icon:'#2786aa'},
 springGreen:{name:'Spring Green',group:'modern',bg:'#e8f4e8',card:'#fbfffb',text:'#20442b',muted:'#637866',verse:'#254b30',accent:'#4d8a58',icon:'#3e8d4d'},
 lavenderAir:{name:'Lavender Air',group:'modern',bg:'#f0ebfa',card:'#fcfaff',text:'#3f315d',muted:'#746889',verse:'#453663',accent:'#8b6fbd',icon:'#8e6bc6'},
 peachCloud:{name:'Peach Cloud',group:'modern',bg:'#fae9de',card:'#fffaf7',text:'#552f22',muted:'#89685c',verse:'#5b3426',accent:'#c07152',icon:'#c86c4a'},
 oledBlack:{name:'OLED Black',group:'dark',bg:'#000000',card:'#0b0c0f',text:'#f8fafc',muted:'#a2a8b1',verse:'#fffdf7',accent:'#4aa8ff',icon:'#70bdff'},
 graphiteDark:{name:'Graphite Dark',group:'dark',bg:'#101214',card:'#1a1d21',text:'#f5f7fa',muted:'#abb3bf',verse:'#ffffff',accent:'#8b97a8',icon:'#a7b4c4'},
 deepNavy:{name:'Deep Navy',group:'dark',bg:'#06111f',card:'#0d2238',text:'#eff7ff',muted:'#a5bdd1',verse:'#ffffff',accent:'#4ca4ff',icon:'#72b8ff'},
 darkEmerald:{name:'Dark Emerald',group:'dark',bg:'#061b18',card:'#0d2c27',text:'#edfff9',muted:'#a7c9c0',verse:'#fffef8',accent:'#43d3a5',icon:'#63e0b8'},
 purpleNight:{name:'Purple Night',group:'dark',bg:'#120b22',card:'#211537',text:'#f8f1ff',muted:'#c6b5dc',verse:'#fff8eb',accent:'#a77cf5',icon:'#bd9afa'},
 warmNight:{name:'Warm Night',group:'dark',bg:'#17110d',card:'#281e17',text:'#fff7ee',muted:'#c8b6a6',verse:'#fff3df',accent:'#d4a15d',icon:'#e2b877'}
};
const PRESETS={...OLD,...NEW};

const FA_FONTS={
 vazirmatn:{name:'Vazirmatn',stack:'Vazirmatn,Tahoma,sans-serif'},
 notoNaskh:{name:'Noto Naskh Arabic',stack:'"Noto Naskh Arabic",Tahoma,serif'},
 notoSans:{name:'Noto Sans Arabic',stack:'"Noto Sans Arabic",Tahoma,sans-serif'},
 notoKufi:{name:'Noto Kufi Arabic',stack:'"Noto Kufi Arabic",Tahoma,sans-serif'},
 amiri:{name:'Amiri',stack:'Amiri,Tahoma,serif'},
 lalezar:{name:'Lalezar',stack:'Lalezar,Tahoma,sans-serif'},
 changa:{name:'Changa',stack:'Changa,Tahoma,sans-serif'},
 reem:{name:'Reem Kufi',stack:'"Reem Kufi",Tahoma,sans-serif'},
 cairo:{name:'Cairo',stack:'Cairo,Tahoma,sans-serif'},
 tajawal:{name:'Tajawal',stack:'Tajawal,Tahoma,sans-serif'},
 baloo:{name:'Baloo Bhaijaan 2',stack:'"Baloo Bhaijaan 2",Tahoma,sans-serif'},
 markazi:{name:'Markazi Text',stack:'"Markazi Text",Tahoma,serif'}
};
const LATIN_FONTS={
 inter:{name:'Inter',stack:'Inter,system-ui,sans-serif'},
 roboto:{name:'Roboto',stack:'Roboto,Arial,sans-serif'},
 openSans:{name:'Open Sans',stack:'"Open Sans",Arial,sans-serif'},
 montserrat:{name:'Montserrat',stack:'Montserrat,Arial,sans-serif'},
 poppins:{name:'Poppins',stack:'Poppins,Arial,sans-serif'},
 nunito:{name:'Nunito Sans',stack:'"Nunito Sans",Arial,sans-serif'},
 lora:{name:'Lora',stack:'Lora,Georgia,serif'},
 merriweather:{name:'Merriweather',stack:'Merriweather,Georgia,serif'},
 playfair:{name:'Playfair Display',stack:'"Playfair Display",Georgia,serif'},
 sourceSans:{name:'Source Sans 3',stack:'"Source Sans 3",Arial,sans-serif'},
 raleway:{name:'Raleway',stack:'Raleway,Arial,sans-serif'},
 ubuntu:{name:'Ubuntu',stack:'Ubuntu,Arial,sans-serif'}
};

let saved=null;
try{saved=JSON.parse(localStorage.getItem(STORE)||'null')}catch(_){}
let state=Object.assign({
  preset:'hope',group:'all',mode:'manual',dayTheme:'hope',nightTheme:'oledBlack',dayStart:'07:00',nightStart:'19:00',
  faFont:'vazirmatn',latinFont:'inter',fontSize:100,
  reader:false,readerMode:'paper',
  custom:false,customColors:null,accentIntensity:100,textIntensity:100,iconIntensity:100,depth:8,glow:18
},saved&&typeof saved==='object'?saved:{});

function hex(v,fallback='#000000'){return /^#[0-9a-f]{6}$/i.test(String(v||''))?String(v).toLowerCase():fallback}
function rgb(h){h=hex(h).slice(1);return[0,2,4].map(i=>parseInt(h.slice(i,i+2),16))}
function toHex([r,g,b]){return'#'+[r,g,b].map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join('')}
function mix(a,b,p){const A=rgb(a),B=rgb(b),t=Math.max(0,Math.min(1,p));return toHex(A.map((x,i)=>x+(B[i]-x)*t))}
function luminance(h){return rgb(h).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0)}
function contrast(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function ink(bg){return contrast('#ffffff',bg)>=contrast('#000000',bg)?'#ffffff':'#000000'}
function intensity(color,neutral,percent){return mix(neutral,color,Math.max(0,Math.min(150,Number(percent)||100))/100>1?1:Math.max(0,Math.min(100,Number(percent)||100))/100)}
function isDark(p){return luminance(p.card)<.2}
function currentPreset(){
  if(state.custom&&state.customColors)return Object.assign({name:'تم شخصی',group:'custom'},state.customColors);
  return PRESETS[state.preset]||PRESETS.hope;
}
function timeMinutes(v){const m=String(v||'').match(/^(\d{2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):0}
function scheduledTheme(){
  const now=new Date(),n=now.getHours()*60+now.getMinutes(),day=timeMinutes(state.dayStart),night=timeMinutes(state.nightStart);
  const dayNow=day<night?(n>=day&&n<night):(n>=day||n<night);
  return dayNow?state.dayTheme:state.nightTheme;
}
function resolvedThemeId(){
  if(state.mode==='system'){
    const dark=matchMedia?.('(prefers-color-scheme: dark)').matches;
    return dark?state.nightTheme:state.dayTheme;
  }
  if(state.mode==='auto')return scheduledTheme();
  return state.preset;
}
function activePalette(){
  if(state.mode!=='manual'&&!state.custom){
    const id=resolvedThemeId();return PRESETS[id]||PRESETS.hope;
  }
  return currentPreset();
}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch(_){}}
function apply(){
  const base=activePalette();
  const text=intensity(base.text,base.card,state.textIntensity);
  const accent=intensity(base.accent,base.card,state.accentIntensity);
  const icon=intensity(base.icon||base.accent,base.card,state.iconIntensity);
  const fa=FA_FONTS[state.faFont]||FA_FONTS.vazirmatn,latin=LATIN_FONTS[state.latinFont]||LATIN_FONTS.inter;
  root.style.setProperty('--ui-bg',base.bg);root.style.setProperty('--ui-card',base.card);root.style.setProperty('--ui-text',text);
  root.style.setProperty('--ui-muted',base.muted);root.style.setProperty('--ui-verse',base.verse);root.style.setProperty('--ui-accent',accent);root.style.setProperty('--ui-icon',icon);
  root.style.setProperty('--ui-line',base.muted+'55');root.style.setProperty('--ui-button-ink',ink(accent));root.style.setProperty('--ui-font-fa',fa.stack);root.style.setProperty('--ui-font-latin',latin.stack);
  root.style.setProperty('--ui-scale',String((Number(state.fontSize)||100)/100));root.style.setProperty('--ui-depth',(Number(state.depth)||8)+'px');root.style.setProperty('--ui-glow',(Number(state.glow)||18)+'%');
  root.style.colorScheme=isDark(base)?'dark':'light';
  const meta=$('meta[name="theme-color"]');if(meta)meta.setAttribute('content',base.bg);

  $('#faFont').value=state.faFont;$('#latinFont').value=state.latinFont;$('#fontSize').value=String(state.fontSize);$('#fontSizeOut').textContent=state.fontSize+'%';
  $('#accentIntensity').value=String(state.accentIntensity);$('#accentIntensityOut').textContent=state.accentIntensity+'%';
  $('#textIntensity').value=String(state.textIntensity);$('#textIntensityOut').textContent=state.textIntensity+'%';
  $('#iconIntensity').value=String(state.iconIntensity);$('#iconIntensityOut').textContent=state.iconIntensity+'%';
  $('#buttonDepth').value=String(state.depth);$('#buttonDepthOut').textContent=state.depth+'px';
  $('#buttonGlow').value=String(state.glow);$('#buttonGlowOut').textContent=state.glow+'%';
  $('#readerToggle').checked=!!state.reader;
  const reader=$('#readerDemo');if(reader){reader.classList.toggle('reader-on',!!state.reader);reader.dataset.reader=state.readerMode}
  $('#readerOptions').hidden=!state.reader;$$('[data-reader-mode]').forEach(b=>b.classList.toggle('active',b.dataset.readerMode===state.readerMode));
  $$('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
  $('#scheduleBox').hidden=state.mode!=='auto'&&state.mode!=='system';
  $('#dayStart').value=state.dayStart;$('#nightStart').value=state.nightStart;$('#dayTheme').value=state.dayTheme;$('#nightTheme').value=state.nightTheme;
  const rid=resolvedThemeId(),auto=$('#autoStatus');if(auto)auto.textContent=state.mode==='manual'?'حالت دستی فعال است':state.mode==='system'?'طبق حالت روشن/تیره گوشی → '+(PRESETS[rid]?.name||rid):'طبق ساعت دستگاه → '+(PRESETS[rid]?.name||rid);
  const ratio=Math.min(contrast(text,base.bg),contrast(text,base.card)),read=$('#readability');if(read){read.textContent=ratio>=4.5?'خوانایی مناسب ✓  '+ratio.toFixed(1)+':1':'کنتراست متن کم است  '+ratio.toFixed(1)+':1';read.classList.toggle('bad',ratio<4.5)}
  setBuilderValues(base);
  $$('[data-theme-id]').forEach(b=>b.setAttribute('aria-pressed',String(!state.custom&&b.dataset.themeId===state.preset)));
  window.NH7_ICON_SYSTEM_V510?.decorate?.();
  persist();
}
function setBuilderValues(p){
  const map={bg:'customBg',card:'customCard',accent:'customAccent',text:'customText',verse:'customVerse',icon:'customIcon'};
  for(const [k,id] of Object.entries(map)){const n=$('#'+id);if(n&&!n.matches(':focus'))n.value=hex(p[k]||p.accent)}
}
function themeOptions(filterDark=null){
  return Object.entries(PRESETS).filter(([,p])=>filterDark===null||isDark(p)===filterDark).map(([id,p])=>'<option value="'+id+'">'+p.name+'</option>').join('');
}
function renderThemes(){
  const host=$('#themeGrid');if(!host)return;
  const entries=Object.entries(PRESETS).filter(([id,p])=>{
    if(state.group==='all')return true;
    if(state.group==='new')return Object.hasOwn(NEW,id);
    if(state.group==='current')return Object.hasOwn(OLD,id);
    return p.group===state.group;
  });
  host.innerHTML=entries.map(([id,p])=>'<button type="button" class="theme-card tactile-theme" data-theme-id="'+id+'" aria-pressed="'+String(!state.custom&&state.preset===id)+'" style="--sw-bg:'+p.bg+';--sw-card:'+p.card+';--sw-text:'+p.text+';--sw-accent:'+p.accent+'"><span class="theme-preview"><i></i><b>Aa</b></span><strong>'+p.name+'</strong>'+(Object.hasOwn(NEW,id)?'<em class="new-pill">NEW</em>':'')+'</button>').join('');
}
function syncCustomFromInputs(){
  const base=currentPreset();
  state.custom=true;
  state.mode='manual';
  state.customColors={
    bg:hex($('#customBg').value,base.bg),card:hex($('#customCard').value,base.card),text:hex($('#customText').value,base.text),
    muted:base.muted,verse:hex($('#customVerse').value,base.verse),accent:hex($('#customAccent').value,base.accent),icon:hex($('#customIcon').value,base.icon||base.accent)
  };
  apply();
}
function resetCustom(){
  state.custom=false;state.customColors=null;state.preset='hope';state.mode='manual';state.accentIntensity=100;state.textIntensity=100;state.iconIntensity=100;apply();renderThemes();
}
let timer=0;
function toast(msg){const n=$('#toast');if(!n)return;n.textContent=msg;n.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>n.classList.remove('show'),1600)}
let dlTimer=0;
function startDownloadDemo(){
  const b=$('#downloadDemo');if(!b||b.dataset.busy==='1')return;
  b.dataset.busy='1';b.classList.remove('complete');b.style.setProperty('--download-p','0%');
  const label=$('#downloadLabel');let p=0;
  if(label)label.textContent='0%';
  b.dataset.nh7Icon='download';window.NH7_ICON_SYSTEM_V510?.decorate?.(b);
  clearInterval(dlTimer);
  dlTimer=setInterval(()=>{
    p=Math.min(100,p+Math.ceil(Math.random()*9+4));b.style.setProperty('--download-p',p+'%');if(label)label.textContent=p<100?p+'%':'دانلود شد ✓';
    if(p>=100){clearInterval(dlTimer);b.dataset.busy='0';b.classList.add('complete');b.dataset.nh7Icon='check';window.NH7_ICON_SYSTEM_V510?.decorate?.(b);toast('نمونه: دانلود کامل شد ✓')}
  },120);
}
function bind(){
  document.addEventListener('pointerdown',e=>{const b=e.target.closest('.tactile');if(b)b.classList.add('is-pressed')},{passive:true});
  const release=e=>{const b=e.target.closest?.('.tactile');if(b)b.classList.remove('is-pressed');$$('.tactile.is-pressed').forEach(x=>x.classList.remove('is-pressed'))};
  document.addEventListener('pointerup',release,{passive:true});document.addEventListener('pointercancel',release,{passive:true});document.addEventListener('pointerleave',release,{passive:true});
  document.addEventListener('click',e=>{
    const m=e.target.closest('[data-mode]');if(m){state.mode=m.dataset.mode;state.custom=false;apply();return}
    const g=e.target.closest('[data-theme-group]');if(g){state.group=g.dataset.themeGroup;$$('[data-theme-group]').forEach(b=>b.classList.toggle('active',b===g));renderThemes();apply();return}
    const t=e.target.closest('[data-theme-id]');if(t){state.preset=t.dataset.themeId;state.custom=false;state.mode='manual';renderThemes();apply();toast('تم در Preview اعمال شد');return}
    const r=e.target.closest('[data-reader-mode]');if(r){state.readerMode=r.dataset.readerMode;apply();toast('حالت مطالعه تغییر کرد');return}
    if(e.target.closest('[data-save-custom]')){syncCustomFromInputs();toast('تم شخصی فقط در Preview ذخیره شد');return}
    if(e.target.closest('[data-reset-custom]')){resetCustom();toast('Preview به تم امید نو برگشت');return}
    if(e.target.closest('#downloadDemo')){startDownloadDemo();return}
    const demo=e.target.closest('[data-demo-action]');if(demo)toast('فشار کلید: فرو رفتن و برگشت بدون چشمک');
  });
  $('#readerToggle').addEventListener('change',e=>{state.reader=e.target.checked;apply();toast(state.reader?'Book Reader روشن شد':'Book Reader خاموش شد')});
  $('#faFont').addEventListener('change',e=>{state.faFont=e.target.value;apply()});
  $('#latinFont').addEventListener('change',e=>{state.latinFont=e.target.value;apply()});
  $('#fontSize').addEventListener('input',e=>{state.fontSize=Number(e.target.value);apply()});
  for(const id of ['accentIntensity','textIntensity','iconIntensity','buttonDepth','buttonGlow']){
    $('#'+id).addEventListener('input',e=>{
      const key={accentIntensity:'accentIntensity',textIntensity:'textIntensity',iconIntensity:'iconIntensity',buttonDepth:'depth',buttonGlow:'glow'}[id];
      state[key]=Number(e.target.value);apply();
    });
  }
  for(const id of ['customBg','customCard','customAccent','customText','customVerse','customIcon'])$('#'+id).addEventListener('input',syncCustomFromInputs);
  $('#dayStart').addEventListener('change',e=>{state.dayStart=e.target.value;apply()});$('#nightStart').addEventListener('change',e=>{state.nightStart=e.target.value;apply()});
  $('#dayTheme').addEventListener('change',e=>{state.dayTheme=e.target.value;apply()});$('#nightTheme').addEventListener('change',e=>{state.nightTheme=e.target.value;apply()});
  try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(state.mode==='system')apply()})}catch(_){}
}
function populate(){
  $('#faFont').innerHTML=Object.entries(FA_FONTS).map(([id,f])=>'<option value="'+id+'">'+f.name+'</option>').join('');
  $('#latinFont').innerHTML=Object.entries(LATIN_FONTS).map(([id,f])=>'<option value="'+id+'">'+f.name+'</option>').join('');
  $('#dayTheme').innerHTML=themeOptions(false);$('#nightTheme').innerHTML=themeOptions(true);
  renderThemes();
}
function start(){populate();bind();apply();setInterval(()=>{if(state.mode==='auto')apply()},60000)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
window.NH7_APPEARANCE_STUDIO_V512={version:'5.1.2-preview',state:()=>JSON.parse(JSON.stringify(state)),presets:PRESETS,fonts:{fa:FA_FONTS,latin:LATIN_FONTS},apply};
})();