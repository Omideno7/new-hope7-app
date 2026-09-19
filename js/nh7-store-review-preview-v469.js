// Preview-only controls. Not part of the production release.
import {mountStoreReviewV469} from './nh7-store-review-v469.js?v=4.6.9';
const names={hope:['امید نو','New Hope','Nova nada'],ocean:['اقیانوس','Ocean','Ocean'],forest:['جنگل','Forest','Šuma'],royal:['سلطنتی','Royal','Kraljevska'],sand:['شن گرم','Warm sand','Topli pijesak'],rose:['گل رز','Rose','Ruža'],midnight:['نیمه‌شب','Midnight','Ponoć'],sepia:['سپیا','Sepia','Sepija'],sapphire:['آبی زنده','Vivid blue','Živopisna plava'],emerald:['زمردی','Emerald','Smaragdna'],sunset:['غروب','Sunset','Zalazak sunca'],orchid:['ارکیده','Orchid','Orhideja'],berry:['تمشکی','Berry','Bobičasta'],aurora:['شب ارغوانی','Aurora night','Ljubičasta noć']};
const $=s=>document.getElementById(s),studio=window.NH7ThemeStudioV453;
let language='fa',theme='hope';
function render(){
 const i=language==='fa'?0:language==='hr'?2:1,L=(...x)=>x[i];
 document.documentElement.lang=language;document.documentElement.dir=language==='fa'?'rtl':'ltr';
 try{localStorage.setItem('nh7_lang',language)}catch(_){}
 $('reviewPreviewTitle').textContent=L('پیش‌نمایش ثبت نظر و امتیاز','Rating & review preview','Pretpregled ocjena i recenzija');
 $('reviewPreviewHelp').textContent=L('این پیش‌نمایش فقط بخش جدید تنظیمات را نشان می‌دهد. دکمه، فروشگاه واقعی را باز می‌کند؛ برای آزمایش نیازی به ثبت نظر نیست.','This preview shows only the new Settings section. The button opens the real store; you do not need to submit a review to test it.','Ovaj pretpregled prikazuje samo novi odjeljak postavki. Gumb otvara stvarnu trgovinu; za test nije potrebno objaviti recenziju.');
 $('reviewLangLabel').textContent=L('زبان','Language','Jezik');$('reviewThemeLabel').textContent=L('تم','Theme','Tema');
 $('reviewPreviewPath').textContent=L('بیشتر ← تنظیمات','More → Settings','Više → Postavke');
 $('reviewPreviewTheme').replaceChildren(...Object.entries(names).map(([v,n])=>{const o=document.createElement('option');o.value=v;o.textContent=n[i];return o}));$('reviewPreviewTheme').value=theme;
 if(studio)studio.set({preset:theme,...studio.PRESETS[theme],fa:'vazirmatn',latin:'inter'});
 mountStoreReviewV469($('reviewPreviewHost'),{language});
}
$('reviewPreviewLang').onchange=e=>{language=e.target.value;render()};$('reviewPreviewTheme').onchange=e=>{theme=e.target.value;render()};render();
