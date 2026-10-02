/* New Hope 7 Audio Library 2.0 — branch-only UI layer over the existing catalog/player. */
(()=>{'use strict';
if(window.__NH7_AUDIO_LIBRARY_V500__)return;
window.__NH7_AUDIO_LIBRARY_V500__=true;

const FAV='nh7_audio_favorites_v500',RECENT='nh7_audio_recent_v500';
const L=(fa,en,hr)=>{const x=String(localStorage.getItem('nh7_lang')||document.documentElement.lang||'en').toLowerCase();return x.startsWith('fa')?fa:x.startsWith('hr')?hr:en};
const lang=()=>{const x=String(localStorage.getItem('nh7_lang')||document.documentElement.lang||'en').toLowerCase();return x.startsWith('fa')?'fa':x.startsWith('hr')?'hr':'en'};
const id=x=>String(x?.id||x?.analytics_id||'');
const title=x=>String(x?.['title_'+lang()]||x?.title_fa||x?.title_en||x?.title_hr||L('موعظه','Sermon','Propovijed'));
const art=x=>String(x?.cover_url||x?.artwork_url||'assets/new-hope7-logo-512.png');
const fmt=s=>{s=Math.max(0,Number(s)||0);const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),x=Math.floor(s%60);return h?String(h)+':'+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0'):String(m)+':'+String(x).padStart(2,'0')};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
let timer=0,searchRaf=0,patchTimer=0;

function addStyle(){
 if(document.getElementById('nh7AudioLibrary500Style'))return;
 const s=document.createElement('style');s.id='nh7AudioLibrary500Style';s.textContent=`
.nh7al500{display:grid;gap:11px;margin-bottom:12px}
.nh7al500-hero{position:relative;min-height:220px;border-radius:24px;overflow:hidden;background:linear-gradient(145deg,color-mix(in srgb,var(--accent,#29c2c8) 62%,var(--bg,#071820)),color-mix(in srgb,var(--card,#0c242d) 88%,var(--bg,#071820)) 58%,var(--bg,#071820));box-shadow:0 18px 48px #0004}
.nh7al500-hero:before{content:"";position:absolute;inset:-12%;background:radial-gradient(circle at 50% 12%,color-mix(in srgb,var(--accent,#29c2c8) 48%,transparent) 0 12%,transparent 36%),linear-gradient(135deg,transparent 0 34%,color-mix(in srgb,var(--accent,#29c2c8) 14%,transparent) 34% 47%,transparent 47%)}
.nh7al500-logo{position:absolute;inset:-3%;width:106%;height:106%;object-fit:cover;opacity:.18;filter:saturate(.88) contrast(1.05)}
.nh7al500-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 22%,color-mix(in srgb,var(--bg,#071820) 16%,transparent) 48%,color-mix(in srgb,var(--bg,#071820) 93%,transparent) 100%)}
.nh7al500-copy{position:absolute;z-index:2;left:17px;right:17px;bottom:16px}.nh7al500-eye{font-size:.58rem;letter-spacing:.15em;font-weight:900;opacity:.8}.nh7al500-copy h2{font-size:1.42rem;margin:5px 0 3px}.nh7al500-copy p{font-size:.68rem;margin:0;opacity:.72}
.nh7al500-actions{display:flex;gap:7px;margin-top:11px}.nh7al500-actions button{min-height:38px;border:0;border-radius:999px;padding:0 15px;font-weight:850}.nh7al500-play{background:var(--text,var(--ink,#fff));color:var(--bg,#071820)}.nh7al500-shuffle{background:color-mix(in srgb,var(--text,var(--ink,#fff)) 10%,transparent);color:var(--text,var(--ink,#fff));border:1px solid var(--line,#ffffff20)!important}
.nh7al500-search{display:flex;align-items:center;gap:7px;height:43px;padding:0 12px;border-radius:14px;border:1px solid var(--line,#ffffff20);background:color-mix(in srgb,var(--card,#0c242d) 82%,transparent)}.nh7al500-search input{min-width:0;flex:1;border:0!important;background:transparent!important;outline:0;color:inherit!important;padding:0!important}
.nh7al500-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.nh7al500-chips::-webkit-scrollbar{display:none}.nh7al500-chip{flex:0 0 auto;border:1px solid var(--line,#ffffff20);background:color-mix(in srgb,var(--card,#0c242d) 78%,transparent);color:inherit;border-radius:999px;padding:6px 10px;font-size:.63rem}.nh7al500-chip.active{background:var(--accent,#29c2c8);color:#fff;border-color:var(--accent,#29c2c8);font-weight:850}
.nh7al500-section{display:grid;gap:6px}.nh7al500-section[hidden]{display:none}.nh7al500-head{display:flex;justify-content:space-between;align-items:center}.nh7al500-head strong{font-size:.74rem}.nh7al500-strip{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}.nh7al500-strip::-webkit-scrollbar{display:none}.nh7al500-card{width:92px;flex:0 0 92px;border:0;background:transparent;color:inherit;padding:0;text-align:start}.nh7al500-card img{width:92px;height:92px;border-radius:13px;object-fit:cover;display:block}.nh7al500-card b{display:block;margin-top:4px;font-size:.58rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nh7al500-card small{display:block;font-size:.49rem;opacity:.58;margin-top:1px}
.nh7al500-host{padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}.nh7al500-host>h2{display:none!important}#sermonSearch,.nh7al500-host>.tabs{display:none!important}
.sermon-list{border:1px solid var(--line,#ffffff20)!important;border-radius:13px!important;overflow:hidden!important;background:color-mix(in srgb,var(--card,#0c242d) 70%,transparent)!important}
.sermon-card{position:relative!important;padding:1px 4px!important}.sermon-card+.sermon-card{border-top:1px solid var(--line,#ffffff20)!important}
.sermon-card-main{display:grid!important;grid-template-columns:36px minmax(0,1fr) auto!important;gap:6px!important;align-items:center!important;min-height:38px!important;cursor:pointer!important}
.sermon-card-main>img{grid-column:1!important;width:36px!important;height:36px!important;max-width:none!important;border-radius:8px!important;object-fit:cover!important;margin:0!important}
.sermon-placeholder{grid-column:1!important;width:36px!important;height:36px!important;display:grid!important;place-items:center!important;border-radius:8px!important;background:color-mix(in srgb,var(--text,var(--ink,#fff)) 7%,transparent)!important;font-size:.8rem!important}
.sermon-card-copy{grid-column:2!important;min-width:0!important}.sermon-card-copy>strong,.sermon-card-copy>small{display:block!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.sermon-card-copy>strong{font-size:.68rem!important;line-height:1.1!important}.sermon-card-copy>small{font-size:.47rem!important;margin-top:0!important;opacity:.6!important}
.nh7al500-row-actions{grid-column:3;display:flex;align-items:center;gap:0}.nh7al500-row-actions button{width:22px;height:22px;border:0;border-radius:50%;background:transparent;color:inherit;padding:0;font-size:.72rem}.nh7al500-row-actions .on{color:#ff4d7e}
.sermon-card-actions{display:none!important}.sermon-card.nh7al500-open .sermon-card-actions{display:flex!important;position:absolute;z-index:5;top:40px;inset-inline-end:4px;gap:4px;padding:5px;border:1px solid var(--line,#ffffff20);border-radius:10px;background:var(--card,#0c242d);box-shadow:0 8px 28px #0004}.sermon-card.nh7al500-open .sermon-card-actions button{font-size:.56rem!important;padding:5px 7px!important;min-height:28px!important}
.inline-sermon-player,.nh7al500-host [data-classic-player],.nh7al500-host .nh7-classic-audio-v400{display:none!important}.sermon-card>[data-nh7-social-v440]{display:none!important}
html[dir="rtl"] .sermon-card-main{direction:rtl!important}html[dir="rtl"] .sermon-card-main>img,html[dir="rtl"] .sermon-placeholder{grid-column:1!important}html[dir="rtl"] .sermon-card-copy{grid-column:2!important;text-align:right!important}html[dir="rtl"] .nh7al500-row-actions{grid-column:3!important}
html[dir="ltr"] .sermon-card-main{direction:ltr!important}html[dir="ltr"] .sermon-card-copy{text-align:left!important}

/* v526 — selected Model C: Minimal Premium Frame.
   Geometry stays identical in every theme; only theme colors/accents change. */
.nh7al500-strip{gap:10px!important;padding:4px 2px 10px!important}
.nh7al500-card{
  width:96px!important;flex:0 0 96px!important;
  border:0!important;background:transparent!important;color:inherit!important;
  padding:0!important;text-align:start!important
}
.nh7al500-art-c{
  position:relative;display:grid;place-items:center;
  width:96px;height:96px;border-radius:19px;
  background:var(--card,var(--nh7-studio-card,#fff));
  border:1px solid color-mix(in srgb,var(--accent,var(--nh7-studio-accent,#1858a4)) 18%,var(--line,#d6e4ef));
  box-shadow:0 8px 18px color-mix(in srgb,var(--text,var(--nh7-studio-text,#17364e)) 11%,transparent);
  overflow:hidden;
  transition:transform .14s ease,box-shadow .14s ease,border-color .14s ease
}
.nh7al500-art-c:after{
  content:"";position:absolute;inset:5px;border-radius:14px;pointer-events:none;
  border:1px solid color-mix(in srgb,var(--accent,var(--nh7-studio-accent,#1858a4)) 9%,transparent)
}
.nh7al500-art-c img{
  width:64%!important;height:64%!important;max-width:64%!important;
  border-radius:11px!important;object-fit:contain!important;display:block!important;
  margin:0!important;filter:saturate(.98) contrast(1.02)
}
.nh7al500-card:active .nh7al500-art-c{
  transform:scale(.975);
  box-shadow:0 4px 10px color-mix(in srgb,var(--text,var(--nh7-studio-text,#17364e)) 10%,transparent)
}
.nh7al500-status{
  position:absolute;z-index:3;inset-inline-end:6px;top:6px;
  width:23px;height:23px;border-radius:50%;display:grid;place-items:center;
  color:#fff;background:var(--accent,var(--nh7-studio-accent,#1858a4));
  border:2px solid var(--card,var(--nh7-studio-card,#fff));
  box-shadow:0 3px 8px #0002
}
.nh7al500-status:before{font-size:9px;font-weight:950;line-height:1}
.nh7al500-card[data-al-kind="continue"] .nh7al500-status:before{content:"▶"}
.nh7al500-card[data-al-kind="favorite"] .nh7al500-status:before{content:"★"}
.nh7al500-card[data-al-kind="recent"] .nh7al500-status:before{content:"↺";font-size:11px}
.nh7al500-card b{
  display:block!important;margin-top:6px!important;font-size:.59rem!important;line-height:1.25!important;
  white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important
}
.nh7al500-card small{
  display:block!important;font-size:.49rem!important;line-height:1.25!important;
  opacity:.62!important;margin-top:2px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important
}
.nh7al500-card-progress{
  display:block;height:3px;margin-top:5px;border-radius:999px;overflow:hidden;
  background:color-mix(in srgb,var(--text,var(--nh7-studio-text,#17364e)) 12%,transparent)
}
.nh7al500-card-progress>i{
  display:block;height:100%;width:var(--nh7-al-progress,0%);
  border-radius:inherit;background:var(--accent,var(--nh7-studio-accent,#1858a4))
}

@media(max-width:430px){
 .nh7al500-hero{min-height:200px;border-radius:20px}
 .nh7al500-card{width:88px!important;flex-basis:88px!important}
 .nh7al500-art-c{width:88px;height:88px}
}

`;document.head.appendChild(s)
}

function readSet(key){try{const a=JSON.parse(localStorage.getItem(key)||'[]');return new Set(Array.isArray(a)?a.map(String):[])}catch(_){return new Set()}}
function readProgress(x){try{return JSON.parse(localStorage.getItem('nh7_sermon_progress_'+id(x))||'{}')}catch(_){return{}}}
function listAll(){return Object.values(window.__sermonMap||{}).filter(x=>id(x)&&!id(x).startsWith('school-'))}
function searchNormV530(value){
 return String(value||'').normalize('NFKC').toLowerCase()
  .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,'')
  .replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[أإٱآ]/g,'ا').replace(/ۀ/g,'ه')
  .replace(/\u200c/g,' ').replace(/[’'`]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ')
  .replace(/\s+/g,' ').trim()
}
function searchScoreV530(item,query){
 const q=searchNormV530(query);if(!q)return 1;
 const tokens=[...new Set(q.split(' ').filter(Boolean))];let score=0;
 [item?.title_fa,item?.title_en,item?.title_hr].map(searchNormV530).filter(Boolean).forEach(t=>{
  if(t===q)score=Math.max(score,1000);
  else if(t.startsWith(q))score=Math.max(score,900);
  else if(t.includes(q))score=Math.max(score,800);
  else if(tokens.length&&tokens.every(token=>t.includes(token)))score=Math.max(score,700+tokens.length);
 });
 return score
}
function filterVisibleSearchV532(host,value){
 const list=host?.querySelector('.sermon-list');if(!list)return;
 const q=searchNormV530(value),cards=[...list.querySelectorAll('[data-sermon-card]')];
 let count=0;
 cards.forEach((card,index)=>{
  if(card.dataset.nh7SearchOrder==null)card.dataset.nh7SearchOrder=String(index);
  const sid=String(card.dataset.sermonCard||''),item=window.__sermonMap?.[sid]||{};
  if(!card.dataset.nh7SearchIndex){
   card.dataset.nh7SearchIndex=[item.title_fa,item.title_en,item.title_hr].map(searchNormV530).filter(Boolean).join(' | ');
  }
  const score=q?searchScoreV530(item,q):1,hide=!!q&&score<=0;
  card.hidden=hide;
  if(hide){
   card.style.setProperty('display','none','important');
   card.style.removeProperty('order');
  }else{
   card.style.removeProperty('display');
   card.style.order=q?String(-score):'';
   count++;
  }
 });
 let status=host.querySelector('[data-al-search-status]');
 if(!status){
  status=document.createElement('p');
  status.dataset.alSearchStatus='1';
  status.className='muted';
  status.style.margin='-2px 2px 2px';
  host.querySelector('.nh7al500-search')?.insertAdjacentElement('afterend',status);
 }
 if(q){
  status.style.display='';
  status.textContent=count?L(count+' نتیجه',count+' result'+(count===1?'':'s'),count+' rezultata'):L('نتیجه‌ای پیدا نشد','No matching sermons','Nema odgovarajućih propovijedi');
 }else{
  status.style.display='none';
  status.textContent='';
 }
 host.querySelectorAll('[data-al-continue],[data-al-favorites],[data-al-recent]').forEach(sec=>{
  if(q){
   sec.hidden=true;
   sec.style.setProperty('display','none','important');
  }else{
   sec.hidden=false;
   sec.style.removeProperty('display');
  }
 });
 if(!q)renderShelves(host);
}
function play(x){window.NH7_AUDIO_CLASSIC_V400?.playItem?.(x)}
function shelf(items,subtitle,kind='recent'){
 return items.slice(0,10).map(x=>{
   const sid=esc(id(x)),label=esc(title(x)),sub=esc(subtitle(x));
   const p=kind==='continue'?readProgress(x):{},dur=Math.max(0,Number(p.duration||x.duration_seconds||0)),now=Math.max(0,Number(p.time||0));
   const pct=kind==='continue'&&dur>0?Math.max(0,Math.min(100,now/dur*100)):0;
   const progress=kind==='continue'?'<span class="nh7al500-card-progress" aria-hidden="true"><i style="--nh7-al-progress:'+pct.toFixed(1)+'%"></i></span>':'';
   return '<button type="button" class="nh7al500-card" data-al-play="'+sid+'" data-al-kind="'+kind+'"><span class="nh7al500-art-c"><img src="'+esc(art(x))+'" alt=""><span class="nh7al500-status" aria-hidden="true"></span></span><b>'+label+'</b><small>'+sub+'</small>'+progress+'</button>';
 }).join('')
}

function enhanceRows(){
 const favs=readSet(FAV);
 document.querySelectorAll('.sermon-list [data-sermon-card]').forEach(card=>{
   card.querySelector(':scope > .nh7-audio-row-v445')?.remove();
   card.classList.remove('nh7-audio-item-v445','is-open');
   card.querySelectorAll('[data-classic-player],.nh7-classic-audio-v400').forEach(n=>n.hidden=true);
   if(card.dataset.nh7Al500Row==='1')return;card.dataset.nh7Al500Row='1';
   const main=card.querySelector('.sermon-card-main');if(!main)return;
   const sid=String(card.dataset.sermonCard||'');
   const tools=document.createElement('div');tools.className='nh7al500-row-actions';
   tools.innerHTML='<button type="button" data-al-fav="'+esc(sid)+'" class="'+(favs.has(sid)?'on':'')+'" aria-label="'+esc(L('علاقه‌مندی','Favorite','Favorit'))+'">'+(favs.has(sid)?'★':'☆')+'</button><button type="button" data-al-more aria-label="'+esc(L('بیشتر','More','Više'))+'">•••</button>';
   main.appendChild(tools);
   const cover=main.querySelector('img,.sermon-placeholder');if(cover)cover.style.cursor='pointer';
 });
}

function patch(){
 addStyle();
 const search=document.getElementById('sermonSearch'),list=document.querySelector('.sermon-list');
 if(!search||!list||!window.__sermonMap)return;
 const host=search.parentElement;if(!host)return;host.classList.add('nh7al500-host');
 if(!host.querySelector(':scope > .nh7al500')){
   const oldTabs=host.querySelector('.tabs');
   const wrap=document.createElement('div');wrap.className='nh7al500';
   const activeText=oldTabs?.querySelector('.tab.active')?.textContent?.trim()||L('همهٔ پیام‌ها','All Messages','Sve poruke');
   const chips=oldTabs?[...oldTabs.querySelectorAll('.tab')].map((b,i)=>{const raw=b.dataset.params||'{}';return '<button type="button" class="nh7al500-chip '+(b.classList.contains('active')?'active':'')+'" data-al-chip="'+i+'" data-al-params="'+esc(raw)+'">'+esc(b.textContent.trim())+'</button>'}).join(''):'';
   wrap.innerHTML='<section class="nh7al500-hero"><img class="nh7al500-logo" src="assets/new-hope7-logo-512.png" alt=""><div class="nh7al500-copy"><span class="nh7al500-eye">NEW HOPE 7 AUDIO</span><h2>'+esc(activeText)+'</h2><p>'+esc(L('موعظه‌ها و پیام‌های صوتی کلیسا','Sermons and church audio messages','Propovijedi i audio poruke crkve'))+'</p><div class="nh7al500-actions"><button type="button" class="nh7al500-play" data-al-play-first>▶ '+esc(L('پخش','Play','Reproduciraj'))+'</button><button type="button" class="nh7al500-shuffle" data-al-shuffle>⤨ '+esc(L('تصادفی','Shuffle','Nasumično'))+'</button></div></div></section><label class="nh7al500-search">⌕ <input data-al-search value="'+esc(search.value||'')+'" placeholder="'+esc(search.placeholder||L('جستجو','Search','Pretraži'))+'"></label><div class="nh7al500-chips">'+chips+'</div><section class="nh7al500-section" data-al-continue><div class="nh7al500-head"><strong>'+esc(L('ادامهٔ شنیدن','Continue Listening','Nastavi slušati'))+'</strong></div><div class="nh7al500-strip" data-al-continue-list></div></section><section class="nh7al500-section" data-al-favorites><div class="nh7al500-head"><strong>'+esc(L('علاقه‌مندی‌ها','Favorites','Favoriti'))+'</strong></div><div class="nh7al500-strip" data-al-favorites-list></div></section><section class="nh7al500-section" data-al-recent><div class="nh7al500-head"><strong>'+esc(L('اخیراً پخش‌شده','Recently Played','Nedavno reproducirano'))+'</strong></div><div class="nh7al500-strip" data-al-recent-list></div></section><div class="nh7al500-head"><strong>'+esc(L('همهٔ موعظه‌ها','All Sermons','Sve propovijedi'))+'</strong></div>';
   host.insertBefore(wrap,search);
 }
 enhanceRows();renderShelves(host);
 filterVisibleSearchV532(host,host.querySelector('[data-al-search]')?.value||search.value||'');
}

function renderShelves(host){
 const visibleIds=new Set([...host.querySelectorAll('.sermon-list [data-sermon-card]')].map(card=>String(card.dataset.sermonCard||'')));
 const scopedAll=listAll().filter(x=>!visibleIds.size||visibleIds.has(id(x))),byId=Object.fromEntries(scopedAll.map(x=>[id(x),x])),favs=readSet(FAV),recent=[...readSet(RECENT)];
 const cont=scopedAll.filter(x=>{const p=readProgress(x),d=Number(p.duration||x.duration_seconds||0),t=Number(p.time||0);return t>5&&(!d||t<d-15)}).sort((a,b)=>Number(readProgress(b).updatedAt?Date.parse(readProgress(b).updatedAt):0)-Number(readProgress(a).updatedAt?Date.parse(readProgress(a).updatedAt):0));
 const fav=scopedAll.filter(x=>favs.has(id(x))),rec=recent.map(x=>byId[x]).filter(Boolean);
 const sets=[['[data-al-continue]','[data-al-continue-list]',cont,x=>{const p=readProgress(x);return p.time?L('ادامه از ','Continue from ','Nastavi od ')+fmt(p.time):''},'continue'],['[data-al-favorites]','[data-al-favorites-list]',fav,x=>fmt(x.duration_seconds||0),'favorite'],['[data-al-recent]','[data-al-recent-list]',rec,x=>fmt(x.duration_seconds||0),'recent']];
 sets.forEach(([secSel,listSel,items,sub,kind])=>{const sec=host.querySelector(secSel),el=host.querySelector(listSel);if(!sec||!el)return;sec.hidden=!items.length;el.innerHTML=shelf(items,sub,kind)});
}

document.addEventListener('click',e=>{
 const p=e.target.closest('[data-al-play]');if(p){const x=window.__sermonMap?.[String(p.dataset.alPlay)];if(x)play(x);return}
 if(e.target.closest('[data-al-play-first]')){const card=document.querySelector('.sermon-list [data-sermon-card]');const x=card&&window.__sermonMap?.[String(card.dataset.sermonCard)];if(x)play(x);return}
 if(e.target.closest('[data-al-shuffle]')){const cards=[...document.querySelectorAll('.sermon-list [data-sermon-card]')],card=cards[Math.floor(Math.random()*cards.length)],x=card&&window.__sermonMap?.[String(card.dataset.sermonCard)];if(x)play(x);return}
 const chip=e.target.closest('[data-al-chip]');if(chip){let params={};try{params=JSON.parse(chip.dataset.alParams||'{}')}catch(_){};window.NH7_NAVIGATE?.('audio',params,true);return}
 const fav=e.target.closest('[data-al-fav]');if(fav){const set=readSet(FAV),sid=String(fav.dataset.alFav);set.has(sid)?set.delete(sid):set.add(sid);try{localStorage.setItem(FAV,JSON.stringify([...set]))}catch(_){};fav.classList.toggle('on',set.has(sid));fav.textContent=set.has(sid)?'★':'☆';patch();window.NH7_MEDIA_PLAYER_V500?.sync?.();return}
 const more=e.target.closest('[data-al-more]');if(more){more.closest('.sermon-card')?.classList.toggle('nh7al500-open');return}
 const row=e.target.closest('.sermon-card-main');
 if(row&&!e.target.closest('button,a,input,select,textarea')){const card=row.closest('[data-sermon-card]'),x=card&&window.__sermonMap?.[String(card.dataset.sermonCard)];if(x)play(x);return}
 const cover=e.target.closest('.sermon-card-main>img,.sermon-card-main>.sermon-placeholder');if(cover){const card=cover.closest('[data-sermon-card]'),x=card&&window.__sermonMap?.[String(card.dataset.sermonCard)];if(x)play(x)}
},true);

document.addEventListener('input',e=>{
 const input=e.target.closest('[data-al-search]');if(!input)return;
 const host=input.closest('.nh7al500-host'),old=document.getElementById('sermonSearch');
 if(old)old.value=input.value;
 if(searchRaf)cancelAnimationFrame(searchRaf);
 searchRaf=requestAnimationFrame(()=>filterVisibleSearchV532(host,input.value));
},true);

new MutationObserver(records=>{
 const shouldPatch=records.some(record=>{
  const target=record.target?.nodeType===1?record.target:record.target?.parentElement;
  if(target?.closest?.('.nh7al500-host'))return false;
  return [...(record.addedNodes||[])].some(node=>{
   if(node.nodeType!==1)return false;
   return node.matches?.('#sermonSearch,.sermon-list')||node.querySelector?.('#sermonSearch,.sermon-list');
  });
 });
 if(!shouldPatch)return;
 clearTimeout(patchTimer);
 patchTimer=setTimeout(patch,50);
}).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',patch);
window.addEventListener('storage',e=>{if([FAV,RECENT].includes(e.key))patch()});
window.NH7_AUDIO_LIBRARY_V500_PATCH=patch;
setTimeout(patch,80);
})();