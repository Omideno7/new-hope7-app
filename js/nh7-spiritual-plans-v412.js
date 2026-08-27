import {
  renderSpiritualPlansV240
} from './nh7-spiritual-plans-v240.js';

/* New Hope 7 — production spiritual plans bridge v4.1.2
 * Additive integration: this module takes ownership only when the user opens Plans.
 * Existing audio, School, exam, authentication, settings and Apocrypha modules remain isolated.
 */

const VERSION = '4.1.2';
const SB_URL = 'https://gpzcwffxnddhaeaogdyo.supabase.co';
const SB_KEY = 'sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const QUEUE_KEY = 'nh7_spiritual_plans_cloud_queue_v412';
const VIEW = document.querySelector('#view');
const BIBLE_GROUPS = ['01_18', '19_39', '40_66'];
const bibleCache = { meta:null, groups:new Map() };
let active = false;
let suspendedClick = false;
let rendering = false;
let currentParams = { tab:'spiritual' };
let restoreTimer = 0;

const TEXT = {
  fa:{ badge:'آزمایش Wave 1B — فقط پلن‌های روحانی؛ نسخهٔ اصلی دست‌نخورده است', plans:'پلن‌های روحانی', back:'بازگشت', loading:'در حال آماده‌سازی پلن‌ها…', verseMissing:'متن این آیه در ترجمهٔ انتخاب‌شده پیدا نشد.', cloudQueued:'تغییر روی دستگاه ذخیره شد و پس از اتصال همگام می‌شود.' },
  en:{ badge:'Wave 1B QA — spiritual plans only; production remains unchanged', plans:'Spiritual Plans', back:'Back', loading:'Preparing spiritual plans…', verseMissing:'Verse text was not found in the selected translation.', cloudQueued:'Saved on this device and queued for sync.' },
  hr:{ badge:'Wave 1B test — samo duhovni planovi; produkcija nije promijenjena', plans:'Duhovni planovi', back:'Natrag', loading:'Priprema duhovnih planova…', verseMissing:'Tekst retka nije pronađen u odabranom prijevodu.', cloudQueued:'Spremljeno na uređaju i čeka sinkronizaciju.' }
};

