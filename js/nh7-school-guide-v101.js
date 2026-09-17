/* New Hope 7 — School Guide UI v1.0.1
 * Preview helper: collapses school instructions behind a compact trilingual guide control.
 * QA-only controls remain explicitly marked preview-only and must never ship in Production.
 */
(()=>{'use strict';
if(window.__NH7_SCHOOL_GUIDE_V101__)return;window.__NH7_SCHOOL_GUIDE_V101__=true;
const lang=()=>{const x=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(x)?x:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const label=()=>L('راهنمای مدرسه','School Guide','Vodič škole');
const hint=()=>L('برای مشاهده قوانین و روند مدرسه لمس کنید','Tap to view school rules and learning flow','Dodirnite za pravila i tijek škole');
function markPreviewOnly(root=document){
  root.querySelectorAll?.('.nh7-school-rule-note,.nh7-school-qa-tools,.nh7-preview-reset,[data-preview-pass],[data-preview-fail]').forEach(el=>el.dataset.previewOnly='1');
}
function wrap(section){
  if(!section||section.dataset.guideWrapped==='1')return;
  section.dataset.guideWrapped='1';
  const body=document.createElement('div');body.className='nh7-school-guide-body';
  while(section.firstChild)body.appendChild(section.firstChild);
  const details=document.createElement('details');details.className='nh7-school-guide';details.dataset.schoolGuide='1';
  const summary=document.createElement('summary');summary.className='nh7-school-guide-toggle';summary.innerHTML=`<span class="nh7-school-guide-icon" aria-hidden="true">📘</span><span class="nh7-school-guide-copy"><strong data-school-guide-label>${label()}</strong><small data-school-guide-hint>${hint()}</small></span><span class="nh7-school-guide-chevron" aria-hidden="true">⌄</span>`;
  details.append(summary,body);section.appendChild(details);markPreviewOnly(section);
}
function updateLabels(){document.querySelectorAll('[data-school-guide-label]').forEach(n=>n.textContent=label());document.querySelectorAll('[data-school-guide-hint]').forEach(n=>n.textContent=hint())}
function scan(){document.querySelectorAll('[data-school-rules-intro]').forEach(wrap);markPreviewOnly();updateLabels()}
const css=document.createElement('style');css.id='nh7SchoolGuideV101Style';css.textContent=`[data-school-rules-intro]{padding:0!important;overflow:hidden}.nh7-school-guide{margin:0}.nh7-school-guide-toggle{list-style:none;cursor:pointer;display:flex;align-items:center;gap:11px;padding:14px 16px;user-select:none}.nh7-school-guide-toggle::-webkit-details-marker{display:none}.nh7-school-guide-icon{font-size:22px}.nh7-school-guide-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:2px}.nh7-school-guide-copy strong{font-size:15px}.nh7-school-guide-copy small{font-size:12px;color:var(--muted,#607889);font-weight:600}.nh7-school-guide-chevron{font-size:20px;transition:transform .18s ease}.nh7-school-guide[open] .nh7-school-guide-chevron{transform:rotate(180deg)}.nh7-school-guide-body{padding:0 16px 16px;border-top:1px solid var(--line,#d9e6f7)}.nh7-school-guide-body>.nh7-school-rules-head{margin-top:15px}@media(max-width:640px){.nh7-school-guide-toggle{padding:13px}.nh7-school-guide-body{padding:0 13px 13px}}`;
document.head.appendChild(css);
const view=document.getElementById('view');if(view)new MutationObserver(scan).observe(view,{childList:true,subtree:true});
document.getElementById('langSelect')?.addEventListener('change',()=>setTimeout(()=>{scan();updateLabels()},120));
document.addEventListener('DOMContentLoaded',scan,{once:true});setTimeout(scan,150);
window.NH7_SCHOOL_GUIDE_VERSION='1.0.1';
})();
