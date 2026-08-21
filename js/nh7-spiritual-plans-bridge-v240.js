/* New Hope 7 v2.4.0 RC — Spiritual Plans bridge for the current production shell.
 * Keeps main 2.3.9.40 app/auth behavior intact while exposing next-release plans for QA.
 */
import {
  renderSpiritualPlansV240,
  renderSpiritualProfileSummaryV240
} from './nh7-spiritual-plans-v240.js';

const RC='2.4.0.242-spiritual-bridge';
const SUPABASE_URL='https://gpzcwffxnddhaeaogdyo.supabase.co';
const SUPABASE_KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const SESSION_KEY='nh7_user_session_v170';
const LOGOUT_KEY='nh7_explicit_logout';
let active=false,currentParams={tab:'spiritual'},bypassNativePlans=false,summaryBusy=false;
const groupCache=new Map();
let bibleMetaPromise=null,bibleBooks=[];

const view=()=>document.getElementById('view');
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'};
const localNum=value=>lang()==='fa'?String(value).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):String(value);
const jfetch=async path=>{const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error(`${path}: HTTP ${r.status}`);return r.json()};
function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}}
function loggedIn(){const s=session();return !!(s?.access_token&&localStorage.getItem(LOGOUT_KEY)!=='1')}
function userId(){return String(session()?.user?.id||'')}
function authEmail(){return String(session()?.user?.email||localStorage.getItem('nh7_manual_email')||'').trim().toLowerCase()}
function headers(extra={}){return Object.assign({apikey:SUPABASE_KEY,Authorization:'Bearer '+String(session()?.access_token||SUPABASE_KEY),'Content-Type':'application/json','Prefer':'return=representation'},extra)}
async function cloudFetch(path,options={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,Object.assign({},options,{headers:headers(options.headers||{})}));const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch(_){data=text}if(!r.ok)throw new Error(data?.message||data?.error||String(data||r.statusText));return data}
async function saveCloud(op={}){if(!loggedIn())return null;const table=String(op.table||'');if(!table)return null;const conflict=String(op.conflict||'');let url=`${table}`;if(conflict)url+=`?on_conflict=${encodeURIComponent(conflict)}`;const prefer=op.type==='upsert'?'resolution=merge-duplicates,return=representation':'return=representation';return cloudFetch(url,{method:'POST',headers:{Prefer:prefer},body:JSON.stringify(op.payload)});}
async function syncCloudQueue(){return true}
function setNav(){document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.route==='plans'));const crumb=document.getElementById('breadcrumb');if(crumb)crumb.textContent=lang()==='fa'?'پلن‌ها':lang()==='hr'?'Planovi':'Plans';}
function nativePlans(){active=false;bypassNativePlans=true;const btn=document.querySelector('.nav-item[data-route="plans"]');if(btn)btn.click();setTimeout(()=>{bypassNativePlans=false},0)}
function navigate(route,params={}){if(route==='plans'){if(params.tab==='bible'){nativePlans();return}currentParams=Object.assign({tab:'spiritual'},params||{});renderCurrent();return}active=false;const btn=document.querySelector(`.nav-item[data-route="${CSS.escape(route)}"]`);btn?.click();}

function normalize(value){return String(value||'').trim().toLowerCase().replace(/[.]/g,'').replace(/\s+/g,' ')}
function aliases(book){const a=[book.id,book.names?.en,book.names?.fa,book.names?.hr];if(book.id==='PSA')a.push('Psalm','Psalms','Ps','مزمور','مزامیر');if(book.id==='SNG')a.push('Song of Solomon','Song of Songs','Canticles');if(book.id==='JHN')a.push('Gospel of John');if(book.id==='1SA')a.push('1 Samuel','First Samuel');if(book.id==='2SA')a.push('2 Samuel','Second Samuel');if(book.id==='1KI')a.push('1 Kings','First Kings');if(book.id==='2KI')a.push('2 Kings','Second Kings');if(book.id==='1CH')a.push('1 Chronicles','First Chronicles');if(book.id==='2CH')a.push('2 Chronicles','Second Chronicles');if(book.id==='1CO')a.push('1 Corinthians','First Corinthians');if(book.id==='2CO')a.push('2 Corinthians','Second Corinthians');if(book.id==='1TH')a.push('1 Thessalonians','First Thessalonians');if(book.id==='2TH')a.push('2 Thessalonians','Second Thessalonians');if(book.id==='1TI')a.push('1 Timothy','First Timothy');if(book.id==='2TI')a.push('2 Timothy','Second Timothy');if(book.id==='1PE')a.push('1 Peter','First Peter');if(book.id==='2PE')a.push('2 Peter','Second Peter');if(book.id==='1JN')a.push('1 John','First John');if(book.id==='2JN')a.push('2 John','Second John');if(book.id==='3JN')a.push('3 John','Third John');return a.filter(Boolean).map(normalize)}
async function bibleMeta(){if(!bibleMetaPromise)bibleMetaPromise=jfetch('data/bible/plans/reading_plans_1yr_2yr.json').then(x=>{bibleBooks=x.books||[];return bibleBooks});return bibleMetaPromise}
function localizeRef(value){
  let s=String(value||'').trim();
  const m=s.match(/^(.+?)\s+(\d+):(\d+)/);
  if(m&&bibleBooks.length){const name=normalize(m[1]),book=bibleBooks.find(b=>aliases(b).includes(name));if(book){const localized=book.names?.[lang()]||book.names?.en||m[1];s=localized+s.slice(m[1].length)}}
  return lang()==='fa'?s.replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]):s;
}