const BOOK_NAMES = {
  Genesis:{fa:'پیدایش',hr:'Postanak'}, Exodus:{fa:'خروج',hr:'Izlazak'}, Leviticus:{fa:'لاویان',hr:'Levitski zakonik'}, Numbers:{fa:'اعداد',hr:'Brojevi'}, Deuteronomy:{fa:'تثنیه',hr:'Ponovljeni zakon'},
  Joshua:{fa:'یوشع',hr:'Jošua'}, Judges:{fa:'داوران',hr:'Suci'}, Ruth:{fa:'روت',hr:'Ruta'}, '1 Samuel':{fa:'اول سموئیل',hr:'1. Samuelova'}, '2 Samuel':{fa:'دوم سموئیل',hr:'2. Samuelova'},
  '1 Kings':{fa:'اول پادشاهان',hr:'1. Kraljevima'}, '2 Kings':{fa:'دوم پادشاهان',hr:'2. Kraljevima'}, '1 Chronicles':{fa:'اول تواریخ',hr:'1. Ljetopisa'}, '2 Chronicles':{fa:'دوم تواریخ',hr:'2. Ljetopisa'},
  Ezra:{fa:'عزرا',hr:'Ezra'}, Nehemiah:{fa:'نحمیا',hr:'Nehemija'}, Esther:{fa:'استر',hr:'Estera'}, Job:{fa:'ایوب',hr:'Job'}, Psalm:{fa:'مزامیر',hr:'Psalmi'}, Psalms:{fa:'مزامیر',hr:'Psalmi'},
  Proverbs:{fa:'امثال',hr:'Mudre izreke'}, Ecclesiastes:{fa:'جامعه',hr:'Propovjednik'}, 'Song of Songs':{fa:'غزل غزل‌ها',hr:'Pjesma nad pjesmama'}, Isaiah:{fa:'اشعیا',hr:'Izaija'}, Jeremiah:{fa:'ارمیا',hr:'Jeremija'},
  Lamentations:{fa:'مراثی',hr:'Tužaljke'}, Ezekiel:{fa:'حزقیال',hr:'Ezekiel'}, Daniel:{fa:'دانیال',hr:'Daniel'}, Hosea:{fa:'هوشع',hr:'Hošea'}, Joel:{fa:'یوئیل',hr:'Joel'}, Amos:{fa:'عاموس',hr:'Amos'},
  Obadiah:{fa:'عوبدیا',hr:'Obadija'}, Jonah:{fa:'یونس',hr:'Jona'}, Micah:{fa:'میکاه',hr:'Mihej'}, Nahum:{fa:'ناحوم',hr:'Nahum'}, Habakkuk:{fa:'حبقوق',hr:'Habakuk'}, Zephaniah:{fa:'صفنیا',hr:'Sefanija'},
  Haggai:{fa:'حجی',hr:'Hagaj'}, Zechariah:{fa:'زکریا',hr:'Zaharija'}, Malachi:{fa:'ملاکی',hr:'Malahija'}, Matthew:{fa:'متی',hr:'Matej'}, Mark:{fa:'مرقس',hr:'Marko'}, Luke:{fa:'لوقا',hr:'Luka'},
  John:{fa:'یوحنا',hr:'Ivan'}, Acts:{fa:'اعمال رسولان',hr:'Djela apostolska'}, Romans:{fa:'رومیان',hr:'Rimljanima'}, '1 Corinthians':{fa:'اول قرنتیان',hr:'1. Korinćanima'}, '2 Corinthians':{fa:'دوم قرنتیان',hr:'2. Korinćanima'},
  Galatians:{fa:'غلاطیان',hr:'Galaćanima'}, Ephesians:{fa:'افسسیان',hr:'Efežanima'}, Philippians:{fa:'فیلیپیان',hr:'Filipljanima'}, Colossians:{fa:'کولسیان',hr:'Kološanima'},
  '1 Thessalonians':{fa:'اول تسالونیکیان',hr:'1. Solunjanima'}, '2 Thessalonians':{fa:'دوم تسالونیکیان',hr:'2. Solunjanima'}, '1 Timothy':{fa:'اول تیموتائوس',hr:'1. Timoteju'}, '2 Timothy':{fa:'دوم تیموتائوس',hr:'2. Timoteju'},
  Titus:{fa:'تیتوس',hr:'Titu'}, Philemon:{fa:'فیلیمون',hr:'Filemonu'}, Hebrews:{fa:'عبرانیان',hr:'Hebrejima'}, James:{fa:'یعقوب',hr:'Jakovljeva'}, '1 Peter':{fa:'اول پطرس',hr:'1. Petrova'}, '2 Peter':{fa:'دوم پطرس',hr:'2. Petrova'},
  '1 John':{fa:'اول یوحنا',hr:'1. Ivanova'}, '2 John':{fa:'دوم یوحنا',hr:'2. Ivanova'}, '3 John':{fa:'سوم یوحنا',hr:'3. Ivanova'}, Jude:{fa:'یهودا',hr:'Judina'}, Revelation:{fa:'مکاشفه',hr:'Otkrivenje'}
};

