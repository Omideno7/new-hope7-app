/* New Hope 7 — isolated sermon file metadata fix.
 * Update the sermon draft AND its visible fields without rerendering the form.
 * No upload, save, publication, authentication or other module is changed.
 */
(()=>{'use strict';
if(window.NH7AdminSermonMetadata)return;
const VERSION='4.5.2-sermon-metadata';
let current=null,automaticTitle=null;
const field=id=>document.getElementById(id);
const label=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
function valid(job){return !!job&&current===job&&sermonDraft===job.draft&&sermonAudioFile===job.file&&editingSermonId===job.editId}
function write(id,value){const el=field(id);if(el)el.value=String(value)}
function showStatus(job){
  if(!valid(job))return;
  const parent=field('sv_audio')?.closest('label');if(!parent)return;
  let el=field('nh7SermonMetadataStatus');
  if(!el){el=document.createElement('small');el.id='nh7SermonMetadataStatus';el.className='muted small';el.setAttribute('role','status');el.setAttribute('aria-live','polite');parent.appendChild(el)}
  el.textContent=job.message;
}
function inspect(file){
  // A cancelled file picker must not discard the already selected recording.
  if(!file)return;
  if(current){current.cancel();current=null}
  captureSermonDraft();
  const draft=sermonDraft;
  sermonAudioFile=file;
  const title=String(draft.title_fa||'');
  if(!title.trim()||(automaticTitle?.draft===draft&&automaticTitle.value===title)){
    const value=cleanAudioTitle(file.name);
    draft.title_fa=value;write('sv_title_fa',value);
    automaticTitle={draft,value};
  }
  // A replacement file must never inherit the previous recording's duration.
  draft.duration_seconds='';draft.duration_minutes='';write('sv_duration',formatDurationClock(0));
  const job={draft,file,editId:editingSermonId,manualDuration:false,cancel:()=>{},message:label('در حال خواندن مدت فایل صوتی…','Reading the audio duration…','Čitanje trajanja audio datoteke…')};
  current=job;showStatus(job);
  let audio=null,url='',timer=0,finished=false;
  function cleanup(){
    clearTimeout(timer);
    if(audio){audio.onloadedmetadata=null;audio.ondurationchange=null;audio.onerror=null;try{audio.removeAttribute('src');audio.load()}catch(_){}}
    if(url){URL.revokeObjectURL(url);url=''}
  }
  job.cancel=()=>{if(finished)return;finished=true;cleanup()};
  function finish(seconds){
    if(finished)return;
    finished=true;cleanup();
    if(!valid(job))return;
    if(job.manualDuration){
      job.message=label('مدت واردشده توسط شما حفظ شد.','Your manually entered duration was kept.','Sačuvano je trajanje koje ste unijeli.');
    }else if(Number.isFinite(seconds)&&seconds>0){
      const rounded=Math.max(1,Math.round(seconds));
      draft.duration_seconds=rounded;draft.duration_minutes=Math.round(rounded/60*100)/100;
      const clock=formatDurationClock(rounded);write('sv_duration',clock);
      job.message=label('مدت فایل: '+clock,'Audio duration: '+clock,'Trajanje audija: '+clock);
    }else{
      job.message=label('مدت این فایل خوانده نشد؛ آن را در کادر مدت به‌صورت دقیقه:ثانیه وارد کنید.','The duration could not be read. Enter minutes:seconds in the duration field.','Trajanje nije moguće pročitati. Unesite minute:sekunde u polje trajanja.');
    }
    showStatus(job);
  }
  try{
    audio=document.createElement('audio');audio.preload='metadata';
    const ready=()=>{if(!valid(job)){job.cancel();return}if(Number.isFinite(audio.duration)&&audio.duration>0)finish(audio.duration)};
    // Some recordings report Infinity initially, then a finite duration later.
    audio.onloadedmetadata=ready;audio.ondurationchange=ready;audio.onerror=()=>finish(0);
    timer=setTimeout(()=>finish(0),20000);
    url=URL.createObjectURL(file);audio.src=url;audio.load();
  }catch(_){finish(0)}
}
document.addEventListener('input',event=>{
  if(event.target?.id==='sv_title_fa')automaticTitle=null;
  if(event.target?.id==='sv_duration'&&valid(current))current.manualDuration=true;
},true);
document.addEventListener('nh7:admin-render',()=>{
  if(current&&!valid(current)){current.cancel();current=null}
  if(current)showStatus(current);
});
window.addEventListener('pagehide',()=>{if(current)current.cancel()});
inspectSermonAudio=window.inspectSermonAudio=inspect;
window.NH7AdminSermonMetadata={version:VERSION};
})();
