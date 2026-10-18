/* Batch3A: current account surfaces, retained Inbox history and optional native badges.
   No provider activation, polling, role inference, data migration or backend capability switch. */
(()=>{'use strict';
const ctx=()=>window.NH7UserContextWave6,who=()=>ctx()?.identity(),same=i=>!!i&&ctx()?.current(i),lang=()=>localStorage.getItem('nh7_lang')||'en';
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parse=(v,f)=>{try{return JSON.parse(v)??f}catch{return f}};
const categoryLabel=value=>({daily_word:L('کلام روزانه','Daily Word','Dnevna Riječ'),faith:L('اعلان ایمان','Faith','Vjera'),gratitude:L('شکرگزاری','Gratitude','Zahvalnost'),school:L('مدرسه','School','Škola'),meeting:L('جلسات','Meetings','Sastanci'),audio:L('پیام صوتی','Audio message','Audio poruka')}[value]||L('پیام','Message','Poruka'));
const scope=()=>encodeURIComponent(who()?.owner||'guest');
const qkey=()=> 'nh7_my_questions_batch3a:'+scope(),removedKey=()=> 'nh7_qa_removed_batch3a:'+scope();
function questions(){const rows=parse(localStorage.getItem(qkey()),[]);return Array.isArray(rows)?rows:[]}
function saveQuestions(rows){localStorage.setItem(qkey(),JSON.stringify(rows))}
function filterQuestions(rows){const removed=new Set(parse(localStorage.getItem(removedKey()),[]));return rows.filter(r=>!removed.has(String(r.cloud_id||r.id)))}
function canWriteInbox(){const i=who();return !!i?.uid&&localStorage.getItem('nh7_inbox_uid_batch3a')==='uid:'+i.uid}
function inboxRows(){if(!canWriteInbox())return[];const rows=parse(localStorage.getItem('nh7_inbox_messages'),[]);return Array.isArray(rows)?rows:[]}
function publicQuestionKey(){return 'nh7_qna_public_batch3a:'+scope()}
function bindQuestions(root,api){root.querySelectorAll('[data-qa-delete3a]').forEach(b=>b.onclick=async()=>{
 const actor=who(),id=b.dataset.qaDelete3a;if(!actor?.uid||!api.current()||!confirm(L('پرسش و پاسخ آن از دید کاربران حذف شود؟','Remove this question and its answer from user views?','Ukloniti ovo pitanje i odgovor iz korisničkih prikaza?')))return;
 b.disabled=true;try{const out=await api.rpc('nh7_qa_remove_own_batch3a',{p_question_id:id});if(!same(actor)||!api.current())return;
 if(out?.removed!==true||String(out.question_id)!==id)throw Error('not_confirmed');
 const gone=parse(localStorage.getItem(removedKey()),[]);if(!gone.includes(id))gone.push(id);localStorage.setItem(removedKey(),JSON.stringify(gone));saveQuestions(filterQuestions(questions()));
 // Invalidate this account's public projection, not another account or unrelated cache.
 localStorage.removeItem(publicQuestionKey());await api.refresh();
 }catch{if(same(actor)&&api.current())alert(L('حذف تأیید نشد؛ پرسش محفوظ است. دوباره تلاش کنید یا با مدیر تماس بگیرید.','Removal was not confirmed. Your question is preserved. Retry or contact an administrator.','Uklanjanje nije potvrđeno. Pitanje je sačuvano. Pokušajte ponovno ili se obratite administratoru.'))}finally{if(b.isConnected)b.disabled=false}
})}
let desiredBadge=0,nativeChain=Promise.resolve(),nativeStatus='NATIVE_BRIDGE_UNAVAILABLE';
function nativeBadge(n){const badge=window.Capacitor?.Plugins?.Badge,cordova=window.cordova?.plugins?.notification?.badge;
 if(badge&&typeof badge.set==='function'){nativeStatus='PHYSICAL_NATIVE_QA_REQUIRED';return n===0&&badge.clear?badge.clear():badge.set({count:n})}
 if(cordova&&typeof cordova.set==='function'){nativeStatus='PHYSICAL_NATIVE_QA_REQUIRED';return new Promise((resolve,reject)=>{if(n===0&&cordova.clear)cordova.clear(resolve,reject);else cordova.set(n,resolve,reject)})}
 nativeStatus='NATIVE_BRIDGE_UNAVAILABLE';return Promise.resolve();
}
let badgeOwner='',lastNative=-1;
function badge(count){const actor=who(),owner=actor?.owner||'guest';count=actor?.uid?Math.max(0,Math.floor(Number(count)||0)):0;desiredBadge=count;
 if(owner===badgeOwner&&count===lastNative)return;badgeOwner=owner;lastNative=count;
 nativeChain=nativeChain.catch(()=>{}).then(()=>nativeBadge(desiredBadge)).catch(()=>{nativeStatus='NATIVE_BRIDGE_FAILED'});
 if(navigator.setAppBadge)try{Promise.resolve(count?navigator.setAppBadge(count):navigator.clearAppBadge?.()).catch(()=>{})}catch{}
}
function inbox(root,api){
 const actor=who(),safe=()=>same(actor)&&api.current();if(!safe())return;
 const params=history.state?.params||{},tab=params.tab==='archive'?'archive':'unread',id=String(params.message||'');let selected=api.rows().find(r=>String(r.id)===id);
 function mark(rows){if(!safe())return;const groups=new Set(rows.map(api.group)),at=new Date().toISOString(),pending=api.raw().filter(m=>groups.has(api.group(m))&&!m.read);
 if(!pending.length)return;api.set(api.raw().map(m=>groups.has(api.group(m))?{...m,read:true,readAt:m.readAt||at}:m));
 for(const m of pending)if(!String(m.id).startsWith('scheduled:'))void api.receipt(m.id,{read_at:at});api.badge();badge(window.NH7_INBOX_BADGE_SYNC?.count()||0);
 }
 if(selected){mark([selected]);selected={...selected,read:true}}
 const all=api.rows(),unread=all.filter(r=>!r.read),archive=all.filter(r=>r.read),rows=tab==='archive'?archive:unread;
 const destination=selected&&window.NH7NotificationContractWave4?.intent(selected.intent);
 const title=L('مرکز اعلان‌ها','Notification center','Centar obavijesti'),close=L('بازگشت به پیام‌ها','Back to messages','Natrag na poruke');
 const controls=`<div class="button-row" aria-label="${esc(title)}"><button class="secondary-btn" data-inbox-tab3a="unread" aria-pressed="${tab==='unread'}">${esc(L('خوانده‌نشده','Unread','Nepročitano'))} (${unread.length})</button><button class="secondary-btn" data-inbox-tab3a="archive" aria-pressed="${tab==='archive'}">${esc(L('آرشیو','Archive','Arhiva'))} (${archive.length})</button><button class="secondary-btn" id="markAllRead" ${unread.length?'':'disabled'}>${esc(L('خواندن همه','Mark all read','Označi sve pročitanim'))}</button></div>`;
 const cards=rows.map(m=>`<article class="inbox-item ${m.read?'read':'unread'}"><button type="button" class="list-btn" data-inbox3a data-inbox-open="${esc(m.id)}"><span aria-hidden="true">${m.read?'✉':'●'}</span><strong>${esc(m.title)}</strong><small>${api.time(m)}</small><span class="nh7-inbox-preview3a">${esc(String(m.body||'').slice(0,160))}</span><small>${esc(categoryLabel(m.category))}</small></button></article>`).join('');
 const detail=selected?`<section class="nh7-inbox-detail3a" id="inbox-${esc(id.replace(/[^a-zA-Z0-9_-]/g,'_'))}" tabindex="-1" aria-label="${esc(selected.title)}"><button class="secondary-btn" data-inbox-close3a>${esc(close)}</button><h3>${esc(selected.title)}</h3><small>${api.time(selected)}</small><p style="white-space:pre-wrap">${esc(selected.body)}</p>${destination?`<button class="primary-btn" data-inbox-destination="${esc(id)}">${esc(L('باز کردن مقصد','Open destination','Otvori odredište'))}</button>`:selected.intent?`<p role="status">${esc(L('این مقصد در دسترس نیست.','This destination is unavailable.','Ovo odredište nije dostupno.'))}</p>`:''}</section>`:id?`<p role="status">${esc(L('این پیام در دسترس این حساب نیست.','This message is unavailable for this account.','Ova poruka nije dostupna ovom računu.'))}</p>`:'';
 root.innerHTML=`<section class="card nh7-notification-center3a"><h2>${esc(title)}</h2>${window.NH7_INBOX_BADGE_SYNC?.storageBlocked?.()?`<p role="status">${esc(L('ذخیره‌سازی در دسترس نیست؛ پیام‌های حساب دیگر پنهان مانده‌اند. فضا را بررسی کنید و دوباره صندوق را باز کنید.','Storage is unavailable; other-account messages remain hidden. Check available space and reopen Inbox.','Pohrana nije dostupna; poruke drugog računa ostaju skrivene. Provjerite prostor i ponovno otvorite ulaznu poštu.'))}</p>`:''}${controls}${detail}<div class="list inbox-list">${cards||`<p class="muted">${esc(L('پیامی در این بخش نیست.','No messages in this section.','U ovom odjeljku nema poruka.'))}</p>`}</div></section>`;
 root.querySelectorAll('[data-inbox-open]').forEach(b=>b.onclick=()=>{if(safe())window.NH7_NAVIGATE?.('inbox',{tab,message:b.dataset.inboxOpen})});
 root.querySelectorAll('[data-inbox-tab3a]').forEach(b=>b.onclick=()=>{if(safe())window.NH7_NAVIGATE?.('inbox',{tab:b.dataset.inboxTab3a})});
 root.querySelector('#markAllRead').onclick=()=>{if(!safe())return;mark(unread);inbox(root,api)};
 root.querySelector('[data-inbox-close3a]')?.addEventListener('click',()=>{if(safe())window.NH7_NAVIGATE?.('inbox',{tab})});
 root.querySelector('.nh7-inbox-detail3a')?.focus({preventScroll:true});badge(window.NH7_INBOX_BADGE_SYNC?.count()||0);
}
function clear(){badge(0);document.querySelector('.nh7-notification-center3a')?.replaceChildren();document.querySelector('#nh7MyAccess3A')?.replaceChildren();document.querySelector('#qaQuestion')?.closest('.card')?.replaceChildren();}
for(const name of ['nh7-personal-before-owner-wave2','nh7-personal-owner-wave2'])addEventListener(name,clear);
addEventListener('nh7:inbox-badge',e=>badge(e.detail?.count||0));
addEventListener('storage',e=>{if(['nh7_user_session_v170','nh7_explicit_logout'].includes(e.key))clear()});
// Optional installed provider callback only; never initializes a provider or requests permission.
window.OneSignalDeferred=window.OneSignalDeferred||[];window.OneSignalDeferred.push(O=>O?.Notifications?.addEventListener?.('click',e=>{const data=e?.notification?.additionalData||{};if(data.nh7_intent||data.route)return;const id=data.nh7_message_id,actor=who();if(actor?.uid&&typeof id==='string'&&id.length<=200)void window.NH7_NAVIGATE?.('inbox',{message:id})}));
const style=document.createElement('style');style.textContent='.nh7-account-management3a{border-top:1px solid var(--line);margin-block-start:24px;padding-block-start:18px}.nh7-notification-center3a .inbox-item{padding:0;min-width:0}.nh7-notification-center3a .list-btn{width:100%;display:grid;gap:8px;text-align:start;overflow-wrap:anywhere;white-space:normal}.nh7-inbox-preview3a{opacity:.8;display:block}.nh7-inbox-detail3a{padding:16px;margin-block:16px;border:1px solid var(--line);border-radius:16px;overflow-wrap:anywhere}.nh7-notification-center3a button{min-height:44px;max-width:100%}#nh7MyAccess3A{min-width:0}#nh7DocumentsEntry3A{margin-block:12px}';document.head.append(style);
window.NH7Batch3A=Object.freeze({questions,saveQuestions,filterQuestions,publicQuestionKey,bindQuestions,inbox,inboxRows,canWriteInbox,badge,nativeStatus:()=>nativeStatus});
})();
