import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// Batch4 retires broad Settings cleanup. Verify CURRENT exact bytes first, then
// retain the original v572 assertions on its one exact historical controller.
const acceptedSettings=execFileSync('python3',['-c',
  'from scripts.batch4_accepted_source import verify4, prior_batch4_bytes; import sys; verify4(); sys.stdout.buffer.write(prior_batch4_bytes(sys.argv[1]))',
  'js/nh7-settings-controller-v403.js'],{encoding:'utf8',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
const read=p=>p==='js/nh7-settings-controller-v403.js'?acceptedSettings:fs.readFileSync(p,'utf8');
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};
const has=(text,needle,msg)=>must(text.includes(needle),msg||`Missing: ${needle}`);
const currentSettings=fs.readFileSync('js/nh7-settings-controller-v403.js','utf8');
for(const [name,action] of [['clearOffline','cleanup'],['prepareOffline','prepare'],['refresh','refresh']]){
  const line=currentSettings.split('\n').find(s=>s.startsWith(`async function ${name}(btn){`));
  must(line?.startsWith(`async function ${name}(btn){if(window.NH7SettingsBatch4)return window.NH7SettingsBatch4.action('${action}');`),'Current action must delegate to the verified bounded orchestrator');
  has(line,'Settings tools are unavailable.','Missing dependency must fail closed');
  must(!/clearAll|deleteDatabase|location\.reload|CLEAR_MEDIA/.test(line),'No broad/fake-success/reload fallback');
}
const boundedStorage=fs.readFileSync('js/nh7-settings-storage-batch4.js','utf8');
must(!/deleteDatabase|\.clear\(|recursive/.test(boundedStorage),'Current cleanup cannot clear whole databases/stores/native directories');
has(boundedStorage,'tx.oncomplete','Only acknowledged transactions may count removals');
// Original v572 checkpoint assertions remain unchanged below.
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
