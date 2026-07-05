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
    appTitle:'OmideNo7 Church',welcome:'Welcome to the OmideNo7 Church app',todayMessage:'Today’s message',continueToday:'Continue today',savedVerses:'My saved verses',progress:'My progress',points:'Points',badges:'Badges',nextMeeting:'Next church meeting',enableNotifications:'Enable notifications',notifications:'Notifications',notificationStatus:'Notification status',notificationEnabled:'Notifications are allowed on this device.',notificationDenied:'Notifications are blocked by the browser.',notificationDefault:'Notifications are not active yet.',language:'Language',clearProgress:'Clear local progress',refreshData:'Refresh app data',version:'App version',dailyWord:'Daily Word',faithProclamation:'Faith Proclamation',dailyJuice:'Daily Juice',gratitudeCourse:'Gratitude Course',day:'Day',mainVerse:'Main Verse',message:'Message',prayer:'Prayer / Confession',proclamation:'Proclamation',actionStep:'Action Step',furtherStudy:'Further Study',openVerse:'Open verse',startCourse:'Start course',completeDay:'Save and complete this day',lockedUntilTomorrow:'The next day will unlock tomorrow.',completed:'Completed',notStarted:'Not started',videos:'New Birth Videos',part:'Part',ourVision:'Our Vision',ourBeliefs:'Our Beliefs',churchIntro:'Church Introduction',meetingsInfo:'Meeting Information',contact:'Contact',openToday:'Open today’s reading',noSavedVerses:'No saved verses yet.',readings:'Readings',openToRead:'Open to read',bookmarks:'Bookmarks',noAudio:'Audio files will be added soon.',audioFormat:'Audio files must be MP3.',schoolAccessText:'To enter the school, register and wait for admin approval.',meetingAccessText:'After school registration and admin approval, the meeting link and security code are shown here. A separate meeting registration is not required.',registerDone:'Your request was sent to admin. Please wait for approval.',name:'Name',email:'Email',book:'Book',chapter:'Chapter',verseSaved:'Verse saved',dailyCompleted:'Today’s item completed',all:'All',showVerse:'Show verse',hideVerse:'Hide verse'
  },
  fa:{
    'nav.home':'خانه','nav.daily':'روزانه','nav.bible':'کتاب','nav.plans':'برنامه‌ها','nav.school':'مدرسه','nav.more':'بیشتر',
    home:'خانه',daily:'روزانه',bible:'کتاب‌مقدس',plans:'برنامه‌ها',school:'مدرسه',more:'بیشتر',audio:'پیام‌های صوتی',salvation:'نیاز به نجات',about:'درباره کلیسا',settings:'تنظیمات',gratitude:'دوره شکرگزاری',meetings:'جلسات کلیسا',youversion:'کلیسای من در YouVersion',amen:'آمین',read:'خواندم؛ روز بعد باز شود',register:'ثبت‌نام',requestAccess:'درخواست دسترسی',pending:'در انتظار تأیید',approved:'تأیید شده',guest:'مهمان',login:'ثبت‌نام / دسترسی',offline:'حالت آفلاین فعال است',search:'جستجو',oldtestament:'عهد عتیق',newtestament:'عهد جدید',chapters:'باب‌ها',back:'برگشت',save:'ذخیره',saved:'ذخیره شد',notes:'یادداشت‌ها',assignment:'تکلیف',fullLesson:'متن کامل درس',playAudio:'صوت',
    appTitle:'کلیسای امیدنو۷',welcome:'به اپ کلیسای امید نو ۷ خوش آمدید',todayMessage:'پیام امروز',continueToday:'ادامه امروز',savedVerses:'آیات ذخیره‌شده من',progress:'پیشرفت من',points:'امتیازها',badges:'مدال‌ها',nextMeeting:'جلسه بعدی کلیسا',enableNotifications:'فعال‌سازی اعلان‌ها',notifications:'اعلان‌ها',notificationStatus:'وضعیت اعلان‌ها',notificationEnabled:'اعلان‌ها روی این دستگاه فعال هستند.',notificationDenied:'اعلان‌ها توسط مرورگر مسدود شده‌اند.',notificationDefault:'اعلان‌ها هنوز فعال نشده‌اند.',language:'زبان برنامه',clearProgress:'پاک کردن پیشرفت محلی',refreshData:'تازه‌سازی داده‌های اپ',version:'نسخه برنامه',dailyWord:'کلام روزانه',faithProclamation:'اعلان ایمان',dailyJuice:'آبمیوه روزانه',gratitudeCourse:'دوره شکرگزاری',day:'روز',mainVerse:'آیه اصلی',message:'پیام',prayer:'دعا / اعتراف',proclamation:'اعلان',actionStep:'قدم عملی',furtherStudy:'مطالعه بیشتر',openVerse:'باز کردن آیه',startCourse:'شروع دوره',completeDay:'ذخیره و تکمیل این روز',lockedUntilTomorrow:'روز بعد فردا باز می‌شود.',completed:'کامل شد',notStarted:'شروع نشده',videos:'ویدیوهای تولد تازه',part:'قسمت',ourVision:'رویای ما',ourBeliefs:'اعتقادات ما',churchIntro:'معرفی کلیسا',meetingsInfo:'اطلاعات جلسات',contact:'ارتباط با ما',openToday:'باز کردن مطالعه امروز',noSavedVerses:'هنوز آیه‌ای ذخیره نشده است.',readings:'مطالعه‌ها',openToRead:'برای خواندن باز کن',bookmarks:'آیات ذخیره‌شده',noAudio:'فایل‌های صوتی به‌زودی اضافه می‌شوند.',audioFormat:'فایل‌های صوتی باید با فرمت MP3 باشند.',schoolAccessText:'برای ورود به مدرسه، ثبت‌نام کنید و منتظر تأیید ادمین بمانید.',meetingAccessText:'بعد از ثبت‌نام در مدرسه و تأیید ادمین، لینک جلسه و کد امنیتی همین‌جا نمایش داده می‌شود. ثبت‌نام جداگانه برای جلسه لازم نیست.',registerDone:'درخواست شما روی این دستگاه ذخیره شد. تأیید ادمین بعداً از طریق سیستم امن وصل می‌شود.',name:'نام',email:'ایمیل',book:'کتاب',chapter:'باب',verseSaved:'آیه ذخیره شد',dailyCompleted:'مورد امروز کامل شد',all:'همه',showVerse:'نمایش آیه',hideVerse:'بستن آیه'
  },
  hr:{
    'nav.home':'Početna','nav.daily':'Dnevno','nav.bible':'Biblija','nav.plans':'Planovi','nav.school':'Škola','nav.more':'Više',
    home:'Početna',daily:'Dnevno',bible:'Biblija',plans:'Planovi',school:'Škola',more:'Više',audio:'Audio poruke',salvation:'Trebam spasenje',about:'O crkvi',settings:'Postavke',gratitude:'Plan zahvalnosti',meetings:'Crkveni sastanci',youversion:'Moja crkva na YouVersionu',amen:'Amen',read:'Pročitao sam; otključaj sljedeći dan',register:'Registracija',requestAccess:'Zatraži pristup',pending:'Čeka odobrenje',approved:'Odobreno',guest:'Gost',login:'Registracija / Pristup',offline:'Izvanmrežni način je aktivan',search:'Pretraži',oldtestament:'Stari zavjet',newtestament:'Novi zavjet',chapters:'Poglavlja',back:'Natrag',save:'Spremi',saved:'Spremljeno',notes:'Bilješke',assignment:'Zadatak',fullLesson:'Cijela pisana lekcija',playAudio:'Audio',
    appTitle:'Crkva OmideNo7',welcome:'Dobrodošli u aplikaciju crkve OmideNo7',todayMessage:'Današnja poruka',continueToday:'Nastavi danas',savedVerses:'Moji spremljeni stihovi',progress:'Moj napredak',points:'Bodovi',badges:'Medalje',nextMeeting:'Sljedeći crkveni sastanak',enableNotifications:'Uključi obavijesti',notifications:'Obavijesti',notificationStatus:'Status obavijesti',notificationEnabled:'Obavijesti su dopuštene na ovom uređaju.',notificationDenied:'Preglednik je blokirao obavijesti.',notificationDefault:'Obavijesti još nisu aktivne.',language:'Jezik aplikacije',clearProgress:'Obriši lokalni napredak',refreshData:'Osvježi podatke aplikacije',version:'Verzija aplikacije',dailyWord:'Dnevna Riječ',faithProclamation:'Proglas vjere',dailyJuice:'Dnevni sok',gratitudeCourse:'Tečaj zahvalnosti',day:'Dan',mainVerse:'Glavni stih',message:'Poruka',prayer:'Molitva / Ispovijed',proclamation:'Proglas',actionStep:'Praktični korak',furtherStudy:'Daljnje proučavanje',openVerse:'Otvori stih',startCourse:'Započni tečaj',completeDay:'Spremi i dovrši ovaj dan',lockedUntilTomorrow:'Sljedeći dan otključava se sutra.',completed:'Dovršeno',notStarted:'Nije započeto',videos:'Video lekcije o novom rođenju',part:'Dio',ourVision:'Naša vizija',ourBeliefs:'Naša vjerovanja',churchIntro:'Uvod o crkvi',meetingsInfo:'Informacije o sastancima',contact:'Kontakt',openToday:'Otvori današnje čitanje',noSavedVerses:'Još nema spremljenih stihova.',readings:'Čitanja',openToRead:'Otvori za čitanje',bookmarks:'Spremljeni stihovi',noAudio:'Audio datoteke bit će uskoro dodane.',audioFormat:'Audio datoteke moraju biti u MP3 formatu.',schoolAccessText:'Za ulazak u školu registrirajte se i pričekajte odobrenje administratora.',meetingAccessText:'Nakon registracije za školu i odobrenja administratora ovdje se prikazuju poveznica sastanka i sigurnosni kod. Posebna registracija za sastanak nije potrebna.',registerDone:'Vaš je zahtjev spremljen na ovom uređaju. Odobrenje administratora kasnije će biti povezano sigurnim sustavom.',name:'Ime',email:'Email',book:'Knjiga',chapter:'Poglavlje',verseSaved:'Stih je spremljen',dailyCompleted:'Današnja stavka je dovršena',all:'Sve',showVerse:'Prikaži stih',hideVerse:'Sakrij stih'
  }
};


