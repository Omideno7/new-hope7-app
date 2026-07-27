/* New Hope 7 Admin v2.2.5 — student modal, document studio, and persistent message cleanup. */
(()=>{'use strict';
const V='2.2.5';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const E=v=>typeof h==='function'?h(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=v=>Number(v||0);
function ensureState(){
  if(typeof state!=='object'||!state)return;
  state.studentActivityV222=state.studentActivityV222&&typeof state.studentActivityV222==='object'?state.studentActivityV222:{};
  state.studentActivityV223=state.studentActivityV223&&typeof state.studentActivityV223==='object'?state.studentActivityV223:{};
  state.messages=Array.isArray(state.messages)?state.messages:[];
  state.schoolCertificates=Array.isArray(state.schoolCertificates)?state.schoolCertificates:[];
}
ensureState();

// ---------- Student profile: prevent undefined state, lock background, allow modal scroll and close ----------
const previousRenderV225=render;
render=function(){
  ensureState();
  const result=previousRenderV225();
  requestAnimationFrame(()=>{
    const backdrop=document.querySelector('.student-modal-backdrop');
    document.body.classList.toggle('nh7-student-modal-open',!!backdrop);
    if(backdrop){
      backdrop.setAttribute('role','dialog');
      backdrop.setAttribute('aria-modal','true');
      const modal=backdrop.querySelector('.student-modal');
      if(modal){modal.setAttribute('tabindex','-1');modal.dataset.nh7Scrollable='true'}
    }
    try{window.NH7_DOC_INIT_SIGNATURE_V222?.()}catch(e){console.warn('Signature pad init',e)}
  });
  return result;
};

const previousStudentModalV225=renderStudentModal;
renderStudentModal=function(student){
  ensureState();
  try{return previousStudentModalV225(student)}catch(error){
    console.error('Student modal fallback',error);
    if(!student)return'';
    const email=String(student.email||'');
    return `<div class="student-modal-backdrop"><div class="student-modal"><div class="student-modal-head"><div><h2>${E(student.name||email)}</h2><p class="muted">${E(email)}</p></div><button type="button" class="close-round" data-nh7-close-student>×</button></div><div class="notice">${E(L('پرونده پایه باز شد. برای دریافت گزارش فعالیت، صفحه را تازه‌سازی کنید.','The basic profile opened. Refresh to reload activity details.','Osnovni profil je otvoren. Osvježite stranicu.'))}</div></div></div>`;
  }
};

const previousOpenStudentV225=openStudentDashboard;
openStudentDashboard=function(encoded){
  ensureState();
  try{return previousOpenStudentV225(encoded)}catch(error){
    console.error('Open student profile',error);
    selectedStudentEmail=decodeURIComponent(encoded||'');
    render();
  }
};
closeStudentDashboard=function(){selectedStudentEmail='';document.body.classList.remove('nh7-student-modal-open');render()};

document.addEventListener('click',event=>{
  const close=event.target.closest?.('[data-nh7-close-student],.student-modal .close-round');
  if(close){event.preventDefault();event.stopImmediatePropagation();closeStudentDashboard();return}
  if(event.target.classList?.contains('student-modal-backdrop')){event.preventDefault();event.stopImmediatePropagation();closeStudentDashboard()}
},true);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.querySelector('.student-modal-backdrop'))closeStudentDashboard()},true);

// Guard the older loaders after logout/login state replacement.
for(const name of ['nh7LoadStudentActivityV222','nh7LoadStudentV223']){
  const old=window[name];
  if(typeof old==='function')window[name]=async(...args)=>{ensureState();return old(...args)};
}

