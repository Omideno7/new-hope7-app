/* New Hope 7 QA v3.6.2 — admin-only full-app preview for unpublished trilingual books */
(()=>{'use strict';
const VERSION='3.6.2-qa-books-preview';
const SUPABASE_URL='https://gpzcwffxnddhaeaogdyo.supabase.co';
const SUPABASE_KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37';
const ADMIN_TOKEN_KEY='nh7_admin_token';
const ADMIN_REFRESH_KEY='nh7_admin_refresh_token';
const USER_SESSION_KEY='nh7_user_session_v170';
const originalFetch=window.fetch.bind(window);
let listCache=null,listAt=0;
function adminToken(){return String(localStorage.getItem(ADMIN_TOKEN_KEY)||'')}
function adminRefresh(){return String(localStorage.getItem(ADMIN_REFRESH_KEY)||'')}
function parseJwt(token){try{const part=String(token||'').split('.')[1]||'';return JSON.parse(atob(part.replace(/-/g,'+').replace(/_/g,'/')))}catch(_){return{}}}
function appLang(){const x=String(localStorage.getItem('nh7_lang')||document.documentElement.lang||'en').toLowerCase();return ['fa','en','hr'].includes(x)?x:'en'}
function ensureQaSession(){
  if(localStorage.getItem(USER_SESSION_KEY))return;
  const token=adminToken();if(!token)return;
  const claims=parseJwt(token),email=String(claims.email||'').toLowerCase();
  const shadow={access_token:token,refresh_token:adminRefresh(),expires_at:Number(claims.exp||0),user:{id:claims.sub||'',email},_nh7_qa_admin_shadow:true};
  localStorage.setItem(USER_SESSION_KEY,JSON.stringify(shadow));
  localStorage.removeItem('nh7_explicit_logout');
}
async function renewAdmin(){
  const rt=adminRefresh();if(!rt)return'';
  const r=await originalFetch(SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:rt}),cache:'no-store'});
  if(!r.ok)return'';const d=await r.json();
  if(d.access_token)localStorage.setItem(ADMIN_TOKEN_KEY,d.access_token);
  if(d.refresh_token)localStorage.setItem(ADMIN_REFRESH_KEY,d.refresh_token);
  const current=JSON.parse(localStorage.getItem(USER_SESSION_KEY)||'null');
  if(current?._nh7_qa_admin_shadow&&d.access_token){const claims=parseJwt(d.access_token);current.access_token=d.access_token;current.refresh_token=d.refresh_token||rt;current.expires_at=Number(claims.exp||0);current.user={id:claims.sub||'',email:String(claims.email||'').toLowerCase()};localStorage.setItem(USER_SESSION_KEY,JSON.stringify(current))}
  return d.access_token||'';
}
async function adminRpc(bookId=null){
  let token=adminToken();if(!token)throw Object.assign(new Error('admin_login_required'),{code:'admin_login_required'});
  const call=()=>originalFetch(SUPABASE_URL+'/rest/v1/rpc/nh7_admin_books_review_v362',{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({p_book_id:bookId}),cache:'no-store'});
  let r=await call();if(r.status===401){token=await renewAdmin();if(token)r=await call()}
  const text=await r.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={message:text}}
  if(!r.ok)throw Object.assign(new Error(data.message||data.error||r.statusText),{status:r.status,code:data.code||''});
  return data;
}
function qaRow(b){return{id:b.id,title_fa:b.title_fa||'',title_en:b.title_en||'',title_hr:b.title_hr||'',description_fa:'QA preview — unpublished',description_en:'QA preview — unpublished',description_hr:'QA pregled — neobjavljeno',audience:'public',resource_type:'library',apocrypha_book:null,reader_mode:'text',reader_language:b.reader_language||'en',reader_status:'ready',reader_available:true,reader_page_count:Number(b.reader_page_count||0),is_published:false,sort_order:250}}
async function reviewList(force=false){if(!force&&listCache&&Date.now()-listAt<10000)return listCache;const d=await adminRpc(null);listCache=(Array.isArray(d?.books)?d.books:[]).map(qaRow);listAt=Date.now();return listCache}
function jsonResponse(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-NH7-QA':'books-v362'}})}
function requestInfo(input,init={}){let raw='';try{raw=typeof input==='string'?input:(input instanceof URL?input.href:input.url)}catch(_){raw=''}let url=null;try{url=new URL(raw,location.href)}catch(_){}const method=String(init?.method||(input instanceof Request?input.method:'GET')||'GET').toUpperCase();return{url,method}}
async function mergeCatalog(input,init,url){
  const qa=await reviewList();let base=[];
  try{const r=await originalFetch(input,init);if(r.ok){const j=await r.clone().json();if(Array.isArray(j))base=j}}catch(_){}
  const byId=new Map();for(const row of base)if(row?.id)byId.set(String(row.id),row);for(const row of qa)byId.set(String(row.id),Object.assign({},byId.get(String(row.id))||{},row));
  let rows=[...byId.values()];const idFilter=String(url.searchParams.get('id')||'');if(idFilter.startsWith('eq.'))rows=rows.filter(x=>String(x.id)===idFilter.slice(3));
  return jsonResponse(rows);
}
async function qaReaderResponse(body){
  const id=String(body?.p_item_id||'');if(!id)return null;
  const list=await reviewList();if(!list.some(x=>String(x.id)===id))return null;
  const d=await adminRpc(id);if(!d?.ok||!d.book)return jsonResponse({allowed:false,code:'not_found'},404);
  const b=d.book,lang=appLang(),payload=b.reader_text?.[lang]||b.reader_text?.en||b.reader_text?.fa||b.reader_text?.hr||{};
  const available=['fa','en','hr'].filter(x=>String(b.reader_text?.[x]?.text||'').trim());
  return jsonResponse({allowed:true,code:'qa_admin_preview',reader_mode:'text',reader_language:lang,reader_status:'ready',reader_page_count:Array.isArray(payload.pages)?payload.pages.length:Number(b.reader_page_count||0),reader:payload,available_languages:available,title_fa:b.title_fa,title_en:b.title_en,title_hr:b.title_hr,description_fa:'QA preview',description_en:'QA preview',description_hr:'QA preview'});
}
window.fetch=async function nh7QaBooksFetch(input,init={}){
  const {url,method}=requestInfo(input,init);if(!url||url.origin!==SUPABASE_URL)return originalFetch(input,init);
  if(!adminToken())return originalFetch(input,init);
  if(method==='GET'&&/^\/rest\/v1\/nh7_library_items_v(?:222|224|251)$/.test(url.pathname)){
    try{return await mergeCatalog(input,init,url)}catch(e){console.warn('QA catalog',e);return originalFetch(input,init)}
  }
  if(method==='POST'&&/^\/rest\/v1\/rpc\/nh7_library_reader_access_v(?:250|260|321)$/.test(url.pathname)){
    let body={};try{body=typeof init.body==='string'?JSON.parse(init.body):init.body||{}}catch(_){}
    try{const response=await qaReaderResponse(body);if(response)return response}catch(e){console.warn('QA reader',e)}
  }
  return originalFetch(input,init);
};
ensureQaSession();
window.NH7_QA_BOOKS_PREVIEW={VERSION,reviewList,adminRpc};
window.addEventListener('storage',e=>{if(e.key===ADMIN_TOKEN_KEY||e.key===ADMIN_REFRESH_KEY){ensureQaSession();listCache=null}});
console.info('NH7 QA books preview active',VERSION);
})();