const EXTRA_T = {
  en:{
    loginAccount:'Sign in / restore access',logoutAccount:'Sign out from this device',restoreAccess:'Restore access by email',restoreAccessHint:'Enter the email you used for school registration to restore approved access on this device.',restoreAccessDone:'Access check completed. If your email is approved, school and meeting access are now restored.',accountActions:'Account access',
    myNotes:'My notes',showSavedVerses:'Show saved verses',showMyNotes:'Show my notes',hide:'Hide',noNotes:'No notes yet.',registrationForm:'Registration Form',firstName:'First Name',lastName:'Last Name',birthDate:'Date of Birth',city:'City',country:'Country of Residence',spiritualAge:'How long have you been a believer?',churchMember:'Are you a member of a church?',churchName:'Church name',pastorName:'Pastor name',waterBaptism:'Have you received water baptism?',salvationPrayer:'Have you prayed the prayer of salvation?',eventsInterest:'Interested in in-person seminars/conferences?',testimony:'Testimony of coming to faith',howFound:'How did you hear about OmideNo7?',phone:'Phone number',requiredField:'Please complete all required fields.',yes:'Yes',no:'No',submitRegistration:'Submit registration',goToSalvation:'Go to salvation prayer',schoolNotApproved:'Your school access is waiting for admin approval.',meetingNotApproved:'Your meeting access is waiting for admin approval.',finalExam:'Final Exam',submitExam:'Submit exam',correctAnswers:'Correct answers',openReadingHere:'Show reading here',closeReading:'Close reading',oldAndNew:'Old Testament + New Testament',savedVersesCollapsed:'Saved verses are available here.',notesCollapsed:'All your notes are collected here.'
  },
  fa:{
    loginAccount:'ورود / بازیابی دسترسی',logoutAccount:'خروج از حساب در این دستگاه',restoreAccess:'بازیابی دسترسی با ایمیل',restoreAccessHint:'ایمیلی را که برای ثبت‌نام مدرسه استفاده کرده‌اید وارد کنید تا دسترسی تأییدشده در این دستگاه بازیابی شود.',restoreAccessDone:'بررسی دسترسی انجام شد. اگر این ایمیل تأیید شده باشد، دسترسی مدرسه و جلسات بازیابی شد.',accountActions:'دسترسی حساب',
    myNotes:'یادداشت‌های من',showSavedVerses:'نمایش آیات ذخیره‌شده',showMyNotes:'نمایش یادداشت‌های من',hide:'بستن',noNotes:'هنوز یادداشتی ذخیره نشده است.',registrationForm:'فرم ثبت‌نام',firstName:'نام',lastName:'نام خانوادگی',birthDate:'تاریخ تولد',city:'شهر محل سکونت',country:'کشور محل سکونت',spiritualAge:'چند وقت است ایمان آورده‌اید؟',churchMember:'آیا عضو کلیسایی هستید؟',churchName:'نام کلیسا',pastorName:'نام شبان',waterBaptism:'آیا تعمید آب گرفته‌اید؟',salvationPrayer:'آیا دعای نجات را خوانده‌اید؟',eventsInterest:'آیا علاقه به شرکت در سمینارها و کنفرانس‌های حضوری دارید؟',testimony:'شهادت ایمان‌آوری شما',howFound:'از چه طریقی با کلیسای امید نو ۷ آشنا شده‌اید؟',phone:'شماره تماس',requiredField:'لطفاً همه فیلدهای ضروری را کامل کنید.',yes:'بله',no:'خیر',submitRegistration:'ارسال ثبت‌نام',goToSalvation:'رفتن به دعای نجات',schoolNotApproved:'دسترسی شما به مدرسه در انتظار تأیید ادمین است.',meetingNotApproved:'دسترسی شما به جلسات در انتظار تأیید ادمین است.',finalExam:'امتحان پایان دوره',submitExam:'ارسال امتحان',correctAnswers:'پاسخ‌های درست',openReadingHere:'نمایش مطالعه در همین صفحه',closeReading:'بستن مطالعه',oldAndNew:'عهد عتیق + عهد جدید',savedVersesCollapsed:'آیات ذخیره‌شده شما اینجا قرار دارد.',notesCollapsed:'همه یادداشت‌های شما اینجا جمع می‌شود.'
  },
  hr:{
    loginAccount:'Prijava / obnova pristupa',logoutAccount:'Odjavi se s ovog uređaja',restoreAccess:'Obnovi pristup putem emaila',restoreAccessHint:'Unesite email koji ste koristili za registraciju u školu kako biste obnovili odobreni pristup na ovom uređaju.',restoreAccessDone:'Provjera pristupa je završena. Ako je email odobren, pristup školi i sastancima je obnovljen.',accountActions:'Pristup računu',
    myNotes:'Moje bilješke',showSavedVerses:'Prikaži spremljene stihove',showMyNotes:'Prikaži moje bilješke',hide:'Sakrij',noNotes:'Još nema spremljenih bilješki.',registrationForm:'Obrazac za registraciju',firstName:'Ime',lastName:'Prezime',birthDate:'Datum rođenja',city:'Grad prebivališta',country:'Država prebivališta',spiritualAge:'Koliko dugo ste vjernik?',churchMember:'Jeste li član crkve?',churchName:'Naziv crkve',pastorName:'Ime pastora',waterBaptism:'Jeste li primili krštenje u vodi?',salvationPrayer:'Jeste li molili molitvu spasenja?',eventsInterest:'Zanimate li se za seminare i konferencije uživo?',testimony:'Svjedočanstvo obraćenja',howFound:'Kako ste čuli za crkvu OmideNo7?',phone:'Broj telefona',requiredField:'Molimo ispunite sva obavezna polja.',yes:'Da',no:'Ne',submitRegistration:'Pošalji registraciju',goToSalvation:'Idi na molitvu spasenja',schoolNotApproved:'Vaš pristup školi čeka odobrenje administratora.',meetingNotApproved:'Vaš pristup sastancima čeka odobrenje administratora.',finalExam:'Završni ispit',submitExam:'Pošalji ispit',correctAnswers:'Točni odgovori',openReadingHere:'Prikaži čitanje ovdje',closeReading:'Zatvori čitanje',oldAndNew:'Stari zavjet + Novi zavjet',savedVersesCollapsed:'Spremljeni stihovi dostupni su ovdje.',notesCollapsed:'Sve vaše bilješke skupljene su ovdje.'
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


const INBOX_T = {
  en:{inbox:'Inbox',unread:'Unread',markAllRead:'Mark all as read',noInboxMessages:'No messages yet.',notificationInbox:'Notification Inbox',readMessage:'Read message',newMessage:'New message',messageRead:'Message marked as read',dailyWordReminder:'Daily Word is ready',faithReminder:'Faith proclamation is ready',juiceReminder:'Daily Juice is ready',gratitudeReminder:'Gratitude reminder',morningMeetingReminder:'Morning prayer meeting reminder',sundayMeetingReminder:'Sunday church meeting reminder',notificationAutoNote:'Automatic push sending uses OneSignal + Supabase Edge Function. This inbox also keeps messages inside the app.',deleteMessage:'Delete message',deleteAllInbox:'Delete all visible messages',cleanInbox:'Clean old mixed-language messages',deleteConfirm:'Delete this message?',deleteAllConfirm:'Delete all visible inbox messages?'},
  fa:{inbox:'صندوق ورودی',unread:'خوانده‌نشده',markAllRead:'علامت‌گذاری همه به‌عنوان خوانده‌شده',noInboxMessages:'هنوز پیامی دریافت نشده است.',notificationInbox:'صندوق ورودی اعلان‌ها',readMessage:'خواندن پیام',newMessage:'پیام جدید',messageRead:'پیام خوانده شد',dailyWordReminder:'کلام روزانه آماده است',faithReminder:'اعلان ایمان آماده است',juiceReminder:'آبمیوه روزانه آماده است',gratitudeReminder:'یادآوری شکرگزاری',morningMeetingReminder:'یادآوری جلسه دعای صبحگاهی',sundayMeetingReminder:'یادآوری جلسه کلیسای یکشنبه',notificationAutoNote:'ارسال خودکار اعلان‌ها با OneSignal و Supabase Edge Function انجام می‌شود. این صندوق، پیام‌ها را داخل اپ هم نگه می‌دارد.',deleteMessage:'پاک کردن پیام',deleteAllInbox:'پاک کردن همه پیام‌های نمایان',cleanInbox:'پاک‌سازی پیام‌های زبان دیگر',deleteConfirm:'این پیام پاک شود؟',deleteAllConfirm:'همه پیام‌های نمایان صندوق ورودی پاک شوند؟'},
  hr:{inbox:'Ulazna pošta',unread:'Nepročitano',markAllRead:'Označi sve kao pročitano',noInboxMessages:'Još nema poruka.',notificationInbox:'Ulazna pošta obavijesti',readMessage:'Pročitaj poruku',newMessage:'Nova poruka',messageRead:'Poruka je pročitana',dailyWordReminder:'Dnevna Riječ je spremna',faithReminder:'Proglas vjere je spreman',juiceReminder:'Dnevni sok je spreman',gratitudeReminder:'Podsjetnik zahvalnosti',morningMeetingReminder:'Podsjetnik za jutarnju molitvu',sundayMeetingReminder:'Podsjetnik za nedjeljni sastanak',notificationAutoNote:'Automatsko slanje push obavijesti koristi OneSignal + Supabase Edge Function. Ova ulazna pošta čuva poruke i u aplikaciji.',deleteMessage:'Obriši poruku',deleteAllInbox:'Obriši sve vidljive poruke',cleanInbox:'Očisti stare poruke na drugim jezicima',deleteConfirm:'Obrisati ovu poruku?',deleteAllConfirm:'Obrisati sve vidljive poruke iz ulazne pošte?'}
};
Object.keys(INBOX_T).forEach(lang=>Object.assign(T[lang], INBOX_T[lang]));

// V1.5.0 production-fix labels
Object.assign(T.en, {openSingleVerse:'Open this verse', openWholeChapter:'Open full chapter', deleteSavedVerse:'Delete saved verse', writeNote:'Write note', saveNote:'Save note', share:'Share', undoComplete:'Undo completion', viewPreviousDays:'View previous days', selectDay:'Select day', approvedRefreshHint:'If approved access is not visible, tap Refresh approval status or refresh app data from Settings.'});
Object.assign(T.fa, {openSingleVerse:'باز کردن همین آیه', openWholeChapter:'باز کردن کل فصل', deleteSavedVerse:'حذف آیه ذخیره‌شده', writeNote:'نوشتن یادداشت', saveNote:'ذخیره یادداشت', share:'اشتراک‌گذاری', undoComplete:'لغو تکمیل امروز', viewPreviousDays:'مشاهده روزهای قبلی', selectDay:'انتخاب روز', approvedRefreshHint:'اگر دسترسی تأیید شده هنوز دیده نمی‌شود، «تازه‌سازی وضعیت تأیید» یا «تازه‌سازی داده‌های اپ» را بزنید.'});
Object.assign(T.hr, {openSingleVerse:'Otvori ovaj stih', openWholeChapter:'Otvori cijelo poglavlje', deleteSavedVerse:'Izbriši spremljeni stih', writeNote:'Napiši bilješku', saveNote:'Spremi bilješku', share:'Podijeli', undoComplete:'Poništi završetak', viewPreviousDays:'Prikaži prethodne dane', selectDay:'Odaberi dan', approvedRefreshHint:'Ako se odobreni pristup ne vidi, dodirnite Osvježi status odobrenja ili Osvježi podatke aplikacije u postavkama.'});

Object.assign(T.en, {highlight:'Highlight', account:'Account', forgotPassword:'Forgot password?', resetPassword:'Send password reset email', resetPasswordSent:'If this email exists, a reset link has been sent.', enterSchool:'Enter school', refreshApproval:'Refresh approval status', enterMeeting:'Enter meeting', myAccess:'My access', previousDay:'Previous day', today:'Today', nextDay:'Next day', alreadyAsked:'This question has already been submitted. Please wait for the answer in the app.', questionSent:'Your question was submitted anonymously to the public list. Please wait up to two weeks for the answer in the app.', qnaWaitNotice:'After submitting a question, please wait up to two weeks. The answer will appear inside the app.', askQuestionOnce:'Please do not submit the same question more than once.'});
Object.assign(T.fa, {highlight:'هایلایت', account:'حساب کاربری', forgotPassword:'فراموشی رمز عبور؟', resetPassword:'ارسال لینک بازیابی رمز', resetPasswordSent:'اگر این ایمیل در سیستم وجود داشته باشد، لینک بازیابی رمز ارسال شد.', enterSchool:'ورود به مدرسه', refreshApproval:'تازه‌سازی وضعیت تأیید', enterMeeting:'ورود به جلسه', myAccess:'دسترسی من', previousDay:'روز قبل', today:'امروز', nextDay:'روز بعد', alreadyAsked:'این سؤال قبلاً ثبت شده است. لطفاً منتظر پاسخ در اپ بمانید.', questionSent:'سؤال شما ثبت شد. برای همه به صورت گمنام نمایش داده می‌شود. لطفاً تا دو هفته منتظر پاسخ در اپ بمانید.', qnaWaitNotice:'بعد از ثبت سؤال، لطفاً تا دو هفته منتظر پاسخ باشید. پاسخ داخل اپ نمایش داده می‌شود.', askQuestionOnce:'لطفاً سؤال تکراری ثبت نکنید.'});
Object.assign(T.hr, {highlight:'Označi', account:'Račun', forgotPassword:'Zaboravili ste lozinku?', resetPassword:'Pošalji email za reset lozinke', resetPasswordSent:'Ako ova email adresa postoji, poveznica za reset je poslana.', enterSchool:'Uđi u školu', refreshApproval:'Osvježi status odobrenja', enterMeeting:'Uđi u sastanak', myAccess:'Moj pristup', previousDay:'Prethodni dan', today:'Danas', nextDay:'Sljedeći dan', alreadyAsked:'Ovo pitanje je već poslano. Molimo pričekajte odgovor u aplikaciji.', questionSent:'Vaše pitanje je poslano anonimno na javni popis. Pričekajte odgovor u aplikaciji do dva tjedna.', qnaWaitNotice:'Nakon slanja pitanja pričekajte do dva tjedna. Odgovor će se prikazati u aplikaciji.', askQuestionOnce:'Nemojte slati isto pitanje više puta.'});



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
    const manual=(localStorage.getItem('nh7_manual_email')||'').trim().toLowerCase();
    const m=JSON.parse(localStorage.getItem('nh7_meeting_access')||'{}');
    const s=JSON.parse(localStorage.getItem('nh7_school_access')||'{}');
    return (manual || s.email || m.email || '').trim().toLowerCase();
  }catch(e){ return (localStorage.getItem('nh7_manual_email')||'').trim().toLowerCase(); }
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

async function cloudRpc(name, payload={}){
  return cloudFetch('rpc/'+name, {method:'POST', body:JSON.stringify(payload)});
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
  const profile=getKnownUserProfile();
  const payload={device_id:deviceId(), question_text:questionText, author_name:profile.name||null, author_email:profile.email||null, language:state.lang, status:'pending'};
  await saveCloud({type:'insert', table:'qa_questions', payload});
}
async function saveInboxCloud(item){
  const payload={
    id:String(item.id),
    device_id:deviceId(),
    user_email:currentUserEmail() || null,
    title:item.title,
    body:item.body,
    category:item.category || 'app',
    language:item.language || item.lang || state.lang,
    delivered_at:item.createdAt || new Date().toISOString(),
    read_at:item.read ? (item.readAt || new Date().toISOString()) : null
  };
  await saveCloud({type:'upsert', table:'notification_inbox', conflict:'id', payload});
}

async function fetchLatestRegistration(kind){
  if(!CLOUD_ENABLED || !navigator.onLine) return null;
  const localKey = kind==='meeting' ? 'nh7_meeting_access' : 'nh7_school_access';
  try{
    const local = JSON.parse(localStorage.getItem(localKey)||'{}');
    const email = (local.email || currentUserEmail() || '').trim().toLowerCase();
    const normalize = (row)=>Object.assign({}, row?.payload||{}, {
      email: (row?.payload?.email || email || local.email || '').trim().toLowerCase(),
      status: row?.status || 'pending',
      cloudId: row?.id || local.cloudId || '',
      approvedBy: row?.status==='approved' ? 'admin' : (local.approvedBy||''),
      syncedAt: new Date().toISOString()
    });

    // Preferred: secure RPC installed by the SQL file. It gives priority to any approved row by email.
    try{
      const rpcRows = await cloudRpc('nh7_registration_status', {p_type:kind, p_email:email, p_device_id:deviceId()});
      const r = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
      if(r && r.found){
        const data = Object.assign({}, local, {
          email: (email || r.email || local.email || '').trim().toLowerCase(),
          status: r.status || 'pending',
          cloudId: r.registration_id || local.cloudId || '',
          approvedBy: r.approved ? 'admin' : (local.approvedBy||''),
          syncedAt: new Date().toISOString()
        });
        localStorage.setItem(localKey, JSON.stringify(data));
        return data;
      }
    }catch(rpcErr){ console.warn('Registration RPC status check failed, using REST fallback', rpcErr); }

    // Robust REST fallback: load recent rows and match locally by email or device.
    let rows = await cloudFetch(`registrations?select=*&type=eq.${encodeURIComponent(kind)}&order=updated_at.desc,created_at.desc&limit=300`, {method:'GET'}).catch(()=>[]);
    rows = Array.isArray(rows) ? rows : [];
    const dev = deviceId();
    const matches = rows.filter(r=>{
      const p=r.payload||{};
      const re=String(p.email||'').trim().toLowerCase();
      return (email && re===email) || String(r.device_id||'')===dev;
    });
    const row = matches.find(r=>r.status==='approved') || matches[0] || null;
    if(row){ const data=normalize(row); localStorage.setItem(localKey, JSON.stringify(data)); return data; }
  }catch(e){ console.warn('Registration status check failed', e); }
  return null;
}
function defaultMeetingSettings(){
  return {
    id:'fallback',
    meeting_url:'https://fccdl.in/i/omideno7church',
    phone_number:'',
    access_code:'',
    security_code:'789987',
    extra_info: state.lang==='fa' ? 'جلسه دعا هر روز ساعت ۵ صبح به وقت کرواسی برگزار می‌شود. برای ورود، روی لینک جلسه بزنید و فقط کد امنیتی را وارد کنید.' : (state.lang==='hr' ? 'Molitveni sastanak održava se svaki dan u 05:00 po hrvatskom vremenu. Za ulazak otvorite poveznicu i unesite samo sigurnosni kod.' : 'Prayer meeting is held daily at 05:00 Croatia time. To join, open the meeting link and enter only the security code.')
  };
}
async function fetchMeetingSettings(){
  if(!CLOUD_ENABLED || !navigator.onLine) return defaultMeetingSettings();
  try{
    // v1.6.4: use a security-definer RPC so approved school/meeting users always receive
    // the latest admin-edited meeting link and security code. This avoids RLS/header/cache
    // issues that caused the app to fall back to the old built-in meeting details.
    try{
      const rpc = await cloudRpc('nh7_get_meeting_settings', {
        p_email: currentUserEmail(),
        p_device_id: deviceId()
      });
      const row = Array.isArray(rpc) ? rpc[0] : rpc;
      if(row && (row.meeting_url || row.security_code || row.extra_info)){
        return Object.assign(defaultMeetingSettings(), row, {phone_number:'', access_code:''});
      }
    }catch(rpcErr){
      console.warn('Meeting settings RPC failed, trying REST fallback', rpcErr);
    }

    const rows = await cloudFetch('meeting_settings?select=*&id=eq.active&limit=1&_ts='+Date.now(), {method:'GET', headers:{'Cache-Control':'no-cache'}});
    const row = Array.isArray(rows) ? rows[0] : null;
    return row ? Object.assign(defaultMeetingSettings(), row, {phone_number:'', access_code:''}) : defaultMeetingSettings();
  }catch(e){ console.warn('Meeting settings load failed', e); return defaultMeetingSettings(); }
}
function renderMeetingDetails(settings){
  if(!settings) return `<div class="notice">${tr('notConfigured')}</div>`;
  const link = settings.meeting_url || '';
  const security = settings.security_code || '';
  const extra = settings.extra_info || defaultMeetingSettings().extra_info || '';
  return `<div class="notice"><h3>${tr('meetingDetails')}</h3>
    ${link?`<p><strong>${tr('meetingLink')}:</strong> <a class="primary-btn inline-link" href="${html(link)}" target="_blank" rel="noopener">${tr('openMeeting')}</a></p>`:''}
    ${security?`<p><strong>${tr('securityCode')}:</strong> <span class="code-box">${html(security)}</span></p>`:''}
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
async function jfetch(path){ if(state.data[path]) return state.data[path]; const res=await fetch(path, {cache:'no-cache'}); if(!res.ok) throw new Error(path); const data=await res.json(); state.data[path]=data; return data; }
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
function navigate(route, params={}, replace=false){
  if(!replace && state.route) state.stack.push({route:state.route, params:state.params});
  state.route=route; state.params=params||{};
  try{ const url='#'+encodeURIComponent(route)+(Object.keys(state.params).length?':'+encodeURIComponent(JSON.stringify(state.params)):''); replace ? history.replaceState({route,params:state.params},'',url) : history.pushState({route,params:state.params},'',url); }catch(e){}
  render(route, state.params);
}
function back(){
  const prev=state.stack.pop();
  if(prev){ state.route=prev.route; state.params=prev.params; render(prev.route, prev.params, true); try{ history.replaceState({route:prev.route,params:prev.params},'', '#'+encodeURIComponent(prev.route)); }catch(e){} return; }
  if(state.route && state.route!=='home'){ state.route='home'; state.params={}; render('home',{},true); try{ history.replaceState({route:'home',params:{}},'', '#home'); }catch(e){} }
}
function card(title, body, cls=''){ return `<section class="card ${cls}">${title?`<h2>${html(title)}</h2>`:''}${body}</section>`; }
function tile(route, emoji, title, sub='', params={}){ return `<button class="tile" data-go="${html(route)}" data-params='${html(JSON.stringify(params||{}))}'><span class="emoji">${emoji}</span><strong>${html(title)}</strong>${sub?`<small>${html(sub)}</small>`:''}</button>`; }
function notice(text){ return `<div class="notice">${html(text)}</div>`; }
function registrationStatus(access={}){ return access.status==='pending'?tr('pending'):(access.status==='approved'?tr('approved'):tr('guest')); }
function optionYesNo(value=''){ return `<option value="">---</option><option value="yes" ${value==='yes'?'selected':''}>${tr('yes')}</option><option value="no" ${value==='no'?'selected':''}>${tr('no')}</option>`; }
function normalizeQuestionText(q){ return String(q||'').trim().replace(/\s+/g,' ').toLowerCase(); }
function getKnownUserProfile(){
  try{
    const s=JSON.parse(localStorage.getItem('nh7_school_access')||'{}');
    const m=JSON.parse(localStorage.getItem('nh7_meeting_access')||'{}');
    const p=Object.assign({}, m||{}, s||{});
    return {name:String((p.firstName||'')+' '+(p.lastName||'')).trim(), email:String(p.email||currentUserEmail()||'').trim().toLowerCase(), phone:String(p.phone||'').trim()};
  }catch(e){ return {name:'',email:currentUserEmail(),phone:''}; }
}

function registrationFormHtml(kind, access={}){
  const v=(k)=>html(access[k]||'');
  const dobHint = state.lang==='fa' ? 'روز / ماه / سال' : (state.lang==='hr' ? 'dan / mjesec / godina' : 'day / month / year');
  return card(tr('registrationForm'), `
    <div class="form-row"><input id="reg_firstName" required placeholder="${tr('firstName')} *" value="${v('firstName')}"></div>
    <div class="form-row"><input id="reg_lastName" required placeholder="${tr('lastName')} *" value="${v('lastName')}"></div>
    <div class="form-row"><label for="reg_birthDate"><strong>${tr('birthDate')} *</strong><small>${dobHint}</small></label><input id="reg_birthDate" required type="date" aria-label="${tr('birthDate')}" value="${v('birthDate')}"></div>
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
  const unique=[...new Set((bookmarks||[]).filter(Boolean))];
  const items=unique.slice().reverse().map(ref=>`
    <div class="saved-verse-card">
      <strong>${html(localizeRef(ref))}</strong>
      <div class="button-row saved-verse-actions">
        <button class="secondary-btn" data-open-ref="${html(ref)}" data-open-ref-mode="verse">${tr('openSingleVerse')}</button>
        <button class="secondary-btn" data-open-ref="${html(ref)}" data-open-ref-mode="chapter">${tr('openWholeChapter')}</button>
        <button class="danger-btn" data-delete-bookmark="${html(ref)}">${tr('deleteSavedVerse')}</button>
      </div>
    </div>`).join('');
  return `<button class="secondary-btn" data-toggle-panel="savedVersesPanel">${tr('showSavedVerses')}</button><div id="savedVersesPanel" class="collapsible-panel hidden">${unique.length?`<div class="list">${items}</div>`:`<p class="muted">${tr('noSavedVerses')}</p>`}</div>`;
}
function notesPanel(){
  const notes=collectNotes();
  return `<button class="secondary-btn" data-toggle-panel="notesPanel">${tr('showMyNotes')}</button><div id="notesPanel" class="collapsible-panel hidden">${notes.length?`<div class="list">${notes.reverse().map(n=>`<div class="notice"><strong>${html(n.key)}</strong><p>${html(n.text)}</p></div>`).join('')}</div>`:`<p class="muted">${tr('noNotes')}</p>`}</div>`;
}



function inboxMessages(){
  return JSON.parse(localStorage.getItem('nh7_inbox_messages')||'[]');
}
function setInboxMessages(arr){
  localStorage.setItem('nh7_inbox_messages', JSON.stringify(arr));
  updateInboxBadge();
}
function inboxDeletedIds(){
  try{ return new Set(JSON.parse(localStorage.getItem('nh7_inbox_deleted_ids')||'[]').map(String)); }catch(e){ return new Set(); }
}
function setInboxDeletedIds(set){
  localStorage.setItem('nh7_inbox_deleted_ids', JSON.stringify(Array.from(set).slice(-500)));
}
function markInboxDeleted(ids){
  const deleted=inboxDeletedIds();
  ids.filter(Boolean).map(String).forEach(id=>deleted.add(id));
  setInboxDeletedIds(deleted);
}
function rawInboxLanguage(m){ return String(m.language || m.lang || '').toLowerCase(); }
function rawInboxLooksLikeOtherLanguage(m){
  const key=inboxMessageKey(m);
  if(!key) return false;
  const lang=rawInboxLanguage(m);
  if(lang && lang!==state.lang) return true;
  const text=(String(m.title||'')+' '+String(m.body||'')).toLowerCase();
  if(state.lang==='fa') return /daily word|faith proclamation|daily juice|gratitude reminder|morning prayer|sunday church|dnevni|podsjetnik|proglas vjere|zahvalnosti|molitv/.test(text);
  if(state.lang==='en') return /کلام روزانه|اعلان ایمان|آبمیوه|آب حیات|شکرگزاری|صبحگاهی|یکشنبه|dnevni|podsjetnik|proglas vjere|zahvalnosti|molitv/.test(text);
  if(state.lang==='hr') return /کلام روزانه|اعلان ایمان|آبمیوه|آب حیات|شکرگزاری|صبحگاهی|یکشنبه|daily word|faith proclamation|daily juice|gratitude reminder|morning prayer|sunday church/.test(text);
  return false;
}
function cleanupInboxLanguage(){
  const deleted=inboxDeletedIds();
  const cleaned=inboxMessages().filter(m=>!deleted.has(String(m.id)) && !rawInboxLooksLikeOtherLanguage(m));
  if(cleaned.length!==inboxMessages().length) setInboxMessages(cleaned);
}
async function deleteInboxCloud(id){
  if(!id || !CLOUD_ENABLED || !navigator.onLine) return;
  try{ await cloudFetch(`notification_inbox?id=eq.${encodeURIComponent(String(id))}`, {method:'DELETE', headers:{Prefer:'return=minimal'}}); }catch(e){ console.warn('Inbox cloud delete failed', e); }
}
function deleteInboxLocal(id){
  const target=inboxMessages().find(m=>String(m.id)===String(id));
  const key=target ? inboxMessageKey(target) : '';
  const minute=target ? String(target.createdAt||'').slice(0,16) : '';
  const ids=[];
  const remaining=inboxMessages().filter(m=>{
    const sameId=String(m.id)===String(id);
    const sameGroup=key && inboxMessageKey(m)===key && String(m.createdAt||'').slice(0,16)===minute;
    if(sameId || sameGroup){ ids.push(String(m.id)); return false; }
    return true;
  });
  markInboxDeleted(ids.length?ids:[String(id)]);
  setInboxMessages(remaining);
  ids.forEach(x=>deleteInboxCloud(x));
}
function deleteVisibleInbox(){
  const visible=inboxDisplayMessages();
  const ids=new Set();
  visible.forEach(v=>{
    const key=inboxMessageKey(v); const minute=String(v.createdAt||'').slice(0,16);
    inboxMessages().forEach(m=>{ if(String(m.id)===String(v.id) || (key && inboxMessageKey(m)===key && String(m.createdAt||'').slice(0,16)===minute)) ids.add(String(m.id)); });
  });
  markInboxDeleted(Array.from(ids));
  setInboxMessages(inboxMessages().filter(m=>!ids.has(String(m.id))));
  ids.forEach(x=>deleteInboxCloud(x));
}
const INBOX_LOCALIZED_MESSAGES = {
  daily_word:{
    en:['Daily Word is ready','Receive God’s Word today and start your day in faith.'],
    fa:['کلام روزانه آماده است','امروز کلام خدا را دریافت کن و روزت را با ایمان شروع کن.'],
    hr:['Dnevna Riječ je spremna','Primi Božju Riječ danas i započni dan u vjeri.']
  },
  faith:{
    en:['Faith proclamation is ready','It is time for your faith proclamation; speak the Word.'],
    fa:['اعلان ایمان آماده است','وقت اعلان ایمان است؛ کلام را با دهانت اعلام کن.'],
    hr:['Proglas vjere je spreman','Vrijeme je za proglas vjere; izgovori Riječ.']
  },
  daily_juice:{
    en:['Daily Juice is ready','Today’s Daily Juice is ready; take a few minutes to strengthen your spirit.'],
    fa:['آب حیات روزانه آماده است','آب حیات روزانه امروز آماده است؛ چند دقیقه برای تقویت روح خود وقت بگذار.'],
    hr:['Dnevni sok je spreman','Današnji Daily Juice je spreman; odvoji nekoliko minuta za svoj duh.']
  },
  gratitude:{
    en:['Gratitude reminder','End today with thanksgiving and remember God’s goodness.'],
    fa:['یادآوری شکرگزاری','امروز را با شکرگزاری به پایان برسان و نیکویی خدا را به یاد آور.'],
    hr:['Podsjetnik zahvalnosti','Završi dan zahvalnošću i sjeti se Božje dobrote.']
  },
  morning_meeting:{
    en:['Morning prayer meeting reminder','The morning prayer meeting starts in 5 minutes.'],
    fa:['یادآوری جلسه دعای صبحگاهی','جلسه دعای صبحگاهی کلیسا ۵ دقیقه دیگر آغاز می‌شود.'],
    hr:['Podsjetnik za jutarnju molitvu','Jutarnji molitveni sastanak počinje za 5 minuta.']
  },
  sunday_service:{
    en:['Sunday church meeting reminder','The Sunday church meeting is ready. Tap to join.'],
    fa:['یادآوری جلسه کلیسای یکشنبه','جلسه کلیسای یکشنبه آماده است. برای ورود به جلسه کلیک کن.'],
    hr:['Podsjetnik za nedjeljni sastanak','Nedjeljni crkveni sastanak je spreman. Dodirni za ulazak.']
  }
};
function inboxMessageKey(m){
  const c=String(m.category||'').toLowerCase();
  const t=String(m.title||'').toLowerCase();
  const b=String(m.body||'').toLowerCase();
  if(c==='daily_word' || t.includes('daily word') || t.includes('کلام روزانه') || t.includes('dnevna riječ')) return 'daily_word';
  if(c==='faith' || t.includes('faith proclamation') || t.includes('اعلان ایمان') || t.includes('proglas vjere')) return 'faith';
  if(c==='daily_juice' || c==='juice' || t.includes('daily juice') || t.includes('آبمیوه') || t.includes('آب حیات') || t.includes('dnevni sok')) return 'daily_juice';
  if(c==='gratitude' || t.includes('gratitude') || t.includes('شکرگزاری') || t.includes('zahvalnosti')) return 'gratitude';
  if(c==='morning_meeting' || t.includes('morning prayer') || t.includes('دعای صبحگاهی') || t.includes('jutarnju molitvu')) return 'morning_meeting';
  if(c==='sunday_service' || t.includes('sunday church') || t.includes('یکشنبه') || t.includes('nedjeljni')) return 'sunday_service';
  if(c==='meeting' && (b.includes('morning') || b.includes('صبح') || b.includes('jutarnji'))) return 'morning_meeting';
  if(c==='meeting' && (b.includes('sunday') || b.includes('یکشنبه') || b.includes('nedjeljni'))) return 'sunday_service';
  return '';
}
function normalizedInboxMessage(m){
  const lang = String(m.language || m.lang || '').toLowerCase();
  const key = inboxMessageKey(m);
  if(lang && lang!==state.lang && !key) return null;
  if(key && INBOX_LOCALIZED_MESSAGES[key]){
    const [title, body] = INBOX_LOCALIZED_MESSAGES[key][state.lang] || INBOX_LOCALIZED_MESSAGES[key].en;
    return Object.assign({}, m, {title, body, category:key, displayLang:state.lang});
  }
  if(lang && lang!==state.lang) return null;
  return Object.assign({}, m, {displayLang: lang || state.lang});
}
function inboxDisplayMessages(){
  const deleted=inboxDeletedIds();
  const seen=new Map();
  inboxMessages().filter(m=>!deleted.has(String(m.id))).map(normalizedInboxMessage).filter(Boolean).forEach(m=>{
    const key=inboxMessageKey(m) || String(m.id);
    const minute=String(m.createdAt||'').slice(0,16);
    const group=key+'_'+minute;
    const existing=seen.get(group);
    if(!existing) seen.set(group,m);
    else if((m.language||m.lang)===state.lang && (existing.language||existing.lang)!==state.lang) seen.set(group,m);
  });
  return Array.from(seen.values()).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
}
function unreadCount(){ return inboxDisplayMessages().filter(m=>!m.read).length; }
function updateInboxBadge(){
  const count=unreadCount();
  const badge=$('#inboxBadge');
  if(badge){ badge.textContent=count>99?'99+':String(count); badge.classList.toggle('hidden', count===0); }
  if('setAppBadge' in navigator){ try{ count>0 ? navigator.setAppBadge(count) : navigator.clearAppBadge(); }catch(e){} }
}
function addInboxMessage(title, body, category='app', id=null){
  const arr=inboxMessages();
  const mid=(id ? id+'_'+state.lang : (category+'_'+state.lang+'_'+todayKey()+'_'+title.replace(/\W+/g,'_').slice(0,24)));
  if(inboxDeletedIds().has(String(mid))) return;
  if(arr.some(m=>m.id===mid)) return;
  const item={id:mid,title,body,category,createdAt:new Date().toISOString(),read:false,lang:state.lang,language:state.lang};
  arr.unshift(item); setInboxMessages(arr.slice(0,100));
  saveInboxCloud(item).catch(console.warn);
}
function notificationBodies(){
  if(state.lang==='fa') return {
    daily:'امروز کلام خدا را دریافت کن و روزت را با ایمان شروع کن.',
    faith:'وقت اعلان ایمان است؛ کلام را با دهانت اعلام کن.',
    juice:'آبمیوه روزانه امروز آماده است؛ چند دقیقه برای تقویت روح خود وقت بگذار.',
    gratitude:'امروز را با شکرگزاری به پایان برسان و نیکویی خدا را به یاد آور.',
    morning:'جلسه دعای صبحگاهی کلیسا ۵ دقیقه دیگر آغاز می‌شود.',
    sunday:'جلسه کلیسای یکشنبه آماده است. برای ورود به جلسه کلیک کن.'
  };
  if(state.lang==='hr') return {
    daily:'Primi Božju Riječ danas i započni dan u vjeri.',
    faith:'Vrijeme je za proglas vjere; izgovori Riječ.',
    juice:'Današnji Daily Juice je spreman; odvoji nekoliko minuta za svoj duh.',
    gratitude:'Završi dan zahvalnošću i sjeti se Božje dobrote.',
    morning:'Jutarnji molitveni sastanak počinje za 5 minuta.',
    sunday:'Nedjeljni crkveni sastanak je spreman. Dodirni za ulazak.'
  };
  return {
    daily:'Receive God’s Word today and start your day in faith.',
    faith:'It is time for your faith proclamation; speak the Word.',
    juice:'Today’s Daily Juice is ready; take a few minutes to strengthen your spirit.',
    gratitude:'End today with thanksgiving and remember God’s goodness.',
    morning:'The morning prayer meeting starts in 5 minutes.',
    sunday:'The Sunday church meeting is ready. Tap to join.'
  };
}
function maybeCreateScheduledInboxMessages(){
  const permission = localStorage.getItem('nh7_notifications_permission');
  if(permission!=='granted') return;
  const now=new Date(); const key=todayKey(); const h=now.getHours(); const m=now.getMinutes(); const b=notificationBodies();
  const items=[
    {hour:7, min:0, id:'daily_word', title:tr('dailyWordReminder'), body:b.daily},
    {hour:12, min:0, id:'faith', title:tr('faithReminder'), body:b.faith},
    {hour:17, min:0, id:'juice', title:tr('juiceReminder'), body:b.juice},
    {hour:21, min:0, id:'gratitude', title:tr('gratitudeReminder'), body:b.gratitude}
  ];
  items.forEach(it=>{ if(h>it.hour || (h===it.hour && m>=it.min)) addInboxMessage(it.title,it.body,it.id,it.id+'_'+key); });
  try{
    const zagreb = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Zagreb',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(now);
    const hh=Number(zagreb.find(p=>p.type==='hour')?.value||0); const mm=Number(zagreb.find(p=>p.type==='minute')?.value||0); const wd=zagreb.find(p=>p.type==='weekday')?.value;
    if(hh>4 || (hh===4 && mm>=55)) addInboxMessage(tr('morningMeetingReminder'), b.morning, 'morning_meeting','morning_'+key);
    if(wd==='Sun' && (hh>20 || (hh===20 && mm>=0))) addInboxMessage(tr('sundayMeetingReminder'), b.sunday, 'sunday_service','sunday_'+key);
  }catch(e){}
}
async function refreshInboxFromCloud(){
  try{
    const email=currentUserEmail();
    const q=email?`notification_inbox?select=id,title,body,category,language,delivered_at,read_at&or=(device_id.eq.${encodeURIComponent(deviceId())},user_email.eq.${encodeURIComponent(email)})&order=delivered_at.desc&limit=50`:`notification_inbox?select=id,title,body,category,language,delivered_at,read_at&device_id=eq.${encodeURIComponent(deviceId())}&order=delivered_at.desc&limit=50`;
    const rawOwnRows=await cloudFetch(q,{method:'GET'});
    const ownRows=Array.isArray(rawOwnRows) ? rawOwnRows.filter(r=>!r.language || r.language===state.lang) : [];
    let globalRows=[];
    try{ globalRows=await cloudFetch(`notification_inbox?select=id,title,body,category,language,delivered_at,read_at&device_id=is.null&user_email=is.null&language=eq.${encodeURIComponent(state.lang)}&order=delivered_at.desc&limit=50`,{method:'GET'}); }catch(e){}
    const rows=[...(Array.isArray(ownRows)?ownRows:[]), ...(Array.isArray(globalRows)?globalRows:[])];
    if(rows.length){
      const deleted=inboxDeletedIds();
      const local=inboxMessages().filter(x=>!deleted.has(String(x.id)) && !rawInboxLooksLikeOtherLanguage(x)); const byId=new Map(local.map(x=>[String(x.id),x]));
      rows.forEach(r=>{ const id=String(r.id); if(!deleted.has(id) && !byId.has(id)) byId.set(id,{id,title:r.title,body:r.body,category:r.category||'cloud',language:r.language||state.lang,createdAt:r.delivered_at,read:!!r.read_at,lang:r.language||state.lang}); });
      setInboxMessages(Array.from(byId.values()).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,100));
    }
  }catch(e){ console.warn('Inbox cloud fetch failed', e); }
}
async function inbox(){
  cleanupInboxLanguage();
  maybeCreateScheduledInboxMessages(); await refreshInboxFromCloud();
  cleanupInboxLanguage();
  const arr=inboxDisplayMessages();
  const body = arr.length ? `<div class="list inbox-list">${arr.map((m,i)=>`<div class="list-btn inbox-item ${m.read?'read':'unread'}"><button class="list-btn inbox-item ${m.read?'read':'unread'}" data-inbox-open="${html(m.id)}"><strong>${m.read?'':'● '}${html(m.title)}</strong><small>${new Date(m.createdAt).toLocaleString()} • ${m.read?tr('completed'):tr('unread')}</small></button><div id="inbox-${html(String(m.id).replace(/[^a-zA-Z0-9_-]/g,'_'))}" class="accordion-panel hidden"><p>${html(m.body)}</p><button class="danger-btn" data-inbox-delete="${html(m.id)}">${tr('deleteMessage')}</button></div></div>`).join('')}</div>` : `<p class="muted">${tr('noInboxMessages')}</p>`;
  view.innerHTML = card(tr('notificationInbox'), `<p class="muted">${tr('notificationAutoNote')}</p><div class="button-row"><span class="badge">${tr('unread')}: ${localNum(unreadCount())}</span><button class="secondary-btn" id="markAllRead">${tr('markAllRead')}</button><button class="secondary-btn" id="cleanInboxLang">${tr('cleanInbox')}</button><button class="danger-btn" id="deleteVisibleInbox">${tr('deleteAllInbox')}</button></div>${body}`);
  $('#markAllRead')?.addEventListener('click',()=>{ const all=inboxMessages().map(m=>({...m,read:true,readAt:new Date().toISOString()})); setInboxMessages(all); render('inbox',{},true); });
  $('#cleanInboxLang')?.addEventListener('click',()=>{ cleanupInboxLanguage(); render('inbox',{},true); });
  $('#deleteVisibleInbox')?.addEventListener('click',()=>{ if(confirm(tr('deleteAllConfirm'))){ deleteVisibleInbox(); render('inbox',{},true); } });
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
    else if(route==='inbox') await inbox();
    else if(route==='gratitude'){ state.dailyTab='gratitude'; await daily(Object.assign({}, params, {tab:'gratitude'})); }
    else if(route==='account') await account();
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
  if(state.dailyTab==='word') out += await renderDailyType('data/daily/daily_word_365.json','message','prayer','word',null,params);
  if(state.dailyTab==='faith') out += await renderDailyType('data/daily/faith_proclamations_365.json','proclamation',null,'faith',null,params);
  if(state.dailyTab==='juice') out += await renderDailyType('data/daily/daily_juice_365.json','message','prayer','juice','actionStep',params);
  if(state.dailyTab==='gratitude') out += await renderGratitude();
  view.innerHTML=out;
}
async function renderDailyType(path, mainKey, prayerKey, type, extraKey, params={}){
  const d=await jfetch(path); const list=itemsOf(d); const todayDay=userCycleDay(list.length);
  let day=Number(params.day||0); if(!day || day<1 || day>list.length) day=todayDay;
  const it=list[day-1]||{};
  const prev=Math.max(1,day-1), next=Math.min(list.length,day+1);
  const nav=`<div class="button-row daily-nav"><button class="secondary-btn" data-go="daily" data-params='${html(JSON.stringify({tab:type==='word'?'word':type,day:prev}))}' ${day===1?'disabled':''}>${tr('previousDay')}</button><button class="secondary-btn" data-go="daily" data-params='${html(JSON.stringify({tab:type==='word'?'word':type,day:todayDay}))}'>${tr('today')}</button><button class="secondary-btn" data-go="daily" data-params='${html(JSON.stringify({tab:type==='word'?'word':type,day:next}))}' ${day===list.length?'disabled':''}>${tr('nextDay')}</button></div>`;
  return nav + await dailyDetail(it, day, list.length, mainKey, prayerKey, type, extraKey);
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
  const doneKey='nh7_daily_done_'+type+'-'+day;
  const isDone=!!localStorage.getItem(doneKey);
  let body=`<span class="badge">${tr('day')} ${localNum(day)} / ${localNum(total)}</span>`;
  if(isDone) body+=`<div class="notice success-notice">${tr('dailyCompleted')}</div>`;
  if(verse.reference || pick(verse.text)) body += `<h3>${tr('mainVerse')}</h3><div class="notice verse-card">${verse.reference?verseRevealButton(verse.reference,pick(verse.text)):`<p>${html(pick(verse.text))}</p>`}</div>`;
  if(it[mainKey]) body += `<h3>${mainKey==='proclamation'?tr('proclamation'):tr('message')}</h3><p>${html(pick(it[mainKey]))}</p>`;
  if(extraKey && it[extraKey]) body += `<h3>${tr('actionStep')}</h3>${renderMulti(it[extraKey])}`;
  if(prayerKey && it[prayerKey]) body += `<h3>${tr('prayer')}</h3><p>${html(pick(it[prayerKey]))}</p>`;
  if(Array.isArray(it.furtherStudy) && it.furtherStudy.length){
    body += `<h3>${tr('furtherStudy')}</h3><div class="list">${it.furtherStudy.map(fs=>`<div class="verse-list-item">${verseRevealButton(fs.reference||'',pick(fs.text))}</div>`).join('')}</div>`;
  }
  body += `<div class="button-row"><button class="primary-btn" data-complete-daily="${type}-${day}">${isDone?tr('dailyCompleted'):tr('completeDay')}</button></div>`;
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
  if(!start){ return card(tr('gratitudeCourse'), `<p>${tr('gratitudeCourse')} - ${localNum(list.length||30)} ${tr('day')}</p><button class="primary-btn" id="startGratitude">${tr('startCourse')}</button>`); }
  const daysSince=dateDiffDays(start,todayKey());
  const completed=JSON.parse(localStorage.getItem('nh7_gratitude_completed')||'[]');
  const unlocked=Math.min(daysSince+1, list.length);
  let requested=Number(state.params?.gday||0);
  const nextDay=Math.min((completed.length+1), list.length);
  const current=requested && requested<=unlocked ? requested : Math.min(nextDay, unlocked);
  const it=list[current-1]||list[0];
  const isDone=completed.includes(current);
  const dayButtons=Array.from({length:unlocked},(_,i)=>i+1).map(n=>`<button class="secondary-btn ${n===current?'active-day':''}" data-go="daily" data-params='${html(JSON.stringify({tab:'gratitude',gday:n}))}'>${tr('day')} ${localNum(n)}${completed.includes(n)?' ✓':''}</button>`).join('');
  let body=`<span class="badge">${tr('day')} ${localNum(current)} / ${localNum(list.length)}</span>`;
  body+=`<div class="notice"><strong>${tr('viewPreviousDays')}</strong><div class="button-row day-selector">${dayButtons}</div></div>`;
  if(isDone) body+=`<div class="notice success-notice">${tr('completed')}</div>`;
  if(it.mainVerse) body+=`<h3>${tr('mainVerse')}</h3><div class="notice verse-card">${verseRevealButton(it.mainVerse.reference||'',pick(it.mainVerse.text))}</div>`;
  body+=`<h3>${tr('message')}</h3><p>${html(pick(it.teaching))}</p>`;
  if(it.dailyTasks) body+=`<h3>${tr('actionStep')}</h3>${renderMulti(it.dailyTasks)}`;
  if(it.understandingQuestions) body+=`<h3>${tr('notes')}</h3>${renderMulti(it.understandingQuestions)}`;
  const savedNote=localStorage.getItem('nh7_gratitude_note_'+current)||'';
  body+=`<textarea id="gratitudeNote" placeholder="${tr('notes')}">${html(savedNote)}</textarea><div class="button-row"><button class="primary-btn" id="completeGratitude" data-gratitude-day="${current}">${isDone?tr('dailyCompleted'):tr('completeDay')}</button>${isDone?`<button class="secondary-btn" id="undoGratitude" data-gratitude-day="${current}">${tr('undoComplete')}</button>`:''}</div>`;
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
  const focusVerse=Number(state.params?.verse||0);
  const title=`${data.book.names[state.lang]||data.book.names.en} ${localNum(chapter)}`;
  const rows=verses.map(v=>{
    const ref=v.reference?.en || `${data.book.names.en} ${chapter}:${v.verse}`;
    const key='nh7_bible_state_'+String(v.id||ref).replace(/[^a-zA-Z0-9_-]/g,'_');
    const st=JSON.parse(localStorage.getItem(key)||'{}');
    const cls=['reader-verse']; if(st.highlight) cls.push('highlighted'); if(focusVerse===Number(v.verse)) cls.push('saved-focus');
    const noteBoxId='noteBox_'+String(v.id||ref).replace(/[^a-zA-Z0-9_-]/g,'_');
    return `<div class="${cls.join(' ')}" id="v-${v.verse}" data-verse-key="${html(key)}">
      <span class="num">${localNum(v.verse)}</span><span>${html(v.text?.[state.lang]||v.text?.en||'')}</span>
      ${st.note?`<div class="verse-note-preview">📝 ${html(st.note)}</div>`:''}
      <div class="button-row">
        <button class="secondary-btn" data-bookmark="${html(ref)}">${st.saved?'★':'☆'} ${tr('save')}</button>
        <button class="secondary-btn" data-toggle-highlight="${html(key)}">✦ ${tr('highlight')}</button>
        <button class="secondary-btn" data-note-verse="${html(noteBoxId)}">📝 ${tr('writeNote')}</button>
        <button class="secondary-btn" data-share-verse="${html(ref)}" data-share-text="${html((v.text?.[state.lang]||v.text?.en||''))}">↗ ${tr('share')}</button>
      </div>
      <div id="${html(noteBoxId)}" class="verse-note-box hidden"><textarea data-note-input="${html(key)}" maxlength="1000" placeholder="${tr('writeNote')}">${html(st.note||'')}</textarea><button class="primary-btn" data-save-verse-note="${html(key)}">${tr('saveNote')}</button></div>
    </div>`;
  }).join('');
  view.innerHTML=card(title, `<div class="reader">${rows}</div>`);
  if(focusVerse){ setTimeout(()=>document.getElementById('v-'+focusVerse)?.scrollIntoView({behavior:'smooth',block:'center'}),150); }
}
async function bibleSearch(q){
  await loadBibleMeta(); let out=[];
  for(const g of ['01_18','19_39','40_66']){ if(!state.bible.groups[g]) state.bible.groups[g]=await jfetch(`data/bible/groups/bible_group_${g}.json`); const found=state.bible.groups[g].verses.filter(v=>(v.text?.[state.lang]||v.text?.en||'').toLowerCase().includes(q.toLowerCase())).slice(0,8); out.push(...found); if(out.length>=20) break; }
  view.innerHTML=card(tr('search'), out.length?`<div class="list">${out.slice(0,20).map(v=>`<button class="list-btn" data-go="bible" data-params='${html(JSON.stringify({mode:'chapter',bookId:v.bookId,chapter:v.chapter}))}'><strong>${html(localizeRef(v.reference?.en||''))}</strong><small>${html((v.text?.[state.lang]||v.text?.en||'').slice(0,180))}</small></button>`).join('')}</div>`:`<p class="muted">${tr('notStarted')}</p>`);
}
function bibleNameAliases(book){
  const out=[book.names?.en, book.names?.fa, book.names?.hr, book.id].filter(Boolean);
  if(book.id==='PSA') out.push('Psalm','Psalms','Ps','مزمور','مزامیر');
  if(book.id==='SNG') out.push('Song of Solomon','Song of Songs','Canticles','غزل غزلها','غزل غزل‌ها');
  if(book.id==='1SA') out.push('1 Samuel','First Samuel','اول سموئیل');
  if(book.id==='2SA') out.push('2 Samuel','Second Samuel','دوم سموئیل');
  if(book.id==='1KI') out.push('1 Kings','First Kings','اول پادشاهان');
  if(book.id==='2KI') out.push('2 Kings','Second Kings','دوم پادشاهان');
  if(book.id==='1CO') out.push('1 Corinthians','First Corinthians','اول قرنتیان');
  if(book.id==='2CO') out.push('2 Corinthians','Second Corinthians','دوم قرنتیان');
  if(book.id==='1TH') out.push('1 Thessalonians','First Thessalonians','اول تسالونیکیان');
  if(book.id==='2TH') out.push('2 Thessalonians','Second Thessalonians','دوم تسالونیکیان');
  if(book.id==='1TI') out.push('1 Timothy','First Timothy','اول تیموتائوس');
  if(book.id==='2TI') out.push('2 Timothy','Second Timothy','دوم تیموتائوس');
  if(book.id==='1PE') out.push('1 Peter','First Peter','اول پطرس');
  if(book.id==='2PE') out.push('2 Peter','Second Peter','دوم پطرس');
  if(book.id==='1JN') out.push('1 John','First John','اول یوحنا');
  if(book.id==='2JN') out.push('2 John','Second John','دوم یوحنا');
  if(book.id==='3JN') out.push('3 John','Third John','سوم یوحنا');
  return [...new Set(out)];
}

