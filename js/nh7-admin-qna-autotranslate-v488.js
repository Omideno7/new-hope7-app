/* New Hope 7 Admin v4.8.8 — automatic FA/EN/HR Q&A translation layer. */
(()=>{'use strict';
if(window.__NH7_ADMIN_QNA_AUTOTRANSLATE_V488__)return;
window.__NH7_ADMIN_QNA_AUTOTRANSLATE_V488__=true;
const VERSION='4.8.8-admin-qna-autotranslate';
const LANGS=['fa','en','hr'];
const inflight=new Map(),autoTried=new Set();
let installed=false,observer=null,scanTimer=0,providerConfigured=null,providerCheck=null;
const L=(fa,en,hr)=>{const v=String(typeof lang!=='undefined'?lang:'fa').toLowerCase();return v==='fa'?fa:v==='hr'?hr:en};
const E=v=>typeof h==='function'?h(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const qrow=id=>(typeof state!=='undefined'&&Array.isArray(state.questions))?state.questions.find(x=>String(x.id)===String(id)):null;
const qlang=q=>LANGS.includes(String(q?.language||'').toLowerCase())?String(q.language).toLowerCase():'fa';
const field=(prefix,lang,id)=>document.getElementById(prefix+lang+'_'+id);
const value=(prefix,lang,id)=>String(field(prefix,lang,id)?.value||'').trim();
function setStatus(id,text,type=''){
  const el=document.getElementById('nh7QnaTranslateStatus_'+id);if(!el)return;
  el.textContent=String(text||'');el.className='nh7-qna-v488-status '+(type?'is-'+type:'');
}
function patchState(q,prefix,data){
  for(const l of LANGS)if(data?.[l])q[prefix+'_'+l]=data[l];
}
function fillMissing(prefix,id,data){
  for(const l of LANGS){const el=field(prefix,l,id);if(el&&!String(el.value||'').trim()&&data?.[l])el.value=data[l]}
}
async function checkProvider(){
  if(providerCheck)return providerCheck;
  providerCheck=(async()=>{
    try{
      const result=await authFetch('/functions/v1/nh7-admin-translate-v488',{method:'POST',body:JSON.stringify({action:'status'})});
      providerConfigured=result?.configured===true;return providerConfigured;
    }catch(_){providerConfigured=false;return false}
    finally{providerCheck=null}
  })();
  return providerCheck;
}
async function callTranslate(text,source,kind){
  if(providerConfigured===false)throw Object.assign(new Error(L('سرویس ترجمه هنوز روی سرور تنظیم نشده است.','Translation provider is not configured on the server.','Servis za prijevod nije konfiguriran na poslužitelju.')),{code:'PROVIDER_NOT_CONFIGURED'});
  const result=await authFetch('/functions/v1/nh7-admin-translate-v488',{method:'POST',body:JSON.stringify({text,source_language:source,kind})});
  if(!result?.ok||!result?.translations)throw Object.assign(new Error(result?.error||L('ترجمه انجام نشد.','Translation failed.','Prijevod nije uspio.')),{code:result?.code||''});
  return result.translations;
}
async function persistQuestion(q,data){
  const id=String(q.id),payload={updated_at:new Date().toISOString()};
  for(const l of LANGS){const v=String(data?.[l]||value('q',l,id)||q?.['question_'+l]||'').trim();if(v)payload['question_'+l]=v}
  await authFetch('/rest/v1/qa_questions?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(payload)});
  Object.assign(q,payload);
}
async function translateQuestion(id,manual=false){
  const q=qrow(id);if(!q)return;
  const sourceLang=qlang(q),source=String(q.question_text||q.question||q['question_'+sourceLang]||'').trim();
  if(!source)return;
  const missing=LANGS.filter(l=>!value('q',l,id)&&!String(q['question_'+l]||'').trim());
  if(!manual&&!missing.length)return;
  const key='q:'+id;if(inflight.has(key))return inflight.get(key);
  const job=(async()=>{
    setStatus(id,L('در حال ترجمهٔ سؤال…','Translating question…','Prevodim pitanje…'),'busy');
    try{
      const data=await callTranslate(source,sourceLang,'question');
      fillMissing('q',id,data);patchState(q,'question',data);await persistQuestion(q,data);
      setStatus(id,L('ترجمهٔ سؤال آماده شد ✓','Question translations ready ✓','Prijevodi pitanja su spremni ✓'),'ok');
      return data;
    }catch(e){
      const provider=String(e?.code||'')==='PROVIDER_NOT_CONFIGURED';
      setStatus(id,provider?L('سرویس ترجمه هنوز روی سرور تنظیم نشده است.','Translation provider is not configured on the server.','Servis za prijevod nije konfiguriran na poslužitelju.'):String(e?.message||e),'error');
      throw e;
    }finally{inflight.delete(key)}
  })();
  inflight.set(key,job);return job;
}
function answerSourceLanguage(id,q){
  const sel=document.getElementById('nh7AnswerSource_'+id),v=String(sel?.value||'');
  return LANGS.includes(v)?v:qlang(q);
}
function captureAnswerSource(id,q){
  const sourceLang=answerSourceLanguage(id,q);
  const main=String(document.getElementById('answer_'+id)?.value||'').trim();
  if(main){const el=field('a',sourceLang,id);if(el)el.value=main;return{sourceLang,text:main}}
  const preferred=value('a',sourceLang,id);
  if(preferred)return{sourceLang,text:preferred};
  for(const l of LANGS){const v=value('a',l,id);if(v)return{sourceLang:l,text:v}}
  return{sourceLang,text:''};
}
async function translateAnswer(id,manual=false){
  const q=qrow(id);if(!q)return null;
  const {sourceLang,text}=captureAnswerSource(id,q);if(!text){if(manual)alert(L('ابتدا پاسخ را بنویسید.','Write the answer first.','Najprije napišite odgovor.'));return null}
  const missing=LANGS.filter(l=>!value('a',l,id));
  if(!manual&&!missing.length)return Object.fromEntries(LANGS.map(l=>[l,value('a',l,id)]));
  const key='a:'+id;if(inflight.has(key))return inflight.get(key);
  const job=(async()=>{
    setStatus(id,L('در حال ترجمهٔ پاسخ…','Translating answer…','Prevodim odgovor…'),'busy');
    try{
      const data=await callTranslate(text,sourceLang,'answer');
      // Never overwrite manual content. Source text is always exact.
      const sourceEl=field('a',sourceLang,id);if(sourceEl)sourceEl.value=text;
      fillMissing('a',id,data);patchState(q,'answer',data);
      setStatus(id,L('ترجمهٔ پاسخ آماده شد ✓','Answer translations ready ✓','Prijevodi odgovora su spremni ✓'),'ok');
      return data;
    }catch(e){
      const provider=String(e?.code||'')==='PROVIDER_NOT_CONFIGURED';
      setStatus(id,provider?L('سرویس ترجمه هنوز روی سرور تنظیم نشده است.','Translation provider is not configured on the server.','Servis za prijevod nije konfiguriran na poslužitelju.'):String(e?.message||e),'error');
      throw e;
    }finally{inflight.delete(key)}
  })();
  inflight.set(key,job);return job;
}
function controls(q){
  const id=String(q.id),source=qlang(q);
  return `<div class="nh7-qna-v488-controls" data-qna-v488="${E(id)}">
    <div class="nh7-qna-v488-buttons">
      <button type="button" class="btn secondary" onclick="nh7TranslateQuestionV488('${E(id)}',true)">✨ ${E(L('ترجمه سؤال','Translate question','Prevedi pitanje'))}</button>
      <button type="button" class="btn secondary" onclick="nh7TranslateAnswerV488('${E(id)}',true)">✨ ${E(L('ترجمه پاسخ','Translate answer','Prevedi odgovor'))}</button>
    </div>
    <label class="nh7-qna-v488-source">${E(L('زبان پاسخ من','My answer language','Jezik mog odgovora'))}
      <select id="nh7AnswerSource_${E(id)}">
        <option value="fa" ${source==='fa'?'selected':''}>فارسی</option>
        <option value="en" ${source==='en'?'selected':''}>English</option>
        <option value="hr" ${source==='hr'?'selected':''}>Hrvatski</option>
      </select>
    </label>
    <small id="nh7QnaTranslateStatus_${E(id)}" class="nh7-qna-v488-status"></small>
  </div>`;
}
function mountControls(){
  document.querySelectorAll('.nh7-qna-i18n-box').forEach(box=>{
    const any=box.querySelector('textarea[id^="qfa_"]');if(!any)return;
    const id=String(any.id).replace(/^qfa_/,'');const q=qrow(id);if(!q)return;
    if(!box.querySelector('[data-qna-v488]'))box.insertAdjacentHTML('afterbegin',controls(q));
    if(observer&&!autoTried.has(id))observer.observe(box);
  });
}
function installObserver(){
  if(observer||!('IntersectionObserver'in window))return;
  observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      const box=entry.target,any=box.querySelector('textarea[id^="qfa_"]');if(!any)continue;
      const id=String(any.id).replace(/^qfa_/,'');
      observer.unobserve(box);if(autoTried.has(id))continue;autoTried.add(id);
      const q=qrow(id);if(!q)continue;
      const missing=LANGS.some(l=>!String(q['question_'+l]||'').trim());
      if(missing&&providerConfigured===true)translateQuestion(id,false).catch(()=>{});
    }
  },{root:null,rootMargin:'120px',threshold:0.01});
}
function install(){
  if(installed)return true;
  if(typeof renderQuestionCard!=='function'||typeof authFetch!=='function'||typeof loadAll!=='function')return false;
  installed=true;installObserver();checkProvider().then(ok=>{if(ok){mountControls();document.querySelectorAll('.nh7-qna-i18n-box').forEach(box=>observer?.observe(box))}}).catch(()=>{});
  const baseRender=renderQuestionCard;
  renderQuestionCard=function(q){const html=baseRender(q);queueMicrotask(()=>{clearTimeout(scanTimer);scanTimer=setTimeout(mountControls,40)});return html};
  answerQuestion=async function(id){
    const q=qrow(id);if(!q)return;
    const {sourceLang,text}=captureAnswerSource(id,q);
    if(!text){alert(L('پاسخ را بنویسید.','Answer is required.','Odgovor je obavezan.'));return}
    try{
      const missing=LANGS.some(l=>!value('a',l,id));
      if(missing)await translateAnswer(id,false);
    }catch(_){
      // Preserve admin work even if translation provider is unavailable.
    }
    const qSource=qlang(q),originalQ=String(q.question_text||q.question||'').trim();
    const values={};
    for(const l of LANGS){
      values['question_'+l]=(value('q',l,id)||String(q['question_'+l]||'')).trim();
      values['answer_'+l]=(value('a',l,id)||String(q['answer_'+l]||'')).trim();
    }
    if(originalQ&&!values['question_'+qSource])values['question_'+qSource]=originalQ;
    values['answer_'+sourceLang]=text;
    try{
      await authFetch('/rest/v1/qa_questions?id=eq.'+encodeURIComponent(id),{
        method:'PATCH',
        body:JSON.stringify(Object.assign({},values,{
          answer_text:text,answer_language:sourceLang,status:'answered',
          answered_at:q.answered_at||new Date().toISOString(),updated_at:new Date().toISOString()
        }))
      });
      if(typeof setMessage==='function')setMessage(typeof tr==='function'?tr('saved'):'Saved','success');
      await loadAll(true);
    }catch(e){if(typeof setMessage==='function')setMessage(e.message,'danger');alert(e.message)}
  };
  new MutationObserver(()=>{clearTimeout(scanTimer);scanTimer=setTimeout(mountControls,50)}).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(mountControls,250);
  window.nh7TranslateQuestionV488=(id,manual=true)=>translateQuestion(id,manual).catch(()=>{});
  window.nh7TranslateAnswerV488=(id,manual=true)=>translateAnswer(id,manual).catch(()=>{});
  window.NH7_ADMIN_QNA_AUTOTRANSLATE_VERSION=VERSION;
  return true;
}
const style=document.createElement('style');style.textContent=`
.nh7-qna-v488-controls{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 12px;align-items:center;padding:10px;margin:0 0 10px;border:1px solid var(--line,#d8ecea);border-radius:14px;background:#f7fbfb}.nh7-qna-v488-buttons{display:flex;gap:7px;flex-wrap:wrap}.nh7-qna-v488-source{min-width:170px;font-size:.8rem}.nh7-qna-v488-source select{margin-top:3px}.nh7-qna-v488-status{grid-column:1/-1;min-height:1.2em;font-size:.78rem}.nh7-qna-v488-status.is-busy{color:#145a8d}.nh7-qna-v488-status.is-ok{color:#08783d}.nh7-qna-v488-status.is-error{color:#b42318}@media(max-width:700px){.nh7-qna-v488-controls{grid-template-columns:1fr}.nh7-qna-v488-source{min-width:0}}
`;document.head.appendChild(style);
if(!install()){let n=0;const t=setInterval(()=>{n++;if(install()||n>100)clearInterval(t)},100)}
})();