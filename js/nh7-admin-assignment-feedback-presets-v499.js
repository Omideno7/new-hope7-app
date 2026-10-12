/* New Hope 7 Admin v4.9.9 — Assignment feedback presets.
 * Scope: Admin > Assignments feedback textarea only.
 * Adds preset comments without changing scoring, approval logic, school data, or user app code.
 */
(()=>{'use strict';
if(window.__NH7_ADMIN_ASSIGNMENT_FEEDBACK_PRESETS_V499__)return;
window.__NH7_ADMIN_ASSIGNMENT_FEEDBACK_PRESETS_V499__=true;

const VERSION='4.9.9-assignment-feedback-presets';
const L=(fa,en,hr)=>{
  const v=String(typeof lang!=='undefined'?lang:'fa').toLowerCase();
  return v==='fa'?fa:v==='hr'?hr:en;
};

const PRESETS=[
  {
    group:'revision',
    label:['نیاز به تکمیل — گوش دادن دوباره','Needs completion — listen again','Potrebna dopuna — ponovno poslušati'],
    text:[
      'دانشجوی عزیز، تکلیف شما با دقت بررسی شد. از زمانی که برای انجام آن گذاشتید سپاسگزارم. پاسخ شما هنوز کامل نیست. لطفاً فایل صوتی درس را دوباره با دقت گوش کنید، نکته‌برداری کنید و تمام مواردی را که در درس به‌عنوان تکلیف گفته شده است کامل انجام دهید. سپس تکلیف تکمیل‌شده را دوباره ارسال کنید. برای شما رشد و موفقیت بیشتر آرزو می‌کنم.',
      'Dear student, your assignment has been carefully reviewed. Thank you for the time you invested. Your response is not yet complete. Please listen to the lesson audio again carefully, take notes, and complete every item given as an assignment in the lesson. Then resubmit the completed work. Wishing you continued growth and success.',
      'Dragi studente, vaš je zadatak pažljivo pregledan. Hvala vam na uloženom vremenu. Odgovor još nije potpun. Molimo ponovno pažljivo poslušajte audio lekciju, vodite bilješke i dovršite sve što je u lekciji zadano. Zatim ponovno pošaljite dovršeni zadatak. Želim vam daljnji rast i uspjeh.'
    ]
  },
  {
    group:'revision',
    label:['بخشی ناقص — نکات اصلی جا افتاده','Partly incomplete — key points missing','Djelomično nepotpuno — nedostaju ključne točke'],
    text:[
      'از تلاش شما ممنونم. بخشی از تکلیف به‌خوبی انجام شده است، اما چند نکته اصلی درس در پاسخ شما دیده نمی‌شود. لطفاً درس را یک بار دیگر گوش کنید، نکات مهم را یادداشت کنید و پاسخ خود را بر اساس همه موارد خواسته‌شده کامل‌تر بنویسید. بعد از تکمیل، دوباره ارسال کنید.',
      'Thank you for your effort. Part of the assignment has been done well, but several key points from the lesson are missing. Please listen to the lesson once more, note the important points, and complete your response according to all the requested items. Then resubmit it.',
      'Hvala vam na trudu. Dio zadatka je dobro napravljen, ali nedostaje nekoliko ključnih točaka iz lekcije. Molimo ponovno poslušajte lekciju, zapišite važne točke i dopunite odgovor prema svim traženim stavkama. Zatim ga ponovno pošaljite.'
    ]
  },
  {
    group:'revision',
    label:['نیاز به دقت بیشتر — پاسخ کوتاه است','Needs more detail — answer is too brief','Potrebno više detalja — odgovor je prekratak'],
    text:[
      'شروع خوبی داشته‌اید و از مشارکت شما سپاسگزارم. برای تأیید این تکلیف، پاسخ نیاز به توضیح و جزئیات بیشتری دارد. لطفاً فایل صوتی را دوباره مرور کنید و آنچه آموخته‌اید را با نکات اصلی درس و پاسخ کامل‌تر بنویسید. مطمئنم با کمی دقت بیشتر نتیجه بسیار خوبی خواهید داشت.',
      'You have made a good start, and thank you for participating. To approve this assignment, the response needs more explanation and detail. Please review the audio lesson again and write a fuller answer using the main points you learned. With a little more attention, you can produce a very good result.',
      'Dobro ste započeli i hvala vam na sudjelovanju. Za odobrenje zadatka odgovor treba više objašnjenja i detalja. Molimo ponovno pregledajte audio lekciju i napišite potpuniji odgovor koristeći glavne naučene točke. Uz malo više pažnje rezultat će biti vrlo dobar.'
    ]
  },
  {
    group:'revision',
    label:['نکته‌برداری و انجام تمام مراحل','Take notes and complete every step','Voditi bilješke i dovršiti sve korake'],
    text:[
      'تکلیف شما بررسی شد. لطفاً هنگام گوش دادن به درس نکته‌برداری کنید و هر بخشی را که استاد در طول فایل صوتی به‌عنوان تمرین یا تکلیف مشخص کرده است، یکی‌یکی انجام دهید. هدف فقط پاسخ کوتاه نیست، بلکه نشان دادن درک کامل درس و کاربرد آن است. پس از تکمیل همه مراحل، تکلیف را دوباره ارسال کنید.',
      'Your assignment has been reviewed. Please take notes while listening to the lesson and complete, one by one, every exercise or assignment mentioned in the audio. The goal is not only a short answer, but to demonstrate full understanding and application of the lesson. Resubmit after completing every step.',
      'Vaš je zadatak pregledan. Molimo vodite bilješke tijekom slušanja lekcije i redom izvršite svaku vježbu ili zadatak spomenut u audio zapisu. Cilj nije samo kratak odgovor, nego pokazati potpuno razumijevanje i primjenu lekcije. Ponovno pošaljite zadatak nakon dovršetka svih koraka.'
    ]
  },
  {
    group:'approved',
    label:['کامل و منظم — آفرین','Complete and well organized — well done','Potpuno i uredno — bravo'],
    text:[
      'تکلیف شما بررسی شد و بسیار خوب، کامل و منظم انجام شده است. مشخص است که درس را با دقت دنبال کرده‌اید و برای پاسخ وقت گذاشته‌اید. آفرین و ممنون از تعهد و جدیت شما. همین‌طور با دقت ادامه دهید.',
      'Your assignment has been reviewed and was very well completed, thorough, and organized. It is clear that you followed the lesson carefully and invested time in your response. Well done, and thank you for your commitment and diligence. Keep going with the same care.',
      'Vaš je zadatak pregledan i vrlo je dobro, potpuno i uredno napravljen. Jasno je da ste pažljivo pratili lekciju i uložili vrijeme u odgovor. Bravo i hvala na predanosti i ozbiljnosti. Nastavite s istom pažnjom.'
    ]
  },
  {
    group:'approved',
    label:['عالی — درک خوب از درس','Excellent — strong understanding','Odlično — dobro razumijevanje'],
    text:[
      'بسیار عالی. پاسخ شما نشان می‌دهد که درس را با دقت گوش داده‌اید و نکات اصلی را به‌خوبی درک کرده‌اید. تکلیف کامل و قابل قبول است. از تلاش شما سپاسگزارم و برای ادامه مسیر آموزشی‌تان برکت و پیشرفت بیشتر آرزو می‌کنم.',
      'Excellent. Your response shows that you listened carefully and understood the main points of the lesson well. The assignment is complete and accepted. Thank you for your effort, and I wish you continued growth and progress in your studies.',
      'Odlično. Vaš odgovor pokazuje da ste pažljivo slušali i dobro razumjeli glavne točke lekcije. Zadatak je potpun i prihvaćen. Hvala vam na trudu i želim vam daljnji rast i napredak u učenju.'
    ]
  },
  {
    group:'approved',
    label:['کار خوب — ادامه بده','Good work — keep going','Dobar rad — nastavite'],
    text:[
      'کار بسیار خوبی انجام داده‌اید. تکلیف شما بررسی شد و پاسخ‌ها مناسب و کامل هستند. از مسئولیت‌پذیری شما در انجام تکلیف تشکر می‌کنم. با همین روحیه و نظم ادامه دهید؛ پیشرفت شما ارزشمند است.',
      'You have done very good work. Your assignment has been reviewed and the responses are appropriate and complete. Thank you for your responsibility in completing the work. Continue with the same attitude and consistency; your progress matters.',
      'Napravili ste vrlo dobar posao. Zadatak je pregledan, a odgovori su primjereni i potpuni. Hvala vam na odgovornosti u izvršavanju zadatka. Nastavite s istim stavom i dosljednošću; vaš napredak je važan.'
    ]
  },
  {
    group:'approved',
    label:['تشویق ویژه — تلاش قابل تقدیر','Special encouragement — commendable effort','Posebna pohvala — vrijedan trud'],
    text:[
      'از تلاش و دقت شما صمیمانه تشکر می‌کنم. تکلیف به‌خوبی انجام شده و نشان‌دهنده توجه شما به آموزش است. این نوع جدیت و وفاداری در یادگیری بسیار ارزشمند است. آفرین؛ با همین اشتیاق ادامه دهید.',
      'Thank you sincerely for your effort and attention. The assignment has been completed well and reflects your care for the teaching. This kind of seriousness and faithfulness in learning is valuable. Well done; continue with the same enthusiasm.',
      'Iskreno vam hvala na trudu i pažnji. Zadatak je dobro izvršen i pokazuje vašu ozbiljnost prema učenju. Takva predanost i vjernost u učenju vrlo su vrijedni. Bravo; nastavite s istim oduševljenjem.'
    ]
  }
];

function presetText(preset){
  const v=String(typeof lang!=='undefined'?lang:'fa').toLowerCase();
  return preset.text[v==='hr'?2:v==='en'?1:0];
}
function presetLabel(preset){
  const v=String(typeof lang!=='undefined'?lang:'fa').toLowerCase();
  return preset.label[v==='hr'?2:v==='en'?1:0];
}
function makeControls(id){
  const wrap=document.createElement('div');
  wrap.className='nh7-assignment-presets-v499';
  wrap.dataset.nh7AssignmentPresetsV499=id;

  const title=document.createElement('div');
  title.className='nh7-assignment-presets-title-v499';
  title.textContent=L('💬 بازخورد آماده — یک متن را انتخاب کن','💬 Quick feedback — choose a message','💬 Brza povratna informacija — odaberite poruku');

  const select=document.createElement('select');
  select.dataset.assignmentId=id;
  const first=document.createElement('option');
  first.value='';
  first.textContent=L('انتخاب بازخورد آماده…','Choose a feedback template…','Odaberite predložak povratne informacije…');
  select.appendChild(first);

  for(const groupName of ['revision','approved']){
    const group=document.createElement('optgroup');
    group.label=groupName==='revision'
      ?L('↻ نیاز به اصلاح / تکمیل','↻ Needs revision / completion','↻ Potrebna dorada / dopuna')
      :L('✓ تأیید و تشویق','✓ Approved / encouragement','✓ Odobreno / pohvala');
    PRESETS.forEach((preset,index)=>{
      if(preset.group!==groupName)return;
      const option=document.createElement('option');
      option.value=String(index);
      option.textContent=presetLabel(preset);
      group.appendChild(option);
    });
    select.appendChild(group);
  }
  select.addEventListener('change',()=>{
    if(select.value==='')return;
    const preset=PRESETS[Number(select.value)];
    const target=document.getElementById('as_feedback_'+id);
    if(target&&preset){
      target.value=presetText(preset);
      target.dispatchEvent(new Event('input',{bubbles:true}));
      target.focus({preventScroll:true});
    }
    select.value='';
  });

  const note=document.createElement('small');
  note.textContent=L('بعد از انتخاب، متن داخل کادر می‌آید و هنوز می‌توانی آن را ویرایش کنی.','The message is inserted into the box and remains editable.','Poruka se umeće u polje i i dalje se može uređivati.');

  wrap.append(title,select,note);
  return wrap;
}

function install(){
  document.querySelectorAll('textarea[id^="as_feedback_"]').forEach(textarea=>{
    const id=String(textarea.id).replace(/^as_feedback_/,'');
    if(!id||document.querySelector('[data-nh7-assignment-presets-v499="'+CSS.escape(id)+'"]'))return;
    textarea.insertAdjacentElement('beforebegin',makeControls(id));
  });
}

const style=document.createElement('style');
style.textContent=`
.nh7-assignment-presets-v499{margin:8px 0 9px;padding:9px 10px;border:1px solid var(--line,#d8ecea);border-radius:12px;background:#f8fbfb}
.nh7-assignment-presets-title-v499{font-size:.82rem;font-weight:800;margin-bottom:6px;color:#0f766e}
.nh7-assignment-presets-v499 select{width:100%;margin:0;padding:9px 10px;border-radius:10px;background:#fff}
.nh7-assignment-presets-v499 small{display:block;margin-top:5px;color:var(--muted,#667085);font-size:.74rem;line-height:1.5}
`;
document.head.appendChild(style);

let timer=0;
const observer=new MutationObserver(()=>{
  clearTimeout(timer);
  timer=setTimeout(install,40);
});
observer.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();

window.NH7_ADMIN_ASSIGNMENT_FEEDBACK_PRESETS_VERSION=VERSION;
})();