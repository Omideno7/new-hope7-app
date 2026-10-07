/* Start a local static server at repository root; requires Playwright, Chromium,
 * and pdftotext for PDF content checks. Never contacts production services. */
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765';
assert.match(base,/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/);
const output=fs.mkdtempSync(path.join(os.tmpdir(),'nh7-school-report-'));
const fixtures=[
  {email:'enrolled@example.invalid',display_name:'Enrolled',school_registered:true,started_school:false,academic_status_code:'registered_never_started'},
  {email:'stalled@example.invalid',display_name:'Stalled',school_registered:true,started_school:true,days_since_activity:45,academic_status_code:'inactive'},
  {email:'revision@example.invalid',display_name:'Revision',school_registered:true,started_school:true,revision_assignments:1,academic_status_code:'needs_revision'},
  {email:'passed@example.invalid',display_name:'Passed',school_registered:true,final_exam_passed:true,final_exam_best_score:92,academic_status_code:'completed',course_completed:true},
  {email:'failed@example.invalid',display_name:'Failed',school_registered:true,final_exam_attempts:2,final_exam_passed:false,final_exam_best_score:42,academic_status_code:'final_exam_failed'},
  {email:'unregistered@example.invalid',display_name:'Not registered',school_registered:false,app_account_exists:true,academic_status_code:'app_no_school'},
  {email:'roster@example.invalid',display_name:'Roster only',school_registered:false,in_church_roster:true,academic_status_code:'member_no_app'},
  ...Array.from({length:1100},(_,i)=>({email:`bulk${i}@example.invalid`,display_name:`Bulk ${String(i).padStart(4,'0')}`,school_registered:true,started_school:true,total_lessons:7,completed_lessons:1,academic_status_code:'in_progress'})),
  {email:'last@example.invalid',display_name:'ZZLASTDATA',school_registered:true},
  {email:'formula@example.invalid',display_name:'=HYPERLINK("bad")',school_registered:true}
];
const detail={school:{registration:{user_name:'Fixture Student',status:'approved',created_at:'2026-10-01'},summary:{completed_lessons:1},progress:[{lesson_code:'one',progress_percent:100,completed_at:'2026-10-01'}],assignments:[{lesson_code:'one',status:'needs_revision',score_percent:45,answer_text:'=FORMULA("comma,quote")\nsecond line',admin_feedback:'PRESERVED FEEDBACK'}],attempts:[{exam_id:'exam',attempt_number:2,passed:false,score_percent:40,answers:[{question_number:1,selected:0}],submitted_at:'2026-10-02'}]},activity:{}};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true,serviceWorkers:'block'}),errors=[],requests=[];
  page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message)});
  const globals=`var lang='en',token='fixture-only',activeTab='students',adminLoadInFlight=null;var __requests=[],__mode='ok',__profileMode='ok',__optionalUnavailable=false,__printCount=0;window.print=()=>__printCount++;var state={schoolLessons:[{lesson_code:'one',is_active:true},{lesson_code:'two',is_active:true,has_assignment:true}],schoolExams:[{id:'exam',title_en:'Fixture Exam',questions:[{number:1,question:{en:'TEST WRONG QUESTION',fa:'سؤال آزمایشی',hr:'Pokusno pitanje'},correct:1,options:[{en:'Wrong',fa:'غلط',hr:'Netočno'},{en:'Right',fa:'درست',hr:'Točno'}]}]}],schoolProgress:[],schoolAssignments:[],schoolAttempts:[],registrations:[]};var __rows=${JSON.stringify(fixtures)},__detail=${JSON.stringify(detail)};window.__before=JSON.stringify({state,__detail,__rows});function schoolLessonHasAssignment(l){return !!l.has_assignment}function studentDirectory(){return [{email:'revision@example.invalid',name:'Revision'}]}function tabsHtml(){return '<nav></nav>'}function renderActivePanel(){return renderStudentsDashboard()}function renderStudentsDashboard(){return '<p>Original student dashboard</p>'}function render(){document.querySelector('#app').innerHTML=tabsHtml()+renderActivePanel()}function setTab(t){activeTab=t;render()}async function adminRpc(name,payload,timeout){__requests.push({name,payload,timeout});if(name==='nh7_admin_student_academic_center_v542'){if(__mode==='hang')return new Promise(()=>{});if(__mode==='fail')throw Error('57014 statement timeout');if(__mode==='once'){__mode='ok';throw Error('57014 statement timeout')}return {rows:__rows}}if(name==='nh7_admin_student_profile_v451'){if(__profileMode==='hang')return new Promise(()=>{});return __detail}if(name==='nh7_admin_library_reading_v490'){if(__optionalUnavailable)throw Error('optional unavailable');return []}throw Error('Unexpected write/RPC: '+name)}window.__reportTimers=[];const __setTimeout=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...args)=>{if(ms===22000||ms===17000||ms===7000){let item={fn,ms};__reportTimers.push(item)}return __setTimeout(fn,ms,...args)};`;
  await page.route('**/*',async route=>{
   const url=route.request().url();requests.push({url,method:route.request().method()});
   if(url===base+'/__school-report-fixture')return route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fixture Admin</title><style>*{box-sizing:border-box}body{margin:0}.btn{padding:10px;margin:4px;border:1px solid #aaa;border-radius:6px}.grid3{display:grid;grid-template-columns:repeat(3,1fr)}.actions{display:flex;flex-wrap:wrap}.panel-card{padding:14px}input,select{max-width:100%}</style></head><body><main id="app"></main><script>${globals}</script><script src="${base}/js/nh7-admin-student-report-v496.js"></script><script src="${base}/js/nh7-admin-student-academic-v540.js"></script><script>render()</script></body></html>`});
   if(url.startsWith(base+'/'))return route.continue();
   throw Error('External request blocked: '+url);
  });
  await page.goto(base+'/__school-report-fixture');
  await page.waitForFunction(()=>window.NH7AcademicReportRowsV116?.().length>1000);
  await page.evaluate(()=>nh7StudentAcademicSetViewV540('reports'));
  for(const [group,count] of [['school_registered',1107],['inactive',1],['needs_revision',1],['passed',1],['exam_failed',1],['not_registered',2]]){
   await page.evaluate(group=>nh7StudentAcademicSetFilterV540(group),group);
   const actual=await page.evaluate(()=>document.querySelector('.req-head .pill')?.textContent);
   assert.ok(actual.startsWith(String(count)+' '),group+': '+actual);
  }
  assert.equal(await page.evaluate(()=>__requests.filter(x=>x.name==='nh7_admin_student_academic_center_v542').length),1);
  console.log('PASS: enrolled, started/inactive, needs-revision, passed, failed and not-registered groups from one batch RPC');
  await page.evaluate(()=>nh7StudentAcademicSetFilterV540('all'));
  assert.equal(await page.locator('.nh7ac540-table tbody tr').count(),100);
  await page.evaluate(()=>nh7StudentAcademicPageV116(1));assert.equal(await page.locator('.nh7ac540-table tbody tr').count(),100);
  const csvEvent=page.waitForEvent('download');await page.evaluate(()=>nh7StudentAcademicCsvV540());const csv=await csvEvent;const csvPath=path.join(output,'group.csv');await csv.saveAs(csvPath);const csvText=fs.readFileSync(csvPath,'utf8');
  assert.ok(csvText.includes('ZZLASTDATA'));assert.ok(csvText.includes('"\'=HYPERLINK'));assert.ok(csvText.includes('status_code'));assert.equal(csvText.trim().split('\r\n').length,fixtures.length+1);
  console.log('PASS: 100-row view pagination; complete 1,109-row UTF-8 CSV with stable headers and spreadsheet-formula escaping');
  await page.evaluate(()=>nh7StudentAcademicPrintV540());
  assert.equal(await page.locator('#nh7AcademicGroupReportV546 tbody tr').count(),fixtures.length);
  await page.locator('#nh7AcademicGroupPdfBtnV547').click();assert.equal(await page.evaluate(()=>__printCount),1);
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('#app').isVisible(),false);
  assert.equal(await page.locator('.nh7ac540-report-body').evaluate(n=>getComputedStyle(n).overflow),'visible');
  assert.equal(await page.locator('.nh7ac540-print-table').evaluate(n=>getComputedStyle(n).minWidth),'0px');
  const groupPdf=path.join(output,'group.pdf');await page.pdf({path:groupPdf,preferCSSPageSize:true});const groupText=execFileSync('pdftotext',['-layout',groupPdf,'-'],{encoding:'utf8'});assert.ok(groupText.includes('ZZLASTDATA'));assert.ok(groupText.includes('Bulk 0000'));
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await page.emulateMedia({media:'screen'});
  await page.getByRole('button',{name:'Save as PDF',exact:true}).click();assert.equal(await page.evaluate(()=>__printCount),2);await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  console.log('PASS: Print and browser Save as PDF; searchable multi-page document contains first and final rows with unclipped table');
  await page.keyboard.press('Escape');
  for(const [locale,width] of [['fa',390],['en',820],['hr',1440],['fa',390]]){
   await page.setViewportSize({width,height:900});await page.evaluate(locale=>{lang=locale;render();nh7StudentAcademicPrintV540()},locale);
   assert.equal(await page.locator('.nh7ac540-report-dialog').getAttribute('dir'),locale==='fa'?'rtl':'ltr');
   const close=page.locator('.nh7ac540-report-close'),box=await close.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);
   await close.click();assert.equal(await page.locator('#nh7AcademicGroupReportV546').count(),0);assert.equal(await page.evaluate(()=>document.body.classList.contains('nh7ac540-report-open')),false);
  }
  console.log('PASS: FA → EN → HR → FA, RTL/LTR and view/Close on phone, tablet/iPad and desktop widths');
  await page.evaluate(()=>{lang='en';activeTab='studentreport';render();document.querySelector('#nh7ReportStudent').value='revision@example.invalid';document.querySelector('#nh7ReportLang').value='en';__optionalUnavailable=true;nh7GenerateStudentReportV496()});
  await page.waitForFunction(()=>document.querySelector('#nh7ReportStatus').textContent.includes('ready'));
  let html=await page.locator('#nh7ReportOutput').innerText();assert.ok(html.includes('Not submitted'));assert.ok(html.includes('Pending'));assert.ok(html.includes('TEST WRONG QUESTION'));assert.ok(html.includes('PRESERVED FEEDBACK'));assert.ok(html.includes('Optional library reading data unavailable'));
  const individualCsv=page.waitForEvent('download');await page.evaluate(()=>nh7ExportStudentReportV116());const detailDownload=await individualCsv;const detailPath=path.join(output,'detail.csv');await detailDownload.saveAs(detailPath);const detailText=fs.readFileSync(detailPath,'utf8');assert.ok(detailText.includes('wrong_answer'));assert.ok(detailText.includes('"\'=FORMULA'));assert.ok(detailText.includes('exam_attempt'));
  await page.evaluate(()=>nh7OpenStudentReportPreviewV496());await page.locator('#nh7ReportPdfAction').click();await page.emulateMedia({media:'print'});const detailPdf=path.join(output,'detail.pdf');await page.pdf({path:detailPdf,preferCSSPageSize:true});const pdfText=execFileSync('pdftotext',['-layout',detailPdf,'-'],{encoding:'utf8'});assert.ok(pdfText.includes('TEST WRONG QUESTION'));assert.ok(pdfText.includes('PRESERVED FEEDBACK'));
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await page.emulateMedia({media:'screen'});await page.keyboard.press('Escape');
  const requestCount=await page.evaluate(()=>__requests.length);await page.evaluate(()=>nh7GenerateStudentReportV496());await page.waitForTimeout(50);assert.equal(await page.evaluate(()=>__requests.length),requestCount);
  console.log('PASS: per-student completed/pending lessons, required missing assignment, review state, scores, exam attempts, wrong answers, CSV/PDF; optional failure and cache reuse');
  // Exercise both timeout fences without waiting 17/22 seconds; invoke the real timer callback.
  await page.evaluate(()=>{__profileMode='hang';nh7GenerateStudentReportV496(true)});await page.waitForTimeout(50);await page.evaluate(()=>__reportTimers.filter(x=>x.ms===17000).at(-1).fn());
  await page.waitForFunction(()=>document.querySelector('#nh7ReportStatus').textContent.includes('could not load'));assert.equal(await page.locator('#nh7ReportGenerateBtn').isEnabled(),true);
  await page.evaluate(()=>{activeTab='students';render();__mode='hang';nh7StudentAcademicReloadV540()});await page.waitForTimeout(50);await page.evaluate(()=>__reportTimers.filter(x=>x.ms===22000).at(-1).fn());await page.waitForFunction(()=>document.body.innerText.includes('Refresh failed'));
  await page.evaluate(()=>{__mode='once';nh7StudentAcademicReloadV540()});await page.waitForFunction(()=>!document.body.innerText.includes('Refresh failed')&&!document.body.innerText.includes('Refreshing;'));
  const rpcNames=await page.evaluate(()=>__requests.map(x=>x.name));assert.ok(rpcNames.every(x=>['nh7_admin_student_academic_center_v542','nh7_admin_student_profile_v451','nh7_admin_library_reading_v490'].includes(x)));
  assert.equal(await page.evaluate(()=>JSON.stringify({state,__detail,__rows})===window.__before),true);
  assert.deepEqual(errors,[]);assert.ok(requests.every(x=>x.method==='GET'&&x.url.startsWith(base+'/')));
  console.log('PASS: bounded hangs, one server-timeout retry, stale snapshot retained, UI unlocks; no record mutations or write RPCs; zero page errors');
  // Load the real Admin wrapper and all current stability/RBAC/report modules.
  const integrated=await browser.newPage({viewport:{width:1280,height:900},serviceWorkers:'block'}),integratedErrors=[],remote=[];
  integrated.on('pageerror',e=>integratedErrors.push(e.message));
  await integrated.addInitScript(()=>{localStorage.setItem('nh7_admin_token','isolated-owner-fixture');localStorage.setItem('nh7_admin_lang','en');window.print=()=>{window.__printCalls=(window.__printCalls||0)+1}});
  await integrated.route('**/*',async route=>{
    const req=route.request(),url=req.url();if(url.startsWith(base+'/'))return route.continue();
    remote.push({url,method:req.method(),payload:req.postData()?JSON.parse(req.postData()):null});let body=[];
    if(url.includes('nh7_admin_my_access_v350'))body={is_owner:true,is_admin:true,email:'fixture@example.invalid',permissions:[]};
    if(url.includes('nh7_admin_student_academic_center_v542'))body={rows:fixtures};
    if(url.includes('nh7_admin_student_profile_v451'))body=detail;
    if(url.includes('/auth/v1/user'))body={id:'00000000-0000-4000-8000-000000000116',email:'fixture@example.invalid'};
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  await integrated.goto(base+'/admin-v239-stable.html');
  await integrated.waitForFunction(()=>window.NH7_ADMIN_STUDENT_ACADEMIC_VERSION&&window.NH7_ADMIN_STUDENT_REPORT_VERSION&&window.NH7_ADMIN_REPORT_PRINT_VERSION==='1.1.9'&&typeof nh7AdminAccessReady!=='undefined'&&nh7AdminAccessReady);
  await integrated.evaluate(()=>setTab('students'));
  await integrated.waitForFunction(()=>window.NH7AcademicReportRowsV116?.().length>1000);
  await integrated.waitForFunction(()=>!state.loading&&typeof adminLoadInFlight!=='undefined'&&!adminLoadInFlight);
  await integrated.waitForTimeout(300);
  const initialCalls=remote.length;
  await integrated.evaluate(()=>nh7StudentAcademicSetViewV540('reports'));
  await integrated.evaluate(()=>nh7StudentAcademicSetFilterV540('needs_revision'));
  await integrated.evaluate(()=>nh7StudentAcademicPrintV540());
  await integrated.locator('#nh7AcademicGroupPdfBtnV547').click();
  await integrated.locator('#nh7ReportExport119').waitFor();
  await integrated.evaluate(()=>{document.querySelector('#nh7ReportExport119 iframe').contentWindow.print=()=>window.__printCalls=(window.__printCalls||0)+1});
  await integrated.locator('#nh7ReportExport119 [data-print]').click();
  await integrated.locator('#nh7ReportExport119 [data-close]').click();
  await integrated.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await integrated.keyboard.press('Escape');
  await integrated.evaluate(()=>nh7StudentAcademicIndividualReportV540(encodeURIComponent('revision@example.invalid')));
  await integrated.waitForFunction(()=>document.querySelector('#nh7ReportStatus')?.textContent.includes('✓'));
  await integrated.evaluate(()=>nh7OpenStudentReportPreviewV496());await integrated.locator('#nh7ReportPrintAction').click();await integrated.locator('#nh7ReportExport119').waitFor();await integrated.evaluate(()=>{document.querySelector('#nh7ReportExport119 iframe').contentWindow.print=()=>window.__printCalls=(window.__printCalls||0)+1});await integrated.locator('#nh7ReportExport119 [data-print]').click();await integrated.locator('#nh7ReportExport119 [data-close]').click();await integrated.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await integrated.keyboard.press('Escape');
  assert.equal(await integrated.evaluate(()=>window.__printCalls),2);
  const reportCalls=remote.slice(initialCalls).filter(x=>!['GET','HEAD','OPTIONS'].includes(x.method));
  assert.ok(reportCalls.every(x=>x.method==='POST'&&(/nh7_admin_(student_academic_center_v542|student_profile_v451|library_reading_v490|library_dashboard_v224|school_assignments_feed_v237)/.test(x.url)||x.url.includes('/functions/v1/nh7-admin-ai-v490')&&x.payload?.action==='status'||x.url.includes('/functions/v1/nh7-send-email')&&x.payload?.action==='config')),JSON.stringify(reportCalls));
  assert.deepEqual(integratedErrors,[]);
  console.log('PASS: real current Admin wrapper, RBAC/stability modules, group → individual report integration and Print; no report-time write calls');
  await integrated.close();
  console.log('Isolated CSV/PDF evidence:',output);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
