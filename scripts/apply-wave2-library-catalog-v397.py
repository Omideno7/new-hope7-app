from pathlib import Path
import re

# app.js — authenticated account-based catalog; remove legacy ministers code UI and prompt.
p=Path('js/app.js')
text=p.read_text(encoding='utf-8')
old="""async function loadLibraryCatalog(){
  try{const rows=await cloudFetch('nh7_library_items_v224?select=*&order=resource_type.asc,audience.asc,sort_order.asc,created_at.desc',{method:'GET',cache:'no-store'});nh7LibraryCatalog=Array.isArray(rows)?rows:[]}catch(e){console.warn('Library catalog',e);nh7LibraryCatalog=[]}
  return nh7LibraryCatalog;
}"""
new="""async function loadLibraryCatalog(){
  try{
    const bundle=await cloudRpc('nh7_library_catalog_v396',{});
    nh7LibraryCatalog=Array.isArray(bundle?.items)?bundle.items:[];
  }catch(e){console.warn('Library catalog',e);nh7LibraryCatalog=[]}
  return nh7LibraryCatalog;
}"""
if old not in text: raise SystemExit('app.js loadLibraryCatalog marker not found')
text=text.replace(old,new,1)
old="""  let code='';if(item.audience==='ministers'){
    let saved=null;try{saved=JSON.parse(sessionStorage.getItem('nh7_minister_library_code')||'null')}catch(e){}
    if(saved&&Date.now()-Number(saved.at||0)<12*60*60*1000)code=String(saved.code||'');
    if(!code)code=String(prompt(tr('enterAccessCode'),'')||'').trim();if(!code)return;
  }
"""
if old not in text: raise SystemExit('app.js minister code prompt marker not found')
text=text.replace(old,"  const code='';\n",1)
old="${nh7LibraryTab==='ministers'?`<div class=\"library-lock-note\">${tr('protectedLibrary')}<br>${tr('enterAccessCode')}</div>`:''}"
new="${nh7LibraryTab==='ministers'?`<div class=\"library-lock-note\">${tr('protectedLibrary')}</div>`:''}"
if old not in text: raise SystemExit('app.js ministers lock note marker not found')
text=text.replace(old,new,1)
text=text.replace("protectedLibrary:'Protected ministry resources',enterAccessCode:'Enter the access code provided by the church'", "protectedLibrary:'Ministers-only resources; only items enabled by the administrator for your account are shown.',enterAccessCode:''",1)
text=text.replace("protectedLibrary:'منابع محافظت‌شده خادمان',enterAccessCode:'کدی را که کلیسا در اختیار شما گذاشته وارد کنید'", "protectedLibrary:'منابع مخصوص خادمان؛ فقط مواردی که ادمین برای حساب شما فعال کرده نمایش داده می‌شوند.',enterAccessCode:''",1)
text=text.replace("protectedLibrary:'Zaštićeni materijali za služitelje',enterAccessCode:'Unesite pristupni kod koji ste dobili od crkve'", "protectedLibrary:'Materijali samo za služitelje; prikazuju se samo stavke koje je administrator omogućio za vaš račun.',enterAccessCode:''",1)
p.write_text(text,encoding='utf-8')

