/* Local-only browser regressions. Serve repository root, requires Playwright,
 * Chromium and pdfinfo/pdftoppm. No production data or services are accessed. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765';assert.match(base,/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/);
const output=fs.mkdtempSync(path.join(os.tmpdir(),'nh7-pdf119-'));
const print121=process.env.NH7_TEST_PRINT121==='1';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true,serviceWorkers:'block',...(print121?{isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'}:{})}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.context().route('**/*',route=>{const url=route.request().url();requests.push(url);if(!url.startsWith(base+'/'))return route.abort();return route.continue()});
 async function topLevelPrint(){
  const popEvent=page.waitForEvent('popup');await page.locator('#nh7ReportExport119 [data-print]').click();const pop=await popEvent;
  pop.on('pageerror',e=>errors.push(e.message));await pop.waitForURL(base+'/school-report-print.html#**');await pop.waitForFunction(()=>!document.getElementById('print121').disabled);
  await pop.setViewportSize(page.viewportSize());const controls=await pop.locator('#print121').boundingBox();assert.ok(controls.x>=0&&controls.x+controls.width<=page.viewportSize().width+1);
  const source=await page.locator('#nh7ReportExport119 iframe').evaluate(f=>({text:f.contentDocument.body.textContent,lang:f.contentDocument.documentElement.lang}));
  assert.equal(await pop.locator('#report121').textContent(),source.text);assert.equal(await pop.locator('html').getAttribute('lang'),source.lang);assert.equal(await pop.locator('html').getAttribute('dir'),source.lang==='fa'?'rtl':'ltr');
  assert.equal(await pop.evaluate(()=>window.opener),null);assert.equal(await pop.locator('#report121 button').count(),0);
  // A no-op is deliberate: do not mistake print() returning for a displayed native sheet.
  await pop.evaluate(()=>{window.__calls=0;window.print=()=>{__calls++;window.__tap=navigator.userActivation.isActive}});
  await pop.locator('#print121').click();assert.equal(await pop.evaluate(()=>__calls),1);assert.equal(await pop.evaluate(()=>__tap),true);assert.ok((await pop.locator('#help121').textContent()).includes('PDF'));
  await pop.evaluate(()=>{window.print=()=>{throw Error('host blocked printing')}});await pop.locator('#print121').click();assert.ok((await pop.locator('#status121').textContent()).includes('PDF'));
  await pop.screenshot({path:path.join(output,'print-preview-'+source.lang+'.png')});
  assert.ok(await page.locator('[data-print-help121]').isVisible());
  // Print-only output, excluding persistent controls.
  await pop.emulateMedia({media:'print'});assert.equal(await pop.locator('.nh7-print-toolbar121').isVisible(),false);assert.equal(await pop.locator('#report121').isVisible(),true);await pop.emulateMedia({media:'screen'});
  const closed=pop.waitForEvent('close');await pop.locator('#back121').click();await closed;assert.ok(await page.locator('#nh7ReportExport119').isVisible());
  await page.evaluate(()=>{window.__open=window.open;window.open=()=>null});await page.locator('#nh7ReportExport119 [data-print]').click();
  assert.ok((await page.locator('[data-print-help121]').textContent()).includes('PDF'));assert.ok(await page.locator('[data-print-help121] button').first().isVisible());
  await page.evaluate(()=>{window.open=__open});
  console.log('PASS #121: real top-level document, full '+source.lang+' report, fresh Print tap, silent-no-op and blocked-popup actionable PDF fallback, print-only CSS and Back');
 }
 const globals=`var lang='fa',token='fixture',activeTab='students',adminLoadInFlight=null;var __rpc=[];var state={schoolLessons:[{lesson_code:'one',is_active:true},{lesson_code:'two',is_active:true}],schoolExams:[{id:'exam',questions:[{number:1,question:{fa:'سؤال اشتباه آزمایشی',en:'Wrong question',hr:'Pogrešno pitanje'},correct:1,options:['Wrong','Right']}]}],schoolAssignments:[],schoolProgress:[],schoolAttempts:[]};var __rows=Array.from({length:203},(_,i)=>({email:'student'+i+'@example.invalid',display_name:(i===202?'LAST STUDENT':'دانشجوی نمونه '+i),school_registered:true,completed_lessons:i%3,total_lessons:7,final_exam_best_score:85,academic_status_code:'in_progress'}));var __profile={school:{registration:{user_name:'دانشجوی آزمایشی',status:'approved'},progress:[{lesson_code:'one',completed_at:'2026-10-07',progress_percent:100}],assignments:[{lesson_code:'one',status:'needs_revision',answer_text:'پاسخ تکلیف دانشجو '+('متن طولانی آزمایش فارسی. '.repeat(300)),admin_feedback:'بازخورد محفوظ'}],attempts:[{exam_id:'exam',score_percent:40,attempt_number:2,passed:false,answers:[{question_number:1,selected:0}]}]},activity:{}};var __before=JSON.stringify({state,__profile,__rows});function schoolLessonHasAssignment(){return true}function studentDirectory(){return [{email:'student0@example.invalid',name:'دانشجو'}]}function tabsHtml(){return '<nav></nav>'}function renderStudentsDashboard(){return ''}function renderActivePanel(){return renderStudentsDashboard()}function render(){document.querySelector('#app').innerHTML=tabsHtml()+renderActivePanel()}function setTab(t){activeTab=t;render()}async function adminRpc(name){__rpc.push(name);if(name==='nh7_admin_student_academic_center_v542')return {rows:__rows};if(name==='nh7_admin_student_profile_v451')return __profile;if(name==='nh7_admin_library_reading_v490')return [];throw Error('Unexpected RPC '+name)}`;
 await page.route('**/*',route=>{
  const req=route.request();requests.push(req.url());
  if(req.url()===base+'/__119')return route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="app"></main><script>${globals}</script><script src="js/nh7-admin-student-report-v496.js"></script><script src="js/nh7-admin-student-academic-v540.js"></script><script src="js/nh7-admin-report-print-v117.js"></script>${print121?'<script src="js/nh7-admin-print-native-v120.js?v=1.2.1"></script>':''}<script>render()</script></body></html>`});
  if(req.url()===base+'/js/vendor/html2canvas-1.4.1.min.js')return route.fulfill({contentType:'text/javascript',body:fs.readFileSync('js/vendor/html2canvas-1.4.1.min.js','utf8')+`;window.__capture=[];const __real=window.html2canvas;window.html2canvas=(node,opt)=>{window.__capture.push({text:node.textContent,width:node.scrollWidth,limit:opt.width,height:opt.height,y:opt.y});return __real(node,opt)};`});
  if(req.url().startsWith(base+'/'))return route.continue();throw Error('Remote request '+req.url());
 });
 await page.goto(base+'/__119');await page.waitForFunction(()=>NH7AcademicReportRowsV116().length===203);
 await page.evaluate(()=>{nh7StudentAcademicSetViewV540('reports');nh7StudentAcademicSetFilterV540('all');nh7StudentAcademicPrintV540();nh7StudentAcademicGroupPdfActionV547()});
 const modal=page.locator('#nh7ReportExport119');await modal.waitFor();
 assert.equal(await modal.locator('iframe').evaluate(f=>f.contentDocument.querySelectorAll('tbody tr').length),203);
 assert.equal(await modal.getAttribute('dir'),'rtl');
 await page.evaluate(()=>{const f=document.querySelector('#nh7ReportExport119 iframe');window.__print=0;f.contentWindow.print=()=>{__print++;window.__gesture=navigator.userActivation.isActive};});
 if(print121)await topLevelPrint();else{await modal.locator('[data-print]').click();assert.equal(await page.evaluate(()=>__print),1);assert.equal(await page.evaluate(()=>__gesture),true)}
 await modal.locator('[data-pdf]').waitFor({state:'visible'});await page.waitForFunction(()=>!document.querySelector('#nh7ReportExport119 [data-pdf]').disabled,null,{timeout:120000});
 const captured=await page.evaluate(()=>__capture);const content=captured.map(x=>x.text).join('\n');for(let i=0;i<203;i++)assert.ok(content.includes('student'+i+'@example.invalid'),'PDF missing student '+i);assert.ok(captured.every(x=>x.width<=x.limit&&x.height<=680),'clipped PDF block');
 const downloadEvent=page.waitForEvent('download');await modal.locator('[data-pdf]').click();const download=await downloadEvent;const groupPath=path.join(output,'group-fa.pdf');await download.saveAs(groupPath);
 assert.equal(fs.readFileSync(groupPath).subarray(0,8).toString(),'%PDF-1.4');const info=execFileSync('pdfinfo',[groupPath],{encoding:'utf8'});assert.match(info,/Pages:\s+(?:[2-9]|\d\d+)/);assert.ok(fs.statSync(groupPath).size>10000);
 execFileSync('pdftoppm',['-f','1','-l','1','-scale-to','1200','-png','-singlefile',groupPath,path.join(output,'group-first')]);
 const last=Number(info.match(/Pages:\s+(\d+)/)[1]);execFileSync('pdftoppm',['-f',String(last),'-l',String(last),'-scale-to','1200','-png','-singlefile',groupPath,path.join(output,'group-last')]);
 const csvEvent=page.waitForEvent('download');await modal.locator('[data-csv]').click();const csv=await csvEvent;await csv.saveAs(path.join(output,'group.csv'));assert.ok(fs.readFileSync(path.join(output,'group.csv'),'utf8').includes('LAST STUDENT'));
 await modal.locator('[data-close]').click();assert.equal(await modal.count(),0);assert.equal(await page.locator('#nh7AcademicGroupReportV546').count(),1);await page.evaluate(()=>nh7StudentAcademicCloseReportV546());
 console.log('PASS: persistent toolbar, direct user-gesture Print, complete 203-row Persian group PDF, real PDF structure/pages/images and CSV');
 for(const [language,width] of [['en',820],['hr',1440],['fa',390]]){
  await page.setViewportSize({width,height:900});await page.evaluate(l=>{lang=l;nh7StudentAcademicPrintV540();nh7StudentAcademicGroupPdfActionV547()},language);
  assert.equal(await modal.getAttribute('dir'),language==='fa'?'rtl':'ltr');const box=await modal.locator('[data-close]').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);if(print121)await topLevelPrint();await modal.locator('[data-close]').click();await page.evaluate(()=>nh7StudentAcademicCloseReportV546());
 }
 console.log('PASS: FA → EN → HR → FA; 390/820/1440px controls and Close/Back; cancel pending PDF jobs');
 await page.evaluate(()=>{activeTab='studentreport';render();document.querySelector('#nh7ReportStudent').value='student0@example.invalid';document.querySelector('#nh7ReportLang').value='fa';nh7GenerateStudentReportV496()});await page.waitForFunction(()=>document.querySelector('#nh7ReportStatus').textContent.includes('✓'));
 await page.evaluate(()=>{nh7OpenStudentReportPreviewV496();nh7DownloadStudentReportPdfV496()});
 assert.ok(await modal.locator('iframe').evaluate(f=>f.contentDocument.body.textContent.includes('بازخورد محفوظ')));
 if(print121)await topLevelPrint();
 await page.waitForFunction(()=>!document.querySelector('#nh7ReportExport119 [data-pdf]').disabled,null,{timeout:120000});
 // Simulate iPad capability to test File+Share in the direct gesture, including cancellation.
 await page.evaluate(()=>{Object.defineProperty(navigator,'platform',{value:'MacIntel',configurable:true});Object.defineProperty(navigator,'maxTouchPoints',{value:5,configurable:true});navigator.canShare=()=>true;navigator.share=async payload=>{window.__shared={type:payload.files[0].type,size:payload.files[0].size,name:payload.files[0].name,gesture:navigator.userActivation.isActive};throw Object.assign(Error('cancel'),{name:'AbortError'})}});
 await modal.locator('[data-pdf]').click();const shared=await page.evaluate(()=>__shared);assert.equal(shared.type,'application/pdf');assert.match(shared.name,/\.pdf$/);assert.ok(shared.size>10000);assert.equal(shared.gesture,true);
 await page.evaluate(()=>{navigator.share=async()=>{throw Error('Share unavailable')}});await modal.locator('[data-pdf]').click();await modal.locator('[data-direct]').waitFor();
 const individualEvent=page.waitForEvent('download');await modal.locator('[data-direct]').click();const individual=await individualEvent;const individualPath=path.join(output,'individual-fa.pdf');await individual.saveAs(individualPath);assert.match(execFileSync('pdfinfo',[individualPath],{encoding:'utf8'}),/Pages:\s+(?:[2-9]|\d\d+)/);
 execFileSync('pdftoppm',['-f','1','-l','1','-scale-to','1200','-png','-singlefile',individualPath,path.join(output,'individual-first')]);const count=Number(execFileSync('pdfinfo',[individualPath],{encoding:'utf8'}).match(/Pages:\s+(\d+)/)[1]);execFileSync('pdftoppm',['-f',String(count),'-l',String(count),'-scale-to','1200','-png','-singlefile',individualPath,path.join(output,'individual-last')]);
 assert.ok(await page.evaluate(()=>__capture.map(x=>x.text).join('').includes('بازخورد محفوظ')));
 await modal.locator('[data-close]').click();assert.equal(await page.locator('#nh7ReportPreviewOverlay').count(),1);
 // Reject blank renderer output, retain Print/Back, then retry without reloading data.
 await page.evaluate(()=>{window.html2canvas=async()=>{const c=document.createElement('canvas');c.width=c.height=8;c.getContext('2d').fillStyle='#fff';c.getContext('2d').fillRect(0,0,8,8);return c};nh7DownloadStudentReportPdfV496()});
 await modal.locator('[data-retry]').waitFor();assert.equal(await modal.locator('[data-print]').isEnabled(),true);assert.match(await modal.locator('[role=status]').textContent(),/Blank PDF page/);
 await page.evaluate(()=>{window.html2canvas=__real});await modal.locator('[data-retry]').click();await page.waitForFunction(()=>!document.querySelector('#nh7ReportExport119 [data-pdf]').disabled,null,{timeout:120000});
 await page.keyboard.press('Escape');assert.equal(await modal.count(),0);assert.equal(await page.locator('#nh7ReportPreviewOverlay').count(),1);
 if(print121){const missing=await browser.newPage({serviceWorkers:'block'});await missing.goto(base+'/school-report-print.html#lang=hr');assert.equal(await missing.locator('#print121').isDisabled(),true);assert.match(await missing.locator('#status121').textContent(),/nije primljen/);assert.ok((await missing.locator('#help121').textContent()).includes('PDF'));await missing.close()}
 console.log('PASS: blank output rejection, usable Print/Back during failure, Retry and Escape preserve original report');
 assert.equal(await page.evaluate(()=>JSON.stringify({state,__profile,__rows})===__before),true);assert.deepEqual(errors,[]);assert.ok(requests.every(url=>url.startsWith(base+'/')));
 console.log('PASS: full individual report, long-answer multi-page real PDF, prepared File/Share gesture, cancel and direct-download fallback, source immutability and no remote dependencies');
 console.log('PDF/PNG/CSV evidence:',output);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
