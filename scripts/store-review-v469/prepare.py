from pathlib import Path
import subprocess,re
BASE='2bde658268eeaed0e7873c83aa7fb54c1d37fc8f'
def base(p):return subprocess.check_output(['git','show',BASE+':'+p],text=True)
def change(s,a,b):
 assert s.count(a)==1,(a,s.count(a));return s.replace(a,b,1)
s=base('js/app.js')
s="import {mountStoreReviewV469} from './nh7-store-review-v469.js?v=4.6.9';\n"+s
s=change(s,'    <p class="muted small nh7-version-footer">','    <div id="nh7StoreReview469"></div>\n    <p class="muted small nh7-version-footer">')
s=change(s,"  $('#settingsLang').value=state.lang;","  mountStoreReviewV469($('#nh7StoreReview469'),{language:state.lang});\n  $('#settingsLang').value=state.lang;")
Path('js/app.js').write_text(s)
s=base('index.html').replace('js/app.js?v=4.6.8','js/app.js?v=4.6.9').replace('service-worker.js?v=4.6.8','service-worker.js?v=4.6.9')
s=change(s,'</head>','  <link rel="stylesheet" href="css/nh7-store-review-v469.css?v=4.6.9" />\n</head>');Path('index.html').write_text(s)
Path('service-worker.js').write_text(base('service-worker.js').replace('sw-release-core-v403.js?v=4.6.8','sw-release-core-v403.js?v=4.6.9'))
s=base('sw-release-core-v403.js').replace('4.6.8-school-drafts','4.6.9-store-review').replace('nh7-release-core-v468-school-drafts','nh7-release-core-v469-store-review')
i=s.index('];',s.index('const NH7_RELEASE_ASSETS=['));s=s[:i]+", './js/nh7-store-review-v469.js', './css/nh7-store-review-v469.css'"+s[i:]
i=s.index(']);',s.index('const NH7_READER_RELEASE_PATHS_V452'));s=s[:i]+', "js/nh7-store-review-v469.js", "css/nh7-store-review-v469.css"'+s[i:];Path('sw-release-core-v403.js').write_text(s)
# Preview loads only the actual review module + Theme Studio, never auth or School.
links='\n'.join(re.findall(r'<link[^>]*rel="stylesheet"[^>]*>',Path('index.html').read_text()))
preview='''<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; connect-src 'none'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'"><title>New Hope 7 — Review Preview</title>'''+links+'''<style>body{margin:0}.review-preview-shell{width:min(100%,590px);margin:auto;padding:24px 16px 42px}.review-preview-head{display:flex;align-items:center;gap:12px}.review-preview-head img{width:56px;height:56px;object-fit:contain;border-radius:16px;background:white}.review-preview-head h1{font-size:1.08rem;margin:0;color:var(--nh7-studio-text,var(--ink))}.review-preview-help{font-size:.83rem;line-height:1.8;color:var(--nh7-studio-text,var(--ink))}.review-preview-controls{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}.review-preview-controls label{display:grid;gap:6px;font-size:.8rem;color:var(--nh7-studio-text,var(--ink))}.review-preview-controls select{width:100%;min-height:44px;font:inherit;background:var(--nh7-studio-card,var(--card));color:var(--nh7-studio-text,var(--ink));border:1px solid var(--line);border-radius:12px;padding:8px}#reviewPreviewPath{font-size:.82rem;margin-top:24px;color:var(--nh7-studio-text,var(--ink))}.nh7-version-footer{text-align:center;font-size:.8rem;color:var(--nh7-studio-text,var(--ink))}</style><script src="js/nh7-theme-studio-v453.js?v=4.5.7" defer></script><script src="js/nh7-store-review-preview-v469.js?v=4.6.9" type="module"></script></head><body><main class="review-preview-shell"><header class="review-preview-head"><img src="assets/new-hope7-logo-192.png" alt="New Hope 7"><h1 id="reviewPreviewTitle"></h1></header><p id="reviewPreviewHelp" class="review-preview-help"></p><div class="review-preview-controls"><label><span id="reviewLangLabel"></span><select id="reviewPreviewLang"><option value="fa">فارسی</option><option value="en">English</option><option value="hr">Hrvatski</option></select></label><label><span id="reviewThemeLabel"></span><select id="reviewPreviewTheme"></select></label></div><p id="reviewPreviewPath"></p><div id="reviewPreviewHost"></div><p class="nh7-version-footer" dir="ltr">New Hope 7 v2.3.9.50</p></main></body></html>'''
Path('store-review-preview.html').write_text(preview)
Path('js/nh7-store-review-preview-v469.js').write_text(r'''// Preview-only controls. Not part of the production release.
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
''')
print('Prepared six runtime paths and two isolated preview paths. Main unchanged.')
