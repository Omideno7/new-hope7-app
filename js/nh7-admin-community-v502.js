/* New Hope 7 Admin — Testimony moderation v5.0.2
 * Additive admin module. Uses existing authenticated admin session and v502 RPCs.
 * Prayer Request is intentionally out of scope for this module.
 */
(()=>{'use strict';
if(window.__NH7_ADMIN_COMMUNITY_V502__)return;
window.__NH7_ADMIN_COMMUNITY_V502__=true;

const VERSION='5.0.2-admin-testimony';
const PRIVATE_BUCKET='nh7-testimony-submissions-v502';
const PUBLIC_BUCKET='nh7-testimony-published-v502';
const stateV502={items:[],filter:'pending',loading:false,loaded:false,audioUrls:new Map(),pendingCount:0,error:''};

function L(fa,en,hr){
  try{return typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en}
  catch(_){return en}
}
function E(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function F(v){try{return new Date(v).toLocaleString(typeof lang!=='undefined'&&lang==='fa'?'fa-IR':typeof lang!=='undefined'&&lang==='hr'?'hr-HR':'en-US')}catch(_){return String(v||'')}}
function encodePath(path){return String(path||'').split('/').filter(Boolean).map(encodeURIComponent).join('/')}
function baseUrl(){try{return String(SUPABASE_URL||'').replace(/\/$/,'')}catch(_){return ''}}
function authToken(){try{return String(token||'')}catch(_){return ''}}
function apiKey(){try{return String(SUPABASE_KEY||'')}catch(_){return ''}}
function canUseAdmin(){try{return typeof authFetch==='function'&&!!authToken()&&!!baseUrl()&&!!apiKey()}catch(_){return false}}
function headers(extra={}){return Object.assign({apikey:apiKey(),Authorization:'Bearer '+authToken()},extra)}
function healingType(row){return ['healing','health','medical','شفا','درمان'].includes(String(row?.testimony_type||'').trim().toLowerCase())}
function canPublish(row){return !!row?.consent_public&&(!healingType(row)||!!row?.consent_health_public)}
function statusText(status){
  const s=String(status||'pending');
  if(s==='published')return L('منتشرشده','Published','Objavljeno');
  if(s==='rejected')return L('ردشده','Rejected','Odbijeno');
  return L('در انتظار بررسی','Pending','Na čekanju');
}
function statusClass(status){return status==='published'?'approved':status==='rejected'?'rejected':'pending'}
function message(text,type='success'){
  try{if(typeof setMessage==='function')setMessage(text,type)}catch(_){}
}
async function rpc(name,payload={}){
  if(typeof adminRpc==='function')return adminRpc(name,payload);
  if(typeof authFetch!=='function')throw new Error('Admin API is unavailable');
  return authFetch('/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(payload)});
}
async function feed(status=stateV502.filter,limit=200){
  return rpc('nh7_owner_testimony_feed_v502',{p_status:status==='all'?'':status,p_limit:limit});
}
async function signedPrivateUrl(path){
  const r=await fetch(baseUrl()+'/storage/v1/object/sign/'+PRIVATE_BUCKET+'/'+encodePath(path),{
    method:'POST',headers:headers({'Content-Type':'application/json'}),body:JSON.stringify({expiresIn:3600})
  });
  if(!r.ok)throw new Error((await r.text())||('Audio access failed: '+r.status));
  const data=await r.json();
  const url=data.signedURL||data.signedUrl||data.signed_url||'';
  if(!url)throw new Error('Signed audio URL was not returned');
  return /^https?:\/\//i.test(url)?url:baseUrl()+(String(url).startsWith('/')?'':'/')+url;
}
async function uploadPublicAudio(row){
  const source=String(row?.audio_submission_path||'').trim();
  if(!source)return '';
  const signed=await signedPrivateUrl(source);
  const audioResponse=await fetch(signed,{cache:'no-store'});
  if(!audioResponse.ok)throw new Error('Private audio download failed: '+audioResponse.status);
  const blob=await audioResponse.blob();
  const fileName=(source.split('/').pop()||('testimony-'+row.id+'.m4a')).replace(/[^a-zA-Z0-9._-]+/g,'-');
  const publicPath=String(row.id)+'/'+fileName;
  const contentType=String(row.audio_mime_type||blob.type||'application/octet-stream');
  const upload=await fetch(baseUrl()+'/storage/v1/object/'+PUBLIC_BUCKET+'/'+encodePath(publicPath),{
    method:'POST',headers:headers({'Content-Type':contentType,'x-upsert':'true'}),body:blob
  });
  if(!upload.ok)throw new Error((await upload.text())||('Public audio upload failed: '+upload.status));
  return publicPath;
}
function noteFor(id){return String(document.querySelector('[data-testimony-admin-note-v502="'+CSS.escape(String(id))+'"]')?.value||'').trim()}
function item(id){return stateV502.items.find(x=>String(x.id)===String(id))}

function ensureStyles(){
  if(document.getElementById('nh7AdminTestimonyStylesV502'))return;
  const style=document.createElement('style');style.id='nh7AdminTestimonyStylesV502';style.textContent=`
  .nh7-testimony-modal-v502{position:fixed;inset:0;z-index:230;background:rgba(8,24,38,.58);backdrop-filter:blur(5px);overflow:auto;padding:18px;display:flex;align-items:flex-start;justify-content:center}
  .nh7-testimony-shell-v502{width:min(980px,100%);margin:auto;background:#f7fbfb;border:1px solid rgba(255,255,255,.8);border-radius:24px;padding:16px;box-shadow:0 26px 85px rgba(0,0,0,.28)}
  .nh7-testimony-head-v502{position:sticky;top:-18px;z-index:2;background:rgba(247,251,251,.96);backdrop-filter:blur(10px);display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:8px 0 12px;border-bottom:1px solid var(--line,#d8ecea)}
  .nh7-testimony-head-v502 h2{margin:0}.nh7-testimony-toolbar-v502{display:grid;grid-template-columns:1fr auto;gap:8px;margin:12px 0}
  .nh7-testimony-consents-v502{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.nh7-testimony-audio-v502{width:100%;margin-top:8px}
  .nh7-testimony-close-v502{border:0;border-radius:999px;width:42px;height:42px;background:#fff;box-shadow:0 4px 14px rgba(16,32,51,.12);cursor:pointer;font-size:1.2rem}
  [data-nh7-testimony-tab-v502]{position:relative}.nh7-testimony-badge-v502{display:inline-flex;min-width:22px;height:22px;padding:0 6px;align-items:center;justify-content:center;margin-inline-start:6px;background:#e11d48;color:white;border-radius:999px;font-size:.76rem;font-weight:800}
  @media(max-width:700px){.nh7-testimony-modal-v502{padding:8px}.nh7-testimony-shell-v502{padding:12px;border-radius:18px}.nh7-testimony-toolbar-v502{grid-template-columns:1fr}.nh7-testimony-head-v502{top:-8px}}
  `;document.head.appendChild(style);
}
function renderBadge(){
  document.querySelectorAll('[data-nh7-testimony-tab-v502]').forEach(btn=>{
    let b=btn.querySelector('.nh7-testimony-badge-v502');
    if(stateV502.pendingCount>0){if(!b){b=document.createElement('span');b.className='nh7-testimony-badge-v502';btn.appendChild(b)}b.textContent=String(stateV502.pendingCount)}else if(b)b.remove();
  });
}
function ensureEntry(){
  ensureStyles();
  const tabs=document.querySelector('.tabs');
  if(!tabs||document.querySelector('[data-nh7-testimony-tab-v502]'))return;
  const button=document.createElement('button');button.type='button';button.className='tab';button.setAttribute('data-nh7-testimony-tab-v502','1');
  button.innerHTML='🌟 '+E(L('شهادت‌ها','Testimonies','Svjedočanstva'));
  button.addEventListener('click',()=>openPanel());tabs.appendChild(button);renderBadge();
}
function modal(){return document.getElementById('nh7AdminTestimonyModalV502')}
function renderModal(){
  ensureStyles();let root=modal();if(!root){root=document.createElement('div');root.id='nh7AdminTestimonyModalV502';root.className='nh7-testimony-modal-v502';root.addEventListener('click',e=>{if(e.target===root)closePanel()});document.body.appendChild(root)}
  root.innerHTML=`<div class="nh7-testimony-shell-v502" role="dialog" aria-modal="true" aria-label="${E(L('مدیریت شهادت‌ها','Testimony management','Upravljanje svjedočanstvima'))}">
    <div class="nh7-testimony-head-v502"><div><h2>🌟 ${E(L('مدیریت شهادت‌ها','Testimony management','Upravljanje svjedočanstvima'))}</h2><p class="muted small">${E(L('شهادت‌ها تا زمان تأیید شما خصوصی می‌مانند.','Testimonies remain private until you approve them.','Svjedočanstva ostaju privatna dok ih ne odobrite.'))}</p></div><button class="nh7-testimony-close-v502" type="button" onclick="window.NH7TestimonyAdminV502.close()">✕</button></div>
    <div class="nh7-testimony-toolbar-v502"><select onchange="window.NH7TestimonyAdminV502.setFilter(this.value)"><option value="pending" ${stateV502.filter==='pending'?'selected':''}>${E(L('در انتظار بررسی','Pending','Na čekanju'))}</option><option value="published" ${stateV502.filter==='published'?'selected':''}>${E(L('منتشرشده','Published','Objavljeno'))}</option><option value="rejected" ${stateV502.filter==='rejected'?'selected':''}>${E(L('ردشده','Rejected','Odbijeno'))}</option><option value="all" ${stateV502.filter==='all'?'selected':''}>${E(L('همه','All','Sve'))}</option></select><button class="btn secondary" type="button" onclick="window.NH7TestimonyAdminV502.refresh()">↻ ${E(L('تازه‌سازی','Refresh','Osvježi'))}</button></div>
    <div data-nh7-testimony-list-v502></div>
  </div>`;
  renderRows();
}
function renderRows(){
  const host=modal()?.querySelector('[data-nh7-testimony-list-v502]');if(!host)return;
  if(stateV502.loading){host.innerHTML='<div class="empty">⏳ '+E(L('در حال دریافت شهادت‌ها…','Loading testimonies…','Učitavanje svjedočanstava…'))+'</div>';return}
  if(stateV502.error){host.innerHTML='<div class="notice danger">'+E(stateV502.error)+'</div>';return}
  if(!stateV502.items.length){host.innerHTML='<div class="empty">'+E(L('موردی در این بخش نیست.','No testimonies in this section.','Nema svjedočanstava u ovom odjeljku.'))+'</div>';return}
  host.innerHTML=stateV502.items.map(row=>{
    const audio=String(row.audio_submission_path||'').trim();
    const signed=stateV502.audioUrls.get(String(row.id))||'';
    const publishAllowed=canPublish(row);
    const isPending=String(row.status)==='pending';
    const name=row.show_name?String(row.display_name||'').trim():L('نام مخفی','Name hidden','Ime skriveno');
    const content=String(row.note_text||'').trim();
    return `<article class="request-card" data-testimony-id-v502="${E(row.id)}">
      <div class="req-head"><div><div class="req-name">${E(row.title||L('شهادت بدون عنوان','Untitled testimony','Svjedočanstvo bez naslova'))}</div><div class="req-meta">${E(name||'-')} · ${E(row.language||'-')} · ${E(row.testimony_type||'-')} · ${E(F(row.created_at))}</div></div><span class="pill ${statusClass(row.status)}">${E(statusText(row.status))}</span></div>
      <div class="nh7-testimony-consents-v502"><span class="pill ${row.consent_public?'approved':'rejected'}">${E(row.consent_public?L('✓ رضایت انتشار عمومی','✓ Public consent','✓ Javni pristanak'):L('✕ بدون رضایت عمومی','✕ No public consent','✕ Bez javnog pristanka'))}</span>${healingType(row)?`<span class="pill ${row.consent_health_public?'approved':'rejected'}">${E(row.consent_health_public?L('✓ رضایت انتشار شهادت شفا','✓ Health consent','✓ Pristanak za zdravlje'):L('✕ رضایت شهادت شفا ثبت نشده','✕ Health consent missing','✕ Nedostaje pristanak za zdravlje'))}</span>`:''}</div>
      ${content?`<div class="detail-box"><p>${E(content)}</p></div>`:'<div class="detail-box"><p class="muted">'+E(L('این شهادت متن ندارد.','This testimony has no text.','Ovo svjedočanstvo nema tekst.'))+'</p></div>'}
      ${audio?`<div class="detail-box"><div class="req-meta">🎙 ${E(L('فایل صوتی','Audio testimony','Audio svjedočanstvo'))} · ${E(String(Math.round(Number(row.audio_duration_seconds||0))))}s</div>${signed?`<audio class="nh7-testimony-audio-v502" controls preload="metadata" src="${E(signed)}"></audio>`:`<button type="button" class="btn secondary" onclick="window.NH7TestimonyAdminV502.listen('${E(row.id)}')">▶ ${E(L('گوش دادن خصوصی','Listen privately','Poslušaj privatno'))}</button>`}</div>`:''}
      ${isPending?`<div class="detail-box"><label>${E(L('یادداشت مدیر (اختیاری)','Admin note (optional)','Bilješka administratora (neobavezno)'))}<textarea data-testimony-admin-note-v502="${E(row.id)}" placeholder="${E(L('یادداشت داخلی…','Internal note…','Interna bilješka…'))}"></textarea></label>${!publishAllowed?'<div class="notice">'+E(L('انتشار این شهادت تا ثبت رضایت لازم مسدود است.','Publishing is blocked until the required consent is present.','Objava je blokirana dok se ne zabilježi potreban pristanak.'))+'</div>':''}<div class="actions"><button type="button" class="btn primary" ${publishAllowed?'':'disabled'} onclick="window.NH7TestimonyAdminV502.publish('${E(row.id)}')">✓ ${E(L('تأیید و انتشار','Approve & publish','Odobri i objavi'))}</button><button type="button" class="btn danger-btn" onclick="window.NH7TestimonyAdminV502.reject('${E(row.id)}')">✕ ${E(L('رد شهادت','Reject','Odbij'))}</button></div></div>`:(row.admin_note?`<div class="detail-box"><strong>${E(L('یادداشت مدیر','Admin note','Bilješka administratora'))}</strong><p>${E(row.admin_note)}</p></div>`:'')}
    </article>`;
  }).join('');
}
async function refresh(){
  if(!canUseAdmin())return;
  stateV502.loading=true;stateV502.error='';renderRows();
  try{
    const rows=await feed(stateV502.filter,200);stateV502.items=Array.isArray(rows)?rows:[];stateV502.loaded=true;
    if(stateV502.filter==='pending')stateV502.pendingCount=stateV502.items.length;
    else{try{const pending=await feed('pending',200);stateV502.pendingCount=Array.isArray(pending)?pending.length:0}catch(_){}}
    renderBadge();
  }catch(e){stateV502.error=e?.message||String(e)}finally{stateV502.loading=false;renderRows()}
}
async function refreshPendingBadge(){
  if(!canUseAdmin())return;
  try{const rows=await feed('pending',200);stateV502.pendingCount=Array.isArray(rows)?rows.length:0;renderBadge()}catch(_){}
}
async function openPanel(){renderModal();await refresh()}
function closePanel(){modal()?.remove()}
async function setFilter(value){stateV502.filter=['pending','published','rejected','all'].includes(value)?value:'pending';await refresh()}
async function listen(id){
  const row=item(id);if(!row?.audio_submission_path)return;
  try{message(L('در حال آماده‌سازی فایل صوتی خصوصی…','Preparing private audio…','Priprema privatnog zvuka…'));const url=await signedPrivateUrl(row.audio_submission_path);stateV502.audioUrls.set(String(id),url);renderRows()}catch(e){alert(e?.message||String(e))}
}
async function publishTestimony(id){
  const row=item(id);if(!row)return;
  if(!canPublish(row)){alert(L('رضایت لازم برای انتشار ثبت نشده است.','Required publishing consent is missing.','Nedostaje potreban pristanak za objavu.'));return}
  if(!confirm(L('این شهادت تأیید و برای کاربران منتشر شود؟','Approve and publish this testimony?','Odobriti i objaviti ovo svjedočanstvo?')))return;
  const note=noteFor(id);
  try{
    stateV502.loading=true;renderRows();message(L('در حال انتشار شهادت…','Publishing testimony…','Objavljivanje svjedočanstva…'));
    const publicAudioPath=await uploadPublicAudio(row);
    await rpc('nh7_owner_testimony_publish_v502',{p_id:String(id),p_public_audio_path:publicAudioPath,p_admin_note:note});
    message(L('شهادت با موفقیت منتشر شد.','Testimony published successfully.','Svjedočanstvo je uspješno objavljeno.'),'success');
    stateV502.audioUrls.delete(String(id));
  }catch(e){alert(e?.message||String(e));message(e?.message||String(e),'danger')}
  finally{stateV502.loading=false;await refresh()}
}
async function rejectTestimony(id){
  if(!item(id))return;
  if(!confirm(L('این شهادت رد شود؟','Reject this testimony?','Odbiti ovo svjedočanstvo?')))return;
  const note=noteFor(id);
  try{stateV502.loading=true;renderRows();await rpc('nh7_owner_testimony_reject_v502',{p_id:String(id),p_admin_note:note});message(L('شهادت رد شد.','Testimony rejected.','Svjedočanstvo je odbijeno.'),'success')}
  catch(e){alert(e?.message||String(e));message(e?.message||String(e),'danger')}
  finally{stateV502.loading=false;await refresh()}
}

window.NH7TestimonyAdminV502={version:VERSION,open:openPanel,close:closePanel,refresh,setFilter,listen,publish:publishTestimony,reject:rejectTestimony,state:stateV502};

let initialBadgeLoaded=false;
const observer=new MutationObserver(()=>{ensureEntry();if(!initialBadgeLoaded&&document.querySelector('.tabs')&&canUseAdmin()){initialBadgeLoaded=true;refreshPendingBadge()}});
observer.observe(document.documentElement,{childList:true,subtree:true});
function initial(){ensureEntry();if(!initialBadgeLoaded&&document.querySelector('.tabs')&&canUseAdmin()){initialBadgeLoaded=true;refreshPendingBadge()}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initial,{once:true});else initial();
})();