# Reader — same catalog RPC and account grants only; never ask user for a ministers code.
p=Path('js/nh7-book-reader-v283.js')
text=p.read_text(encoding='utf-8')
text=text.replace("const CODE_KEY='nh7_minister_library_code';\n",'',1)
pattern=r"async function loadCatalog\(force=false\)\{[\s\S]*?\n\}\nasync function ensureItem\(id\)\{[\s\S]*?\n\}\nfunction decorate\(\)\{"
replacement="""async function catalogBundle(){
  const current=await ensureSession();
  if(!current?.access_token)return null;
  const response=await fetch(`${URL}/rest/v1/rpc/nh7_library_catalog_v396`,{method:'POST',headers:await headers(),body:'{}',cache:'no-store'});
  if(!response.ok)throw new Error(await response.text());
  const data=await response.json();
  return Array.isArray(data)?data[0]:data;
}
async function loadCatalog(force=false){
  if(catalogBusy||(!force&&Date.now()-lastCatalog<15000))return;
  catalogBusy=true;
  try{
    const bundle=await catalogBundle();
    const rows=Array.isArray(bundle?.items)?bundle.items.filter(row=>row.reader_available):[];
    catalog=new Map(rows.map(row=>[String(row.id),row]));
    lastCatalog=Date.now();
  }catch(error){console.warn('[NH7 book catalog]',error)}finally{catalogBusy=false;decorate()}
}
async function ensureItem(id){
  id=String(id||'');
  if(catalog.has(id))return catalog.get(id);
  await loadCatalog(true);
  return catalog.get(id)||null;
}
function decorate(){"""
text2,n=re.subn(pattern,replacement,text,count=1)
if n!=1: raise SystemExit('reader catalog block not found')
text=text2
pattern=r"function savedMinisterCode\(\)\{[\s\S]*?\}\nasync function readerRpc"
text2,n=re.subn(pattern,'async function readerRpc',text,count=1)
if n!=1: raise SystemExit('reader saved-code block not found')
text=text2
old="""  let code=item.audience==='ministers'?savedMinisterCode():'';
  let data=await readerRpc(item,code).catch(error=>({allowed:false,code:'request_failed',message:error.message}));
  if(!data?.allowed&&item.audience==='ministers'&&['code_required','invalid_code','expired','max_uses'].includes(String(data?.code||''))){
    code=String(prompt(L('کد کتابخانه خادمان را وارد کنید:','Enter the ministers library code:','Unesite kod knjižnice:'),'')||'').trim();
    if(!code)return false;
    data=await readerRpc(item,code).catch(error=>({allowed:false,code:'request_failed',message:error.message}));
    if(data?.allowed)sessionStorage.setItem(CODE_KEY,JSON.stringify({code,at:Date.now()}));
  }
"""
if old not in text: raise SystemExit('reader openBook code flow not found')
text=text.replace(old,"  const data=await readerRpc(item,'').catch(error=>({allowed:false,code:'request_failed',message:error.message}));\n",1)
text=text.replace("  if(['code_required','invalid_code','expired','max_uses'].includes(code))return L('کد کتابخانه خادمان نامعتبر یا منقضی است.','The ministers library code is invalid or expired.','Kod knjižnice nije valjan ili je istekao.');\n",'',1)
p.write_text(text,encoding='utf-8')

# Collection hub — consume the same server bundle so counts and cards agree.
p=Path('js/nh7-library-collections-v322.js')
text=p.read_text(encoding='utf-8')
old="""  try{
    const[cRes,iRes]=await Promise.all([
      fetch(`${URL}/rest/v1/nh7_library_collections_public_v322?select=*&order=audience.asc,sort_order.asc`,{headers:headers(),cache:'no-store'}),
      fetch(`${URL}/rest/v1/nh7_library_items_v224?select=id,collection_id,audience,resource_type&resource_type=eq.library`,{headers:headers(),cache:'no-store'})
    ]);
    if(!cRes.ok)throw new Error(await cRes.text());if(!iRes.ok)throw new Error(await iRes.text());
    collections=await cRes.json();const items=await iRes.json();itemMap=new Map((Array.isArray(items)?items:[]).map(row=>[String(row.id),row]));lastLoad=Date.now();saveCache(Array.isArray(items)?items:[])
"""
new="""  try{
    const response=await fetch(`${URL}/rest/v1/rpc/nh7_library_catalog_v396`,{method:'POST',headers:headers(),body:'{}',cache:'no-store'});
    if(!response.ok)throw new Error(await response.text());
    const raw=await response.json(),bundle=Array.isArray(raw)?raw[0]:raw;
    collections=Array.isArray(bundle?.collections)?bundle.collections:[];
    const items=Array.isArray(bundle?.items)?bundle.items:[];
    itemMap=new Map(items.map(row=>[String(row.id),row]));lastLoad=Date.now();saveCache(items)
"""
if old not in text: raise SystemExit('collections load block not found')
text=text.replace(old,new,1)
p.write_text(text,encoding='utf-8')

# Force a clean Wave2 QA cache generation.
p=Path('sw-offline-v329.js')
text=p.read_text(encoding='utf-8')
text,n=re.subn(r"const VERSION='v2\.3\.9\.51-wave2-[^']+';","const VERSION='v2.3.9.51-wave2-library-catalog-v397';",text,count=1)
if n!=1: raise SystemExit('offline version marker not found')
p.write_text(text,encoding='utf-8')