// ---------- Stable, always-visible Document Studio controls ----------
const fonts=['Vazirmatn','Estedad','Sahel','Shabnam','Gandom','Markazi Text','Noto Naskh Arabic','Noto Serif Arabic','Scheherazade New','Amiri','Lalezar','Cinzel','Cinzel Decorative','Cormorant Garamond','Cormorant SC','EB Garamond','Libre Baskerville','Playfair Display','Merriweather','Crimson Text','Lora','Great Vibes','Marcellus','Spectral','Bodoni Moda'];
const themes=[
 ['ornate_baptism',L('تعمید کلاسیک آبی–طلایی','Classic blue–gold baptism','Klasično plavo-zlatno krštenje')],
 ['ornate_blue_gold_v223',L('تشریفاتی آبی–طلایی','Ornate blue–gold','Ukrasno plavo-zlatno')],
 ['covenant_gold_v224',L('عهد طلایی','Covenant gold','Zlatni savez')],
 ['royal_marble_v224',L('مرمر سلطنتی','Royal marble','Kraljevski mramor')],
 ['baptism_wave_v224',L('موج تعمید','Baptism waves','Valovi krštenja')],
 ['ministry_blue_v224',L('خدمت آبی رسمی','Formal ministry blue','Službeno plava')],
 ['official_watermark',L('رسمی با واترمارک','Official watermark','Službeni vodeni žig')],
 ['classic_gold_v222',L('طلایی کلاسیک','Classic gold','Klasično zlato')],
 ['royal_blue_v222',L('آبی سلطنتی','Royal blue','Kraljevski plava')],
 ['emerald_v222',L('زمردی خدمتی','Emerald ministry','Smaragdna')],
 ['water_baptism_v222',L('آب تعمید','Baptism water','Voda krštenja')],
 ['letter_formal_v222',L('نامه رسمی سربرگ‌دار','Formal letterhead','Službeno pismo')],
 ['silver_official_v223',L('رسمی نقره‌ای','Official silver','Službeno srebrno')],
 ['parchment_v223',L('کاغذ کلاسیک','Classic parchment','Klasični pergament')],
 ['minimal_v222',L('مینیمال','Minimal','Minimalno')]
];
const targets=[
 ['title',L('عنوان اصلی','Main title','Glavni naslov')],['designation',L('زیرعنوان','Subtitle','Podnaslov')],['name',L('نام شخص','Recipient name','Ime osobe')],['body',L('متن بدنه','Body text','Glavni tekst')],
 ...Array.from({length:8},(_,i)=>['bodyLine'+(i+1),L('سطر '+(i+1)+' متن','Body line '+(i+1),'Redak '+(i+1))]),
 ['fields',L('فیلدهای تاریخ و محل','Date/place fields','Polja datuma i mjesta')],['church',L('نام و اطلاعات کلیسا','Church heading','Zaglavlje crkve')],['signature',L('متن امضا','Signature text','Tekst potpisa')],['verification',L('QR و اعتبارسنجی','QR and verification','QR i provjera')],['meta',L('شماره و پایین صفحه','Footer and number','Podnožje')]
];
function docDraft(){return window.NH7_DOC_DRAFT_V222||{layout:'landscape',theme:'ornate_baptism',photo:{x:50,y:50,zoom:1,size:115},styles:{},styleTarget:'title',watermarkOpacity:.045,logoPosition:'right',logoSize:94}}
function currentStyle(){const d=docDraft(),key=d.styleTarget||'title';d.styles=d.styles||{};d.styles[key]=d.styles[key]||{font:key==='title'?'Cinzel':'Vazirmatn',size:key==='title'?38:16,color:'#1e293b',bold:key==='title',italic:false,underline:false,align:'center',offsetY:0,lineHeight:1.45,letterSpacing:0};return d.styles[key]}
function checked(v){return v?'checked':''}
function selected(a,b){return String(a)===String(b)?'selected':''}
function buildDocumentStudioV225(){
  const d=docDraft(),p=d.photo||{},s=currentStyle(),photo=d.photoUrl?`<img src="${E(d.photoUrl)}" alt="photo" style="object-position:${N(p.x)||50}% ${N(p.y)||50}%;transform:scale(${N(p.zoom)||1})">`:`<div class="doc-v225-photo-empty">${L('عکس شخص را آپلود کنید','Upload recipient photo','Prenesite fotografiju')}</div>`;
  return `<section class="panel-card doc-v225-studio"><div class="req-head"><div><h3>🎨 ${L('استودیوی حرفه‌ای مدارک — نسخه فعال','Professional Document Studio — active','Profesionalni studio — aktivan')}</h3><p class="muted small">${L('این کنترل‌ها مستقیماً روی پیش‌نمایش و مدرک صادرشده اعمال می‌شوند. هر بخش متن تنظیمات مستقل دارد.','These controls apply directly to the preview and issued document. Each text element has independent styling.','Kontrole se primjenjuju izravno na dokument.')}</p></div><button type="button" class="btn primary" onclick="nh7OpenFullPreviewV222()">👁 ${L('پیش‌نمایش تمام‌صفحه','Full preview','Puni pregled')}</button></div>
  <details open><summary>${L('قالب، واترمارک و لوگو','Template, watermark and logo','Predložak, vodeni žig i logo')}</summary><div class="doc-v225-grid">
    <label>${L('جهت صفحه','Page orientation','Orijentacija')}<select onchange="nh7DocSetV222('layout',this.value)"><option value="portrait" ${selected(d.layout,'portrait')}>A4 ${L('عمودی','Portrait','Okomito')}</option><option value="landscape" ${selected(d.layout,'landscape')}>A4 ${L('افقی','Landscape','Vodoravno')}</option></select></label>
    <label>${L('قاب و تم','Frame and theme','Okvir i tema')}<select onchange="nh7DocSetV222('theme',this.value)">${themes.map(([v,t])=>`<option value="${E(v)}" ${selected(d.theme,v)}>${E(t)}</option>`).join('')}</select></label>
    <label>${L('شفافیت واترمارک لوگو','Logo watermark opacity','Prozirnost vodenog žiga')}<input type="range" min="0" max="0.18" step="0.005" value="${Number(d.watermarkOpacity??.045)}" oninput="nh7DocSetV222('watermarkOpacity',this.value)"></label>
    <label>${L('آپلود لوگو','Upload logo','Prenesi logo')}<input type="file" accept="image/*" onchange="nh7UploadDocImageV222(this,'logo')"></label>
    <label>${L('جای لوگو','Logo position','Položaj logotipa')}<select onchange="nh7DocSetV222('logoPosition',this.value)"><option value="right" ${selected(d.logoPosition,'right')}>${L('بالا راست','Top right','Gore desno')}</option><option value="center" ${selected(d.logoPosition,'center')}>${L('بالا وسط','Top center','Gore sredina')}</option><option value="left" ${selected(d.logoPosition,'left')}>${L('بالا چپ','Top left','Gore lijevo')}</option></select></label>
    <label>${L('اندازه لوگو','Logo size','Veličina logotipa')}<input type="range" min="45" max="180" value="${N(d.logoSize)||94}" oninput="nh7DocSetV222('logoSize',this.value)"></label>
    <label>${L('شکل لوگو','Logo shape','Oblik logotipa')}<select onchange="nh7DocSetV222('logoCircle',this.value==='circle')"><option value="normal" ${selected(!!d.logoCircle,false)}>${L('عادی','Normal','Normalno')}</option><option value="circle" ${selected(!!d.logoCircle,true)}>${L('گرد','Circular','Kružno')}</option></select></label>
    <label>${L('ترکیب زمینه لوگو','Blend logo background','Spajanje pozadine')}<select onchange="nh7DocSetV222('logoBlend',this.value)"><option value="normal" ${selected(d.logoBlend,'normal')}>${L('عادی','Normal','Normalno')}</option><option value="multiply" ${selected(d.logoBlend,'multiply')}>${L('هماهنگ با پس‌زمینه','Blend with document','Spoji s dokumentom')}</option></select></label>
    <label>${L('رنگ زمینه لوگو','Logo background color','Boja pozadine logotipa')}<input type="color" value="${E(d.logoBg||'#ffffff')}" oninput="nh7DocSetV222('logoBg',this.value)"></label>
  </div></details>
  <details open><summary>${L('عکس شخص و تنظیم چهره','Recipient photo and face positioning','Fotografija i položaj lica')}</summary><div class="doc-v225-photo-layout"><div><label class="file-drop">${L('آپلود عکس','Upload photo','Prenesi fotografiju')}<input type="file" accept="image/*" onchange="nh7UploadDocImageV222(this,'photo')"></label><div class="doc-v225-photo-stage">${photo}</div></div><div class="doc-v225-grid">
    <label>${L('چپ و راست','Left / right','Lijevo / desno')}<input type="range" min="0" max="100" value="${N(p.x)||50}" oninput="nh7DocPhotoV222('x',this.value)"></label>
    <label>${L('بالا و پایین','Up / down','Gore / dolje')}<input type="range" min="0" max="100" value="${N(p.y)||50}" oninput="nh7DocPhotoV222('y',this.value)"></label>
    <label>${L('زوم عکس','Photo zoom','Zum fotografije')}<input type="range" min="1" max="3" step="0.05" value="${N(p.zoom)||1}" oninput="nh7DocPhotoV222('zoom',this.value)"></label>
    <label>${L('اندازه قاب عکس','Photo frame size','Veličina fotografije')}<input type="range" min="55" max="200" value="${N(p.size)||115}" oninput="nh7DocPhotoV222('size',this.value)"></label>
  </div></div></details>
  <details open><summary>${L('فونت، اندازه، رنگ و جای هر سطر','Font, size, color and position for each line','Font, veličina, boja i položaj')}</summary><div class="doc-v225-style-grid">
    <label>${L('بخش موردنظر','Text element','Dio teksta')}<select onchange="nh7DocStyleTargetV222(this.value)">${targets.map(([v,t])=>`<option value="${E(v)}" ${selected(d.styleTarget,v)}>${E(t)}</option>`).join('')}</select></label>
    <label>${L('فونت','Font','Font')}<select onchange="nh7DocStyleV222('font',this.value)">${fonts.map(f=>`<option value="${E(f)}" ${selected(s.font,f)}>${E(f)}</option>`).join('')}</select></label>
    <label>${L('اندازه فونت','Font size','Veličina fonta')}<input type="number" min="7" max="76" value="${N(s.size)||16}" onchange="nh7DocStyleV222('size',this.value)"></label>
    <label>${L('رنگ متن','Text color','Boja teksta')}<input type="color" value="${E(s.color||'#1e293b')}" oninput="nh7DocStyleV222('color',this.value)"></label>
    <button type="button" class="doc-v225-toggle ${s.bold?'active':''}" onclick="nh7DocStyleV222('bold',${!s.bold})"><b>B</b></button>
    <button type="button" class="doc-v225-toggle ${s.italic?'active':''}" onclick="nh7DocStyleV222('italic',${!s.italic})"><i>I</i></button>
    <button type="button" class="doc-v225-toggle ${s.underline?'active':''}" onclick="nh7DocStyleV222('underline',${!s.underline})"><u>U</u></button>
    <label>${L('تراز متن','Alignment','Poravnanje')}<select onchange="nh7DocStyleV222('align',this.value)"><option value="start" ${selected(s.align,'start')}>${L('شروع','Start','Početak')}</option><option value="center" ${selected(s.align,'center')}>${L('وسط','Center','Sredina')}</option><option value="end" ${selected(s.align,'end')}>${L('پایان','End','Kraj')}</option></select></label>
    <label>${L('بالا یا پایین بردن','Move up / down','Pomak gore / dolje')}<input type="range" min="-100" max="140" value="${Number(s.offsetY||0)}" oninput="nh7DocStyleV222('offsetY',this.value)"></label>
    <label>${L('فاصله خطوط','Line height','Prored')}<input type="range" min="0.8" max="2.6" step="0.05" value="${Number(s.lineHeight||1.45)}" oninput="nh7DocStyleV222('lineHeight',this.value)"></label>
    <label>${L('فاصله حروف','Letter spacing','Razmak slova')}<input type="range" min="-1" max="8" step="0.25" value="${Number(s.letterSpacing||0)}" oninput="nh7DocStyleV222('letterSpacing',this.value)"></label>
  </div><div class="doc-v225-font-preview" style="font-family:${E(s.font||'inherit')};font-size:${N(s.size)||16}px;color:${E(s.color||'#1e293b')};font-weight:${s.bold?700:400};font-style:${s.italic?'italic':'normal'};text-decoration:${s.underline?'underline':'none'}">${L('نمونه زنده فونت و اندازه انتخاب‌شده','Live font and size preview','Pregled odabranog fonta')}</div></details>
  <details open><summary>✍ ${L('امضا با Apple Pencil یا انگشت','Sign with Apple Pencil or finger','Potpis olovkom ili prstom')}</summary><canvas id="nh7_signature_pad_v222" class="doc-v222-signature-pad"></canvas><div class="actions"><button type="button" class="btn primary" onclick="nh7SaveSignatureV222()">✓ ${L('ذخیره امضا','Save signature','Spremi potpis')}</button><button type="button" class="btn ghost" onclick="nh7ClearSignatureV222()">${L('پاک‌کردن امضا','Clear signature','Očisti potpis')}</button></div></details>
  <div class="doc-v225-actions"><button type="button" class="btn primary" onclick="nh7OpenFullPreviewV222()">👁 ${L('پیش‌نمایش تمام‌صفحه','Full-screen preview','Puni pregled')}</button><button type="button" class="btn secondary" onclick="nh7SaveIssuedDesignV222()">💾 ${L('ذخیره طراحی روی مدرک صادرشده','Save design to issued document','Spremi dizajn')}</button><button type="button" class="btn ghost" onclick="nh7CheckQrV222()">📱 QR</button></div></section>`;
}
const previousCertificatesV225=renderCertificates;
renderCertificates=function(){
  ensureState();
  let base='';
  try{base=previousCertificatesV225()}catch(error){console.error('Certificate render fallback',error);base=`<div class="notice">${E(error.message||String(error))}</div>`}
  base=String(base).replace(/<section class="panel-card doc-v223-studio">[\s\S]*?<\/section>/,'').replace(/<section class="panel-card doc-v222-editor">[\s\S]*?<\/section>/,'');
  return buildDocumentStudioV225()+base;
};

