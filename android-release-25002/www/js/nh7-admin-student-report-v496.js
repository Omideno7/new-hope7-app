(function reportScriptV496(){
  'use strict';
  if(window.__NH7_ADMIN_STUDENT_REPORT_V496__)return;
  window.__NH7_ADMIN_STUDENT_REPORT_V496__=true;
  const VERSION='4.9.6-student-report-explicit-pdf-engines';
  let report={email:'',language:'fa',html:'',name:'',generatedAt:null};
  let pdfState={key:'',blob:null,promise:null,error:''};
  let pdfEnginePromise=null;
  const L=(fa,en,hr,l=null)=>{const v=l||String(typeof lang!=='undefined'?lang:'fa');return v==='fa'?fa:v==='hr'?hr:en};
  const E=v=>typeof h==='function'?h(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const N=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const currentLang=()=>{const v=String(typeof lang!=='undefined'?lang:'fa');return ['fa','en','hr'].includes(v)?v:'fa'};
  function safeFileName(value){
    const base=String(value||'student').trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').slice(0,80)||'student';
    return 'New-Hope-7-Student-Report-'+base+'.pdf';
  }
  function reportKey(){return [report.email,report.language,report.generatedAt?new Date(report.generatedAt).getTime():0].join('|')}
  function resetPdfState(){pdfState={key:'',blob:null,promise:null,error:''}}
  function setPreviewHint(text,isError=false){
    const note=document.getElementById('nh7ReportPreviewHint');
    if(note){note.textContent=text||'';note.style.color=isError?'#b42318':''}
  }
  function setPdfButtonsReady(ready){
    for(const id of ['nh7ReportPrintAction','nh7ReportPdfAction']){
      const btn=document.getElementById(id);if(btn)btn.disabled=!ready;
    }
  }
  function loadScriptOnce(src,key,ready){
    if(ready())return Promise.resolve(true);
    const existing=document.querySelector('script[data-nh7-lib="'+key+'"]');
    if(existing)return new Promise((resolve,reject)=>{
      const check=()=>ready()?resolve(true):reject(new Error(key+' loaded but global is unavailable'));
      if(existing.dataset.loaded==='1'){check();return}
      existing.addEventListener('load',check,{once:true});
      existing.addEventListener('error',()=>reject(new Error(key+' failed to load')),{once:true});
    });
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.dataset.nh7Lib=key;s.src=src;s.async=true;
      const timer=setTimeout(()=>reject(new Error(key+' timed out')),20000);
      s.onload=()=>{clearTimeout(timer);s.dataset.loaded='1';ready()?resolve(true):reject(new Error(key+' global unavailable'))};
      s.onerror=()=>{clearTimeout(timer);reject(new Error(key+' failed to load'))};
      document.head.appendChild(s);
    });
  }
  function loadPdfEngine(){
    if(pdfEnginePromise)return pdfEnginePromise;
    pdfEnginePromise=Promise.all([
      loadScriptOnce(
        'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
        'html2canvas-1.4.1',
        ()=>typeof window.html2canvas==='function'
      ),
      loadScriptOnce(
        'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
        'jspdf-2.5.1',
        ()=>typeof window.jspdf?.jsPDF==='function'
      )
    ]).then(()=>true).catch(error=>{pdfEnginePromise=null;throw error});
    return pdfEnginePromise;
  }
  function canvasHasInk(canvas){
    try{
      const ctx=canvas?.getContext?.('2d',{willReadFrequently:true});if(!ctx)return false;
      const w=canvas.width||0,h=canvas.height||0;if(w<50||h<50)return false;
      let ink=0,total=0;
      const cols=28,rows=36;
      for(let yi=1;yi<rows;yi++){
        const y=Math.min(h-1,Math.floor(h*yi/rows));
        for(let xi=1;xi<cols;xi++){
          const x=Math.min(w-1,Math.floor(w*xi/cols));
          const d=ctx.getImageData(x,y,1,1).data;total++;
          if(d[3]>30&&(d[0]<238||d[1]<238||d[2]<238))ink++;
        }
      }
      return total>0&&ink>=3;
    }catch(_){return true}
  }
  function horizontalInkBounds(canvas){
    try{
      const w=canvas.width||0,h=canvas.height||0;if(w<20||h<20)return{x:0,width:w};
      const probe=document.createElement('canvas');
      const pw=Math.min(320,w),ph=Math.max(40,Math.min(1400,Math.round(h*pw/w)));
      probe.width=pw;probe.height=ph;
      const pctx=probe.getContext('2d',{willReadFrequently:true});
      pctx.fillStyle='#fff';pctx.fillRect(0,0,pw,ph);pctx.drawImage(canvas,0,0,pw,ph);
      const data=pctx.getImageData(0,0,pw,ph).data;
      let minX=pw,maxX=-1;
      for(let y=0;y<ph;y+=2){
        for(let x=0;x<pw;x++){
          const i=(y*pw+x)*4,r=data[i],g=data[i+1],bl=data[i+2],al=data[i+3];
          if(al>20&&(r<248||g<248||bl<248)){if(x<minX)minX=x;if(x>maxX)maxX=x}
        }
      }
      if(maxX<minX)return{x:0,width:w};
      const pad=Math.max(10,Math.round(w*0.018));
      const x0=Math.max(0,Math.floor(minX/pw*w)-pad);
      const x1=Math.min(w,Math.ceil((maxX+1)/pw*w)+pad);
      return{x:x0,width:Math.max(1,x1-x0)};
    }catch(_){return{x:0,width:canvas.width||1}}
  }
  function canvasToPdfBlob(canvas){
    const JsPDF=window.jspdf?.jsPDF;
    if(typeof JsPDF!=='function')throw new Error(L('موتور PDF در دسترس نیست.','PDF engine is unavailable.','PDF sustav nije dostupan.'));
    if(!canvasHasInk(canvas))throw new Error(L('تصویر گزارش برای PDF سفید تشخیص داده شد. دوباره تلاش کن.','The PDF capture was detected as blank. Please try again.','Snimka PDF-a je prazna. Pokušajte ponovno.'));
    const bounds=horizontalInkBounds(canvas);
    const srcX=bounds.x,srcW=bounds.width,srcH=canvas.height;
    if(srcW<40||srcH<40)throw new Error(L('ابعاد گزارش برای PDF معتبر نیست.','The report dimensions are invalid for PDF.','Dimenzije izvještaja nisu valjane za PDF.'));

    const pdf=new JsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
    const pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight();
    const margin=8,printW=pageW-margin*2,printH=pageH-margin*2;
    const sliceH=Math.max(120,Math.floor(srcW*(printH/printW)));
    let page=0;

    for(let sy=0;sy<srcH;sy+=sliceH){
      const sh=Math.min(sliceH,srcH-sy);
      const slice=document.createElement('canvas');
      slice.width=srcW;slice.height=sh;
      const sctx=slice.getContext('2d');
      sctx.fillStyle='#fff';sctx.fillRect(0,0,srcW,sh);
      sctx.drawImage(canvas,srcX,sy,srcW,sh,0,0,srcW,sh);
      const img=slice.toDataURL('image/jpeg',0.94);
      if(page>0)pdf.addPage('a4','landscape');
      const drawH=Math.min(printH,sh/srcW*printW);
      pdf.addImage(img,'JPEG',margin,margin,printW,drawH,undefined,'FAST');
      slice.width=1;slice.height=1;
      page++;
    }
    const blob=pdf.output('blob');
    if(!(blob instanceof Blob)||blob.size<1500)throw new Error(L('فایل PDF معتبر ساخته نشد.','A valid PDF could not be created.','Nije moguće izraditi valjan PDF.'));
    return blob;
  }
  async function createPdfBlob(){
    if(!report.html)throw new Error(L('ابتدا گزارش را بساز.','Generate the report first.','Najprije izradite izvještaj.'));
    await loadPdfEngine();
    try{await document.fonts?.ready}catch(_){}
    const visibleSource=document.querySelector('#nh7ReportPreviewOverlay .nh7r491-print-surface .nh7r490-report')
      ||document.querySelector('#nh7ReportOutput .nh7r490-report');
    if(!visibleSource)throw new Error(L('گزارش قابل مشاهده پیدا نشد. Preview را دوباره باز کن.','Visible report not found. Reopen the preview.','Vidljivi izvještaj nije pronađen. Ponovno otvorite pregled.'));
    const html2canvasFn=window.html2canvas;
    if(typeof html2canvasFn!=='function')throw new Error(L('موتور تصویر گزارش در دسترس نیست.','Report capture engine is unavailable.','Sustav za snimanje izvještaja nije dostupan.'));
    const apple=/iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

    const host=document.createElement('div');
    host.id='nh7PdfCaptureHostV496';
    host.dir='ltr';
    Object.assign(host.style,{
      position:'fixed',left:'0',top:'0',width:'980px',minWidth:'980px',maxWidth:'980px',
      height:'auto',background:'#fff',zIndex:'2147482000',pointerEvents:'none',
      overflow:'visible',margin:'0',padding:'0',boxSizing:'border-box',direction:'ltr'
    });

    const source=visibleSource.cloneNode(true);
    source.removeAttribute('id');
    source.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    source.dir=report.language==='fa'?'rtl':'ltr';
    Object.assign(source.style,{
      position:'relative',left:'0',right:'auto',top:'0',
      width:'960px',minWidth:'960px',maxWidth:'960px',
      margin:'0',padding:'18px',background:'#fff',overflow:'visible',
      boxSizing:'border-box',transform:'none'
    });
    source.querySelectorAll('*').forEach(el=>{el.style.boxSizing='border-box';el.style.minWidth='0';el.style.maxWidth='100%'});
    source.querySelectorAll('section').forEach(el=>{el.style.overflow='visible';el.style.width='100%';el.style.maxWidth='100%'});
    source.querySelectorAll('table').forEach(el=>{el.style.width='100%';el.style.maxWidth='100%';el.style.minWidth='0';el.style.tableLayout='fixed';el.style.borderCollapse='collapse'});
    source.querySelectorAll('td,th,.long,p,li,small,strong,span').forEach(el=>{el.style.overflowWrap='anywhere';el.style.wordBreak='break-word';el.style.maxWidth='100%'});
    source.querySelectorAll('img').forEach(el=>{el.style.maxWidth='72px';el.style.height='auto';el.style.objectFit='contain'});
    const summary=source.querySelector('.nh7r490-summary');
    if(summary){summary.style.display='grid';summary.style.gridTemplateColumns='repeat(4,minmax(0,1fr))';summary.style.width='100%'}
    const header=source.querySelector('header');
    if(header){header.style.display='grid';header.style.gridTemplateColumns='minmax(0,1fr) 72px';header.style.width='100%';header.style.gap='16px'}

    host.appendChild(source);
    document.body.appendChild(host);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));

    try{
      const images=[...source.querySelectorAll('img')];
      await Promise.all(images.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{
        const done=()=>resolve();img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});setTimeout(done,2200);
      })));

      const captureWidth=Math.max(960,source.scrollWidth,source.offsetWidth);
      const captureHeight=Math.max(source.scrollHeight,source.offsetHeight);
      const canvas=await html2canvasFn(source,{
        scale:apple?1.15:1.35,
        useCORS:true,allowTaint:false,backgroundColor:'#ffffff',logging:false,
        scrollX:0,scrollY:0,width:captureWidth,height:captureHeight,
        windowWidth:Math.max(1000,captureWidth),windowHeight:Math.max(900,Math.min(captureHeight,2200)),
        x:0,y:0,removeContainer:true
      });
      return canvasToPdfBlob(canvas);
    }finally{
      host.remove();
    }
  }
  function ensurePdfReady(){
    const key=reportKey();
    if(pdfState.key===key&&pdfState.blob)return Promise.resolve(pdfState.blob);
    if(pdfState.key===key&&pdfState.promise)return pdfState.promise;
    pdfState={key,blob:null,promise:null,error:''};
    pdfState.promise=createPdfBlob().then(blob=>{pdfState.blob=blob;pdfState.promise=null;return blob}).catch(error=>{pdfState.error=String(error?.message||error);pdfState.promise=null;throw error});
    return pdfState.promise;
  }
  function preparedPdfFile(){
    const blob=pdfState.key===reportKey()?pdfState.blob:null;
    if(!blob)return null;
    try{return new File([blob],safeFileName(report.name||report.email),{type:'application/pdf'})}catch(_){return null}
  }
  function downloadPreparedPdf(){
    const blob=pdfState.key===reportKey()?pdfState.blob:null;
    if(!blob){alert(L('PDF هنوز آماده نشده است. چند لحظه صبر کن.','The PDF is still preparing. Please wait a moment.','PDF se još priprema. Pričekajte trenutak.'));return}
    const file=preparedPdfFile();
    const apple=/iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    if(apple&&file&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
      navigator.share({files:[file],title:'New Hope 7 · '+String(report.name||'Student Report')}).catch(error=>{if(error?.name!=='AbortError')alert(error?.message||String(error))});
      return;
    }
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=safeFileName(report.name||report.email);a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  function printPreparedPdf(){
    const blob=pdfState.key===reportKey()?pdfState.blob:null;
    if(!blob){alert(L('PDF هنوز آماده نشده است. چند لحظه صبر کن.','The PDF is still preparing. Please wait a moment.','PDF se još priprema. Pričekajte trenutak.'));return}
    const file=preparedPdfFile();
    const apple=/iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    if(apple&&file&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
      navigator.share({
        files:[file],
        title:'New Hope 7 · '+String(report.name||'Student Report'),
        text:L('برای چاپ، در پنجره Share گزینه Print را انتخاب کن.','Choose Print in the share sheet.','U izborniku dijeljenja odaberite Print.',report.language)
      }).catch(error=>{if(error?.name!=='AbortError')alert(error?.message||String(error))});
      return;
    }
    const url=URL.createObjectURL(blob);
    const w=window.open(url,'_blank');
    if(!w){
      const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
    }
    setTimeout(()=>URL.revokeObjectURL(url),120000);
  }
  function fmtDate(v,l){if(!v)return'-';try{return new Date(v).toLocaleString(l==='fa'?'fa-IR':l==='hr'?'hr-HR':'en-GB')}catch(_){return String(v)}}
  function fmtSeconds(v){v=Math.max(0,N(v));const h=Math.floor(v/3600),m=Math.floor((v%3600)/60),s=Math.floor(v%60);return h?`${h}h ${m}m`:`${m}m ${s}s`}
  function pct(v){const n=N(v);return Number.isFinite(n)?Math.round(n*10)/10:0}
  function students(){
    try{if(typeof studentDirectory==='function')return studentDirectory()}catch(_){}
    const map=new Map(),add=(email,name='')=>{email=String(email||'').trim().toLowerCase();if(!email)return;if(!map.has(email))map.set(email,{email,name:String(name||'').trim()||email})};
    (state.schoolAssignments||[]).forEach(x=>add(x.user_email,x.user_name));
    (state.schoolAttempts||[]).forEach(x=>add(x.user_email,x.user_name));
    (state.schoolProgress||[]).forEach(x=>add(x.user_email,x.user_name));
    return[...map.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  }
  function optionText(value,l){if(value==null)return'-';if(typeof value==='string')return value;if(typeof value==='object')return String(value[l]||value.fa||value.en||value.hr||value.text||'');return String(value)}
  function questionText(q,l){const v=q?.question;if(typeof v==='string')return v;if(v&&typeof v==='object')return String(v[l]||v.fa||v.en||v.hr||'');return String(q?.text||'')}
  function examTitle(exam,l){return String(exam?.['title_'+l]||exam?.title_fa||exam?.title_en||exam?.title_hr||exam?.lesson_code||'-')}
  function wrongAnswers(attempt,l){
    const exam=(state.schoolExams||[]).find(x=>String(x.id)===String(attempt.exam_id));if(!exam)return[];
    const questions=Array.isArray(exam.questions)?exam.questions:[],answers=Array.isArray(attempt.answers)?attempt.answers:[],out=[];
    answers.forEach((a,index)=>{
      const q=questions.find(x=>N(x.number,-999)===N(a.question_number,-998))||questions[N(a.question_id,-999)]||questions[N(a.question_number,0)-1]||questions[index];
      if(!q)return;
      const selected=N(a.selected,-1),correct=N(q.correct,-2);if(selected===correct)return;
      const opts=Array.isArray(q.options)?q.options:[];
      out.push({number:N(a.question_number,N(q.number,index+1)),question:questionText(q,l)||L('متن سؤال در دسترس نیست','Question text unavailable','Tekst pitanja nije dostupan',l),selected:optionText(opts[selected],l)||String(selected),correct:optionText(opts[correct],l)||String(correct)});
    });
    return out;
  }
  function statusLabel(v,l){
    const key=String(v||''),m={approved:['تأیید شده','Approved','Odobreno'],submitted:['در انتظار بررسی','Pending review','Čeka pregled'],needs_revision:['نیاز به اصلاح','Needs revision','Potrebna dorada']};
    const a=m[key]||[key,key,key];return l==='fa'?a[0]:l==='hr'?a[2]:a[1];
  }
  function rowTitle(item,l){return String(item?.title||item?.['title_'+l]||item?.title_fa||item?.title_en||item?.title_hr||item?.item_id||item?.media_id||'-')}
  function summaryCards(school,activity,reading,l){
    const ss=school?.summary||{},as=activity?.summary||{},read=Array.isArray(reading)?reading:[];
    const cards=[
      [L('درس‌های تکمیل‌شده','Completed lessons','Završene lekcije',l),N(ss.completed_lessons)],
      [L('تکالیف تأییدشده','Approved assignments','Odobreni zadaci',l),N(ss.approved_assignments)],
      [L('آزمون‌های قبول‌شده','Passed attempts','Položeni pokušaji',l),N(ss.passed_attempts)],
      [L('روزهای فعال','Active days','Aktivni dani',l),N(as.active_days)],
      [L('فایل‌های صوتی شنیده‌شده','Audio files listened','Preslušane audio datoteke',l),N(as.audio_files_listened)],
      [L('زمان شنیدن','Listening time','Vrijeme slušanja',l),fmtSeconds(as.total_listened_seconds)],
      [L('کتاب‌های بازشده','Books opened','Otvorene knjige',l),Math.max(N(as.library_opens),read.length)]
    ];
    return`<div class="nh7r490-summary">${cards.map(([k,v])=>`<div><b>${E(v)}</b><span>${E(k)}</span></div>`).join('')}</div>`;
  }
  function progressHtml(rows,l){
    rows=Array.isArray(rows)?rows:[];
    if(!rows.length)return`<p class="empty">${E(L('پیشرفت درسی ثبت نشده است.','No lesson progress recorded.','Nema zabilježenog napretka lekcija.',l))}</p>`;
    return`<table><thead><tr><th>${E(L('درس','Lesson','Lekcija',l))}</th><th>${E(L('پیشرفت','Progress','Napredak',l))}</th><th>${E(L('نمره نهایی','Final score','Konačni rezultat',l))}</th><th>${E(L('تکمیل','Completed','Završeno',l))}</th><th>${E(L('آخرین تغییر','Updated','Ažurirano',l))}</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${E(x.lesson_code||'-')}</td><td>${E(x.progress_percent??0)}%</td><td>${E(x.final_score_percent??x.exam_score??'-')}${x.final_score_percent!=null||x.exam_score!=null?'%':''}</td><td>${E(x.completed_at?'✓':'—')}</td><td>${E(fmtDate(x.updated_at,l))}</td></tr>`).join('')}</tbody></table>`;
  }
  function assignmentsHtml(rows,l){
    rows=Array.isArray(rows)?rows:[];
    if(!rows.length)return`<p class="empty">${E(L('تکلیفی ثبت نشده است.','No assignments recorded.','Nema zabilježenih zadataka.',l))}</p>`;
    return`<table><thead><tr><th>${E(L('درس','Lesson','Lekcija',l))}</th><th>${E(L('وضعیت','Status','Status',l))}</th><th>${E(L('نمره','Score','Ocjena',l))}</th><th>${E(L('پاسخ دانشجو','Student answer','Odgovor studenta',l))}</th><th>${E(L('بازخورد','Feedback','Povratna informacija',l))}</th></tr></thead><tbody>${rows.map(a=>`<tr><td>${E(a.lesson_code||'-')}<br><small>${E(fmtDate(a.submitted_at,l))}</small></td><td>${E(statusLabel(a.status,l))}</td><td>${E(a.score_percent==null?'-':a.score_percent+'%')}</td><td class="long">${E(a.answer_text||'-')}</td><td class="long">${E(a.admin_feedback||'-')}</td></tr>`).join('')}</tbody></table>`;
  }
  function attemptsHtml(rows,l){
    rows=Array.isArray(rows)?rows:[];
    if(!rows.length)return`<p class="empty">${E(L('آزمونی ثبت نشده است.','No exam attempts recorded.','Nema zabilježenih pokušaja ispita.',l))}</p>`;
    return rows.map(a=>{
      const exam=(state.schoolExams||[]).find(x=>String(x.id)===String(a.exam_id)),wrong=wrongAnswers(a,l);
      return`<article class="nh7r490-attempt"><h4>${E(examTitle(exam,l))} · #${E(a.attempt_number||1)} · ${E(a.passed?'✅ '+L('قبول','Passed','Položeno',l):'↻ '+L('نیاز به مرور','Review needed','Potrebno ponoviti',l))}</h4>
      <p>${E(L('نمره آزمون','Exam score','Rezultat ispita',l))}: <b>${E(a.objective_score_percent??a.score_percent??0)}%</b> · ${E(L('تکالیف','Assignments','Zadaci',l))}: <b>${E(a.assignment_score_percent??0)}%</b> · ${E(L('نهایی','Final','Konačno',l))}: <b>${E(a.final_score_percent??a.score_percent??0)}%</b> · ${E(fmtDate(a.submitted_at,l))}</p>
      <h5>${E(L('پاسخ‌های اشتباه','Incorrect answers','Netočni odgovori',l))} (${wrong.length})</h5>
      ${wrong.length?`<ol>${wrong.map(w=>`<li><strong>${E(w.question)}</strong><br><span>${E(L('پاسخ دانشجو','Student','Student',l))}: ${E(w.selected)}</span><br><span>${E(L('پاسخ صحیح','Correct','Točno',l))}: ${E(w.correct)}</span></li>`).join('')}</ol>`:`<p>✓ ${E(L('پاسخ اشتباهی ثبت نشده است.','No incorrect answers recorded.','Nema zabilježenih netočnih odgovora.',l))}</p>`}
    </article>`;
    }).join('');
  }
  function audioHtml(rows,l){
    rows=Array.isArray(rows)?rows:[];
    if(!rows.length)return`<p class="empty">${E(L('فعالیت صوتی ثبت نشده است.','No audio activity recorded.','Nema zabilježene audio aktivnosti.',l))}</p>`;
    return`<table><thead><tr><th>${E(L('فایل','Audio','Audio',l))}</th><th>${E(L('نوع','Type','Vrsta',l))}</th><th>${E(L('شنیده','Listened','Preslušano',l))}</th><th>${E(L('پیشرفت','Reached','Dosegnuto',l))}</th><th>${E(L('وضعیت','Status','Status',l))}</th><th>${E(L('آخرین فعالیت','Last activity','Zadnja aktivnost',l))}</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${E(rowTitle(x,l))}</td><td>${E(x.media_type||'-')}</td><td>${E(fmtSeconds(x.total_listened_seconds))}</td><td>${E(pct(x.reached_percent))}%</td><td>${E(x.completed?'✓ '+L('کامل','Complete','Završeno',l):x.likely_skipped?'⚠ '+L('پرش زیاد','Likely skipped','Vjerojatno preskakano',l):L('در حال گوش دادن','In progress','U tijeku',l))}</td><td>${E(fmtDate(x.last_listened_at,l))}</td></tr>`).join('')}</tbody></table>`;
  }
  function libraryHtml(access,reading,l){
    const detailed=Array.isArray(reading)?reading:[],opened=Array.isArray(access)?access:[];
    if(detailed.length){
      return`<table><thead><tr><th>${E(L('کتاب','Book','Knjiga',l))}</th><th>${E(L('پیشرفت مطالعه','Reading progress','Napredak čitanja',l))}</th><th>${E(L('زمان فعال','Active time','Aktivno vrijeme',l))}</th><th>${E(L('آخرین مطالعه','Last read','Zadnje čitanje',l))}</th></tr></thead><tbody>${detailed.map(x=>`<tr><td>${E(rowTitle(x,l))}</td><td>${E(pct(x.read_percent))}% ${x.completed_at?'✓':''}</td><td>${E(fmtSeconds(x.active_seconds))}</td><td>${E(fmtDate(x.last_read_at,l))}</td></tr>`).join('')}</tbody></table>`;
    }
    if(!opened.length)return`<p class="empty">${E(L('کتابی باز نشده است.','No books opened.','Nema otvorenih knjiga.',l))}</p>`;
    return`<p class="notice">${E(L('داده قدیمی فقط بازشدن کتاب را ثبت کرده است؛ درصد مطالعه از نسخه جدید به بعد ثبت می‌شود.','Older data records book opens only; reading percentage is tracked from the new version onward.','Stariji podaci bilježe samo otvaranje knjige; postotak čitanja prati se od nove verzije.',l))}</p>
  <table><thead><tr><th>${E(L('کتاب','Book','Knjiga',l))}</th><th>${E(L('دفعات بازشدن','Opens','Otvaranja',l))}</th><th>${E(L('آخرین بار','Last opened','Zadnje otvaranje',l))}</th></tr></thead><tbody>${opened.map(x=>`<tr><td>${E(rowTitle(x,l))}</td><td>${E(x.open_count||1)}</td><td>${E(fmtDate(x.last_opened_at,l))}</td></tr>`).join('')}</tbody></table>`;
  }
  function build(profile,reading,l,email){
    const school=profile?.school||{},activity=profile?.activity||{},reg=school.registration||{};
    const progress=school.progress||[],assignments=school.assignments||[],attempts=school.attempts||[],audio=activity.audio||[],library=activity.library||[];
    const name=String(reg.user_name||assignments[0]?.user_name||attempts[0]?.user_name||email);
    const html=`<div class="nh7r490-report" dir="${l==='fa'?'rtl':'ltr'}">
    <header><div><h2>New Hope 7 · ${E(L('گزارش دانشجو','Student Report','Izvještaj studenta',l))}</h2><h3>${E(name)}</h3><p>${E(email)} · ${E(L('تاریخ گزارش','Report date','Datum izvještaja',l))}: ${E(fmtDate(new Date(),l))}</p></div><img src="assets/logo.png" alt=""></header>
    ${summaryCards(school,activity,reading,l)}
    <section><h3>${E(L('پیشرفت درس‌ها','Lesson progress','Napredak lekcija',l))}</h3>${progressHtml(progress,l)}</section>
    <section><h3>${E(L('تکالیف','Assignments','Zadaci',l))}</h3>${assignmentsHtml(assignments,l)}</section>
    <section><h3>${E(L('آزمون‌ها و پاسخ‌های اشتباه','Exams and incorrect answers','Ispiti i netočni odgovori',l))}</h3>${attemptsHtml(attempts,l)}</section>
    <section><h3>${E(L('فعالیت فایل‌های صوتی','Audio listening activity','Aktivnost slušanja audija',l))}</h3>${audioHtml(audio,l)}</section>
    <section><h3>${E(L('مطالعه کتابخانه','Library reading','Čitanje knjižnice',l))}</h3>${libraryHtml(library,reading,l)}</section>
    <footer>${E(L('این گزارش برای پیگیری آموزشی و خدمتی تهیه شده است.','This report is prepared for educational and ministry follow-up.','Ovo izvješće pripremljeno je za obrazovno i službeno praćenje.',l))}</footer>
  </div>`;
    return{name,html};
  }
  function reportCss(){
    return`body{font-family:system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;margin:0;color:#102033;background:#fff}.nh7r490-report{max-width:1100px;margin:auto;padding:24px}.nh7r490-report header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:2px solid #0f766e;padding-bottom:14px}.nh7r490-report header img{width:72px;height:72px;object-fit:contain}.nh7r490-report h2,.nh7r490-report h3,.nh7r490-report h4{margin:0 0 8px}.nh7r490-report section{margin:24px 0}.nh7r490-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}.nh7r490-summary div{border:1px solid #d8ecea;border-radius:12px;padding:10px}.nh7r490-summary b{display:block;font-size:1.25rem}.nh7r490-summary span{font-size:.78rem;color:#667085}table{width:100%;border-collapse:collapse;font-size:.85rem}th,td{border:1px solid #dce8e7;padding:7px;vertical-align:top;text-align:start}th{background:#eef8f7}.long{max-width:310px;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;unicode-bidi:plaintext}.nh7r490-attempt{border:1px solid #d8ecea;border-radius:14px;padding:12px;margin:10px 0;break-inside:avoid}.nh7r490-attempt li{margin:9px 0}.notice{padding:9px;border-radius:10px;background:#fff7ed;color:#9a3412}.empty{color:#667085}.nh7r490-report footer{margin-top:30px;padding-top:10px;border-top:1px solid #d8ecea;font-size:.75rem;color:#667085}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.nh7r490-report{padding:0}.nh7r490-report section{break-inside:auto}table{page-break-inside:auto}tr{page-break-inside:avoid}.nh7r490-summary{grid-template-columns:repeat(4,1fr)}}@media(max-width:700px){.nh7r490-summary{grid-template-columns:1fr 1fr}.nh7r490-report{padding:12px;overflow-x:auto}}`;
  }
  function panel(){
    const list=students(),opts=list.map(s=>`<option value="${E(s.email)}">${E(s.name||s.email)} · ${E(s.email)}</option>`).join('');
    return`<section class="panel-card"><div class="req-head"><div><h3>📄 ${E(L('گزارش جامع دانشجو','Student Report Center','Centar izvještaja studenta'))}</h3><p class="muted small">${E(L('نام یا ایمیل دانشجو را انتخاب کن؛ گزارش تکالیف، آزمون‌ها، شنیدن فایل‌ها و مطالعه کتابخانه ساخته می‌شود.','Select a student to generate assignments, exams, audio and library activity.','Odaberite studenta za izvještaj o zadacima, ispitima, audiju i knjižnici.'))}</p></div></div>
    <div class="grid3"><select id="nh7ReportStudent"><option value="">— ${E(L('انتخاب دانشجو','Choose student','Odaberi studenta'))} —</option>${opts}</select><select id="nh7ReportLang"><option value="fa">فارسی</option><option value="en">English</option><option value="hr">Hrvatski</option></select><button class="btn primary" onclick="nh7GenerateStudentReportV496()">📊 ${E(L('ساخت گزارش','Generate report','Izradi izvještaj'))}</button></div>
    <div class="actions"><button id="nh7ReportPrintBtn" class="btn secondary" onclick="nh7OpenStudentReportPreviewV496()" ${report.html?'':'disabled'}>📄 PDF / Print</button><button class="btn ghost" onclick="loadAll(true)">⟳ ${E(typeof tr==='function'?tr('refresh'):'Refresh')}</button></div>
    <div id="nh7ReportStatus" class="muted small"></div>
  </section><section class="panel-card" id="nh7ReportOutput">${report.html||`<div class="empty">${E(L('هنوز گزارشی ساخته نشده است.','No report generated yet.','Izvještaj još nije izrađen.'))}</div>`}</section>`;
  }
  async function generate(){
    const email=String(document.getElementById('nh7ReportStudent')?.value||'').trim().toLowerCase(),l=String(document.getElementById('nh7ReportLang')?.value||currentLang());
    if(!email){alert(L('دانشجو را انتخاب کن.','Choose a student.','Odaberite studenta.'));return}
    const status=document.getElementById('nh7ReportStatus');if(status)status.textContent=L('در حال جمع‌آوری اطلاعات…','Collecting report data…','Prikupljanje podataka…');
    try{
      const [profile,reading]=await Promise.all([
        adminRpc('nh7_admin_student_profile_v451',{p_email:email}),
        adminRpc('nh7_admin_library_reading_v490',{p_email:email}).catch(()=>[])
      ]);
      const built=build(profile,reading,l,email);report={email,language:l,html:built.html,name:built.name,generatedAt:new Date()};resetPdfState();
      const out=document.getElementById('nh7ReportOutput');if(out)out.innerHTML=report.html;
      const btn=document.getElementById('nh7ReportPrintBtn');if(btn)btn.disabled=false;
      if(status)status.textContent=L('گزارش آماده شد ✓','Report ready ✓','Izvještaj je spreman ✓');
      loadPdfEngine().catch(()=>{});
    }catch(e){if(status)status.textContent=e.message||String(e);alert(e.message||String(e))}
  }
  function closePreview(){
    const overlay=document.getElementById('nh7ReportPreviewOverlay');
    if(overlay)overlay.remove();
    document.body.classList.remove('nh7r491-preview-open','nh7r491-printing');
    document.documentElement.classList.remove('nh7r491-preview-open');
  }
  function openPreview(){
    if(!report.html){alert(L('ابتدا گزارش را بساز.','Generate the report first.','Najprije izradite izvještaj.'));return}
    closePreview();
    const overlay=document.createElement('div');
    overlay.id='nh7ReportPreviewOverlay';
    overlay.className='nh7r491-overlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.dir=report.language==='fa'?'rtl':'ltr';
    overlay.innerHTML=`
      <div class="nh7r491-shell">
        <div class="nh7r491-toolbar">
          <div class="nh7r491-toolbar-title">
            <strong>📄 ${E(L('پیش‌نمایش گزارش دانشجو','Student report preview','Pregled izvještaja studenta',report.language))}</strong>
            <small id="nh7ReportPreviewHint">${E(L('می‌توانی گزارش را ببینی، چاپ کنی یا به PDF ذخیره کنی.','Review, print, or save the report as PDF.','Pregledajte, ispišite ili spremite izvještaj kao PDF.',report.language))}</small>
          </div>
          <div class="nh7r491-toolbar-actions">
            <button type="button" class="btn ghost" onclick="nh7CloseStudentReportPreviewV496()">✕ ${E(L('بستن','Close','Zatvori',report.language))}</button>
            <button id="nh7ReportPrintAction" type="button" class="btn secondary" onclick="nh7PrintStudentReportPdfV496()" disabled>🖨 ${E(L('چاپ','Print','Ispis',report.language))}</button>
            <button id="nh7ReportPdfAction" type="button" class="btn primary" onclick="nh7DownloadStudentReportPdfV496()" disabled>📄 ${E(L('ذخیره PDF','Save PDF','Spremi PDF',report.language))}</button>
          </div>
        </div>
        <div class="nh7r491-preview-scroll">
          <div class="nh7r491-print-surface">${report.html}</div>
        </div>
      </div>`;
    overlay.addEventListener('click',event=>{if(event.target===overlay)closePreview()});
    document.body.appendChild(overlay);
    document.body.classList.add('nh7r491-preview-open');
    document.documentElement.classList.add('nh7r491-preview-open');
    overlay.querySelector('button')?.focus();
    setPdfButtonsReady(false);
    setPreviewHint(L('در حال ساخت فایل PDF واقعی…','Preparing the PDF file…','Priprema PDF datoteke…',report.language));
    ensurePdfReady().then(()=>{
      setPdfButtonsReady(true);
      setPreviewHint(L('PDF آماده است. دکمه چاپ یا ذخیره PDF را بزن.','PDF ready. Choose Print or Save PDF.','PDF je spreman. Odaberite Print ili Save PDF.',report.language));
    }).catch(error=>{
      setPdfButtonsReady(false);
      setPreviewHint(L('ساخت PDF انجام نشد: ','PDF generation failed: ','Izrada PDF-a nije uspjela: ',report.language)+String(error?.message||error),true);
    });
  }
  function install(){
    if(typeof tabsHtml!=='function'||typeof renderActivePanel!=='function'||typeof adminRpc!=='function')return false;
    if(tabsHtml.__nh7Report496)return true;
    const oldTabs=tabsHtml;
    const wrappedTabs=function(){
      const html=oldTabs(),button=`<button class="tab ${activeTab==='studentreport'?'active':''}" onclick="setTab('studentreport')">📄 ${E(L('گزارش دانشجو','Student report','Izvještaj studenta'))}</button>`;
      return html.includes('</nav>')?html.replace('</nav>',button+'</nav>'):html+button;
    };
    wrappedTabs.__nh7Report496=true;tabsHtml=window.tabsHtml=wrappedTabs;
    const oldPanel=renderActivePanel;renderActivePanel=window.renderActivePanel=function(){if(activeTab==='studentreport')return panel();return oldPanel()};
    window.nh7GenerateStudentReportV496=generate;
    window.nh7OpenStudentReportPreviewV496=openPreview;
    window.nh7CloseStudentReportPreviewV496=closePreview;
    window.nh7DownloadStudentReportPdfV496=downloadPreparedPdf;
    window.nh7PrintStudentReportPdfV496=printPreparedPdf;
    window.NH7_ADMIN_STUDENT_REPORT_VERSION=VERSION;
    return true;
  }
  const style=document.createElement('style');
  style.id='nh7AdminStudentReportV491Style';
  style.textContent=reportCss()+`
    .nh7r490-report{padding:0;min-width:0}.nh7r490-report header img{max-width:72px}
    .nh7r490-report table{min-width:700px}.nh7r490-report section{overflow-x:auto}
    .nh7r490-report td,.nh7r490-report th,.nh7r490-report p,.nh7r490-report li{overflow-wrap:anywhere;word-break:break-word}
    html.nh7r491-preview-open,body.nh7r491-preview-open{overflow:hidden!important}
    .nh7r491-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.62);display:flex;align-items:stretch;justify-content:center;padding:0}
    .nh7r491-shell{width:min(1180px,100%);height:100dvh;background:#f8fafc;display:flex;flex-direction:column;box-shadow:0 0 40px rgba(0,0,0,.25)}
    .nh7r491-toolbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px max(12px,env(safe-area-inset-right)) 10px max(12px,env(safe-area-inset-left));padding-top:max(10px,env(safe-area-inset-top));background:#fff;border-bottom:1px solid #d8ecea;box-shadow:0 4px 18px rgba(16,32,51,.08)}
    .nh7r491-toolbar-title{min-width:0;display:flex;flex-direction:column;gap:2px}.nh7r491-toolbar-title strong{font-size:.98rem}.nh7r491-toolbar-title small{font-size:.76rem;color:#667085;line-height:1.5}
    .nh7r491-toolbar-actions{display:flex;gap:7px;flex-wrap:wrap}.nh7r491-toolbar-actions .btn{width:auto;min-width:108px;margin:0}
    .nh7r491-preview-scroll{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;padding:16px}
    .nh7r491-print-surface{max-width:1100px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:20px;box-shadow:0 10px 28px rgba(16,32,51,.08)}
    @media(max-width:700px){
      .nh7r491-toolbar{align-items:stretch;flex-direction:column}
      .nh7r491-toolbar-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}
      .nh7r491-toolbar-actions .btn{min-width:0;width:100%;padding:10px 6px;font-size:.82rem}
      .nh7r491-preview-scroll{padding:8px}.nh7r491-print-surface{padding:10px;border-radius:12px}
    }
    @media print{
      body.nh7r491-printing>*:not(#nh7ReportPreviewOverlay){display:none!important}
      body.nh7r491-printing #nh7ReportPreviewOverlay{position:static!important;display:block!important;background:#fff!important;height:auto!important;overflow:visible!important}
      body.nh7r491-printing .nh7r491-shell{width:100%!important;height:auto!important;box-shadow:none!important;background:#fff!important}
      body.nh7r491-printing .nh7r491-toolbar{display:none!important}
      body.nh7r491-printing .nh7r491-preview-scroll{overflow:visible!important;padding:0!important}
      body.nh7r491-printing .nh7r491-print-surface{max-width:none!important;border:0!important;border-radius:0!important;padding:0!important;box-shadow:none!important}
      body.nh7r491-printing .nh7r490-report{padding:0!important;overflow:visible!important}
      body.nh7r491-printing .nh7r490-report section{overflow:visible!important}
    }`;
  document.head.appendChild(style);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.getElementById('nh7ReportPreviewOverlay'))closePreview()});
  setTimeout(()=>loadPdfEngine().catch(()=>{}),1200);
  if(!install()){let n=0;const t=setInterval(()=>{n++;if(install()||n>100)clearInterval(t)},100)}
})();