function lang(){
  const value = localStorage.getItem('nh7_lang') || document.documentElement.lang || 'en';
  return ['fa','en','hr'].includes(value) ? value : 'en';
}
function say(key){ return TEXT[lang()]?.[key] || TEXT.en[key] || key; }
function localNum(value){
  const text = String(value ?? '');
  return lang() === 'fa' ? text.replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]) : text;
}
function escapeHtml(value){ return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function currentSessionRecord(){
  const preferred = ['nh7_user_session_v170','nh7_auth_session','nh7_supabase_session'];
  const keys = [...preferred];
  for(let i=0;i<localStorage.length;i++){
    const key = localStorage.key(i);
    if(key && !keys.includes(key)) keys.push(key);
  }
  for(const key of keys){
    try{
      const raw = localStorage.getItem(key);
      if(!raw || raw[0] !== '{') continue;
      const parsed = JSON.parse(raw);
      const value = parsed?.currentSession || parsed?.session || parsed;
      if(value?.access_token && value?.user?.id) return { key, value };
    }catch(_){ }
  }
  return { key:'nh7_user_session_v170', value:null };
}
function jwtExpiry(token){
  try{
    const part = String(token || '').split('.')[1] || '';
    const normalized = part.replace(/-/g,'+').replace(/_/g,'/');
    const json = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length/4)*4,'=')));
    return Number(json.exp || 0) * 1000;
  }catch(_){ return 0; }
}
async function session(){
  const record = currentSessionRecord();
  let value = record.value;
  if(value?.access_token && jwtExpiry(value.access_token) > Date.now() + 90000) return value;
  if(value?.refresh_token && navigator.onLine){
    try{
      const response = await fetch(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, {
        method:'POST', cache:'no-store', headers:{ apikey:SB_KEY, 'Content-Type':'application/json' },
        body:JSON.stringify({ refresh_token:value.refresh_token })
      });
      if(response.ok){
        value = await response.json();
        localStorage.setItem(record.key, JSON.stringify(value));
        return value;
      }
    }catch(_){ }
  }
  return value || null;
}
function sessionSync(){ return currentSessionRecord().value; }
function userId(){ return String(sessionSync()?.user?.id || ''); }
function authEmail(){ return String(sessionSync()?.user?.email || localStorage.getItem('nh7_manual_email') || '').trim().toLowerCase(); }
function isLoggedIn(){ return Boolean(userId() && sessionSync()?.access_token); }