// ---------- Persistent admin message deletion ----------
async function archiveMessageIds(ids){
  ids=[...new Set((ids||[]).map(String).filter(Boolean))];
  if(!ids.length)return 0;
  const result=await adminRpc('nh7_admin_archive_inbox_messages_v225',{p_ids:ids});
  const n=Number(Array.isArray(result)?result[0]:result)||0;
  const set=new Set(ids);state.messages=(state.messages||[]).filter(m=>!set.has(String(m.id)));
  render();return n;
}
window.deleteCloudMessage=async id=>{if(!confirm(typeof tr==='function'?tr('confirmDelete'):L('حذف شود؟','Delete?','Izbrisati?')))return;try{await archiveMessageIds([id]);await loadAll(true)}catch(e){alert(e.message||String(e))}};
window.deleteMessageIds=archiveMessageIds;
window.deleteVisibleMessages=async()=>{const rows=(typeof messageCenterRows==='function'?messageCenterRows():[]).filter(m=>m.id&&!m.admin_deleted_at);if(!rows.length){alert(L('پیامی در این فیلتر نیست.','No messages in this filter.','Nema poruka.'));return}if(!confirm(L(`همه ${rows.length} پیام نمایش‌داده‌شده برای همیشه از پنل و صندوق کاربران پنهان شوند؟`,`Hide all ${rows.length} displayed messages permanently?`,`Trajno sakriti ${rows.length} poruka?`)))return;try{await archiveMessageIds(rows.map(m=>m.id));await loadAll(true)}catch(e){alert(e.message||String(e))}};
if(typeof messageCenterRows==='function'){
  const previousRowsV225=messageCenterRows;
  messageCenterRows=function(){return previousRowsV225().filter(m=>!m.admin_deleted_at)};
}
const previousLoadAllV225=loadAll;
loadAll=async function(silent=false){
  ensureState();
  const result=await previousLoadAllV225(silent);
  ensureState();
  state.messages=state.messages.filter(m=>!m.admin_deleted_at);
  return result;
};

window.NH7_ADMIN_VERSION=V;
})();

/* ============================================================
   New Hope 7 Admin v2.2.6 — ONLY student panel + document studio
   This final compatibility layer intentionally leaves every other
   admin/user feature untouched.
   ============================================================ */
