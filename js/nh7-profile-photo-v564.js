/* New Hope 7 v5.6.4 — profile photo crop/zoom + top-bar avatar.
 * UI-only, device-local photo editor. Preserves the existing local photo key and
 * does not touch auth, Supabase, testimony storage, or user records.
 */
(()=>{'use strict';
if(window.__NH7_PROFILE_PHOTO_V564__)return;window.__NH7_PROFILE_PHOTO_V564__=true;

const VERSION='5.6.4';
const PHOTO_KEY='nh7_profile_photo_v561';
let queued=false,busy=false,editor=null;
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
function initials(name){const parts=String(name||'').trim().split(/\s+/).filter(Boolean);if(!parts.length)return'👤';return (parts[0][0]+(parts.length>1?parts[parts.length-1][0]:'')).toUpperCase()}
function readPhoto(){try{const v=localStorage.getItem(PHOTO_KEY)||'';return /^data:image\//.test(v)?v:''}catch(_){return''}}
function photoSig(photo){return photo?`${photo.length}:${photo.slice(-28)}`:'none'}

function ensureStyle(){
  if(document.getElementById('nh7ProfilePhoto564Style'))return;
  const style=document.createElement('style');style.id='nh7ProfilePhoto564Style';style.textContent=`
    .nh7-profile-avatar564{width:58px;height:58px;flex:0 0 58px;border-radius:50%;display:grid;place-items:center;overflow:hidden;border:2px solid color-mix(in srgb,var(--brand,#1858a4) 20%,transparent);background:color-mix(in srgb,var(--brand,#1858a4) 9%,var(--card,#fff));font-weight:900;font-size:1rem}
    .nh7-profile-avatar564 img{width:100%;height:100%;object-fit:cover;display:block}
    .nh7-home-profile564{display:flex;align-items:center;gap:10px;margin:0 0 13px;padding-bottom:11px;border-bottom:1px solid color-mix(in srgb,var(--brand,#1858a4) 12%,transparent)}
    .nh7-home-profile564 .nh7-profile-avatar564{width:46px;height:46px;flex-basis:46px}.nh7-home-profile564-copy{min-width:0;display:grid;gap:2px}.nh7-home-profile564-copy strong{font-size:.92rem}.nh7-home-profile564-copy small{font-size:.68rem;opacity:.68}
    .nh7-account-profile564{display:flex;align-items:center;gap:12px;margin:0 0 15px;padding:12px;border:1px solid color-mix(in srgb,var(--brand,#1858a4) 15%,transparent);border-radius:17px;background:color-mix(in srgb,var(--card,#fff) 96%,var(--brand,#1858a4))}
    .nh7-account-profile564-copy{min-width:0;flex:1}.nh7-account-profile564-copy strong,.nh7-account-profile564-copy small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nh7-account-profile564-copy small{margin-top:3px;font-size:.7rem;opacity:.68}
    .nh7-account-profile564-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.nh7-account-profile564-actions button{min-height:36px;padding:7px 11px;border-radius:10px;font-size:.7rem;cursor:pointer}
    .nh7-profile-file564{position:fixed!important;left:-10000px!important;top:-10000px!important;width:1px!important;height:1px!important;opacity:.01!important;overflow:hidden!important}.nh7-profile-status564{margin-top:7px!important;white-space:normal!important;line-height:1.4!important}
    #nh7TopProfile564{width:34px;height:34px;flex:0 0 34px;border-radius:50%;overflow:hidden;border:1.5px solid color-mix(in srgb,var(--brand,#1858a4) 28%,transparent);background:var(--card,#fff);display:none;place-items:center;margin-inline-start:auto;margin-inline-end:4px;padding:0;box-shadow:0 1px 5px rgba(0,0,0,.08)}
    #nh7TopProfile564.is-visible{display:grid}#nh7TopProfile564 img{width:100%;height:100%;object-fit:cover;display:block}
    .nh7-photo-editor564{position:fixed;inset:0;z-index:2147482500;background:rgba(10,18,32,.72);display:flex;align-items:flex-end;justify-content:center;padding:18px;backdrop-filter:blur(5px)}
    .nh7-photo-editor564[hidden]{display:none}.nh7-photo-sheet564{width:min(430px,100%);max-height:min(92vh,760px);overflow:auto;border-radius:24px 24px 18px 18px;background:var(--card,#fff);color:var(--text,#111827);padding:18px;box-shadow:0 22px 70px rgba(0,0,0,.35)}
    .nh7-photo-sheet564 h3{margin:0 0 4px;font-size:1.05rem}.nh7-photo-help564{margin:0 0 14px;font-size:.74rem;opacity:.72;line-height:1.55}.nh7-photo-canvas-wrap564{width:min(76vw,320px);aspect-ratio:1;margin:0 auto 15px;border-radius:50%;overflow:hidden;position:relative;background:#111;box-shadow:0 0 0 4px color-mix(in srgb,var(--brand,#1858a4) 22%,transparent)}
    .nh7-photo-canvas564{width:100%;height:100%;display:block;touch-action:none;cursor:grab}.nh7-photo-canvas564:active{cursor:grabbing}.nh7-photo-guide564{position:absolute;inset:0;border-radius:50%;pointer-events:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.7)}
    .nh7-photo-zoom564{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;margin:10px 0 14px}.nh7-photo-zoom564 input{width:100%}.nh7-photo-editor-actions564{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}.nh7-photo-editor-actions564 button{min-height:40px;border-radius:11px;padding:8px 14px}
    @media(max-width:520px){.nh7-account-profile564{align-items:flex-start;flex-wrap:wrap}.nh7-account-profile564-copy{min-width:calc(100% - 78px)}.topbar .brand{min-width:0;flex:1}.topbar .brand strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}}
  `;document.head.appendChild(style);
}
function avatarHtml(photo,name){return `<span class="nh7-profile-avatar564">${photo?`<img src="${esc(photo)}" alt="">`:esc(initials(name))}</span>`}
function homeMarkup(p,photo){return `${avatarHtml(photo,p.name)}<span class="nh7-home-profile564-copy"><strong>${esc(p.name||L('پروفایل من','My profile','Moj profil'))}</strong><small>${esc(L('خوش آمدید','Welcome','Dobro došli'))}</small></span>`}

function syncHeader(){
  const top=document.querySelector('.topbar'),inbox=document.getElementById('inboxBtn');if(!top||!inbox)return false;
  let slot=document.getElementById('nh7TopProfile564');if(!slot){slot=document.createElement('span');slot.id='nh7TopProfile564';slot.setAttribute('aria-label',L('عکس پروفایل','Profile photo','Profilna fotografija'));inbox.insertAdjacentElement('beforebegin',slot)}
  slot.setAttribute('aria-label',L('عکس پروفایل','Profile photo','Profilna fotografija'));
  const photo=readPhoto(),sig=photoSig(photo);if(slot.dataset.sig!==sig){slot.dataset.sig=sig;slot.innerHTML=photo?`<img src="${esc(photo)}" alt="">`:''}
  slot.classList.toggle('is-visible',!!photo);return true;
}
function syncHome(){
  const marker=document.getElementById('quickNotify'),view=document.getElementById('view');if(!marker||!view)return false;
  const card=marker.closest('.card')||view.querySelector('.card');if(!card)return false;
  const p=profile(),photo=readPhoto();if(!p.name&&!photo)return false;const sig=`${p.name}|${photoSig(photo)}|${lang()}`;
  let row=document.getElementById('nh7HomeProfile564');if(!row){row=document.createElement('div');row.id='nh7HomeProfile564';row.className='nh7-home-profile564';card.prepend(row)}
  if(row.dataset.sig!==sig){row.dataset.sig=sig;row.innerHTML=homeMarkup(p,photo)}return true;
}

function refreshEditorCopy(){
 const modal=document.getElementById('nh7PhotoEditor564');if(!modal)return;
 modal.lang=lang();modal.dir=lang()==='fa'?'rtl':'ltr';
 const labels={
  '[data-nh7-crop-title]':L('تنظیم عکس پروفایل','Adjust profile photo','Podesi profilnu fotografiju'),
  '.nh7-photo-help564':L('عکس را با انگشت جابه‌جا کنید و با نوار زوم، صورت را وسط کادر قرار دهید.','Drag the photo and use zoom to center your face in the frame.','Pomaknite fotografiju i zumirajte kako biste lice postavili u sredinu.'),
  '[data-nh7-crop-center]':L('وسط‌چین','Center','Centriraj'), '[data-nh7-crop-cancel]':L('لغو','Cancel','Odustani'),
  '[data-nh7-crop-save]':L('ذخیره عکس','Save photo','Spremi fotografiju')
 };
 for(const [selector,value] of Object.entries(labels)){const el=modal.querySelector(selector);if(el&&el.textContent!==value)el.textContent=value}
 modal.querySelector('[data-nh7-crop-zoom]')?.setAttribute('aria-label',L('بزرگ‌نمایی','Zoom','Zumiranje'));
}
function editorShell(){
  let modal=document.getElementById('nh7PhotoEditor564');if(modal){refreshEditorCopy();return modal;}
  modal=document.createElement('div');modal.id='nh7PhotoEditor564';modal.className='nh7-photo-editor564';modal.hidden=true;modal.innerHTML=`<section class="nh7-photo-sheet564" role="dialog" aria-modal="true"><h3 data-nh7-crop-title>${esc(L('تنظیم عکس پروفایل','Adjust profile photo','Podesi profilnu fotografiju'))}</h3><p class="nh7-photo-help564">${esc(L('عکس را با انگشت جابه‌جا کنید و با نوار زوم، صورت را وسط کادر قرار دهید.','Drag the photo and use zoom to center your face in the frame.','Pomaknite fotografiju i zumirajte kako biste lice postavili u sredinu.'))}</p><div class="nh7-photo-canvas-wrap564"><canvas class="nh7-photo-canvas564" width="320" height="320" data-nh7-crop-canvas></canvas><span class="nh7-photo-guide564"></span></div><label class="nh7-photo-zoom564"><span>−</span><input data-nh7-crop-zoom type="range" min="1" max="3" step="0.01" value="1" aria-label="${esc(L('بزرگ‌نمایی','Zoom','Zumiranje'))}"><span>＋</span></label><div class="nh7-photo-editor-actions564"><button type="button" class="secondary-btn" data-nh7-crop-center>${esc(L('وسط‌چین','Center','Centriraj'))}</button><button type="button" class="secondary-btn" data-nh7-crop-cancel>${esc(L('لغو','Cancel','Odustani'))}</button><button type="button" class="primary-btn" data-nh7-crop-save>${esc(L('ذخیره عکس','Save photo','Spremi fotografiju'))}</button></div></section>`;
  document.body.appendChild(modal);refreshEditorCopy();
  modal.addEventListener('click',e=>{if(e.target===modal)closeEditor()});
  modal.querySelector('[data-nh7-crop-cancel]')?.addEventListener('click',closeEditor);
  modal.querySelector('[data-nh7-crop-center]')?.addEventListener('click',()=>{if(!editor)return;editor.offsetX=0;editor.offsetY=0;drawEditor()});
  modal.querySelector('[data-nh7-crop-zoom]')?.addEventListener('input',e=>{if(!editor)return;editor.zoom=Number(e.target.value)||1;clampEditor();drawEditor()});
  modal.querySelector('[data-nh7-crop-save]')?.addEventListener('click',saveEditor);
  const canvas=modal.querySelector('[data-nh7-crop-canvas]');let drag=null;
  canvas?.addEventListener('pointerdown',e=>{if(!editor)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,ox:editor.offsetX,oy:editor.offsetY};try{canvas.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault()});
  canvas?.addEventListener('pointermove',e=>{if(!editor||!drag||drag.id!==e.pointerId)return;editor.offsetX=drag.ox+(e.clientX-drag.x);editor.offsetY=drag.oy+(e.clientY-drag.y);clampEditor();drawEditor();e.preventDefault()});
  const end=e=>{if(drag&&(!e||e.pointerId===drag.id))drag=null};canvas?.addEventListener('pointerup',end);canvas?.addEventListener('pointercancel',end);
  return modal;
}
function clampEditor(){
  if(!editor)return;const c=editor.canvas,iw=editor.img.naturalWidth||editor.img.width,ih=editor.img.naturalHeight||editor.img.height,base=Math.max(c.width/iw,c.height/ih),scale=base*editor.zoom,dw=iw*scale,dh=ih*scale,maxX=Math.max(0,(dw-c.width)/2),maxY=Math.max(0,(dh-c.height)/2);editor.offsetX=Math.max(-maxX,Math.min(maxX,editor.offsetX));editor.offsetY=Math.max(-maxY,Math.min(maxY,editor.offsetY));
}
function drawEditor(){
  if(!editor)return;const c=editor.canvas,ctx=c.getContext('2d'),img=editor.img,iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,base=Math.max(c.width/iw,c.height/ih),scale=base*editor.zoom,dw=iw*scale,dh=ih*scale;ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#111';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,(c.width-dw)/2+editor.offsetX,(c.height-dh)/2+editor.offsetY,dw,dh);
}
function closeEditor(){const modal=document.getElementById('nh7PhotoEditor564');if(modal)modal.hidden=true;if(editor?.url)URL.revokeObjectURL(editor.url);editor=null;busy=false}
function openEditor(file){
  if(!file||!String(file.type||'').startsWith('image/'))return;busy=true;const modal=editorShell(),canvas=modal.querySelector('[data-nh7-crop-canvas]'),zoom=modal.querySelector('[data-nh7-crop-zoom]'),url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{editor={file,url,img,canvas,zoom:1,offsetX:0,offsetY:0};if(zoom)zoom.value='1';modal.hidden=false;drawEditor()};
  img.onerror=()=>{URL.revokeObjectURL(url);busy=false;alert(L('این عکس باز نشد. لطفاً عکس دیگری انتخاب کنید.','This image could not be opened. Please choose another one.','Fotografija se nije mogla otvoriti. Odaberite drugu.'))};img.src=url;
}
function saveEditor(){
  if(!editor)return;const out=document.createElement('canvas');out.width=384;out.height=384;const ctx=out.getContext('2d',{alpha:false});if(!ctx)return;const img=editor.img,iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,base=Math.max(out.width/iw,out.height/ih),scale=base*editor.zoom,dw=iw*scale,dh=ih*scale,ratio=out.width/editor.canvas.width;ctx.fillStyle='#111';ctx.fillRect(0,0,out.width,out.height);ctx.drawImage(img,(out.width-dw)/2+editor.offsetX*ratio,(out.height-dh)/2+editor.offsetY*ratio,dw,dh);let data=out.toDataURL('image/jpeg',.82);if(data.length>650000)data=out.toDataURL('image/jpeg',.68);try{localStorage.setItem(PHOTO_KEY,data)}catch(error){console.warn('Profile photo save',error);alert(L('ذخیره عکس انجام نشد.','The photo could not be saved.','Fotografija nije spremljena.'));return}closeEditor();schedule(true);
}
function setStatus(box,text){const el=box?.querySelector('[data-nh7-profile-status]');if(el)el.textContent=text||''}
function renderAccountBox(box,p,photo){
  box.innerHTML=`${avatarHtml(photo,p.name)}<div class="nh7-account-profile564-copy"><strong>${esc(p.name||L('پروفایل من','My profile','Moj profil'))}</strong>${p.email?`<small>${esc(p.email)}</small>`:''}<div class="nh7-account-profile564-actions"><button type="button" class="secondary-btn" data-nh7-profile-pick>${esc(photo?L('تغییر و تنظیم عکس','Change & adjust photo','Promijeni i podesi fotografiju'):L('افزودن عکس','Add photo','Dodaj fotografiju'))}</button>${photo?`<button type="button" class="secondary-btn" data-nh7-profile-remove>${esc(L('حذف عکس','Remove photo','Ukloni fotografiju'))}</button>`:''}</div><small class="nh7-profile-status564" data-nh7-profile-status>${esc(L('بعد از انتخاب، می‌توانید عکس را جابه‌جا و زوم کنید.','After choosing, you can move and zoom the photo.','Nakon odabira fotografiju možete pomicati i zumirati.'))}</small></div><input class="nh7-profile-file564" data-nh7-profile-file type="file" accept="image/*">`;
  const input=box.querySelector('[data-nh7-profile-file]'),pick=box.querySelector('[data-nh7-profile-pick]'),remove=box.querySelector('[data-nh7-profile-remove]');
  pick?.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();if(busy||!input)return;try{input.value='';input.click()}catch(error){console.warn('Profile picker',error);setStatus(box,L('باز کردن انتخاب عکس انجام نشد.','Could not open the photo picker.','Nije moguće otvoriti odabir fotografije.'))}});
  input?.addEventListener('change',event=>{const file=event.target.files?.[0];if(!file||busy)return;openEditor(file)});
  remove?.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();if(busy)return;try{localStorage.removeItem(PHOTO_KEY)}catch(_){}schedule(true)});
}
function syncAccount(force=false){
  const logout=document.getElementById('logoutAccountBtn');if(!logout)return false;const card=logout.closest('.card');if(!card)return false;const p=profile(),photo=readPhoto(),sig=`${p.name}|${p.email}|${photoSig(photo)}|${lang()}`;
  let box=document.getElementById('nh7AccountProfile564');if(!box){box=document.createElement('section');box.id='nh7AccountProfile564';box.className='nh7-account-profile564';const anchor=card.querySelector('h3')||card.firstChild;if(anchor)anchor.insertAdjacentElement('afterend',box);else card.prepend(box)}
  if(force||box.dataset.sig!==sig){box.dataset.sig=sig;renderAccountBox(box,p,photo)}return true;
}
function cleanupLegacy(){['nh7HomeProfile563','nh7AccountProfile563'].forEach(id=>document.getElementById(id)?.remove())}
function syncAll(force=false){ensureStyle();refreshEditorCopy();cleanupLegacy();syncHeader();syncHome();syncAccount(force)}
function schedule(force=false){if(force){queued=false;requestAnimationFrame(()=>syncAll(true));return}if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;syncAll(false)})}
function start(){ensureStyle();syncAll(false);const view=document.getElementById('view');if(view)new MutationObserver(()=>schedule(false)).observe(view,{subtree:true,childList:true});document.getElementById('langSelect')?.addEventListener('change',()=>setTimeout(()=>syncAll(true),0));window.addEventListener('storage',event=>{if(event.key===PHOTO_KEY||event.key==='nh7_user_profile')schedule(true)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.NH7ProfilePhotoV564={VERSION,PHOTO_KEY,mount:()=>syncAll(true),read:readPhoto};
})();
