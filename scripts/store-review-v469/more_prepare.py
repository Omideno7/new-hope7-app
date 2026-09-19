from pathlib import Path
import subprocess,re
BASE='2bde658268eeaed0e7873c83aa7fb54c1d37fc8f'
def base(path):return subprocess.check_output(['git','show',BASE+':'+path],text=True)
s=base('js/app.js')
a=s.index('async function more(){');b=s.index('\nasync function fetchMyQuestionsCloud',a)
old=s[a:b];new=old.replace(".join('')}</div>`;", ".join('')}</div>`;\n  mountMoreReviewV469(view.querySelector('[data-more-navigation456]'),{language:state.lang});")
assert new!=old
s="import {mountMoreReviewV469} from './nh7-store-review-v469.js?v=4.6.9';\n"+s.replace(old,new,1)
Path('js/app.js').write_text(s)
idx=base('index.html').replace('js/app.js?v=4.6.8','js/app.js?v=4.6.9').replace('service-worker.js?v=4.6.8','service-worker.js?v=4.6.9')
idx=idx.replace('</head>','  <link rel="stylesheet" href="css/nh7-store-review-v469.css?v=4.6.9" />\n</head>');Path('index.html').write_text(idx)
Path('service-worker.js').write_text(base('service-worker.js').replace('sw-release-core-v403.js?v=4.6.8','sw-release-core-v403.js?v=4.6.9'))
s=base('sw-release-core-v403.js').replace('4.6.8-school-drafts','4.6.9-store-review').replace('nh7-release-core-v468-school-drafts','nh7-release-core-v469-store-review')
i=s.index('];',s.index('const NH7_RELEASE_ASSETS=['));s=s[:i]+", './js/nh7-store-review-v469.js', './css/nh7-store-review-v469.css'"+s[i:]
i=s.index(']);',s.index('const NH7_READER_RELEASE_PATHS_V452'));s=s[:i]+', "js/nh7-store-review-v469.js", "css/nh7-store-review-v469.css"'+s[i:];Path('sw-release-core-v403.js').write_text(s)
links='\n'.join(re.findall(r'<link[^>]*rel="stylesheet"[^>]*>',idx))
Path('store-review-preview.html').write_text('''<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; connect-src 'none'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'"><title>New Hope 7 — More</title>'''+links+'''<style>body{margin:0}.preview469{max-width:600px;margin:auto;padding:20px 14px 36px}.preview469 header{display:flex;align-items:center;gap:12px}.preview469 img{width:52px;height:52px;object-fit:contain;border-radius:14px;background:white}.preview469 h1{font-size:1.3rem;color:var(--nh7-studio-text,var(--ink))}.preview469>p{font-size:.82rem;line-height:1.8;color:var(--nh7-studio-text,var(--ink))}.preview469 #view{padding:0!important;min-height:0!important}.preview469 button[disabled]{opacity:.65}</style><script src="js/nh7-theme-studio-v453.js?v=4.5.7" defer></script><script src="js/nh7-store-review-preview-v469.js?v=4.6.9" type="module"></script></head><body><div class="preview469"><header><img src="assets/new-hope7-logo-192.png" alt="New Hope 7"><h1 id="moreTitle469"></h1></header><p id="moreHelp469"></p><main id="view"></main></div></body></html>''')
# This preview renders the actual More function. Other routes are visibly disabled.
preview=r'''import {mountMoreReviewV469} from './nh7-store-review-v469.js?v=4.6.9';
const requested=new URLSearchParams(location.search).get('lang');
let language=['fa','en','hr'].includes(requested)?requested:'fa';
const state={lang:language},view=document.getElementById('view');
const labels={fa:{audio:'پیام‌های صوتی',meetings:'جلسات',salvation:'نیاز به نجات',qna:'پرسش و پاسخ',account:'حساب من',about:'دربارهٔ ما',settings:'تنظیمات'},en:{audio:'Audio messages',meetings:'Meetings',salvation:'Need salvation',qna:'Questions & answers',account:'My account',about:'About',settings:'Settings'},hr:{audio:'Audio poruke',meetings:'Sastanci',salvation:'Trebam spasenje',qna:'Pitanja i odgovori',account:'Moj račun',about:'O nama',settings:'Postavke'}};
const tr=k=>labels[language][k]||k;
const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tile=(route,icon,title)=>`<button type="button" class="tile" data-go="${html(route)}" disabled><span class="emoji">${icon}</span><strong>${html(title)}</strong></button>`;
document.documentElement.lang=language;document.documentElement.dir=language==='fa'?'rtl':'ltr';
document.getElementById('moreTitle469').textContent=language==='fa'?'بیشتر':language==='hr'?'Više':'More';
document.getElementById('moreHelp469').textContent=language==='fa'?'پیش‌نمایش منوی بیشتر؛ فقط گزینهٔ «شرکت در نظرسنجی» فعال است و فروشگاه واقعی را باز می‌کند.':language==='hr'?'Pretpregled izbornika Više: aktivna je samo opcija za recenziju koja otvara stvarnu trgovinu.':'More-menu preview: only the review option is active. It opens the real app store.';
'''
Path('js/nh7-store-review-preview-v469.js').write_text(preview+new+'\nmore();\n')
print('Prepared direct More-menu entry. Settings restored exactly to production. Preview has no theme/language selectors.')
