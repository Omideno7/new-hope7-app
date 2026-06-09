const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const view = $('#view');
const STORE_PREFIX = 'nh7_';

const state = {
  lang: localStorage.getItem('nh7_lang') || 'en',
  route: 'home',
  params: {},
  stack: [],
  data: {},
  bible: { groups:{}, books:null, verses:null, book:null, chapter:null },
  dailyTab: 'word'
};

const T = {
  en:{
    'nav.home':'Home','nav.daily':'Daily','nav.bible':'Bible','nav.plans':'Plans','nav.school':'School','nav.more':'More',
    home:'Home',daily:'Daily',bible:'Bible',plans:'Plans',school:'School',more:'More',audio:'Audio Messages',salvation:'Need Salvation',about:'About Church',settings:'Settings',gratitude:'Gratitude Plan',meetings:'Church Meetings',youversion:'My Church on YouVersion',amen:'Amen',read:'I read; unlock next day',register:'Register',requestAccess:'Request access',pending:'Pending review',approved:'Approved',guest:'Guest',login:'Registration / Access',offline:'Offline mode active',search:'Search',oldtestament:'Old Testament',newtestament:'New Testament',chapters:'Chapters',back:'Back',save:'Save',saved:'Saved',notes:'Notes',assignment:'Assignment',fullLesson:'Full Written Lesson',playAudio:'Audio',
    appTitle:'New Hope 7 Church',welcome:'Welcome to the New Hope 7 Church app',todayMessage:'Today’s message',continueToday:'Continue today',savedVerses:'My saved verses',progress:'My progress',points:'Points',badges:'Badges',nextMeeting:'Next church meeting',enableNotifications:'Enable notifications',notifications:'Notifications',notificationStatus:'Notification status',notificationEnabled:'Notifications are allowed on this device.',notificationDenied:'Notifications are blocked by the browser.',notificationDefault:'Notifications are not active yet.',language:'Language',clearProgress:'Clear local progress',refreshData:'Refresh app data',version:'App version',dailyWord:'Daily Word',faithProclamation:'Faith Proclamation',dailyJuice:'Daily Juice',gratitudeCourse:'Gratitude Course',day:'Day',mainVerse:'Main Verse',message:'Message',prayer:'Prayer / Confession',proclamation:'Proclamation',actionStep:'Action Step',furtherStudy:'Further Study',openVerse:'Open verse',startCourse:'Start course',completeDay:'Save and complete this day',lockedUntilTomorrow:'The next day will unlock tomorrow.',completed:'Completed',notStarted:'Not started',videos:'New Birth Videos',part:'Part',ourVision:'Our Vision',ourBeliefs:'Our Beliefs',churchIntro:'Church Introduction',meetingsInfo:'Meeting Information',contact:'Contact',openToday:'Open today’s reading',noSavedVerses:'No saved verses yet.',readings:'Readings',openToRead:'Open to read',bookmarks:'Bookmarks',noAudio:'Audio files will be added soon.',audioFormat:'Audio files must be MP3.',schoolAccessText:'To enter the school, register and wait for admin approval.',meetingAccessText:'Meeting access details are shown only after registration and admin approval.',registerDone:'Your request was sent to admin. Please wait for approval.',name:'Name',email:'Email',book:'Book',chapter:'Chapter',verseSaved:'Verse saved',dailyCompleted:'Today’s item completed',all:'All',showVerse:'Show verse',hideVerse:'Hide verse'
  },
  fa:{
    'nav.home':'خانه','nav.daily':'روزانه','nav.bible':'کتاب','nav.plans':'برنامه‌ها','nav.school':'مدرسه','nav.more':'بیشتر',
    home:'خانه',daily:'روزانه',bible:'کتاب‌مقدس',plans:'برنامه‌ها',school:'مدرسه',more:'بیشتر',audio:'پیام‌های صوتی',salvation:'نیاز به نجات',about:'درباره کلیسا',settings:'تنظیمات',gratitude:'دوره شکرگزاری',meetings:'جلسات کلیسا',youversion:'کلیسای من در YouVersion',amen:'آمین',read:'خواندم؛ روز بعد باز شود',register:'ثبت‌نام',requestAccess:'درخواست دسترسی',pending:'در انتظار تأیید',approved:'تأیید شده',guest:'مهمان',login:'ثبت‌نام / دسترسی',offline:'حالت آفلاین فعال است',search:'جستجو',oldtestament:'عهد عتیق',newtestament:'عهد جدید',chapters:'باب‌ها',back:'برگشت',save:'ذخیره',saved:'ذخیره شد',notes:'یادداشت‌ها',assignment:'تکلیف',fullLesson:'متن کامل درس',playAudio:'صوت',
    appTitle:'کلیسای امید نو ۷',welcome:'به اپ کلیسای امید نو ۷ خوش آمدید',todayMessage:'پیام امروز',continueToday:'ادامه امروز',savedVerses:'آیات ذخیره‌شده من',progress:'پیشرفت من',points:'امتیازها',badges:'مدال‌ها',nextMeeting:'جلسه بعدی کلیسا',enableNotifications:'فعال‌سازی اعلان‌ها',notifications:'اعلان‌ها',notificationStatus:'وضعیت اعلان‌ها',notificationEnabled:'اعلان‌ها روی این دستگاه فعال هستند.',notificationDenied:'اعلان‌ها توسط مرورگر مسدود شده‌اند.',notificationDefault:'اعلان‌ها هنوز فعال نشده‌اند.',language:'زبان برنامه',clearProgress:'پاک کردن پیشرفت محلی',refreshData:'تازه‌سازی داده‌های اپ',version:'نسخه برنامه',dailyWord:'کلام روزانه',faithProclamation:'اعلان ایمان',dailyJuice:'آبمیوه روزانه',gratitudeCourse:'دوره شکرگزاری',day:'روز',mainVerse:'آیه اصلی',message:'پیام',prayer:'دعا / اعتراف',proclamation:'اعلان',actionStep:'قدم عملی',furtherStudy:'مطالعه بیشتر',openVerse:'باز کردن آیه',startCourse:'شروع دوره',completeDay:'ذخیره و تکمیل این روز',lockedUntilTomorrow:'روز بعد فردا باز می‌شود.',completed:'کامل شد',notStarted:'شروع نشده',videos:'ویدیوهای تولد تازه',part:'قسمت',ourVision:'رویای ما',ourBeliefs:'اعتقادات ما',churchIntro:'معرفی کلیسا',meetingsInfo:'اطلاعات جلسات',contact:'ارتباط با ما',openToday:'باز کردن مطالعه امروز',noSavedVerses:'هنوز آیه‌ای ذخیره نشده است.',readings:'مطالعه‌ها',openToRead:'برای خواندن باز کن',bookmarks:'آیات ذخیره‌شده',noAudio:'فایل‌های صوتی به‌زودی اضافه می‌شوند.',audioFormat:'فایل‌های صوتی باید با فرمت MP3 باشند.',schoolAccessText:'برای ورود به مدرسه، ثبت‌نام کنید و منتظر تأیید ادمین بمانید.',meetingAccessText:'اطلاعات ورود به جلسه فقط بعد از ثبت‌نام و تأیید ادمین نمایش داده می‌شود.',registerDone:'درخواست شما روی این دستگاه ذخیره شد. تأیید ادمین بعداً از طریق سیستم امن وصل می‌شود.',name:'نام',email:'ایمیل',book:'کتاب',chapter:'باب',verseSaved:'آیه ذخیره شد',dailyCompleted:'مورد امروز کامل شد',all:'همه',showVerse:'نمایش آیه',hideVerse:'بستن آیه'
  },
  hr:{
    'nav.home':'Početna','nav.daily':'Dnevno','nav.bible':'Biblija','nav.plans':'Planovi','nav.school':'Škola','nav.more':'Više',
    home:'Početna',daily:'Dnevno',bible:'Biblija',plans:'Planovi',school:'Škola',more:'Više',audio:'Audio poruke',salvation:'Trebam spasenje',about:'O crkvi',settings:'Postavke',gratitude:'Plan zahvalnosti',meetings:'Crkveni sastanci',youversion:'Moja crkva na YouVersionu',amen:'Amen',read:'Pročitao sam; otključaj sljedeći dan',register:'Registracija',requestAccess:'Zatraži pristup',pending:'Čeka odobrenje',approved:'Odobreno',guest:'Gost',login:'Registracija / Pristup',offline:'Izvanmrežni način je aktivan',search:'Pretraži',oldtestament:'Stari zavjet',newtestament:'Novi zavjet',chapters:'Poglavlja',back:'Natrag',save:'Spremi',saved:'Spremljeno',notes:'Bilješke',assignment:'Zadatak',fullLesson:'Cijela pisana lekcija',playAudio:'Audio',
    appTitle:'Crkva New Hope 7',welcome:'Dobrodošli u aplikaciju crkve New Hope 7',todayMessage:'Današnja poruka',continueToday:'Nastavi danas',savedVerses:'Moji spremljeni stihovi',progress:'Moj napredak',points:'Bodovi',badges:'Medalje',nextMeeting:'Sljedeći crkveni sastanak',enableNotifications:'Uključi obavijesti',notifications:'Obavijesti',notificationStatus:'Status obavijesti',notificationEnabled:'Obavijesti su dopuštene na ovom uređaju.',notificationDenied:'Preglednik je blokirao obavijesti.',notificationDefault:'Obavijesti još nisu aktivne.',language:'Jezik aplikacije',clearProgress:'Obriši lokalni napredak',refreshData:'Osvježi podatke aplikacije',version:'Verzija aplikacije',dailyWord:'Dnevna Riječ',faithProclamation:'Proglas vjere',dailyJuice:'Dnevni sok',gratitudeCourse:'Tečaj zahvalnosti',day:'Dan',mainVerse:'Glavni stih',message:'Poruka',prayer:'Molitva / Ispovijed',proclamation:'Proglas',actionStep:'Praktični korak',furtherStudy:'Daljnje proučavanje',openVerse:'Otvori stih',startCourse:'Započni tečaj',completeDay:'Spremi i dovrši ovaj dan',lockedUntilTomorrow:'Sljedeći dan otključava se sutra.',completed:'Dovršeno',notStarted:'Nije započeto',videos:'Video lekcije o novom rođenju',part:'Dio',ourVision:'Naša vizija',ourBeliefs:'Naša vjerovanja',churchIntro:'Uvod o crkvi',meetingsInfo:'Informacije o sastancima',contact:'Kontakt',openToday:'Otvori današnje čitanje',noSavedVerses:'Još nema spremljenih stihova.',readings:'Čitanja',openToRead:'Otvori za čitanje',bookmarks:'Spremljeni stihovi',noAudio:'Audio datoteke bit će uskoro dodane.',audioFormat:'Audio datoteke moraju biti u MP3 formatu.',schoolAccessText:'Za ulazak u školu registrirajte se i pričekajte odobrenje administratora.',meetingAccessText:'Podaci za pristup sastanku prikazuju se tek nakon registracije i odobrenja administratora.',registerDone:'Vaš je zahtjev spremljen na ovom uređaju. Odobrenje administratora kasnije će biti povezano sigurnim sustavom.',name:'Ime',email:'Email',book:'Knjiga',chapter:'Poglavlje',verseSaved:'Stih je spremljen',dailyCompleted:'Današnja stavka je dovršena',all:'Sve',showVerse:'Prikaži stih',hideVerse:'Sakrij stih'
  }
};


