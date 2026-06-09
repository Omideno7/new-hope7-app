const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const view = $('#view');
const state = { lang: localStorage.getItem('nh7_lang') || 'en', route:'home', stack:[], data:{}, bible:{groups:{},books:null,verses:null,book:null,chapter:null}, dailyTab:'word' };

const T = {
  en:{'nav.home':'Home','nav.daily':'Daily','nav.bible':'Bible','nav.plans':'Plans','nav.school':'School','nav.more':'More',home:'Home',daily:'Daily',bible:'Bible',plans:'Plans',school:'School',more:'More',audio:'Audio Messages',salvation:'Need Salvation',about:'About Church',settings:'Settings',gratitude:'Gratitude Plan',meetings:'Church Meetings',youversion:'My Church on YouVersion',amen:'Amen',read:'I read; unlock next day',register:'Register',pending:'Pending Review',approved:'Approved',login:'Registration / Access',offline:'Offline mode active',search:'Search',oldtestament:'Old Testament',newtestament:'New Testament',chapters:'Chapters',back:'Back',save:'Save',notes:'Notes',assignment:'Assignment',fullLesson:'Full Written Lesson',playAudio:'Audio'},
  fa:{'nav.home':'خانه','nav.daily':'روزانه','nav.bible':'کتاب','nav.plans':'برنامه‌ها','nav.school':'مدرسه','nav.more':'بیشتر',home:'خانه',daily:'روزانه',bible:'کتاب‌مقدس',plans:'برنامه‌ها',school:'مدرسه',more:'بیشتر',audio:'پیام‌های صوتی',salvation:'نیاز به نجات',about:'درباره کلیسا',settings:'تنظیمات',gratitude:'دوره شکرگزاری',meetings:'جلسات کلیسا',youversion:'کلیسای من در YouVersion',amen:'آمین',read:'خواندم؛ روز بعد باز شود',register:'ثبت‌نام',pending:'در انتظار تأیید',approved:'تأیید شده',login:'ثبت‌نام / دسترسی',offline:'حالت آفلاین فعال است',search:'جستجو',oldtestament:'عهد عتیق',newtestament:'عهد جدید',chapters:'باب‌ها',back:'برگشت',save:'ذخیره',notes:'یادداشت‌ها',assignment:'تکلیف',fullLesson:'متن کامل درس',playAudio:'صوت'},
  hr:{'nav.home':'Početna','nav.daily':'Dnevno','nav.bible':'Biblija','nav.plans':'Planovi','nav.school':'Škola','nav.more':'Više',home:'Početna',daily:'Dnevno',bible:'Biblija',plans:'Planovi',school:'Škola',more:'Više',audio:'Audio poruke',salvation:'Trebam spasenje',about:'O crkvi',settings:'Postavke',gratitude:'Plan zahvalnosti',meetings:'Crkveni sastanci',youversion:'Moja crkva na YouVersionu',amen:'Amen',read:'Pročitao sam; otključaj sljedeći dan',register:'Registracija',pending:'Čeka odobrenje',approved:'Odobreno',login:'Registracija / Pristup',offline:'Izvanmrežni način je aktivan',search:'Pretraži',oldtestament:'Stari zavjet',newtestament:'Novi zavjet',chapters:'Poglavlja',back:'Natrag',save:'Spremi',notes:'Bilješke',assignment:'Zadatak',fullLesson:'Cijela pisana lekcija',playAudio:'Audio'}
};
const tr = k => T[state.lang]?.[k] || T.en[k] || k;
const pick = obj => (obj && (obj[state.lang] ?? obj.en ?? obj.fa ?? obj.hr)) || '';
const jfetch = async path => { if(state.data[path]) return state.data[path]; const res = await fetch(path); if(!res.ok) throw new Error(path); return state.data[path] = await res.json(); };
const dayOfYear = () => { const d=new Date(); const start=new Date(d.getFullYear(),0,0); return Math.floor((d-start)/86400000); };
const cycleDay = n => ((dayOfYear()-1)%n)+1;
const html = s => String(s ?? '').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/\n/g,'<br>');

