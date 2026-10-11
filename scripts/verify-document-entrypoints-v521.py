"""Audit every tracked HTML entry point for ordered Documents dependencies."""
from html.parser import HTMLParser
from pathlib import Path
import re
import subprocess

RENDERER = 'nh7-document-renderer-v521.js'
DEPENDENTS = {'admin-v2.2.0.js', 'admin-v2.3.9-document-runtime-fix4.js'}
class Scripts(HTMLParser):
    def __init__(self):
        super().__init__(); self.scripts = []
    def handle_starttag(self, tag, attrs):
        if tag == 'script':
            attrs = dict(attrs)
            if 'src' in attrs:
                self.scripts.append((attrs['src'].split('?')[0].split('/')[-1], attrs))
def verify(text, name):
    parser = Scripts(); parser.feed(text)
    scripts = parser.scripts
    for i, (src, attrs) in enumerate(scripts):
        if src not in DEPENDENTS:
            continue
        prior = [(s, a) for s, a in scripts[:i] if s == RENDERER]
        assert prior, f'{name}: {src} missing earlier renderer'
        assert not any(k in attrs for k in ('async', 'defer', 'type')), f'{name}: unordered runtime'
        assert not any(k in prior[-1][1] for k in ('async', 'defer', 'type')), f'{name}: unordered renderer'
    return any(s in DEPENDENTS for s, _ in scripts)
# Negative coverage proves omission, wrong order and async dependencies fail.
for bad in [f'<script src="{next(iter(DEPENDENTS))}"></script>',
            '<script src="admin-v2.2.0.js"></script><script src="'+RENDERER+'"></script>',
            '<script async src="'+RENDERER+'"></script><script src="admin-v2.2.0.js"></script>']:
    try: verify(bad, 'negative fixture')
    except AssertionError: pass
    else: raise AssertionError('Guard accepted broken dependency')
files = subprocess.check_output(['git', 'ls-files', '*.html'], text=True).splitlines()
checked = []
for filename in files:
    text = Path(filename).read_text()
    direct = verify(text, filename)
    if direct: checked.append(filename)
    if any(dep in text.replace('\\', '') for dep in DEPENDENTS) and not direct:
        assert filename == 'admin-v239-stable.html', f'{filename}: unguarded dynamic Documents loader'
    # Stable loader fetches the guarded admin.html; it must preserve its renderer.
    if filename == 'admin-v239-stable.html':
        assert "fetch('./admin.html?" in text and 'document.write(html)' in text
        assert not re.search(r'html\.replace\([^\n]*nh7-document-renderer[^\n]*,\s*[\'\"]{2}', text)
        assert verify(Path('admin.html').read_text(), filename+' -> admin.html')
        checked.append(filename+' -> admin.html')
print(f'PASS: scanned {len(files)} HTML files; ordered Documents dependencies: '+', '.join(checked))
