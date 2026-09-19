/* Preview only. All account, draft and submission data live in this page's memory. */
import {createSchoolReviewV467} from './js/nh7-school-review-v467.js?v=4.6.7';
import {renderAttemptPreview} from './school-review-attempts-preview.mjs';
let language='fa',status='needs_revision',row=null;
const memory=new Map(),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v))};
const L=(fa,en,hr)=>language==='fa'?fa:language==='hr'?hr:en;
const lesson='preview_lesson_01',course='preview_course';
const review=createSchoolReviewV467({lang:()=>language,email:()=> 'preview@example.invalid',isLoggedIn:()=>true,name:()=> 'Preview',storage,online:()=>!document.getElementById('pvOffline').checked,snapshot:async()=>({assignments:row?[row]:[],from_cache:false}),saveNote:async()=>{},rpc:async(name,payload)=>{await new Promise(r=>setTimeout(r,450));row={lesson_code:lesson,status:'submitted',answer_text:payload.p_answer_text,admin_feedback:''};return row}});
const themeNames={hope:['امید نو','New Hope','Nova nada'],ocean:['اقیانوس','Ocean','Ocean'],forest:['جنگل','Forest','Šuma'],royal:['بنفش سلطنتی','Royal purple','Kraljevska ljubičasta'],sand:['شن گرم','Warm sand','Topli pijesak'],rose:['گل رز','Rose','Ruža'],midnight:['نیمه‌شب','Midnight','Ponoć'],sepia:['سپیا','Sepia','Sepija'],sapphire:['آبی زنده','Vivid blue','Živopisna plava'],emerald:['زمردی','Emerald','Smaragdna'],sunset:['غروب','Sunset','Zalazak sunca'],orchid:['ارکیده','Orchid','Orhideja'],berry:['تمشکی','Berry','Bobičasta'],aurora:['شب ارغوانی','Aurora night','Ljubičasta noć']};
function labels(){
 document.documentElement.lang=language;document.documentElement.dir=language==='fa'?'rtl':'ltr';
 document.getElementById('pvBadge').textContent=L('نسخهٔ آزمایشی • اطلاعات نمونه','Preview • sample data','Pregled • ogledni podaci');
 document.getElementById('pvTitle').textContent=L('تکالیف مدرسه؛ وضعیت روشن و پیش‌نویس محفوظ','School assignments: clear status, preserved drafts','Školski zadaci: jasan status, sačuvane skice');
 document.getElementById('pvIntro').textContent=L('این صفحه به حساب مدرسه متصل نیست. وضعیت‌های زیر را امتحان کنید، یک پاسخ بنویسید، پیش‌نویس را ذخیره یا ارسال آزمایشی کنید. همهٔ عملیات فقط در همین صفحه شبیه‌سازی می‌شوند و هیچ تکلیف واقعی تغییر نمی‌کند.','This page is not connected to your school account. Try the statuses below, write an answer, save a draft or simulate submission. Everything is simulated within this page; no real assignment is changed.','Ova stranica nije povezana s vašim školskim računom. Isprobajte statuse, napišite odgovor, spremite skicu ili simulirajte predaju. Sve se odvija samo na ovoj stranici; nijedan stvarni zadatak se ne mijenja.');
 document.getElementById('pvOfflineLabel').textContent=L('شبیه‌سازی حالت آفلاین','Simulate offline mode','Simuliraj izvanmrežni rad');
 document.getElementById('pvExamTitle').textContent=L('نمایش فرصت‌های آزمون','Exam-attempt display','Prikaz pokušaja ispita');
 document.getElementById('pvExamLabel').textContent=L('تعداد فرصت باقی‌مانده در این نمونه: ','Remaining attempts in this sample: ','Preostali pokušaji u ovom primjeru: ');
 document.getElementById('pvReset').textContent=L('شروع دوبارهٔ همین آزمایش','Restart this preview','Ponovno pokreni ovaj pregled');
 const t=document.getElementById('pvTheme'),chosen=t.value||'hope';t.replaceChildren();Object.entries(themeNames).forEach(([id,v])=>{const o=document.createElement('option');o.value=id;o.textContent=L(...v);t.append(o)});t.value=chosen;
 const box=document.getElementById('pvStatuses');box.replaceChildren();
 const states=[['unsubmitted',L('هنوز ارسال نشده','Not submitted','Nije predano')],['submitted',L('در انتظار بررسی','Awaiting review','Čeka pregled')],['needs_revision',L('نیاز به اصلاح','Needs revision','Potrebna dorada')],['approved',L('تأیید شده','Approved','Odobreno')]];
 for(const [id,text] of states){const b=document.createElement('button');b.textContent=text;b.dataset.sample=id;b.setAttribute('aria-pressed',String(id===status));b.onclick=()=>{status=id;render()};box.append(b)}
}
function render(){
 labels();row=status==='unsubmitted'?null:{lesson_code:lesson,status,answer_text:L('این یک پاسخ نمونه برای آزمایش ظاهر و عملکرد تکلیف است.','This is a sample answer for testing the assignment interface.','Ovo je ogledni odgovor za provjeru sučelja zadatka.'),admin_feedback:status==='needs_revision'?L('لطفاً توضیحتان را کامل‌تر کنید و یک مثال کاربردی اضافه کنید. این بازخورد صرفاً نمونه است.','Please expand your explanation and add a practical example. This feedback is a sample only.','Proširite objašnjenje i dodajte praktičan primjer. Ova je povratna informacija samo ogledna.'):''};
 const view=document.getElementById('view');view.innerHTML=review.render({question:L('پرسش نمونه: از این درس چه آموختید و چگونه آن را در زندگی به کار می‌برید؟','Sample question: What did you learn, and how would you apply it in life?','Ogledno pitanje: Što ste naučili i kako biste to primijenili u životu?'),row,lesson});review.bind(view.firstElementChild,{row,lesson,course});exam();
}
function exam(){const left=Number(document.getElementById('pvAttempts').value);document.getElementById('pvExam').innerHTML=renderAttemptPreview(language,{class_unlocked:true,attempts_used:3-left,remaining_attempts:left,exam:{max_attempts:3},lessons_complete:true,assignments_approved:true,ready:left>0})}
function theme(){const id=document.getElementById('pvTheme').value;NH7ThemeStudioV453.set({preset:id,...NH7ThemeStudioV453.PRESETS[id],fa:'vazirmatn',latin:'inter'})}
document.getElementById('pvLang').onchange=e=>{language=e.target.value;render();theme()};document.getElementById('pvTheme').onchange=theme;document.getElementById('pvAttempts').onchange=exam;document.getElementById('pvReset').onclick=()=>{memory.clear();status='needs_revision';render()};render();theme();window.NH7_REVIEW_PREVIEW_READY=true;
