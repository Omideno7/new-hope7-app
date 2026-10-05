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

// ---------- Student profile: one canonical iPad/iPhone implementation ----------
const previousRenderV225=render;
let nh7StudentProfileOpenV240=false;

function nh7UnlockStudentProfileV240(){
  nh7StudentProfileOpenV240=false;
  document.documentElement.style.removeProperty('overflow');
  document.documentElement.style.removeProperty('height');
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('height');
  document.body.classList.remove(
    'nh7-student-modal-open',
    'nh7-student-lock-v226',
    'nh7-student-detail-open-v227',
    'nh7-student-detail-open-v228'
  );
  document.body.style.removeProperty('--nh7-lock-scroll-y');
}

function nh7CloseStudentProfileV240(event){
  if(event){
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
  }
  try{selectedStudentEmail=''}catch(error){console.error('NH7 clear selected student',error)}
  nh7UnlockStudentProfileV240();
  try{render()}catch(error){console.error('NH7 close student profile',error)}
  return false;
}

function nh7SetupStudentProfileV240(){
  const backdrop=document.querySelector('.student-modal-backdrop');
  if(!backdrop){
    nh7UnlockStudentProfileV240();
    return;
  }

  nh7StudentProfileOpenV240=true;
  document.body.classList.add('nh7-student-modal-open');
  document.documentElement.style.setProperty('overflow','hidden','important');
  document.documentElement.style.setProperty('height','100%','important');
  document.body.style.setProperty('overflow','hidden','important');
  document.body.style.setProperty('height','100%','important');

  backdrop.setAttribute('role','dialog');
  backdrop.setAttribute('aria-modal','true');
  backdrop.style.setProperty('position','fixed','important');
  backdrop.style.setProperty('inset','0','important');
  backdrop.style.setProperty('display','flex','important');
  backdrop.style.setProperty('align-items','stretch','important');
  backdrop.style.setProperty('justify-content','center','important');
  backdrop.style.setProperty('overflow','hidden','important');
  backdrop.style.setProperty('touch-action','none','important');

  const modal=backdrop.querySelector('.student-modal');
  if(!modal)return;

  modal.setAttribute('role','document');
  modal.setAttribute('tabindex','-1');
  modal.style.setProperty('position','relative','important');
  modal.style.setProperty('inset','auto','important');
  modal.style.setProperty('display','block','important');
  modal.style.setProperty('width','min(980px,100%)','important');
  modal.style.setProperty('height','100dvh','important');
  modal.style.setProperty('min-height','0','important');
  modal.style.setProperty('max-height','100dvh','important');
  modal.style.setProperty('margin','0 auto','important');
  modal.style.setProperty('overflow-y','auto','important');
  modal.style.setProperty('overflow-x','hidden','important');
  modal.style.setProperty('-webkit-overflow-scrolling','touch','important');
  modal.style.setProperty('overscroll-behavior-y','contain','important');
  modal.style.setProperty('touch-action','pan-y','important');

  const head=modal.querySelector('.student-modal-head');
  if(head){
    head.style.setProperty('position','sticky','important');
    head.style.setProperty('top','0','important');
    head.style.setProperty('z-index','100','important');
    head.style.setProperty('background','rgba(247,251,251,.98)','important');
    head.style.setProperty('pointer-events','auto','important');
  }

  const close=modal.querySelector('.close-round,[data-nh7-close-student],[data-close-student]');
  if(close){
    close.type='button';
    close.setAttribute('aria-label',L('بستن پرونده دانشجو','Close student profile','Zatvori profil učenika'));
    close.style.setProperty('position','relative','important');
    close.style.setProperty('z-index','101','important');
    close.style.setProperty('pointer-events','auto','important');
    close.style.setProperty('touch-action','manipulation','important');
    close.onclick=nh7CloseStudentProfileV240;
    close.onpointerup=nh7CloseStudentProfileV240;
  }

  if(!modal.dataset.nh7OpenedV240){
    modal.dataset.nh7OpenedV240='1';
    modal.scrollTop=0;
  }
}

