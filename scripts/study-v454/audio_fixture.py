"""Use real classic playback with a mocked signed URL; never real account traffic."""
from pathlib import Path
p=Path('scripts/study-v454/browser.py');s=p.read_text()
if 'signed-stream-fixture-v454' not in s:
    start=s.index("             const id='45400000")
    end=s.index('             const item={id,title_fa:',start)
    replacement='''             // signed-stream-fixture-v454: no production token or IndexedDB blob write.
             const id='45400000-0000-4000-8000-000000000001';
             const payload=btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600,sub:'synthetic-reader-test'}));
             localStorage.setItem('nh7_user_session_v170',JSON.stringify({access_token:'test-only.'+payload+'.not-a-valid-signature',user:{email:'reader-qa@example.invalid'}}));
'''
    s=s[:start]+replacement+s[end:]
    marker="    external.append({'method':r.method,'url':r.url})\n"
    assert s.count(marker)==1
    extra="""    if r.url.endswith('/functions/v1/nh7-school-media-access'):
        return route.fulfill(status=200,content_type='application/json',body=json.dumps({'signed_url':BASE+'/qa-study454/sample.wav','expires_in':3600,'mime_type':'audio/wav'}))
"""
    s=s.replace(marker,marker+extra,1)
    s=s.replace("'audioTest':'real HTMLAudioElement + synthetic WAV in classic player'","'audioTest':'real HTMLAudioElement + synthetic WAV via mocked signed stream in classic player'")
    p.write_text(s)
print('Cross-browser audio fixture uses real playback, mocked authorization and no Blob database write.')
