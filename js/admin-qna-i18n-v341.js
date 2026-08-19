/* New Hope 7 Admin Q&A multilingual editor v3.4.1
   Adds FA/EN/HR fields only to Q&A cards and keeps all existing admin actions.
*/
(()=>{
  'use strict';
  const VERSION='3.4.1-admin-qna-i18n';
  let installed=false;

  function uiLang(){
    try{
      const v=String(typeof lang!=='undefined'?lang:'fa').toLowerCase();
      return ['fa','en','hr'].includes(v)?v:'fa';
    }catch(_){return'fa'}
  }
  function esc(v){
    try{return typeof h==='function'?h(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}catch(_){return String(v??'')}
  }
  function fieldValue(q,key){return String(q?.[key]??'')}
  function multilingualBlock(q){
    const id=String(q.id);
    const qlang=['fa','en','hr'].includes(String(q.language||'').toLowerCase())?String(q.language).toLowerCase():'fa';
    const originalQ=String(q.question_text||q.question||'');
    const qfa=fieldValue(q,'question_fa')||(qlang==='fa'?originalQ:'');
    const qen=fieldValue(q,'question_en')||(qlang==='en'?originalQ:'');
    const qhr=fieldValue(q,'question_hr')||(qlang==='hr'?originalQ:'');
    const originalA=String(q.answer_text||'');
    const alang=['fa','en','hr'].includes(String(q.answer_language||'').toLowerCase())?String(q.answer_language).toLowerCase():qlang;
    const afa=fieldValue(q,'answer_fa')||(alang==='fa'?originalA:'');
    const aen=fieldValue(q,'answer_en')||(alang==='en'?originalA:'');
    const ahr=fieldValue(q,'answer_hr')||(alang==='hr'?originalA:'');
    return `<details class="detail-box nh7-qna-i18n-box">
      <summary style="cursor:pointer;font-weight:800;color:#0f766e">🌐 ترجمه‌های پرسش و پاسخ / Q&A translations</summary>
      <p class="muted small">فقط این بخش مربوط به ترجمه‌های فارسی، انگلیسی و کرواتی است. متن اصلی پرسش حذف یا تغییر داده نمی‌شود.</p>
      <div class="grid3">
        <label>پرسش فارسی<textarea id="qfa_${esc(id)}">${esc(qfa)}</textarea></label>
        <label>Question EN<textarea id="qen_${esc(id)}" dir="ltr">${esc(qen)}</textarea></label>
        <label>Pitanje HR<textarea id="qhr_${esc(id)}" dir="ltr">${esc(qhr)}</textarea></label>
      </div>
      <div class="grid3">
        <label>پاسخ فارسی<textarea id="afa_${esc(id)}">${esc(afa)}</textarea></label>
        <label>Answer EN<textarea id="aen_${esc(id)}" dir="ltr">${esc(aen)}</textarea></label>
        <label>Odgovor HR<textarea id="ahr_${esc(id)}" dir="ltr">${esc(ahr)}</textarea></label>
      </div>
    </details>`;
  }

  function install(){
    if(installed)return true;
    if(typeof renderQuestionCard!=='function' || typeof authFetch!=='function' || typeof loadAll!=='function')return false;
    installed=true;

    const baseRender=renderQuestionCard;
    renderQuestionCard=function(q){
      const base=baseRender(q);
      const marker='<div class="actions three">';
      return base.includes(marker)?base.replace(marker,multilingualBlock(q)+marker):base+multilingualBlock(q);
    };

    answerQuestion=async function(id){
      const q=(typeof state!=='undefined'&&Array.isArray(state.questions))?state.questions.find(x=>String(x.id)===String(id)):null;
      const source=(document.getElementById('answer_'+id)?.value||'').trim();
      const values={
        question_fa:(document.getElementById('qfa_'+id)?.value||q?.question_fa||'').trim(),
        question_en:(document.getElementById('qen_'+id)?.value||q?.question_en||'').trim(),
        question_hr:(document.getElementById('qhr_'+id)?.value||q?.question_hr||'').trim(),
        answer_fa:(document.getElementById('afa_'+id)?.value||q?.answer_fa||'').trim(),
        answer_en:(document.getElementById('aen_'+id)?.value||q?.answer_en||'').trim(),
        answer_hr:(document.getElementById('ahr_'+id)?.value||q?.answer_hr||'').trim()
      };
      const originalQ=String(q?.question_text||q?.question||'').trim();
      const qlang=['fa','en','hr'].includes(String(q?.language||'').toLowerCase())?String(q.language).toLowerCase():'fa';
      if(originalQ&&!values['question_'+qlang])values['question_'+qlang]=originalQ;

      const current=uiLang();
      if(source)values['answer_'+current]=source;
      const anyAnswer=source||values.answer_fa||values.answer_en||values.answer_hr;
      if(!anyAnswer){alert(typeof tr==='function'?tr('answer'):'Answer required');return}

      let answerLanguage=current;
      let canonical=source;
      if(!canonical){
        if(values['answer_'+qlang]){canonical=values['answer_'+qlang];answerLanguage=qlang}
        else if(values.answer_fa){canonical=values.answer_fa;answerLanguage='fa'}
        else if(values.answer_en){canonical=values.answer_en;answerLanguage='en'}
        else {canonical=values.answer_hr;answerLanguage='hr'}
      }

      try{
        await authFetch('/rest/v1/qa_questions?id=eq.'+encodeURIComponent(id),{
          method:'PATCH',
          body:JSON.stringify(Object.assign({},values,{
            answer_text:canonical,
            answer_language:answerLanguage,
            status:'answered',
            answered_at:q?.answered_at||new Date().toISOString(),
            updated_at:new Date().toISOString()
          }))
        });
        if(typeof setMessage==='function')setMessage(typeof tr==='function'?tr('saved'):'Saved','success');
        await loadAll(true);
      }catch(e){
        if(typeof setMessage==='function')setMessage(e.message,'danger');
        alert(e.message);
      }
    };

    window.NH7_ADMIN_QNA_I18N_VERSION=VERSION;
    console.info('NH7 admin Q&A multilingual editor active',VERSION);
    return true;
  }

  if(!install()){
    let tries=0;
    const timer=setInterval(()=>{tries++;if(install()||tries>80)clearInterval(timer)},125);
  }
})();