(()=>{'use strict';
const VERSION='2.2.6';
const txt=(fa,en,hr)=>{
  try{return lang==='fa'?fa:lang==='hr'?hr:en}catch(_){return fa}
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,num(v,a)));
function safeState(){
  if(typeof state!=='object'||!state)return;
  state.studentActivityV222=(state.studentActivityV222&&typeof state.studentActivityV222==='object')?state.studentActivityV222:{};
  state.studentActivityV223=(state.studentActivityV223&&typeof state.studentActivityV223==='object')?state.studentActivityV223:{};
  state.studentActivityV224=(state.studentActivityV224&&typeof state.studentActivityV224==='object')?state.studentActivityV224:{};
  state.studentActivityV225=(state.studentActivityV225&&typeof state.studentActivityV225==='object')?state.studentActivityV225:{};
  state.schoolCertificates=Array.isArray(state.schoolCertificates)?state.schoolCertificates:[];
}
safeState();

/* Student profile handling replaced by the canonical v2.3.0 block below. */

/* ---------- Standalone professional document studio ---------- */
const STORE='nh7_doc_design_v226';
const TEMPLATE_STORE='nh7_doc_templates_v226';
const defaults={
  theme:'blue_gold',orientation:'landscape',paper:'#fffdf7',accent:'#0b5faa',
  watermarkOpacity:.055,watermarkScale:58,
  logoData:'',logoSize:88,logoX:50,logoY:8,logoRotate:0,logoOpacity:1,logoRound:false,logoBlend:'normal',
  photoData:'',photoSize:112,photoX:8,photoY:15,photoRotate:0,photoZoom:1,photoRound:50,
  signatureData:'',
  activeTarget:'title',
  styles:{
    kicker:{font:'Cinzel',size:13,color:'#0f766e',bold:true,italic:false,underline:false,align:'center',y:0,spacing:2,line:1.3},
    title:{font:'Cinzel',size:38,color:'#0b5faa',bold:true,italic:false,underline:false,align:'center',y:0,spacing:0,line:1.2},
    name:{font:'Cormorant Garamond',size:42,color:'#102033',bold:true,italic:false,underline:false,align:'center',y:0,spacing:0,line:1.15},
    body:{font:'Noto Naskh Arabic',size:17,color:'#334155',bold:false,italic:false,underline:false,align:'center',y:0,spacing:0,line:1.8},
    course:{font:'Markazi Text',size:26,color:'#0f766e',bold:true,italic:false,underline:false,align:'center',y:0,spacing:0,line:1.4},
    footer:{font:'Estedad',size:12,color:'#475569',bold:false,italic:false,underline:false,align:'center',y:0,spacing:0,line:1.4}
  }
};
function mergeDesign(raw){
  const d=JSON.parse(JSON.stringify(defaults));
  if(raw&&typeof raw==='object'){
    Object.assign(d,raw);
    d.styles=Object.assign({},defaults.styles,raw.styles||{});
    for(const k of Object.keys(d.styles))d.styles[k]=Object.assign({},defaults.styles[k]||defaults.styles.body,d.styles[k]||{});
  }
  return d;
}
let design=(()=>{try{return mergeDesign(JSON.parse(localStorage.getItem(STORE)||'null'))}catch(_){return mergeDesign()}})();
function saveDesign(){localStorage.setItem(STORE,JSON.stringify(design))}
function rerenderCertificates(){
  saveDesign();
  try{render()}catch(e){console.error('NH7 document render',e)}
}
const fonts=[
 'Vazirmatn','Estedad','Markazi Text','Noto Naskh Arabic','Noto Serif Arabic','Scheherazade New','Amiri','Lalezar',
 'Cinzel','Cormorant Garamond','EB Garamond','Libre Baskerville','Playfair Display','Merriweather','Lora','Great Vibes','Spectral','Bodoni Moda',
 'Georgia','Times New Roman','Arial','Tahoma'
];
const themes=[
 ['blue_gold',txt('آبی و طلایی رسمی','Formal blue & gold','Službeno plavo-zlatno')],
 ['baptism',txt('تعمید آبی روشن','Baptism blue','Plavo krštenje')],
 ['royal',txt('سلطنتی سرمه‌ای','Royal navy','Kraljevsko tamnoplavo')],
 ['emerald',txt('زمردی خدمتی','Emerald ministry','Smaragdna služba')],
 ['burgundy',txt('زرشکی کلاسیک','Classic burgundy','Klasična bordo')],
 ['parchment',txt('کاغذ قدیمی طلایی','Golden parchment','Zlatni pergament')],
 ['marble',txt('مرمر سفید و طلایی','White marble & gold','Bijeli mramor i zlato')],
 ['silver',txt('نقره‌ای رسمی','Official silver','Službeno srebrno')],
 ['minimal',txt('مینیمال مدرن','Modern minimal','Moderno minimalistički')],
 ['letterhead',txt('نامه رسمی سربرگ‌دار','Formal letterhead','Službeno zaglavlje')],
 ['invitation',txt('دعوت‌نامه کلیسایی','Church invitation','Crkvena pozivnica')],
 ['ministry',txt('گواهی خدمت','Ministry certificate','Potvrda službe')]
];
const targetLabels={
 kicker:txt('نام کلیسا / بالای صفحه','Church heading','Zaglavlje crkve'),
 title:txt('عنوان اصلی','Main title','Glavni naslov'),
 name:txt('نام شخص','Recipient name','Ime osobe'),
 body:txt('متن اصلی','Body text','Glavni tekst'),
 course:txt('نام دوره / سمت','Course or designation','Tečaj ili služba'),
 footer:txt('تاریخ، امضا و شماره','Date, signature and number','Datum, potpis i broj')
};
const opt=(value,label,current)=>`<option value="${esc(value)}" ${String(value)===String(current)?'selected':''}>${esc(label)}</option>`;
function currentStyleV226(){
  const k=design.activeTarget||'title';
  design.styles[k]=Object.assign({},defaults.styles[k]||defaults.styles.body,design.styles[k]||{});
  return design.styles[k];
}
function studioHtmlV226(){
  const s=currentStyleV226();
  return `<section class="panel-card nh7-doc-studio-v226">
    <div class="req-head"><div><h3>🎨 ${txt('استودیوی حرفه‌ای مدارک','Professional Document Studio','Profesionalni studio dokumenata')}</h3>
    <p class="muted small">${txt('نسخه فعال ۲.۲.۶ — تنظیمات فوراً روی پیش‌نمایش پایین اعمال می‌شوند.','Active v2.2.6 — settings apply immediately to the preview below.','Aktivna verzija 2.2.6 — promjene se odmah vide.')}</p></div>
    <button type="button" class="btn primary" onclick="NH7Doc226.full()">👁 ${txt('پیش‌نمایش تمام صفحه','Full-screen preview','Puni pregled')}</button></div>

    <details open><summary>🖼 ${txt('قالب، قاب و پس‌زمینه','Template, frame and background','Predložak, okvir i pozadina')}</summary>
      <div class="nh7-doc-grid-v226">
        <label>${txt('نوع قالب','Template style','Stil predloška')}<select onchange="NH7Doc226.set('theme',this.value)">${themes.map(x=>opt(x[0],x[1],design.theme)).join('')}</select></label>
        <label>${txt('جهت صفحه','Orientation','Orijentacija')}<select onchange="NH7Doc226.set('orientation',this.value)">${opt('portrait','A4 '+txt('عمودی','Portrait','Okomito'),design.orientation)}${opt('landscape','A4 '+txt('افقی','Landscape','Vodoravno'),design.orientation)}</select></label>
        <label>${txt('رنگ کاغذ','Paper color','Boja papira')}<input type="color" value="${esc(design.paper)}" oninput="NH7Doc226.setLive('paper',this.value)"></label>
        <label>${txt('رنگ اصلی','Accent color','Glavna boja')}<input type="color" value="${esc(design.accent)}" oninput="NH7Doc226.setLive('accent',this.value)"></label>
        <label>${txt('شفافیت واترمارک','Watermark opacity','Prozirnost vodenog žiga')}<input type="range" min="0" max=".22" step=".005" value="${design.watermarkOpacity}" oninput="NH7Doc226.setLive('watermarkOpacity',this.value)"></label>
        <label>${txt('اندازه واترمارک','Watermark size','Veličina vodenog žiga')}<input type="range" min="20" max="110" value="${design.watermarkScale}" oninput="NH7Doc226.setLive('watermarkScale',this.value)"></label>
      </div>
    </details>

    <details open><summary>⛪ ${txt('لوگو و واترمارک کلیسا','Church logo and watermark','Logo crkve i vodeni žig')}</summary>
      <div class="nh7-doc-grid-v226">
        <label>${txt('آپلود لوگو','Upload logo','Prenesi logo')}<input type="file" accept="image/*" onchange="NH7Doc226.image(this,'logoData')"></label>
        <label>${txt('اندازه لوگو','Logo size','Veličina logotipa')}<input type="range" min="35" max="210" value="${design.logoSize}" oninput="NH7Doc226.setLive('logoSize',this.value)"></label>
        <label>${txt('چپ و راست لوگو','Logo left/right','Logo lijevo/desno')}<input type="range" min="0" max="100" value="${design.logoX}" oninput="NH7Doc226.setLive('logoX',this.value)"></label>
        <label>${txt('بالا و پایین لوگو','Logo up/down','Logo gore/dolje')}<input type="range" min="0" max="85" value="${design.logoY}" oninput="NH7Doc226.setLive('logoY',this.value)"></label>
        <label>${txt('چرخش لوگو','Logo rotation','Rotacija logotipa')}<input type="range" min="-180" max="180" value="${design.logoRotate}" oninput="NH7Doc226.setLive('logoRotate',this.value)"></label>
        <label>${txt('شفافیت لوگو','Logo opacity','Prozirnost logotipa')}<input type="range" min=".1" max="1" step=".05" value="${design.logoOpacity}" oninput="NH7Doc226.setLive('logoOpacity',this.value)"></label>
        <label>${txt('شکل لوگو','Logo shape','Oblik logotipa')}<select onchange="NH7Doc226.set('logoRound',this.value==='1')">${opt('0',txt('عادی','Normal','Normalno'),design.logoRound?'1':'0')}${opt('1',txt('گرد','Circular','Kružno'),design.logoRound?'1':'0')}</select></label>
        <label>${txt('ترکیب با زمینه','Blend with background','Stapanje s pozadinom')}<select onchange="NH7Doc226.set('logoBlend',this.value)">${opt('normal',txt('عادی','Normal','Normalno'),design.logoBlend)}${opt('multiply',txt('حذف سفیدی زمینه','Multiply / blend','Stapanje'),design.logoBlend)}${opt('screen','روشن',design.logoBlend)}</select></label>
      </div>
    </details>

    <details><summary>👤 ${txt('عکس شخص','Recipient photo','Fotografija osobe')}</summary>
      <div class="nh7-doc-grid-v226">
        <label>${txt('آپلود عکس','Upload photo','Prenesi fotografiju')}<input type="file" accept="image/*" onchange="NH7Doc226.image(this,'photoData')"></label>
        <label>${txt('اندازه عکس','Photo size','Veličina fotografije')}<input type="range" min="45" max="220" value="${design.photoSize}" oninput="NH7Doc226.setLive('photoSize',this.value)"></label>
        <label>${txt('چپ و راست','Left/right','Lijevo/desno')}<input type="range" min="0" max="100" value="${design.photoX}" oninput="NH7Doc226.setLive('photoX',this.value)"></label>
        <label>${txt('بالا و پایین','Up/down','Gore/dolje')}<input type="range" min="0" max="85" value="${design.photoY}" oninput="NH7Doc226.setLive('photoY',this.value)"></label>
        <label>${txt('چرخش عکس','Photo rotation','Rotacija fotografije')}<input type="range" min="-30" max="30" value="${design.photoRotate}" oninput="NH7Doc226.setLive('photoRotate',this.value)"></label>
        <label>${txt('گردی قاب','Corner radius','Zaobljenost')}<input type="range" min="0" max="50" value="${design.photoRound}" oninput="NH7Doc226.setLive('photoRound',this.value)"></label>
        <button type="button" class="btn danger-btn" onclick="NH7Doc226.clearImage('photoData')">${txt('حذف عکس','Remove photo','Ukloni fotografiju')}</button>
      </div>
    </details>

    <details open><summary>🔤 ${txt('فونت و اندازه مستقل هر قسمت','Independent font and size','Neovisni font i veličina')}</summary>
      <div class="nh7-doc-grid-v226">
        <label>${txt('قسمت موردنظر','Text section','Dio teksta')}<select onchange="NH7Doc226.target(this.value)">${Object.entries(targetLabels).map(([k,v])=>opt(k,v,design.activeTarget)).join('')}</select></label>
        <label>${txt('فونت','Font','Font')}<select onchange="NH7Doc226.style('font',this.value)">${fonts.map(f=>opt(f,f,s.font)).join('')}</select></label>
        <label>${txt('اندازه','Size','Veličina')}<input type="number" min="7" max="80" value="${s.size}" onchange="NH7Doc226.style('size',this.value)"></label>
        <label>${txt('رنگ','Color','Boja')}<input type="color" value="${esc(s.color)}" oninput="NH7Doc226.styleLive('color',this.value)"></label>
        <label>${txt('تراز','Alignment','Poravnanje')}<select onchange="NH7Doc226.style('align',this.value)">${opt('start',txt('راست/شروع','Start','Početak'),s.align)}${opt('center',txt('وسط','Center','Sredina'),s.align)}${opt('end',txt('چپ/پایان','End','Kraj'),s.align)}</select></label>
        <label>${txt('بالا و پایین','Move up/down','Pomak gore/dolje')}<input type="range" min="-100" max="120" value="${s.y}" oninput="NH7Doc226.styleLive('y',this.value)"></label>
        <label>${txt('فاصله خطوط','Line height','Prored')}<input type="range" min=".8" max="2.8" step=".05" value="${s.line}" oninput="NH7Doc226.styleLive('line',this.value)"></label>
        <label>${txt('فاصله حروف','Letter spacing','Razmak slova')}<input type="range" min="-2" max="10" step=".25" value="${s.spacing}" oninput="NH7Doc226.styleLive('spacing',this.value)"></label>
        <div class="nh7-doc-toggle-row-v226">
          <button type="button" class="nh7-doc-toggle-v226 ${s.bold?'active':''}" onclick="NH7Doc226.style('bold',${!s.bold})"><b>B</b></button>
          <button type="button" class="nh7-doc-toggle-v226 ${s.italic?'active':''}" onclick="NH7Doc226.style('italic',${!s.italic})"><i>I</i></button>
          <button type="button" class="nh7-doc-toggle-v226 ${s.underline?'active':''}" onclick="NH7Doc226.style('underline',${!s.underline})"><u>U</u></button>
        </div>
      </div>
      <div class="nh7-font-preview-v226" style="font-family:${esc(s.font)};font-size:${s.size}px;color:${esc(s.color)};font-weight:${s.bold?800:400};font-style:${s.italic?'italic':'normal'};text-decoration:${s.underline?'underline':'none'}">${txt('نمونه زنده متن فارسی، English و Hrvatski','Live preview: فارسی, English and Hrvatski','Pregled: فارسی, English i Hrvatski')}</div>
    </details>

    <details><summary>✍ ${txt('امضا با Apple Pencil یا انگشت','Signature with Apple Pencil or finger','Potpis olovkom ili prstom')}</summary>
      <canvas id="nh7-signature-v226" class="nh7-signature-v226"></canvas>
      <div class="actions"><button type="button" class="btn primary" onclick="NH7Doc226.saveSignature()">✓ ${txt('ذخیره امضا','Save signature','Spremi potpis')}</button>
      <button type="button" class="btn ghost" onclick="NH7Doc226.clearSignature()">${txt('پاک‌کردن','Clear','Očisti')}</button></div>
    </details>

    <details><summary>💾 ${txt('مدیریت قالب‌های شخصی','Saved template manager','Upravljanje spremljenim predlošcima')}</summary>
      <div class="actions"><button type="button" class="btn primary" onclick="NH7Doc226.saveTemplate()">${txt('ذخیره قالب فعلی','Save current template','Spremi trenutni predložak')}</button>
      <button type="button" class="btn secondary" onclick="NH7Doc226.loadTemplate()">${txt('بازکردن قالب ذخیره‌شده','Load saved template','Učitaj spremljeni predložak')}</button>
      <button type="button" class="btn danger-btn" onclick="NH7Doc226.reset()">${txt('بازنشانی طراحی','Reset design','Vrati dizajn')}</button></div>
    </details>
  </section>`;
}
function targetElements(preview,key){
  if(key==='kicker')return preview.querySelectorAll('.certificate-kicker,.nh7-cert-church,.certificate-org');
  if(key==='title')return preview.querySelectorAll('.certificate-title');
  if(key==='name')return preview.querySelectorAll('.certificate-name');
  if(key==='body')return preview.querySelectorAll('.certificate-copy,.certificate-body-custom,.nh7-cert-body');
  if(key==='course')return preview.querySelectorAll('.certificate-course,.certificate-designation,.certificate-score');
  return preview.querySelectorAll('.certificate-footer,.certificate-sign,.certificate-meta,.certificate-seal');
}
function applyStyle(el,s){
  el.style.fontFamily=s.font||'inherit';
  el.style.fontSize=`${clamp(s.size,7,80)}px`;
  el.style.color=s.color||'#1e293b';
  el.style.fontWeight=s.bold?'800':'400';
  el.style.fontStyle=s.italic?'italic':'normal';
  el.style.textDecoration=s.underline?'underline':'none';
  el.style.textAlign=s.align||'center';
  el.style.lineHeight=String(s.line||1.4);
  el.style.letterSpacing=`${num(s.spacing,0)}px`;
  el.style.transform=`translateY(${num(s.y,0)}px)`;
}
function applyDocumentDesignV226(){
  const previews=document.querySelectorAll('.certificate-preview');
  previews.forEach(preview=>{
    preview.dataset.nh7Theme=design.theme;
    preview.dataset.nh7Orientation=design.orientation;
    preview.style.setProperty('--nh7-paper',design.paper);
    preview.style.setProperty('--nh7-accent',design.accent);
    preview.style.setProperty('--nh7-watermark-opacity',String(design.watermarkOpacity));
    preview.style.setProperty('--nh7-watermark-scale',`${design.watermarkScale}%`);
    const logo=preview.querySelector('.certificate-logo');
    if(logo){
      if(design.logoData)logo.src=design.logoData;
      logo.style.width=`${design.logoSize}px`;logo.style.height=`${design.logoSize}px`;
      logo.style.position='absolute';logo.style.left=`${design.logoX}%`;logo.style.top=`${design.logoY}%`;
      logo.style.transform=`translate(-50%,-50%) rotate(${design.logoRotate}deg)`;
      logo.style.opacity=String(design.logoOpacity);logo.style.borderRadius=design.logoRound?'50%':'8px';
      logo.style.mixBlendMode=design.logoBlend||'normal';logo.style.zIndex='8';logo.style.margin='0';
      preview.style.setProperty('--nh7-watermark-image',`url("${(design.logoData||logo.src).replace(/"/g,'%22')}")`);
    }
    let photo=preview.querySelector('.nh7-cert-photo-v226');
    if(design.photoData){
      if(!photo){photo=document.createElement('img');photo.className='nh7-cert-photo-v226';preview.appendChild(photo)}
      photo.src=design.photoData;
      Object.assign(photo.style,{width:`${design.photoSize}px`,height:`${design.photoSize}px`,left:`${design.photoX}%`,top:`${design.photoY}%`,transform:`translate(-50%,-50%) rotate(${design.photoRotate}deg) scale(${design.photoZoom||1})`,borderRadius:`${design.photoRound}%`});
    }else photo?.remove();
    let sig=preview.querySelector('.nh7-cert-signature-v226');
    if(design.signatureData){
      if(!sig){sig=document.createElement('img');sig.className='nh7-cert-signature-v226';preview.appendChild(sig)}
      sig.src=design.signatureData;
    }else sig?.remove();
    for(const [k,s] of Object.entries(design.styles||{}))targetElements(preview,k).forEach(el=>applyStyle(el,s));
  });
}
const renderCertificatesBeforeV226=renderCertificates;
renderCertificates=function(){
  safeState();
  let base='';
  try{base=String(renderCertificatesBeforeV226())}catch(e){base=`<div class="notice">${esc(e.message||e)}</div>`}
  base=base
    .replace(/<section class="panel-card doc-v225-studio">[\s\S]*?<\/section>/,'')
    .replace(/<section class="panel-card doc-v223-studio">[\s\S]*?<\/section>/,'')
    .replace(/<section class="panel-card doc-v222-editor">[\s\S]*?<\/section>/,'');
  return studioHtmlV226()+base;
};
function initSignatureV226(){
  const canvas=document.getElementById('nh7-signature-v226');
  if(!canvas||canvas.dataset.ready)return;
  canvas.dataset.ready='1';
  const ratio=Math.max(1,window.devicePixelRatio||1),rect=canvas.getBoundingClientRect();
  canvas.width=Math.max(600,Math.round((rect.width||600)*ratio));canvas.height=Math.round(180*ratio);
  const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);ctx.lineWidth=2.3;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#0f172a';
  let drawing=false;
  const point=e=>{const r=canvas.getBoundingClientRect(),p=e.touches?.[0]||e;return{x:p.clientX-r.left,y:p.clientY-r.top}};
  const start=e=>{drawing=true;const p=point(e);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault()};
  const move=e=>{if(!drawing)return;const p=point(e);ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault()};
  const end=e=>{drawing=false;e.preventDefault()};
  canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('pointerleave',end);
  if(design.signatureData){const img=new Image();img.onload=()=>ctx.drawImage(img,0,0,rect.width||600,180);img.src=design.signatureData}
}
function updateLive(key,val){
  const numeric=['watermarkOpacity','watermarkScale','logoSize','logoX','logoY','logoRotate','logoOpacity','photoSize','photoX','photoY','photoRotate','photoZoom','photoRound'];
  design[key]=numeric.includes(key)?num(val):val;saveDesign();applyDocumentDesignV226();
}
window.NH7Doc226={
  set(k,v){design[k]=v;rerenderCertificates()},
  setLive:updateLive,
  image(input,key){const file=input?.files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>{design[key]=String(r.result||'');rerenderCertificates()};r.readAsDataURL(file)},
  clearImage(key){design[key]='';rerenderCertificates()},
  target(k){design.activeTarget=k;rerenderCertificates()},
  style(k,v){const s=currentStyleV226();s[k]=['size','y','line','spacing'].includes(k)?num(v):v;rerenderCertificates()},
  styleLive(k,v){const s=currentStyleV226();s[k]=['size','y','line','spacing'].includes(k)?num(v):v;saveDesign();applyDocumentDesignV226()},
  full(){
    const target=document.querySelector('#certificatePrintTarget .certificate-preview,.certificate-shell .certificate-preview');
    if(!target){alert(txt('ابتدا یک مدرک را انتخاب کنید.','Select a document first.','Najprije odaberite dokument.'));return}
    const overlay=document.createElement('div');overlay.className='nh7-full-preview-v226';
    overlay.innerHTML=`<div class="nh7-full-toolbar-v226"><button type="button" class="btn danger-btn" data-close>× ${txt('بستن','Close','Zatvori')}</button><button type="button" class="btn primary" data-print>🖨 ${txt('چاپ / PDF','Print / PDF','Ispis / PDF')}</button></div><div class="nh7-full-sheet-v226">${target.outerHTML}</div>`;
    overlay.querySelector('[data-close]').onclick=()=>overlay.remove();
    overlay.querySelector('[data-print]').onclick=()=>window.print();
    overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
    document.body.appendChild(overlay);requestAnimationFrame(applyDocumentDesignV226);
  },
  reset(){if(!confirm(txt('همه تنظیمات طراحی بازنشانی شود؟','Reset all design settings?','Vratiti sve postavke dizajna?')))return;design=mergeDesign();rerenderCertificates()},
  saveTemplate(){const name=prompt(txt('نام قالب را بنویسید:','Template name:','Naziv predloška:'),txt('قالب کلیسا','Church template','Crkveni predložak'));if(!name)return;let all={};try{all=JSON.parse(localStorage.getItem(TEMPLATE_STORE)||'{}')}catch(_){}all[name]=design;localStorage.setItem(TEMPLATE_STORE,JSON.stringify(all));alert(txt('قالب ذخیره شد.','Template saved.','Predložak je spremljen.'))},
  loadTemplate(){let all={};try{all=JSON.parse(localStorage.getItem(TEMPLATE_STORE)||'{}')}catch(_){}const names=Object.keys(all);if(!names.length){alert(txt('قالب ذخیره‌شده‌ای وجود ندارد.','No saved template.','Nema spremljenog predloška.'));return}const name=prompt(txt('نام یکی از قالب‌ها را دقیق بنویسید:\n','Enter one saved template name:\n','Unesite naziv spremljenog predloška:\n')+names.join('\n'),names[0]);if(!name||!all[name])return;design=mergeDesign(all[name]);rerenderCertificates()},
  saveSignature(){const c=document.getElementById('nh7-signature-v226');if(!c)return;design.signatureData=c.toDataURL('image/png');rerenderCertificates()},
  clearSignature(){design.signatureData='';const c=document.getElementById('nh7-signature-v226'),ctx=c?.getContext('2d');ctx?.clearRect(0,0,c.width,c.height);saveDesign();applyDocumentDesignV226()}
};
window.NH7_ADMIN_VERSION=VERSION;
})();

