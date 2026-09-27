/* New Hope 7 Admin Q&A AI v4.9.3 — Persian-draft editing workflow.
 * Scope is intentionally limited to the Admin > Q&A workflow.
 * AI draft/translation requests may wait up to 4 minutes.
 * No app-user, school, sermon, database-schema, or other admin workflow changes.
 */
(()=>{'use strict';
if(window.__NH7_ADMIN_QNA_AI_V493__)return;
window.__NH7_ADMIN_QNA_AI_V493__=true;
const VERSION='4.9.3-admin-qna-persian-draft';
const LANGS=['fa','en','hr'];
const QNA_AI_TIMEOUT_MS=240000;
const L=(fa,en,hr)=>{const v=String(typeof lang!=='undefined'?lang:'fa').toLowerCase();return v==='fa'?fa:v==='hr'?hr:en};
const qrow=id=>(typeof state!=='undefined'&&Array.isArray(state.questions))?state.questions.find(x=>String(x.id)===String(id)):null;
const qlang=q=>LANGS.includes(String(q?.language||'').toLowerCase())?String(q.language).toLowerCase():'fa';
const field=(prefix,l,id)=>document.getElementById(prefix+l+'_'+id);
const value=(prefix,l,id)=>String(field(prefix,l,id)?.value||'').trim();

function esc(v){return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function controlsHtml(q){
  const id=String(q.id);
  return '<div class="nh7-ai490-qna" data-nh7-ai-qna="'+esc(id)+'">'
    +'<div class="nh7-ai490-actions">'
    +'<button type="button" class="btn secondary" data-nh7-ai-button onclick="window.nh7AiTranslateQuestionV493&&window.nh7AiTranslateQuestionV493(\''+esc(id)+'\')">✨ ترجمه سؤال</button>'
    +'<button type="button" class="btn primary" data-nh7-ai-button onclick="window.nh7AiDraftAnswerV493&&window.nh7AiDraftAnswerV493(\''+esc(id)+'\')">🤖 پیش‌نویس پاسخ فارسی با AI</button>'
    +'<button type="button" class="btn secondary" data-nh7-ai-button onclick="window.nh7AiTranslateAnswerV493&&window.nh7AiTranslateAnswerV493(\''+esc(id)+'\')">✨ ترجمه پاسخ</button>'
    +'</div><div class="nh7-ai490-draft-note">پیش‌نویس AI فقط فارسی است. آن را ویرایش کن، سپس «ترجمه پاسخ» را بزن.</div>'
    +'<small data-nh7-ai-provider-note class="nh7-ai490-provider"></small>'
    +'<small id="nh7AiQnaStatus_'+esc(id)+'" class="nh7-ai490-status"></small></div>';
}
function setStatus(id,text,type=''){
  const el=document.getElementById('nh7AiQnaStatus_'+id);
  if(!el)return;
  el.textContent=String(text||'');
  el.className='nh7-ai490-status '+(type?'is-'+type:'');
}
function accessToken(){
  try{if(typeof token==='string'&&token)return token}catch(_){}
  return localStorage.getItem('nh7_admin_token')||'';
}
function endpoint(){
  try{if(typeof SUPABASE_URL==='string'&&SUPABASE_URL)return SUPABASE_URL+'/functions/v1/nh7-admin-ai-v490'}catch(_){}
  return 'https://gpzcwffxnddhaeaogdyo.supabase.co/functions/v1/nh7-admin-ai-v490';
}
function apiKey(){
  try{if(typeof SUPABASE_KEY==='string'&&SUPABASE_KEY)return SUPABASE_KEY}catch(_){}
  return 'sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
}
async function parseResponse(response){
  const raw=await response.text();
  let data={};
  try{data=raw?JSON.parse(raw):{}}catch(_){data={error:raw||('HTTP '+response.status)}}
  if(!response.ok){
    const error=new Error(data?.error||data?.message||raw||('HTTP '+response.status));
    error.status=response.status;
    error.code=data?.code||'';
    throw error;
  }
  return data;
}
async function requestAI(payload,retry=true){
  const jwt=accessToken();
  if(!jwt)throw new Error(L('نشست مدیر آماده نیست. یک بار پنل را تازه‌سازی کنید.','Admin session is not ready. Refresh the panel once.','Administratorska sesija nije spremna. Osvježite panel.'));
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),QNA_AI_TIMEOUT_MS);
  try{
    const response=await fetch(endpoint(),{
      method:'POST',
      cache:'no-store',
      signal:controller.signal,
      headers:{apikey:apiKey(),Authorization:'Bearer '+jwt,'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    if(response.status===401&&retry&&typeof refreshAdminSession==='function'){
      clearTimeout(timer);
      const refreshed=await refreshAdminSession();
      if(refreshed)return requestAI(payload,false);
    }
    const data=await parseResponse(response);
    if(data?.ok===false)throw Object.assign(new Error(data?.error||L('AI پاسخ نداد.','AI request failed.','AI zahtjev nije uspio.')),{code:data?.code||''});
    return data;
  }catch(error){
    if(error?.name==='AbortError')throw new Error(L('پاسخ AI بیشتر از ۴ دقیقه طول کشید. دوباره تلاش کنید.','The AI response took longer than 4 minutes. Please try again.','AI odgovor je trajao dulje od 4 minute. Pokušajte ponovno.'));
    throw error;
  }finally{clearTimeout(timer)}
}
function fill(prefix,id,data,overwrite=false){
  for(const l of LANGS){
    const el=field(prefix,l,id);
    if(el&&data?.[l]&&(overwrite||!String(el.value||'').trim()))el.value=String(data[l]).trim();
  }
}
function patchState(q,prefix,data){
  if(!q)return;
  for(const l of LANGS)if(data?.[l])q[prefix+'_'+l]=String(data[l]).trim();
}
function setPersianAnswer(id,text){
  const next=String(text||'').trim();
  const main=document.getElementById('answer_'+id);
  const fa=field('a','fa',id);
  if(main)main.value=next;
  if(fa)fa.value=next;
  const q=qrow(id);if(q)q.answer_fa=next;
  return next;
}
function persianAnswer(id){
  const fa=value('a','fa',id);
  const main=String(document.getElementById('answer_'+id)?.value||'').trim();
  const text=fa||main;
  if(text)setPersianAnswer(id,text);
  return text;
}
function clearTranslations(id){
  for(const l of ['en','hr']){
    const el=field('a',l,id);if(el)el.value='';
    const q=qrow(id);if(q)q['answer_'+l]='';
  }
}
async function translateQuestion(id){
  const q=qrow(id);if(!q)return;
  const sourceLang=qlang(q);
  const source=String(q.question_text||q.question||q['question_'+sourceLang]||'').trim();
  if(!source)return;
  setStatus(id,L('در حال ترجمه سؤال…','Translating question…','Prevodim pitanje…'),'busy');
  try{
    const result=await requestAI({action:'translate',text:source,source_language:sourceLang,kind:'question'});
    const data=result.translations||{};
    fill('q',id,data,false);patchState(q,'question',data);
    if(typeof authFetch==='function'){
      const payload={updated_at:new Date().toISOString()};
      for(const l of LANGS){
        const v=value('q',l,id)||String(q['question_'+l]||'').trim();
        if(v)payload['question_'+l]=v;
      }
      await authFetch('/rest/v1/qa_questions?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(payload)});
    }
    setStatus(id,L('ترجمه سؤال ذخیره شد ✓','Question translations saved ✓','Prijevodi pitanja su spremljeni ✓'),'ok');
  }catch(e){setStatus(id,e.message||String(e),'error')}
}
async function translateAnswer(id,quiet=false){
  const q=qrow(id);if(!q)return null;
  const text=persianAnswer(id);
  if(!text){
    if(!quiet)alert(L('ابتدا پیش‌نویس فارسی را بنویسید یا ویرایش کنید.','Write or edit the Persian draft first.','Najprije napišite ili uredite perzijski nacrt.'));
    return null;
  }
  if(!quiet)setStatus(id,L('در حال ترجمه نسخهٔ فارسیِ ویرایش‌شده…','Translating the edited Persian version…','Prevodim uređenu perzijsku verziju…'),'busy');
  const result=await requestAI({action:'translate',text,source_language:'fa',kind:'answer'});
  const data=Object.assign({},result.translations||{},{fa:text});
  setPersianAnswer(id,text);
  const en=field('a','en',id),hr=field('a','hr',id);
  if(en)en.value=String(data.en||'').trim();
  if(hr)hr.value=String(data.hr||'').trim();
  patchState(q,'answer',data);
  if(!quiet)setStatus(id,L('همین نسخهٔ فارسیِ ویرایش‌شده به انگلیسی و کرواتی ترجمه شد ✓','This edited Persian version was translated into English and Croatian ✓','Ova uređena perzijska verzija prevedena je na engleski i hrvatski ✓'),'ok');
  return data;
}
async function draftAnswer(id){
  const q=qrow(id);if(!q)return;
  const sourceQuestion=String(q.question_text||q.question||q['question_'+qlang(q)]||'').trim();
  if(!sourceQuestion)return;
  const current=persianAnswer(id);
  if(current&&!confirm(L('پاسخ فارسی فعلی با پیش‌نویس جدید AI جایگزین شود؟','Replace the current Persian answer with a new AI draft?','Zamijeniti trenutni perzijski odgovor novim AI nacrtom?')))return;
  setStatus(id,L('AI در حال نوشتن پیش‌نویس فارسی…','AI is drafting a Persian answer…','AI priprema perzijski nacrt…'),'busy');
  try{
    const result=await requestAI({action:'draft_answer',question:sourceQuestion,question_language:qlang(q),answer_language:'fa'});
    const answer=String(result.answer||'').trim();
    if(!answer)throw new Error(L('پیش‌نویس خالی بود.','The AI draft was empty.','AI nacrt je prazan.'));
    setPersianAnswer(id,answer);
    clearTranslations(id);
    setStatus(id,L('پیش‌نویس فارسی آماده است. آن را ویرایش کن؛ سپس «ترجمه پاسخ» را بزن ✓','Persian draft is ready. Edit it, then tap “Translate answer” ✓','Perzijski nacrt je spreman. Uredite ga, zatim dodirnite „Prevedi odgovor” ✓'),'ok');
  }catch(e){setStatus(id,e.message||String(e),'error')}
}
async function saveAnswer(id){
  const q=qrow(id);if(!q)return;
  const text=persianAnswer(id);
  if(!text){alert(L('پاسخ فارسی را بنویسید.','Persian answer is required.','Perzijski odgovor je obavezan.'));return}
  if(!value('a','en',id)||!value('a','hr',id)){
    const msg=L('ابتدا نسخهٔ فارسی را نهایی کن و «ترجمه پاسخ» را بزن؛ سپس ذخیره کن.','Finalize the Persian version and tap “Translate answer” before saving.','Dovršite perzijsku verziju i dodirnite „Prevedi odgovor” prije spremanja.');
    setStatus(id,msg,'error');alert(msg);return;
  }
  setStatus(id,L('در حال ذخیره پاسخ و ترجمه‌ها…','Saving answer and translations…','Spremanje odgovora i prijevoda…'),'busy');
  try{
    const qSource=qlang(q);
    const originalQ=String(q.question_text||q.question||'').trim();
    const values={};
    for(const l of LANGS){
      values['question_'+l]=(value('q',l,id)||String(q['question_'+l]||'')).trim();
      values['answer_'+l]=(value('a',l,id)||String(q['answer_'+l]||'')).trim();
    }
    if(originalQ&&!values['question_'+qSource])values['question_'+qSource]=originalQ;
    values.answer_fa=text;
    if(typeof authFetch!=='function')throw new Error('Admin save service is unavailable.');
    await authFetch('/rest/v1/qa_questions?id=eq.'+encodeURIComponent(id),{
      method:'PATCH',
      body:JSON.stringify(Object.assign({},values,{
        answer_text:text,
        answer_language:'fa',
        status:'answered',
        answered_at:q.answered_at||new Date().toISOString(),
        updated_at:new Date().toISOString()
      }))
    });
    setStatus(id,L('پاسخ و ترجمه‌ها ذخیره شد ✓','Answer and translations saved ✓','Odgovor i prijevodi su spremljeni ✓'),'ok');
    if(typeof setMessage==='function')setMessage(typeof tr==='function'?tr('saved'):'Saved','success');
    if(typeof loadAll==='function')await loadAll(true);
  }catch(e){
    setStatus(id,e.message||String(e),'error');
    if(typeof setMessage==='function')setMessage(e.message||String(e),'danger');
  }
}
function install(){
  window.nh7AiTranslateQuestionV493=id=>translateQuestion(id);
  window.nh7AiTranslateAnswerV493=id=>translateAnswer(id,false).catch(e=>setStatus(id,e.message||String(e),'error'));
  window.nh7AiDraftAnswerV493=id=>draftAnswer(id);
  try{answerQuestion=window.answerQuestion=saveAnswer}catch(_){window.answerQuestion=saveAnswer}
  window.NH7_ADMIN_QNA_AI_VERSION=VERSION;
  window.NH7_ADMIN_QNA_AI_TIMEOUT_MS=QNA_AI_TIMEOUT_MS;

  document.addEventListener('input',event=>{
    const el=event.target;if(!(el instanceof HTMLTextAreaElement))return;
    let m=String(el.id||'').match(/^answer_(.+)$/);
    if(m){
      const id=m[1],fa=field('a','fa',id);
      if(fa&&fa.value!==el.value)fa.value=el.value;
      clearTranslations(id);
      setStatus(id,L('پاسخ فارسی تغییر کرد؛ بعد از پایان ویرایش «ترجمه پاسخ» را بزن.','Persian answer changed; tap “Translate answer” when you finish editing.','Perzijski odgovor je promijenjen; nakon uređivanja dodirnite „Prevedi odgovor”.'),'busy');
      return;
    }
    m=String(el.id||'').match(/^afa_(.+)$/);
    if(m){
      const id=m[1],main=document.getElementById('answer_'+id);
      if(main&&main.value!==el.value)main.value=el.value;
      clearTranslations(id);
      setStatus(id,L('پاسخ فارسی تغییر کرد؛ بعد از پایان ویرایش «ترجمه پاسخ» را بزن.','Persian answer changed; tap “Translate answer” when you finish editing.','Perzijski odgovor je promijenjen; nakon uređivanja dodirnite „Prevedi odgovor”.'),'busy');
    }
  },true);

  document.querySelectorAll('.nh7-qna-i18n-box').forEach(box=>{
    if(box.querySelector('[data-nh7-ai-qna]'))return;
    const any=box.querySelector('textarea[id^="qfa_"]');if(!any)return;
    const id=String(any.id).replace(/^qfa_/,'');const q=qrow(id);if(!q)return;
    box.insertAdjacentHTML('afterbegin',controlsHtml(q));
  });
}
const style=document.createElement('style');
style.textContent='.nh7-ai490-draft-note{grid-column:1/-1;font-size:.8rem;color:#475467;padding:2px 0 4px}';
document.head.appendChild(style);
install();
})();