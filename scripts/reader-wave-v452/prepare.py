"""Reader-only integration; no corpus edits, database calls or main writes."""
from pathlib import Path
import re

def edit(name,fn):
    p=Path(name);before=p.read_text();after=fn(before)
    if after!=before:p.write_text(after)

def shell(s):
    s=s.replace('\\n  <','\n  <')
    for name in ['css/nh7-reader-toolbar-v452.css','css/nh7-notes-categories-v452.css']:
        tag=f'  <link rel="stylesheet" href="{name}?v=4.5.2-r2" />'
        pattern=r'\s*<link[^>]*href="'+re.escape(name)+r'[^\"]*"[^>]*>'
        s=re.sub(pattern,'\n'+tag,s) if re.search(pattern,s) else s.replace('</head>',tag+'\n</head>')
    for name in ['js/nh7-reader-toolbar-v452.js','js/nh7-my-notes-categories-v452.js']:
        tag=f'  <script src="{name}?v=4.5.2-r2" defer></script>'
        pattern=r'\s*<script[^>]*src="'+re.escape(name)+r'[^\"]*"[^>]*></script>'
        s=re.sub(pattern,'\n'+tag,s) if re.search(pattern,s) else s.replace('</body>',tag+'\n</body>')
    return s
edit('index.html',shell)
bridge=r'''
// Reader localization only. Canonical storage keys stay unchanged.
window.NH7ReaderSourceV452={
  label:(bookId,chapter,verse,locale=state.lang)=>{
    const b=state.bible.books?.find(x=>x.id===bookId),n=v=>locale==='fa'?String(v).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):String(v);
    return b?`${b.names?.[locale]||b.id} ${n(chapter)}:${n(verse)}`:'';
  },
  resolve:async(ref,locale=state.lang)=>{
    await loadBibleMeta();const p=parseRef(ref);if(!p)return null;
    const data=await loadBook(p.bookId),v=data?.verses.find(x=>+x.chapter===p.chapter&&+x.verse===p.verse);
    let text=String(v?.text?.[locale]||'').trim();if(locale==='en')text=text.replace(new RegExp('^\\s*'+p.verse+'\\.\\s+'),'');
    return{label:window.NH7ReaderSourceV452.label(p.bookId,p.chapter,p.verse,locale),bookName:data?.book.names?.[locale]||p.bookId,bookId:p.bookId,chapter:p.chapter,verse:p.verse,text,kind:locale==='fa'?'کتاب مقدس':locale==='hr'?'Biblija':'Bible'};
  },
  removeSaved:async ref=>{
    await loadBibleMeta();const p=parseRef(ref);if(!p)return;
    const key=`nh7_bible_state_${p.bookId}_${p.chapter}_${p.verse}`,raw=localStorage.getItem(key);
    if(raw){const st=JSON.parse(raw);if(!st||typeof st!=='object'||Array.isArray(st))throw Error('Invalid verse state');st.saved=false;localStorage.setItem(key,JSON.stringify(st));saveProgressCloud(key,st).catch(console.warn)}
  }
};
'''
edit('js/app.js',lambda s:s if 'window.NH7ReaderSourceV452=' in s else s+'\n'+bridge)
edit('js/nh7-apocrypha-preview-v240.js',lambda s:s if 'window.NH7ApoReaderSourceV452=' in s else s.replace('})();',"\nwindow.NH7ApoReaderSourceV452={current:()=>({book:currentBook,chapter:currentChapter}),load};\n})();"))
edit('js/nh7-apocrypha-actions-v393.js',lambda s:s if 'window.NH7ApoActionsV452=' in s else s.replace('})();',"window.NH7ApoActionsV452={toggleSave};\n})();"))