/* ============================================================
   New Hope 7 Admin v2.2.7 — final student-detail scroll + preview exit
   Only these two UI defects are addressed. All analytics, Audio Bible,
   school, library, dashboard and data functions remain untouched.
   ============================================================ */
(()=>{'use strict';
const T=(fa,en,hr)=>{try{return lang==='fa'?fa:lang==='hr'?hr:en}catch(_){return fa}};



/* Every document/print preview receives a permanent close/back control,
   including legacy v2.2.2/v2.2.3 previews and the v2.2.6 overlay. */
function closeDocumentPreviewV227(node){
  const root=node?.closest?.('.doc-v222-preview-modal,.doc-v223-preview-modal,.nh7-full-preview-v226,.nh7-document-preview,.certificate-preview-modal')||node;
  if(root?.classList?.contains('doc-v222-preview-modal')){root.classList.add('hidden');root.removeAttribute('style')}
  else if(root?.classList?.contains('doc-v223-preview-modal'))root.remove();
  else if(root?.parentNode)root.remove();
  document.body.classList.remove('nh7-preview-open-v227');
}
function ensurePreviewExitV227(){
  const previews=document.querySelectorAll('.doc-v222-preview-modal:not(.hidden),.doc-v223-preview-modal,.nh7-full-preview-v226,.nh7-document-preview,.certificate-preview-modal');
  previews.forEach(root=>{
    document.body.classList.add('nh7-preview-open-v227');
    if(root.querySelector('[data-nh7-preview-exit-v227]'))return;
    const bar=document.createElement('div');
    bar.className='nh7-preview-exit-v227';
    bar.setAttribute('data-nh7-preview-exit-v227','1');
    bar.innerHTML=`<button type="button" class="btn danger-btn" data-nh7-preview-close-v227>× ${T('بستن و بازگشت به پنل','Close and return to admin','Zatvori i vrati se')}</button>`;
    root.appendChild(bar);
  });
}
const observerPreviewV227=new MutationObserver(()=>requestAnimationFrame(ensurePreviewExitV227));
observerPreviewV227.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
document.addEventListener('click',e=>{
  const btn=e.target.closest?.('[data-nh7-preview-close-v227]');
  if(!btn)return;
  e.preventDefault();e.stopImmediatePropagation();closeDocumentPreviewV227(btn);
},true);
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  const root=document.querySelector('.nh7-full-preview-v226,.doc-v223-preview-modal,.doc-v222-preview-modal:not(.hidden),.nh7-document-preview,.certificate-preview-modal');
  if(root){e.preventDefault();closeDocumentPreviewV227(root)}
},true);
window.addEventListener('afterprint',()=>setTimeout(ensurePreviewExitV227,50));
requestAnimationFrame(ensurePreviewExitV227);
window.NH7_ADMIN_VERSION='2.2.7';
})();

