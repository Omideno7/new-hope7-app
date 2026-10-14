/* Pure shared notification vocabulary. Server callers must authorize every UID/ID. */
(()=>{'use strict';
 const languages=Object.freeze(['fa','en','hr']);
 const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
 const code=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v);
 const integer=(v,max)=>Number.isInteger(v)&&v>=1&&v<=max;
 const own=(p,keys)=>p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).every(k=>keys.includes(k));
 const eventPermissions=Object.freeze({registration:'registrations.view',prayer:null,qa:null,assignment:null,testimony:null}); // null = current owner-only contract
 function intent(value){
  if(!own(value,['version','route','params','recipient_uid','event_id'])||value.version!==4)return null;
  if(value.recipient_uid!==undefined&&!uuid(value.recipient_uid)||value.event_id!==undefined&&!uuid(value.event_id))return null;
  const p=value.params||{},route=value.route;let valid=false;
  if(['home','inbox','settings','meetings'].includes(route))valid=own(p,[]);
  if(route==='daily')valid=own(p,['tab','day','gday'])&&['word','faith','juice','gratitude'].includes(p.tab)&&integer(p.tab==='gratitude'?p.gday:p.day,p.tab==='gratitude'?30:365)&&!(p.tab==='gratitude'?'day' in p:'gday' in p);
  if(route==='bible')valid=own(p,['bookId','chapter','verse','mode'])&&code(p.bookId)&&integer(p.chapter,150)&&integer(p.verse,176)&&(!p.mode||p.mode==='chapter');
  if(route==='audio')valid=own(p,['item_id'])&&(!p.item_id||uuid(p.item_id));
  if(route==='school')valid=own(p,['course','lesson'])&&(!p.course||code(p.course))&&(!p.lesson||code(p.lesson));
  if(route==='plans')valid=own(p,['tab','plan','day'])&&p.tab==='spiritual'&&code(p.plan)&&integer(p.day,365);
  if(route==='admin')valid=own(p,['section','id'])&&['overview','registration','prayer','qa','assignment','testimony','messages'].includes(p.section)&&(['overview','messages'].includes(p.section)?!p.id:uuid(p.id));
  return valid?JSON.parse(JSON.stringify(value)):null;
 }
 function language(value){return languages.includes(value)?value:'en'} // documented existing fallback, never infer from email/location
 function permitted(type,access){return Object.hasOwn(eventPermissions,type)&&(access?.is_owner===true||!!eventPermissions[type]&&access?.is_admin===true&&access.permissions?.includes(eventPermissions[type]))}
 function deliveryKey(type,source,recipient,channel,revision=1,subscription='account'){
  if(!code(type)||!uuid(source)||!uuid(recipient)||!['push','inbox'].includes(channel)||!integer(revision,1000000)||!code(subscription))throw Error('invalid_delivery_identity');
  return ['nh7-v4',type,source,recipient,channel,revision,channel==='push'?subscription:'account'].join(':');
 }
 async function providerKey(key){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key))),hex=[...bytes.slice(0,16)].map(b=>b.toString(16).padStart(2,'0'));hex[6]='5'+hex[6].slice(1);hex[8]=((parseInt(hex[8],16)&63)|128).toString(16).padStart(2,'0');const h=hex.join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`}
 function eventCopy(type,preferred){
  if(!Object.hasOwn(eventPermissions,type))throw Error('unsupported_event');
  const labels={fa:{registration:'ثبت‌نام',prayer:'درخواست دعا',qa:'پرسش',assignment:'تکلیف',testimony:'شهادت'},en:{registration:'registration',prayer:'prayer request',qa:'question',assignment:'assignment',testimony:'testimony'},hr:{registration:'registracija',prayer:'molitveni zahtjev',qa:'pitanje',assignment:'zadatak',testimony:'svjedočanstvo'}},l=language(preferred);
  return {title:l==='fa'?'اعلان مدیر امید نو ۷':l==='hr'?'New Hope 7 — administracija':'New Hope 7 — Admin',body:l==='fa'?`اعلان تازه دربارهٔ ${labels[l][type]}.`:l==='hr'?`Dostupna je nova obavijest: ${labels[l][type]}.`:`An update is available for a ${labels[l][type]}.`};
 }
 function canonical(v){return JSON.stringify(v,function(k,x){if(x&&typeof x==='object'&&!Array.isArray(x))return Object.fromEntries(Object.keys(x).sort().map(key=>[key,x[key]]));return x})}
 const api=Object.freeze({canonical,languages,uuid,intent,language,permitted,deliveryKey,providerKey,eventCopy,eventPermissions});
 globalThis.NH7NotificationContractWave4=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
