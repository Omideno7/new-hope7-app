(()=>{'use strict';
if(window.__NH7_SERMON_SOCIAL_V440__)return;
window.__NH7_SERMON_SOCIAL_V440__=true;
const SB='https://gpzcwffxnddhaeaogdyo.supabase.co',KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37',AUTH='nh7_user_session_v170';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,cache=new Map();let timer=0;const socialObserver=('IntersectionObserver'in window)?new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;socialObserver.unobserve(entry.target);entry.target.dataset.nh7SocialObserved='loaded';load(entry.target).catch(()=>{})}},{rootMargin:'700px 0px'}):null;
const lg=()=>{const x=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(x)?x:'en'};
const L=(fa,en,hr)=>lg()==='fa'?fa:lg()==='hr'?hr:en;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ses=()=>{try{return JSON.parse(localStorage.getItem(AUTH)||'null')}catch(_){return null}},tok=()=>ses()?.access_token||'',signed=()=>!!tok();
async function rpc(n,p={},need=false){const t=tok();if(need&&!t)throw new Error('login_required');const r=await fetch(SB+'/rest/v1/rpc/'+n,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+(t||KEY),'Content-Type':'application/json'},body:JSON.stringify(p),cache:'no-store'}),raw=await r.text();let d={};try{d=raw?JSON.parse(raw):{}}catch(_){d={message:raw}}if(!r.ok)throw new Error(d.message||d.error||raw||r.statusText);return Array.isArray(d)&&d.length===1?d[0]:d}
function id(card){const x=String(card?.dataset?.sermonCard||'');return UUID.test(x)?x:''}
function valid(card){return !!id(card)&&!card.classList.contains('school-audio-card')}
function title(card){
  const sid=id(card),mapped=window.__sermonMap?.[sid]||{};
  const key='title_'+lg();
  const raw=mapped?.[key]||mapped?.title_fa||mapped?.title_en||mapped?.title_hr||card.querySelector('.sermon-card-copy strong,strong')?.textContent||'New Hope 7';
  return String(raw||'New Hope 7').trim();
}
function addStyle(){if(document.getElementById('nh7Social440Style'))return;const s=document.createElement('style');s.id='nh7Social440Style';s.textContent='.nh7s440{margin-top:12px;padding-top:12px;border-top:1px solid var(--line);display:grid;gap:10px}.nh7s440a{display:flex;gap:8px;flex-wrap:wrap}.nh7s440b{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:8px 12px;font:inherit;font-weight:800}.nh7s440b.on{background:#fff0f3;color:#c51d49}.nh7s440c{display:none;padding:12px;border:1px solid var(--line);border-radius:14px}.nh7s440c.open{display:grid;gap:8px}.nh7s440c textarea{width:100%;min-height:82px}.nh7s440list{display:grid;gap:8px}.nh7s440item{padding:10px 12px;border:1px solid var(--line);border-radius:14px}.nh7s440head{display:flex;justify-content:space-between;gap:8px}.nh7s440del{border:0;background:transparent;color:var(--danger);font-weight:800}.nh7s440status{color:var(--muted);font-size:.84rem;min-height:1.1em}';document.head.appendChild(s)}
function loginMsg(){return L('\u0628\u0631\u0627\u06cc Like \u06cc\u0627 \u0646\u0648\u0634\u062a\u0646 \u0628\u0631\u06a9\u062a \u0648\u0627\u0631\u062f \u062d\u0633\u0627\u0628 \u0634\u0648\u06cc\u062f.','Sign in to like or share a blessing.','Prijavite se za Like ili blagoslov.')}
function shell(card){let r=card.querySelector('[data-nh7-social-v440]');if(r)return r;r=document.createElement('section');r.className='nh7s440';r.dataset.nh7SocialV440='1';r.innerHTML='<div class="nh7s440a"><button class="nh7s440b" data-like>\u2661 <span>0</span></button><button class="nh7s440b" data-bless>\u270d\ufe0f '+E(L('\u0627\u0634\u062a\u0631\u0627\u06a9 \u0628\u0631\u06a9\u062a','Share a Blessing','Podijeli blagoslov'))+'</button><button class="nh7s440b" data-share>\u2197 '+E(L('\u0627\u0634\u062a\u0631\u0627\u06a9','Share','Podijeli'))+'</button></div><div class="nh7s440c" data-compose><textarea maxlength="800" data-text placeholder="'+E(L('\u0627\u06cc\u0646 \u067e\u06cc\u0627\u0645 \u0686\u0647 \u0628\u0631\u06a9\u062a\u06cc \u0628\u0631\u0627\u06cc \u0634\u0645\u0627 \u062f\u0627\u0634\u062a\u061f','How did this message bless you?','Kako vas je ova poruka blagoslovila?'))+'"></textarea><button class="primary-btn" data-submit>'+E(L('\u0627\u0631\u0633\u0627\u0644 \u0628\u0631\u06a9\u062a','Post Blessing','Objavi blagoslov'))+'</button><small>'+E(signed()?'':loginMsg())+'</small></div><div class="nh7s440status" data-status></div><div class="nh7s440list" data-list></div>';card.appendChild(r);bind(card,r);return r}
function date(v){try{return new Date(v).toLocaleDateString(lg()==='fa'?'fa-IR':lg()==='hr'?'hr-HR':'en-US')}catch(_){return''}}
function draw(card,s){const r=shell(card),b=r.querySelector('[data-like]');b.classList.toggle('on',!!s?.liked);b.innerHTML=(s?.liked?'\u2665 ':'\u2661 ')+'<span>'+Number(s?.like_count||0)+'</span>';const a=Array.isArray(s?.blessings)?s.blessings:[];r.querySelector('[data-list]').innerHTML=a.map(x=>'<article class="nh7s440item"><div class="nh7s440head"><strong>'+E(x.display_name||'New Hope 7')+'</strong><small>'+E(date(x.created_at))+'</small>'+(x.can_delete?'<button class="nh7s440del" data-delete="'+E(x.id)+'">'+E(L('\u062d\u0630\u0641','Delete','Izbrisi'))+'</button>':'')+'</div><p>'+E(x.blessing_text||'')+'</p></article>').join('')}
async function load(card,force=false){const sid=id(card);if(!sid)return;if(!force&&cache.has(sid)){draw(card,cache.get(sid));return}const r=shell(card),st=r.querySelector('[data-status]');try{const s=await rpc('nh7_sermon_social_state_v440',{p_sermon_id:sid,p_limit:20});cache.set(sid,s);draw(card,s);st.textContent=''}catch(e){st.textContent=e.message||String(e)}}
async function like(card){const r=shell(card),st=r.querySelector('[data-status]');if(!signed()){st.textContent=loginMsg();return}try{const x=await rpc('nh7_sermon_toggle_like_v440',{p_sermon_id:id(card)},true),old=cache.get(id(card))||{};cache.set(id(card),Object.assign({},old,x));draw(card,cache.get(id(card)));st.textContent=''}catch(e){st.textContent=e.message||String(e)}}
async function bless(card){const r=shell(card),st=r.querySelector('[data-status]'),ta=r.querySelector('[data-text]');if(!signed()){st.textContent=loginMsg();return}const v=String(ta.value||'').trim();if(v.length<2){st.textContent=L('\u0645\u062a\u0646 \u0628\u0631\u06a9\u062a \u062e\u06cc\u0644\u06cc \u06a9\u0648\u062a\u0627\u0647 \u0627\u0633\u062a.','Blessing text is too short.','Tekst je prekratak.');return}try{await rpc('nh7_sermon_add_blessing_v440',{p_sermon_id:id(card),p_text:v},true);ta.value='';r.querySelector('[data-compose]').classList.remove('open');cache.delete(id(card));await load(card,true);st.textContent=L('\u0628\u0631\u06a9\u062a \u0634\u0645\u0627 \u062b\u0628\u062a \u0634\u062f \u2713','Your blessing was posted \u2713','Blagoslov je objavljen \u2713')}catch(e){st.textContent=e.message||String(e)}}
async function del(card,bid){if(!confirm(L('\u0627\u06cc\u0646 \u0628\u0631\u06a9\u062a \u062d\u0630\u0641 \u0634\u0648\u062f\u061f','Delete this blessing?','Izbrisati ovaj blagoslov?')))return;try{await rpc('nh7_sermon_delete_blessing_v440',{p_id:bid},true);cache.delete(id(card));await load(card,true)}catch(e){shell(card).querySelector('[data-status]').textContent=e.message||String(e)}}
async function share(card){
  const sid=id(card),sermonTitle=title(card);
  const url='https://omideno7.github.io/new-hope7-app/?sermon='+encodeURIComponent(sid)+'#audio';
  const body=L(
    '\ud83c\udfa7 '+sermonTitle+'\n\n\u0627\u06cc\u0646 \u0645\u0648\u0639\u0638\u0647 \u0631\u0627 \u062f\u0631 New Hope 7 \u0628\u0634\u0646\u0648\u06cc\u062f:\n'+url,
    '\ud83c\udfa7 '+sermonTitle+'\n\nListen to this message in New Hope 7:\n'+url,
    '\ud83c\udfa7 '+sermonTitle+'\n\nPoslusajte ovu poruku u New Hope 7:\n'+url
  );
  const data={title:'New Hope 7 - '+sermonTitle,text:body};
  try{
    if(navigator.share)await navigator.share(data);
    else{
      await navigator.clipboard.writeText(body);
      shell(card).querySelector('[data-status]').textContent=L('\u0646\u0627\u0645 \u0645\u0648\u0639\u0638\u0647 \u0648 \u0644\u06cc\u0646\u06a9 \u06a9\u067e\u06cc \u0634\u062f \u2713','Sermon title and link copied \u2713','Naslov i poveznica kopirani \u2713');
    }
  }catch(e){}
}
function bind(card,r){r.querySelector('[data-like]').onclick=()=>like(card);r.querySelector('[data-bless]').onclick=()=>r.querySelector('[data-compose]').classList.toggle('open');r.querySelector('[data-submit]').onclick=()=>bless(card);r.querySelector('[data-share]').onclick=()=>share(card);r.onclick=e=>{const b=e.target.closest('[data-delete]');if(b)del(card,b.dataset.delete)}}
function queueLoad(card){if(!valid(card))return;shell(card);if(cache.has(id(card))){load(card);return}if(card.dataset.nh7SocialObserved==='loaded')return;if(!socialObserver){card.dataset.nh7SocialObserved='loaded';load(card).catch(()=>{});return}if(card.dataset.nh7SocialObserved==='1')return;card.dataset.nh7SocialObserved='1';socialObserver.observe(card)}
function patch(){addStyle();document.querySelectorAll('[data-sermon-card]').forEach(queueLoad)}
function openShared(){const sid=new URL(location.href).searchParams.get('sermon');if(!UUID.test(String(sid||'')))return;let tries=0;const tick=()=>{const card=document.querySelector('[data-sermon-card="'+CSS.escape(sid)+'"]');if(card){card.scrollIntoView({behavior:'smooth',block:'center'});return}if(tries===0)document.querySelector('[data-route="more"]')?.click();if(tries===3)document.querySelector('[data-go="audio"]')?.click();if(tries++<24)setTimeout(tick,300)};setTimeout(tick,500)}
window.NH7_SERMON_SOCIAL_PATCH=patch;
window.NH7_SERMON_SOCIAL_REFRESH_CARD=card=>{if(valid(card)){cache.delete(id(card));shell(card);load(card,true)}};
new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(patch,80)}).observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('pageshow',patch);addStyle();patch();openShared();window.NH7_SERMON_SOCIAL_VERSION='4.4.7-io-preview';
})();
