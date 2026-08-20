const MODULE_VERSION = 1;
const CATALOG_PATH = 'data/spiritual-plans/catalog.json';
const FASTING_GUIDES_PATH = 'data/spiritual-plans/fasting-types.json';
const PROGRESS_PREFIX = 'nh7_spiritual_plans_v240:';
const FASTING_PREFIX = 'nh7_fasting_journeys_v240:';
const cloudSyncAt = new Map();
let catalogPromise = null;
let fastingGuidesPromise = null;

const UI = {
  en: {
    spiritualPlans: 'Spiritual Plans', fastingJournal: 'Fasting Journal', biblePlans: 'Bible Reading',
    heroTitle: 'Grow one faithful day at a time', heroText: 'Choose a Scripture-rooted journey. Your place, completed days, and private notes stay available offline and sync securely when you sign in.',
    days: 'days', day: 'Day', start: 'Start plan', continue: 'Continue', completed: 'Completed', active: 'Active', notStarted: 'Not started',
    progress: 'Progress', completedDays: 'completed days', completedPlans: 'completed plans', activePlans: 'active plans', currentStreak: 'current streak',
    signInSync: 'Sign in to restore this progress on another device. Guest progress remains private on this device.',
    accountSync: 'Progress is linked to your account and will sync when a connection is available.',
    offlineReady: 'Offline ready', syncing: 'Saving to your account…', saved: 'Saved', queued: 'Saved on this device; cloud sync is queued.',
    goal: 'Goal', planOutline: 'Plan outline', backToPlans: 'All spiritual plans', previous: 'Previous', next: 'Next',
    scripture: 'Scripture', biblicalFoundation: 'Biblical foundation', pastoralGuidance: 'Pastoral guidance', teaching: 'Devotional teaching', reflect: 'Reflect', practice: 'Practice today', spiritPractice: 'Prayer-in-the-Spirit practice', prayer: 'Prayer', declaration: 'Declaration',
    privateNote: 'My private note', privateNoteHelp: 'Only your account can read this reflection.', saveNote: 'Save private note',
    completeDay: 'Complete this day', undoDay: 'Mark as not completed', planComplete: 'Journey completed',
    chooseDay: 'Choose a day', confirmUndo: 'Mark this day as not completed?', showVerse: 'Read verse here',
    fastingTitle: 'Begin a fasting journey', fastingIntro: 'Choose a wise form of fasting, name your purpose, and use the daily teaching and log to keep your attention on God.',
    safety: 'Health and safety', safetyAck: 'I have read the safety note and will choose a medically appropriate fast.',
    fastingType: 'Type of fast', purpose: 'Purpose of this fast', startDate: 'Start date', endDate: 'End date', startJourney: 'Start journey',
    activeJourneys: 'Active journeys', fastingHistory: 'Fasting history', noJourneys: 'No fasting journeys yet.',
    journeyDay: 'Journey day', dailyLog: 'Daily fasting log', prayerMinutes: 'Prayer minutes', scriptureNote: 'Scripture note', reflection: 'Reflection',
    dayObserved: 'I observed today’s fast', saveLog: 'Save daily log', logSaved: 'Daily log saved', completeJourney: 'Complete journey', cancelJourney: 'End journey',
    statusActive: 'Active', statusCompleted: 'Completed', statusCancelled: 'Ended', continueJourney: 'Continue journey',
    required: 'Please complete the required fields.', invalidDates: 'The end date cannot be before the start date.', prayerRequired: 'A completed fast day must include prayer. Enter at least one minute of prayer before marking the day complete.',
    fastingTeaching: 'Learn before you begin', fastingTeachingIntro: 'Each form below includes its purpose, practice, prayer rhythm, boundaries, and safety guidance.', fastingCovenant: 'The fasting covenant',
    summaryTitle: 'Spiritual plans activity', noActivity: 'No spiritual-plan activity yet.', viewPlans: 'Open plans',
    recentCompletions: 'Recent completions', fastingRecords: 'fasting records', date: 'Date',
    type_partial: 'Partial food fast', type_daniel: 'Daniel-style fast', type_sunrise: 'Sunrise-to-sunset fast', type_one_meal: 'One-meal fast', type_liquid: 'Liquid fast', type_water: 'Water-only fast (guided)', type_media: 'Media / non-food consecration', type_custom: 'Custom wise fast',
    errorTitle: 'Plans are temporarily unavailable', retry: 'Try again'
  },
  fa: {
    spiritualPlans: 'پلن‌های روحانی', fastingJournal: 'دفتر روزه', biblePlans: 'مطالعهٔ کتاب‌مقدس',
    heroTitle: 'هر روز یک قدم وفادارانه رشد کن', heroText: 'یک مسیر مبتنی بر کلام انتخاب کن. جای فعلی، روزهای تکمیل‌شده و یادداشت‌های خصوصی آفلاین می‌مانند و پس از ورود، امن همگام می‌شوند.',
    days: 'روز', day: 'روز', start: 'شروع پلن', continue: 'ادامه', completed: 'تکمیل‌شده', active: 'فعال', notStarted: 'شروع‌نشده',
    progress: 'پیشرفت', completedDays: 'روز تکمیل‌شده', completedPlans: 'پلن تکمیل‌شده', activePlans: 'پلن فعال', currentStreak: 'روز پیوسته',
    signInSync: 'برای بازیابی این پیشرفت روی دستگاه دیگر وارد حساب شو. پیشرفت مهمان فقط روی همین دستگاه خصوصی می‌ماند.',
    accountSync: 'پیشرفت به حساب تو متصل است و هنگام دسترسی به اینترنت همگام می‌شود.',
    offlineReady: 'آمادهٔ آفلاین', syncing: 'در حال ذخیره در حساب…', saved: 'ذخیره شد', queued: 'روی دستگاه ذخیره شد؛ همگام‌سازی ابری در صف است.',
    goal: 'هدف', planOutline: 'فهرست روزها', backToPlans: 'همهٔ پلن‌های روحانی', previous: 'قبلی', next: 'بعدی',
    scripture: 'کلام', biblicalFoundation: 'مبنای کتاب‌مقدسی', pastoralGuidance: 'راهنمایی شبانی', teaching: 'تعلیم روز', reflect: 'تأمل', practice: 'تمرین امروز', spiritPractice: 'تمرین دعا در روح و به زبان‌ها', prayer: 'دعا', declaration: 'اعلام ایمان',
    privateNote: 'یادداشت خصوصی من', privateNoteHelp: 'فقط حساب خودت می‌تواند این تأمل را بخواند.', saveNote: 'ذخیرهٔ یادداشت خصوصی',
    completeDay: 'تکمیل این روز', undoDay: 'برگرداندن به تکمیل‌نشده', planComplete: 'این مسیر تکمیل شد',
    chooseDay: 'انتخاب روز', confirmUndo: 'این روز به حالت تکمیل‌نشده برگردد؟', showVerse: 'نمایش آیه همین‌جا',
    fastingTitle: 'شروع یک مسیر روزه', fastingIntro: 'نوعی حکیمانه از روزه را انتخاب کن، هدفت را بنویس و با تعلیم و ثبت روزانه تمرکزت را بر خدا نگه دار.',
    safety: 'سلامت و ایمنی', safetyAck: 'یادداشت ایمنی را خوانده‌ام و روزه‌ای متناسب با وضعیت سلامتی‌ام انتخاب می‌کنم.',
    fastingType: 'نوع روزه', purpose: 'هدف این روزه', startDate: 'تاریخ شروع', endDate: 'تاریخ پایان', startJourney: 'شروع مسیر',
    activeJourneys: 'روزه‌های فعال', fastingHistory: 'سابقهٔ روزه', noJourneys: 'هنوز مسیر روزه‌ای ثبت نشده است.',
    journeyDay: 'روز مسیر', dailyLog: 'ثبت روزانهٔ روزه', prayerMinutes: 'دقایق دعا', scriptureNote: 'یادداشت کلام', reflection: 'تأمل',
    dayObserved: 'روزهٔ امروز را انجام دادم', saveLog: 'ذخیرهٔ ثبت روزانه', logSaved: 'ثبت روزانه ذخیره شد', completeJourney: 'تکمیل مسیر', cancelJourney: 'پایان مسیر',
    statusActive: 'فعال', statusCompleted: 'تکمیل‌شده', statusCancelled: 'پایان‌یافته', continueJourney: 'ادامهٔ مسیر',
    required: 'لطفاً همهٔ موارد ضروری را کامل کن.', invalidDates: 'تاریخ پایان نمی‌تواند پیش از تاریخ شروع باشد.', prayerRequired: 'روزهٔ تکمیل‌شده باید با دعا همراه باشد. پیش از علامت‌زدن روز، دست‌کم یک دقیقه دعا ثبت کن.',
    fastingTeaching: 'پیش از شروع یاد بگیر', fastingTeachingIntro: 'برای هر نوع روزه، هدف، روش اجرا، برنامهٔ دعا، پرهیزها و نکات ایمنی را بخوان.', fastingCovenant: 'عهد روزه',
    summaryTitle: 'فعالیت پلن‌های روحانی', noActivity: 'هنوز فعالیتی در پلن‌های روحانی ثبت نشده است.', viewPlans: 'باز کردن پلن‌ها',
    recentCompletions: 'تکمیل‌های اخیر', fastingRecords: 'سابقهٔ روزه', date: 'تاریخ',
    type_partial: 'روزهٔ غذایی محدود', type_daniel: 'روزه به شیوهٔ دانیال', type_sunrise: 'روزه از طلوع تا غروب', type_one_meal: 'حذف یک وعده', type_liquid: 'روزهٔ مایعات', type_water: 'روزهٔ فقط آب (با راهنمایی)', type_media: 'وقف رسانه‌ای / پرهیز غیرغذایی', type_custom: 'روزهٔ حکیمانهٔ سفارشی',
    errorTitle: 'پلن‌ها موقتاً در دسترس نیستند', retry: 'تلاش دوباره'
  },
  hr: {
    spiritualPlans: 'Duhovni planovi', fastingJournal: 'Dnevnik posta', biblePlans: 'Čitanje Biblije',
    heroTitle: 'Rasti vjerno, dan po dan', heroText: 'Odaberi putovanje ukorijenjeno u Pismu. Tvoje mjesto, dovršeni dani i privatne bilješke dostupni su offline te se sigurno sinkroniziraju nakon prijave.',
    days: 'dana', day: 'Dan', start: 'Započni plan', continue: 'Nastavi', completed: 'Dovršeno', active: 'Aktivno', notStarted: 'Nije započeto',
    progress: 'Napredak', completedDays: 'dovršenih dana', completedPlans: 'dovršenih planova', activePlans: 'aktivnih planova', currentStreak: 'dana u nizu',
    signInSync: 'Prijavi se kako bi obnovio napredak na drugom uređaju. Napredak gosta ostaje privatan na ovom uređaju.',
    accountSync: 'Napredak je povezan s tvojim računom i sinkronizira se kada veza bude dostupna.',
    offlineReady: 'Spremno offline', syncing: 'Spremanje na račun…', saved: 'Spremljeno', queued: 'Spremljeno na uređaju; cloud sinkronizacija je na čekanju.',
    goal: 'Cilj', planOutline: 'Pregled plana', backToPlans: 'Svi duhovni planovi', previous: 'Prethodni', next: 'Sljedeći',
    scripture: 'Pismo', biblicalFoundation: 'Biblijski temelj', pastoralGuidance: 'Pastoralna smjernica', teaching: 'Dnevni nauk', reflect: 'Promisli', practice: 'Primijeni danas', spiritPractice: 'Vježba molitve u Duhu i jezicima', prayer: 'Molitva', declaration: 'Ispovijed vjere',
    privateNote: 'Moja privatna bilješka', privateNoteHelp: 'Samo tvoj račun može pročitati ovo promišljanje.', saveNote: 'Spremi privatnu bilješku',
    completeDay: 'Dovrši ovaj dan', undoDay: 'Označi kao nedovršeno', planComplete: 'Putovanje je dovršeno',
    chooseDay: 'Odaberi dan', confirmUndo: 'Označiti ovaj dan kao nedovršen?', showVerse: 'Prikaži stih ovdje',
    fastingTitle: 'Započni putovanje posta', fastingIntro: 'Odaberi mudar oblik posta, imenuj svrhu i koristi dnevni nauk i dnevnik kako bi ostao usmjeren na Boga.',
    safety: 'Zdravlje i sigurnost', safetyAck: 'Pročitao/la sam sigurnosnu napomenu i odabrat ću medicinski prikladan post.',
    fastingType: 'Vrsta posta', purpose: 'Svrha ovoga posta', startDate: 'Datum početka', endDate: 'Datum završetka', startJourney: 'Započni putovanje',
    activeJourneys: 'Aktivna putovanja', fastingHistory: 'Povijest posta', noJourneys: 'Još nema putovanja posta.',
    journeyDay: 'Dan putovanja', dailyLog: 'Dnevni zapis posta', prayerMinutes: 'Minute molitve', scriptureNote: 'Bilješka iz Pisma', reflection: 'Promišljanje',
    dayObserved: 'Održao/la sam današnji post', saveLog: 'Spremi dnevni zapis', logSaved: 'Dnevni zapis je spremljen', completeJourney: 'Dovrši putovanje', cancelJourney: 'Završi putovanje',
    statusActive: 'Aktivno', statusCompleted: 'Dovršeno', statusCancelled: 'Završeno', continueJourney: 'Nastavi putovanje',
    required: 'Ispuni obavezna polja.', invalidDates: 'Datum završetka ne može biti prije datuma početka.', prayerRequired: 'Dovršen dan posta mora uključivati molitvu. Upiši barem jednu minutu molitve prije dovršetka dana.',
    fastingTeaching: 'Nauči prije početka', fastingTeachingIntro: 'Za svaki oblik pročitaj svrhu, način, ritam molitve, odricanja i sigurnosne smjernice.', fastingCovenant: 'Savez posta',
    summaryTitle: 'Aktivnost duhovnih planova', noActivity: 'Još nema aktivnosti u duhovnim planovima.', viewPlans: 'Otvori planove',
    recentCompletions: 'Nedavni dovršeci', fastingRecords: 'zapisa posta', date: 'Datum',
    type_partial: 'Djelomični post od hrane', type_daniel: 'Post po Danielovu uzoru', type_sunrise: 'Post od izlaska do zalaska', type_one_meal: 'Post jednoga obroka', type_liquid: 'Tekući post', type_water: 'Post samo na vodi (uz vodstvo)', type_media: 'Medijska posveta / neprehrambeno odricanje', type_custom: 'Prilagođeni mudar post',
    errorTitle: 'Planovi trenutačno nisu dostupni', retry: 'Pokušaj ponovno'
  }
};

