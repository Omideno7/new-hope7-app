/* New Hope 7 v4.0.2 — persistent release offline data */
(()=>{'use strict';
const VERSION='4.0.2-offline-data-release';
const BUILD='2.3.9.50-offline402';
const CACHE='nh7-data-stable-v329';
const SESSION='nh7_user_session_v170';
const READY_KEY='nh7_offline_data_ready';
const originalFetch=window.fetch.bind(window);
let running=false;
const CRITICAL=[
  'data/app/opening_messages_365.json','data/church/church_config.json','data/church/about.json',
  'data/daily/daily_word_365.json','data/daily/faith_proclamations_365.json','data/daily/daily_juice_365.json',
  'data/gratitude/gratitude_plan_30_days.json','data/salvation/need_salvation.json',
  'data/school/school_content.json','data/school/foundation_exam_50_trilingual.json',
  'data/bible/plans/reading_plans_1yr_2yr.json','data/bible/groups/bible_group_01_18.json',
  'data/bible/groups/bible_group_19_39.json','data/bible/groups/bible_group_40_66.json',
  'data/spiritual-plans/catalog.json','data/spiritual-plans/prayer-30.json','data/spiritual-plans/grace-14.json',
  'data/spiritual-plans/fasting-7.json','data/spiritual-plans/fasting-types.json','data/spiritual-plans/obedience-10.json',
  'data/spiritual-plans/salvation-10.json','data/spiritual-plans/mind-renewal-days-01-07.json','data/spiritual-plans/mind-renewal-days-08-14.json',
  'data/spiritual-plans/mind-renewal-days-15-18.json','data/spiritual-plans/mind-renewal-days-19-22.json','data/spiritual-plans/mind-renewal-days-23-26.json',
  'data/spiritual-plans/mind-renewal-days-27-30.json'
];
function parse(value,fallback=null){try{return JSON.parse(value||'')??fallback}catch(_){return fallback}}
function ready(){const row=parse(localStorage.getItem(READY_KEY),{});return row?.build===BUILD&&Number(row?.saved||0)>=CRITICAL.length}
function account(){try{return String(JSON.parse(localStorage.getItem(SESSION)||'null')?.user?.email||'guest').trim().toLowerCase()}catch(_){return'guest'}}
function hash(value){let h=2166136261;for(let i=0;i<String(value).length;i++){h^=String(value).charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
function urlOf(input){try{return new URL(typeof input==='string'?input:input instanceof URL?input.href:input?.url||'',location.href)}catch(_){return null}}
function methodOf(input,init){return String(init?.method||(input instanceof Request?input.method:'GET')||'GET').toUpperCase()}
function localData(url){return url?.origin===location.origin&&(url.pathname.includes('/data/')||url.pathname.endsWith('.json'))}
function remoteCatalogue(url){return url?.hostname.endsWith('supabase.co')&&url.pathname.includes('/rest/v1/')}
function localKey(url){return new Request(url.origin+url.pathname,{method:'GET'})}
function remoteKey(url){const identity=account()+'|'+url.origin+url.pathname+'?'+url.searchParams.toString();return new Request(new URL(`__nh7_api_cache_v329__/${hash(identity)}`,location.href).href,{method:'GET'})}
async function hit(key){try{return await (await caches.open(CACHE)).match(key)}catch(_){return null}}
async function store(key,response){if(!response?.ok)return;try{await (await caches.open(CACHE)).put(key,response.clone())}catch(error){console.warn('NH7 data cache save',error)}}
async function cachedFetch(input,init,url,key){const saved=await hit(key);if(!navigator.onLine&&saved)return saved.clone();try{const response=await originalFetch(input,init);if(response?.ok)await store(key,response);else if(saved)return saved.clone();return response}catch(error){if(saved)return saved.clone();throw error}}
window.fetch=async function nh7OfflineDataFetch(input,init={}){const url=urlOf(input),method=methodOf(input,init);if(method==='GET'&&localData(url))return cachedFetch(input,init,url,localKey(url));if(method==='GET'&&remoteCatalogue(url))return cachedFetch(input,init,url,remoteKey(url));return originalFetch(input,init)};
async function fetchAndStore(path,cache){try{const url=new URL(path,location.href),response=await originalFetch(url.href,{cache:'no-store'});if(!response.ok)return 0;await cache.put(localKey(url),response.clone());return 1}catch(_){return 0}}
async function prefetch(force=false){if(running||!navigator.onLine||(!force&&ready())||!('caches'in window))return null;running=true;try{const cache=await caches.open(CACHE);let saved=0;for(let i=0;i<CRITICAL.length;i+=3){const batch=CRITICAL.slice(i,i+3);const results=await Promise.all(batch.map(path=>fetchAndStore(path,cache)));saved+=results.reduce((sum,n)=>sum+n,0)}const result={version:VERSION,build:BUILD,saved,total:CRITICAL.length,at:new Date().toISOString()};localStorage.setItem(READY_KEY,JSON.stringify(result));return result}finally{running=false}}
window.addEventListener('online',()=>{if(!ready())setTimeout(()=>prefetch(false),20000)});window.addEventListener('pageshow',()=>{if(!ready())setTimeout(()=>prefetch(false),40000)});setTimeout(()=>{if(!ready())prefetch(false)},45000);
window.NH7_OFFLINE_DATA_VERSION=VERSION;window.NH7_PREPARE_OFFLINE_DATA=()=>prefetch(true);
})();
