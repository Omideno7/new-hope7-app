/* School cycle transport: current-UID, server-scored, event-driven. No polling/auto-restart. */
(()=>{'use strict';if(window.NH7SchoolCyclesV580)return;
const verified=new Map(),memory=new Map();let epoch=0;
const context=()=>window.NH7_COMMUNITY_CTX_V502;
function identity(){const s=context()?.session?.();return s?.access_token&&s.user?.id&&localStorage.getItem('nh7_explicit_logout')!=='1'?String(s.user.id):''}
function ticket(){return{uid:identity(),epoch,route:JSON.stringify(history.state||{})}}
function current(t,route=false){return !!t?.uid&&t.uid===identity()&&t.epoch===epoch&&(!route||t.route===JSON.stringify(history.state||{}))}
function observe(value,t){if(!current(t))return;const b=value?.contract===580?value:typeof value?.school_cycle==='object'?value.school_cycle:typeof value?.cycle==='object'?value.cycle:value?.budget;if(b?.contract===580&&Number.isInteger(b.cycle)&&b.cycle>=0){if((verified.get(t.uid)?.cycle??0)>b.cycle)return false;verified.set(t.uid,{...b});try{localStorage.setItem('nh7_school_cycle_hint_v580:'+t.uid,String(b.cycle))}catch(_){}}return true}
function state(){return verified.get(identity())||null}
async function request(name,body={}){const t=ticket();if(!t.uid)throw Error('login_required');const rpc=context()?.cloudRpc;if(!rpc)throw Error('school_transport_not_ready');const result=await rpc(name,body);if(!current(t))throw Error('school_account_changed');if(observe(result,t)===false)throw Error('school_cycle_changed');return result}
const prefix='nh7_school_exam_pending_v580:';
function key(cycle,exam){return prefix+encodeURIComponent(identity())+':'+cycle+':'+encodeURIComponent(exam)}
function pending(cycle,exam){const k=key(cycle,exam);try{return memory.get(k)||JSON.parse(localStorage.getItem(k)||'null')}catch(_){return memory.get(k)||null}}
function store(k,value){memory.set(k,value);try{localStorage.setItem(k,JSON.stringify(value))}catch(_){throw Error('school_submission_recovery_unavailable')}}
async function submit(session,answers,classKey=null){
 const t=ticket(),exam=session?.exam,cycle=Number(session?.school_cycle??session?.cycle??state()?.cycle);
 if(!current(t)||!exam?._nh7_secure_server_scoring||!Number.isInteger(cycle))throw Error('verified_school_session_required');
 if(!navigator.onLine)throw Error('school_online_submission_required');
 const k=key(cycle,exam.id);let intent=pending(cycle,exam.id);
 if(intent&&(intent.uid!==t.uid||intent.cycle!==cycle||intent.exam!==exam.id))throw Error('school_pending_identity_mismatch');
 // A lost response must replay its original immutable payload, never silently consume another attempt.
 if(!intent){intent={uid:t.uid,cycle,exam:exam.id,request:crypto.randomUUID(),answers,classKey}}
 store(k,intent);
 const result=await request('nh7_school_submit_v580',{p_exam_id:intent.exam,p_answers:intent.answers,p_cycle:intent.cycle,p_request:intent.request,p_class_key:intent.classKey});
 if(!current(t))throw Error('school_account_changed');
 if(result?.ok!==true||result.submission_id!==intent.request||Number(result.school_cycle)!==cycle)throw Error('unverified_school_receipt');
 // Remove only this acknowledged operation, not Notes, history, downloads or other queued work.
 memory.delete(k);try{localStorage.removeItem(k)}catch(_){}
 return result;
}
function scopedDraft(lesson){const c=state()?.cycle||0;return c>0?'cycle:'+c+':'+lesson:lesson}
function cycleForView(){const raw=document.getElementById('view')?.dataset.schoolCycle;let hint=0;try{hint=Number(localStorage.getItem('nh7_school_cycle_hint_v580:'+identity())||0)}catch(_){}return Math.max(Number.isInteger(hint)&&hint>=0?hint:0,raw!==undefined&&/^\d+$/.test(raw)?Number(raw):0,state()?.cycle||0)}
// Persisted hints isolate offline drafts/history; they never authorize an RPC or count failures.
function filterSnapshot(snapshot){if(!snapshot)return snapshot;const cycle=Math.max(cycleForView(),Number(snapshot.school_cycle?.cycle||0));return {...snapshot,progress:(snapshot.progress||[]).filter(x=>Number(x.school_cycle||0)===cycle),assignments:(snapshot.assignments||[]).filter(x=>Number(x.school_cycle||0)===cycle)}}
async function restart(cycle){
 const t=ticket();if(!current(t)||!state())throw Error('verified_school_session_required');
 const text=copy('مدرسه از درس اول با تکالیف و آزمون‌های تازه آغاز می‌شود. تاریخچه و اطلاعات حساب حذف نمی‌شود. شروع دوباره را تأیید می‌کنید؟','Start again from lesson one with new assignments and exams? Previous history and account data are preserved.','Ponovno početi od prve lekcije s novim zadacima i ispitima? Povijest i podaci računa ostaju sačuvani.');
 if(!confirm(text))return null;
 const k='nh7_school_restart_pending_v580:'+t.uid+':'+cycle;let id;try{id=memory.get(k)||JSON.parse(localStorage.getItem(k)||'null')}catch(_){}if(!id){id=crypto.randomUUID();store(k,id)}
 const result=await request('nh7_school_restart_v580',{p_cycle:cycle,p_request:id,p_confirm:true});
 if(!current(t)||result?.ok!==true||result.state?.cycle!==cycle+1)throw Error('unverified_school_restart');
 observe({cycle:result.state},t);memory.delete(k);try{localStorage.removeItem(k)}catch(_){}return result;
}
function copy(fa,en,hr){const l=localStorage.getItem('nh7_lang');return l==='fa'?fa:l==='hr'?hr:en}
function budgetText(b){return b?.remaining_attempts===0?copy('سه فرصت عادی امتحان نهایی استفاده شده است. می‌توانید مدرسه را دوباره شروع کنید یا برای بررسی و فرصت بیشتر با ادمین مدرسه تماس بگیرید و منتظر بمانید.','The three normal final-exam attempts have been used. Restart School, or contact your School administrator and wait for review or an additional opportunity.','Iskorištena su tri redovna pokušaja završnog ispita. Ponovno započnite školu ili kontaktirajte administratora i pričekajte pregled ili dodatnu priliku.'):copy('فرصت باقی‌ماندهٔ امتحان نهایی: ','Final-exam attempts remaining: ','Preostali pokušaji završnog ispita: ')+String(b?.remaining_attempts??3)}
function appendBudget(parent,b,onRestart){if(!b||b.contract!==580)return;const box=document.createElement('section');box.className='notice';box.dataset.schoolBudget580='';const p=document.createElement('p');p.textContent=budgetText(b);box.append(p);if(b.remaining_attempts===0&&!b.admin_override){const button=document.createElement('button');button.type='button';button.className='secondary-btn';button.textContent=copy('شروع دوباره مدرسه','Restart School','Ponovno započni školu');button.onclick=async()=>{button.disabled=true;const t=ticket();try{const result=await restart(b.cycle);if(result&&current(t))onRestart?.(result)}catch(error){if(current(t)){p.textContent=copy('درخواست انجام نشد؛ بدون تغییر اطلاعات، دوباره تلاش کنید.','Request not completed. Your data is preserved; retry.','Zahtjev nije dovršen. Podaci su sačuvani; pokušajte ponovno.');console.warn('[School cycle]',error)}}finally{if(button.isConnected)button.disabled=false}};box.append(button)}parent.append(box)}
function fence(){epoch++;verified.clear();memory.clear();const view=document.getElementById('view');if(view)delete view.dataset.schoolCycle}
for(const name of ['nh7-personal-before-owner-wave2','nh7-personal-owner-wave2'])addEventListener(name,fence);
window.NH7SchoolCyclesV580=Object.freeze({ticket,current,observe,state,request,submit,pending,restart,appendBudget,cycleForView,filterSnapshot,scopedDraft,copy});
})();
