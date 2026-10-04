/* New Hope 7 v5.0.2 — Community modules runtime.
   Feature-branch only. Backend tables/buckets remain inactive until candidate migration is applied. */
(()=>{'use strict';
if(window.__NH7_COMMUNITY_V502__)return;window.__NH7_COMMUNITY_V502__=true;

const VERSION='5.0.8-profile-cache-finalqa';
const GUIDE_URL='data/community/testimony_guide_v502.json';
const PROFILE_BUCKET='nh7-profile-photos-v502';
const TESTIMONY_PRIVATE='nh7-testimony-submissions-v502';
const TESTIMONY_PUBLIC='nh7-testimony-published-v502';
const TESTIMONY_MAX_BYTES=60*1024*1024;
const PROFILE_MAX_BYTES=5*1024*1024;
const PUBLIC_FEED_TTL_MS=10*60*1000;
const MY_PRAYER_TTL_MS=2*60*1000;
let guideCache=null,publicFeedCache=new Map(),myPrayerCache={uid:'',at:0,rows:[]},recordState={rec:null,stream:null,chunks:[],blob:null,url:'',timer:0,started:0,topic:0,bytes:0,tooLarge:false};
let crop={original:'',cropped:'',dirty:false,x:0,y:0,zoom:1,tx:0,ty:0,tz:1,drag:false,sx:0,sy:0,ox:0,oy:0,scrollY:0};

function C(){const c=window.NH7_COMMUNITY_CTX_V502;if(!c)throw new Error('Community context is not ready.');return c}
function lang(){return C().lang()}
function L(fa,en,hr){return lang()==='fa'?fa:lang()==='hr'?hr:en}
function esc(s){return C().html(String(s??''))}
function ctxView(){return C().view()}
function toast(text,type='notice'){const el=document.querySelector('[data-community-msg]');if(el)el.innerHTML='<div class="'+type+'">'+esc(text)+'</div>'}
async function guide(){if(guideCache)return guideCache;const r=await fetch(GUIDE_URL,{cache:'no-store'});if(!r.ok)throw new Error('Testimony guide failed to load.');guideCache=await r.json();return guideCache}
function G(){return guideCache?.languages?.[lang()]||guideCache?.languages?.en}
function U(){return G()?.ui||{}}
function isLoggedIn(){return !!C().isLoggedIn()}
function requireLogin(route){
 if(isLoggedIn())return true;
 try{localStorage.setItem('nh7_pending_community_v502',route)}catch(_){}
 C().navigate('account',{},true);
 return false;
}
function resumePending(){
 if(!isLoggedIn())return false;
 let route='';try{route=localStorage.getItem('nh7_pending_community_v502')||'';localStorage.removeItem('nh7_pending_community_v502')}catch(_){}
 if(route){C().navigate(route,{},true);return true}
 return false;
}
function injectCss(){
 if(document.getElementById('nh7CommunityV502Css'))return;
 const s=document.createElement('style');s.id='nh7CommunityV502Css';s.textContent=`
 .nh7c502-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.nh7c502-note{font-size:.82rem;line-height:1.85;color:var(--muted)}
 .nh7c502-guide details{border:1px solid color-mix(in srgb,var(--text) 13%,transparent);border-radius:14px;padding:0;margin:10px 0;background:color-mix(in srgb,var(--card) 92%,var(--text) 8%);overflow:hidden}
 .nh7c502-guide summary{font-weight:800;cursor:pointer;padding:14px 16px;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px}
 .nh7c502-guide summary::-webkit-details-marker{display:none}.nh7c502-guide summary::after{content:'⌄';font-size:1.05rem;transition:transform .18s ease}.nh7c502-guide details[open]>summary::after{transform:rotate(180deg)}
 .nh7c502-section-body{padding:2px 16px 14px}.nh7c502-topic{padding:10px 0;border-top:1px solid color-mix(in srgb,var(--text) 10%,transparent)}.nh7c502-topic:first-child{border-top:0}.nh7c502-topic h4{margin:4px 0 8px}.nh7c502-guide li{margin:7px 0;line-height:1.9}.nh7c502-phase{border-inline-start:3px solid var(--accent);padding-inline-start:10px;margin:15px 0 8px}
 .nh7c502-verse{border:1px solid color-mix(in srgb,var(--text) 13%,transparent);border-radius:13px;padding:10px;margin:8px 0}.nh7c502-verse strong{display:block}
 .nh7c502-top-accordion{border:0!important;background:transparent!important;margin:0!important}.nh7c502-top-accordion>summary{font-size:1.05rem;font-weight:900;cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:2px 0}.nh7c502-top-accordion>summary::-webkit-details-marker{display:none}.nh7c502-top-accordion>summary::after{content:'⌄';font-size:1.1rem;transition:transform .18s ease}.nh7c502-top-accordion[open]>summary::after{transform:rotate(180deg)}.nh7c502-top-body{padding-top:12px}
 .nh7c502-record{border:1px solid color-mix(in srgb,var(--text) 13%,transparent);border-radius:16px;padding:12px}.nh7c502-record audio{width:100%;margin-top:8px}
 .nh7c502-list-card{border:1px solid color-mix(in srgb,var(--text) 13%,transparent);border-radius:16px;padding:12px;margin:9px 0}.nh7c502-audio-head{display:flex;gap:10px;align-items:flex-start}.nh7c502-art{width:50px;height:50px;border-radius:13px;background:color-mix(in srgb,var(--accent) 25%,var(--card));display:grid;place-items:center;font-size:1.45rem;flex:0 0 auto}.nh7c502-copy{flex:1}
 .nh7c502-avatar{width:98px;height:98px;border-radius:50%;overflow:hidden;border:3px solid color-mix(in srgb,var(--text) 18%,transparent);background:color-mix(in srgb,var(--accent) 16%,var(--card));display:grid;place-items:center;font-size:2rem}.nh7c502-avatar img{width:100%;height:100%;object-fit:cover}
 html.nh7-crop-lock,body.nh7-crop-lock{overflow:hidden!important;overscroll-behavior:none!important}.nh7c502-crop-modal{position:fixed;inset:0;z-index:4000;background:#000c;display:none;align-items:center;justify-content:center;padding:16px;touch-action:none}.nh7c502-crop-modal.open{display:flex}.nh7c502-crop-card{width:min(94vw,430px);max-height:calc(100dvh - 32px);overflow:auto;overscroll-behavior:contain;background:var(--card);border:1px solid color-mix(in srgb,var(--text) 18%,transparent);border-radius:22px;padding:16px;touch-action:pan-y}.nh7c502-crop-stage{width:280px;height:280px;max-width:78vw;max-height:78vw;margin:12px auto;position:relative;overflow:hidden;border-radius:50%;background:#06141b;border:4px solid #ffffff30;touch-action:none}.nh7c502-crop-stage img{position:absolute;left:50%;top:50%;max-width:none;user-select:none;-webkit-user-drag:none;pointer-events:none;transform-origin:center center}.nh7c502-crop-stage.dragging{cursor:grabbing}
 .nh7c502-range{width:100%}
 .nh7c502-prayer-own{border:1px solid var(--line);border-radius:16px;padding:13px;margin:10px 0;background:color-mix(in srgb,var(--card) 94%,var(--accent) 6%)}
 .nh7c502-prayer-own-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px}.nh7c502-prayer-own-head small{color:var(--muted)}
 .nh7c502-prayer-status{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:.74rem;font-weight:900;border:1px solid var(--line)}
 .nh7c502-prayer-own.is-received .nh7c502-prayer-status{color:var(--accent);background:color-mix(in srgb,var(--accent) 9%,var(--card))}
 .nh7c502-prayer-own.is-praying .nh7c502-prayer-status{color:#9a6300;background:#fff6d8;border-color:#efd790}
 html[data-nh7-studio-tone457="dark"] .nh7c502-prayer-own.is-praying .nh7c502-prayer-status{color:#ffe19a;background:#4a3510;border-color:#765a24}
 .nh7c502-prayer-own.is-completed .nh7c502-prayer-status{color:#157347;background:#e9f8ef;border-color:#a9d8ba}
 html[data-nh7-studio-tone457="dark"] .nh7c502-prayer-own.is-completed .nh7c502-prayer-status{color:#a9efc4;background:#153d2b;border-color:#2e684b}
 .nh7c502-prayer-own>p{margin:.3rem 0;white-space:pre-wrap}.nh7c502-prayer-answer{margin-top:10px;padding-top:10px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.nh7c502-prayer-answer span{font-size:.82rem;color:var(--muted);line-height:1.7}
 .nh7c502-consents{display:grid;gap:7px;margin:10px 0}.nh7c502-consents label{display:flex;align-items:flex-start;gap:8px;font-size:.82rem;line-height:1.7}
 .nh7c502-progress{height:5px;background:color-mix(in srgb,var(--text) 12%,transparent);border-radius:999px;overflow:hidden}.nh7c502-progress i{display:block;height:100%;background:var(--accent)}
 .nh7c502-prayer-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.nh7c502-prayer-head h3{margin:0}
 .nh7c502-prayer-list{display:grid;gap:9px;margin-top:10px}.nh7c502-prayer-item{border:1px solid color-mix(in srgb,var(--text) 13%,transparent);border-radius:15px;padding:12px;background:color-mix(in srgb,var(--card) 96%,var(--accent) 4%)}
 .nh7c502-prayer-item p{margin:7px 0;white-space:pre-wrap}.nh7c502-prayer-meta{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap}
 .nh7c502-prayer-status{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 9px;font-size:.76rem;font-weight:850;border:1px solid color-mix(in srgb,var(--accent) 28%,transparent)}
 .nh7c502-prayer-status[data-status="new"]{background:color-mix(in srgb,#3b82f6 12%,var(--card));color:color-mix(in srgb,#2563eb 86%,var(--text))}
 .nh7c502-prayer-status[data-status="praying"]{background:color-mix(in srgb,#a855f7 13%,var(--card));color:color-mix(in srgb,#7e22ce 82%,var(--text))}
 .nh7c502-prayer-status[data-status="completed"]{background:color-mix(in srgb,#22c55e 13%,var(--card));color:color-mix(in srgb,#15803d 84%,var(--text))}
 `;document.head.appendChild(s)
}
function backendNotice(err){
 const msg=String(err?.message||err||'');
 if(/does not exist|schema cache|404|PGRST205|permission denied/i.test(msg))return L(
  'Backend این ماژول هنوز روی محیط تست فعال نشده است؛ رابط و منطق آماده است و Production دست‌نخورده مانده.',
  'This module backend is not active in the test environment yet. UI and logic are ready; Production remains untouched.',
  'Backend ovog modula još nije aktivan u testnom okruženju. Sučelje i logika su spremni; Production nije promijenjen.'
 );
 return msg;
}
async function publicTestimonies(){
 const key=lang(),cached=publicFeedCache.get(key),now=Date.now();
 if(cached&&now-cached.at<PUBLIC_FEED_TTL_MS)return cached.rows;
 try{
  const rows=await C().cloudRpc('nh7_public_testimony_feed_v502',{p_language:key,p_limit:30});
  const safe=Array.isArray(rows)?rows:[];publicFeedCache.set(key,{at:now,rows:safe});return safe;
 }catch(e){console.warn('Public testimony feed unavailable',e);return cached?.rows||[]}
}
function publicAudioUrl(path){return path?C().publicStorageUrl(TESTIMONY_PUBLIC,path):''}

async function renderTestimonies(){
 injectCss();await guide();
 const g=G(),u=U(),view=ctxView();
 const publicRows=await publicTestimonies();
 const intro=g.importance.map(x=>'<p>'+esc(x)+'</p>').join('');
 const verses=g.verses.map(v=>'<div class="nh7c502-verse"><strong>'+esc(v[0])+'</strong>'+esc(v[1])+'</div>').join('');
 const guideHtml=g.sections.map(s=>'<details class="nh7c502-section"><summary>'+esc(s.title)+'</summary><div class="nh7c502-section-body">'+s.topics.map(t=>'<section class="nh7c502-topic"><h4>'+esc(t.title)+'</h4><ul>'+t.bullets.map(b=>'<li>'+esc(b)+'</li>').join('')+'</ul></section>').join('')+'</div></details>').join('');
 const cards=publicRows.length?publicRows.map(x=>'<article class="nh7c502-list-card"><div class="nh7c502-audio-head"><div class="nh7c502-art">🎙️</div><div class="nh7c502-copy"><strong>'+esc(x.title||u.testimonies||'Testimony')+'</strong><small>'+esc(x.display_name||'')+'</small><p>'+esc(x.note_text||'')+'</p></div></div>'+(x.published_audio_path?'<audio controls preload="none" style="width:100%;margin-top:8px" src="'+esc(publicAudioUrl(x.published_audio_path))+'"></audio>':'')+'</article>').join(''):'<p class="muted">'+esc(L('هنوز شهادت صوتی منتشر نشده است.','No audio testimony has been published yet.','Još nema objavljenih audio svjedočanstava.'))+'</p>';
 const whyHtml='<details class="nh7c502-top-accordion"><summary>'+esc(g.importanceTitle)+'</summary><div class="nh7c502-top-body">'+intro+verses+'</div></details>';
 const guideTopHtml='<details class="nh7c502-top-accordion"><summary>'+esc(g.guideTitle)+'</summary><div class="nh7c502-top-body"><p class="muted">'+esc(g.goal)+'</p><h3>'+esc(g.tipsTitle)+'</h3><ul>'+g.tips.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><div class="nh7c502-guide">'+guideHtml+'</div></div></details>';
 view.innerHTML=
  C().card('',whyHtml,'')+
  C().card('',guideTopHtml,'')+
  C().card(u.recordTitle,submissionHtml(g,u),'')+
  C().card(u.approvedAudio,cards,'');
 bindTestimonyForm();
}
function submissionHtml(g,u){
 const topics=g.sections.flatMap(s=>s.topics),first=topics[0];
 return '<div class="form-row"><label><strong>'+esc(u.shortTitle)+'</strong></label><input id="nh7c502Title" maxlength="180"></div>'+
 '<div class="form-row"><label><strong>'+esc(u.displayName)+'</strong></label><input id="nh7c502Name" maxlength="160" value="'+esc(C().profileName()||'')+'"></div>'+
 '<div class="form-row"><label><strong>'+esc(u.type)+'</strong></label><select id="nh7c502Type"><option value="healing">'+esc(u.healing)+'</option><option value="answered_prayer">'+esc(u.answered)+'</option><option value="salvation">'+esc(u.salvation)+'</option><option value="provision">'+esc(u.provision)+'</option><option value="other">'+esc(u.other)+'</option></select></div>'+
 '<div class="nh7c502-record"><div id="nh7c502RecordStatus" class="muted">'+esc(u.ready)+'</div><div class="nh7c502-actions"><button class="primary-btn" id="nh7c502RecordStart">'+esc(u.start)+'</button><button class="secondary-btn" id="nh7c502RecordPause" disabled>'+esc(u.pause)+'</button><button class="danger-btn" id="nh7c502RecordStop" disabled>'+esc(u.stop)+'</button><button class="secondary-btn" id="nh7c502RecordDelete" disabled>'+esc(u.remove)+'</button></div><audio id="nh7c502Playback" controls hidden></audio><div class="form-row"><label><strong>'+esc(u.upload)+'</strong></label><input id="nh7c502AudioFile" type="file" accept="audio/*,.mp3,.m4a,.aac,.wav,.webm"></div></div>'+
 '<div class="nh7c502-list-card"><strong id="nh7c502StepTitle">'+esc(u.guided+' · '+first.title)+'</strong><div id="nh7c502StepText"><ul>'+first.bullets.map(b=>'<li>'+esc(b)+'</li>').join('')+'</ul></div><div class="nh7c502-progress"><i id="nh7c502StepBar" style="width:'+(100/topics.length)+'%"></i></div><div class="nh7c502-actions"><button class="secondary-btn" id="nh7c502Prev">'+esc(u.previous)+'</button><button class="secondary-btn" id="nh7c502Next">'+esc(u.next)+'</button></div></div>'+
 '<div class="form-row"><label><strong>'+esc(u.adminNote)+'</strong></label><textarea id="nh7c502Note" maxlength="1200"></textarea></div>'+
 '<div class="nh7c502-consents"><label><input id="nh7c502ShowName" type="checkbox" checked><span>'+esc(u.showName)+'</span></label><label><input id="nh7c502Consent" type="checkbox"><span>'+esc(u.consent)+'</span></label><label><input id="nh7c502HealthConsent" type="checkbox"><span>'+esc(u.healthConsent)+'</span></label></div>'+
 '<button class="primary-btn wide-btn" id="nh7c502Submit">'+esc(u.submit)+'</button><div data-community-msg style="margin-top:10px"></div>';
}
function recordingStatus(text,on=false){const el=document.getElementById('nh7c502RecordStatus');if(el)el.innerHTML=(on?'● ':'')+esc(text)}
function clearRecording(){
 const prev=recordState;
 try{clearInterval(prev.timer)}catch(_){}
 try{if(prev.rec&&prev.rec.state!=='inactive'){prev.rec.ondataavailable=null;prev.rec.onstop=null;prev.rec.stop()}}catch(_){}
 try{prev.stream?.getTracks?.().forEach(t=>t.stop())}catch(_){}
 if(prev.url)try{URL.revokeObjectURL(prev.url)}catch(_){}
 recordState={rec:null,stream:null,chunks:[],blob:null,url:'',timer:0,started:0,topic:prev.topic||0,bytes:0,tooLarge:false}
}
function bindTestimonyForm(){
 const g=G(),u=U(),topics=g.sections.flatMap(s=>s.topics);
 function updateStep(){const t=topics[recordState.topic];document.getElementById('nh7c502StepTitle').textContent=u.guided+' · '+t.title;document.getElementById('nh7c502StepText').innerHTML='<ul>'+t.bullets.map(b=>'<li>'+esc(b)+'</li>').join('')+'</ul>';document.getElementById('nh7c502StepBar').style.width=((recordState.topic+1)/topics.length*100)+'%';document.getElementById('nh7c502Prev').disabled=recordState.topic===0;document.getElementById('nh7c502Next').disabled=recordState.topic===topics.length-1}
 document.getElementById('nh7c502Prev').onclick=()=>{recordState.topic=Math.max(0,recordState.topic-1);updateStep()};
 document.getElementById('nh7c502Next').onclick=()=>{recordState.topic=Math.min(topics.length-1,recordState.topic+1);updateStep()};
 updateStep();
 document.getElementById('nh7c502RecordStart').onclick=async()=>{
  try{
   if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw new Error('unsupported');
   const stream=await navigator.mediaDevices.getUserMedia({audio:true}),type=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(x=>MediaRecorder.isTypeSupported?.(x));
   clearRecording();recordState.stream=stream;recordState.chunks=[];recordState.bytes=0;recordState.tooLarge=false;recordState.rec=new MediaRecorder(stream,type?{mimeType:type}:undefined);
   recordState.rec.ondataavailable=e=>{if(!e.data?.size)return;recordState.bytes+=e.data.size;if(recordState.bytes>TESTIMONY_MAX_BYTES){recordState.tooLarge=true;if(recordState.rec?.state!=='inactive')recordState.rec.stop();return}recordState.chunks.push(e.data)};
   recordState.rec.onstop=()=>{clearInterval(recordState.timer);stream.getTracks().forEach(t=>t.stop());if(recordState.tooLarge){recordState.chunks=[];recordState.blob=null;recordState.bytes=0;const a=document.getElementById('nh7c502Playback');a.pause();a.removeAttribute('src');a.hidden=true;document.getElementById('nh7c502RecordStart').disabled=false;document.getElementById('nh7c502RecordPause').disabled=true;document.getElementById('nh7c502RecordStop').disabled=true;document.getElementById('nh7c502RecordDelete').disabled=true;recordingStatus(L('حجم ضبط به ۶۰ مگابایت رسید؛ فایل ذخیره نشد.','Recording reached the 60 MB limit and was not kept.','Snimka je dosegla ograničenje od 60 MB i nije spremljena.'));return}recordState.blob=new Blob(recordState.chunks,{type:recordState.rec.mimeType||'audio/webm'});recordState.url=URL.createObjectURL(recordState.blob);const a=document.getElementById('nh7c502Playback');a.src=recordState.url;a.hidden=false;document.getElementById('nh7c502RecordDelete').disabled=false;recordingStatus('✓')};
   recordState.rec.start(500);recordState.started=Date.now();recordState.timer=setInterval(()=>{const s=Math.floor((Date.now()-recordState.started)/1000);recordingStatus(String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'),true)},500);
   document.getElementById('nh7c502RecordStart').disabled=true;document.getElementById('nh7c502RecordPause').disabled=false;document.getElementById('nh7c502RecordStop').disabled=false;
  }catch(e){recordingStatus(L('میکروفن در دسترس نیست؛ فایل صوتی انتخاب کنید.','Microphone unavailable; choose an audio file.','Mikrofon nije dostupan; odaberite audio datoteku.'))}
 };
 document.getElementById('nh7c502RecordPause').onclick=()=>{const r=recordState.rec;if(!r)return;if(r.state==='recording'){r.pause();document.getElementById('nh7c502RecordPause').textContent=L('ادامه','Resume','Nastavi')}else if(r.state==='paused'){r.resume();document.getElementById('nh7c502RecordPause').textContent=u.pause}};
 document.getElementById('nh7c502RecordStop').onclick=()=>{const r=recordState.rec;if(r&&r.state!=='inactive')r.stop();document.getElementById('nh7c502RecordStart').disabled=false;document.getElementById('nh7c502RecordPause').disabled=true;document.getElementById('nh7c502RecordStop').disabled=true;document.getElementById('nh7c502RecordPause').textContent=u.pause};
 document.getElementById('nh7c502RecordDelete').onclick=()=>{clearRecording();const a=document.getElementById('nh7c502Playback');a.pause();a.removeAttribute('src');a.hidden=true;document.getElementById('nh7c502RecordDelete').disabled=true;recordingStatus(u.ready)};
 document.getElementById('nh7c502AudioFile').onchange=e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>TESTIMONY_MAX_BYTES){e.target.value='';toast(L('حجم فایل صوتی باید کمتر از ۶۰ مگابایت باشد.','Audio file must be smaller than 60 MB.','Audio datoteka mora biti manja od 60 MB.'));return}clearRecording();recordState.blob=f;recordState.url=URL.createObjectURL(f);const a=document.getElementById('nh7c502Playback');a.src=recordState.url;a.hidden=false;document.getElementById('nh7c502RecordDelete').disabled=false;recordingStatus(f.name)};
 document.getElementById('nh7c502Submit').onclick=submitTestimony;
}
async function mediaDuration(blob){
 return await new Promise(resolve=>{try{const u=URL.createObjectURL(blob),a=document.createElement('audio');a.preload='metadata';a.onloadedmetadata=()=>{const d=Math.max(0,Math.round(Number(a.duration)||0));URL.revokeObjectURL(u);resolve(d)};a.onerror=()=>{URL.revokeObjectURL(u);resolve(0)};a.src=u}catch(_){resolve(0)}})
}
function extFor(file){const n=String(file?.name||''),m=n.match(/\.([a-z0-9]{2,5})$/i);if(m)return m[1].toLowerCase();const t=String(file?.type||'');return t.includes('mp4')?'m4a':t.includes('mpeg')?'mp3':t.includes('wav')?'wav':t.includes('aac')?'aac':'webm'}
async function submitTestimony(){
 if(!requireLogin('testimonies'))return;
 const title=document.getElementById('nh7c502Title').value.trim(),name=document.getElementById('nh7c502Name').value.trim(),type=document.getElementById('nh7c502Type').value,note=document.getElementById('nh7c502Note').value.trim(),show=document.getElementById('nh7c502ShowName').checked,consent=document.getElementById('nh7c502Consent').checked,health=document.getElementById('nh7c502HealthConsent').checked,blob=recordState.blob;
 if(!title||!blob||!consent||(type==='healing'&&!health)){toast(L('عنوان، فایل صوتی و رضایت‌های لازم را کامل کنید.','Complete the title, audio, and required consent fields.','Ispunite naslov, audio i potrebne privole.'),'notice');return}
 const session=C().session(),uid=session?.user?.id;if(!uid){requireLogin('testimonies');return}
 const btn=document.getElementById('nh7c502Submit');btn.disabled=true;
 let uploadedPath='';
 try{
  if(Number(blob.size||0)>TESTIMONY_MAX_BYTES)throw new Error(L('حجم فایل صوتی باید کمتر از ۶۰ مگابایت باشد.','Audio file must be smaller than 60 MB.','Audio datoteka mora biti manja od 60 MB.'));
  const id=crypto.randomUUID?.()||String(Date.now()),path=uid+'/'+id+'.'+extFor(blob);uploadedPath=path;
  await C().storageUpload(TESTIMONY_PRIVATE,path,blob,blob.type||'application/octet-stream',false);
  const duration=await mediaDuration(blob);
  await C().cloudFetch('nh7_testimonies_v502',{method:'POST',body:JSON.stringify({user_id:uid,title,display_name:name||C().profileName()||'',testimony_type:type,note_text:note,language:lang(),show_name:show,consent_public:consent,consent_health_public:health,audio_submission_path:path,audio_mime_type:blob.type||'',audio_duration_seconds:duration,status:'pending'})});
  uploadedPath='';
  toast(L('شهادت صوتی شما خصوصی برای بررسی Admin ارسال شد ✓','Your audio testimony was sent privately for Admin review ✓','Vaše audio svjedočanstvo privatno je poslano Adminu na pregled ✓'),'notice success-notice');
 }catch(e){if(uploadedPath)C().storageRemove?.(TESTIMONY_PRIVATE,uploadedPath).catch(()=>{});toast(backendNotice(e),'notice')}finally{btn.disabled=false}
}

let ownPrayerRowsV503=[];
function prayerStatusLabelV503(status){
 const v=String(status||'new').toLowerCase();
 if(v==='praying')return L('در حال دعا','Praying','U molitvi');
 if(v==='completed')return L('دعا انجام شد','Prayer completed','Molitva dovršena');
 return L('دریافت شد','Received','Primljeno');
}
function prayerStatusClassV503(status){const v=String(status||'new').toLowerCase();return v==='praying'?'is-praying':v==='completed'?'is-completed':'is-received'}
function prayerDateV503(value){try{return new Intl.DateTimeFormat(lang()==='fa'?'fa-IR':lang()==='hr'?'hr-HR':'en-GB',{dateStyle:'medium'}).format(new Date(value))}catch(_){return String(value||'')}}
function renderOwnPrayerRowsV503(){
 const host=document.getElementById('nh7c502OwnPrayers');if(!host)return;
 if(!ownPrayerRowsV503.length){host.innerHTML='<p class="muted">'+esc(L('هنوز درخواست دعایی ثبت نکرده‌اید.','You have not submitted a prayer request yet.','Još niste poslali molitveni zahtjev.'))+'</p>';return}
 host.innerHTML=ownPrayerRowsV503.map(r=>{
  const status=String(r.status||'new').toLowerCase(),done=status==='completed';
  return '<article class="nh7c502-prayer-own '+prayerStatusClassV503(status)+'"><div class="nh7c502-prayer-own-head"><span class="nh7c502-prayer-status">'+esc(prayerStatusLabelV503(status))+'</span><small>'+esc(prayerDateV503(r.created_at))+'</small></div><p>'+esc(r.request_text||'')+'</p>'+(done?'<div class="nh7c502-prayer-answer"><span>'+esc(L('اگر پاسخ دعایتان را دریافت کرده‌اید، می‌توانید آن را به‌عنوان شهادت با کلیسا در میان بگذارید.','If you have received an answer to this prayer, you can share it with the church as a testimony.','Ako ste primili odgovor na ovu molitvu, možete ga podijeliti s crkvom kao svjedočanstvo.'))+'</span><button type="button" class="secondary-btn" data-nh7c502-testimony>'+esc(L('ثبت شهادت','Share testimony','Podijeli svjedočanstvo'))+'</button></div>':'')+'</article>';
 }).join('');
 host.querySelectorAll('[data-nh7c502-testimony]').forEach(b=>b.onclick=()=>C().navigate('testimonies',{},false));
}
async function loadOwnPrayersV503(force=false){
 if(!isLoggedIn())return;const uid=String(C().session()?.user?.id||'');if(!uid)return;
 const now=Date.now();
 if(!force&&myPrayerCache.uid===uid&&now-myPrayerCache.at<MY_PRAYER_TTL_MS){
  ownPrayerRowsV503=myPrayerCache.rows;renderOwnPrayerRowsV503();return;
 }
 try{
  const rows=await C().cloudFetch('nh7_prayer_requests_v502?user_id=eq.'+encodeURIComponent(uid)+'&select=id,request_text,status,created_at,updated_at&order=created_at.desc&limit=20',{method:'GET',cache:'no-store'});
  ownPrayerRowsV503=Array.isArray(rows)?rows:[];
  myPrayerCache={uid,at:now,rows:ownPrayerRowsV503};
 }catch(e){
  console.warn('[NH7 own prayer list]',e);
  ownPrayerRowsV503=myPrayerCache.uid===uid?myPrayerCache.rows:[];
 }
 renderOwnPrayerRowsV503();
}
async function renderPrayer(){
 injectCss();const u=(await guide(),U()),view=ctxView();
 view.innerHTML=C().card(u.prayerTitle,'<div class="notice"><strong>'+esc(u.prayerPrivate)+'</strong></div><p>'+esc(u.prayerLead)+'</p><p class="muted">'+esc(u.prayerSpiritual)+'</p><div class="form-row"><label><strong>'+esc(L('نام','Name','Ime'))+'</strong></label><input id="nh7c502PrayerName" maxlength="160" value="'+esc(C().profileName()||'')+'"></div><div class="form-row"><label><strong>'+esc(u.prayerDetail)+'</strong></label><textarea id="nh7c502PrayerText" maxlength="6000" style="min-height:180px"></textarea></div><button class="primary-btn wide-btn" id="nh7c502PrayerSubmit">'+esc(u.sendPrayer)+'</button><div data-community-msg style="margin-top:10px"></div>')+
 C().card(L('درخواست‌های دعای من','My prayer requests','Moji molitveni zahtjevi'),'<p class="muted">'+esc(L('فقط درخواست‌های خودتان در اینجا نمایش داده می‌شود. وضعیت هنگام باز کردن صفحه از Cache کوتاه استفاده می‌کند؛ برای گرفتن آخرین وضعیت «تازه‌سازی» را بزنید. هیچ بررسی دائمی در پس‌زمینه انجام نمی‌شود.','Only your own requests are shown here. A short cache is used when opening the page; tap Refresh for the latest status. There is no background polling.','Ovdje se prikazuju samo vaši zahtjevi. Pri otvaranju se koristi kratka predmemorija; dodirnite Osvježi za najnoviji status. Nema pozadinskog provjeravanja.'))+'</p><div class="nh7c502-actions"><button type="button" class="secondary-btn" id="nh7c502PrayerRefresh">'+esc(L('تازه‌سازی وضعیت','Refresh status','Osvježi status'))+'</button></div><div id="nh7c502OwnPrayers"><p class="muted">'+esc(L('در حال دریافت…','Loading…','Učitavanje…'))+'</p></div>');
 await loadOwnPrayersV503();
 document.getElementById('nh7c502PrayerRefresh').onclick=async()=>{const b=document.getElementById('nh7c502PrayerRefresh');b.disabled=true;try{await loadOwnPrayersV503(true)}finally{b.disabled=false}};
 document.getElementById('nh7c502PrayerSubmit').onclick=async()=>{
  if(!requireLogin('prayerRequest'))return;
  const name=document.getElementById('nh7c502PrayerName').value.trim(),text=document.getElementById('nh7c502PrayerText').value.trim();
  if(!name||text.length<20){toast(L('لطفاً موضوع درخواست دعا را کامل‌تر توضیح دهید.','Please explain your prayer request in more detail.','Molimo detaljnije opišite svoj molitveni zahtjev.'));return}
  const uid=C().session()?.user?.id;if(!uid){requireLogin('prayerRequest');return}
  const b=document.getElementById('nh7c502PrayerSubmit');b.disabled=true;
  try{
   const created=await C().cloudFetch('nh7_prayer_requests_v502',{method:'POST',body:JSON.stringify({user_id:uid,requester_name:name,request_text:text,status:'new'})});
   document.getElementById('nh7c502PrayerText').value='';
   const row=Array.isArray(created)?created[0]:null;if(row){ownPrayerRowsV503=[row,...ownPrayerRowsV503.filter(x=>String(x.id)!==String(row.id))].slice(0,20);myPrayerCache={uid,at:Date.now(),rows:ownPrayerRowsV503};renderOwnPrayerRowsV503()}
   else{myPrayerCache={uid,at:0,rows:ownPrayerRowsV503}}
   toast(L('درخواست دعای شما دریافت شد و خصوصی ثبت شد ✓','Your prayer request was received and saved privately ✓','Vaš molitveni zahtjev je zaprimljen i privatno spremljen ✓'),'notice success-notice');
  }catch(e){toast(backendNotice(e))}finally{b.disabled=false}
 };
}
async function renderProfile(){
 injectCss();await guide();if(!requireLogin('profile'))return;
 const u=U(),view=ctxView(),uid=C().session()?.user?.id;
 let row=null;try{const rows=await C().cloudFetch('nh7_user_profiles_v502?user_id=eq.'+encodeURIComponent(uid)+'&select=*',{method:'GET',cache:'no-store'});row=Array.isArray(rows)?rows[0]:null}catch(e){console.warn('Profile backend unavailable',e)}
 crop.original='';crop.cropped='';crop.dirty=false;crop.x=Number(row?.photo_position_x)||0;crop.y=Number(row?.photo_position_y)||0;crop.zoom=Number(row?.photo_zoom)||1;
 let avatar=C().profileHeaderCachedSrc?.(uid,row?.photo_path)||'';
 if(!avatar&&row?.photo_path){try{avatar=await C().privateStorageObjectUrl(PROFILE_BUCKET,row.photo_path)}catch(_){}}
 view.innerHTML=C().card(u.profileTitle,'<div style="display:flex;gap:12px;align-items:center"><div class="nh7c502-avatar" id="nh7c502Avatar">'+(avatar?'<img src="'+esc(avatar)+'">':'👤')+'</div><div><strong id="nh7c502ProfileName">'+esc(row?.display_name||C().profileName()||'')+'</strong><p class="muted">'+esc(u.profilePrivate)+'</p></div></div><div class="form-row"><label><strong>'+esc(u.displayName)+'</strong></label><input id="nh7c502ProfileNameInput" maxlength="160" value="'+esc(row?.display_name||C().profileName()||'')+'"></div><div class="form-row"><label><strong>'+esc(u.choosePhoto)+'</strong></label><input id="nh7c502PhotoInput" type="file" accept="image/*"></div><div class="nh7c502-actions"><button class="secondary-btn" id="nh7c502AdjustPhoto" disabled>'+esc(u.adjustPhoto)+'</button><button class="primary-btn" id="nh7c502SaveProfile">'+esc(u.saveProfile)+'</button></div><div data-community-msg style="margin-top:10px"></div>');
 ensureCropModal();
 document.getElementById('nh7c502PhotoInput').onchange=e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>PROFILE_MAX_BYTES){e.target.value='';toast(L('حجم عکس پروفایل باید کمتر از ۵ مگابایت باشد.','Profile photo must be smaller than 5 MB.','Fotografija profila mora biti manja od 5 MB.'));return}const r=new FileReader();r.onload=()=>{crop.original=String(r.result||'');crop.cropped='';crop.dirty=true;crop.x=0;crop.y=0;crop.zoom=1;document.getElementById('nh7c502AdjustPhoto').disabled=false;openCrop()};r.readAsDataURL(f)};
 document.getElementById('nh7c502AdjustPhoto').onclick=openCrop;
 document.getElementById('nh7c502SaveProfile').onclick=async()=>{const saved=await saveProfile(row);if(saved)row=saved};
}
function ensureCropModal(){
 let m=document.getElementById('nh7c502CropModal');if(m)return;
 m=document.createElement('div');m.id='nh7c502CropModal';m.className='nh7c502-crop-modal';m.innerHTML='<div class="nh7c502-crop-card"><h3>'+esc(U().cropTitle)+'</h3><p class="muted">'+esc(U().cropHelp)+'</p><div class="nh7c502-crop-stage" id="nh7c502CropStage"><img id="nh7c502CropImage" alt=""></div><label><strong>'+esc(U().zoom)+'</strong></label><input id="nh7c502Zoom" class="nh7c502-range" type="range" min="1" max="3" step="0.01" value="1"><div class="nh7c502-actions"><button class="secondary-btn" id="nh7c502CropReset">'+esc(U().cropReset)+'</button><button class="primary-btn" id="nh7c502CropSave">'+esc(U().cropSave)+'</button><button class="secondary-btn" id="nh7c502CropClose">'+esc(U().close)+'</button></div></div>';document.body.appendChild(m);
 const stage=document.getElementById('nh7c502CropStage');
 stage.addEventListener('pointerdown',e=>{e.preventDefault();crop.drag=true;stage.classList.add('dragging');crop.sx=e.clientX;crop.sy=e.clientY;crop.ox=crop.tx;crop.oy=crop.ty;stage.setPointerCapture(e.pointerId)});
 stage.addEventListener('pointermove',e=>{if(!crop.drag)return;e.preventDefault();crop.tx=crop.ox+(e.clientX-crop.sx);crop.ty=crop.oy+(e.clientY-crop.sy);applyCrop()});
 stage.addEventListener('pointerup',e=>{crop.drag=false;stage.classList.remove('dragging');try{stage.releasePointerCapture(e.pointerId)}catch(_){}});
 stage.addEventListener('pointercancel',()=>{crop.drag=false;stage.classList.remove('dragging')});
 m.addEventListener('touchmove',e=>{if(e.target.closest?.('#nh7c502CropStage'))e.preventDefault()},{passive:false});
 m.addEventListener('click',e=>{if(e.target===m)closeCrop()});
 document.getElementById('nh7c502Zoom').oninput=e=>{crop.tz=Number(e.target.value)||1;applyCrop()};
 document.getElementById('nh7c502CropReset').onclick=()=>{crop.tx=0;crop.ty=0;crop.tz=1;document.getElementById('nh7c502Zoom').value=1;applyCrop()};
 document.getElementById('nh7c502CropClose').onclick=closeCrop;
 document.getElementById('nh7c502CropSave').onclick=()=>{crop.x=crop.tx;crop.y=crop.ty;crop.zoom=crop.tz;crop.cropped=makeCropData();crop.dirty=true;closeCrop();const a=document.getElementById('nh7c502Avatar');if(a&&crop.cropped)a.innerHTML='<img src="'+crop.cropped+'">'}
}
function openCrop(){
 if(!crop.original)return;crop.tx=crop.x;crop.ty=crop.y;crop.tz=crop.zoom;
 const m=document.getElementById('nh7c502CropModal'),im=document.getElementById('nh7c502CropImage');crop.scrollY=window.scrollY||0;document.documentElement.classList.add('nh7-crop-lock');document.body.classList.add('nh7-crop-lock');document.body.style.position='fixed';document.body.style.top=(-crop.scrollY)+'px';document.body.style.left='0';document.body.style.right='0';document.body.style.width='100%';m.classList.add('open');document.getElementById('nh7c502Zoom').value=crop.tz;im.onload=()=>{fitCrop();applyCrop()};im.src=crop.original;if(im.complete&&im.naturalWidth){fitCrop();applyCrop()}
}
function closeCrop(){const m=document.getElementById('nh7c502CropModal');m?.classList.remove('open');document.documentElement.classList.remove('nh7-crop-lock');document.body.classList.remove('nh7-crop-lock');document.body.style.position='';document.body.style.top='';document.body.style.left='';document.body.style.right='';document.body.style.width='';window.scrollTo(0,crop.scrollY);crop.drag=false}
function fitCrop(){const im=document.getElementById('nh7c502CropImage'),s=document.getElementById('nh7c502CropStage');if(!im?.naturalWidth||!s)return;const base=Math.max(s.clientWidth/im.naturalWidth,s.clientHeight/im.naturalHeight);im.dataset.base=String(base);im.style.width=(im.naturalWidth*base)+'px';im.style.height=(im.naturalHeight*base)+'px';constrainCrop()}
function constrainCrop(){const im=document.getElementById('nh7c502CropImage'),s=document.getElementById('nh7c502CropStage');if(!im?.naturalWidth||!s)return;const base=Number(im.dataset.base)||1,scale=base*crop.tz,w=im.naturalWidth*scale,h=im.naturalHeight*scale,maxX=Math.max(0,(w-s.clientWidth)/2),maxY=Math.max(0,(h-s.clientHeight)/2);crop.tx=Math.max(-maxX,Math.min(maxX,crop.tx));crop.ty=Math.max(-maxY,Math.min(maxY,crop.ty))}
function applyCrop(){constrainCrop();const im=document.getElementById('nh7c502CropImage');if(im)im.style.transform='translate(-50%,-50%) translate('+crop.tx+'px,'+crop.ty+'px) scale('+crop.tz+')'}
function makeCropData(){const im=document.getElementById('nh7c502CropImage'),s=document.getElementById('nh7c502CropStage');if(!im?.naturalWidth||!s)return'';constrainCrop();const base=Number(im.dataset.base)||1,scale=base*crop.tz,sw=s.clientWidth/scale,sh=s.clientHeight/scale,imageLeft=s.clientWidth/2+crop.tx-(im.naturalWidth*scale)/2,imageTop=s.clientHeight/2+crop.ty-(im.naturalHeight*scale)/2;let sx=(0-imageLeft)/scale,sy=(0-imageTop)/scale;sx=Math.max(0,Math.min(im.naturalWidth-sw,sx));sy=Math.max(0,Math.min(im.naturalHeight-sh,sy));const cv=document.createElement('canvas');cv.width=512;cv.height=512;const ct=cv.getContext('2d',{alpha:false});ct.fillStyle='#071820';ct.fillRect(0,0,512,512);ct.imageSmoothingEnabled=true;ct.imageSmoothingQuality='high';ct.drawImage(im,sx,sy,sw,sh,0,0,512,512);return cv.toDataURL('image/jpeg',.9)}
async function dataUrlBlob(data){
 if(!/^data:image\//i.test(String(data||'')))throw new Error(L('خروجی عکس معتبر نیست؛ لطفاً دوباره عکس را تنظیم کنید.','The photo output is invalid; please adjust the photo again.','Izlaz fotografije nije valjan; ponovno podesite fotografiju.'));
 const r=await fetch(data);const blob=await r.blob();
 if(!String(blob.type||'').startsWith('image/'))throw new Error(L('فرمت عکس معتبر نیست.','The photo format is invalid.','Format fotografije nije valjan.'));
 return blob
}
function profileOriginalExt(blob){
 const t=String(blob?.type||'').toLowerCase();
 if(t.includes('png'))return'png';
 if(t.includes('webp'))return'webp';
 if(t.includes('heic'))return'heic';
 if(t.includes('heif'))return'heif';
 return'jpg'
}
async function saveProfile(old){
 if(!requireLogin('profile'))return;const uid=C().session()?.user?.id,name=document.getElementById('nh7c502ProfileNameInput').value.trim()||C().profileName()||'';
 const b=document.getElementById('nh7c502SaveProfile');b.disabled=true;let newUploads=[];
 try{
  let originalPath=old?.original_photo_path||'',photoPath=old?.photo_path||'';
  if(crop.dirty&&crop.original){
   const id=crypto.randomUUID?.()||String(Date.now()),originalBlob=await dataUrlBlob(crop.original),avatarData=crop.cropped||makeCropData();
   if(!/^data:image\/jpeg/i.test(String(avatarData||'')))throw new Error(L('برش عکس کامل نشده است؛ لطفاً عکس را دوباره تنظیم و ذخیره کنید.','The crop is incomplete; please adjust and save the photo again.','Izrezivanje nije dovršeno; ponovno podesite i spremite fotografiju.'));
   const avatarBlob=await dataUrlBlob(avatarData);
   if(originalBlob.size>PROFILE_MAX_BYTES)throw new Error(L('حجم عکس پروفایل باید کمتر از ۵ مگابایت باشد.','Profile photo must be smaller than 5 MB.','Fotografija profila mora biti manja od 5 MB.'));
   originalPath=uid+'/original-'+id+'.'+profileOriginalExt(originalBlob);photoPath=uid+'/avatar-'+id+'.jpg';
   await C().storageUpload(PROFILE_BUCKET,originalPath,originalBlob,originalBlob.type||'image/jpeg',false);newUploads.push(originalPath);
   await C().storageUpload(PROFILE_BUCKET,photoPath,avatarBlob,'image/jpeg',false);newUploads.push(photoPath);
  }
  await C().cloudFetch('nh7_user_profiles_v502?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({user_id:uid,display_name:name,original_photo_path:originalPath,photo_path:photoPath,photo_position_x:crop.x,photo_position_y:crop.y,photo_zoom:crop.zoom,updated_at:new Date().toISOString()})});
  newUploads=[];
  const stale=[old?.original_photo_path,old?.photo_path].filter(p=>p&&p!==originalPath&&p!==photoPath);if(stale.length)C().storageRemove?.(PROFILE_BUCKET,stale).catch(()=>{});
  try{const previous=JSON.parse(localStorage.getItem('nh7_user_profile')||'{}');localStorage.setItem('nh7_user_profile',JSON.stringify(Object.assign({},previous&&typeof previous==='object'?previous:{},{name,email:C().email()})))}catch(_){}
  document.getElementById('nh7c502ProfileName').textContent=name;
  const savedPreview=crop.cropped;crop.dirty=false;
  if(savedPreview)Promise.resolve(C().refreshHeaderProfile?.({src:savedPreview,path:photoPath,name})).catch(()=>{});
  else Promise.resolve(C().refreshHeaderProfile?.({force:true,name})).catch(()=>{});
  toast(L('پروفایل ذخیره شد ✓','Profile saved ✓','Profil je spremljen ✓'),'notice success-notice');
  return {user_id:uid,display_name:name,original_photo_path:originalPath,photo_path:photoPath,photo_position_x:crop.x,photo_position_y:crop.y,photo_zoom:crop.zoom}
 }catch(e){if(newUploads.length)C().storageRemove?.(PROFILE_BUCKET,newUploads).catch(()=>{});toast(backendNotice(e))}finally{b.disabled=false}
}

function dispose(){
 try{clearRecording()}catch(_){}
 try{if(document.getElementById('nh7c502CropModal')?.classList.contains('open'))closeCrop()}catch(_){}
}
window.addEventListener('pagehide',dispose);
window.NH7CommunityV502={VERSION,renderTestimonies,renderPrayer,renderProfile,resumePending,dispose};
})();