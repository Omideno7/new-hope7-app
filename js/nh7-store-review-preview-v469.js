import {mountMoreReviewV469} from './nh7-store-review-v469.js?v=4.6.9';
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
async function more(){
  const destinations=[['audio','🎧'],['meetings','☎'],['salvation','✝'],['qna','❓'],['account','👤'],['about','ℹ'],['settings','⚙']];
  view.innerHTML=`<div class="grid" data-more-navigation456>${destinations.map(([route,icon])=>tile(route,icon,tr(route))).join('')}</div>`;
  mountMoreReviewV469(view.querySelector('[data-more-navigation456]'),{language:state.lang});
}

more();