const FASTING_TYPES = ['partial', 'daniel', 'sunrise', 'one_meal', 'liquid', 'water', 'media', 'custom'];

function lang(ctx) {
  const value = typeof ctx.getLang === 'function' ? ctx.getLang() : ctx.lang;
  return ['fa', 'en', 'hr'].includes(value) ? value : 'en';
}
function t(ctx, key) { return UI[lang(ctx)]?.[key] || UI.en[key] || key; }
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
}
function text(value) { return esc(value).replace(/\n/g, '<br>'); }
function localNumber(ctx, value) { return typeof ctx.localNum === 'function' ? ctx.localNum(value) : String(value); }
function localMeta(plan, ctx) { return plan?.localized?.[lang(ctx)] || plan?.localized?.en || {}; }
function localDay(day, ctx) { return day?.content?.[lang(ctx)] || day?.content?.en || {}; }
function nowIso() { return new Date().toISOString(); }
function localDateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = value => String(value).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function plusDays(dateKey, amount) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + Number(amount || 0));
  return localDateKey(date);
}
function formatDate(ctx, value) {
  if (!value) return '—';
  const locale = lang(ctx) === 'fa' ? 'fa-IR' : lang(ctx) === 'hr' ? 'hr-HR' : 'en-US';
  const date = new Date(String(value).length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { year:'numeric', month:'short', day:'numeric' }).format(date);
}
function safeJson(value, fallback) {
  try { return JSON.parse(value); } catch (_) { return fallback; }
}
function scopeId(ctx) {
  const id = typeof ctx.userId === 'function' ? ctx.userId() : '';
  return id || 'guest';
}
function progressStorageKey(ctx) { return PROGRESS_PREFIX + scopeId(ctx); }
function fastingStorageKey(ctx) { return FASTING_PREFIX + scopeId(ctx); }
function loadProgress(ctx) {
  const value = safeJson(localStorage.getItem(progressStorageKey(ctx)) || '', null);
  return value && value.version === MODULE_VERSION && value.plans ? value : { version:MODULE_VERSION, plans:{} };
}
function saveProgress(ctx, value) {
  value.version = MODULE_VERSION;
  localStorage.setItem(progressStorageKey(ctx), JSON.stringify(value));
}
function loadFasting(ctx) {
  const value = safeJson(localStorage.getItem(fastingStorageKey(ctx)) || '', null);
  return value && value.version === MODULE_VERSION && Array.isArray(value.journeys) && value.logs ? value : { version:MODULE_VERSION, journeys:[], logs:{} };
}
function saveFasting(ctx, value) {
  value.version = MODULE_VERSION;
  localStorage.setItem(fastingStorageKey(ctx), JSON.stringify(value));
}
function planProgress(state, planId) {
  if (!state.plans[planId]) state.plans[planId] = { startedAt:null, completedAt:null, lastOpenedDay:1, days:{} };
  if (!state.plans[planId].days) state.plans[planId].days = {};
  return state.plans[planId];
}
function dayProgress(planState, dayNumber) { return planState?.days?.[String(dayNumber)] || null; }
function completedCount(planState) {
  return Object.values(planState?.days || {}).filter(day => day?.status === 'completed').length;
}
function derivePlanCompletion(plan, planState) {
  const done = completedCount(planState);
  if (done >= Number(plan.durationDays || plan.days?.length || 0)) {
    const dates = Object.values(planState.days || {}).map(day => day.completedAt).filter(Boolean).sort();
    planState.completedAt = dates.at(-1) || planState.completedAt || nowIso();
  } else {
    planState.completedAt = null;
  }
}
function nextOpenDay(plan, planState) {
  const total = Number(plan.durationDays || plan.days?.length || 1);
  for (let day = 1; day <= total; day += 1) if (dayProgress(planState, day)?.status !== 'completed') return day;
  return total;
}
function timestamp(value) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}
function mergeProgressDay(localDayValue, cloudDayValue) {
  if (!localDayValue) return cloudDayValue;
  if (!cloudDayValue) return localDayValue;
  const localTime = timestamp(localDayValue.updatedAt);
  const cloudTime = timestamp(cloudDayValue.updatedAt);
  let winner = cloudTime > localTime ? cloudDayValue : localDayValue;
  if (cloudTime === localTime && cloudDayValue.status === 'completed') winner = cloudDayValue;
  const starts = [localDayValue.startedAt, cloudDayValue.startedAt].filter(Boolean).sort();
  return { ...winner, startedAt:starts[0] || winner.startedAt || null };
}
function cloudProgressRowToLocal(row) {
  return {
    status: row.status === 'completed' ? 'completed' : 'in_progress',
    startedAt: row.started_at || null,
    completedAt: row.completed_at || null,
    note: row.reflection || '',
    updatedAt: row.updated_at || row.completed_at || row.started_at || nowIso()
  };
}
function localProgressRow(ctx, planId, dayNumber, day) {
  return {
    user_id: ctx.userId(), plan_id:planId, day_number:Number(dayNumber),
    status:day.status === 'completed' ? 'completed' : 'in_progress',
    started_at:day.startedAt || nowIso(), completed_at:day.status === 'completed' ? (day.completedAt || nowIso()) : null,
    reflection:String(day.note || '').slice(0, 4000), updated_at:day.updatedAt || nowIso()
  };
}
async function fetchJson(ctx, path) {
  if (typeof ctx.jfetch === 'function') return ctx.jfetch(path);
  const response = await fetch(path, { cache:'no-cache' });
  if (!response.ok) throw new Error(path);
  return response.json();
}
async function loadPlans(ctx) {
  if (!catalogPromise) {
    catalogPromise = (async () => {
      const catalog = await fetchJson(ctx, CATALOG_PATH);
      const plans = await Promise.all((catalog.plans || []).sort((a, b) => Number(a.order) - Number(b.order)).map(item => fetchJson(ctx, item.file)));
      return plans;
    })().catch(error => { catalogPromise = null; throw error; });
  }
  return catalogPromise;
}
async function loadFastingGuides(ctx) {
  if (!fastingGuidesPromise) fastingGuidesPromise = fetchJson(ctx, FASTING_GUIDES_PATH).catch(error => { fastingGuidesPromise = null; throw error; });
  return fastingGuidesPromise;
}
function localizedReference(ctx, reference) {
  return typeof ctx.localizeRef === 'function' ? ctx.localizeRef(reference) : reference;
}
function scriptureReveal(ctx, reference, compact=false) {
  return `<div class="nh7-scripture-reveal ${compact ? 'compact' : ''}"><button type="button" class="nh7-scripture-ref" data-reveal-ref="${esc(reference)}" aria-expanded="false"><span>${esc(localizedReference(ctx, reference))}</span><small>${esc(t(ctx, 'showVerse'))}</small></button><div class="inline-verse hidden"></div></div>`;
}
function loggedIn(ctx) { return Boolean(typeof ctx.isLoggedIn === 'function' && ctx.isLoggedIn() && ctx.userId()); }
function cloudOwner(ctx) { return typeof ctx.authEmail === 'function' ? ctx.authEmail() : ''; }
async function queueProgressRows(ctx, rows) {
  if (!loggedIn(ctx) || !rows.length || typeof ctx.saveCloud !== 'function') return;
  await ctx.saveCloud({ type:'upsert', table:'spiritual_plan_progress', conflict:'user_id,plan_id,day_number', owner_email:cloudOwner(ctx), payload:rows });
}
async function queueJourney(ctx, journey) {
  if (!loggedIn(ctx) || typeof ctx.saveCloud !== 'function') return;
  const row = {
    id:journey.id, user_id:ctx.userId(), fasting_type:journey.typeKey,
    start_date:journey.startDate, end_date:journey.endDate, purpose:String(journey.purpose || '').slice(0, 1000),
    status:journey.status || 'active', completed_at:journey.completedAt || null,
    created_at:journey.createdAt || nowIso(), updated_at:journey.updatedAt || nowIso()
  };
  await ctx.saveCloud({ type:'upsert', table:'fasting_journeys', conflict:'id,user_id', owner_email:cloudOwner(ctx), payload:row });
}
async function queueFastingLog(ctx, log) {
  if (!loggedIn(ctx) || typeof ctx.saveCloud !== 'function') return;
  const row = {
    user_id:ctx.userId(), journey_id:log.journeyId, log_date:log.logDate,
    completed:Boolean(log.completed), prayer_minutes:Math.max(0, Math.min(1440, Number(log.prayerMinutes || 0))),
    scripture_note:String(log.scriptureNote || '').slice(0, 4000), reflection:String(log.reflection || '').slice(0, 4000),
    updated_at:log.updatedAt || nowIso()
  };
  await ctx.saveCloud({ type:'upsert', table:'fasting_daily_logs', conflict:'user_id,journey_id,log_date', owner_email:cloudOwner(ctx), payload:row });
}
function mergeJourney(localJourney, remoteJourney) {
  if (!localJourney) return remoteJourney;
  if (!remoteJourney) return localJourney;
  return timestamp(remoteJourney.updatedAt) > timestamp(localJourney.updatedAt) ? remoteJourney : localJourney;
}
function mergeFastingLog(localLog, remoteLog) {
  if (!localLog) return remoteLog;
  if (!remoteLog) return localLog;
  return timestamp(remoteLog.updatedAt) > timestamp(localLog.updatedAt) ? remoteLog : localLog;
}

