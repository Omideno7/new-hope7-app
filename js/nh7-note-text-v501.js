/* New Hope 7 v5.0.1 — canonical note text repair.
   Repairs legacy whitespace encodings without interpreting arbitrary HTML. */
(()=>{'use strict';
if(window.__NH7_NOTE_TEXT_V501__)return;window.__NH7_NOTE_TEXT_V501__=true;
const VERSION='5.0.4-linebreak-cache';

function unwrap(value){
  let current=value;
  for(let i=0;i<4;i++){
    if(current&&typeof current==='object'&&!Array.isArray(current)&&Object.prototype.hasOwnProperty.call(current,'value')){current=current.value;continue}
    if(typeof current!=='string')break;
    const raw=current.trim();if(!(raw.startsWith('{')&&raw.endsWith('}')))break;
    let parsed=null;try{parsed=JSON.parse(raw)}catch(_){break}
    if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)&&Object.prototype.hasOwnProperty.call(parsed,'value')){current=parsed.value;continue}
    break;
  }
  return current==null?'':String(current);
}
function normalize(value){
  let s=unwrap(value);
  for(let i=0;i<3;i++){
    const before=s;
    s=s
      .replace(/&amp;#(?:10|13);/gi,m=>/10/.test(m)?'\n':'\n')
      .replace(/&amp;#x0*(?:a|d);/gi,'\n')
      .replace(/&#(?:10|13);/gi,'\n')
      .replace(/&#x0*(?:a|d);/gi,'\n')
      .replace(/&amp;nbsp;/gi,' ')
      .replace(/&nbsp;/gi,' ')
      .replace(/&amp;#(?:32|160|8199|8239|8287|12288);/gi,' ')
      .replace(/&#(?:32|160|8199|8239|8287|12288);/gi,' ')
      .replace(/&amp;#x0*(?:20|a0|2007|202f|205f|3000);/gi,' ')
      .replace(/&#x0*(?:20|a0|2007|202f|205f|3000);/gi,' ')
      .replace(/&lt;br\s*\/?&gt;/gi,'\n')
      .replace(/<br\s*\/?>/gi,'\n')
      .replace(/%0D%0A|%0A%0D|%0D|%0A/gi,'\n')
      .replace(/%20|%C2%A0|%E2%80%87|%E2%80%AF|%E2%81%9F|%E3%80%80/gi,' ')
      .replace(/\\r\\n|\\n\\r|\\r|\\n/g,'\n')
      .replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g,' ')
      .replace(/[\u200b\u2060\ufeff]/g,' ')
      .replace(/\r\n?/g,'\n');
    if(s===before)break;
  }
  return s;
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
      if(key.startsWith('nh7_school_draft_v468:')){
        const raw=localStorage.getItem(key)||'';let draft=null;try{draft=JSON.parse(raw)}catch(_){continue}
        if(!draft||typeof draft!=='object'||typeof draft.text!=='string')continue;
        const clean=normalize(draft.text);if(clean!==draft.text){draft.text=clean;localStorage.setItem(key,JSON.stringify(draft));changed++}
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

function scheduleRepair(){
  [0,120,600,1600,5000].forEach(ms=>setTimeout(repairKnownNotes,ms));
}
function normalizeEditorValue(target){
  if(!target||typeof target.value!=='string')return;
  const clean=normalize(target.value);
  if(clean===target.value)return;
  const start=target.selectionStart,end=target.selectionEnd;
  target.value=clean;
  try{target.setSelectionRange(Math.min(start,clean.length),Math.min(end,clean.length))}catch(_){}
}
const NOTE_EDITOR_SELECTOR='textarea[data-note-input],#sermonModalNote,#gratitudeNote,#schoolAssignmentAnswer,#nh7PlanNote,#nh7ScriptureNote';
document.addEventListener('paste',e=>{
  const target=e.target?.closest?.(NOTE_EDITOR_SELECTOR);if(target)setTimeout(()=>normalizeEditorValue(target),0);
},true);
document.addEventListener('blur',e=>{
  const target=e.target?.closest?.(NOTE_EDITOR_SELECTOR);if(target)normalizeEditorValue(target);
},true);
document.addEventListener('click',e=>{
  if(e.target.closest?.('[data-save-verse-note],[data-save-modal-note],[data-save-note],#completeGratitude,#saveSchoolAssignmentDraft,#submitSchoolAssignment'))setTimeout(repairKnownNotes,80);
},true);
window.addEventListener('pageshow',scheduleRepair);
window.addEventListener('storage',repairKnownNotes);
scheduleRepair();
window.NH7NoteTextV501={VERSION,unwrap,normalize,repairKnownNotes};
})();