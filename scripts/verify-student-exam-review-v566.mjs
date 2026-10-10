import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};
const has=(t,n,m)=>must(t.includes(n),m||`Missing ${n}`);
const app=read('js/app.js'),mod=read('js/nh7-exam-review-v566.js'),index=read('index.html'),release=read('sw-release-core-v403.js'),worker=read('service-worker.js');

has(app,"import {createExamReviewV566} from './nh7-exam-review-v566.js?v=5.6.6';",'Exam review module import missing');
has(app,'const nh7ExamReviewV566=createExamReviewV566','Exam review factory not wired');
has(app,'latestReviewV566','Historical attempt review is not rendered');
has(app,'nh7ExamReviewV566.render(attemptExam,result.answers,!passed)','Fresh attempt review is not rendered');
has(app,'prepareExamForAttempt(exam,Number(latest.attempt_number','Historical shuffled-attempt reconstruction missing');

for(const forbidden of ['fetch(','cloudFetch','localStorage.setItem','sessionStorage.setItem','supabase','school_exam_attempts','school_progress','method:\'POST\'','method:"POST"'])must(!mod.toLowerCase().includes(forbidden.toLowerCase()),`Read-only module contains forbidden token: ${forbidden}`);
has(mod,'qs.find(x=>Number(x?.number)===number)||qs[answerIndex]','Question-number mapping guard missing');
has(mod,"a.answer.is_correct!==true".replace('a.answer','x.answer'),'Wrong-answer filter changed unexpectedly');
has(mod,"'مرور پاسخ‌های اشتباه'",'FA review copy missing');
has(mod,"'Review incorrect answers'",'EN review copy missing');
has(mod,"'Pregled netočnih odgovora'",'HR review copy missing');

has(index,'examreview=566','app cache tag not rotated for exam review');
has(index,'service-worker.js?v=5.3.7-student-exam-review','service worker tag not rotated');
has(worker,'sw-release-core-v403.js?v=5.3.7-student-exam-review','worker release-core tag not rotated');
has(release,"NH7_RELEASE_CORE_VERSION='5.3.7-student-exam-review'",'release core version not rotated');
has(release,"'./js/nh7-exam-review-v566.js'",'exam review module missing from release cache');
has(release,'"js/nh7-exam-review-v566.js"','exam review module missing from release fetch allow-list');

console.log('Student exam review v566 verification OK');

// Runtime smoke: a shuffled question set must still map an answer by question_number,
// not by its position inside the filtered wrong-answer list.
globalThis.document={
  getElementById:()=>null,
  createElement:()=>({id:'',textContent:''}),
  head:{appendChild:()=>{}}
};
const {createExamReviewV566}=await import('../js/nh7-exam-review-v566.js?verify=1');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const review=createExamReviewV566({lang:()=> 'en',html:esc,localNum:v=>String(v),questionText:q=>q.question,optionText:o=>o});
const exam={questions:[
  {number:2,question:'Second question',options:['Second A','Second B'],correct:1},
  {number:1,question:'First question',options:['First A','First B'],correct:0}
]};
const rendered=review.render(exam,[
  {question_number:2,selected:0,correct:1,is_correct:false},
  {question_number:1,selected:0,correct:0,is_correct:true}
],true);
must(rendered.includes('Second question'),'Runtime mapping did not select question #2');
must(rendered.includes('Second A'),'Runtime mapping did not show the selected answer for question #2');
must(rendered.includes('Second B'),'Runtime mapping did not show the correct answer for question #2');
must(!rendered.includes('First question'),'Correct answer leaked into wrong-answer review');
console.log('Student exam review v566 runtime mapping smoke OK');