export async function syncSpiritualPlansV240(ctx, { force=false } = {}) {
  if (!loggedIn(ctx) || !navigator.onLine || typeof ctx.cloudFetch !== 'function') return false;
  const userId = ctx.userId();
  const last = cloudSyncAt.get(userId) || 0;
  if (!force && Date.now() - last < 30000) return true;
  if (typeof ctx.syncCloudQueue === 'function') await ctx.syncCloudQueue();
  let progressRows = [], journeyRows = [], logRows = [];
  try {
    progressRows = await ctx.cloudFetch('spiritual_plan_progress?select=plan_id,day_number,status,started_at,completed_at,reflection,updated_at&order=updated_at.asc', { method:'GET', cache:'no-store' }) || [];
    journeyRows = await ctx.cloudFetch('fasting_journeys?select=id,fasting_type,start_date,end_date,purpose,status,completed_at,created_at,updated_at&order=created_at.desc', { method:'GET', cache:'no-store' }) || [];
    logRows = await ctx.cloudFetch('fasting_daily_logs?select=id,journey_id,log_date,completed,prayer_minutes,scripture_note,reflection,updated_at&order=log_date.asc', { method:'GET', cache:'no-store' }) || [];
  } catch (error) {
    console.warn('Spiritual plans cloud restore unavailable', error);
    return false;
  }
  const progress = loadProgress(ctx);
  for (const row of progressRows) {
    const plan = planProgress(progress, row.plan_id);
    const number = String(Number(row.day_number));
    plan.days[number] = mergeProgressDay(plan.days[number], cloudProgressRowToLocal(row));
    const started = Object.values(plan.days).map(day => day.startedAt).filter(Boolean).sort();
    plan.startedAt = started[0] || plan.startedAt || null;
    plan.lastOpenedDay = Math.max(Number(plan.lastOpenedDay || 1), Number(row.day_number || 1));
  }
  const plans = await loadPlans(ctx).catch(() => []);
  for (const plan of plans) if (progress.plans[plan.id]) derivePlanCompletion(plan, progress.plans[plan.id]);
  saveProgress(ctx, progress);

  const fasting = loadFasting(ctx);
  const journeyMap = new Map(fasting.journeys.map(journey => [journey.id, journey]));
  for (const row of journeyRows) {
    const journey = {
      id:row.id, typeKey:row.fasting_type, startDate:row.start_date, endDate:row.end_date,
      purpose:row.purpose || '', status:row.status || 'active', completedAt:row.completed_at || null,
      createdAt:row.created_at || null, updatedAt:row.updated_at || row.created_at || null
    };
    journeyMap.set(journey.id, mergeJourney(journeyMap.get(journey.id), journey));
  }
  fasting.journeys = Array.from(journeyMap.values()).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  for (const row of logRows) {
    const key = `${row.journey_id}:${row.log_date}`;
    const log = {
      id:row.id || null, journeyId:row.journey_id, logDate:row.log_date, completed:Boolean(row.completed),
      prayerMinutes:Number(row.prayer_minutes || 0), scriptureNote:row.scripture_note || '', reflection:row.reflection || '', updatedAt:row.updated_at || null
    };
    fasting.logs[key] = mergeFastingLog(fasting.logs[key], log);
  }
  saveFasting(ctx, fasting);
  cloudSyncAt.set(userId, Date.now());
  return true;
}

