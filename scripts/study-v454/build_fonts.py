"""Build additional OFL fonts at a pinned revision; not included in user QA archives."""
from pathlib import Path
import hashlib,io,json,re,urllib.parse,urllib.request
from fontTools.ttLib import TTFont
COMMIT='f2bd09badbc763d8757951d52deec29da27e85fb';base=Path('assets/fonts/v454');base.mkdir(exist_ok=True,parents=True);report=[]
def get(path):
    url='https://raw.githubusercontent.com/google/fonts/'+COMMIT+'/'+urllib.parse.quote(path,safe='/')
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'NewHope7-Font-Builder'}),timeout=60) as response:
        assert response.status==200
        return response.read()
for family in ['amiri','markazitext']:
    folder='ofl/'+family+'/';meta=get(folder+'METADATA.pb').decode();assert 'license: "OFL"' in meta
    block=next(b for b in re.findall(r'fonts \{([\s\S]*?)\n\}',meta) if 'style: "normal"' in b)
    filename=re.search(r'filename: "([^"]+)"',block)[1]
    license=get(folder+'OFL.txt');assert b'SIL OPEN FONT LICENSE' in license
    data=get(folder+filename);font=TTFont(io.BytesIO(data));chars='پچژگکیی۰۱۲۳۴۵۶۷۸۹';assert all(ord(c) in font.getBestCmap() for c in chars),family
    font.flavor='woff2';font.save(base/(family+'.woff2'));(base/(family+'-OFL.txt')).write_bytes(license)
    report.append({'font':family,'glyphCoverage':chars,'sourceSha256':hashlib.sha256(data).hexdigest(),'sourceCommit':COMMIT,'license':'OFL-1.1','bytes':(base/(family+'.woff2')).stat().st_size})
(base/'manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
Path('qa-study454').mkdir(exist_ok=True);Path('qa-study454/additional-fonts-report.json').write_text(json.dumps({'status':'passed','fonts':report},ensure_ascii=False,indent=2))
print('Amiri and Markazi Text packaged with actual Persian glyph coverage.')
