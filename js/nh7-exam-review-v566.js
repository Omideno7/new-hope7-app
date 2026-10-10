/* New Hope 7 v5.6.6 — student final-exam review.
 * Read-only presentation of answers already stored/scored by the canonical School flow.
 * No network, persistent storage, grading, attempt or progress mutation is performed here.
 */
export function createExamReviewV566(ctx){
  const L=(fa,en,hr)=>ctx.lang()==='fa'?fa:ctx.lang()==='hr'?hr:en;
  const asArray=value=>{if(Array.isArray(value))return value;try{const x=JSON.parse(value||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}};
  function ensureStyle(){
    if(document.getElementById('nh7ExamReviewV566Style'))return;
    const s=document.createElement('style');s.id='nh7ExamReviewV566Style';s.textContent=`
      .nh7-exam-review566{margin:14px 0;padding:12px;border:1px solid var(--nh7-studio-line,var(--line,#d9e6f7));border-radius:16px;background:var(--nh7-studio-card,var(--card,#fff));color:var(--nh7-studio-text,var(--ink,#10284a))}
      .nh7-exam-review566>summary{cursor:pointer;font-weight:800;color:var(--nh7-studio-accent,var(--brand,#1d4ed8))}
      .nh7-exam-review566.success{background:color-mix(in srgb,#16a34a 8%,var(--nh7-studio-card,var(--card,#fff)));border-color:color-mix(in srgb,#16a34a 30%,var(--nh7-studio-line,var(--line,#d9e6f7)))}
      .nh7-exam-review566.success h4{margin:.2rem 0;color:inherit}
      .nh7-exam-wrong566{margin-top:10px;padding:11px 12px;border-radius:13px;background:color-mix(in srgb,#dc2626 6%,var(--nh7-studio-card,var(--card,#fff)));border:1px solid color-mix(in srgb,#dc2626 18%,var(--nh7-studio-line,var(--line,#d9e6f7)))}
      .nh7-exam-wrong566 strong{display:block;margin-bottom:7px}.nh7-exam-wrong566 p{margin:5px 0;line-height:1.55}.nh7-exam-wrong566 p span{font-weight:800}
    `;document.head.appendChild(s);
  }
  function render(exam,answers,open=false){
    const qs=Array.isArray(exam?.questions)?exam.questions:[],arr=asArray(answers);
    if(!arr.length)return '';
    ensureStyle();
    const wrong=arr.map((answer,answerIndex)=>({answer,answerIndex})).filter(x=>x.answer&&x.answer.is_correct!==true);
    if(!wrong.length)return `<section class="nh7-exam-review566 success"><h4>✓ ${ctx.html(L('همه پاسخ‌های کتبی درست بود.','All written answers were correct.','Svi pisani odgovori bili su točni.'))}</h4></section>`;
    const rows=wrong.map(({answer:a,answerIndex})=>{
      const number=Number(a.question_number||answerIndex+1);
      const q=qs.find(x=>Number(x?.number)===number)||qs[answerIndex]||{};
      const opts=Array.isArray(q.options)?q.options:[];
      const selectedIndex=a.selected==null?null:Number(a.selected),correctIndex=a.correct==null?Number(q.correct):Number(a.correct);
      const question=ctx.questionText(q)||String(number);
      const selected=selectedIndex==null?'':ctx.optionText(opts[selectedIndex]);
      const correct=Number.isFinite(correctIndex)?ctx.optionText(opts[correctIndex]):'';
      return `<article class="nh7-exam-wrong566"><strong>${ctx.html(ctx.localNum(number)+'. '+question)}</strong>`+
        `<p><span>✕ ${ctx.html(L('پاسخ شما','Your answer','Vaš odgovor'))}:</span> ${ctx.html(selected||L('بدون پاسخ','No answer','Bez odgovora'))}</p>`+
        `<p><span>✓ ${ctx.html(L('پاسخ صحیح','Correct answer','Točan odgovor'))}:</span> ${ctx.html(correct||'-')}</p></article>`;
    }).join('');
    return `<details class="nh7-exam-review566" ${open?'open':''}><summary>${ctx.html(L('مرور پاسخ‌های اشتباه','Review incorrect answers','Pregled netočnih odgovora'))} · ${ctx.localNum(wrong.length)}</summary><p class="muted">${ctx.html(L('این سؤال‌ها را دوباره مرور کنید و بخش مربوط به درس را مطالعه کنید.','Review these questions and revisit the related lesson material.','Ponovno pregledajte ova pitanja i proučite povezani dio lekcije.'))}</p>${rows}</details>`;
  }
  return {render};
}
