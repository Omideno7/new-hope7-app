/* New Hope 7 Admin v4.9.0 — AI Assist: Q&A translation/drafts, sermon title translation, assignment feedback draft. */
(()=>{'use strict';
if(window.__NH7_ADMIN_AI_V490__)return;
window.__NH7_ADMIN_AI_V490__=true;
const VERSION='4.9.0-admin-ai';
const LANGS=['fa','en','hr'];
const PREVIEW_ONLY=location.hostname!=='omideno7.github.io';
let installed=false,providerConfigured=null,providerCheck=null,scanTimer=0,observer=null;
const inflight=new Map(),autoQuestionTried=new Set(),autoSermonTried=new WeakSet();
const L=(fa,en,hr)=>{const v=String(typeof lang!=='undefined'?lang:'fa').toLowerCase();return v==='fa'?fa:v==='hr'?hr:en};
const E=v=>typeof h==='function'?h(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const currentLang=()=>{const v=String(typeof lang!=='undefined'?lang:'fa').toLowerCase();return LANGS.includes(v)?v:'fa'};
const qrow=id=>(typeof state!=='undefined'&&Array.isArray(state.questions))?state.questions.find(x=>String(x.id)===String(id)):null;
const arow=id=>(typeof state!=='undefined'&&Array.isArray(state.schoolAssignments))?state.schoolAssignments.find(x=>String(x.id)===String(id)):null;
const qlang=q=>LANGS.includes(String(q?.language||'').toLowerCase())?String(q.language).toLowerCase():'fa';
const field=(prefix,l,id)=>document.getElementById(prefix+l+'_'+id);
const fieldValue=(prefix,l,id)=>String(field(prefix,l,id)?.value||'').trim();

function authReady(){
  try{return Boolean(window.nh7AdminAccessReady&&typeof token==='string'&&token)}catch(_){return false}
}
function statusText(){
  if(providerConfigured===true)return L('AI و ترجمه آماده است ✓','AI and translation are ready ✓','AI i prijevod su spremni ✓');
  if(providerConfigured===false)return L('سرویس AI روی سرور آماده نیست.','Server AI provider is not ready.','AI servis na poslužitelju nije spreman.');
  return authReady()?L('در حال بررسی سرویس AI…','Checking AI service…','Provjera AI servisa…'):L('در انتظار آماده‌شدن نشست مدیر…','Waiting for admin session…','Čekanje administratorske sesije…');
}
function refreshProviderUi(){
  document.querySelectorAll('[data-nh7-ai-provider-note]').forEach(n=>{n.textContent=statusText();n.className='nh7-ai490-provider '+(providerConfigured===true?'is-ok':providerConfigured===false?'is-warn':'')});
  document.querySelectorAll('[data-nh7-ai-button]').forEach(btn=>{btn.disabled=providerConfigured!==true;btn.title=providerConfigured===true?'':statusText()});
}
async function checkProvider(force=false){
  if(providerConfigured===true&&!force)return true;
  if(providerCheck)return providerCheck;
  if(!authReady()){providerConfigured=null;refreshProviderUi();return null}
  providerCheck=(async()=>{
    try{
      const result=await authFetch('/functions/v1/nh7-admin-ai-v490',{method:'POST',body:JSON.stringify({action:'status'})});
      providerConfigured=result?.configured===true;
      return providerConfigured;
    }catch(error){
      const status=Number(error?.status||0);
      providerConfigured=(status===401||status===403)?null:false;
      return providerConfigured;
    }finally{providerCheck=null;refreshProviderUi()}
  })();
  return providerCheck;
}
async function callAI(payload){
  if(await checkProvider(true)!==true)throw Object.assign(new Error(statusText()),{code:'PROVIDER_NOT_READY'});
  const result=await authFetch('/functions/v1/nh7-admin-ai-v490',{method:'POST',body:JSON.stringify(payload)});
  if(!result?.ok)throw Object.assign(new Error(result?.error||L('AI پاسخ نداد.','AI request failed.','AI zahtjev nije uspio.')),{code:result?.code||''});
  return result;
}
function setQnaStatus(id,text,type=''){
  const n=document.getElementById('nh7AiQnaStatus_'+id);if(!n)return;
  n.textContent=String(text||'');n.className='nh7-ai490-status '+(type?'is-'+type:'');
}
function fillMissing(prefix,id,data){
  for(const l of LANGS){const el=field(prefix,l,id);if(el&&!String(el.value||'').trim()&&data?.[l])el.value=data[l]}
}
function patchQnaState(q,prefix,data){if(!q)return;for(const l of LANGS)if(data?.[l])q[prefix+'_'+l]=data[l]}
async function translateQuestion(id,manual=true){
  const q=qrow(id);if(!q)return null;
  const sourceLang=qlang(q),source=String(q.question_text||q.question||q['question_'+sourceLang]||'').trim();
  if(!source)return null;
  const missing=LANGS.filter(l=>!fieldValue('q',l,id)&&!String(q['question_'+l]||'').trim());
  if(!manual&&!missing.length)return null;
  const key='q:'+id;if(inflight.has(key))return inflight.get(key);
  const job=(async()=>{
    setQnaStatus(id,L('در حال ترجمه سؤال…','Translating question…','Prevodim pitanje…'),'busy');
    try{
      const result=await callAI({action:'translate',text:source,source_language:sourceLang,kind:'question'});
      const data=result.translations||{};
      fillMissing('q',id,data);patchQnaState(q,'question',data);
      if(!PREVIEW_ONLY){
        const payload={updated_at:new Date().toISOString()};
        for(const l of LANGS){const v=fieldValue('q',l,id)||String(q['question_'+l]||'').trim();if(v)payload['question_'+l]=v}
        await authFetch('/rest/v1/qa_questions?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(payload)});
      }
      setQnaStatus(id,PREVIEW_ONLY?L('ترجمه آماده است؛ Preview چیزی ذخیره نکرد.','Translation ready; Preview did not save it.','Prijevod je spreman; Preview ga nije spremio.'):L('ترجمه سؤال ذخیره شد ✓','Question translations saved ✓','Prijevodi pitanja su spremljeni ✓'),'ok');
      return data;
    }catch(e){setQnaStatus(id,e.message||String(e),'error');throw e}
    finally{inflight.delete(key)}
  })();
  inflight.set(key,job);return job;
}
function answerSource(id,q){
  const selected=String(document.getElementById('nh7AiAnswerLang_'+id)?.value||'');
  return LANGS.includes(selected)?selected:qlang(q);
}
function captureAnswer(id,q){
  let sourceLang=answerSource(id,q);
  const main=String(document.getElementById('answer_'+id)?.value||'').trim();
  if(main){const el=field('a',sourceLang,id);if(el)el.value=main;return{sourceLang,text:main}}
  let text=fieldValue('a',sourceLang,id);
  if(text)return{sourceLang,text};
  for(const l of LANGS){text=fieldValue('a',l,id);if(text)return{sourceLang:l,text}}
  return{sourceLang,text:''};
}
async function translateAnswer(id,manual=true){
  const q=qrow(id);if(!q)return null;
  const {sourceLang,text}=captureAnswer(id,q);
  if(!text){if(manual)alert(L('ابتدا پاسخ را بنویسید.','Write the answer first.','Najprije napišite odgovor.'));return null}
  const missing=LANGS.filter(l=>!fieldValue('a',l,id));
  if(!manual&&!missing.length)return Object.fromEntries(LANGS.map(l=>[l,fieldValue('a',l,id)]));
  const key='a:'+id;if(inflight.has(key))return inflight.get(key);
  const job=(async()=>{
    setQnaStatus(id,L('در حال ترجمه پاسخ…','Translating answer…','Prevodim odgovor…'),'busy');
    try{
      const result=await callAI({action:'translate',text,source_language:sourceLang,kind:'answer'});
      const data=result.translations||{};const src=field('a',sourceLang,id);if(src)src.value=text;
      fillMissing('a',id,data);patchQnaState(q,'answer',data);
      setQnaStatus(id,L('ترجمه پاسخ آماده شد ✓','Answer translations ready ✓','Prijevodi odgovora su spremni ✓'),'ok');
      return data;
    }catch(e){setQnaStatus(id,e.message||String(e),'error');throw e}
    finally{inflight.delete(key)}
  })();
  inflight.set(key,job);return job;
}
async function draftAnswer(id){
  const q=qrow(id);if(!q)return;
  const question=String(q.question_text||q.question||q['question_'+qlang(q)]||'').trim();
  if(!question)return;
  const answerLang=answerSource(id,q),main=document.getElementById('answer_'+id);
  if(main&&String(main.value||'').trim()&&!confirm(L('پاسخ فعلی با پیش‌نویس AI جایگزین شود؟','Replace the current answer with an AI draft?','Zamijeniti trenutni odgovor AI nacrtom?')))return;
  setQnaStatus(id,L('AI در حال آماده‌کردن پیش‌نویس پاسخ…','AI is drafting an answer…','AI priprema nacrt odgovora…'),'busy');
  try{
    const result=await callAI({action:'draft_answer',question,question_language:qlang(q),answer_language:answerLang});
    const answer=String(result.answer||'').trim();if(!answer)throw new Error(L('پیش‌نویس خالی بود.','The AI draft was empty.','AI nacrt je prazan.'));
    if(main)main.value=answer;const target=field('a',answerLang,id);if(target)target.value=answer;
    setQnaStatus(id,L('پیش‌نویس آماده است؛ قبل از ذخیره بررسی و ویرایش کن.','Draft ready — review and edit before saving.','Nacrt je spreman — pregledajte i uredite prije spremanja.'),'ok');
  }catch(e){setQnaStatus(id,e.message||String(e),'error')}
}
function qnaControls(q){
  const id=String(q.id),source=qlang(q);
  return `<div class="nh7-ai490-qna" data-nh7-ai-qna="${E(id)}">
    <div class="nh7-ai490-actions">
      <button type="button" class="btn secondary" data-nh7-ai-button onclick="nh7AiTranslateQuestionV490('${E(id)}')">✨ ${E(L('ترجمه سؤال','Translate question','Prevedi pitanje'))}</button>
      <button type="button" class="btn primary" data-nh7-ai-button onclick="nh7AiDraftAnswerV490('${E(id)}')">🤖 ${E(L('پیش‌نویس پاسخ با AI','AI draft answer','AI nacrt odgovora'))}</button>
      <button type="button" class="btn secondary" data-nh7-ai-button onclick="nh7AiTranslateAnswerV490('${E(id)}')">✨ ${E(L('ترجمه پاسخ','Translate answer','Prevedi odgovor'))}</button>
    </div>
    <label>${E(L('زبان پاسخ من','My answer language','Jezik mog odgovora'))}
      <select id="nh7AiAnswerLang_${E(id)}"><option value="fa" ${source==='fa'?'selected':''}>فارسی</option><option value="en" ${source==='en'?'selected':''}>English</option><option value="hr" ${source==='hr'?'selected':''}>Hrvatski</option></select>
    </label>
    <small data-nh7-ai-provider-note class="nh7-ai490-provider"></small>
    <small id="nh7AiQnaStatus_${E(id)}" class="nh7-ai490-status"></small>
  </div>`;
}
function ensureQnaControls(){
  document.querySelectorAll('.nh7-qna-i18n-box').forEach(box=>{
    const any=box.querySelector('textarea[id^="qfa_"]');if(!any)return;
    const id=String(any.id).replace(/^qfa_/,'');const q=qrow(id);if(!q)return;
    if(!box.querySelector('[data-nh7-ai-qna]'))box.insertAdjacentHTML('afterbegin',qnaControls(q));
    if(observer&&!autoQuestionTried.has(id))observer.observe(box);
  });
  refreshProviderUi();
}
function installQuestionObserver(){
  if(observer||!('IntersectionObserver'in window))return;
  observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting||providerConfigured!==true)continue;
      const any=entry.target.querySelector('textarea[id^="qfa_"]');if(!any)continue;
      const id=String(any.id).replace(/^qfa_/,'');observer.unobserve(entry.target);
      if(autoQuestionTried.has(id))continue;autoQuestionTried.add(id);
      const q=qrow(id);if(q&&LANGS.some(l=>!String(q['question_'+l]||'').trim()))translateQuestion(id,false).catch(()=>{});
    }
  },{rootMargin:'140px',threshold:.01});
}
async function saveQnaAnswer(id){
  const q=qrow(id);if(!q)return;
  const {sourceLang,text}=captureAnswer(id,q);
  if(!text){alert(L('پاسخ را بنویسید.','Answer is required.','Odgovor je obavezan.'));return}
  try{if(LANGS.some(l=>!fieldValue('a',l,id))&&providerConfigured===true)await translateAnswer(id,false)}catch(_){}
  const qSource=qlang(q),originalQ=String(q.question_text||q.question||'').trim(),values={};
  for(const l of LANGS){
    values['question_'+l]=(fieldValue('q',l,id)||String(q['question_'+l]||'')).trim();
    values['answer_'+l]=(fieldValue('a',l,id)||String(q['answer_'+l]||'')).trim();
  }
  if(originalQ&&!values['question_'+qSource])values['question_'+qSource]=originalQ;
  values['answer_'+sourceLang]=text;
  if(PREVIEW_ONLY){setQnaStatus(id,L('Preview: پاسخ و ترجمه‌ها ذخیره نشدند.','Preview: answer and translations were not saved.','Preview: odgovor i prijevodi nisu spremljeni.'),'ok');return}
  try{
    await authFetch('/rest/v1/qa_questions?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(Object.assign({},values,{
      answer_text:text,answer_language:sourceLang,status:'answered',answered_at:q.answered_at||new Date().toISOString(),updated_at:new Date().toISOString()
    }))});
    if(typeof setMessage==='function')setMessage(typeof tr==='function'?tr('saved'):'Saved','success');await loadAll(true);
  }catch(e){if(typeof setMessage==='function')setMessage(e.message,'danger');alert(e.message)}
}

