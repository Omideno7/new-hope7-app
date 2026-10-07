/* New Hope 7 Admin testimony runtime fix v5.0.5
 * Restores the approved testimony player after Storage Manager v5.0.4,
 * and makes permanent deletion storage-first to avoid orphaned audio objects.
 */
(()=>{'use strict';
if(window.__NH7_ADMIN_TESTIMONY_RUNTIME_FIX_V505__)return;
window.__NH7_ADMIN_TESTIMONY_RUNTIME_FIX_V505__=true;

const PRIVATE_BUCKET='nh7-testimony-submissions-v502';
const PUBLIC_BUCKET='nh7-testimony-published-v502';
const objectUrls=new Map();

function CL(){try{return String(typeof lang!=='undefined'?lang:'fa')}catch(_){return'fa'}}
function L(fa,en,hr){const x=CL();return x==='fa'?fa:x==='hr'?hr:en}
function E(v){try{return typeof h==='function'?h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}catch(_){return''}}
function EP(p){return String(p||'').split('/').filter(Boolean).map(encodeURIComponent).join('/')}
function K(){try{return String(typeof SUPABASE_KEY!=='undefined'?SUPABASE_KEY:'')}catch(_){return''}}
function T(){try{return String(typeof token!=='undefined'?token:'')}catch(_){return''}}
function H(extra={}){return Object.assign({apikey:K(),Authorization:'Bearer '+T()},extra)}
function PUB(p){return p?`${SUPABASE_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/${EP(p)}`:''}
function say(text,bad=false){
  try{if(typeof setMessage==='function')setMessage(text,bad?'danger':'success')}catch(_){}
  const x=document.getElementById('nh7TestimonyMsg')||document.getElementById('nh7StorageMsg');
  if(x){x.className=bad?'notice error':'notice';x.textContent=String(text||'')}
}
function busy(id,on){
  try{document.querySelectorAll(`[data-testimony-id="${CSS.escape(String(id))}"] button`).forEach(b=>b.disabled=!!on)}catch(_){}
}
function revoke(id){
  const u=objectUrls.get(String(id));
  if(u){try{URL.revokeObjectURL(u)}catch(_){} objectUrls.delete(String(id))}
}
function revokeAll(){for(const id of [...objectUrls.keys()])revoke(id)}

async function signed(path){
  const r=await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${PRIVATE_BUCKET}/${EP(path)}`,{
    method:'POST',cache:'no-store',headers:H({'Content-Type':'application/json'}),body:JSON.stringify({expiresIn:900})
  });
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d?.message||d?.error||('Storage '+r.status));
  let u=d.signedURL||d.signedUrl||d.signed_url||'';
  if(!u)throw new Error(L('لینک خصوصی فایل صوتی برنگشت.','Signed audio URL was not returned.','Privatna audio poveznica nije vraćena.'));
  if(/^https?:\/\//i.test(u))return u;
  if(u.startsWith('/storage/v1/'))return SUPABASE_URL+u;
  if(u.startsWith('/object/'))return SUPABASE_URL+'/storage/v1'+u;
  return SUPABASE_URL+'/storage/v1/'+u.replace(/^\/+/, '');
}

async function privateObjectUrl(id,path){
  const r=await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/${PRIVATE_BUCKET}/${EP(path)}`,{cache:'no-store',headers:H()});
  if(!r.ok){
    let m='';try{const d=await r.json();m=d?.message||d?.error||''}catch(_){}
    throw new Error(m||('Private audio '+r.status));
  }
  const blob=await r.blob();
  if(!blob.size)throw new Error(L('فایل صوتی خالی است.','Audio file is empty.','Audio datoteka je prazna.'));
  revoke(id);
  const u=URL.createObjectURL(blob);
  objectUrls.set(String(id),u);
  return {url:u,mime:blob.type||''};
}

async function listen(id){
  const api=window.NH7AdminTestimonyV565;
  const row=api?.state?.byId?.get(String(id));
  const host=document.getElementById('nh7t565Audio-'+id);
  if(!row||!host)return;
  host.innerHTML=`<span class="muted">${E(L('در حال آماده‌سازی صدا…','Preparing audio…','Priprema zvuka…'))}</span>`;
  try{
    let src='',mime=String(row.audio_mime_type||''),temporary=false;
    if(String(row.status)==='published'&&row.audio_public_path){
      revoke(id);src=PUB(row.audio_public_path);
    }else if(row.audio_submission_path){
      try{
        const result=await privateObjectUrl(id,row.audio_submission_path);
        src=result.url;mime=result.mime||mime;temporary=true;
      }catch(blobError){
        console.warn('[NH7 testimony v505] authenticated blob fallback to signed URL',blobError);
        revoke(id);src=await signed(row.audio_submission_path);
      }
    }else if(row.audio_public_path){
      revoke(id);src=PUB(row.audio_public_path);
    }
    if(!src)throw new Error(L('فایل صوتی پیدا نشد.','Audio file not found.','Audio datoteka nije pronađena.'));
    host.innerHTML=`<audio controls preload="metadata" playsinline style="width:100%"><source src="${E(src)}"${mime?` type="${E(mime)}"`:''}></audio><div class="nh7t505-audio-help"><small class="muted">${E(temporary?L('فایل خصوصی با دسترسی موقت ادمین باز شده است.','Private audio opened with temporary admin access.','Privatni audio otvoren je privremenim administratorskim pristupom.'):L('فایل آماده پخش است.','Audio is ready to play.','Audio je spreman za reprodukciju.'))}</small></div>`;
    const audio=host.querySelector('audio');
    if(audio){
      audio.addEventListener('error',()=>{
        const help=host.querySelector('.nh7t505-audio-help');
        if(help)help.innerHTML=`<div class="notice error">${E(L('مرورگر نتوانست این فایل را مستقیم پخش کند. دانلود فایل را امتحان کنید.','This browser could not play the file directly. Try Download.','Preglednik ne može izravno reproducirati datoteku. Pokušajte preuzeti.'))}</div>`;
      });
      audio.load();
    }
  }catch(e){
    revoke(id);
    host.innerHTML=`<div class="notice error">${E(e?.message||e)}</div>`;
  }
}

async function delObj(bucket,path){
  if(!path)return;
  const r=await fetch(`${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}`,{
    method:'DELETE',headers:H({'Content-Type':'application/json'}),body:JSON.stringify({prefixes:[String(path)]})
  });
  if(r.ok||r.status===404)return;
  throw new Error((await r.text().catch(()=>''))||(`Storage delete ${r.status}`));
}

async function hardDelete(id,ask=true){
  const api=window.NH7AdminTestimonyV565;
  const storage=window.NH7AdminStorageV504;
  const row=api?.state?.byId?.get(String(id))||storage?.state?.byId?.get(String(id));
  if(!row)return false;
  if(ask&&!confirm(L(`شهادت «${row.title||''}» و فایل‌های صوتی آن برای همیشه حذف شود؟ این کار قابل بازگشت نیست.`,`Permanently delete testimony “${row.title||''}” and all of its audio files? This cannot be undone.`,`Trajno izbrisati svjedočanstvo “${row.title||''}” i sve audio datoteke? Ovo se ne može poništiti.`)))return false;
  busy(id,true);revoke(id);
  try{
    const privatePath=String(row.audio_submission_path||'');
    const publicPath=String(row.audio_public_path||'');
    /* Storage first: if any object deletion fails, keep the DB row so the paths remain recoverable/retryable. */
    if(privatePath)await delObj(PRIVATE_BUCKET,privatePath);
    if(publicPath)await delObj(PUBLIC_BUCKET,publicPath);
    await adminRpc('nh7_owner_testimony_delete_any_v504',{p_id:row.id},20000);
    say(L('شهادت و فایل‌های آن کاملاً از Supabase حذف شد ✓','Testimony and all of its files were permanently deleted from Supabase ✓','Svjedočanstvo i sve datoteke trajno su izbrisani iz Supabasea ✓'));
    try{await api?.refresh?.()}catch(_){}
    try{if(storage){storage.state?.selected?.delete?.(String(id));await storage.refresh?.()}}catch(_){}
    return true;
  }catch(e){
    say(L('حذف کامل انجام نشد؛ رکورد دیتابیس نگه داشته شد تا بتوان دوباره با اطمینان حذف را انجام داد. ','Permanent deletion did not complete; the database record was kept so deletion can be retried safely. ','Trajno brisanje nije dovršeno; zapis baze je zadržan radi sigurnog ponovnog pokušaja. ')+String(e?.message||e),true);
    busy(id,false);
    return false;
  }
}

function addDeleteButtons(){
  const api=window.NH7AdminTestimonyV565;
  if(!api?.state?.byId)return;
  document.querySelectorAll('.nh7t565-card[data-testimony-id]').forEach(card=>{
    const id=String(card.dataset.testimonyId||'');
    const row=api.state.byId.get(id);
    if(!id||!row)return;
    if(String(row.status)==='rejected'&&card.querySelector('[data-nh7-delete-rejected-v503]'))return;
    if(card.querySelector('[data-nh7-delete-any-v505]'))return;
    const host=card.querySelector('.nh7t565-actions');if(!host)return;
    const b=document.createElement('button');
    b.type='button';b.className='danger-btn';b.dataset.nh7DeleteAnyV505='1';
    b.textContent='🗑 '+L('حذف کامل','Delete permanently','Trajno izbriši');
    b.onclick=()=>hardDelete(id,true);
    host.appendChild(b);
  });
}

async function safeDeleteSelected(){
  const storage=window.NH7AdminStorageV504;
  const ids=[...(storage?.state?.selected||[])];
  if(!ids.length)return;
  if(!confirm(L(`${ids.length} شهادت انتخاب‌شده و همه فایل‌هایشان برای همیشه حذف شوند؟`, `Permanently delete ${ids.length} selected testimonies and all of their files?`, `Trajno izbrisati ${ids.length} odabranih svjedočanstava i sve njihove datoteke?`)))return;
  let done=0;
  for(const id of ids)if(await hardDelete(id,false))done++;
  say(L(`${done} شهادت کاملاً حذف شد ✓`,`${done} testimonies permanently deleted ✓`,`${done} svjedočanstava trajno izbrisano ✓`));
}

function install(){
  const api=window.NH7AdminTestimonyV565;
  if(!api||typeof adminRpc!=='function'){setTimeout(install,80);return}
  /* Critical regression fix: Storage Manager v5.0.4 must not own the testimony player. */
  api.listen=listen;
  api.deletePermanently=hardDelete;
  const storage=window.NH7AdminStorageV504;
  if(storage){
    storage.del=async id=>{if(await hardDelete(id,true))await storage.refresh?.()};
    storage.deleteSelected=safeDeleteSelected;
  }
  const observer=new MutationObserver(addDeleteButtons);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  addDeleteButtons();
  setTimeout(addDeleteButtons,250);
}

window.addEventListener('pagehide',revokeAll);
window.addEventListener('beforeunload',revokeAll);
install();
})();
