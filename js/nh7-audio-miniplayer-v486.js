/* New Hope 7 v4.8.5 — collapsible persistent mini-player UI over the stable v484 audio engine. */
(()=>{'use strict';
if(window.__NH7_AUDIO_MINIPLAYER_V486__)return;
window.__NH7_AUDIO_MINIPLAYER_V486__=true;

const VERSION='4.8.6-collapsible-miniplayer-close';
let root=null,expanded=false,lastTrackId='',lastRoute='',timer=0;
const L=(fa,en,hr)=>{const v=String(localStorage.getItem('nh7_lang')||document.documentElement.lang||'en').toLowerCase();return v.startsWith('fa')?fa:v.startsWith('hr')?hr:en};
const fmt=v=>{const s=Math.max(0,Number(v)||0),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),x=Math.floor(s%60);return h?`${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`:`${m}:${String(x).padStart(2,'0')}`};
function engine(){return window.NH7_AUDIO_CLASSIC_V400||null}
function state(){try{return engine()?.getState?.()||{}}catch(_){return{}}}
function route(){try{return decodeURIComponent(String(location.hash||'').replace(/^#/,'').split(':')[0]||'')}catch(_){return''}}
function titleFor(item){
  const lang=String(localStorage.getItem('nh7_lang')||'en').toLowerCase();
  return String(item?.['title_'+lang]||item?.title_fa||item?.title_en||item?.title_hr||item?.title||L('فایل صوتی','Audio','Audio'));
}
function artFor(item){
  const raw=String(item?.cover_url||item?.artwork_url||'assets/new-hope7-logo-512.png');
  try{return new URL(raw,location.href).href}catch(_){return new URL('assets/new-hope7-logo-512.png',location.href).href}
}
function persistProgressBeforeClose(){
  const s=state(),a=s.audio,item=s.current;if(!a||!item)return;
  const id=String(item?.id||item?.analytics_id||'');if(!id)return;
  try{localStorage.setItem('nh7_sermon_progress_'+id,JSON.stringify({
    time:Number(a.currentTime||0),
    duration:Number.isFinite(a.duration)?Number(a.duration||0):Number(item?.duration_seconds||0),
    completed:false,updatedAt:new Date().toISOString()
  }))}catch(_){}
}
function clearSystemMediaSession(){
  try{
    if(!('mediaSession'in navigator))return;
    navigator.mediaSession.metadata=null;
    try{navigator.mediaSession.playbackState='none'}catch(_){}
    for(const action of ['play','pause','stop','seekbackward','seekforward','seekto','nexttrack','previoustrack']){
      try{navigator.mediaSession.setActionHandler(action,null)}catch(_){}
    }
  }catch(_){}
}
function closeMiniPlayer(){
  const s=state(),a=s.audio;
  persistProgressBeforeClose();setExpanded(false);
  if(a){
    try{a.pause()}catch(_){}
    setTimeout(()=>{
      try{a.removeAttribute('src');a.load()}catch(_){}
      clearSystemMediaSession();
      if(root)root.hidden=true;
      document.body.classList.remove('nh7-mini485-expanded');
    },80);
  }else{
    clearSystemMediaSession();
    if(root)root.hidden=true;
  }
}
function ensure(){
  if(root&&document.body.contains(root))return root;
  root=document.createElement('aside');
  root.className='nh7-mini485';
  root.hidden=true;
  root.innerHTML=`
    <div class="nh7-mini485-bar">
      <button class="nh7-mini485-open" type="button" data-mini-open>
        <span class="nh7-mini485-art" data-mini-art></span>
        <span class="nh7-mini485-copy"><strong data-mini-title></strong><small data-mini-time></small></span>
      </button>
      <div class="nh7-mini485-actions">
        <button type="button" data-mini-prev aria-label="${L('قبلی','Previous','Prethodno')}">⏮</button>
        <button type="button" class="nh7-mini485-play" data-mini-toggle aria-label="Play/Pause">▶</button>
        <button type="button" data-mini-next aria-label="${L('بعدی','Next','Sljedeće')}">⏭</button>
        <button type="button" data-mini-expand aria-label="${L('باز کردن پلیر','Expand player','Proširi player')}">⌃</button>
        <button type="button" class="nh7-mini485-close" data-mini-close aria-label="${L('بستن پلیر','Close player','Zatvori player')}">×</button>
      </div>
      <span class="nh7-mini485-progress"><i data-mini-progress></i></span>
    </div>
    <section class="nh7-mini485-sheet" data-mini-sheet hidden>
      <div class="nh7-mini485-bg" data-mini-bg></div>
      <div class="nh7-mini485-sheet-content">
        <button type="button" class="nh7-mini485-collapse" data-mini-collapse>⌄</button>
        <div class="nh7-mini485-cover" data-mini-cover></div>
        <strong class="nh7-mini485-sheet-title" data-sheet-title></strong>
        <small class="nh7-mini485-brand">New Hope 7</small>
        <div class="nh7-mini485-timeline">
          <span data-sheet-now>0:00</span>
          <input data-sheet-seek type="range" min="0" max="1000" value="0">
          <span data-sheet-total>0:00</span>
        </div>
        <div class="nh7-mini485-main">
          <button type="button" data-mini-prev>⏮</button>
          <button type="button" data-mini-back>↶15</button>
          <button type="button" class="nh7-mini485-mainplay" data-mini-toggle>▶</button>
          <button type="button" data-mini-forward>30↷</button>
          <button type="button" data-mini-next>⏭</button>
        </div>
        <div class="nh7-mini485-tools">
          <button type="button" data-mini-speed-down>−</button>
          <button type="button" data-mini-rate><strong>1×</strong></button>
          <button type="button" data-mini-speed-up>+</button>
          <button type="button" data-mini-mute>🔊</button>
          <small>${L('ولوم با دکمه‌های گوشی','Volume: phone buttons','Glasnoća: tipke telefona')}</small>
        </div>
      </div>
    </section>`;
  root.addEventListener('click',e=>{
    const E=engine(),s=state(),a=s.audio;if(!E)return;
    if(e.target.closest('[data-mini-close]')){closeMiniPlayer();return}
    if(e.target.closest('[data-mini-open],[data-mini-expand]')){setExpanded(!expanded);return}
    if(e.target.closest('[data-mini-collapse]')){setExpanded(false);return}
    if(e.target.closest('[data-mini-prev]')){E.playPreviousTrack?.('mini-v485');return}
    if(e.target.closest('[data-mini-next]')){E.playNextTrack?.('mini-v485');return}
    if(e.target.closest('[data-mini-toggle]')&&a){if(a.paused)a.play().catch(()=>{});else a.pause();return}
    if(e.target.closest('[data-mini-back]')&&a){a.currentTime=Math.max(0,Number(a.currentTime||0)-15);return}
    if(e.target.closest('[data-mini-forward]')&&a){a.currentTime=Math.min(Number.isFinite(a.duration)?a.duration:Infinity,Number(a.currentTime||0)+30);return}
    if(e.target.closest('[data-mini-speed-down]')){const rates=[.75,1,1.25,1.5,2],r=Number(a?.playbackRate||1),i=Math.max(0,rates.indexOf(r));E.setPlaybackSpeed?.(rates[Math.max(0,i-1)]);return}
    if(e.target.closest('[data-mini-speed-up]')){const rates=[.75,1,1.25,1.5,2],r=Number(a?.playbackRate||1),i=Math.max(0,rates.indexOf(r));E.setPlaybackSpeed?.(rates[Math.min(rates.length-1,i+1)]);return}
    if(e.target.closest('[data-mini-rate]')){const rates=[.75,1,1.25,1.5,2],r=Number(a?.playbackRate||1),i=Math.max(0,rates.indexOf(r));E.setPlaybackSpeed?.(rates[(i+1)%rates.length]);return}
    if(e.target.closest('[data-mini-mute]')){E.toggleMediaMute?.();return}
  });
  root.addEventListener('input',e=>{
    const seek=e.target.closest?.('[data-sheet-seek]'),a=state().audio;
    if(seek&&a&&Number.isFinite(a.duration)&&a.duration>0)a.currentTime=a.duration*Number(seek.value||0)/1000;
  });
  document.body.appendChild(root);
  return root;
}
function setExpanded(value){
  expanded=!!value;const r=ensure(),sheet=r.querySelector('[data-mini-sheet]'),exp=r.querySelector('[data-mini-expand]');
  if(sheet)sheet.hidden=!expanded;if(exp)exp.textContent=expanded?'⌄':'⌃';
  r.classList.toggle('is-expanded',expanded);
  document.body.classList.toggle('nh7-mini485-expanded',expanded);
}
function sync(){
  const r=ensure(),s=state(),a=s.audio,item=s.current;
  // Hide the older wide v484 bar while this UI is active.
  document.documentElement.classList.add('nh7-mini485-active');
  if(!a||!item||!a.src){r.hidden=true;return}
  r.hidden=false;
  const id=String(item?.id||item?.analytics_id||'');
  if(id!==lastTrackId){lastTrackId=id;setExpanded(false)}
  const now=Number(a.currentTime||0),total=Number.isFinite(a.duration)?Number(a.duration||0):Number(item?.duration_seconds||0),p=total>0?Math.max(0,Math.min(100,now/total*100)):0,title=titleFor(item),art=artFor(item);
  r.querySelectorAll('[data-mini-title],[data-sheet-title]').forEach(n=>n.textContent=title);
  r.querySelectorAll('[data-mini-toggle]').forEach(n=>n.textContent=a.paused?'▶':'❚❚');
  const t=r.querySelector('[data-mini-time]');if(t)t.textContent=`${fmt(now)} · ${Number(a.playbackRate||1)}×`;
  const pr=r.querySelector('[data-mini-progress]');if(pr)pr.style.width=p+'%';
  const seek=r.querySelector('[data-sheet-seek]');if(seek)seek.value=total>0?Math.round(now/total*1000):0;
  const sn=r.querySelector('[data-sheet-now]'),st=r.querySelector('[data-sheet-total]');if(sn)sn.textContent=fmt(now);if(st)st.textContent=fmt(total);
  const rate=r.querySelector('[data-mini-rate] strong');if(rate)rate.textContent=Number(a.playbackRate||1)+'×';
  const mute=r.querySelector('[data-mini-mute]');if(mute)mute.textContent=a.muted?'🔇':'🔊';
  for(const sel of ['[data-mini-art]','[data-mini-cover]','[data-mini-bg]']){const n=r.querySelector(sel);if(n)n.style.backgroundImage=`url("${art.replace(/"/g,'%22')}")`}
  const currentRoute=route();if(currentRoute!==lastRoute){lastRoute=currentRoute;if(!['audio','school','audioBible'].includes(currentRoute))setExpanded(false)}
}
const style=document.createElement('style');
style.textContent=`
html.nh7-mini485-active .nh7-now-playing-v484{display:none!important}
.nh7-mini485{position:fixed;left:7px;right:7px;bottom:calc(68px + env(safe-area-inset-bottom,0px));z-index:1600;color:var(--text,#062444)}
.nh7-mini485[hidden]{display:none!important}.nh7-mini485-bar{position:relative;height:52px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:5px;padding:5px 6px;border-radius:14px;border:1px solid color-mix(in srgb,var(--line,#d9e6f7) 82%,transparent);background:color-mix(in srgb,var(--card,#fff) 92%,transparent);box-shadow:0 8px 24px rgba(0,0,0,.16);backdrop-filter:blur(18px);overflow:hidden}
.nh7-mini485-open{min-width:0;height:100%;display:flex;align-items:center;gap:7px;border:0;background:transparent;color:inherit;padding:0;text-align:start}.nh7-mini485-art{width:36px;height:36px;flex:0 0 36px;border-radius:10px;background:var(--soft,#eef7ff) center/cover no-repeat}.nh7-mini485-copy{min-width:0;display:flex;flex-direction:column;gap:1px}.nh7-mini485-copy strong{font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nh7-mini485-copy small{font-size:.63rem;opacity:.62}
.nh7-mini485-actions{display:flex;gap:0;align-items:center}.nh7-mini485-actions button{width:30px;height:30px;border:0;border-radius:9px;background:transparent;color:inherit;font-weight:800}.nh7-mini485-actions .nh7-mini485-close{width:27px;height:27px;margin-inline-start:1px;font-size:1.15rem;font-weight:500;opacity:.58}.nh7-mini485-actions .nh7-mini485-close:active{opacity:1;background:color-mix(in srgb,#d92d20 10%,transparent);color:#b42318}.nh7-mini485-actions .nh7-mini485-play{width:36px;height:36px;border-radius:50%;background:var(--accent,#0476d9);color:#fff}.nh7-mini485-progress{position:absolute;left:0;right:0;bottom:0;height:2px;background:color-mix(in srgb,var(--line,#d9e6f7) 75%,transparent)}.nh7-mini485-progress i{display:block;height:100%;width:0;background:var(--accent,#0476d9)}
.nh7-mini485-sheet{position:fixed;left:7px;right:7px;bottom:calc(68px + env(safe-area-inset-bottom,0px));min-height:390px;border-radius:24px;overflow:hidden;background:var(--card,#fff);border:1px solid var(--line,#d9e6f7);box-shadow:0 22px 64px rgba(0,0,0,.30)}.nh7-mini485-sheet[hidden]{display:none!important}.nh7-mini485-bg{position:absolute;inset:0;background:center/cover no-repeat;filter:blur(30px);transform:scale(1.18);opacity:.24}.nh7-mini485-sheet:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,color-mix(in srgb,var(--card,#fff) 40%,transparent),var(--card,#fff) 68%);pointer-events:none}.nh7-mini485-sheet-content{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:12px 16px 18px}.nh7-mini485-collapse{align-self:flex-end;width:38px;height:30px;border:0;border-radius:10px;background:var(--soft,#eef7ff);color:inherit}.nh7-mini485-cover{width:112px;height:112px;border-radius:22px;background:center/cover no-repeat;box-shadow:0 14px 34px rgba(0,0,0,.22)}.nh7-mini485-sheet-title{max-width:92%;margin-top:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nh7-mini485-brand{margin-top:3px;opacity:.6}.nh7-mini485-timeline{width:100%;display:grid;grid-template-columns:42px 1fr 42px;gap:6px;align-items:center;margin-top:14px}.nh7-mini485-timeline span{font-size:.67rem;text-align:center;opacity:.65}.nh7-mini485-timeline input{width:100%;padding:0}
.nh7-mini485-main{display:flex;gap:8px;align-items:center;margin-top:14px}.nh7-mini485-main button{width:42px;height:42px;border:1px solid var(--line,#d9e6f7);border-radius:50%;background:var(--soft,#eef7ff);color:inherit;font-weight:850}.nh7-mini485-mainplay{width:60px!important;height:60px!important;background:var(--accent,#0476d9)!important;color:#fff!important;border:0!important;font-size:1.2rem}.nh7-mini485-tools{display:flex;align-items:center;gap:6px;margin-top:14px;padding:7px 9px;border-radius:13px;background:color-mix(in srgb,var(--soft,#eef7ff) 76%,transparent)}.nh7-mini485-tools button{min-width:34px;height:32px;border:0;border-radius:9px;background:transparent;color:inherit;font-weight:850}.nh7-mini485-tools [data-mini-rate]{min-width:50px;background:color-mix(in srgb,var(--card,#fff) 82%,transparent)}.nh7-mini485-tools small{font-size:.64rem;opacity:.6;margin-inline-start:2px}
html.nh7-mini485-active body #view{padding-bottom:calc(120px + env(safe-area-inset-bottom,0px))!important}
`;
document.head.appendChild(style);
timer=setInterval(sync,250);setTimeout(sync,200);
window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
window.NH7_AUDIO_MINIPLAYER_VERSION=VERSION;
window.NH7_AUDIO_MINIPLAYER_V486={sync,setExpanded,close:closeMiniPlayer,get expanded(){return expanded}};
})();