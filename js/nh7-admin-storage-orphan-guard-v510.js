(()=>{
'use strict';
const VERSION='5.1.0-storage-orphan-guard';
const AUDIO_BUCKET='church-audio';
const COVER_BUCKET='nh7-sermon-covers';
const ALLOWED=[
  {bucket:AUDIO_BUCKET,prefix:'messages/sermons/'},
  {bucket:COVER_BUCKET,prefix:'sermons/'}
];
function log(...a){try{console.info('[NH7 storage guard]',...a)}catch(_){}}
function warn(...a){try{console.warn('[NH7 storage guard]',...a)}catch(_){}}
function parseStorageUrl(raw){
  try{
    const u=new URL(String(raw||''),location.href);
    if(String(typeof SUPABASE_URL!=='undefined'?SUPABASE_URL:'')&&u.origin!==new URL(SUPABASE_URL).origin)return null;
    const m=u.pathname.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/i);
    if(!m)return null;
    const bucket=decodeURIComponent(m[1]),path=decodeURIComponent(m[2]);
    if(!ALLOWED.some(x=>x.bucket===bucket&&path.startsWith(x.prefix)))return null;
    return{bucket,path,url:u.href};
  }catch(_){return null}
}
async function fetchSermonRefs(){
  if(typeof authFetch!=='function')throw new Error('authFetch unavailable');
  const rows=await authFetch('/rest/v1/sermons?select=id,audio_url,cover_url');
  return Array.isArray(rows)?rows:[];
}
async function storageRemove(bucket,path){
  if(!token||!SUPABASE_URL||!SUPABASE_KEY)throw new Error('Admin session unavailable');
  const r=await fetch(`${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}`,{
    method:'DELETE',
    headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({prefixes:[path]})
  });
  if(!r.ok)throw new Error((await r.text())||`Storage delete ${r.status}`);
  return true;
}
async function removeUrlIfUnreferenced(raw,{excludeId=''}={}){
  const info=parseStorageUrl(raw);if(!info)return false;
  const rows=await fetchSermonRefs();
  const stillUsed=rows.some(r=>String(r.id)!==String(excludeId||'')&&(String(r.audio_url||'')===String(raw||'')||String(r.cover_url||'')===String(raw||'')));
  if(stillUsed)return false;
  await storageRemove(info.bucket,info.path);
  log('removed orphan',info.bucket,info.path);
  return true;
}
async function removeManyIfUnreferenced(urls,opts){
  const unique=[...new Set((urls||[]).filter(Boolean))];
  for(const u of unique){try{await removeUrlIfUnreferenced(u,opts)}catch(e){warn('cleanup skipped',u,e?.message||e)}}
}
function installSaveGuard(){
  if(typeof saveSermon!=='function'||saveSermon.__nh7StorageGuard)return;
  const guarded=async function(){
    const uploaded=[];let dbSaved=false;let editId='';let old={};
    try{
      const data=sermonFormData();
      if(!data.title_fa){alert(tr('titleFa'));return}
      setMessage(tr('uploading'));
      editId=String(editingSermonId||'');
      if(editId)old=state.sermons.find(x=>String(x.id)===editId)||{};
      if(sermonAudioFile){data.audio_url=await storageUpload(sermonAudioFile,'messages/sermons',AUDIO_BUCKET);uploaded.push(data.audio_url)}
      if(sermonCoverFile){data.cover_url=await storageUpload(sermonCoverFile,'sermons',COVER_BUCKET);uploaded.push(data.cover_url)}
      if(editId){
        if(!data.audio_url)data.audio_url=old.audio_url||null;
        if(!data.cover_url)data.cover_url=old.cover_url||null;
        await authFetch('/rest/v1/sermons?id=eq.'+encodeURIComponent(editId),{method:'PATCH',body:JSON.stringify(data)});
      }else{
        await authFetch('/rest/v1/sermons',{method:'POST',body:JSON.stringify(data)});
      }
      dbSaved=true;
      if(editId){
        const retired=[];
        if(data.audio_url&&old.audio_url&&String(data.audio_url)!==String(old.audio_url))retired.push(old.audio_url);
        if(data.cover_url&&old.cover_url&&String(data.cover_url)!==String(old.cover_url))retired.push(old.cover_url);
        await removeManyIfUnreferenced(retired,{excludeId:editId});
      }
      editingSermonId='';clearSermonDraft();render();setMessage(tr('saved'),'success');await loadAll(true);
    }catch(e){
      if(!dbSaved)await removeManyIfUnreferenced(uploaded);
      alert(e?.message||String(e));
    }
  };
  guarded.__nh7StorageGuard=true;
  window.saveSermon=guarded;
}
function installDeleteGuard(){
  if(typeof deleteSermon!=='function'||deleteSermon.__nh7StorageGuard)return;
  const guarded=async function(id){
    if(!confirm(tr('confirmDelete')))return;
    const row=state.sermons.find(x=>String(x.id)===String(id))||{};
    try{
      await authFetch('/rest/v1/sermons?id=eq.'+encodeURIComponent(id),{method:'DELETE'});
      await removeManyIfUnreferenced([row.audio_url,row.cover_url],{excludeId:String(id)});
      await loadAll(true);
    }catch(e){alert(e?.message||String(e))}
  };
  guarded.__nh7StorageGuard=true;
  window.deleteSermon=guarded;
}
function installBulkGuard(){
  if(typeof uploadBulkSermonAudio!=='function'||uploadBulkSermonAudio.__nh7StorageGuard)return;
  const original=uploadBulkSermonAudio;
  const guarded=async function(...args){
    const captured=[];
    const originalBulkUpload=typeof nh7BulkStorageUpload==='function'?nh7BulkStorageUpload:null;
    const originalStorageUpload=typeof storageUpload==='function'?storageUpload:null;
    if(originalBulkUpload){
      window.nh7BulkStorageUpload=async function(...a){const url=await originalBulkUpload(...a);captured.push(url);return url};
    }else if(originalStorageUpload){
      window.storageUpload=async function(...a){const url=await originalStorageUpload(...a);captured.push(url);return url};
    }
    try{return await original.apply(this,args)}
    finally{
      if(originalBulkUpload)window.nh7BulkStorageUpload=originalBulkUpload;
      else if(originalStorageUpload)window.storageUpload=originalStorageUpload;
      await removeManyIfUnreferenced(captured);
    }
  };
  guarded.__nh7StorageGuard=true;
  window.uploadBulkSermonAudio=guarded;
}
function install(){
  try{installSaveGuard();installDeleteGuard();installBulkGuard();log('active',VERSION)}catch(e){warn('install failed',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0),{once:true});else setTimeout(install,0);
setTimeout(install,1200);
})();