/* ============================================================
   New Hope 7 Admin v2.3.0 — canonical student profile
   One modal, one inner scroller, one close handler.
   ============================================================ */
(()=>{'use strict';
let nh7StudentScrollYV230=0;
let nh7StudentClosingV230=false;

function nh7StudentTextV230(fa,en,hr){try{return lang==='fa'?fa:lang==='hr'?hr:en}catch(_){return fa}}
function nh7StudentUnlockV230(){
  const html=document.documentElement,body=document.body;
  html.classList.remove('nh7-student-profile-open-v230');
  body.classList.remove('nh7-student-profile-open-v230','nh7-student-lock-v226','nh7-student-modal-open','nh7-student-detail-open-v227','nh7-student-detail-open-v228');
  html.style.removeProperty('overflow');html.style.removeProperty('overscroll-behavior');
  for(const p of ['position','top','left','right','width','overflow','overscroll-behavior'])body.style.removeProperty(p);
  body.style.removeProperty('--nh7-lock-scroll-y');
  requestAnimationFrame(()=>window.scrollTo(0,nh7StudentScrollYV230));
}
function nh7StudentLockV230(){
  if(!document.body.classList.contains('nh7-student-profile-open-v230'))nh7StudentScrollYV230=window.scrollY||document.documentElement.scrollTop||0;
  const html=document.documentElement,body=document.body;
  html.classList.add('nh7-student-profile-open-v230');body.classList.add('nh7-student-profile-open-v230');
  html.style.setProperty('overflow','hidden','important');html.style.setProperty('overscroll-behavior','none','important');
  body.style.setProperty('position','fixed','important');body.style.setProperty('top',(-nh7StudentScrollYV230)+'px','important');
  body.style.setProperty('left','0','important');body.style.setProperty('right','0','important');body.style.setProperty('width','100%','important');
  body.style.setProperty('overflow','hidden','important');body.style.setProperty('overscroll-behavior','none','important');
}
function nh7CloseStudentProfileV230(event){
  if(event){event.preventDefault?.();event.stopPropagation?.();event.stopImmediatePropagation?.()}
  if(nh7StudentClosingV230)return false;
  nh7StudentClosingV230=true;
  document.querySelector('.student-modal-backdrop')?.remove();
  try{selectedStudentEmail=''}catch(_){try{window.selectedStudentEmail=''}catch(__){}}
  nh7StudentUnlockV230();
  try{render()}catch(error){console.error('NH7 close student profile v2.3.0',error)}
  setTimeout(()=>{nh7StudentClosingV230=false},250);
  return false;
}
function nh7StudentBoundaryV230(scroller){
  if(scroller.dataset.nh7BoundaryV230==='1')return;
  scroller.dataset.nh7BoundaryV230='1';let lastY=0;
  scroller.addEventListener('touchstart',event=>{
    lastY=event.touches?.[0]?.clientY||0;
    const max=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
    if(max>0){if(scroller.scrollTop<=0)scroller.scrollTop=1;else if(scroller.scrollTop>=max)scroller.scrollTop=Math.max(1,max-1)}
  },{passive:true});
  scroller.addEventListener('touchmove',event=>{
    const y=event.touches?.[0]?.clientY||lastY,delta=y-lastY;lastY=y;
    const max=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
    if(max>0&&((scroller.scrollTop<=1&&delta>0)||(scroller.scrollTop>=max-1&&delta<0)))event.preventDefault();
  },{passive:false});
}
function nh7SetupStudentProfileV230(){
  const back=document.querySelector('.student-modal-backdrop');
  if(!back){nh7StudentUnlockV230();return}
  const modal=back.querySelector('.student-modal');if(!modal)return;
  nh7StudentLockV230();back.classList.add('nh7-student-backdrop-v230');back.setAttribute('role','dialog');back.setAttribute('aria-modal','true');
  const head=modal.querySelector(':scope > .student-modal-head')||modal.querySelector('.student-modal-head');
  let scroller=modal.querySelector(':scope > .nh7-student-scroll-v230');
  if(!scroller){
    scroller=document.createElement('div');scroller.className='nh7-student-scroll-v230';
    for(const node of Array.from(modal.childNodes)){if(node!==head)scroller.appendChild(node)}
    modal.appendChild(scroller);
  }
  const oldClose=head?.querySelector('.close-round,[data-nh7-close-student],[data-close-student],.nh7-student-close-v230');
  if(oldClose&&!oldClose.classList.contains('nh7-student-close-v230')){
    const close=oldClose.cloneNode(true);close.textContent='×';close.className='nh7-student-close-v230';close.type='button';
    close.removeAttribute('onclick');close.removeAttribute('data-nh7-close-student');close.removeAttribute('data-close-student');
    close.setAttribute('aria-label',nh7StudentTextV230('بستن پرونده دانشجو','Close student profile','Zatvori profil učenika'));
    close.onclick=nh7CloseStudentProfileV230;close.onpointerup=nh7CloseStudentProfileV230;oldClose.replaceWith(close);
  }else if(oldClose){oldClose.onclick=nh7CloseStudentProfileV230;oldClose.onpointerup=nh7CloseStudentProfileV230}
  nh7StudentBoundaryV230(scroller);
  if(!scroller.dataset.nh7OpenedV230){scroller.dataset.nh7OpenedV230='1';scroller.scrollTop=0}
  try{
    const email=String(selectedStudentEmail||'').trim().toLowerCase();
    state.studentActivityV223=state.studentActivityV223&&typeof state.studentActivityV223==='object'?state.studentActivityV223:{};
    if(email&&!state.studentActivityV223[email]&&typeof window.nh7LoadStudentV223==='function')window.nh7LoadStudentV223(email,true).catch(console.warn);
  }catch(error){console.warn('NH7 student analytics v2.3.0',error)}
}
const nh7RenderBeforeStudentV230=render;
render=function(){const result=nh7RenderBeforeStudentV230();requestAnimationFrame(nh7SetupStudentProfileV230);return result};
const nh7StudentObserverV230=new MutationObserver(()=>requestAnimationFrame(nh7SetupStudentProfileV230));
nh7StudentObserverV230.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',event=>{const close=event.target.closest?.('.nh7-student-close-v230');if(close)nh7CloseStudentProfileV230(event)},true);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.querySelector('.student-modal-backdrop'))nh7CloseStudentProfileV230(event)},true);
window.closeStudentDashboard=nh7CloseStudentProfileV230;
requestAnimationFrame(nh7SetupStudentProfileV230);
window.NH7_ADMIN_VERSION='2.3.0';
})();
