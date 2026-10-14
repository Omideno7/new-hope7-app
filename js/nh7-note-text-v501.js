/* New Hope 7 v5.0.2 — canonical note text repair.
   Repairs legacy whitespace encodings without interpreting arbitrary HTML. */
(()=>{'use strict';
if(window.__NH7_NOTE_TEXT_V501__)return;window.__NH7_NOTE_TEXT_V501__=true;
const VERSION='5.0.4-web-account-merge';

function unwrap(value){
  let current=value;
  for(let i=0;i<4;i++){
    if(current&&typeof current==='object'&&!Array.isArray(current)&&Object.prototype.hasOwnProperty.call(current,'value')){current=current.value;continue}
    if(typeof current!=='string')break;
    const raw=current.trim();
    if(!(raw.startsWith('{')&&raw.endsWith('}')))break;
    let parsed=null;try{parsed=JSON.parse(raw)}catch(_){break}
    if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)&&Object.prototype.hasOwnProperty.call(parsed,'value')){current=parsed.value;continue}
    break;
  }
  return current==null?'':String(current);
}
function decodeLegacy(value){
  let s=unwrap(value);
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

function normalize(value){const presented=display(value);return presented.recoverable||presented.omitted?(typeof value==='string'?value:JSON.stringify(value??'')):presented.text}

function looksEncoded(value){
  return /(?:&(?:amp;)?#(?:9|10|13|32|x0*(?:9|a|d|20));|&(?:amp;)?nbsp;|&lt;br|<br|%0[ad9]|%20|\\[rnt]|\\u00(?:09|0a|0d|20))/i.test(String(value??''));
}

// Presentation only: keep every persisted legacy/raw payload and conflict copy unchanged.
function repairKnownNotes(){return 0}
function display(value){
  const original=typeof value==='string'?value:JSON.stringify(value??'');let current=value,legacy=false;
  for(let depth=0;depth<4;depth++){
    if(typeof current==='string'){
      let parsed;try{parsed=JSON.parse(current)}catch{if(/^\s*{\s*"(?:value|note_text|note_key|schema_version)"\s*:/.test(current))return{text:'',recoverable:true,original};return{text:legacy?decodeLegacy(current):current,recoverable:false}}
      if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return{text:legacy?'':current,recoverable:legacy,original};
      const hint=parsed.owner_uid||parsed.user_id||parsed.ownerUid;if(hint&&window.NH7UserContextWave6?.identity().uid!==String(hint))return{text:'',omitted:true};
      if(!['value','content','note','text','note_text'].some(k=>Object.prototype.hasOwnProperty.call(parsed,k)))return parsed.note_key||parsed.schema_version?{text:'',recoverable:true,original}:{text:current,recoverable:false};
      current=parsed;
    }
    if(!current||typeof current!=='object'||Array.isArray(current))return{text:'',recoverable:true,original};
    const actor=window.NH7UserContextWave6?.identity(),uid=current.owner_uid||current.user_id||current.ownerUid;
    if(uid&&actor?.uid!==String(uid))return{text:'',omitted:true};
    if(Object.prototype.hasOwnProperty.call(current,'value')){current=current.value;legacy=true;continue}
    const field=['content','note','text','note_text'].find(k=>typeof current[k]==='string');
    if(field)return{text:current[field],recoverable:false};
    return{text:'',recoverable:true,original};
  }
  return{text:'',recoverable:true,original};
}

function repairTextControl(el){
  if(document.activeElement===el)return false;
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
  if(document.hidden||visibleQueued)return;visibleQueued=true;
  requestAnimationFrame(()=>{visibleQueued=false;repairVisibleNotes(document)});
}
function scheduleRepair(){scheduleVisibleRepair()}
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
window.NH7NoteTextV501={VERSION,unwrap,normalize,repairKnownNotes,repairVisibleNotes};
window.NH7NoteTextV501.display=display;
})();