const BOOK_REF_FALLBACK = {"fa": {"Genesis": "پیدایش", "Exodus": "خروج", "Leviticus": "لاویان", "Numbers": "اعداد", "Deuteronomy": "تثنیه", "Joshua": "یوشع", "Judges": "داوران", "Ruth": "روت", "1 Samuel": "اول سموئیل", "2 Samuel": "دوم سموئیل", "1 Kings": "اول پادشاهان", "2 Kings": "دوم پادشاهان", "1 Chronicles": "اول تواریخ", "2 Chronicles": "دوم تواریخ", "Ezra": "عزرا", "Nehemiah": "نحمیا", "Esther": "استر", "Job": "ایوب", "Psalms": "مزامیر", "Proverbs": "امثال", "Ecclesiastes": "جامعه", "Song of Songs": "غزل غزل‌ها", "Isaiah": "اشعیا", "Jeremiah": "ارمیا", "Lamentations": "مراثی", "Ezekiel": "حزقیال", "Daniel": "دانیال", "Hosea": "هوشع", "Joel": "یوئیل", "Amos": "عاموس", "Obadiah": "عوبدیا", "Jonah": "یونس", "Micah": "میکاه", "Nahum": "ناحوم", "Habakkuk": "حبقوق", "Zephaniah": "صفنیا", "Haggai": "حجی", "Zechariah": "زکریا", "Malachi": "ملاکی", "Matthew": "متی", "Mark": "مرقس", "Luke": "لوقا", "John": "یوحنا", "Acts": "اعمال رسولان", "Romans": "رومیان", "1 Corinthians": "اول قرنتیان", "2 Corinthians": "دوم قرنتیان", "Galatians": "غلاطیان", "Ephesians": "افسسیان", "Philippians": "فیلیپیان", "Colossians": "کولسیان", "1 Thessalonians": "اول تسالونیکیان", "2 Thessalonians": "دوم تسالونیکیان", "1 Timothy": "اول تیموتائوس", "2 Timothy": "دوم تیموتائوس", "Titus": "تیتوس", "Philemon": "فیلیمون", "Hebrews": "عبرانیان", "James": "یعقوب", "1 Peter": "اول پطرس", "2 Peter": "دوم پطرس", "1 John": "اول یوحنا", "2 John": "دوم یوحنا", "3 John": "سوم یوحنا", "Jude": "یهودا", "Revelation": "مکاشفه", "Psalm": "مزامیر", "Ps": "مزامیر", "Song of Solomon": "غزل غزل‌ها", "First Samuel": "اول سموئیل", "Second Samuel": "دوم سموئیل", "First Kings": "اول پادشاهان", "Second Kings": "دوم پادشاهان", "First Chronicles": "اول تواریخ", "Second Chronicles": "دوم تواریخ", "First Corinthians": "اول قرنتیان", "Second Corinthians": "دوم قرنتیان", "First Thessalonians": "اول تسالونیکیان", "Second Thessalonians": "دوم تسالونیکیان", "First Timothy": "اول تیموتائوس", "Second Timothy": "دوم تیموتائوس", "First Peter": "اول پطرس", "Second Peter": "دوم پطرس", "First John": "اول یوحنا", "Second John": "دوم یوحنا", "Third John": "سوم یوحنا"}, "hr": {"Genesis": "Postanak", "Exodus": "Izlazak", "Leviticus": "Levitski zakonik", "Numbers": "Brojevi", "Deuteronomy": "Ponovljeni zakon", "Joshua": "Jošua", "Judges": "Suci", "Ruth": "Ruta", "1 Samuel": "1. Samuelova", "2 Samuel": "2. Samuelova", "1 Kings": "1. Kraljevima", "2 Kings": "2. Kraljevima", "1 Chronicles": "1. Ljetopisa", "2 Chronicles": "2. Ljetopisa", "Ezra": "Ezra", "Nehemiah": "Nehemija", "Esther": "Estera", "Job": "Job", "Psalms": "Psalmi", "Proverbs": "Mudre izreke", "Ecclesiastes": "Propovjednik", "Song of Songs": "Pjesma nad pjesmama", "Isaiah": "Izaija", "Jeremiah": "Jeremija", "Lamentations": "Tužaljke", "Ezekiel": "Ezekiel", "Daniel": "Daniel", "Hosea": "Hošea", "Joel": "Joel", "Amos": "Amos", "Obadiah": "Obadija", "Jonah": "Jona", "Micah": "Mihej", "Nahum": "Nahum", "Habakkuk": "Habakuk", "Zephaniah": "Sefanija", "Haggai": "Hagaj", "Zechariah": "Zaharija", "Malachi": "Malahija", "Matthew": "Matej", "Mark": "Marko", "Luke": "Luka", "John": "Ivan", "Acts": "Djela apostolska", "Romans": "Rimljanima", "1 Corinthians": "1. Korinćanima", "2 Corinthians": "2. Korinćanima", "Galatians": "Galaćanima", "Ephesians": "Efežanima", "Philippians": "Filipljanima", "Colossians": "Kološanima", "1 Thessalonians": "1. Solunjanima", "2 Thessalonians": "2. Solunjanima", "1 Timothy": "1. Timoteju", "2 Timothy": "2. Timoteju", "Titus": "Titu", "Philemon": "Filemonu", "Hebrews": "Hebrejima", "James": "Jakovljeva", "1 Peter": "1. Petrova", "2 Peter": "2. Petrova", "1 John": "1. Ivanova", "2 John": "2. Ivanova", "3 John": "3. Ivanova", "Jude": "Judina", "Revelation": "Otkrivenje", "Psalm": "Psalmi", "Ps": "Psalmi", "Song of Solomon": "Pjesma nad pjesmama"}};

