from pathlib import Path
import subprocess,re
BASE='44dfd189832c4a6031562851765811f941e0efe4'
FILES=['js/app.js','index.html','service-worker.js','sw-release-core-v403.js']
for path in FILES:Path(path).write_bytes(subprocess.check_output(['git','show',BASE+':'+path]))
def once(s,a,b):
 assert s.count(a)==1,(a[:90],s.count(a));return s.replace(a,b,1)
p=Path('js/app.js');old=p.read_text();s="import {createSchoolDraftsV468} from './nh7-school-drafts-v468.js?v=4.6.8';\n"+old
s=once(s,"const OFFLINE_MEDIA_PREFIX=", "const schoolDraftsV468=createSchoolDraftsV468({account:()=>isAccountLoggedIn()?authSession()?.user:null,lang:()=>state.lang});\n\nconst OFFLINE_MEDIA_PREFIX=")
s=once(s,'async function render(route, params={}, preserve=false){','async function render(route, params={}, preserve=false){\n  schoolDraftsV468.unmount();')
s=once(s,'async function submitSchoolAssignment(courseCode,lessonCode,answerText){','async function submitSchoolAssignment(courseCode,lessonCode,answerText){\n  const draftTicketV468=schoolDraftsV468.ticket(lessonCode,answerText);')
s=once(s,"    await cloudRpc('nh7_submit_school_assignment',","    const draftReceiptV468=await cloudRpc('nh7_submit_school_assignment',")
a=s.index('async function submitSchoolAssignment(');b=s.index('async function school(params={}){',a);block=s[a:b]
block=once(block,'    invalidateSchoolSnapshot(currentUserEmail());','    schoolDraftsV468.submitted(draftTicketV468,draftReceiptV468);\n    invalidateSchoolSnapshot(currentUserEmail());');s=s[:a]+block+s[b:]
s=once(s,'async function schoolLesson(d, code){','async function schoolLesson(d, code){\n  schoolDraftsV468.flush();\n  const draftOwnerV468=schoolDraftsV468.owner(),draftEpochV468=nh7NavigationEpochV456;')
a=s.index('async function schoolLesson(');b=s.index('\n\nfunction examLocalized',a);block=s[a:b]
block=once(block,'  const schoolSnapshot=await getSchoolSnapshot(email,false);','  const schoolSnapshot=await getSchoolSnapshot(email,false);\n  if(draftOwnerV468!==schoolDraftsV468.owner()||draftEpochV468!==nh7NavigationEpochV456)return;')
block=once(block,"  $('#completeSchoolLesson')?.addEventListener", "  schoolDraftsV468.attach({element:$('#schoolAssignmentAnswer'),lesson:code,expectedOwner:draftOwnerV468,initialValue:assignmentApproved?(schoolAssignment?.answer_text||''):assignmentDraft,approved:assignmentApproved});\n  $('#completeSchoolLesson')?.addEventListener")
s=s[:a]+block+s[b:]
# Existing assignment HTML, both action handlers, class rules and content unchanged.
for line in old.splitlines():
 if any(x in line for x in ['const assignmentHtml=','const assignmentQuestion=',"$('#saveSchoolAssignmentDraft')?.addEventListener","$('#submitSchoolAssignment')?.addEventListener"]):assert line in s,line[:120]
p.write_text(s)
p=Path('index.html');s=p.read_text();s,n=re.subn(r'js/app\.js\?v=[^"\s]+','js/app.js?v=4.6.8',s);assert n==1
s=once(s,'service-worker.js?v=4.6.6','service-worker.js?v=4.6.8');p.write_text(s)
p=Path('service-worker.js');s=once(p.read_text(),'sw-release-core-v403.js?v=4.6.6','sw-release-core-v403.js?v=4.6.8');p.write_text(s)
p=Path('sw-release-core-v403.js');s=p.read_text().replace('4.6.6-school-guide','4.6.8-school-drafts').replace('nh7-release-core-v466-school-guide','nh7-release-core-v468-school-drafts')
i=s.index('];',s.index('const NH7_RELEASE_ASSETS=['));s=s[:i]+", './js/nh7-school-drafts-v468.js'"+s[i:]
i=s.index(']);',s.index('const NH7_READER_RELEASE_PATHS_V452'));s=s[:i]+', "js/nh7-school-drafts-v468.js"'+s[i:];p.write_text(s)
for path in ['js/app.js','js/nh7-school-drafts-v468.js','service-worker.js','sw-release-core-v403.js']:subprocess.run(['node','--check',path],check=True)
for path in ['js/nh7-school-path-v351.js','js/nh7-school-exam-v344.js','js/nh7-audio-classic-v400.js','js/nh7-audio-route-stability-v423.js','js/nh7-celebrations-v464.js','js/nh7-theme-studio-v453.js','manifest.json','version.json']:
 assert Path(path).read_bytes()==subprocess.check_output(['git','show',BASE+':'+path]),path
print('PASS: old assignment HTML and buttons preserved; no scoring, audio, theme or backend changes.')