export function renderPlansTabsV240(ctx, active='spiritual') {
  return `<div class="nh7-plans-tabs" role="tablist" aria-label="${esc(t(ctx, 'spiritualPlans'))}">
    <button type="button" role="tab" aria-selected="${active === 'spiritual'}" class="${active === 'spiritual' ? 'active' : ''}" data-nh7-plans-tab="spiritual">🙏 ${esc(t(ctx, 'spiritualPlans'))}</button>
    <button type="button" role="tab" aria-selected="${active === 'fasting'}" class="${active === 'fasting' ? 'active' : ''}" data-nh7-plans-tab="fasting">🔥 ${esc(t(ctx, 'fastingJournal'))}</button>
    <button type="button" role="tab" aria-selected="${active === 'bible'}" class="${active === 'bible' ? 'active' : ''}" data-nh7-plans-tab="bible">📖 ${esc(t(ctx, 'biblePlans'))}</button>
  </div>`;
}

export function bindPlansTabsV240(ctx) {
  document.querySelectorAll('[data-nh7-plans-tab]').forEach(button => {
    button.addEventListener('click', () => ctx.navigate('plans', { tab:button.dataset.nh7PlansTab }, true));
  });
}

function completedDateKeys(progress) {
  const dates = [];
  Object.values(progress.plans || {}).forEach(plan => Object.values(plan.days || {}).forEach(day => {
    if (day.status === 'completed' && day.completedAt) dates.push(localDateKey(new Date(day.completedAt)));
  }));
  return Array.from(new Set(dates)).sort();
}
function currentStreak(progress) {
  const dates = new Set(completedDateKeys(progress));
  if (!dates.size) return 0;
  let cursor = localDateKey();
  if (!dates.has(cursor)) cursor = plusDays(cursor, -1);
  let streak = 0;
  while (dates.has(cursor)) { streak += 1; cursor = plusDays(cursor, -1); }
  return streak;
}
function summaryStats(plans, progress) {
  let completedDays = 0, completedPlans = 0, activePlans = 0;
  const completions = [];
  for (const plan of plans) {
    const state = progress.plans[plan.id];
    if (!state?.startedAt) continue;
    const count = completedCount(state);
    completedDays += count;
    if (state.completedAt) {
      completedPlans += 1;
      completions.push({ plan, at:state.completedAt });
    } else activePlans += 1;
  }
  completions.sort((a, b) => timestamp(b.at) - timestamp(a.at));
  return { completedDays, completedPlans, activePlans, streak:currentStreak(progress), completions };
}
function syncBanner(ctx) {
  const copy = loggedIn(ctx) ? t(ctx, 'accountSync') : t(ctx, 'signInSync');
  return `<div class="nh7-plan-sync ${loggedIn(ctx) ? 'account' : 'guest'}"><span aria-hidden="true">${loggedIn(ctx) ? '☁' : '⌁'}</span><p>${esc(copy)}</p><span class="nh7-offline-pill">${esc(t(ctx, 'offlineReady'))}</span></div>`;
}
function progressBar(ctx, done, total) {
  const percent = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return `<div class="nh7-plan-progress" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent}%"></span></div><small>${localNumber(ctx, done)} / ${localNumber(ctx, total)} · ${localNumber(ctx, percent)}%</small>`;
}
function renderPlanCard(ctx, plan, state) {
  const meta = localMeta(plan, ctx);
  const total = Number(plan.durationDays || plan.days?.length || 0);
  const done = completedCount(state);
  const started = Boolean(state?.startedAt);
  const complete = Boolean(state?.completedAt);
  const day = started ? nextOpenDay(plan, state) : 1;
  const status = complete ? t(ctx, 'completed') : started ? t(ctx, 'active') : t(ctx, 'notStarted');
  const action = complete ? t(ctx, 'completed') : started ? t(ctx, 'continue') : t(ctx, 'start');
  return `<article class="nh7-plan-card theme-${esc(plan.theme || plan.category || 'default')}">
    <div class="nh7-plan-card-head"><span class="nh7-plan-icon" aria-hidden="true">${esc(plan.icon || '✓')}</span><span class="nh7-plan-status ${complete ? 'complete' : started ? 'active' : ''}">${esc(status)}</span></div>
    <h3>${esc(meta.title || plan.id)}</h3><p class="nh7-plan-subtitle">${esc(meta.subtitle || '')}</p><p>${esc(meta.description || '')}</p>
    <div class="nh7-plan-duration"><strong>${localNumber(ctx, total)}</strong> ${esc(t(ctx, 'days'))}</div>
    ${progressBar(ctx, done, total)}
    <button type="button" class="primary-btn wide-btn" data-nh7-open-plan="${esc(plan.id)}" data-day="${day}" data-start="${started ? '0' : '1'}">${esc(action)} ${complete ? '✓' : '→'}</button>
  </article>`;
}
function statsStrip(ctx, stats, fastingCount=0) {
  return `<div class="nh7-plan-stats">
    <div><strong>${localNumber(ctx, stats.activePlans)}</strong><span>${esc(t(ctx, 'activePlans'))}</span></div>
    <div><strong>${localNumber(ctx, stats.completedDays)}</strong><span>${esc(t(ctx, 'completedDays'))}</span></div>
    <div><strong>${localNumber(ctx, stats.streak)}</strong><span>${esc(t(ctx, 'currentStreak'))}</span></div>
    ${fastingCount ? `<div><strong>${localNumber(ctx, fastingCount)}</strong><span>${esc(t(ctx, 'fastingRecords'))}</span></div>` : ''}
  </div>`;
}