function localizeRef(ref){
  if(!ref) return '';
  let s=String(ref).trim();
  const pairs=[];
  const books=state.bible.books||[];
  for(const b of books){
    for(const alias of bibleNameAliases(b)){
      const loc=b.names?.[state.lang] || b.names?.en || alias;
      if(alias && loc) pairs.push([String(alias), String(loc)]);
    }
  }
  const fb=BOOK_REF_FALLBACK[state.lang] || {};
  for(const [en,loc] of Object.entries(fb)) pairs.push([en,loc]);
  const unique=[]; const seen=new Set();
  for(const [en,loc] of pairs){ const k=en.toLowerCase(); if(!seen.has(k)){ seen.add(k); unique.push([en,loc]); } }
  unique.sort((a,b)=>b[0].length-a[0].length);
  for(const [en,loc] of unique){
    const re=new RegExp('^'+en.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=\\s|\\.|,|:|$)','i');
    if(re.test(s)){ s=s.replace(re,loc); break; }
  }
  return localText(s);
}
function parseRef(ref){
  const m=String(ref||'').match(/^(.+?)\s+(\d+):(\d+)/); if(!m) return null;
  const name=m[1].trim().toLowerCase(); const chapter=Number(m[2]); const verse=Number(m[3]);
  const b=(state.bible.books||[]).find(x=>bibleNameAliases(x).some(n=>String(n).toLowerCase()===name));
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
  const d=await jfetch('data/school/school_content.json');
  let access=JSON.parse(localStorage.getItem('nh7_school_access')||'{"status":"guest"}');
  if(params.form){ view.innerHTML=registrationFormHtml('school', access); return; }
  const cloudAccess = await fetchLatestRegistration('school');
  if(cloudAccess) access = cloudAccess;
  const approved = access.status==='approved' || access.approvedBy==='admin';
  if(!approved){
    view.innerHTML=card(tr('school'), `<p>${tr('schoolAccessText')}</p><p class="muted">${tr('schoolNotApproved')}</p><p class="muted">${tr('approvedRefreshHint')}</p><span class="badge">${access.status==='pending'?tr('pending'):tr('guest')}</span><div class="button-row"><button class="primary-btn" data-go="school" data-params='{"form":true}'>${tr('register')}</button><button class="secondary-btn" data-go="school">${tr('enterSchool')} / ${tr('refreshApproval')}</button></div>`);
    return;
  }
  if(params.lesson) return schoolLesson(d, params.lesson);
  view.innerHTML=card(tr('school'), `<span class="badge">${tr('approved')}</span><p class="success-text">${tr('enterSchool')}</p><div class="button-row"><button class="secondary-btn" data-go="account">${tr('accountActions')}</button><button class="secondary-btn" id="schoolLogoutBtn">${tr('logoutAccount')}</button></div><div class="list">${d.lessons.map(l=>`<button class="list-btn" data-go="school" data-params='${html(JSON.stringify({lesson:l.lesson_code}))}'><strong>${html(l.translations?.[state.lang]?.class_title||l.translations?.en?.class_title)}</strong><small>${html(l.translations?.[state.lang]?.lesson_title||'')}</small></button>`).join('')}</div>`);
  $('#schoolLogoutBtn')?.addEventListener('click', logoutAccount);
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
  let meetingAccess=JSON.parse(localStorage.getItem('nh7_meeting_access')||'{"status":"none"}');
  let schoolAccess=JSON.parse(localStorage.getItem('nh7_school_access')||'{"status":"none"}');

  // From v1.6.1 onward, approved School access also grants Church Meeting access.
  // No separate meeting registration and no guest entrance for security.
  const cloudSchool = await fetchLatestRegistration('school');
  if(cloudSchool) schoolAccess = cloudSchool;
  const cloudMeeting = await fetchLatestRegistration('meeting');
  if(cloudMeeting) meetingAccess = cloudMeeting;

  const schoolApproved = schoolAccess.status==='approved' || schoolAccess.approvedBy==='admin';
  const meetingApproved = meetingAccess.status==='approved' || meetingAccess.approvedBy==='admin';
  const approved = schoolApproved || meetingApproved;
  let details='';
  if(approved){
    const settings = await fetchMeetingSettings();
    details = `<p class="success-text">${tr('meetingApproved')}</p>` + renderMeetingDetails(settings);
  }
  const buttons = approved
    ? `<div class="button-row"><button class="secondary-btn" data-go="meetings">${tr('refreshApproval')}</button></div>`
    : `<div class="button-row"><button class="primary-btn" data-go="school" data-params='{"form":true}'>${tr('register')} ${tr('school')}</button><button class="secondary-btn" data-go="meetings">${tr('refreshApproval')}</button></div>`;
  const notApprovedText = state.lang==='fa'
    ? 'برای امنیت جلسه، ورود مهمان نداریم. اگر در مدرسه ثبت‌نام کرده‌اید، پس از تأیید ادمین همین بخش لینک و کد جلسه را نشان می‌دهد.'
    : (state.lang==='hr' ? 'Zbog sigurnosti nema ulaska kao gost. Nakon registracije za školu i odobrenja administratora ovdje će se prikazati poveznica i kod sastanka.' : 'For meeting security, guest access is not available. After school registration and admin approval, the meeting link and codes will appear here.');
  view.innerHTML=card(tr('meetings'), `<p>${tr('meetingAccessText')}</p>${approved?'':`<p class="muted">${notApprovedText}</p>`}<span class="badge">${approved?tr('approved'):(schoolAccess.status==='pending'||meetingAccess.status==='pending'?tr('pending'):tr('notStarted'))}</span>${details}${buttons}`);
}
async function more(){ view.innerHTML=`<div class="grid">${tile('audio','🎧',tr('audio'))}${tile('salvation','✝',tr('salvation'))}${tile('daily','🙏',tr('gratitude'),'',{tab:'gratitude'})}${tile('meetings','☎',tr('meetings'))}${tile('qna','❓',tr('qna'))}${tile('inbox','📥',tr('inbox'), unreadCount()?`${tr('unread')}: ${localNum(unreadCount())}`:'')}${tile('account','👤',tr('account'))}${tile('about','ℹ',tr('about'))}${tile('settings','⚙',tr('settings'))}</div>`; }

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
  view.innerHTML=card(tr('qna'), `<p class="muted">${tr('anonymousNote')}</p><div class="notice"><p>${tr('qnaWaitNotice')}</p><p>${tr('askQuestionOnce')}</p></div><h3>${tr('askQuestion')}</h3><textarea id="qaQuestion" placeholder="${tr('questionText')}" required></textarea><button class="primary-btn" id="submitQa">${tr('submitQuestion')}</button><div class="qna-section"><button class="secondary-btn wide-btn" data-qna-toggle="myQuestionsPanel">${tr('myQuestions')} <span>${openText}</span></button><div id="myQuestionsPanel" class="accordion-panel hidden">${myHtml}</div></div><div class="qna-section"><button class="secondary-btn wide-btn" data-qna-toggle="publicAnswersPanel">${tr('publicAnswers')} <span>${openText}</span></button><div id="publicAnswersPanel" class="accordion-panel hidden">${answeredHtml}</div></div>`);
  $('#submitQa').onclick=async()=>{
    const question=($('#qaQuestion').value||'').trim();
    if(!question){ alert(tr('requiredField')); return; }
    const norm=normalizeQuestionText(question);
    const duplicateLocal=my.some(q=>normalizeQuestionText(q.question)===norm);
    const duplicatePublic=(answered||[]).some(q=>normalizeQuestionText(q.question_text)===norm);
    if(duplicateLocal || duplicatePublic){ alert(tr('alreadyAsked')); return; }
    const item={question,status:'pending',createdAt:new Date().toISOString()};
    const arr=JSON.parse(localStorage.getItem('nh7_my_questions')||'[]'); arr.push(item); localStorage.setItem('nh7_my_questions',JSON.stringify(arr));
    await saveQuestionCloud(question).catch(console.warn);
    alert(tr('questionSent')); render('qna',{},true);
  };
}

