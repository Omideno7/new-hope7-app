/* Public proof is deliberately minimal. Ignore even an unsolicited legacy/full body. */
import {rpc,calls} from './api.mjs';import {uuid} from './model.mjs';import {t,esc} from './ui.mjs';
const root=document.querySelector('#verification'),token=new URL(location.href).searchParams.get('token');
const language=['fa','en','hr'].includes(localStorage.getItem('nh7_lang'))?localStorage.getItem('nh7_lang'):'en';let serial=0,valid=false;
const word=k=>t(k,language);
document.documentElement.lang=language;document.documentElement.dir=language==='fa'?'rtl':'ltr';
function clear(){dispatchEvent(new Event('nh7-public-document-invalidated-v2'));serial++;valid=false;root.replaceChildren(Object.assign(document.createElement('p'),{textContent:word('loading')}))}
async function refresh(){clear();const ticket=serial;if(!uuid(token)){root.textContent=word('not_found');return}
 try{const response=await rpc(calls.verify,{p_token:token},'public');if(ticket!==serial)return;
 const status=['valid','revoked','expired','not_found'].includes(response?.status)?response.status:'serviceError';valid=status==='valid';
 const number=typeof response?.number==='string'?response.number.slice(0,120):'';
 root.innerHTML=`<header class="ds2-public-header"><h1>New Hope 7</h1><span class="ds2-badge ${valid?'':'revoked'}">${esc(word(status))}</span><p>${esc(number)}</p>${valid?`<p>${esc(word('confirmed'))}</p>`:''}</header><p>${esc(word('publicNotice'))}</p><button id="refresh">${esc(word('refresh'))}</button>`;root.querySelector('#refresh').onclick=refresh;
 }catch{if(ticket===serial){valid=false;root.innerHTML=`<p role="status">${esc(word('verifyError'))}</p><button id="refresh">${esc(word('refresh'))}</button>`;root.querySelector('#refresh').onclick=refresh}}
}
addEventListener('pagehide',clear);addEventListener('pageshow',e=>{if(e.persisted)refresh()});addEventListener('online',refresh);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();else refresh()});
window.NH7DocumentVerificationV2={refresh,status:()=>valid};refresh();
