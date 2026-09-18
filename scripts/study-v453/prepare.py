"""Idempotent isolated-branch integration. Never changes scripture or account data."""
from pathlib import Path
import re

def edit(name,fn):
    p=Path(name);old=p.read_text();new=fn(old)
    if old!=new:p.write_text(new)

def app(s):
    marker="  if(params.mode==='keywords')return bibleKeywordsV450(params);"
    if "params.mode==='lexicon'" not in s:
        assert s.count(marker)==1
        s=s.replace(marker,"  if(params.mode==='lexicon')return window.NH7OriginalLanguageV453.render(params);\n"+marker)
    tile="${tile('bible','🔑',l223('کلیدواژه‌ها','Keywords','Ključne riječi'),l223('۲۵۰۰ واژه','2,500 words','2.500 riječi'),{section:'written',mode:'keywords'})}"
    if "mode:'lexicon'" not in s:
        assert s.count(tile)==1
        s=s.replace(tile,tile+"${tile('bible','🔤',l223('زبان اصلی','Original languages','Izvorni jezici'),l223('واژه، معنی و ارجاع‌های منتخب','Words, meanings and selected references','Riječi, značenja i odabrani navodi'),{section:'written',mode:'lexicon'})}")
    if 'window.NH7StudySourceV453=' not in s:
        s+='\n// Additive study routing; no change to verse identity or text.\nwindow.NH7StudySourceV453={open:params=>navigate(\'bible\',params)};\n'
    return s
edit('js/app.js',app)

def apo(s):
    # Stable identity is attached to the existing wrapper; scripture text stays untouched.
    if 'data-reader-book453=' not in s:
        marker='data-apo-verse="${v.verse}"><button';assert s.count(marker)==1
        s=s.replace(marker,'data-apo-verse="${v.verse}" data-reader-book453="${esc(book.book_id)}" data-reader-chapter453="${chapter}"><button')
    if 'Unified reader owns both direct and legacy gestures' not in s:
        marker='function toggleTools(n){';assert s.count(marker)==1
        s=s.replace(marker,marker+"\n// Unified reader owns both direct and legacy gestures when loaded.\nconst reader=window.NH7ReaderToolbarV452,node=$(`[data-apo-verse=\"${CSS.escape(String(n))}\"]`);if(reader?.toggle&&node&&window.NH7ApoReaderSourceV452){reader.toggle(node);return;}\n",1)
    if 'toggleLegacy:toggleTools' not in s:
        s=s.replace('chapter:currentChapter}),load};','chapter:currentChapter}),load,toggleLegacy:toggleTools};')
    return s
edit('js/nh7-apocrypha-preview-v240.js',apo)

def toolbar(s):
    s=s.replace("const VERSION='4.5.2-r2'","const VERSION='4.5.3-unified'")
    old="const current=window.NH7ApoReaderSourceV452?.current?.(),book=current?.book,verse=+node.dataset.apoVerse;\n  if(!book||!verse||!current.chapter)return null;"
    new="const current=window.NH7ApoReaderSourceV452?.current?.(),book=current?.book,verse=+node.dataset.apoVerse;\n  const stableBook=node.dataset.readerBook453,stableChapter=+node.dataset.readerChapter453;\n  if(!book||!verse||!current.chapter||(stableBook&&stableBook!==book.book_id)||(stableChapter&&stableChapter!==+current.chapter))return null;"
    if 'stableBook=node.dataset.readerBook453' not in s:
        assert s.count(old)==1;s=s.replace(old,new,1)
    marker='function enhance(){\n  observerPending=false;'
    if 'document.documentElement.dataset.nh7UnifiedReader453=' not in s:
        assert marker in s
        s=s.replace(marker,marker+"\n  document.documentElement.dataset.nh7UnifiedReader453='1';",1)
    return s
edit('js/nh7-reader-toolbar-v452.js',toolbar)
edit('js/nh7-apocrypha-v270.js',lambda s:s.replace("const BUILD='wave1a-402-reader452';","const BUILD='wave1a-402-reader453';"))

def shell(s):
    for path in ['css/nh7-theme-studio-v453.css','css/nh7-study-reader-v453.css']:
        if path not in s:s=s.replace('</head>',f'  <link rel="stylesheet" href="{path}?v=4.5.3" />\n</head>')
    for path in ['js/nh7-theme-studio-v453.js','js/nh7-original-language-v453.js']:
        if path not in s:s=s.replace('</body>',f'  <script src="{path}?v=4.5.3" defer></script>\n</body>')
    s=s.replace('js/app.js?v=4.5.2-reader-release','js/app.js?v=4.5.3-study-preview')
    s=s.replace('js/nh7-reader-toolbar-v452.js?v=4.5.2-r2','js/nh7-reader-toolbar-v452.js?v=4.5.3-unified')
    s=s.replace('js/nh7-apocrypha-v270.js?v=4.5.2-reader','js/nh7-apocrypha-v270.js?v=4.5.3-reader')
    return s
edit('index.html',shell)
print('Study, Theme Studio and unified Apocrypha adapters prepared; source texts untouched.')
