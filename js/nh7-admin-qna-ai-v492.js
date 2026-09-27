/* New Hope 7 Admin Q&A AI v4.9.2 — Q&A-only resilience patch.
 * Scope is intentionally limited to the Admin > Q&A workflow.
 * AI draft/translation requests may wait up to 4 minutes.
 * No app-user, school, sermon, database-schema, or other admin workflow changes.
 */
(()=>{'use strict';
if(window.__NH7_ADMIN_QNA_AI_V492__)return;
window.__NH7_ADMIN_QNA_AI_V492__=true;
const VERSION='4.9.2-admin-qna-ai-only';
const LANGS=['fa','en','hr'];
const QNA_AI_TIMEOUT_MS=240000;
const L=(fa,en,hr)=>{const v=String(typeof lang!=='undefined'?lang:'fa').toLowerCase();return v==='fa'?fa:v==='hr'?hr:en};
const qrow=id=>(typeof state!=='undefined'&&Array.isArray(state.questions))?state.questions.find(x=>String(x.id)===String(id)):null;
const qlang=q=>LANGS.includes(String(q?.language||'').toLowerCase())?String(q.language).toLowerCase():'fa';
const field=(prefix,l,id)=>document.getElementById(prefix+l+'_'+id);
const value=(prefix,l,id)=>String(field(prefix,l,id)?.value||'').trim();

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
function selectedAnswerLang(id,q){
  const v=String(document.getElementById('nh7AiAnswerLang_'+id)?.value||'').toLowerCase();
  return LANGS.includes(v)?v:qlang(q);
}
function captureAnswer(id,q){
  let sourceLang=selectedAnswerLang(id,q);
  const main=String(document.getElementById('answer_'+id)?.value||'').trim();
  if(main){
    const target=field('a',sourceLang,id);
    if(target)target.value=main;
    return{sourceLang,text:main};
  }
  let text=value('a',sourceLang,id);
  if(text)return{sourceLang,text};
  for(const l of LANGS){
    text=value('a',l,id);
    if(text)return{sourceLang:l,text};
  }
  return{sourceLang,text:''};
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
  const {sourceLang,text}=captureAnswer(id,q);
  if(!text){
    if(!quiet)alert(L('ابتدا پاسخ را بنویسید.','Write the answer first.','Najprije napišite odgovor.'));
    return null;
  }
  if(!quiet)setStatus(id,L('در حال ترجمه پاسخ…','Translating answer…','Prevodim odgovor…'),'busy');
  const result=await requestAI({action:'translate',text,source_language:sourceLang,kind:'answer'});
  const data=result.translations||{};
  fill('a',id,data,true);patchState(q,'answer',data);
  const main=document.getElementById('answer_'+id);
  if(main)main.value=String(data[sourceLang]||text).trim();
  if(!quiet)setStatus(id,L('پاسخ در هر سه زبان آماده است ✓','Answer is ready in all three languages ✓','Odgovor je spreman na sva tri jezika ✓'),'ok');
  return data;
}
async function draftAnswer(id){
  const q=qrow(id);if(!q)return;
  const sourceQuestion=String(q.question_text||q.question||q['question_'+qlang(q)]||'').trim();
  if(!sourceQuestion)return;
  const answerLang=selectedAnswerLang(id,q);
  const main=document.getElementById('answer_'+id);
  if(main&&String(main.value||'').trim()&&!confirm(L('پاسخ فعلی با پیش‌نویس AI جایگزین شود؟','Replace the current answer with an AI draft?','Zamijeniti trenutni odgovor AI nacrtom?')))return;
  setStatus(id,L('AI در حال نوشتن پیش‌نویس پاسخ…','AI is drafting an answer…','AI priprema nacrt odgovora…'),'busy');
  try{
    const result=await requestAI({action:'draft_answer',question:sourceQuestion,question_language:qlang(q),answer_language:answerLang});
    const answer=String(result.answer||'').trim();
    if(!answer)throw new Error(L('پیش‌نویس خالی بود.','The AI draft was empty.','AI nacrt je prazan.'));
    if(main)main.value=answer;
    const target=field('a',answerLang,id);if(target)target.value=answer;
    q['answer_'+answerLang]=answer;
    setStatus(id,L('پیش‌نویس آماده شد؛ در حال ترجمه به سه زبان…','Draft ready; translating to all three languages…','Nacrt je spreman; prevodim na sva tri jezika…'),'busy');
    try{
      const translated=await requestAI({action:'translate',text:answer,source_language:answerLang,kind:'answer'});
      const data=translated.translations||{};
      fill('a',id,data,true);patchState(q,'answer',data);
      setStatus(id,L('پیش‌نویس و ترجمه‌های هر سه زبان آماده است؛ قبل از ذخیره بررسی کن ✓','Draft and all three translations are ready; review before saving ✓','Nacrt i sva tri prijevoda su spremni; pregledajte prije spremanja ✓'),'ok');
    }catch(translationError){
      setStatus(id,L('پیش‌نویس آماده است، اما ترجمه کامل نشد: ','Draft is ready, but translation did not finish: ','Nacrt je spreman, ali prijevod nije dovršen: ')+(translationError.message||String(translationError)),'error');
    }
  }catch(e){setStatus(id,e.message||String(e),'error')}
}
async function saveAnswer(id){
  const q=qrow(id);if(!q)return;
  let captured=captureAnswer(id,q);
  if(!captured.text){alert(L('پاسخ را بنویسید.','Answer is required.','Odgovor je obavezan.'));return}
  setStatus(id,L('در حال آماده‌سازی پاسخ برای ذخیره…','Preparing answer to save…','Priprema odgovora za spremanje…'),'busy');
  try{
    const missing=LANGS.some(l=>!value('a',l,id));
    if(missing){
      const data=await translateAnswer(id,true);
      if(data)captured=captureAnswer(id,q);
    }
    const qSource=qlang(q);
    const originalQ=String(q.question_text||q.question||'').trim();
    const values={};
    for(const l of LANGS){
      values['question_'+l]=(value('q',l,id)||String(q['question_'+l]||'')).trim();
      values['answer_'+l]=(value('a',l,id)||String(q['answer_'+l]||'')).trim();
    }
    if(originalQ&&!values['question_'+qSource])values['question_'+qSource]=originalQ;
    values['answer_'+captured.sourceLang]=captured.text;
    if(typeof authFetch!=='function')throw new Error('Admin save service is unavailable.');
    await authFetch('/rest/v1/qa_questions?id=eq.'+encodeURIComponent(id),{
      method:'PATCH',
      body:JSON.stringify(Object.assign({},values,{
        answer_text:captured.text,
        answer_language:captured.sourceLang,
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
  window.nh7AiTranslateQuestionV492=id=>translateQuestion(id);
  window.nh7AiTranslateAnswerV492=id=>translateAnswer(id,false).catch(e=>setStatus(id,e.message||String(e),'error'));
  window.nh7AiDraftAnswerV492=id=>draftAnswer(id);
  try{answerQuestion=window.answerQuestion=saveAnswer}catch(_){window.answerQuestion=saveAnswer}
  window.NH7_ADMIN_QNA_AI_VERSION=VERSION;
  window.NH7_ADMIN_QNA_AI_TIMEOUT_MS=QNA_AI_TIMEOUT_MS;
  document.querySelectorAll('.nh7-qna-i18n-box').forEach(box=>{
    if(box.querySelector('[data-nh7-ai-qna]'))return;
    const any=box.querySelector('textarea[id^="qfa_"]');if(!any)return;
    const id=String(any.id).replace(/^qfa_/,'');const q=qrow(id);if(!q)return;
    const holder=document.createElement('div');
    holder.innerHTML='<div class="nh7-ai490-qna" data-nh7-ai-qna="'+id+'"><small id="nh7AiQnaStatus_'+id+'" class="nh7-ai490-status">'+L('برای بارگذاری کنترل‌های AI یک بار تازه‌سازی کنید.','Refresh once to load AI controls.','Osvježite jednom za AI kontrole.')+'</small></div>';
    box.insertBefore(holder.firstElementChild,box.children[1]||null);
  });
}
install();
})();