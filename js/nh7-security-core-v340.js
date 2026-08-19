/* New Hope 7 Security Core v3.4.0
   - Server-authoritative school exams: answer keys never reach the learner browser.
   - Direct learner writes to exam attempts/course exam progress are blocked.
   - Public answered Q&A is rewritten to a PII-safe RPC.
   - Normal lesson completion is routed through a constrained server RPC.
*/
(()=>{'use strict';
const VERSION='3.4.0-security-core';
window.NH7_SECURITY_CORE_VERSION=VERSION;
const nativeFetch=window.fetch.bind(window);
const examState={current:null,byId:new Map(),lastRestUrl:'',lastHeaders:null};

function urlOf(input){try{return typeof input==='string'?input:input?.url||String(input||'')}catch(_){return''}}
function methodOf(input,init){return String(init?.method||input?.method||'GET').toUpperCase()}
function mergedHeaders(input,init){const h=new Headers();try{if(input instanceof Request)input.headers.forEach((v,k)=>h.set(k,v))}catch(_){}try{new Headers(init?.headers||{}).forEach((v,k)=>h.set(k,v))}catch(_){}return h}
function restResource(u){const marker='/rest/v1/';const i=u.pathname.indexOf(marker);return i<0?'':u.pathname.slice(i+marker.length).replace(/^\/+|\/+$/g,'')}
function eqValue(v){v=String(v||'');return v.startsWith('eq.')?v.slice(3):v}
function restRpcUrl(restUrl,name){const u=new URL(restUrl,location.href);const marker='/rest/v1/';const i=u.pathname.indexOf(marker);if(i<0)throw new Error('Supabase REST endpoint unavailable');u.pathname=u.pathname.slice(0,i)+marker+'rpc/'+name;u.search='';return u.href}
function jsonResponse(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
function lang(){const x=String(localStorage.getItem('nh7_lang')||document.documentElement.lang||'en').toLowerCase();return ['fa','en','hr'].includes(x)?x:'en'}
function say(fa,en,hr){return lang()==='fa'?fa:lang()==='hr'?hr:en}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function parseBody(body){if(body==null)return null;if(typeof body==='string'){try{return JSON.parse(body)}catch(_){return null}}if(body instanceof URLSearchParams)return null;return body&&typeof body==='object'&&!('arrayBuffer'in body)?body:null}
function rememberRest(url,headers){examState.lastRestUrl=url;examState.lastHeaders=new Headers(headers||{})}
async function rpc(restUrl,headers,name,body){
  const h=new Headers(headers||{});h.set('content-type','application/json');h.set('cache-control','no-store');
  return nativeFetch(restRpcUrl(restUrl,name),{method:'POST',headers:h,body:JSON.stringify(body||{}),cache:'no-store'});
}
async function responseError(res){let text='';try{text=await res.clone().text()}catch(_){};try{const j=JSON.parse(text);return String(j?.message||j?.error||j?.hint||j?.details||text||res.status)}catch(_){return text||String(res.status)}}

window.fetch=async function(input,init={}){
  const raw=urlOf(input);let u=null;try{u=new URL(raw,location.href)}catch(_){return nativeFetch(input,init)}
  const resource=restResource(u),method=methodOf(input,init),headers=mergedHeaders(input,init);
  if(resource)rememberRest(u.href,headers);

  if(resource==='school_exams'&&method==='GET'){
    const course=eqValue(u.searchParams.get('course_code'));
    const lesson=eqValue(u.searchParams.get('lesson_code'));
    if(course||lesson){
      const res=await rpc(u.href,headers,'nh7_school_exam_session_v340',{p_course_code:course||null,p_lesson_code:lesson||null});
      if(!res.ok)return res;
      const session=await res.json();
      const exam=session?.exam||null;
      examState.current=session||null;
      if(exam?.id)examState.byId.set(String(exam.id),session);
      return jsonResponse(exam?[exam]:[]);
    }
  }

  if(resource==='school_exam_attempts'&&method==='POST'){
    return jsonResponse({code:'SERVER_SCORING_REQUIRED',message:'Exam attempts must be submitted through secure server scoring.'},403);
  }

  if(resource==='school_progress'&&method==='POST'){
    const body=parseBody(init?.body);
    if(body&&typeof body==='object'&&!Array.isArray(body)){
      const lessonCode=String(body.lesson_code||'');
      const hasExamFields=['exam_id','exam_score','exam_passed','exam_attempted_at','objective_score_percent','assignment_score_percent','final_score_percent'].some(k=>body[k]!=null);
      if(lessonCode.startsWith('course:')||hasExamFields){
        return jsonResponse({code:'SERVER_SCORING_REQUIRED',message:'Course/exam progress is server controlled.'},403);
      }
      if(lessonCode){
        const res=await rpc(u.href,headers,'nh7_school_progress_save_v340',{
          p_lesson_code:lessonCode,
          p_progress_percent:body.progress_percent==null?null:Number(body.progress_percent),
          p_completed_at:body.completed_at||null
        });
        return res;
      }
    }
  }

  if(resource==='qa_questions'&&method==='GET'&&String(u.searchParams.get('status')||'')==='eq.answered'){
    return rpc(u.href,headers,'nh7_public_answered_questions_v340',{p_limit:50});
  }

  return nativeFetch(input,init);
};

async function secureSubmit(button){
  const session=examState.current;
  const exam=session?.exam;
  if(!exam?.id||!exam?._nh7_secure_server_scoring){
    alert(say('جلسه امن آزمون آماده نیست. صفحه آزمون را دوباره باز کنید.','The secure exam session is not ready. Reopen the exam page.','Sigurna sesija ispita nije spremna. Ponovno otvorite ispit.'));
    return;
  }
  const questions=Array.isArray(exam.questions)?exam.questions:[];
  const prefix=button.id==='submitCourseExam'?'course_exam_q_':'exam_q_';
  const answers=[];
  for(let i=0;i<questions.length;i++){
    const picked=document.querySelector(`input[name="${prefix}${i}"]:checked`);
    if(!picked){alert(say('لطفاً به همه سؤال‌ها پاسخ دهید.','Please answer every question.','Molimo odgovorite na sva pitanja.'));return}
    const qid=Number(questions[i]?._nh7_qid);
    if(!Number.isInteger(qid)||qid<1){alert(say('شناسه امن سؤال معتبر نیست. آزمون را دوباره باز کنید.','The secure question identifier is invalid. Reopen the exam.','Sigurni identifikator pitanja nije valjan. Ponovno otvorite ispit.'));return}
    answers.push({question_id:qid,selected:Number(picked.value)});
  }
  if(!examState.lastRestUrl||!examState.lastHeaders){alert(say('ارتباط امن با سرور آماده نیست.','Secure server connection is not ready.','Sigurna veza s poslužiteljem nije spremna.'));return}
  const old=button.textContent;button.disabled=true;button.textContent=say('در حال بررسی امن نتیجه…','Securely checking result…','Sigurna provjera rezultata…');
  try{
    const res=await rpc(examState.lastRestUrl,examState.lastHeaders,'nh7_submit_school_exam_v340',{p_exam_id:exam.id,p_answers:answers});
    if(!res.ok)throw new Error(await responseError(res));
    const out=await res.json();
    if(!out?.ok)throw new Error(out?.error||'Secure exam submission failed');
    const passed=!!out.passed,objective=Number(out.objective_score_percent||0),finalScore=Number(out.final_score_percent??out.score_percent??0),assignment=Number(out.assignment_score_percent??100);
    const msg=String(exam[(passed?'pass_message_':'fail_message_')+lang()]||exam[passed?'pass_message_en':'fail_message_en']||
      (passed?say('تبریک! شما قبول شدید.','Congratulations! You passed.','Čestitamo! Položili ste.'):say('نتیجه ثبت شد.','Your result has been recorded.','Rezultat je zabilježen.')));
    const box=document.getElementById('courseExamResult');
    if(box){
      box.innerHTML=`<section class="notice" style="${passed?'background:#ecfdf3;color:#08783d':''}"><h3>${passed?'✓ ':''}${esc(say('نتیجه نهایی امن','Secure final result','Sigurni završni rezultat'))}</h3><p><strong>${esc(say('آزمون کتبی','Written exam','Pisani ispit'))}:</strong> ${Number(out.correct_count||0)} / ${Number(out.total_questions||0)} · ${objective}%</p><p><strong>${esc(say('تکالیف','Assignments','Zadaci'))}:</strong> ${assignment}%</p><p><strong>${esc(say('نمره نهایی','Final grade','Završna ocjena'))}:</strong> ${finalScore}%</p><p>${esc(msg)}</p></section>`;
      try{box.scrollIntoView({behavior:'smooth',block:'center'})}catch(_){}
    }else{
      alert(`${say('نمره شما','Your score','Vaš rezultat')}: ${finalScore}%\n\n${msg}`);
    }
    button.textContent=passed?say('قبول شدید ✓','Passed ✓','Položeno ✓'):say('نتیجه ثبت شد ✓','Result saved ✓','Rezultat spremljen ✓');
  }catch(error){
    console.warn('NH7 secure exam submit',error);
    button.disabled=false;button.textContent=old;
    const raw=String(error?.message||error||'');
    const friendly=raw.includes('max_attempts_reached')?say('فرصت‌های آزمون شما تمام شده است.','You have used all exam attempts.','Iskoristili ste sve pokušaje ispita.'):
      raw.includes('exam_already_passed')?say('این آزمون قبلاً با موفقیت گذرانده شده است.','This exam has already been passed.','Ovaj je ispit već položen.'):
      raw.includes('assignments_required')?say('ابتدا تکالیف لازم را کامل کنید.','Complete the required assignments first.','Najprije dovršite potrebne zadatke.'):
      raw.includes('course_completion_required')?say('ابتدا درس‌های لازم دوره را کامل کنید.','Complete the required course lessons first.','Najprije dovršite potrebne lekcije.'):
      say('ثبت امن نتیجه انجام نشد. لطفاً دوباره وارد آزمون شوید.','Secure result submission failed. Please reopen the exam.','Sigurno spremanje rezultata nije uspjelo. Ponovno otvorite ispit.');
    alert(friendly);
  }
}

document.addEventListener('click',event=>{
  const button=event.target?.closest?.('#submitCourseExam,#submitSchoolExam');
  if(!button)return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  secureSubmit(button);
},true);

console.info('NH7 security core active',VERSION);
})();