async function fetchJson(path){
  const response = await fetch(path, { cache:'no-store' });
  if(response.ok) return response.json();
  const cached = await caches.match(path, { ignoreSearch:true }).catch(() => null);
  if(cached) return cached.json();
  throw new Error(`${path} — HTTP ${response.status}`);
}
async function mergedMindRenewal(){
  const parts = await Promise.all([
    fetchJson('data/spiritual-plans/mind-renewal-days-01-07.json'),
    fetchJson('data/spiritual-plans/mind-renewal-days-08-14.json'),
    fetchJson('data/spiritual-plans/mind-renewal-days-15-18.json'),
    fetchJson('data/spiritual-plans/mind-renewal-days-19-22.json'),
    fetchJson('data/spiritual-plans/mind-renewal-days-23-26.json'),
    fetchJson('data/spiritual-plans/mind-renewal-days-27-30.json')
  ]);
  const plan = {
    id:'mind-renewal-30', version:3, durationDays:30, category:'renewal', icon:'🧠', theme:'mind', requiresJourney:false,
    foundationalScriptures:['1 Corinthians 14:33','Romans 12:2','Philippians 4:8-9','2 Corinthians 10:4-5','James 1:22-25'],
    localized:{
      fa:{ title:'تغییر طرز تفکر', subtitle:'۳۰ روز برای تازه‌شدن ذهن و ورود به نظم الهی', description:'یک مسیر عملی بر پایهٔ تعلیم نظم الهی برای هماهنگ‌کردن فکر، زبان، عادت‌ها، زمان، مال، روابط، خانواده و خدمت با کلام و هدایت روح‌القدس.', goal:'از آشفتگی ذهنی و زندگی پراکنده بیرون بیاییم و با قدم‌های روشن، پاسخگویی و قدرت روح‌القدس، نظم، صلح و ثمر پادشاهی را در زندگی آشکار کنیم.', pastoralNote:'این پلن برای شاگردسازی روزانه طراحی شده است. نظم حقیقی فقط ظاهر و کنترل انسانی نیست؛ از ارتباط با روح‌القدس، اطاعت از کلام، توبه، برنامهٔ عملی و وفاداری روزانه شکل می‌گیرد.' },
      en:{ title:'Change Your Thinking', subtitle:'30 days to renew the mind and enter divine order', description:'A practical journey through divine order, aligning thought, speech, habits, time, finances, relationships, family, and service with Scripture and the Holy Spirit’s guidance.', goal:'Leave mental confusion and scattered living, then reveal kingdom order, peace, and fruit through clear steps, accountability, and the Holy Spirit’s power.', pastoralNote:'This plan is designed for daily discipleship. True order is not outward control; it grows through fellowship with the Holy Spirit, obedience to Scripture, repentance, practical structure, and daily faithfulness.' },
      hr:{ title:'Promijeni način razmišljanja', subtitle:'30 dana obnove uma i ulaska u božanski red', description:'Praktično putovanje kroz božanski red koje usklađuje misli, govor, navike, vrijeme, financije, odnose, obitelj i služenje s Pismom i vodstvom Duha Svetoga.', goal:'Izaći iz misaone zbrke i raspršenog života te jasnim koracima, odgovornošću i snagom Duha Svetoga očitovati red, mir i plod Kraljevstva.', pastoralNote:'Ovaj je plan namijenjen svakodnevnom učeništvu. Istinski red nije vanjska kontrola; raste iz zajedništva s Duhom Svetim, poslušnosti Pismu, pokajanja, praktične strukture i svakodnevne vjernosti.' }
    },
    days:parts.flatMap(item => item.days || []).sort((a,b) => Number(a.day)-Number(b.day))
  };
  if(plan.days.length !== 30 || plan.days.some((item,index) => Number(item.day) !== index+1)) throw new Error('mind-renewal-30 integrity check failed');
  return plan;
}
async function jfetch(path){
  if(String(path).endsWith('mind-renewal-30.json')) return mergedMindRenewal();
  return fetchJson(path);
}

