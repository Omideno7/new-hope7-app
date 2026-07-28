/* New Hope 7 — video watermark corner limiter v2.7.2 */
(()=>{'use strict';
const VERSION='2.7.2-watermark-corners';
const attached=new WeakSet();
function apply(el){if(!el)return;const x=parseFloat(el.style.left||'8'),y=parseFloat(el.style.top||'8');el.dataset.nh7WatermarkCorner=(y>=40?'b':'t')+(x>=38?'r':'l')}
function attach(el){if(!el||attached.has(el))return;attached.add(el);apply(el);new MutationObserver(()=>apply(el)).observe(el,{attributes:true,attributeFilter:['style']})}
function scan(root=document){root.querySelectorAll?.('.nh7-media-watermark').forEach(attach);if(root.matches?.('.nh7-media-watermark'))attach(root)}
scan();new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n)}))).observe(document.documentElement,{childList:true,subtree:true});
window.NH7_VIDEO_WATERMARK_FIX_VERSION=VERSION;
})();
