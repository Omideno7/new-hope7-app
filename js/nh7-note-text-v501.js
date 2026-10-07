/* New Hope 7 v5.0.2 — canonical note text repair.
   Repairs legacy whitespace encodings without interpreting arbitrary HTML. */
(()=>{'use strict';
if(window.__NH7_NOTE_TEXT_V501__)return;window.__NH7_NOTE_TEXT_V501__=true;
const VERSION='5.0.2';

function normalize(value){
  let s=String(value??'');
  for(let i=0;i<3;i++){
    const before=s;
    s=s
      .replace(/&amp;#(?:9|10|13|32);/gi,m=>/9/.test(m)?'\t':/32/.test(m)?' ':'\n')
      .replace(/&amp;#x0*(?:9|a|d|20);/gi,m=>/20/i.test(m)?' ':/9/i.test(m)?'\t':'\n')
      .replace(/&#(?:9|10|13);/gi,m=>/9/.test(m)?'\t':'\n')
      .replace(/&#32;|&#x0*20;/gi,' ')
      .replace(/&#x0*9;/gi,'\t')
      .replace(/&#x0*(?:a|d);/gi,'\n')
      .replace(/&amp;nbsp;/gi,' ')
      .replace(/&nbsp;/gi,' ')
      .replace(/&lt;br\s*\/?&gt;/gi,'\n')
      .replace(/<br\s*\/?>/gi,'\n')
      .replace(/%0D%0A|%0A%0D|%0D|%0A/gi,'\n')
      .replace(/%09/gi,'\t')
      .replace(/%20/gi,' ')
      .replace(/\\u00(?:09|0a|0d|20)/gi,m=>/20/i.test(m)?' ':/09/i.test(m)?'\t':'\n')
      .replace(/\\r\\n|\\n\\r|\\r|\\n/g,'\n')
      .replace(/\\t/g,'\t')
      .replace(/\u00a0/g,' ')
      .replace(/\r\n?/g,'\n');
    if(s===before)break;
  }
  return s;
}

function looksEncoded(value){
  return /(?:&(?:amp;)?#(?:9|10|13|32|x0*(?:9|a|d|20));|&(?:amp;)?nbsp;|&lt;br|<br|%0[ad9]|%20|\\[rnt]|\\u00(?:09|0a|0d|20))/i.test(String(value??''));
}

function repairKnownNotes(){
  let changed=0;
  const keys=[];
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k)keys.push(k)}
  for(const key of keys){
    try{
      if(key.startsWith('nh7_bible_state_')){
        const raw=localStorage.getItem(key)||'';let st=null;try{st=JSON.parse(raw)}catch(_){continue}
        if(!st||typeof st!=='object'||typeof st.note!=='string')continue;
        const clean=normalize(st.note);if(clean!==st.note){st.note=clean;localStorage.setItem(key,JSON.stringify(st));changed++}
        continue;
      }
      if(!/^(nh7_sermon_note_|nh7_apo_note_v242:|nh7_gratitude_note_|nh7_note_)/.test(key))continue;
      const raw=localStorage.getItem(key);if(typeof raw!=='string')continue;
      const clean=normalize(raw);if(clean!==raw){localStorage.setItem(key,clean);changed++}
    }catch(_){}
  }
  if(changed){
    try{window.dispatchEvent(new CustomEvent('nh7-note-text-repaired-v501',{detail:{changed}}))}catch(_){}
  }
  return changed;
}

function repairTextControl(el){
  if(!el||typeof el.value!=='string'||!looksEncoded(el.value))return false;
  const clean=normalize(el.value);if(clean===el.value)return false;
  const start=el.selectionStart,end=el.selectionEnd;
  el.value=clean;
  try{if(document.activeElement===el&&Number.isInteger(start)&&Number.isInteger(end))el.setSelectionRange(Math.min(start,clean.length),Math.min(end,clean.length))}catch(_){}
  return true;
}
function repairTextNode(el){
  if(!el||!looksEncoded(el.textContent))return false;
  const clean=normalize(el.textContent);if(clean===el.textContent)return false;
  el.textContent=clean;el.style.whiteSpace='pre-wrap';return true;
}
function repairVisibleNotes(root=document){
  let changed=0;
  root.querySelectorAll?.('#schoolAssignmentAnswer,textarea[data-note-input],textarea[data-note-text],textarea[data-sermon-note-input]').forEach(el=>{if(repairTextControl(el))changed++});
  root.querySelectorAll?.('.school-assignment .notice p,.verse-note-preview,[data-note-preview]').forEach(el=>{if(repairTextNode(el))changed++});
  return changed;
}

let visibleQueued=false;
function scheduleVisibleRepair(){
  if(visibleQueued)return;visibleQueued=true;
  requestAnimationFrame(()=>{visibleQueued=false;repairVisibleNotes(document)});
}
function scheduleRepair(){
  [0,120,600,1600,5000].forEach(ms=>setTimeout(()=>{repairKnownNotes();repairVisibleNotes(document)},ms));
}
document.addEventListener('click',e=>{
  if(e.target.closest?.('[data-save-verse-note],[data-save-modal-note],[data-save-note],#completeGratitude,#saveSchoolAssignmentDraft,#submitSchoolAssignment'))setTimeout(()=>{repairKnownNotes();repairVisibleNotes(document)},80);
},true);
window.addEventListener('pageshow',scheduleRepair);
window.addEventListener('storage',()=>{repairKnownNotes();scheduleVisibleRepair()});
function startObserver(){
  const target=document.getElementById('view')||document.body;if(!target)return;
  new MutationObserver(scheduleVisibleRepair).observe(target,{subtree:true,childList:true});
  scheduleVisibleRepair();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObserver,{once:true});else startObserver();
scheduleRepair();
window.NH7NoteTextV501={VERSION,normalize,repairKnownNotes,repairVisibleNotes};
})();