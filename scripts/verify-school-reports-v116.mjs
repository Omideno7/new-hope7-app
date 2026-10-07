/* Read-only report contracts; uses Node only so the current CI can run it. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const sources=['js/nh7-admin-student-academic-v540.js','js/nh7-admin-student-report-v496.js'].map(f=>fs.readFileSync(f,'utf8'));
const fixture={school:{registration:{user_name:'<Student>',status:'approved'},progress:[{lesson_code:'one',progress_percent:100}],assignments:[{lesson_code:'one',status:'needs_revision',answer_text:'=FORMULA',admin_feedback:'keep me'}],attempts:[{exam_id:'exam',passed:false,score_percent:40,answers:[{question_number:1,selected:0}]}]},activity:{}};
const state={schoolLessons:[{lesson_code:'one',is_active:true},{lesson_code:'two',is_active:true,has_assignment:true}],schoolExams:[{id:'exam',title_en:'Exam',questions:[{number:1,question:{en:'Question',fa:'سؤال',hr:'Pitanje'},correct:1,options:[{en:'Wrong',fa:'غلط',hr:'Netočno'},{en:'Right',fa:'درست',hr:'Točno'}]}]}],schoolAssignments:[],schoolAttempts:[],schoolProgress:[]};
const before=JSON.stringify({fixture,state});
const timers=[];
const context=vm.createContext({window:{},document:{createElement:()=>({}),head:{appendChild(){}},addEventListener(){}},state,lang:'en',setTimeout:(fn,ms)=>{const timer={fn,ms};timers.push(timer);return timer},clearTimeout:timer=>{timer.cleared=true},setInterval:()=>0,clearInterval(){},console,Blob,Map,Set,schoolLessonHasAssignment:l=>l.has_assignment===true});
vm.runInContext(sources[0].replace(/\}\)\(\);\s*$/,'window.__groupTest={matchesFilter,csvEscape,unwrap,reportRequest};})();'),context);
vm.runInContext(sources[1].replace(/\}\)\(\);\s*$/,'window.__detailTest={build,lessonRows,wrongAnswers,csvEscape,bounded};})();'),context);
const {__groupTest:g,__detailTest:d}=context.window;
const rows=[
  {school_registered:true,started_school:false},
  {school_registered:true,started_school:true,days_since_activity:45},
  {school_registered:true,revision_assignments:1},
  {school_registered:true,final_exam_passed:true},
  {school_registered:true,final_exam_attempts:2,final_exam_passed:false},
  {school_registered:false,in_church_roster:true}
];
for(const [filter,count] of [['school_registered',5],['inactive',1],['needs_revision',1],['passed',1],['exam_failed',1],['not_registered',1]])assert.equal(rows.filter(r=>g.matchesFilter(r,filter)).length,count,filter);
assert.equal(g.matchesFilter({final_exam_attempts:2,final_exam_passed:true},'exam_failed'),false,'A later pass must not be called an unresolved failure');
assert.equal(g.matchesFilter({started_school:true,school_registered:true,course_completed:true,days_since_activity:80},'inactive'),false,'Completed students are not stalled');
assert.match(g.csvEscape('=HYPERLINK("x")'),/^"'/);assert.match(d.csvEscape('@SUM(1)'),/^"'/);
assert.equal(g.unwrap([{rows:[]}]).rows.length,0);
for(const locale of ['fa','en','hr']){
  const built=d.build(fixture,[],locale,'fixture@example.invalid');
  assert.match(built.html,/&lt;Student&gt;/);assert.ok(built.html.includes('dir="'+(locale==='fa'?'rtl':'ltr')+'"'));
  assert.ok(built.html.includes('keep me'));assert.ok(built.html.includes('two'));
  assert.equal(d.wrongAnswers(fixture.school.attempts[0],locale).length,1);
}
assert.equal(d.lessonRows(fixture.school).find(x=>x.lesson_code==='two').assignmentState,'missing');
assert.equal(d.wrongAnswers({exam_id:'absent',answers:[{selected:0}]},'en').length,0);
assert.equal(JSON.stringify({fixture,state}),before,'Reports must not mutate source records');
for(const [fn,ms] of [[g.reportRequest,22000],[d.bounded,17000]]){
  const pending=fn(new Promise(()=>{}),ms);timers.at(-1).fn();await assert.rejects(pending,/timed out/);
}
for(const source of sources){assert.doesNotMatch(source,/html2canvas|jspdf|pdf\.addImage/);assert.match(source,/window\.print\(\)/)}
console.log('School report contracts PASS: groups, resolved failure, stalled state, escaping, pending lessons, wrong answers, RTL/LTR, source immutability and bounded timeouts.');
