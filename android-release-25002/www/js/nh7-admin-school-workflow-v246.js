/* New Hope 7 Admin v2.4.0.246 — assignment review, grading and hard-delete patch. */
(()=>{'use strict';
const V='2.4.0.246';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const E=v=>typeof h==='function'?h(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clampScore=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));

function assignmentScoreForDisplay(a){
  const status=String(a?.status||'submitted').toLowerCase();
  if(status==='submitted'&&!a?.reviewed_at)return 0;
  return clampScore(a?.score_percent??0);
}

async function reviewAssignmentV246(id,status){
  const scoreEl=document.getElementById('as_score_'+id);
  const feedbackEl=document.getElementById('as_feedback_'+id);
  const raw=String(scoreEl?.value??'').trim();
  if(raw===''){
    alert(L('لطفاً نمره تکلیف را از ۰ تا ۱۰۰ وارد کنید.','Enter an assignment score from 0 to 100.','Unesite ocjenu zadatka od 0 do 100.'));
    scoreEl?.focus();return;
  }
  const score=Number(raw);
  if(!Number.isFinite(score)||score<0||score>100){
    alert(L('نمره باید عددی بین ۰ تا ۱۰۰ باشد.','Score must be a number between 0 and 100.','Ocjena mora biti broj od 0 do 100.'));
    scoreEl?.focus();return;
  }
  const feedback=feedbackEl?.value||'';
  try{
    await adminRpc('nh7_admin_review_school_assignment',{
      p_id:id,
      p_status:status,
      p_score:Math.round(score),
      p_feedback:feedback
    });
    await loadAll(true);
    alert(status==='approved'
      ?L('تکلیف تأیید و نمره ذخیره شد.','Assignment approved and grade saved.','Zadatak je odobren i ocjena spremljena.')
      :L('تکلیف برای اصلاح به دانشجو برگشت داده شد و تا زمان ارسال مجدد از صف بررسی شما خارج می‌شود.','Assignment returned for revision and removed from your review queue until the student resubmits it.','Zadatak je vraćen na doradu i uklonjen iz reda za pregled dok ga student ponovno ne pošalje.'));
  }catch(e){alert(e?.message||String(e))}
}

async function deleteAssignmentV246(id){
  const item=Array.isArray(state?.schoolAssignments)?state.schoolAssignments.find(x=>String(x.id)===String(id)):null;
  const who=item?.user_name||item?.user_email||'';
  const lesson=typeof assignmentLessonTitle==='function'?assignmentLessonTitle(item?.lesson_code||''):item?.lesson_code||'';
  const msg=L(
    `این تکلیف${who?' برای «'+who+'»':''}${lesson?' در «'+lesson+'»':''} کاملاً پاک شود؟\n\nپس از حذف، دانشجو می‌تواند تکلیف را از ابتدا بنویسد و دوباره ارسال کند. این عمل قابل بازگشت نیست.`,
    `Permanently delete this assignment${who?' for “'+who+'”':''}${lesson?' in “'+lesson+'”':''}?\n\nAfter deletion, the student can write and submit it again from scratch. This cannot be undone.`,
    `Trajno izbrisati ovaj zadatak${who?' za „'+who+'”':''}${lesson?' u „'+lesson+'”':''}?\n\nNakon brisanja student može zadatak napisati i ponovno poslati od početka. Ova se radnja ne može poništiti.`
  );
  if(!confirm(msg))return;
  try{
    const ok=await adminRpc('nh7_admin_delete_school_assignment',{p_id:id});
    if(ok===false)throw new Error(L('تکلیف پیدا نشد.','Assignment not found.','Zadatak nije pronađen.'));
    await loadAll(true);
    alert(L('تکلیف کاملاً حذف شد و امکان ارسال مجدد برای دانشجو باز است.','Assignment deleted. The student can submit it again.','Zadatak je izbrisan. Student ga može ponovno poslati.'));
  }catch(e){alert(e?.message||String(e))}
}

function renderAssignmentCardV246(a){
  const score=assignmentScoreForDisplay(a);
  const status=String(a.status||'submitted').toLowerCase();

  // Admin review queue should contain only items that need an admin decision.
  // A "needs_revision" item remains safely stored for the student, but is hidden
  // from the admin queue until the student edits and resubmits it. The existing
  // submit RPC changes its status back to "submitted", so it automatically
  // appears here again with no database or mobile-app changes required.
  if(status==='needs_revision')return '';

  const scoreHint=status==='submitted'
    ?L('هنوز نمره‌گذاری نشده','Not graded yet','Još nije ocijenjeno')
    :L('نمره نهایی تأییدشده','Approved final grade','Odobrena završna ocjena');
  return `<article class="request-card" data-assignment-id="${E(a.id)}"><div class="req-head"><div><div class="req-name">${E(a.user_name||'-')}</div><div class="req-meta">${E(a.user_email)}<br>${E(typeof assignmentLessonTitle==='function'?assignmentLessonTitle(a.lesson_code):a.lesson_code)} · ${E(a.course_code||'foundation_school')}<br>${E(a.submitted_at?new Date(a.submitted_at).toLocaleString():'')}</div></div><span class="pill ${status==='approved'?'approved':'pending'}">${E(typeof assignmentAdminStatus==='function'?assignmentAdminStatus(status):status)}</span></div><div class="detail-box"><p>${E(a.answer_text||'')}</p></div><div class="grid2"><label>${L('نمره تکلیف (۰ تا ۱۰۰)','Assignment score (0–100)','Ocjena zadatka (0–100)')}<input id="as_score_${E(a.id)}" type="number" inputmode="numeric" min="0" max="100" step="1" value="${score}"><small class="muted">${E(scoreHint)}</small></label><label>${L('بازخورد مدیر','Admin feedback','Povratna informacija administratora')}<textarea id="as_feedback_${E(a.id)}" placeholder="${E(L('در صورت نیاز توضیح یا نکته اصلاحی را بنویسید…','Add feedback or revision instructions if needed…','Po potrebi upišite povratnu informaciju ili upute za doradu…'))}">${E(a.admin_feedback||'')}</textarea></label></div><div class="actions three"><button class="btn primary" onclick="reviewSchoolAssignment('${E(a.id)}','approved')">✓ ${L('تأیید و ثبت نمره','Approve & save grade','Odobri i spremi ocjenu')}</button><button class="btn secondary" onclick="reviewSchoolAssignment('${E(a.id)}','needs_revision')">↻ ${L('نیاز به اصلاح','Needs revision','Potrebna dorada')}</button><button class="btn danger-btn" onclick="nh7DeleteSchoolAssignmentV246('${E(a.id)}')">🗑 ${L('حذف کامل تکلیف','Delete assignment','Izbriši zadatak')}</button></div></article>`;
}

function install(){
  window.reviewSchoolAssignment=reviewAssignmentV246;
  window.nh7DeleteSchoolAssignmentV246=deleteAssignmentV246;
  window.renderSchoolAssignmentCard=renderAssignmentCardV246;
  try{if(typeof render==='function')render()}catch(e){console.warn('[NH7 school workflow] initial render',e)}
  console.info('[NH7] admin school workflow',V,'ready');
}

if(document.readyState==='complete')setTimeout(install,0);
else window.addEventListener('load',()=>setTimeout(install,0),{once:true});
})();
