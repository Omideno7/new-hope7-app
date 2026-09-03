/* New Hope 7 v4.2.1 — isolated Admin sermon publication integrity.
   Scope: sermon/audio saves, recent unpublished-audio repair, and post-save verification.
   It does not alter School, Bible, Plans, Message Center, Auth, or the user app UI. */
(()=>{'use strict';
if(window.__NH7_ADMIN_SERMON_INTEGRITY_V421__)return;
window.__NH7_ADMIN_SERMON_INTEGRITY_V421__=true;

const VERSION='4.2.1-admin-sermon-integrity';
const RECENT_DAYS=14;
const TARGET_WORDS=['تکالیف','مدرسه','نبوی','prophetic','assignment','school'];
let installed=false;
let installing=false;
let originalSave=null;
let originalBulk=null;
let originalRenderSermons=null;

const label=(fa,en,hr)=>{
  try{return typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en}catch(_){return en}
};
const clean=value=>String(value??'').trim();
const lower=value=>clean(value).toLocaleLowerCase();
const escaped=value=>typeof h==='function'?h(value):clean(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rows=value=>Array.isArray(value)?value:[];
const nowIso=()=>new Date().toISOString();
const recentCutoff=()=>Date.now()-RECENT_DAYS*24*60*60*1000;
const isRecent=row=>{const t=Date.parse(row?.created_at||row?.updated_at||'');return Number.isFinite(t)&&t>=recentCutoff()};
const hasSource=row=>Boolean(clean(row?.audio_url)||clean(row?.youtube_url));
const categoryName=category=>clean(category?.name_fa||category?.name_en||category?.name_hr||'-');
const categoryText=category=>lower([category?.name_fa,category?.name_en,category?.name_hr].filter(Boolean).join(' '));
const isTargetCategory=category=>TARGET_WORDS.some(word=>categoryText(category).includes(lower(word)));
const currentCategories=()=>{try{return rows(state?.categories)}catch(_){return[]}};
const currentSermons=()=>{try{return rows(state?.sermons)}catch(_){return[]}};
const sermonTitle=row=>clean(row?.title_fa||row?.title_en||row?.title_hr||row?.id||'-');

async function readSermons(){
  if(typeof authFetch!=='function')throw new Error(label('ارتباط امن پنل هنوز آماده نیست.','The secure admin connection is not ready.','Sigurna veza panela još nije spremna.'));
  return rows(await authFetch('/rest/v1/sermons?select=*&order=updated_at.desc&limit=1000',{method:'GET',headers:{'Cache-Control':'no-store'}}));
}
async function readCategories(){
  if(typeof authFetch!=='function')throw new Error(label('ارتباط امن پنل هنوز آماده نیست.','The secure admin connection is not ready.','Sigurna veza panela još nije spremna.'));
  return rows(await authFetch('/rest/v1/sermon_categories?select=*&order=sort_order.asc,created_at.desc&limit=500',{method:'GET',headers:{'Cache-Control':'no-store'}}));
}
async function readSermon(id){
  if(!id)return null;
  const list=rows(await authFetch(`/rest/v1/sermons?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,{method:'GET',headers:{'Cache-Control':'no-store'}}));
  return list[0]||null;
}
async function publishSermon(row){
  if(!row?.id)return null;
  const payload={is_published:true,published_at:row.published_at||nowIso(),updated_at:nowIso()};
  await authFetch(`/rest/v1/sermons?id=eq.${encodeURIComponent(row.id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
  return readSermon(row.id);
}
async function probeAudio(url){
  url=clean(url);
  if(!url)return{ok:false,status:0,reason:'missing_url'};
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch(url,{method:'GET',headers:{Range:'bytes=0-0'},cache:'no-store',signal:controller.signal});
    try{await response.body?.cancel?.()}catch(_){}
    return{ok:response.ok||response.status===206,status:response.status,type:response.headers.get('content-type')||''};
  }catch(error){
    return{ok:false,status:0,reason:error?.name==='AbortError'?'timeout':clean(error?.message||error)};
  }finally{clearTimeout(timer)}
}
function mergeState(latest){
  try{
    if(!latest?.id||typeof state==='undefined')return;
    const index=rows(state.sermons).findIndex(row=>String(row?.id)===String(latest.id));
    if(index>=0)state.sermons[index]=latest;else state.sermons.unshift(latest);
  }catch(_){}
}
function setPanelMessage(message,type='success'){
  try{if(typeof setMessage==='function')setMessage(message,type)}catch(_){}
}
function expectedSingle(beforeIds,editId,title,categoryId,list){
  if(editId)return list.find(row=>String(row?.id)===String(editId))||null;
  const candidates=list.filter(row=>!beforeIds.has(String(row?.id)));
  return candidates.find(row=>lower(row?.title_fa)===lower(title)&&String(row?.category_id||'')===String(categoryId||''))
    ||candidates.find(row=>lower(row?.title_fa)===lower(title))
    ||candidates[0]
    ||null;
}
async function verifyOne(row,{intendedPublished=false,selectedAudio=false}={}){
  if(!row?.id)return{ok:false,row:null,issues:['missing_database_row']};
  let latest=await readSermon(row.id)||row;
  const issues=[];
  if(intendedPublished&&latest.is_published!==true){
    latest=await publishSermon(latest)||latest;
    if(latest.is_published!==true)issues.push('not_published');
  }
  if(selectedAudio&&!clean(latest.audio_url))issues.push('missing_audio_url');
  if(!hasSource(latest))issues.push('missing_playable_source');
  let media={ok:true,status:null};
  if(clean(latest.audio_url)){
    media=await probeAudio(latest.audio_url);
    if(!media.ok)issues.push(`audio_http_${media.status||media.reason||'failed'}`);
  }
  mergeState(latest);
  return{ok:issues.length===0,row:latest,issues,media};
}
function issueText(result){
  const map={
    missing_database_row:label('رکورد در دیتابیس پیدا نشد','Database row was not found','Zapis nije pronađen u bazi'),
    not_published:label('وضعیت انتشار فعال نشد','Publication status was not activated','Status objave nije aktiviran'),
    missing_audio_url:label('آدرس فایل صوتی در رکورد ذخیره نشده','Audio URL was not saved in the record','Audio URL nije spremljen'),
    missing_playable_source:label('هیچ فایل صوتی یا لینک YouTube ثبت نشده','No audio file or YouTube link is saved','Nije spremljen audio ni YouTube poveznica')
  };
  return result.issues.map(code=>map[code]||(code.startsWith('audio_http_')?label(`فایل صوتی پاسخ معتبر نداد (${code.replace('audio_http_','')})`,`Audio file did not return a valid response (${code.replace('audio_http_','')})`,`Audio datoteka nije vratila valjan odgovor (${code.replace('audio_http_','')})`):code)).join('؛ ');
}

async function wrappedSaveSermon(){
  if(wrappedSaveSermon.__busy)return;
  wrappedSaveSermon.__busy=true;
  const before=currentSermons();
  const beforeIds=new Set(before.map(row=>String(row?.id)));
  let editId='',title='',categoryId='',intendedPublished=true,selectedAudio=false;
  try{
    try{if(typeof captureSermonDraft==='function')captureSermonDraft()}catch(_){}
    try{editId=clean(editingSermonId)}catch(_){}
    try{title=clean(sermonDraft?.title_fa)}catch(_){}
    try{categoryId=clean(sermonDraft?.category_id)}catch(_){}
    try{intendedPublished=sermonDraft?.is_published!==false}catch(_){intendedPublished=true}
    try{selectedAudio=Boolean(sermonAudioFile)}catch(_){}

    await originalSave.apply(this,arguments);

    const latestRows=await readSermons();
    const candidate=expectedSingle(beforeIds,editId,title,categoryId,latestRows);
    if(!candidate){
      alert(label('پنل پیام ذخیره نشان داد، اما رکورد تازه در دیتابیس تأیید نشد. فایل و فرم را دوباره بررسی کنید.','The panel reported saved, but the new database row could not be verified. Please review the file and form.','Panel je prijavio spremanje, ali novi zapis nije potvrđen u bazi.'));
      return;
    }
    const result=await verifyOne(candidate,{intendedPublished,selectedAudio});
    if(!result.ok){
      alert(label(`موعظه ذخیره شد، اما برای نمایش در اپ نیاز به بررسی دارد:\n${issueText(result)}`,`The sermon was saved, but it needs attention before it can appear in the app:\n${issueText(result)}`,`Propovijed je spremljena, ali je potrebna provjera:\n${issueText(result)}`));
      return;
    }
    setPanelMessage(label('ذخیره، انتشار و دسترسی فایل صوتی تأیید شد.','Save, publication, and audio access were verified.','Spremanje, objava i pristup audiju su potvrđeni.'),'success');
    try{if(typeof render==='function')render()}catch(_){}
  }catch(error){
    console.error('[NH7 sermon integrity] save verification failed',error);
    alert(label(`بررسی نهایی ذخیره انجام نشد: ${clean(error?.message||error)}`,`Final save verification failed: ${clean(error?.message||error)}`,`Završna provjera nije uspjela: ${clean(error?.message||error)}`));
  }finally{wrappedSaveSermon.__busy=false}
}

async function wrappedBulkUpload(){
  if(wrappedBulkUpload.__busy)return;
  wrappedBulkUpload.__busy=true;
  const beforeIds=new Set(currentSermons().map(row=>String(row?.id)));
  let files=[],categoryId='',intendedPublished=true;
  try{
    try{if(typeof nh7CaptureBulkDraft==='function')nh7CaptureBulkDraft()}catch(_){}
    try{files=Array.from(sermonBulkFiles||[])}catch(_){files=[]}
    try{categoryId=clean(nh7BulkAudioDraft?.category_id||sermonBulkDraft?.category_id)}catch(_){}
    try{intendedPublished=(nh7BulkAudioDraft?.published??sermonBulkDraft?.published)!==false}catch(_){intendedPublished=true}

    await originalBulk.apply(this,arguments);

    if(!files.length||!categoryId)return;
    const latestRows=await readSermons();
    const created=latestRows.filter(row=>!beforeIds.has(String(row?.id))&&String(row?.category_id||'')===String(categoryId));
    const issues=[];
    for(const row of created){
      const result=await verifyOne(row,{intendedPublished,selectedAudio:true});
      if(!result.ok)issues.push(`${sermonTitle(result.row||row)}: ${issueText(result)}`);
    }
    if(!created.length){
      issues.push(label('هیچ رکورد تازه‌ای برای فایل‌های انتخاب‌شده پیدا نشد.','No new database record was found for the selected files.','Nije pronađen novi zapis za odabrane datoteke.'));
    }
    if(issues.length){
      alert(label(`بررسی نهایی آپلود گروهی:\n${issues.slice(0,12).join('\n')}`,`Bulk upload verification:\n${issues.slice(0,12).join('\n')}`,`Provjera skupnog prijenosa:\n${issues.slice(0,12).join('\n')}`));
    }else{
      setPanelMessage(label(`نمایش ${created.length} فایل صوتی تازه در اپ تأیید شد.`,`Verified ${created.length} new audio items for app display.`,`Potvrđen prikaz ${created.length} novih audio zapisa.`),'success');
    }
    try{if(typeof loadAll==='function')await loadAll(true)}catch(_){}
  }catch(error){
    console.error('[NH7 sermon integrity] bulk verification failed',error);
    alert(label(`بررسی نهایی آپلود گروهی انجام نشد: ${clean(error?.message||error)}`,`Bulk upload verification failed: ${clean(error?.message||error)}`,`Provjera skupnog prijenosa nije uspjela: ${clean(error?.message||error)}`));
  }finally{wrappedBulkUpload.__busy=false}
}

function diagnostics(){
  const sermons=currentSermons(),categories=currentCategories();
  const published=sermons.filter(row=>row?.is_published===true).length;
  const unpublished=sermons.filter(row=>row?.is_published!==true).length;
  const missing=sermons.filter(row=>!hasSource(row)).length;
  const recentUnpublished=sermons.filter(row=>isRecent(row)&&hasSource(row)&&row?.is_published!==true);
  const targeted=recentUnpublished.filter(row=>isTargetCategory(categories.find(c=>String(c?.id)===String(row?.category_id))));
  return{total:sermons.length,published,unpublished,missing,recentUnpublished,targeted};
}
function diagnosticsCard(){
  const d=diagnostics();
  const warning=d.targeted.length||d.recentUnpublished.length;
  return `<section id="nh7SermonIntegrityV421" class="panel-card" style="border-color:${warning?'#f59e0b':'#b7e4c7'}"><div class="req-head"><div><h3>${warning?'⚠️':'✅'} ${escaped(label('سلامت انتشار فایل‌های صوتی','Audio publication health','Provjera objave audio sadržaja'))}</h3><p class="muted small">${escaped(label('این بررسی فقط موعظه‌ها و فایل‌های صوتی را کنترل می‌کند و به بخش‌های دیگر پنل دست نمی‌زند.','This check is limited to sermons and audio files; it does not change other panel modules.','Ova provjera obuhvaća samo propovijedi i audio zapise.'))}</p></div><span class="pill ${warning?'pending':'approved'}">v4.2.1</span></div><div class="exam-results-grid"><div class="stat"><b>${d.total}</b><span>${escaped(label('کل موارد','Total','Ukupno'))}</span></div><div class="stat"><b>${d.published}</b><span>${escaped(label('منتشرشده','Published','Objavljeno'))}</span></div><div class="stat ${d.unpublished?'alert-stat':''}"><b>${d.unpublished}</b><span>${escaped(label('منتشرنشده','Unpublished','Neobjavljeno'))}</span></div><div class="stat ${d.missing?'alert-stat':''}"><b>${d.missing}</b><span>${escaped(label('بدون فایل/لینک','No source','Bez izvora'))}</span></div></div>${warning?`<div class="notice"><strong>${escaped(label('فایل صوتی منتشرنشده اخیر پیدا شد: ','Recent unpublished audio found: ','Pronađen je nedavno neobjavljeni audio: '))}${d.recentUnpublished.length}</strong></div>`:''}<div class="actions"><button type="button" class="btn primary" onclick="nh7RepairRecentSermonVisibilityV421()">🔎 ${escaped(label('بررسی و اصلاح نمایش موارد اخیر','Check and repair recent visibility','Provjeri i popravi nedavne zapise'))}</button><button type="button" class="btn secondary" onclick="Promise.resolve(loadAll(true)).then(()=>render())">⟳ ${escaped(label('تازه‌سازی وضعیت','Refresh status','Osvježi status'))}</button></div></section>`;
}
function wrappedRenderSermons(){
  const html=originalRenderSermons.apply(this,arguments);
  return diagnosticsCard()+html;
}

async function repairRecent(){
  if(repairRecent.__busy)return;
  repairRecent.__busy=true;
  try{
    setPanelMessage(label('در حال بررسی فایل‌های صوتی اخیر…','Checking recent audio files…','Provjera nedavnih audio zapisa…'));
    const [categories,sermons]=await Promise.all([readCategories(),readSermons()]);
    try{state.categories=categories;state.sermons=sermons}catch(_){}
    const categoryMap=new Map(categories.map(category=>[String(category?.id),category]));
    const recent=sermons.filter(row=>isRecent(row)&&hasSource(row)&&row?.is_published!==true);
    const targeted=recent.filter(row=>isTargetCategory(categoryMap.get(String(row?.category_id))));
    const candidates=targeted.length?targeted:recent;
    if(!candidates.length){
      alert(label('هیچ فایل صوتی منتشرنشده‌ای در ۱۴ روز اخیر پیدا نشد. وضعیت انتشار رکوردهای اخیر سالم است.','No unpublished audio was found in the last 14 days. Recent publication status is healthy.','U posljednjih 14 dana nije pronađen neobjavljeni audio.'));
      return;
    }
    const preview=candidates.slice(0,20).map((row,index)=>`${index+1}. ${sermonTitle(row)} — ${categoryName(categoryMap.get(String(row?.category_id)))}`).join('\n');
    const question=label(`این موارد فایل صوتی دارند ولی منتشر نشده‌اند و در اپ نمایش داده نمی‌شوند:\n\n${preview}\n\nاین ${candidates.length} مورد منتشر شوند؟`,`These items have audio but are unpublished, so they cannot appear in the app:\n\n${preview}\n\nPublish these ${candidates.length} items?`,`Ovi zapisi imaju audio, ali nisu objavljeni:\n\n${preview}\n\nObjaviti ${candidates.length} zapisa?`);
    if(!confirm(question))return;
    const repaired=[],failed=[];
    for(const row of candidates){
      try{
        const latest=await publishSermon(row);
        const result=await verifyOne(latest||row,{intendedPublished:true,selectedAudio:Boolean(clean(row.audio_url))});
        if(result.ok)repaired.push(result.row);else failed.push(`${sermonTitle(row)}: ${issueText(result)}`);
      }catch(error){failed.push(`${sermonTitle(row)}: ${clean(error?.message||error)}`)}
    }
    const fresh=await readSermons();
    try{state.sermons=fresh}catch(_){}
    try{if(typeof render==='function')render()}catch(_){}
    if(failed.length){
      alert(label(`منتشر شد: ${repaired.length}\nنیازمند بررسی: ${failed.length}\n\n${failed.slice(0,12).join('\n')}`,`Published: ${repaired.length}\nNeeds attention: ${failed.length}\n\n${failed.slice(0,12).join('\n')}`,`Objavljeno: ${repaired.length}\nPotrebna provjera: ${failed.length}\n\n${failed.slice(0,12).join('\n')}`));
    }else{
      alert(label(`${repaired.length} فایل صوتی منتشر و دسترسی آنها تأیید شد. اکنون باید در اپ کاربران نمایش داده شوند.`,`${repaired.length} audio items were published and verified. They should now appear in the user app.`,`Objavljeno i potvrđeno audio zapisa: ${repaired.length}. Sada bi trebali biti vidljivi u aplikaciji.`));
    }
  }catch(error){
    console.error('[NH7 sermon integrity] repair failed',error);
    alert(label(`بررسی و اصلاح انجام نشد: ${clean(error?.message||error)}`,`Check and repair failed: ${clean(error?.message||error)}`,`Provjera i popravak nisu uspjeli: ${clean(error?.message||error)}`));
  }finally{repairRecent.__busy=false}
}

function install(){
  if(installing)return;
  installing=true;
  try{
    if(typeof saveSermon!=='function'||typeof uploadBulkSermonAudio!=='function'||typeof renderSermons!=='function'||typeof authFetch!=='function')return false;
    if(!originalSave)originalSave=saveSermon;
    if(!originalBulk)originalBulk=uploadBulkSermonAudio;
    if(!originalRenderSermons)originalRenderSermons=renderSermons;
    if(saveSermon!==wrappedSaveSermon)saveSermon=window.saveSermon=wrappedSaveSermon;
    if(uploadBulkSermonAudio!==wrappedBulkUpload)uploadBulkSermonAudio=window.uploadBulkSermonAudio=wrappedBulkUpload;
    if(renderSermons!==wrappedRenderSermons)renderSermons=window.renderSermons=wrappedRenderSermons;
    window.nh7RepairRecentSermonVisibilityV421=repairRecent;
    window.NH7_ADMIN_SERMON_INTEGRITY_VERSION=VERSION;
    installed=true;
    try{if(typeof render==='function')render()}catch(_){}
    return true;
  }finally{installing=false}
}

let attempts=0;
const timer=setInterval(()=>{attempts++;if(install()||attempts>120)clearInterval(timer)},250);
window.addEventListener('pageshow',install);
window.addEventListener('focus',install);
setTimeout(install,0);
})();
