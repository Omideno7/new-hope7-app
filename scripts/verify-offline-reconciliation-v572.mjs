import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};
const has=(text,needle,msg)=>must(text.includes(needle),msg||`Missing: ${needle}`);

const settings=read('js/nh7-settings-controller-v403.js');
const worker=read('sw-offline-v329.js');
const app=read('js/app.js');

has(settings,'async function reconcileOfflineSummary()','Authoritative Settings reconciliation missing');
has(settings,"await sw('OFFLINE_STATUS',6000)",'Web/PWA reconciliation must query OFFLINE_STATUS');
has(settings,'function localMediaStats()','Native/local metadata reconciliation missing');
has(settings,"document.getElementById('settingsOfflineSummary')",'Settings summary DOM refresh missing');
has(settings,'function resetDownloadButtons()','Downloaded-button reset missing');
has(settings,"await sw('CLEAR_MEDIA',5000)",'Service-worker media clear missing');
has(settings,'const stats=await reconcileOfflineSummary();','Clear must reconcile after deletion');
has(settings,"throw new Error('offline_media_residue')",'Residual media must prevent false success');
has(settings,'Core app content is kept.','Summary must distinguish core content from downloaded media');
has(settings,'e.stopImmediatePropagation()','Settings clear controller must remain authoritative over legacy app handler');

has(worker,"if(data.type==='CLEAR_MEDIA'){await clearMedia();reply({ok:true});return}",'Worker CLEAR_MEDIA contract missing');
has(worker,"if(data.type==='OFFLINE_STATUS'){reply(Object.assign({ok:true},await mediaStats()));return}",'Worker OFFLINE_STATUS contract missing');
has(worker,'async function clearMedia(){await caches.delete(MEDIA_CACHE);','Worker clear must target media cache');
has(worker,'const keep=new Set([CORE_CACHE,SHELL_CACHE,DATA_CACHE,MEDIA_CACHE,READER_CACHE])','Core/shell/data cache preservation contract changed');

// The legacy app still has its own handler; the capture-phase Settings controller intentionally wins.
has(app,"$('#clearOfflineMedia')?.addEventListener('click'",'Legacy clear binding changed; review controller interception before merge');
has(app,'async function offlineStorageSummary()','Legacy Settings summary provider missing');

// User content must never be targeted by the media clear controller.
for(const forbidden of ['nh7_sermon_note_','saved_verse','school_progress','school_assignment','auth_session']){
  must(!settings.includes(`removeItem('${forbidden}`),`Offline clear must not remove user data key ${forbidden}`);
}

console.log('Offline reconciliation v572 static verification OK');