function setLang(lang){ state.lang=lang; localStorage.setItem('nh7_lang',lang); document.documentElement.lang=lang; document.body.dir = lang==='fa'?'rtl':'ltr'; $('#langSelect').value=lang; $$('[data-i18n]').forEach(el=>el.textContent=tr(el.dataset.i18n)); render(state.route, null, true); }
function setCrumb(t){ $('#breadcrumb').textContent=t; $('#backBtn').classList.toggle('hidden', state.stack.length===0); $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.route===state.route)); }
function navigate(route, params=null, replace=false){ if(!replace && state.route) state.stack.push({route:state.route, params:state.params}); state.route=route; state.params=params; render(route, params); }
function back(){ const prev=state.stack.pop(); if(prev){state.route=prev.route; state.params=prev.params; render(prev.route, prev.params, true)} }

async function showAmen(){
  const data=await jfetch('data/app/opening_messages_365.json').catch(()=>null); const item=data?.items?.[cycleDay(365)-1];
  $('#amenTitle').textContent = item ? pick(item).title : 'New Hope 7';
  $('#amenMessage').textContent = item ? pick(item).message : 'God is with you today.';
  $('#amenButton').textContent = tr('amen'); $('#amenGate').classList.remove('hidden');
}

function card(title, body, cls=''){ return `<section class="card ${cls}"><h2>${html(title)}</h2>${body}</section>`; }
function tile(route, emoji, title, sub, params=null){ return `<button class="tile" data-go="${route}" data-params='${JSON.stringify(params||{})}'><span class="emoji">${emoji}</span><strong>${html(title)}</strong><small>${html(sub||'')}</small></button>`; }

async function render(route, params={}, preserve=false){
  view.innerHTML='<section class="card"><p>Loading...</p></section>';
  try{
    if(route==='home') await home();
    if(route==='daily') await daily(params);
    if(route==='bible') await bible(params);
    if(route==='plans') await plans(params);
    if(route==='school') await school(params);
    if(route==='more') await more(params);
    if(route==='audio') await audio(params);
    if(route==='salvation') await salvation(params);
    if(route==='about') await about(params);
    if(route==='meetings') await meetings(params);
    if(route==='settings') await settings(params);
    bindDynamic();
    setCrumb(tr(route));
  } catch(e){ console.error(e); view.innerHTML=card('Error',`<p>${html(e.message)}</p>`); }
}

async function home(){
  view.innerHTML = card('New Hope 7', `<p>${state.lang==='fa'?'به اپ کلیسای امیدنو۷ خوش آمدید.':'Welcome to the New Hope 7 church app.'}</p><div class="button-row"><a class="primary-btn" href="https://www.bible.com/organizations/da6136d1-04cd-4243-a52b-f9ba7f32ec79?utm_source=yvapp&utm_medium=share&utm_content=partner-page" target="_blank" rel="noopener">${tr('youversion')}</a></div>`, 'hero') +
  `<div class="grid">${tile('daily','☀',tr('daily'),'Daily Word, Faith, Juice')}${tile('bible','📖',tr('bible'),'FA / EN / HR')}${tile('plans','✓',tr('plans'),'1-year & 2-year Bible plans')}${tile('school','🎓',tr('school'),'Registration required')}${tile('meetings','☎',tr('meetings'),'Admin approval required')}${tile('more','☰',tr('more'),'Audio, Salvation, About')}</div>` +
  card('Offline-first', `<p>${state.lang==='fa'?'این نسخه از ابتدا برای استفاده آفلاین، ذخیره‌سازی محلی و نصب روی موبایل آماده شده است.':'This version is prepared from the beginning for offline use, local saving, and mobile installation.'}</p>`);
}