async function account(){
  const profile=getKnownUserProfile();
  const emailValue=html(profile.email||'');
  view.innerHTML=card(tr('account'), `<h3>${tr('accountActions')}</h3><p class="muted">${tr('myAccess')}</p><div class="notice"><p><strong>${tr('name')}:</strong> ${html(profile.name||'-')}</p><p><strong>${tr('email')}:</strong> ${html(profile.email||'-')}</p></div><p class="muted">${tr('restoreAccessHint')}</p><input id="loginEmail" type="email" placeholder="${tr('email')}" value="${emailValue}"><div class="button-row"><button class="primary-btn" id="restoreAccessBtn">${tr('restoreAccess')}</button><button class="secondary-btn" id="logoutAccountBtn">${tr('logoutAccount')}</button></div><h3>${tr('forgotPassword')}</h3><p class="muted">${state.lang==='fa'?'اگر رمز حساب را فراموش کرده‌اید، ایمیل خود را وارد کنید تا لینک بازیابی رمز ارسال شود.':state.lang==='hr'?'Ako ste zaboravili lozinku, unesite email za poveznicu za reset.':'If you forgot your password, enter your email to receive a reset link.'}</p><input id="resetEmail" type="email" placeholder="${tr('email')}" value="${emailValue}"><button class="primary-btn" id="resetPasswordBtn">${tr('resetPassword')}</button><p id="resetMsg" class="muted"></p>`);
  $('#resetPasswordBtn')?.addEventListener('click', resetPassword);
  $('#restoreAccessBtn')?.addEventListener('click', loginRestoreAccess);
  $('#logoutAccountBtn')?.addEventListener('click', logoutAccount);
}
async function loginRestoreAccess(){
  const email=($('#loginEmail')?.value||'').trim().toLowerCase();
  if(!email){ alert(tr('requiredField')); return; }
  localStorage.setItem('nh7_manual_email', email);
  try{
    const school=await fetchLatestRegistration('school');
    const meeting=await fetchLatestRegistration('meeting');
    if(school) localStorage.setItem('nh7_school_access', JSON.stringify(Object.assign({}, school, {email})));
    if(meeting) localStorage.setItem('nh7_meeting_access', JSON.stringify(Object.assign({}, meeting, {email})));
    if(!school && !meeting){
      const old=JSON.parse(localStorage.getItem('nh7_school_access')||'{}');
      localStorage.setItem('nh7_school_access', JSON.stringify(Object.assign({}, old, {email, status: old.status||'guest'})));
    }
  }catch(e){ console.warn('restore access failed', e); }
  alert(tr('restoreAccessDone'));
  render('account',{},true);
}
function logoutAccount(){
  if(!confirm(state.lang==='fa'?'از حساب این دستگاه خارج شوید؟ دسترسی مدرسه و جلسات از این دستگاه پاک می‌شود و با ایمیل قابل بازیابی است.':state.lang==='hr'?'Odjaviti se s ovog uređaja? Pristup se može obnoviti emailom.':'Sign out from this device? Access can be restored by email.')) return;
  localStorage.removeItem('nh7_manual_email');
  localStorage.removeItem('nh7_school_access');
  localStorage.removeItem('nh7_meeting_access');
  alert(state.lang==='fa'?'از حساب خارج شدید. برای ورود دوباره از بخش حساب، ایمیل ثبت‌نام را وارد کنید.':state.lang==='hr'?'Odjavljeni ste. Za ponovni ulazak unesite email u računu.':'You are signed out. To sign in again, enter your registration email in Account.');
  render('account',{},true);
}
async function resetPassword(){
  const email=($('#resetEmail')?.value||'').trim().toLowerCase();
  if(!email){ alert(tr('requiredField')); return; }
  try{
    await fetch(SUPABASE_CONFIG.url + '/auth/v1/recover', {method:'POST', headers:{'apikey':SUPABASE_CONFIG.key,'Content-Type':'application/json'}, body:JSON.stringify({email, redirect_to: location.origin + location.pathname})});
  }catch(e){ console.warn('password reset request failed', e); }
  const msg=$('#resetMsg'); if(msg) msg.textContent=tr('resetPasswordSent');
  alert(tr('resetPasswordSent'));
}

