/* New Hope 7 — final exam review v5.4.0. Read-only presentation of already-scored answers. */
export function createExamReviewV540(ctx){
  const L=(fa,en,hr)=>ctx.lang()==='fa'?fa:ctx.lang()==='hr'?hr:en;
  const asArray=value=>{if(Array.isArray(value))return value;try{const x=JSON.parse(value||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}};
  function render(exam,answers,open=false){
    const qs=Array.isArray(exam&&exam.questions)?exam.questions:[],arr=asArray(answers),wrong=arr.filter(a=>a&&!a.is_correct);
    if(!arr.length)return '';
    if(!wrong.length)return '<section class="nh7-exam-review-v540 success"><h4>✓ '+ctx.html(L('همه پاسخ‌های کتبی درست بود.','All written answers were correct.','Svi pisani odgovori bili su točni.'))+'</h4></section>';
    const rows=wrong.map((a,i)=>{
      const q=qs[i]||qs.find(x=>Number(x&&x.number)===Number(a.question_number))||{},opts=Array.isArray(q.options)?q.options:[],number=a.question_number||i+1;
      const question=ctx.questionText(q)||String(number),selected=a.selected==null?'':ctx.optionText(opts[Number(a.selected)]),correct=ctx.optionText(opts[Number(a.correct)]);
      return '<article class="nh7-exam-wrong-v540"><strong>'+ctx.html(ctx.localNum(number)+'. '+question)+'</strong>'+
        '<p><span>✕ '+ctx.html(L('پاسخ شما','Your answer','Vaš odgovor'))+':</span> '+ctx.html(selected||L('بدون پاسخ','No answer','Bez odgovora'))+'</p>'+
        '<p><span>✓ '+ctx.html(L('پاسخ صحیح','Correct answer','Točan odgovor'))+':</span> '+ctx.html(correct||'-')+'</p></article>';
    }).join('');
    return '<details class="nh7-exam-review-v540" '+(open?'open':'')+'><summary>'+ctx.html(L('مرور پاسخ‌های اشتباه','Review incorrect answers','Pregled netočnih odgovora'))+' · '+ctx.localNum(wrong.length)+'</summary><p class="muted">'+ctx.html(L('این سؤال‌ها را دوباره مرور کنید و بخش مربوط به درس را مطالعه کنید.','Review these questions and revisit the related lesson material.','Ponovno pregledajte ova pitanja i proučite povezani dio lekcije.'))+'</p>'+rows+'</details>';
  }
  return {render};
}