async function ensurePlanStarted(ctx, plan, selectedDay=1) {
  const progress = loadProgress(ctx);
  const state = planProgress(progress, plan.id);
  const now = nowIso();
  const dayNumber = Math.max(1, Math.min(Number(selectedDay || 1), Number(plan.durationDays || plan.days?.length || 1)));
  if (!state.startedAt) state.startedAt = now;
  if (!state.days[String(dayNumber)]) state.days[String(dayNumber)] = { status:'in_progress', startedAt:now, completedAt:null, note:'', updatedAt:now };
  state.lastOpenedDay = dayNumber;
  saveProgress(ctx, progress);
  await queueProgressRows(ctx, [localProgressRow(ctx, plan.id, dayNumber, state.days[String(dayNumber)])]).catch(error => console.warn('Plan start queued locally', error));
  return state;
}
async function updateDay(ctx, plan, dayNumber, changes) {
  const progress = loadProgress(ctx);
  const state = planProgress(progress, plan.id);
  const now = nowIso();
  const old = dayProgress(state, dayNumber) || { status:'in_progress', startedAt:now, completedAt:null, note:'' };
  const updated = { ...old, ...changes, startedAt:old.startedAt || now, updatedAt:now };
  state.days[String(dayNumber)] = updated;
  state.startedAt = state.startedAt || updated.startedAt;
  state.lastOpenedDay = Number(dayNumber);
  derivePlanCompletion(plan, state);
  saveProgress(ctx, progress);
  await queueProgressRows(ctx, [localProgressRow(ctx, plan.id, dayNumber, updated)]).catch(error => console.warn('Plan update queued locally', error));
  return { progress, state, updated };
}