render=function(){
  ensureState();
  const result=previousRenderV225();
  requestAnimationFrame(nh7SetupStudentProfileV240);
  try{window.NH7_DOC_INIT_SIGNATURE_V222?.()}catch(error){console.warn('Signature pad init',error)}
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

closeStudentDashboard=nh7CloseStudentProfileV240;
window.closeStudentDashboard=nh7CloseStudentProfileV240;

function nh7StudentCloseTargetV240(event){
  return event.target.closest?.('[data-nh7-close-student],[data-close-student],.student-modal .close-round');
}
document.addEventListener('pointerup',event=>{
  if(nh7StudentCloseTargetV240(event))nh7CloseStudentProfileV240(event);
},true);
document.addEventListener('click',event=>{
  if(nh7StudentCloseTargetV240(event)){nh7CloseStudentProfileV240(event);return}
  if(event.target.classList?.contains('student-modal-backdrop'))nh7CloseStudentProfileV240(event);
},true);
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&document.querySelector('.student-modal-backdrop'))nh7CloseStudentProfileV240(event);
},true);

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
    <label>${L('جهت صفحه','Page orientation','Orijentacija')}<select onchange="nh7DocSetV222('layout',this.value)"><option value="landscape" ${selected(d.layout,'landscape')}>${L('افقی','Landscape','Vodoravno')}</option><option value="portrait" ${selected(d.layout,'portrait')}>${L('عمودی','Portrait','Okomito')}</option></select></label>
    <label>${L('تم','Theme','Tema')}<select onchange="nh7DocSetV222('theme',this.value)">${themes.map(x=>`<option value="${x[0]}" ${selected(d.theme,x[0])}>${x[1]}</option>`).join('')}</select></label>
    <label>${L('رنگ زمینه','Paper color','Boja papira')}<input type="color" value="${E(d.paperColor||'#fffdf7')}" onchange="nh7DocSetV222('paperColor',this.value)"></label>
    <label>${L('رنگ اصلی','Accent color','Glavna boja')}<input type="color" value="${E(d.accentColor||'#0b5faa')}" onchange="nh7DocSetV222('accentColor',this.value)"></label>
    <label>${L('شدت واترمارک','Watermark opacity','Prozirnost vodenog žiga')}<input type="range" min="0" max="0.25" step="0.005" value="${N(d.watermarkOpacity)}" oninput="nh7DocSetV222('watermarkOpacity',this.value)"></label>
    <label>${L('اندازه لوگو','Logo size','Veličina logotipa')}<input type="range" min="40" max="180" value="${N(d.logoSize)||94}" oninput="nh7DocSetV222('logoSize',this.value)"></label>
    <label>${L('جای لوگو','Logo position','Položaj logotipa')}<select onchange="nh7DocSetV222('logoPosition',this.value)"><option value="right" ${selected(d.logoPosition,'right')}>${L('راست','Right','Desno')}</option><option value="center" ${selected(d.logoPosition,'center')}>${L('وسط','Center','Sredina')}</option><option value="left" ${selected(d.logoPosition,'left')}>${L('چپ','Left','Lijevo')}</option></select></label>
    <label class="file-label">${L('بارگذاری لوگو','Upload logo','Prenesi logotip')}<input type="file" accept="image/*" onchange="nh7DocUploadV222('logo',this.files[0])"></label>
  </div></details>
  <details open><summary>${L('عکس شخص: پیش‌نمایش و تنظیم','Recipient photo: preview and crop','Fotografija osobe')}</summary><div class="doc-v225-photo-tools"><div class="doc-v225-photo-preview">${photo}</div><div class="doc-v225-grid">
    <label class="file-label">${L('بارگذاری عکس','Upload photo','Prenesi fotografiju')}<input type="file" accept="image/*" onchange="nh7DocUploadV222('photo',this.files[0])"></label>
    <label>X<input type="range" min="0" max="100" value="${N(p.x)||50}" oninput="nh7DocPhotoV222('x',this.value)"></label><label>Y<input type="range" min="0" max="100" value="${N(p.y)||50}" oninput="nh7DocPhotoV222('y',this.value)"></label><label>${L('بزرگ‌نمایی','Zoom','Zum')}<input type="range" min="0.5" max="3" step="0.05" value="${N(p.zoom)||1}" oninput="nh7DocPhotoV222('zoom',this.value)"></label><label>${L('اندازه','Size','Veličina')}<input type="range" min="55" max="220" value="${N(p.size)||115}" oninput="nh7DocPhotoV222('size',this.value)"></label>
  </div></div></details>
  <details open><summary>${L('تنظیم مستقل متن','Independent text controls','Neovisne postavke teksta')}</summary><div class="doc-v225-grid">
    <label>${L('بخش متن','Text element','Element teksta')}<select onchange="nh7DocStyleTargetV222(this.value)">${targets.map(x=>`<option value="${x[0]}" ${selected(d.styleTarget,x[0])}>${x[1]}</option>`).join('')}</select></label>
    <label>${L('فونت','Font','Font')}<select onchange="nh7DocStyleV222('font',this.value)">${fonts.map(x=>`<option ${selected(s.font,x)}>${x}</option>`).join('')}</select></label>
    <label>${L('اندازه','Size','Veličina')}<input type="number" min="8" max="90" value="${N(s.size)||16}" onchange="nh7DocStyleV222('size',this.value)"></label>
    <label>${L('رنگ','Color','Boja')}<input type="color" value="${E(s.color||'#1e293b')}" onchange="nh7DocStyleV222('color',this.value)"></label>
    <label>${L('فاصله عمودی','Vertical offset','Okomiti pomak')}<input type="range" min="-140" max="140" value="${N(s.offsetY)}" oninput="nh7DocStyleV222('offsetY',this.value)"></label>
    <label>${L('ارتفاع خط','Line height','Visina retka')}<input type="range" min="0.8" max="3" step="0.05" value="${N(s.lineHeight)||1.45}" oninput="nh7DocStyleV222('lineHeight',this.value)"></label>
    <label>${L('فاصله حروف','Letter spacing','Razmak slova')}<input type="range" min="-2" max="12" step="0.25" value="${N(s.letterSpacing)}" oninput="nh7DocStyleV222('letterSpacing',this.value)"></label>
    <label>${L('چیدمان','Alignment','Poravnanje')}<select onchange="nh7DocStyleV222('align',this.value)"><option value="right" ${selected(s.align,'right')}>${L('راست','Right','Desno')}</option><option value="center" ${selected(s.align,'center')}>${L('وسط','Center','Sredina')}</option><option value="left" ${selected(s.align,'left')}>${L('چپ','Left','Lijevo')}</option></select></label>
    <div class="doc-v225-checks"><label><input type="checkbox" ${checked(s.bold)} onchange="nh7DocStyleV222('bold',this.checked)">${L('ضخیم','Bold','Podebljano')}</label><label><input type="checkbox" ${checked(s.italic)} onchange="nh7DocStyleV222('italic',this.checked)">${L('کج','Italic','Kurziv')}</label><label><input type="checkbox" ${checked(s.underline)} onchange="nh7DocStyleV222('underline',this.checked)">${L('زیرخط','Underline','Podcrtano')}</label></div>
  </div></details>
  <details><summary>${L('اعتبارسنجی، QR و امضا','Verification, QR and signature','Provjera, QR i potpis')}</summary><div class="doc-v225-actions"><button class="btn" type="button" onclick="nh7DocUniqueQrV222()">▣ ${L('ساخت QR یکتا','Generate unique QR','Generiraj jedinstveni QR')}</button><button class="btn" type="button" onclick="nh7DocVerifyQrV222()">📱 ${L('آزمایش QR','Test QR','Testiraj QR')}</button><button class="btn" type="button" onclick="nh7DocSignatureV222()">✍ ${L('ثبت امضا','Save signature','Spremi potpis')}</button></div></details>
  <div class="doc-v225-actions"><button class="btn" type="button" onclick="nh7DocSaveTemplateV222()">💾 ${L('ذخیره قالب','Save template','Spremi predložak')}</button><button class="btn" type="button" onclick="nh7DocLoadTemplateV222()">📂 ${L('بارگذاری قالب','Load template','Učitaj predložak')}</button><button class="btn danger-btn" type="button" onclick="nh7DocResetV222()">↺ ${L('بازنشانی','Reset','Poništi')}</button></div></section>`;
}
const oldCertificateTabV225=renderCertificateTab;
renderCertificateTab=function(){const html=oldCertificateTabV225();return String(html).replace('<div class="doc-v222-studio">',buildDocumentStudioV225()+'<div class="doc-v222-studio legacy-doc-v225">')};

// ---------- Persist Inbox deletion; never bring dismissed rows back ----------
const dismissedKey='nh7_admin_dismissed_messages_v225';
const readDismissed=()=>{try{return new Set(JSON.parse(localStorage.getItem(dismissedKey)||'[]'))}catch(_){return new Set()}};
const writeDismissed=s=>localStorage.setItem(dismissedKey,JSON.stringify([...s]));
function messageKey(row){return String(row?.id||[row?.user_email,row?.title,row?.message,row?.created_at].join('|'))}
function filterDismissed(){ensureState();const set=readDismissed();state.messages=state.messages.filter(x=>!set.has(messageKey(x)))}
const oldLoadMessagesV225=loadMessages;
loadMessages=async function(){const result=await oldLoadMessagesV225();filterDismissed();return result};
const oldRenderMessagesV225=renderMessagesTab;
renderMessagesTab=function(){filterDismissed();return oldRenderMessagesV225()};
const oldDeleteMessageV225=window.deleteMessage;
window.deleteMessage=async function(id){ensureState();const row=state.messages.find(x=>String(x.id)===String(id));const set=readDismissed();if(row)set.add(messageKey(row));set.add(String(id));writeDismissed(set);state.messages=state.messages.filter(x=>String(x.id)!==String(id));render();try{return await oldDeleteMessageV225?.(id)}catch(error){console.warn('Message delete server',error)}};

window.NH7_ADMIN_VERSION=V;
})();

/* ============================================================
   New Hope 7 Admin v2.2.6 — active document studio, stable student detail
   and real student activity analytics.  Loaded after all older admin files.
   ============================================================ */
(()=>{'use strict';
const VERSION='2.2.6-final';
const txt=(fa,en,hr)=>{try{return lang==='fa'?fa:lang==='hr'?hr:en}catch(_){return fa}};
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
    fields:{font:'Vazirmatn',size:15,color:'#475569',bold:false,italic:false,underline:false,align:'center',y:0,spacing:0,line:1.55},
    footer:{font:'Vazirmatn',size:11,color:'#64748b',bold:false,italic:false,underline:false,align:'center',y:0,spacing:0,line:1.4}
  }
};
const deep=v=>JSON.parse(JSON.stringify(v));
function mergeDesign(raw){const d=deep(defaults);if(raw&&typeof raw==='object')Object.assign(d,raw);d.styles={...deep(defaults.styles),...(raw?.styles||{})};Object.keys(d.styles).forEach(k=>d.styles[k]={...defaults.styles[k]||defaults.styles.body,...d.styles[k]});return d}
let design=(()=>{try{return mergeDesign(JSON.parse(localStorage.getItem(STORE)||'null'))}catch(_){return deep(defaults)}})();
function saveDesign(){try{localStorage.setItem(STORE,JSON.stringify(design))}catch(_){};requestAnimationFrame(applyDocumentDesignV226)}
function styleText(el,s){if(!el||!s)return;el.style.fontFamily=`"${s.font||'Vazirmatn'}",sans-serif`;el.style.fontSize=`${clamp(s.size,8,90)}px`;el.style.color=s.color||'#1e293b';el.style.fontWeight=s.bold?'800':'400';el.style.fontStyle=s.italic?'italic':'normal';el.style.textDecoration=s.underline?'underline':'none';el.style.textAlign=s.align||'center';el.style.transform=`translateY(${clamp(s.y,-180,180)}px)`;el.style.letterSpacing=`${clamp(s.spacing,-3,12)}px`;el.style.lineHeight=String(clamp(s.line,.8,3));}
const q=(root,list)=>{for(const s of list){const x=root.querySelector(s);if(x)return x}return null};
function targetMap(root){return{
  kicker:q(root,['.doc-v222-kicker','.doc-kicker','.certificate-kicker']),
  title:q(root,['.doc-v222-title','.doc-title','.certificate-title','h1']),
  name:q(root,['.doc-v222-name','.recipient-name','.certificate-name','h2']),
  body:q(root,['.doc-v222-body','.doc-body','.certificate-body','.body-text']),
  fields:q(root,['.doc-v222-fields','.doc-fields','.certificate-meta']),
  footer:q(root,['.doc-v222-footer','.doc-footer','.verification-block'])
}}
function applyDocumentDesignV226(){
  document.querySelectorAll('.doc-v222-paper,.doc-v223-paper,.doc-v224-paper,.certificate-paper,.document-paper').forEach(root=>{
    root.dataset.nh7V226='1';root.dataset.theme=design.theme;root.dataset.orientation=design.orientation;
    root.style.setProperty('--doc-paper',design.paper);root.style.setProperty('--doc-accent',design.accent);root.style.backgroundColor=design.paper;
    if(design.orientation==='portrait'){root.style.aspectRatio='210 / 297'}else root.style.aspectRatio='297 / 210';
    const map=targetMap(root);Object.entries(map).forEach(([k,el])=>styleText(el,design.styles[k]));
    let wm=root.querySelector('.nh7-watermark-v226');if(!wm){wm=document.createElement('div');wm.className='nh7-watermark-v226';wm.setAttribute('aria-hidden','true');wm.textContent='NEW HOPE 7';root.prepend(wm)}
    wm.style.opacity=String(clamp(design.watermarkOpacity,0,.35));wm.style.fontSize=`${clamp(design.watermarkScale,20,120)}px`;wm.style.color=design.accent;
    const placeImage=(cls,data,size,x,y,rot,opacity,round,blend)=>{let el=root.querySelector('.'+cls);if(!data){el?.remove();return}if(!el){el=document.createElement('img');el.className=cls;root.appendChild(el)}el.src=data;Object.assign(el.style,{position:'absolute',width:`${size}px`,height:'auto',left:`${x}%`,top:`${y}%`,transform:`translate(-50%,-50%) rotate(${rot}deg)`,opacity:String(opacity),borderRadius:round?'50%':'0',objectFit:'cover',mixBlendMode:blend||'normal',zIndex:'5'})};
    placeImage('nh7-logo-v226',design.logoData,design.logoSize,design.logoX,design.logoY,design.logoRotate,design.logoOpacity,design.logoRound,design.logoBlend);
    placeImage('nh7-photo-v226',design.photoData,design.photoSize,design.photoX,design.photoY,design.photoRotate,1,design.photoRound>0,'normal');
    placeImage('nh7-signature-img-v226',design.signatureData,130,50,88,0,1,false,'normal');
  })
}
function rerenderCertificates(){saveDesign();try{render()}catch(_){}setTimeout(applyDocumentDesignV226,40)}
function fileData(file,cb){if(!file)return;const r=new FileReader();r.onload=()=>cb(String(r.result||''));r.readAsDataURL(file)}
function fontOptions(active){return ['Vazirmatn','Estedad','Sahel','Shabnam','Gandom','Noto Naskh Arabic','Noto Serif Arabic','Amiri','Scheherazade New','Markazi Text','Cinzel','Cinzel Decorative','Cormorant Garamond','Cormorant SC','EB Garamond','Libre Baskerville','Playfair Display','Merriweather','Crimson Text','Lora','Great Vibes','Marcellus','Spectral','Bodoni Moda'].map(x=>`<option ${x===active?'selected':''}>${x}</option>`).join('')}
function designPanel(){
 const s=design.styles[design.activeTarget]||design.styles.body;
 return `<section class="nh7-doc-studio-v226 panel-card"><div class="nh7-doc-head-v226"><div><h3>🎨 ${txt('استودیوی مدارک رسمی — نسخه فعال','Professional Document Studio — active','Profesionalni studio — aktivan')}</h3><p>${txt('پیش‌نمایش زنده، کنترل مستقل همه متن‌ها، لوگو، عکس، امضا، قالب و QR.','Live preview, independent text controls, logo, photo, signature, templates and QR.','Pregled uživo i potpune kontrole.')}</p></div><button class="btn primary" type="button" onclick="NH7DocV226.fullPreview()">👁 ${txt('پیش‌نمایش تمام‌صفحه','Full-screen preview','Puni pregled')}</button></div>
 <details open><summary>${txt('قالب، صفحه و واترمارک','Template, page and watermark','Predložak, stranica i vodeni žig')}</summary><div class="nh7-doc-grid-v226">
 <label>${txt('قالب','Theme','Tema')}<select onchange="NH7DocV226.set('theme',this.value)">${[['blue_gold',txt('آبی–طلایی رسمی','Formal blue–gold','Službeno plavo-zlatno')],['baptism_water',txt('آب تعمید','Baptism water','Voda krštenja')],['parchment',txt('کاغذ کلاسیک','Classic parchment','Klasični pergament')],['emerald',txt('زمردی خدمتی','Emerald ministry','Smaragdna')],['minimal',txt('مینیمال','Minimal','Minimalno')]].map(x=>`<option value="${x[0]}" ${design.theme===x[0]?'selected':''}>${x[1]}</option>`).join('')}</select></label>
 <label>${txt('جهت صفحه','Orientation','Orijentacija')}<select onchange="NH7DocV226.set('orientation',this.value)"><option value="landscape" ${design.orientation==='landscape'?'selected':''}>${txt('افقی','Landscape','Vodoravno')}</option><option value="portrait" ${design.orientation==='portrait'?'selected':''}>${txt('عمودی','Portrait','Okomito')}</option></select></label>
 <label>${txt('رنگ کاغذ','Paper color','Boja papira')}<input type="color" value="${esc(design.paper)}" onchange="NH7DocV226.set('paper',this.value)"></label><label>${txt('رنگ اصلی','Accent','Glavna boja')}<input type="color" value="${esc(design.accent)}" onchange="NH7DocV226.set('accent',this.value)"></label>
 <label>${txt('شدت واترمارک','Watermark opacity','Prozirnost')}<input type="range" min="0" max="0.3" step="0.005" value="${design.watermarkOpacity}" oninput="NH7DocV226.set('watermarkOpacity',this.value)"></label><label>${txt('اندازه واترمارک','Watermark size','Veličina')}<input type="range" min="20" max="120" value="${design.watermarkScale}" oninput="NH7DocV226.set('watermarkScale',this.value)"></label>
 </div></details>
 <details open><summary>${txt('لوگو و عکس شخص','Logo and recipient photo','Logo i fotografija')}</summary><div class="nh7-doc-grid-v226">
 <label class="file-label">${txt('بارگذاری لوگو','Upload logo','Prenesi logo')}<input type="file" accept="image/*" onchange="NH7DocV226.upload('logo',this.files[0])"></label><label class="file-label">${txt('بارگذاری عکس شخص','Upload recipient photo','Prenesi fotografiju')}<input type="file" accept="image/*" onchange="NH7DocV226.upload('photo',this.files[0])"></label>
 <label>${txt('اندازه لوگو','Logo size','Veličina loga')}<input type="range" min="30" max="220" value="${design.logoSize}" oninput="NH7DocV226.set('logoSize',this.value)"></label><label>Logo X<input type="range" min="0" max="100" value="${design.logoX}" oninput="NH7DocV226.set('logoX',this.value)"></label><label>Logo Y<input type="range" min="0" max="100" value="${design.logoY}" oninput="NH7DocV226.set('logoY',this.value)"></label><label>${txt('چرخش لوگو','Logo rotation','Rotacija')}<input type="range" min="-180" max="180" value="${design.logoRotate}" oninput="NH7DocV226.set('logoRotate',this.value)"></label>
 <label>${txt('اندازه عکس','Photo size','Veličina fotografije')}<input type="range" min="50" max="260" value="${design.photoSize}" oninput="NH7DocV226.set('photoSize',this.value)"></label><label>Photo X<input type="range" min="0" max="100" value="${design.photoX}" oninput="NH7DocV226.set('photoX',this.value)"></label><label>Photo Y<input type="range" min="0" max="100" value="${design.photoY}" oninput="NH7DocV226.set('photoY',this.value)"></label><label>${txt('چرخش عکس','Photo rotation','Rotacija fotografije')}<input type="range" min="-180" max="180" value="${design.photoRotate}" oninput="NH7DocV226.set('photoRotate',this.value)"></label>
 </div></details>
 <details open><summary>${txt('کنترل مستقل متن','Independent text controls','Neovisne kontrole teksta')}</summary><div class="nh7-doc-grid-v226">
 <label>${txt('بخش متن','Text element','Element teksta')}<select onchange="NH7DocV226.target(this.value)">${Object.keys(design.styles).map(k=>`<option value="${k}" ${design.activeTarget===k?'selected':''}>${k}</option>`).join('')}</select></label><label>${txt('فونت','Font','Font')}<select onchange="NH7DocV226.style('font',this.value)">${fontOptions(s.font)}</select></label><label>${txt('اندازه','Size','Veličina')}<input type="number" min="8" max="90" value="${s.size}" onchange="NH7DocV226.style('size',this.value)"></label><label>${txt('رنگ','Color','Boja')}<input type="color" value="${s.color}" onchange="NH7DocV226.style('color',this.value)"></label>
 <label>${txt('جابجایی عمودی','Vertical offset','Okomiti pomak')}<input type="range" min="-180" max="180" value="${s.y}" oninput="NH7DocV226.style('y',this.value)"></label><label>${txt('فاصله حروف','Letter spacing','Razmak slova')}<input type="range" min="-3" max="12" step=".25" value="${s.spacing}" oninput="NH7DocV226.style('spacing',this.value)"></label><label>${txt('ارتفاع خط','Line height','Visina retka')}<input type="range" min=".8" max="3" step=".05" value="${s.line}" oninput="NH7DocV226.style('line',this.value)"></label><label>${txt('چیدمان','Alignment','Poravnanje')}<select onchange="NH7DocV226.style('align',this.value)"><option value="right" ${s.align==='right'?'selected':''}>${txt('راست','Right','Desno')}</option><option value="center" ${s.align==='center'?'selected':''}>${txt('وسط','Center','Sredina')}</option><option value="left" ${s.align==='left'?'selected':''}>${txt('چپ','Left','Lijevo')}</option></select></label>
 <label><input type="checkbox" ${s.bold?'checked':''} onchange="NH7DocV226.style('bold',this.checked)">${txt('ضخیم','Bold','Podebljano')}</label><label><input type="checkbox" ${s.italic?'checked':''} onchange="NH7DocV226.style('italic',this.checked)">${txt('کج','Italic','Kurziv')}</label><label><input type="checkbox" ${s.underline?'checked':''} onchange="NH7DocV226.style('underline',this.checked)">${txt('زیرخط','Underline','Podcrtano')}</label>
 </div></details>
 <details><summary>${txt('امضا، قالب ذخیره‌شده و خروجی','Signature, saved templates and output','Potpis, predlošci i izlaz')}</summary><div class="nh7-signature-wrap-v226"><canvas id="nh7-signature-v226" width="700" height="180"></canvas></div><div class="nh7-doc-actions-v226"><button class="btn" type="button" onclick="NH7DocV226.saveSignature()">✍ ${txt('ذخیره امضا','Save signature','Spremi potpis')}</button><button class="btn" type="button" onclick="NH7DocV226.clearSignature()">⌫ ${txt('پاک کردن امضا','Clear signature','Obriši potpis')}</button><button class="btn" type="button" onclick="NH7DocV226.saveTemplate()">💾 ${txt('ذخیره قالب','Save template','Spremi predložak')}</button><button class="btn" type="button" onclick="NH7DocV226.loadTemplate()">📂 ${txt('بارگذاری قالب','Load template','Učitaj predložak')}</button><button class="btn danger-btn" type="button" onclick="NH7DocV226.reset()">↺ ${txt('بازنشانی','Reset','Poništi')}</button></div></details>
 </section>`
}
function injectPanel(){const host=document.querySelector('.doc-v222-studio,.doc-v223-studio,.doc-v224-studio,.certificate-studio');if(!host||document.querySelector('.nh7-doc-studio-v226'))return;host.insertAdjacentHTML('beforebegin',designPanel());initSignatureV226();applyDocumentDesignV226()}
function initSignatureV226(){const c=document.getElementById('nh7-signature-v226');if(!c||c.dataset.bound)return;c.dataset.bound='1';const ctx=c.getContext('2d');ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=3;ctx.strokeStyle='#0f172a';let drawing=false;const pos=e=>{const r=c.getBoundingClientRect(),p=e.touches?.[0]||e;return{x:(p.clientX-r.left)*c.width/r.width,y:(p.clientY-r.top)*c.height/r.height}};const start=e=>{e.preventDefault();drawing=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y)};const move=e=>{if(!drawing)return;e.preventDefault();const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke()};const end=()=>drawing=false;c.addEventListener('pointerdown',start);c.addEventListener('pointermove',move);window.addEventListener('pointerup',end);c.addEventListener('touchstart',start,{passive:false});c.addEventListener('touchmove',move,{passive:false});c.addEventListener('touchend',end)}
function fullPreview(){applyDocumentDesignV226();const paper=document.querySelector('.doc-v222-paper,.doc-v223-paper,.doc-v224-paper,.certificate-paper,.document-paper');if(!paper){alert(txt('ابتدا یک مدرک را انتخاب یا ایجاد کنید.','Select or create a document first.','Prvo odaberite dokument.'));return}const ov=document.createElement('div');ov.className='nh7-full-preview-v226';const bar=document.createElement('div');bar.className='nh7-full-preview-bar-v226';bar.innerHTML=`<button class="btn danger-btn" type="button" data-close-v226>× ${txt('بستن پیش‌نمایش','Close preview','Zatvori pregled')}</button><button class="btn primary" type="button" data-print-v226>🖨 ${txt('چاپ / PDF','Print / PDF','Ispis / PDF')}</button>`;const clone=paper.cloneNode(true);ov.append(bar,clone);document.body.appendChild(ov);requestAnimationFrame(()=>{ov.classList.add('open');applyDocumentDesignV226()});bar.querySelector('[data-close-v226]').onclick=()=>ov.remove();bar.querySelector('[data-print-v226]').onclick=()=>window.print()}
function makeUniqueQr(){const id=(crypto.randomUUID?.()||('NH7-'+Date.now()+'-'+Math.random().toString(36).slice(2))).toUpperCase();try{certificateDraft.verificationCode=id}catch(_){}try{certificateDraft.verificationUrl=location.origin+location.pathname.replace(/admin\.html.*/,`verify.html?code=${encodeURIComponent(id)}`)}catch(_){}alert(txt('کد اعتبارسنجی یکتا ساخته شد: ','Unique verification code created: ','Jedinstveni kod: ')+id);try{render()}catch(_){}}
window.NH7DocV226={
 set(k,v){design[k]=['logoSize','logoX','logoY','logoRotate','logoOpacity','photoSize','photoX','photoY','photoRotate','watermarkOpacity','watermarkScale'].includes(k)?num(v):v;rerenderCertificates()},
 style(k,v){const s=design.styles[design.activeTarget]||design.styles.body;s[k]=['size','y','spacing','line'].includes(k)?num(v):v;rerenderCertificates()},
 target(v){design.activeTarget=v;saveDesign();try{render()}catch(_){}},upload(kind,file){fileData(file,data=>{design[kind==='logo'?'logoData':'photoData']=data;rerenderCertificates()})},
 reset(){if(confirm(txt('همه تنظیمات طراحی بازنشانی شود؟','Reset all design settings?','Poništiti sve postavke?'))){design=deep(defaults);rerenderCertificates()}},
 fullPreview,makeUniqueQr,
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
requestAnimationFrame(()=>{ensurePreviewExitV227()});
window.NH7_ADMIN_VERSION='2.2.7';
})();
