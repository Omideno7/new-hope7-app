/* New Hope 7 — assignment review/draft UX. No client-side grades or attempt counters. */
export function createSchoolWorkflowV467(deps){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lang=()=>['fa','en','hr'].includes(deps.lang())?deps.lang():'en';
  const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
  const owner=()=>String(deps.email()||'').trim().toLowerCase();
  const key=(email,code)=>'nh7_school_assignment_draft_v467:'+encodeURIComponent(email)+':'+encodeURIComponent(code);
  const status=row=>String(row?.status||'').trim().toLowerCase();
  const signature=row=>JSON.stringify([row?.id||'',row?.submitted_at||'',row?.answer_text||'']);
  const pending=new Set();
  let active=null;
  function readDraft(email,code){
    if(!email)return null;
    try{const d=JSON.parse(localStorage.getItem(key(email,code))||'null');return d?.owner===email&&d?.lesson===code&&typeof d.text==='string'?d:null}catch(_){return null}
  }
  function persist(email,code,text,row,dirty=true){
    if(!email||owner()!==email)return false;
    try{localStorage.setItem(key(email,code),JSON.stringify({v:1,owner:email,lesson:code,text:String(text),base:signature(row),dirty,saved_at:new Date().toISOString()}));return true}catch(_){return false}
  }
  function draftText(code,row){
    const d=readDraft(owner(),code);
    if(status(row)==='approved')return String(row.answer_text||'');
    return d?.dirty?d.text:String(row?.answer_text??d?.text??'');
  }
  function words(row){
    switch(status(row)){
      case 'approved':return {icon:'✓',name:L('تأیید شده','Approved','Odobreno'),body:L('مدیر تکلیف شما را تأیید کرده است. وضعیت آزمون و مرحلهٔ بعد را در فهرست کلاس‌ها ببینید.','Your assignment has been approved. Check the class list for exam and next-stage availability.','Administrator je odobrio vaš zadatak. Dostupnost ispita i sljedeće faze provjerite na popisu razreda.')};
      case 'needs_revision':return {icon:'↻',name:L('نیاز به اصلاح','Needs revision','Potrebna dorada'),body:L('بازخورد مدیر را بخوانید، پاسخ را اصلاح کنید و «ارسال نسخهٔ اصلاح‌شده» را بزنید. ذخیرهٔ پیش‌نویس به‌تنهایی برای بررسی ارسال نمی‌شود.','Read the feedback, revise your answer, then select “Submit revised answer”. Saving a draft does not send it for review.','Pročitajte povratnu informaciju, doradite odgovor i odaberite „Predaj dorađeni odgovor”. Spremanje skice ne šalje zadatak na pregled.')};
      case 'submitted':case 'pending':return {icon:'◷',name:L('در انتظار بررسی','Awaiting review','Na čekanju za pregled'),body:L('پاسخ شما ارسال شده است؛ ارسال با تأیید یکسان نیست. پس از بررسی مدیر، نتیجه در همین قسمت نمایش داده می‌شود.','Your answer has been submitted, but submission is not approval. The review result will appear here.','Odgovor je predan, ali predaja ne znači odobrenje. Rezultat pregleda bit će prikazan ovdje.')};
      default:return {icon:'✎',name:L('آمادهٔ نوشتن','Ready to write','Spremno za pisanje'),body:L('پاسخ را بنویسید. پیش‌نویس روی این دستگاه نگه داشته می‌شود؛ برای ارسال به مدیر، دکمهٔ ارسال تکلیف را بزنید.','Write your answer. Your draft stays on this device; use the submit button to send it to the administrator.','Napišite odgovor. Skica ostaje na ovom uređaju; za slanje administratoru pritisnite gumb za predaju.')};
    }
  }
  function stale(snapshot){return !!(snapshot?.from_cache||snapshot?.offline||snapshot?.error)}
  function render({code,question,row=null,snapshot={}}){
    if(!question)return '';
    const w=words(row),s=status(row),approved=s==='approved',d=readDraft(owner(),code);
    const conflict=!!(d?.dirty&&d.base!==signature(row)&&row?.answer_text&&!approved);
    return `<section class="school-assignment nh7-assignment467" data-assignment467="${esc(code)}" data-status="${esc(s||'draft')}" dir="${lang()==='fa'?'rtl':'ltr'}">
      <div class="nh7-assignment-head467"><span aria-hidden="true">✎</span><div><small>${esc(L('تمرین و رشد','Practice and growth','Vježba i rast'))}</small><h3>${esc(L('تکلیف این درس','Lesson assignment','Zadatak ove lekcije'))}</h3></div></div>
      <p class="nh7-assignment-question467">${esc(question)}</p>
      <div class="nh7-assignment-status467"><strong><span aria-hidden="true">${w.icon}</span> ${esc(w.name)}</strong><p>${esc(w.body)}</p></div>
      ${row?.admin_feedback?`<aside class="nh7-assignment-feedback467"><h4>${esc(L('بازخورد مدیر مدرسه','School administrator feedback','Povratna informacija administratora'))}</h4><p>${esc(row.admin_feedback)}</p></aside>`:''}
      ${stale(snapshot)?`<p class="nh7-assignment-cached467">${esc(L('آخرین وضعیت ذخیره‌شده نمایش داده می‌شود. برای بررسی تغییرات به اینترنت متصل شوید و وضعیت را تازه کنید.','Showing the last saved status. Connect and refresh to check for changes.','Prikazan je posljednji spremljeni status. Povežite se i osvježite za provjeru promjena.'))}</p>`:''}
      ${conflict?`<p class="nh7-assignment-cached467">${esc(L('پاسخ ثبت‌شده تغییر کرده است. پیش‌نویس شما حفظ شده؛ پیش از ارسال آن را با پاسخ ثبت‌شده مقایسه کنید.','The submitted answer has changed. Your draft is preserved; compare it with the submitted copy before sending.','Predani odgovor je promijenjen. Skica je sačuvana; prije slanja usporedite je s predanom kopijom.'))}</p>`:''}
      <label for="schoolAssignmentAnswer">${esc(L('پاسخ شما','Your answer','Vaš odgovor'))}</label>
      <textarea id="schoolAssignmentAnswer" rows="7" ${approved?'disabled':''} aria-describedby="nh7AssignmentMessage467">${esc(draftText(code,row))}</textarea>
      <p id="nh7AssignmentMessage467" class="nh7-assignment-message467" role="status" aria-live="polite">${esc(d?.dirty&&!approved?L('پیش‌نویس ذخیره‌شدهٔ شما بازیابی شد؛ هنوز ارسال نشده است.','Your saved draft has been restored; it has not been submitted.','Spremljena skica je vraćena; još nije predana.'):'')}</p>
      <div class="nh7-assignment-actions467"><button type="button" class="secondary-btn" id="saveSchoolAssignmentDraft" ${approved?'disabled':''}>${esc(L('ذخیرهٔ پیش‌نویس','Save draft','Spremi skicu'))}</button><button type="button" class="primary-btn" id="submitSchoolAssignment" ${approved?'disabled':''}>${esc(approved?L('تکلیف تأیید شده','Assignment approved','Zadatak odobren'):s==='needs_revision'?L('ارسال نسخهٔ اصلاح‌شده','Submit revised answer','Predaj dorađeni odgovor'):L('ارسال تکلیف','Submit assignment','Predaj zadatak'))}</button></div>
      <button type="button" class="link-button" data-review-refresh467>↻ ${esc(L('تازه‌کردن وضعیت بررسی','Refresh review status','Osvježi status pregleda'))}</button>
      ${row?.answer_text?`<details class="nh7-assignment-copy467"><summary>${esc(L('مشاهدهٔ آخرین پاسخ ثبت‌شده','View last submitted answer','Prikaži posljednji predani odgovor'))}</summary><p>${esc(row.answer_text)}</p></details>`:''}
      <p class="muted">${esc(L('تأیید، نمره و دسترسی به آزمون توسط مدرسه تعیین می‌شود؛ پیش‌نویس این موارد را تغییر نمی‌دهد.','Approval, grades and exam access are determined by the school; a draft does not change them.','Odobrenje, ocjene i pristup ispitu određuje škola; skica ih ne mijenja.'))}</p>
    </section>`;
  }
  function bind(config){
    active?.abort();const controller=new AbortController();active=controller;
    const root=document.querySelector('[data-assignment467]');if(!root)return;
    const email=owner(),code=config.code,area=root.querySelector('textarea'),message=root.querySelector('[role=status]');
    let row=config.row,writing=false;
    const valid=()=>root.isConnected&&owner()===email&&!!email;
    const say=(text,error=false)=>{if(root.isConnected){message.textContent=text;message.dataset.error=error?'1':'0'}};
    const localSave=()=>{
      if(!valid()||status(row)==='approved')return false;
      const ok=persist(email,code,area.value,row,true);
      say(ok?L('پیش‌نویس روی این دستگاه ذخیره شد؛ هنوز ارسال نشده است.','Draft saved on this device; not submitted yet.','Skica spremljena na ovom uređaju; još nije predana.'):L('ذخیرهٔ پیش‌نویس ممکن نشد. پیش از خروج، پاسخ را کپی کنید.','Could not save the draft. Copy your answer before leaving.','Skica se nije mogla spremiti. Kopirajte odgovor prije izlaska.'),!ok);return ok;
    };
    const repaint=fresh=>{
      if(!valid())return;
      const next=(fresh.assignments||[]).find(x=>String(x.lesson_code||'')===code)||null;
      root.outerHTML=render({...config,row:next,snapshot:fresh});bind({...config,row:next,snapshot:fresh});
    };
    root.addEventListener('input',e=>{if(e.target===area&&!writing)localSave()},{signal:controller.signal});
    root.querySelector('#saveSchoolAssignmentDraft')?.addEventListener('click',()=>{
      if(!localSave())return;
      // Preserve existing explicit-save integration. Never claim cloud success while offline.
      if(navigator.onLine&&valid()&&deps.syncDraft)Promise.resolve(deps.syncDraft(code,area.value,email)).catch(()=>{});
    },{signal:controller.signal});
    root.querySelector('[data-review-refresh467]').addEventListener('click',async e=>{
      if(!valid()||writing)return;
      if(status(row)!=='approved'&&area.value!==draftText(code,row)&&!localSave())return;
      if(!navigator.onLine){say(L('برای تازه‌کردن وضعیت به اینترنت متصل شوید.','Connect to refresh the status.','Povežite se za osvježavanje statusa.'));return}
      e.currentTarget.disabled=true;
      try{const fresh=await deps.snapshot(email,true);if(!valid())return;if(stale(fresh)){say(L('وضعیت تازه دریافت نشد؛ نوشتهٔ شما محفوظ است.','Could not refresh; your writing is preserved.','Osvježavanje nije uspjelo; tekst je sačuvan.'),true);return}repaint(fresh)}catch(_){say(L('وضعیت تازه دریافت نشد؛ دوباره تلاش کنید.','Could not refresh; try again.','Osvježavanje nije uspjelo; pokušajte ponovno.'),true)}finally{if(root.isConnected)root.querySelector('[data-review-refresh467]').disabled=false}
    },{signal:controller.signal});
    root.querySelector('#submitSchoolAssignment')?.addEventListener('click',async()=>{
      const id=key(email,code);if(writing||pending.has(id)||status(row)==='approved')return;
      if(!valid()){say(L('برای ارسال، دوباره وارد حساب خود شوید.','Sign in to your account to submit.','Za predaju se prijavite u svoj račun.'),true);return}
      const raw=area.value,answer=raw.trim();if(!localSave())return;
      if(answer.length<10){say(L('لطفاً پاسخ تکلیف را کامل‌تر بنویسید (حداقل ۱۰ نویسه).','Please write a fuller answer (at least 10 characters).','Napišite potpuniji odgovor (najmanje 10 znakova).'),true);area.focus();return}
      if(!navigator.onLine){say(L('پاسخ فقط به‌صورت پیش‌نویس روی این دستگاه نگه داشته شده است. برای ارسال به مدیر به اینترنت متصل شوید.','The answer is a draft on this device only. Connect to send it to the administrator.','Odgovor je samo skica na ovom uređaju. Povežite se za slanje administratoru.'));return}
      writing=true;pending.add(id);area.readOnly=true;root.querySelectorAll('button').forEach(b=>b.disabled=true);
      say(L('در حال بررسی وضعیت و ارسال…','Checking status and submitting…','Provjera statusa i slanje…'));
      try{
        const fresh=await deps.snapshot(email,true);if(!valid())return;
        if(stale(fresh))throw Error('status_unavailable');
        const latest=(fresh.assignments||[]).find(x=>String(x.lesson_code||'')===code)||null;
        if(status(latest)==='approved'){repaint(fresh);return}
        if(latest&&signature(latest)!==signature(row)&&String(latest.answer_text||'').trim()!==answer){repaint(fresh);return}
        let result;
        if(status(latest)==='submitted'&&String(latest.answer_text||'').trim()===answer){result=latest}
        else{
          result=await deps.rpc('nh7_submit_school_assignment',{p_course_code:config.courseCode,p_lesson_code:code,p_answer_text:answer,p_language:lang(),p_user_name:String(deps.userName()||'')});
          if(Array.isArray(result))result=result[0];
          if(!result||result.lesson_code!==code||String(result.answer_text||'').trim()!==answer)throw Error('receipt_unavailable');
        }
        if(!valid())return;
        persist(email,code,raw,result,false);
        // Only update this assignment card; do not interrupt audio or navigate away.
        repaint({...fresh,assignments:[...(fresh.assignments||[]).filter(x=>x.lesson_code!==code),result],from_cache:false,offline:false,error:null});
        const feedback=document.querySelector('[data-assignment467] [role=status]');if(feedback)feedback.textContent=L('تکلیف ارسال شد و در انتظار بررسی مدیر است.','Assignment submitted and awaiting administrator review.','Zadatak je predan i čeka pregled administratora.');
      }catch(_){say(L('تأیید ارسال دریافت نشد. پیش‌نویس شما حفظ شده؛ پیش از تکرار ارسال، وضعیت را تازه کنید.','Submission confirmation was not received. Your draft is preserved; refresh the status before resubmitting.','Potvrda predaje nije primljena. Skica je sačuvana; prije ponovne predaje osvježite status.'),true)}
      finally{writing=false;pending.delete(id);if(root.isConnected){area.readOnly=false;root.querySelectorAll('button').forEach(b=>b.disabled=status(row)==='approved');root.querySelector('[data-review-refresh467]').disabled=false}}
    },{signal:controller.signal});
  }
  return Object.freeze({render,bind,draftText,readDraft});
}
