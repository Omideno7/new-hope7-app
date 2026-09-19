"""Prepare independent release tests before checking out the production baseline."""
from pathlib import Path
import os,re,subprocess
OUT=Path('/tmp/study454-tests');OUT.mkdir(exist_ok=True)
SOURCE=os.environ['SOURCE_SHA'];BASE=os.environ['BASE_SHA']
def content(ref,path):return subprocess.check_output(['git','show',ref+':'+path],text=True)
(OUT/'browser.py').write_text(content(SOURCE,'scripts/study-v454/browser.py'))
(OUT/'reader.py').write_text(content('0554e87363b1bb979f8edaf8609402db08bbd43a','scripts/reader-wave-v452/browser.py'))
original=content('3052f19ccfa68f29c3eda55891482e913fd4a0df','scripts/reader-integration-v452/cache_upgrade.py')
assert 'v=4.5.1' in original and 'v=4.5.2' in original
cache=re.sub(r'4\.5\.([12])',lambda m:'4.5.'+{'1':'2','2':'4'}[m[1]],original)
cache=cache.replace('v451','v452').replace('v452 worker to v452','v452 worker to v454')
cache=cache.replace("'4.5.4-reader-release'","'js/app.js?v=4.5.4'")
(OUT/'cache_upgrade.py').write_text(cache)
(OUT/'prepare.py').write_text(Path('scripts/release-v454/prepare.py').read_text())
print('Pinned font/audio reader tests and real upgrade harness copied outside the release tree.')
