from pathlib import Path
R=Path(__file__).resolve().parents[2]
p=R/'js/app.js';s=p.read_text()
s="import {createSchoolWorkflowV467} from './nh7-school-workflow-v467.js?v=4.6.7';\n"+s
mark="\n\nconst OFFLINE_MEDIA_PREFIX="
init="""
const schoolWorkflowV467=createSchoolWorkflowV467({
  lang:()=>state.lang,
  email:()=>isAccountLoggedIn()?currentUserEmail():'',
  userName:()=>getKnownUserProfile().name||'',
  rpc:(name,body)=>cloudRpc(name,body),
  snapshot:(email,force)=>getSchoolSnapshot(email,force),
  syncDraft:(code,text,email)=>{
    if(!isAccountLoggedIn()||currentUserEmail().trim().toLowerCase()!==email||!navigator.onLine)return;
    localStorage.setItem('nh7_note_school-'+code,text);
    return saveNoteCloud('note_school-'+code,text);
  }
});
"""
assert mark in s;s=s.replace(mark,'\n'+init+mark,1)
i=s.index('async function submitSchoolAssignment(');j=s.index('\nasync function school(params={}){',i);s=s[:i]+s[j:]
i=s.index('async function schoolLesson(d, code){');j=s.index('\n\nfunction examLocalized',i);x=s[i:j]
x=x.replace('async function schoolLesson(d, code){','async function schoolLesson(d, code){\n  const lessonEpochV467=nh7NavigationEpochV456;',1)
x=x.replace('  const schoolSnapshot=await getSchoolSnapshot(email,false);','  const schoolSnapshot=await getSchoolSnapshot(email,false);\n  if(lessonEpochV467!==nh7NavigationEpochV456)return;',1)
a=x.index('  const assignmentQuestion=');b=x.index('  view.innerHTML=',a)
x=x[:a]+"  const assignmentContextV467={code,courseCode,question:String(tx.assignment_question||l.translations?.en?.assignment_question||l.translations?.fa?.assignment_question||l.translations?.hr?.assignment_question||'').trim(),row:schoolAssignment,snapshot:schoolSnapshot};\n  const assignmentHtml=schoolWorkflowV467.render(assignmentContextV467);\n"+x[b:]
a=x.index("  $('#saveSchoolAssignmentDraft')");b=x.index("  $('#submitSchoolExam')",a)
x=x[:a]+"  schoolWorkflowV467.bind(assignmentContextV467);\n"+x[b:]
s=s[:i]+x+s[j:];p.write_text(s)
p=R/'js/nh7-school-path-v351.js';s=p.read_text()
helper="""
function attemptsHtmlV467(s){
  if(s?.passed_already||s?.graduated||s?.legacy_course_passed)return '';
  const valid=n=>n!==null&&n!==undefined&&Number.isInteger(Number(n))&&Number(n)>=0;
  const max=s?.exam?.max_attempts,left=s?.remaining_attempts,used=s?.attempts_used;
  if(!valid(max)||Number(max)<1||!valid(left)||!valid(used))return '';
  return `<div class="nh7-attempts467 ${Number(left)===0?'is-exhausted':''}"><span>${E(L('فرصت استفاده‌شده','Attempts used','Iskorišteni pokušaji'))}: <strong>${E(N(used))} / ${E(N(max))}</strong></span><span>${E(L('فرصت باقی‌مانده','Attempts remaining','Preostali pokušaji'))}: <strong>${E(N(left))}</strong></span></div>`;
}
function exhaustedV467(s){return s?.exam?.max_attempts!=null&&s?.remaining_attempts!=null&&Number(s.exam.max_attempts)>0&&Number(s.remaining_attempts)===0&&!s?.passed_already&&!s?.graduated}
"""
s=s.replace('function statusText(s)',helper+'function statusText(s)',1)
s=s.replace("if(s?.repeat_required)return L('نیاز به تکرار کلاس'", "if(exhaustedV467(s))return L('فرصت‌های آزمون پایان یافته','No attempts remaining','Nema preostalih pokušaja');if(s?.repeat_required)return L('نیاز به تکرار کلاس'",1)
s=s.replace("if(s?.repeat_required)return L('این کلاس را", "if(exhaustedV467(s))return L('فرصت‌های مجاز این آزمون تمام شده است. برای ادامه با مدیر مدرسه تماس بگیرید؛ پیشرفت قبلی شما حفظ شده است.','The allowed attempts for this exam have been used. Contact the school administrator; your previous progress is preserved.','Iskoristili ste dopuštene pokušaje ovog ispita. Obratite se administratoru; prethodni napredak je sačuvan.');if(s?.repeat_required)return L('این کلاس را",1)
s=s.replace("const body=document.createElement('div');body.className='nh7-class-body-v351';article.appendChild(body);", "article.insertAdjacentHTML('beforeend',attemptsHtmlV467(s));const body=document.createElement('div');body.className='nh7-class-body-v351';article.appendChild(body);",1)
s=s.replace("d.appendChild(b);return d}","d.insertAdjacentHTML('beforeend',attemptsHtmlV467(final));d.appendChild(b);return d}",1)
s=s.replace("data?.final?.passed_already]", "data?.final?.passed_already,data?.final?.remaining_attempts,data?.final?.attempts_used,data?.final?.exam?.max_attempts]",1)
s=s.replace('<form id="nh7ExamFormV351">${qs.map', '${attemptsHtmlV467(s)}<form id="nh7ExamFormV351">${qs.map')
p.write_text(s)
p=R/'index.html';s=p.read_text().replace('js/app.js?v=4.6.5','js/app.js?v=4.6.7').replace('js/nh7-school-path-v351.js?v=4.6.6','js/nh7-school-path-v351.js?v=4.6.7')
s=s.replace('</head>','  <link rel="stylesheet" href="css/nh7-school-workflow-v467.css?v=4.6.7" />\n</head>');p.write_text(s)
print('Prepared scoped assignment UX and server-reported attempt counters, no database/score mutations.')