async function daily(){
  const tabs=[['word','Daily Word'],['faith','Faith Proclamation'],['juice','Daily Juice'],['gratitude','Gratitude']];
  let out=`<div class="tabs">${tabs.map(t=>`<button class="tab ${state.dailyTab===t[0]?'active':''}" data-dailytab="${t[0]}">${t[1]}</button>`).join('')}</div>`;
  if(state.dailyTab==='word') out+=await dailyWord();
  if(state.dailyTab==='faith') out+=await faith();
  if(state.dailyTab==='juice') out+=await juice();
  if(state.dailyTab==='gratitude') out+=await gratitude();
  view.innerHTML=out;
}
function getItems(data){ return data.items || data.days || data.proclamations || []; }
async function dailyWord(){ const d=await jfetch('data/daily/daily_word_365.json'); const it=getItems(d)[cycleDay(getItems(d).length)-1]||{}; return dailyCard(it,'message','prayer'); }
async function faith(){ const d=await jfetch('data/daily/faith_proclamations_365.json'); const it=getItems(d)[cycleDay(getItems(d).length)-1]||{}; return dailyCard(it,'proclamation',null); }
async function juice(){ const d=await jfetch('data/daily/daily_juice_365.json'); const it=getItems(d)[cycleDay(getItems(d).length)-1]||{}; return dailyCard(it,'message','prayer','actionStep'); }
async function gratitude(){ const d=await jfetch('data/gratitude/gratitude_plan_30_days.json'); const it=getItems(d)[cycleDay(30)-1]||{}; return dailyCard(it,'teaching',null,'dailyTasks',true); }
function dailyCard(it, mainKey, prayerKey, extraKey, journal=false){
  const title=pick(it.title)||`Day ${it.day||''}`; const verse=it.mainVerse||{}; const main=pick(it[mainKey]);
  let body=`<span class="badge">Day ${it.day||cycleDay(365)}</span><h2>${html(title)}</h2>`;
  if(verse.reference) body+=`<div class="notice"><strong>${html(verse.reference)}</strong><p>${html(pick(verse.text))}</p></div>`;
  body+=`<p>${html(main)}</p>`;
  if(extraKey && it[extraKey]){ const v=it[extraKey]; body+=Array.isArray(v[state.lang])?`<ul>${v[state.lang].map(x=>`<li>${html(x)}</li>`).join('')}</ul>`:`<p><strong>${html(pick(v))}</strong></p>`; }
  if(prayerKey && it[prayerKey]) body+=`<h3>Prayer</h3><p>${html(pick(it[prayerKey]))}</p>`;
  if(journal) body+=`<textarea placeholder="${state.lang==='fa'?'یادداشت شکرگزاری امروز':'Today’s gratitude note'}"></textarea><button class="secondary-btn" data-save-note="gratitude-${it.day}">${tr('save')}</button>`;
  return card(title,body);
}

