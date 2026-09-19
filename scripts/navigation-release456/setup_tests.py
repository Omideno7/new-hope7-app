"""Prepare pinned, independent tests outside the release tree."""
from pathlib import Path
import re,subprocess
OUT=Path('/tmp/nav456-release-tests');OUT.mkdir(exist_ok=True)
def get(ref,path):return subprocess.check_output(['git','show',ref+':'+path],text=True)
source=get('a15365d1eaf05225a322670c58f10a4401602fbe','scripts/navigation-v456/browser.py')
old="    p.locator('.nh7-navigation-guide456 summary').click();expect(p.locator('[data-nav-location456]')).to_have_count(6)"
assert old in source;source=source.replace(old,"    expect(p.locator('.nh7-navigation-guide456,[data-nav-location456]')).to_have_count(0)")
source=source.replace("more(p);p.locator('.nh7-navigation-guide456 summary').click();assert",'more(p);assert')
old="   p.set_viewport_size({'width':390,'height':844});more(p);p.locator('.nh7-navigation-guide456 summary').focus();p.keyboard.press('Enter');assert p.locator('.nh7-navigation-guide456').evaluate('(n)=>n.open')"
assert old in source;source=source.replace(old,"   p.set_viewport_size({'width':390,'height':844});more(p);expect(p.locator('.nh7-navigation-guide456')).to_have_count(0)")
source=source.replace('Home/More and keyboard-operated guide fit four widths in light and dark without hiding the header','Home/More fit four widths in light and dark; guide absent and header retained')
assert 'summary' not in source and 'to_have_count(6)' in source
(OUT/'navigation.py').write_text(source)
(OUT/'previous-study.py').write_text(get('ef2c8e4c2ec40da1d1f368c3a1440c59317afc95','scripts/study-v454/browser.py'))
cache=get('3052f19ccfa68f29c3eda55891482e913fd4a0df','scripts/reader-integration-v452/cache_upgrade.py')
cache=re.sub(r'4\.5\.([12])',lambda m:'4.5.'+{'1':'5','2':'6'}[m[1]],cache)
cache=cache.replace("'4.5.6-reader-release'","'js/app.js?v=4.5.6-navigation'")
(OUT/'cache_upgrade.py').write_text(cache)
for name in ['prepare.py','account_test.py']:
 (OUT/name).write_text(Path('scripts/navigation-release456',name).read_text())
print('Pinned navigation, previous feature and real cache-upgrade tests prepared; only removed-guide assertions adjusted.')