const EXTRA_T = {
  en:{
    myNotes:'My notes',showSavedVerses:'Show saved verses',showMyNotes:'Show my notes',hide:'Hide',noNotes:'No notes yet.',registrationForm:'Registration Form',firstName:'First Name',lastName:'Last Name',birthDate:'Date of Birth',city:'City',country:'Country of Residence',spiritualAge:'How long have you been a believer?',churchMember:'Are you a member of a church?',churchName:'Church name',pastorName:'Pastor name',waterBaptism:'Have you received water baptism?',salvationPrayer:'Have you prayed the prayer of salvation?',eventsInterest:'Interested in in-person seminars/conferences?',testimony:'Testimony of coming to faith',howFound:'How did you hear about New Hope 7?',phone:'Phone number',requiredField:'Please complete all required fields.',yes:'Yes',no:'No',submitRegistration:'Submit registration',goToSalvation:'Go to salvation prayer',schoolNotApproved:'Your school access is waiting for admin approval.',meetingNotApproved:'Your meeting access is waiting for admin approval.',finalExam:'Final Exam',submitExam:'Submit exam',correctAnswers:'Correct answers',openReadingHere:'Show reading here',closeReading:'Close reading',oldAndNew:'Old Testament + New Testament',savedVersesCollapsed:'Saved verses are available here.',notesCollapsed:'All your notes are collected here.'
  },
  fa:{
    myNotes:'یادداشت‌های من',showSavedVerses:'نمایش آیات ذخیره‌شده',showMyNotes:'نمایش یادداشت‌های من',hide:'بستن',noNotes:'هنوز یادداشتی ذخیره نشده است.',registrationForm:'فرم ثبت‌نام',firstName:'نام',lastName:'نام خانوادگی',birthDate:'تاریخ تولد',city:'شهر محل سکونت',country:'کشور محل سکونت',spiritualAge:'چند وقت است ایمان آورده‌اید؟',churchMember:'آیا عضو کلیسایی هستید؟',churchName:'نام کلیسا',pastorName:'نام شبان',waterBaptism:'آیا تعمید آب گرفته‌اید؟',salvationPrayer:'آیا دعای نجات را خوانده‌اید؟',eventsInterest:'آیا علاقه به شرکت در سمینارها و کنفرانس‌های حضوری دارید؟',testimony:'شهادت ایمان‌آوری شما',howFound:'از چه طریقی با کلیسای امید نو ۷ آشنا شده‌اید؟',phone:'شماره تماس',requiredField:'لطفاً همه فیلدهای ضروری را کامل کنید.',yes:'بله',no:'خیر',submitRegistration:'ارسال ثبت‌نام',goToSalvation:'رفتن به دعای نجات',schoolNotApproved:'دسترسی شما به مدرسه در انتظار تأیید ادمین است.',meetingNotApproved:'دسترسی شما به جلسات در انتظار تأیید ادمین است.',finalExam:'امتحان پایان دوره',submitExam:'ارسال امتحان',correctAnswers:'پاسخ‌های درست',openReadingHere:'نمایش مطالعه در همین صفحه',closeReading:'بستن مطالعه',oldAndNew:'عهد عتیق + عهد جدید',savedVersesCollapsed:'آیات ذخیره‌شده شما اینجا قرار دارد.',notesCollapsed:'همه یادداشت‌های شما اینجا جمع می‌شود.'
  },
  hr:{
    myNotes:'Moje bilješke',showSavedVerses:'Prikaži spremljene stihove',showMyNotes:'Prikaži moje bilješke',hide:'Sakrij',noNotes:'Još nema spremljenih bilješki.',registrationForm:'Obrazac za registraciju',firstName:'Ime',lastName:'Prezime',birthDate:'Datum rođenja',city:'Grad prebivališta',country:'Država prebivališta',spiritualAge:'Koliko dugo ste vjernik?',churchMember:'Jeste li član crkve?',churchName:'Naziv crkve',pastorName:'Ime pastora',waterBaptism:'Jeste li primili krštenje u vodi?',salvationPrayer:'Jeste li molili molitvu spasenja?',eventsInterest:'Zanimate li se za seminare i konferencije uživo?',testimony:'Svjedočanstvo obraćenja',howFound:'Kako ste čuli za crkvu New Hope 7?',phone:'Broj telefona',requiredField:'Molimo ispunite sva obavezna polja.',yes:'Da',no:'Ne',submitRegistration:'Pošalji registraciju',goToSalvation:'Idi na molitvu spasenja',schoolNotApproved:'Vaš pristup školi čeka odobrenje administratora.',meetingNotApproved:'Vaš pristup sastancima čeka odobrenje administratora.',finalExam:'Završni ispit',submitExam:'Pošalji ispit',correctAnswers:'Točni odgovori',openReadingHere:'Prikaži čitanje ovdje',closeReading:'Zatvori čitanje',oldAndNew:'Stari zavjet + Novi zavjet',savedVersesCollapsed:'Spremljeni stihovi dostupni su ovdje.',notesCollapsed:'Sve vaše bilješke skupljene su ovdje.'
  }
};
Object.keys(EXTRA_T).forEach(lang=>Object.assign(T[lang], EXTRA_T[lang]));

const QA_T = {
  en:{qna:'Questions & Answers',askQuestion:'Ask a question',questionText:'Write your question',submitQuestion:'Submit question',publicAnswers:'Public answered questions',myQuestions:'My questions',answered:'Answered',waitingAnswer:'Waiting for answer',questionSent:'Your question was sent. It will be answered by the church team.',noQuestions:'No questions yet.',anonymousNote:'Questions and answers are shown publicly without showing the person’s name.',answer:'Answer'},
  fa:{qna:'پرسش و پاسخ',askQuestion:'پرسش خود را بنویسید',questionText:'متن پرسش',submitQuestion:'ارسال پرسش',publicAnswers:'پرسش‌ها و پاسخ‌های عمومی',myQuestions:'پرسش‌های من',answered:'پاسخ داده شده',waitingAnswer:'در انتظار پاسخ',questionSent:'پرسش شما ارسال شد. خادمین کلیسا پاسخ خواهند داد.',noQuestions:'هنوز پرسشی ثبت نشده است.',anonymousNote:'پرسش‌ها و پاسخ‌ها بدون نمایش نام شخص، به‌صورت گمنام برای دیگر کاربران نمایش داده می‌شود.',answer:'پاسخ'},
  hr:{qna:'Pitanja i odgovori',askQuestion:'Postavite pitanje',questionText:'Napišite svoje pitanje',submitQuestion:'Pošalji pitanje',publicAnswers:'Javna odgovorena pitanja',myQuestions:'Moja pitanja',answered:'Odgovoreno',waitingAnswer:'Čeka odgovor',questionSent:'Vaše pitanje je poslano. Crkveni služitelji će odgovoriti.',noQuestions:'Još nema pitanja.',anonymousNote:'Pitanja i odgovori prikazuju se javno bez imena osobe.',answer:'Odgovor'}
};
Object.keys(QA_T).forEach(lang=>Object.assign(T[lang], QA_T[lang]));

