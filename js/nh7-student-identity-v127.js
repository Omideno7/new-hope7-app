/* New Hope 7 — Student Identity v1.27
 * Additive School identity strip: permanent Student Code + opt-in profile-photo sync.
 * No registration/progress/exam writes. Requires Issue #127 backend RPCs when enabled.
 */
(()=>{'use strict';
if(window.__NH7_STUDENT_IDENTITY_V127__)return;window.__NH7_STUDENT_IDENTITY_V127__=true;

const SB='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION='nh7_user_session_v170';
const CACHE='nh7_student_identity_v127:';
const LOCAL_PHOTO='nh7_profile_photo_v561';
const MAX_CACHE_MS=12*60*60*1000;
let queued=false,busy=false,lastRoute='',objectUrl='';

const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function session(){try{return JSON.parse(localStorage.getItem(SESSION)||'null')}catch(_){return null}}
function uid(){return String(session()?.user?.id||'').trim()}
function token(){return String(session()?.access_token||'').trim()}
function activeSchool(){return !!document.querySelector('.nav-item.active[data-route="school"]')}
function cacheKey(){const id=uid();return id?CACHE+id:''}
function cached(){const k=cacheKey();if(!k)return null;try{const x=JSON.parse(localStorage.getItem(k)||'null');if(!x||Date.now()-Number(x.at||0)>MAX_CACHE_MS)return null;return x.student||null}catch(_){return null}}
function writeCache(student){const k=cacheKey();if(!k)return;try{localStorage.setItem(k,JSON.stringify({at:Date.now(),student:student||null}))}catch(_){}}
function clearCache(){const k=cacheKey();if(k)try{localStorage.removeItem(k)}catch(_){}}

async function rpc(name,body={}){
 const t=token();if(!t)throw new Error('login_required');
 const r=await fetch(`${SB}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${t}`,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
 const text=await r.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={message:text}};
 if(!r.ok){const e=new Error(String(data?.message||data?.error||r.statusText));e.status=r.status;throw e}
 return Array.isArray(data)?(data[0]??{}):data;
}
async function loadIdentity(force=false){
 if(!force){const c=cached();if(c)return c}
 for(const name of ['nh7_my_student_identity_v128','nh7_my_student_identity_v127']){
  try{const x=await rpc(name,{}),s=x?.student||null;writeCache(s);return s}catch(e){if(e?.status===404||/could not find|does not exist|schema cache/i.test(String(e?.message||'')))continue;throw e}
 }
 return null;
}

function ensureStyle(){if(document.getElementById('nh7StudentIdentity127Style'))return;const s=document.createElement('style');s.id='nh7StudentIdentity127Style';s.textContent=`
 .nh7-student-id127{display:flex;align-items:center;gap:12px;margin:0 0 14px;padding:12px 13px;border:1px solid color-mix(in srgb,var(--brand,#1858a4) 18%,transparent);border-radius:18px;background:color-mix(in srgb,var(--card,#fff) 96%,var(--brand,#1858a4));box-shadow:0 8px 22px rgba(15,23,42,.06)}
 .nh7-student-id127-photo{width:52px;height:52px;flex:0 0 52px;border-radius:50%;display:grid;place-items:center;overflow:hidden;background:color-mix(in srgb,var(--brand,#1858a4) 10%,var(--card,#fff));border:2px solid color-mix(in srgb,var(--brand,#1858a4) 22%,transparent);font-weight:900}.nh7-student-id127-photo img{width:100%;height:100%;object-fit:cover;display:block}
 .nh7-student-id127-copy{min-width:0;flex:1;display:grid;gap:3px}.nh7-student-id127-copy small{font-size:.7rem;opacity:.68}.nh7-student-id127-copy strong{font-size:1.05rem;letter-spacing:.04em;direction:ltr;text-align:start}.nh7-student-id127-name{font-size:.72rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .nh7-student-id127-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.nh7-student-id127-actions button{min-height:36px;border-radius:10px;padding:7px 10px;font-size:.7rem;cursor:pointer}.nh7-student-id127-status{display:block;margin-top:6px;font-size:.68rem;line-height:1.45;opacity:.78}
 @media(max-width:520px){.nh7-student-id127{align-items:flex-start;flex-wrap:wrap}.nh7-student-id127-copy{min-width:calc(100% - 70px)}.nh7-student-id127-actions{width:100%;justify-content:flex-start}}
 `;document.head.appendChild(s)}
function initials(name){const p=String(name||'').trim().split(/\s+/).filter(Boolean);return p.length?(p[0][0]+(p.length>1?p.at(-1)[0]:'')).toUpperCase():'🎓'}
function localPhoto(){try{const v=localStorage.getItem(LOCAL_PHOTO)||'';return /^data:image\//.test(v)?v:''}catch(_){return''}}
function identityAnchor(){const view=document.getElementById('view');if(!view)return null;return view.querySelector('.nh7-school-guide-v351,.school-course-group,.card')}

async function privatePhotoUrl(path){
 if(!path||!token())return'';
 try{
  const r=await fetch(`${SB}/storage/v1/object/nh7-document-assets/${String(path).split('/').map(encodeURIComponent).join('/')}`,{headers:{apikey:KEY,Authorization:`Bearer ${token()}`},cache:'no-store'});
  if(!r.ok)return'';const b=await r.blob();if(!String(b.type||'').startsWith('image/'))return'';
  if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(b);return objectUrl;
 }catch(_){return''}
}
function render(student,photoSrc=''){
 ensureStyle();if(!activeSchool()||!student?.student_code)return false;
 const anchor=identityAnchor();if(!anchor)return false;
 let el=document.getElementById('nh7StudentIdentity127');if(!el){el=document.createElement('section');el.id='nh7StudentIdentity127';el.className='nh7-student-id127';anchor.insertAdjacentElement('beforebegin',el)}
 const lp=localPhoto(),canSync=!!lp&&!!uid();
 el.innerHTML=`<span class="nh7-student-id127-photo">${photoSrc?`<img src="${E(photoSrc)}" alt="">`:E(initials(student.display_name))}</span><span class="nh7-student-id127-copy"><small>${E(L('کد دانشجویی شما','Your Student ID','Vaš studentski ID'))}</small><strong>${E(student.student_code)}</strong>${student.display_name?`<span class="nh7-student-id127-name">${E(student.display_name)}</span>`:''}<span class="nh7-student-id127-status" data-nh7-student-status></span></span><span class="nh7-student-id127-actions"><button type="button" class="secondary-btn" data-nh7-student-copy>📋 ${E(L('کپی','Copy','Kopiraj'))}</button>${canSync?`<button type="button" class="secondary-btn" data-nh7-student-photo>${E(student.has_photo?L('به‌روزرسانی عکس','Update photo','Ažuriraj fotografiju'):L('استفاده از عکس پروفایل','Use profile photo','Koristi profilnu fotografiju'))}</button>`:''}</span>`;
 el.querySelector('[data-nh7-student-copy]')?.addEventListener('click',async()=>{const status=el.querySelector('[data-nh7-student-status]');try{await navigator.clipboard.writeText(student.student_code);if(status)status.textContent=L('کد دانشجویی کپی شد.','Student ID copied.','Studentski ID je kopiran.')}catch(_){if(status)status.textContent=student.student_code}});
 el.querySelector('[data-nh7-student-photo]')?.addEventListener('click',()=>syncLocalPhoto(student,el));
 return true;
}

function dataUrlBlob(data){const [head,body]=String(data||'').split(',');const mime=(head.match(/^data:([^;]+)/)||[])[1]||'image/jpeg';const bytes=atob(body||''),out=new Uint8Array(bytes.length);for(let i=0;i<bytes.length;i++)out[i]=bytes.charCodeAt(i);return new Blob([out],{type:mime})}
function extFor(mime){return mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg'}
async function syncLocalPhoto(student,el){
 if(busy)return;const photo=localPhoto(),id=uid(),t=token();if(!photo||!id||!t)return;busy=true;
 const status=el.querySelector('[data-nh7-student-status]');if(status)status.textContent=L('در حال ذخیره امن عکس…','Securely saving photo…','Sigurno spremanje fotografije…');
 try{
  const blob=dataUrlBlob(photo),path=`student-photos/${id}/profile.${extFor(blob.type)}`;
  if(blob.size>5*1024*1024)throw new Error('photo_too_large');
  const upload=await fetch(`${SB}/storage/v1/object/nh7-document-assets/${path.split('/').map(encodeURIComponent).join('/')}`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${t}`,'Content-Type':blob.type||'image/jpeg','x-upsert':'true'},body:blob});
  if(!upload.ok)throw new Error((await upload.text().catch(()=>''))||'photo_upload_failed');
  await rpc('nh7_set_my_student_photo_v127',{p_photo_path:path});
  clearCache();const next=await loadIdentity(true);if(status)status.textContent=L('عکس دانشجویی با موفقیت ذخیره شد.','Student photo saved securely.','Studentska fotografija je sigurno spremljena.');
  const src=await privatePhotoUrl(next?.photo_path||path);render(next||{...student,has_photo:true,photo_path:path},src||photo);
 }catch(e){if(status)status.textContent=L('ذخیره عکس انجام نشد. بعداً دوباره تلاش کنید.','Photo was not saved. Please try again later.','Fotografija nije spremljena. Pokušajte ponovno kasnije.');console.warn('[NH7 Student Identity v127]',e)}finally{busy=false}
}

async function sync(force=false){
 if(!activeSchool()){document.getElementById('nh7StudentIdentity127')?.remove();return}
 try{const student=await loadIdentity(force);if(!student?.student_code)return;let photo='';if(student.photo_path)photo=await privatePhotoUrl(student.photo_path);render(student,photo)}catch(e){if(!/login_required/i.test(String(e?.message||'')))console.warn('[NH7 Student Identity v127]',e)}
}
function schedule(force=false){if(queued)return;queued=true;setTimeout(()=>{queued=false;const route=activeSchool()?'school':'other',changed=route!==lastRoute;lastRoute=route;sync(force||changed)},80)}

new MutationObserver(()=>schedule(false)).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-route']});
window.addEventListener('storage',e=>{if([LOCAL_PHOTO,SESSION,'nh7_lang'].includes(e.key))schedule(true)});
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-route="school"]'))setTimeout(()=>schedule(true),120)});
setTimeout(()=>schedule(true),300);
})();
