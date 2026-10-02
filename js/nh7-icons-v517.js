/* New Hope 7 — Modern Icon Adapter v5.1.9
 * Visual-only SVG icon layer. Does not change navigation, audio, school, Bible,
 * auth, storage, network, Supabase, or user data logic.
 */
(()=>{'use strict';
if(window.NH7IconsV517)return;

const NS='http://www.w3.org/2000/svg';
const ICONS={
 play:'<path d="M9 7.4v9.2c0 1.1 1.2 1.8 2.2 1.2l7-4.6c.9-.6.9-1.9 0-2.5l-7-4.6C10.2 5.6 9 6.3 9 7.4Z"/>',
 pause:'<rect x="7" y="5.8" width="3.4" height="12.4" rx="1.3"/><rect x="13.6" y="5.8" width="3.4" height="12.4" rx="1.3"/>',
 previous:'<path d="M7.2 6v12"/><path d="m17.2 6.5-7.1 5.2a.4.4 0 0 0 0 .6l7.1 5.2V6.5Z"/>',
 next:'<path d="M16.8 6v12"/><path d="m6.8 6.5 7.1 5.2a.4.4 0 0 1 0 .6l-7.1 5.2V6.5Z"/>',
 rewind15:'<path d="M8.2 7.5H4.8V4.2"/><path d="M5.1 7.2A8 8 0 1 1 4 14"/><text x="12" y="15.4" text-anchor="middle" font-size="7.2" font-weight="800">15</text>',
 forward30:'<path d="M15.8 7.5h3.4V4.2"/><path d="M18.9 7.2A8 8 0 1 0 20 14"/><text x="12" y="15.4" text-anchor="middle" font-size="7.2" font-weight="800">30</text>',
 speed:'<path d="M5.2 17.2a8 8 0 1 1 13.6 0"/><path d="m12 13.2 4.5-4.1"/><circle cx="12" cy="13.2" r="1.4"/>',
 queue:'<path d="M5 7.2h9"/><path d="M5 12h9"/><path d="M5 16.8h6.2"/><path d="m16 14.2 3 2.6-3 2.6v-5.2Z"/>',
 bible:'<path d="M5.2 5.6c2.8-.6 5.1.1 6.8 1.9v11c-1.7-1.8-4-2.5-6.8-1.9v-11Z"/><path d="M18.8 5.6c-2.8-.6-5.1.1-6.8 1.9v11c1.7-1.8 4-2.5 6.8-1.9v-11Z"/>',
 notes:'<path d="M6.2 4.8h8.4l3.2 3.2v11.2H6.2V4.8Z"/><path d="M14.6 4.8V8h3.2"/><path d="M8.7 11.2h6.5"/><path d="M8.7 14.2h5.1"/><path d="m14.8 18 3.4-3.4 1.2 1.2-3.4 3.4-1.8.5.6-1.7Z"/>',
 favorite:'<path d="m12 4.2 2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2-3.8-3.7 5.2-.8L12 4.2Z"/>',
 blessing:'<path d="M12 20.1s-7-4.3-7-9.3A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.8c0 5-7 9.3-7 9.3Z"/><path d="M12 4.2v4"/><path d="M10 6.2h4"/>',
 volume:'<path d="M5 10h3l4-3.2v10.4L8 14H5v-4Z"/><path d="M15 9.2c1.5 1.5 1.5 4.1 0 5.6"/><path d="M17.4 6.8c3 3 3 7.4 0 10.4"/>',
 heart:'<path d="M12 20.1s-7-4.3-7-9.3A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.8c0 5-7 9.3-7 9.3Z"/>',
 download:'<path d="M12 4.5v9.2"/><path d="m8.5 10.5 3.5 3.5 3.5-3.5"/><path d="M5.2 16.2v2.5h13.6v-2.5"/>',
 check:'<path d="m6.2 12.3 3.5 3.5 8.2-8.2"/>',
 share:'<circle cx="6.2" cy="12" r="2"/><circle cx="17.8" cy="6.2" r="2"/><circle cx="17.8" cy="17.8" r="2"/><path d="m8 11 7.8-3.8"/><path d="m8 13 7.8 3.8"/>',
 search:'<circle cx="10.5" cy="10.5" r="5.5"/><path d="m14.6 14.6 4.2 4.2"/>',
 copy:'<rect x="8.5" y="8.5" width="9.2" height="10" rx="1.6"/><path d="M6.2 15.5H5.4c-.9 0-1.6-.7-1.6-1.6V5.4c0-.9.7-1.6 1.6-1.6h8.5c.9 0 1.6.7 1.6 1.6v.8"/>',
 bookmark:'<path d="M7 4.5h10v15l-5-3.2-5 3.2v-15Z"/>',
 highlight:'<path d="m6.2 14.8 7.9-7.9 3 3-7.9 7.9H6.2v-3Z"/><path d="m13.1 7.9 3 3"/><path d="M5 20h14"/>',
 lesson:'<path d="M5.3 5.2h13.4v13.6H5.3V5.2Z"/><path d="M8.3 8.3h7.4"/><path d="M8.3 11.3h7.4"/><path d="M8.3 14.3h4.8"/>',
 assignment:'<path d="M7.2 5h7.6l3 3v11H7.2V5Z"/><path d="M14.8 5v3h3"/><path d="m9.2 13 1.5 1.5 3.3-3.3"/><path d="M9.2 17h5.7"/>',
 exam:'<path d="M6 4.8h12v14.4H6V4.8Z"/><path d="M9 8.3h6"/><path d="M9 11.8h6"/><path d="M9 15.3h3"/><circle cx="15.4" cy="15.3" r="1.3"/>',
 close:'<path d="M6.5 6.5 17.5 17.5"/><path d="M17.5 6.5 6.5 17.5"/>'
};

function svg(name){
 const el=document.createElementNS(NS,'svg');
 el.setAttribute('viewBox','0 0 24 24');el.setAttribute('aria-hidden','true');el.setAttribute('focusable','false');
 el.classList.add('nh7-icon517-svg');el.innerHTML=ICONS[name]||ICONS.notes;return el;
}
function iconSpan(name){
 const span=document.createElement('span');span.className='nh7-icon517';span.dataset.icon=name;span.append(svg(name));return span;
}
function setIconOnly(btn,name){
 if(!btn)return;
 if(btn.dataset.nh7Icon517===name&&btn.querySelector(':scope > .nh7-icon517'))return;
 btn.dataset.nh7Icon517=name;btn.classList.add('nh7-icon517-only');btn.replaceChildren(iconSpan(name));
}
function setLeadingIcon(btn,name,stripRe){
 if(!btn)return;
 const existing=btn.querySelector(':scope > .nh7-icon517');
 if(existing&&existing.dataset.icon===name)return;
 let text=String(btn.textContent||'').trim();
 if(stripRe)text=text.replace(stripRe,'').trim();
 btn.dataset.nh7Icon517=name;btn.classList.add('nh7-icon517-text');
 const label=document.createElement('span');label.className='nh7-icon517-label';label.textContent=text;
 btn.replaceChildren(iconSpan(name),label);
}
function setFirstSlot(btn,name,selector=':scope > span:first-child'){
 if(!btn)return;
 const slot=btn.querySelector(selector);if(!slot)return;
 if(slot.dataset.nh7Icon517===name&&slot.querySelector('.nh7-icon517-svg'))return;
 slot.dataset.nh7Icon517=name;slot.classList.add('nh7-icon517-slot');slot.replaceChildren(svg(name));
}
function decoratePlayer(scope=document){
 scope.querySelectorAll('.nh7p500 [data-prev]').forEach(b=>setIconOnly(b,'previous'));
 scope.querySelectorAll('.nh7p500 [data-back]').forEach(b=>setIconOnly(b,'rewind15'));
 scope.querySelectorAll('.nh7p500 [data-forward]').forEach(b=>setIconOnly(b,'forward30'));
 scope.querySelectorAll('.nh7p500 [data-next]').forEach(b=>setIconOnly(b,'next'));
 scope.querySelectorAll('.nh7p500 [data-speed]').forEach(b=>{
   if(!b.querySelector(':scope > .nh7-icon517'))b.prepend(iconSpan('speed'));
 });
 scope.querySelectorAll('.nh7p500 [data-p500-bible]').forEach(b=>setFirstSlot(b,'bible'));
 scope.querySelectorAll('.nh7p500 [data-mute]').forEach(b=>{b.classList.add('nh7-icon517-mute');const slot=b.querySelector('[data-mute-icon]');if(slot)slot.classList.add('nh7-icon517-slot-dynamic')});
 scope.querySelectorAll('.nh7p500 [data-note]').forEach(b=>setFirstSlot(b,'notes'));
 scope.querySelectorAll('.nh7p500 [data-download]').forEach(b=>{if(b.classList.contains('is-downloading')||b.classList.contains('is-downloaded'))return;setFirstSlot(b,'download','[data-download-icon]')});
 scope.querySelectorAll('.nh7p500 [data-p500-share]').forEach(b=>setFirstSlot(b,'share'));
 scope.querySelectorAll('.nh7p500 [data-queue]').forEach(b=>setFirstSlot(b,'queue'));
 scope.querySelectorAll('.nh7p500 [data-favorite]').forEach(b=>b.classList.add('nh7-icon517-favorite'));
 scope.querySelectorAll('.nh7p500 [data-p500-like]').forEach(b=>{b.classList.add('nh7-icon517-like');const slot=b.querySelector('[data-like-icon]');if(slot)slot.classList.add('nh7-icon517-social-slot')});
 scope.querySelectorAll('.nh7p500 [data-p500-bless]').forEach(b=>{b.classList.add('nh7-icon517-bless');const slot=b.querySelector(':scope > span');if(slot&&slot.dataset.nh7Icon517!=='blessing'){slot.dataset.nh7Icon517='blessing';slot.classList.add('nh7-icon517-social-slot');slot.replaceChildren(svg('blessing'))}});
 scope.querySelectorAll('.nh7p500 [data-play]').forEach(b=>{
   const t=String(b.textContent||'');b.dataset.nh7PlayState517=/❚|Ⅱ|pause/i.test(t)?'pause':'play';b.classList.add('nh7-icon517-dynamic-play');
 });
}
function decorateBible(scope=document){
 scope.querySelectorAll('[data-bookmark]').forEach(b=>{const t=String(b.textContent||'');b.classList.toggle('is-active',t.includes('★'));setLeadingIcon(b,'favorite',/^[★☆]\s*/)});
 scope.querySelectorAll('[data-highlight-menu]').forEach(b=>setLeadingIcon(b,'highlight',/^[✦✧]\s*/));
 scope.querySelectorAll('[data-note-verse]').forEach(b=>setLeadingIcon(b,'notes',/^[📝📓]\s*/u));
 scope.querySelectorAll('[data-share-verse]').forEach(b=>setLeadingIcon(b,'share',/^[↗↑]\s*/));
 scope.querySelectorAll('[data-clear-bible-selection],[data-close-verse-note]').forEach(b=>setIconOnly(b,'close'));
 scope.querySelectorAll('[data-save-verse-note]').forEach(b=>setLeadingIcon(b,'check',/^[✓✔]\s*/));
}
function decorateSchool(scope=document){
 scope.querySelectorAll('[data-inline-back]').forEach(b=>setIconOnly(b,'rewind15'));
 scope.querySelectorAll('[data-inline-forward]').forEach(b=>setIconOnly(b,'forward30'));
 scope.querySelectorAll('[data-inline-play]').forEach(b=>{
   const t=String(b.textContent||'');b.dataset.nh7PlayState517=/❚|Ⅱ|pause/i.test(t)?'pause':'play';b.classList.add('nh7-icon517-dynamic-play');
 });
 scope.querySelectorAll('[data-offline-download]').forEach(b=>setLeadingIcon(b,'download',/^[⇩↓]\s*/));
 scope.querySelectorAll('#submitSchoolAssignment').forEach(b=>setLeadingIcon(b,'assignment'));
 scope.querySelectorAll('#submitSchoolExam').forEach(b=>setLeadingIcon(b,'exam'));
 scope.querySelectorAll('#saveSchoolAssignmentDraft').forEach(b=>setLeadingIcon(b,'notes'));
 scope.querySelectorAll('#completeSchoolLesson').forEach(b=>setLeadingIcon(b,'check'));
}
let pending=false;
function decoratePreview(scope=document){
 scope.querySelectorAll('[data-ap514-preview-icon]').forEach(n=>{
   const name=n.dataset.ap514PreviewIcon;if(!name||n.dataset.nh7Icon517===name)return;
   n.dataset.nh7Icon517=name;n.replaceChildren(svg(name));
 });
}
function decorate(scope=document){decoratePlayer(scope);decorateBible(scope);decorateSchool(scope);decoratePreview(scope)}
function schedule(){
 if(pending)return;pending=true;
 requestAnimationFrame(()=>{pending=false;decorate(document)});
}
document.addEventListener('DOMContentLoaded',schedule,{once:true});
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
window.addEventListener('nh7:ui-preferences',schedule);
window.NH7IconsV517={VERSION:'5.1.9',decorate,svg};
schedule();
})();