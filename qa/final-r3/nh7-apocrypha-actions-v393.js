/* New Hope 7 Final QA R3.3 v3.9.3
 * - Restores visible Apocrypha highlight colors after the Safari inline transform.
 * - Makes the Apocrypha star a real Save / Remove toggle.
 */
(()=>{'use strict';
if(window.__NH7_APOCRYPHA_ACTIONS_V393__)return;
window.__NH7_APOCRYPHA_ACTIONS_V393__=true;

const BOOKMARK_KEY='nh7_bookmarks';
const META_KEY='nh7_saved_verse_text_v251';
const SESSION_KEY='nh7_user_session_v170';
const SUPABASE='https://gpzcwffxnddhaeaogdyo.supabase.co';
const APIKEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const COLORS=['yellow','green','blue','pink','purple'];
let runtimePromise=null,observerTimer=0;

const lang=()=>{const value=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(value)?value:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;

function bookmarks(){
  try{const rows=JSON.parse(localStorage.getItem(BOOKMARK_KEY)||'[]');return Array.isArray(rows)?rows:[]}
  catch(_){return[]}
}
function writeBookmarks(rows){
  localStorage.setItem(BOOKMARK_KEY,JSON.stringify([...new Set((rows||[]).filter(Boolean))]));
}
function metadata(){
  try{const value=JSON.parse(localStorage.getItem(META_KEY)||'{}');return value&&typeof value==='object'?value:{}}
  catch(_){return{}}
}
function writeMetadata(value){
  try{localStorage.setItem(META_KEY,JSON.stringify(value||{}))}catch(_){ }
}
function session(){
  try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){return null}
}
function isSaved(ref){return bookmarks().includes(ref)}
function buttonState(button,saved){
  if(!button)return;
  button.classList.toggle('is-saved',saved);
  button.setAttribute('aria-pressed',saved?'true':'false');
  button.textContent=(saved?'★ ':'☆ ')+(saved?L('ذخیره‌شده','Saved','Spremljeno'):L('ذخیره','Save','Spremi'));
}
function syncButtons(){
  const saved=new Set(bookmarks());
  document.querySelectorAll('[data-nh7-apo-save]').forEach(button=>buttonState(button,saved.has(String(button.dataset.nh7ApoSave||''))));
}
async function syncAccount(ref,remove=false){
  const current=session(),access=String(current?.access_token||''),email=String(current?.user?.email||'').trim().toLowerCase();
  if(!access||!email||!navigator.onLine)return;
  try{
    if(remove){
      await fetch(`${SUPABASE}/rest/v1/nh7_account_saved_verses?user_email=eq.${encodeURIComponent(email)}&ref=eq.${encodeURIComponent(ref)}`,{
        method:'DELETE',headers:{apikey:APIKEY,Authorization:'Bearer '+access},cache:'no-store'
      });
      return;
    }
    await fetch(`${SUPABASE}/rest/v1/nh7_account_saved_verses?on_conflict=user_email,ref`,{
      method:'POST',
      headers:{apikey:APIKEY,Authorization:'Bearer '+access,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({user_email:email,ref,language:lang(),updated_at:new Date().toISOString()}),
      cache:'no-store'
    });
  }catch(error){console.warn('[NH7 Apocrypha save sync 3.9.3]',error)}
}
function runtime(){
  if(!runtimePromise)runtimePromise=fetch('data/apocrypha/runtime/apocrypha-browser-19.preview.json?v=3930',{cache:'force-cache'})
    .then(response=>{if(!response.ok)throw new Error('Apocrypha runtime '+response.status);return response.json()});
  return runtimePromise;
}
function verseTexts(data,bookId,chapter,verse){
  const book=(data?.books||[]).find(row=>String(row.book_id)===String(bookId));
  const ch=(book?.chapters||[]).find(row=>Number(row.chapter)===Number(chapter));
  const item=(ch?.verses||[]).find(row=>Number(row.verse)===Number(verse));
  const texts={};
  for(const locale of ['fa','en','hr']){
    const text=String(item?.[`text_${locale}`]||item?.text?.[locale]||'').trim();
    if(text)texts[locale]=text;
  }
  return texts;
}
function saveLocal(ref,entry){
  const rows=bookmarks();if(!rows.includes(ref))rows.push(ref);writeBookmarks(rows);
  const map=metadata();map[ref]=Object.assign({},map[ref]||{},entry,{updatedAt:new Date().toISOString()});writeMetadata(map);
}
function removeLocal(ref){
  writeBookmarks(bookmarks().filter(value=>value!==ref));
  const map=metadata();delete map[ref];writeMetadata(map);
}
async function enrichMetadata(ref){
  const parts=String(ref||'').split(':');if(parts.length!==4)return;
  const [,bookId,chapter,verse]=parts;
  try{
    const data=await runtime();
    if(!isSaved(ref))return;
    const map=metadata(),old=map[ref]||{},texts=Object.assign({},old.texts||{},verseTexts(data,bookId,+chapter,+verse));
    map[ref]=Object.assign({},old,{kind:'apocrypha',bookId,chapter:+chapter,verse:+verse,texts,updatedAt:new Date().toISOString()});
    writeMetadata(map);
    window.dispatchEvent(new CustomEvent('nh7-v251-saved-verse',{detail:{ref,updated:true}}));
  }catch(error){console.warn('[NH7 Apocrypha metadata 3.9.3]',error)}
}
async function toggleSave(button){
  const ref=String(button?.dataset?.nh7ApoSave||'');
  const parts=ref.split(':');if(parts.length!==4||parts[0]!=='APO')return;
  if(isSaved(ref)){
    removeLocal(ref);buttonState(button,false);syncAccount(ref,true);
    window.dispatchEvent(new CustomEvent('nh7-v251-saved-verse',{detail:{ref,removed:true}}));
    return;
  }
  const [,bookId,chapter,verse]=parts,article=button.closest('.nh7-apo-verse');
  const displayed=String(article?.querySelector('.nh7-apo-verse-text')?.textContent||'').trim();
  const old=metadata()[ref]||{},texts=Object.assign({},old.texts||{});
  if(displayed)texts[lang()]=displayed;
  saveLocal(ref,{kind:'apocrypha',bookId,chapter:+chapter,verse:+verse,texts});
  buttonState(button,true);syncAccount(ref,false);enrichMetadata(ref);
  window.dispatchEvent(new CustomEvent('nh7-v251-saved-verse',{detail:{ref,saved:true}}));
}

function installStyle(){
  if(document.getElementById('nh7-apocrypha-actions-v393-style'))return;
  const style=document.createElement('style');style.id='nh7-apocrypha-actions-v393-style';
  style.textContent=`
  .nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-verse-main[data-nh7-inline392].nh7-hl-yellow{background:#fff2a8!important}
  .nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-verse-main[data-nh7-inline392].nh7-hl-green{background:#ccefd7!important}
  .nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-verse-main[data-nh7-inline392].nh7-hl-blue{background:#cfe8ff!important}
  .nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-verse-main[data-nh7-inline392].nh7-hl-pink{background:#ffd9e5!important}
  .nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-verse-main[data-nh7-inline392].nh7-hl-purple{background:#e8dcff!important}
  .nh7-apo-continuous-reader[data-nh7-inline392] .nh7-apo-verse-main[data-nh7-inline392][class*="nh7-hl-"]{border-radius:5px!important;padding:1px 2px!important;-webkit-box-decoration-break:clone;box-decoration-break:clone}
  `;
  document.head.appendChild(style);
}
function syncHighlightArticles(){
  document.querySelectorAll('.nh7-apo-verse').forEach(article=>{
    const main=article.querySelector('.nh7-apo-verse-main');if(!main)return;
    const colored=COLORS.some(color=>main.classList.contains('nh7-hl-'+color));
    if(colored)article.classList.add('is-highlighted');
  });
}

// Window capture runs before the legacy document-capture save handler, allowing a true toggle.
window.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-nh7-apo-save]');if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();
  toggleSave(button).catch(error=>console.warn('[NH7 Apocrypha toggle 3.9.3]',error));
},true);

document.addEventListener('click',event=>{
  const color=event.target.closest?.('[data-nh7-apo-color]');
  const clear=event.target.closest?.('[data-nh7-apo-clear]');
  if(color)setTimeout(syncHighlightArticles,0);
  if(clear)setTimeout(()=>{
    const article=clear.closest('.nh7-apo-verse'),main=article?.querySelector('.nh7-apo-verse-main');
    if(article&&main&&!COLORS.some(value=>main.classList.contains('nh7-hl-'+value)))article.classList.remove('is-highlighted');
  },0);
},false);

installStyle();
const observer=new MutationObserver(()=>{
  clearTimeout(observerTimer);observerTimer=setTimeout(()=>{syncButtons();syncHighlightArticles()},35);
});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('storage',event=>{if([BOOKMARK_KEY,META_KEY].includes(event.key))syncButtons()});
window.addEventListener('nh7-v251-saved-verse',()=>setTimeout(syncButtons,0));
setTimeout(()=>{syncButtons();syncHighlightArticles()},300);
window.NH7_APOCRYPHA_ACTIONS_VERSION='3.9.3';
})();
