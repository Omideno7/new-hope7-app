/* New Hope 7 — local recovery for the EXISTING school assignment editor.
 * No network, migrations, grade changes, auto-submission or legacy-key deletion.
 */
export function createSchoolDraftsV468(deps){
  const PREFIX='nh7_school_draft_v468:';
  const unsaved=new Map();
  let active=null,sequence=0;
  function account(){try{return deps.account()||null}catch(_){return null}}
  function owner(){const u=account();return u?.id?'id:'+String(u.id):u?.email?'email:'+String(u.email).trim().toLowerCase():''}
  const key=(who,lesson)=>PREFIX+encodeURIComponent(who)+':'+encodeURIComponent(lesson);
  function read(who,lesson){
    if(!who||!lesson)return null;
    const k=key(who,lesson);
    try{
      const d=unsaved.get(k)||JSON.parse(localStorage.getItem(k)||'null');
      return d?.v===1&&d.owner===who&&d.lesson===lesson&&typeof d.text==='string'&&typeof d.pending==='boolean'?d:null;
    }catch(_){return unsaved.get(k)||null}
  }
  function write(d){
    const k=key(d.owner,d.lesson);
    try{localStorage.setItem(k,JSON.stringify(d));unsaved.delete(k);return true}
    catch(_){unsaved.set(k,d);return false}
  }
  function warn(a,failed){
    if(!a?.element.isConnected)return;
    if(!failed){a.warning?.remove();a.warning=null;return}
    if(!a.warning){a.warning=document.createElement('p');a.warning.className='muted';a.warning.setAttribute('role','status');a.warning.dataset.schoolDraftWarning468='1';a.element.insertAdjacentElement('afterend',a.warning)}
    const lang=deps.lang?.()||'en';
    a.warning.textContent=lang==='fa'?'ذخیرهٔ خودکار روی این دستگاه ممکن نشد. پیش از بستن برنامه، متن پاسخ را کپی کنید.':lang==='hr'?'Automatsko spremanje na ovaj uređaj nije uspjelo. Kopirajte odgovor prije zatvaranja aplikacije.':'Could not autosave on this device. Copy your answer before closing the app.';
  }
  function flush(){
    const a=active;
    if(!a||a.owner!==owner()||a.element.disabled)return false;
    const text=a.element.value;
    if(text===a.last&&!a.failed)return true;
    const d={v:1,owner:a.owner,email:a.email,lesson:a.lesson,text,pending:true,rev:Date.now()+':'+(++sequence)+':'+Math.random().toString(36).slice(2),saved_at:new Date().toISOString()};
    const ok=write(d);a.last=text;a.failed=!ok;warn(a,!ok);return ok;
  }
  function unmount(){
    flush();if(!active)return;
    for(const name of ['input','change','compositionend','blur'])active.element.removeEventListener(name,flush);
    active=null;
  }
  function attach({element,lesson,initialValue='',approved=false,expectedOwner=owner()}){
    unmount();if(!element||!expectedOwner||expectedOwner!==owner())return;
    const saved=read(expectedOwner,lesson);
    // Assign .value rather than HTML: preserve real newlines, spaces and literal markup.
    element.value=!approved&&saved?.pending?saved.text:String(initialValue??'');
    if(approved)return; // A local draft never replaces an accepted server answer.
    active={element,lesson,owner:expectedOwner,email:String(account()?.email||'').trim().toLowerCase(),last:element.value,failed:!!unsaved.get(key(expectedOwner,lesson)),warning:null};
    for(const name of ['input','change','compositionend','blur'])element.addEventListener(name,flush);
    if(active.failed)warn(active,true);
  }
  function ticket(lesson,text){
    flush();const who=owner(),d=read(who,lesson);
    return who?{owner:who,lesson,text:String(text??''),rev:d?.rev||null}:null;
  }
  function submitted(t,receipt){
    const row=Array.isArray(receipt)?receipt[0]:receipt;
    if(!t||!t.rev||owner()!==t.owner||row?.lesson_code!==t.lesson||typeof row.answer_text!=='string'||row.answer_text.trim()!==t.text.trim()||!['submitted','pending','approved'].includes(String(row.status||'').toLowerCase()))return;
    const d=read(t.owner,t.lesson);
    if(!d||d.rev!==t.rev||d.text!==t.text)return; // Typing during submission remains a new draft.
    if(row.user_email&&String(row.user_email).trim().toLowerCase()!==d.email)return;
    // Retain the text, but stop shadowing a newer server answer after this receipt.
    write({...d,pending:false,submitted_at:row.submitted_at||new Date().toISOString()});
  }
  // Input saves synchronously; lifecycle events are extra protection, not the only save.
  const hidden=()=>{if(document.hidden)flush()};
  document.addEventListener('visibilitychange',hidden);
  window.addEventListener('pagehide',flush);
  window.addEventListener('blur',flush);
  return Object.freeze({owner,attach,flush,unmount,ticket,submitted});
}
