"""Idempotent v454 preparation. No scripture, account backend or user storage changes."""
from pathlib import Path
import json,re

def edit(name,fn):
    p=Path(name);s=p.read_text();new=fn(s)
    if s!=new:p.write_text(new)

def app(s):
    old="['default','system','readable','serif','persian'].includes(nh7UiRead"
    new="['default','system','readable','serif','persian',...Object.keys(window.NH7FontsV454?.fonts||{})].includes(nh7UiRead"
    s=s.replace(old,new)
    marker='function nh7UiFontStack(font){\n'
    if "window.NH7FontsV454?.fonts?.[font]" not in s:
        assert marker in s;s=s.replace(marker,marker+"  const added=window.NH7FontsV454?.fonts?.[font];if(added)return added.stack;\n",1)
    if 'window.NH7QuickBibleSourceV454=' not in s:
        s+=r'''
// Read-only access for the audio overlay; no navigate() and no audio operations.
window.NH7QuickBibleSourceV454={
 books:async()=>{await loadBibleMeta();return state.bible.books.map(b=>({id:b.id,names:{...b.names},chapters:b.chapters}))},
 chapter:async(bookId,chapter,locale=state.lang)=>{
  const data=await loadBook(bookId);if(!data)return[];
  return data.verses.filter(v=>+v.chapter===+chapter).map(v=>{
   let text=String(v.text?.[locale]||'');if(locale==='en')text=text.replace(new RegExp('^\\s*'+Number(v.verse)+'\\.\\s+'),'');
   return{verse:+v.verse,text};
  });
 }
};
'''
    return s
edit('js/app.js',app)

def theme(s):
    if "amiri:'\"NH7 Amiri\"" not in s:
        s=s.replace("const FONT_FA={system:","const FONT_FA={default:'inherit',amiri:'\"NH7 Amiri\",Tahoma,serif',markazi:'\"NH7 Markazi\",Tahoma,serif',system:")
        s=s.replace("const FONT_LATIN={system:","const FONT_LATIN={default:'inherit',system:")
    # Font selections are immediately persisted by the shared font controller.
    if "window.addEventListener('nh7:font454'" not in s:
        marker="window.addEventListener('nh7:ui-preferences'";assert marker in s
        addition="window.addEventListener('nh7:font454',event=>{if(draft&&event.detail){draft[event.detail.script]=event.detail.id;lastApplied='';apply();preview()}});\n"
        s=s.replace(marker,addition+marker,1)
    return s
edit('js/nh7-theme-studio-v453.js',theme)

def fonts(s):
    s=s.replace("return Object.hasOwn(fonts,old)?old:'default';","return Object.hasOwn(fonts,old)&&(fonts[old].script==='both'||fonts[old].script===which)?old:'default';")
    return s
edit('js/nh7-fonts-v454.js',fonts)

# Keep the recovered 280-entry bank unchanged. The user-visible release core has
# no basic-only placeholders; unfinished entries stay staged for later editions.
source=Path('data/lexicon/original-language-v453.json');bank=json.loads(source.read_text())
extra=json.loads(Path('scripts/study-v454/complete-core.json').read_text());assert len(extra)==40
entries=[]
for row in bank['entries']:
    e=json.loads(json.dumps(row))
    if e['id'] in extra:e['explanation']=extra[e['id']]['text'];e['related']=extra[e['id']]['related']
    if not e.get('explanation'):continue
    assert all(isinstance(e['explanation'].get(k),str) and len(e['explanation'][k])>=120 for k in ['fa','en','hr']),e['id']
    assert not any('\u0600'<=c<='\u06ff' for k in ['en','hr'] for c in e['explanation'][k]),e['id']
    e['detailStatus']='contextual_summary';entries.append(e)
assert len(entries)==60
ids={e['id'] for e in entries}
for e in entries:e['related']=[x for x in e.get('related',[]) if x in ids]
package={**bank,'version':'4.5.4','count':len(entries),'reviewedSummaries':len(entries),'entries':entries,'byVerse':{k:[x for x in v if x in ids] for k,v in bank['byVerse'].items() if any(x in ids for x in v)},'recoveredBankCount':len(bank['entries']),'stagedNotPublishedCount':len(bank['entries'])-len(entries),'scope':'complete-explanation-core-not-exhaustive-lexicon'}
Path('data/lexicon/original-language-core-v454.json').write_text(json.dumps(package,ensure_ascii=False,separators=(',',':')))

edit('js/nh7-original-language-v453.js',lambda s:s.replace('data/lexicon/original-language-v453.json?v=4.5.3','data/lexicon/original-language-core-v454.json?v=4.5.4').replace('مدخل پایهٔ بازیابی‌شده','مدخل با توضیح سه‌زبانه').replace('recovered core entries','entries with three-language explanations').replace('obnovljenih osnovnih natuknica','natuknica s objašnjenjima na tri jezika'))

def shell(s):
    for name in ['js/nh7-fonts-v454.js','js/nh7-audio-quick-bible-v454.js']:
        if name not in s:s=s.replace('</body>',f'  <script src="{name}?v=4.5.4" defer></script>\n</body>')
    path='css/nh7-fonts-quick-bible-v454.css'
    if path not in s:s=s.replace('</head>',f'  <link rel="stylesheet" href="{path}?v=4.5.4" />\n</head>')
    for name in ['js/app.js','js/nh7-theme-studio-v453.js','js/nh7-original-language-v453.js']:
        s=re.sub(r'('+re.escape(name)+r')\?[^\"]+',r'\1?v=4.5.4',s)
    return s
edit('index.html',shell)

# Preview keeps the same minimal page shape but uses a NEW storage namespace;
# real accounts, media services and production storage are not enabled.
def preview_builder(s):
    s=s.replace("'js/nh7-original-language-v453.js'}","'js/nh7-original-language-v453.js','js/nh7-fonts-v454.js','js/nh7-audio-quick-bible-v454.js'}")
    s=s.replace('Study Preview 4.5.3','Study Preview 4.5.4')
    return s
edit('scripts/study-v453/build_preview.py',preview_builder)
edit('js/nh7-study-preview-guard-v453.js',lambda s:s.replace('nh7_preview_study_v453:','nh7_preview_study_v454:'))

out=Path('qa-study454');out.mkdir(exist_ok=True)
(out/'release-core-report.json').write_text(json.dumps({'status':'passed','publishedEntries':60,'fullyExplainedInLanguages':['fa','en','hr'],'recoveredBankUnchanged':True,'stagedEntries':220,'originalBibleApocryphaModified':False},indent=2))
print('Prepared immediate fonts, quick Bible and 60 explained entries; 280-entry bank preserved.')