async function loadBibleMeta(){
  if(state.bible.books) return;
  const data=await jfetch('data/bible/groups/bible_group_01_18.json'); state.bible.books=data.books || [];
}
async function loadBibleGroupByOrder(order){
  const file = order<=18?'01_18':order<=39?'19_39':'40_66';
  if(!state.bible.groups[file]) state.bible.groups[file]=await jfetch(`data/bible/groups/bible_group_${file}.json`);
  return state.bible.groups[file];
}
async function bible(params={}){
  await loadBibleMeta();
  if(params.mode==='book') return bibleBook(params.bookId);
  if(params.mode==='chapter') return bibleChapter(params.bookId, params.chapter);
  const q = params.q || '';
  let body=`<input id="bibleSearch" class="search-box" placeholder="${tr('search')}" value="${html(q)}"/><div class="button-row"><button class="secondary-btn" id="runBibleSearch">${tr('search')}</button></div>`;
  if(q) body += await bibleSearch(q);
  const ot=state.bible.books.filter(b=>b.testament==='OT'), nt=state.bible.books.filter(b=>b.testament==='NT');
  body+=`<h2>${tr('oldtestament')}</h2><div class="list">${ot.map(bookBtn).join('')}</div><h2>${tr('newtestament')}</h2><div class="list">${nt.map(bookBtn).join('')}</div>`;
  view.innerHTML=body;
}
function bookBtn(b){ return `<button class="list-btn" data-go="bible" data-params='${JSON.stringify({mode:'book',bookId:b.id})}'><strong>${html(b.names[state.lang]||b.names.en)}</strong><small>${b.chapters} ${tr('chapters')}</small></button>`; }
async function bibleBook(bookId){ const b=state.bible.books.find(x=>x.id===bookId); view.innerHTML=`<section class="card"><h2>${html(b.names[state.lang]||b.names.en)}</h2><div class="grid">${Array.from({length:b.chapters},(_,i)=>`<button class="list-btn" data-go="bible" data-params='${JSON.stringify({mode:'chapter',bookId,chapter:i+1})}'>${i+1}</button>`).join('')}</div></section>`; }
async function bibleChapter(bookId,chapter){ const b=state.bible.books.find(x=>x.id===bookId); const group=await loadBibleGroupByOrder(b.order); const verses=(group.verses||[]).filter(v=>v.bookId===bookId && Number(v.chapter)===Number(chapter)); let body=`<h2>${html((b.names[state.lang]||b.names.en)+' '+chapter)}</h2>`; body+=verses.map(v=>`<div class="reader-verse" data-verse="${v.id}"><span class="num">${v.verse}</span>${html(v.text?.[state.lang]||v.text?.en||'')}<div class="button-row"><button class="secondary-btn small" data-bookmark="${v.id}">☆</button><button class="secondary-btn small" data-highlight="${v.id}">Highlight</button></div></div>`).join(''); view.innerHTML=card((b.names[state.lang]||b.names.en), body); }
async function bibleSearch(q){ let results=[]; for(const f of ['01_18','19_39','40_66']){ const g=await loadBibleGroupByOrder(f==='01_18'?1:f==='19_39'?19:40); results.push(...(g.verses||[]).filter(v=>(v.text?.[state.lang]||'').toLowerCase().includes(q.toLowerCase())).slice(0,12)); if(results.length>=12) break; } return `<h2>${tr('search')}</h2><div class="list">${results.slice(0,12).map(v=>`<button class="list-btn" data-go="bible" data-params='${JSON.stringify({mode:'chapter',bookId:v.bookId,chapter:v.chapter})}'><strong>${html(v.reference?.[state.lang]||v.reference?.en)}</strong><small>${html((v.text?.[state.lang]||'').slice(0,130))}</small></button>`).join('')}</div>`; }

async function plans(){
  const d=await jfetch('data/bible/plans/reading_plans_1yr_2yr.json');
  const plans=Array.isArray(d)?d:(d.plans||d.readingPlans||Object.values(d).filter(x=>x&&x.days));
  view.innerHTML=card(tr('plans'), `<div class="list">${plans.map((p,i)=>`<button class="list-btn" data-plan="${i}"><strong>${html(p.title?.[state.lang]||p.title?.en||p.id||`Plan ${i+1}`)}</strong><small>${p.durationDays||p.days?.length||''} days</small></button>`).join('')}</div><div id="planDetail"></div>`);
  $$('[data-plan]').forEach(btn=>btn.onclick=()=>showPlan(plans[btn.dataset.plan]));
}
function showPlan(p){ const prog=JSON.parse(localStorage.getItem('nh7_plan_'+(p.id||'plan'))||'{"completed":[]}'); const current=(prog.completed?.length||0)+1; const day=(p.days||[]).find(d=>Number(d.day)===current)||p.days?.[0]; $('#planDetail').innerHTML=card(p.title?.[state.lang]||p.title?.en||'Plan', `<div class="progress"><span style="width:${Math.min(100,(prog.completed?.length||0)/(p.days?.length||365)*100)}%"></span></div><p>Day ${current}</p><pre class="notice">${html(JSON.stringify(day?.readings||day,null,2))}</pre><button class="primary-btn" id="markRead">${tr('read')}</button>`); $('#markRead').onclick=()=>{ prog.completed=[...(prog.completed||[]), current]; localStorage.setItem('nh7_plan_'+(p.id||'plan'),JSON.stringify(prog)); showPlan(p); }; }

