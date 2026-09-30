/* New Hope 7 v5.0.1 — canonical note text repair.
   Repairs legacy whitespace encodings without interpreting arbitrary HTML. */
(()=>{'use strict';
if(window.__NH7_NOTE_TEXT_V501__)return;window.__NH7_NOTE_TEXT_V501__=true;
const VERSION='5.0.1';

function normalize(value){
  let s=String(value??'');
  for(let i=0;i<3;i++){
    const before=s;
    s=s
      .replace(/&amp;#(?:10|13);/gi,m=>/10/.test(m)?'\n':'\n')
      .replace(/&amp;#x0*(?:a|d);/gi,'\n')
      .replace(/&#(?:10|13);/gi,'\n')
      .replace(/&#x0*(?:a|d);/gi,'\n')
      .replace(/&amp;nbsp;/gi,' ')
      .replace(/&nbsp;/gi,' ')
      .replace(/&#32;|&#x0*20;/gi,' ')
      .replace(/&lt;br\s*\/?&gt;/gi,'\n')
      .replace(/<br\s*\/?>/gi,'\n')
      .replace(/%0D%0A|%0A%0D|%0D|%0A/gi,'\n')
      .replace(/%20/gi,' ')
      .replace(/\\r\\n|\\n\\r|\\r|\\n/g,'\n')
      .replace(/\u00a0/g,' ')
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
document.addEventListener('click',e=>{
  if(e.target.closest?.('[data-save-verse-note],[data-save-modal-note],[data-save-note],#completeGratitude'))setTimeout(repairKnownNotes,80);
},true);
window.addEventListener('pageshow',scheduleRepair);
window.addEventListener('storage',repairKnownNotes);
scheduleRepair();
window.NH7NoteTextV501={VERSION,normalize,repairKnownNotes};
})();