/* New Hope 7 v4.5.5: presentation-only local date. No network or storage writes. */
(()=>{'use strict';
if(window.NH7HeaderDateV455)return;
const LOCALES={fa:'fa-IR-u-ca-persian-nu-arabext',en:'en-GB-u-ca-gregory-nu-latn',hr:'hr-HR-u-ca-gregory-nu-latn'};
let timer=0,queued=false,started=false;
function language(){let stored='';try{stored=localStorage.getItem('nh7_lang')||''}catch(_){}const value=stored||document.documentElement.lang;return Object.hasOwn(LOCALES,value)?value:'en'}
function localISO(date){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')}
function format(date=new Date(),locale=language()){
 if(!(date instanceof Date)||!Number.isFinite(date.getTime()))return null;
 if(!Object.hasOwn(LOCALES,locale))locale='en';
 const calendar=locale==='fa'?'persian':'gregory',iso=localISO(date);
 try{
  const f=new Intl.DateTimeFormat(LOCALES[locale],{calendar,numberingSystem:locale==='fa'?'arabext':'latn',weekday:'long',year:'numeric',month:'long',day:'numeric'});
  // Never label a silently substituted Gregorian calendar as Persian.
  if(f.resolvedOptions().calendar!==calendar)throw Error('Calendar unavailable');
  let text=f.format(date);
  if(locale==='fa'){
   const parts=f.formatToParts(date),part=type=>parts.find(p=>p.type===type)?.value||'';
   text=`${part('weekday')}، ${part('day')} ${part('month')} ${part('year')}`;
   text=text.replace(/[0-9]/g,n=>'۰۱۲۳۴۵۶۷۸۹'[Number(n)]);
  }
  return {text,iso,calendar,locale,fallback:false};
 }catch(_){
  // Very old engines get an explicitly labelled civil date, never a false Solar Hijri date.
  const labels={fa:'میلادی',en:'Gregorian',hr:'Gregorijanski'};
  const numeric=locale==='fa'?iso.replace(/\d/g,n=>'۰۱۲۳۴۵۶۷۸۹'[Number(n)]):iso;
  return {text:labels[locale]+' · '+numeric,iso,calendar:'gregory',locale,fallback:true};
 }
}
function nextDelay(now=new Date()){
 const midnight=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,0,100);
 // Local calendar arithmetic respects 23/25-hour DST days. An hourly ceiling
 // also rechecks a clock/timezone changed while the page remains open.
 return Math.max(100,Math.min(3600000,midnight.getTime()-now.getTime()));
}
function arm(now){clearTimeout(timer);timer=0;if(!document.hidden)timer=setTimeout(refresh,nextDelay(now))}
function refresh(){
 const now=new Date(),value=format(now),node=document.getElementById('nh7HeaderDate455');
 if(node&&value){
  if(node.textContent!==value.text)node.textContent=value.text;
  if(node.getAttribute('datetime')!==value.iso)node.setAttribute('datetime',value.iso);
  if(node.lang!==value.locale)node.lang=value.locale;
  const direction=value.locale==='fa'?'rtl':'ltr';if(node.dir!==direction)node.dir=direction;
  if(node.dataset.calendar!==value.calendar)node.dataset.calendar=value.calendar;
  const titles={fa:'تاریخ امروز بر اساس زمان دستگاه',en:'Today in your device’s local time',hr:'Današnji datum prema lokalnom vremenu uređaja'};
  if(node.title!==titles[value.locale])node.title=titles[value.locale];
  node.hidden=false;const row=node.closest('.nh7-header-date-row455');if(row)row.hidden=false;
 }
 arm(now);
}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh()})}
function start(){
 if(started)return;started=true;
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 document.addEventListener('change',event=>{if(event.target.matches?.('#langSelect,#settingsLang,[data-nh7-settings-language]'))schedule()},true);
 window.addEventListener('storage',event=>{if(event.key==='nh7_lang'||event.key===null)schedule()});
 window.addEventListener('languagechange',schedule);window.addEventListener('pageshow',schedule);window.addEventListener('focus',schedule);
 window.addEventListener('pagehide',()=>{clearTimeout(timer);timer=0});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);timer=0}else schedule()});
 refresh();
}
window.NH7HeaderDateV455={VERSION:'4.5.5',format,refresh,nextDelay};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