function renderPlanOutline(ctx, plan, state, selectedDay) {
  return `<div class="nh7-day-picker" aria-label="${esc(t(ctx, 'chooseDay'))}">${plan.days.map(day => {
    const value = dayProgress(state, day.day);
    const complete = value?.status === 'completed';
    return `<button type="button" class="${Number(day.day) === Number(selectedDay) ? 'current' : ''} ${complete ? 'complete' : ''}" data-nh7-plan-day="${Number(day.day)}" aria-label="${esc(t(ctx, 'day'))} ${Number(day.day)}${complete ? `, ${esc(t(ctx, 'completed'))}` : ''}">${localNumber(ctx, day.day)}${complete ? '<span>✓</span>' : ''}</button>`;
  }).join('')}</div>`;
}
function contentBlock(ctx, icon, titleKey, body, className='') {
  if (!body) return '';
  return `<section class="nh7-devotional-block ${className}"><h3><span aria-hidden="true">${icon}</span>${esc(t(ctx, titleKey))}</h3><p>${text(body)}</p></section>`;
}
function fastingGuideCopy(value, ctx) { return value?.localized?.[lang(ctx)] || value?.localized?.en || {}; }
function renderFastingEducation(ctx, guides) {
  const shared = fastingGuideCopy(guides, ctx);
  const abstain = Array.isArray(shared.abstain) ? shared.abstain : [];
  const types = Array.isArray(guides?.types) ? guides.types : [];
  return `<section class="card nh7-fasting-education"><header><span aria-hidden="true">📚</span><div><h2>${esc(t(ctx, 'fastingTeaching'))}</h2><p>${esc(t(ctx, 'fastingTeachingIntro'))}</p></div></header>
    <div class="nh7-fasting-covenant"><h3>${esc(t(ctx, 'fastingCovenant'))}</h3><p>${text(shared.intro || '')}</p><div class="nh7-fasting-prayer-rule"><strong>🙏 ${esc(shared.prayerTitle || t(ctx, 'prayer'))}</strong><p>${text(shared.prayerRhythm || '')}</p></div>${abstain.length ? `<h4>${esc(shared.abstainTitle || '')}</h4><ul>${abstain.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}<p class="nh7-fasting-shared-practice">${text(shared.sharedPractice || '')}</p></div>
    <div class="nh7-fast-type-guides">${types.map((type, index) => { const copy=fastingGuideCopy(type, ctx); return `<details class="nh7-fast-type-guide" ${index === 0 ? 'open' : ''}><summary><span>${esc(type.icon || '•')}</span><div><strong>${esc(copy.title || t(ctx, `type_${type.key}`))}</strong><small>${esc(copy.summary || '')}</small></div><b aria-hidden="true">＋</b></summary><div class="nh7-fast-type-body"><section><h4>${esc(copy.teachingTitle || t(ctx, 'teaching'))}</h4><p>${text(copy.teaching || '')}</p></section><section><h4>${esc(copy.practiceTitle || t(ctx, 'practice'))}</h4><p>${text(copy.practice || '')}</p></section><section><h4>${esc(copy.prayerTitle || t(ctx, 'prayer'))}</h4><p>${text(copy.prayer || '')}</p></section><section><h4>${esc(copy.boundariesTitle || '')}</h4><p>${text(copy.boundaries || '')}</p></section>${type.scriptures?.length ? `<div class="nh7-fast-guide-refs">${type.scriptures.map(reference => scriptureReveal(ctx, reference, true)).join('')}</div>` : ''}<div class="nh7-fast-guide-safety">⚕ ${text(copy.safety || shared.safety || '')}</div></div></details>` }).join('')}</div>
  </section>`;
}
function renderFastingLog(ctx, journey, dayNumber, fasting) {
  if (!journey) return `<section class="nh7-devotional-block nh7-fast-callout"><h3>🔥 ${esc(t(ctx, 'dailyLog'))}</h3><p>${esc(t(ctx, 'fastingIntro'))}</p><button type="button" class="secondary-btn" data-nh7-open-fasting>${esc(t(ctx, 'fastingJournal'))}</button></section>`;
  const logDate = plusDays(journey.startDate, Number(dayNumber) - 1);
  const key = `${journey.id}:${logDate}`;
  const log = fasting.logs[key] || {};
  return `<section class="nh7-fasting-log" data-log-date="${esc(logDate)}">
    <div class="nh7-log-heading"><div><span class="badge">${esc(t(ctx, 'journeyDay'))} ${localNumber(ctx, dayNumber)}</span><h3>${esc(t(ctx, 'dailyLog'))}</h3></div><strong>${esc(formatDate(ctx, logDate))}</strong></div>
    <div class="nh7-prayer-required-note">🙏 ${esc(t(ctx, 'prayerRequired'))}</div>
    <label>${esc(t(ctx, 'prayerMinutes'))}<input id="nh7PrayerMinutes" type="number" inputmode="numeric" min="1" max="1440" value="${Number(log.prayerMinutes || 0)}"></label>
    <label>${esc(t(ctx, 'scriptureNote'))}<textarea id="nh7ScriptureNote" maxlength="4000" rows="3">${esc(log.scriptureNote || '')}</textarea></label>
    <label>${esc(t(ctx, 'reflection'))}<textarea id="nh7FastingReflection" maxlength="4000" rows="4">${esc(log.reflection || '')}</textarea></label>
    <label class="nh7-check-row"><input id="nh7FastingObserved" type="checkbox" ${log.completed ? 'checked' : ''}><span>${esc(t(ctx, 'dayObserved'))}</span></label>
    <button type="button" class="primary-btn wide-btn" data-nh7-save-fast-log="${esc(journey.id)}">${esc(t(ctx, 'saveLog'))}</button><p class="nh7-save-state" aria-live="polite"></p>
  </section>`;
}

async function renderPlanDetail(ctx, plan, params) {
  let progress = loadProgress(ctx);
  let state = progress.plans[plan.id] || null;
  const meta = localMeta(plan, ctx);
  const total = Number(plan.durationDays || plan.days?.length || 1);
  if (!state?.startedAt && String(params.start) === '1') state = await ensurePlanStarted(ctx, plan, Number(params.day || 1));
  if (!state?.startedAt) {
    ctx.view.innerHTML = `${renderPlansTabsV240(ctx, 'spiritual')}<button type="button" class="nh7-plans-back" data-nh7-back-plans>‹ ${esc(t(ctx, 'backToPlans'))}</button>
      <section class="card nh7-plan-intro theme-${esc(plan.theme || plan.category || 'default')}"><span class="nh7-plan-icon large">${esc(plan.icon || '✓')}</span><h1>${esc(meta.title || plan.id)}</h1><p class="lead">${esc(meta.subtitle || '')}</p><p>${esc(meta.description || '')}</p><div class="notice"><strong>${esc(t(ctx, 'goal'))}:</strong> ${esc(meta.goal || '')}</div>${meta.pastoralNote ? `<div class="nh7-pastoral-note"><strong>${esc(t(ctx, 'pastoralGuidance'))}</strong><p>${esc(meta.pastoralNote)}</p></div>` : ''}${plan.foundationalScriptures?.length ? `<div class="nh7-foundation-refs"><strong>${esc(t(ctx, 'biblicalFoundation'))}</strong>${plan.foundationalScriptures.map(reference => scriptureReveal(ctx, reference, true)).join('')}</div>` : ''}<button type="button" class="primary-btn wide-btn" data-nh7-start-plan="${esc(plan.id)}">${esc(t(ctx, 'start'))}</button></section>
      <section class="card"><h2>${esc(t(ctx, 'planOutline'))}</h2><ol class="nh7-plan-outline">${plan.days.map(day => `<li><span>${localNumber(ctx, day.day)}</span>${esc(localDay(day, ctx).title || '')}</li>`).join('')}</ol></section>`;
    bindDetailEvents(ctx, plan, params);
    return;
  }
  const selected = Math.max(1, Math.min(Number(params.day || state.lastOpenedDay || nextOpenDay(plan, state)), total));
  if (!dayProgress(state, selected)) state = await ensurePlanStarted(ctx, plan, selected);
  progress = loadProgress(ctx); state = progress.plans[plan.id];
  const day = plan.days.find(item => Number(item.day) === selected) || plan.days[selected - 1];
  const copy = localDay(day, ctx);
  const dayState = dayProgress(state, selected) || {};
  const done = completedCount(state);
  const complete = dayState.status === 'completed';
  const fasting = loadFasting(ctx);
  const journey = params.journey ? fasting.journeys.find(item => item.id === params.journey) : null;
  ctx.view.innerHTML = `${renderPlansTabsV240(ctx, 'spiritual')}<button type="button" class="nh7-plans-back" data-nh7-back-plans>‹ ${esc(t(ctx, 'backToPlans'))}</button>
    <section class="card nh7-plan-reader theme-${esc(plan.theme || plan.category || 'default')}">
      <header class="nh7-reader-head"><span class="nh7-plan-icon">${esc(plan.icon || '✓')}</span><div><small>${esc(meta.title || '')}</small><h1>${esc(t(ctx, 'day'))} ${localNumber(ctx, selected)}: ${esc(copy.title || '')}</h1></div>${complete ? `<span class="nh7-plan-status complete">✓ ${esc(t(ctx, 'completed'))}</span>` : ''}</header>
      ${progressBar(ctx, done, total)}
      ${renderPlanOutline(ctx, plan, state, selected)}
      ${selected === 1 && meta.pastoralNote ? `<div class="nh7-pastoral-note"><strong>${esc(t(ctx, 'pastoralGuidance'))}</strong><p>${esc(meta.pastoralNote)}</p></div>` : ''}
      ${selected === 1 && plan.foundationalScriptures?.length ? `<section class="nh7-scripture-block nh7-foundational-scriptures"><h3>🕊 ${esc(t(ctx, 'biblicalFoundation'))}</h3><div>${plan.foundationalScriptures.map(reference => scriptureReveal(ctx, reference)).join('')}</div></section>` : ''}
      <section class="nh7-scripture-block"><h3>📖 ${esc(t(ctx, 'scripture'))}</h3><div>${(day.scriptures || []).map(reference => scriptureReveal(ctx, reference)).join('')}</div></section>
      ${contentBlock(ctx, '✦', 'teaching', copy.devotional, 'teaching')}
      ${contentBlock(ctx, '؟', 'reflect', copy.reflection, 'reflection')}
      ${contentBlock(ctx, '→', 'practice', copy.action, 'practice')}
      ${contentBlock(ctx, '🕊', 'spiritPractice', plan.spiritPractices?.[lang(ctx)]?.[selected - 1] || plan.spiritPractices?.en?.[selected - 1], 'spirit-practice')}
      ${contentBlock(ctx, '🙏', 'prayer', copy.prayer, 'prayer')}
      ${contentBlock(ctx, '◆', 'declaration', copy.declaration, 'declaration')}
      <section class="nh7-private-note"><h3>🔒 ${esc(t(ctx, 'privateNote'))}</h3><p class="muted">${esc(t(ctx, 'privateNoteHelp'))}</p><textarea id="nh7PlanNote" maxlength="4000" rows="5">${esc(dayState.note || '')}</textarea><button type="button" class="secondary-btn" data-nh7-save-note>${esc(t(ctx, 'saveNote'))}</button><span class="nh7-save-state" aria-live="polite"></span></section>
      ${plan.requiresJourney ? renderFastingLog(ctx, journey, selected, fasting) : ''}
      <div class="nh7-reader-actions"><button type="button" class="secondary-btn" data-nh7-prev-day ${selected <= 1 ? 'disabled' : ''}>‹ ${esc(t(ctx, 'previous'))}</button><button type="button" class="${complete ? 'secondary-btn' : 'primary-btn'}" data-nh7-toggle-complete>${complete ? esc(t(ctx, 'undoDay')) : esc(t(ctx, 'completeDay'))}</button><button type="button" class="secondary-btn" data-nh7-next-day ${selected >= total ? 'disabled' : ''}>${esc(t(ctx, 'next'))} ›</button></div>
      ${state.completedAt ? `<div class="nh7-plan-finished">✓ <strong>${esc(t(ctx, 'planComplete'))}</strong><span>${esc(formatDate(ctx, state.completedAt))}</span></div>` : ''}
    </section>`;
  bindDetailEvents(ctx, plan, { ...params, day:selected });
}

function bindDetailEvents(ctx, plan, params) {
  bindPlansTabsV240(ctx);
  document.querySelector('[data-nh7-back-plans]')?.addEventListener('click', () => ctx.navigate('plans', { tab:'spiritual' }, true));
  document.querySelector('[data-nh7-start-plan]')?.addEventListener('click', () => ctx.navigate('plans', { tab:'spiritual', plan:plan.id, day:1, start:1 }, true));
  document.querySelectorAll('[data-nh7-plan-day]').forEach(button => button.addEventListener('click', () => ctx.navigate('plans', { ...params, tab:'spiritual', plan:plan.id, day:Number(button.dataset.nh7PlanDay), start:1 }, true)));
  document.querySelector('[data-nh7-prev-day]')?.addEventListener('click', () => ctx.navigate('plans', { ...params, day:Math.max(1, Number(params.day) - 1) }, true));
  document.querySelector('[data-nh7-next-day]')?.addEventListener('click', () => ctx.navigate('plans', { ...params, day:Math.min(Number(plan.durationDays), Number(params.day) + 1), start:1 }, true));
  document.querySelector('[data-nh7-open-fasting]')?.addEventListener('click', () => ctx.navigate('plans', { tab:'fasting' }, true));
  document.querySelector('[data-nh7-save-note]')?.addEventListener('click', async event => {
    const note = document.querySelector('#nh7PlanNote')?.value || '';
    await updateDay(ctx, plan, Number(params.day || 1), { note:String(note).slice(0, 4000) });
    const state = event.currentTarget.parentElement?.querySelector('.nh7-save-state');
    if (state) state.textContent = t(ctx, navigator.onLine ? 'saved' : 'queued');
  });
  document.querySelector('[data-nh7-toggle-complete]')?.addEventListener('click', async () => {
    const progress = loadProgress(ctx), state = planProgress(progress, plan.id), old = dayProgress(state, Number(params.day || 1));
    const isComplete = old?.status === 'completed';
    if (isComplete && !window.confirm(t(ctx, 'confirmUndo'))) return;
    await updateDay(ctx, plan, Number(params.day || 1), { status:isComplete ? 'in_progress' : 'completed', completedAt:isComplete ? null : nowIso() });
    if (!isComplete && typeof ctx.addPoints === 'function') ctx.addPoints(10, 'spiritual_plan_1');
    const nextDay = !isComplete && Number(params.day) < Number(plan.durationDays) ? Number(params.day) + 1 : Number(params.day);
    if (!isComplete && nextDay !== Number(params.day)) await ensurePlanStarted(ctx, plan, nextDay);
    ctx.navigate('plans', { ...params, day:nextDay, start:1 }, true);
  });
  document.querySelector('[data-nh7-save-fast-log]')?.addEventListener('click', async event => {
    const journeyId = event.currentTarget.dataset.nh7SaveFastLog;
    const fasting = loadFasting(ctx), journey = fasting.journeys.find(item => item.id === journeyId);
    if (!journey) return;
    const logDate = plusDays(journey.startDate, Number(params.day || 1) - 1);
    const key = `${journey.id}:${logDate}`;
    const completed = Boolean(document.querySelector('#nh7FastingObserved')?.checked);
    const prayerMinutes = Math.max(0, Math.min(1440, Number(document.querySelector('#nh7PrayerMinutes')?.value || 0)));
    if (completed && prayerMinutes < 1) {
      window.alert(t(ctx, 'prayerRequired'));
      document.querySelector('#nh7PrayerMinutes')?.focus();
      return;
    }
    const log = {
      ...(fasting.logs[key] || {}), journeyId:journey.id, logDate,
      completed, prayerMinutes,
      scriptureNote:String(document.querySelector('#nh7ScriptureNote')?.value || '').slice(0, 4000),
      reflection:String(document.querySelector('#nh7FastingReflection')?.value || '').slice(0, 4000), updatedAt:nowIso()
    };
    fasting.logs[key] = log;
    const completedLogs = Object.values(fasting.logs).filter(item => item.journeyId === journey.id && item.completed).length;
    if (completedLogs >= Number(plan.durationDays || 7) && journey.status === 'active') {
      journey.status = 'completed'; journey.completedAt = nowIso(); journey.updatedAt = journey.completedAt;
      await queueJourney(ctx, journey).catch(error => console.warn('Fasting journey queued locally', error));
    }
    saveFasting(ctx, fasting);
    await queueFastingLog(ctx, log).catch(error => console.warn('Fasting log queued locally', error));
    const state = event.currentTarget.parentElement?.querySelector('.nh7-save-state');
    if (state) state.textContent = t(ctx, navigator.onLine ? 'logSaved' : 'queued');
  });
}

function statusLabel(ctx, status) {
  return t(ctx, status === 'completed' ? 'statusCompleted' : status === 'cancelled' ? 'statusCancelled' : 'statusActive');
}
function nextJourneyDay(journey, fasting) {
  for (let day = 1; day <= 7; day += 1) {
    const log = fasting.logs[`${journey.id}:${plusDays(journey.startDate, day - 1)}`];
    if (!log?.completed) return day;
  }
  return 7;
}
function renderJourneyCard(ctx, journey, fasting, compact=false) {
  const day = nextJourneyDay(journey, fasting);
  return `<article class="nh7-journey-card ${esc(journey.status || 'active')}"><div><span class="nh7-plan-status ${journey.status === 'completed' ? 'complete' : journey.status === 'active' ? 'active' : ''}">${esc(statusLabel(ctx, journey.status))}</span><h3>${esc(t(ctx, `type_${journey.typeKey}`))}</h3><p>${esc(journey.purpose || '')}</p><small>${esc(formatDate(ctx, journey.startDate))} – ${esc(formatDate(ctx, journey.endDate))}</small></div>${journey.status === 'active' ? `<div class="nh7-journey-actions"><button type="button" class="primary-btn" data-nh7-continue-journey="${esc(journey.id)}" data-day="${day}">${esc(t(ctx, 'continueJourney'))}</button>${compact ? '' : `<button type="button" class="secondary-btn" data-nh7-end-journey="${esc(journey.id)}">${esc(t(ctx, 'cancelJourney'))}</button>`}</div>` : ''}</article>`;
}
async function renderFastingHub(ctx, plans) {
  const fastingPlan = plans.find(plan => plan.id === 'fasting-7');
  const guides = await loadFastingGuides(ctx);
  const meta = localMeta(fastingPlan, ctx);
  const fasting = loadFasting(ctx);
  const active = fasting.journeys.filter(journey => journey.status === 'active');
  const history = fasting.journeys.filter(journey => journey.status !== 'active');
  const start = localDateKey(), end = plusDays(start, 6);
  ctx.view.innerHTML = `${renderPlansTabsV240(ctx, 'fasting')}
    <section class="card nh7-fasting-hero"><span class="nh7-plan-icon large">🔥</span><h1>${esc(t(ctx, 'fastingTitle'))}</h1><p>${esc(t(ctx, 'fastingIntro'))}</p></section>
    ${active.length ? `<section class="card"><h2>${esc(t(ctx, 'activeJourneys'))}</h2><div class="nh7-journey-list">${active.map(journey => renderJourneyCard(ctx, journey, fasting)).join('')}</div></section>` : ''}
    ${renderFastingEducation(ctx, guides)}
    <section class="card nh7-fasting-form"><h2>${esc(meta.title || t(ctx, 'fastingJournal'))}</h2><div class="nh7-safety-note"><strong>⚕ ${esc(t(ctx, 'safety'))}</strong><p>${esc(meta.safety || '')}</p></div>
      <form id="nh7FastingJourneyForm">
        <label>${esc(t(ctx, 'fastingType'))}<select id="nh7FastingType" required><option value="">—</option>${FASTING_TYPES.map(type => `<option value="${type}">${esc(t(ctx, `type_${type}`))}</option>`).join('')}</select></label>
        <label>${esc(t(ctx, 'purpose'))}<textarea id="nh7FastingPurpose" maxlength="1000" rows="3" required></textarea></label>
        <div class="nh7-form-grid"><label>${esc(t(ctx, 'startDate'))}<input id="nh7FastingStart" type="date" value="${start}" required></label><label>${esc(t(ctx, 'endDate'))}<input id="nh7FastingEnd" type="date" value="${end}" required></label></div>
        <label class="nh7-check-row"><input id="nh7FastingSafety" type="checkbox" required><span>${esc(t(ctx, 'safetyAck'))}</span></label>
        <button type="submit" class="primary-btn wide-btn">${esc(t(ctx, 'startJourney'))}</button>
      </form>
    </section>
    <section class="card"><h2>${esc(t(ctx, 'fastingHistory'))}</h2>${history.length ? `<div class="nh7-journey-list">${history.map(journey => renderJourneyCard(ctx, journey, fasting, true)).join('')}</div>` : `<p class="muted">${esc(t(ctx, 'noJourneys'))}</p>`}</section>
    ${syncBanner(ctx)}`;
  bindPlansTabsV240(ctx);
  document.querySelector('#nh7FastingStart')?.addEventListener('change', event => {
    const endInput = document.querySelector('#nh7FastingEnd');
    if (endInput && event.currentTarget.value) endInput.value = plusDays(event.currentTarget.value, 6);
  });
  document.querySelector('#nh7FastingJourneyForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const typeKey = document.querySelector('#nh7FastingType')?.value || '';
    const purpose = document.querySelector('#nh7FastingPurpose')?.value.trim() || '';
    const startDate = document.querySelector('#nh7FastingStart')?.value || '';
    const endDate = document.querySelector('#nh7FastingEnd')?.value || '';
    const safety = document.querySelector('#nh7FastingSafety')?.checked;
    if (!typeKey || !purpose || !startDate || !endDate || !safety) { window.alert(t(ctx, 'required')); return; }
    if (endDate < startDate) { window.alert(t(ctx, 'invalidDates')); return; }
    const timestampValue = nowIso();
    const journey = {
      id:globalThis.crypto?.randomUUID?.() || `fast-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      typeKey, purpose:String(purpose).slice(0, 1000), startDate, endDate, status:'active', completedAt:null,
      createdAt:timestampValue, updatedAt:timestampValue
    };
    const store = loadFasting(ctx); store.journeys.unshift(journey); saveFasting(ctx, store);
    await queueJourney(ctx, journey).catch(error => console.warn('Fasting journey queued locally', error));
    ctx.navigate('plans', { tab:'spiritual', plan:'fasting-7', day:1, journey:journey.id, start:1 }, true);
  });
  document.querySelectorAll('[data-nh7-continue-journey]').forEach(button => button.addEventListener('click', () => ctx.navigate('plans', { tab:'spiritual', plan:'fasting-7', day:Number(button.dataset.day || 1), journey:button.dataset.nh7ContinueJourney, start:1 }, true)));
  document.querySelectorAll('[data-nh7-end-journey]').forEach(button => button.addEventListener('click', async () => {
    const store = loadFasting(ctx), journey = store.journeys.find(item => item.id === button.dataset.nh7EndJourney);
    if (!journey) return;
    journey.status = 'cancelled'; journey.completedAt = nowIso(); journey.updatedAt = journey.completedAt; saveFasting(ctx, store);
    await queueJourney(ctx, journey).catch(error => console.warn('Fasting journey queued locally', error));
    ctx.navigate('plans', { tab:'fasting' }, true);
  }));
}

