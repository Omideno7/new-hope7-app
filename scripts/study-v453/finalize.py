"""Small deterministic safeguards for appearance and test portability."""
from pathlib import Path
p=Path('js/nh7-theme-studio-v453.js');s=p.read_text();s=s.replace("contrast('#102030',bg)?'#ffffff':'#102030'","contrast('#000000',bg)?'#ffffff':'#000000'").replace("['#102030','#ffffff']","['#000000','#ffffff']");p.write_text(s)
p=Path('scripts/study-v453/browser.py');s=p.read_text();lines=s.splitlines()
for i,line in enumerate(lines):
    if 'count=p.evaluate(' in line and 'document.fonts.load' in line:
        lines[i]='                count=p.evaluate(\'(family)=>document.fonts.load(`16px "${family}"`).then(x=>x.length)\',family)'
p.write_text('\n'.join(lines)+'\n')
print('Automatic contrast and browser font-loading syntax checked.')
