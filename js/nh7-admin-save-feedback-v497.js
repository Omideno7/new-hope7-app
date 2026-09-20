/* New Hope 7 Admin v4.9.7 — stable sermon upload feedback + Q&A save confirmation. */
(()=>{'use strict';
if(window.__NH7_ADMIN_SAVE_FEEDBACK_V497__)return;
window.__NH7_ADMIN_SAVE_FEEDBACK_V497__=true;
const VERSION='4.9.7-save-feedback';
let sermonBusy=false,sermonProgress=0,sermonStatus='',sermonTone='';

const L=(fa,en,hr)=>{
  const v=String(typeof lang!=='undefined'?lang:'fa').toLowerCase();
  return v==='fa'?fa:v==='hr'?hr:en;
};
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const raf=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));

function preserveScrollPoint(){
  const y=window.scrollY;
  const editor=document.getElementById('sermonEditor');
  const top=editor?.getBoundingClientRect?.().top;
  return()=>{
    requestAnimationFrame(()=>{
      const next=document.getElementById('sermonEditor');
      if(next&&Number.isFinite(top)){
        const delta=next.getBoundingClientRect().top-top;
        if(Math.abs(delta)>1)window.scrollBy({top:delta,left:0,behavior:'auto'});
      }else window.scrollTo({top:y,left:0,behavior:'auto'});
    });
  };
}

function ensureSermonUi(){
  const editor=document.getElementById('sermonEditor');if(!editor)return;
  let ui=editor.querySelector('[data-nh7-sermon-upload-v497]');
  if(!ui){
    ui=document.createElement('div');
    ui.dataset.nh7SermonUploadV497='1';
    ui.className='nh7-sermon-upload-v497';
    ui.innerHTML='<div class="nh7-sermon-upload-track-v497"><span id="nh7SermonUploadBarV497"></span></div><div id="nh7SermonUploadStatusV497" class="nh7-sermon-upload-text-v497"></div>';
    const actions=[...editor.querySelectorAll('.actions')].find(x=>x.querySelector('button[onclick*="saveSermon"]'));
    (actions||editor).insertAdjacentElement(actions?'afterend':'beforeend',ui);
  }
  const bar=ui.querySelector('#nh7SermonUploadBarV497'),status=ui.querySelector('#nh7SermonUploadStatusV497');
  if(bar){
    bar.style.width=Math.max(0,Math.min(100,sermonProgress))+'%';
    bar.classList.toggle('is-indeterminate',sermonBusy&&sermonProgress<=0);
  }
  if(status){
    status.textContent=sermonStatus;
    status.className='nh7-sermon-upload-text-v497 '+(sermonTone?('is-'+sermonTone):'');
  }
  const save=[...editor.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('saveSermon'));
  if(save)save.disabled=sermonBusy;
}

function setSermonProgress(text,progress=0,tone=''){
  sermonStatus=String(text||'');sermonProgress=Number.isFinite(Number(progress))?Number(progress):0;sermonTone=tone||'';
  ensureSermonUi();
}

function uploadWithProgress(file,folder,onProgress){
  return new Promise((resolve,reject)=>{
    if(!file){resolve('');return}
    const name=String(file.name||'file').toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'file';
    const path=folder+'/'+Date.now()+'-'+name;
    const url=SUPABASE_URL+'/storage/v1/object/church-audio/'+path;
    const xhr=new XMLHttpRequest();
    xhr.open('POST',url,true);
    xhr.setRequestHeader('apikey',SUPABASE_KEY);
    xhr.setRequestHeader('Authorization','Bearer '+token);
    xhr.setRequestHeader('x-upsert','true');
    xhr.setRequestHeader('Content-Type',file.type||'application/octet-stream');
    xhr.upload.onprogress=e=>{if(e.lengthComputable&&typeof onProgress==='function')onProgress(Math.round(e.loaded/e.total*100))};
    xhr.onload=()=>{
      if(xhr.status>=200&&xhr.status<300)resolve(SUPABASE_URL+'/storage/v1/object/public/church-audio/'+path);
      else reject(new Error(xhr.responseText||('Upload failed: '+xhr.status)));
    };
    xhr.onerror=()=>reject(new Error(L('ارتباط هنگام آپلود قطع شد.','Upload network error.','Mrežna pogreška pri prijenosu.')));
    xhr.send(file);
  });
}

