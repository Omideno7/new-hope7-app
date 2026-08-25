/* New Hope 7 QA v3.7.4 — trilingual School guide + authoritative audio/assignment gate.
 * Uses the proven secure three-attempt exam UI and redirects its RPCs to the v3.7.3
 * server gate. Production/main is not modified by this QA overlay.
 */
(()=>{'use strict';
if(window.__NH7_SCHOOL_GUIDE_GATE_V374__)return;
window.__NH7_SCHOOL_GUIDE_GATE_V374__=true;

const VERSION='3.7.4-school-guide-gate';
const SB='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION='nh7_user_session_v170';
const COURSE='foundation_school';
const originalFetch=window.fetch.bind(window);
let courseGate=null;
let gateAt=0;
let gatePromise=null;
let timer=0;
let lastLesson='';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const language=()=>{const value=localStorage.getItem('nh7_lang')||$('#langSelect')?.value||document.documentElement.lang||'en';return ['fa','en','hr'].includes(value)?value:'en'};
const L=(fa,en,hr)=>language()==='fa'?fa:language()==='hr'?hr:en;
const E=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const N=value=>language()==='fa'?String(value??'').replace(/\d/g,digit=>'۰۱۲۳۴۵۶۷۸۹'[digit]):String(value??'');

function readSession(){try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch(_){return null}}
function writeSession(value){try{localStorage.setItem(SESSION,JSON.stringify(value));localStorage.removeItem('nh7_explicit_logout')}catch(_){}}
async function refreshSession(current){
  if(!current?.refresh_token)throw new Error('session_expired');
  const response=await originalFetch(`${SB}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:current.refresh_token}),cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.access_token)throw new Error(data?.message||'session_expired');
  const next={...current,...data};writeSession(next);return next;
}
async function rpc(name,body={},retry=0){
  let current=readSession();
  let token=String(current?.access_token||'');
  if(!token)throw new Error('login_required');
  const response=await originalFetch(`${SB}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
  if(response.status===401&&!retry){current=await refreshSession(current);token=current.access_token;return rpc(name,body,1)}
  const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={message:text}}
  if(!response.ok)throw new Error(data?.message||data?.error||response.statusText);
  return data;
}

function rewriteRpc(raw){
  return String(raw||'')
    .replace(/\/rpc\/nh7_submit_school_assignment(?=\?|#|$)/,'/rpc/nh7_submit_school_assignment_v373')
    .replace(/\/rpc\/nh7_school_exam_session_v340(?=\?|#|$)/,'/rpc/nh7_school_exam_session_v373')
    .replace(/\/rpc\/nh7_submit_school_exam_v340(?=\?|#|$)/,'/rpc/nh7_submit_school_exam_v373');
}
window.fetch=function nh7SchoolGateFetch(input,init={}){
  try{
    const raw=typeof input==='string'?input:input instanceof URL?input.href:input?.url||'';
    const url=rewriteRpc(raw);
    if(url===raw)return originalFetch(input,init);
    if(input instanceof Request)return originalFetch(new Request(url,input),init);
    return originalFetch(url,init);
  }catch(error){console.warn('[NH7 School gate fetch]',error);return originalFetch(input,init)}
};

async function getGate(force=false,lessonCode=null){
  if(lessonCode)return rpc('nh7_school_gate_status_v373',{p_course_code:COURSE,p_lesson_code:lessonCode});
  if(!force&&courseGate&&Date.now()-gateAt<5000)return courseGate;
  if(gatePromise)return gatePromise;
  gatePromise=rpc('nh7_school_gate_status_v373',{p_course_code:COURSE,p_lesson_code:null})
    .then(value=>{courseGate=value;gateAt=Date.now();return value})
    .finally(()=>{gatePromise=null});
  return gatePromise;
}

function lockMessage(reason){
  if(reason==='audio_completion_required')return L(
    'برای ادامه، ابتدا فایل صوتی درس را تا پایان گوش دهید. برای ورود به امتحان باید صوت همهٔ درس‌ها کامل شده باشد.',
    'First listen to the lesson audio to completion. Every lesson audio must be complete before the final exam.',
    'Najprije poslušajte audiozapis lekcije do kraja. Svi audiozapisi moraju biti dovršeni prije završnog ispita.'
  );
  if(reason==='assignments_required')return L(
    'پس از شنیدن کامل صوت هر درس، پاسخ تکلیف همان درس را با دقت و بر اساس محتوای درس ارسال کنید.',
    'After completing each lesson audio, carefully submit that lesson assignment based on its content.',
    'Nakon dovršenog audiozapisa svake lekcije pažljivo predajte zadatak temeljen na sadržaju lekcije.'
  );
  return L('شرایط ورود به امتحان هنوز کامل نشده است.','The exam requirements are not complete yet.','Uvjeti za pristup ispitu još nisu ispunjeni.');
}

function guideHtml(){
  return `<section class="nh7-school-guide-v374" data-school-guide-v374><details open><summary>💚 ${E(L('راهنما و قوانین مدرسه','School guide and rules','Vodič i pravila škole'))}</summary><div class="nh7-school-guide-body-v374"><p>${E(L(
    'دانشجوی عزیز، خوشحالیم که این مسیر رشد روحانی را با ما آغاز کرده‌اید. این قوانین با محبت برای کمک به یادگیری عمیق شما تنظیم شده‌اند، نه برای ایجاد فشار.',
    'Dear student, we are glad you are beginning this journey of spiritual growth with us. These loving rules support deep learning; they are not intended to create pressure.',
    'Dragi učeniku, radujemo se što s nama započinjete ovaj put duhovnog rasta. Ova pravila s ljubavlju podržavaju dublje učenje i nisu namijenjena stvaranju pritiska.'
  ))}</p><ol><li>${E(L('درس‌ها را به ترتیب مطالعه کنید و صوت هر درس را تا پایان گوش دهید.','Study the lessons in order and listen to every lesson audio to completion.','Proučavajte lekcije redom i poslušajte svaki audiozapis do kraja.'))}</li><li>${E(L('پس از کامل‌شدن صوت، تکلیف همان درس باز می‌شود. پاسخ را با کلمات خودتان و بر اساس درس بنویسید.','After the audio is complete, that lesson assignment opens. Answer in your own words and based on the lesson.','Nakon dovršenog audiozapisa otvara se zadatak lekcije. Odgovorite vlastitim riječima i na temelju lekcije.'))}</li><li>${E(L('برای امتحان نهایی، صوت و تکلیف هر ۸ درس باید کامل باشد.','The audio and assignment for all 8 lessons must be complete before the final exam.','Audiozapis i zadatak svih 8 lekcija moraju biti dovršeni prije završnog ispita.'))}</li><li><strong>${E(L('نمره نهایی: ۷۰٪ امتحان + ۳۰٪ تکالیف؛ حد قبولی ۷۰٪.','Final grade: 70% exam + 30% assignments; passing score 70%.','Završna ocjena: 70% ispit + 30% zadaci; prag prolaza 70%.'))}</strong></li><li>${E(L('برای امتحان حداکثر سه فرصت دارید. پس از قبولی، تلاش دیگری لازم یا مجاز نیست.','You have a maximum of three exam attempts. After passing, no further attempt is needed or allowed.','Imate najviše tri pokušaja ispita. Nakon prolaza novi pokušaj nije potreban niti dopušten.'))}</li></ol><p class="nh7-school-love-v374">${E(L(
    'هدف فقط دریافت نمره نیست؛ هدف این است که کلام در زندگی شما ریشه بگیرد و به عمل تبدیل شود.',
    'The goal is not merely a score, but for the Word to take root in your life and become practice.',
    'Cilj nije samo ocjena, nego da se Riječ ukorijeni u vašem životu i postane praksa.'
  ))}</p></div></details></section>`;
}

function courseStatusHtml(gate){
  return `<div class="nh7-school-status-v374" data-school-status-v374><div><b>🎧 ${E(L('صوت‌های کامل','Completed audios','Dovršeni audiozapisi'))}</b><span>${E(N(gate?.audio_completed||0))} / ${E(N(gate?.total_lessons||0))}</span></div><div><b>📝 ${E(L('تکالیف کامل','Completed assignments','Dovršeni zadaci'))}</b><span>${E(N(gate?.assignments_completed||0))} / ${E(N(gate?.total_lessons||0))}</span></div><div><b>🎓 ${E(L('آمادگی امتحان','Exam readiness','Spremnost za ispit'))}</b><span>${gate?.ready_for_exam?'✅ '+E(L('آماده','Ready','Spremno')):'🔒 '+E(L('هنوز کامل نیست','Not complete yet','Još nije dovršeno'))}</span></div></div>`;
}

function inferLessonCode(){
  const player=$('[data-sermon-card^="school-"]');
  if(player)return String(player.dataset.sermonCard||'').replace(/^school-/,'');
  return lastLesson||sessionStorage.getItem('nh7_v374_last_lesson')||'';
}

function setAudioLock(element,locked){
  if(!element)return;
  if(locked){element.dataset.v374AudioLocked='1';element.disabled=true;element.setAttribute('aria-disabled','true')}
  else if(element.dataset.v374AudioLocked==='1'){delete element.dataset.v374AudioLocked;element.disabled=false;element.removeAttribute('aria-disabled')}
}

async function decorateLesson(){
  const section=$('.school-assignment');
  if(!section)return false;
  const code=inferLessonCode();
  if(!code)return true;
  const gate=await getGate(true,code);
  const row=(gate?.lessons||[])[0];
  const audioComplete=!!row?.audio_complete;
  let notice=section.querySelector('[data-school-lesson-gate-v374]');
  if(!notice){notice=document.createElement('div');notice.dataset.schoolLessonGateV374='1';notice.className='nh7-lesson-gate-v374';section.prepend(notice)}
  notice.classList.toggle('is-ready',audioComplete);
  notice.innerHTML=audioComplete
    ? `✅ ${E(L('فایل صوتی این درس کامل شنیده شده است. اکنون می‌توانید تکلیف را با دقت پاسخ دهید.','This lesson audio is complete. You may now answer the assignment carefully.','Audiozapis ove lekcije je dovršen. Sada možete pažljivo odgovoriti na zadatak.'))}`
    : `🔒 ${E(lockMessage('audio_completion_required'))}`;
  setAudioLock($('#schoolAssignmentAnswer'),!audioComplete);
  setAudioLock($('#saveSchoolAssignmentDraft'),!audioComplete);
  setAudioLock($('#submitSchoolAssignment'),!audioComplete);
  const complete=$('#completeSchoolLesson');
  setAudioLock(complete,!audioComplete);
  if(complete&&!audioComplete)complete.title=lockMessage('audio_completion_required');
  return true;
}

function lessonBadges(gate,group){
  for(const button of group.querySelectorAll('.list-btn[data-params]')){
    let params={};try{params=JSON.parse(button.dataset.params||'{}')}catch(_){}
    if(!params.lesson)continue;
    const row=(gate?.lessons||[]).find(item=>String(item.lesson_code)===String(params.lesson));
    if(!row)continue;
    const small=button.querySelector('small');if(!small)continue;
    small.querySelector('[data-v374-badges]')?.remove();
    const badge=document.createElement('span');badge.dataset.v374Badges='1';badge.className='nh7-v374-badges';badge.textContent=` · ${row.audio_complete?'🎧✅':'🎧🔒'} · ${row.assignment_complete?'📝✅':'📝🔒'}`;small.appendChild(badge);
  }
}

function lockedExamEntry(session){
  const gate=session?.gate||courseGate||{};
  const max=Number(session?.exam?.max_attempts||3);
  const left=Math.max(0,Number(session?.remaining_attempts??max));
  const passed=!!session?.passed_already;
  const reason=passed?'passed':left<=0?'max_attempts':session?.reason||(!gate?.all_audio_complete?'audio_completion_required':'assignments_required');
  const message=passed?L('شما قبلاً این دوره را با موفقیت گذرانده‌اید.','You have already passed this course.','Već ste uspješno položili ovaj tečaj.')
    :left<=0?L('هر سه فرصت امتحان استفاده شده است.','All three exam attempts have been used.','Sva tri pokušaja ispita su iskorištena.')
    :lockMessage(reason);
  const title=String(session?.exam?.[`title_${language()}`]||session?.exam?.title_en||L('امتحان نهایی مدرسه','School Final Exam','Završni ispit škole'));
  const wrapper=document.createElement('div');wrapper.dataset.schoolExamLockV374='1';wrapper.className='nh7-school-exam-lock-v374';wrapper.innerHTML=`<button class="primary-btn wide-btn" aria-disabled="true">📝 ${E(title)}<small>${E(L('فرصت باقی‌مانده','Attempts remaining','Preostali pokušaji'))}: ${E(N(left))} / ${E(N(max))}</small></button><p class="muted">${E(message)}</p>`;
  wrapper.querySelector('button').addEventListener('click',event=>{event.preventDefault();alert(message)});
  return wrapper;
}

async function decorateOverview(){
  const groups=$$('#view .school-course-group');
  if(!groups.length)return false;
  const card=groups[0].closest('.card')||$('#view');
  if(card&&!card.querySelector('[data-school-guide-v374]')){
    const list=card.querySelector('.list');
    if(list)list.insertAdjacentHTML('beforebegin',guideHtml());
    else card.insertAdjacentHTML('afterbegin',guideHtml());
  }
  const session=await rpc('nh7_school_exam_session_v373',{p_course_code:COURSE,p_lesson_code:null});
  const gate=session?.gate||await getGate(true);
  courseGate=gate;gateAt=Date.now();
  for(const group of groups){
    group.querySelector('[data-school-status-v374]')?.remove();
    group.insertAdjacentHTML('beforeend',courseStatusHtml(gate));
    lessonBadges(gate,group);
    const oldLock=group.querySelector('[data-school-exam-lock-v374]');
    const ready=!!session?.allowed;
    if(ready){oldLock?.remove();continue}
    group.querySelector('[data-exam344]')?.remove();
    oldLock?.remove();
    group.appendChild(lockedExamEntry(session));
  }
  return true;
}

async function scan(){
  try{
    if(await decorateLesson())return;
    await decorateOverview();
  }catch(error){console.warn('[NH7 School guide/gate v374]',error)}
}
function schedule(delay=80){clearTimeout(timer);timer=setTimeout(scan,delay)}
function invalidate(){courseGate=null;gateAt=0;gatePromise=null}

function installStyles(){
  if($('#nh7-school-v374-style'))return;
  const style=document.createElement('style');style.id='nh7-school-v374-style';style.textContent=`
.nh7-school-guide-v374{margin:14px 0;border:1px solid #bde4d9;background:linear-gradient(180deg,#f0fff9,#fff);border-radius:18px;overflow:hidden}.nh7-school-guide-v374 summary{cursor:pointer;padding:14px 16px;font-weight:900;color:#075f49}.nh7-school-guide-body-v374{padding:0 16px 15px;line-height:1.85}.nh7-school-guide-body-v374 li{margin:9px 0}.nh7-school-love-v374{background:#eef8ff;border:1px solid #c9e4f4;border-radius:13px;padding:11px}.nh7-school-status-v374{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.nh7-school-status-v374>div{border:1px solid #d9e8e5;border-radius:13px;padding:10px;background:#fbfefd}.nh7-school-status-v374 b,.nh7-school-status-v374 span{display:block}.nh7-school-status-v374 span{margin-top:4px}.nh7-lesson-gate-v374{border:1px solid #f0cf8d;background:#fff8e8;color:#6b4c08;border-radius:13px;padding:11px;margin-bottom:10px;line-height:1.7}.nh7-lesson-gate-v374.is-ready{border-color:#a7dfbd;background:#effcf4;color:#08733d}.nh7-school-exam-lock-v374{text-align:center;margin-top:14px}.nh7-school-exam-lock-v374 button{display:flex!important;flex-direction:column;align-items:center;gap:4px;opacity:.58;filter:grayscale(.25);cursor:not-allowed}.nh7-v374-badges{white-space:nowrap}@media(max-width:650px){.nh7-school-status-v374{grid-template-columns:1fr}.nh7-school-guide-body-v374{padding-inline:12px}}
`;
  document.head.appendChild(style);
}

installStyles();
document.addEventListener('click',event=>{
  const lesson=event.target.closest?.('.list-btn[data-params]');
  if(lesson){try{const params=JSON.parse(lesson.dataset.params||'{}');if(params.lesson){lastLesson=String(params.lesson);sessionStorage.setItem('nh7_v374_last_lesson',lastLesson)}}catch(_){}}
  const locked=event.target.closest?.('[data-v374-audio-locked="1"]');
  if(locked){event.preventDefault();event.stopImmediatePropagation();alert(lockMessage('audio_completion_required'))}
},true);
document.addEventListener('ended',()=>{invalidate();schedule(900)},true);
new MutationObserver(()=>schedule()).observe(document.documentElement,{childList:true,subtree:true});
$('#langSelect')?.addEventListener('change',()=>{invalidate();schedule(40)});
window.addEventListener('storage',event=>{if(event.key===SESSION){invalidate();schedule(100)}});
setInterval(()=>{if($('#view .school-course-group')||$('.school-assignment')){invalidate();schedule(40)}},5000);
schedule(500);
window.NH7_SCHOOL_GUIDE_GATE_VERSION=VERSION;
})();