def batch(s):
    if 'function deselectVerse(' not in s:
        s=s.replace('function clearSelection(){',"function deselectVerse(node){if(!node)return;toggleVerse(node,false);node.classList.remove('verse-selected');node.querySelectorAll('.verse-tools,.verse-note-box,.highlight-palette').forEach(n=>n.classList.add('hidden'));}\nfunction clearSelection(){",1)
    s=s.replace("if(action==='note'){st.note=String(value).slice(0,1000);","if(action==='note'){st.note=String(typeof value==='function'?value(st.note||'',info):value).slice(0,1000);")
    s=s.replace('JSON.stringify(q.slice(-50))','JSON.stringify(q)')
    s=s.replace('VERSION,selected,clearSelection,batchApply','VERSION,selected,clearSelection,deselectVerse,batchApply')
    return s
edit('js/nh7-app-enhancements-v230.js',batch)

def notes(s):
    if "kind='apocrypha'" not in s:
        old="}else if(storageKey.startsWith('nh7_sermon_note_')){";assert old in s
        s=s.replace(old,"}else if(storageKey.startsWith('nh7_apo_note_v242:')){\n      text=normalizedText(localStorage.getItem(storageKey));kind='apocrypha';\n    "+old,1)
    s=s.replace("const signature=notes.map(n=>`${n.storageKey}:${n.text.length}:${n.updatedAt}`).join('|');","const signature=lang()+'|'+JSON.stringify(notes.map(n=>[n.storageKey,n.text,n.title,n.updatedAt]));")
    if 'nh7-reader-data452' not in s:s=s.replace("window.addEventListener('storage',scheduleRender);","window.addEventListener('storage',scheduleRender);\nwindow.addEventListener('nh7-reader-data452',scheduleRender);")
    if "if(note.kind==='apocrypha')" not in s:
        marker="  const meta=note.meta||{};\n  pendingTarget={kind:note.kind,storageKey};";assert marker in s
        s=s.replace(marker,"  if(note.kind==='apocrypha'){window.NH7_OPEN_SAVED_APOCRYPHA_V394?.('APO:'+storageKey.replace(/^nh7_apo_note_v242:/,''));return;}\n"+marker,1)
        marker="  if(note.kind==='verse')await syncVerseState(note);else{";assert marker in s
        s=s.replace(marker,"  if(note.kind==='apocrypha'){localStorage.removeItem(storageKey);deleteMeta(storageKey);renderNotesPanel();return;}\n"+marker,1)
    return s
edit('js/nh7-my-notes-v234.js',notes)

def saved(s):
    if 'const unified=await' not in s:
        marker='async function resolveSaved(ref){';assert marker in s
        s=s.replace(marker,marker+'const unified=await window.NH7ReaderToolbarV452?.resolveSaved?.(ref);if(unified)return unified;',1)
    return s
edit('js/nh7-reader-ux-v251.js',saved)

# This fixture is used only in CI, never in any app entry or production runtime.
def fixture(s):
    if 'QA approved-state fixture' not in s:
        marker='def apo(p):\n';assert marker in s
        addition='''    # QA approved-state fixture; assert the actual guest gate before simulating approval.
    p.locator('[data-route="bible"]').click()
    if not p.evaluate('NH7AccessV230.isApproved()'):
        p.locator('[data-go="apocrypha"]').click()
        expect(p.locator('.nh7-access-gate-v230')).to_be_visible()
        p.locator('.nh7-access-close-v230').click()
        passed('Guest access remains blocked; approved state is synthetic for reader-only testing')
    p.evaluate("sessionStorage.setItem('nh7_content_access_status_v230',JSON.stringify({approved:true,authenticated:true,checked_at:Date.now(),user_email:'reader-qa@example.invalid'}))")
    assert p.evaluate('NH7AccessV230.isApproved()')
'''
        s=s.replace(marker,marker+addition,1)
    s=s.replace("'realCloudSyncTest':False}","'realCloudSyncTest':False,'mockedApprovedReaderState':True}")
    return s
edit('scripts/reader-wave-v452/browser.py',fixture)
print('Reader adapters prepared; corpus and database unchanged.')
