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
    if 'def tap_apo_text(' not in s:
        marker='def mock(route):\n';assert marker in s
        helper='''def tap_apo_text(p,verse):
    selector=f'.nh7-apo-verse[data-apo-verse="{verse}"] .nh7-apo-verse-text'
    trigger=p.locator(f'.nh7-apo-verse[data-apo-verse="{verse}"] .nh7-apo-verse-main')
    expect(trigger).to_have_attribute('data-nh7-inline392','1')
    text=p.locator(selector)
    # Inline multi-line boxes can have their bounding-box centre over a different
    # line/element. Click an actual text rectangle and verify the hit target.
    text.evaluate('(n)=>n.scrollIntoView({block:"center",inline:"nearest",behavior:"instant"})')
    point=text.evaluate('(n)=>{const r=[...n.getClientRects()].find(r=>r.width>2&&r.height>2&&r.top>90&&r.bottom<innerHeight-210);if(!r)throw Error("No visible verse text rectangle");const x=r.left+Math.min(r.width/2,12),y=r.top+r.height/2;const hit=document.elementFromPoint(x,y);if(hit?.closest(".nh7-apo-verse")!==n.closest(".nh7-apo-verse"))throw Error("Text hit target does not match requested verse");return{x,y}}')
    p.mouse.click(point['x'],point['y'])
'''
        s=s.replace(marker,helper+marker,1)
    s=s.replace("p.locator(selector+' .nh7-apo-verse-main').click();assert p.evaluate('NH7ReaderToolbarV452.selected.size')==0","tap_apo_text(p,numbers[0]);assert p.evaluate('NH7ReaderToolbarV452.selected.size')==0")
    s=s.replace("for n in numbers[:2]:p.locator(f'.nh7-apo-verse[data-apo-verse=\"{n}\"] .nh7-apo-verse-main').click()","for n in numbers[:2]:tap_apo_text(p,n)")
    needle="                assert family in p.evaluate('getComputedStyle(document.body).fontFamily')"
    addition="\n                assert family in p.locator('#nh7ThemeStudio453 header p').evaluate('(n)=>getComputedStyle(n).fontFamily')"
    if addition not in s:
        assert needle in s;s=s.replace(needle,needle+addition,1)
    return s
edit('scripts/study-v453/browser.py',test)
print('Typography applies to actual text; glossary headings and text hit-target tests refined.')
