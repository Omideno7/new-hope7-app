/* New Hope 7 — assignment review UI v4.6.7. Server rules remain authoritative. */
export function createSchoolReviewV467(d){
  const L=(fa,en,hr)=>d.lang()==='fa'?fa:d.lang()==='hr'?hr:en;
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const owner=()=>String(d.email()||'').trim().toLowerCase();
  const key=(email,code)=>'nh7_school_assignment_draft_v467:'+encodeURIComponent(email)+':'+encodeURIComponent(code);
  function saved(email,code){try{const x=JSON.parse(d.storage.getItem(key(email,code))||'null');return x?.owner===email&&x?.lesson===code&&typeof x.text==='string'?x:null}catch(_){return null}}
  function legacy(email,lesson){
    try{const marked=d.storage.getItem('nh7_school_assignment_legacy_owner_v467:'+lesson);return !marked||marked===email?d.storage.getItem('nh7_note_school-'+lesson)||'':''}catch(_){return ''}
  }
  function state(row){const status=String(row?.status||'').toLowerCase();return ['submitted','needs_revision','approved'].includes(status)?status:'unsubmitted'}
  function copy(row,hasDraft=false){
    switch(state(row)){
      case 'approved':return {title:L('تکلیف تأیید شده','Assignment approved','Zadatak odobren'),body:L('ادمین این پاسخ را پذیرفته است. پاسخ تأییدشده فقط خواندنی است؛ وضعیت بازشدن آزمون را در صفحهٔ کلاس‌ها ببینید.','The administrator has accepted this answer. It is read-only; check the class page for exam availability.','Administrator je prihvatio ovaj odgovor. Odgovor je samo za čitanje; dostupnost ispita provjerite na stranici razreda.')};
      case 'needs_revision':return {title:L('نیاز به اصلاح','Needs revision','Potrebna dorada'),body:L('بازخورد ادمین را بخوانید، پاسخ را اصلاح کنید و «ارسال پاسخ اصلاح‌شده» را بزنید. ذخیرهٔ پیش‌نویس به‌تنهایی آن را برای بررسی نمی‌فرستد.','Read the administrator’s feedback, revise your answer and choose “Submit revised answer”. Saving a draft alone does not send it for review.','Pročitajte povratnu informaciju administratora, ispravite odgovor i odaberite „Predaj ispravljeni odgovor”. Samo spremanje skice ne šalje odgovor na pregled.')};
      case 'submitted':return {title:L('ارسال شده؛ در انتظار بررسی','Submitted; awaiting review','Poslano; čeka pregled'),body:L('پاسخ ثبت شده و منتظر بررسی ادمین است. ارسال با تأیید تفاوت دارد؛ برای بازشدن آزمون باید شرایط کلاس و تأیید تکالیف کامل شود.','Your answer has been submitted and awaits review. Submission is not approval; the class requirements and assignment approvals must be complete before the exam opens.','Odgovor je predan i čeka pregled. Predaja nije odobrenje; prije otvaranja ispita moraju biti ispunjeni uvjeti razreda i odobreni zadaci.')};
      default:return {title:hasDraft?L('پیش‌نویس ذخیره‌شده','Saved draft','Spremljena skica'):L('هنوز ارسال نشده','Not submitted yet','Još nije predano'),body:L('پاسخ خود را بنویسید. «ذخیرهٔ پیش‌نویس» نوشته را نگه می‌دارد؛ «ارسال تکلیف برای بررسی» آن را به ادمین می‌فرستد.','Write your answer. “Save draft” keeps your writing; “Submit for review” sends the assignment to the administrator.','Napišite odgovor. „Spremi skicu” čuva tekst; „Predaj na pregled” šalje zadatak administratoru.')};
    }
  }
  function render({question,row,lesson}){
    const draft=saved(owner(),lesson),approved=state(row)==='approved';
    const text=approved?String(row?.answer_text||''):draft?draft.text:String(row?.answer_text||legacy(owner(),lesson));
    const c=copy(row,!!draft);
    return `<section class="school-assignment nh7-school-review-v467" data-review-lesson="${E(lesson)}"><div class="nh7-review-heading467"><span aria-hidden="true">📝</span><h3>${E(L('تکلیف درس','Lesson assignment','Zadatak lekcije'))}</h3></div><p class="nh7-review-question467">${E(question)}</p><div class="nh7-review-status467" data-state="${state(row)}"><strong data-review-title>${E(c.title)}</strong><p data-review-help>${E(c.body)}</p></div><div class="nh7-review-feedback467" data-review-feedback ${row?.admin_feedback?'':'hidden'}><strong>${E(L('بازخورد ادمین','Administrator feedback','Povratna informacija administratora'))}</strong><p data-review-feedback-text>${E(row?.admin_feedback||'')}</p></div><label for="schoolAssignmentAnswer" class="nh7-review-label467">${E(L('پاسخ شما','Your answer','Vaš odgovor'))}</label><textarea id="schoolAssignmentAnswer" rows="7" ${approved?'readonly':''} placeholder="${E(L('پاسخ تکلیف را اینجا بنویسید','Write your assignment answer here','Ovdje napišite odgovor na zadatak'))}">${E(text)}</textarea><p class="nh7-review-message467" data-review-message role="status" aria-live="polite"></p><div class="button-row"><button type="button" class="secondary-btn" id="saveSchoolAssignmentDraft" ${approved?'disabled':''}>${E(L('ذخیرهٔ پیش‌نویس','Save draft','Spremi skicu'))}</button><button type="button" class="primary-btn" id="submitSchoolAssignment" ${approved?'disabled':''}></button></div><button type="button" class="link-button nh7-review-refresh467" data-review-refresh>↻ ${E(L('بررسی آخرین وضعیت','Check latest status','Provjeri najnoviji status'))}</button><details class="nh7-review-server467" data-review-server ${row?.answer_text?'':'hidden'}><summary>${E(L('مشاهدهٔ آخرین پاسخ ارسال‌شده','View last submitted answer','Prikaži posljednji predani odgovor'))}</summary><p data-review-server-text>${E(row?.answer_text||'')}</p></details></section>`;
  }
  function bind(root,{row:initial,lesson,course,snapshot={}}){
    if(!root)return;
    const account=owner();let row=initial,busy=false;
    const answer=root.querySelector('#schoolAssignmentAnswer'),save=root.querySelector('#saveSchoolAssignmentDraft'),submit=root.querySelector('#submitSchoolAssignment'),refresh=root.querySelector('[data-review-refresh]');
    const alive=()=>root.isConnected&&owner()===account&&d.isLoggedIn();
    const message=(text,error=false)=>{if(!root.isConnected)return;const n=root.querySelector('[data-review-message]');n.textContent=text;n.dataset.error=error?'1':'0'};
    const localOnly=L('پیش‌نویس روی این دستگاه ذخیره شد؛ هنوز برای بررسی ارسال نشده است.','Draft saved on this device; it has not been submitted for review.','Skica je spremljena na ovom uređaju; još nije predana na pregled.');
    function remember(text){
      if(!alive())throw Error('account_changed');
      d.storage.setItem(key(account,lesson),JSON.stringify({owner:account,lesson,text,saved_at:new Date().toISOString()}));
      // Preserve compatibility with existing My Notes; do not delete or reset old keys.
      try{d.storage.setItem('nh7_note_school-'+lesson,text);d.storage.setItem('nh7_school_assignment_legacy_owner_v467:'+lesson,account)}catch(_){}
    }
    function paint(){
      if(!root.isConnected)return;
      const approved=state(row)==='approved',c=copy(row,!!saved(account,lesson));
      root.querySelector('[data-review-title]').textContent=c.title;
      root.querySelector('[data-review-help]').textContent=c.body;
      root.querySelector('.nh7-review-status467').dataset.state=state(row);
      root.querySelector('[data-review-feedback]').hidden=!row?.admin_feedback;
      root.querySelector('[data-review-feedback-text]').textContent=row?.admin_feedback||'';
      root.querySelector('[data-review-server]').hidden=!row?.answer_text;
      root.querySelector('[data-review-server-text]').textContent=row?.answer_text||'';
      save.disabled=submit.disabled=busy||approved;refresh.disabled=busy;answer.readOnly=approved||busy;
      submit.textContent=busy?L('در حال انجام…','Working…','U tijeku…'):approved?c.title:state(row)==='needs_revision'?L('ارسال پاسخ اصلاح‌شده','Submit revised answer','Predaj ispravljeni odgovor'):state(row)==='submitted'?L('ارسال پاسخ به‌روزشده','Submit updated answer','Predaj ažurirani odgovor'):L('ارسال تکلیف برای بررسی','Submit for review','Predaj na pregled');
    }
    function preserveBeforeUpdate(fresh){
      const typed=answer.value,old=String(row?.answer_text||'');
      if(typed!==old&&state(row)!=='approved')remember(typed);
      row=fresh;
      if(state(row)==='approved')answer.value=String(row?.answer_text||'');
      else {const draft=saved(account,lesson);answer.value=draft?draft.text:String(row?.answer_text||'')}
    }
    async function syncDraft(text){
      // The existing cloud queue may defer this write; never announce cloud success.
      if(alive())try{await d.saveNote('note_school-'+lesson,text)}catch(_){}
    }
    save.onclick=()=>{
      if(busy||state(row)==='approved')return;
      try{remember(answer.value);message(localOnly);paint();syncDraft(answer.value)}catch(_){message(L('ذخیرهٔ پیش‌نویس انجام نشد. نوشته هنوز در کادر است؛ پیش از خروج آن را کپی کنید.','The draft could not be saved. Your text is still here; copy it before leaving.','Skicu nije moguće spremiti. Tekst je još ovdje; kopirajte ga prije izlaska.'),true)}
    };
    submit.onclick=async()=>{
      if(busy||state(row)==='approved')return;
      const text=answer.value.trim();
      if(!alive()){message(L('برای ارسال، وارد حساب خود شوید.','Sign in to submit your answer.','Prijavite se za predaju odgovora.'),true);return}
      if(text.length<10){message(L('لطفاً پاسخ کامل‌تری بنویسید؛ حداقل ۱۰ نویسه لازم است.','Please write a fuller answer; at least 10 characters are required.','Napišite potpuniji odgovor; potrebno je najmanje 10 znakova.'),true);answer.focus();return}
      try{remember(answer.value)}catch(_){message(L('پیش‌نویس ذخیره نشد؛ متن را کپی کنید و دوباره تلاش کنید.','The draft was not saved; copy your text and try again.','Skica nije spremljena; kopirajte tekst i pokušajte ponovno.'),true);return}
      if(!d.online()){message(localOnly+' '+L('برای ارسال به اینترنت متصل شوید.','Connect to the internet to submit.','Povežite se s internetom za predaju.'),true);paint();return}
      busy=true;paint();message('');
      try{
        let result=await d.rpc('nh7_submit_school_assignment',{p_course_code:course,p_lesson_code:lesson,p_answer_text:text,p_language:d.lang(),p_user_name:d.name()||''});
        if(!alive())return;
        if(Array.isArray(result))result=result[0];
        if(!result||result.lesson_code!==lesson||!['submitted','approved'].includes(result.status)){
          message(L('درخواست پاسخ داده شد، اما وضعیت نهایی تأیید نشد. «بررسی آخرین وضعیت» را بزنید؛ پیش‌نویس محفوظ است.','The request returned, but its final status could not be confirmed. Check the latest status; your draft is safe.','Zahtjev je dobio odgovor, ali konačni status nije potvrđen. Provjerite najnoviji status; skica je sačuvana.'),true);return;
        }
        row=result;answer.value=String(result.answer_text??text);try{remember(answer.value)}catch(_){}
        message(L('پاسخ برای بررسی ارسال شد. منتظر تصمیم ادمین بمانید.','Your answer was submitted for review. Please wait for the administrator’s decision.','Odgovor je predan na pregled. Pričekajte odluku administratora.'));
        syncDraft(answer.value);
      }catch(error){
        if(!alive())return;
        const approved=/assignment_already_approved/i.test(String(error?.message||''));
        message(approved?L('ادمین این تکلیف را تأیید کرده است. برای دیدن پاسخ تأییدشده «بررسی آخرین وضعیت» را بزنید؛ پیش‌نویس شما محفوظ است.','This assignment has already been approved. Check the latest status to see the accepted answer; your draft is safe.','Ovaj je zadatak već odobren. Provjerite najnoviji status za prihvaćeni odgovor; skica je sačuvana.'):L('ارسال تأیید نشد؛ ممکن است ارتباط قطع شده باشد. پیش‌نویس محفوظ است. پیش از ارسال مجدد، آخرین وضعیت را بررسی کنید.','Submission was not confirmed; the connection may have been interrupted. Your draft is safe. Check the latest status before submitting again.','Predaja nije potvrđena; veza je možda prekinuta. Skica je sačuvana. Prije ponovne predaje provjerite najnoviji status.'),true);
      }finally{busy=false;if(alive())paint()}
    };
    refresh.onclick=async()=>{
      if(busy||!alive())return;
      if(!d.online()){message(L('آفلاین هستید؛ وضعیت نمایش‌داده‌شده ممکن است قدیمی باشد. نوشتهٔ شما تغییر نکرده است.','You are offline; the displayed status may be out of date. Your writing has not changed.','Izvan mreže ste; prikazani status možda nije aktualan. Vaš tekst nije promijenjen.'),true);return}
      // Save edits before a read-only refresh so admin updates cannot erase them.
      try{if(state(row)!=='approved'&&answer.value!==String(row?.answer_text||''))remember(answer.value)}catch(_){message(L('نوشته را ابتدا کپی کنید؛ ذخیرهٔ پیش‌نویس در دسترس نیست.','Copy your writing first; draft storage is unavailable.','Najprije kopirajte tekst; spremanje skice nije dostupno.'),true);return}
      busy=true;paint();
      try{
        const next=await d.snapshot(account,true);if(!alive())return;
        if(next?.error||next?.from_cache||next?.offline||!Array.isArray(next?.assignments))throw Error('stale_snapshot');
        const fresh=next.assignments.find(x=>String(x.lesson_code)===lesson)||null;
        preserveBeforeUpdate(fresh);
        const retained=!!saved(account,lesson)&&state(row)==='approved';
        message(retained?L('وضعیت تازه دریافت شد. پاسخ تأییدشده نمایش داده می‌شود و پیش‌نویس شما نیز روی این دستگاه محفوظ است.','Status updated. The approved answer is displayed; your draft is also preserved on this device.','Status je ažuriran. Prikazan je odobreni odgovor; vaša je skica također sačuvana na ovom uređaju.'):L('وضعیت تازه دریافت شد؛ نوشتهٔ ذخیره‌شدهٔ شما محفوظ است.','Status updated; your saved writing is preserved.','Status je ažuriran; vaš spremljeni tekst je sačuvan.'));
      }catch(_){if(alive())message(L('دریافت وضعیت تازه کامل نشد؛ وضعیت قبلی و نوشتهٔ شما حفظ شدند.','The latest status could not be retrieved; the previous status and your writing were kept.','Najnoviji status nije dohvaćen; sačuvani su prethodni status i vaš tekst.'),true)}
      finally{busy=false;if(alive())paint()}
    };
    paint();
    if(snapshot.error||snapshot.offline||snapshot.from_cache)message(L('این وضعیت از نسخهٔ ذخیره‌شده است. برای وضعیت تازه، اتصال اینترنت را بررسی کنید.','This is a saved status. Check your connection to obtain the latest status.','Ovo je spremljeni status. Provjerite vezu za najnoviji status.'));
    else {const draft=saved(account,lesson);if(draft&&state(row)!=='approved'&&(!row||draft.text.trim()!==String(row.answer_text||'').trim()))message(localOnly);}
  }
  return Object.freeze({render,bind});
}