/* Sermon title translation */
function sermonTitles(){
  return{fa:String(document.getElementById('sv_title_fa')?.value||'').trim(),en:String(document.getElementById('sv_title_en')?.value||'').trim(),hr:String(document.getElementById('sv_title_hr')?.value||'').trim()}
}
function sermonSource(){
  const v=sermonTitles(),preferred=currentLang();if(v[preferred])return{language:preferred,text:v[preferred]};
  for(const l of LANGS)if(v[l])return{language:l,text:v[l]};return{language:'fa',text:''}
}
async function translateSermonTitles(manual=true){
  const source=sermonSource();if(!source.text){if(manual)alert(L('ابتدا یک عنوان بنویسید یا فایل صوتی را انتخاب کنید.','Enter one title or choose the audio file first.','Najprije unesite naslov ili odaberite audio datoteku.'));return}
  const note=document.getElementById('nh7AiSermonStatus');if(note)note.textContent=L('در حال ترجمه عنوان‌ها…','Translating titles…','Prevodim naslove…');
  try{
    const result=await callAI({action:'translate',text:source.text,source_language:source.language,kind:'sermon_title'}),data=result.translations||{};
    for(const l of LANGS){const el=document.getElementById('sv_title_'+l);if(el&&!String(el.value||'').trim()&&data[l]){el.value=data[l];if(typeof sermonDraft==='object')sermonDraft['title_'+l]=data[l]}}
    if(note)note.textContent=L('عنوان‌های خالی پر شدند ✓','Empty title fields were filled ✓','Prazna polja naslova su popunjena ✓');
  }catch(e){if(note)note.textContent=e.message||String(e)}
}
function ensureSermonAi(){
  const editor=document.getElementById('sermonEditor');if(!editor||editor.querySelector('[data-nh7-sermon-ai]'))return;
  const wrap=document.createElement('div');wrap.dataset.nh7SermonAi='1';wrap.className='nh7-ai490-inline';
  wrap.innerHTML=`<button type="button" class="btn secondary" data-nh7-ai-button onclick="nh7AiTranslateSermonTitlesV490(true)">✨ ${E(L('ترجمه خودکار عنوان FA/EN/HR','Auto-translate FA/EN/HR titles','Automatski prevedi FA/EN/HR naslove'))}</button><small data-nh7-ai-provider-note class="nh7-ai490-provider"></small><small id="nh7AiSermonStatus" class="nh7-ai490-status"></small>`;
  const h3=editor.querySelector('h3');if(h3)h3.insertAdjacentElement('afterend',wrap);else editor.prepend(wrap);
  refreshProviderUi();
}