const MEETING_T = {
  en:{meetingApproved:'Your meeting access is approved.',meetingDetails:'Meeting details',meetingLink:'Meeting link',accessCode:'Access code',securityCode:'Security code',phoneNumber:'Phone number',openMeeting:'Open meeting',notConfigured:'Meeting details are not configured yet by admin.',checkingApproval:'Checking your approval status...',syncApproval:'Refresh approval status'},
  fa:{meetingApproved:'دسترسی شما به جلسه تأیید شده است.',meetingDetails:'اطلاعات ورود به جلسه',meetingLink:'لینک جلسه',accessCode:'کد دسترسی',securityCode:'کد امنیتی',phoneNumber:'شماره تماس',openMeeting:'باز کردن جلسه',notConfigured:'اطلاعات جلسه هنوز توسط ادمین تنظیم نشده است.',checkingApproval:'در حال بررسی وضعیت تأیید شما...',syncApproval:'تازه‌سازی وضعیت تأیید'},
  hr:{meetingApproved:'Vaš pristup sastanku je odobren.',meetingDetails:'Podaci za pristup sastanku',meetingLink:'Link sastanka',accessCode:'Pristupni kod',securityCode:'Sigurnosni kod',phoneNumber:'Telefonski broj',openMeeting:'Otvori sastanak',notConfigured:'Podaci za sastanak još nisu postavljeni od administratora.',checkingApproval:'Provjera statusa odobrenja...',syncApproval:'Osvježi status odobrenja'}
};
Object.keys(MEETING_T).forEach(lang=>Object.assign(T[lang], MEETING_T[lang]));



const NEW_BIRTH_VIDEOS = [
  'https://youtu.be/u-G6r7rYNEE?is=8kokBIcdqkvQGayt',
  'https://youtu.be/_NNh_EZYKTk?is=4UkXpWX2ziuZOyuI',
  'https://youtu.be/NkhUL9CTWcs?is=b1RAH8qmJwNMFciF',
  'https://youtu.be/LbJ1Fba5sww?is=kFsEup6CxLNId6Pb',
  'https://youtu.be/BYyCOXIA944?is=29lwY491PLjLwqdl',
  'https://youtu.be/ByEg4dcb6zs?is=gzcGJdHnEzKgXqe9'
];


const SUPABASE_CONFIG = {
  url: 'https://gpzcwffxnddhaeaogdyo.supabase.co',
  key: 'sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37'
};
const CLOUD_ENABLED = Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.key);
function deviceId(){
  let id=localStorage.getItem('nh7_device_id');
  if(!id){ id='dev_'+(crypto?.randomUUID ? crypto.randomUUID() : Date.now()+'_'+Math.random().toString(16).slice(2)); localStorage.setItem('nh7_device_id',id); }
  return id;
}
function currentUserEmail(){
  try{
    const m=JSON.parse(localStorage.getItem('nh7_meeting_access')||'{}');
    const s=JSON.parse(localStorage.getItem('nh7_school_access')||'{}');
    return (m.email || s.email || '').trim().toLowerCase();
  }catch(e){ return ''; }
}
async function cloudFetch(path, options={}){
  if(!CLOUD_ENABLED) throw new Error('Cloud disabled');
  const headers=Object.assign({
    'apikey': SUPABASE_CONFIG.key,
    'Authorization': 'Bearer '+SUPABASE_CONFIG.key,
    'Content-Type':'application/json',
    'Prefer':'return=representation',
    'x-device-id': deviceId(),
    'x-user-email': currentUserEmail()
  }, options.headers||{});
  const res=await fetch(SUPABASE_CONFIG.url + '/rest/v1/' + path, Object.assign({}, options, {headers}));
  if(!res.ok){ const txt=await res.text().catch(()=>''); throw new Error(txt || res.statusText); }
  if(res.status===204) return null;
  return res.json().catch(()=>null);
}
function enqueueCloud(op){
  const q=JSON.parse(localStorage.getItem('nh7_cloud_queue')||'[]');
  q.push(Object.assign({id:Date.now()+'_'+Math.random().toString(16).slice(2), createdAt:new Date().toISOString()}, op));
  localStorage.setItem('nh7_cloud_queue', JSON.stringify(q));
  localStorage.setItem('nh7_cloud_status','queued');
}
async function syncCloudQueue(){
  if(!navigator.onLine) return;
  const q=JSON.parse(localStorage.getItem('nh7_cloud_queue')||'[]');
  if(!q.length){ localStorage.setItem('nh7_cloud_status','synced'); return; }
  const remaining=[];
  for(const op of q){
    try{
      if(op.type==='insert') await cloudFetch(op.table, {method:'POST', body:JSON.stringify(op.payload)});
      if(op.type==='upsert') await cloudFetch(op.table+'?on_conflict='+encodeURIComponent(op.conflict||'device_id'), {method:'POST', headers:{'Prefer':'resolution=merge-duplicates,return=representation'}, body:JSON.stringify(op.payload)});
    }catch(e){ console.warn('Cloud sync failed', e); remaining.push(op); }
  }
  localStorage.setItem('nh7_cloud_queue', JSON.stringify(remaining));
  localStorage.setItem('nh7_cloud_status', remaining.length ? 'queued' : 'synced');
}
async function saveCloud(op){ enqueueCloud(op); await syncCloudQueue(); }
function cloudStatusText(){
  const s=localStorage.getItem('nh7_cloud_status')||'local';
  if(state.lang==='fa') return s==='synced'?'ذخیره ابری همگام است.':s==='queued'?'چند مورد برای همگام‌سازی ابری در صف است.':'ذخیره محلی فعال است؛ بعد از ساخت جدول‌ها ذخیره ابری فعال می‌شود.';
  if(state.lang==='hr') return s==='synced'?'Cloud spremanje je sinkronizirano.':s==='queued'?'Neke stavke čekaju sinkronizaciju u oblak.':'Lokalno spremanje je aktivno; cloud se uključuje nakon stvaranja tablica.';
  return s==='synced'?'Cloud save is synced.':s==='queued'?'Some items are waiting for cloud sync.':'Local save is active; cloud starts after the tables are created.';
}
async function saveRegistrationCloud(data){
  const payload={device_id:deviceId(), type:data.kind||'general', status:'pending', language:state.lang, payload:data};
  await saveCloud({type:'insert', table:'registrations', payload});
}
async function saveVerseCloud(ref){
  await saveCloud({type:'upsert', table:'saved_verses', conflict:'device_id,ref', payload:{device_id:deviceId(), ref, language:state.lang}});
}
async function saveNoteCloud(key, content){
  await saveCloud({type:'upsert', table:'user_notes', conflict:'device_id,note_key', payload:{device_id:deviceId(), note_key:key, content, language:state.lang}});
}
async function saveProgressCloud(key, value){
  await saveCloud({type:'upsert', table:'user_progress', conflict:'device_id,progress_key', payload:{device_id:deviceId(), progress_key:key, value, language:state.lang}});
}
async function saveQuestionCloud(questionText){
  const payload={device_id:deviceId(), question_text:questionText, language:state.lang, status:'pending'};
  await saveCloud({type:'insert', table:'qa_questions', payload});
}

async function fetchLatestRegistration(kind){
  if(!CLOUD_ENABLED || !navigator.onLine) return null;
  try{
    const localKey = kind==='meeting' ? 'nh7_meeting_access' : 'nh7_school_access';
    const local = JSON.parse(localStorage.getItem(localKey)||'{}');
    const email = (local.email || currentUserEmail() || '').trim().toLowerCase();
    let rows = await cloudFetch(`registrations?select=*&device_id=eq.${encodeURIComponent(deviceId())}&type=eq.${encodeURIComponent(kind)}&order=created_at.desc&limit=1`, {method:'GET'});
    if((!rows || !rows.length) && email){
      rows = await cloudFetch(`registrations?select=*&type=eq.${encodeURIComponent(kind)}&payload->>email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=1`, {method:'GET'});
    }
    const row = Array.isArray(rows) ? rows[0] : null;
    if(row){
      const data = Object.assign({}, row.payload||{}, {status:row.status, cloudId:row.id, approvedBy: row.status==='approved' ? 'admin' : ''});
      localStorage.setItem(localKey, JSON.stringify(data));
      return data;
    }
  }catch(e){ console.warn('Registration status check failed', e); }
  return null;
}
async function fetchMeetingSettings(){
  if(!CLOUD_ENABLED || !navigator.onLine) return null;
  try{
    const rows = await cloudFetch('meeting_settings?select=*&id=eq.active&limit=1', {method:'GET'});
    return Array.isArray(rows) ? rows[0] : null;
  }catch(e){ console.warn('Meeting settings load failed', e); return null; }
}
function renderMeetingDetails(settings){
  if(!settings) return `<div class="notice">${tr('notConfigured')}</div>`;
  const link = settings.meeting_url || '';
  const phone = settings.phone_number || '';
  const access = settings.access_code || '';
  const security = settings.security_code || '';
  const extra = settings.extra_info || '';
  return `<div class="notice"><h3>${tr('meetingDetails')}</h3>
    ${link?`<p><strong>${tr('meetingLink')}:</strong> <a href="${html(link)}" target="_blank" rel="noopener">${tr('openMeeting')}</a></p>`:''}
    ${phone?`<p><strong>${tr('phoneNumber')}:</strong> ${html(phone)}</p>`:''}
    ${access?`<p><strong>${tr('accessCode')}:</strong> ${html(access)}</p>`:''}
    ${security?`<p><strong>${tr('securityCode')}:</strong> ${html(security)}</p>`:''}
    ${extra?`<p>${html(extra)}</p>`:''}
  </div>`;
}

