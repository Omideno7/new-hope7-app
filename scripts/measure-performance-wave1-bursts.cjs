/* Development-only exact-source concurrency measurements. */
const fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process'),{env,tick}=require('./verify-performance-wave1.cjs');
const base='6e312ff087220520fc89aac69c5d7e145b992cb8';
function source(ref,file){return ref?cp.execFileSync('git',['show',ref+':'+file],{encoding:'utf8',stdio:['ignore','pipe','pipe']}):fs.readFileSync(file,'utf8')}
async function measure(ref){
 const e=env();e.sign();e.response(async()=>new Response(JSON.stringify({authenticated:true,approved:true,user_email:'one@example.invalid'})));
 if(!ref)vm.runInContext(source(null,'js/nh7-performance-wave1.js'),e.ctx);
 await Promise.all(Array.from({length:20},()=>e.window.fetch('https://gpzcwffxnddhaeaogdyo.supabase.co/auth/v1/user',{headers:{Authorization:'Bearer same'}})));
 const authReads=e.calls.length;e.calls.length=0;
 vm.runInContext(source(ref,'js/nh7-access-bootstrap-v230.js'),e.ctx);await tick();e.calls.length=0;
 await Promise.all(Array.from({length:20},()=>e.window.NH7AccessV230.checkStatus(true)));const accessReads=e.calls.length;
 const q=env();q.ctx.authEmail=()=>'';let release,writes=0;q.ctx.cloudFetch=async()=>{writes++;if(writes===1)await new Promise(resolve=>release=resolve)};
 const app=source(ref,'js/app.js');vm.runInContext(app.slice(app.indexOf('function enqueueCloud('),app.indexOf('function cloudStatusText(')),q.ctx);
 const op=content=>({type:'upsert',table:'user_notes',payload:{note_key:'same',content}});
 const a=q.ctx.saveCloud(op('one'));await tick();const b=q.ctx.saveCloud(op('two'));release();await Promise.all([a,b]);
 return{identical_auth_user_burst_20:authReads,forced_access_burst_20:accessReads,concurrent_note_operations_2:writes,remaining_queue:JSON.parse(q.localStorage.getItem('nh7_cloud_queue')||'[]').length};
}
(async()=>{const result={base_sha:base,before:await measure(base),after:await measure(null),limitations:'Exact runtime source in local VM; identical requests and a deliberately concurrent queue. Not Production request volumes.'};if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2))})().catch(e=>{console.error(e);process.exitCode=1});