function queue(){
  try{ const value = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch(_){ return []; }
}
function setQueue(value){ localStorage.setItem(QUEUE_KEY, JSON.stringify(value.slice(-300))); }
async function rest(path, options={}){
  const s = await session();
  if(!s?.access_token) throw new Error('login_required');
  const response = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method:options.method || 'GET', cache:'no-store',
    headers:{ apikey:SB_KEY, Authorization:`Bearer ${s.access_token}`, 'Content-Type':'application/json', ...(options.headers || {}) },
    body:options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await response.text();
  if(!response.ok) throw new Error(text || `HTTP ${response.status}`);
  return text ? JSON.parse(text) : [];
}
async function cloudFetch(path, options={}){ return rest(path, options); }
async function performCloudOperation(operation){
  if(operation.type !== 'upsert') return false;
  const conflict = operation.conflict ? `?on_conflict=${encodeURIComponent(operation.conflict)}` : '';
  await rest(`${operation.table}${conflict}`, {
    method:'POST', body:operation.payload,
    headers:{ Prefer:'resolution=merge-duplicates,return=minimal' }
  });
  return true;
}
async function saveCloud(operation){
  if(!navigator.onLine || !isLoggedIn()){
    const items = queue(); items.push({ ...operation, queuedAt:new Date().toISOString() }); setQueue(items); return false;
  }
  try{ await performCloudOperation(operation); return true; }
  catch(error){
    console.warn('[Wave1B cloud queue]', error);
    const items = queue(); items.push({ ...operation, queuedAt:new Date().toISOString() }); setQueue(items); return false;
  }
}
async function syncCloudQueue(){
  if(!navigator.onLine || !isLoggedIn()) return false;
  const items = queue(); if(!items.length) return true;
  const remaining = [];
  for(const item of items){ try{ await performCloudOperation(item); }catch(_){ remaining.push(item); } }
  setQueue(remaining); return remaining.length === 0;
}

async function bibleMeta(){
  if(!bibleCache.meta) bibleCache.meta = await fetchJson('data/bible/plans/reading_plans_1yr_2yr.json');
  return bibleCache.meta;
}
function aliases(book){
  const list = [book?.id, book?.names?.en, book?.names?.fa, book?.names?.hr].filter(Boolean).map(String);
  const en = String(book?.names?.en || '');
  if(en === 'Psalms') list.push('Psalm','Ps');
  if(en === 'Song of Songs') list.push('Song of Solomon','Canticles');
  return [...new Set(list.map(value => value.toLowerCase()))];
}
function parseReference(reference){
  const match = String(reference || '').trim().match(/^(.+?)\s+(\d+):(\d+)(?:[-–](\d+))?/);
  if(!match) return null;
  return { name:match[1].trim().toLowerCase(), chapter:Number(match[2]), start:Number(match[3]), end:Number(match[4] || match[3]) };
}
async function resolveBook(name){
  const meta = await bibleMeta();
  return (meta.books || []).find(book => aliases(book).includes(String(name).toLowerCase())) || null;
}
async function bookVerses(book){
  const group = Number(book.order) <= 18 ? '01_18' : Number(book.order) <= 39 ? '19_39' : '40_66';
  if(!bibleCache.groups.has(group)) bibleCache.groups.set(group, await fetchJson(`data/bible/groups/bible_group_${group}.json`));
  return (bibleCache.groups.get(group)?.verses || []).filter(item => item.bookId === book.id);
}
function localizeRef(reference){
  let value = String(reference || '');
  const key = Object.keys(BOOK_NAMES).sort((a,b) => b.length-a.length).find(name => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?=\\s|:)`,'i').test(value));
  if(key && lang() !== 'en') value = value.replace(new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`,'i'), BOOK_NAMES[key]?.[lang()] || key);
  return localNum(value);
}
async function revealVerse(button){
  const box = button.nextElementSibling;
  if(!box) return;
  if(!box.classList.contains('hidden')){
    box.classList.add('hidden'); box.innerHTML=''; button.setAttribute('aria-expanded','false'); return;
  }
  box.innerHTML = `<p>${escapeHtml(say('loading'))}</p>`; box.classList.remove('hidden'); button.setAttribute('aria-expanded','true');
  try{
    const parsed = parseReference(button.dataset.revealRef);
    const book = parsed ? await resolveBook(parsed.name) : null;
    if(!book) throw new Error('book_not_found');
    const verses = (await bookVerses(book)).filter(item => Number(item.chapter) === parsed.chapter && Number(item.verse) >= parsed.start && Number(item.verse) <= parsed.end);
    if(!verses.length) throw new Error('verse_not_found');
    box.innerHTML = verses.map(item => `<div class="inline-verse-line"><b>${localNum(item.verse)}</b><span>${escapeHtml(item.text?.[lang()] || item.text?.en || '')}</span></div>`).join('');
  }catch(error){ box.innerHTML = `<p>${escapeHtml(say('verseMissing'))}</p>`; }
}