async function renderPlansHome(ctx, plans) {
  const progress = loadProgress(ctx), fasting = loadFasting(ctx), stats = summaryStats(plans, progress);
  ctx.view.innerHTML = `${renderPlansTabsV240(ctx, 'spiritual')}
    <section class="card nh7-plans-hero"><div><span class="badge">FA · EN · HR</span><h1>${esc(t(ctx, 'heroTitle'))}</h1><p>${esc(t(ctx, 'heroText'))}</p></div><span class="nh7-hero-mark" aria-hidden="true">✦</span></section>
    ${statsStrip(ctx, stats, fasting.journeys.length)}
    ${syncBanner(ctx)}
    <section class="nh7-plan-grid">${plans.map(plan => renderPlanCard(ctx, plan, progress.plans[plan.id])).join('')}</section>`;
  bindPlansTabsV240(ctx);
  document.querySelectorAll('[data-nh7-open-plan]').forEach(button => button.addEventListener('click', () => ctx.navigate('plans', { tab:'spiritual', plan:button.dataset.nh7OpenPlan, day:Number(button.dataset.day || 1), start:Number(button.dataset.start || 0) }, true)));
}

export async function renderSpiritualPlansV240(ctx, params={}) {
  try {
    await syncSpiritualPlansV240(ctx).catch(() => false);
    const plans = await loadPlans(ctx);
    if (params.tab === 'fasting') { await renderFastingHub(ctx, plans); return; }
    if (params.plan) {
      const plan = plans.find(item => item.id === params.plan);
      if (!plan) throw new Error(`Unknown spiritual plan: ${params.plan}`);
      await renderPlanDetail(ctx, plan, params);
      return;
    }
    await renderPlansHome(ctx, plans);
  } catch (error) {
    console.error('Spiritual plans render failed', error);
    ctx.view.innerHTML = `<section class="card"><h2>${esc(t(ctx, 'errorTitle'))}</h2><p>${esc(error?.message || '')}</p><button type="button" class="primary-btn" data-nh7-plans-retry>${esc(t(ctx, 'retry'))}</button></section>`;
    document.querySelector('[data-nh7-plans-retry]')?.addEventListener('click', () => ctx.navigate('plans', { tab:'spiritual' }, true));
  }
}