/* Assignment feedback draft */
function assignmentQuestion(a){
  const lesson=(state.schoolLessons||[]).find(x=>String(x.lesson_code)===String(a?.lesson_code)),d=lesson?.content_data||{},t=d.translations||{};
  const preferred=currentLang();
  return String(t?.[preferred]?.assignment_question||t?.[a?.language]?.assignment_question||t?.fa?.assignment_question||t?.en?.assignment_question||t?.hr?.assignment_question||'').trim();
}
async function draftAssignmentFeedback(id){
  const a=arow(id);if(!a)return;
  const target=document.getElementById('as_feedback_'+id);if(!target)return;
  if(String(target.value||'').trim()&&!confirm(L('بازخورد فعلی با پیش‌نویس AI جایگزین شود؟','Replace the current feedback with an AI draft?','Zamijeniti trenutnu povratnu informaciju AI nacrtom?')))return;
  target.placeholder=L('AI در حال نوشتن پیش‌نویس…','AI is drafting feedback…','AI priprema povratnu informaciju…');
  try{
    const result=await callAI({action:'draft_feedback',assignment_question:assignmentQuestion(a),student_answer:String(a.answer_text||''),language:currentLang()});
    target.value=String(result.feedback||'').trim();target.placeholder='';
  }catch(e){target.placeholder='';alert(e.message||String(e))}
}
function installAssignmentPatch(){
  if(typeof renderSchoolAssignmentCard!=='function'||renderSchoolAssignmentCard.__nh7Ai490)return;
  const base=renderSchoolAssignmentCard;
  const wrapped=function(a){
    let html=base(a),marker='<div class="actions">';
    const button=`<div class="nh7-ai490-assignment"><button type="button" class="btn secondary" data-nh7-ai-button onclick="nh7AiDraftAssignmentFeedbackV490('${E(a.id)}')">🤖 ${E(L('پیش‌نویس بازخورد با AI','AI draft feedback','AI nacrt povratne informacije'))}</button><small data-nh7-ai-provider-note class="nh7-ai490-provider"></small></div>`;
    if(html.includes(marker))html=html.replace(marker,button+marker);return html;
  };
  wrapped.__nh7Ai490=true;renderSchoolAssignmentCard=window.renderSchoolAssignmentCard=wrapped;
}

