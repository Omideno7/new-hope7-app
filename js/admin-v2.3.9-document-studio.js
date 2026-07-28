/* New Hope 7 Admin v2.3.9 — professional document and certificate studio */
(()=>{'use strict';
const VERSION='2.3.9';
const STORE='nh7_doc_studio_v239';
const L=(fa,en,hr)=>typeof lang!=='undefined'&&lang==='fa'?fa:typeof lang!=='undefined'&&lang==='hr'?hr:en;
const E=value=>typeof h==='function'?h(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clone=value=>JSON.parse(JSON.stringify(value));
const clamp=(value,min,max)=>Math.min(max,Math.max(min,N(value,min)));

const FONT_GROUPS={
  fa:['Vazirmatn','Estedad','Lalezar','Markazi Text','Noto Naskh Arabic','Noto Serif Arabic','Noto Kufi Arabic','Amiri','Scheherazade New'],
  en:['Cinzel','Cinzel Decorative','Cormorant Garamond','Cormorant SC','EB Garamond','Libre Baskerville','Playfair Display','Merriweather','Crimson Text','Lora','Spectral','Bodoni Moda','Marcellus','Great Vibes'],
  system:['Georgia','Times New Roman','Arial','Tahoma','Trebuchet MS']
};
const FONT_LIST=[...new Set([...FONT_GROUPS.fa,...FONT_GROUPS.en,...FONT_GROUPS.system])];
const FONT_URL='https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Bodoni+Moda:ital,wght@0,400;0,600;0,700;1,400&family=Cinzel:wght@400;600;700;800&family=Cinzel+Decorative:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Estedad:wght@300;400;500;600;700;800&family=Great+Vibes&family=Lalezar&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Markazi+Text:wght@400;500;600;700&family=Marcellus&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Noto+Kufi+Arabic:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Noto+Serif+Arabic:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Scheherazade+New:wght@400;500;600;700&family=Spectral:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Vazirmatn:wght@300;400;500;600;700;800&display=swap';
if(!document.querySelector('link[data-nh7-fonts-v239]')){const link=document.createElement('link');link.rel='stylesheet';link.href=FONT_URL;link.dataset.nh7FontsV239='1';document.head.appendChild(link)}

const FIELD_LABELS={
  church:L('نام کلیسا و سربرگ','Church heading','Zaglavlje crkve'),
  title:L('عنوان اصلی','Main title','Glavni naslov'),
  name:L('نام دریافت‌کننده','Recipient name','Ime primatelja'),
  designation:L('عنوان خدمت / دوره / نمره','Designation, course or score','Naziv službe, tečaj ili rezultat'),
  body:L('متن اصلی مدرک','Certificate body','Glavni tekst'),
  date:L('تاریخ صدور','Issue date','Datum izdavanja'),
  signature:L('نام و عنوان امضاکننده','Signer name and title','Ime i naslov potpisnika'),
  seal:L('مهر رسمی','Official seal','Službeni pečat'),
  meta:L('شماره و اطلاعات پایین صفحه','Number and footer information','Broj i podnožje')
};
const THEME_LABELS={
  royal_blue_gold:L('سلطنتی سرمه‌ای و طلایی','Royal navy and gold','Kraljevsko plavo-zlatno'),
  covenant_gold:L('عهد طلایی رسمی','Formal covenant gold','Službeno zlatni savez'),
  emerald_ministry:L('زمردی خدمتی','Emerald ministry','Smaragdna služba'),
  burgundy_classic:L('زرشکی کلاسیک','Classic burgundy','Klasična bordo'),
  baptism_water:L('آبی روشن تعمید','Baptism water blue','Plavo krštenje'),
  marble_official:L('مرمر سفید رسمی','Official white marble','Službeni bijeli mramor'),
  parchment:L('کاغذ کلاسیک','Classic parchment','Klasični pergament'),
  modern_minimal:L('مینیمال مدرن','Modern minimal','Moderno minimalistički'),
  letterhead:L('سربرگ رسمی کلیسا','Official church letterhead','Službeno zaglavlje crkve')
};
const THEME_PRESETS={
  royal_blue_gold:{paper:'#fffdf8',accent:'#102f63',accent2:'#c8a04a',frame:'ornate_double',background:'soft_gradient'},
  covenant_gold:{paper:'#fffaf0',accent:'#6f5219',accent2:'#d2ae58',frame:'classic_gold',background:'parchment'},
  emerald_ministry:{paper:'#fbfffc',accent:'#0c5d50',accent2:'#c8a74d',frame:'ornate_double',background:'soft_gradient'},
  burgundy_classic:{paper:'#fffafb',accent:'#711f35',accent2:'#c8a05d',frame:'royal_corners',background:'soft_gradient'},
  baptism_water:{paper:'#f9fdff',accent:'#155b8e',accent2:'#58a9c8',frame:'ministry_blue',background:'sacred_rays'},
  marble_official:{paper:'#ffffff',accent:'#3b4a5f',accent2:'#a68a55',frame:'clean_line',background:'marble'},
  parchment:{paper:'#fff7dc',accent:'#6b4423',accent2:'#a97833',frame:'classic_gold',background:'parchment'},
  modern_minimal:{paper:'#ffffff',accent:'#263238',accent2:'#7b8c91',frame:'clean_line',background:'clean'},
  letterhead:{paper:'#ffffff',accent:'#0b5faa',accent2:'#16a765',frame:'none',background:'clean'}
};
const FRAME_LABELS={
  ornate_double:L('قاب تشریفاتی دوتایی','Ornate double frame','Ukrasni dvostruki okvir'),
  royal_corners:L('گوشه‌های سلطنتی','Royal corner ornaments','Kraljevski kutovi'),
  classic_gold:L('طلایی کلاسیک','Classic gold frame','Klasični zlatni okvir'),
  ministry_blue:L('آبی خدمتی','Ministry blue frame','Plavi okvir službe'),
  clean_line:L('خطی ساده و شیک','Clean elegant line','Jednostavna elegantna linija'),
  none:L('بدون قاب','No frame','Bez okvira')
};
const BG_LABELS={
  clean:L('ساده','Clean','Čisto'),
  soft_gradient:L('گرادیان بسیار ملایم','Soft gradient','Blagi gradijent'),
  marble:L('مرمر روشن','Light marble','Svijetli mramor'),
  parchment:L('بافت کاغذ','Paper texture','Tekstura papira'),
  sacred_rays:L('پرتوهای بسیار ملایم','Subtle sacred rays','Blage svete zrake')
};

const defaultStyle=(font='Vazirmatn',size=16,color='#1f2937',bold=false)=>({font,size,color,bold,italic:false,underline:false,align:'center',lineHeight:1.45,letterSpacing:0,offsetY:0});
const DEFAULTS={
  theme:'royal_blue_gold',frame:'ornate_double',background:'soft_gradient',orientation:'landscape',paper:'#fffdf8',accent:'#123e69',accent2:'#c59a38',
  watermark:{enabled:true,source:'assets/logo.png',opacity:.055,size:58,x:50,y:50,rotate:0,grayscale:true,blend:'multiply'},
  logo:{enabled:true,source:'assets/logo.png',size:88,x:50,y:9,rotate:0,opacity:1,round:false,blend:'normal'},
  photo:{enabled:false,source:'',size:110,x:9,y:18,rotate:0,round:50,zoom:1},
  signature:{source:'',size:125,x:75,y:82,opacity:1},
  activeField:'title',
  styles:{
    church:defaultStyle('Cinzel',13,'#26415f',true),
    title:defaultStyle('Cinzel',38,'#123e69',true),
    name:defaultStyle('Cormorant Garamond',42,'#172033',true),
    designation:defaultStyle('Markazi Text',23,'#8a641f',true),
    body:{...defaultStyle('Noto Naskh Arabic',17,'#334155',false),lineHeight:1.8},
    date:defaultStyle('Vazirmatn',12,'#475569',false),
    signature:defaultStyle('Vazirmatn',12,'#27364a',true),
    seal:defaultStyle('Cinzel',12,'#8a641f',true),
    meta:defaultStyle('Vazirmatn',9,'#64748b',false)
  }
};
function mergeDesign(raw){
  const out=clone(DEFAULTS);
  if(raw&&typeof raw==='object'){
    for(const key of ['theme','frame','background','orientation','paper','accent','accent2','activeField'])if(raw[key]!=null)out[key]=raw[key];
    out.watermark=Object.assign({},out.watermark,raw.watermark||{});
    out.logo=Object.assign({},out.logo,raw.logo||{});
    out.photo=Object.assign({},out.photo,raw.photo||{});
    out.signature=Object.assign({},out.signature,raw.signature||{});
    out.styles=Object.assign({},out.styles,raw.styles||{});
    Object.keys(out.styles).forEach(key=>out.styles[key]=Object.assign({},DEFAULTS.styles[key]||defaultStyle(),out.styles[key]||{}));
  }
  return out;
}
let design=(()=>{try{return mergeDesign(JSON.parse(localStorage.getItem(STORE)||'null'))}catch(_){return mergeDesign()}})();
let templates=[];
let templatesLoaded=false;
let templatesBusy=false;
const persist=()=>localStorage.setItem(STORE,JSON.stringify(design));
const option=(value,label,current)=>`<option value="${E(value)}" ${String(value)===String(current)?'selected':''}>${E(label)}</option>`;
const yesNo=(value)=>`${option('1',L('نمایش داده شود','Show','Prikaži'),value?'1':'0')}${option('0',L('مخفی شود','Hide','Sakrij'),value?'1':'0')}`;
function currentStyle(){const key=design.activeField||'title';design.styles[key]=Object.assign({},DEFAULTS.styles[key]||defaultStyle(),design.styles[key]||{});return design.styles[key]}
function rpcData(value){let out=value;for(let i=0;i<4&&Array.isArray(out)&&out.length===1;i++)out=out[0];return out||{}}
function serializedDesign(){
  const out=clone(design);
  out.version=VERSION;out.layout=design.orientation;out.theme=design.theme;
  out.logoUrl=design.logo.source||'assets/logo.png';
  out.photoUrl=design.photo.source||'';out.signatureUrl=design.signature.source||'';
  out.watermarkOpacity=N(design.watermark.opacity,.055);
  out.church=Object.assign({name:'NEW HOPE 7 CHURCH'},out.church||{});
  out.styles=Object.assign({},design.styles||{});
  out.styles.fields=Object.assign({},design.styles.date||design.styles.meta||{});
  return out;
}

function studioHtml(){
  const s=currentStyle();
  const cloudOptions=templates.map(t=>option(t.id,t['name_'+(typeof lang!=='undefined'?lang:'fa')]||t.name_fa||t.name_en||t.template_code,'' )).join('');
  return `<section class="panel-card nh7-doc-studio-v239">
    <div class="req-head"><div><h3>🎨 ${E(L('استودیوی حرفه‌ای مدارک ۲.۳.۹','Professional Document Studio 2.3.9','Profesionalni studio dokumenata 2.3.9'))}</h3><p class="muted small">${E(L('قاب، پس‌زمینه، لوگو، واترمارک و هر فیلد متن به‌صورت مستقل تنظیم می‌شود و پیش‌نمایش چاپ دقیقاً با همان طراحی نمایش داده می‌شود.','Frames, background, logo, watermark, and every text field are independently editable with an accurate print preview.','Okvir, pozadina, logo, vodeni žig i svako tekstualno polje uređuju se zasebno.'))}</p></div><button type="button" class="btn primary" onclick="NH7Doc239.fullPreview()">👁 ${E(L('پیش‌نمایش چاپ','Print preview','Pregled ispisa'))}</button></div>

    <details open><summary>🖼 <strong>${E(L('صفحه، قاب و پس‌زمینه','Page, frame and background','Stranica, okvir i pozadina'))}</strong></summary><div class="nh7-v239-grid">
      <label>${E(L('جهت صفحه','Orientation','Orijentacija'))}<select onchange="NH7Doc239.set('orientation',this.value)">${option('landscape','A4 '+L('افقی','Landscape','Vodoravno'),design.orientation)}${option('portrait','A4 '+L('عمودی','Portrait','Okomito'),design.orientation)}</select></label>
      <label>${E(L('تم اصلی','Main theme','Glavna tema'))}<select onchange="NH7Doc239.set('theme',this.value)">${Object.entries(THEME_LABELS).map(([k,v])=>option(k,v,design.theme)).join('')}</select></label>
      <label>${E(L('قاب','Frame','Okvir'))}<select onchange="NH7Doc239.set('frame',this.value)">${Object.entries(FRAME_LABELS).map(([k,v])=>option(k,v,design.frame)).join('')}</select></label>
      <label>${E(L('بافت پس‌زمینه','Background texture','Tekstura pozadine'))}<select onchange="NH7Doc239.set('background',this.value)">${Object.entries(BG_LABELS).map(([k,v])=>option(k,v,design.background)).join('')}</select></label>
      <label>${E(L('رنگ کاغذ','Paper color','Boja papira'))}<input type="color" value="${E(design.paper)}" oninput="NH7Doc239.live('paper',this.value)"></label>
      <label>${E(L('رنگ اصلی','Primary color','Glavna boja'))}<input type="color" value="${E(design.accent)}" oninput="NH7Doc239.live('accent',this.value)"></label>
      <label>${E(L('رنگ طلایی / مکمل','Secondary color','Dodatna boja'))}<input type="color" value="${E(design.accent2)}" oninput="NH7Doc239.live('accent2',this.value)"></label>
    </div></details>

    <details open><summary>⛪ <strong>${E(L('لوگوی کلیسا و واترمارک پس‌زمینه','Church logo and background watermark','Logo crkve i pozadinski vodeni žig'))}</strong></summary>
      <div class="nh7-v239-subtitle">${E(L('لوگوی رنگی بالای مدرک','Header logo','Logo u zaglavlju'))}</div><div class="nh7-v239-grid">
        <label>${E(L('نمایش لوگو','Show logo','Prikaži logo'))}<select onchange="NH7Doc239.logo('enabled',this.value==='1')">${yesNo(design.logo.enabled)}</select></label>
        <label>${E(L('آپلود لوگوی جدید','Upload custom logo','Prenesi prilagođeni logo'))}<input type="file" accept="image/*" onchange="NH7Doc239.image(this,'logo')"></label>
        <label>${E(L('اندازه لوگو','Logo size','Veličina logotipa'))}<input type="range" min="30" max="220" value="${N(design.logo.size,88)}" oninput="NH7Doc239.logoLive('size',this.value)"></label>
        <label>${E(L('شفافیت لوگو','Logo opacity','Prozirnost logotipa'))}<input type="range" min="0.1" max="1" step="0.05" value="${N(design.logo.opacity,1)}" oninput="NH7Doc239.logoLive('opacity',this.value)"></label>
        <label>${E(L('چپ و راست','Left / right','Lijevo / desno'))}<input type="range" min="0" max="100" value="${N(design.logo.x,50)}" oninput="NH7Doc239.logoLive('x',this.value)"></label>
        <label>${E(L('بالا و پایین','Up / down','Gore / dolje'))}<input type="range" min="0" max="35" value="${N(design.logo.y,9)}" oninput="NH7Doc239.logoLive('y',this.value)"></label>
        <label>${E(L('چرخش','Rotation','Rotacija'))}<input type="range" min="-180" max="180" value="${N(design.logo.rotate,0)}" oninput="NH7Doc239.logoLive('rotate',this.value)"></label>
        <label>${E(L('شکل لوگو','Logo shape','Oblik logotipa'))}<select onchange="NH7Doc239.logo('round',this.value==='1')">${option('0',L('عادی','Normal','Normalno'),design.logo.round?'1':'0')}${option('1',L('گرد','Circular','Kružno'),design.logo.round?'1':'0')}</select></label>
      </div>
      <div class="nh7-v239-subtitle">${E(L('واترمارک کم‌رنگ در پس‌زمینه','Faded background watermark','Izblijedjeli vodeni žig u pozadini'))}</div><div class="nh7-v239-grid">
        <label>${E(L('نمایش واترمارک','Show watermark','Prikaži vodeni žig'))}<select onchange="NH7Doc239.watermark('enabled',this.value==='1')">${yesNo(design.watermark.enabled)}</select></label>
        <label>${E(L('شفافیت واترمارک','Watermark opacity','Prozirnost vodenog žiga'))}<input type="range" min="0" max="0.28" step="0.005" value="${N(design.watermark.opacity,.055)}" oninput="NH7Doc239.watermarkLive('opacity',this.value)"></label>
        <label>${E(L('اندازه واترمارک','Watermark size','Veličina vodenog žiga'))}<input type="range" min="15" max="125" value="${N(design.watermark.size,58)}" oninput="NH7Doc239.watermarkLive('size',this.value)"></label>
        <label>${E(L('چپ و راست','Left / right','Lijevo / desno'))}<input type="range" min="0" max="100" value="${N(design.watermark.x,50)}" oninput="NH7Doc239.watermarkLive('x',this.value)"></label>
        <label>${E(L('بالا و پایین','Up / down','Gore / dolje'))}<input type="range" min="0" max="100" value="${N(design.watermark.y,50)}" oninput="NH7Doc239.watermarkLive('y',this.value)"></label>
        <label>${E(L('چرخش واترمارک','Watermark rotation','Rotacija vodenog žiga'))}<input type="range" min="-180" max="180" value="${N(design.watermark.rotate,0)}" oninput="NH7Doc239.watermarkLive('rotate',this.value)"></label>
        <label>${E(L('حالت رنگ','Color mode','Način boje'))}<select onchange="NH7Doc239.watermark('grayscale',this.value==='1')">${option('1',L('خاکستری و رسمی','Grayscale','Sivi tonovi'),design.watermark.grayscale?'1':'0')}${option('0',L('رنگی','Color','U boji'),design.watermark.grayscale?'1':'0')}</select></label>
        <label>${E(L('ترکیب با کاغذ','Blend mode','Način stapanja'))}<select onchange="NH7Doc239.watermark('blend',this.value)">${option('multiply',L('هماهنگ با کاغذ','Multiply','Stapanje'),design.watermark.blend)}${option('normal',L('عادی','Normal','Normalno'),design.watermark.blend)}${option('soft-light',L('نور ملایم','Soft light','Blago svjetlo'),design.watermark.blend)}</select></label>
      </div>
    </details>

    <details open><summary>🔤 <strong>${E(L('فونت، اندازه، رنگ و جای مستقل هر فیلد','Independent font, size, color and position','Neovisni font, veličina, boja i položaj'))}</strong></summary><div class="nh7-v239-grid nh7-v239-style-grid">
      <label>${E(L('فیلد موردنظر','Text field','Tekstualno polje'))}<select onchange="NH7Doc239.field(this.value)">${Object.entries(FIELD_LABELS).map(([k,v])=>option(k,v,design.activeField)).join('')}</select></label>
      <label>${E(L('نوع فونت','Font family','Vrsta fonta'))}<select onchange="NH7Doc239.style('font',this.value)">${FONT_LIST.map(f=>option(f,f,s.font)).join('')}</select></label>
      <label>${E(L('اندازه فونت','Font size','Veličina fonta'))}<input type="number" min="7" max="90" value="${N(s.size,16)}" onchange="NH7Doc239.style('size',this.value)"></label>
      <label>${E(L('رنگ متن','Text color','Boja teksta'))}<input type="color" value="${E(s.color||'#1f2937')}" oninput="NH7Doc239.styleLive('color',this.value)"></label>
      <label>${E(L('تراز','Alignment','Poravnanje'))}<select onchange="NH7Doc239.style('align',this.value)">${option('start',L('شروع / راست','Start','Početak'),s.align)}${option('center',L('وسط','Center','Sredina'),s.align)}${option('end',L('پایان / چپ','End','Kraj'),s.align)}</select></label>
      <label>${E(L('فاصله خطوط','Line height','Prored'))}<input type="range" min="0.8" max="2.8" step="0.05" value="${N(s.lineHeight,1.45)}" oninput="NH7Doc239.styleLive('lineHeight',this.value)"></label>
      <label>${E(L('فاصله حروف','Letter spacing','Razmak slova'))}<input type="range" min="-2" max="10" step="0.25" value="${N(s.letterSpacing,0)}" oninput="NH7Doc239.styleLive('letterSpacing',this.value)"></label>
      <label>${E(L('بالا و پایین بردن','Move up / down','Pomak gore / dolje'))}<input type="range" min="-100" max="120" value="${N(s.offsetY,0)}" oninput="NH7Doc239.styleLive('offsetY',this.value)"></label>
      <div class="nh7-v239-toggle-row"><button type="button" class="nh7-v239-toggle ${s.bold?'active':''}" onclick="NH7Doc239.style('bold',${!s.bold})"><b>B</b></button><button type="button" class="nh7-v239-toggle ${s.italic?'active':''}" onclick="NH7Doc239.style('italic',${!s.italic})"><i>I</i></button><button type="button" class="nh7-v239-toggle ${s.underline?'active':''}" onclick="NH7Doc239.style('underline',${!s.underline})"><u>U</u></button></div>
    </div><div class="nh7-v239-font-preview" style="font-family:'${E(s.font)}';font-size:${clamp(s.size,7,90)}px;color:${E(s.color)};font-weight:${s.bold?800:400};font-style:${s.italic?'italic':'normal'}">${E(L('نمونه زنده فارسی — English — Hrvatski','Live preview فارسی — English — Hrvatski','Pregled فارسی — English — Hrvatski'))}</div></details>

    <details><summary>👤 <strong>${E(L('عکس شخص و امضای دستی','Recipient photo and handwritten signature','Fotografija i vlastoručni potpis'))}</strong></summary><div class="nh7-v239-grid">
      <label>${E(L('آپلود عکس شخص','Upload recipient photo','Prenesi fotografiju'))}<input type="file" accept="image/*" onchange="NH7Doc239.image(this,'photo')"></label>
      <label>${E(L('نمایش عکس','Show photo','Prikaži fotografiju'))}<select onchange="NH7Doc239.photo('enabled',this.value==='1')">${yesNo(design.photo.enabled)}</select></label>
      <label>${E(L('اندازه عکس','Photo size','Veličina fotografije'))}<input type="range" min="45" max="220" value="${N(design.photo.size,110)}" oninput="NH7Doc239.photoLive('size',this.value)"></label>
      <label>${E(L('چپ و راست عکس','Photo left / right','Fotografija lijevo / desno'))}<input type="range" min="0" max="100" value="${N(design.photo.x,9)}" oninput="NH7Doc239.photoLive('x',this.value)"></label>
      <label>${E(L('بالا و پایین عکس','Photo up / down','Fotografija gore / dolje'))}<input type="range" min="0" max="100" value="${N(design.photo.y,18)}" oninput="NH7Doc239.photoLive('y',this.value)"></label>
      <label>${E(L('گردی قاب عکس','Photo corner radius','Zaobljenost fotografije'))}<input type="range" min="0" max="50" value="${N(design.photo.round,50)}" oninput="NH7Doc239.photoLive('round',this.value)"></label>
    </div><canvas id="nh7-v239-signature-pad" class="nh7-v239-signature-pad"></canvas><div class="actions"><button type="button" class="btn primary" onclick="NH7Doc239.saveSignature()">✓ ${E(L('ذخیره امضا','Save signature','Spremi potpis'))}</button><button type="button" class="btn ghost" onclick="NH7Doc239.clearSignature()">${E(L('پاک‌کردن امضا','Clear signature','Očisti potpis'))}</button><button type="button" class="btn danger-btn" onclick="NH7Doc239.clearPhoto()">${E(L('حذف عکس','Remove photo','Ukloni fotografiju'))}</button></div></details>

    <details><summary>💾 <strong>${E(L('قالب‌های ابری، پشتیبان و بازنشانی','Cloud templates, backup and reset','Predlošci u oblaku, sigurnosna kopija i resetiranje'))}</strong></summary>
      <div class="nh7-v239-template-row"><select id="nh7-v239-template-select"><option value="">${E(L('انتخاب قالب ذخیره‌شده','Choose saved template','Odaberi spremljeni predložak'))}</option>${cloudOptions}</select><button type="button" class="btn secondary" onclick="NH7Doc239.loadTemplate()">${E(L('بارگذاری قالب','Load template','Učitaj predložak'))}</button><button type="button" class="btn primary" onclick="NH7Doc239.saveTemplate()">${E(L('ذخیره قالب فعلی در ابر','Save current template to cloud','Spremi predložak u oblak'))}</button></div>
      <div class="actions"><button type="button" class="btn ghost" onclick="NH7Doc239.exportDesign()">⬇ ${E(L('خروجی فایل طراحی','Export design file','Izvezi dizajn'))}</button><label class="btn ghost nh7-v239-import">⬆ ${E(L('ورود فایل طراحی','Import design file','Uvezi dizajn'))}<input type="file" accept="application/json,.json" onchange="NH7Doc239.importDesign(this)"></label><button type="button" class="btn danger-btn" onclick="NH7Doc239.reset()">↺ ${E(L('بازنشانی کامل','Reset all','Vrati sve'))}</button></div>
    </details>

    <div class="nh7-v239-actions"><button type="button" class="btn primary" onclick="NH7Doc239.fullPreview()">👁 ${E(L('پیش‌نمایش چاپ','Print preview','Pregled ispisa'))}</button><button type="button" class="btn secondary" onclick="NH7Doc239.saveIssued(false)">💾 ${E(L('ذخیره طراحی روی مدرک انتخاب‌شده','Save design to selected certificate','Spremi dizajn na odabranu potvrdu'))}</button><button type="button" class="btn ghost" onclick="NH7Doc239.loadIssued()">↥ ${E(L('بارگذاری طراحی مدرک انتخاب‌شده','Load selected certificate design','Učitaj dizajn odabrane potvrde'))}</button></div>
  </section>`;
}

function stripOldStudios(html){
  const holder=document.createElement('div');holder.innerHTML=String(html||'');
  holder.querySelectorAll('.nh7-doc-studio-v226,.doc-v225-studio,.doc-v223-studio,.doc-v222-editor,.nh7-doc-studio-v239').forEach(node=>node.remove());
  return holder.innerHTML;
}
function targetNodes(preview,key){
  if(key==='church')return preview.querySelectorAll('.certificate-kicker');
  if(key==='title')return preview.querySelectorAll('.certificate-title');
  if(key==='name')return preview.querySelectorAll('.certificate-name');
  if(key==='designation')return preview.querySelectorAll('.certificate-designation,.certificate-score');
  if(key==='body')return preview.querySelectorAll('.certificate-body-custom');
  if(key==='date')return preview.querySelectorAll('.certificate-footer .certificate-sign:first-child');
  if(key==='signature')return preview.querySelectorAll('.certificate-footer .certificate-sign:last-child');
  if(key==='seal')return preview.querySelectorAll('.certificate-seal');
  return preview.querySelectorAll('.certificate-meta');
}
function applyStyle(node,style){
  node.style.fontFamily=`'${style.font||'inherit'}'`;
  node.style.fontSize=`${clamp(style.size,7,90)}px`;
  node.style.color=style.color||'#1f2937';
  node.style.fontWeight=style.bold?'800':'400';
  node.style.fontStyle=style.italic?'italic':'normal';
  node.style.textDecoration=style.underline?'underline':'none';
  node.style.textAlign=style.align||'center';
  node.style.lineHeight=String(N(style.lineHeight,1.45));
  node.style.letterSpacing=`${N(style.letterSpacing,0)}px`;
  node.style.transform=`translateY(${N(style.offsetY,0)}px)`;
}
function ensureImage(preview,className,source){
  let image=preview.querySelector('.'+className);
  if(!source){image?.remove();return null}
  if(!image){image=document.createElement('img');image.className=className;image.alt='';preview.appendChild(image)}
  image.src=source;return image;
}
function applyDesign(root=document){
  root.querySelectorAll?.('.certificate-preview').forEach(preview=>{
    preview.dataset.nh7V239Theme=design.theme;
    preview.dataset.nh7V239Frame=design.frame;
    preview.dataset.nh7V239Background=design.background;
    preview.dataset.nh7V239Orientation=design.orientation;
    preview.style.setProperty('--v239-paper',design.paper);
    preview.style.setProperty('--v239-accent',design.accent);
    preview.style.setProperty('--v239-accent-2',design.accent2);
    const logo=preview.querySelector('.certificate-logo');
    if(logo){
      logo.src=design.logo.source||'assets/logo.png';
      logo.style.display=design.logo.enabled?'block':'none';
      logo.style.position='absolute';logo.style.left=`${N(design.logo.x,50)}%`;logo.style.top=`${N(design.logo.y,9)}%`;
      logo.style.width=`${N(design.logo.size,88)}px`;logo.style.height=`${N(design.logo.size,88)}px`;
      logo.style.opacity=String(N(design.logo.opacity,1));logo.style.borderRadius=design.logo.round?'50%':'12px';logo.style.mixBlendMode=design.logo.blend||'normal';
      logo.style.transform=`translate(-50%,-50%) rotate(${N(design.logo.rotate,0)}deg)`;
    }
    const watermark=ensureImage(preview,'nh7-v239-watermark',design.watermark.enabled?(design.watermark.source||design.logo.source||'assets/logo.png'):'');
    if(watermark){Object.assign(watermark.style,{left:`${N(design.watermark.x,50)}%`,top:`${N(design.watermark.y,50)}%`,width:`${N(design.watermark.size,58)}%`,opacity:String(N(design.watermark.opacity,.055)),transform:`translate(-50%,-50%) rotate(${N(design.watermark.rotate,0)}deg)`,filter:design.watermark.grayscale?'grayscale(1)':'none',mixBlendMode:design.watermark.blend||'multiply'})}
    const photo=ensureImage(preview,'nh7-v239-photo',design.photo.enabled?design.photo.source:'');
    if(photo){Object.assign(photo.style,{left:`${N(design.photo.x,9)}%`,top:`${N(design.photo.y,18)}%`,width:`${N(design.photo.size,110)}px`,height:`${N(design.photo.size,110)}px`,borderRadius:`${N(design.photo.round,50)}%`,transform:`translate(-50%,-50%) rotate(${N(design.photo.rotate,0)}deg) scale(${N(design.photo.zoom,1)})`})}
    const signature=ensureImage(preview,'nh7-v239-signature',design.signature.source||'');
    if(signature){Object.assign(signature.style,{left:`${N(design.signature.x,75)}%`,top:`${N(design.signature.y,82)}%`,width:`${N(design.signature.size,125)}px`,opacity:String(N(design.signature.opacity,1)),transform:'translate(-50%,-50%)'})}
    Object.entries(design.styles||{}).forEach(([key,style])=>targetNodes(preview,key).forEach(node=>applyStyle(node,style)));
  });
}
function rerender(){persist();if(typeof render==='function')render();else applyDesign()}
function live(){persist();applyDesign()}

async function resizeImage(file,max=900){
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(reader.error);reader.onload=()=>{const image=new Image();image.onerror=()=>resolve(String(reader.result||''));image.onload=()=>{const scale=Math.min(1,max/Math.max(image.naturalWidth||max,image.naturalHeight||max)),w=Math.max(1,Math.round((image.naturalWidth||max)*scale)),h=Math.max(1,Math.round((image.naturalHeight||max)*scale)),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(image,0,0,w,h);resolve(canvas.toDataURL('image/png',.92))};image.src=String(reader.result||'')};reader.readAsDataURL(file)});
}
async function loadTemplates(redraw=true){
  if(templatesBusy||typeof token==='undefined'||!token)return;
  templatesBusy=true;
  try{const raw=await adminRpc('nh7_admin_list_document_templates_v239',{}),data=rpcData(raw);templates=Array.isArray(data)?data:Array.isArray(data.rows)?data.rows:[];templatesLoaded=true}catch(error){console.warn('Load document templates v2.3.9',error)}finally{templatesBusy=false;if(redraw&&typeof render==='function')render()}
}
async function saveIssued(silent=false){
  const id=String(typeof nh7SelectedCertificateId!=='undefined'?nh7SelectedCertificateId:'').trim();
  if(!id){if(!silent)alert(L('ابتدا یک مدرک صادرشده را انتخاب کنید.','Select an issued certificate first.','Najprije odaberite izdanu potvrdu.'));return false}
  try{
    const raw=await adminRpc('nh7_admin_save_certificate_design_v239',{p_certificate_id:id,p_design:serializedDesign(),p_layout:design.orientation,p_logo_url:String(design.logo.source||'assets/logo.png').startsWith('data:')?'assets/logo.png':String(design.logo.source||'assets/logo.png')}),row=rpcData(raw);
    const index=(state.schoolCertificates||[]).findIndex(x=>String(x.id)===id);if(index>=0&&row&&row.id)state.schoolCertificates[index]=row;
    if(!silent)alert(L('طراحی روی مدرک ذخیره شد.','Design was saved to the certificate.','Dizajn je spremljen na potvrdu.'));
    return true;
  }catch(error){if(!silent)alert(error?.message||String(error));else console.warn(error);return false}
}
function loadIssued(){
  const id=String(typeof nh7SelectedCertificateId!=='undefined'?nh7SelectedCertificateId:'').trim(),row=(state.schoolCertificates||[]).find(x=>String(x.id)===id);
  if(!row){alert(L('ابتدا یک مدرک صادرشده را انتخاب کنید.','Select an issued certificate first.','Najprije odaberite izdanu potvrdu.'));return}
  design=mergeDesign(row.design||{});if(row.layout)design.orientation=row.layout;if(row.logo_url&&!String(row.logo_url).startsWith('data:')){design.logo.source=row.logo_url;design.watermark.source=row.logo_url}rerender();
}
function fullPreview(){
  const source=document.querySelector('#certificatePrintTarget .certificate-preview');
  if(!source){alert(L('ابتدا یک مدرک را برای پیش‌نمایش انتخاب کنید.','Select a certificate to preview first.','Najprije odaberite potvrdu za pregled.'));return}
  document.querySelector('.nh7-v239-preview-overlay')?.remove();
  const overlay=document.createElement('div');overlay.className='nh7-v239-preview-overlay';
  overlay.innerHTML=`<div class="nh7-v239-preview-toolbar"><button type="button" class="btn danger-btn" data-close>× ${E(L('بستن و بازگشت','Close and return','Zatvori i vrati se'))}</button><label>${E(L('اندازه نمایش','Preview scale','Veličina pregleda'))}<input type="range" min="45" max="110" value="78" data-scale></label><button type="button" class="btn primary" data-print>🖨 ${E(L('چاپ / ذخیره PDF','Print / Save PDF','Ispis / PDF'))}</button></div><div class="nh7-v239-preview-stage"><div class="nh7-v239-preview-sheet">${source.outerHTML}</div></div>`;
  document.body.appendChild(overlay);document.body.classList.add('nh7-v239-preview-open');
  const close=()=>{overlay.remove();document.body.classList.remove('nh7-v239-preview-open')};
  overlay.querySelector('[data-close]').onclick=close;overlay.querySelector('[data-print]').onclick=()=>window.print();overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
  const sheet=overlay.querySelector('.nh7-v239-preview-sheet'),scale=overlay.querySelector('[data-scale]');scale.oninput=()=>sheet.style.setProperty('--v239-preview-scale',String(N(scale.value,78)/100));
  applyDesign(overlay);
}
function initSignature(){
  const canvas=document.getElementById('nh7-v239-signature-pad');if(!canvas||canvas.dataset.ready)return;canvas.dataset.ready='1';
  const ratio=Math.max(1,window.devicePixelRatio||1),rect=canvas.getBoundingClientRect(),width=Math.max(320,Math.round(rect.width||620)),height=170;canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);ctx.lineWidth=2.4;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#102033';let drawing=false;
  const point=e=>{const r=canvas.getBoundingClientRect(),p=e.touches?.[0]||e;return{x:p.clientX-r.left,y:p.clientY-r.top}};
  const start=e=>{drawing=true;const p=point(e);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault()};const move=e=>{if(!drawing)return;const p=point(e);ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault()};const stop=e=>{drawing=false;e.preventDefault()};
  canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);canvas.addEventListener('pointerleave',stop);
  if(design.signature.source){const image=new Image();image.onload=()=>ctx.drawImage(image,0,0,width,height);image.src=design.signature.source}
}

