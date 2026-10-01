/* New Hope 7 — Appearance Lab v5.1.1 real preview
 * Preview-only state. No Production writes, no account data, no network calls.
 */
(()=>{'use strict';
if(window.__NH7_APPEARANCE_PREVIEW_V511__)return;
window.__NH7_APPEARANCE_PREVIEW_V511__=true;

const root=document.documentElement;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

const CURRENT={
 hope:{name:'امید نو',group:'soft',bg:'#eef8ff',card:'#ffffff',text:'#14364d',muted:'#526777',verse:'#17364e',accent:'#1858a4'},
 ocean:{name:'اقیانوس',group:'soft',bg:'#e8f5f7',card:'#fbffff',text:'#103e49',muted:'#49666c',verse:'#143d49',accent:'#006b83'},
 forest:{name:'جنگل',group:'soft',bg:'#ecf3ec',card:'#fefffb',text:'#23432e',muted:'#526753',verse:'#284432',accent:'#316547'},
 royal:{name:'بنفش سلطنتی',group:'soft',bg:'#f0ecf8',card:'#fffaff',text:'#382454',muted:'#6a5779',verse:'#35234d',accent:'#703da0'},
 sand:{name:'شن گرم',group:'soft',bg:'#f7efe2',card:'#fffaf0',text:'#4b3829',muted:'#76604b',verse:'#4b3829',accent:'#885124'},
 rose:{name:'گل رز',group:'soft',bg:'#f9edf1',card:'#fffafc',text:'#562b3b',muted:'#785766',verse:'#542b39',accent:'#a53261'},
 sepia:{name:'مطالعه سپیا',group:'soft',bg:'#eee2c8',card:'#faf0db',text:'#403323',muted:'#6f5b3e',verse:'#433321',accent:'#785326'},
 sapphire:{name:'آبی زنده',group:'vivid',bg:'#adc8ff',card:'#f3f6ff',text:'#11274f',muted:'#354d73',verse:'#142e54',accent:'#1944d8'},
 emerald:{name:'زمردی',group:'vivid',bg:'#8addc3',card:'#eefff7',text:'#073c31',muted:'#255648',verse:'#093d31',accent:'#00724f'},
 sunset:{name:'غروب نارنجی',group:'vivid',bg:'#ffc082',card:'#fff5e9',text:'#4a2309',muted:'#734323',verse:'#4c290e',accent:'#b74509'},
 orchid:{name:'ارکیده',group:'vivid',bg:'#d0afff',card:'#f9f1ff',text:'#331551',muted:'#593b70',verse:'#41195b',accent:'#8031c2'},
 berry:{name:'تمشکی',group:'vivid',bg:'#ffa8bc',card:'#fff0f4',text:'#57122b',muted:'#7b344d',verse:'#4f1b30',accent:'#bb1b57'},
 midnight:{name:'نیمه‌شب',group:'dark',bg:'#091522',card:'#142b3c',text:'#f0f6fc',muted:'#b1c6d8',verse:'#f2f1e5',accent:'#76c5ea'},
 aurora:{name:'شب ارغوانی',group:'dark',bg:'#131034',card:'#272250',text:'#faf5ff',muted:'#d0bfea',verse:'#fff5e4',accent:'#efc759'}
};
const NEW={
 titanium:{name:'تیتانیوم',group:'modern',bg:'#e7e7e5',card:'#f8f8f7',text:'#262626',muted:'#6b6b68',verse:'#2d2d2b',accent:'#6c7077'},
 natural:{name:'تیتانیوم طبیعی',group:'modern',bg:'#eee9df',card:'#fbf8f2',text:'#40382f',muted:'#776c60',verse:'#463c32',accent:'#8b7355'},
 galaxyNavy:{name:'Galaxy Navy',group:'modern',bg:'#e6edf8',card:'#f8fbff',text:'#14243d',muted:'#54657d',verse:'#172942',accent:'#315a8f'},
 galaxyMint:{name:'Galaxy Mint',group:'modern',bg:'#e2f3ed',card:'#f7fffc',text:'#14392f',muted:'#527267',verse:'#183e34',accent:'#3b8e77'},
 galaxyViolet:{name:'Galaxy Violet',group:'modern',bg:'#eee9fa',card:'#fbf9ff',text:'#342257',muted:'#675b81',verse:'#3b285f',accent:'#7658b8'},
 oled:{name:'OLED Black',group:'dark',bg:'#000000',card:'#0c0d10',text:'#f8fafc',muted:'#a1a7b0',verse:'#fffdf7',accent:'#4ca8ff'},
 graphite:{name:'Graphite Dark',group:'dark',bg:'#101214',card:'#1a1d21',text:'#f5f7fa',muted:'#abb3bf',verse:'#fff',accent:'#8b97a8'},
 deepNavy:{name:'Deep Navy',group:'dark',bg:'#06111f',card:'#0d2238',text:'#eff7ff',muted:'#a5bdd1',verse:'#fff',accent:'#4ca4ff'},
 darkEmerald:{name:'Dark Emerald',group:'dark',bg:'#061b18',card:'#0d2c27',text:'#edfff9',muted:'#a7c9c0',verse:'#fffef8',accent:'#43d3a5'},
 warmNight:{name:'Warm Night',group:'dark',bg:'#17110d',card:'#261d17',text:'#fff7ee',muted:'#c7b6a6',verse:'#fff3df',accent:'#d4a15d'}
};
const PRESETS={...CURRENT,...NEW};
const FA_FONTS={
 system:'Tahoma,"Geeza Pro",Arial,sans-serif',
 vazirmatn:'"NH7 Vazirmatn",Tahoma,sans-serif',
 naskh:'"NH7 Noto Naskh",Tahoma,serif',
 estedad:'"NH7 Estedad",Tahoma,sans-serif',
 amiri:'"NH7 Amiri",Tahoma,serif',
 markazi:'"NH7 Markazi",Tahoma,serif'
};
const LATIN_FONTS={
 system:'system-ui,-apple-system,"Segoe UI",Arial,sans-serif',
 inter:'"NH7 Inter",Arial,sans-serif',
 lora:'"NH7 Lora",Georgia,serif',
 nunito:'"NH7 Nunito",Arial,sans-serif',
 classic:'Georgia,"Times New Roman",serif'
};
let state={preset:'hope',group:'all',mode:'light',faFont:'system',latinFont:'system',size:'100',textColor:null,reader:false,readerMode:'paper'};

function lum(hex){
 const a=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 return .2126*a[0]+.7152*a[1]+.0722*a[2];
}
function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function ink(bg){return contrast('#ffffff',bg)>=contrast('#000000',bg)?'#ffffff':'#000000'}
function lineFrom(hex){return hex+'55'}
function isDarkPreset(p){return lum(p.card)<.2}
function selected(){
 const p=PRESETS[state.preset]||PRESETS.hope;
 return {...p,text:state.textColor||p.text};
}
function apply(){
 const p=selected(),fa=FA_FONTS[state.faFont]||FA_FONTS.system,latin=LATIN_FONTS[state.latinFont]||LATIN_FONTS.system;
 root.style.setProperty('--p-bg',p.bg);root.style.setProperty('--p-card',p.card);root.style.setProperty('--p-text',p.text);root.style.setProperty('--p-muted',p.muted);root.style.setProperty('--p-verse',p.verse);root.style.setProperty('--p-accent',p.accent);root.style.setProperty('--p-line',lineFrom(p.muted));root.style.setProperty('--button-ink',ink(p.accent));root.style.setProperty('--p-font',fa);root.style.setProperty('--p-scale',String(Number(state.size)/100));
 root.style.colorScheme=isDarkPreset(p)?'dark':'light';
 const color=$('#textColor');if(color&&color.value.toLowerCase()!==p.text.toLowerCase())color.value=p.text;
 const ratio=Math.min(contrast(p.text,p.bg),contrast(p.text,p.card)),indicator=$('#contrastStatus');
 if(indicator){indicator.textContent=ratio>=4.5?'خوانایی متن مناسب ✓  '+ratio.toFixed(1)+':1':'کنتراست متن کم است  '+ratio.toFixed(1)+':1';indicator.classList.toggle('bad',ratio<4.5)}
 const reader=$('#readerDemo');if(reader){reader.classList.toggle('reader-on',state.reader);reader.dataset.readerMode=state.readerMode}
 $('#readerModes')?.toggleAttribute('hidden',!state.reader);
 $$('[data-reader-mode]').forEach(b=>b.classList.toggle('active',b.dataset.readerMode===state.readerMode));
 $$('[data-size]').forEach(b=>b.classList.toggle('active',b.dataset.size===state.size));
 $$('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
 $$('[data-theme-id]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeId===state.preset)));
 $('#readerToggle').checked=state.reader;
 $('#faFont').value=state.faFont;$('#latinFont').value=state.latinFont;
 document.body.dataset.dark=isDarkPreset(p)?'1':'0';
}
function makeThemeCards(){
 const host=$('#themeCards');if(!host)return;
 const entries=Object.entries(PRESETS).filter(([id,p])=>{
   if(state.group==='all')return true;
   if(state.group==='new')return Object.hasOwn(NEW,id);
   return p.group===state.group;
 });
 host.innerHTML=entries.map(([id,p])=>`<button type="button" class="theme-card pressable" data-theme-id="${id}" aria-pressed="${id===state.preset}" style="--sw-bg:${p.bg};--sw-card:${p.card};--sw-text:${p.text};--sw-accent:${p.accent}"><span class="theme-swatch"><i></i><b>Aa</b></span><strong>${p.name}</strong>${Object.hasOwn(NEW,id)?'<em>NEW</em>':''}</button>`).join('');
}
function bind(){
 document.addEventListener('click',e=>{
   const theme=e.target.closest('[data-theme-id]');if(theme){state.preset=theme.dataset.themeId;state.textColor=null;const p=PRESETS[state.preset];state.mode=isDarkPreset(p)?'dark':'light';makeThemeCards();apply();toast('تم فقط در Preview تغییر کرد');return}
   const tab=e.target.closest('[data-theme-group]');if(tab){state.group=tab.dataset.themeGroup;$$('[data-theme-group]').forEach(b=>b.classList.toggle('active',b===tab));makeThemeCards();apply();return}
   const size=e.target.closest('[data-size]');if(size){state.size=size.dataset.size;apply();return}
   const readerMode=e.target.closest('[data-reader-mode]');if(readerMode){state.readerMode=readerMode.dataset.readerMode;apply();return}
   const mode=e.target.closest('[data-mode]');if(mode){
     state.mode=mode.dataset.mode;
     const resolved=state.mode==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):state.mode;
     if(resolved==='dark'&&!isDarkPreset(PRESETS[state.preset]))state.preset='midnight';
     if(resolved==='light'&&isDarkPreset(PRESETS[state.preset]))state.preset='hope';
     state.textColor=null;makeThemeCards();apply();return
   }
   if(e.target.closest('[data-auto-text]')){const p=PRESETS[state.preset];state.textColor=contrast('#101820',p.card)>=contrast('#f8fafc',p.card)?'#101820':'#f8fafc';apply();return}
   const demo=e.target.closest('[data-demo-action]');if(demo)toast('این دکمه در نسخه واقعی همین فشار و برگشت را خواهد داشت');
 });
 $('#readerToggle')?.addEventListener('change',e=>{state.reader=e.target.checked;apply()});
 $('#faFont')?.addEventListener('change',e=>{state.faFont=e.target.value;apply()});
 $('#latinFont')?.addEventListener('change',e=>{state.latinFont=e.target.value;apply()});
 $('#textColor')?.addEventListener('input',e=>{state.textColor=e.target.value;apply()});
}
let toastTimer=0;
function toast(msg){const n=$('#toast');if(!n)return;n.textContent=msg;n.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('show'),1700)}
function start(){
 makeThemeCards();bind();window.NH7_ICON_SYSTEM_V510?.decorate?.();apply();
}
window.NH7_APPEARANCE_PREVIEW_V511={state:()=>({...state}),presets:PRESETS,apply};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();