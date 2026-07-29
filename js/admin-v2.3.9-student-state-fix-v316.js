/* New Hope 7 Admin — persistent student analytics state v3.1.6 */
(()=>{'use strict';
const VERSION='3.1.6-student-state';
function ensure(){if(typeof state!=='object'||!state)return false;state.studentCleanV311=state.studentCleanV311&&typeof state.studentCleanV311==='object'?state.studentCleanV311:{};state.schoolAssignments=Array.isArray(state.schoolAssignments)?state.schoolAssignments:[];state.schoolLessons=Array.isArray(state.schoolLessons)?state.schoolLessons:[];state.schoolCourses=Array.isArray(state.schoolCourses)?state.schoolCourses:[];return true}
ensure();
try{if(typeof renderStudentModal==='function'&&!renderStudentModal.__nh7StateV316){const old=renderStudentModal;renderStudentModal=function(student){ensure();try{return old(student)}catch(error){const email=String(student?.email||'').trim().toLowerCase();console.error('Student modal v316',error);return`<div class="nh7-clean-student-backdrop" role="dialog" aria-modal="true"><div class="nh7-clean-student-profile"><header class="nh7-clean-student-head"><div><h2>${typeof h==='function'?h(student?.name||email):student?.name||email}</h2><p>${typeof h==='function'?h(email):email}</p></div><button class="nh7-clean-student-close" onclick="closeStudentDashboard()">×</button></header><main class="nh7-clean-student-body"><div class="notice">${typeof h==='function'?h(error?.message||String(error)):error?.message||String(error)}</div><button class="btn secondary" onclick="nh7LoadStudentV311('${email.replace(/'/g,'')}')">⟳ تازه‌سازی پرونده</button></main></div></div>`}};renderStudentModal.__nh7StateV316=true}}
catch(error){console.warn('Student modal state guard',error)}
try{if(typeof openStudentDashboard==='function'&&!openStudentDashboard.__nh7StateV316){const old=openStudentDashboard;openStudentDashboard=function(encoded){ensure();const email=decodeURIComponent(String(encoded||'')).trim().toLowerCase();if(email&&!state.studentCleanV311[email])state.studentCleanV311[email]={loading:true,error:''};return old(encoded)};openStudentDashboard.__nh7StateV316=true}}
catch(error){console.warn('Student open state guard',error)}
try{if(typeof nh7LoadStudentV311==='function'){const old=nh7LoadStudentV311;window.nh7LoadStudentV311=async function(email){ensure();return old(email)}}}catch(error){console.warn('Student loader state guard',error)}
try{if(typeof loadAll==='function'&&!loadAll.__nh7StudentStateV316){const old=loadAll;loadAll=window.loadAll=async function(...args){ensure();const out=await old.apply(this,args);ensure();return out};loadAll.__nh7StudentStateV316=true}}
catch(error){console.warn('Student loadAll state guard',error)}
try{if(typeof render==='function'&&!render.__nh7StudentStateV316){const old=render;render=window.render=function(...args){ensure();return old.apply(this,args)};render.__nh7StudentStateV316=true}}
catch(error){console.warn('Student render state guard',error)}
window.NH7_ADMIN_STUDENT_STATE_VERSION=VERSION;
})();
