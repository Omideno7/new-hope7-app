/* New Hope 7 Admin v3.3.2 — exact registration duplicate cleanup with clear server result. */
(()=>{'use strict';
if(window.__NH7_ADMIN_REG_DEDUPE_V332__)return;
window.__NH7_ADMIN_REG_DEDUPE_V332__=true;
const VERSION='3.3.2-registration-dedupe';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const EMAIL=v=>String(v||'').trim().toLowerCase();
const payload=row=>{if(row?.payload&&typeof row.payload==='object')return row.payload;try{return JSON.parse(row?.payload||'{}')||{}}catch(_){return{}}};
const TYPE=row=>String(row?.type||payload(row).kind||'registration').trim().toLowerCase();
const EMAIL_OF=row=>EMAIL(payload(row).email||payload(row).user_email||row?.email||row?.user_email||'');
function rows(){return Array.isArray(state?.registrations)?state.registrations:[]}
function exactDuplicateCount(list=rows()){
  const counts=new Map();let extra=0;
  for(const row of list){
    const email=EMAIL_OF(row);if(!email)continue;
    const key=TYPE(row)+'|'+email,n=(counts.get(key)||0)+1;counts.set(key,n);if(n>1)extra++;
  }
  return extra;
}
function restore(y){requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:y,left:0,behavior:'auto'})))}
async function refreshAt(y){
  try{if(typeof loadAll==='function')await loadAll(true)}finally{restore(y)}
}
async function cleanAll(){
  const local=exactDuplicateCount(),y=window.scrollY;
  const question=local
    ?L(`درخواست‌های تکراری دقیق با همان ایمیل و همان نوع حذف شوند؟ تعداد فعلی: ${local}`,`Delete exact duplicate requests with the same email and request type? Current count: ${local}`,`Izbrisati točne duplikate s istim e-mailom i vrstom zahtjeva? Trenutno: ${local}`)
    :L('پاک‌سازی دقیق سرور بررسی شود؟ فقط رکوردهایی با همان ایمیل و همان نوع درخواست حذف می‌شوند؛ School و Meeting با هم ادغام نمی‌شوند.','Run exact server cleanup? Only rows with the same email and the same request type are deduplicated; School and Meeting are never merged.','Pokrenuti točno čišćenje? Brišu se samo zapisi s istim e-mailom i istom vrstom zahtjeva; School i Meeting se ne spajaju.');
  if(!confirm(question))return;
  try{
    if(typeof setMessage==='function')setMessage(L('در حال بررسی و پاک‌سازی تکراری‌ها…','Checking and cleaning duplicates…','Provjera i čišćenje duplikata…'));
    const result=await adminRpc('nh7_admin_cleanup_registration_duplicates_v331',{p_type:'',p_email:''});
    const count=Number(Array.isArray(result)?result[0]:result)||0;
    await refreshAt(y);
    const msg=count>0
      ?L(`✅ درخواست‌های تکراری حذف شدند: ${count}`,`✅ Duplicate requests removed: ${count}`,`✅ Duplikati su uklonjeni: ${count}`)
      :L('✅ بررسی انجام شد؛ تکراری دقیق با همان ایمیل و همان نوع درخواست وجود ندارد. درخواست‌های متفاوت مثل School/Meeting عمداً حذف نشدند.','✅ Check completed; there are no exact duplicates with the same email and request type. Different requests such as School/Meeting were intentionally kept.','✅ Provjera je završena; nema točnih duplikata s istim e-mailom i vrstom zahtjeva. Različiti zahtjevi poput School/Meeting namjerno su zadržani.');
    if(typeof setMessage==='function')setMessage(msg,'success');
    alert(msg);
  }catch(error){
    restore(y);
    const msg=error?.message||String(error);
    if(typeof setMessage==='function')setMessage(msg,'danger');
    alert(msg);
  }
}
async function cleanFor(email,type){
  email=EMAIL(email);type=String(type||'').trim().toLowerCase();
  if(!email)return;
  const y=window.scrollY;
  try{
    const result=await adminRpc('nh7_admin_cleanup_registration_duplicates_v331',{p_type:type,p_email:email});
    const count=Number(Array.isArray(result)?result[0]:result)||0;
    await refreshAt(y);
    const msg=count>0
      ?L(`✅ تکراری‌های این ایمیل حذف شدند: ${count}`,`✅ Duplicates for this email removed: ${count}`,`✅ Duplikati za ovaj e-mail uklonjeni: ${count}`)
      :L('برای این ایمیل و این نوع درخواست تکراری دقیقی وجود ندارد.','No exact duplicate exists for this email and request type.','Nema točnog duplikata za ovaj e-mail i vrstu zahtjeva.');
    if(typeof setMessage==='function')setMessage(msg,'success');
  }catch(error){
    restore(y);alert(error?.message||String(error));
  }
}
function install(){
  try{window.cleanupRegistrationDuplicates=cleanAll;cleanupRegistrationDuplicates=cleanAll}catch(_){}
  try{window.cleanupRegistrationDuplicatesFor=cleanFor;cleanupRegistrationDuplicatesFor=cleanFor}catch(_){}
}
new MutationObserver(()=>install()).observe(document.documentElement,{childList:true,subtree:true});
setTimeout(install,0);
window.NH7_ADMIN_REG_DEDUPE_VERSION=VERSION;
})();