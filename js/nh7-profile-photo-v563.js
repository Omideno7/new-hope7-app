/* New Hope 7 v5.6.3 — stable profile photo picker.
 * Replaces the v5.6.1 remount loop with idempotent rendering and opens the native
 * mobile photo picker from a direct user gesture. Existing photo storage key is preserved.
 */
(()=>{'use strict';
if(window.__NH7_PROFILE_PHOTO_V563__)return;window.__NH7_PROFILE_PHOTO_V563__=true;

const VERSION='5.6.3';
const PHOTO_KEY='nh7_profile_photo_v561';
let queued=false,busy=false;
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function profile(){
  let cached={},school={},meeting={};
  try{cached=JSON.parse(localStorage.getItem('nh7_user_profile')||'{}')||{}}catch(_){}
  try{school=JSON.parse(localStorage.getItem('nh7_school_access')||'{}')||{}}catch(_){}
  try{meeting=JSON.parse(localStorage.getItem('nh7_meeting_access')||'{}')||{}}catch(_){}
  const p=Object.assign({},meeting,school,cached);
  const registration=String((p.firstName||'')+' '+(p.lastName||'')).trim();
  return {name:String(cached.name||registration||p.name||'').trim(),email:String(cached.email||p.email||localStorage.getItem('nh7_manual_email')||'').trim()};
}
function initials(name){
  const parts=String(name||'').trim().split(/\s+/).filter(Boolean);if(!parts.length)return'👤';
  return (parts[0][0]+(parts.length>1?parts[parts.length-1][0]:'')).toUpperCase();
}
function readPhoto(){try{const v=localStorage.getItem(PHOTO_KEY)||'';return /^data:image\//.test(v)?v:''}catch(_){return''}}
function photoSig(photo){return photo?`${photo.length}:${photo.slice(-28)}`:'none'}

function ensureStyle(){
  if(document.getElementById('nh7ProfilePhoto563Style'))return;
  const style=document.createElement('style');style.id='nh7ProfilePhoto563Style';style.textContent=`
    .nh7-profile-avatar563{width:58px;height:58px;flex:0 0 58px;border-radius:50%;display:grid;place-items:center;overflow:hidden;border:2px solid color-mix(in srgb,var(--brand,#1858a4) 20%,transparent);background:color-mix(in srgb,var(--brand,#1858a4) 9%,var(--card,#fff));font-weight:900;font-size:1rem}
    .nh7-profile-avatar563 img{width:100%;height:100%;object-fit:cover;display:block}
    .nh7-home-profile563{display:flex;align-items:center;gap:10px;margin:0 0 13px;padding-bottom:11px;border-bottom:1px solid color-mix(in srgb,var(--brand,#1858a4) 12%,transparent)}
    .nh7-home-profile563 .nh7-profile-avatar563{width:46px;height:46px;flex-basis:46px}.nh7-home-profile563-copy{min-width:0;display:grid;gap:2px}.nh7-home-profile563-copy strong{font-size:.92rem}.nh7-home-profile563-copy small{font-size:.68rem;opacity:.68}
    .nh7-account-profile563{display:flex;align-items:center;gap:12px;margin:0 0 15px;padding:12px;border:1px solid color-mix(in srgb,var(--brand,#1858a4) 15%,transparent);border-radius:17px;background:color-mix(in srgb,var(--card,#fff) 96%,var(--brand,#1858a4))}
    .nh7-account-profile563-copy{min-width:0;flex:1}.nh7-account-profile563-copy strong,.nh7-account-profile563-copy small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nh7-account-profile563-copy small{margin-top:3px;font-size:.7rem;opacity:.68}
    .nh7-account-profile563-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.nh7-account-profile563-actions button{min-height:36px;padding:7px 11px;border-radius:10px;font-size:.7rem;cursor:pointer}
    .nh7-profile-file563{position:fixed!important;left:-10000px!important;top:-10000px!important;width:1px!important;height:1px!important;opacity:.01!important;overflow:hidden!important}
    .nh7-profile-status563{margin-top:7px!important;white-space:normal!important;line-height:1.4!important}
    @media(max-width:520px){.nh7-account-profile563{align-items:flex-start;flex-wrap:wrap}.nh7-account-profile563-copy{min-width:calc(100% - 78px)}}
  `;document.head.appendChild(style);
}
function avatarHtml(photo,name){return `<span class="nh7-profile-avatar563">${photo?`<img src="${esc(photo)}" alt="">`:esc(initials(name))}</span>`}

function homeMarkup(p,photo){return `${avatarHtml(photo,p.name)}<span class="nh7-home-profile563-copy"><strong>${esc(p.name||L('پروفایل من','My profile','Moj profil'))}</strong><small>${esc(L('خوش آمدید','Welcome','Dobro došli'))}</small></span>`}
function syncHome(){
  const marker=document.getElementById('quickNotify'),view=document.getElementById('view');if(!marker||!view)return false;
  const card=marker.closest('.card')||view.querySelector('.card');if(!card)return false;
  const p=profile(),photo=readPhoto();if(!p.name&&!photo)return false;
  const sig=`${p.name}|${photoSig(photo)}`;
  let row=document.getElementById('nh7HomeProfile563');
  if(!row){row=document.createElement('div');row.id='nh7HomeProfile563';row.className='nh7-home-profile563';card.prepend(row)}
  if(row.dataset.sig!==sig){row.dataset.sig=sig;row.innerHTML=homeMarkup(p,photo)}
  return true;
}

function compressPhoto(file){
  return new Promise((resolve,reject)=>{
    if(!file||!String(file.type||'').startsWith('image/')){reject(new Error('not_image'));return}
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{try{
      const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,size=Math.min(iw,ih);if(!size)throw new Error('invalid_image');
      const canvas=document.createElement('canvas');canvas.width=384;canvas.height=384;const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('canvas');
      const sx=Math.max(0,(iw-size)/2),sy=Math.max(0,(ih-size)/2);
      ctx.drawImage(img,sx,sy,size,size,0,0,384,384);
      let data=canvas.toDataURL('image/jpeg',.8);
      if(data.length>650000)data=canvas.toDataURL('image/jpeg',.66);
      URL.revokeObjectURL(url);resolve(data);
    }catch(error){URL.revokeObjectURL(url);reject(error)}};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('invalid_image'))};
    img.src=url;
  });
}
function setStatus(box,text){const el=box?.querySelector('[data-nh7-profile-status]');if(el)el.textContent=text||''}
function renderAccountBox(box,p,photo){
  box.innerHTML=`${avatarHtml(photo,p.name)}<div class="nh7-account-profile563-copy"><strong>${esc(p.name||L('پروفایل من','My profile','Moj profil'))}</strong>${p.email?`<small>${esc(p.email)}</small>`:''}<div class="nh7-account-profile563-actions"><button type="button" class="secondary-btn" data-nh7-profile-pick>${esc(photo?L('تغییر عکس','Change photo','Promijeni fotografiju'):L('افزودن عکس','Add photo','Dodaj fotografiju'))}</button>${photo?`<button type="button" class="secondary-btn" data-nh7-profile-remove>${esc(L('حذف عکس','Remove photo','Ukloni fotografiju'))}</button>`:''}</div><small class="nh7-profile-status563" data-nh7-profile-status>${esc(L('عکس روی همین دستگاه ذخیره می‌شود.','The photo is stored on this device.','Fotografija se sprema na ovom uređaju.'))}</small></div><input class="nh7-profile-file563" data-nh7-profile-file type="file" accept="image/*">`;
  const input=box.querySelector('[data-nh7-profile-file]'),pick=box.querySelector('[data-nh7-profile-pick]'),remove=box.querySelector('[data-nh7-profile-remove]');
  pick?.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    if(busy||!input)return;
    try{input.value='';input.click()}catch(error){console.warn('Profile picker',error);setStatus(box,L('باز کردن انتخاب عکس انجام نشد.','Could not open the photo picker.','Nije moguće otvoriti odabir fotografije.'))}
  });
  input?.addEventListener('change',async event=>{
    const file=event.target.files?.[0];if(!file||busy)return;
    busy=true;pick&&pick.setAttribute('disabled','');setStatus(box,L('در حال آماده‌سازی عکس…','Preparing photo…','Priprema fotografije…'));
    try{
      const data=await compressPhoto(file);localStorage.setItem(PHOTO_KEY,data);busy=false;schedule(true);
    }catch(error){
      busy=false;console.warn('Profile photo',error);pick&&pick.removeAttribute('disabled');
      setStatus(box,L('ذخیره عکس انجام نشد؛ لطفاً یک عکس دیگر انتخاب کنید.','The photo could not be saved. Please choose another image.','Fotografija nije spremljena. Odaberite drugu sliku.'));
    }
  });
  remove?.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();if(busy)return;try{localStorage.removeItem(PHOTO_KEY)}catch(_){}schedule(true)});
}
function syncAccount(force=false){
  const logout=document.getElementById('logoutAccountBtn');if(!logout)return false;
  const card=logout.closest('.card');if(!card)return false;
  const p=profile(),photo=readPhoto(),sig=`${p.name}|${p.email}|${photoSig(photo)}|${lang()}`;
  let box=document.getElementById('nh7AccountProfile563');
  if(!box){box=document.createElement('section');box.id='nh7AccountProfile563';box.className='nh7-account-profile563';const anchor=card.querySelector('h3')||card.firstChild;if(anchor)anchor.insertAdjacentElement('afterend',box);else card.prepend(box)}
  if(force||box.dataset.sig!==sig){box.dataset.sig=sig;renderAccountBox(box,p,photo)}
  return true;
}
function syncAll(force=false){ensureStyle();syncHome();syncAccount(force)}
function schedule(force=false){
  if(force){queued=false;requestAnimationFrame(()=>syncAll(true));return}
  if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;syncAll(false)})
}
function start(){
  ensureStyle();syncAll(false);
  const view=document.getElementById('view');if(view)new MutationObserver(()=>schedule(false)).observe(view,{subtree:true,childList:true});
  document.getElementById('langSelect')?.addEventListener('change',()=>setTimeout(()=>syncAll(true),0));
  window.addEventListener('storage',event=>{if(event.key===PHOTO_KEY||event.key==='nh7_user_profile')schedule(true)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.NH7ProfilePhotoV563={VERSION,PHOTO_KEY,mount:()=>syncAll(true),read:readPhoto};
})();
