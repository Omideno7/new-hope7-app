/* New Hope 7 — Sermon social layer preview v4.4.0
 * Adds Like, Blessing and Share without replacing the proven audio engine.
 */
(()=>{'use strict';
if(window.__NH7_SERMON_SOCIAL_V440__)return;
window.__NH7_SERMON_SOCIAL_V440__=true;

const SB='https://gpzcwffxnddhaeaogdyo.supabase.co';
const KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const AUTH_KEY='nh7_user_session_v170';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const cache=new Map();
let observerTimer=0;

const lang=()=>{const x=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(x)?x:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const session=()=>{try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'null')}catch(_){return null}};
const token=()=>session()?.access_token||'';
const signedIn=()=>!!token();

async function rpc(name,payload={},authRequired=false){
  const t=token();
  if(authRequired&&!t)throw Object.assign(new Error('login_required'),{code:'login_required'});
  const r=await fetch(SB+'/rest/v1/rpc/'+name,{
    method:'POST',
    headers:{apikey:KEY,Authorization:'Bearer '+(t||KEY),'Content-Type':'application/json',Prefer:'return=representation'},
    body:JSON.stringify(payload||{}),cache:'no-store'
  });
  const raw=await r.text();let data={};
  try{data=raw?JSON.parse(raw):{}}catch(_){data={message:raw}}
  if(!r.ok){const e=new Error(data?.message||data?.error||raw||r.statusText);e.code=data?.code||'';e.status=r.status;throw e}
  return Array.isArray(data)&&data.length===1?data[0]:data;
}

function titleOf(card){return String(card.querySelector('.sermon-card-copy strong,strong')?.textContent||L('موعظه صوتی','Audio sermon','Audio propovijed')).trim()}
function sermonId(card){const id=String(card?.dataset?.sermonCard||'');return UUID.test(id)?id:''}
function isSermonCard(card){return !!sermonId(card)&&!card.classList.contains('school-audio-card')}

function style(){
  if(document.getElementById('nh7SermonSocialV440Style'))return;
  const s=document.createElement('style');s.id='nh7SermonSocialV440Style';s.textContent=`
.nh7-social-v440{margin-top:12px;padding-top:12px;border-top:1px solid var(--line);display:grid;gap:10px}
.nh7-social-actions-v440{display:flex;gap:8px;flex-wrap:wrap}
.nh7-social-btn-v440{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:8px 12px;font:inherit;font-weight:800;display:inline-flex;align-items:center;gap:6px}
.nh7-social-btn-v440.is-liked{background:#fff0f3;color:#c51d49;border-color:#ffc2d0}
html[data-nh7-theme="dark"] .nh7-social-btn-v440{background:#0c1929;border-color:var(--nh7-dark-line);color:var(--nh7-dark-ink)}
html[data-nh7-theme="dark"] .nh7-social-btn-v440.is-liked{background:#3a1722;color:#ff9db6;border-color:#6b2d40}
.nh7-blessing-compose-v440{display:none;padding:12px;border:1px solid var(--line);border-radius:15px;background:rgba(127,127,127,.045)}
.nh7-blessing-compose-v440.is-open{display:grid;gap:8px}
.nh7-blessing-compose-v440 textarea{width:100%;min-height:82px;resize:vertical}
.nh7-blessing-submit-v440{justify-self:start}
.nh7-social-status-v440{font-size:.85rem;color:var(--muted);min-height:1.2em}
.nh7-blessing-list-v440{display:grid;gap:8px}
.nh7-blessing-item-v440{padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:rgba(127,127,127,.035)}
.nh7-blessing-head-v440{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:5px}
.nh7-blessing-head-v440 strong{font-size:.88rem}.nh7-blessing-head-v440 small{color:var(--muted)}
.nh7-blessing-item-v440 p{margin:0;white-space:pre-wrap;line-height:1.6}
.nh7-blessing-delete-v440{border:0;background:transparent;color:var(--danger);font:inherit;font-size:.78rem;font-weight:800;padding:4px 6px}
.nh7-social-login-v440{color:var(--muted);font-size:.82rem}
@media(max-width:480px){.nh7-social-actions-v440{display:grid;grid-template-columns:1fr 1fr}.nh7-social-btn-v440{justify-content:center}.nh7-social-actions-v440 .nh7-share-v440{grid-column:1/-1}}
`;document.head.appendChild(s)
}

function formatDate(v){try{return new Intl.DateTimeFormat(lang()==='fa'?'fa-IR':lang()==='hr'?'hr-HR':'en-US',{dateStyle:'medium'}).format(new Date(v))}catch(_){return''}}
function loginMessage(){return L('برای Like یا نوشتن برکت وارد حساب شوید.','Sign in to like or share a blessing.','Prijavite se za Like ili dijeljenje blagoslova.')}
function errorMessage(e){
  const x=String(e?.code||e?.message||'').toLowerCase();
  if(x.includes('login_required')||x.includes('jwt'))return loginMessage();
  if(x.includes('invalid_blessing_length'))return L('متن برکت باید بین ۲ تا ۸۰۰ نویسه باشد.','Blessing text must be 2–800 characters.','Tekst blagoslova mora imati 2–800 znakova.');
  return L('عملیات انجام نشد. دوباره تلاش کنید.','The action could not be completed. Try again.','Radnja nije uspjela. Pokušajte ponovno.');
}

function socialShell(card){
  let root=card.querySelector('[data-nh7-social-v440]');
  if(root)return root;
  root=document.createElement('section');root.className='nh7-social-v440';root.dataset.nh7SocialV440='1';
  root.innerHTML=`
    <div class="nh7-social-actions-v440">
      <button type="button" class="nh7-social-btn-v440" data-v440-like>♡ <span data-v440-like-count>0</span></button>
      <button type="button" class="nh7-social-btn-v440" data-v440-blessing>✍️ <span>${esc(L('اشتراک برکت','Share a Blessing','Podijeli blagoslov'))}</span></button>
      <button type="button" class="nh7-social-btn-v440 nh7-share-v440" data-v440-share>↗ <span>${esc(L('اشتراک','Share','Podijeli'))}</span></button>
    </div>
    <div class="nh7-blessing-compose-v440" data-v440-compose>
      <textarea maxlength="800" data-v440-text placeholder="${esc(L('این پیام چه برکتی برای شما داشت؟','How did this message bless you?','Kako vas je ova poruka blagoslovila?'))}"></textarea>
      <button type="button" class="primary-btn nh7-blessing-submit-v440" data-v440-submit>${esc(L('ارسال برکت','Post Blessing','Objavi blagoslov'))}</button>
      <small class="nh7-social-login-v440">${esc(signedIn()?'':loginMessage())}</small>
    </div>
    <div class="nh7-social-status-v440" data-v440-status></div>
    <div class="nh7-blessing-list-v440" data-v440-list></div>`;
  card.appendChild(root);bind(card,root);return root;
}

function render(card,state){
  const root=socialShell(card),like=root.querySelector('[data-v440-like]'),count=root.querySelector('[data-v440-like-count]');
  count.textContent=String(Number(state?.like_count||0));like.classList.toggle('is-liked',!!state?.liked)9like.firstChild.textContent=state?.liked?'♥ ':'♡ ';
  const list=root.querySelector('[data-v440-list]'),items=Array.isArray(state?.blessings)?state.blessings:[];
  list.innerHTML=items.map(x=>`<article class="nh7-blessing-item-v440"><div class="nh7-blessing-head-v440"><div><strong>${esc(x.display_name||L('عضو New Hope 7','New Hope 7 member','Član New Hope 7'))}</strong> <small>${esc(formatDate(x.created_at))}</small></div>${x.can_delete?`<button type="button" class="nh7-blessing-delete-v440" data-v440-delete="${esc(x.id)}">${esc(L('حذف','Delete','Izbriši'))}</button>`:''}</div><p>${esc(x.blessing_text||'')}</p></article>`).join('');
}
async function load(card,force=false){
  const id=sermonId(card);if(!id)return;if(!force&&cache.has(id)){render(card,cache.get(id));return}
  const root=socialShell(card),status=root.querySelector('[data-v440-status]');
  try{const state=await rpc('nh7_sermon_social_state_v440',{p_sermon_id:id,p_limit:20});cache.set(id,state);render(card,state);status.textContent=''}catch(e){status.textContent=errorMessage(e)}
}
async function toggleLike(card){
  const root=socialShell(card),status=root.querySelector('[data-v440-status]');if(!signedIn()){status.textContent=loginMessage();return}
  try{const r=await rpc('nh7_sermon_toggle_like_v440',{p_sermon_id:sermonId(card)},true);const old=cache.get(sermonId(card))||{};cache.set(sermonId(card),Object.assign({},old,r));render(card,cache.get(sermonId(card)));status.textContent=''}catch(e){status.textContent=errorMessage(e)}
}
async function addBlessing(card){
  const root=socialShell(card),status=root.querySelector('[data-v440-status]'),ta=root.querySelector('[data-v440-text]');if(!signedIn()){status.textContent=loginMessage();return}
  const value=String(ta.value||'').trim();if(value.length<2){status.textContent=errorMessage({code:'invalid_blessing_length'});return}
  const btn=root.querySelector('[data-v440-submit]');btn.disabled=true;
  try{await rpc('nh7_sermon_add_blessing_v440',{p_sermon_id:sermonId(card),p_text:value},true);ta.value='';root.querySelector('[data-v440-compose]').classList.remove('is-open');cache.delete(sermonId(card));await load(card,true);status.textContent=L('برکت شما ثبت شد ✓','Your blessing was posted ✓','Vaš blagoslov je objavljen ✓')}catch(e){status.textContent=errorMessage(e)}finally{btn.disabled=false}
}
async function deleteBlessing(card,id){
  if(!confirm(L('این برکت حذف شود؟','Delete this blessing?','Izbrisati ovaj blagoslov?')))return;const root=socialShell(card),status=root.querySelector('[data-v440-status]');
  try{await rpc('nh7_sermon_delete_blessing_v440',{p_id:id},true);cache.delete(sermonId(card));await load(card,true);status.textContent=L('حذف شد ✓','Deleted ✓','Izbrisano ✓')}catch(e){status.textContent=errorMessage(e)}
}
async function share(card){
  const id=sermonId(card),title=titleOf(card),u=new URL(location.href);u.searchParams.set('sermon',id);u.hash='audio';
  const data={title:'New Hope 7 — '+title,text:L('این پیام را در New Hope 7 بشنوید.','Listen to this message in New Hope 7.','Poslušajte ovu poruku u New Hope 7.'),url:u.toString()};
  try{if(navigator.share){await navigator.share(data)}else{await navigator.clipboard.writeText(data.url);socialShell(card).querySelector('[data-v440-status]').textContent=L('لینک کپی شد ✓','Link copied ✓','Poveznica kopirana ✓')}}catch(e){if(e?.name!=='AbortError')socialShell(card).querySelector('[data-v440-status]').textContent=errorMessage(e)}
}
function bind(card,root){
  root.querySelector('[data-v440-like]').onclick=()=>toggleLike(card);root.querySelector('[data-v440-blessing]').onclick=()=>root.querySelector('[data-v440-compose]').classList.toggle('is-open');root.querySelector('[data-v440-submit]').onclick=()=>addBlessing(card);root.querySelector('[data-v440-share]').onclick=()=>share(card);root.addEventListener('click',e=>{const b=e.target.closest('[data-v440-delete]');if(b)deleteBlessing(card,b.dataset.v440Delete)});
}
function patch(){style();document.querySelectorAll('[data-sermon-card]').forEach(card=>{if(!isSermonCard(card))return;socialShell(card);load(card)})}
function openShared(){
  const id=new URL(location.href).searchParams.get('sermon');if(!UUID.test(String(id||'')))return;let tries=0;const tick=()=>{const card=document.querySelector('[data-sermon-card="'+CSS.escape(id)+'"]');if(card){card.scrollIntoView({behavior:'smooth',block:'center'});card.style.scrollMarginTop='100px';return}if(tries===0)document.querySelector('[data-route="more"]')?.click();if(tries===3)document.querySelector('[data-go="audio"]')?.click();if(tries++<24)setTimeout(tick,300)};setTimeout(tick,500)
}
new MutationObserver(()=>{clearTimeout(observerTimer);observerTimer=setTimeout(patch,80)}).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',patch);window.addEventListener('online',()=>{cache.clear();patch()});style();patch();openShared();window.NH7_SERMON_SOCIAL_VERSION='4.4.0';
})();
