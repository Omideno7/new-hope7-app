/* New Hope 7 Admin — synchronize successful video metadata saves into UI state v3.1.6 */
(()=>{'use strict';
const VERSION='3.1.6-video-save-sync';
function ensure(){if(typeof state!=='object'||!state)return null;state.videoFinalV316=state.videoFinalV316&&typeof state.videoFinalV316==='object'?state.videoFinalV316:{videos:[],codes:[],orphans:[],loaded:false,error:''};state.videoFinalV316.videos=Array.isArray(state.videoFinalV316.videos)?state.videoFinalV316.videos:[];state.videoFinalV316.orphans=Array.isArray(state.videoFinalV316.orphans)?state.videoFinalV316.orphans:[];return state.videoFinalV316}
function rowOf(value){let row=value;for(let i=0;i<3&&Array.isArray(row)&&row.length===1;i++)row=row[0];return row&&typeof row==='object'&&!Array.isArray(row)?row:null}
if(typeof adminRpc==='function'&&!adminRpc.__nh7VideoSyncV316){const old=adminRpc;adminRpc=window.adminRpc=async function(name,args){const result=await old.apply(this,arguments);if(name==='nh7_admin_school_video_save_v260'){const row=rowOf(result),ds=ensure();if(row?.id&&ds){const idx=ds.videos.findIndex(x=>String(x.id)===String(row.id)||String(x.storage_path||'')===String(row.storage_path||''));if(idx>=0)ds.videos[idx]=row;else ds.videos.unshift(row);ds.orphans=ds.orphans.filter(x=>String(x.storage_path||'')!==String(row.storage_path||''));ds.loaded=true;ds.error=''}}return result};adminRpc.__nh7VideoSyncV316=true}
window.NH7_ADMIN_VIDEO_SAVE_SYNC_VERSION=VERSION;
})();
