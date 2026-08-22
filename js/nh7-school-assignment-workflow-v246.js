/* New Hope 7 Client v2.4.0.246 — assignment revision/resubmission UX patch. */
(()=>{'use strict';
const V='2.4.0.246';
const lang=()=>document.getElementById('langSelect')?.value||document.documentElement.lang||'en';
const T=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
function needsRevision(section){const text=String(section?.querySelector('.notice')?.textContent||'').toLowerCase();return text.includes('نیاز به اصلاح')||text.includes('needs revision')||text.includes('potrebna dorada')}
function pending(section){const text=String(section?.querySelector('.notice')?.textContent||'').toLowerCase();return text.includes('در انتظار')||text.includes('pending')||text.includes('čeka pregled')}
function enhance(){
  document.querySelectorAll('.school-assignment').forEach(section=>{
    const textarea=section.querySelector('#schoolAssignmentAnswer');
    const draft=section.querySelector('#saveSchoolAssignmentDraft');
    const submit=section.querySelector('#submitSchoolAssignment');
    const notice=section.querySelector('.notice');
    if(needsRevision(section)){
      if(textarea)textarea.disabled=false;
      if(draft)draft.disabled=false;
      if(submit){submit.disabled=false;submit.textContent=T('ارسال مجدد پس از اصلاح','Resubmit after revision','Ponovno pošalji nakon dorade')}
      if(notice&&!section.querySelector('[data-nh7-revision-help-v246]')){
        const box=document.createElement('div');box.dataset.nh7RevisionHelpV246='1';box.className='notice';box.style.cssText='background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;margin-top:10px';box.innerHTML=`<strong>${T('✏️ این تکلیف برای اصلاح برگشته است.','✏️ This assignment was returned for revision.','✏️ Ovaj zadatak je vraćen na doradu.')}</strong><br>${T('متن را ویرایش کن و سپس «ارسال مجدد پس از اصلاح» را بزن. نسخه جدید دوباره برای بررسی مدیر ارسال می‌شود.','Edit your answer, then choose “Resubmit after revision”. The new version will return to the administrator for review.','Uredite odgovor i odaberite „Ponovno pošalji nakon dorade”. Nova verzija ponovno ide administratoru na pregled.')}`;notice.insertAdjacentElement('afterend',box)
      }
    }else{
      section.querySelector('[data-nh7-revision-help-v246]')?.remove();
      if(pending(section)&&submit&&!submit.disabled)submit.textContent=T('تکلیف ارسال شده — ارسال نسخه جدید','Assignment submitted — submit updated version','Zadatak predan — pošalji ažuriranu verziju');
    }
  })
}
const observer=new MutationObserver(()=>enhance());
function start(){if(document.body)observer.observe(document.body,{childList:true,subtree:true});enhance();document.getElementById('langSelect')?.addEventListener('change',()=>setTimeout(enhance,0));console.info('[NH7] assignment revision UX',V,'ready')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
