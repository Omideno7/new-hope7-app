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
