/* New Hope 7 Admin v5.0.2 — owner-only prayer + audio testimony review.
   No polling. Feature branch only. */
(()=>{'use strict';
if(window.__NH7_ADMIN_COMMUNITY_V502__)return;window.__NH7_ADMIN_COMMUNITY_V502__=true;
const VERSION='5.0.3-release',PRIVATE_BUCKET='nh7-testimony-submissions-v502',PUBLIC_BUCKET='nh7-testimony-published-v502';
const S={prayers:[],testimonies:[],loadingPrayer:false,loadingTestimony:false,errorPrayer:'',errorTestimony:'',prayerFilter:'active',testimonyFilter:'pending',audioUrls:new Map()};
function A(){const c=window.NH7_ADMIN_COMMUNITY_CTX_V502;if(!c)throw new Error('Admin community context is not ready.');return c}
function lang(){return A().lang()}
function L(fa,en,hr){return lang()==='fa'?fa:lang()==='hr'?hr:en}
function h(s){return A().h(String(s??''))}
function date(v){try{return new Date(v).toLocaleString(lang()==='fa'?'fa-IR':lang()==='hr'?'hr-HR':'en-US')}catch(_){return String(v||'')}}
function statusLabel(s){const x=String(s||'new');return x==='new'?L('جدید','New','Novo'):x==='praying'?L('در حال دعا','Praying','U molitvi'):x==='completed'?L('تکمیل‌شده','Completed','Završeno'):x}
function backendText(e){const t=String(e?.message||e||'');return /does not exist|schema cache|404|PGRST205|permission denied/i.test(t)?L('Backend این بخش هنوز روی محیط تست فعال نشده است.','This backend is not active in the test environment yet.','Backend ovog dijela još nije aktivan u testnom okruženju.'):t}
function pendingPrayerCount(){return S.prayers.filter(x=>x.status==='new').length}
function pendingTestimonyCount(){return S.testimonies.filter(x=>x.status==='pending').length}

async function refreshPrayer(){
 if(S.loadingPrayer)return;S.loadingPrayer=true;S.errorPrayer='';A().render();
 try{const rows=await A().adminRpc('nh7_owner_prayer_feed_v502',{p_status:S.prayerFilter,p_limit:200});S.prayers=Array.isArray(rows)?rows:[]}
 catch(e){S.errorPrayer=backendText(e);console.warn(e)}
 finally{S.loadingPrayer=false;A().render()}
}
async function setPrayerStatus(id,status){
 try{await A().adminRpc('nh7_owner_prayer_set_status_v502',{p_id:id,p_status:status});await refreshPrayer()}
 catch(e){alert(backendText(e))}
}
function prayerRows(){
 if(S.loadingPrayer)return '<div class="empty">'+h(L('در حال بارگذاری…','Loading…','Učitavanje…'))+'</div>';
 if(S.errorPrayer)return '<div class="notice">'+h(S.errorPrayer)+'</div>';
 if(!S.prayers.length)return '<div class="empty">'+h(L('درخواست دعایی وجود ندارد.','No prayer requests.','Nema molitvenih zahtjeva.'))+'</div>';
 return S.prayers.map(r=>'<article class="request-card"><div class="req-head"><div><div class="req-name">'+h(r.requester_name)+'</div><div class="req-meta">'+h(date(r.created_at))+'</div></div>'+A().pill(r.status)+'</div><div class="detail-box" style="margin-top:10px"><p style="white-space:pre-wrap;line-height:1.8">'+h(r.request_text)+'</p></div><div class="actions three"><button class="btn secondary" onclick="nh7AdminCommunityV502.setPrayerStatus(\''+h(r.id)+'\',\'new\')">'+h(L('جدید','New','Novo'))+'</button><button class="btn ghost" onclick="nh7AdminCommunityV502.setPrayerStatus(\''+h(r.id)+'\',\'praying\')">'+h(L('در حال دعا','Praying','U molitvi'))+'</button><button class="btn primary" onclick="nh7AdminCommunityV502.setPrayerStatus(\''+h(r.id)+'\',\'completed\')">'+h(L('تکمیل','Complete','Završi'))+'</button></div></article>').join('')
}
function renderPrayer(){
 return '<section class="panel-card"><div class="req-head"><div><h3>🙏 '+h(L('درخواست‌های دعا','Prayer Requests','Molitveni zahtjevi'))+'</h3><p class="muted small">'+h(L('فقط Owner/Admin اصلی. هیچ دسترسی مستقیمی برای Prayer Servant ایجاد نشده است.','Owner/Admin only. No separate Prayer Servant access is created.','Samo Owner/Admin. Nema zasebnog pristupa za Prayer Servant.'))+'</p></div><span class="pill pending">'+pendingPrayerCount()+'</span></div><div class="toolbar"><select onchange="nh7AdminCommunityV502.setPrayerFilter(this.value)"><option value="active" '+(S.prayerFilter==='active'?'selected':'')+'>'+h(L('فعال','Active','Aktivno'))+'</option><option value="all" '+(S.prayerFilter==='all'?'selected':'')+'>'+h(L('همه','All','Sve'))+'</option><option value="new" '+(S.prayerFilter==='new'?'selected':'')+'>'+h(L('جدید','New','Novo'))+'</option><option value="praying" '+(S.prayerFilter==='praying'?'selected':'')+'>'+h(L('در حال دعا','Praying','U molitvi'))+'</option><option value="completed" '+(S.prayerFilter==='completed'?'selected':'')+'>'+h(L('تکمیل‌شده','Completed','Završeno'))+'</option></select><button class="btn secondary" onclick="nh7AdminCommunityV502.refreshPrayer()">⟳ '+h(L('تازه‌سازی','Refresh','Osvježi'))+'</button><button class="btn primary" onclick="nh7AdminCommunityV502.exportPrayerPdf()">📄 '+h(L('PDF / چاپ','PDF / Print','PDF / ispis'))+'</button></div>'+prayerRows()+'</section>'
}
function setPrayerFilter(v){S.prayerFilter=v;refreshPrayer()}
async function exportPrayerPdf(){
 let rows=[];try{const data=await A().adminRpc('nh7_owner_prayer_export_v502',{p_status:S.prayerFilter,p_limit:2000},30000);rows=Array.isArray(data)?data:[]}catch(e){alert(backendText(e));return}
 if(!rows.length){alert(L('درخواستی برای خروجی وجود ندارد.','No requests to export.','Nema zahtjeva za izvoz.'));return}
 const w=window.open('','_blank');if(!w){alert(L('مرورگر پنجرهٔ PDF را مسدود کرد.','The browser blocked the PDF window.','Preglednik je blokirao PDF prozor.'));return}
 const title=L('درخواست‌های دعا — کلیسای امیدنو۷','Prayer Requests — New Hope 7 Church','Molitveni zahtjevi — Crkva New Hope 7');
 const body=rows.map((r,i)=>'<article><h3>'+(i+1)+'. '+h(r.requester_name)+' <small>['+h(statusLabel(r.status))+']</small></h3><p>'+h(r.request_text).replace(/\n/g,'<br>')+'</p><div class="date">'+h(date(r.created_at))+'</div></article>').join('');
 w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+h(title)+'</title><style>@page{size:A4;margin:16mm}body{font-family:Arial,Tahoma,sans-serif;color:#111}h1{font-size:20px}article{break-inside:avoid;border-bottom:1px solid #bbb;padding:10px 0}h3{font-size:14px;margin:0 0 8px}p{font-size:12px;line-height:1.7;white-space:normal}.date{font-size:10px;color:#666}small{font-weight:normal}</style></head><body><h1>'+h(title)+'</h1>'+body+'<script>window.onload=()=>setTimeout(()=>window.print(),200)<\/script></body></html>');w.document.close()
}

async function refreshTestimonies(){
 if(S.loadingTestimony)return;S.loadingTestimony=true;S.errorTestimony='';A().render();
 try{
  const rows=await A().adminRpc('nh7_owner_testimony_feed_v502',{p_status:S.testimonyFilter,p_limit:100});S.testimonies=Array.isArray(rows)?rows:[];S.audioUrls.clear();
  await Promise.all(S.testimonies.filter(x=>x.audio_submission_path).slice(0,20).map(async x=>{try{const url=await A().storageSignedUrl(PRIVATE_BUCKET,x.audio_submission_path,1800);S.audioUrls.set(x.id,url)}catch(_){}}));
 }catch(e){S.errorTestimony=backendText(e);console.warn(e)}
 finally{S.loadingTestimony=false;A().render()}
}
function testimonyRows(){
 if(S.loadingTestimony)return '<div class="empty">'+h(L('در حال بارگذاری…','Loading…','Učitavanje…'))+'</div>';
 if(S.errorTestimony)return '<div class="notice">'+h(S.errorTestimony)+'</div>';
 if(!S.testimonies.length)return '<div class="empty">'+h(L('شهادتی در این وضعیت وجود ندارد.','No testimony in this status.','Nema svjedočanstava u ovom statusu.'))+'</div>';
 return S.testimonies.map(t=>'<article class="request-card"><div class="req-head"><div><div class="req-name">🎙️ '+h(t.title)+'</div><div class="req-meta">'+h(t.display_name||'')+' · '+h(t.testimony_type||'')+' · '+h(date(t.created_at))+'</div></div>'+A().pill(t.status)+'</div>'+(t.note_text?'<p>'+h(t.note_text)+'</p>':'')+(S.audioUrls.get(t.id)?'<audio controls preload="none" style="width:100%;margin:10px 0" src="'+h(S.audioUrls.get(t.id))+'"></audio>':'<div class="notice small">'+h(L('لینک خصوصی فایل هنوز آماده نشده است.','Private audio link is not ready yet.','Privatna audio poveznica još nije spremna.'))+'</div>')+'<div class="actions"><button class="btn primary" onclick="nh7AdminCommunityV502.approveTestimony(\''+h(t.id)+'\')">✅ '+h(L('تأیید و انتشار','Approve & publish','Odobri i objavi'))+'</button><button class="btn danger-btn" onclick="nh7AdminCommunityV502.rejectTestimony(\''+h(t.id)+'\')">⛔ '+h(L('رد','Reject','Odbij'))+'</button></div></article>').join('')
}
function renderTestimonies(){
 return '<section class="panel-card"><div class="req-head"><div><h3>✨ '+h(L('شهادت‌های صوتی','Audio Testimonies','Audio svjedočanstva'))+'</h3><p class="muted small">'+h(L('فایل قبل از تأیید خصوصی است. فقط پس از تأیید در اپ منتشر می‌شود.','Audio remains private before approval and is published only after approval.','Audio ostaje privatan prije odobrenja i objavljuje se tek nakon odobrenja.'))+'</p></div><span class="pill pending">'+pendingTestimonyCount()+'</span></div><div class="toolbar"><select onchange="nh7AdminCommunityV502.setTestimonyFilter(this.value)"><option value="pending" '+(S.testimonyFilter==='pending'?'selected':'')+'>'+h(L('در انتظار','Pending','Na čekanju'))+'</option><option value="approved" '+(S.testimonyFilter==='approved'?'selected':'')+'>'+h(L('تأییدشده','Approved','Odobreno'))+'</option><option value="rejected" '+(S.testimonyFilter==='rejected'?'selected':'')+'>'+h(L('ردشده','Rejected','Odbijeno'))+'</option><option value="all" '+(S.testimonyFilter==='all'?'selected':'')+'>'+h(L('همه','All','Sve'))+'</option></select><button class="btn secondary" onclick="nh7AdminCommunityV502.refreshTestimonies()">⟳ '+h(L('تازه‌سازی','Refresh','Osvježi'))+'</button></div>'+testimonyRows()+'</section>'
}
function setTestimonyFilter(v){S.testimonyFilter=v;refreshTestimonies()}
function extension(path,mime){const m=String(path||'').match(/\.([a-z0-9]{2,5})$/i);if(m)return m[1].toLowerCase();return String(mime||'').includes('mp4')?'m4a':String(mime||'').includes('mpeg')?'mp3':'webm'}
async function approveTestimony(id){
 const t=S.testimonies.find(x=>String(x.id)===String(id));if(!t)return;
 if(!confirm(L('این شهادت صوتی تأیید و در اپ منتشر شود؟','Approve and publish this audio testimony?','Odobriti i objaviti ovo audio svjedočanstvo?')))return;
 try{
  const dest='approved/'+t.id+'.'+extension(t.audio_submission_path,t.audio_mime_type);
  await A().storageCopy(PRIVATE_BUCKET,t.audio_submission_path,PUBLIC_BUCKET,dest);
  await A().adminRpc('nh7_owner_testimony_publish_v502',{p_id:t.id,p_published_audio_path:dest});
  if(t.audio_submission_path)A().storageRemove?.(PRIVATE_BUCKET,t.audio_submission_path).catch(()=>{});
  await refreshTestimonies()
 }catch(e){alert(backendText(e))}
}
async function rejectTestimony(id){
 if(!confirm(L('این شهادت رد شود؟','Reject this testimony?','Odbiti ovo svjedočanstvo?')))return;
 const t=S.testimonies.find(x=>String(x.id)===String(id));
 try{await A().adminRpc('nh7_owner_testimony_reject_v502',{p_id:id});if(t?.audio_submission_path)A().storageRemove?.(PRIVATE_BUCKET,t.audio_submission_path).catch(()=>{});await refreshTestimonies()}catch(e){alert(backendText(e))}
}
function onTab(t){if(t==='prayer502'&&!S.prayers.length&&!S.loadingPrayer)refreshPrayer();if(t==='testimonies502'&&!S.testimonies.length&&!S.loadingTestimony)refreshTestimonies()}

window.nh7AdminCommunityV502={VERSION,renderPrayer,renderTestimonies,refreshPrayer,setPrayerStatus,setPrayerFilter,exportPrayerPdf,refreshTestimonies,setTestimonyFilter,approveTestimony,rejectTestimony,onTab,pendingPrayerCount,pendingTestimonyCount};
})();