function stableInspectSermonAudio(file){
  if(!file)return;
  sermonAudioFile=file;sermonStatus='';sermonProgress=0;sermonTone='';
  const clean=String(file.name||'').replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
  if(!String(sermonDraft.title_fa||'').trim()){
    sermonDraft.title_fa=clean;
    const t=document.getElementById('sv_title_fa');if(t)t.value=clean;
  }
  setSermonProgress(L('فایل صوتی آمادهٔ آپلود است.','Audio file is ready to upload.','Audio datoteka je spremna za prijenos.'),0,'ready');
  const url=URL.createObjectURL(file),probe=document.createElement('audio');
  const done=()=>{try{URL.revokeObjectURL(url)}catch(_){}};
  probe.preload='metadata';
  probe.onloadedmetadata=()=>{
    if(Number.isFinite(probe.duration)&&probe.duration>0){
      sermonDraft.duration_seconds=Math.round(probe.duration);
      sermonDraft.duration_minutes=Math.round((probe.duration/60)*100)/100;
      const d=document.getElementById('sv_duration');
      if(d&&typeof formatDurationClock==='function')d.value=formatDurationClock(sermonDraft.duration_seconds);
    }
    done();ensureSermonUi();
  };
  probe.onerror=()=>{done();ensureSermonUi()};
  probe.src=url;
}

async function stableSaveSermon(){
  if(sermonBusy)return;
  const data=sermonFormData();
  if(!data.title_fa){alert(tr('titleFa'));return}
  const restore=preserveScrollPoint();
  sermonBusy=true;
  setSermonProgress(L('در حال آماده‌سازی آپلود…','Preparing upload…','Priprema prijenosa…'),0,'busy');
  try{
    if(sermonAudioFile){
      data.audio_url=await uploadWithProgress(sermonAudioFile,'messages/sermons',p=>{
        setSermonProgress(
          L('در حال آپلود فایل صوتی… ','Uploading audio… ','Prijenos audio datoteke… ')+p+'%',
          Math.max(2,Math.min(82,Math.round(p*.82))),
          'busy'
        );
      });
    }
    if(sermonCoverFile){
      setSermonProgress(L('در حال آپلود تصویر…','Uploading cover…','Prijenos naslovnice…'),86,'busy');
      data.cover_url=await uploadWithProgress(sermonCoverFile,'messages/covers',p=>setSermonProgress(L('در حال آپلود تصویر… ','Uploading cover… ','Prijenos naslovnice… ')+p+'%',86+Math.round(p*.08),'busy'));
    }
    setSermonProgress(L('فایل آپلود شد؛ در حال ثبت موعظه…','Upload complete; saving sermon…','Prijenos završen; spremanje propovijedi…'),95,'busy');
    if(editingSermonId){
      const old=state.sermons.find(x=>String(x.id)===String(editingSermonId))||{};
      if(!data.audio_url)data.audio_url=old.audio_url||null;
      if(!data.cover_url)data.cover_url=old.cover_url||null;
      await authFetch('/rest/v1/sermons?id=eq.'+encodeURIComponent(editingSermonId),{method:'PATCH',body:JSON.stringify(data)});
    }else{
      await authFetch('/rest/v1/sermons',{method:'POST',body:JSON.stringify(data)});
    }
    editingSermonId='';
    clearSermonDraft();
    setMessage(tr('saved'),'success');
    await loadAll(true);
    restore();
    sermonBusy=false;
    setSermonProgress(L('✅ موعظه با موفقیت آپلود و ذخیره شد.','✅ Sermon uploaded and saved successfully.','✅ Propovijed je uspješno prenesena i spremljena.'),100,'ok');
  }catch(error){
    sermonBusy=false;
    setSermonProgress(L('❌ آپلود/ذخیره انجام نشد: ','❌ Upload/save failed: ','❌ Prijenos/spremanje nije uspjelo: ')+(error?.message||String(error)),0,'error');
    alert(error?.message||String(error));
  }finally{ensureSermonUi()}
}

