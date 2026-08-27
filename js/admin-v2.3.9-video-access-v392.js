/* New Hope 7 Admin — person-specific, multi-video access v3.9.2 */
(()=>{'use strict';
const VERSION='3.9.2-person-video-access';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const E=value=>typeof h==='function'?h(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const EMAIL=value=>String(value||'').trim().toLowerCase();
let students=[],loaded=false,loading=false,selectedEmail='',allVideos=false,selectedVideos=new Set(),created=null,installed=false,lastError='';

function ensureState(){
  if(typeof state!=='object'||!state)return null;
  state.videoFinalV316=state.videoFinalV316&&typeof state.videoFinalV316==='object'?state.videoFinalV316:{videos:[],codes:[],orphans:[],loaded:false,error:''};
  return state.videoFinalV316;
}
function unwrap(value){let data=value;for(let i=0;i<4&&Array.isArray(data)&&data.length===1;i++)data=data[0];return Array.isArray(data)?data:[]}
function videos(){return (ensureState()?.videos||[]).filter(v=>v&&v.id&&v.is_active!==false&&v.is_published!==false)}
function videoTitle(row){return row?.['title_'+(typeof lang!=='undefined'?lang:'fa')]||row?.title_fa||row?.title_en||row?.title_hr||row?.file_name||L('ویدیو','Video','Video')}
function findVideo(id){return videos().find(v=>String(v.id)===String(id))}
function dateText(value){if(!value)return'';const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleString(typeof lang!=='undefined'&&lang==='fa'?'fa-IR':typeof lang!=='undefined'&&lang==='hr'?'hr-HR':'en-US')}

function injectStyle(){
  if(document.getElementById('nh7VideoAccess392Style'))return;
  const style=document.createElement('style');style.id='nh7VideoAccess392Style';style.textContent=`
  .nh7-v392-access{margin:0 0 14px;padding:14px;border:2px solid #0f766e;border-radius:18px;background:linear-gradient(135deg,#ecfdf3,#eef8ff)}
  .nh7-v392-access h4{margin:0 0 5px;color:#075b50}.nh7-v392-access p{margin:0 0 10px;color:#475467;line-height:1.6}
  .nh7-v392-grid{display:grid;grid-template-columns:minmax(220px,1fr) minmax(220px,1fr);gap:10px}.nh7-v392-grid label{display:block;font-weight:800;color:#344054}
  .nh7-v392-video-box{margin-top:10px;padding:10px;border:1px solid #cfe4e2;border-radius:14px;background:#fff}.nh7-v392-video-head{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between}
  .nh7-v392-video-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:9px}.nh7-v392-video-list label{display:flex;align-items:flex-start;gap:7px;padding:9px;border:1px solid #e1eceb;border-radius:12px;background:#f9fcfc;font-weight:700}.nh7-v392-video-list input{width:20px;height:20px;flex:0 0 20px;margin:1px 0}
  .nh7-v392-all{display:flex!important;align-items:center;gap:7px}.nh7-v392-all input{width:20px;height:20px;margin:0}
  .nh7-v392-created{margin:10px 0;padding:12px;border-radius:14px;background:#ecfdf3;color:#067647}.nh7-v392-created code{display:block;margin:8px 0;padding:10px;background:#fff;border-radius:10px;color:#0b5faa;word-break:break-all}
  .nh7-v392-meta{margin:9px 0;padding:10px;border-radius:13px;background:#f7fafc;border:1px solid #e5eaef;color:#344054;line-height:1.65}.nh7-v392-meta small{display:block;color:#667085;margin-top:3px}
  #nh7-v316-code-video{display:none!important}
  @media(max-width:700px){.nh7-v392-grid,.nh7-v392-video-list{grid-template-columns:1fr}}
  `;document.head.appendChild(style)
}

async function loadStudents(force=false){
  if(loading||(!force&&loaded)||typeof token==='undefined'||!token)return;
  loading=true;lastError='';
  try{students=unwrap(await adminRpc('nh7_admin_video_student_options_v317',{}));loaded=true}
  catch(error){students=[];loaded=true;lastError=error?.message||String(error)}
  finally{loading=false;mount()}
}
function studentOptions(){
  const rows=students.slice().sort((a,b)=>String(a.name||a.email).localeCompare(String(b.name||b.email),typeof lang!=='undefined'&&lang==='fa'?'fa':'en'));
  return `<option value="">${E(L('دانشجوی تأییدشده را انتخاب کنید','Select an approved student','Odaberite odobrenog studenta'))}</option>`+rows.map(row=>`<option value="${E(row.email)}" data-name="${E(row.name||row.email)}" data-account="${row.has_account?'1':'0'}" ${EMAIL(row.email)===selectedEmail?'selected':''}>${E(row.name||row.email)} · ${E(row.email)}${row.has_account?'':` · ${E(L('بدون حساب فعال','no active account','bez aktivnog računa'))}`}</option>`).join('')
}
function videoList(){
  const rows=videos();
  if(!rows.length)return `<div class="empty">${E(L('ویدیوی منتشرشده‌ای وجود ندارد.','No published video is available.','Nema objavljenih videozapisa.'))}</div>`;
  return rows.map(row=>`<label><input type="checkbox" data-v392-video value="${E(row.id)}" ${selectedVideos.has(String(row.id))?'checked':''} ${allVideos?'disabled':''}><span>${E(videoTitle(row))}</span></label>`).join('')
}
function panelHtml(){return `<section class="nh7-v392-access" data-v392-access><h4>👤 ${E(L('دسترسی اختصاصی ویدیو برای یک دانشجو','Personal video access for one student','Osobni pristup videu za jednog studenta'))}</h4><p>${E(L('رمز به حساب انتخاب‌شده متصل است و در اولین استفاده روی همان دستگاه قفل می‌شود. می‌توانید یک، چند یا همه ویدیوها را مجاز کنید.','The password is tied to the selected account and binds to its first device. You can allow one, several, or all videos.','Lozinka je vezana uz odabrani račun i prvi uređaj. Možete dopustiti jedan, više ili sve videozapise.'))}</p><div class="nh7-v392-grid"><label>${E(L('دانشجو','Student','Student'))}<select data-v392-student>${studentOptions()}</select></label><div>${loading?E(L('در حال دریافت دانشجویان…','Loading students…','Učitavanje studenata…')):lastError?`<div class="notice">${E(lastError)}</div>`:`<button type="button" class="btn secondary" data-v392-reload>⟳ ${E(L('تازه‌سازی فهرست','Refresh students','Osvježi studente'))}</button>`}</div></div><div class="nh7-v392-video-box"><div class="nh7-v392-video-head"><strong>🎬 ${E(L('ویدیوهای مجاز','Allowed videos','Dopušteni videozapisi'))}</strong><label class="nh7-v392-all"><input type="checkbox" data-v392-all ${allVideos?'checked':''}> ${E(L('همه ویدیوهای منتشرشده','All published videos','Svi objavljeni videozapisi'))}</label></div><div class="nh7-v392-video-list">${videoList()}</div></div></section>`}
function createdHtml(){if(!created)return'';const scope=created.all?L('همه ویدیوها','All videos','Svi videozapisi'):created.videoIds.map(id=>videoTitle(findVideo(id))).filter(Boolean).join(' · ');return `<div class="nh7-v392-created" data-v392-created><strong>✓ ${E(L('رمز اختصاصی ساخته شد','Personal password created','Osobna lozinka je izrađena'))}</strong><div>${E(created.name)} · ${E(created.email)}</div><div>${E(scope)}</div><code class="ltr">${E(created.code)}</code><button type="button" class="btn secondary" data-v392-copy>📋 ${E(L('کپی رمز','Copy password','Kopiraj lozinku'))}</button></div>`}

function scopeText(row){
  const ids=Array.isArray(row?.video_ids)?row.video_ids.map(String):[];
  if(row?.scope_mode==='all'||(!ids.length&&!row?.video_id))return L('همه ویدیوها','All videos','Svi videozapisi');
  const names=(ids.length?ids:[row.video_id]).map(id=>videoTitle(findVideo(id))).filter(Boolean);
  return names.length?names.join(' · '):`${Number(row?.video_count||names.length||1)} ${L('ویدیو','video(s)','videozapisa')}`
}
function decorateCodes(root){
  const rows=ensureState()?.codes||[],cards=[...root.querySelectorAll(':scope > article.request-card')];
  cards.forEach((card,index)=>{
    const row=rows[index];if(!row)return;card.querySelector('.nh7-v392-meta')?.remove();
    const target=row.target_email?`${row.target_name||row.target_email} · ${row.target_email}`:L('رمز قدیمی عمومی','Legacy general password','Stara opća lozinka');
    const device=row.bound_device_id?`${L('دستگاه متصل','Bound device','Povezani uređaj')}: •••${String(row.bound_device_id).slice(-8)}`:L('هنوز روی دستگاهی فعال نشده','Not activated on a device yet','Još nije aktivirano na uređaju');
    const activity=[row.granted_at?`${L('فعال‌سازی','Activated','Aktivirano')}: ${dateText(row.granted_at)}`:'',row.last_used_at?`${L('آخرین استفاده','Last used','Zadnje korištenje')}: ${dateText(row.last_used_at)}`:''].filter(Boolean).join(' · ');
    const box=document.createElement('div');box.className='nh7-v392-meta';box.innerHTML=`<strong>👤 ${E(target)}</strong><small>🎬 ${E(scopeText(row))}</small><small>📱 ${E(device)}</small>${activity?`<small>${E(activity)}</small>`:''}`;card.querySelector('.req-head')?.insertAdjacentElement('afterend',box)
  })
}

function mount(){
  injectStyle();if(typeof activeTab==='undefined'||activeTab!=='videos')return;
  const root=document.getElementById('nh7-v316-codes');if(!root)return;
  let panel=root.querySelector('[data-v392-access]');
  if(!panel){const holder=document.createElement('div');holder.innerHTML=panelHtml();panel=holder.firstElementChild;root.insertAdjacentElement('afterbegin',panel)}
  else{
    const sel=panel.querySelector('[data-v392-student]');if(sel){sel.innerHTML=studentOptions();sel.value=selectedEmail}
    const list=panel.querySelector('.nh7-v392-video-list');if(list)list.innerHTML=videoList();
  }
  root.querySelector('[data-v392-created]')?.remove();if(created)panel.insertAdjacentHTML('afterend',createdHtml());
  const create=root.querySelector('button[onclick="nh7V316CreateCode()"]');if(create){create.setAttribute('onclick','nh7V392CreatePersonCode()');create.textContent='＋ '+L('ساخت رمز اختصاصی','Create personal password','Stvori osobnu lozinku')}
  const legacyVideo=root.querySelector('#nh7-v316-code-video');if(legacyVideo){legacyVideo.setAttribute('aria-hidden','true');legacyVideo.tabIndex=-1}
  decorateCodes(root);if(!loaded&&!loading)loadStudents()
}

window.nh7V392CreatePersonCode=async function(){
  const root=document.getElementById('nh7-v316-codes'),select=root?.querySelector('[data-v392-student]'),email=EMAIL(select?.value),option=select?.selectedOptions?.[0],name=String(option?.dataset?.name||email).trim(),hasAccount=option?.dataset?.account==='1',code=document.getElementById('nh7-v316-code')?.value.trim()||'',label=document.getElementById('nh7-v316-code-label')?.value.trim()||name,expires=document.getElementById('nh7-v316-code-expires')?.value||'';
  if(!email){alert(L('ابتدا یک دانشجو را انتخاب کنید.','Select a student first.','Najprije odaberite studenta.'));return}
  if(code.length<6){alert(L('رمز باید حداقل ۶ کاراکتر باشد.','Password must contain at least 6 characters.','Lozinka mora imati najmanje 6 znakova.'));return}
  const ids=allVideos?[]:[...selectedVideos].filter(id=>!!findVideo(id));
  if(!allVideos&&!ids.length){alert(L('حداقل یک ویدیو را انتخاب کنید یا «همه ویدیوها» را بزنید.','Select at least one video or choose “All videos”.','Odaberite barem jedan video ili “Svi videozapisi”.'));return}
  if(!hasAccount&&!confirm(L('این دانشجو هنوز حساب فعال شناخته‌شده ندارد. رمز برای همین ایمیل ساخته شود؟','This student does not have a recognized active account yet. Create the password for this email anyway?','Student još nema prepoznat aktivan račun. Ipak izraditi lozinku za ovaj e-mail?')))return;
  try{
    await adminRpc('nh7_admin_school_video_create_person_code_v392',{p_label:label,p_plain_code:code,p_target_email:email,p_target_name:name,p_expires_at:expires?new Date(expires).toISOString():null,p_video_ids:allVideos?null:ids});
    created={code,email,name,all:allVideos,videoIds:ids};selectedEmail=email;document.getElementById('nh7-v316-code').value='';await window.nh7V316Load?.();setTimeout(mount,120)
  }catch(error){alert(error?.message||String(error))}
};
window.nh7V392ReloadStudents=()=>{loaded=false;students=[];loadStudents(true)};

function onClick(event){
  const root=event.target.closest?.('#nh7-v316-codes');if(!root)return;
  if(event.target.closest?.('[data-v392-reload]')){event.preventDefault();loaded=false;students=[];loadStudents(true);return}
  if(event.target.closest?.('[data-v392-copy]')){event.preventDefault();if(!created?.code)return;navigator.clipboard?.writeText(created.code).then(()=>alert(L('رمز کپی شد.','Password copied.','Lozinka je kopirana.'))).catch(()=>prompt(L('رمز را کپی کنید:','Copy the password:','Kopirajte lozinku:'),created.code));return}
  const all=event.target.closest?.('[data-v392-all]');if(all){allVideos=!!all.checked;mount();return}
  const video=event.target.closest?.('[data-v392-video]');if(video){if(video.checked)selectedVideos.add(String(video.value));else selectedVideos.delete(String(video.value));return}
}
function onChange(event){
  const select=event.target.closest?.('[data-v392-student]');if(!select)return;selectedEmail=EMAIL(select.value);const option=select.selectedOptions?.[0],name=String(option?.dataset?.name||'');const label=document.getElementById('nh7-v316-code-label');if(label&&name&&!label.value.trim())label.value=name
}
document.addEventListener('click',onClick,true);document.addEventListener('change',onChange,true);
const observer=new MutationObserver(()=>requestAnimationFrame(mount));observer.observe(document.documentElement,{childList:true,subtree:true});
function install(){if(installed||typeof render!=='function')return false;installed=true;const oldRender=render;render=window.render=function(...args){const out=oldRender.apply(this,args);requestAnimationFrame(mount);return out};if(typeof setTab==='function'){const oldSetTab=setTab;setTab=window.setTab=function(id){const out=oldSetTab(id);if(id==='videos')requestAnimationFrame(mount);return out}}window.NH7_ADMIN_VIDEO_ACCESS_VERSION=VERSION;requestAnimationFrame(mount);return true}
let tries=0;const boot=()=>{tries++;if(install())return;if(tries<40)setTimeout(boot,50)};boot();
})();
