/* New Hope 7 Admin testimony playback v5.0.6
 * WebKit-safe private testimony playback.
 * - fetches private audio with admin auth
 * - strips problematic codec parameters from Blob MIME for inline playback
 * - uses direct media src (not <source type=...>)
 * - offers signed-URL device-player fallback for unsupported codecs
 */
(()=>{'use strict';
if(window.__NH7_ADMIN_TESTIMONY_PLAYBACK_V506__)return;
window.__NH7_ADMIN_TESTIMONY_PLAYBACK_V506__=true;
const PRIVATE_BUCKET='nh7-testimony-submissions-v502';
const PUBLIC_BUCKET='nh7-testimony-published-v502';
const urls=new Map(),signedUrls=new Map();
function CL(){try{return String(typeof lang!=='undefined'?lang:'fa')}catch(_){return'fa'}}
function L(fa,en,hr){const x=CL();return x==='fa'?fa:x==='hr'?hr:en}
function E(v){try{return typeof h==='function'?h(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}catch(_){return''}}
function EP(p){return String(p||'').split('/').filter(Boolean).map(encodeURIComponent).join('/')}
function K(){try{return String(typeof SUPABASE_KEY!=='undefined'?SUPABASE_KEY:'')}catch(_){return''}}
function T(){try{return String(typeof token!=='undefined'?token:'')}catch(_){return''}}
function H(extra={}){return Object.assign({apikey:K(),Authorization:'Bearer '+T()},extra)}
function PUB(p){return p?`${SUPABASE_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/${EP(p)}`:''}
function cleanMime(raw,path=''){
 const m=String(raw||'').toLowerCase(),p=String(path||'').toLowerCase();
 if(m.includes('mp4')||/\.(m4a|mp4|m4b)$/.test(p))return'audio/mp4';
 if(m.includes('webm')||p.endsWith('.webm'))return'audio/webm';
 if(m.includes('ogg')||/\.(ogg|opus)$/.test(p))return'audio/ogg';
 if(m.includes('mpeg')||p.endsWith('.mp3'))return'audio/mpeg';
 return m.split(';')[0]||'audio/mp4';
}
function revoke(id){const u=urls.get(String(id));if(u){try{URL.revokeObjectURL(u)}catch(_){}urls.delete(String(id))}}
function revokeAll(){for(const id of [...urls.keys()])revoke(id)}
async function signed(path){
 const r=await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${PRIVATE_BUCKET}/${EP(path)}`,{method:'POST',cache:'no-store',headers:H({'Content-Type':'application/json'}),body:JSON.stringify({expiresIn:900})});
 const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.message||d?.error||('Storage '+r.status));
 let u=d.signedURL||d.signedUrl||d.signed_url||'';if(!u)throw new Error(L('لینک خصوصی فایل صوتی برنگشت.','Signed audio URL was not returned.','Privatna audio poveznica nije vraćena.'));
 if(!/^https?:\/\//i.test(u)){if(u.startsWith('/storage/v1/'))u=SUPABASE_URL+u;else if(u.startsWith('/object/'))u=SUPABASE_URL+'/storage/v1'+u;else u=SUPABASE_URL+'/storage/v1/'+u.replace(/^\/+/, '')}
 return u;
}
async function privatePlayable(id,path,mime){
 const r=await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/${PRIVATE_BUCKET}/${EP(path)}`,{cache:'no-store',headers:H()});
 if(!r.ok){let msg='';try{const d=await r.json();msg=d?.message||d?.error||''}catch(_){}throw new Error(msg||('Private audio '+r.status))}
 const ab=await r.arrayBuffer();if(!ab.byteLength)throw new Error(L('فایل صوتی خالی است.','Audio file is empty.','Audio datoteka je prazna.'));
 revoke(id);
 /* Re-wrap instead of trusting Storage metadata such as audio/mp4;codecs=opus.
    Safari/WebKit is more reliable when sniffing a plain MP4 MIME. */
 const blob=new Blob([ab],{type:cleanMime(mime,path)}),url=URL.createObjectURL(blob);urls.set(String(id),url);return url;
}
function deviceButton(id,url){
 signedUrls.set(String(id),url);
 const label=E(L('باز کردن در پخش‌کننده دستگاه','Open in device player','Otvori u reproduktoru uređaja'));
 return `<button type="button" class="secondary-btn" data-nh7t506-open="${E(id)}">↗ ${label}</button>`;
}
function wireDeviceButton(host,id){const b=host.querySelector(`[data-nh7t506-open="${CSS.escape(String(id))}"]`);if(b)b.onclick=()=>{const u=signedUrls.get(String(id));if(u)window.open(u,'_blank','noopener')}}
async function listen(id){
 const api=window.NH7AdminTestimonyV565,row=api?.state?.byId?.get(String(id)),host=document.getElementById('nh7t565Audio-'+id);if(!row||!host)return;
 host.innerHTML=`<span class="muted">${E(L('در حال آماده‌سازی صدا…','Preparing audio…','Priprema zvuka…'))}</span>`;
 try{
   let src='',fallback='',isPrivate=false;
   if(String(row.status)==='published'&&row.audio_public_path){revoke(id);src=PUB(row.audio_public_path);fallback=src}
   else if(row.audio_submission_path){isPrivate=true;fallback=await signed(row.audio_submission_path);src=await privatePlayable(id,row.audio_submission_path,row.audio_mime_type)}
   else if(row.audio_public_path){revoke(id);src=PUB(row.audio_public_path);fallback=src}
   if(!src)throw new Error(L('فایل صوتی پیدا نشد.','Audio file not found.','Audio datoteka nije pronađena.'));
   host.innerHTML=`<audio controls preload="auto" playsinline style="width:100%"></audio><div class="nh7t506-tools"><small class="muted">${E(isPrivate?L('فایل خصوصی برای بررسی ادمین آماده شد.','Private audio is ready for admin review.','Privatni audio spreman je za administratorski pregled.'):L('فایل آماده پخش است.','Audio is ready to play.','Audio je spreman za reprodukciju.'))}</small>${deviceButton(id,fallback)}</div><div class="nh7t506-status muted small"></div>`;
   wireDeviceButton(host,id);
   const a=host.querySelector('audio'),status=host.querySelector('.nh7t506-status');
   if(!a)return;
   /* Direct src is intentional: do not pass the stored codec parameter to <source type>. */
   a.src=src;
   a.addEventListener('loadedmetadata',()=>{if(status)status.textContent=L('آماده پخش ✓','Ready to play ✓','Spremno za reprodukciju ✓')},{once:true});
   a.addEventListener('canplay',()=>{if(status)status.textContent=L('آماده پخش ✓','Ready to play ✓','Spremno za reprodukciju ✓')},{once:true});
   a.addEventListener('error',()=>{if(status)status.innerHTML=E(L('این WebView نتوانست Codec فایل را داخل پلیر پخش کند؛ دکمه «باز کردن در پخش‌کننده دستگاه» همین فایل را بدون دانلود دستی باز می‌کند.','This WebView cannot decode the file codec inline; Open in device player opens the same private file without a manual download.','Ovaj WebView ne može dekodirati kodek unutar playera; Otvori u reproduktoru uređaja otvara istu privatnu datoteku bez ručnog preuzimanja.'))});
   a.load();
   /* Best effort only; iOS can reject autoplay after async auth. The visible control remains usable. */
   a.play().catch(()=>{});
   setTimeout(()=>{if(a.readyState===0&&status&&!status.textContent)status.textContent=L('اگر پخش داخل پنل شروع نشد، «باز کردن در پخش‌کننده دستگاه» را بزن.','If inline playback does not start, use Open in device player.','Ako reprodukcija ne počne, odaberite Otvori u reproduktoru uređaja.')},2500);
 }catch(e){revoke(id);host.innerHTML=`<div class="notice error">${E(e?.message||e)}</div>`}
}
function install(){const api=window.NH7AdminTestimonyV565;if(!api){setTimeout(install,80);return}api.listen=listen;api.PLAYBACK_VERSION='5.0.6'}
window.addEventListener('pagehide',revokeAll);window.addEventListener('beforeunload',revokeAll);install();
})();