function tr(k){ return T[state.lang]?.[k] || T.en[k] || k; }
function pick(obj){ return (obj && (obj[state.lang] ?? obj.en ?? obj.fa ?? obj.hr)) || ''; }
function html(s){ return String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])).replace(/\n/g,'<br>'); }
function todayKey(d=new Date()){ return d.toISOString().slice(0,10); }
function dateDiffDays(a,b){ const A=new Date(a+'T00:00:00'); const B=new Date(b+'T00:00:00'); return Math.max(0, Math.floor((B-A)/86400000)); }
function firstUseDate(){ let d=localStorage.getItem('nh7_first_use_date'); if(!d){d=todayKey(); localStorage.setItem('nh7_first_use_date', d);} return d; }
function userCycleDay(total){ return ((dateDiffDays(firstUseDate(), todayKey())) % total) + 1; }
function localNum(n){ return state.lang==='fa' ? String(n).replace(/\d/g, d=>'۰۱۲۳۴۵۶۷۸۹'[d]) : String(n); }
function localText(s){ return state.lang==='fa' ? String(s).replace(/\d/g, d=>'۰۱۲۳۴۵۶۷۸۹'[d]) : String(s); }
async function jfetch(path){ if(state.data[path]) return state.data[path]; const res=await fetch(path); if(!res.ok) throw new Error(path); const data=await res.json(); state.data[path]=data; return data; }
function itemsOf(data){ return data.items || data.days || data.proclamations || []; }

function addPoints(amount, badgeId){
  const g = JSON.parse(localStorage.getItem('nh7_gamification') || '{"points":0,"badges":[]}');
  g.points = (g.points || 0) + amount;
  if(badgeId && !g.badges.includes(badgeId)) g.badges.push(badgeId);
  localStorage.setItem('nh7_gamification', JSON.stringify(g));
}
function gamification(){ return JSON.parse(localStorage.getItem('nh7_gamification') || '{"points":0,"badges":[]}'); }
function badgeName(id){
  const names = {
    first_verse:{fa:'اولین آیه ذخیره‌شده',en:'First Saved Verse',hr:'Prvi spremljeni stih'},
    daily_1:{fa:'شروع روزانه',en:'Daily Starter',hr:'Dnevni početak'},
    gratitude_1:{fa:'شروع شکرگزاری',en:'Gratitude Starter',hr:'Početak zahvalnosti'},
    plan_1:{fa:'شروع مطالعه کتاب‌مقدس',en:'Bible Plan Starter',hr:'Početak biblijskog plana'}
  };
  return names[id]?.[state.lang] || id;
}

function setLang(lang){
  state.lang=lang; localStorage.setItem('nh7_lang',lang);
  document.documentElement.lang=lang; document.body.dir = lang==='fa'?'rtl':'ltr';
  $('#langSelect').value=lang;
  $$('[data-i18n]').forEach(el=>el.textContent=tr(el.dataset.i18n));
  const brandStrong = $('.brand strong'); if(brandStrong) brandStrong.textContent = tr('appTitle');
  render(state.route, state.params, true);
}
function setCrumb(t){ $('#breadcrumb').textContent=t; $('#backBtn').classList.toggle('hidden', state.stack.length===0); $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.route===state.route)); }
function navigate(route, params={}, replace=false){ if(!replace && state.route) state.stack.push({route:state.route, params:state.params}); state.route=route; state.params=params||{}; render(route, state.params); }
function back(){ const prev=state.stack.pop(); if(prev){ state.route=prev.route; state.params=prev.params; render(prev.route, prev.params, true); } }
function card(title, body, cls=''){ return `<section class="card ${cls}">${title?`<h2>${html(title)}</h2>`:''}${body}</section>`; }
function tile(route, emoji, title, sub='', params={}){ return `<button class="tile" data-go="${route}" data-params='${html(JSON.stringify(params||{}))}'><span class="emoji">${emoji}</span><strong>${html(title)}</strong>${sub?`<small>${html(sub)}</small>`:''}</button>`; }
function notice(text){ return `<div class="notice">${html(text)}</div>`; }

function registrationStatus(access){ return access.status==='pending'?tr('pending'):tr('guest'); }
function optionYesNo(value=''){
  return `<option value="">---</option><option value="yes" ${value==='yes'?'selected':''}>${tr('yes')}</option><option value="no" ${value==='no'?'selected':''}>${tr('no')}</option>`;
}
function registrationFormHtml(kind, access={}){
  const v=(k)=>html(access[k]||'');
  return card(tr('registrationForm'), `
    <div class="form-row"><input id="reg_firstName" required placeholder="${tr('firstName')} *" value="${v('firstName')}"></div>
    <div class="form-row"><input id="reg_lastName" required placeholder="${tr('lastName')} *" value="${v('lastName')}"></div>
    <div class="form-row"><input id="reg_birthDate" required type="date" value="${v('birthDate')}"></div>
    <div class="form-row"><input id="reg_city" required placeholder="${tr('city')} *" value="${v('city')}"></div>
    <div class="form-row"><input id="reg_country" required placeholder="${tr('country')} *" value="${v('country')}"></div>
    <div class="form-row"><input id="reg_spiritualAge" required placeholder="${tr('spiritualAge')} *" value="${v('spiritualAge')}"></div>
    <div class="form-row"><label>${tr('churchMember')} *</label><select id="reg_churchMember" required>${optionYesNo(access.churchMember)}</select></div>
    <div class="form-row"><input id="reg_churchName" required placeholder="${tr('churchName')} *" value="${v('churchName')}"></div>
    <div class="form-row"><input id="reg_pastorName" required placeholder="${tr('pastorName')} *" value="${v('pastorName')}"></div>
    <div class="form-row"><label>${tr('waterBaptism')} *</label><select id="reg_waterBaptism" required>${optionYesNo(access.waterBaptism)}</select></div>
    <div class="form-row"><label>${tr('salvationPrayer')} *</label><select id="reg_salvationPrayer" required>${optionYesNo(access.salvationPrayer)}</select></div>
    <div class="form-row"><label>${tr('eventsInterest')} *</label><select id="reg_eventsInterest" required>${optionYesNo(access.eventsInterest)}</select></div>
    <div class="form-row"><textarea id="reg_testimony" required placeholder="${tr('testimony')} *">${v('testimony')}</textarea></div>
    <div class="form-row"><input id="reg_howFound" required placeholder="${tr('howFound')} *" value="${v('howFound')}"></div>
    <div class="form-row"><input id="reg_phone" required placeholder="${tr('phone')} *" value="${v('phone')}"></div>
    <div class="form-row"><input id="reg_email" required type="email" placeholder="${tr('email')} *" value="${v('email')}"></div>
    <button class="primary-btn" data-submit-registration="${kind}">${tr('submitRegistration')}</button>
  `);
}
async function collectRegistration(kind){
  const fields=['firstName','lastName','birthDate','city','country','spiritualAge','churchMember','churchName','pastorName','waterBaptism','salvationPrayer','eventsInterest','testimony','howFound','phone','email'];
  const data={status:'pending',submittedAt:new Date().toISOString(),kind};
  for(const f of fields){ const el=$('#reg_'+f); data[f]=(el?.value||'').trim(); if(!data[f]){ alert(tr('requiredField')); el?.focus(); return; } }
  data.email = data.email.toLowerCase();
  const key=kind==='meeting'?'nh7_meeting_access':'nh7_school_access';
  localStorage.setItem(key, JSON.stringify(data));
  try{ await saveRegistrationCloud(data); alert(tr('registerDone')); }
  catch(e){ console.warn(e); alert((state.lang==='fa'?'درخواست شما فعلاً روی دستگاه ذخیره شد و بعد از اتصال اینترنت دوباره همگام‌سازی می‌شود.':'Your request was saved on this device and will sync when online.')); }
  if(data.salvationPrayer==='no') navigate('salvation',{},true); else render(kind==='meeting'?'meetings':'school',{},true);
}
function collectNotes(){
  const out=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(!k) continue;
    if(k.startsWith('nh7_note_') || k.startsWith('nh7_gratitude_note_')){
      const val=localStorage.getItem(k);
      if(val) out.push({key:k.replace(/^nh7_/,'').replace(/_/g,' '), text:val});
    }
  }
  return out;
}
function savedVersesPanel(bookmarks){
  return `<button class="secondary-btn" data-toggle-panel="savedVersesPanel">${tr('showSavedVerses')}</button><div id="savedVersesPanel" class="collapsible-panel hidden">${bookmarks.length ? `<div class="list">${bookmarks.slice().reverse().map(ref=>`<button class="list-btn" data-open-ref="${html(ref)}"><strong>${html(localText(ref))}</strong><small>${tr('openVerse')}</small></button>`).join('')}</div>` : `<p class="muted">${tr('noSavedVerses')}</p>`}</div>`;
}
function notesPanel(){
  const notes=collectNotes();
  return `<button class="secondary-btn" data-toggle-panel="notesPanel">${tr('showMyNotes')}</button><div id="notesPanel" class="collapsible-panel hidden">${notes.length?`<div class="list">${notes.reverse().map(n=>`<div class="notice"><strong>${html(n.key)}</strong><p>${html(n.text)}</p></div>`).join('')}</div>`:`<p class="muted">${tr('noNotes')}</p>`}</div>`;
}


async function showAmen(){
  const data=await jfetch('data/app/opening_messages_365.json').catch(()=>null);
  const it=data?.items?.[userCycleDay(data.items?.length||365)-1];
  const msg = it ? (it[state.lang] || it.en || it.fa || it.hr) : null;
  $('#amenTitle').textContent = msg?.title || tr('appTitle');
  $('#amenMessage').textContent = msg?.message || tr('welcome');
  $('#amenButton').textContent = tr('amen');
  $('#amenGate').classList.remove('hidden');
}

