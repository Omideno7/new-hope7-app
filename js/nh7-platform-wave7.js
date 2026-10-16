/* Shared presentation geometry only. Current router, v570 navigation and v558 media dock own behavior. */
(()=>{'use strict';
if(window.NH7PlatformWave7)return;
const root=document.documentElement;let frame=0,started=false,frames=0,observations=0;
function set(name,value){if(root.style.getPropertyValue(name)!==value)root.style.setProperty(name,value)}
function measure(){
 frame=0;frames++;
 let platform='web';try{platform=window.Capacitor?.getPlatform?.()||window.cordova?.platformId||'web'}catch(_){}
 root.classList.toggle('nh7-platform-native',platform==='ios'||platform==='android');
 const height=Math.min(innerHeight,window.visualViewport?.height||innerHeight);
 if(height>0)set('--nh7-platform-height',Math.round(height)+'px');
 for(const [name,selector]of [['header','.topbar'],['nav','.bottom-nav']]){
  const box=document.querySelector('#appShell > '+selector)?.getBoundingClientRect();
  if(box?.height)set('--nh7-platform-'+name,Math.ceil(box.height)+'px');
 }
 root.classList.add('nh7-platform-ready');
}
function schedule(){if(!frame)frame=requestAnimationFrame(measure)}
function start(){
 if(started)return;started=true;
 const header=document.querySelector('#appShell > .topbar'),nav=document.querySelector('#appShell > .bottom-nav');
 if(window.ResizeObserver){const observer=new ResizeObserver(()=>{observations++;schedule()});if(header)observer.observe(header);if(nav)observer.observe(nav)}
 schedule();
}
window.NH7PlatformWave7={refresh:schedule,metrics:()=>({frames,observations,started})};
addEventListener('resize',schedule,{passive:true});addEventListener('orientationchange',schedule,{passive:true});
addEventListener('pageshow',schedule,{passive:true});
addEventListener('nh7-route-changed-wave6',()=>{if(root.classList.contains('nh7-platform-native')){const view=document.getElementById('view');if(view)view.scrollTop=0}schedule()});
window.visualViewport?.addEventListener('resize',schedule,{passive:true});
window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
document.addEventListener('deviceready',schedule,{once:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
