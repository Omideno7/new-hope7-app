/* New Hope 7 Admin — organized dashboard and document-first layout v3.1.6 */
(()=>{'use strict';
const VERSION='3.1.6-ui-documents';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const E=v=>typeof h==='function'?h(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const items=[
 ['overview','📊',L('داشبورد','Dashboard','Nadzorna ploča'),L('نمای کلی و آمار سریع','Overview and quick statistics','Pregled i statistika')],
 ['requests','👤',L('درخواست‌ها','Requests','Zahtjevi'),L('ثبت‌نام‌ها و تأیید دسترسی','Registrations and approvals','Registracije i odobrenja')],
 ['students','🎓',L('دانشجویان','Students','Studenti'),L('پروفایل، فعالیت و پیشرفت','Profiles, activity and progress','Profili i napredak')],
 ['assignments','📝',L('تکالیف','Assignments','Zadaci'),L('بررسی و نمره‌دهی','Review and scoring','Pregled i ocjenjivanje')],
 ['schoolcontent','🏫',L('مدیریت مدرسه','School management','Upravljanje školom'),L('دروس، دوره‌ها و آزمون‌ها','Lessons, courses and exams','Lekcije i ispiti')],
 ['schoolaudio','🎧',L('صوت مدرسه','School audio','Audio škole'),L('آپلود فایل‌های صوتی درس‌ها','Upload lesson audio','Prijenos audio lekcija')],
 ['videos','🎬',L('ویدیوها','Videos','Videozapisi'),L('رسانه تصویری و رمزهای ورود','Visual media and access codes','Video i pristupni kodovi')],
 ['library','📚',L('کتاب‌ها و جزوه‌ها','Books and handouts','Knjige i materijali'),L('PDF/DOCX و کتاب خواندنی','PDF/DOCX and in-app books','PDF/DOCX i knjige')],
 ['certificates','🎨',L('مدارک و استودیو','Documents studio','Studio dokumenata'),L('طراحی، صدور و چاپ','Design, issue and print','Dizajn i izdavanje')],
 ['sermons','🎙',L('موعظه‌ها','Sermons','Propovijedi'),L('فایل‌های صوتی و دسته‌بندی','Audio and categories','Audio i kategorije')],
 ['notifications','🔔',L('اعلان‌ها','Notifications','Obavijesti'),L('ارسال و زمان‌بندی اعلان','Send and schedule','Slanje i raspored')],
 ['messages','📥',L('پیام‌ها','Messages','Poruke'),L('صندوق ورودی کاربران','User inbox','Korisnički pretinac')],
 ['qa','❓',L('پرسش و پاسخ','Q&A','Pitanja'),L('پرسش‌های کاربران','User questions','Pitanja korisnika')],
 ['meetings','☎',L('جلسات','Meetings','Sastanci'),L('لینک و اطلاعات جلسه','Meeting access details','Podaci sastanka')]
];
function menu(){return`<section class="panel-card"><div class="req-head"><div><h3>🧭 ${E(L('مرکز مدیریت','Management center','Centar upravljanja'))}</h3><p class="muted small">${E(L('برای ورود مستقیم به هر بخش روی کارت مربوطه بزنید.','Open any section directly from the cards below.','Otvorite odjeljak izravno karticom.'))}</p></div></div><div class="nh7-admin-menu-v316">${items.map(([tab,icon,title,sub])=>`<button type="button" onclick="setTab('${tab}')"><span class="emoji">${icon}</span><b>${E(title)}</b><small>${E(sub)}</small></button>`).join('')}</div></section>`}
function arrangeDocuments(){
  if(typeof activeTab==='undefined'||activeTab!=='certificates')return;
  const app=document.getElementById('adminApp');if(!app)return;
  let studio=app.querySelector('.nh7-doc-studio-v226,.doc-v225-studio');if(!studio)return;
  if(studio.closest('.nh7-doc-final-root-v316'))return;
  const root=document.createElement('div');root.className='nh7-doc-final-root-v316';studio.parentNode.insertBefore(root,studio);root.appendChild(studio);
  const details=document.createElement('details');details.className='nh7-doc-workflow-v316';
  const summary=document.createElement('summary');summary.textContent='📄 '+L('صدور، انتخاب و پرونده مدارک','Issue, select and document records','Izdavanje i evidencija dokumenata');
  const body=document.createElement('div');body.className='nh7-doc-workflow-body-v316';details.append(summary,body);root.appendChild(details);
  let node=root.nextSibling;while(node){const next=node.nextSibling;if(node.matches?.('.fab-refresh,.nh7-stable-final-v316'))break;body.appendChild(node);node=next}
  const intro=document.createElement('div');intro.className='notice';intro.textContent=L('استودیو مستقیماً روی پیش‌نمایش و مدرک صادرشده اثر می‌گذارد. برای انتخاب شخص، صدور مدرک یا دیدن مدارک قبلی، بخش «صدور و پرونده مدارک» را باز کنید.','The studio controls the preview and issued document. Open “Issue and records” to select a person, issue a document, or view previous documents.','Studio upravlja izgledom dokumenta. Otvorite odjeljak za izdavanje i evidenciju.');studio.insertAdjacentElement('afterbegin',intro);
}
function cleanup(){document.querySelectorAll('.nh7-clean-scroll-badge,.nh7-stable-final-badge,.nh7-fix12-badge,.nh7-stable-badge,.nh7-stable-final-badge').forEach(x=>x.remove());document.body.dataset.nh7AdminTab=typeof activeTab==='undefined'?'':activeTab;arrangeDocuments()}
try{if(typeof adminDashboard==='function'&&!adminDashboard.__nh7MenuV316){const old=adminDashboard;adminDashboard=function(){return menu()+old()};adminDashboard.__nh7MenuV316=true}}
catch(error){console.warn('Dashboard menu v316',error)}
try{if(typeof render==='function'&&!render.__nh7UiDocV316){const old=render;render=window.render=function(...args){const out=old.apply(this,args);requestAnimationFrame(cleanup);return out};render.__nh7UiDocV316=true}}
catch(error){console.warn('UI document render v316',error)}
window.NH7_ADMIN_UI_DOCUMENTS_VERSION=VERSION;
requestAnimationFrame(cleanup);
})();