async function render(route, params={}, preserve=false){
  view.innerHTML='<section class="card"><p>...</p></section>';
  try{
    if(route==='home') await home();
    else if(route==='daily') await daily(params);
    else if(route==='bible') await bible(params);
    else if(route==='plans') await plans(params);
    else if(route==='school') await school(params);
    else if(route==='more') await more();
    else if(route==='audio') await audio(params);
    else if(route==='salvation') await salvation(params);
    else if(route==='about') await about();
    else if(route==='meetings') await meetings(params);
    else if(route==='settings') await settings();
    else if(route==='qna') await qna();
    else await home();
    bindDynamic();
    setCrumb(tr(route));
  }catch(e){ console.error(e); view.innerHTML=card('Error',`<p>${html(e.message)}</p>`); }
}

async function home(){
  const g=gamification();
  const bookmarks=JSON.parse(localStorage.getItem('nh7_bookmarks')||'[]');
  const dailyDay=userCycleDay(365);
  const badgeHtml = g.badges?.length ? g.badges.map(b=>`<span class="badge">🏅 ${html(badgeName(b))}</span>`).join(' ') : `<span class="muted">${tr('notStarted')}</span>`;
  view.innerHTML =
    card(tr('appTitle'), `<p>${tr('welcome')}</p><div class="button-row"><button class="primary-btn" data-go="daily">${tr('continueToday')}</button><button class="secondary-btn" id="quickNotify">${tr('enableNotifications')}</button></div>`, 'hero') +
    card(tr('todayMessage'), `<p>${tr('day')} ${localNum(dailyDay)}</p><div class="button-row"><button class="secondary-btn" data-go="daily" data-params='{"tab":"word"}'>${tr('dailyWord')}</button><button class="secondary-btn" data-go="daily" data-params='{"tab":"faith"}'>${tr('faithProclamation')}</button><button class="secondary-btn" data-go="daily" data-params='{"tab":"juice"}'>${tr('dailyJuice')}</button></div>`) +
    card(tr('savedVerses'), `<p class="muted">${tr('savedVersesCollapsed')}</p>${savedVersesPanel(bookmarks)}`) +
    card(tr('myNotes'), `<p class="muted">${tr('notesCollapsed')}</p>${notesPanel()}`) +
    card(tr('progress'), `<p><strong>${tr('points')}:</strong> ${localNum(g.points||0)}</p><p><strong>${tr('badges')}:</strong> ${badgeHtml}</p>`) +
    `<div class="grid">${tile('bible','📖',tr('bible'))}${tile('plans','✓',tr('plans'))}${tile('school','🎓',tr('school'))}${tile('meetings','☎',tr('meetings'))}</div>`;
  $('#quickNotify')?.addEventListener('click', enableNotifications);
}

async function daily(params={}){
  if(params.tab) state.dailyTab = params.tab;
  const tabs=[['word',tr('dailyWord')],['faith',tr('faithProclamation')],['juice',tr('dailyJuice')],['gratitude',tr('gratitudeCourse')]];
  let out=`<div class="tabs">${tabs.map(([id,label])=>`<button class="tab ${state.dailyTab===id?'active':''}" data-dailytab="${id}">${html(label)}</button>`).join('')}</div>`;
  if(state.dailyTab==='word') out += await renderDailyType('data/daily/daily_word_365.json','message','prayer','word');
  if(state.dailyTab==='faith') out += await renderDailyType('data/daily/faith_proclamations_365.json','proclamation',null,'faith');
  if(state.dailyTab==='juice') out += await renderDailyType('data/daily/daily_juice_365.json','message','prayer','juice','actionStep');
  if(state.dailyTab==='gratitude') out += await renderGratitude();
  view.innerHTML=out;
}
async function renderDailyType(path, mainKey, prayerKey, type, extraKey){
  const d=await jfetch(path); const list=itemsOf(d); const day=userCycleDay(list.length); const it=list[day-1]||{};
  return dailyDetail(it, day, list.length, mainKey, prayerKey, type, extraKey);
}
function verseRevealButton(ref, fallbackText=''){
  if(!ref) return '';
  const safeRef=html(ref);
  const safeText=html(fallbackText||'');
  return `<button class="verse-ref-btn" data-reveal-ref="${safeRef}" data-fallback-text="${safeText}">${html(localizeRef(ref))}</button><div class="inline-verse hidden"></div>`;
}
async function revealVerse(el){
  await loadBibleMeta();
  const ref=el.dataset.revealRef||'';
  const box=el.nextElementSibling;
  if(!box) return;
  if(!box.classList.contains('hidden')){ box.classList.add('hidden'); box.innerHTML=''; return; }
  const parsed=parseRef(ref);
  let text='';
  if(parsed){
    const data=await loadBook(parsed.bookId);
    const v=(data.verses||[]).find(x=>Number(x.chapter)===parsed.chapter && Number(x.verse)===parsed.verse);
    text=v ? (v.text?.[state.lang]||v.text?.en||'') : '';
  }
  text=text || el.dataset.fallbackText || '';
  box.innerHTML = text ? `<p><strong>${html(localizeRef(ref))}</strong></p><p>${html(text)}</p>` : `<p>${html(localizeRef(ref))}</p>`;
  box.classList.remove('hidden');
  addPoints(1);
}

async function dailyDetail(it, day, total, mainKey, prayerKey, type, extraKey){
  await loadBibleMeta();
  const title=pick(it.title)||`${tr('day')} ${localNum(day)}`;
  const verse=it.mainVerse || {};
  let body=`<span class="badge">${tr('day')} ${localNum(day)} / ${localNum(total)}</span>`;
  if(verse.reference || pick(verse.text)) body += `<h3>${tr('mainVerse')}</h3><div class="notice verse-card">${verse.reference?verseRevealButton(verse.reference,pick(verse.text)):`<p>${html(pick(verse.text))}</p>`}</div>`;
  if(it[mainKey]) body += `<h3>${mainKey==='proclamation'?tr('proclamation'):tr('message')}</h3><p>${html(pick(it[mainKey]))}</p>`;
  if(extraKey && it[extraKey]) body += `<h3>${tr('actionStep')}</h3>${renderMulti(it[extraKey])}`;
  if(prayerKey && it[prayerKey]) body += `<h3>${tr('prayer')}</h3><p>${html(pick(it[prayerKey]))}</p>`;
  if(Array.isArray(it.furtherStudy) && it.furtherStudy.length){
    body += `<h3>${tr('furtherStudy')}</h3><div class="list">${it.furtherStudy.map(fs=>`<div class="verse-list-item">${verseRevealButton(fs.reference||'',pick(fs.text))}</div>`).join('')}</div>`;
  }
  body += `<div class="button-row"><button class="primary-btn" data-complete-daily="${type}-${day}">${tr('completed')}</button></div>`;
  return card(title, body);
}
function renderMulti(v){
  if(Array.isArray(v?.[state.lang])) return `<ul>${v[state.lang].map(x=>`<li>${html(x)}</li>`).join('')}</ul>`;
  if(Array.isArray(v)) return `<ul>${v.map(x=>`<li>${html(pick(x)||x)}</li>`).join('')}</ul>`;
  return `<p>${html(pick(v)||v)}</p>`;
}
async function renderGratitude(){
  const data=await jfetch('data/gratitude/gratitude_plan_30_days.json'); const list=itemsOf(data);
  let start=localStorage.getItem('nh7_gratitude_start');
  if(!start){ return card(tr('gratitudeCourse'), `<p>${tr('gratitudeCourse')} - ${localNum(30)} ${tr('day')}</p><button class="primary-btn" id="startGratitude">${tr('startCourse')}</button>`); }
  const daysSince=dateDiffDays(start,todayKey());
  const completed=JSON.parse(localStorage.getItem('nh7_gratitude_completed')||'[]');
  const current=Math.min(completed.length+1, list.length);
  const unlocked=Math.min(daysSince+1, list.length);
  if(current>unlocked){ return card(tr('gratitudeCourse'), `<p>${tr('lockedUntilTomorrow')}</p><p>${tr('completed')}: ${localNum(completed.length)} / ${localNum(list.length)}</p>`); }
  const it=list[current-1];
  let body=`<span class="badge">${tr('day')} ${localNum(current)} / ${localNum(list.length)}</span>`;
  if(it.mainVerse) body+=`<h3>${tr('mainVerse')}</h3><div class="notice verse-card">${verseRevealButton(it.mainVerse.reference||'',pick(it.mainVerse.text))}</div>`;
  body+=`<h3>${tr('message')}</h3><p>${html(pick(it.teaching))}</p>`;
  if(it.dailyTasks) body+=`<h3>${tr('actionStep')}</h3>${renderMulti(it.dailyTasks)}`;
  if(it.understandingQuestions) body+=`<h3>${tr('notes')}</h3>${renderMulti(it.understandingQuestions)}`;
  body+=`<textarea id="gratitudeNote" placeholder="${tr('notes')}"></textarea><button class="primary-btn" id="completeGratitude">${tr('completeDay')}</button>`;
  return card(pick(it.title), body);
}

