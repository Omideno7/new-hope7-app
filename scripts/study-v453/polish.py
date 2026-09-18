"""Final presentation and deterministic test refinements; no data migration."""
from pathlib import Path

def edit(name,fn):
    p=Path(name);before=p.read_text();after=fn(before)
    if before!=after:p.write_text(after)

font_css='''\n/* Personal fonts must reach legacy Persian paragraph rules, not just body. */
html[data-nh7-studio-font] #view p,html[data-nh7-studio-font] #view small,html[data-nh7-studio-font] #view label,html[data-nh7-studio-font] #view h1,html[data-nh7-studio-font] #view h2,html[data-nh7-studio-font] #view h3,html[data-nh7-studio-font] #view li,html[data-nh7-studio-font] #view .verse-text,html[data-nh7-studio-font] #view .nh7-apo-verse-text{font-family:var(--nh7-studio-font)!important}
#view #nh7ThemeStudio453 .nh7-studio-sample453 p,#view #nh7ThemeStudio453 .nh7-studio-sample453 blockquote,#view #nh7ThemeStudio453 .nh7-studio-sample453 b{font-family:var(--sample-font)!important}
'''
edit('css/nh7-theme-studio-v453.css',lambda s:s if 'Personal fonts must reach legacy Persian' in s else s+font_css)

def theme(s):
    s=s.replace("preset:LABELS[value.preset]?value.preset:'custom',fa:FONT_FA[value.fa]?value.fa:'system',latin:FONT_LATIN[value.latin]?value.latin:'system'","preset:Object.hasOwn(LABELS,value.preset)?value.preset:'custom',fa:Object.hasOwn(FONT_FA,value.fa)?value.fa:'system',latin:Object.hasOwn(FONT_LATIN,value.latin)?value.latin:'system'")
    s=s.replace("x.filter(i=>typeof i.name==='string'","x.filter(i=>i&&typeof i==='object'&&typeof i.id==='string'&&typeof i.name==='string'")
    return s
edit('js/nh7-theme-studio-v453.js',theme)

def lexicon(s):
    s=s.replace("aramaic:L('آرامی','Aramaic','Aramejski')","aramaic:L('آرامی و وام‌واژه‌ها','Aramaic and loanwords','Aramejski i posuđenice')")
    marker=" host.querySelector('[data-lex-back453]').onclick=()=>showList(backParams);"
    if 'Keep the new lexical heading visible' not in s:
        assert marker in s
        s=s.replace(marker," // Keep the new lexical heading visible after opening a long list or related entry.\n window.scrollTo({top:0,behavior:'instant'});document.getElementById('view').scrollTop=0;\n"+marker,1)
    return s
edit('js/nh7-original-language-v453.js',lexicon)

def test(s):
    helper='''def tap_apo_text(p,verse):
    selector=f'.nh7-apo-verse[data-apo-verse="{verse}"] .nh7-apo-verse-text'
    trigger=p.locator(f'.nh7-apo-verse[data-apo-verse="{verse}"] .nh7-apo-verse-main')
    expect(trigger).to_have_attribute('data-nh7-inline392','1')
    text=p.locator(selector)
    text.scroll_into_view_if_needed()
    point=text.evaluate('(n)=>{const r=[...n.getClientRects()].find(r=>r.width>2&&r.height>2);if(!r)throw Error("No text rectangle");const box=n.getBoundingClientRect();return{x:r.left-box.left+Math.min(r.width/2,12),y:r.top-box.top+r.height/2}}')
    # Locator actionability checks wait for stable layout and the correct event
    # recipient. Never force the click or replace it with a scripted event.
    text.click(position=point)
'''
    if 'def tap_apo_text(' not in s:
        marker='def mock(route):\n';assert marker in s;s=s.replace(marker,helper+marker,1)
    else:
        start=s.index('def tap_apo_text(');end=s.index('def mock(route):',start);s=s[:start]+helper+s[end:]
    s=s.replace("p.locator(selector+' .nh7-apo-verse-main').click();assert p.evaluate('NH7ReaderToolbarV452.selected.size')==0","tap_apo_text(p,numbers[0]);assert p.evaluate('NH7ReaderToolbarV452.selected.size')==0")
    s=s.replace("for n in numbers[:2]:p.locator(f'.nh7-apo-verse[data-apo-verse=\"{n}\"] .nh7-apo-verse-main').click()","for n in numbers[:2]:tap_apo_text(p,n)")
    needle="                assert family in p.evaluate('getComputedStyle(document.body).fontFamily')"
    addition="\n                assert family in p.locator('#nh7ThemeStudio453 header p').evaluate('(n)=>getComputedStyle(n).fontFamily')"
    if addition not in s:
        assert needle in s;s=s.replace(needle,needle+addition,1)
    if 'window.qa453PointerTrace' not in s:
        marker=';c.add_init_script(INIT)';assert marker in s
        trace=r'''(()=>{window.qa453PointerTrace=[];for(const type of ['pointerdown','mousedown','pointerup','mouseup','click'])window.addEventListener(type,e=>{const target=e.target instanceof Element?e.target:null,node=target?.closest('.nh7-apo-verse');const api=window.NH7ReaderToolbarV452;const row={event:type,x:e.clientX,y:e.clientY,target:target?.tagName+'.'+target?.className,book:node?.dataset.readerBook453,chapter:node?.dataset.readerChapter453,verse:node?.dataset.apoVerse,before:api?[...api.selected.keys()]:[],current:window.NH7ApoReaderSourceV452?.current()?.book?.book_id};window.qa453PointerTrace.push(row);if(window.qa453PointerTrace.length>60)window.qa453PointerTrace.shift();setTimeout(()=>row.after=api?[...api.selected.keys()]:[],0);},true)})();'''
        s=s.replace(marker,marker+';c.add_init_script('+repr(trace)+')',1)
        marker="p.screenshot(path=str(OUT/f'{ENGINE}-failure.png'),full_page=True);";assert marker in s
        s=s.replace(marker,"(OUT/f'{ENGINE}-pointer-trace.json').write_text(json.dumps(p.evaluate('window.qa453PointerTrace||[]'),ensure_ascii=False,indent=2));\n        "+marker,1)
        s=s.replace("'error':str(error),'checks'","'error':repr(error),'traceback':__import__('traceback').format_exc(),'checks'")
    return s
edit('scripts/study-v453/browser.py',test)
print('Typography checked; real inline text clicks now retain all Playwright actionability checks.')