export async function renderSpiritualProfileSummaryV240(ctx, mount) {
  if (!mount) return;
  await syncSpiritualPlansV240(ctx, { force:true }).catch(() => false);
  const plans = await loadPlans(ctx).catch(() => []), progress = loadProgress(ctx), fasting = loadFasting(ctx);
  const stats = summaryStats(plans, progress);
  const activity = stats.activePlans || stats.completedDays || fasting.journeys.length;
  mount.innerHTML = `<section class="card nh7-profile-plans"><h2>${esc(t(ctx, 'summaryTitle'))}</h2>${activity ? `${statsStrip(ctx, stats, fasting.journeys.length)}${stats.completions.length ? `<h3>${esc(t(ctx, 'recentCompletions'))}</h3><div class="nh7-profile-history">${stats.completions.slice(0, 4).map(item => `<div><span>${esc(item.plan.icon || '✓')}</span><strong>${esc(localMeta(item.plan, ctx).title || item.plan.id)}</strong><small>${esc(formatDate(ctx, item.at))}</small></div>`).join('')}</div>` : ''}` : `<p class="muted">${esc(t(ctx, 'noActivity'))}</p>`}<button type="button" class="secondary-btn wide-btn" data-go="plans">${esc(t(ctx, 'viewPlans'))}</button></section>`;
}