function qRow(id){
  return Array.isArray(state?.questions)?state.questions.find(x=>String(x.id)===String(id)):null;
}
function value(id){return String(document.getElementById(id)?.value||'').trim()}
function qnaSaveStatus(id,text,tone=''){
  const answer=document.getElementById('answer_'+id),card=answer?.closest('.request-card');if(!card)return;
  let note=card.querySelector('[data-nh7-qna-save-v497]');
  if(!note){
    note=document.createElement('div');note.dataset.nh7QnaSaveV497=String(id);note.className='nh7-qna-save-v497';
    const actions=[...card.querySelectorAll('.actions')].find(x=>x.querySelector('button[onclick*="answerQuestion"]'));
    (actions||answer).insertAdjacentElement(actions?'afterend':'afterend',note);
  }
  note.textContent=text;note.className='nh7-qna-save-v497 '+(tone?('is-'+tone):'');
}
async function stableAnswerQuestion(id){
  const q=qRow(id),answer=value('answer_'+id);
  if(!answer){alert(tr('answer'));return}
  const saveBtn=[...document.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes("answerQuestion('"+id+"')"));
  if(saveBtn)saveBtn.disabled=true;
  qnaSaveStatus(id,L('در حال ذخیره پاسخ و ترجمه‌ها…','Saving answer and translations…','Spremanje odgovora i prijevoda…'),'busy');
  try{
    const source=String(document.getElementById('nh7AiAnswerLang_'+id)?.value||q?.answer_language||q?.language||'fa').toLowerCase();
    const sourceLang=['fa','en','hr'].includes(source)?source:'fa';
    const payload={
      answer_text:answer,
      answer_language:sourceLang,
      status:'answered',
      answered_at:q?.answered_at||new Date().toISOString(),
      updated_at:new Date().toISOString()
    };
    for(const l of ['fa','en','hr']){
      const qv=value('q'+l+'_'+id)||String(q?.['question_'+l]||'').trim();
      const av=value('a'+l+'_'+id)||String(q?.['answer_'+l]||'').trim();
      if(qv)payload['question_'+l]=qv;
      if(av)payload['answer_'+l]=av;
    }
    payload['answer_'+sourceLang]=answer;
    await authFetch('/rest/v1/qa_questions?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(payload)});
    if(q)Object.assign(q,payload);
    setMessage(tr('saved'),'success');
    qnaSaveStatus(id,L('✅ پاسخ و ترجمه‌ها ذخیره شدند.','✅ Answer and translations were saved.','✅ Odgovor i prijevodi su spremljeni.'),'ok');
    const aiStatus=document.getElementById('nh7AiQnaStatus_'+id);
    if(aiStatus){aiStatus.textContent=L('ذخیره شد ✓','Saved ✓','Spremljeno ✓');aiStatus.className='nh7-ai490-status is-ok'}
  }catch(error){
    qnaSaveStatus(id,L('❌ ذخیره انجام نشد: ','❌ Save failed: ','❌ Spremanje nije uspjelo: ')+(error?.message||String(error)),'error');
    setMessage(error?.message||String(error),'danger');
    alert(error?.message||String(error));
  }finally{if(saveBtn)saveBtn.disabled=false}
}

function install(){
  try{window.saveSermon=stableSaveSermon;saveSermon=stableSaveSermon}catch(_){}
  try{window.inspectSermonAudio=stableInspectSermonAudio;inspectSermonAudio=stableInspectSermonAudio}catch(_){}
  try{window.answerQuestion=stableAnswerQuestion;answerQuestion=stableAnswerQuestion}catch(_){}
  const cover=document.getElementById('sv_cover');
  if(cover&&cover.dataset.nh7StableCover497!=='1'){
    cover.dataset.nh7StableCover497='1';
    cover.onchange=function(){
      try{captureSermonDraft()}catch(_){}
      if(this.files?.[0])sermonCoverFile=this.files[0];
      setSermonProgress(L('تصویر کاور آمادهٔ آپلود است.','Cover image is ready to upload.','Naslovna slika je spremna za prijenos.'),0,'ready');
    };
  }
  ensureSermonUi();
}
const style=document.createElement('style');
style.textContent=`
.nh7-sermon-upload-v497{margin:10px 0 4px;padding:10px 12px;border:1px solid #d8ecea;border-radius:14px;background:#f8fcfc}
.nh7-sermon-upload-track-v497{height:7px;background:#e7efef;border-radius:999px;overflow:hidden}
.nh7-sermon-upload-track-v497 span{display:block;height:100%;width:0;background:linear-gradient(90deg,#0b5faa,#16a765);transition:width .18s ease}
.nh7-sermon-upload-track-v497 span.is-indeterminate{width:38%!important;animation:nh7Upload497 1.05s ease-in-out infinite}
@keyframes nh7Upload497{0%{transform:translateX(-110%)}50%{transform:translateX(95%)}100%{transform:translateX(250%)}}
.nh7-sermon-upload-text-v497{margin-top:7px;font-size:.82rem;color:#667085;line-height:1.6}
.nh7-sermon-upload-text-v497.is-ok,.nh7-sermon-upload-text-v497.is-ready{color:#08783d;font-weight:800}
.nh7-sermon-upload-text-v497.is-busy{color:#145a8d;font-weight:700}
.nh7-sermon-upload-text-v497.is-error{color:#b42318;font-weight:800}
.nh7-qna-save-v497{margin:8px 0 0;padding:8px 10px;border-radius:12px;background:#f8fafc;font-size:.82rem;line-height:1.6}
.nh7-qna-save-v497.is-ok{background:#ecfdf3;color:#08783d;font-weight:800}
.nh7-qna-save-v497.is-busy{background:#eff8ff;color:#175cd3}
.nh7-qna-save-v497.is-error{background:#fef3f2;color:#b42318;font-weight:800}
`;
document.head.appendChild(style);
new MutationObserver(()=>{clearTimeout(window.__nh7SaveFeedbackTimer497);window.__nh7SaveFeedbackTimer497=setTimeout(()=>{install();ensureSermonUi()},80)}).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else setTimeout(install,0);
window.NH7_ADMIN_SAVE_FEEDBACK_VERSION=VERSION;
})();