async function school(params={}){
  const d=await jfetch('data/school/school_content.json'); const access=JSON.parse(localStorage.getItem('nh7_school_access')||'{"status":"guest"}');
  if(access.status!=='approved'){
    view.innerHTML=card(tr('school'), `<p>${state.lang==='fa'?'برای ورود به مدرسه باید ثبت‌نام کنید و ادمین شما را تأیید کند.':'To enter the school, you must register and be approved by admin.'}</p><span class="badge">${access.status==='pending'?tr('pending'):'Guest'}</span><div class="form-row"><input id="regName" placeholder="Name" value="${html(access.name||'')}"></div><div class="form-row"><input id="regEmail" placeholder="Email" value="${html(access.email||'')}"></div><button class="primary-btn" id="schoolRegister">${tr('register')}</button><p class="muted small">In the static GitHub version, approval is a local demo. Real approval/security must be connected to Supabase.</p><button class="secondary-btn" id="demoApprove">Demo admin approve on this device</button>`);
    $('#schoolRegister').onclick=()=>{ localStorage.setItem('nh7_school_access', JSON.stringify({status:'pending',name:$('#regName').value,email:$('#regEmail').value})); render('school',null,true); };
    $('#demoApprove').onclick=()=>{ localStorage.setItem('nh7_school_access', JSON.stringify({status:'approved'})); render('school',null,true); };
    return;
  }
  if(params.lesson) return schoolLesson(d, params.lesson);
  view.innerHTML=card(tr('school'), `<p><span class="badge">${tr('approved')}</span></p><div class="list">${d.lessons.map(l=>`<button class="list-btn" data-go="school" data-params='${JSON.stringify({lesson:l.lesson_code})}'><strong>${html(l.translations?.[state.lang]?.class_title||l.translations?.en?.class_title)}</strong><small>${html(l.translations?.[state.lang]?.lesson_title||'')}</small></button>`).join('')}</div>`);
}
function schoolLesson(d, code){ const l=d.lessons.find(x=>x.lesson_code===code); const tx=l.translations?.[state.lang]||l.translations?.en||{}; const wr=l.written?.[state.lang]||l.written?.en||{}; let body=`<p>${html(tx.lesson_text)}</p><div class="audio-placeholder"><strong>${tr('playAudio')}</strong><p>${html(l.audio?.fileName||'Audio file placeholder')}</p><audio controls src="public/audio/school/${html(l.audio?.fileName||'class-01-fa.mp3')}"></audio></div><h3>${tr('assignment')}</h3><p>${html(tx.assignment_question)}</p><textarea placeholder="${tr('notes')}"></textarea><button class="secondary-btn" data-save-note="school-${code}">${tr('save')}</button><h3>${tr('fullLesson')}</h3><p>${html(wr.text||'')}</p>`; view.innerHTML=card(tx.class_title||tr('school'), body); }