async function settings(){
  const perm=typeof Notification==='undefined'?'default':Notification.permission;
  const status=perm==='granted'?tr('notificationEnabled'):perm==='denied'?tr('notificationDenied'):tr('notificationDefault');
  view.innerHTML=card(tr('settings'), `<h3>${tr('language')}</h3><select id="settingsLang"><option value="en">English</option><option value="fa">فارسی</option><option value="hr">Hrvatski</option></select><h3>${tr('notifications')}</h3><p>${status}</p><button class="primary-btn" id="enableNotify">${tr('enableNotifications')}</button><div class="notice"><p>${state.lang==='fa'?'کلام روزانه ساعت ۷، اعلان ایمان ساعت ۱۲، آبمیوه روزانه ساعت ۱۷، و یادآوری شکرگزاری ساعت ۲۱ بر اساس زمان محلی کاربر تنظیم می‌شود. یادآوری جلسات کلیسا بر اساس زمان کرواسی است. برای آیفون، اپ را به Home Screen اضافه کنید و سپس اعلان‌ها را فعال کنید. پیام‌های دریافت‌شده در صندوق ورودی اپ نیز ذخیره می‌شوند.':'Daily Word at 07:00, Faith Proclamation at 12:00, Daily Juice at 17:00, and Gratitude reminder at 21:00 use the user’s local time. Church meeting reminders use Croatia time. On iPhone, add the app to Home Screen, then enable notifications. Received messages are also saved in the app inbox.'}</p></div><h3>${state.lang==='fa'?'ذخیره ابری / آفلاین':state.lang==='hr'?'Cloud / offline spremanje':'Cloud / offline save'}</h3><p>${cloudStatusText()}</p><button class="secondary-btn" id="syncCloud">${state.lang==='fa'?'همگام‌سازی اکنون':state.lang==='hr'?'Sinkroniziraj sada':'Sync now'}</button><h3>${tr('version')}</h3><p>OmideNo7 v1.6.4</p><button class="secondary-btn" id="clearCache">${tr('refreshData')}</button>`);
  $('#settingsLang').value=state.lang; $('#settingsLang').onchange=e=>setLang(e.target.value);
  $('#enableNotify').onclick=enableNotifications;
  $('#clearCache').onclick=async()=>{ try{ if('caches' in window){ const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); } if('serviceWorker' in navigator){ const rs=await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(r=>r.update())); } }catch(e){} alert(tr('saved')); location.reload(); };
  $('#syncCloud')?.addEventListener('click', async()=>{ await syncCloudQueue(); alert(cloudStatusText()); render('settings',{},true); });
}
async function enableNotifications(){
  if(typeof Notification==='undefined'){
    alert(state.lang==='fa'?'اعلان‌ها در این مرورگر یا داخل این حالت نصب پشتیبانی نمی‌شوند. اگر از اندروید استفاده می‌کنید، اپ را از Google Play/Chrome باز کنید و اجازه Notifications را در تنظیمات گوشی روشن کنید.':'Notifications are not supported in this browser or install mode. On Android, open the app through Google Play/Chrome and allow Notifications in device settings.');
    return;
  }
  let perm = Notification.permission || 'default';
  try{
    if(window.OneSignalDeferred){
      await new Promise(resolve=>{
        let done=false;
        const finish=()=>{ if(!done){ done=true; resolve(); } };
        setTimeout(finish, 7000);
        window.OneSignalDeferred.push(async function(OneSignal){
          try{
            if(OneSignal.Notifications && OneSignal.Notifications.requestPermission){
              const result = await OneSignal.Notifications.requestPermission();
              perm = result===true ? 'granted' : (Notification.permission || perm || 'default');
            }
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
            if(OneSignal.User && OneSignal.User.addTags){
              await OneSignal.User.addTags({
                app:'omideno7',
                language: state.lang,
                timezone: tz,
                daily_word_time:'07:00',
                faith_time:'12:00',
                daily_juice_time:'17:00',
                gratitude_time:'21:00',
                croatia_morning_meeting:'04:55',
                croatia_sunday_service:'20:00',
                inbox_enabled:'true'
              });
            }
            const subId = OneSignal.User?.PushSubscription?.id || '';
            if(subId) localStorage.setItem('nh7_onesignal_subscription_id', subId);
          }catch(err){ console.warn('OneSignal permission failed', err); }
          finish();
        });
      });
    }
    if(Notification.permission !== 'granted'){
      const browserPerm = await Notification.requestPermission();
      perm = browserPerm || perm;
    } else perm = 'granted';
  }catch(e){ console.warn(e); perm = Notification.permission || perm || 'default'; }
  if(perm===true) perm='granted';
  localStorage.setItem('nh7_notifications_permission',perm);
  localStorage.setItem('nh7_notifications_timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || 'local');
  if(perm==='granted'){
    try{ new Notification(tr('appTitle'),{body:tr('notificationEnabled'),icon:'assets/logo.png'}); }catch(e){}
    addInboxMessage(tr('notificationEnabled'), state.lang==='fa'?'اعلان‌ها با موفقیت فعال شد. از این به بعد پیام‌های کلیسا در این صندوق نیز ذخیره می‌شوند.':state.lang==='hr'?'Obavijesti su uključene. Od sada će se crkvene poruke spremati i u ovu ulaznu poštu.':'Notifications are active. Church messages will also be saved in this inbox.', 'system', 'notifications_enabled_'+todayKey());
    alert(state.lang==='fa'?'اعلان‌ها فعال شد. اگر هنوز پیام دریافت نکردید، در تنظیمات گوشی برای این اپ/Chrome اجازه Notifications را روشن بگذارید.':'Notifications are active. If you still do not receive messages, keep Notifications allowed for this app/Chrome in device settings.');
  } else if(perm==='denied') {
    alert(state.lang==='fa'?'اجازه اعلان‌ها قبلاً مسدود شده است. از تنظیمات گوشی/مرورگر، Notifications را برای این اپ یا Chrome روی Allow بگذارید و دوباره تلاش کنید.':tr('notificationDenied'));
  } else {
    alert(state.lang==='fa'?'اعلان‌ها هنوز فعال نشد. لطفاً اجازه اعلان را در پنجره گوشی تأیید کنید یا از تنظیمات گوشی Notifications را فعال کنید.':'Notifications are not active yet. Please allow notifications in the phone prompt or device settings.');
  }
  render(state.route,state.params,true);
}

function bindDynamic(){
  $$('[data-go]').forEach(el=>el.onclick=()=>navigate(el.dataset.go, JSON.parse(el.dataset.params||'{}')));
  $$('[data-dailytab]').forEach(el=>el.onclick=()=>{ state.dailyTab=el.dataset.dailytab; render('daily',{},true); });
  $$('[data-save-note]').forEach(el=>el.onclick=()=>{ const content=el.previousElementSibling?.value||''; localStorage.setItem('nh7_note_'+el.dataset.saveNote, content); saveNoteCloud('note_'+el.dataset.saveNote, content).catch(console.warn); el.textContent=tr('saved'); });
  $$('[data-bookmark]').forEach(el=>el.onclick=()=>{ const arr=JSON.parse(localStorage.getItem('nh7_bookmarks')||'[]'); if(!arr.includes(el.dataset.bookmark)) arr.push(el.dataset.bookmark); localStorage.setItem('nh7_bookmarks',JSON.stringify(arr)); try{ const key=el.closest('.reader-verse')?.dataset?.verseKey; if(key){ const st=JSON.parse(localStorage.getItem(key)||'{}'); st.saved=true; localStorage.setItem(key,JSON.stringify(st)); }}catch(e){} saveVerseCloud(el.dataset.bookmark).catch(console.warn); addPoints(5,'first_verse'); el.textContent='★ '+tr('saved'); });
  $$('[data-delete-bookmark]').forEach(el=>el.onclick=(ev)=>{ ev.stopPropagation(); const ref=el.dataset.deleteBookmark; const arr=JSON.parse(localStorage.getItem('nh7_bookmarks')||'[]').filter(x=>String(x)!==String(ref)); localStorage.setItem('nh7_bookmarks',JSON.stringify(arr)); render(state.route,state.params,true); });
  $$('[data-highlight]').forEach(el=>el.onclick=()=>el.closest('.reader-verse')?.classList.toggle('highlighted'));
  $$('[data-toggle-highlight]').forEach(el=>el.onclick=()=>{ const key=el.dataset.toggleHighlight; const st=JSON.parse(localStorage.getItem(key)||'{}'); st.highlight=!st.highlight; localStorage.setItem(key,JSON.stringify(st)); el.closest('.reader-verse')?.classList.toggle('highlighted', !!st.highlight); });
  $$('[data-note-verse]').forEach(el=>el.onclick=()=>{ const box=$('#'+el.dataset.noteVerse); if(box) box.classList.toggle('hidden'); });
  $$('[data-save-verse-note]').forEach(el=>el.onclick=()=>{ const key=el.dataset.saveVerseNote; const input=$(`[data-note-input="${CSS.escape(key)}"]`); const st=JSON.parse(localStorage.getItem(key)||'{}'); st.note=(input?.value||'').slice(0,1000); localStorage.setItem(key,JSON.stringify(st)); el.textContent=tr('saved'); });
  $$('[data-share-verse]').forEach(el=>el.onclick=async()=>{ const txt=`${localizeRef(el.dataset.shareVerse)} — ${el.dataset.shareText||''}`; try{ if(navigator.share) await navigator.share({text:txt}); else { await navigator.clipboard.writeText(txt); alert(tr('saved')); } }catch(e){} });
  $$('[data-complete-daily]').forEach(el=>el.onclick=()=>{ const key='nh7_daily_done_'+el.dataset.completeDaily; if(!localStorage.getItem(key)){ localStorage.setItem(key,'1'); saveProgressCloud(key,{done:true,at:new Date().toISOString()}).catch(console.warn); addPoints(3,'daily_1'); } el.textContent=tr('dailyCompleted'); });
  $$('[data-open-ref]').forEach(el=>el.onclick=async()=>{ await loadBibleMeta(); const ref=parseRef(el.dataset.openRef); if(ref){ const params={mode:'chapter',bookId:ref.bookId,chapter:ref.chapter}; if((el.dataset.openRefMode||'verse')==='verse') params.verse=ref.verse; navigate('bible',params); } });
  $$('[data-reveal-ref]').forEach(el=>el.onclick=()=>revealVerse(el));
  $$('[data-read-range]').forEach(el=>el.onclick=()=>revealReadingRange(el));
  $$('[data-toggle-panel]').forEach(el=>el.onclick=()=>{ const p=$('#'+el.dataset.togglePanel); if(p){ p.classList.toggle('hidden'); el.textContent=p.classList.contains('hidden')?(el.dataset.togglePanel==='notesPanel'?tr('showMyNotes'):tr('showSavedVerses')):tr('hide'); }});
  $$('[data-salvation-toggle]').forEach(el=>el.onclick=()=>{ const p=$('#'+el.dataset.salvationToggle); if(p){ p.classList.toggle('hidden'); const small=el.querySelector('small'); if(small) small.textContent=p.classList.contains('hidden') ? (state.lang==='fa'?'برای باز کردن کلیک کنید':state.lang==='hr'?'Dodirnite za otvaranje':'Tap to open') : tr('hide'); }});
  $$('[data-qna-toggle]').forEach(el=>el.onclick=()=>{ const p=$('#'+el.dataset.qnaToggle); if(p){ p.classList.toggle('hidden'); const sp=el.querySelector('span'); if(sp) sp.textContent=p.classList.contains('hidden') ? (state.lang==='fa'?'برای باز کردن کلیک کنید':state.lang==='hr'?'Dodirnite za otvaranje':'Tap to open') : tr('hide'); }});
  $$('.qna-answer-toggle').forEach(el=>el.onclick=()=>{ const p=$('#'+el.dataset.qnaAnswer); if(p){ p.classList.toggle('hidden'); }});
  $$('[data-inbox-open]').forEach(el=>el.onclick=()=>{ const id=el.dataset.inboxOpen; const safe=String(id).replace(/[^a-zA-Z0-9_-]/g,'_'); const p=$('#inbox-'+safe); if(p) p.classList.toggle('hidden'); const arr=inboxMessages().map(m=>String(m.id)===String(id)?{...m,read:true,readAt:new Date().toISOString()}:m); setInboxMessages(arr); updateInboxBadge(); });
  $$('[data-inbox-delete]').forEach(el=>el.onclick=(ev)=>{ ev.stopPropagation(); const id=el.dataset.inboxDelete; if(confirm(tr('deleteConfirm'))){ deleteInboxLocal(id); render('inbox',{},true); } });
  $$('[data-submit-registration]').forEach(el=>el.onclick=()=>collectRegistration(el.dataset.submitRegistration));
  const run=$('#runBibleSearch'); if(run) run.onclick=()=>navigate('bible',{q:$('#bibleSearch').value},true);
  $('#startGratitude')?.addEventListener('click',()=>{ localStorage.setItem('nh7_gratitude_start',todayKey()); addPoints(5,'gratitude_1'); render('daily',{tab:'gratitude'},true); });
  $('#completeGratitude')?.addEventListener('click',(ev)=>{ const current=Number(ev.currentTarget.dataset.gratitudeDay||1); const completed=JSON.parse(localStorage.getItem('nh7_gratitude_completed')||'[]'); if(!completed.includes(current)) completed.push(current); completed.sort((a,b)=>a-b); localStorage.setItem('nh7_gratitude_completed',JSON.stringify(completed)); const gnote=$('#gratitudeNote')?.value||''; localStorage.setItem('nh7_gratitude_note_'+current,gnote); saveNoteCloud('gratitude_note_'+current, gnote).catch(console.warn); saveProgressCloud('gratitude_completed',{completed}).catch(console.warn); addPoints(10,'gratitude_1'); render('daily',{tab:'gratitude',gday:current},true); });
  $('#undoGratitude')?.addEventListener('click',(ev)=>{ const current=Number(ev.currentTarget.dataset.gratitudeDay||1); const completed=JSON.parse(localStorage.getItem('nh7_gratitude_completed')||'[]').filter(x=>Number(x)!==current); localStorage.setItem('nh7_gratitude_completed',JSON.stringify(completed)); saveProgressCloud('gratitude_completed',{completed}).catch(console.warn); render('daily',{tab:'gratitude',gday:current},true); });
}

window.addEventListener('popstate', (ev)=>{ const st=ev.state||{}; if(st.route){ state.route=st.route; state.params=st.params||{}; render(state.route,state.params,true); } else { back(); } });
try{ history.replaceState({route:state.route,params:state.params},'', '#'+encodeURIComponent(state.route)); }catch(e){}
$('#langSelect').onchange=e=>setLang(e.target.value);
$('#inboxBtn')?.addEventListener('click',()=>navigate('inbox',{},false));
$('#backBtn').onclick=back;
$$('.nav-item').forEach(b=>b.onclick=()=>{ state.stack=[]; navigate(b.dataset.route,{},true); });
$('#amenButton').onclick=()=>$('#amenGate').classList.add('hidden');
window.addEventListener('online',()=>{ $('.offline')?.remove(); syncCloudQueue().catch(console.warn); });
window.addEventListener('offline',()=>{ if(!$('.offline')){ const d=document.createElement('div'); d.className='offline'; d.textContent=tr('offline'); document.body.appendChild(d);} });
if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(console.warn);
setLang(state.lang); syncCloudQueue().catch(console.warn); maybeCreateScheduledInboxMessages(); updateInboxBadge(); showAmen();