function scan(){
  ensureQnaControls();ensureSermonAi();installAssignmentPatch();refreshProviderUi();
}
function install(){
  if(installed)return true;
  if(typeof authFetch!=='function'||typeof renderQuestionCard!=='function'||typeof loadAll!=='function')return false;
  installed=true;installQuestionObserver();
  answerQuestion=window.answerQuestion=saveQnaAnswer;
  installAssignmentPatch();
  new MutationObserver(()=>{clearTimeout(scanTimer);scanTimer=setTimeout(scan,60)}).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('change',event=>{
    if(event.target?.id==='sv_audio'){
      const editor=document.getElementById('sermonEditor');if(!editor||autoSermonTried.has(editor))return;
      autoSermonTried.add(editor);setTimeout(()=>{const v=sermonTitles(),filled=LANGS.filter(l=>v[l]);if(filled.length===1&&providerConfigured===true)translateSermonTitles(false)},1200);
    }
  },true);
  document.addEventListener('nh7:admin-render',()=>{setTimeout(()=>{checkProvider(true).then(()=>scan());},160)});
  window.addEventListener('pageshow',()=>setTimeout(()=>checkProvider(true).then(()=>scan()),220));
  window.nh7AiTranslateQuestionV490=id=>translateQuestion(id,true).catch(()=>{});
  window.nh7AiTranslateAnswerV490=id=>translateAnswer(id,true).catch(()=>{});
  window.nh7AiDraftAnswerV490=id=>draftAnswer(id);
  window.nh7AiTranslateSermonTitlesV490=manual=>translateSermonTitles(manual!==false);
  window.nh7AiDraftAssignmentFeedbackV490=id=>draftAssignmentFeedback(id);
  window.NH7_ADMIN_AI_VERSION=VERSION;
  setTimeout(()=>{checkProvider(true).then(()=>scan())},450);
  return true;
}
const style=document.createElement('style');style.textContent=`
.nh7-ai490-qna{display:grid;grid-template-columns:minmax(0,1fr) minmax(150px,220px);gap:8px 12px;align-items:center;padding:10px;margin:0 0 10px;border:1px solid var(--line,#d8ecea);border-radius:14px;background:#f7fbfb}.nh7-ai490-actions{display:flex;gap:7px;flex-wrap:wrap}.nh7-ai490-provider,.nh7-ai490-status{grid-column:1/-1;font-size:.77rem;min-height:1.15em}.nh7-ai490-provider.is-ok,.nh7-ai490-status.is-ok{color:#08783d}.nh7-ai490-provider.is-warn,.nh7-ai490-status.is-error{color:#b54708}.nh7-ai490-status.is-busy{color:#145a8d}.nh7-ai490-inline{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0 12px;padding:9px;border:1px dashed var(--line,#d8ecea);border-radius:14px}.nh7-ai490-assignment{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}.nh7-ai490-assignment .nh7-ai490-provider{grid-column:auto}.nh7-ai490-actions button:disabled,.nh7-ai490-inline button:disabled,.nh7-ai490-assignment button:disabled{opacity:.45;cursor:not-allowed}@media(max-width:700px){.nh7-ai490-qna{grid-template-columns:1fr}}
`;document.head.appendChild(style);
if(!install()){let n=0;const t=setInterval(()=>{n++;if(install()||n>120)clearInterval(t)},100)}
})();