async function audio(){ const d=await jfetch('data/audio/messages.json'); view.innerHTML=card(tr('audio'), `<div class="grid">${d.categories.map(c=>tile('audio','🎧',pick(c.title), c.items.length+' items',{cat:c.id})).join('')}</div><p class="muted">Upload MP3 files into public/audio/messages and update data/audio/messages.json.</p>`); }
async function salvation(){ const d=await jfetch('data/salvation/need_salvation.json'); view.innerHTML=`<div class="list">${(d.sections||[]).map(s=>card(pick(s.title),`<p>${html(pick(s.content))}</p>`)).join('')}</div>`; }
async function about(){ const d=await jfetch('data/church/about.json'); view.innerHTML=card(tr('about'), `<h3>${state.lang==='fa'?'رویای ما':'Our Vision'}</h3><p>${html(d.vision[state.lang])}</p><h3>${state.lang==='fa'?'اعتقادات ما':'Our Beliefs'}</h3><p>${html(d.beliefs[state.lang])}</p><div class="grid"><img src="assets/about/vision_fa_source.jpeg" style="width:100%;border-radius:16px"><img src="assets/about/beliefs_fa_source.jpeg" style="width:100%;border-radius:16px"></div>`); }
async function meetings(){ const d=await jfetch('data/church/church_config.json'); const access=JSON.parse(localStorage.getItem('nh7_meeting_access')||'{"status":"guest"}'); view.innerHTML=card(tr('meetings'), `<p>${state.lang==='fa'?'اطلاعات ورود به جلسه فقط بعد از ثبت‌نام و تأیید ادمین نمایش داده می‌شود.':'Meeting access details are shown only after registration and admin approval.'}</p><span class="badge">${access.status||'guest'}</span><p>Provider: ${d.meetingProvider}</p><div class="notice">${html(d.meetingDetailsNote)}</div><button class="primary-btn" id="meetingRequest">${tr('register')}</button><button class="secondary-btn" id="meetingApprove">Demo approve</button>`); $('#meetingRequest').onclick=()=>{localStorage.setItem('nh7_meeting_access',JSON.stringify({status:'pending'}));render('meetings',null,true)}; $('#meetingApprove').onclick=()=>{localStorage.setItem('nh7_meeting_access',JSON.stringify({status:'approved'}));render('meetings',null,true)}; }
async function more(){ view.innerHTML=`<div class="grid">${tile('audio','🎧',tr('audio'),'')}${tile('salvation','✝',tr('salvation'),'')}${tile('gratitude','🙏',tr('gratitude'),'')}${tile('meetings','☎',tr('meetings'),'')}${tile('about','ℹ',tr('about'),'')}${tile('settings','⚙',tr('settings'),'')}</div>`; }
async function settings(){ view.innerHTML=card(tr('settings'), `<p>Language</p><select id="settingsLang"><option value="en">English</option><option value="fa">فارسی</option><option value="hr">Hrvatski</option></select><h3>Notifications</h3><p class="muted">07:00 Daily Word, 12:00 Faith Proclamation, 17:00 Daily Juice, 21:00 Gratitude by user local time. Church meeting reminders use Europe/Zagreb.</p><h3>Offline</h3><p class="muted">App shell and accessed data are cached for offline use.</p>`); $('#settingsLang').value=state.lang; $('#settingsLang').onchange=e=>setLang(e.target.value); }

function bindDynamic(){
  $$('[data-go]').forEach(el=>el.onclick=()=>navigate(el.dataset.go, JSON.parse(el.dataset.params||'{}')));
  $$('[data-dailytab]').forEach(el=>el.onclick=()=>{state.dailyTab=el.dataset.dailytab; render('daily',null,true)});
  $$('[data-save-note]').forEach(el=>el.onclick=()=>{ localStorage.setItem('nh7_note_'+el.dataset.saveNote, el.previousElementSibling?.value||''); el.textContent='Saved'; });
  $$('[data-bookmark]').forEach(el=>el.onclick=()=>{ const arr=JSON.parse(localStorage.getItem('nh7_bookmarks')||'[]'); if(!arr.includes(el.dataset.bookmark)) arr.push(el.dataset.bookmark); localStorage.setItem('nh7_bookmarks',JSON.stringify(arr)); el.textContent='★'; });
  $$('[data-highlight]').forEach(el=>el.onclick=()=>el.closest('.reader-verse')?.classList.toggle('highlighted'));
  const run=$('#runBibleSearch'); if(run) run.onclick=()=>navigate('bible',{q:$('#bibleSearch').value},true);
}

$('#langSelect').onchange=e=>setLang(e.target.value);
$('#backBtn').onclick=back;
$$('.nav-item').forEach(b=>b.onclick=()=>{ state.stack=[]; navigate(b.dataset.route,{},true); });
$('#amenButton').onclick=()=>$('#amenGate').classList.add('hidden');
window.addEventListener('online',()=>$('.offline')?.remove());
window.addEventListener('offline',()=>{ if(!$('.offline')){ const d=document.createElement('div'); d.className='offline'; d.textContent=tr('offline'); document.body.appendChild(d);} });
if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(console.warn);
setLang(state.lang); showAmen();