function addPoints(amount){
  const key = 'nh7_wave1b_points_v410';
  localStorage.setItem(key, String(Math.max(0, Number(localStorage.getItem(key) || 0) + Number(amount || 0))));
}
function setNav(){
  document.querySelectorAll('.bottom-nav [data-route]').forEach(button => button.classList.toggle('active', button.dataset.route === 'plans'));
  const crumb = document.querySelector('#breadcrumb'); if(crumb) crumb.textContent = say('plans');
  const back = document.querySelector('#backBtn'); if(back){ back.classList.remove('hidden'); back.setAttribute('aria-label',say('back')); }
}
function banner(){}
function context(){
  return {
    view:VIEW,
    getLang:lang,
    navigate,
    localNum,
    localizeRef,
    jfetch,
    addPoints,
    isLoggedIn,
    userId,
    authEmail,
    cloudFetch,
    saveCloud,
    syncCloudQueue
  };
}
async function renderPlans(params={tab:'spiritual'}){
  if(!VIEW || rendering) return;
  active = true; rendering = true; currentParams = { ...params };
  setNav(); VIEW.innerHTML = `<section class="card"><p>${escapeHtml(say('loading'))}</p></section>`;
  try{
    await renderSpiritualPlansV240(context(), currentParams);
    VIEW.dataset.spiritualPlans = VERSION;
  }catch(error){
    console.error('[Wave1B plans]', error);
    VIEW.innerHTML = `<section class="card"><h2>${escapeHtml(say('plans'))}</h2><p>${escapeHtml(error?.message || String(error))}</p></section>`;
  }finally{ rendering=false; }
}
function leaveTo(route){
  active=false; currentParams={tab:'spiritual'}; suspendedClick=true;
  const button = document.querySelector(`.bottom-nav [data-route="${route}"]`);
  if(button) button.click();
  setTimeout(() => { suspendedClick=false; }, 0);
}
function openLegacyBiblePlans(){ leaveTo('plans'); }
function navigate(route, params={}){
  if(route !== 'plans'){ leaveTo(route); return; }
  if(params?.tab === 'bible'){ openLegacyBiblePlans(); return; }
  renderPlans(params);
}
function handleBack(event){
  if(!active) return false;
  event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
  if(currentParams?.plan || currentParams?.tab === 'fasting') renderPlans({tab:'spiritual'});
  else leaveTo('home');
  return true;
}
function plansTarget(target){ return target?.closest?.('[data-route="plans"],[data-go="plans"]'); }

document.addEventListener('click', event => {
  const verse = active && event.target.closest?.('[data-reveal-ref]');
  if(verse){ event.preventDefault(); event.stopPropagation(); revealVerse(verse); return; }
  if(event.target.closest?.('#backBtn') && handleBack(event)) return;
  const leavingTarget = active && event.target.closest?.('[data-route],[data-go],#inboxBtn');
  if(leavingTarget && !plansTarget(leavingTarget)){
    active=false; currentParams={tab:'spiritual'};
    return;
  }
  const target = plansTarget(event.target);
  if(!target || suspendedClick) return;
  event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
  let params={tab:'spiritual'};
  try{ if(target.dataset.params) params={...params,...JSON.parse(target.dataset.params)}; }catch(_){ }
  renderPlans(params);
}, true);

document.querySelector('#langSelect')?.addEventListener('change', () => {
  if(active) setTimeout(() => renderPlans(currentParams), 120);
});
window.addEventListener('online', () => syncCloudQueue().catch(() => null));

new MutationObserver(() => {
  if(!active || rendering) return;
  clearTimeout(restoreTimer);
  restoreTimer = setTimeout(() => {
    if(active && !document.querySelector('#nh7Wave1BBanner')) renderPlans(currentParams);
  }, 120);
}).observe(VIEW || document.body, { childList:true, subtree:false });

const style = document.createElement('style');
style.textContent = `.nh7-scripture-reveal .inline-verse{padding:11px;border:1px solid #cce0ee;background:#fff}.nh7-scripture-reveal .inline-verse.hidden{display:none}.inline-verse-line{display:grid;grid-template-columns:28px 1fr;gap:8px;margin:5px 0;line-height:1.8}.inline-verse-line b{display:grid;place-items:center;width:24px;height:24px;border-radius:8px;background:#e8f4ff;color:#0565ad;font-size:.72rem}`;
document.head.appendChild(style);

window.NH7_SPIRITUAL_PLANS_VERSION = VERSION;
window.NH7_SPIRITUAL_PLANS = { render:renderPlans, sync:syncCloudQueue, active:() => active };

if(new URLSearchParams(location.search).get('open') === 'plans'){
  setTimeout(() => renderPlans({tab:'spiritual'}), 700);
}
