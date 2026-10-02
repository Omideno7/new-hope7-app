/* New Hope 7 — Media Player 2.0 v5.0.0 preview.
 * UI-only layer over the stable v4.8.4 audio engine.
 * Does not create its own audio element or change signed-media/progress logic.
 */
(()=>{'use strict';
if(window.__NH7_MEDIA_PLAYER_V500__)return;
window.__NH7_MEDIA_PLAYER_V500__=true;

const VERSION='5.2.5-favorite-preview';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FAVORITES_KEY='nh7_audio_favorites_v500';
let root=null,expanded=false,lastTrackKey='',syncTimer=0,seeking=false,seekPreview=0,lastRecentId='',iosVolumeVisual=1,downloadUi=null;

const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const engine=()=>window.NH7_AUDIO_CLASSIC_V400||null;
const isIOSWeb=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||((navigator.platform==='MacIntel')&&navigator.maxTouchPoints>1);
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
html.nh7p500-active .nh7-mini485,html.nh7p500-active .nh7-now-playing-v484,html.nh7p500-active [data-classic-player],html.nh7p500-active .nh7-classic-audio-v400,html.nh7p500-active .inline-sermon-player{display:none!important}
.nh7p500{position:fixed;z-index:1900;left:7px;right:7px;bottom:calc(68px + env(safe-area-inset-bottom,0px));color:var(--text,#062444);direction:ltr}
.nh7p500[hidden]{display:none!important}
.nh7p500-mini{position:relative;height:56px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:5px;padding:5px 6px;border:1px solid color-mix(in srgb,var(--line,#d9e6f7) 85%,transparent);border-radius:17px;background:color-mix(in srgb,var(--card,#fff) 91%,transparent);box-shadow:0 10px 30px #0003;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);overflow:hidden}
.nh7p500-track{min-width:0;height:100%;display:flex;align-items:center;gap:8px;border:0;background:transparent;color:inherit;padding:0;text-align:start}
.nh7p500-art{width:42px;height:42px;flex:0 0 42px;border-radius:11px;background:center/cover no-repeat;box-shadow:0 3px 10px #0003}
.nh7p500-copy{min-width:0;display:grid;gap:1px}.nh7p500-copy>*{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nh7p500-copy strong{font-size:.82rem}.nh7p500-copy small{font-size:.64rem;color:var(--muted,#64748b)}
.nh7p500-actions{display:flex;align-items:center;gap:0}.nh7p500-actions button{width:29px;height:29px;border:0;border-radius:9px;background:transparent;color:inherit;font-weight:850;padding:0}.nh7p500-actions .nh7p500-play{background:var(--accent,#1d4ed8);color:#fff;border-radius:50%}.nh7p500-actions .nh7p500-speed{font-size:.58rem}.nh7p500-actions button:disabled{opacity:.32}
.nh7p500-progress{position:absolute;left:8px;right:8px;bottom:0;height:2px;background:#64748b33;border-radius:99px;overflow:hidden}.nh7p500-progress>i{display:block;height:100%;width:0;background:var(--accent,#1d4ed8)}
.nh7p500-full{--nh7p-bg:var(--nh7-studio-bg,var(--bg,#08111f));--nh7p-card:var(--nh7-studio-card,var(--card,#0f1b2c));--nh7p-text:var(--nh7-studio-text,var(--ink,var(--text,#f8fafc)));--nh7p-muted:var(--nh7-studio-muted,var(--muted,#94a3b8));--nh7p-line:var(--nh7-studio-line,var(--line,#ffffff22));--nh7p-accent:var(--nh7-studio-accent,var(--accent,#1d4ed8));position:fixed;inset:0;z-index:1910;background:var(--nh7p-bg);color:var(--nh7p-text);overflow:auto;overscroll-behavior:contain}
.nh7p500-full[hidden]{display:none!important}.nh7p500-bg{position:fixed;inset:-16%;background:center/cover no-repeat;filter:blur(58px) saturate(1.08);opacity:.20;transform:scale(1.08)}
.nh7p500-shade{position:fixed;inset:0;background:linear-gradient(180deg,color-mix(in srgb,var(--nh7p-bg) 54%,transparent) 0%,color-mix(in srgb,var(--nh7p-bg) 86%,transparent) 55%,var(--nh7p-bg) 100%)}
.nh7p500-brandmark{position:fixed;left:50%;top:11%;width:min(46vw,230px);height:min(46vw,230px);object-fit:contain;transform:translateX(-50%);opacity:.055;filter:saturate(.85);pointer-events:none}
.nh7p500-sheet{position:relative;max-width:560px;min-height:100%;margin:auto;padding:calc(14px + env(safe-area-inset-top,0px)) 22px calc(26px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column}
.nh7p500-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.nh7p500-head button{width:40px;height:40px;border:1px solid color-mix(in srgb,var(--nh7p-text) 14%,transparent);border-radius:50%;background:color-mix(in srgb,var(--nh7p-text) 7%,transparent);color:var(--nh7p-text);font-size:1.15rem}.nh7p500-head strong{font-size:.82rem;letter-spacing:.02em;opacity:.88}
.nh7p500-cover{display:block;width:min(78vw,360px);aspect-ratio:1;object-fit:cover;margin:4.5vh auto 20px;border-radius:28px;box-shadow:0 24px 70px #0009}
.nh7p500-meta{display:grid;gap:4px;margin-top:auto}.nh7p500-meta strong{font-size:1.18rem;line-height:1.35}.nh7p500-meta small{font-size:.78rem;color:var(--nh7p-muted)}
.nh7p500-social{display:flex;gap:6px;margin-top:9px}.nh7p500-social button{min-height:34px;border:1px solid color-mix(in srgb,var(--nh7p-text) 18%,transparent);border-radius:999px;background:color-mix(in srgb,var(--nh7p-card) 84%,var(--nh7p-bg));color:var(--nh7p-text)!important;padding:0 11px;font-size:.72rem;font-weight:850}.nh7p500-social button span{margin-inline-end:5px}.nh7p500-social [data-p500-like].on{color:#e11d48}.nh7p500-social b{font-size:.64rem;margin-inline-start:2px}
.nh7p500-seek{width:100%;margin-top:18px;accent-color:var(--nh7p-accent)}.nh7p500-time{display:flex;justify-content:space-between;margin-top:4px;font-size:.67rem;color:var(--nh7p-muted)}
.nh7p500-main{display:flex;align-items:center;justify-content:space-around;gap:7px;margin:14px 0}.nh7p500-main button{width:40px;height:40px;border:0;border-radius:50%;background:color-mix(in srgb,var(--nh7p-text) 8%,transparent);color:var(--nh7p-text);font-weight:900;font-size:.84rem}.nh7p500-main .big{width:58px;height:58px;background:var(--nh7p-text);color:var(--nh7p-bg);font-size:1.12rem;box-shadow:0 7px 24px #0004}.nh7p500-main button:disabled{opacity:.3}
.nh7p500-tools{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.nh7p500-tools button{min-width:0;min-height:44px;border:1px solid color-mix(in srgb,var(--nh7p-text) 18%,transparent);border-radius:12px;background:color-mix(in srgb,var(--nh7p-card) 88%,var(--nh7p-bg));color:var(--nh7p-text)!important;padding:5px 2px;font-weight:850}.nh7p500-tools button span{display:block;font-size:.86rem}.nh7p500-tools button small{display:block;margin-top:2px;font-size:.52rem;color:var(--nh7p-text)!important;opacity:.78;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nh7p500-tools [data-favorite].on{color:#f59e0b}
.nh7p500-tools [data-download]{position:relative;overflow:hidden}.nh7p500-tools [data-download].is-downloaded{border-color:color-mix(in srgb,#16a34a 58%,var(--nh7p-line));background:color-mix(in srgb,#16a34a 12%,var(--nh7p-card))}.nh7p500-tools [data-download].is-downloading{pointer-events:none}.nh7p500-download-progress{display:block;position:absolute;left:5px;right:5px;bottom:3px;height:2px;border-radius:99px;background:color-mix(in srgb,var(--nh7p-text) 14%,transparent);overflow:hidden}.nh7p500-download-progress>b{display:block;height:100%;width:0;background:var(--nh7p-accent);transition:width .18s ease}
.nh7p500-volume{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;margin-top:10px}.nh7p500-volume input{width:100%;accent-color:var(--nh7p-accent)}.nh7p500-volume[hidden]{display:none!important}
.nh7p500-panel-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}.nh7p500-panel-head strong{font-size:.74rem}.nh7p500-panel-head button{width:26px;height:26px;border:0;border-radius:50%;background:color-mix(in srgb,var(--nh7p-text) 8%,transparent);color:var(--nh7p-text);padding:0}
.nh7p500-queue{margin-top:10px;padding:9px;border:1px solid color-mix(in srgb,var(--nh7p-text) 12%,transparent);border-radius:13px;background:color-mix(in srgb,var(--nh7p-card) 72%,transparent)}.nh7p500-queue[hidden]{display:none!important}.nh7p500-queue-list{display:grid;gap:5px}.nh7p500-queue-item{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:7px;align-items:center;width:100%;min-height:40px;border:0;border-radius:10px;background:color-mix(in srgb,var(--nh7p-text) 5%,transparent);color:var(--nh7p-text);padding:3px 6px;text-align:start}.nh7p500-queue-item img{width:34px;height:34px;border-radius:8px;object-fit:cover}.nh7p500-queue-item b{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.64rem}.nh7p500-queue-item small{font-size:.5rem;color:var(--nh7p-muted)}
.nh7p500-queue-empty{padding:6px 2px;font-size:.62rem;color:var(--nh7p-muted)}
.nh7p500-related{margin-top:10px}.nh7p500-related[hidden]{display:none!important}.nh7p500-related-strip{display:flex;gap:7px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}.nh7p500-related-strip::-webkit-scrollbar{display:none}.nh7p500-related-card{width:72px;flex:0 0 72px;border:0;background:transparent;color:var(--nh7p-text);padding:0;text-align:start}.nh7p500-related-card img{display:block;width:72px;height:72px;border-radius:11px;object-fit:cover}.nh7p500-related-card b{display:block;margin-top:4px;font-size:.54rem;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
html[dir="rtl"] .nh7p500-queue-item,html[dir="rtl"] .nh7p500-related-card{text-align:right}
.nh7p500-social-overlay{position:fixed;inset:0;z-index:1985;display:grid;align-items:end}.nh7p500-social-overlay[hidden]{display:none!important}.nh7p500-social-backdrop{position:absolute;inset:0;border:0;background:#0009}.nh7p500-social-sheet{position:relative;z-index:1;max-height:min(72vh,620px);overflow:auto;border-radius:24px 24px 0 0;padding:14px 16px calc(18px + env(safe-area-inset-bottom,0px));background:var(--nh7p-card);color:var(--nh7p-text);border-top:1px solid var(--nh7p-line);box-shadow:0 -18px 50px #0006;--card:var(--nh7p-card);--ink:var(--nh7p-text);--line:var(--nh7p-line)}.nh7p500-social-sheet .nh7p500-panel-head{position:sticky;top:0;z-index:2;padding-bottom:8px;background:var(--nh7p-card)}.nh7p500-social-proxy>[data-nh7-social-v440]{display:grid!important;margin-top:0!important;padding-top:0!important;border-top:0!important}.nh7p500-social-proxy .nh7s440a{display:none!important}.nh7p500-social-proxy textarea{background:var(--nh7p-bg)!important;color:var(--nh7p-text)!important;border-color:var(--nh7p-line)!important}.nh7p500-social-proxy button{color:var(--nh7p-text)!important}.nh7p500-volume-note{display:none;margin-top:4px;text-align:center;font-size:.52rem;color:var(--nh7p-muted)}.nh7p500-volume-note.show{display:block}
.nh7p500-toast{position:fixed;z-index:1999;left:50%;bottom:calc(96px + env(safe-area-inset-bottom,0px));transform:translateX(-50%) translateY(8px);max-width:min(88vw,420px);padding:9px 13px;border-radius:999px;background:color-mix(in srgb,var(--nh7p-text) 92%,transparent);color:var(--nh7p-bg);font-size:.68rem;font-weight:800;box-shadow:0 9px 28px #0005;opacity:0;transition:.18s;pointer-events:none}.nh7p500-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.nh7p500-blessing{margin-top:14px;padding:13px;border:1px solid color-mix(in srgb,var(--nh7p-text) 14%,transparent);border-radius:17px;background:color-mix(in srgb,var(--nh7p-card) 72%,transparent)}.nh7p500-blessing[hidden]{display:none!important}.nh7p500-blessing p{margin:0 0 10px;font-size:.78rem;color:var(--nh7p-muted);line-height:1.55}.nh7p500-blessing button{width:100%;min-height:42px;border:0;border-radius:12px;background:var(--nh7p-text);color:var(--nh7p-bg);font-weight:850}
html.nh7p500-active body #view{padding-bottom:calc(128px + env(safe-area-inset-bottom,0px))!important}html.nh7p500-open,html.nh7p500-open body{overflow:hidden!important}
html[dir="rtl"] .nh7p500-copy,html[dir="rtl"] .nh7p500-meta{text-align:right}
@media(max-width:390px){.nh7p500{left:5px;right:5px}.nh7p500-actions button{width:27px}.nh7p500-cover{width:min(82vw,330px)}.nh7p500-sheet{padding-left:18px;padding-right:18px}.nh7p500-main button{width:38px;height:38px}.nh7p500-main .big{width:56px;height:56px}.nh7p500-tools{gap:5px}.nh7p500-tools button{min-height:44px}}
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
          <button type="button" data-p500-like><span data-like-icon>♡</span>${L('پسندیدن','Like','Sviđa mi se')} <b data-like-count></b></button>
          <button type="button" data-p500-bless><span>💬</span>${L('برکت‌ها','Blessings','Blagoslovi')}</button>
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
          <button type="button" data-speed aria-label="${L('سرعت پخش','Playback speed','Brzina reprodukcije')}"><span data-rate>1×</span></button>
          <button type="button" data-p500-bible><span>📖</span><small>${L('کتاب مقدس','Bible','Biblija')}</small></button>
          <button type="button" data-mute aria-pressed="false"><span data-mute-icon>🔊</span><small>${L('بی‌صدا','Mute','Isključi')}</small></button>
          <button type="button" data-favorite><span data-favorite-icon>☆</span><small>${L('علاقه‌مندی','Favorite','Favorit')}</small></button>
          <button type="button" data-note><span>📝</span><small>${L('یادداشت','Notes','Bilješke')}</small></button>
          <button type="button" data-download><span data-download-icon>⇩</span><small data-download-label>${L('دانلود','Download','Preuzmi')}</small><i class="nh7p500-download-progress" aria-hidden="true"><b data-download-progress></b></i></button>
          <button type="button" data-p500-share><span>↗</span><small>${L('اشتراک','Share','Podijeli')}</small></button>
          <button type="button" data-queue><span>☷</span><small>${L('صف پخش','Queue','Red')}</small></button>
        </div>
        <div class="nh7p500-volume" data-volume-row><span>🔈</span><input data-volume type="range" min="0" max="1" step="0.05" value="1"><span>🔊</span></div>
        <small class="nh7p500-volume-note" data-volume-note>${L('در آیفون، صدای سیستم با دکمه‌های گوشی کنترل می‌شود.','On iPhone, system volume is controlled by the phone buttons.','Na iPhoneu se glasnoća sustava kontrolira tipkama uređaja.')}</small>
        <div class="nh7p500-queue" data-queue-panel><div class="nh7p500-panel-head"><strong>${L('صف پخش','Up Next','Sljedeće')}</strong><button type="button" data-queue-close>×</button></div><div class="nh7p500-queue-list" data-queue-list></div></div>
        <section class="nh7p500-related" data-related-panel hidden><div class="nh7p500-panel-head"><strong>${L('مرتبط و پیشنهادی','Related & Suggested','Povezano i predloženo')}</strong></div><div class="nh7p500-related-strip" data-related-list></div></section>
      </div>
      <div class="nh7p500-social-overlay" data-social-overlay hidden>
        <button type="button" class="nh7p500-social-backdrop" data-social-close aria-label="${L('بستن','Close','Zatvori')}"></button>
        <section class="nh7p500-social-sheet">
          <div class="nh7p500-panel-head"><strong>${L('برکت‌ها','Blessings','Blagoslovi')}</strong><button type="button" data-social-close>×</button></div>
          <div class="nh7p500-social-proxy" data-social-proxy data-nh7-no-quick-bible></div>
        </section>
      </div>
    </section>`;
  document.body.appendChild(root);
  bind();
  return root;
}

function setExpanded(value){
  expanded=!!value;
  const activeAudio=state().audio;if(activeAudio&&activeAudio.preload!=='auto')activeAudio.preload='auto';
  const r=ensure(),full=r.querySelector('[data-full]');
  if(full)full.hidden=!expanded;
  document.documentElement.classList.toggle('nh7p500-open',expanded);
  if(expanded){const qp=r.querySelector('[data-queue-panel]');if(qp)qp.hidden=false;renderQueue();renderRelated()}
  if(!expanded)closeBlessings();
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

function notice(message){
  const r=ensure();let n=r.querySelector('[data-toast]');
  if(!n){n=document.createElement('div');n.className='nh7p500-toast';n.dataset.toast='1';r.appendChild(n)}
  n.textContent=String(message||'');n.classList.add('show');clearTimeout(n._t);n._t=setTimeout(()=>n.classList.remove('show'),2200);
}
function rememberRecent(item){
  if(!isSermon(item))return;const id=mediaId(item);if(!id||id===lastRecentId)return;lastRecentId=id;
  try{const key='nh7_audio_recent_v500',old=JSON.parse(localStorage.getItem(key)||'[]'),next=[id,...(Array.isArray(old)?old.map(String):[]).filter(x=>x!==id)].slice(0,20);localStorage.setItem(key,JSON.stringify(next))}catch(_){}
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


function readFavorites(){
  try{const v=JSON.parse(localStorage.getItem(FAVORITES_KEY)||'[]');return new Set(Array.isArray(v)?v.map(String):[])}catch(_){return new Set()}
}
function writeFavorites(set){try{localStorage.setItem(FAVORITES_KEY,JSON.stringify([...set]))}catch(_){}}
function toggleFavorite(){
  const item=state().current;if(!isSermon(item))return;
  const id=mediaId(item);if(!id)return;
  const set=readFavorites(),next=!set.has(id);
  next?set.add(id):set.delete(id);
  writeFavorites(set);
  sync();
  requestAnimationFrame(()=>window.NH7_AUDIO_LIBRARY_V500_PATCH?.());
  try{window.dispatchEvent(new CustomEvent('nh7:audio-favorite',{detail:{id,on:next}}))}catch(_){}
}
function currentCard(item=state().current){const id=mediaId(item);return id?document.querySelector(`[data-sermon-card="${CSS.escape(id)}"]`):null}
function withCurrentCard(action){
  const item=state().current;if(!item)return;
  const run=()=>{const card=currentCard(item);return card?!!action(card,item):false};
  if(run())return;
  setExpanded(false);engine()?.openCurrentAudio?.();
  let tries=0;const timer=setInterval(()=>{if(run()||tries++>28)clearInterval(timer)},120);
}
function openNotes(){
  const item=state().current;if(!isSermon(item))return;
  withCurrentCard(card=>{const b=card.querySelector('[data-sermon-note]');if(!b)return false;b.click();return true});
}
function shareCurrent(){
  const item=state().current;if(!isSermon(item))return;
  withCurrentCard(card=>{const b=card.querySelector('[data-nh7-social-v440] [data-share]');if(!b)return false;b.click();return true});
}
function downloadMirror(item){
  const card=currentCard(item);if(!card)return{downloaded:false,percent:null};
  const b=card.querySelector('[data-classic-download],[data-external-classic-download]');
  if(!b)return{downloaded:false,percent:null};
  const downloaded=b.classList.contains('is-downloaded-v400')||b.dataset.offlineCached==='1';
  const m=String(b.textContent||'').match(/(\d{1,3})\s*%/),percent=m?Math.max(0,Math.min(99,Number(m[1])||0)):null;
  return{downloaded,percent};
}
function syncDownloadVisual(item){
  const r=ensure(),button=r.querySelector('[data-download]');if(!button||!item)return;
  const mirrored=downloadMirror(item),id=mediaId(item);
  if(mirrored.downloaded){downloadUi=null}
  else if(downloadUi?.id===id&&downloadUi.active&&mirrored.percent!==null)downloadUi.percent=mirrored.percent;
  const active=downloadUi?.id===id&&downloadUi.active&&!mirrored.downloaded;
  const percent=mirrored.downloaded?100:(mirrored.percent!==null?mirrored.percent:(active?downloadUi.percent:null));
  const icon=button.querySelector('[data-download-icon]'),label=button.querySelector('[data-download-label]'),bar=button.querySelector('[data-download-progress]');
  button.classList.toggle('is-downloaded',mirrored.downloaded);
  button.classList.toggle('is-downloading',active);
  if(bar)bar.style.width=(mirrored.downloaded?100:(percent||0))+'%';
  if(mirrored.downloaded){if(icon)icon.textContent='✓';if(label)label.textContent=L('دانلود شد','Downloaded','Preuzeto');return}
  if(active){if(icon)icon.textContent=percent!==null?Math.round(percent)+'%':'…';if(label)label.textContent=L('در حال دانلود','Downloading','Preuzimanje');return}
  if(icon)icon.textContent='⇩';if(label)label.textContent=L('دانلود','Download','Preuzmi');
}
async function waitForDownloadButton(item,timeoutMs=2500){
  const started=Date.now();
  while(Date.now()-started<timeoutMs){
    const card=currentCard(item),b=card?.querySelector('[data-classic-download]');
    if(b)return b;
    await new Promise(resolve=>setTimeout(resolve,60));
  }
  return null;
}
async function downloadCurrent(){
  const item=state().current;if(!item)return;
  const id=mediaId(item),status=downloadMirror(item);
  if(status.downloaded){notice(L('این فایل قبلاً دانلود شده است ✓ برای حذف، از تنظیمات > دانلودها استفاده کنید.','This file is already downloaded ✓ Remove it from Settings > Downloads.','Ova je datoteka već preuzeta ✓ Uklonite je u Postavke > Preuzimanja.'));return}
  if(window.NH7_PLAYER_TEST_MODE&&!window.NH7_PLAYER_TEST_ALLOW_DOWNLOADS){notice(L('حالت تست امن: فایل آفلاین شما تغییر نمی‌کند.','Safe test: your offline file is not changed.','Sigurni test: offline datoteka se ne mijenja.'));return}
  if(downloadUi?.active)return;
  downloadUi={id,active:true,percent:0};syncDownloadVisual(item);
  const promise=Promise.resolve(engine()?.downloadItem?.(item));
  const hiddenButton=await waitForDownloadButton(item);
  let observer=null;
  if(hiddenButton){
    const reflect=()=>{const m=downloadMirror(item);if(downloadUi?.id!==id)return;if(m.percent!==null)downloadUi.percent=m.percent;if(m.downloaded)downloadUi.active=false;syncDownloadVisual(item)};
    observer=new MutationObserver(reflect);observer.observe(hiddenButton,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','data-offline-cached','disabled']});reflect();
  }
  try{await promise}catch(_){}
  finally{try{observer?.disconnect()}catch(_){}}
  for(let i=0;i<12;i++){const m=downloadMirror(item);if(m.downloaded){downloadUi=null;syncDownloadVisual(item);return}await new Promise(resolve=>setTimeout(resolve,120))}
  if(downloadUi?.id===id)downloadUi=null;
  syncDownloadVisual(item);
  if(!downloadMirror(item).downloaded)notice(L('دانلود کامل نشد؛ دوباره تلاش کنید.','Download did not finish; please try again.','Preuzimanje nije dovršeno; pokušajte ponovno.'));
}
function toggleQueue(){const p=ensure().querySelector('[data-queue-panel]');if(!p)return;p.hidden=!p.hidden;if(!p.hidden)renderQueue()}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function renderQueue(){
  const r=ensure(),s=state(),list=r.querySelector('[data-queue-list]');if(!list)return;
  const q=Array.isArray(s.playQueue)?s.playQueue:[],start=Math.max(0,Number(s.queueIndex||0)+1),next=q.slice(start,start+5);
  list.innerHTML=next.length?next.map((x,offset)=>'<button type="button" class="nh7p500-queue-item" data-queue-index="'+(start+offset)+'"><img src="'+artworkFor(x).replace(/"/g,'&quot;')+'" alt=""><b>'+escapeHtml(titleFor(x))+'</b><small>'+L('بعدی','Next','Sljedeće')+'</small></button>').join(''):'<div class="nh7p500-queue-empty">'+L('فایل دیگری در صف نیست.','No more items in the queue.','Nema više stavki u redu.')+'</div>';
}
function renderRelated(){
  const r=ensure(),item=state().current,p=r.querySelector('[data-related-panel]'),list=r.querySelector('[data-related-list]');
  if(!p||!list||!isSermon(item)){if(p)p.hidden=true;return}
  const group=String(item?.category_id||item?.analytics_source_group||''),all=Object.values(window.__sermonMap||{}).filter(x=>isSermon(x)&&mediaId(x)!==mediaId(item));
  const rel=(group?all.filter(x=>String(x?.category_id||x?.analytics_source_group||'')===group):all).slice(0,6);
  p.hidden=!rel.length;list.innerHTML=rel.map(x=>'<button type="button" class="nh7p500-related-card" data-related-id="'+escapeHtml(mediaId(x))+'"><img src="'+artworkFor(x).replace(/"/g,'&quot;')+'" alt=""><b>'+escapeHtml(titleFor(x))+'</b></button>').join('');
}

function closeBlessings(){
  const r=root;if(!r)return;const overlay=r.querySelector('[data-social-overlay]'),proxy=r.querySelector('[data-social-proxy]');
  if(overlay)overlay.hidden=true;if(proxy){proxy.replaceChildren();delete proxy.dataset.sermonCard}
}
function openBlessings(){
  const item=state().current;if(!isSermon(item))return;
  const r=ensure(),overlay=r.querySelector('[data-social-overlay]'),proxy=r.querySelector('[data-social-proxy]');
  if(!overlay||!proxy)return;
  proxy.replaceChildren();proxy.dataset.sermonCard=mediaId(item);proxy.dataset.nh7NoQuickBible='1';overlay.hidden=false;
  try{window.NH7_SERMON_SOCIAL_PATCH?.()}catch(_){}
  let tries=0;
  const timer=setInterval(()=>{
    const social=proxy.querySelector('[data-nh7-social-v440]');
    if(social){
      clearInterval(timer);
      try{window.NH7_SERMON_SOCIAL_REFRESH_CARD?.(proxy)}catch(_){}
      setTimeout(()=>{const compose=social.querySelector('[data-compose]');if(compose&&!compose.classList.contains('open'))social.querySelector('[data-bless]')?.click()},80);
    }else if(tries++>25){clearInterval(timer);notice(L('بخش برکت‌ها آماده نشد. دوباره تلاش کنید.','Blessings did not load. Please try again.','Blagoslovi se nisu učitali. Pokušajte ponovno.'))}
  },80);
}

function bind(){
  root.addEventListener('click',event=>{
    const {audio:a}=state();
    if(event.target.closest('[data-social-close]'))return closeBlessings();
    if(event.target.closest('[data-expand]'))return setExpanded(true);
    if(event.target.closest('[data-collapse]'))return setExpanded(false);
    if(event.target.closest('[data-close]'))return closePlayer();
    if(event.target.closest('[data-prev]'))return engine()?.playPreviousTrack?.('player-v500');
    if(event.target.closest('[data-next]'))return engine()?.playNextTrack?.('player-v500');
    if(event.target.closest('[data-play]')&&a){a.paused?a.play().catch(()=>{}):a.pause();return}
    if(event.target.closest('[data-back]')&&a){a.currentTime=Math.max(0,Number(a.currentTime||0)-15);return}
    if(event.target.closest('[data-forward]')&&a){a.currentTime=Math.min(Number.isFinite(a.duration)?a.duration:Infinity,Number(a.currentTime||0)+30);return}
    if(event.target.closest('[data-speed]'))return cycleSpeed();
    if(event.target.closest('[data-mute]')){engine()?.toggleMediaMute?.();sync();return}
    if(event.target.closest('[data-p500-bible]'))return window.NH7QuickBibleV454?.open?.(event.target.closest('[data-p500-bible]'));
    if(event.target.closest('[data-favorite]'))return toggleFavorite();
    if(event.target.closest('[data-note]'))return openNotes();
    if(event.target.closest('[data-download]'))return downloadCurrent();
    if(event.target.closest('[data-p500-share]')){shareCurrent();return}
    if(event.target.closest('[data-queue]'))return toggleQueue();
    if(event.target.closest('[data-queue-close]')){const p=root.querySelector('[data-queue-panel]');if(p)p.hidden=true;return}
    const qi=event.target.closest('[data-queue-index]');if(qi){const s=state(),x=s.playQueue?.[Number(qi.dataset.queueIndex)];if(x)engine()?.playItem?.(x);return}
    const rel=event.target.closest('[data-related-id]');if(rel){const x=window.__sermonMap?.[String(rel.dataset.relatedId)];if(x)engine()?.playItem?.(x);return}
    if(event.target.closest('[data-p500-like]'))return likeCurrent();
    if(event.target.closest('[data-p500-bless]'))return openBlessings()
    if(event.target.closest('[data-open-blessings]'))return openBlessings();
  });
  root.addEventListener('input',event=>{
    const {audio:a}=state();
    if(event.target.matches('[data-seek]')&&a&&Number.isFinite(a.duration)&&a.duration>0){
      seeking=true;seekPreview=(Number(event.target.value)/1000)*a.duration;
      event.target.style.setProperty('--nh7-seek-pct',Math.max(0,Math.min(100,Number(event.target.value)/10))+'%');
      const n=root.querySelector('[data-now]');if(n)n.textContent=fmt(seekPreview);return
    }
    if(event.target.matches('[data-volume]')){
      if(isIOSWeb()){
        iosVolumeVisual=Math.max(0,Math.min(1,Number(event.target.value)||0));
        const bridge=window.NH7_NATIVE_VOLUME_V500;
        if(bridge?.setVolume){Promise.resolve(bridge.setVolume(iosVolumeVisual)).catch(()=>{});return}
        notice(L('در این تست وب، iPhone اجازهٔ تغییر صدای سیستم از اسلایدر را نمی‌دهد؛ از دکمه‌های گوشی استفاده کنید.','In this web test, iPhone does not allow system volume changes from the slider; use the phone buttons.','U ovom web testu iPhone ne dopušta promjenu sistemske glasnoće klizačem; koristite tipke uređaja.'));return
      }
      engine()?.setMediaVolume?.(event.target.value);
    }
  });
  const commitSeek=event=>{
    const {audio:a}=state(),el=event.target;
    if(!el?.matches?.('[data-seek]')||!a||!Number.isFinite(a.duration)||a.duration<=0)return;
    const target=Math.max(0,Math.min(a.duration,(Number(el.value)/1000)*a.duration));
    try{a.currentTime=target}catch(_){}
    seekPreview=target;setTimeout(()=>{seeking=false;sync()},180);
  };
  root.addEventListener('change',commitSeek);
  root.addEventListener('pointerup',commitSeek);
  root.addEventListener('touchend',commitSeek,{passive:true});
}

function sync(){
  const r=ensure(),s=state(),a=s.audio,item=s.current,active=!!(a&&item&&a.src);
  r.hidden=!active;
  document.documentElement.classList.toggle('nh7p500-active',active);
  if(!active){expanded=false;const full=r.querySelector('[data-full]');if(full)full.hidden=true;document.documentElement.classList.remove('nh7p500-open');return}
  const duration=Number.isFinite(a.duration)&&a.duration>0?a.duration:(Number(item?.duration_seconds||0)||Number(item?.duration_minutes||0)*60||0);
  const now=Number(a.currentTime||0),progress=duration>0?Math.max(0,Math.min(100,now/duration*100)):0;
  const ttl=titleFor(item),artist=artistFor(item),art=artworkFor(item),rate=Number(a.playbackRate||1);
  const socialProxy=r.querySelector('[data-social-proxy]');if(socialProxy?.dataset?.sermonCard&&socialProxy.dataset.sermonCard!==mediaId(item))closeBlessings();
  r.querySelectorAll('[data-title],[data-full-title]').forEach(n=>n.textContent=ttl);
  r.querySelector('[data-mini-meta]').textContent=`${fmt(now)} · ${rate}×`;
  r.querySelector('[data-artist]').textContent=artist;
  r.querySelector('[data-now]').textContent=fmt(seeking?seekPreview:now);r.querySelector('[data-total]').textContent=fmt(duration);
  const seekPct=seeking&&duration>0?Math.max(0,Math.min(100,seekPreview/duration*100)):progress;
  r.querySelector('[data-progress]').style.width=seekPct+'%';
  const seekEl=r.querySelector('[data-seek]');
  if(seekEl){
    if(!seeking)seekEl.value=duration>0?String(Math.round(now/duration*1000)):'0';
    seekEl.style.setProperty('--nh7-seek-pct',seekPct+'%');
  }
  rememberRecent(item);
  const playGlyph=a.paused?'▶':'❚❚';
  r.querySelectorAll('[data-play]').forEach(n=>{if(n.textContent!==playGlyph)n.textContent=playGlyph;n.dataset.nh7PlayState517=a.paused?'play':'pause'});
  r.querySelectorAll('[data-speed]').forEach(n=>{if(n.matches('.nh7p500-speed'))n.textContent=rate+'×'});
  const rateNode=r.querySelector('[data-rate]');if(rateNode)rateNode.textContent=rate+'×';
  const nextDisabled=!(s.playQueue?.[s.queueIndex+1]),prevDisabled=!(s.playQueue?.[s.queueIndex-1])&&now<=5;
  r.querySelectorAll('[data-next]').forEach(n=>n.disabled=nextDisabled);r.querySelectorAll('[data-prev]').forEach(n=>n.disabled=prevDisabled);
  const sermonOnly=['[data-p500-bless]','[data-p500-like]','[data-favorite]','[data-note]','[data-p500-share]'];sermonOnly.forEach(sel=>{const n=r.querySelector(sel);if(n)n.hidden=!isSermon(item)});
  const blessingButton=r.querySelector('[data-p500-bless]'),likeButton=r.querySelector('[data-p500-like]'),favoriteButton=r.querySelector('[data-favorite]');
  if(favoriteButton){const on=readFavorites().has(mediaId(item));favoriteButton.classList.toggle('on',on);favoriteButton.setAttribute('aria-pressed',String(on));favoriteButton.setAttribute('aria-label',on?L('حذف از علاقه‌مندی‌ها','Remove from favorites','Ukloni iz favorita'):L('افزودن به علاقه‌مندی‌ها','Add to favorites','Dodaj u favorite'));const icon=r.querySelector('[data-favorite-icon]');if(icon)icon.textContent=on?'★':'☆'}
  if(isSermon(item)){
    const card=document.querySelector(`[data-sermon-card="${CSS.escape(mediaId(item))}"]`),socialLike=card?.querySelector('[data-nh7-social-v440] [data-like]'),likeIcon=r.querySelector('[data-like-icon]'),likeCount=r.querySelector('[data-like-count]');
    if(socialLike){const count=socialLike.querySelector('span')?.textContent||'';if(likeIcon)likeIcon.textContent=socialLike.classList.contains('on')?'♥':'♡';if(likeButton)likeButton.classList.toggle('on',socialLike.classList.contains('on'));if(likeCount)likeCount.textContent=count}
  }
  const volumeRow=r.querySelector('[data-volume-row]'),volume=r.querySelector('[data-volume]');
  const canVolume=s.volumeControlSupported!==false;
  if(volumeRow)volumeRow.hidden=false;
  const volumeNote=r.querySelector('[data-volume-note]');if(volumeNote)volumeNote.classList.toggle('show',isIOSWeb());
  if(volume&&!volume.matches(':active'))volume.value=isIOSWeb()?String(iosVolumeVisual):String(Number(a.volume??1));
  const muteButton=r.querySelector('[data-mute]'),muteIcon=r.querySelector('[data-mute-icon]');if(muteIcon)muteIcon.textContent=a.muted?'🔇':'🔊';if(muteButton){muteButton.classList.toggle('is-muted',!!a.muted);muteButton.setAttribute('aria-pressed',String(!!a.muted));muteButton.setAttribute('aria-label',a.muted?L('وصل کردن صدا','Unmute','Uključi zvuk'):L('بی‌صدا کردن','Mute','Isključi zvuk'));const label=muteButton.querySelector('small');if(label)label.textContent=a.muted?L('وصل صدا','Unmute','Uključi'):L('بی‌صدا','Mute','Isključi')}
  syncDownloadVisual(item);
  const key=mediaId(item)+'|'+art;
  if(key!==lastTrackKey){
    lastTrackKey=key;
    r.querySelector('[data-art]').style.backgroundImage=`url("${art.replace(/"/g,'%22')}")`;
    r.querySelector('[data-bg]').style.backgroundImage=`url("${art.replace(/"/g,'%22')}")`;
    r.querySelector('[data-cover]').src=art;
    renderQueue();renderRelated();
  }
}

function start(){ensure();sync();clearInterval(syncTimer);syncTimer=setInterval(sync,250);window.addEventListener('pageshow',sync);window.addEventListener('change',e=>{if(['langSelect','settingsLang'].includes(e.target?.id)){lastTrackKey='';sync()}},true)}
window.NH7_MEDIA_PLAYER_V500={version:VERSION,sync,setExpanded,close:closePlayer};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