const ctx={view:null,getLang:lang,navigate,localNum,localizeRef,jfetch,addPoints:()=>{},isLoggedIn:loggedIn,userId,authEmail,cloudFetch,saveCloud,syncCloudQueue};
async function renderCurrent(){const root=view();if(!root)return;active=true;ctx.view=root;setNav();try{await bibleMeta().catch(()=>[]);await renderSpiritualPlansV240(ctx,currentParams)}catch(error){console.error('RC spiritual plans render',error);root.innerHTML=`<section class="card"><h2>Spiritual Plans</h2><div class="notice">${String(error?.message||error)}</div></section>`}}

async function parseRef(ref){const m=String(ref||'').trim().match(/^(.+?)\s+(\d+):(\d+)(?:\s*[-–—]\s*(?:(\d+):)?(\d+))?/);if(!m)return null;const books=await bibleMeta(),name=normalize(m[1]),book=books.find(b=>aliases(b).includes(name));if(!book)return null;const chapter=Number(m[2]),verse=Number(m[3]),endChapter=Number(m[4]||chapter),endVerse=Number(m[5]||verse);return{book,chapter,verse,endChapter,endVerse}}
async function groupFor(order){const key=order<=18?'01_18':order<=39?'19_39':'40_66';if(!groupCache.has(key))groupCache.set(key,jfetch(`data/bible/groups/bible_group_${key}.json`));return groupCache.get(key)}
function collectVerses(group,bookId){if(Array.isArray(group?.verses))return group.verses.filter(v=>String(v.bookId||v.book_id||v.book||v.bookCode||v.book_code||'')===bookId);const b=(group?.books||[]).find(x=>x.id===bookId);if(Array.isArray(b?.verses))return b.verses;if(Array.isArray(group?.data?.[bookId]))return group.data[bookId];return[]}
function versePosition(v){return Number(v.chapter||v.c||0)*1000+Number(v.verse||v.v||0)}
function verseText(v){const text=v.text||v.t||v.translations||{};if(typeof text==='string')return text;if(text&&typeof text==='object')return String(text[lang()]||text.en||text.fa||text.hr||'');return String(v[`text_${lang()}`]||v.text_en||v.text_fa||v.text_hr||'')}
async function reveal(el){const box=el.parentElement?.querySelector('.inline-verse')||el.nextElementSibling;if(!box)return;if(!box.classList.contains('hidden')){box.classList.add('hidden');box.innerHTML='';el.setAttribute('aria-expanded','false');return}box.classList.remove('hidden');box.textContent=lang()==='fa'?'در حال دریافت آیه…':lang()==='hr'?'Učitavanje stiha…':'Loading verse…';try{const p=await parseRef(el.dataset.revealRef);if(!p)throw new Error('Reference not resolved');const group=await groupFor(Number(p.book.order));const rows=collectVerses(group,p.book.id),start=p.chapter*1000+p.verse,end=p.endChapter*1000+p.endVerse;const selected=rows.filter(v=>{const pos=versePosition(v);return pos>=start&&pos<=end}).slice(0,50);if(!selected.length)throw new Error('Verse text unavailable');box.innerHTML=`<p><strong>${localizeRef(el.dataset.revealRef)}</strong></p>${selected.map(v=>`<p class="inline-verse-line"><b>${localNum(v.verse||v.v)}</b><span>${String(verseText(v)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</span></p>`).join('')}`;el.setAttribute('aria-expanded','true')}catch(error){console.warn(error);box.textContent=lang()==='fa'?'متن آیه در این پیش‌نمایش دریافت نشد. مرجع را می‌توانید در بخش کتاب‌مقدس بررسی کنید.':lang()==='hr'?'Tekst stiha nije učitan u ovom pregledu. Referencu možete provjeriti u Bibliji.':'The verse text could not be loaded in this preview. You can check the reference in Bible.'}}

async function maybeSummary(){if(summaryBusy||!loggedIn())return;const root=view(),logout=document.getElementById('logoutAccountBtn');if(!root||!logout||document.getElementById('nh7RcPlansProfileSummary'))return;summaryBusy=true;try{const host=document.createElement('div');host.id='nh7RcPlansProfileSummary';root.appendChild(host);ctx.view=root;await renderSpiritualProfileSummaryV240(ctx,host)}catch(error){console.warn('RC plan summary',error)}finally{summaryBusy=false}}
const observer=new MutationObserver(()=>setTimeout(maybeSummary,0));observer.observe(document.documentElement,{subtree:true,childList:true});

document.addEventListener('click',event=>{const nav=event.target.closest?.('.nav-item[data-route]');if(nav){if(nav.dataset.route==='plans'&&!bypassNativePlans){event.preventDefault();event.stopImmediatePropagation();currentParams={tab:'spiritual'};renderCurrent();return}if(nav.dataset.route!=='plans')active=false}
  if(active){const ref=event.target.closest?.('[data-reveal-ref]');if(ref){event.preventDefault();event.stopImmediatePropagation();reveal(ref);return}}
},true);
document.addEventListener('change',event=>{if(event.target.id==='langSelect'&&active)setTimeout(renderCurrent,30)},true);
bibleMeta().catch(()=>[]);
window.NH7_SPIRITUAL_PLANS_BRIDGE_VERSION=RC;