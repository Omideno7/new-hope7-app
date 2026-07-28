/* New Hope 7 — secure school audio and conference video player v2.6.0 */
(()=>{'use strict';
const VERSION='2.6.0-school-media-client';
const URL='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
const VIDEO_CODE_KEY='nh7_school_video_code_v260';
const AUDIO_CACHE_KEY='nh7_school_audio_signed_v260';
let modal=null,catalog=[],catalogLoading=false,watermarkTimer=null;
const lang=()=>{const value=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(value)?value:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function token(){return String(session()?.access_token||'')}
function email(){return String(session()?.user?.email||localStorage.getItem('nh7_manual_email')||'').trim().toLowerCase()}
function device(){let id=localStorage.getItem('nh7_device_id');if(!id){id='dev_'+(crypto.randomUUID?.()||Date.now()+'_'+Math.random().toString(36).slice(2));localStorage.setItem('nh7_device_id',id)}return id}
function headers(){return{apikey:KEY,Authorization:'Bearer '+token(),'Content-Type':'application/json'}}
function fmt(seconds){seconds=Math.max(0,Number(seconds)||0);const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=Math.floor(seconds%60);return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`}
function parseJson(text){try{return text?JSON.parse(text):{}}catch(_){return{message:text}}}
async function edge(payload){
  const access=token();if(!access)throw Object.assign(new Error(L('ابتدا وارد حساب مدرسه شوید.','Sign in to the school account first.','Najprije se prijavite u školu.')),{code:'login_required'});
  const response=await fetch(`${URL}/functions/v1/nh7-school-media-access`,{method:'POST',headers:headers(),body:JSON.stringify(Object.assign({device_id:device()},payload)),cache:'no-store'}),text=await response.text(),data=parseJson(text);
  if(!response.ok)throw Object.assign(new Error(data.error||data.message||text||response.statusText),{code:data.code||''});return data
}
function signedAudioCache(){try{return JSON.parse(sessionStorage.getItem(AUDIO_CACHE_KEY)||'{}')}catch(_){return{}}}
function cachedAudio(code){const cache=signedAudioCache(),row=cache[code];return row&&Number(row.expires||0)>Date.now()+60000?row.url:''}
function saveAudioCache(code,data){const cache=signedAudioCache();cache[code]={url:data.signed_url,expires:Date.now()+Math.max(60,Number(data.expires_in||0)-30)*1000};sessionStorage.setItem(AUDIO_CACHE_KEY,JSON.stringify(cache))}
async function authorizeSchoolAudio(button){
  const id=String(button.dataset.sermonPlay||''),code=id.replace(/^school-/,'');if(!code)return false;
  const map=window.__sermonMap||{},item=map[id];if(!item)return false;
  const cached=cachedAudio(code);if(cached){item.audio_url=cached;return true}
  const original=button.textContent;button.disabled=true;button.textContent=L('در حال دریافت لینک امن…','Getting secure link…','Dohvaćanje sigurne poveznice…');
  try{const data=await edge({kind:'audio',lesson_code:code});if(!data?.signed_url)throw new Error('No signed URL');item.audio_url=data.signed_url;saveAudioCache(code,data);return true}
  catch(error){console.warn('School audio access',error);alert(mediaError(error));return false}
  finally{button.disabled=false;button.textContent=original}
}
document.addEventListener('click',async event=>{
  const button=event.target.closest?.('[data-sermon-play^="school-"]');if(!button)return;
  if(button.dataset.nh7SecureBypass==='1'){delete button.dataset.nh7SecureBypass;return}
  event.preventDefault();event.stopImmediatePropagation();
  if(await authorizeSchoolAudio(button)){button.dataset.nh7SecureBypass='1';button.click()}
},true);
function protectSchoolAudioUi(){document.querySelectorAll('.school-audio-card [data-offline-download]').forEach(button=>button.remove())}
function titleOf(row){const l=lang();return row?.['title_'+l]||row?.title_en||row?.title_fa||row?.title_hr||row?.file_name||L('ویدیو','Video','Video')}
function descriptionOf(row){const l=lang();return row?.['description_'+l]||row?.description_en||row?.description_fa||row?.description_hr||''}
async function loadCatalog(force=false){
  if(catalogLoading||(!force&&catalog.length))return catalog;if(!token())throw new Error(L('ابتدا وارد حساب مدرسه شوید.','Sign in first.','Najprije se prijavite.'));catalogLoading=true;
  try{const response=await fetch(`${URL}/rest/v1/rpc/nh7_school_video_catalog_v260`,{method:'POST',headers:headers(),body:'{}',cache:'no-store'}),text=await response.text(),data=parseJson(text);if(!response.ok)throw new Error(data.message||text||response.statusText);catalog=Array.isArray(data)?data:[];return catalog}finally{catalogLoading=false}
}
function addVideoButton(){
  protectSchoolAudioUi();const school=document.querySelector('#view .school-course-group');if(!school||document.querySelector('[data-nh7-school-videos]'))return;
  const button=document.createElement('button');button.type='button';button.className='primary-btn wide-btn nh7-school-videos-entry';button.dataset.nh7SchoolVideos='1';button.innerHTML=`🎬 <strong>${E(L('ویدیوهای مدرسه و کنفرانس','School & conference videos','Videozapisi škole i konferencija'))}</strong><small>${E(L('ورود با کد یک‌دستگاهه','One-device access code','Kod za jedan uređaj'))}</small>`;school.parentElement?.insertBefore(button,school)
}
function closeModal(){if(watermarkTimer)clearInterval(watermarkTimer);watermarkTimer=null;modal?.remove();modal=null;document.body.classList.remove('nh7-school-video-open')}
function libraryHtml(){return`<section class="nh7-school-video-dialog"><header><div><h2>🎬 ${E(L('ویدیوهای مدرسه و کنفرانس','School & conference videos','Videozapisi škole i konferencija'))}</h2><p>${E(L('برای پخش، کدی را که مدیر کلیسا داده وارد کنید.','Enter the access code provided by the church administrator.','Unesite pristupni kod administratora.'))}</p></div><button type="button" data-nh7-video-close>× ${E(L('بستن','Close','Zatvori'))}</button></header><div class="nh7-school-video-cards">${catalog.map(row=>`<article class="nh7-school-video-card"><div class="nh7-school-video-icon">▶</div><div><h3>${E(titleOf(row))}</h3><p>${E(descriptionOf(row))}</p><small>${E(row.topic||'')} ${row.duration_seconds?'· '+fmt(row.duration_seconds):''}${row.has_subtitle_en?' · EN CC':''}${row.has_subtitle_hr?' · HR CC':''}</small></div><button type="button" data-nh7-video-play="${E(row.id)}">▶ ${E(L('پخش امن','Secure play','Sigurna reprodukcija'))}</button></article>`).join('')||`<div class="nh7-school-video-empty">${E(L('هنوز ویدیویی منتشر نشده است.','No videos have been published yet.','Još nema objavljenih videozapisa.'))}</div>`}</div></section>`}
async function openLibrary(){
  closeModal();modal=document.createElement('div');modal.className='nh7-school-video-modal';modal.innerHTML=`<div class="nh7-school-video-loading"><div class="nh7-school-spinner"></div><p>${E(L('در حال دریافت ویدیوها…','Loading videos…','Učitavanje videozapisa…'))}</p></div>`;document.body.appendChild(modal);document.body.classList.add('nh7-school-video-open');
  try{await loadCatalog(true);modal.innerHTML=libraryHtml()}catch(error){modal.innerHTML=`<section class="nh7-school-video-dialog"><header><h2>${E(L('ویدیوها','Videos','Videozapisi'))}</h2><button data-nh7-video-close>×</button></header><div class="nh7-school-video-empty">${E(mediaError(error))}</div></section>`}
}
function savedCode(){try{const value=JSON.parse(sessionStorage.getItem(VIDEO_CODE_KEY)||'null');return value&&Date.now()-Number(value.at||0)<12*60*60*1000?String(value.code||''):''}catch(_){return''}}
function saveCode(code){sessionStorage.setItem(VIDEO_CODE_KEY,JSON.stringify({code,at:Date.now()}))}
function clearCode(){sessionStorage.removeItem(VIDEO_CODE_KEY)}
async function accessVideo(row){
  let code=savedCode();if(!code)code=String(prompt(L('کد دسترسی ویدیو را وارد کنید:','Enter the video access code:','Unesite pristupni kod za video:'),'')||'').trim();if(!code)return null;
  try{const data=await edge({kind:'video',video_id:row.id,code});saveCode(code);return data}
  catch(error){
    if(['invalid_code','expired','code_not_for_video','device_bound_elsewhere','grant_revoked'].includes(String(error.code||'')))clearCode();
    if(['invalid_code','expired','code_not_for_video'].includes(String(error.code||''))){const retry=confirm(mediaError(error)+'\n\n'+L('کد دیگری وارد شود؟','Enter another code?','Unijeti drugi kod?'));if(retry){const next=String(prompt(L('کد جدید:','New code:','Novi kod:'),'')||'').trim();if(next){const data=await edge({kind:'video',video_id:row.id,code:next});saveCode(next);return data}}}
    throw error
  }
}
function playerHtml(row,data){
  const defaultCaption=lang()==='en'&&data.subtitle_en_url?'en':lang()==='hr'&&data.subtitle_hr_url?'hr':'';
  return`<section class="nh7-school-player-dialog"><header><div><h2>${E(data['title_'+lang()]||titleOf(row))}</h2><small>🔒 ${E(L('پخش خصوصی متصل به حساب و دستگاه','Private account/device-bound playback','Privatna reprodukcija vezana uz račun i uređaj'))}</small></div><button type="button" data-nh7-video-back>‹ ${E(L('فهرست','Library','Popis'))}</button><button type="button" data-nh7-video-close>×</button></header><div class="nh7-school-video-stage"><video playsinline webkit-playsinline preload="metadata" controlslist="nodownload noremoteplayback nofullscreen" disablepictureinpicture disableremoteplayback src="${E(data.signed_url)}">${data.subtitle_en_url?`<track kind="subtitles" srclang="en" label="English" src="${E(data.subtitle_en_url)}" ${defaultCaption==='en'?'default':''}>`:''}${data.subtitle_hr_url?`<track kind="subtitles" srclang="hr" label="Hrvatski" src="${E(data.subtitle_hr_url)}" ${defaultCaption==='hr'?'default':''}>`:''}</video><div class="nh7-school-video-watermark" data-nh7-watermark>${E(data.watermark_email||email())} · ${E(data.watermark_device||device().slice(-8))}</div><div class="nh7-school-video-blocker" aria-hidden="true"></div></div><div class="nh7-school-video-controls"><button type="button" data-nh7-play>▶</button><button type="button" data-nh7-back>↶15</button><button type="button" data-nh7-forward>30↷</button><button type="button" data-nh7-mute>🔊</button><span data-nh7-now>0:00</span><input type="range" min="0" max="1000" value="0" data-nh7-seek><span data-nh7-total>${fmt(data.duration_seconds||row.duration_seconds||0)}</span><select data-nh7-speed><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select><select data-nh7-caption><option value="">CC ${E(L('خاموش','Off','Isključeno'))}</option>${data.subtitle_en_url?`<option value="en" ${defaultCaption==='en'?'selected':''}>English CC</option>`:''}${data.subtitle_hr_url?`<option value="hr" ${defaultCaption==='hr'?'selected':''}>Hrvatski CC</option>`:''}</select></div><p class="nh7-school-video-security">${E(L('نام حساب و شناسه دستگاه به‌صورت متحرک روی تصویر نمایش داده می‌شود.','The account and device identifier are dynamically watermarked on the video.','Račun i uređaj prikazuju se kao dinamički vodeni žig.'))}</p></section>`
}
function bindPlayer(row,data){
  const video=modal.querySelector('video'),play=modal.querySelector('[data-nh7-play]'),mute=modal.querySelector('[data-nh7-mute]'),seek=modal.querySelector('[data-nh7-seek]'),now=modal.querySelector('[data-nh7-now]'),total=modal.querySelector('[data-nh7-total]'),speed=modal.querySelector('[data-nh7-speed]'),captions=modal.querySelector('[data-nh7-caption]'),watermark=modal.querySelector('[data-nh7-watermark]');
  if(!video)return;video.disablePictureInPicture=true;video.setAttribute('disableRemotePlayback','');
  const sync=()=>{play.textContent=video.paused?'▶':'❚❚';mute.textContent=video.muted?'🔇':'🔊';now.textContent=fmt(video.currentTime);total.textContent=fmt(Number.isFinite(video.duration)?video.duration:(data.duration_seconds||0));seek.value=Number.isFinite(video.duration)&&video.duration?Math.round(video.currentTime/video.duration*1000):0};
  ['timeupdate','loadedmetadata','play','pause','volumechange','durationchange'].forEach(name=>video.addEventListener(name,sync));video.addEventListener('error',()=>alert(L('این فرمت یا کُدک در این دستگاه قابل پخش نیست. نسخه MP4 با H.264/AAC بیشترین سازگاری را دارد.','This format or codec is not playable on this device. MP4 H.264/AAC is the most compatible.','Format ili kodek nije podržan. MP4 H.264/AAC je najkompatibilniji.')));
  play.onclick=()=>video.paused?video.play().catch(()=>{}):video.pause();modal.querySelector('[data-nh7-back]').onclick=()=>video.currentTime=Math.max(0,video.currentTime-15);modal.querySelector('[data-nh7-forward]').onclick=()=>video.currentTime=Math.min(video.duration||Infinity,video.currentTime+30);mute.onclick=()=>video.muted=!video.muted;seek.oninput=()=>{if(Number.isFinite(video.duration))video.currentTime=video.duration*Number(seek.value)/1000};speed.onchange=()=>video.playbackRate=Number(speed.value||1);captions.onchange=()=>{for(const track of video.textTracks)track.mode=track.language===captions.value?'showing':'disabled'};
  video.oncontextmenu=event=>event.preventDefault();video.ondragstart=event=>event.preventDefault();modal.oncontextmenu=event=>event.preventDefault();
  const moveWatermark=()=>{if(!watermark)return;watermark.textContent=`${data.watermark_email||email()} · ${data.watermark_device||device().slice(-8)} · ${new Date().toLocaleTimeString()}`;watermark.style.left=(8+Math.random()*62).toFixed(1)+'%';watermark.style.top=(8+Math.random()*70).toFixed(1)+'%'};moveWatermark();watermarkTimer=setInterval(moveWatermark,8000);sync()
}
async function playVideo(id){
  const row=catalog.find(item=>String(item.id)===String(id));if(!row)return;const card=modal.querySelector(`[data-nh7-video-play="${CSS.escape(String(id))}"]`),old=card?.textContent||'';if(card){card.disabled=true;card.textContent=L('در حال تأیید کد…','Checking code…','Provjera koda…')}
  try{const data=await accessVideo(row);if(!data)return;modal.innerHTML=playerHtml(row,data);bindPlayer(row,data)}catch(error){alert(mediaError(error));if(card){card.disabled=false;card.textContent=old}}
}
function mediaError(error){const code=String(error?.code||error?.message||'').toLowerCase();if(code.includes('school_approval_required'))return L('دسترسی مدرسه شما هنوز تأیید نشده است.','Your school access is not approved.','Pristup školi nije odobren.');if(code.includes('device_bound_elsewhere'))return L('این کد قبلاً به حساب یا دستگاه دیگری متصل شده و قابل انتقال نیست.','This code is already bound to another account or device and cannot be transferred.','Kod je već vezan uz drugi račun ili uređaj.');if(code.includes('grant_revoked'))return L('دسترسی این کد توسط مدیر باطل شده است.','This code access was revoked by the administrator.','Pristup je poništen.');if(code.includes('expired'))return L('زمان اعتبار این کد تمام شده است.','This code has expired.','Kod je istekao.');if(code.includes('invalid_code')||code.includes('code_not_for_video'))return L('کد برای این ویدیو معتبر نیست.','The code is not valid for this video.','Kod nije valjan za ovaj video.');if(code.includes('login_required')||code.includes('invalid_session'))return L('ابتدا دوباره وارد حساب مدرسه شوید.','Sign in to the school account again.','Ponovno se prijavite u školu.');return error?.message||String(error||L('رسانه باز نشد.','Media could not be opened.','Medij se nije mogao otvoriti.'))}
document.addEventListener('click',event=>{
  if(event.target.closest?.('[data-nh7-school-videos]')){event.preventDefault();openLibrary();return}
  if(event.target.closest?.('[data-nh7-video-close]')){event.preventDefault();closeModal();return}
  if(event.target.closest?.('[data-nh7-video-back]')){event.preventDefault();if(watermarkTimer)clearInterval(watermarkTimer);watermarkTimer=null;modal.innerHTML=libraryHtml();return}
  const play=event.target.closest?.('[data-nh7-video-play]');if(play){event.preventDefault();playVideo(play.dataset.nh7VideoPlay)}
},true);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal)closeModal()},true);
const observer=new MutationObserver(()=>requestAnimationFrame(()=>{addVideoButton();protectSchoolAudioUi()}));observer.observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>{addVideoButton();protectSchoolAudioUi()},1800);setTimeout(()=>{addVideoButton();protectSchoolAudioUi()},400);
window.NH7_SCHOOL_MEDIA_CLIENT_VERSION=VERSION;
})();