async function loadBibleMeta(){
  if(state.bible.books) return;
  const planData = await jfetch('data/bible/plans/reading_plans_1yr_2yr.json').catch(()=>null);
  if(planData?.books?.length) state.bible.books = planData.books;
  else {
    const groups=await Promise.all(['01_18','19_39','40_66'].map(g=>jfetch(`data/bible/groups/bible_group_${g}.json`)));
    state.bible.books=groups.flatMap(g=>g.books||[]).sort((a,b)=>a.order-b.order);
  }
}
async function loadBook(bookId){
  await loadBibleMeta();
  const b=state.bible.books.find(x=>x.id===bookId);
  if(!b) return null;
  const group=b.order<=18?'01_18':b.order<=39?'19_39':'40_66';
  if(!state.bible.groups[group]) state.bible.groups[group]=await jfetch(`data/bible/groups/bible_group_${group}.json`);
  return {book:b, verses:state.bible.groups[group].verses.filter(v=>v.bookId===bookId)};
}
async function bible(params={}){
  await loadBibleMeta();
  if(params.q) return bibleSearch(params.q);
  if(params.mode==='book') return bibleBook(params.bookId);
  if(params.mode==='chapter') return bibleChapter(params.bookId, Number(params.chapter||1));
  const ot=state.bible.books.filter(b=>b.testament==='OT'); const nt=state.bible.books.filter(b=>b.testament==='NT');
  view.innerHTML=card(tr('bible'), `<div class="form-row"><input id="bibleSearch" class="search-box" placeholder="${tr('search')}"></div><button class="secondary-btn" id="runBibleSearch">${tr('search')}</button>`) + renderBookList(tr('oldtestament'),ot) + renderBookList(tr('newtestament'),nt);
}
function renderBookList(title, books){ return card(title, `<div class="grid">${books.map(b=>`<button class="tile compact" data-go="bible" data-params='${html(JSON.stringify({mode:'book',bookId:b.id}))}'><strong>${html(b.names[state.lang]||b.names.en)}</strong><small>${localNum(b.chapters)} ${tr('chapters')}</small></button>`).join('')}</div>`); }
async function bibleBook(bookId){ const data=await loadBook(bookId); if(!data) return bible(); const chapters=Array.from({length:data.book.chapters},(_,i)=>i+1); view.innerHTML=card(data.book.names[state.lang]||data.book.names.en, `<div class="grid">${chapters.map(ch=>`<button class="tile compact" data-go="bible" data-params='${html(JSON.stringify({mode:'chapter',bookId,chapter:ch}))}'><strong>${tr('chapter')} ${localNum(ch)}</strong></button>`).join('')}</div>`); }
async function bibleChapter(bookId, chapter){
  const data=await loadBook(bookId); if(!data) return bible();
  const verses=data.verses.filter(v=>Number(v.chapter)===chapter);
  const title=`${data.book.names[state.lang]||data.book.names.en} ${localNum(chapter)}`;
  view.innerHTML=card(title, `<div class="reader">${verses.map(v=>`<div class="reader-verse" id="v-${v.id}"><span class="num">${localNum(v.verse)}</span><span>${html(v.text?.[state.lang]||v.text?.en||'')}</span><div class="button-row"><button class="secondary-btn" data-bookmark="${html(v.reference?.en||v.id)}">☆ ${tr('save')}</button><button class="secondary-btn" data-highlight>✦</button></div></div>`).join('')}</div>`);
}
async function bibleSearch(q){
  await loadBibleMeta(); let out=[];
  for(const g of ['01_18','19_39','40_66']){ if(!state.bible.groups[g]) state.bible.groups[g]=await jfetch(`data/bible/groups/bible_group_${g}.json`); const found=state.bible.groups[g].verses.filter(v=>(v.text?.[state.lang]||v.text?.en||'').toLowerCase().includes(q.toLowerCase())).slice(0,8); out.push(...found); if(out.length>=20) break; }
  view.innerHTML=card(tr('search'), out.length?`<div class="list">${out.slice(0,20).map(v=>`<button class="list-btn" data-go="bible" data-params='${html(JSON.stringify({mode:'chapter',bookId:v.bookId,chapter:v.chapter}))}'><strong>${html(localizeRef(v.reference?.en||''))}</strong><small>${html((v.text?.[state.lang]||v.text?.en||'').slice(0,180))}</small></button>`).join('')}</div>`:`<p class="muted">${tr('notStarted')}</p>`);
}
function localizeRef(ref){
  if(!ref) return '';
  let s=String(ref);
  const books=state.bible.books||[];
  const pairs=books.map(b=>[b.names?.en,b.names?.[state.lang]||b.names?.en]).filter(x=>x[0]).sort((a,b)=>b[0].length-a[0].length);
  for(const [en,loc] of pairs){
    const re=new RegExp('^'+en.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
    if(re.test(s)){ s=s.replace(re,loc); break; }
  }
  return localText(s);
}
function parseRef(ref){
  const m=String(ref||'').match(/^(.+?)\s+(\d+):(\d+)/); if(!m) return null;
  const name=m[1].trim().toLowerCase(); const chapter=Number(m[2]); const verse=Number(m[3]);
  const b=(state.bible.books||[]).find(x=>[x.names?.en,x.names?.fa,x.names?.hr,x.id].filter(Boolean).some(n=>String(n).toLowerCase()===name));
  return b?{bookId:b.id,chapter,verse}:null;
}

async function plans(){
  const d=await jfetch('data/bible/plans/reading_plans_1yr_2yr.json'); await loadBibleMeta();
  const plans=d.plans||[];
  view.innerHTML=card(tr('plans'), `<div class="list">${plans.map((p,i)=>`<button class="list-btn" data-show-plan="${i}"><strong>${html(p.title?.[state.lang]||p.title?.en)}</strong><small>${localNum(p.durationDays||p.days?.length)} ${tr('day')}</small></button>`).join('')}</div><div id="planDetail"></div>`);
  $$('[data-show-plan]').forEach(btn=>btn.onclick=()=>showPlan(plans[Number(btn.dataset.showPlan)]));
}
function planBookName(bookId){ const b=state.bible.books?.find(x=>x.id===bookId); return b?.names?.[state.lang] || b?.names?.en || bookId; }
function renderReading(r){
  const start=Number(r.startChapter); const end=Number(r.endChapter ?? r.startChapter);
  const label=start===end?`${planBookName(r.bookId)} ${localNum(start)}`:`${planBookName(r.bookId)} ${localNum(start)}–${localNum(end)}`;
  return `<button class="list-btn" data-read-range='${html(JSON.stringify({bookId:r.bookId,startChapter:start,endChapter:end}))}'><strong>${html(label)}</strong><small>${tr('openReadingHere')}</small></button><div class="inline-reading hidden"></div>`;
}
async function revealReadingRange(el){
  const box=el.nextElementSibling; if(!box) return;
  if(!box.classList.contains('hidden')){ box.classList.add('hidden'); box.innerHTML=''; el.querySelector('small').textContent=tr('openReadingHere'); return; }
  const r=JSON.parse(el.dataset.readRange||'{}'); const data=await loadBook(r.bookId); if(!data) return;
  let htmlOut='';
  for(let ch=Number(r.startChapter); ch<=Number(r.endChapter||r.startChapter); ch++){
    const verses=data.verses.filter(v=>Number(v.chapter)===ch);
    htmlOut += `<h3>${html((data.book.names[state.lang]||data.book.names.en)+' '+localNum(ch))}</h3><div class="reader compact-reader">${verses.map(v=>`<div class="reader-verse"><span class="num">${localNum(v.verse)}</span><span>${html(v.text?.[state.lang]||v.text?.en||'')}</span></div>`).join('')}</div>`;
  }
  box.innerHTML=htmlOut; box.classList.remove('hidden'); el.querySelector('small').textContent=tr('closeReading'); addPoints(2);
}
function showPlan(p){
  const key='nh7_plan_'+(p.id||'plan'); const prog=JSON.parse(localStorage.getItem(key)||'{"completed":[]}');
  const total=p.days?.length||p.durationDays||365; const current=Math.min((prog.completed?.length||0)+1,total); const day=(p.days||[]).find(x=>Number(x.day)===current)||p.days?.[0]||{};
  const percent=Math.round(((prog.completed?.length||0)/total)*100);
  $('#planDetail').innerHTML=card(p.title?.[state.lang]||p.title?.en, `<span class="badge">${tr('oldAndNew')}</span><div class="progress"><span style="width:${percent}%"></span></div><p><strong>${tr('day')} ${localNum(current)}</strong> / ${localNum(total)}</p><h3>${tr('readings')}</h3><div class="list">${(day.readings||[]).map(renderReading).join('')}</div><button class="primary-btn" id="markRead">${tr('read')}</button>`);
  $('#markRead').onclick=()=>{ if(!prog.completed.includes(current)) prog.completed.push(current); localStorage.setItem(key,JSON.stringify(prog)); addPoints(10,'plan_1'); showPlan(p); bindDynamic(); };
  bindDynamic();
}

async function school(params={}){
  const d=await jfetch('data/school/school_content.json'); const access=JSON.parse(localStorage.getItem('nh7_school_access')||'{"status":"guest"}');
  if(access.status!=='approved'){
    if(params.form){ view.innerHTML=registrationFormHtml('school', access); return; }
    view.innerHTML=card(tr('school'), `<p>${tr('schoolAccessText')}</p><p class="muted">${tr('schoolNotApproved')}</p><span class="badge">${access.status==='pending'?tr('pending'):tr('guest')}</span><div class="button-row"><button class="primary-btn" data-go="school" data-params='{"form":true}'>${tr('register')}</button></div>`);
    return;
  }
  if(params.lesson) return schoolLesson(d, params.lesson);
  view.innerHTML=card(tr('school'), `<span class="badge">${tr('approved')}</span><div class="list">${d.lessons.map(l=>`<button class="list-btn" data-go="school" data-params='${html(JSON.stringify({lesson:l.lesson_code}))}'><strong>${html(l.translations?.[state.lang]?.class_title||l.translations?.en?.class_title)}</strong><small>${html(l.translations?.[state.lang]?.lesson_title||'')}</small></button>`).join('')}</div>`);
}
function schoolLesson(d, code){ const l=d.lessons.find(x=>x.lesson_code===code); const tx=l.translations?.[state.lang]||l.translations?.en||{}; const wr=l.written?.[state.lang]||l.written?.en||{}; const audioSrc=l.audio?.src || `public/audio/school/${l.audio?.fileName||'class-01-fa.mp3'}`; view.innerHTML=card(tx.class_title||tr('school'), `<p>${html(tx.lesson_text)}</p><div class="audio-placeholder"><strong>${tr('playAudio')}</strong><p>${html(l.audio?.fileName||'class-01-fa.mp3')}</p><audio controls src="${html(audioSrc)}"></audio></div><h3>${tr('assignment')}</h3><p>${html(tx.assignment_question)}</p><textarea placeholder="${tr('notes')}"></textarea><button class="secondary-btn" data-save-note="school-${code}">${tr('save')}</button><h3>${tr('fullLesson')}</h3><p>${html(wr.text||'')}</p>`); }

async function audio(params={}){
  const d=await jfetch('data/audio/messages.json');
  if(params.cat){ const c=d.categories.find(x=>x.id===params.cat); const items=c?.items||[]; view.innerHTML=card(pick(c?.title)||tr('audio'), items.length?`<div class="list">${items.map(it=>`<div class="card"><strong>${html(pick(it.title)||it.title||'Audio')}</strong><audio controls src="${html(it.src)}"></audio></div>`).join('')}</div>`:`<p class="muted">${tr('noAudio')}</p><p class="muted">${tr('audioFormat')}</p>`); return; }
  view.innerHTML=card(tr('audio'), `<div class="grid">${d.categories.map(c=>tile('audio','🎧',pick(c.title),`${tr('all')}: ${localNum((c.items||[]).length)}`,{cat:c.id})).join('')}</div>`);
}
async function salvation(){
  const d=await jfetch('data/salvation/need_salvation.json');
  const sections=(d.sections||[]).filter(s=>s.id!=='new_birth_videos');
  const introText = state.lang==='fa'
    ? 'برای مطالعه هر بخش، روی عنوان آن بزنید.'
    : state.lang==='hr'
      ? 'Za čitanje svakog dijela dodirnite njegov naslov.'
      : 'Tap each title to open its content.';
  const sectionButtons = sections.map((s,i)=>`
    <button class="list-btn accordion-toggle" data-salvation-toggle="salvation-section-${i}">
      <strong>${html(pick(s.title))}</strong>
      <small>${state.lang==='fa'?'برای باز کردن کلیک کنید':state.lang==='hr'?'Dodirnite za otvaranje':'Tap to open'}</small>
    </button>
    <div id="salvation-section-${i}" class="accordion-panel hidden">
      <p>${html(pick(s.content))}</p>
    </div>`).join('');
  const videoList = `<div class="list">${NEW_BIRTH_VIDEOS.map((url,i)=>`<a class="list-btn link-card" href="${html(url)}" target="_blank" rel="noopener"><strong>${tr('part')} ${localNum(i+1)}: ${state.lang==='fa'?'تولد تازه':state.lang==='hr'?'Novo rođenje':'New Birth'}</strong><small>YouTube</small></a>`).join('')}</div>`;
  const videosAccordion = `
    <button class="list-btn accordion-toggle" data-salvation-toggle="salvation-videos">
      <strong>${tr('videos')}</strong>
      <small>${state.lang==='fa'?'نمایش ویدیوها':state.lang==='hr'?'Prikaži video lekcije':'Show videos'}</small>
    </button>
    <div id="salvation-videos" class="accordion-panel hidden">${videoList}</div>`;
  view.innerHTML=card(tr('salvation'), `<p class="muted">${introText}</p><div class="list">${sectionButtons}${videosAccordion}</div>`);
  bindDynamic();
}
async function about(){
  const d=await jfetch('data/church/about.json');
  view.innerHTML=card(tr('about'), `<h3>${tr('churchIntro')}</h3><p>${html(d.intro?.[state.lang]||'')}</p><h3>${tr('ourVision')}</h3><p>${html(d.vision?.[state.lang]||'')}</p><h3>${tr('ourBeliefs')}</h3><p>${html(d.beliefs?.[state.lang]||'')}</p><div class="button-row"><a class="secondary-btn" href="https://www.bible.com/organizations/da6136d1-04cd-4243-a52b-f9ba7f32ec79?utm_source=yvapp&utm_medium=share&utm_content=partner-page" target="_blank" rel="noopener">${tr('youversion')}</a></div>`);
}
async function meetings(params={}){
  let access=JSON.parse(localStorage.getItem('nh7_meeting_access')||'{"status":"guest"}');
  if(params.form){ view.innerHTML=registrationFormHtml('meeting', access); return; }
  const cloudAccess = await fetchLatestRegistration('meeting');
  if(cloudAccess) access = cloudAccess;
  const approved = access.status==='approved' || access.approvedBy==='admin';
  let details='';
  if(approved){
    const settings = await fetchMeetingSettings();
    details = `<p class="success-text">${tr('meetingApproved')}</p>` + renderMeetingDetails(settings);
  }
  view.innerHTML=card(tr('meetings'), `<p>${tr('meetingAccessText')}</p>${approved?'':`<p class="muted">${tr('meetingNotApproved')}</p>`}<span class="badge">${approved?tr('approved'):registrationStatus(access)}</span>${details}<div class="button-row"><button class="primary-btn" data-go="meetings" data-params='{"form":true}'>${tr('register')}</button><button class="secondary-btn" data-go="meetings">${tr('syncApproval')}</button></div>`);
}
async function more(){ view.innerHTML=`<div class="grid">${tile('audio','🎧',tr('audio'))}${tile('salvation','✝',tr('salvation'))}${tile('gratitude','🙏',tr('gratitude'))}${tile('meetings','☎',tr('meetings'))}${tile('qna','❓',tr('qna'))}${tile('about','ℹ',tr('about'))}${tile('settings','⚙',tr('settings'))}</div>`; }

async function qna(){
  const my = JSON.parse(localStorage.getItem('nh7_my_questions')||'[]');
  let answered=[];
  try{
    answered = await cloudFetch('qa_questions?select=id,question_text,answer_text,language,answered_at&status=eq.answered&order=answered_at.desc&limit=50', {method:'GET'});
  }catch(e){ console.warn('Q&A load failed', e); }
  const tapText = state.lang==='fa' ? 'برای دیدن پاسخ کلیک کنید' : state.lang==='hr' ? 'Dodirnite za prikaz odgovora' : 'Tap to view answer';
  const openText = state.lang==='fa' ? 'برای باز کردن کلیک کنید' : state.lang==='hr' ? 'Dodirnite za otvaranje' : 'Tap to open';
  const myHtml = my.length ? `<div class="list">${my.slice().reverse().map((q,i)=>`<button class="list-btn qna-answer-toggle" data-qna-answer="myq-${i}"><strong>${html(q.question)}</strong><small>${q.status==='answered'?tr('answered'):tr('waitingAnswer')} • ${tapText}</small></button><div id="myq-${i}" class="accordion-panel hidden">${q.answer?`<p><strong>${tr('answer')}:</strong> ${html(q.answer)}</p>`:`<p class="muted">${tr('waitingAnswer')}</p>`}</div>`).join('')}</div>` : `<p class="muted">${tr('noQuestions')}</p>`;
  const answeredHtml = answered && answered.length ? `<div class="list">${answered.map((q,i)=>`<button class="list-btn qna-answer-toggle" data-qna-answer="pubq-${i}"><strong>${html(q.question_text)}</strong><small>${tapText}</small></button><div id="pubq-${i}" class="accordion-panel hidden"><p><strong>${tr('answer')}:</strong> ${html(q.answer_text||'')}</p></div>`).join('')}</div>` : `<p class="muted">${tr('noQuestions')}</p>`;
  view.innerHTML=card(tr('qna'), `<p class="muted">${tr('anonymousNote')}</p><h3>${tr('askQuestion')}</h3><textarea id="qaQuestion" placeholder="${tr('questionText')}" required></textarea><button class="primary-btn" id="submitQa">${tr('submitQuestion')}</button><div class="qna-section"><button class="secondary-btn wide-btn" data-qna-toggle="myQuestionsPanel">${tr('myQuestions')} <span>${openText}</span></button><div id="myQuestionsPanel" class="accordion-panel hidden">${myHtml}</div></div><div class="qna-section"><button class="secondary-btn wide-btn" data-qna-toggle="publicAnswersPanel">${tr('publicAnswers')} <span>${openText}</span></button><div id="publicAnswersPanel" class="accordion-panel hidden">${answeredHtml}</div></div>`);
  $('#submitQa').onclick=async()=>{
    const question=($('#qaQuestion').value||'').trim();
    if(!question){ alert(tr('requiredField')); return; }
    const item={question,status:'pending',createdAt:new Date().toISOString()};
    const arr=JSON.parse(localStorage.getItem('nh7_my_questions')||'[]'); arr.push(item); localStorage.setItem('nh7_my_questions',JSON.stringify(arr));
    await saveQuestionCloud(question).catch(console.warn);
    alert(tr('questionSent')); render('qna',{},true);
  };
}

async function settings(){
  const perm=typeof Notification==='undefined'?'default':Notification.permission;
  const status=perm==='granted'?tr('notificationEnabled'):perm==='denied'?tr('notificationDenied'):tr('notificationDefault');
  view.innerHTML=card(tr('settings'), `<h3>${tr('language')}</h3><select id="settingsLang"><option value="en">English</option><option value="fa">فارسی</option><option value="hr">Hrvatski</option></select><h3>${tr('notifications')}</h3><p>${status}</p><button class="primary-btn" id="enableNotify">${tr('enableNotifications')}</button><div class="notice"><p>${state.lang==='fa'?'کلام روزانه ساعت ۷، اعلان ایمان ساعت ۱۲، آبمیوه روزانه ساعت ۱۷، و یادآوری شکرگزاری ساعت ۲۱ بر اساس زمان محلی کاربر تنظیم می‌شود. یادآوری جلسات کلیسا بر اساس زمان کرواسی است. برای آیفون، اپ را به Home Screen اضافه کنید و سپس اعلان‌ها را فعال کنید.':'Daily Word at 07:00, Faith Proclamation at 12:00, Daily Juice at 17:00, and Gratitude reminder at 21:00 use the user’s local time. Church meeting reminders use Croatia time. On iPhone, add the app to Home Screen, then enable notifications.'}</p></div><h3>${state.lang==='fa'?'ذخیره ابری / آفلاین':state.lang==='hr'?'Cloud / offline spremanje':'Cloud / offline save'}</h3><p>${cloudStatusText()}</p><button class="secondary-btn" id="syncCloud">${state.lang==='fa'?'همگام‌سازی اکنون':state.lang==='hr'?'Sinkroniziraj sada':'Sync now'}</button><h3>${tr('version')}</h3><p>New Hope 7 v1.3.6</p><button class="secondary-btn" id="clearCache">${tr('refreshData')}</button>`);
  $('#settingsLang').value=state.lang; $('#settingsLang').onchange=e=>setLang(e.target.value);
  $('#enableNotify').onclick=enableNotifications;
  $('#clearCache').onclick=()=>{ if('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.update())); alert(tr('saved')); };
  $('#syncCloud')?.addEventListener('click', async()=>{ await syncCloudQueue(); alert(cloudStatusText()); render('settings',{},true); });
}
async function enableNotifications(){
  if(typeof Notification==='undefined'){ alert(state.lang==='fa'?'اعلان‌ها در این مرورگر پشتیبانی نمی‌شوند.':'Notifications are not supported in this browser.'); return; }
  let perm='default';
  try{
    if(window.OneSignalDeferred){
      await new Promise(resolve=>{
        window.OneSignalDeferred.push(async function(OneSignal){
          try{
            if(OneSignal.Notifications && OneSignal.Notifications.requestPermission){
              perm = await OneSignal.Notifications.requestPermission();
            }
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
            if(OneSignal.User && OneSignal.User.addTags){
              await OneSignal.User.addTags({
                app:'new_hope_7',
                language: state.lang,
                timezone: tz,
                daily_word_time:'07:00',
                faith_time:'12:00',
                daily_juice_time:'17:00',
                gratitude_time:'21:00',
                croatia_morning_meeting:'04:55',
                croatia_sunday_service:'20:00'
              });
            }
            const subId = OneSignal.User?.PushSubscription?.id || '';
            if(subId) localStorage.setItem('nh7_onesignal_subscription_id', subId);
          }catch(err){ console.warn('OneSignal permission failed', err); }
          resolve();
        });
      });
    }
    if(Notification.permission !== 'granted') perm = await Notification.requestPermission();
    else perm = 'granted';
  }catch(e){ console.warn(e); perm = Notification.permission || 'default'; }
  localStorage.setItem('nh7_notifications_permission',perm);
  localStorage.setItem('nh7_notifications_timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || 'local');
  if(perm==='granted'){
    try{ new Notification(tr('appTitle'),{body:tr('notificationEnabled'),icon:'assets/logo.png'}); }catch(e){}
    alert(state.lang==='fa'?'اعلان‌ها فعال شد. برای دریافت اعلان‌ها، اجازه مرورگر باید روشن بماند.':'Notifications are active. Keep browser permission enabled to receive them.');
  } else if(perm==='denied') {
    alert(tr('notificationDenied'));
  }
  render(state.route,state.params,true);
}

function bindDynamic(){
  $$('[data-go]').forEach(el=>el.onclick=()=>navigate(el.dataset.go, JSON.parse(el.dataset.params||'{}')));
  $$('[data-dailytab]').forEach(el=>el.onclick=()=>{ state.dailyTab=el.dataset.dailytab; render('daily',{},true); });
  $$('[data-save-note]').forEach(el=>el.onclick=()=>{ const content=el.previousElementSibling?.value||''; localStorage.setItem('nh7_note_'+el.dataset.saveNote, content); saveNoteCloud('note_'+el.dataset.saveNote, content).catch(console.warn); el.textContent=tr('saved'); });
  $$('[data-bookmark]').forEach(el=>el.onclick=()=>{ const arr=JSON.parse(localStorage.getItem('nh7_bookmarks')||'[]'); if(!arr.includes(el.dataset.bookmark)) arr.push(el.dataset.bookmark); localStorage.setItem('nh7_bookmarks',JSON.stringify(arr)); saveVerseCloud(el.dataset.bookmark).catch(console.warn); addPoints(5,'first_verse'); el.textContent='★ '+tr('saved'); });
  $$('[data-highlight]').forEach(el=>el.onclick=()=>el.closest('.reader-verse')?.classList.toggle('highlighted'));
  $$('[data-complete-daily]').forEach(el=>el.onclick=()=>{ const key='nh7_daily_done_'+el.dataset.completeDaily; if(!localStorage.getItem(key)){ localStorage.setItem(key,'1'); saveProgressCloud(key,{done:true,at:new Date().toISOString()}).catch(console.warn); addPoints(3,'daily_1'); } el.textContent=tr('dailyCompleted'); });
  $$('[data-open-ref]').forEach(el=>el.onclick=async()=>{ await loadBibleMeta(); const ref=parseRef(el.dataset.openRef); if(ref) navigate('bible',{mode:'chapter',bookId:ref.bookId,chapter:ref.chapter}); });
  $$('[data-reveal-ref]').forEach(el=>el.onclick=()=>revealVerse(el));
  $$('[data-read-range]').forEach(el=>el.onclick=()=>revealReadingRange(el));
  $$('[data-toggle-panel]').forEach(el=>el.onclick=()=>{ const p=$('#'+el.dataset.togglePanel); if(p){ p.classList.toggle('hidden'); el.textContent=p.classList.contains('hidden')?(el.dataset.togglePanel==='notesPanel'?tr('showMyNotes'):tr('showSavedVerses')):tr('hide'); }});
  $$('[data-salvation-toggle]').forEach(el=>el.onclick=()=>{ const p=$('#'+el.dataset.salvationToggle); if(p){ p.classList.toggle('hidden'); const small=el.querySelector('small'); if(small) small.textContent=p.classList.contains('hidden') ? (state.lang==='fa'?'برای باز کردن کلیک کنید':state.lang==='hr'?'Dodirnite za otvaranje':'Tap to open') : tr('hide'); }});
  $$('[data-qna-toggle]').forEach(el=>el.onclick=()=>{ const p=$('#'+el.dataset.qnaToggle); if(p){ p.classList.toggle('hidden'); const sp=el.querySelector('span'); if(sp) sp.textContent=p.classList.contains('hidden') ? (state.lang==='fa'?'برای باز کردن کلیک کنید':state.lang==='hr'?'Dodirnite za otvaranje':'Tap to open') : tr('hide'); }});
  $$('.qna-answer-toggle').forEach(el=>el.onclick=()=>{ const p=$('#'+el.dataset.qnaAnswer); if(p){ p.classList.toggle('hidden'); }});
  $$('[data-submit-registration]').forEach(el=>el.onclick=()=>collectRegistration(el.dataset.submitRegistration));
  const run=$('#runBibleSearch'); if(run) run.onclick=()=>navigate('bible',{q:$('#bibleSearch').value},true);
  $('#startGratitude')?.addEventListener('click',()=>{ localStorage.setItem('nh7_gratitude_start',todayKey()); addPoints(5,'gratitude_1'); render('daily',{tab:'gratitude'},true); });
  $('#completeGratitude')?.addEventListener('click',()=>{ const completed=JSON.parse(localStorage.getItem('nh7_gratitude_completed')||'[]'); const current=Math.min(completed.length+1,30); if(!completed.includes(current)) completed.push(current); localStorage.setItem('nh7_gratitude_completed',JSON.stringify(completed)); const gnote=$('#gratitudeNote')?.value||''; localStorage.setItem('nh7_gratitude_note_'+current,gnote); saveNoteCloud('gratitude_note_'+current, gnote).catch(console.warn); saveProgressCloud('gratitude_completed',{completed}).catch(console.warn); addPoints(10,'gratitude_1'); render('daily',{tab:'gratitude'},true); });
}

$('#langSelect').onchange=e=>setLang(e.target.value);
$('#backBtn').onclick=back;
$$('.nav-item').forEach(b=>b.onclick=()=>{ state.stack=[]; navigate(b.dataset.route,{},true); });
$('#amenButton').onclick=()=>$('#amenGate').classList.add('hidden');
window.addEventListener('online',()=>{ $('.offline')?.remove(); syncCloudQueue().catch(console.warn); });
window.addEventListener('offline',()=>{ if(!$('.offline')){ const d=document.createElement('div'); d.className='offline'; d.textContent=tr('offline'); document.body.appendChild(d);} });
if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(console.warn);
setLang(state.lang); syncCloudQueue().catch(console.warn); showAmen();
