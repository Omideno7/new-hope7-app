/* Local validation + owner tickets. No network, storage writes or provider activation at load. */
(function(root){'use strict';
const digits=v=>String(v??'').replace(/[۰-۹٠-٩]/g,c=>String(c.charCodeAt(0)-(c>='۰'&&c<='۹'?1776:1632)));
function phone(value){const canonical=digits(value).trim().replace(/[\s()\-]/g,'');return {ok:/^\+[1-9][0-9]{7,14}$/.test(canonical)&&!/^\+(\d)\1+$/.test(canonical),canonical};}
function human(v){const s=String(v??'').trim();return s.length<=8000&&/[\p{L}\p{N}]/u.test(s)&&!/^([^\s])\1+$/u.test(s);}
function dob(v,today=new Date().toISOString().slice(0,10)){const s=String(v||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||s.startsWith('0000-'))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s&&s<=today;}
const password=v=>typeof v==='string'&&v.length>=10&&/[A-Z]/.test(v)&&/[a-z]/.test(v)&&/[0-9]/.test(v)&&/[^A-Za-z0-9\s]/.test(v)&&! /\s/.test(v);
const copy={fa:{phone:'لطفاً شماره موبایل را همراه با کد کشور وارد کنید؛ مثال: +989121234567',password:'رمز باید حداقل ۱۰ کاراکتر، حرف بزرگ و کوچک انگلیسی، عدد و نشانه داشته باشد و بدون فاصله باشد.',human:'لطفاً متن معتبر وارد کنید.',session:'حساب تغییر کرده است؛ دوباره تلاش کنید.',captcha:'تأیید امنیتی انجام نشد یا منقضی شد. دوباره تلاش کنید.',delete:'حذف کامل حساب هنوز فعال نشده است؛ برای راهنمایی با مدیر تماس بگیرید.',failed:'عملیات تأیید نشد. دوباره تلاش کنید.'},en:{phone:'Enter your mobile number with country code; example: +989121234567',password:'Use at least 10 characters, uppercase and lowercase Latin letters, a number and a symbol, with no spaces.',human:'Enter meaningful text.',session:'The account changed; please try again.',captcha:'Security verification failed or expired. Please try again.',delete:'Full account deletion is not activated yet; contact an administrator for help.',failed:'The operation was not verified. Please try again.'},hr:{phone:'Unesite broj mobitela s pozivnim brojem države; primjer: +385912345678',password:'Upotrijebite najmanje 10 znakova, velika i mala latinična slova, broj i simbol, bez razmaka.',human:'Unesite smislen tekst.',session:'Račun se promijenio; pokušajte ponovno.',captcha:'Sigurnosna provjera nije uspjela ili je istekla. Pokušajte ponovno.',delete:'Potpuno brisanje računa još nije aktivirano; obratite se administratoru.',failed:'Radnja nije potvrđena. Pokušajte ponovno.'}};
const message=(key,lang)=>copy[lang]?.[key]||copy.en[key]||copy.en.failed;
let epoch=0;
const changed=()=>{epoch++};
if(root.addEventListener){for(const event of ['nh7-personal-before-owner-wave2','nh7-personal-owner-wave2','nh7-session-refreshed'])root.addEventListener(event,changed);root.addEventListener('storage',e=>{if(['nh7_user_session_v170','nh7_explicit_logout'].includes(e.key))changed()});}
function ticket(){return{raw:root.localStorage?.getItem('nh7_user_session_v170')||'',logout:root.localStorage?.getItem('nh7_explicit_logout')||'',epoch};}
function current(t){const n=ticket();return !!t&&n.raw===t.raw&&n.logout===t.logout&&n.epoch===t.epoch;}
function assert(t){if(!current(t))throw Object.assign(new Error('session_changed'),{code:'session_changed'});}
/* Explicit widget, bounded lifetime, no polling, fresh token for each submit. Default path loads nothing. */
let captchaBusy=false;
async function captcha(action,lang='en'){
 const config=root.NH7_TURNSTILE_WAVE65;if(config?.enabled!==true)return {};
 if(!config.siteKey||captchaBusy)throw Object.assign(new Error(message('captcha',lang)),{code:'captcha_required'});
 captchaBusy=true;
 try{return await new Promise((resolve,reject)=>{
  const box=root.document.createElement('section');box.setAttribute('data-wave65-captcha','');box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label',message('captcha',lang));box.style.cssText='position:fixed;inset:0;z-index:2147483647;background:var(--bg,#fff);padding:30px;overflow:auto';
  const status=root.document.createElement('p');status.setAttribute('role','status');status.textContent=message('captcha',lang);const host=root.document.createElement('div'),cancel=root.document.createElement('button');cancel.type='button';cancel.textContent={fa:'لغو',en:'Cancel',hr:'Odustani'}[lang]||'Cancel';box.append(status,host,cancel);root.document.body.append(box);cancel.focus();let widget=null,script=null,done=false;
  const finish=(token)=>{if(done)return;done=true;clearTimeout(timer);try{if(widget!==null)root.turnstile?.remove(widget)}catch{}box.remove();if(script&&!root.turnstile)script.remove();token?resolve({gotrue_meta_security:{captcha_token:token}}):reject(Object.assign(new Error(message('captcha',lang)),{code:'captcha_required'}));};
  const timer=setTimeout(()=>finish(''),120000);cancel.onclick=()=>finish('');
  const render=()=>{if(done)return;try{widget=root.turnstile.render(host,{sitekey:config.siteKey,action,language:lang==='fa'?'auto':lang,callback:token=>finish(token),'expired-callback':()=>finish(''),'error-callback':()=>{finish('');return true}})}catch{finish('')}};
  if(root.turnstile?.render)render();else{script=root.document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=render;script.onerror=()=>finish('');root.document.head.append(script);}
 });}finally{captchaBusy=false;}
}
const api=Object.freeze({phone,human,dob,password,message,ticket,current,assert,captcha});root.NH7SecurityWave65=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