const previousRenderCertificates=typeof renderCertificates==='function'?renderCertificates:null;
if(previousRenderCertificates){renderCertificates=function(){
  try{
    if((typeof nh7SelectedCertificateId!=='undefined')&&!String(nh7SelectedCertificateId||'').trim()&&Array.isArray(state.schoolCertificates)&&state.schoolCertificates.length){
      const latest=state.schoolCertificates.slice().sort((a,b)=>String(b.updated_at||b.created_at||'').localeCompare(String(a.updated_at||a.created_at||'')))[0];
      if(latest?.id)nh7SelectedCertificateId=latest.id;
    }
  }catch(_){}
  return studioHtml()+stripOldStudios(previousRenderCertificates());
}}
const previousRender=typeof render==='function'?render:null;
if(previousRender){render=function(){const result=previousRender();requestAnimationFrame(()=>{applyDesign();initSignature();if(!templatesLoaded&&!templatesBusy&&typeof token!=='undefined'&&token)loadTemplates(false);const badge=document.querySelector('.nh7-admin-version-v235');if(badge)badge.textContent='v'+VERSION});return result}}

function certificateFingerprint(id){const row=(state.schoolCertificates||[]).find(x=>String(x.id)===String(id));return row?String(row.updated_at||row.approved_at||row.created_at||''):''}
const previousIssueSchool=typeof issueCertificate==='function'?issueCertificate:null;
if(previousIssueSchool){issueCertificate=async function(){const beforeId=String(typeof nh7SelectedCertificateId!=='undefined'?nh7SelectedCertificateId:''),beforeStamp=certificateFingerprint(beforeId);await previousIssueSchool();const afterId=String(typeof nh7SelectedCertificateId!=='undefined'?nh7SelectedCertificateId:'');if(afterId&&(afterId!==beforeId||certificateFingerprint(afterId)!==beforeStamp))await saveIssued(true)}}
const previousIssueManual=typeof nh7IssueManualCertificate==='function'?nh7IssueManualCertificate:null;
if(previousIssueManual){nh7IssueManualCertificate=async function(){const beforeId=String(typeof nh7SelectedCertificateId!=='undefined'?nh7SelectedCertificateId:''),beforeStamp=certificateFingerprint(beforeId);await previousIssueManual();const afterId=String(typeof nh7SelectedCertificateId!=='undefined'?nh7SelectedCertificateId:'');if(afterId&&(afterId!==beforeId||certificateFingerprint(afterId)!==beforeStamp))await saveIssued(true)}}
const previousSelectIssued=typeof nh7SelectIssuedCertificate==='function'?nh7SelectIssuedCertificate:null;
if(previousSelectIssued){nh7SelectIssuedCertificate=function(id){const row=(state.schoolCertificates||[]).find(x=>String(x.id)===String(id));if(row?.design&&Object.keys(row.design).length){design=mergeDesign(row.design);if(row.layout)design.orientation=row.layout;if(row.logo_url&&!String(row.logo_url).startsWith('data:')){design.logo.source=row.logo_url;design.watermark.source=row.logo_url}persist()}return previousSelectIssued(id)}}

