import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync('js/nh7-header-date-v455.js','utf8'),checks=[];let current=Date.parse('2026-09-19T21:59:59Z'),stored='fa';
const NativeDate=Date;class ClockDate extends NativeDate{constructor(...args){super(...(args.length?args:[current]))}static now(){return current}}
const events={},timers=new Map();let id=0,writes=0;const row={hidden:true};const node={textContent:'',lang:'',dir:'',title:'',hidden:true,dataset:{},attrs:{},getAttribute(k){return this.attrs[k]},setAttribute(k,v){this.attrs[k]=v},closest(){return row}};
const doc={hidden:false,readyState:'complete',documentElement:{lang:'fa'},getElementById:k=>k==='nh7HeaderDate455'?node:null,addEventListener:(k,f)=>events['d:'+k]=f};
const window={addEventListener:(k,f)=>events['w:'+k]=f};
const sandbox={window,document:doc,Date:ClockDate,Intl,Number,Object,String,Math,Error,localStorage:{getItem:()=>stored,setItem:()=>{writes++;throw Error('Unexpected storage write')}},MutationObserver:class{constructor(f){this.f=f}observe(){}},setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id},clearTimeout:i=>timers.delete(i),queueMicrotask:fn=>fn()};
const oldTZ=process.env.TZ;process.env.TZ='Europe/Zagreb';vm.runInNewContext(source,sandbox);const api=window.NH7HeaderDateV455;
const plain=s=>s.replace(/[\u200e\u200f\u061c]/g,'');
const cases=[['2024-03-20','۱ فروردین ۱۴۰۳'],['2025-03-20','۳۰ اسفند ۱۴۰۳'],['2025-03-21','۱ فروردین ۱۴۰۴'],['2026-03-20','۲۹ اسفند ۱۴۰۴'],['2026-03-21','۱ فروردین ۱۴۰۵'],['2026-09-19','۲۸ شهریور ۱۴۰۵']];
for(const [date,expected]of cases){const out=api.format(new ClockDate(date+'T12:00:00Z'),'fa');assert.equal(out.calendar,'persian');assert(!out.fallback);assert(plain(out.text).includes(expected),JSON.stringify(out));assert(!/[0-9]/.test(out.text))}
checks.push('Six independent Persian date expectations include leap Esfand, Nowruz and September 2026');
for(const [locale,month,weekday]of [['en','September','Saturday'],['hr','rujna','subota']]){const out=api.format(new ClockDate('2026-09-19T12:00:00Z'),locale);assert(out.text.includes(month)&&out.text.includes(weekday)&&out.text.includes('2026'));assert.equal(out.calendar,'gregory');assert(!/[۰-۹]/.test(out.text))}
checks.push('English and Croatian month, weekday, Latin digits and Gregorian year verified');
assert.equal(timers.size,1);assert.equal([...timers.values()][0].delay,1100);assert(node.textContent.includes('۲۸ شهریور'));
current+=1500;[...timers.values()][0].fn();assert(node.textContent.includes('۲۹ شهریور'));assert.equal(node.attrs.datetime,'2026-09-20');assert.equal(timers.size,1);
checks.push('One scheduled callback updates the local day at midnight without reload or duplicate timers');
doc.hidden=true;events['d:visibilitychange']();assert.equal(timers.size,0);current+=86400000;doc.hidden=false;events['d:visibilitychange']();assert(node.textContent.includes('۳۰ شهریور'));assert.equal(timers.size,1);
stored='hr';doc.documentElement.lang='hr';events['w:storage']({key:'nh7_lang'});assert.equal(node.lang,'hr');assert(node.textContent.includes('2026'));assert.equal(node.dir,'ltr');
events['w:pagehide']();assert.equal(timers.size,0);events['w:pageshow']();assert.equal(timers.size,1);
checks.push('Hidden tabs stop their timer; resume, back-cache restoration and language changes refresh safely');
for(const [tz,iso]of [['America/Los_Angeles','2026-09-18'],['Pacific/Kiritimati','2026-09-19']]){process.env.TZ=tz;const out=api.format(new ClockDate('2026-09-19T00:30:00Z'),'en');assert.equal(out.iso,iso)}
checks.push('Same instant uses the device-local day, including opposite sides of UTC');
process.env.TZ='Europe/Zagreb';for(const iso of ['2026-03-28T22:59:59Z','2026-03-29T21:59:59Z','2026-10-24T21:59:59Z','2026-10-25T22:59:59Z']){const delay=api.nextDelay(new ClockDate(iso));assert.equal(delay,1100,iso)}
checks.push('Local-midnight scheduling remains correct across both daylight-saving transitions');
assert.equal(api.format(new ClockDate('invalid'),'fa'),null);
const fakeIntl={DateTimeFormat:class{resolvedOptions(){return{calendar:'gregory'}}format(){return'2026'}}};sandbox.Intl=fakeIntl;const fallback=api.format(new ClockDate('2026-09-19T10:00:00Z'),'fa');assert(fallback.fallback&&fallback.text.startsWith('میلادی'));assert.equal(fallback.calendar,'gregory');sandbox.Intl=Intl;
assert.equal(writes,0);assert(!/\bfetch\s*\(/.test(source));assert(!/localStorage\.(?:setItem|removeItem|clear)\(/.test(source));
checks.push('Unsupported calendars are not mislabelled; invalid dates, no storage writes and no network verified');
fs.mkdirSync('qa-date455',{recursive:true});fs.writeFileSync('qa-date455/unit-report.json',JSON.stringify({status:'passed',checks,storageWrites:0,networkCalls:0},null,2));
console.log(JSON.stringify({status:'passed',checks},null,2));if(oldTZ===undefined)delete process.env.TZ;else process.env.TZ=oldTZ;
