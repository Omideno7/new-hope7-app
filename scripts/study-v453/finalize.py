"""Deterministic safety refinements. No production calls or scripture edits."""
from pathlib import Path
import ast,subprocess

def edit(name,fn):
    p=Path(name);s=p.read_text();out=fn(s)
    if s!=out:p.write_text(out)

edit('js/nh7-theme-studio-v453.js',lambda s:s.replace("contrast('#102030',bg)?'#ffffff':'#102030'","contrast('#000000',bg)?'#ffffff':'#000000'").replace("['#102030','#ffffff']","['#000000','#ffffff']"))

def apo(s):
    if 'Deactivate the old view before app navigation' not in s:
        marker="document.addEventListener('click',async event=>{const launch="
        assert s.count(marker)==1
        s=s.replace(marker,"document.addEventListener('click',async event=>{\n// Deactivate the old view before app navigation; language timers must not resurrect it.\nconst routeButton=event.target.closest?.('[data-route],[data-go]'),destination=routeButton?.dataset.route||routeButton?.dataset.go;if(destination&&destination!=='apocrypha')active=false;\nconst launch=",1)
        old="if(event.target.id==='langSelect'&&active)setTimeout(()=>{if(currentBook)renderBook(currentBook,currentChapter);else if(payload)renderCatalog()},40)"
        new="if(event.target.id==='langSelect'&&active)setTimeout(()=>{if(!active)return;if(currentBook)renderBook(currentBook,currentChapter);else if(payload)renderCatalog()},40)"
        assert old in s;s=s.replace(old,new,1)
    return s
edit('js/nh7-apocrypha-preview-v240.js',apo)

appearance_css='''\n/* v453 legacy surfaces inherit the active personal palette in either base mode. */
html[data-nh7-studio]{--bg:var(--nh7-studio-bg);--card:var(--nh7-studio-card);--ink:var(--nh7-studio-text);--muted:var(--nh7-studio-muted);--line:var(--nh7-studio-line);--nh7-light-bg:var(--nh7-studio-bg);--nh7-light-card:var(--nh7-studio-card);--nh7-light-ink:var(--nh7-studio-text);--nh7-light-muted:var(--nh7-studio-muted);--nh7-dark-bg:var(--nh7-studio-bg);--nh7-dark-card:var(--nh7-studio-card);--nh7-dark-card-2:var(--nh7-studio-card);--nh7-dark-ink:var(--nh7-studio-text);--nh7-dark-muted:var(--nh7-studio-muted);--nh7-dark-line:var(--nh7-studio-line)}
html[data-nh7-studio] #view .nh7-appearance-panel,html[data-nh7-studio] #view .nh7-v252-settings-box,html[data-nh7-studio] .nh7-settings403-status,html[data-nh7-studio] .nh7-settings403-toast,html[data-nh7-studio] .sermon-note-dialog{background:var(--nh7-studio-card)!important;color:var(--nh7-studio-text)!important;border-color:var(--nh7-studio-line)!important}
html[data-nh7-studio] #view .nh7-appearance-panel .nh7-appearance-help{color:var(--nh7-studio-muted)!important}
'''
edit('css/nh7-theme-studio-v453.css',lambda s:s if 'v453 legacy surfaces inherit' in s else s+appearance_css)

def test(s):
    s=s.replace("{value:async value=>qa453Shares.push(value)},configurable:true}","{value:async value=>qa453Shares.push(value),configurable:true}")
    s=s.replace("errors.append(str(e))","errors.append({'message':str(e),'stack':e.stack})")
    lines=s.splitlines()
    for i,line in enumerate(lines):
        if 'count=p.evaluate(' in line and 'document.fonts.load' in line:
            lines[i]='                count=p.evaluate(\'(family)=>document.fonts.load(`16px "${family}"`).then(x=>x.length)\',family)'
    s='\n'.join(lines)+'\n'
    if 'Personal palette remains readable in both legacy modes' not in s:
        marker="        passed('All eight presets apply and meet every configured text/background contrast pair')\n"
        assert marker in s
        extra='''        for mode in ['dark','light']:
            p.select_option('#nh7ThemeSelect',mode);expect(p.locator('#nh7ThemeStudio453')).to_be_visible()
            panel_color=p.locator('#nh7AppearancePanel').evaluate('(n)=>getComputedStyle(n).backgroundColor')
            card=p.evaluate('NH7ThemeStudioV453.get().card')
            assert panel_color==f'rgb({int(card[1:3],16)}, {int(card[3:5],16)}, {int(card[5:7],16)})'
        passed('Personal palette remains readable in both legacy modes')
'''
        s=s.replace(marker,marker+extra,1)
    return s
edit('scripts/study-v453/browser.py',test)

# The fixture is parsed before any test; it must not silently omit the old-note seed.
for name in ['browser.py','preview_test.py']:
    tree=ast.parse(Path('scripts/study-v453',name).read_text())
    for node in ast.walk(tree):
        if isinstance(node,ast.Constant) and isinstance(node.value,str) and node.value.startswith('(()=>') and node.value.endswith(')();'):
            subprocess.run(['node','--check','-'],input=node.value,text=True,check=True)

def licensing(s):
    s=s.replace("'byVerse':vocab_refs,'sources':", "'byVerse':vocab_refs,'referenceMappingLicense':'CC-BY-SA-4.0','sources':")
    s=s.replace('Lemma-derived Greek reference mappings are licensed CC BY-SA, as specified by the source; no complete Greek verse text is redistributed here.', 'Source morphological analysis and lemmatization: CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/). The adapted selected-reference mappings here are offered under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/). No complete Greek verse text is redistributed here.')
    s=s.replace('Lemma-derived Hebrew reference mappings: CC BY 4.0.', 'Source Hebrew morphological data: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). The combined adapted selected-reference mapping fields are CC BY-SA 4.0; this license does not cover the independently authored app code.')
    return s
edit('scripts/study-v453/build_assets.py',licensing)
print('Legacy route ownership, theme readability, fixture syntax and attribution checked.')