const previousPublicUrl=typeof nh7CertificatePublicUrl==='function'?nh7CertificatePublicUrl:null;
if(previousPublicUrl){nh7CertificatePublicUrl=function(row){
  if(!row?.public_token)return previousPublicUrl(row);
  const url=new URL('certificate-v239.html',location.href);url.searchParams.set('token',String(row.public_token));return url.href;
}}

window.NH7Doc239={
  set(key,value){design[key]=value;if(key==='theme'&&THEME_PRESETS[value])Object.assign(design,clone(THEME_PRESETS[value]));rerender()},
  live(key,value){design[key]=value;live()},
  field(key){design.activeField=key;rerender()},
  style(key,value){const s=currentStyle();s[key]=['size','lineHeight','letterSpacing','offsetY'].includes(key)?N(value):value;rerender()},
  styleLive(key,value){const s=currentStyle();s[key]=['size','lineHeight','letterSpacing','offsetY'].includes(key)?N(value):value;live()},
  logo(key,value){design.logo[key]=value;if(key==='source')design.watermark.source=value;rerender()},logoLive(key,value){design.logo[key]=['size','x','y','rotate','opacity'].includes(key)?N(value):value;live()},
  watermark(key,value){design.watermark[key]=value;rerender()},watermarkLive(key,value){design.watermark[key]=['opacity','size','x','y','rotate'].includes(key)?N(value):value;live()},
  photo(key,value){design.photo[key]=value;rerender()},photoLive(key,value){design.photo[key]=['size','x','y','rotate','round','zoom'].includes(key)?N(value):value;live()},
  async image(input,target){const file=input?.files?.[0];if(!file)return;try{const data=await resizeImage(file,target==='logo'?900:1100);if(target==='logo'){design.logo.source=data;design.watermark.source=data;design.logo.enabled=true;design.watermark.enabled=true}else{design.photo.source=data;design.photo.enabled=true}rerender()}catch(error){alert(error?.message||String(error))}},
  clearPhoto(){design.photo.source='';design.photo.enabled=false;rerender()},
  saveSignature(){const canvas=document.getElementById('nh7-v239-signature-pad');if(!canvas)return;design.signature.source=canvas.toDataURL('image/png');rerender()},
  clearSignature(){design.signature.source='';rerender()},
  fullPreview,saveIssued,loadIssued,
  async saveTemplate(){const name=prompt(L('نام قالب را بنویسید:','Template name:','Naziv predloška:'),L('قالب رسمی کلیسا','Official church template','Službeni crkveni predložak'));if(!name)return;const code='custom_'+Date.now();try{await adminRpc('nh7_admin_save_document_template_v239',{p_template_code:code,p_name_fa:name,p_name_en:name,p_name_hr:name,p_layout:design.orientation,p_design:serializedDesign(),p_logo_url:String(design.logo.source||'assets/logo.png').startsWith('data:')?'assets/logo.png':String(design.logo.source||'assets/logo.png')});await loadTemplates(true);alert(L('قالب در فضای ابری ذخیره شد.','Template saved to the cloud.','Predložak je spremljen u oblak.'))}catch(error){alert(error?.message||String(error))}},
  loadTemplate(){const id=document.getElementById('nh7-v239-template-select')?.value,row=templates.find(x=>String(x.id)===String(id));if(!row)return;design=mergeDesign(row.design||{});if(row.layout)design.orientation=row.layout;if(row.logo_url&&!String(row.logo_url).startsWith('data:')){design.logo.source=row.logo_url;design.watermark.source=row.logo_url}rerender()},
  exportDesign(){const blob=new Blob([JSON.stringify({version:VERSION,design},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='new-hope-7-document-design-v239.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)},
  importDesign(input){const file=input?.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(String(reader.result||'{}'));design=mergeDesign(data.design||data);rerender()}catch(error){alert(L('فایل طراحی معتبر نیست.','Invalid design file.','Datoteka dizajna nije valjana.'))}};reader.readAsText(file)},
  reset(){if(!confirm(L('تمام تنظیمات طراحی بازنشانی شود؟','Reset all design settings?','Vratiti sve postavke dizajna?')))return;design=mergeDesign();rerender()}
};
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.querySelector('.nh7-v239-preview-overlay')){document.querySelector('.nh7-v239-preview-overlay')?.remove();document.body.classList.remove('nh7-v239-preview-open')}},true);
setTimeout(()=>{applyDesign();initSignature();if(typeof token!=='undefined'&&token)loadTemplates(true)},500);
window.NH7_ADMIN_DOCUMENT_STUDIO_VERSION=VERSION;
})();
