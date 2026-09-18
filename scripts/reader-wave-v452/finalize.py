"""Final reader safeguards. No requests and no source-text mutation."""
from pathlib import Path

def edit(name,fn):
    p=Path(name);before=p.read_text();after=fn(before)
    if after!=before:p.write_text(after)

def batch(s):
    s=s.replace('deselectVerse,batchApply,enhanceVerses,toggleVerse};','deselectVerse,batchApply,enhanceVerses,toggleVerse,syncPayload};')
    s=s.replace('await syncPayload({batch_id:batchId,items});','await syncPayload({batch_id:batchId,items,language:lang()});')
    return s
edit('js/nh7-app-enhancements-v230.js',batch)

def bridge(s):
    if 'Unsave must follow older queued' in s:return s
    needle="if(raw){const st=JSON.parse(raw);if(!st||typeof st!=='object'||Array.isArray(st))throw Error('Invalid verse state');st.saved=false;localStorage.setItem(key,JSON.stringify(st));saveProgressCloud(key,st).catch(console.warn)}"
    assert needle in s
    replacement="""if(raw){
      const st=JSON.parse(raw);if(!st||typeof st!=='object'||Array.isArray(st))throw Error('Invalid verse state');
      const pending=JSON.parse(localStorage.getItem('nh7_bible_batch_queue_v230')||'[]');if(!Array.isArray(pending))throw Error('Invalid pending reader data');
      st.saved=false;localStorage.setItem(key,JSON.stringify(st));saveProgressCloud(key,st).catch(console.warn);
      // Unsave must follow older queued saves, without deleting their notes or highlights.
      const row=await window.NH7ReaderSourceV452.resolve(ref,state.lang);
      await window.NH7BibleBatchV230.syncPayload({batch_id:crypto.randomUUID?.()||String(Date.now()),language:state.lang,items:[{verse_key:key,verse_ref:ref,verse_text:row?.text||'',saved:false,highlight_color:st.highlight?String(st.highlightColor||'yellow'):'',note:String(st.note||'')}]});
    }"""
    return s.replace(needle,replacement,1)
edit('js/app.js',bridge)

def toolbar(s):
    needle="const rows=items();if(!rows.length)return;\n  const notes=action==='note'?"
    if 'Validate before changing any selected state' not in s:
        assert needle in s
        s=s.replace(needle,"""const rows=items();if(!rows.length)return;
  // Validate before changing any selected state; malformed legacy data is not replaced.
  bookmarks();
  const queue=read('nh7_bible_batch_queue_v230',[]);if(!Array.isArray(queue))throw Error('Invalid pending reader data');
  for(const i of rows){
    if(i.kind==='bible'){const st=read(i.key,{});if(!st||typeof st!=='object'||Array.isArray(st))throw Error('Invalid verse state')}
    const meta=read(NOTE_META+encodeURIComponent(i.key),{});if(!meta||typeof meta!=='object'||Array.isArray(meta))throw Error('Invalid note metadata');
  }
  const notes=action==='note'?""",1)
    if 'A changed route must not retain' not in s:
        needle="  syncLegacy();paint();\n}\nnew MutationObserver"
        assert needle in s
        s=s.replace(needle,"  // A changed route must not retain a note dialog for disconnected verses.\n  if(!items().length&&dialog)closeDialog();\n  syncLegacy();paint();\n}\nnew MutationObserver",1)
    if "event.target?.id==='langSelect'" not in s:
        needle="window.addEventListener('popstate',clear);";assert needle in s
        s=s.replace(needle,"window.addEventListener('change',event=>{if(event.target?.id==='langSelect'){document.getElementById('nh7ReaderToast452')?.classList.remove('show');clear()}},true);\n"+needle,1)
    return s
edit('js/nh7-reader-toolbar-v452.js',toolbar)

def test(s):
    if 'Unsave is queued after older saves' in s:return s
    marker="        assert read(p,'nh7_bible_state_JHN_3_16')['note']==saved_note;passed('Six localized note categories; saved book groups; unsave retains notes')"
    assert marker in s
    check="        assert any(i.get('verse_ref')=='John 3:16' and i.get('saved') is False for i in read(p,'nh7_bible_batch_queue_v230')[-1]['items']), 'Unsave is queued after older saves'\n"
    return s.replace(marker,check+marker,1)
edit('scripts/reader-wave-v452/browser.py',test)
print('Reader safety checks applied; queued unsaves retain latest state.')
