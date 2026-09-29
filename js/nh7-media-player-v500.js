/* New Hope 7 — Media Player 2.0 v5.0.0 preview.
 * UI-only layer over the stable v4.8.4 audio engine.
 * Does not create its own audio element or change signed-media/progress logic.
 */
(()=>{'use strict';
if(window.__NH7_MEDIA_PLAYER_V500__)return;
window.__NH7_MEDIA_PLAYER_V500__=true;

const VERSION='5.0.0-preview-20260930';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let root=null,expanded=false,lastTrackKey='',syncTimer=0;

const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const engine=()=>window.NH7_AUDIO_CLASSIC_V400||null;
const state=()=>engine()?.getState?.()||{};
const mediaId=item=>String(item?.id||item?.analytics_id||'');
const isSermon=item=>UUID.test(mediaId(item))&&!mediaId(item).startsWith('school-');
const titleFor=item=>String(item?.['title_'+lang()]||item?.title_fa||item?.title_en||item?.title_hr||item?.title||L('فایل صوتی','Audio','Audio'));
const artistFor=item=>String(item?.speaker||item?.author||item?.artist||L('کلیسای امیدنو۷','New Hope 7 Church','New Hope 7 Church'));
const artworkFor=item=>{const raw=String(item?.cover_url||item?.artwork_url||'assets/new-hope7-logo-512.png').trim();try{return new URL(raw,location.href).href}catch(_){return new URL('assets/new-hope7-logo-512.png',location.href).href}};
const fmt=value=>{const sec=Math.max(0,Number(value)||0),h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=Math.floor(sec%60);return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`};

function addStyle(){
  if(document.getElementById('nh7MediaPlayer500Css'))return;
  const style=document.createElement('style');
  style.id='nh7MediaPlayer500Css';
  style.textContent=`
html.nh7p500-active .nh7-mini485,html.nh7p500-active .nh7-now-playing-v484{display:none!important}
.nh7p500{position:fixed;z-index:1900;left:7px;right:7px;bottom:calc(68px + env(safe-area-inset-bottom,0px));color:var(--text,#062444);direction:ltr}
.nh7p500[hidden]{display:none!important}
.nh7p500-mini{position:relative;height:56px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:5px;padding:5px 6px;border:1px solid color-mix(in srgb,var(--line,#d9e6f7) 85%,transparent);border-radius:17px;background:color-mix(in srgb,var(--card,#fff) 91%,transparent);box-shadow:0 10px 30px #0003;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);overflow:hidden}
.nh7p500-track{min-width:0;height:100%;display:flex;align-items:center;gap:8px;border:0;background:transparent;color:inherit;padding:0;text-align:start}
.nh7p500-art{width:42px;height:42px;flex:0 0 42px;border-radius:11px;background:center/cover no-repeat;box-shadow:0 3px 10px #0003}
.nh7p500-copy{min-width:0;display:grid;gap:1px}.nh7p500-copy>*{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nh7p500-copy strong{font-size:.82rem}.nh7p500-copy small{font-size:.64rem;color:var(--muted,#64748b)}
.nh7p500-actions{display:flex;align-items:center;gap:0}.nh7p500-actions button{width:29px;height:29px;border:0;border-radius:9px;background:transparent;color:inherit;font-weight:850;padding:0}.nh7p500-actions .nh7p500-play{background:var(--accent,#1d4ed8);color:#fff;border-radius:50%}.nh7p500-actions .nh7p500-speed{font-size:.58rem}.nh7p500-actions button:disabled{opacity:.32}
.nh7p500-progress{position:absolute;left:8px;right:8px;bottom:0;height:2px;background:#64748b33;border-radius:99px;overflow:hidden}.nh7p500-progress>i{display:block;height:100%;width:0;background:var(--accent,#1d4ed8)}
.nh7p500-full{--nh7p-bg:var(--bg,#08111f);--nh7p-card:var(--card,#0f1b2c);--nh7p-text:var(--text,#f8fafc);--nh7p-muted:var(--muted,#94a3b8);--nh7p-line:var(--line,#ffffff22);--nh7p-accent:var(--accent,#1d4ed8);position:fixed;inset:0;z-index:1910;background:var(--nh7p-bg);color:var(--nh7p-text);overflow:auto;overscroll-behavior:contain}
.nh7p500-full[hidden]{display:none!important}.nh7p500-bg{position:fixed;inset:-16%;background:center/cover no-repeat;filter:blur(58px) saturate(1.08);opacity:.20;transform:scale(1.08)}
.nh7p500-shade{position:fixed;inset:0;background:linear-gradient(180deg,color-mix(in srgb,var(--nh7p-bg) 54%,transparent) 0%,color-mix(in srgb,var(--nh7p-bg) 86%,transparent) 55%,var(--nh7p-bg) 100%)}
.nh7p500-brandmark{position:fixed;left:50%;top:11%;width:min(46vw,230px);height:min(46vw,230px);object-fit:contain;transform:translateX(-50%);opacity:.055;filter:saturate(.85);pointer-events:none}
.nh7p500-sheet{position:relative;max-width:560px;min-height:100%;margin:auto;padding:calc(14px + env(safe-area-inset-top,0px)) 22px calc(26px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column}
.nh7p500-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.nh7p500-head button{width:40px;height:40px;border:1px solid color-mix(in srgb,var(--nh7p-text) 14%,transparent);border-radius:50%;background:color-mix(in srgb,var(--nh7p-text) 7%,transparent);color:var(--nh7p-text);font-size:1.15rem}.nh7p500-head strong{font-size:.82rem;letter-spacing:.02em;opacity:.88}
.nh7p500-cover{display:block;width:min(78vw,360px);aspect-ratio:1;object-fit:cover;margin:4.5vh auto 20px;border-radius:28px;box-shadow:0 24px 70px #0009}
.nh7p500-meta{display:grid;gap:4px;margin-top:auto}.nh7p500-meta strong{font-size:1.18rem;line-height:1.35}.nh7p500-meta small{font-size:.78rem;color:var(--nh7p-muted)}
.nh7p500-social{display:flex;gap:8px;margin-top:12px}.nh7p500-social button{min-height:38px;border:1px solid color-mix(in srgb,var(--nh7p-text) 14%,transparent);border-radius:999px;background:color-mix(in srgb,var(--nh7p-card) 76%,transparent);color:var(--nh7p-text);padding:0 14px;font-weight:800}.nh7p500-social button span{margin-inline-end:6px}.nh7p500-social [data-like].on{color:#e11d48}
.nh7p500-seek{width:100%;margin-top:18px;accent-color:var(--nh7p-accent)}.nh7p500-time{display:flex;justify-content:space-between;margin-top:4px;font-size:.67rem;color:var(--nh7p-muted)}
.nh7p500-main{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:20px 0}.nh7p500-main button{width:48px;height:48px;border:0;border-radius:50%;background:color-mix(in srgb,var(--nh7p-text) 8%,transparent);color:var(--nh7p-text);font-weight:900;font-size:.95rem}.nh7p500-main .big{width:72px;height:72px;background:var(--nh7p-text);color:var(--nh7p-bg);font-size:1.3rem;box-shadow:0 8px 30px #0004}.nh7p500-main button:disabled{opacity:.3}
.nh7p500-tools{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.nh7p500-tools button{min-height:62px;border:1px solid color-mix(in srgb,var(--nh7p-text) 14%,transparent);border-radius:16px;background:color-mix(in srgb,var(--nh7p-card) 76%,transparent);color:var(--nh7p-text);padding:8px 4px;font-weight:800}.nh7p500-tools button span{display:block;font-size:1.05rem}.nh7p500-tools button small{display:block;margin-top:4px;font-size:.62rem;color:var(--nh7p-muted);font-weight:700}
.nh7p500-volume{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;margin-top:15px}.nh7p500-volume input{width:100%;accent-color:var(--nh7p-accent)}.nh7p500-volume[hidden]{display:none!important}
.nh7p500-blessing{margin-top:14px;padding:13px;border:1px solid color-mix(in srgb,var(--nh7p-text) 14%,transparent);border-radius:17px;background:color-mix(in srgb,var(--nh7p-card) 72%,transparent)}.nh7p500-blessing[hidden]{display:none!important}.nh7p500-blessing p{margin:0 0 10px;font-size:.78rem;color:var(--nh7p-muted);line-height:1.55}.nh7p500-blessing button{width:100%;min-height:42px;border:0;border-radius:12px;background:var(--nh7p-text);color:var(--nh7p-bg);font-weight:850}
html.nh7p500-active body #view{padding-bottom:calc(128px + env(safe-area-inset-bottom,0px))!important}html.nh7p500-open,html.nh7p500-open body{overflow:hidden!important}
html[dir="rtl"] .nh7p500-copy,html[dir="rtl"] .nh7p500-meta{text-align:right}
@media(max-width:390px){.nh7p500{left:5px;right:5px}.nh7p500-actions button{width:27px}.nh7p500-cover{width:min(82vw,330px)}.nh7p500-sheet{padding-left:18px;padding-right:18px}.nh7p500-main button{width:44px;height:44px}.nh7p500-main .big{width:66px;height:66px}.nh7p500-tools{gap:6px}}
`;
  document.head.appendChild(style);
}

function ensure(){
  if(root?.isConnected)return root;
  addStyle();
  root=document.createElement('aside');
  root.className='nh7p500';
  root.hidden=true;
  root.setAttribute('aria-live','polite');
  root.innerHTML=`
    <div class="nh7p500-mini">
      <button type="button" class="nh7p500-track" data-expand>
        <span class="nh7p500-art" data-art></span>
        <span class="nh7p500-copy"><strong data-title></strong><small data-mini-meta></small></span>
      </button>
      <div class="nh7p500-actions">
        <button type="button" data-prev aria-label="${L('قبلی','Previous','Prethodno')}">⏮</button>
        <button type="button" class="nh7p500-play" data-play aria-label="Play/Pause">▶</button>
        <button type="button" data-next aria-label="${L('بعدی','Next','Sljedeće')}">⏭</button>
        <button type="button" class="nh7p500-speed" data-speed aria-label="${L('سرعت','Speed','Brzina')}">1×</button>
        <button type="button" data-close aria-label="${L('بستن','Close','Zatvori')}">×</button>
      </div>
      <span class="nh7p500-progress"><i data-progress></i></span>
    </div>
    <section class="nh7p500-full" data-full hidden>
      <div class="nh7p500-bg" data-bg></div><div class="nh7p500-shade"></div><img class="nh7p500-brandmark" src="assets/new-hope7-logo-512.png" alt="">
      <div class="nh7p500-sheet">
        <header class="nh7p500-head"><button type="button" data-collapse aria-label="${L('جمع کردن','Collapse','Smanji')}">⌄</button><strong>NEW HOPE 7</strong><button type="button" data-close aria-label="${L('بستن','Close','Zatvori')}">×</button></header>
        <img class="nh7p500-cover" data-cover alt="">
        <div class="nh7p500-meta"><strong data-full-title></strong><small data-artist></small></div>
        <div class="nh7p500-social">
          <button type="button" data-like><span data-like-icon>♡</span>${L('پسندیدن','Like','Sviđa mi se')}</button>
          <button type="button" data-bless><span>💬</span>${L('برکت‌ها','Blessings','Blagoslovi')}</button>
        </div>
        <input class="nh7p500-seek" data-seek type="range" min="0" max="1000" value="0" aria-label="${L('موقعیت پخش','Playback position','Pozicija reprodukcije')}">
        <div class="nh7p500-time"><span data-now>0:00</span><span data-total>0:00</span></div>
        <div class="nh7p500-main">
          <button type="button" data-prev aria-label="${L('قبلی','Previous','Prethodno')}">⏮</button>
          <button type="button" data-back aria-label="-15">↶15</button>
          <button type="button" class="big" data-play aria-label="Play/Pause">▶</button>
          <button type="button" data-forward aria-label="+30">30↷</button>
          <button type="button" data-next aria-label="${L('بعدی','Next','Sljedeće')}">⏭</button>
        </div>
        <div class="nh7p500-tools">
          <button type="button" data-speed><span data-rate>1×</span><small>${L('سرعت','Speed','Brzina')}</small></button>
          <button type="button" data-bible><span>📖</span><small>${L('کتاب مقدس','Bible','Biblija')}</small></button>
          <button type="button" data-bless><span>♡</span><small>${L('برکت‌ها','Blessings','Blagoslovi')}</small></button>
          <button type="button" data-mute><span data-mute-icon>🔊</span><small>${L('صدا','Volume','Glasnoća')}</small></button>
        </div>
        <div class="nh7p500-volume" data-volume-row><span>🔈</span><input data-volume type="range" min="0" max="1" step="0.05" value="1"><span>🔊</span></div>
        <div class="nh7p500-blessing" data-blessing hidden><p>${L('برای دیدن یا نوشتن برکت‌ها، پیام فعلی باز می‌شود؛ پخش صوت ادامه پیدا می‌کند.','Open the current message to view or write blessings; audio keeps playing.','Otvorite trenutnu poruku za blagoslove; reprodukcija se nastavlja.')}</p><button type="button" data-open-blessings>${L('باز کردن برکت‌ها','Open blessings','Otvori blagoslove')}</button></div>
      </div>
    </section>`;
  document.body.appendChild(root);
  bind();
  return root;
}

function setExpanded(value){
  expanded=!!value;
  const r=ensure(),full=r.querySelector('[data-full]');
  if(full)full.hidden=!expanded;
  document.documentElement.classList.toggle('nh7p500-open',expanded);
  if(!expanded){const bp=r.querySelector('[data-blessing]');if(bp)bp.hidden=true}
  sync();
}

function cycleSpeed(){
  const a=state().audio;if(!a)return;
  const rates=[.75,1,1.25,1.5,2],cur=Number(a.playbackRate||1),idx=Math.max(0,rates.findIndex(v=>Math.abs(v-cur)<.01));
  engine()?.setPlaybackSpeed?.(rates[(idx+1)%rates.length]);
}

function preserveProgress(){
  const {audio:a,current:item}=state();if(!a||!item)return;
  try{localStorage.setItem('nh7_sermon_progress_'+mediaId(item),JSON.stringify({time:Math.max(0,Number(a.currentTime||0)),duration:Number.isFinite(a.duration)?Number(a.duration||0):Number(item?.duration_seconds||0),completed:false,updatedAt:new Date().toISOString()}))}catch(_){}
}

function closePlayer(){
  preserveProgress();
  setExpanded(false);
  if(window.NH7_AUDIO_MINIPLAYER_V487?.close){window.NH7_AUDIO_MINIPLAYER_V487.close();return}
  try{state().audio?.pause?.()}catch(_){}
  sync();
}

function likeCurrent(){
  const item=state().current;if(!isSermon(item))return;
  const id=mediaId(item);
  const clickLike=()=>{
    const card=document.querySelector(`[data-sermon-card="${CSS.escape(id)}"]`);
    const like=card?.querySelector('[data-nh7-social-v440] [data-like]');
    if(like){like.click();return true}
    return false;
  };
  if(clickLike())return;
  engine()?.openCurrentAudio?.();
  let tries=0;
  const timer=setInterval(()=>{if(clickLike()||tries++>25)clearInterval(timer)},120);
}

function openBlessings(){
  const item=state().current;if(!isSermon(item))return;
  setExpanded(false);
  engine()?.openCurrentAudio?.();
  let tries=0;
  const timer=setInterval(()=>{
    const card=document.querySelector(`[data-sermon-card="${CSS.escape(mediaId(item))}"]`);
    const social=card?.querySelector('[data-nh7-social-v440]');
    if(card&&social){
      clearInterval(timer);
      window.NH7_SERMON_SOCIAL_REFRESH_CARD?.(card);
      social.scrollIntoView({behavior:'smooth',block:'center'});
      const compose=social.querySelector('[data-compose]');
      if(compose&&!compose.classList.contains('open'))social.querySelector('[data-bless]')?.click();
    }else if(tries++>25)clearInterval(timer);
  },120);
}

function bind(){
  root.addEventListener('click',event=>{
    const {audio:a}=state();
    if(event.target.closest('[data-expand]'))return setExpanded(true);
    if(event.target.closest('[data-collapse]'))return setExpanded(false);
    if(event.target.closest('[data-close]'))return closePlayer();
    if(event.target.closest('[data-prev]'))return engine()?.playPreviousTrack?.('player-v500');
    if(event.target.closest('[data-next]'))return engine()?.playNextTrack?.('player-v500');
    if(event.target.closest('[data-play]')&&a){a.paused?a.play().catch(()=>{}):a.pause();return}
    if(event.target.closest('[data-back]')&&a){a.currentTime=Math.max(0,Number(a.currentTime||0)-15);return}
    if(event.target.closest('[data-forward]')&&a){a.currentTime=Math.min(Number.isFinite(a.duration)?a.duration:Infinity,Number(a.currentTime||0)+30);return}
    if(event.target.closest('[data-speed]'))return cycleSpeed();
    if(event.target.closest('[data-mute]'))return engine()?.toggleMediaMute?.();
    if(event.target.closest('[data-bible]'))return window.NH7QuickBibleV454?.open?.(event.target.closest('[data-bible]'));
    if(event.target.closest('[data-like]'))return likeCurrent();
    if(event.target.closest('[data-bless]')){const p=root.querySelector('[data-blessing]');if(p)p.hidden=!p.hidden;return}
    if(event.target.closest('[data-open-blessings]'))return openBlessings();
  });
  root.addEventListener('input',event=>{
    const {audio:a}=state();
    if(event.target.matches('[data-seek]')&&a&&Number.isFinite(a.duration)&&a.duration>0){a.currentTime=(Number(event.target.value)/1000)*a.duration;return}
    if(event.target.matches('[data-volume]'))engine()?.setMediaVolume?.(event.target.value);
  });
}

function sync(){
  const r=ensure(),s=state(),a=s.audio,item=s.current,active=!!(a&&item&&a.src);
  r.hidden=!active;
  document.documentElement.classList.toggle('nh7p500-active',active);
  if(!active){expanded=false;const full=r.querySelector('[data-full]');if(full)full.hidden=true;document.documentElement.classList.remove('nh7p500-open');return}
  const duration=Number.isFinite(a.duration)&&a.duration>0?a.duration:(Number(item?.duration_seconds||0)||Number(item?.duration_minutes||0)*60||0);
  const now=Number(a.currentTime||0),progress=duration>0?Math.max(0,Math.min(100,now/duration*100)):0;
  const ttl=titleFor(item),artist=artistFor(item),art=artworkFor(item),rate=Number(a.playbackRate||1);
  r.querySelectorAll('[data-title],[data-full-title]').forEach(n=>n.textContent=ttl);
  r.querySelector('[data-mini-meta]').textContent=`${fmt(now)} · ${rate}×`;
  r.querySelector('[data-artist]').textContent=artist;
  r.querySelector('[data-now]').textContent=fmt(now);r.querySelector('[data-total]').textContent=fmt(duration);
  r.querySelector('[data-progress]').style.width=progress+'%';
  r.querySelector('[data-seek]').value=duration>0?String(Math.round(now/duration*1000)):'0';
  r.querySelectorAll('[data-play]').forEach(n=>n.textContent=a.paused?'▶':'❚❚');
  r.querySelectorAll('[data-speed]').forEach(n=>{if(n.matches('.nh7p500-speed'))n.textContent=rate+'×'});
  const rateNode=r.querySelector('[data-rate]');if(rateNode)rateNode.textContent=rate+'×';
  const nextDisabled=!(s.playQueue?.[s.queueIndex+1]),prevDisabled=!(s.playQueue?.[s.queueIndex-1])&&now<=5;
  r.querySelectorAll('[data-next]').forEach(n=>n.disabled=nextDisabled);r.querySelectorAll('[data-prev]').forEach(n=>n.disabled=prevDisabled);
  const blessingButton=r.querySelector('[data-bless]'),likeButton=r.querySelector('[data-like]');if(blessingButton)blessingButton.hidden=!isSermon(item);if(likeButton)likeButton.hidden=!isSermon(item);
  const blessingPanel=r.querySelector('[data-blessing]');if(blessingPanel&&!isSermon(item))blessingPanel.hidden=true;
  const volumeRow=r.querySelector('[data-volume-row]'),volume=r.querySelector('[data-volume]');
  const canVolume=s.volumeControlSupported!==false;
  if(volumeRow)volumeRow.hidden=!canVolume;if(volume&&!volume.matches(':active'))volume.value=String(Number(a.volume??1));
  const muteIcon=r.querySelector('[data-mute-icon]');if(muteIcon)muteIcon.textContent=a.muted?'🔇':Number(a.volume||1)<.5?'🔉':'🔊';
  const key=mediaId(item)+'|'+art;
  if(key!==lastTrackKey){lastTrackKey=key;r.querySelector('[data-art]').style.backgroundImage=`url("${art.replace(/"/g,'%22')}")`;r.querySelector('[data-bg]').style.backgroundImage=`url("${art.replace(/"/g,'%22')}")`;r.querySelector('[data-cover]').src=art}
}

function start(){ensure();sync();clearInterval(syncTimer);syncTimer=setInterval(sync,350);window.addEventListener('pageshow',sync);window.addEventListener('change',e=>{if(['langSelect','settingsLang'].includes(e.target?.id)){lastTrackKey='';sync()}},true)}
window.NH7_MEDIA_PLAYER_V500={version:VERSION,sync,setExpanded,close:closePlayer};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
