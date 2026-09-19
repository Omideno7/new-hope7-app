from pathlib import Path
import subprocess
root=Path.cwd()
BASE='44dfd189832c4a6031562851765811f941e0efe4'
def original(path): return subprocess.check_output(['git','show',BASE+':'+path],text=True)
p=root/'js/app.js';s=original('js/app.js')
s="import {createSchoolReviewV467} from './nh7-school-review-v467.js?v=4.6.7';\n"+s
start=s.index('async function submitSchoolAssignment(');end=s.index('\nasync function school(params={})',start);s=s[:start]+s[end:]
start=s.index('  const assignmentQuestion=String(tx.assignment_question');end=s.index('\n  view.innerHTML=card(tx.class_title',start)
s=s[:start]+'''  const assignmentQuestion=String(tx.assignment_question||'').trim();
  const reviewV467=createSchoolReviewV467({lang:()=>state.lang,email:currentUserEmail,isLoggedIn:isAccountLoggedIn,name:()=>getKnownUserProfile().name||'',storage:localStorage,online:()=>navigator.onLine,rpc:cloudRpc,snapshot:getSchoolSnapshot,saveNote:saveNoteCloud});
  const assignmentHtml=assignmentQuestion?reviewV467.render({question:assignmentQuestion,row:schoolAssignment,lesson:code}):'';'''+s[end:]
start=s.index("  $('#saveSchoolAssignmentDraft')?.addEventListener");end=s.index("  $('#submitSchoolExam')?.addEventListener",start)
s=s[:start]+"  reviewV467.bind(view.querySelector('.nh7-school-review-v467'),{row:schoolAssignment,lesson:code,course:courseCode,snapshot:schoolSnapshot});\n"+s[end:];p.write_text(s)
p=root/'js/nh7-school-path-v351.js';s=original('js/nh7-school-path-v351.js')
extra='''function attemptsV467(s){
 if(!s||s.graduated||s.passed_already||s.legacy_course_passed||s.class_unlocked===false)return null;
 const used=Number(s.attempts_used),left=Number(s.remaining_attempts),max=Number(s.exam?.max_attempts);
 if(!Number.isInteger(used)||used<0||!Number.isInteger(left)||left<0)return null;
 const total=Number.isInteger(max)&&max>0?max:used+left;
 return total>0?{used,left,total}:null;
}
function attemptsHtmlV467(s){const a=attemptsV467(s);return a?`<p class="nh7-exam-attempts467">${E(L('فرصت باقی‌ماندهٔ آزمون','Exam attempts remaining','Preostali pokušaji ispita'))}: ${E(N(a.left))} / ${E(N(a.total))}</p>`:''}
function attemptsExhaustedV467(s){const a=attemptsV467(s);return !!a&&a.used>0&&a.left===0}
'''
s=s.replace('function statusText(s)',extra+'function statusText(s)',1)
old="if(s?.repeat_required)return L('نیاز به تکرار کلاس'";new="if(attemptsExhaustedV467(s))return L('فرصت‌های آزمون تمام شده','No exam attempts remaining','Nema preostalih pokušaja ispita');"+old
assert old in s;s=s.replace(old,new,1)
old="if(s?.repeat_required)return L('این کلاس را از ابتدا دوباره بگذرانید";new="if(attemptsExhaustedV467(s))return L('فرصت‌های مجاز این آزمون تمام شده است. برای راهنمایی با ادمین مدرسه تماس بگیرید.','All allowed attempts for this exam have been used. Contact the school administrator for guidance.','Iskorišteni su svi dopušteni pokušaji ovog ispita. Obratite se administratoru škole za upute.');"+old
assert old in s;s=s.replace(old,new,1)
old="  const msg=gateText(s);if(msg)body.insertAdjacentHTML('beforeend',`<p class=\"muted\">${E(msg)}</p>`);";assert old in s;s=s.replace(old,old+"\n  body.insertAdjacentHTML('beforeend',attemptsHtmlV467(s));",1)
old="if(final?.ready&&!final?.passed_already)b.addEventListener('click',openFinalExam);d.appendChild(b);return d}"
new="d.insertAdjacentHTML('beforeend',attemptsHtmlV467(final));if(attemptsExhaustedV467(final))d.insertAdjacentHTML('beforeend',`<p class=\"muted\">${E(L('فرصت‌های آزمون نهایی تمام شده است؛ با ادمین مدرسه تماس بگیرید.','Final exam attempts are exhausted; contact the school administrator.','Pokušaji završnog ispita su iscrpljeni; obratite se administratoru škole.'))}</p>`);"+old
assert old in s;s=s.replace(old,new,1)
old="${E(N(e.passing_score||70))}%</p><form id=\"nh7ExamFormV351\">";assert s.count(old)==2;s=s.replace(old,"${E(N(e.passing_score||70))}%</p>${attemptsHtmlV467(s)}<form id=\"nh7ExamFormV351\">");p.write_text(s)
p=root/'index.html';s=original('index.html').replace('js/app.js?v=4.6.5','js/app.js?v=4.6.7').replace('js/nh7-school-path-v351.js?v=4.6.6','js/nh7-school-path-v351.js?v=4.6.7').replace('service-worker.js?v=4.6.6','service-worker.js?v=4.6.7');s=s.replace('</head>','  <link rel="stylesheet" href="css/nh7-school-review-v467.css?v=4.6.7" />\n</head>');p.write_text(s)
p=root/'service-worker.js';p.write_text(original('service-worker.js').replace('sw-release-core-v403.js?v=4.6.6','sw-release-core-v403.js?v=4.6.7'))
p=root/'sw-release-core-v403.js';s=original('sw-release-core-v403.js').replace('4.6.6-school-guide','4.6.7-school-review').replace('nh7-release-core-v466-school-guide','nh7-release-core-v467-school-review');i=s.index('];',s.index('const NH7_RELEASE_ASSETS=['));s=s[:i]+", './js/nh7-school-review-v467.js', './css/nh7-school-review-v467.css'"+s[i:];i=s.index(']);',s.index('const NH7_READER_RELEASE_PATHS_V452'));s=s[:i]+', "js/nh7-school-review-v467.js", "css/nh7-school-review-v467.css"'+s[i:];p.write_text(s)
print('Prepared candidate; main, Supabase, exam rules and previous graduation records are not changed.')
