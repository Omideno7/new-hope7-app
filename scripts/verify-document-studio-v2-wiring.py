"""Static dependency and isolation guard for Studio V2; does not apply SQL."""
from pathlib import Path
import re,hashlib
root=Path(__file__).resolve().parents[1]
for path in (root/'js/document-studio-v2').glob('*.mjs'):
    text=path.read_text()
    for relative in re.findall(r'from\s+[\'"]([^\'"]+)[\'"]',text):
        assert relative.startswith('./') and (path.parent/relative).is_file(),(path,relative)
    assert not re.search(r'https?://[^\s\'"]+\.(?:m?js|css)',text),f'Runtime CDN: {path}'
for name,entry in [('document-studio.html','editor'),('document-output.html','output-page'),('document-verify.html','verification'),('my-documents.html','archive')]:
    html=(root/name).read_text()
    for source in ['css/document-studio-v2.css','js/vendor/document-qrcode-1.5.4.js','js/vendor/html2canvas-1.4.1.min.js',f'js/document-studio-v2/{entry}.mjs']:
        assert source in html,(name,source)
    assert html.index('document-qrcode')<html.index(f'{entry}.mjs')
assert 'js/document-studio-v2/admin-entry.mjs' in (root/'admin.html').read_text()
assert 'js/document-studio-v2/archive-entry.mjs' in (root/'index.html').read_text()
review=(root/'supabase/review/document-studio-v2.sql').read_text()
assert 'REVIEW ONLY' in review and "set search_path=''" in review
assert not list((root/'supabase/migrations').glob('*document*studio*v2*'))
assert not re.search(r'(?:update|delete from|alter table)\s+(?:public\.)?school_',review,re.I)
assert not re.search(r'(?:insert into|update|delete from)\s+auth\.',review,re.I)
print('PASS V2 module imports, entry dependencies, bundled QR/PDF assets, isolated review SQL and legacy table safety')
