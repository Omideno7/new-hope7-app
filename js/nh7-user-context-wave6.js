/* Read/presentation tickets. Existing server authorization and personal sync remain authoritative. */
(()=>{'use strict';if(window.NH7UserContextWave6)return;
let epoch=0;const parse=(v,f=null)=>{try{return JSON.parse(v)??f}catch{return f}};
function identity(){const s=localStorage.getItem('nh7_explicit_logout')==='1'?null:parse(localStorage.getItem('nh7_user_session_v170'));const uid=s?.access_token?String(s.user?.id||''):'';return{uid,token:uid?String(s.access_token):'',email:uid?String(s.user?.email||'').trim().toLowerCase():'',user:uid?s.user:null,owner:uid?'uid:'+uid:'device:'+String(localStorage.getItem('nh7_device_id')||'guest'),epoch}}
const current=t=>{const n=identity();return !!t&&n.owner===t.owner&&n.token===t.token&&n.epoch===t.epoch};
const image=p=>typeof p==='string'&&/^data:image\/(?:png|jpe?g|webp);base64,/i.test(p)?p:'';
function cacheOwned(row){const i=identity();if(!row||typeof row!=='object')return false;const uid=String(row.user_id||row.userId||row.uid||row.id||'');const email=String(row.email||row.user_email||'').trim().toLowerCase();if(uid)return !!i.uid&&uid===i.uid&&(!email||email===i.email);return i.uid?false:!email&&localStorage.getItem('nh7_lf2_legacy_owner')===i.owner}
function person(){const i=identity(),m=i.user?.user_metadata||{},r=m.school_registration||{};const rows=['nh7_user_profile','nh7_school_access','nh7_meeting_access'].map(k=>parse(localStorage.getItem(k))).filter(cacheOwned);let name=m.full_name||m.name||[r.firstName,r.lastName].filter(Boolean).join(' ');if(!name)for(const row of rows){name=row.name||[row.firstName,row.lastName].filter(Boolean).join(' ');if(name)break}return{name:String(name||''),email:i.email}}
const scopedPhoto=i=>'nh7_profile_photo_wave6:'+encodeURIComponent(i.owner);
function photo(){const i=identity(),raw=localStorage.getItem(scopedPhoto(i)),owned=parse(raw);
 // A canonical record, including an explicit removal, always wins. Never resurrect it.
 if(raw!==null)return owned?.owner===i.owner?image(owned.photo):'';
 if(!i.uid)return '';
 // Fill-only local migration: exact UID-proven data images, never an unowned global key.
 const adopt=p=>{if(p&&current(i)&&localStorage.getItem(scopedPhoto(i))===null)try{setPhoto(p,i)}catch{}return p};
 for(const key of ['nh7_user_profile','nh7_school_access','nh7_meeting_access']){const row=parse(localStorage.getItem(key));if(cacheOwned(row)){const p=image(row.photo_url)||image(row.photo)||image(row.profile_photo);if(p)return adopt(p)}}
 const m=i.user?.user_metadata||{};return adopt(image(m.photo_url)||image(m.avatar_url)||'');
}
function setPhoto(value,ticket=identity()){if(!current(ticket))throw Error('session_changed');const p=value?image(value):'';if(value&&!p)throw Error('invalid_image');localStorage.setItem(scopedPhoto(ticket),JSON.stringify({owner:ticket.owner,photo:p}));// Existing unscoped image is preserved; explicit edits write only this owner.
}
function changed(){epoch++}
for(const name of ['nh7-personal-before-owner-wave2','nh7-personal-owner-wave2','nh7-session-refreshed'])addEventListener(name,changed);addEventListener('storage',e=>{if(['nh7_user_session_v170','nh7_explicit_logout'].includes(e.key))changed()});
window.NH7UserContextWave6=Object.freeze({identity,current,cacheOwned,person,photo,setPhoto});
})();
