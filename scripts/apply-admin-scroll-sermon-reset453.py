"""Apply only the verified sermon reset and native-scroll corrections."""
from pathlib import Path
import hashlib,sys
ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '.')
EXPECTED={
 'admin.html':'00a8f731d2285a28a42fb482f4990b8738691969',
 'js/admin-v2.2.5-v230.js':'f5cf753b443e83b3becab5c44bd51603c1f0c768',
 'js/nh7-admin-full-stability-v447.js':'66e6b4f1b117e05f2db009e29d7f44c4426cec25',
 'admin-v239-stable.html':'141e905a19d4ce683a5b32ef76bb0aab051b0bd3',
}
def gitsha(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
source={}
for path,expected in EXPECTED.items():
 b=(ROOT/path).read_bytes()
 if gitsha(b)!=expected:raise SystemExit('Source changed; refusing to overwrite '+path)
 source[path]=b.decode('utf-8')
def replace(path,old,new):
 s=source[path]
 if s.count(old)!=1:raise SystemExit('Expected exactly one patch target in '+path)
 source[path]=s.replace(old,new,1)
replace('admin.html',"sermonAudioFile=null;sermonCoverFile=null}\nfunction sermonFormData()",'''sermonAudioFile=null;sermonCoverFile=null;
// Clear the visible controls too: draft-preservation must not restore a saved file.
const editor=document.getElementById('sermonEditor');
if(editor){
  const values={sv_title_fa:'',sv_title_en:'',sv_title_hr:'',sv_description_fa:'',sv_description_en:'',sv_description_hr:'',sv_category:'',sv_youtube:'',sv_duration:'0:00',sv_sort:'100',sv_audio:'',sv_cover:''};
  for(const [id,value] of Object.entries(values)){const el=editor.querySelector('#'+id);if(el)el.value=value}
  const published=editor.querySelector('#sv_published');if(published)published.checked=true;
  editor.querySelector('#nh7SermonMetadataStatus')?.remove();
}}
function sermonFormData()''')
replace('admin.html',"clearSermonDraft();setMessage(tr('saved'),'success');await loadAll(true)","clearSermonDraft();render();setMessage(tr('saved'),'success');await loadAll(true)")
replace('js/admin-v2.2.5-v230.js',"function nh7StudentUnlockV230(){\n  const html=document.documentElement,body=document.body;",'''function nh7StudentUnlockV230(){
  const html=document.documentElement,body=document.body;
  // The observer also runs on unrelated DOM updates. Only unlock our own modal.
  if(!html.classList.contains('nh7-student-profile-open-v230')&&!body.classList.contains('nh7-student-profile-open-v230'))return;''')
replace('js/admin-v2.2.5-v230.js',"  requestAnimationFrame(()=>window.scrollTo(0,nh7StudentScrollYV230));", "  window.scrollTo({top:nh7StudentScrollYV230,left:0,behavior:'instant'});")
# Keep form/focus/detail preservation, but never replay an old scroll after user input.
old=next(line for line in source['js/nh7-admin-full-stability-v447.js'].splitlines() if line.startswith(' requestAnimationFrame(()=>requestAnimationFrame('))
replace('js/nh7-admin-full-stability-v447.js',old," // Restore during this render only; delayed anchor corrections fight touch/wheel scrolling.\n if(Math.abs(window.scrollY-s.y)>2||window.scrollX!==s.x)window.scrollTo({top:s.y,left:s.x,behavior:'instant'});}")
replace('admin-v239-stable.html',"const BUILD='2.3.9.48-listening-session';", "const BUILD='2.3.9.48-scroll-sermon-reset453';")
replace('admin-v239-stable.html',"    html=html.replace('admin-manifest.json?v=2.3.6','admin-manifest.json?v='+BUILD);", "    html=html.replace('admin-manifest.json?v=2.3.6','admin-manifest.json?v='+BUILD);\n    html=html.replace('js/admin-v2.2.5-v230.js?v=2.3.0','js/admin-v2.2.5-v230.js?v='+BUILD);")
TESTED={
 'admin.html':'109eed308e0c8c749a16d46b44dd0d48fa4615af',
 'js/admin-v2.2.5-v230.js':'1cb4b034d9264503cde8358b803ba3215edaaf85',
 'js/nh7-admin-full-stability-v447.js':'217227c6ee03509b0bb5ed246154641a054fe442',
 'admin-v239-stable.html':'023c70981b5703ffbee43dc2f2e125aaf571c9a7',
}
for path,text in source.items():
 if gitsha(text.encode('utf-8'))!=TESTED[path]:raise SystemExit('Output differs from browser-tested source: '+path)
for path,text in source.items():
 (ROOT/path).write_bytes(text.encode('utf-8'))
 print(path,gitsha(text.encode('utf-8')))
