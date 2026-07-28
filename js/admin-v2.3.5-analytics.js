/* New Hope 7 Admin v2.3.6 — user drilldown and unified student activity */
(()=>{'use strict';

const VERSION='2.3.6';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const E=value=>typeof h==='function'?h(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=value=>Number(value||0);
const FMT=value=>{
  let sec=Math.max(0,Math.round(N(value)));
  const hours=Math.floor(sec/3600),minutes=Math.floor((sec%3600)/60),seconds=sec%60;
  return hours?`${hours}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`:`${minutes}:${String(seconds).padStart(2,'0')}`;
};
const DATE=value=>{
  if(!value||String(value).includes('-infinity'))return '-';
  const d=new Date(value);
  return Number.isNaN(d.getTime())?'-':d.toLocaleString();
};

if(typeof state!=='object'||!state)return;
state.analyticsUsersV235=state.analyticsUsersV235||{loading:false,error:'',item:null,summary:{},users:[]};
state.studentActivityV235=state.studentActivityV235||{};

function categoryName(value){
  return value==='sermon'?L('موعظه و پیام صوتی','Sermons & audio','Propovijedi i audio'):
    value==='audio_bible'?L('کتاب مقدس صوتی','Audio Bible','Audio Biblija'):
    value==='school'?L('صوت مدرسه','School audio','Školski audio'):
    value==='library'?L('کتاب و جزوه','Books & handouts','Knjige i materijali'):
    value==='library_pdf'?L('کتاب و جزوه','Books & handouts','Knjige i materijali'):
    value==='daily_content'?L('محتوای روزانه','Daily content','Dnevni sadržaj'):
    value==='bible_chapter'?L('مطالعه کتاب مقدس','Bible reading','Čitanje Biblije'):
    value==='app_section'?L('بخش اپ','App section','Dio aplikacije'):
    E(value||'-');
}

function statusForAudio(row){
  if(row.completed)return ['complete',L('کامل','Completed','Dovršeno')];
  if(row.likely_skipped)return ['skip',L('احتمال جلو زدن','Likely skipped','Moguće preskakanje')];
  if(N(row.listened_percent)>=50)return ['partial',L('نیمه‌کاره','Partial','Djelomično')];
  return ['brief',L('کوتاه','Brief','Kratko')];
}

function analyticsFilters(panel){
  const dates=[...panel.querySelectorAll('.analytics-v222-toolbar input[type="date"]')];
  const selects=[...panel.querySelectorAll('.analytics-v222-toolbar select')];
  return {
    from:dates[0]?.value||null,
    to:dates[1]?.value||null,
    language:selects[1]?.value||''
  };
}

function closeUsersModal(){
  document.getElementById('nh7AnalyticsUsersModalV235')?.remove();
  document.body.classList.remove('nh7-users-modal-open-v235');
}
window.nh7CloseAnalyticsUsersV235=closeUsersModal;

function usersModalHtml(){
  const d=state.analyticsUsersV235||{},item=d.item||{},users=Array.isArray(d.users)?d.users:[],s=d.summary||{};
  const body=d.loading
    ? `<div class="notice">${E(L('در حال دریافت نام کاربران…','Loading users…','Učitavanje korisnika…'))}</div>`
    : d.error
      ? `<div class="notice">${E(d.error)}</div>`
      : users.length
        ? `<div class="nh7-user-list-v235">${users.map(user=>{
            const email=String(user.resolved_email||user.user_email||'').trim().toLowerCase();
            const canOpen=email&&typeof studentDirectory==='function'&&studentDirectory().some(x=>String(x.email||'').toLowerCase()===email);
            const [statusClass,statusText]=statusForAudio(user);
            const metrics=[];
            if(N(user.listened_seconds)>0)metrics.push(`${L('زمان شنیدن','Listening','Slušanje')}: ${FMT(user.listened_seconds)}`);
            if(N(user.duration_seconds)>0)metrics.push(`${L('شنیده‌شده','Listened','Poslušano')}: ${N(user.listened_percent)}%`);
            if(N(user.reached_percent)>0)metrics.push(`${L('رسیده به','Reached','Dosegnuto')}: ${N(user.reached_percent)}%`);
            if(N(user.open_count)>0)metrics.push(`${L('دفعات بازکردن','Opens','Otvaranja')}: ${N(user.open_count)}`);
            if(N(user.sessions)>0)metrics.push(`${L('جلسات پخش','Sessions','Sesije')}: ${N(user.sessions)}`);
            if(N(user.seek_count)>0)metrics.push(`${L('جابه‌جایی نوار','Seeks','Preskakanja')}: ${N(user.seek_count)}`);
            return `<article class="nh7-user-row-v235">
              <div class="nh7-user-row-head-v235"><div><strong>${E(user.user_name||email||L('کاربر بدون نام','Unnamed user','Korisnik bez imena'))}</strong><small>${E(email||user.device_id||'-')}</small></div>
              ${N(user.duration_seconds)>0?`<span class="nh7-student-status-v235 ${statusClass}">${E(statusText)}</span>`:''}</div>
              <div class="nh7-user-metrics-v235">${metrics.map(x=>`<span>${E(x)}</span>`).join('')}<span>${E(L('آخرین فعالیت','Last activity','Zadnja aktivnost'))}: ${E(DATE(user.last_activity_at))}</span></div>
              <button type="button" class="btn secondary" data-nh7-open-user-profile="${E(email)}" ${canOpen?'':'disabled'}>👤 ${E(canOpen?L('باز کردن پرونده دانشجو','Open student profile','Otvori profil studenta'):L('حساب ثبت‌شده پیدا نشد','Registered profile not found','Profil nije pronađen'))}</button>
            </article>`;
          }).join('')}</div>`
        : `<div class="empty">${E(L('برای این محتوا کاربری در بازه انتخاب‌شده ثبت نشده است.','No users were recorded for this content in the selected period.','Nema zabilježenih korisnika za odabrano razdoblje.'))}</div>`;
  return `<div id="nh7AnalyticsUsersModalV235" class="nh7-users-modal-v235" role="dialog" aria-modal="true">
    <section class="nh7-users-dialog-v235">
      <header class="nh7-users-head-v235"><div><h2>👥 ${E(item.title||item.content_id||L('کاربران محتوا','Content users','Korisnici sadržaja'))}</h2><p>${E(categoryName(item.category))} · ${E(item.content_id||'')}</p></div><button type="button" class="nh7-users-close-v235" data-nh7-close-users aria-label="${E(L('بستن','Close','Zatvori'))}">×</button></header>
      <div class="nh7-users-summary-v235"><div><b>${N(s.users)}</b><span>${E(L('کاربر','Users','Korisnici'))}</span></div><div><b>${FMT(s.total_listened_seconds)}</b><span>${E(L('زمان شنیدن','Listening time','Vrijeme slušanja'))}</span></div><div><b>${N(s.total_opens)}</b><span>${E(L('دفعات بازکردن','Opens','Otvaranja'))}</span></div></div>
      ${body}
    </section>
  </div>`;
}

function showUsersModal(){
  closeUsersModal();
  document.body.insertAdjacentHTML('beforeend',usersModalHtml());
  document.body.classList.add('nh7-users-modal-open-v235');
  const modal=document.getElementById('nh7AnalyticsUsersModalV235');
  modal?.querySelector('[data-nh7-close-users]')?.addEventListener('click',closeUsersModal);
  modal?.addEventListener('click',event=>{if(event.target===modal)closeUsersModal()});
  modal?.querySelectorAll('[data-nh7-open-user-profile]').forEach(button=>{
    button.addEventListener('click',()=>{
      const email=String(button.dataset.nh7OpenUserProfile||'').trim().toLowerCase();
      if(!email||typeof openStudentDashboard!=='function')return;
      closeUsersModal();
      openStudentDashboard(encodeURIComponent(email));
    });
  });
}

async function loadContentUsers(item,filters={}){
  state.analyticsUsersV235={loading:true,error:'',item:Object.assign({},item),summary:{},users:[]};
  showUsersModal();
  try{
    const result=await adminRpc('nh7_admin_content_users_v235',{
      p_category:String(item.category||''),
      p_content_id:String(item.content_id||''),
      p_from:filters.from||null,
      p_to:filters.to||null,
      p_language:filters.language||''
    });
    const data=(Array.isArray(result)?result[0]:result)||{};
    state.analyticsUsersV235={loading:false,error:'',item:Object.assign({},item),summary:data.summary||{},users:Array.isArray(data.users)?data.users:[]};
  }catch(error){
    state.analyticsUsersV235={loading:false,error:error?.message||String(error),item:Object.assign({},item),summary:{},users:[]};
  }
  showUsersModal();
}
window.nh7LoadContentUsersV235=loadContentUsers;

function ensureAnalyticsTab(){
  if(typeof token==='undefined'||!token)return;
  const tabs=document.querySelector('.tabs');
  if(!tabs||tabs.querySelector('[data-nh7-analytics-tab-v235]'))return;
  const button=document.createElement('button');
  button.type='button';
  button.className='tab'+(typeof activeTab!=='undefined'&&activeTab==='analytics'?' active':'');
  button.dataset.nh7AnalyticsTabV235='1';
  button.textContent='📈 '+L('تحلیل کاربران','User analytics','Analitika korisnika');
  button.addEventListener('click',()=>{if(typeof setTab==='function')setTab('analytics')});
  tabs.appendChild(button);
}

function enhanceAnalyticsTable(){
  const panels=[...document.querySelectorAll('.panel-card')];
  const panel=panels.find(p=>{
    const title=p.querySelector('h3')?.textContent||'';
    return title.includes('تحلیل کامل')||title.includes('Complete user-interest')||title.includes('Potpuna analitika');
  });
  if(!panel)return;
  if(!panel.querySelector('.nh7-analytics-click-hint-v235')){
    const tableWrap=panel.querySelector('.table-wrap');
    if(tableWrap)tableWrap.insertAdjacentHTML('beforebegin',`<div class="nh7-analytics-click-hint-v235">👥 ${E(L('روی تعداد کاربران هر ردیف بزنید تا نام افراد و جزئیات استفاده آن‌ها نمایش داده شود.','Tap the user count in any row to see names and usage details.','Dodirnite broj korisnika za imena i detalje korištenja.'))}</div>`);
  }
  const items=Array.isArray(state.engagementV223?.items)?state.engagementV223.items:[];
  const rows=[...panel.querySelectorAll('.nh7-v223-table tbody tr')];
  const filters=analyticsFilters(panel);
  rows.forEach((row,index)=>{
    const item=items[index],cell=row.cells?.[3];
    if(!item||!cell||cell.querySelector('.nh7-users-drill-v235'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='nh7-users-drill-v235';
    button.innerHTML=`${N(item.unique_users)}<small>${E(L('نمایش نام‌ها','Show names','Prikaži imena'))}</small>`;
    button.addEventListener('click',()=>loadContentUsers(item,filters));
    cell.replaceChildren(button);
  });
}

async function loadStudentActivityV235(email,redraw=true){
  email=String(email||'').trim().toLowerCase();
  if(!email||typeof token==='undefined'||!token)return;
  state.studentActivityV235[email]={loading:true};
  if(redraw&&typeof render==='function')render();
  try{
    const result=await adminRpc('nh7_admin_student_activity_v235',{p_email:email});
    state.studentActivityV235[email]=Object.assign({loading:false},(Array.isArray(result)?result[0]:result)||{});
  }catch(error){
    state.studentActivityV235[email]={loading:false,error:error?.message||String(error)};
  }
  if(redraw&&typeof render==='function')render();
}
window.nh7LoadStudentActivityV235=loadStudentActivityV235;

function studentActivityHtmlV235(student){
  const email=String(student?.email||'').trim().toLowerCase();
  const data=state.studentActivityV235[email];
  if(!data||data.loading)return `<section class="student-activity-panel student-activity-v235"><div class="notice">${E(L('در حال دریافت گزارش کامل فعالیت دانشجو…','Loading the complete student activity report…','Učitavanje potpunog izvještaja…'))}</div></section>`;
  if(data.error)return `<section class="student-activity-panel student-activity-v235"><div class="notice">${E(data.error)}</div><button type="button" class="btn secondary" onclick="nh7LoadStudentActivityV235('${E(email)}',true)">⟳ ${E(L('تلاش دوباره','Retry','Pokušaj ponovno'))}</button></section>`;

  const summary=data.summary||{},audio=Array.isArray(data.audio)?data.audio:[],content=Array.isArray(data.content)?data.content:[],sections=Array.isArray(data.sections)?data.sections:[],library=Array.isArray(data.library)?data.library:[];
  const audioHtml=audio.map(row=>{
    const [statusClass,statusText]=statusForAudio(row);
    return `<div class="nh7-student-audio-row-v235"><strong>${E(row.title||row.media_id||'-')} <span class="nh7-student-status-v235 ${statusClass}">${E(statusText)}</span></strong>
      <small>${E(categoryName(row.media_type))} · ${E(L('زمان واقعی','Actual listening','Stvarno slušanje'))}: ${FMT(row.total_listened_seconds)} · ${E(L('درصد شنیده‌شده','Listened','Poslušano'))}: ${N(row.listened_percent)}% · ${E(L('رسیده به','Reached','Dosegnuto'))}: ${N(row.reached_percent)}% · ${E(L('جلسات','Sessions','Sesije'))}: ${N(row.sessions)} · ${E(L('آخرین بار','Last','Zadnje'))}: ${E(DATE(row.last_listened_at))}</small>
      <div class="nh7-student-progress-v235"><i style="width:${Math.min(100,N(row.listened_percent))}%"></i></div></div>`;
  }).join('')||`<div class="empty">${E(L('هنوز فایل صوتی معتبری ثبت نشده است.','No valid audio activity has been recorded yet.','Još nema valjane audio aktivnosti.'))}</div>`;

  const contentHtml=content.map(row=>`<tr><td><strong>${E(row.title||row.content_id||'-')}</strong></td><td>${E(categoryName(row.content_type))}</td><td>${N(row.open_count)}</td><td>${FMT(row.engaged_seconds)}</td><td>${E(DATE(row.last_opened_at))}</td></tr>`).join('')||`<tr><td colspan="5">${E(L('هنوز مطالعه یا بازکردنی ثبت نشده است.','No reading activity has been recorded yet.','Još nema zabilježene aktivnosti čitanja.'))}</td></tr>`;

  const libraryHtml=library.map(row=>`<tr><td><strong>${E(row.title||row.item_id||'-')}</strong></td><td>${N(row.open_count)}</td><td>${E(DATE(row.last_opened_at))}</td></tr>`).join('')||`<tr><td colspan="3">${E(L('هنوز جزوه یا کتابی برای این دانشجو ثبت نشده است.','No book or handout activity has been recorded for this student.','Nema zabilježene aktivnosti knjiga ili materijala.'))}</td></tr>`;

  return `<section class="student-activity-panel student-activity-v235">
    <div class="req-head"><div><h3>📊 ${E(L('عملکرد کامل دانشجو در اپ','Complete student activity in the app','Potpuna aktivnost studenta'))}</h3><p class="muted small">${E(L('این گزارش فایل‌های صوتی، مطالعه محتوا، بازکردن جزوه‌ها و میزان فعالیت ثبت‌شده در اپ را یکجا نشان می‌دهد.','This report combines audio listening, content reading, handout access, and recorded app activity.','Izvještaj objedinjuje audio, čitanje i korištenje aplikacije.'))}</p></div><button type="button" class="btn secondary" onclick="nh7LoadStudentActivityV235('${E(email)}',true)">⟳ ${E(L('تازه‌سازی','Refresh','Osvježi'))}</button></div>
    <div class="nh7-student-summary-v235">
      <div class="stat"><b>${FMT(summary.total_listened_seconds)}</b><span>${E(L('زمان واقعی شنیدن','Actual listening','Stvarno slušanje'))}</span></div>
      <div class="stat"><b>${N(summary.active_days)}</b><span>${E(L('روز فعال','Active days','Aktivni dani'))}</span></div>
      <div class="stat"><b>${N(summary.app_opens)+N(summary.content_opens)}</b><span>${E(L('فعالیت و مطالعه','App and reading activity','Aktivnost i čitanje'))}</span></div>
      <div class="stat"><b>${N(summary.library_opens)}</b><span>${E(L('بازکردن جزوه‌ها','Handout opens','Otvaranja materijala'))}</span></div>
      <div class="stat"><b>${N(summary.completed_audio)}</b><span>${E(L('فایل صوتی کامل','Completed audio','Dovršeni audio'))}</span></div>
      <div class="stat"><b>${N(summary.likely_skipped_audio)}</b><span>${E(L('احتمال جلو زدن','Likely skipped','Moguće preskakanje'))}</span></div>
      <div class="stat"><b>${N(content.length)}</b><span>${E(L('محتوای مختلف','Distinct content','Različiti sadržaji'))}</span></div>
      <div class="stat"><b>${E(DATE(summary.last_activity_at))}</b><span>${E(L('آخرین فعالیت','Last activity','Zadnja aktivnost'))}</span></div>
    </div>
    <div class="nh7-student-activity-grid-v235">
      <section class="nh7-student-section-v235"><h4>🎧 ${E(L('فایل‌های صوتی گوش‌داده‌شده','Audio files listened to','Poslušane audio datoteke'))}</h4>${audioHtml}</section>
      <section class="nh7-student-section-v235"><h4>📱 ${E(L('بخش‌های استفاده‌شده اپ','Used app sections','Korišteni dijelovi aplikacije'))}</h4><div class="nh7-student-section-chips-v235">${sections.map(row=>`<span>${E(row.section)} · ${N(row.open_count)}</span>`).join('')||`<span>${E(L('هنوز فعالیتی ثبت نشده است.','No activity yet.','Još nema aktivnosti.'))}</span>`}</div></section>
    </div>
    <section class="nh7-student-section-v235"><h4>📖 ${E(L('مطالعه و استفاده از محتوا','Content reading and use','Čitanje i korištenje sadržaja'))}</h4><div class="table-wrap"><table class="nh7-student-table-v235"><thead><tr><th>${E(L('عنوان','Title','Naslov'))}</th><th>${E(L('نوع','Type','Vrsta'))}</th><th>${E(L('دفعات','Opens','Otvaranja'))}</th><th>${E(L('زمان ثبت‌شده','Recorded time','Zabilježeno vrijeme'))}</th><th>${E(L('آخرین استفاده','Last use','Zadnje korištenje'))}</th></tr></thead><tbody>${contentHtml}</tbody></table></div></section>
    <section class="nh7-student-section-v235"><h4>📚 ${E(L('کتاب‌ها و جزوه‌های بازشده','Opened books and handouts','Otvorene knjige i materijali'))}</h4><div class="table-wrap"><table class="nh7-student-table-v235"><thead><tr><th>${E(L('عنوان','Title','Naslov'))}</th><th>${E(L('دفعات بازکردن','Opens','Otvaranja'))}</th><th>${E(L('آخرین استفاده','Last use','Zadnje korištenje'))}</th></tr></thead><tbody>${libraryHtml}</tbody></table></div></section>
  </section>`;
}

if(typeof renderStudentModal==='function'){
  const previousStudentModalV235=renderStudentModal;
  renderStudentModal=function(student){
    let output=previousStudentModalV235(student);
    if(!student||!output)return output;
    try{
      const holder=document.createElement('div');
      holder.innerHTML=output;
      holder.querySelectorAll('.student-activity-v222,.student-activity-v223,.student-activity-v235').forEach(node=>node.remove());
      const modal=holder.querySelector('.student-modal');
      if(modal)modal.insertAdjacentHTML('beforeend',studentActivityHtmlV235(student));
      return holder.innerHTML;
    }catch(error){
      console.warn('Unified student activity render',error);
      return output+studentActivityHtmlV235(student);
    }
  };
}

if(typeof openStudentDashboard==='function'){
  const previousOpenStudentV235=openStudentDashboard;
  openStudentDashboard=function(encoded){
    const email=decodeURIComponent(String(encoded||'')).trim().toLowerCase();
    state.studentActivityV235[email]={loading:true};
    const result=previousOpenStudentV235(encoded);
    loadStudentActivityV235(email,true).catch(console.warn);
    return result;
  };
}

function postRenderV235(){
  ensureAnalyticsTab();
  enhanceAnalyticsTable();
  const brandText=document.querySelector('.brand p');
  if(brandText&&!brandText.querySelector('.nh7-admin-version-v235'))brandText.insertAdjacentHTML('beforeend',`<span class="nh7-admin-version-v235">v${VERSION}</span>`);
}

if(typeof render==='function'){
  const previousRenderV235=render;
  render=function(){
    const result=previousRenderV235();
    requestAnimationFrame(postRenderV235);
    return result;
  };
}

document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.getElementById('nh7AnalyticsUsersModalV235'))closeUsersModal()},true);
setTimeout(postRenderV235,0);
setTimeout(()=>{
  try{
    const email=String(typeof selectedStudentEmail!=='undefined'?selectedStudentEmail:'').trim().toLowerCase();
    if(email&&!state.studentActivityV235[email])loadStudentActivityV235(email,true).catch(console.warn);
  }catch(_){}
},1000);

window.NH7_ADMIN_ANALYTICS_VERSION=VERSION;
})();
