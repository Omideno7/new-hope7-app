import fs from 'node:fs';

const read=(p)=>fs.readFileSync(p,'utf8');
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};
const has=(text,needle,msg)=>must(text.includes(needle),msg||`Missing: ${needle}`);

const index=read('index.html');
const css=read('css/nh7-finalqa-v558.css');
const adaptive=read('js/nh7-adaptive-layout-v570.js');
const release=read('sw-release-core-v403.js');
const app=read('js/app.js');

has(index,'css/nh7-finalqa-v558.css?v=5.7.0-responsive','Responsive CSS cache identity missing');
has(index,'js/nh7-adaptive-layout-v570.js?v=5.7.0','Adaptive runtime is not wired');

for(const bp of ['@media (min-width:600px)','@media (min-width:768px)','@media (min-width:1024px)','@media (min-width:1366px)','@media (max-width:599px)']){
  has(css,bp,`Missing responsive breakpoint ${bp}`);
}
has(css,'inset-inline-start','Logical rail positioning missing');
has(css,"html.nh7p500-active .nh7p500",'Wide-screen mini-player dock override missing');
has(css,'.school-entry-actions','School responsive action layout missing');

has(adaptive,"const MIN_SPLIT=768",'Tablet split breakpoint changed unexpectedly');
has(adaptive,"const eligible=(r==='bible'||r==='audio')",'Adaptive routes must stay scoped to Bible/Audio');
has(adaptive,'matchMedia(`(min-width:${MIN_SPLIT}px)`).matches','Phone DOM guard missing');
has(adaptive,'source.click();','Adaptive controls must forward to canonical controls');
has(adaptive,'fresh.dataset.nh7Signature!==old.dataset.nh7Signature','Observer/sidebar signature guard missing');
has(adaptive,"new MutationObserver(schedule)",'Adaptive route re-render observer missing');

const offlineNeedle="'./js/nh7-adaptive-layout-v570.js'";
const occurrences=release.split(offlineNeedle).length-1;
must(occurrences>=1,'Adaptive runtime missing from release offline assets');
has(release,'"js/nh7-adaptive-layout-v570.js"','Adaptive runtime missing from release fetch allow-list');

has(app,"$$('[data-go]').forEach(el=>el.onclick=()=>navigate",'Canonical data-go binding changed; review adaptive forwarding before merge');
has(app,'data-go="audio"','Audio route controls missing');
has(app,'data-go="bible"','Bible route controls missing');

console.log('Responsive v570 static verification OK');
