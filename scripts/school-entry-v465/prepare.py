from pathlib import Path
import os, subprocess, difflib
BASE='346e274be35ba422a18c96a82810c33f007c1bed'
RUNTIME=['js/app.js','index.html','service-worker.js','sw-release-core-v403.js']
def original(path):
    if os.environ.get('NH7_BASE_DIR'): return (Path(os.environ['NH7_BASE_DIR'])/path).read_text()
    return subprocess.check_output(['git','show',BASE+':'+path],text=True)
def once(s,old,new):
    assert s.count(old)==1,(old[:100],s.count(old))
    return s.replace(old,new,1)
app=original('js/app.js')
a=app.index('async function school(params={}){');b=app.index('\nasync function schoolLesson(',a)
block=app[a:b]
block=once(block,'  const d=await loadSchoolContent();','  const schoolEpochV465=nh7NavigationEpochV456;')
block=once(block,'''data-params='{"login":true}'>🔐''','''data-params='{"enter":true}'>🔐''')
block=once(block,'  if(params.login){','  if(params.login||(params.enter&&!isSchoolIdentityAvailable())){')
block=once(block,"  const cloudAccess=await fetchLatestRegistration('school');if(cloudAccess)access=cloudAccess;", "  const cloudAccess=await fetchLatestRegistration('school');\n  if(schoolEpochV465!==nh7NavigationEpochV456)return;\n  if(cloudAccess)access=cloudAccess;")
block=once(block,'''<button class="secondary-btn wide-btn" data-go="school">${tr('refreshApproval')}</button>''','''<button class="secondary-btn wide-btn" data-go="school" data-params='{"enter":true}'>${tr('refreshApproval')}</button>''')
block=once(block,"  if(params.lesson)return schoolLesson(d,params.lesson);", "  // Load protected lessons only after the existing identity and approval checks.\n  const d=await loadSchoolContent();\n  if(schoolEpochV465!==nh7NavigationEpochV456)return;\n  if(params.lesson)return schoolLesson(d,params.lesson);")
block=once(block,'  const schoolSnapshot=await getSchoolSnapshot(email,true);','  const schoolSnapshot=await getSchoolSnapshot(email,true);\n  if(schoolEpochV465!==nh7NavigationEpochV456)return;')
block=once(block,"    navigate('school',{},true);","    navigate('school',{enter:true},true);")
patched=app[:a]+block+app[b:]
assert patched[:a]==app[:a] and patched[patched.index('\nasync function schoolLesson(',a):]==app[b:]
Path('js/app.js').write_text(patched)
index=once(original('index.html'),'js/app.js?v=4.6.4','js/app.js?v=4.6.5')
index=once(index,'service-worker.js?v=4.6.4','service-worker.js?v=4.6.5')
Path('index.html').write_text(index)
Path('service-worker.js').write_text(once(original('service-worker.js'),'sw-release-core-v403.js?v=4.6.4','sw-release-core-v403.js?v=4.6.5'))
core=once(original('sw-release-core-v403.js'),"'4.6.4-celebrations'","'4.6.5-school-entry'")
core=once(core,"'nh7-release-core-v464-celebrations'","'nh7-release-core-v465-school-entry'")
Path('sw-release-core-v403.js').write_text(core)
Path('qa-output').mkdir(exist_ok=True)
Path('qa-output/runtime.diff').write_text(''.join(''.join(difflib.unified_diff(original(p).splitlines(True),Path(p).read_text().splitlines(True),fromfile='a/'+p,tofile='b/'+p)) for p in RUNTIME))
print('Prepared four-file school entry repair. No authentication, approval rules, student content or backend changed.')
