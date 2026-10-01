/* New Hope 7 v5.0.2 — canonical sermon + Bible verse deep links.
   Web half only; native Universal/App Link association is completed in the store wrappers. */
(()=>{'use strict';
if(window.__NH7_DEEP_LINKS_V501__)return;window.__NH7_DEEP_LINKS_V501__=true;
const VERSION='5.0.4';
const PENDING_KEY='nh7_pending_deep_link_v501';
const AUTH_KEY='nh7_user_session_v170';
const LOGOUT_KEY='nh7_explicit_logout';
const BASE=(location.hostname==='raw.githack.com'||location.hostname==='rawcdn.githack.com')?new URL('index.html',location.href).href:'https://omideno7.github.io/new-hope7-app/';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const lang=()=>String(localStorage.getItem('nh7_lang')||document.documentElement.lang||'en').toLowerCase();
const L=(fa,en,hr)=>lang().startsWith('fa')?fa:lang().startsWith('hr')?hr:en;
function sermonUrl(id){return BASE+'?target='+encodeURIComponent('sermon:'+String(id||''))}
function verseUrl(book,chapter,verse){return BASE+'?target='+encodeURIComponent('verse:'+String(book||'').toUpperCase()+':'+(Number(chapter)||1)+':'+(Number(verse)||1))}
function parseVerseKey(value){
 const m=String(value||'').match(/^nh7_bible_state_([A-Z0-9]+)[_-](\d+)[_-](\d+)$/i);
 return m?{book:m[1].toUpperCase(),chapter:Number(m[2]),verse:Number(m[3])}:null;
}
async function sharePayload(title,text,url){
 try{
  if(navigator.share)await navigator.share({title,text,url});
  else{await navigator.clipboard.writeText(text+'\n'+url);alert(L('لینک کپی شد ✓','Link copied ✓','Poveznica je kopirana ✓'))}
 }catch(_){}
}
function sermonTitle(card){
 const id=String(card?.dataset?.sermonCard||'');
 const item=window.__sermonMap?.[id]||{};
 return String(item['title_'+(lang().startsWith('fa')?'fa':lang().startsWith('hr')?'hr':'en')]||item.title_fa||item.title_en||item.title_hr||card?.querySelector('h1,h2,h3,strong')?.textContent||'New Hope 7').trim();
}
document.addEventListener('click',e=>{
 const verseBtn=e.target.closest?.('[data-share-verse]');
 if(verseBtn){
  const verseEl=verseBtn.closest('.reader-verse'),key=verseEl?.dataset?.verseKey||verseBtn.closest('[data-verse-key]')?.dataset?.verseKey||'';
  const explicitBook=String(verseBtn.dataset.deepBook||'').toUpperCase(),explicitChapter=Number(verseBtn.dataset.deepChapter),explicitVerse=Number(verseBtn.dataset.deepVerse);
  const loc=(explicitBook&&explicitChapter>0&&explicitVerse>0)?{book:explicitBook,chapter:explicitChapter,verse:explicitVerse}:parseVerseKey(key);if(!loc)return;
  e.preventDefault();e.stopImmediatePropagation();
  const ref=String(verseBtn.dataset.shareVerse||'').trim(),verseText=String(verseBtn.dataset.shareText||'').trim(),url=verseUrl(loc.book,loc.chapter,loc.verse);
  const body=L('📖 '+ref+'\n'+verseText+'\n\nباز کردن همین آیه در New Hope 7:','📖 '+ref+'\n'+verseText+'\n\nOpen this verse in New Hope 7:','📖 '+ref+'\n'+verseText+'\n\nOtvori ovaj stih u New Hope 7:');
  sharePayload('New Hope 7 — '+ref,body,url);return;
 }
 const socialShare=e.target.closest?.('[data-nh7-social-v440] [data-share],.nh7s440 [data-share]');
 if(socialShare){
  const card=socialShare.closest('[data-sermon-card]'),id=String(card?.dataset?.sermonCard||'');
  if(!UUID.test(id))return;
  e.preventDefault();e.stopImmediatePropagation();
  const title=sermonTitle(card),url=sermonUrl(id);
  const body=L('🎧 '+title+'\n\nاین موعظه را در New Hope 7 بشنوید:','🎧 '+title+'\n\nListen to this message in New Hope 7:','🎧 '+title+'\n\nPoslušajte ovu poruku u New Hope 7:');
  sharePayload('New Hope 7 — '+title,body,url);
 }
},true);

function loggedIn(){
 try{
  if(localStorage.getItem(LOGOUT_KEY)==='1')return false;
  const s=JSON.parse(localStorage.getItem(AUTH_KEY)||'null');
  return !!s?.access_token;
 }catch(_){return false}
}
function savePending(target){
 if(!target)return false;
 try{localStorage.setItem(PENDING_KEY,JSON.stringify(Object.assign({},target,{savedAt:Date.now()})));return true}catch(_){return false}
}
function pending(){
 try{
  const v=JSON.parse(localStorage.getItem(PENDING_KEY)||'null');
  if(!v||!v.type)return null;
  if(v.savedAt&&Date.now()-Number(v.savedAt)>7*24*60*60*1000){localStorage.removeItem(PENDING_KEY);return null}
  return v;
 }catch(_){return null}
}
function clearPending(){try{localStorage.removeItem(PENDING_KEY)}catch(_){}}
function requireAuth(target){
 if(loggedIn())return false;
 savePending(target);
 let tries=0;
 const routeLogin=()=>{
  const nav=window.NH7_NAVIGATE;
  if(typeof nav==='function'){nav('account',{deepLink:1},true);return}
  if(tries++<40)setTimeout(routeLogin,100);
 };
 routeLogin();
 return true;
}

function queryTarget(){
 const u=new URL(location.href),compact=String(u.searchParams.get('target')||'');
 if(compact){
  const parts=compact.split(':');
  if(parts[0]==='sermon'){
   const id=String(parts[1]||'');if(UUID.test(id))return{type:'sermon',id};
  }
  if(parts[0]==='verse'){
   const book=String(parts[1]||'').toUpperCase(),chapter=Number(parts[2]),verse=Number(parts[3]);
   if(/^[A-Z0-9]{2,5}$/.test(book)&&chapter>0&&verse>0)return{type:'verse',book,chapter,verse};
  }
 }
 const type=String(u.searchParams.get('type')||u.searchParams.get('nh7_type')||'').toLowerCase();
 const legacySermon=u.searchParams.get('sermon');
 if(type==='sermon'||legacySermon){
  const id=String(u.searchParams.get('id')||legacySermon||'');if(UUID.test(id))return{type:'sermon',id};
 }
 if(type==='verse'){
  const book=String(u.searchParams.get('book')||'').toUpperCase(),chapter=Number(u.searchParams.get('chapter')),verse=Number(u.searchParams.get('verse'));
  if(/^[A-Z0-9]{2,5}$/.test(book)&&chapter>0&&verse>0)return{type:'verse',book,chapter,verse};
 }
 return null;
}
function highlight(el){if(!el)return;el.classList.add('nh7-deep-link-target-v501');setTimeout(()=>el.classList.remove('nh7-deep-link-target-v501'),3500)}
function addStyle(){
 if(document.getElementById('nh7DeepLinkV501Style'))return;
 const s=document.createElement('style');s.id='nh7DeepLinkV501Style';s.textContent='.nh7-deep-link-target-v501{outline:3px solid color-mix(in srgb,var(--accent,#2bbdc4) 80%,#fff)!important;outline-offset:4px!important;border-radius:14px!important;animation:nh7dl501 1s ease 2}@keyframes nh7dl501{50%{filter:brightness(1.2)}}';document.head.appendChild(s)
}
function openTarget(target,options={}){
 if(!target)return false;addStyle();
 if(!options.skipAuth&&target.type==='sermon'&&requireAuth(target))return false;
 let tries=0;
 const tick=()=>{
  const nav=window.NH7_NAVIGATE;
  if(typeof nav!=='function'){if(tries++<50)setTimeout(tick,120);return}
  if(target.type==='verse'){
   nav('bible',{section:'written',mode:'chapter',bookId:target.book,chapter:target.chapter,verse:target.verse},true);
   clearPending();setTimeout(()=>highlight(document.getElementById('v-'+target.verse)),700);return true;
  }
  if(target.type==='sermon'){
   nav('audio',{},true);
   let n=0;const find=()=>{const card=document.querySelector('[data-sermon-card="'+CSS.escape(target.id)+'"]');if(card){clearPending();card.scrollIntoView({behavior:'smooth',block:'center'});highlight(card);return}if(n++<35)setTimeout(find,180)};setTimeout(find,250);return true;
  }
 };
 tick();
}
function resumePending(){
 const target=pending();if(!target||!loggedIn())return false;
 setTimeout(()=>openTarget(target,{skipAuth:true}),80);return true;
}
const initial=queryTarget();
if(initial){if(initial.type==='sermon')savePending(initial);else clearPending();setTimeout(()=>openTarget(initial),100)}
else if(pending()&&loggedIn())setTimeout(resumePending,180);
window.NH7DeepLinksV501={VERSION,sermonUrl,verseUrl,openTarget,parseVerseKey,pending,savePending,clearPending,resumePending,loggedIn};
})();